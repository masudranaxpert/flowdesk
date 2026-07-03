# NLP কী ও কোথায় ব্যবহার

NLP বা Natural Language Processing হলো AI এর সেই branch যেখানে computer কে মানুষের ভাষা বোঝাতে আর ব্যবহার করতে শেখানো হয়। 2026 সালে এসে এটা এতোটাই জীবনের অংশ হয়ে গেছে যে তুমি দিনে অন্তত দশবার NLP use করছো — নিজে টেরও না পেয়ে।

## NLP কী?

ভাবো তো — তুমি Google এ "আজকে ঢাকায় বৃষ্টি হবে কিনা" লিখলে, Google বুঝে যায় তুমি weather জানতে চাইছো। এটা কীভাবে? কারণ Google এর পেছনে NLP model কাজ করে — তোমার কথাটা পড়ে, মানে বুঝে, সঠিক উত্তর দেখায়।

NLP মূলত দুটো জিনিস নিয়ে কাজ করে:

- **NLU** (Natural Language Understanding) — ভাষা বোঝা
- **NLG** (Natural Language Generation) — ভাষা তৈরি করা

```text
মানুষের ভাষা  ──►  [ NLP System ]  ──►  কম্পিউটার বুঝলো / উত্তর দিলো
   (Bangla/Eng)      (Tokenize,         (Answer, Action,
                      Parse, ML)          Translation)
```

## NLP এর মূল Task গুলো

NLP এ অনেক রকমের কাজ আছে। প্রতিটা জিনিস আলাদা problem। চলো মূল গুলো দেখি:

| Task | কী করে | উদাহরণ |
|------|--------|--------|
| **Sentiment Analysis** | কথার ভেতরের আবেগ বোঝে | "এই movie টা দারুণ!" → Positive |
| **Translation** | এক ভাষা থেকে আরেক ভাষায় | Bangla → English |
| **Summarization** | বড় লেখা সংক্ষেপ করে | পুরো article → ৩ লাইন |
| **Chatbot** | মানুষের সাথে কথা বলে | ChatGPT, Gemini |
| **NER** (Named Entity Recognition) | নাম চিনে নেয় | "Karim Dhaka যাবে" → Person, Place |

> [!tip] প্রথমে নজর দাও
> Beginner হিসেবে sentiment analysis আর text classification দিয়ে শুরু করো। এগুলো সহজ, ডেটা বেশি, আর দ্রুত result পাওয়া যায়।

## NLP কেন কঠিন?

খাতা কথা বলা সহজ মনে হলেও, machine কে বোঝানো খুব কঠিন। কারণ মানুষের ভাষায় অনেক ঝামেলা আছে:

**১. Ambiguity (এক কথায় অনেক মানে)**

"ব্যাংক" বলতে কী বোঝাচ্ছি — নদীর পাড় নাকি টাকার ব্যাংক? Context ছাড়া বোঝা যায় না।

**২. Context নির্ভরতা**

"The trophy didn't fit into the brown suitcase because it was too small."

এখানে "it" কে? Trophy নাকি suitcase? মানুষ বুঝে যায়, machine কে শেখাতে হয়।

**৩. Sarcasm আর Irony**

"খুব দারুণ দিন কাটলো! 🙄" — কথাটা positive কিন্তু আসলে negative বোঝানো হয়েছে।

> [!warn] Sarcasm এক বড় সমস্যা
> 2026 এর LLM গুলোও sarcasm মাঝে মাঝে মিস করে। এটা এখনো NLP এর unsolved area গুলোর একটা।

## NLP Pipeline — মূল ধাপ গুলো

যেকোনো NLP project এ একটা pipeline থাকে। কাঁচা টেক্সট থেকে ফলাফল পর্যন্ত পৌঁছাতে যে ধাপ গুলো দরকার:

```text
[ Raw Text ] ──► [ Preprocessing ] ──► [ Tokenization ] ──► [ Model ] ──► [ Output ]
   "Movie       lowercase, remove     ছোট ছোট         neural       Positive!
    টা ভালো"     punctuation          token এ ভাগ      network
```

ধাপ গুলো একটু খুলে দেখি:

1. **Raw Text** — তোমার কাছে কাঁচা লেখা
2. **Preprocessing** — ছোট হাতের করা, punctuation সরানো, clean করা
3. **Tokenization** — লেখাকে ছোট ছোট piece এ ভাগ করা
4. **Model** — ML/DL model এ ঢুকিয়ে দেওয়া
5. **Output** — ফলাফল পাওয়া

## NLP এর ইতিহাস — চারটা Era

NLP এর যাত্রা মূলত চারটা পর্যায়ে ভাগ করা যায়:

```text
[ 1950s ]      [ 1990s ]        [ 2010s ]         [ 2017+ ]
Rule-based  ►  Statistical  ►   Neural NLP  ►    Transformer/LLM
Grammar        HMM, CRF,         RNN, LSTM         BERT, GPT,
Rules          TF-IDF            Word2Vec          Claude, Llama
```

