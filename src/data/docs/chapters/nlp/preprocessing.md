# Text Preprocessing আর Tokenization

কল্পনা করো — তুমি একটা বিশাল text পেলে যেখানে কতো কথা লেখা। কিন্তু কম্পিউটার শুধু শুনে "আমি তোমাকে ভালোবাসি" এই বাক্যটা দেখলে কিছুই বোঝে না। কম্পিউটার তো সংখ্যা বোঝে। তাই এই ভাষাকে এমনভাবে পরিষ্কার আর সংখ্যায় রূপান্তর করতে হবে যেন model দিয়ে কাজে লাগানো যায়। এই পুরো কাজটাকেই বলে text preprocessing।

## Preprocessing কেন দরকার?

র কম্পিউটার text কে শুধু "character গুলোর সমষ্টি" হিসেবে দেখে — meaning বোঝে না। আর raw text এ থাকে punctuation, uppercase/lowercase মিশ্রণ, stop words, spelling mistake — সব ঝামেলা।

```text
Raw Text → "WOW!!! This movie was SOOO good... 😍"

Problem:
- "WOW" vs "wow" — একই কিন্তু কম্পিউটার আলাদা ভাবে
- "!!!" punctuation — noise
- "SOOO" spelling variation
- emoji — কীভাবে handle করবে?
```

> [!note]
> Preprocessing এর মূল উদ্দেশ্য হলো — text থেকে noise সরানো আর এমন ফরম্যাটে আনা যা model সহজে শিখতে পারে। খারাপ preprocessing = খারাপ model। এটাই NLP এর সবচেয়ে গুরুত্বপূর্ণ ধাপ।

## Lowercase আর Normalization

সবচেয়ে basic ধাপ — সব অক্ষর lowercase করা। কারণ কম্পিউটারের কাছে "Good", "good", "GOOD" এই তিনটে আলাদা শব্দ।

```python
text = "I LOVE Python Programming"

normalized = text.lower()
print(normalized)
# i love python programming
```

```python
import re

# Remove punctuation
text = "Hello!!! How are you??? I'm fine."
clean = re.sub(r"[^\w\s]", "", text)
print(clean)
# Hello How are you Im fine
```

> [!warn]
> সব সময় lowercasing করা ঠিক না। যদি NER করতে হয় (নাম চেনা), তখন "Apple" (কোম্পানি) আর "apple" (ফল) আলাদা — uppercase মূল্যবান information। কাজ অনুযায়ী সিদ্ধান্ত নাও।

## Tokenization — ভাঙা শব্দে

Tokenization হলো text কে ছোট ছোট টুকরো (token) করে ভাঙা। এটাই NLP এর ভিত্তি।

### Word Tokenization

সবচেয়ে সহজ — স্পেস ধরে ভাঙা।

```python
text = "I love learning natural language processing"

tokens = text.split()
print(tokens)
# ['I', 'love', 'learning', 'natural', 'language', 'processing']
```

কিন্তু সব সময় এত সহজ না। যেমন "don't", "I'm", "New York" — এগুলো tricky।

```python
from nltk.tokenize import word_tokenize

tokens = word_tokenize("I don't think so.")
print(tokens)
# ['I', 'do', "n't", 'think', 'so', '.']
```

### Subword Tokenization (BPE) — Modern Approach

LLM আমাদের শিখিয়েছে শব্দ না ভেঙে subword ভাঙতে। Byte Pair Encoding (BPE) হলো এই পদ্ধতি।

```text
"unhappiness"

Word token:     ["unhappiness"]         # একটাই token
Subword (BPE):  ["un", "happiness"]     # দুটো token
Character:      ["u","n","h","a",...]   # অনেক গুলো
```

BPE এর সুবিধা — অপরিচিত শব্দ ও চিনতে পারে। যেমন "unbelieveable" নতুন শব্দ হলেও BPE একে "un" + "believe" + "able" এ ভাঙবে।

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
tokens = tokenizer.tokenize("unhappiness")
print(tokens)
# ['un', '##ha', '##pp', '##iness']
```

> [!tip]
> Modern LLM গুলো (GPT-4, Llama, Claude) সবই subword tokenizer ব্যবহার করে। Word-level tokenization এখন শুধু classical NLP তে ব্যবহার হয়। Transformer era তে BPE বা SentencePiece হলো standard।

## Stop Words Removal

কিছু শব্দ থাকে যা বাক্যে অনেক বার আসে কিন্তু মূল অর্থে কোনো অবদান রাখে না। যেমন — "the", "is", "at", "which"। এদের stop word বলে।

```python
from nltk.corpus import stopwords

stop_words = set(stopwords.words("english"))
print(len(stop_words))   # 179

words = ["I", "love", "the", "movie", "and", "the", "acting"]
filtered = [w for w in words if w not in stop_words]
print(filtered)
# ['I', 'love', 'movie', 'acting']
```

> [!warn]
> Stop word removal সব সময় ভালো না। Sentiment analysis এ "not good" থেকে "not" সরালে অর্থ উল্টো হয়ে যায়! কাজ বুঝে remove করো।

## Stemming vs Lemmatization

দুটোই শব্দকে base form এ আনার চেষ্টা করে, কিন্তু পদ্ধতি আলাদা।

| Feature | Stemming | Lemmatization |
|---------|----------|---------------|
| পদ্ধতি | শব্দের tail কেটে দেয় | অভিধান দেখে সঠিক form |
| Speed | দ্রুত | ধীর |
| Accuracy | কম | বেশি |
| উদাহরণ | "running" → "run" | "better" → "good" |

```python
from nltk.stem import PorterStemmer, WordNetLemmatizer

stemmer = PorterStemmer()
lemmatizer = WordNetLemmatizer()

