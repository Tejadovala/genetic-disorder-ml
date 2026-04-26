import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

class GeneticDisorderClassifier:
    def __init__(self):
        self.models = {
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
            'neural_network': MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=300, random_state=42),
        }
        self.best_model = None

    def train_all_models(self, X_train, y_train, X_test, y_test):
        results = {}
        best_acc = 0
        for name, model in self.models.items():
            print(f'Training {name}...')
            model.fit(X_train, y_train)
            acc = accuracy_score(y_test, model.predict(X_test))
            results[name] = acc
            print(f'  {name} accuracy: {acc:.4f}')
            if acc > best_acc:
                best_acc = acc
                self.best_model = model
        print(f'Best model accuracy: {best_acc:.4f}')
        return results

    def save_model(self, model, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(model, path)
        print(f'Model saved to {path}')
