## রিয়েল প্রজেক্ট: Iris Classification

এই chapter এ আমরা একটা সম্পূর্ণ end-to-end ML project করবো — শুরু থেকে শেষ পর্যন্ত। **Iris dataset** দিয়ে কাজ করবো, যেটা ML এর "Hello World"। এখানে তিন ধরনের iris flower আছে — Setosa, Versicolor, Virginica। আমরা flower এর petal আর sepal এর measurement থেকে species predict করবো।

## Workflow Overview

```text
  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ Load     │──→│ Explore  │──→│ Preprocess│──→│ Train    │──→│ Compare  │
  │ Data     │   │ (EDA)    │   │          │   │ Models   │   │ & Select │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

## Step ১ — Data Load

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
import pandas as pd
import numpy as np

# Load dataset
iris = load_iris()
X = iris.data
y = iris.target

print(f"Data shape:  {X.shape}")
print(f"Classes:     {iris.target_names}")
print(f"Features:    {iris.feature_names}")
```

```text
Data shape:  (150, 4)
Classes:     ['setosa' 'versicolor' 'virginica']
Features:    ['sepal length', 'sepal width', 'petal length', 'petal width']
```

150 টা sample, প্রতিটায় 4 টা feature, আর 3 টা class।

## Step ২ — EDA (Exploratory Data Analysis)

ডেটা কেমন সেটা না দেখে model build করা অন্ধের মতো গুটি চালা। প্রথমে ডেটা বুঝতে হবে।

```python
df = pd.DataFrame(X, columns=iris.feature_names)
df["species"] = [iris.target_names[i] for i in y]

print(df.describe())
```

```text
       sepal length  sepal width  petal length  petal width
count    150.00      150.00        150.00        150.00
mean       5.84        3.06          3.76          1.20
std        0.83        0.44          1.77          0.76
min        4.30        2.00          1.00          0.10
max        7.90        4.40          6.90          2.50
```

```python
# Class distribution — balanced?
print(df["species"].value_counts())
```

```text
setosa        50
versicolor    50
virginica     50
```

ভালো খবর — dataset balanced (প্রতিটা class এ 50 টা করে)। তাই accuracy reasonable metric হবে।

## Step ৩ — Preprocess

```python
# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"Train: {X_train.shape[0]} samples")
print(f"Test:  {X_test.shape[0]} samples")
```

> [!danger] Test data কে scale fit করবে না
# `fit_transform` শুধু train data তে করো। Test data তে শুধু `transform`। যদি test data তেও fit করো, সেটা data leakage — model পরীক্ষার উত্তর আগেই পেয়ে যায়।

## Step ৪ — Multiple Model Train

একটা model দিয়েই শুরু করা যায়, কিন্তু কয়েকটা model train করে compare করলে ভালো সিদ্ধান্ত নেওয়া যায়।

```python
# Define models
models = {
    "Logistic Regression": LogisticRegression(max_iter=200, random_state=42),
    "SVM": SVC(kernel="rbf", random_state=42),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42)
}

# Train and evaluate each
results = {}

for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    results[name] = acc
    print(f"{name:25s} Accuracy: {acc:.4f}")
```

```text
Logistic Regression      Accuracy: 0.9111
SVM                      Accuracy: 0.9556
Random Forest            Accuracy: 0.9111
```

SVM সবচেয়ে ভালো করেছে এই dataset এ। কিন্তু পার্থক্য খুব বেশি না।

> [!example] Model selection process
# কখনো আগে থেকে বলা যায় না কোন algorithm ভালো করবে। তাই কয়েকটা model train করে compare করো। কিন্তু মনে রাখবে — সব সময় complex model best হবে এমন কোনো কথা নেই। Simple model যদি ভালো ফল দেয়, সেটাই বেছে নাও।

## Step ৫ — Detailed Evaluation

ভালো model টা নিয়ে detail এ দেখি:

```python
# Best model
best_model = SVC(kernel="rbf", random_state=42)
best_model.fit(X_train_scaled, y_train)
y_pred = best_model.predict(X_test_scaled)

print(classification_report(y_test, y_pred, target_names=iris.target_names))
```

```text
              precision  recall  f1-score  support

      setosa      1.00    1.00    1.00       15
  versicolor      0.93    0.93    0.93       15
   virginica      0.93    0.93    0.93       15

    accuracy                          0.96       45
   macro avg      0.96    0.96    0.96       45
weighted avg      0.96    0.96    0.96       45
```

Setosa 100% correct — এটা সবচেয়ে সহজে আলাদা করা যায়। Versicolor আর Virginica এর মধ্যে কিছু confusion আছে।

## Step ৬ — Feature Importance

কোন feature সবচেয়ে গুরুত্বপূর্ণ? Random Forest দিয়ে দেখা যায়:

```python
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train_scaled, y_train)

importances = rf.feature_importances_
for name, imp in sorted(zip(iris.feature_names, importances), 
                        key=lambda x: x[1], reverse=True):
    print(f"{name:20s}: {imp:.4f}")
```

```text
petal length         : 0.4412
petal width          : 0.4211
sepal length         : 0.1086
sepal width          : 0.0291
```

Petal length আর petal width সবচেয়ে গুরুত্বপূর্ণ feature — এরা দুটো মিলে ~86%। ভবিষ্যতে শুধু এই দুটো feature দিয়েও ভালো model বানানো যেতে পারে।

## Step ৭ — Confusion Matrix

```python
from sklearn.metrics import confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", 
            xticklabels=iris.target_names,
            yticklabels=iris.target_names,
            cmap="Blues")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix — SVM")
plt.show()
```

```text
              Predicted
              setosa  versicolor  virginica
Actual setosa   15        0          0
       versi     0       14          1
       virgi     0        1         14
```

## Step ৮ — Final Pipeline

Production ready code এ সব একসাথে pipeline এ রাখা উচিত:

```python
from sklearn.pipeline import Pipeline

final_pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", SVC(kernel="rbf", random_state=42, probability=True))
])

# Train on full data
final_pipeline.fit(X, y)

# Predict new sample
new_flower = np.array([[5.1, 3.5, 1.4, 0.2]])
prediction = final_pipeline.predict(new_flower)
probability = final_pipeline.predict_proba(new_flower)

print(f"Predicted: {iris.target_names[prediction[0]]}")
print(f"Confidence: {probability[0].max():.2%}")
```

```text
Predicted: setosa
Confidence: 98.21%
```

> [!tip] সবসময় baseline দিয়ে শুরু করো
# যেকোনো ML project এ প্রথমে একটা simple baseline বানাও — যেমন Logistic Regression বা majority class predictor। এরপর complex model গুলো try করো। যদি complex model baseline এর চেয়ে খুব বেশি ভালো না করে, তাহলে simple model ই রাখো। Production এ simple model maintain করা সহজ।

## সম্পূর্ণ Project Summary

| Step | কী করলাম |
|------|----------|
| Load | `load_iris()` দিয়ে 150 sample |
| EDA | Describe, class distribution check |
| Preprocess | Split 70/30, StandardScaler |
| Train | LogReg, SVM, Random Forest |
| Compare | SVM best (95.6%) |
| Evaluate | classification_report, confusion matrix |
| Feature importance | Petal length/width সবচেয়ে গুরুত্বপূর্ণ |
| Pipeline | Scale + model একসাথে |

এই পুরো workflow টা যেকোনো classification problem এ reuse করা যায়। শুধু dataset বদলাবে, structure একই থাকবে — load, explore, preprocess, train, compare, evaluate, deploy।