# Deep Learning কী

Deep learning হলো machine learning এর একটা special branch যেখানে neural network এর অনেক layer থাকে ("deep" মানেই অনেক layer)। 2026 এ এই জিনিসটা পুরো tech দুনিয়া চালিয়ে দিচ্ছে — ChatGPT, self-driving car, face recognition, সব এর উপর দাঁড়িয়ে আছে।

## Deep Learning কী?

সহজ করে বললে — deep learning হলো অনেকগুলো artificial neuron কে একসাথে যুক্ত করে একটা বিশাল network বানানো, আর সেই network কে অনেক ডেটা দিয়ে train করা। Network নিজে নিজে pattern শিখে যায়।

```text
Input  ──►  [Layer 1]  ──►  [Layer 2]  ──►  [Layer 3]  ──►  Output
 (pixel)    (edges)        (shapes)       (objects)      (cat/dog)
```

উদাহরণ: একটা ছবি দিলে — প্রথম layer edges শেখে, পরের layer shapes, তারপর object, শেষে "cat" নাকি "dog" বলে দেয়। এটাই hierarchical learning।

## ML vs DL — মূল পার্থক্য

প্রশ্ন আসতেই পারে — তাহলে traditional machine learning এ কী সমস্যা ছিল? পার্থক্য হলো feature engineering।

```text
Traditional ML:
   Raw Data ──► [Human: Feature Engineering] ──► [ML Model] ──► Output
                    মানুষ feature বানায়                    (SVM, RF)

Deep Learning:
   Raw Data ──► [Neural Network] ──► Output
                 model নিজে feature শেখে
```

| বিষয় | Traditional ML | Deep Learning |
|-------|----------------|---------------|
| Feature | মানুষ বানায় | Model শেখে |
| Data দরকার | কম | অনেক বেশি |
| Compute | CPU তে চলে | GPU/TPU দরকার |
| Performance | সীমিত | অনেক বেশি |
| Explainability | বেশি | কম (black box) |

> [!tip] ছোট কাজে ML, বড় কাজে DL
> Tabular data, ছোট dataset — এখানে Random Forest, XGBoost এখনো সেরা। Image, text, speech — এসব complex data তে DL এর বিকল্প নেই।

## Biological Neuron Analogy

Neural network এর concept টা মানুষের মস্তিষ্কের neuron থেকে এসেছে। মস্তিষ্কে প্রায় ৮৬ বিলিয়ন neuron আছে, প্রতিটা অন্যের সাথে সংযুক্ত।

```text
বায়োলজিক্যাল Neuron:
            Dendrite (input)
                │
                ▼
            ┌────────┐
            │  Cell  │ ──── Axon (output) ────► পরের neuron
            │  Body  │
            └────────┘

Artificial Neuron:
            x1 ──(w1)──┐
            x2 ──(w2)──┼──► Σ(wx) + b ──► activation ──► output
            x3 ──(w3)──┘
```

বায়োলজিক্যাল neuron signal পায়, একটা threshold পার হলে আগের neuron এ signal পাঠায়। Artificial neuron ও ঠিক তেমনি input নেয়, যোগ করে, activation function দিয়ে pass করে।

> [!warn] Analogy পুরোপুরি সঠিক না
> বায়োলজিক্যাল neuron আর artificial neuron এর মধ্যে অনেক পার্থক্য আছে। এটা শুধু inspiration, exact copy না। বাস্তব neuron অনেক বেশি complex।

## Artificial Neuron — Anatomy

একটা artificial neuron এ তিনটা জিনিস থাকে:

1. **Weights (w)** — প্রতিটা input এর গুরুত্ব
2. **Bias (b)** — একটা constant shift
3. **Activation function** — non-linearity আনে

```python
# single neuron এর কাজ
def neuron(x1, x2, w1, w2, b):
    z = w1 * x1 + w2 * x2 + b
    return z

print(neuron(2, 3, 0.5, 0.7, -1))   # 2.0
```

`z = w1·x1 + w2·x2 + b` — এটাই একটা neuron এর মূল হিসাব।

## Activation Function কেন দরকার?

শুধু গুণ আর যোগ করলে neural network একটা linear function হয়ে যায়। কিন্তু দুনিয়ার সব problem linear না। Activation function non-linearity আনে, যাতে model complex pattern শিখতে পারে।

```python
import numpy as np

# ReLU — most popular activation
def relu(z):
    return max(0, z)

print(relu(-5))   # 0
print(relu(3))    # 3
```

সবচেয়ে জনপ্রিয় activation function গুলো:

- **ReLU** — hidden layer এ default choice, সহজ আর fast
- **Sigmoid** — output 0-1 এর মধ্যে, binary classification এ
- **Softmax** — multi-class output এ probability
- **Tanh** — output -1 থেকে 1

## "Deep" কেন?

একটা layer এক ধরনের pattern শেখে। যত বেশি layer, তত বেশি abstract pattern। তাই "deep" — মানে অনেক layer।

```text
Image Recognition:
  Input: pixels
   ↓
  Layer 1: edges, lines শিখে
   ↓
  Layer 2: shapes (circle, square) শিখে
   ↓
  Layer 3: object parts (eye, wheel) শিখে
   ↓
  Layer 4: full object (face, car) শিখে
   ↓
  Output: "this is a cat"
```

এই hierarchical learning ই হলো deep learning এর মূল শক্তি। ছবি, টেক্সট, speech — সব ক্ষেত্রে এটা কাজ করে।

## কখন DL Use করবে?

Deep learning সব জায়গায় দরকার না। কিছু ক্ষেত্রে এটা অতিরিক্ত আর ক্ষতিকর:

**DL যখন দরকার:**
- বিশাল dataset (১ লক্ষ+ sample)
- Complex pattern — image, text, audio, video
- High accuracy দরকার
- Feature engineering কঠিন

```python
# image classification — DL perfect
# text generation — DL essential
# speech recognition — DL only option
```

**DL যখন দরকার না:**
- ছোট dataset (১০০০-এর কম)
- Simple tabular data
- Explainability দরকার
- Fast inference দরকার

> [!danger] ছোট ডেটায় DL ফাঁদ
> কম ডেটা দিয়ে deep neural network train করলে overfitting হয় — model training এ ভালো, কিন্তু নতুন ডেটায় খারাপ। ছোট dataset এ Random Forest, XGBoost use করো।

## Decision Guide — ML vs DL

```text
                ডেটা কত?
                 │
        ┌────────┴────────┐
        ▼                 ▼
     ছোট (<10K)       বড় (>100K)
        │                 │
        ▼                 ▼
  Traditional ML       ডেটা কী রকম?
  (XGBoost, RF)          │
                 ┌───────┴───────┐
                 ▼               ▼
             Tabular         Image/Text
                 │               │
                 ▼               ▼
            XGBoost         Deep Learning
            LightGBM        (CNN, Transformer)
```

> [!example] বাস্তব example
> Customer churn prediction (tabular) — XGBoost সেরা। Spam detection (text, ছোট) — Logistic Regression + TF-IDF। Image classification — CNN/ResNet। Chatbot — Transformer/LLM।

## Hardware Requirements

Deep learning এ hardware একটা বড় issue। CPU তে train করলে সপ্তাহ লেগে যাবে।

| Hardware | Speed | Price | Use |
|----------|-------|-------|-----|
| **CPU** | খুব slow | কম | ছোট model, inference |
| **GPU** | fast | মাঝারি | Training standard |
| **TPU** | খুব fast | বেশি | Google Colab, large model |
| **Cloud GPU** | fast | pay-per-use | সবচেয়ে practical |

```python
import torch

print("CUDA available:", torch.cuda.is_available())
print("Device:", "GPU" if torch.cuda.is_available() else "CPU")
```

> [!tip] ফ্রি GPU
> Google Colab তে ফ্রি GPU পাওয়া যায়। Kaggle এও। শুরু করার জন্য এগুলোই যথেষ্ট। পরে প্রয়োজনে AWS, GCP, Lambda Labs থেকে rent করো।

## Deep Learning Framework

DL এর জন্য কোড লিখতে framework লাগে। 2026 এ দুটো dominant:

- **PyTorch** — research এ রাজা, Pythonic, dynamic
- **TensorFlow/Keras** — production এ শক্ত, deployment friendly

`nn.Linear(3, 1)` হলো PyTorch-এ একটা single neuron — ৩টা input নিয়ে ১টা output দেয়। এর ভেতরে weight আর bias automatically তৈরি হয়। পরের chapter গুলোতে এর বিস্তারিত দেখবো।

```python
# PyTorch এ একটা simple neuron
import torch.nn as nn

neuron = nn.Linear(3, 1)   # 3 input, 1 output
```

## Summary

Deep learning হলো neural network এর অনেক layer দিয়ে automatic feature learning। ML এ মানুষ feature বানায়, DL এ model নিজে শেখে। বড় ডেটা আর complex pattern এ DL সেরা, ছোট ডেটায় traditional ML এখনো প্রাসঙ্গিক। GPU দরকার, কিন্তু Colab দিয়ে শুরু করা যায়। পরের chapter এ দেখবো একটা neural network কীভাবে কাজ করে ভেতরে ভেতরে।