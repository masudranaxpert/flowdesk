# NLP কী ও কোথায় ব্যবহার

মন করো তুমি একটা মেসেজ পেলে — "আজকের খাবারটা ছিল আগুন!" এখন মানুষ সাথে সাথে বুঝে যাবে খাবারটা খুব ঝাল ছিল, কিন্তু খুব ভালো ছিল। কিন্তু একটা কম্পিউটার যদি এই মেসেজ পড়ে বুঝতে পারে যে মানুষটা খুশি কি দুঃখিত — সেটাই NLP। Natural Language Processing — মানুষের ভাষা কম্পিউটারকে বোঝানো।

## NLP আসলে কী?

NLP হলো AI এর এমন একটা branch যেখানে কম্পিউটারকে শেখানো হয় মানুষের ভাষা — বাংলা, English, হিন্দি যেকোনো ভাষা — বুঝতে আর তৈরি করতে। মূল কাজ দুটো:

- **Understanding** — ভাষা পড়ে মানে বোঝা (sentiment, intent, entity)
- **Generation** — ভাষা লেখা বা বলা

```text
"আজকের খাবারটা ছিল আগুন!"
        │
        ▼
   ┌─────────┐
   │   NLP   │ ──► Sentiment: Positive
   │  Model  │ ──► Intent: Review
   └─────────┘ ──► Topic: Food
```

> [!note]
> NLP এর পুরো নাম Natural Language Processing। "Natural" মানে — মানুষের স্বাভাবিক ভাষা, programming language নয়। Python বা C++ নয়, বরং কথা বলার ভাষা।

## NLP কী কী কাজ করে?

NLP দিয়ে অনেক রকমের কাজ হয়। চলো মূল কাজ গুলো দেখি:

| Task | কী করে | উদাহরণ |
|------|---------|---------|
| **Sentiment Analysis** | মন ভাব বোঝে | "ভালো লেগেছে" → Positive |
| **Translation** | এক ভাষা থেকে আরেক ভাষা | English → বাংলা |
| **Summarization** | বড় লেখা ছোট করে | 10 পৃষ্ঠা → 1 paragraph |
| **Chatbot** | কথা বলে উত্তর দেয় | ChatGPT, Gemini |
| **NER** | নাম চেনে | "Karim Dhaka যাবে" → Person, Place |
| **Question Answering** | প্রশ্নের উত্তর দেয় | "রাজধানী কী?" → Dhaka |

> [!example]
> তুমি Gmail এ যখন মেইল লেখো, আর নিচে আসলে "Smart Reply" সাজেশন আসে — "Thanks!", "Sounds good!" — সেটা NLP। Google Translate আর Grammarly ও NLP দিয়ে কাজ করে।

## NLP কেন কঠিন?

কথাটা সহজ শোনালেও আসলে NLP খুব কঠিন। কারণ মানুষের ভাষা কঠিন:

**1. Ambiguity (অস্পষ্টতা):** একই শব্দের একাধিক অর্থ হয়।

```text
"ব্যাংক এ যাবো"

ব্যাংক = Bank (টাকার)?
ব্যাংক = River bank (নদীর পাড়)?
```

কম্পিউটার বুঝবে কীভাবে কোন ব্যাংক বোঝানো হয়েছে?

**2. Context (প্রসঙ্গ):** আগের কথা না জানলে মানে বোঝা যায় না।

```text
"সে খুব ভালো ছেলে। কিন্তু আজকে খুব রাগী।"
```

শুধু "খুব রাগী" পড়লে মনে হবে ছেলেটা খারাপ, কিন্তু আগের কথা পড়লে বোঝা যায় context।

**3. Sarcasm (কটাক্ষি):**

```text
"অসাধারণ! আবার ৩ ঘণ্টা traffic jam এ আটকে আছি!"
```

শব্দ গুলো positive কিন্তু মানে negative। এটা কম্পিউটারের জন্য দুঃসাধ্য।

> [!warn]
> Sarcasm detection এখনো NLP এর সবচেয়ে কঠিন problem গুলোর একটা। এতে LLM গুলোও অনেক সময় ভুল করে।

## NLP Pipeline — কাজ করবে কীভাবে?

একটা NLP system সাধারণত এই pipeline মেনে কাজ করে:

```text
Raw Text
   │
   ▼
Tokenize ──── ভাঙা শব্দে
   │
   ▼
Preprocess ── clean, normalize
   │
   ▼
Model ─────── neural network / classifier
   │
   ▼
Output ────── result
```

ধরো "ভালো মুভি ছিল!" এই মেসেজটার জন্য:

```text
1. Raw Text:     "ভালো মুভি ছিল!"
2. Tokenize:     ["ভালো", "মুভি", "ছিল"]
3. Preprocess:   lowercase, clean
4. Model:        sentiment classifier
5. Output:       Positive (0.95)
```

