# Transformers আর LLM

2017 সালে একটা paper এসেছিল — "Attention is All You Need"। সেই paper টা পুরো AI দুনিয়া পাল্টে দিয়েছে। এই chapter এ আমরা বুঝবো transformer কী, কীভাবে কাজ করে, আর কেন এটা আজকের LLM যুগের মূল ইঞ্জিন।

## Pre-Transformer Era — RNN এর সীমাবদ্ধতা

Transformer আসার আগে sequential data (টেক্সট, speech, time series) নিয়ে কাজ করতো RNN আর LSTM। এগুলোর সমস্যা ছিল বেশ কিছু:

```text
RNN এ বাক্য process হয় word by word:

"The cat sat on the mat because it was tired"
  ↓    ↓    ↓   ↓   ↓   ↓   ↓     ↓   ↓    ↓
  h1 → h2 → h3 → h4 → h5 → h6 → h7 → h8 → h9 → h10
                                                  ↑
                                        শেষ state এ সব তথ্য
```

সমস্যা গুলো:

- **Sequential** — এক word পরে আরেক word। parallel হয় না। তাই GPU use করতে পারে না ভালোভাবে।
- **Slow** — লম্বা বাক্যে সময় অনেক লাগে।
- **Forgets** — শুরুর word গুলো শেষে মনে থাকে না। "it" কে বোঝার জন্য প্রথমের "cat" মনে রাখতে হবে, কিন্তু RNN ভুলে যায়।

> [!warn] Vanishing Gradient
> লম্বা sequence তে gradient (learning signal) হারিয়ে যায়। LSTM কিছুটা সমাধান করলেও পুরোপুরি না। এই সমস্যা দূর করতেই attention আর transformer আসলো।

## Attention Mechanism — আসল বিপ্লব

Attention এর মূল ভাবনা সোজা — একটা word কে বোঝার সময়, সেই বাক্যের সব word এর দিকে তাকাও, কাদের সাথে সম্পর্ক বেশি সেখানে বেশি মনোযোগ দাও।

উদাহরণ: "The animal didn't cross the street because **it** was tired."

"it" কে? animal নাকি street? মানুষ বুঝে যায় — animal (কারণ tired হয় প্রাণী)। attention mechanism এই সম্পর্ক ধরতে পারে।

```text
"it" word এর attention সব word এর উপর:

  The    animal   didn't   cross   street   because   it    was   tired
  0.05    0.45     0.02     0.03    0.05      0.05     ___   0.10   0.25
                    ↑                                              ↑
                 বেশি attention                             বেশি attention
```

## Transformer Architecture

2017 সালের original transformer এ দুটো অংশ ছিল:

```text
            ┌──────────────────────────────┐
Input ────► │        ENCODER (×6)          │ ────► encoded representation
            │  - Self-Attention            │
            │  - Feed Forward              │
            │  - Positional Encoding       │
            └──────────────────────────────┘
                                                ┌─────────────────────────┐
                                                │     DECODER (×6)        │ ────► Output
                                                │  - Masked Self-Attn     │
                                                │  - Cross Attention      │
                                                │  - Feed Forward         │
                                                └─────────────────────────┘
```

মূল component গুলো:

- **Self-Attention** — প্রতিটা word বাক্যের সব word এর সাথে সম্পর্ক দেখে
- **Multi-Head Attention** — একই সময়ে অনেক রকম সম্পর্ক ধরে
- **Positional Encoding** — word এর position মনে রাখে (কারণ transformer সব word একসাথে দেখে)
- **Feed Forward Layer** — non-linear transformation

## Q/K/V — Attention কীভাবে কাজ করে

Attention এ তিনটা matrix থাকে — Query (Q), Key (K), Value (V)। ভাবো একটা library এর মতো:

- **Query** — তুমি কী খুঁজছো
- **Key** — প্রতিটা বইয়ের লেবেল
- **Value** — প্রতিটা বইয়ের আসল তথ্য

```text
Attention(Q, K, V) = softmax(Q × K^T / √d) × V
```

সহজ ভাষায়: প্রতিটা word এর Query সব word এর Key এর সাথে match করে score বের করে। score বেশি হলে সেই word এর Value বেশি নেওয়া হয়।

> [!note] Multi-Head
> একটা head একটা রকম সম্পর্ক ধরে (যেমন grammar), আরেক head অন্য রকম (যেমন semantic)। ৮ টা বা ১৬ টা head parallel চলে। এটাই multi-head attention।

## BERT — Understanding এর রাজা

BERT (Bidirectional Encoder Representations from Transformers) 2018 সালে Google আনে। এটা **encoder-only** architecture।

- বাক্য উভয় দিক থেকে দেখে (bidirectional)
- Understanding task এ দারুণ — classification, NER, QA
- Masked Language Modeling দিয়ে train হয়

