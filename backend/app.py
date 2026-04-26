from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
import numpy as np
import joblib
import logging
import os
import sys
import bcrypt
from datetime import datetime, timedelta

sys.path.insert(0, 'src')
from data_preprocessing import GeneticDataPreprocessor, create_sample_data
from model_training import GeneticDisorderClassifier
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///genetic_disorder.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'genetic-disorder-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
jwt = JWTManager(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database models
# ---------------------------------------------------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='doctor')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    predictions = db.relationship('PredictionHistory', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

class PredictionHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    patient_age = db.Column(db.String(10))
    patient_gender = db.Column(db.String(10))
    patient_ethnicity = db.Column(db.String(30))
    family_history = db.Column(db.String(10))
    symptoms = db.Column(db.Text)
    predicted_class = db.Column(db.Integer)
    predicted_disorder = db.Column(db.String(50))
    confidence = db.Column(db.Float)
    probabilities = db.Column(db.Text)
    top_features = db.Column(db.Text)

# ---------------------------------------------------------------------------
# ML globals
# ---------------------------------------------------------------------------
ml_model = None
preprocessor = None
shap_explainer = None
training_data = None
feature_names = []
feature_count = 52  # updated dynamically on training

DISORDERS = [
    'No Disorder', 'Single Gene Disorder', 'Chromosomal Disorder',
    'Multifactorial Disorder', 'Mitochondrial Disorder'
]

def initialize_model():
    global ml_model, preprocessor, shap_explainer, training_data, feature_names, feature_count
    model_path = 'models/best_model.pkl'

    if os.path.exists(model_path):
        logger.info('Loading existing model...')
        ml_model = joblib.load(model_path)
        preprocessor = GeneticDataPreprocessor()
    else:
        logger.info('Training new model...')
        if not os.path.exists('data/raw/genetic_data.csv'):
            create_sample_data()
        preprocessor = GeneticDataPreprocessor()
        X, y, features = preprocessor.preprocess_pipeline(
            'data/raw/genetic_data.csv',
            categorical_cols=['gender', 'ethnicity']
        )
        feature_names = features
        feature_count = X.shape[1]
        logger.info(f'Feature count: {feature_count}, Features: {feature_names}')
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        classifier = GeneticDisorderClassifier()
        classifier.train_all_models(X_train, y_train, X_test, y_test)
        ml_model = classifier.best_model
        classifier.save_model(ml_model, model_path)
        training_data = X_train
        logger.info('Model trained and saved!')

    # Initialize SHAP explainer
    try:
        import shap
        bg = training_data if training_data is not None else np.random.randn(100, 55)
        shap_explainer = shap.KernelExplainer(ml_model.predict_proba, bg[:50])
        logger.info('SHAP explainer initialized')
    except Exception as e:
        logger.warning(f'SHAP init skipped: {e}')
        shap_explainer = None

# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(username=username, email=email, role=data.get('role', 'doctor'))
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    })

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    })

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': ml_model is not None,
        'shap_available': shap_explainer is not None
    })

