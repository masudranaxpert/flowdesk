## Hyperparameter বনাম Parameter — পার্থক্য

এই দুটো নিয়ে প্রায়ই confusion হয়, তাই পরিষ্কার করে নিই:

| | Parameter | Hyperparameter |
|---|---|---|
| কে সেট করে | Model নিজে (training-এ) | তুমি (training-এর আগে) |
| উদাহরণ | Linear regression-এ weights | `learning_rate`, `max_depth`, `n_estimators` |
| পরিবর্তন | Training data থেকে learn হয় | তুমি manually বা search করে সেট করো |

মানে — training-এর আগে যা সেট করো সেটাই hyperparameter, আর training-এর পর যা শেখা গেছে সেটাই parameter।

> [!tip] উদাহরণ
# `RandomForestClassifier(n_estimators=100, max_depth=10)` — এখানে `n_estimators` আর `max_depth` হলো hyperparameter (তুমি সেট করেছো)। আর প্রতিটা tree-এর ভেতরের split points হলো parameter (model নিজে learn করেছে)।

## k-Fold Cross-Validation

শুধু এক train-test split-এ evaluate করলে ভুল হতে পারে — split যদি ভাগ্যক্রমে খারাপ হয়? k-fold CV এই সমস্যা সমাধান করে:

```text
Data কে k ভাগে ভাগ করো (সাধারণত k=5 বা 10)

Fold 1: [Test ][Train][Train][Train][Train]
Fold 2: [Train][Test ][Train][Train][Train]
Fold 3: [Train][Train][Test ][Train][Train]
Fold 4: [Train][Train][Train][Test ][Train]
Fold 5: [Train][Train][Train][Train][Test ]

প্রতিটা fold-এ model train+evaluate করো, গড় করো
```

```python
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100, random_state=42)
scores = cross_val_score(model, X_train, y_train, cv=5, scoring="f1")

print(f"Fold scores: {scores}")
print(f"Mean: {scores.mean():.3f} ± {scores.std():.3f}")
```

> [!note] কেন CV দরকার?
# একটাই split-এ model ভালো/খারাপ যেকোনো রকম হতে পারে। ৫-ফোল্ড CV মানে ডাটার প্রতিটা অংশ একবার test হয় — ফলাফল অনেক বেশি reliable। বিশেষ করে ডাটা কম থাকলে CV বাধ্যতামূলক।

## Bias-Variance Tradeoff

সবচেয়ে গুরুত্বপূর্ণ concept একটা:

```text
Underfitting ←————— Sweet Spot —————→ Overfitting
(High Bias)        (Balanced)          (High Variance)
খুব simple         ঠিক আছে              খুব complex
Train: খারাপ        Train: ভালো          Train: দুর্দান্ত
Test:  খারাপ        Test:  ভালো          Test:  খারাপ
```

- **High Bias (Underfitting)** — model খুব simple, pattern ধরতে পারে না। সমাধান: বেশি complex model, feature যোগ করো।
- **High Variance (Overfitting)** — model training data মুখস্থ করে ফেলেছে, নতুন data-তে ফেইল করে। সমাধান: regularization, কম feature, বেশি data।

```python
import matplotlib.pyplot as plt
from sklearn.model_selection import learning_curve

train_sizes, train_scores, val_scores = learning_curve(
    model, X_train, y_train, cv=5, scoring="accuracy",
    train_sizes=np.linspace(0.1, 1.0, 10)
)

train_mean = train_scores.mean(axis=1)
val_mean = val_scores.mean(axis=1)

plt.plot(train_sizes, train_mean, label="Train score")
plt.plot(train_sizes, val_mean, label="Validation score")
plt.xlabel("Training examples")
plt.ylabel("Accuracy")
plt.legend()
plt.show()
```

Learning curve দেখে বুঝবে — train আর validation curve-এর মধ্যে gap অনেক থাকলে overfitting, দুটোই নিচে থাকলে underfitting।

## GridSearchCV — সব Combination খুঁজে বের করা

তোমার চাওয়া সব hyperparameter combination চেষ্টা করে সেরাটা বের করে:

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [None, 10, 20, 30],
    "min_samples_split": [2, 5, 10],
}