words = ["running", "ran", "runs", "easily", "better"]

print("Stemming:")
for w in words:
    print(f"  {w} → {stemmer.stem(w)}")
# running → run, ran → ran, runs → run, easily → easili, better → better

print("Lemmatization:")
for w in words:
    print(f"  {w} → {lemmatizer.lemmatize(w, pos='v')}")
# running → run, ran → run, runs → run, easily → easily, better → better
```

> [!tip]
> Stemming যদি দ্রুত ফলাফল লাগে (search engine, topic classification)। Lemmatization যদি সঠিক ফলাফল লাগে (chatbot, translation)। Production এ lemmatization বেশি ব্যবহার হয়।

## Bag of Words (BoW)

সবচেয়ে simple vectorization — কোন শব্দ কতবার আসলো সেটা গণনা করা।

```python
from sklearn.feature_extraction.text import CountVectorizer

docs = [
    "I love python",
    "python is great",
    "I love coding in python"
]

vectorizer = CountVectorizer()
matrix = vectorizer.fit_transform(docs)

print(vectorizer.get_feature_names_out())
# ['coding' 'great' 'in' 'is' 'love' 'python']

print(matrix.toarray())
# [[0 0 0 0 1 1]
#  [0 1 0 1 0 1]
#  [1 0 1 0 1 1]]
```

সমস্যা — "python" সব বাক্যে আছে কিন্তু এটা বিশেষ কিছু বোঝায় না। আবার "the", "is" এর মতো সাধারণ শব্দ বেশি বার আসে। সমাধান হলো TF-IDF।

## TF-IDF — গুরুত্ব বোঝা

TF-IDF (Term Frequency – Inverse Document Frequency) বোঝায় কোন শব্দ একটা document এ গুরুত্বপূর্ণ।

```text
TF-IDF = TF × IDF

TF     = একটা শব্দ একটা document এ কতবার আসলো
IDF    = log(মোট document সংখ্যা / যেসব doc এ শব্দটা আছে)

উচ্চ TF-IDF = শব্দটা এই doc এ specific
নিম্ন TF-IDF = শব্দটা সব জায়গায় আছে (সাধারণ)
```

```python
from sklearn.feature_extraction.text import TfidfVectorizer

docs = [
    "the cat sat on the mat",
    "the dog sat on the log",
    "cats and dogs are animals"
]

tfidf = TfidfVectorizer()
matrix = tfidf.fit_transform(docs)

import pandas as pd
df = pd.DataFrame(matrix.toarray(), columns=tfidf.get_feature_names_out())
print(df.round(2))
```

> [!example]
> "the" শব্দটা সব ডকুমেন্টে আছে তাই IDF কম, ফলে TF-IDF কম। কিন্তু "log" শুধু একটায় আছে, তাই IDF বেশি, TF-IDF বেশি। এভাবে model বোঝে কোন শব্দ আসলে গুরুত্বপূর্ণ।

## n-grams — Context যোগ করা

শুধু single word না, দুটো বা তিনটা শব্দ একসাথে নিলে context পাওয়া যায়।

```python
from sklearn.feature_extraction.text import CountVectorizer

vectorizer = CountVectorizer(ngram_range=(1, 2))
matrix = vectorizer.fit_transform(["not good", "very good"])

print(vectorizer.get_feature_names_out())
# ['not' 'not good' 'very' 'very good']
```

```text
Unigram (1-gram):  ["not", "good"]
Bigram (2-gram):   ["not good"]
Trigram (3-gram):  ["not very good"]
```

> [!tip]
> Sentiment analysis এ bigram খুব কাজে দেয়। "not good" এর অর্থ "not" আর "good" আলাদা আলাদা থেকে অনেক আলাদা। n-gram দিয়ে এই context ধরা যায়।

## spaCy Pipeline

spaCy একটা pipeline দিয়ে কাজ করে — tokenizer, tagger, parser, NER সব একসাথে।

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple is looking at buying a U.K. startup for $1 billion")

for token in doc:
    print(f"{token.text:15} {token.lemma_:15} {token.pos_:10} {token.is_stop}")
```

```text
Apple           apple           PROPN      False
is              be              AUX        True
looking         look            VERB       False
...
```

## বাংলা Text Handling

বাংলা text preprocessing একটু ঝামেলার কারণ — যুক্তাক্ষর, অনুস্বার, বিসর্গ।

```python
# Bengali text tokenization
text = "আমি ভাত খাই"

tokens = text.split()
print(tokens)
# ['আমি', 'ভাত', 'খাই']
```

বাংলার জন্য:
- `bnltk` বা `spacy-bn` library ব্যবহার করো
- SentencePiece tokenizer ভালো কাজ করে বাংলায়
- multilingual model (XLM-R, mBERT) ব্যবহার করো

> [!note]
> বাংলা একটা morphologically rich language — একই root থেকে অনেক word form হয়। "খাই", "খাও", "খায়", "খাব" — সব "খা" root থেকে। তাই lemmatization বাংলায় খুব জরুরি কিন্তু কঠিন।

## Summary

- Preprocessing হলো NLP এর ভিত্তি — খারাপ preprocessing = খারাপ model
- Lowercase, punctuation removal, tokenization — basic ধাপ
- Subword tokenization (BPE) হলো modern standard (LLM গুলো এটাই ব্যবহার করে)
- Stop words, stemming, lemmatization — text clean করার টুল
- Bag of Words আর TF-IDF — text কে vector এ রূপান্তর
- n-grams দিয়ে context ধরা যায়

পরের chapter এ আমরা এই preprocessing গুলো ব্যবহার করে একটা real project বানাবো — SMS spam classifier! চলো এগোই!