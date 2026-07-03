## LLM যুগ — 2026-এর দৃশ্যপট

LLM (Large Language Model) পুরো NLP-র দৃশ্যপট বদলে দিয়েছে। 2026-এ যে মডেলগুলো সবচেয়ে প্রাসঙ্গিক:

| Model | ধরন | উল্লেখযোগ্য বৈশিষ্ট্য |
|---|---|---|
| **GPT-4o** | Closed, OpenAI | Multimodal (text + image + audio) |
| **Claude** | Closed, Anthropic | দীর্ঘ context window, reasoning |
| **Gemini** | Closed, Google | Multimodal, Google ecosystem |
| **Llama 3** | Open-weight, Meta | স্বাধীনভাবে host করা যায় |
| **Mistral** | Open-weight | Efficient, European |

> [!tip] Closed বনাম Open-weight
# Closed model (GPT-4o, Claude) — API দিয়ে ব্যবহার, data তৃতীয় পক্ষের কাছে যায়। Open-weight (Llama, Mistral) — নিজের server-এ host করা যায়, data private থাকে, কিন্তু hardware আর expertise লাগে।

## Prompting Techniques

সুন্দর prompt লেখাই এখন একটা দক্ষতা:

### Zero-shot

কোনো উদাহরণ ছাড়া সরাসরি জিজ্ঞেস করো:

```text
"Classify this review as positive or negative: 'The food was amazing!'
Answer:"
```

### Few-shot

কয়েকটা উদাহরণ দাও, তারপর জিজ্ঞেস করো:

```text
Review: "Great service!" → Positive
Review: "Terrible food." → Negative
Review: "The movie was a masterpiece!" →
```

### Chain-of-Thought (CoT)

Model-কে step by step ভাবতে বলো — reasoning task-এ ফল অনেক ভালো আসে:

```text
"I bought 3 apples at $2 each and 2 oranges at $1.50 each.
Let me think step by step:
1. Apples: 3 × $2 = $6
2. Oranges: 2 × $1.50 = $3
3. Total: $6 + $3 = $9
Total cost: $9"
```

> [!note] CoT কেন কাজ করে?
# LLM next token predict করে। সরাসরি উত্তর দিতে বললে সে intermediate reasoning skip করে। Step-by-step ভাবতে বললে intermediate token-গুলো তৈরি হয় যা final answer-এ সাহায্য করে।

## Fine-tuning — Full বনাম PEFT

কখনো base model তোমার specific task-এ যথেষ্ট ভালো নয়। তখন fine-tuning দরকার।

### Full Fine-tuning

সব parameter update করো — অনেক resource লাগে (GPU, RAM):

```text
Llama 3 7B → সব ৭ বিলিয়ন parameter update
দরকার: একাধিক A100 GPU, কয়েকদিন
```

### PEFT / LoRA / QLoRA — Resource Efficient

শুধু একটা ছোট adapter train করো, base model স্পর্শ করো না:

```text
Llama 3 7B + LoRA adapter (~১০ মিলিয়ন parameter)
দরকার: একটা consumer GPU (RTX 4090), কয়েক ঘণ্টা
```

**LoRA** (Low-Rank Adaptation): শুধু low-rank matrix train করে।
**QLoRA**: base model-কে 4-bit quantize করে, তার উপর LoRA — আরও কম memory।

```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, TrainingArguments
from trl import SFTTrainer

# ১. Model লোড (4-bit quantized — QLoRA)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-8B",
    load_in_4bit=True,
    device_map="auto",
)

# ২. LoRA config
lora_config = LoraConfig(
    r=16,                    # rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable params: 10,485,760 || all params: 8,072,204,288 || 0.13%

# ৩. Train
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=TrainingArguments(
        output_dir="./results",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        learning_rate=2e-4,
        fp16=True,
    ),
)
trainer.train()
```

> [!tip] কখন fine-tune করবে?
# Fine-tune দরকার যদি: specific domain (medical, legal), specific format/style, বা base model-এর থেকে অনেক বেশি accurate হতে হবে। সাধারণ task-এ RAG বা better prompt-ই যথেষ্ট।

## RAG — Retrieval-Augmented Generation

LLM-এর একটা সমস্যা — training-এর পরের তথ্য জানে না, আর hallucinate করে (মিথ্যা বলে)। RAG এই সমস্যা সমাধান করে — relevant document retrieve করে prompt-এ যোগ করে:

