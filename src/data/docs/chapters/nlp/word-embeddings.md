## One-Hot আর TF-IDF — কেন সীমিত?

পুরোনো NLP-তে word-কে represent করার জন্য one-hot encoding বা TF-IDF ব্যবহার হতো। কিন্তু এগুলোর বড় সীমাবদ্ধতা আছে:

| | One-Hot | TF-IDF | Word Embedding |
|---|---|---|---|
| Dimension | vocabulary size (অনেক বড়) | vocabulary size | ছোট (100-300) |
| Sparsity | প্রায় সব 0 | প্রায় সব 0 | dense |
| Meaning | না | না | **হ্যাঁ** |
| Similarity | সব word সমান দূরে | সব word সমান দূরে | related word কাছাকাছি |

One-hot-এ "cat" আর "dog" একদম আলাদা, "cat" আর "car"-ও একদম আলাদা — অথচ "cat" আর "dog"-এর meaning কাছে। এই meaning capture করতেই word embedding দরকার।

## Distributional Hypothesis — মূল ভিত্তি

NLP-র সবচেয়ে গুরুত্বপূর্ণ ধারণা:

> "You shall know a word by the company it keeps." — J.R. Firth

মানে — একটা word-এর meaning বোঝা যায় তার চারপাশে কোন কোন word আসে সেটা থেকে। যেমন:

```text
"The ___ is barking"     → dog
"The ___ is meowing"     → cat
"I drove my ___ to work" → car
```

একই context-এ আসা word-গুলোর meaning কাছাকাছি — এই ভিত্তিতেই word embedding তৈরি।

## Word2Vec — CBOW আর Skip-gram

Google-এর 2013 সালের breakthrough। দুটো variant আছে:

### CBOW (Continuous Bag of Words)

Context word-গুলো থেকে middle word predict করো:

```text
Input: "the cat sits on the"
Target: "mat"

CBOW: [the, cat, sits, on, the] → predict → "mat"
```

### Skip-gram

Middle word থেকে context word predict করো:

```text
Input: "mat"
Target: ["the", "cat", "sits", "on", "the"]

Skip-gram: "mat" → predict → context words
```

> [!tip] CBOW বনাম Skip-gram
# CBOW fast আর frequent word-এর জন্য ভালো। Skip-gram ধীর কিন্তু rare word-এর জন্য ভালো — প্রতিটা word-এর অনেক training example তৈরি করে। সাধারণত skip-gram default choice।

## GloVe — Global Vectors

Stanford-এর GloVe algorithm word2vec-এর alternative। word2vec local context window use করে, GloVe পুরো corpus-এর **co-occurrence statistics** ব্যবহার করে — কোন word কোন word-এর সাথে কতবার এসেছে।

```text
Co-occurrence matrix:
        cat  dog  car  drive
cat  ─ [ 5    8    1    0  ]
dog  ─ [ 8    5    1    1  ]
car  ─ [ 1    1    5    9  ]
drive─ [ 0    1    9    5  ]
```

GloVe এই matrix থেকে dense vector learn করে।

## Dense Vector — Meaning Capture করে

Embedding-এ প্রতিটা word একটা dense vector (যেমন 300 dimension)। মজার ব্যাপার হলো — এই vector-গুলো meaning-এর pattern capture করে। সবচেয়ে বিখ্যাত উদাহরণ:

$$\vec{king} - \vec{man} + \vec{woman} \approx \vec{queen}$$

মানে — king-এ man-এর ধারণা বাদ দিয়ে woman যোগ করলে queen পাওয়া যায়! Vector arithmetic দিয়ে meaning relationship capture হয়।

### Cosine Similarity

দুটো word কতটা similar সেটা measure করতে cosine similarity ব্যবহার করা হয়:

$$\text{similarity}(A, B) = \frac{\vec{A} \cdot \vec{B}}{|\vec{A}| \times |\vec{B}|}$$

মানে -১ থেকে ১ এর মধ্যে — ১ মানে একই direction, ০ মানে unrelated।

```python
from numpy import dot
from numpy.linalg import norm

def cosine_sim(v1, v2):
    return dot(v1, v2) / (norm(v1) * norm(v2))
```

## Static বনাম Contextual Embedding

