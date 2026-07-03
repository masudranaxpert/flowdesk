# Classic NLP — Sentiment আর Classification

এই chapter এ আমরা দেখবো কীভাবে টেক্সট কে category তে ভাগ করা যায়। এটাকে বলে text classification। সবচেয়ে পরিচিত দুটো use case — spam detection আর sentiment analysis। খাতা classic মেশিন learning model (Naive Bayes, Logistic Regression, SVM) দিয়ে এগুলো অনেক ভালোভাবে করা যায়।

## Text Classification কী?

ধারণাটা সোজা — একটা টেক্সট দিলে model বলে দেবে এটা কোন category তে পড়ে।

```text
                ┌─────────────────┐
   Text ──────► │  Classification  │ ──────► Category
                │      Model       │        (spam / ham)
                └─────────────────┘
```

কয়েকটা জনপ্রিয় classification problem:

- **Spam detection** — email/SMS spam নাকি আসল
- **Sentiment analysis** — positive / negative / neutral
- **Topic classification** — news কোন category (sports, politics)
- **Language detection** — কোন ভাষায় লেখা
- **Intent detection** — chatbot এ user কী চায়

> [!tip] সবচেয়ে ব্যবহৃত NLP task
> Production এ text classification সবচেয়ে বেশি use হয়। কারণ সহজ, fast, আর ROI বেশি। নতুন শুরু করলে এখান থেকেই শুরু করো।

## Project 1 — SMS Spam Detection

সম্পূর্ণ একটা project দিয়ে শুরু করি। উদ্দেশ্য — SMS দেখে বলবে spam নাকি আসল message (ham)।

### ডেটা প্রস্তুত করা

বিখ্যাত UCI SMS Spam Collection dataset use করবো। প্রতিটা row এ SMS text আর label (spam/ham)।

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report

# load sample data
data = {
    "text": [
        "Win a free iPhone now! Click here",
        "Hey, are we still on for dinner tonight?",
        "URGENT: Your account has been suspended. Reply now",
        "Can you pick up some milk on your way home?",
        "Congratulations! You've won $1000 gift card",
        "See you tomorrow at the office",
        "Limited time offer! Buy one get one free",
        "Mom called, she wants to talk to you",
    ],
    "label": ["spam", "ham", "spam", "ham", "spam", "ham", "spam", "ham"],
}

df = pd.DataFrame(data)
print(df["label"].value_counts())
```

### Train/Test Split আর Vectorization

`train_test_split` দিয়ে ডেটা কে training আর test set-এ ভাগ করা হয় — `stratify` দিলে দুটো set-এ class ratio সমান থাকে। `TfidfVectorizer` টেক্সট কে number-এ রূপান্তর করে: `stop_words="english"` দিয়ে "the", "is" সরানো হয়, `lowercase=True` দিয়ে সব ছোট হাতের করা হয়। `fit_transform` train data-তে vocab শেখে আর vector বানায়, আর test data-তে শুধু `transform` করা হয় — নতুন word শেখা হয় না।

```python
X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["label"], test_size=0.25, random_state=42, stratify=df["label"]
)

vectorizer = TfidfVectorizer(stop_words="english", lowercase=True)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

print("Train shape:", X_train_vec.shape)
```

> [!note] fit_transform আর transform পার্থক্য
> Train এ `fit_transform` করো — সে vocab শিখে আর vector বানায়। Test এ শুধু `transform` — নতুন word শিখতে দেবে না, আগের vocab use করবে। এটা very important, data leakage এড়াতে।

### Naive Bayes Model Train

Naive Bayes text classification এর classic algorithm। Bayes theorem এর উপর ভিত্তি করে কাজ করে। সহজ, fast, আর text এ অদ্ভুতভাবে ভালো কাজ করে।

```python
model = MultinomialNB()
model.fit(X_train_vec, y_train)

y_pred = model.predict(X_test_vec)
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))
```

### নতুন SMS Predict করা

```python
new_sms = ["Congratulations! You have been selected for a free vacation"]
new_vec = vectorizer.transform(new_sms)
prediction = model.predict(new_vec)
print("Prediction:", prediction[0])   # spam
```

## Naive Bayes — কীভাবে কাজ করে?

Naive Bayes এর মূল ভাবনা — একটা word এর probability দেখে সিদ্ধান্ত নেয়। "free", "win", "congratulations" এই word গুলো spam এ বেশি আসে।

```text
P(spam | "free win iPhone") ∝ P(spam) × P("free"|spam) × P("win"|spam) × P("iPhone"|spam)
```

"Naive" শব্দটা এসেছে কারণ এটা ধরে নেয় সব word independent — একটার উপর আরেকটার প্রভাব নেই। বাস্তবে এটা সত্যি না, কিন্তু তবুও model অনেক ভালো কাজ করে।

> [!example] এক সেকেন্ডে হাজার SMS
> Naive Bayes এতো fast যে এক সেকেন্ডে হাজার হাজার SMS classify করতে পারে। Gmail এর প্রথম spam filter এই model দিয়েই শুরু হয়েছিল।

## Project 2 — Sentiment Analysis

এবার একটা sentiment classifier দেখি। Movie review দেখে positive/negative বলবে। এখানে `Pipeline` দিয়ে `TfidfVectorizer` আর `LogisticRegression` একসাথে বাঁধা হয়েছে — এর মানে টেক্সট দিলে সে vectorize হবে, তারপর classify হবে, সব একসাথে। `ngram_range=(1, 2)` দিয়ে single word আর two-word phrase দুটোকেই feature হিসেবে নেওয়া হয়।

```python
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

