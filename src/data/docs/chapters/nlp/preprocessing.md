# Text Preprocessing আর Tokenization

NLP project শুরু করার আগে একটা জিনিস সবার আগে করতে হয় — raw text কে clean আর সুন্দর করা। এটাকেই বলে preprocessing। অনেকে এটা এড়িয়ে যায়, সরাসরি model এ ফেলে দেয়। কিন্তু সত্যি কথা হলো — ভালো preprocessing করলে model এর accuracy ১০-২০% পর্যন্ত বেড়ে যেতে পারে।

## Preprocessing কেন দরকার?

মেশিন তো মানুষের মতো পড়তে পারে না। যদি তুমি "Movie টা SUPER ভালো ছিল!!! 😍" লিখো, machine কে এটা confusion এ ফেলে দেয় — বড় হাতের অক্ষর, punctuation, emoji সব মিলিয়ে। preprocessing দিয়ে এই ঝামেলা গুলো পরিষ্কার করা হয়।

```text
Raw Text: "Movie টা SUPER ভালো ছিল!!! 😍"
            │
            ▼
     [ Preprocessing ]
            │
            ▼
Clean Text: "movie টা super ভালো ছিল"
```

## Step 1 — Lowercase আর Normalization

সবচেয়ে প্রথম step — সব অক্ষর ছোট হাতের করা। "Apple" আর "apple" মেশিনের কাছে দুটো আলাদা word। lowercase করলে দুটো এক হয়ে যায়।

```python
text = "Python is AWESOME and Powerful"
cleaned = text.lower()
print(cleaned)   # "python is awesome and powerful"
```

Normalization এর মধ্যে আরো পড়ে — accent সরানো, unicode fix করা, extra space সরানো।

```python
import re

text = "Hello   world!  How   are  you?"
cleaned = re.sub(r"\s+", " ", text).strip()
print(cleaned)   # "Hello world! How are you?"
```

> [!tip] সবসময় lowercase করবে না
> Named Entity Recognition এর মতো task এ বড় হাতের অক্ষর কাজে লাগে। "Apple" (company) আর "apple" (fruit) আলাদা। Task বুঝে decide করো।

## Step 2 — Tokenization

Tokenization হলো লেখাকে ছোট ছোট piece এ ভাগ করা। এই piece গুলোকে token বলে।

### Word Tokenization

সবচেয়ে সহজ পদ্ধতি — space আর punctuation ধরে ভাগ করা।

NLTK-এর `word_tokenize()` function একটা sentence কে word-level token এ ভাগ করে — space আর punctuation দুটোকেই ধরে। `nltk.download("punkt")` দিয়ে tokenizer-এর জন্য দরকারি data একবার download করতে হয় (প্রথমবার ছাড়া আর লাগে না)।

```python
from nltk.tokenize import word_tokenize
import nltk
nltk.download("punkt")
nltk.download("punkt_tab")

text = "I love learning NLP, it's amazing!"
tokens = word_tokenize(text)
print(tokens)
```

```text
['I', 'love', 'learning', 'NLP', ',', 'it', "'s", 'amazing', '!']
```

### Subword Tokenization (BPE)

2026 এর যুগে সবচেয়ে ব্যবহৃত হয় subword tokenization। LLM গুলো (GPT, Claude, Llama) সব এটাই use করে। এর পেছনে কারণ আছে — শব্দ ভাঙ্গলে rare word আর নতুন word ও handle করা যায়।