```text
User Question
     │
     ▼
[Embedding] ──► Vector DB Search ──► Top-K Relevant Documents
                                          │
                                          ▼
                              [Augmented Prompt]
                              "Context: {retrieved docs}
                               Question: {user question}"
                                          │
                                          ▼
                                    [LLM Generate]
                                          │
                                          ▼
                                    Final Answer
```

### Vector Store

Document-গুলো embedding করে vector store-এ রাখা হয়। Similarity search দিয়ে relevant chunk বের করা হয়:

```python
import chromadb
from sentence_transformers import SentenceTransformer

# ১. Embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# ২. Vector database
client = chromadb.Client()
collection = client.create_collection("documents")

# ৩. Document embed করে store করো
documents = [
    "Python is a programming language.",
    "Docker containers package applications.",
    "React is a JavaScript library for UI.",
]

embeddings = embedder.encode(documents).tolist()
collection.add(
    documents=documents,
    embeddings=embeddings,
    ids=[f"doc_{i}" for i in range(len(documents))],
)

# ৪. Query — relevant document retrieve করো
query = "What is Docker?"
query_embedding = embedder.encode([query]).tolist()

results = collection.query(
    query_embeddings=query_embedding,
    n_results=2,
)
print(results["documents"])
# [["Docker containers package applications.", "Python is a programming language."]]
```

## Hugging Face Ecosystem

Hugging Face হলো NLP/ML-এর GitHub — model, dataset, সব এক জায়গায়:

| Library | কাজ |
|---|---|
| `transformers` | Pretrained model load আর inference |
| `datasets` | হাজার হাজার dataset |
| `peft` | Parameter-efficient fine-tuning |
| `sentence-transformers` | Sentence embedding |
| `accelerate` | Multi-GPU training |
| `trl` | Reinforcement learning / SFT training |

```python
from transformers import pipeline

# Ready-made pipeline
classifier = pipeline("sentiment-analysis")
result = classifier("I love this product!")
print(result)
# [{'label': 'POSITIVE', 'score': 0.9998}]
```

## কখন RAG, কখন Fine-tune?

| | RAG | Fine-tune |
|---|---|---|
| নতুন তথ্য | perfect | বারবার retrain করতে হবে |
| Cost | কম | বেশি |
| Accuracy | source থেকে quote করে | pattern learn করে |
| Domain knowledge | external database | model-এ baked in |
| Style/format | কম effective | খুব effective |

> [!tip] 2026-এর best practice
# সাধারণত **RAG first** — সস্তা, fast, নতুন তথ্য যোগ করা সহজ। Fine-tune শুধু তখন যখন RAG দিয়ে কাজ হচ্ছে না (specific style, format, বা reasoning pattern)। অনেক সময় দুটো একসাথে ব্যবহার করা হয়।

## Practical — Minimal RAG Pipeline

```python
from sentence_transformers import SentenceTransformer
import chromadb

# ১. Document তৈরি
documents = [
    "PyTorch 2.x supports torch.compile for faster training.",
    "Docker multi-stage builds reduce final image size significantly.",
    "Argon2id is the recommended password hashing algorithm in 2026.",
    "OAuth 2.1 mandates PKCE for SPAs and mobile applications.",
]

# ২. Embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# ৩. Vector DB তৈরি আর document যোগ
client = chromadb.Client()
collection = client.get_or_create_collection("knowledge_base")

embeddings = model.encode(documents).tolist()
collection.add(
    documents=documents,
    embeddings=embeddings,
    metadatas=[{"source": f"doc_{i}"} for i in range(len(documents))],
    ids=[str(i) for i in range(len(documents))],
)

# ৪. Retrieve আর augment
def rag_query(question: str, llm_call):
    """RAG: retrieve relevant docs, augment prompt, call LLM."""
    query_emb = model.encode([question]).tolist()
    results = collection.query(query_embeddings=query_emb, n_results=2)
    context = "\n".join(results["documents"][0])

    prompt = f"""Based on the following context, answer the question.

Context:
{context}

Question: {question}
Answer:"""

    return llm_call(prompt)

# ৫. ব্যবহার
answer = rag_query("What is recommended for password hashing?", your_llm_function)
print(answer)
# "Argon2id is the recommended password hashing algorithm in 2026."
```

> [!example] Production RAG
# Production-এ chunking strategy (document কীভাবে ভাগ করবে), embedding model choice, vector DB (Chroma ছোট project-এ, pgvector PostgreSQL-এ), reranking, আর citation — এগুলো সব optimize করতে হয়। Hugging Face-এর `sentence-transformers` আর `transformers` library দিয়ে পুরো pipeline তৈরি করা যায়।