import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder

class GeneticDataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()

    def preprocess_pipeline(self, csv_path, categorical_cols=None):
        df = pd.read_csv(csv_path)
        target = 'disorder_class'
        if categorical_cols:
            for col in categorical_cols:
                if col in df.columns:
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
        X = df.drop(columns=[target])
        y = df[target].values
        features = X.columns.tolist()
        X_scaled = self.scaler.fit_transform(X)
        return X_scaled, y, features


def create_sample_data():
    """
    Generate a medically-realistic genetic disorder dataset.

    Disorder Classes:
        0 = No Disorder
        1 = Single Gene Disorder      (e.g. Sickle Cell, Cystic Fibrosis)
        2 = Chromosomal Disorder       (e.g. Down Syndrome, Turner)
        3 = Multifactorial Disorder    (e.g. Diabetes, Heart Disease)
        4 = Mitochondrial Disorder     (e.g. MELAS, Leigh Syndrome)

    CSV Columns (55 features + 1 target):
        gene_0 .. gene_19   : SNP markers (allele frequency z-scores)
        BRCA1, BRCA2, TP53, CFTR, HBB, HTT, FMR1, HEXA, PKD1, DMD
                            : Known disease-associated gene expression levels
        chromo_1 .. chromo_5: Chromosomal aberration scores
        mito_complex_I .. mito_complex_IV, mtDNA_copy_number
                            : Mitochondrial function markers
        age                 : Patient age (1-85)
        gender              : M / F
        ethnicity           : Caucasian / Asian / African / Hispanic / Other
        bmi                 : Body mass index (15-45)
        blood_pressure_sys  : Systolic blood pressure
        blood_pressure_dia  : Diastolic blood pressure
        heart_rate          : Resting heart rate
        family_history      : 0 = No, 1 = Yes
        consanguinity       : 0 = No, 1 = Yes (parents related)
        maternal_age        : Mother's age at birth
        symptom_count       : Number of reported symptoms (0-9)
        disability_score    : Functional disability rating (0-10)
        disorder_class      : Target label (0-4)
    """
    import os
    np.random.seed(42)
    n = 2000  # 2000 patient records

    # ---- Decide disorder class first, then generate correlated features ----
    # Realistic prevalence: ~40% healthy, ~20% single-gene, ~15% chromosomal,
    #                       ~18% multifactorial, ~7% mitochondrial
    disorder_class = np.random.choice(
        [0, 1, 2, 3, 4], size=n, p=[0.40, 0.20, 0.15, 0.18, 0.07]
    )

    data = {}

    # --- 20 SNP markers (z-scores, slightly shifted by disorder) ---
    for i in range(20):
        base = np.random.randn(n)
        # Add subtle disorder-specific shifts
        base[disorder_class == 1] += np.random.uniform(0.3, 0.8)   # single-gene
        base[disorder_class == 2] += np.random.uniform(-0.5, 0.5)  # chromosomal
        base[disorder_class == 4] += np.random.uniform(0.2, 0.6)   # mitochondrial
        data[f'gene_{i}'] = np.round(base, 4)

    # --- 10 known disease-associated gene expression levels ---
    disease_genes = ['BRCA1', 'BRCA2', 'TP53', 'CFTR', 'HBB',
                     'HTT', 'FMR1', 'HEXA', 'PKD1', 'DMD']
    for gene in disease_genes:
        expr = np.random.lognormal(mean=2.0, sigma=0.5, size=n)
        if gene in ['CFTR', 'HBB']:  # strongly linked to single-gene disorders
            expr[disorder_class == 1] *= np.random.uniform(1.5, 3.0)
        if gene in ['BRCA1', 'BRCA2', 'TP53']:  # cancer / multifactorial
            expr[disorder_class == 3] *= np.random.uniform(1.3, 2.5)
        if gene == 'DMD':  # muscular dystrophy
            expr[disorder_class == 1] *= np.random.uniform(1.5, 2.0)
        data[gene] = np.round(expr, 3)

    # --- 5 chromosomal aberration scores ---
    for i in range(1, 6):
        score = np.abs(np.random.randn(n)) * 0.3
        score[disorder_class == 2] += np.random.uniform(1.0, 3.0)  # high for chromosomal
        data[f'chromo_{i}'] = np.round(score, 4)

    # --- 5 mitochondrial function markers ---
    for c in ['I', 'II', 'III', 'IV']:
        activity = np.random.uniform(0.6, 1.2, size=n)
        activity[disorder_class == 4] *= np.random.uniform(0.3, 0.6)  # reduced in mito disorders
        data[f'mito_complex_{c}'] = np.round(activity, 4)
    mtdna = np.random.uniform(100, 500, size=n)
    mtdna[disorder_class == 4] *= 0.4  # depleted in mitochondrial disorders
    data['mtDNA_copy_number'] = np.round(mtdna, 1)

    # --- Demographics ---
    age = np.random.randint(1, 86, size=n)
    # Chromosomal disorders diagnosed younger
    age[disorder_class == 2] = np.clip(age[disorder_class == 2] - 15, 0, 85)
    data['age'] = age

    data['gender'] = np.random.choice(['M', 'F'], size=n)
    data['ethnicity'] = np.random.choice(
        ['Caucasian', 'Asian', 'African', 'Hispanic', 'Other'],
        size=n, p=[0.35, 0.25, 0.20, 0.15, 0.05]
    )

    bmi = np.random.normal(25, 5, size=n)
    bmi[disorder_class == 3] += 4  # higher BMI for multifactorial
    data['bmi'] = np.round(np.clip(bmi, 15, 50), 1)

    bp_sys = np.random.normal(120, 15, size=n)
    bp_sys[disorder_class == 3] += 15
    data['blood_pressure_sys'] = np.round(np.clip(bp_sys, 80, 200)).astype(int)

    bp_dia = np.random.normal(78, 10, size=n)
    bp_dia[disorder_class == 3] += 10
    data['blood_pressure_dia'] = np.round(np.clip(bp_dia, 50, 130)).astype(int)

    hr = np.random.normal(72, 10, size=n)
    data['heart_rate'] = np.round(np.clip(hr, 45, 120)).astype(int)

    # --- Clinical factors ---
    family_history = np.random.choice([0, 1], size=n, p=[0.65, 0.35])
    family_history[disorder_class >= 1] = np.where(
        np.random.rand(np.sum(disorder_class >= 1)) < 0.55, 1,
        family_history[disorder_class >= 1]
    )
    data['family_history'] = family_history

    consanguinity = np.zeros(n, dtype=int)
    consanguinity[disorder_class == 1] = np.where(
        np.random.rand(np.sum(disorder_class == 1)) < 0.25, 1, 0
    )
    data['consanguinity'] = consanguinity

    maternal_age = np.random.randint(18, 45, size=n)
    maternal_age[disorder_class == 2] = np.clip(
        maternal_age[disorder_class == 2] + 8, 18, 50
    )
    data['maternal_age'] = maternal_age

    symptom_count = np.random.randint(0, 3, size=n)
    symptom_count[disorder_class >= 1] += np.random.randint(1, 5, size=np.sum(disorder_class >= 1))
    data['symptom_count'] = np.clip(symptom_count, 0, 9)

    disability_score = np.random.uniform(0, 2, size=n)
    disability_score[disorder_class == 1] += np.random.uniform(1, 4, size=np.sum(disorder_class == 1))
    disability_score[disorder_class == 2] += np.random.uniform(2, 5, size=np.sum(disorder_class == 2))
    disability_score[disorder_class == 4] += np.random.uniform(2, 6, size=np.sum(disorder_class == 4))
    data['disability_score'] = np.round(np.clip(disability_score, 0, 10), 1)

    # --- Target ---
    data['disorder_class'] = disorder_class

    # Save
    os.makedirs('data/raw', exist_ok=True)
    df = pd.DataFrame(data)
    df.to_csv('data/raw/genetic_data.csv', index=False)
    print(f'Realistic dataset created: {len(df)} records, {len(df.columns)} columns')
    print(f'Columns: {list(df.columns)}')
    print(f'Class distribution:\n{df["disorder_class"].value_counts().sort_index().to_string()}')
    return df