- **Rule-based (1950s-80s)**: হাতে হাতে grammar rule লিখতে হতো। খুব সীমিত।
- **Statistical (1990s-2010)**: Probability আর math দিয়ে language pattern বোঝা। Naive Bayes, HMM এর যুগ।
- **Neural (2013-2017)**: Neural network আসলো। Word2Vec, RNN, LSTM — অনেক উন্নতি।
- **Transformer era (2017-এখন)**: "Attention is All You Need" paper পাল্টে দিয়েছে। এখন LLM এর রাজত্ব।

> [!note] দারুণ fact
> 2017 সালে Google এর "Attention is All You Need" paper টা NLP কে পুরো পাল্টে দিয়েছিল। এখন 2026 — দুনিয়া চলছে transformer আর LLM দিয়ে।

## Python NLP Ecosystem

Python NLP এর জন্য একটা টন library আছে। মূল গুলো চিনে নিই:

| Library | কাজ | Level |
|---------|-----|-------|
| **NLTK** | পুরোনো, classic NLP tasks | Beginner |
| **spaCy** | Fast, production-ready | Intermediate |
| **Hugging Face transformers** | BERT, GPT সব LLM | Advanced |
| **Gensim** | Topic modeling, word2vec | Intermediate |
| **TextBlob** | সহজ sentiment analysis | Beginner |

`TextBlob` হলো একটা beginner-friendly NLP library। `TextBlob(text)` একটা object বানায়, আর `.sentiment.polarity` দিয়ে -১ থেকে ১ এর মধ্যে sentiment score দেয় — ১ মানে খুব positive, -১ মানে খুব negative।

```python
# quick sentiment check with TextBlob
from textblob import TextBlob

text = "This movie is absolutely fantastic!"
blob = TextBlob(text)
print(blob.sentiment.polarity)   # 0.9 — very positive
```

`spaCy` production-ready NLP library। `spacy.load("en_core_web_sm")` দিয়ে একটা ছোট English language model load করা হয়। `nlp(text)` দিয়ে টেক্সট process করলে একটা `doc` object পাওয়া যায় — এর `.ents` property তে সব named entity (ব্যক্তি, প্রতিষ্ঠান, স্থান) পাওয়া যায়, আর `.label_` দিয়ে entity-এর ধরন দেখা যায় (PERSON, ORG, GPE ইত্যাদি)।

```python
# spaCy দিয়ে entity extraction
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Steve Jobs founded Apple in California.")

for ent in doc.ents:
    print(ent.text, "->", ent.label_)
```

```text
Steve Jobs -> PERSON
Apple -> ORG
California -> GPE
```

> [!tip] 2026 recommendation
> নতুন শুরু করলে spaCy আর Hugging Face transformers — এই দুটোতেই focus করো। NLTK শুধু শেখার জন্য ভালো, production এ আর এত ব্যবহার হয় না।

## Hugging Face — আজকের Game Changer

2026 এ NLP বলতেই মাথায় আসে Hugging Face। এটা একটা platform আর library যেখানে হাজার হাজার pre-trained model ফ্রি পাওয়া যায়।

`pipeline()` হলো Hugging Face-এর সবচেয়ে সহজ API — এক লাইনে task name দিলেই sentiment analysis, text generation, translation সব কাজ করা যায়। এটা automatically একটা pre-trained model download করে আর inference করে — নিজে কোনো model train করতে হয় না।

```python
from transformers import pipeline

classifier = pipeline("sentiment-analysis")
result = classifier("I love this product!")
print(result)
```

```text
[{'label': 'POSITIVE', 'score': 0.9998}]
```

মাত্র ৩ লাইনে কাজ শেষ! এতো সহজে কয়েক বছর আগে ভাবাও যেত না।

## Real-world Application গুলো

কোথায় কোথায় NLP দেখা যায় রোজকার জীবনে:

- **ChatGPT / Claude / Gemini** — conversation, code, writing
- **Google Translate** — ১০০+ ভাষায় translation
- **Grammarly** — লেখার ভুল ধরা
- **Email spam filter** — junk email আলাদা করা
- **Alexa / Siri** — voice assistant
- **Search engine** — query বুঝে result
- **Sentiment on social media** — brand monitoring
- **Medical record** — doctor এর নোট থেকে তথ্য বের করা

> [!example] তোমার রোজকার ব্যবহার
> তুমি যখন WhatsApp এ Bengali লিখে English এ translate করো, বা ChatGPT কে প্রশ্ন করো — পেছনে NLP কাজ করছে। একদিনে হাজার খানেক বার।

## Summary

NLP হলো computer কে ভাষা শেখানো। চারটা era পার হয়ে আজকে আমরা transformer আর LLM এর যুগে। Python এ NLTK, spaCy, Hugging Face — এই তিনটা মূল weapon। আগামী chapter গুলোতে একটা একটা করে বিষয় গভীরভাবে দেখবো।