rf = RandomForestClassifier(random_state=42)

grid_search = GridSearchCV(
    rf,
    param_grid,
    cv=5,
    scoring="f1",
    n_jobs=-1,        # সব CPU core ব্যবহার করো
    verbose=1,
)

grid_search.fit(X_train, y_train)

print(f"Best params: {grid_search.best_params_}")
print(f"Best CV score: {grid_search.best_score_:.3f}")

best_model = grid_search.best_estimator_
```

GridSearch সব combination চেষ্টা করে — উপরের উদাহরণে ৩×৪×৩=৩৬ combination, প্রতিটা ৫-ফোল্ড CV — মোট ১৮০ fit!

## RandomizedSearchCV — দ্রুত Alternative

GridSearch অনেক সময় নেয়। RandomizedSearch random combination চেষ্টা করে — প্রায় একই ফল দেয় কম সময়ে:

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint

param_dist = {
    "n_estimators": randint(50, 300),
    "max_depth": [None, 10, 20, 30, 50],
    "min_samples_split": randint(2, 20),
    "min_samples_leaf": randint(1, 10),
    "max_features": ["sqrt", "log2", None],
}

random_search = RandomizedSearchCV(
    rf,
    param_dist,
    n_iter=50,          # ৫০টা random combination
    cv=5,
    scoring="f1",
    n_jobs=-1,
    random_state=42,
)

random_search.fit(X_train, y_train)
print(f"Best params: {random_search.best_params_}")
```

> [!tip] কখন কোনটা?
# GridSearch: যদি search space ছোট আর পুঙ্খানুপুঙ্খভাবে চেক করতে চাও।
# RandomizedSearch: search space বড় হলে — random ভাবে কিছু combination চেষ্টা করলেও সেরাটার কাছাকাছি পাওয়া যায়।

## Regularization — L1 আর L2

Overfitting ঠেকাতে model-এর complexity শাসন করার পদ্ধতি:

**L2 (Ridge)** — weights ছোট করে দেয়, কিন্তু zero করে না:

$$L_{total} = L_{loss} + \lambda \sum_{i} w_i^2$$

**L1 (Lasso)** — কিছু weight সরাসরি zero করে দেয় — feature selection হয়ে যায়:

$$L_{total} = L_{loss} + \lambda \sum_{i} |w_i|$$

এখানে $\lambda$ (lambda) হলো regularization strength — বেশি হলে বেশি penalty, model সহজ হয়।

```python
from sklearn.linear_model import LogisticRegression

# L2 regularization (default)
model_l2 = LogisticRegression(penalty="l2", C=1.0)

# L1 regularization (feature selection)
model_l1 = LogisticRegression(penalty="l1", solver="saga", C=1.0)
```

> [!note] `C` parameter কী?
# sklearn-এ `C` হলো $\frac{1}{\lambda}$ — মানে ছোট `C` = বেশি regularization। `C=1.0` সাধারণ শুরু, খারাপ হলে ছোট/বড় করে দেখো।

## Practical — GridSearchCV দিয়ে SVM Tune করা

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

# ১. ডাটা
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# ২. Pipeline (scaling সহ, leakage প্রতিরোধ)
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(random_state=42)),
])

# ৩. Hyperparameter grid
param_grid = {
    "svm__C": [0.1, 1, 10, 100],
    "svm__kernel": ["rbf", "poly"],
    "svm__gamma": ["scale", "auto", 0.001, 0.01],
}

# ৪. Grid search
grid = GridSearchCV(pipeline, param_grid, cv=5, scoring="f1", n_jobs=-1)
grid.fit(X_train, y_train)

print(f"Best params: {grid.best_params_}")
print(f"Best CV F1: {grid.best_score_:.3f}")

# ৫. Final evaluation
print(classification_report(y_test, grid.predict(X_test)))
```

> [!example] Pipeline-এ hyperparameter name
# Pipeline-এ যখন grid search করো, hyperparameter name হবে `<step_name>__<param>` — যেমন `svm__C`। এই double underscore convention মনে রাখা জরুরি।