## NLP এর ইতিহাস — সংক্ষেপে

NLP আজকে যেমন powerful, একদম শুরুতে এমন ছিল না। চলো ইতিহাস দেখি:

```text
1950s        1990s         2010s         2017+          2026
  │            │              │              │             │
  ▼            ▼              ▼              ▼             ▼
Rule-based → Statistical → Neural    → Transformer  → LLM Era
(grammar)   (probablity)  (RNN/LSTM)   (Attention)    (GPT-4)
```

**Rule-based (1950s–1980s):** মানুষ হাতে নিয়ম লিখতো। "যদি 'খারাপ' শব্দ থাকে তবে negative"। কিন্তু ভাষা এত সহজ না।

**Statistical (1990s–2010s):** Probability আর math দিয়ে। Naive Bayes, TF-IDF এই যুগের জিনিস।

**Neural (2010s):** RNN আর LSTM আসলো। কিন্তু এরা slow আর দূরের context ভুলে যেতো।

**Transformer (2017):** "Attention Is All You Need" paper আসলো। পুরো দুনিয়া বদলে গেলো।

**LLM Era (2020+):** GPT-3, GPT-4, Llama, Claude — বিশাল মডেল যারা প্রায় সব ভাষায় কথা বলতে পারে।

> [!tip]
> 2017 সালের Transformer paper টা NLP এর ইতিহাসে সবচেয়ে গুরুত্বপূর্ণ turning point। এখনকার সব AI — ChatGPT, Gemini, Claude — এই একই architecture এ দাঁড়িয়ে আছে।

## Python NLP Ecosystem

Python হলো NLP এর মূল ভাষা। চলো দেখি প্রধান library গুলো:

### NLTK — Classic Library

NLTK হলো সবচেয়ে পুরোনো NLP library। শিখতে ভালো, কিন্তু production এ কম ব্যবহার হয়।

```python
import nltk
from nltk.tokenize import word_tokenize

text = "I love learning NLP"
tokens = word_tokenize(text)
print(tokens)   # ['I', 'love', 'learning', 'NLP']
```

### spaCy — Production Ready

spaCy হলো দ্রুত আর efficient। Industry তে বেশি ব্যবহার হয়।

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple is looking at buying U.K. startup")

for ent in doc.ents:
    print(ent.text, ent.label_)
# Apple ORG
# U.K. GPE
```

### Hugging Face Transformers — Modern Era

আজকের যুগে রাজা হলো Hugging Face। এখানে থাকে হাজার হাজার pre-trained model — BERT, GPT, Llama, সব।

```python
from transformers import pipeline

classifier = pipeline("sentiment-analysis")
result = classifier("I absolutely love this!")
print(result)
# [{'label': 'POSITIVE', 'score': 0.9998}]
```

> [!tip]
> তুমি যদি আজকে NLP শুরু করো — সোজা Hugging Face transformers দিয়ে শুরু করো। NLTK আর spaCy জানা থাকলে ভালো, কিন্তু modern NLP এ transformers এর কোনো বিকল্প নেই।

## রিয়েল ওয়ার্ল্ড Application

NLP আজকে সব জায়গায় ব্যবহার হচ্ছে:

| কোথায় | কীভাবে NLP |
|---------|------------|
| **ChatGPT / Gemini** | কথা বলা, প্রশ্নের উত্তর |
| **Google Search** | query বুঝে result দেওয়া |
| **Google Translate** | ভাষা অনুবাদ |
| **Alexa / Siri** | voice command বোঝা |
| **Spam Filter** | খারাপ মেইল আলাদা করা |
| **Grammarly** | লেখার ভুল ধরা |
| **Recommendation** | review পড়ে পণ্য সাজেস্ট |

```python
# Translation with Hugging Face
from transformers import pipeline

translator = pipeline("translation_en_to_bn", model="Helsinki-NLP/opus-mt-en-bn")
text = "I am learning natural language processing"
print(translator(text))
```

> [!example]
> বাংলা NLP এর জন্য বিশেষ model লাগে। Hugging Face এ "bangla-bert" বা "xlm-roberta" এর মতো multilingual model কাজ করে। sentencepiece tokenizer ব্যবহার করলে ভালো।

## এই Chapter এ কী শিখলে?

- NLP = কম্পিউটারকে মানুষের ভাষা বোঝানো
- মূল tasks — sentiment, translation, summarization, chatbot, NER
- কঠিন কারণ — ambiguity, context, sarcasm
- Pipeline: text → tokenize → preprocess → model → output
- ইতিহাস: rule-based → statistical → neural → transformer → LLM
- Python ecosystem: NLTK, spaCy, Hugging Face

পরের chapter এ আমরা text preprocessing আর tokenization গভীরভাবে দেখবো। কীভাবে র কম্পিউটার একটা sentence কে ছোট ছোট টুকরো করে — সেটাই শিখবো। চলো এগোই!