Hugging Face-এর `AutoTokenizer.from_pretrained("bert-base-uncased")` দিয়ে BERT-এর tokenizer load করা হয়। `from_pretrained` method একটা pre-trained model-এর tokenizer download করে আনে — এটা জানে কীভাবে শব্দ ভাগ করতে হয় সেই model-এর জন্য। `.tokenize()` method টেক্সট কে subword piece এ ভাঙে।

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
tokens = tokenizer.tokenize("unbelievably amazing")
print(tokens)
```

```text
['un', '##bel', '##ieva', '##bly', 'amazing']
```

দেখো — "unbelievably" ভেঙে গেলো ছোট ছোট piece এ। এটাকে WordPiece (BPE এর ভাই) বলে।

> [!note] BPE কেন দরকার
> BPE (Byte Pair Encoding) দিয়ে মেশিন নতুন শব্দও বানাতে পারে। "ChatGPT" শব্দটা যদি training এ না থাকে, তবু "Chat" + "G" + "PT" ভাঙ্গে বুঝে যায়।

## Step 3 — Stop Words Removal

"the", "is", "in", "at" — এই সব word কে stop word বলে। এগুলো দিয়ে বাক্যে মানে এতো আসে না, কিন্তু ফাইল বড় করে। তাই সরিয়ে ফেলা হয়।

```python
from nltk.corpus import stopwords
nltk.download("stopwords")

text = "this is a really good movie and i love it"
stop_words = set(stopwords.words("english"))
words = text.split()
filtered = [w for w in words if w not in stop_words]
print(filtered)
```

```text
['really', 'good', 'movie', 'love']
```

> [!warn] Classification এ সাবধান
> Sentiment analysis এ "not" একটা stop word কিন্তু মানে পাল্টে দেয়। "not good" আর "good" আলাদা। Task বুঝে stop word remove করো।

## Step 4 — Stemming vs Lemmatization

দুটোই একই কাজ করে — শব্দকে base form এ আনে। কিন্তু পদ্ধতি আলাদা।

| বিষয় | Stemming | Lemmatization |
|-------|----------|---------------|
| পদ্ধতি | Rule দিয়ে কেটে দেয় | Dictionary দেখে |
| Accuracy | কম | বেশি |
| Speed | Fast | Slow |
| উদাহরণ | "running" → "run" | "better" → "good" |

`PorterStemmer` একটা rule-based algorithm — suffix কেটে দিয়ে base form বানায় (যেমন "running" → "run", কিন্তু "better" → "bet" — ভুল হতে পারে কারণ dictionary দেখে না)। `WordNetLemmatizer` একটা dictionary-based approach — আসল base form (lemma) খুঁজে বের করে (যেমন "better" → "good"), কিন্তু `pos` parameter দিতে হয় (যেমন `pos="a"` মানে adjective) নাহলে সঠিক result আসে না।

```python
from nltk.stem import PorterStemmer, WordNetLemmatizer
nltk.download("wordnet")

stemmer = PorterStemmer()
lemma = WordNetLemmatizer()

word = "running"
print(stemmer.stem(word))      # run
print(lemma.lemmatize(word))   # running (need POS tag)
print(lemma.lemmatize("better", pos="a"))   # good
```

> [!tip] কোনটা use করবে
> Production এ যাও লেম্মাটাইজেশন। Research এ বা স্পিড দরকার হলে stemming। একটা কাজ করলেই হবে, দুটো দরকার নেই।

## Step 5 — Punctuation আর Number

খাতা clean করার শেষ ধাপ। punctuation আর number সরানো।

```python
import re

text = "Call me at 01712345678! Price: $500 only."
clean_text = re.sub(r"[^a-zA-Z\s]", "", text)
print(clean_text)
```

```text
Call me at   Price  only
```

কিন্তু সব context এ সব সরানো ঠিক না। Phone number, price যদি কাজের তথ্য হয়, সরালে মানে নষ্ট হবে।

## Bag of Words (BoW)

এবার আসি vectorization এ। মেশিন number ছাড়া কিছু বোঝে না। তাই টেক্সটকে number এ রূপান্তর করতে হয়। সবচেয়ে সহজ পদ্ধতি BoW।

```python
from sklearn.feature_extraction.text import CountVectorizer