reviews = [
    ("This movie was absolutely fantastic!", "pos"),
    ("Worst film I have ever seen. Boring.", "neg"),
    ("Loved every minute of it, amazing acting", "pos"),
    ("Terrible plot, waste of money", "neg"),
    ("A masterpiece, beautifully shot", "pos"),
    ("I fell asleep, so dull and slow", "neg"),
]

df = pd.DataFrame(reviews, columns=["text", "sentiment"])

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(stop_words="english", ngram_range=(1, 2))),
    ("clf", LogisticRegression()),
])

X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["sentiment"], test_size=0.3, random_state=42
)

pipeline.fit(X_train, y_train)
print("Accuracy:", pipeline.score(X_test, y_test))
```

Pipeline দিয়ে vectorizer আর model এক সাথে বাঁধা — খুব clean pattern।

## Logistic Regression — Text এর জন্য

নতুন না হলেও text এ Logistic Regression অদ্ভুতভাবে ভালো কাজ করে। কারণ — sparse, high-dimensional data (TF-IDF feature) এ linear model অনেক সময় neural network কেও হারায়।

```python
model = LogisticRegression(C=1.0, max_iter=1000)
model.fit(X_train_vec, y_train)
```

`C` হলো regularization parameter। ছোট `C` = বেশি regularization = simpler model।

> [!tip] Baseline হিসেবে LR
> যেকোনো NLP classification এ প্রথমে Logistic Regression + TF-IDF দিয়ে baseline বানাও। পরে BERT ইত্যাদি দিয়ে উন্নত করো। অনেক সময় baseline ই যথেষ্ট।

## SVM — Support Vector Machine

SVM ও text classification এ জনপ্রিয়। বিশেষ করে LinearSVC text এ দারুণ কাজ করে।

```python
from sklearn.svm import LinearSVC

svm = LinearSVC()
svm.fit(X_train_vec, y_train)
y_pred_svm = svm.predict(X_test_vec)
print("SVM Accuracy:", accuracy_score(y_test, y_pred_svm))
```

## মডেল Comparison

তিনটা model এক সাথে তুলনা করে দেখি:

```python
from sklearn.model_selection import cross_val_score

models = {
    "Naive Bayes": MultinomialNB(),
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Linear SVM": LinearSVC(),
}

for name, model in models.items():
    pipe = Pipeline([("tfidf", TfidfVectorizer()), ("clf", model)])
    scores = cross_val_score(pipe, df["text"], df["label"], cv=3)
    print(f"{name}: {scores.mean():.3f} (+/- {scores.std():.3f})")
```

সাধারণভাবে যা দেখা যায়:

| Model | Speed | Accuracy | কখন ব্যবহার |
|-------|-------|----------|------------|
| Naive Bayes | খুব fast | মোটামুটি | Baseline, কম ডেটা |
| Logistic Regression | Fast | ভালো | General purpose |
| Linear SVM | Fast | ভালো | High-dim text data |
| BERT (transformer) | Slow | সেরা | যখন accuracy সর্বোচ্চ দরকার |

## Evaluation Metrics

Accuracy একা যথেষ্ট না। বিশেষ করে imbalanced data তে বিভ্রান্তিকর। তাই precision, recall, F1 দেখতে হয়।

```text
Precision = TP / (TP + FP)   → model যা spam বলে, তার কতটা আসলে spam
Recall    = TP / (TP + FN)   → সব spam এর কতটা ধরতে পেরেছে
F1        = 2 × (P × R) / (P + R)   → দুটোর balance
```

```python
from sklearn.metrics import confusion_matrix

cm = confusion_matrix(y_test, y_pred)
print(cm)
```

> [!warn] Accuracy ফাঁদ
> ৯৯% message ham, ১% spam হলে, সব কিছুকে ham বললেও ৯৯% accuracy! কিন্তু সব spam মিস করছে। তাই recall আর F1 দেখো।

## Imbalanced Data মোকাবিলা

Spam dataset এ সাধারণত ham বেশি, spam কম। সমাধান:

```python
# class weight দিয়ে balance করা
model = LogisticRegression(class_weight="balanced")

# বা oversampling
from imblearn.over_sampling import RandomOverSampler
ros = RandomOverSampler()
X_res, y_res = ros.fit_resample(X_train_vec, y_train)
```

## Classic vs Modern — কখন কোনটা?

2026 এ BERT আর LLM এর যুগে classic model কি obsolete? একদম না!

> [!tip] কখন classic model
> ছোট dataset, কম compute, fast inference দরকার, explainability দরকার — এই সব case এ Naive Bayes, Logistic Regression এখনো best। হার্ডওয়্যার নেই এমন জায়গায় এগুলোই life saver।

## Summary

Text classification হলো NLP এর সবচেয়ে ব্যবহৃত task। TF-IDF + Naive Bayes/Logistic Regression দিয়ে একদম baseline বানিয়ে ফেলা যায়। পরে BERT দিয়ে উন্নত করা যায়। পরের chapter এ দেখবো কীভাবে transformer আর LLM পুরো খেলা পাল্টে দিয়েছে।