# ---------------------------------------------------------------------------
# Prediction with SHAP explainability
# ---------------------------------------------------------------------------
@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        feat_array = np.array(data.get('genetic_markers', []), dtype=float)
        patient_info = data.get('patient_info', {})

        expected = feature_count
        if len(feat_array) == 0:
            feat_array = np.random.randn(expected)
        feat_array = feat_array.flatten()
        if len(feat_array) < expected:
            feat_array = np.pad(feat_array, (0, expected - len(feat_array)))
        else:
            feat_array = feat_array[:expected]
        feat_array = feat_array.reshape(1, -1)

        prediction = int(ml_model.predict(feat_array)[0])
        probabilities = ml_model.predict_proba(feat_array)[0]

        result = {
            'predicted_class': prediction,
            'predicted_disorder': DISORDERS[prediction],
            'confidence': float(max(probabilities)),
            'probabilities': {DISORDERS[i]: float(p) for i, p in enumerate(probabilities)}
        }

        # --- SHAP feature importance ---
        f_names = feature_names if feature_names else [f'feature_{i}' for i in range(expected)]
        top_features = []
        if shap_explainer is not None:
            try:
                import shap
                shap_values = shap_explainer.shap_values(feat_array, nsamples=50)
                if isinstance(shap_values, list):
                    importance = np.abs(np.array(shap_values)).mean(axis=0).flatten()
                else:
                    importance = np.abs(shap_values).flatten()
                top_idx = np.argsort(importance)[-10:][::-1]
                top_features = [
                    {'feature': f_names[i] if i < len(f_names) else f'feature_{i}', 'importance': float(importance[i])}
                    for i in top_idx
                ]
            except Exception as e:
                logger.warning(f'SHAP explain error: {e}')
                importance = np.abs(feat_array.flatten())
                top_idx = np.argsort(importance)[-10:][::-1]
                top_features = [
                    {'feature': f_names[i] if i < len(f_names) else f'feature_{i}', 'importance': float(importance[i])}
                    for i in top_idx
                ]
        else:
            importance = np.abs(feat_array.flatten())
            top_idx = np.argsort(importance)[-10:][::-1]
            top_features = [
                {'feature': f_names[i] if i < len(f_names) else f'feature_{i}', 'importance': float(importance[i])}
                for i in top_idx
            ]

        result['top_features'] = top_features

        # --- Save to DB ---
        import json
        record = PredictionHistory(
            patient_age=str(patient_info.get('age', 'N/A')),
            patient_gender=patient_info.get('gender', 'N/A'),
            patient_ethnicity=patient_info.get('ethnicity', 'N/A'),
            family_history=patient_info.get('familyHistory', 'N/A'),
            symptoms=json.dumps(patient_info.get('symptoms', [])),
            predicted_class=prediction,
            predicted_disorder=DISORDERS[prediction],
            confidence=float(max(probabilities)),
            probabilities=json.dumps({DISORDERS[i]: float(p) for i, p in enumerate(probabilities)}),
            top_features=json.dumps(top_features)
        )

        # Attach user if authenticated
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            try:
                from flask_jwt_extended import decode_token
                token_data = decode_token(auth_header.split(' ')[1])
                record.user_id = int(token_data['sub'])
            except Exception:
                pass

        db.session.add(record)
        db.session.commit()

        return jsonify(result)

    except Exception as e:
        logger.error(f'Prediction error: {e}')
        return jsonify({'error': str(e)}), 500

# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
@app.route('/api/history', methods=['GET'])
def get_history():
    import json
    records = PredictionHistory.query.order_by(
        PredictionHistory.timestamp.desc()
    ).limit(100).all()

    history = []
    for r in records:
        history.append({
            'id': r.id,
            'timestamp': r.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'patient': {
                'age': r.patient_age,
                'gender': r.patient_gender,
                'ethnicity': r.patient_ethnicity,
                'familyHistory': r.family_history,
                'symptoms': json.loads(r.symptoms) if r.symptoms else []
            },
            'result': {
                'predicted_class': r.predicted_class,
                'predicted_disorder': r.predicted_disorder,
                'confidence': r.confidence,
                'probabilities': json.loads(r.probabilities) if r.probabilities else {},
                'top_features': json.loads(r.top_features) if r.top_features else []
            }
        })
    return jsonify(history)

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    PredictionHistory.query.delete()
    db.session.commit()
    return jsonify({'status': 'cleared'})

# ---------------------------------------------------------------------------
# Stats endpoint
# ---------------------------------------------------------------------------
@app.route('/api/stats', methods=['GET'])
def get_stats():
    total = PredictionHistory.query.count()
    users = User.query.count()
    disorders = {}
    for d in DISORDERS:
        disorders[d] = PredictionHistory.query.filter_by(predicted_disorder=d).count()
    avg_conf = db.session.query(db.func.avg(PredictionHistory.confidence)).scalar() or 0
    return jsonify({
        'total_predictions': total,
        'total_users': users,
        'disorder_distribution': disorders,
        'average_confidence': round(float(avg_conf), 4)
    })

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
with app.app_context():
    db.create_all()
    logger.info('Database tables created.')

logger.info('Starting Flask API server initialization...')
# initialize_model() will run when gunicorn loads the app module
initialize_model()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
