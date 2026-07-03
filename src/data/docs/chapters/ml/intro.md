## Machine Learning কী

**Machine Learning (ML)** হলো এমন একটা পদ্ধতি যেখানে computer নিজে ডেটা থেকে pattern শিখে যায় — কোনো explicit rule বা code লিখে দিতে হয় না।

ভাবো তুমি কীভাবে একটা cat আর dog আলাদা করো? তুমি কি একটা checklist মনে করে সিদ্ধান্ত নাও — "চারটা পা, গোল কান, লেজ আছে"? না। তুমি ছোট থেকে অগণিত cat আর dog দেখেছো, আর তোমার brain অজান্তেই pattern শিখে নিয়েছে। Machine Learning ঠিক এভাবেই কাজ করে।

```text
  Traditional Programming            Machine Learning

  DATA + RULES → ANSWER              DATA + ANSWERS → RULES

  ┌──────┐  ┌───────┐                ┌──────┐  ┌────────┐
  │ Input│  │ Rules │ → Output      │ Input│  │ Output │ → Rules
  └──────┘  └───────┘                └──────┘  └────────┘
       │        │                         │        │
       └───┬────┘                         └───┬────┘
           │                                  │
           v                                  v
       Programmer                          Model
       লিখে দেয় rules                  নিজে শেখে rules
```

Traditional programming এ তুমি rule লিখে দাও — "যদি temperature > 30, তাহলে output 'hot'"। Machine Learning এ তুমি হাজার হাজার temperature আর তার label দাও, আর model নিজে বুঝে নেয় কখন "hot" বলতে হয়।

## ML এর তিন প্রকার

### Supervised Learning

Label করা ডেটা দিয়ে শেখানো হয়। প্রতিটা input এর সাথে সঠিক output (label) দেওয়া থাকে। যেমন: হাজার ছবির সাথে "cat" বা "dog" label। Model এই pattern শেখে, পরে নতুন ছবি দিলে predict করে।

```python
# Each example has a label
data = [
    ([1500, 3, 2], "expensive"),   # size, rooms, floor → price category
    ([800, 2, 1], "cheap"),
    ([2000, 4, 3], "expensive"),
]
```

### Unsupervised Learning

Label নেই। Model নিজেই ডেটা থেকে pattern বা group খুঁজে বের করে। যেমন: customer গুলোকে behavior অনুযায়ী আলাদা cluster এ ভাগ করা।

### Reinforcement Learning

Agent একটা environment এ trial আর error করে শেখে। ভালো কাজে reward, খারাপ কাজে penalty। দাবা খেলা, self-driving car — এসব এই ধরনের।

| Type | Label? | উদাহরণ | Use Case |
|------|--------|--------|----------|
| Supervised | আছে | ছবি → "cat" | Prediction, classification |
| Unsupervised | নেই | customer গোষ্ঠী | Clustering, pattern discovery |
| Reinforcement | Reward | action → score | Game, robotics |

> [!tip] ML মূলত ডেটার ব্যাপার, algorithm না
# অনেকে ভাবে ML মানে fancy algorithm। কিন্তু reality হলো — ভালো ডেটা থাকলে সাধারণ algorithm ও দারুণ ফল দেয়। খারাপ ডেটা দিয়ে সেরা algorithm ও কিছু করতে পারে না। "Garbage in, garbage out" — এই কথাটা ML এর সবচেয়ে গুরুত্বপূর্ণ সত্য।

## ML Workflow

একটা ML project সাধারণত এই ধাপ গুলো অনুসরণ করে:

```text
┌─────────┐    ┌───────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  Data   │───→│ Preprocess│───→│  Train  │───→│ Evaluate │───→│  Deploy │
│ Collect │    │ Clean,    │    │  Model  │    │ Test,    │    │  Use in │
│         │    │ Scale     │    │         │    │ Metrics  │    │  prod   │
└─────────┘    └───────────┘    └─────────┘    └──────────┘    └─────────┘
      ↑                                               │
      │                                               │
      └────────── monitor, retrain ◄──────────────────┘
```

### ১. Data Collection

সবচেয়ে গুরুত্বপূর্ণ ধাপ। ডেটা না থাকলে ML নেই। Database, API, web scraping, sensor — যেকোনো উৎস থেকে ডেটা সংগ্রহ করা হয়।

### ২. Data Preprocessing

কাঁচা ডেটা messy — missing value, outlier, different scale। এসব clean করতে হয়।

```python
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Missing value handle করা
df.fillna(df.mean(), inplace=True)

# Scale করা — সব feature একই range এ
scaler = StandardScaler()
scaled_data = scaler.fit_transform(df[["age", "salary", "height"]])
```

### ৩. Training

Model কে ডেটা দেখানো হয়, সে নিজে pattern শেখে।

```python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)  # learn from data
```

### ৪. Evaluation

নতুন ডেটা দিয়ে model এর performance check করা হয়।

```python
from sklearn.metrics import accuracy_score

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Accuracy: {accuracy:.2%}")
```

### ৫. Deployment

Model কে production এ পাঠানো হয় — API, app, বা embedded device এ।

## কেন ML এখন এত popular

ML এর theory অনেক আগে থেকেই ছিল (1950s)। কিন্তু সে সময় তিনটা জিনিস ছিল না:

| Factor | আগে | এখন |
|--------|-----|-----|
| **Data** | সীমিত | Internet এ অসীম |
| **Compute** | দুর্বল, দামি | GPU, cloud, সস্তা |
| **Algorithm** | basic | Deep Learning, Transformer |

এই তিনটা এখন available, তাই ML practical হয়েছে। তোমার phone এ face unlock, Netflix এর recommendation, Google Translate — সব ML এর উপর চলে।

## একটা Simple উদাহরণ

চলো একটা খুব simple ML দেখি — ঘরের দাম predict করা:

```python
from sklearn.linear_model import LinearRegression

# Training data: [area_sqft] → price
X = [[800], [1200], [1500], [2000], [2500]]
y = [400000, 600000, 750000, 1000000, 1250000]

# Train
model = LinearRegression()
model.fit(X, y)

# Predict new house price
new_house = [[1800]]
predicted_price = model.predict(new_house)
print(f"Predicted price: {predicted_price[0]:,.0f} BDT")
# Predicted price: 900,000 BDT
```

লক্ষ্য করো — আমরা কোনো formula লিখে দেইনি। Model নিজেই বুঝে নিয়েছে area আর price এর মধ্যে সম্পর্ক কী। এটাই ML এর জাদু।

## Summary

Machine Learning হলো ডেটা থেকে pattern শেখে সিদ্ধান্ত নেওয়া — explicit code না লিখে। তিন ধরনের ML: supervised (label আছে), unsupervised (label নেই), reinforcement (reward)। Workflow: data → preprocess → train → evaluate → deploy। সবচেয়ে গুরুত্বপূর্ণ হলো ডেটা — "garbage in, garbage out"। পরের chapter গুলোতে supervised learning নিয়ে বিস্তারিত দেখবো।