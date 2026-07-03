## ML Pipeline — শুরু থেকে শেষ পর্যন্ত

বাস্তব দুনিয়ায় model train করার আগে সবচেয়ে বেশি সময় যায় data preparation-এ। পুরো pipeline এরকম:

```text
Raw Data → Clean → Feature Engineering → Split → Train → Evaluate
   ▲                                                        │
   │__________ iterate _____________________________________│
```

> [!tip] "Garbage in, garbage out"
# যতই advanced algorithm ব্যবহার করো না কেন, data খারাপ হলে model-ও খারাপ হবে। Data preparation-এ ৭০-৮০% সময় খরচ করা স্বাভাবিক।

## Missing Values হ্যান্ডল করা

ডাটায় missing value (NaN) থাকাটা common। কয়েকভাবে handle করা যায়:

```python
import pandas as pd
import numpy as np

df = pd.read_csv("data.csv")

# কোন কলামে কয়টা missing
print(df.isnull().sum())

# ধরন ১: missing row বাদ দাও (যদি কম থাকে)
df_clean = df.dropna()

# ধরন ২: mean/median দিয়ে fill করো (numerical)
df["age"] = df["age"].fillna(df["age"].median())

# ধরন ৩: mode দিয়ে fill করো (categorical)
df["city"] = df["city"].fillna(df["city"].mode()[0])

# ধরন ৪: একটা "Unknown" category বানাও
df["occupation"] = df["occupation"].fillna("Unknown")
```

> [!warn] সব NaN বাদ দিলে ডাটা শেষ হতে পারে
# `dropna()` যদি অনেক row-তে missing থাকে, তাহলে অনেক data হারিয়ে যাবে। সবসময় কত শতাংশ missing সেটা আগে দেখে নাও।

## Categorical Encoding

ML model সব কিছু number বোঝে — text category-কে number-এ convert করতে হয়:

### One-Hot Encoding

শ্রেষ্ঠ: কোনো order নেই এমন category-র জন্য (যেমন city, color):

```python
from sklearn.preprocessing import OneHotEncoder

encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
encoded = encoder.fit_transform(df[["city"]])
# "Dhaka" → [1,0,0], "Chittagong" → [0,1,0], "Rajshahi" → [0,0,1]
```

### Label Encoding

Order আছে এমন category-র জন্য (যেমন Low/Medium/High):

```python
from sklearn.preprocessing import OrdinalEncoder

encoder = OrdinalEncoder(categories=[["Low", "Medium", "High"]])
df["level_encoded"] = encoder.fit_transform(df[["level"]])
# Low→0, Medium→1, High→2
```

### Target/Mean Encoding

High cardinality feature (যেমন zip code) — category-কে সেই category-র average target দিয়ে replace করা:

```python
from sklearn.preprocessing import TargetEncoder  # sklearn 1.4+

encoder = TargetEncoder()
df["zip_encoded"] = encoder.fit_transform(df[["zip"]], df["target"])
```

> [!warn] Target encoding-এ leakage ঝুঁকি
# Target encoding naive ভাবে করলে target information train আর test উভয় জায়গায় leak করতে পারে। sklearn-র `TargetEncoder` internally cross-validation করে — তাই নিরাপদ। কিন্তু হাতে করলে সাবধান!

## Feature Scaling

Numerical feature-গুলো scale করতে হয় — কারণ অনেক algorithm (SVM, KNN, gradient descent) large value-কে বেশি importance দেয়:

| Scaler | কী করে | কখন |
|---|---|---|
| `StandardScaler` | mean=0, std=1 | সবচেয়ে common, normal-ish distribution |
| `MinMaxScaler` | 0 থেকে 1 এর মধ্যে | image pixel, bounded feature |
| `RobustScaler` | median আর IQR ব্যবহার | outlier থাকলে |

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # fit + transform
X_test_scaled = scaler.transform(X_test)        # শুধু transform!
```

> [!danger] Data Leakage — সবচেয়ে বড় ভুল
# `fit_transform` কখনো test data-তে করবে না! Scaler শুধু **train data-তে fit** হবে, তারপর সেই fitted scaler দিয়ে test data transform করবে। নাহলে test data-র তথ্য train-এ leak করবে — model ভালো মনে হবে কিন্তু production-এ ফেইল করবে।

## Train/Validation/Test Split

ডাটাকে তিন ভাগে ভাগ করতে হয়:

```text
সব Data
├── Train (৬০-৭০%)  → model train করার জন্য
├── Validation (১৫%) → hyperparameter tune করার জন্য
└── Test (১৫-২০%)    → শেষ মূল্যায়ন, একবারই
```

```python
from sklearn.model_selection import train_test_split

# প্রথমে train+val আর test আলাদা করো
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# এবার temp থেকে train আর validation আলাদা করো
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.2, random_state=42, stratify=y_temp
)
```

## sklearn Pipeline — Leakage প্রতিরোধের সেরা উপায়

Pipeline ব্যবহার করলে preprocessing আর model একসাথে bundle হয় — আর `fit` সবসময় শুধু train data-তে চলে, leakage হওয়ার সুযোগ নেই:

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

# numerical আর categorical feature আলাদা করো
numeric_features = ["age", "income", "score"]
categorical_features = ["city", "occupation"]

# preprocessing pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
    ]
)

# সম্পূর্ণ pipeline
pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(n_estimators=100, random_state=42)),
])

# fit করো — preprocessing আর model একসাথে
pipeline.fit(X_train, y_train)

# evaluate
print(f"Test accuracy: {pipeline.score(X_test, y_test):.3f}")
```

## Practical — সম্পূর্ণ Data Prep Pipeline

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report

# ১. ডাটা লোড
df = pd.read_csv("customers.csv")
X = df.drop("churn", axis=1)
y = df["churn"]

# ২. Split (এখানেই — preprocessing-এর আগে)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ৩. Preprocessing আলাদা আলাদা
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])

preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features),
])

# ৪. সম্পূর্ণ pipeline
model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", GradientBoostingClassifier(random_state=42)),
])

# ৫. Train আর evaluate
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
```

> [!example] কেন Pipeline ব্যবহার করবে?
# Pipeline শুধু leakage ঠেকায় না — পুরো preprocessing-model flow একটা object-এ থাকে। `joblib.dump(model, "model.pkl")` দিলে সব সেভ হয়ে যায়, production-এ লোড করে সরাসরি `predict` চালানো যায়। pandas 2.x আর NumPy 2.x-এর সাথে sklearn 1.x পুরোপুরি compatible।