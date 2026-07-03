## Accuracy একা যথেষ্ট না

ধরো একটা disease detection model আছে যেটা বলে কারো cancer আছে কি না। 1000 জনের মধ্যে 990 জন সুস্থ, 10 জনের cancer। যদি model সবাইকে বলে "তোমার cancer নেই" — accuracy হবে 99%! কিন্তু আসলে model টা একদম useless, কারণ সে একটাও cancer case ধরতে পারলো না।

এই জন্য accuracy একা model এর quality measure করার জন্য যথেষ্ট না। আরও কয়েকটা metric দরকার।

> [!tip] Class imbalance এ accuracy ভুল দেখায়
# যখন একটা class অন্যটার চেয়ে অনেক বেশি (যেমন 99% normal, 1% fraud), accuracy সবসময় misleading। এমন case এ Precision, Recall, F1-score দেখতে হবে।

## Confusion Matrix

Confusion matrix হলো একটা table যেটা দেখায় model কতগুলো সঠিক আর কতগুলো ভুল predict করেছে।

```text
                    Actual
                  ┌────────┬────────┐
                  │  Spam  │ Not    │
                  │        │ Spam   │
        ┌─────────┼────────┼────────┤
        │  Spam   │   TP   │   FP   │
Predict │─────────┼────────┼────────│
        │ Not     │   FN   │   TN   │
        │  Spam   │        │        │
        └─────────┴────────┴────────┘
```

| Term | মানে |
|------|------|
| **TP** (True Positive) | Spam কে spam বলেছে ✅ |
| **FP** (False Positive) | সুস্থ কে spam বলেছে ❌ |
| **FN** (False Negative) | Spam কে সুস্থ বলেছে ❌ |
| **TN** (True Negative) | সুস্থ কে সুস্থ বলেছে ✅ |

```python
from sklearn.metrics import confusion_matrix

y_true = [1, 0, 1, 1, 0, 1, 0, 0]
y_pred = [1, 0, 1, 0, 0, 1, 1, 0]

cm = confusion_matrix(y_true, y_pred)
print(cm)
# [[3 1]    ← TN=3, FP=1
#  [1 3]]   ← FN=1, TP=3
```

## Precision, Recall, F1-Score

### Precision

Precision বলে — model যতগুলোকে spam বলেছে, তার মধ্যে সত্যিই কতগুলো spam।

```text
Precision = TP / (TP + FP)
```

উপরের উদাহরণে: `3 / (3 + 1) = 0.75` — model যাদেরকে spam বলেছে তার 75% সত্যি spam।

### Recall

Recall বলে — সত্যিকারের spam গুলোর মধ্যে model কতগুলো ধরতে পেরেছে।

```text
Recall = TP / (TP + FN)
```

উপরের উদাহরণে: `3 / (3 + 1) = 0.75` — আসল spam এর 75% model ধরতে পেরেছে।

### F1-Score

Precision আর Recall এর harmonic mean। যখন দুটোর balance দরকার।

```text
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

| Metric | Formula | কখন গুরুত্বপূর্ণ |
|--------|---------|-----------------|
| Precision | TP/(TP+FP) | False positive যখন খরচ |
| Recall | TP/(TP+FN) | False negative যখন খরচ |
| F1-Score | 2×(P×R)/(P+R) | দুটোর balance |

> [!example] কখন Precision বেশি গুরুত্বপূর্ণ
# Spam filter এ Precision বেশি গুরুত্বপূর্ণ। কারণ একটা গুরুত্বপূর্ণ email ভুল করে spam folder এ চলে গেলে (FP) — সেটা বড় সমস্যা। কিন্তু একটা spam inbox এ এসে গেলে (FN) — সেটা ততটা না। এর উল্টো — cancer detection এ Recall বেশি গুরুত্বপূর্ণ, কারণ একটা cancer case miss করা (FN) প্রাণঘাতী।

## sklearn এ সব একসাথে

```python
from sklearn.metrics import classification_report

y_true = [0, 1, 2, 0, 1, 2, 0, 1, 2]
y_pred = [0, 1, 1, 0, 1, 2, 0, 2, 2]

print(classification_report(y_true, y_pred))
```

```text
              precision  recall  f1-score  support

           0     1.00    1.00    1.00       3
           1     0.67    0.67    0.67       3
           2     0.67    0.67    0.67       3

    accuracy                       0.78       9
   macro avg     0.78    0.78    0.78       9
weighted avg     0.78    0.78    0.78       9
```

## Regression Metrics

Regression এর জন্য accuracy এর মতো metric কাজ করে না, কারণ output continuous number।

| Metric | Formula | বৈশিষ্ট্য |
|--------|---------|----------|
| **MAE** | Mean Absolute Error | সহজে বোঝা যায় |
| **MSE** | Mean Squared Error | বড় error শাস্তি দেয় |
| **RMSE** | √MSE | মূল unit এ |
| **R²** | 0 থেকে 1 | কত % variance explain করে |

```python
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

y_true = [100, 200, 300, 400, 500]
y_pred = [110, 190, 320, 390, 490]

mae = mean_absolute_error(y_true, y_pred)
mse = mean_squared_error(y_true, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_true, y_pred)

print(f"MAE:  {mae:.2f}")
print(f"MSE:  {mse:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"R²:   {r2:.4f}")
```

R² এর মান ১.০ হলে perfect, ০ হলে model শুধু গড় predict করছে, ঋণাত্মক হলে worse than average।

## Cross-Validation

Train/test split এ একটা সমস্যা হলো — split কীভাবে হলো তার উপর accuracy নির্ভর করে। **Cross-validation** এই সমস্যা সমাধান করে।

```text
  5-Fold Cross Validation:

  Fold 1: [TEST] [train] [train] [train] [train] → Score 1
  Fold 2: [train] [TEST] [train] [train] [train] → Score 2
  Fold 3: [train] [train] [TEST] [train] [train] → Score 3
  Fold 4: [train] [train] [train] [TEST] [train] → Score 4
  Fold 5: [train] [train] [train] [train] [TEST] → Score 5

  Final Score = average of all 5 scores
```

```python
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

iris = load_iris()
X, y = iris.data, iris.target

model = RandomForestClassifier(random_state=42)

# 5-fold cross validation
scores = cross_val_score(model, X, y, cv=5)

print(f"Scores: {scores}")
print(f"Mean:   {scores.mean():.4f}")
print(f"Std:    {scores.std():.4f}")
```

cross_val_score প্রতিটা fold এ accuracy দেয়। গড় আর standard deviation দেখে বোঝা যায় model কতটা stable।

## Metric বাছাই এর Guide

```text
  Classification?
  ├─ Binary?
  │   ├─ Balanced class?     → Accuracy OK
  │   ├─ Imbalanced?         → F1, Precision, Recall
  │   └─ Probabilities?      → ROC-AUC
  └─ Multi-class?
      └─ classification_report
  
  Regression?
  ├─ Outliers আছে?     → MAE বা Huber
  ├─ বড় error শাস্তি?  → MSE / RMSE
  └─ Overall fit?        → R²
```

## Summary

Accuracy একা model evaluate করার জন্য যথেষ্ট না, বিশেষ করে class imbalance এ। Confusion matrix দেয় TP, FP, TN, FN — এই চারটা থেকে Precision, Recall, F1-score বের করা যায়। Spam filter এ Precision গুরুত্বপূর্ণ, cancer detection এ Recall। Regression এর জন্য MAE, MSE, RMSE, R²। Cross-validation দিয়ে model এর stability যাচাই করা যায়। Model build করার আগেই ঠিক করো কোন metric সবচেয়ে গুরুত্বপূর্ণ।