## Ensemble কেন দরকার?

একটাই model দিয়ে ভালো ফল পাওয়া কঠিন। কিন্তু একাধিক model-কে combine করলে অবিশ্বাস্য ভালো ফল আসে — এটাই ensemble method। পেছনের intuition সহজ: একজনের সিদ্ধান্ত ভুল হতে পারে, কিন্তু অনেকের মতামতের গড় অনেক বেশি reliable।

> [!tip] Netflix Prize-র গল্প
# 2006 সালে Netflix একটা প্রতিযোগিতা করে কোন মুভি কেউ কত রেটিং দেবে। বিজয়ী টিম শুধু একটা model ব্যবহার করেনি — শত শত model-কে combine করেছিল। এখান থেকেই ensemble-এর শক্তি পরিষ্কার।

## Bagging — Bootstrap Aggregating

Bagging-এর ধারণা: একই algorithm দিয়ে অনেকগুলো model train করো, প্রতিটাকে আলাদা random subset-এ, তারপর গড়/ভোট করো।

### Random Forest

সবচেয়ে জনপ্রিয় bagging algorithm:

```text
Original Data
    │
    ├──► Bootstrap Sample 1 ──► Tree 1 ──┐
    ├──► Bootstrap Sample 2 ──► Tree 2 ──┤
    ├──► Bootstrap Sample 3 ──► Tree 3 ──┼──► Vote/Average ──► Prediction
    │             ...                    │
    └──► Bootstrap Sample N ──► Tree N ──┘
```

- **Bootstrap**: original data থেকে random ভাবে (with replacement) স্যাম্পল নাও
- **Random feature selection**: প্রতিটা split-এ সব feature না দেখে কিছু random feature দেখে
- **Aggregate**: সব tree-এর prediction গড় বা majority vote

```python
from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(
    n_estimators=100,      # ১০০টা tree
    max_depth=None,
    max_features="sqrt",   # প্রতি split-এ √n features
    random_state=42,
    n_jobs=-1,
)
rf.fit(X_train, y_train)
print(f"Accuracy: {rf.score(X_test, y_test):.3f}")

# Feature importance দেখো
importances = pd.Series(rf.feature_importances_, index=feature_names)
print(importances.sort_values(ascending=False).head(10))
```

> [!note] Bagging কী কমায়?
# Bagging মূলত **variance** কমায় — মানে model-এর unstable behavior কমে। একটা decision tree খুব unstable (ডাটা একটু বদলালে সম্পূর্ণ অন্যরকম tree হয়), কিন্তু ১০০টা tree-এর গড় অনেক stable।

## Boosting — Sequential Correction

Boosting-এর ধারণা আলাদা — model-গুলো একসাথে নয়, একের পর এক train হয়। প্রতিটা নতুন model আগের model-গুলোর **ভুল থেকে শেখে**:

```text
Model 1 → errors ──► Model 2 (আগের ভুলে focus) → errors ──► Model 3 → ...
                                                                              │
                          Final = Model 1 + Model 2 + Model 3 + ... ◄──────────┘
```

### AdaBoost

সবচেয়ে classic boosting — ভুল করা sample-গুলোর weight বাড়ায়, সঠিক sample-গুলোর কমায়:

```python
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier

ada = AdaBoostClassifier(
    DecisionTreeClassifier(max_depth=1),   # weak learner (stump)
    n_estimators=200,
    learning_rate=0.5,
    random_state=42,
)
ada.fit(X_train, y_train)
```

### Gradient Boosting

আধুনিক boosting — ভুল থেকে শেখার পরিবর্তে residual (error) কে gradient descent দিয়ে minimize করে:

$$F_{m}(x) = F_{m-1}(x) + \nu \cdot h_{m}(x)$$

যেখানে $h_m$ হলো m-তম weak learner, $\nu$ হলো learning rate।

### XGBoost আর LightGBM — আধুনিক চ্যাম্পিয়ন

Kaggle আর production-এ সবচেয়ে জনপ্রিয় দুটো boosting library:

```python
import xgboost as xgb
from sklearn.metrics import accuracy_score

# XGBoost classifier
xgb_model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_lambda=1.0,          # L2 regularization
    random_state=42,
    n_jobs=-1,
)

xgb_model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)

y_pred = xgb_model.predict(X_test)
print(f"XGBoost accuracy: {accuracy_score(y_test, y_pred):.3f}")
```

```python
import lightgbm as lgb

lgb_model = lgb.LGBMClassifier(
    n_estimators=300,
    max_depth=-1,
    num_leaves=31,
    learning_rate=0.1,
    subsample=0.8,
    random_state=42,
    n_jobs=-1,
    verbose=-1,
)
lgb_model.fit(X_train, y_train)
```

> [!tip] XGBoost বনাম LightGBM
# XGBoost বেশি accurate, LightGBM বেশি fast। ডাটা অনেক বড় হলে LightGBM ব্যবহার করো, নাহলে XGBoost সবচেয়ে safe choice। দুটোই gradient boosting, শুধু implementation strategy আলাদা।

## Stacking আর Blending

আরও এক ধাপ এগিয়ে — ভিন্ন ভিন্ন type-এর model-কে combine করো, আর তাদের prediction-এর উপর আরেকটা meta-model train করো:

```python
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

estimators = [
    ("rf", RandomForestClassifier(n_estimators=100, random_state=42)),
    ("xgb", xgb.XGBClassifier(random_state=42)),
    ("svm", SVC(probability=True, random_state=42)),
]

stacked = StackingClassifier(
    estimators=estimators,
    final_estimator=LogisticRegression(),
    cv=5,
)

stacked.fit(X_train, y_train)
print(f"Stacking accuracy: {stacked.score(X_test, y_test):.3f}")
```

## কখন কোনটা ব্যবহার করবে?

| Method | কখন | সুবিধা | অসুবিধা |
|---|---|---|---|
| **Random Forest** | সবচেয়ে safe, default choice | simple, robust, feature importance | বড় model, prediction ধীর |
| **XGBoost** | সেরা accuracy চাইলে | সবচেয়ে accurate | tuning কঠিন, overfitting ঝুঁকি |
| **LightGBM** | বিশাল ডাটা, fast দরকার | অত্যন্ত fast | ছোট ডাটায় overfit |
| **Stacking** | competition, সর্বোচ্চ performance | সবগুলোর সেরা দিক | complex, slow, hard to deploy |

> [!warn] Overfitting সতর্কতা
# Boosting (বিশেষ করে XGBoost) খুব সহজেই training data মুখস্থ করে ফেলতে পারে। সবসময় validation set আলাদা রাখো, `early_stopping_rounds` ব্যবহার করো। SHAP-এর মতো tool দিয়ে model explainability যাচাই করো।

## Practical — Random Forest বনাম XGBoost তুলনা

```python
import pandas as pd
import xgboost as xgb
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

# ১. ডাটা
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# ২. Random Forest
rf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)
rf_pred = rf.predict(X_test)

# ৩. XGBoost
xgb_model = xgb.XGBClassifier(
    n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42
)
xgb_model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
xgb_pred = xgb_model.predict(X_test)

# ৪. তুলনা
results = pd.DataFrame({
    "Model": ["Random Forest", "XGBoost"],
    "Accuracy": [
        accuracy_score(y_test, rf_pred),
        accuracy_score(y_test, xgb_pred),
    ],
    "F1": [
        f1_score(y_test, rf_pred),
        f1_score(y_test, xgb_pred),
    ],
})
print(results)
```

> [!example] SHAP দিয়ে explainability
# 2026-এ model explainability বাধ্যতামূলক। SHAP (SHapley Additive exPlanations) দিয়ে প্রতিটা prediction-এর পেছনে কোন feature কতটা ভূমিকা নিয়েছে সেটা দেখা যায়। `shap.TreeExplainer(xgb_model)` দিয়ে XGBoost model explain করা সবচেয়ে সহজ।