```python
from transformers import pipeline

classifier = pipeline("text-classification", model="bert-base-uncased")
# BERT এর fine-tuned version দিয়ে classification
```

## GPT — Generation এর সম্রাট

GPT (Generative Pre-trained Transformer) OpenAI এর। এটা **decoder-only** architecture।

- বাম থেকে ডানে word generate করে
- Text generation এ দারুণ — story, code, chat
- আজকের GPT-4, GPT-5 সব এই ধারা এর

```text
[Encoder-only]  →  BERT, RoBERTa  →  Understanding
[Decoder-only]  →  GPT, Llama     →  Generation
[Encoder-Decoder] → T5, BART       →  Translation, Summary
```

## Scaling Laws — বড় মডেল ভালো

2020 সাল থেকে একটা দারুণ আবিষ্কার — model বড় করলে (parameter বাড়ালে), ডেটা বাড়ালে, compute বাড়ালে performance অনুমানযোগ্যভাবে বাড়ে। একে scaling law বলে।

```text
Parameters:  110M (BERT)  →  175B (GPT-3)  →  1T+ (GPT-4)
Performance: good         →  amazing       →  human-level+
```

এই কারণে আজকে যত বড় বড় LLM দেখো — সব parameter scale আর ডেটা scale এর ফল।

## LLM Era — 2026

এখন আমরা LLM যুগে। প্রতিটা tech company নিজের LLM আনছে:

| Model | Company | বৈশিষ্ট্য |
|-------|---------|----------|
| **GPT-4 / GPT-5** | OpenAI | General purpose, multimodal |
| **Claude** | Anthropic | Long context, reasoning |
| **Gemini** | Google | Multimodal, integrated |
| **Llama 3/4** | Meta | Open-source, ফ্রি |
| **Mistral** | Mistral AI | Efficient, open |
| **DeepSeek** | DeepSeek | কম খরচে দারুণ |

> [!tip] Open-source এর জয়
> 2026 এ Llama, Mistral, DeepSeek এর মতো open model গুলো কমার্শিয়াল model কে টেক্কা দিচ্ছে। তুমি নিজের মেশিনেই চালাতে পারবে।

## Hugging Face Transformers — Quick Start

LLM নিয়ে কাজ করতে চাইলে শুরু Hugging Face থেকেই। হাজার হাজার pre-trained model ফ্রি পাওয়া যায়।

```bash
pip install transformers
```

```python
from transformers import pipeline

# sentiment analysis
sentiment = pipeline("sentiment-analysis")
print(sentiment("This course is amazing!"))

# text generation
generator = pipeline("text-generation", model="gpt2")
print(generator("Once upon a time in Dhaka,", max_new_tokens=30))

# question answering
qa = pipeline("question-answering")
result = qa(question="Who founded Apple?", context="Steve Jobs founded Apple in 1976.")
print(result)
```

```text
[{'label': 'POSITIVE', 'score': 0.999}]
[{'generated_text': 'Once upon a time in Dhaka, the streets were...'}]
{'score': 0.99, 'start': 0, 'end': 10, 'answer': 'Steve Jobs'}
```

মাত্র কয়েক লাইনে এতো ক্ষমতা! কয়েক বছর আগে এটা অসম্ভব ছিল।

## Tokenizer আর Model

LLM এর সাথে কাজ করতে হলে দুটা জিনিস লাগে — tokenizer আর model।

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_name = "distilbert-base-uncased-finetuned-sst-2-english"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

inputs = tokenizer("I love this!", return_tensors="pt")
outputs = model(**inputs)
print(outputs.logits)
```

> [!example] Tokenizer প্রথম
> যেকোনো LLM use করার আগে tokenizer load করো — সে টেক্সট কে number এ রূপান্তর করে। তারপর model সেই number নিয়ে কাজ করে।

## Fine-tuning — নিজের কাজে মানানো

Pre-trained LLM কে নিজের specific task এ মানানোর প্রক্রিয়াই fine-tuning। এর জন্য labeled dataset লাগে।

```python
from transformers import Trainer, TrainingArguments

# (setup skipped for brevity — concept টা বোঝাও)
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=8,
    learning_rate=2e-5,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
)
trainer.train()
```

> [!danger] Compute খরচ
> LLM fine-tuning এ প্রচুর GPU দরকার। ছোট model (DistilBERT) দিয়ে শুরু করো। Colab এর ফ্রি GPU তেই অনেক কিছু করা যায়।

## Summary

Transformer হলো attention ভিত্তিক architecture যেটা sequential সমস্যা গুলো সমাধান করেছে। BERT understanding এ, GPT generation এ রাজা। Scaling law এর কারণে আজকের LLM গুলো human-level এ পৌঁছেছে। Hugging Face দিয়ে কয়েক লাইনে শুরু করা যায়। পরের chapter এ দেখবো deep learning এর গভীরে।