Word2Vec/GloVe একটা সমস্যা — প্রতিটা word-এর শুধু একটাই vector। কিন্তু "bank" word-টার দুটো meaning: river bank আর money bank। Static embedding এই পার্থক্য ধরতে পারে না।

| | Static (word2vec) | Contextual (BERT) |
|---|---|---|
| Vector সংখ্যা | word প্রতি ১টা | word প্রতি অনেক (context অনুযায়ী) |
| "bank" meaning | একই vector | sentence অনুযায়ী আলাদা |
| Year | 2013 | 2018+ |

BERT-এ "I went to the **bank** to deposit money" আর "I sat by the river **bank**" — এই দুটো "bank"-এর vector আলাদা হবে, কারণ BERT পুরো sentence context বুঝে vector তৈরি করে।

> [!note] Contextual embedding-এর যুগ
# 2026-এ static embedding (word2vec) শেখা তবুও দরকার — concept হিসেবে। কিন্তু production-এ sentence-transformers বা transformer-ভিত্তিক contextual embedding ব্যবহার করাই modern উপায়।

## gensim দিয়ে Pretrained Model লোড

শুরু থেকে word2vec train করতে গেলে বিশাল corpus লাগবে। কিন্তু pretrained model download করে সরাসরি ব্যবহার করা যায়:

`gensim.downloader` দিয়ে pretrained word embedding model download করা যায়। `api.load("word2vec-google-news-300")` Google-এর প্রশিক্ষিত ৩০০-ডাইমেনশন word2vec model লোড করে। `model.most_similar("king")` দিয়ে সবচেয়ে similar word গুলো খোঁজা যায়। `positive` আর `negative` parameter দিয়ে analogy করা যায় — যেমন king - man + woman ≈ queen। `model.similarity("cat", "dog")` দুটো word-এর cosine similarity score দেয় (০ থেকে ১)।

```python
import gensim.downloader as api

# Pretrained word2vec model লোড করো (Google News, 300 dimension)
model = api.load("word2vec-google-news-300")

# Similar word খুঁজে বের করো
print(model.most_similar("king", topn=5))
# [('kings', 0.74), ('queen', 0.71), ('monarch', 0.65), ...]

# Analogy: king - man + woman ≈ queen
result = model.most_similar(
    positive=["king", "woman"],
    negative=["man"],
    topn=3
)
print(result)
# [('queen', 0.71), ('monarch', 0.66), ...]

# দুটো word-এর similarity
print(model.similarity("cat", "dog"))    # ~0.76
print(model.similarity("cat", "car"))    # ~0.20
```

## Practical — Pretrained Embedding দিয়ে Similar Word খোঁজা

নিচের কোডে GloVe-এর একটা ছোট pretrained model (`glove-wiki-gigaword-100`) ব্যবহার করা হয়েছে। `most_similar` দিয়ে similar word খোঁজা, analogy (`positive` আর `negative` parameter), আর `doesnt_match` দিয়ে odd-one-out খোঁজা — তিনটি common embedding operation দেখানো হয়েছে।

```python
import gensim.downloader as api
import numpy as np

# ১. Model লোড
print("Downloading model (প্রথমবার সময় লাগবে)...")
model = api.load("glove-wiki-gigaword-100")  # GloVe 100-dim, ছোট

# ২. Similar words
print("\nSimilar to 'computer':")
for word, score in model.most_similar("computer", topn=5):
    print(f"  {word}: {score:.3f}")

# ৩. Analogy: paris - france + germany ≈ berlin
print("\nAnalogy: paris - france + germany = ?")
result = model.most_similar(
    positive=["paris", "germany"],
    negative=["france"],
    topn=3
)
for word, score in result:
    print(f"  {word}: {score:.3f}")

# ৪. Odd one out
print("\nOdd one out in [breakfast, lunch, dinner, car]:")
odd = model.doesnt_match(["breakfast", "lunch", "dinner", "car"])
print(f"  {odd}")
```

> [!example] sentence-transformers — modern alternative
# পুরো sentence বা paragraph-কে embedding করতে চাইলে `sentence-transformers` library ব্যবহার করো। এটা BERT-ভিত্তিক contextual embedding দেয় — meaning-based search, clustering, semantic similarity — সবকিছুর জন্য 2026-এ এটাই standard।