docs = [
    "I love python",
    "python is great",
    "I love coding"
]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(docs)
print(vectorizer.get_feature_names_out())
print(X.toarray())
```

```text
['coding' 'great' 'is' 'love' 'python']
[[0 0 0 1 1]
 [0 1 1 0 1]
 [1 0 0 1 0]]
```

দেখো — প্রতিটা word এর জন্য একটা column, আর যতবার word টা এসেছে সেটা count।

## TF-IDF — BoW এর উন্নত রূপ

BoW এর সমস্যা — "the", "is" এই সব word সব document এ আছে, কিন্তু কোনো বিশেষ মানে নেই। TF-IDF এই সমস্যা সমাধান করে।

**Formula:**

```text
TF-IDF = TF × IDF

TF     = (word count) / (total words in doc)
IDF    = log(total docs / docs containing this word)
```

ইনটুইশন: যে word টা অল্প document এ আছে কিন্তু যেখানে আছে সেখানে বেশি — সেটা important। যেমন "DNA" শব্দটা biology article এ বেশি, সাধারণ লেখায় না। এটার TF-IDF বেশি হবে।

```python
from sklearn.feature_extraction.text import TfidfVectorizer

docs = [
    "the cat sat on the mat",
    "the dog sat on the log",
    "python programming is fun"
]

tfidf = TfidfVectorizer()
X = tfidf.fit_transform(docs)
print(tfidf.get_feature_names_out())
print(X.toarray().round(3))
```

## N-grams — Context ধরার উপায়

একটা word দেখলেই সব মানে বোঝা যায় না। দুটো word একসাথে থাকলে মানে আলাদা। "not good" — এখানে "not" আর "good" আলাদা আলাদা positive আর negative। এটা ধরতে n-gram লাগে।

```python
vectorizer = CountVectorizer(ngram_range=(1, 2))
X = vectorizer.fit_transform(["not good at all"])
print(vectorizer.get_feature_names_out())
```

```text
['all' 'at' 'good' 'not' 'not good']
```

দেখো — "not good" একটা আলাদা token হয়ে গেলো।

> [!tip] N-gram এর জাদু
> Sentiment analysis এ bigram (২ টার গ্রুপ) use করলে accuracy বাড়ে। কিন্তু n বড় করলে feature সংখ্যা বিস্ফোরণ ঘটায়। ১-২ এর মধ্যে রাখো।

## spaCy Pipeline — Production Ready

spaCy দিয়ে এক লাইনেই সব preprocessing পাওয়া যায়। tokenization, POS tagging, NER — সব।

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple is looking at buying a U.K. startup for $1 billion")

for token in doc:
    print(token.text, "|", token.lemma_, "|", token.pos_)
```

এক pipeline এ সব হয়ে যাচ্ছে — এটাই spaCy এর শক্তি।

## Bengali Text এর ক্ষেত্রে

Bengali text এর preprocessing আলাদা। কারণ — word boundary detect করা কঠিন, stop word list আলাদা, conjunct অক্ষর আছে।

```python
# Bengali stop word example
bengali_stopwords = {"এই", "সেই", "আমি", "তুমি", "এবং", "বা", "কিন্তু"}

text = "আমি বই পড়ি এবং খুব ভালোবাসি"
words = text.split()
filtered = [w for w in words if w not in bengali_stopwords]
print(" ".join(filtered))   # বই পড়ি খুব ভালোবাসি
```

> [!example] Bnlp আর bnltk
> Bengali NLP এর জন্য `bnlp` আর `bnltk` নামে দুটো library আছে। Bengali tokenization, stemming, NER — সব করা যায়।

## Summary

Preprocessing হলো NLP এর ভিত্তি। lowercase, tokenization, stop word removal, stemming/lemmatization, vectorization (BoW, TF-IDF) — এই ধাপ গুলো সঠিকভাবে করতে পারলে model নিজে থেকেই ভালো perform করবে। পরের chapter এ দেখবো কীভাবে এই feature গুলো দিয়ে classification model বানানো যায়।