## Architecture-র Evolution — এক নজরে

Deep learning architecture-র বিবর্তন বোঝা খুব জরুরি — কারণ আধুনিক AI (GPT, Claude, Midjourney) সব এই evolution-এর ফসল:

```text
MLP ──► CNN (Vision) ──► RNN/LSTM (Sequence) ──► Transformer ──► সব কিছু
                                                         │
                                                    ├── GPT (decoder)
                                                    ├── BERT (encoder)
                                                    ├── ViT (vision)
                                                    └── Diffusion (image gen)
```

## MLP — সবচেয়ে Basic

Multi-Layer Perceptron বা fully-connected network — সবচেয়ে simple architecture। প্রতিটা neuron আগের layer-এর সব neuron-এর সাথে connected:

```text
Input Layer    Hidden Layer    Output Layer
  ○ ○ ○ ○  ────  ○ ○ ○ ○ ○  ────  ○ ○ ○
  (4)           (5)              (3)
```

MLP simple কিন্তু সীমিত — spatial structure (image) বা sequential pattern (text) ভালো ধরতে পারে না।

## CNN — Image-এর জন্য

Convolutional Neural Network image-এর spatial pattern ধরতে পারে — edge, shape, object।

```text
Image (224×224)
     │
     ▼
[Conv + Pool] ──► features (edges, texture)
[Conv + Pool] ──► features (shapes, parts)
[Conv + Pool] ──► features (objects, faces)
     │
     ▼
[Fully Connected] ──► Classification
```

> [!note] Convolution কী?
# একটা ছোট filter (যেমন ৩×৩) image-এর উপর দিয়ে slide করানো হয়। প্রতিটা position-এ filter আর image-এর অংশের dot product হয়। এতে image-এর local pattern (edge, corner) ধরা যায়। CNN এখনও vision-এ ব্যবহৃত হয়, কিন্তু ViT দ্রুত জনপ্রিয় হচ্ছে।

## RNN আর LSTM — Sequence-এর জন্য

Recurrent Neural Network sequence data (text, time series) process করে — একটার পর একটা token process করে, আগের token-এর information carry করে।

```text
Token 1 → [RNN] → h₁ ─┐
                       ├──► Token 2 → [RNN] → h₂ ──┐
                       │                             ├──► Token 3 → ...
                    carry forward                 carry forward
```

সমস্যা — long sequence-তে প্রথম token-এর information হারিয়ে যায় (vanishing gradient)। LSTM এই সমস্যা কিছুটা সমাধান করেছিল, কিন্তু RNN স্বাভাবিকভাবেই **sequential** — parallel computation করা যায় না, তাই ধীর।

## Transformer — Game Changer

2017 সালে "Attention Is All You Need" paper-এ Transformer আসে, আর পুরো দুনিয়া বদলে যায়। Transformer-এ RNN-এর sequential nature নেই — সব token একসাথে process হয় (parallel)।

### Self-Attention — Core Mechanism

Self-attention হলো Transformer-এর হৃদপিণ্ড। প্রতিটা token পুরো sequence-এর সব token-এর দিকে "তাকায়" আর কোনগুলো গুরুত্বপূর্ণ সেটা decide করে।

প্রতিটা token থেকে তিনটা vector তৈরি হয়: **Query (Q)**, **Key (K)**, আর **Value (V)**।

```text
"I love deep learning"

"deep" token-এর জন্য:
  Query: "আমি কাকে খুঁজছি?"
  Keys:  সব token-এর "আমি কে?"
  Values: সব token-এর actual content

"deep" যাদের key-এর সাথে নিজের query match করে,
তাদের value বেশি নেয় (যেমন "learning" আর "deep")
```

Scaled dot-product attention-এর formula:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$

ব্যাখ্যা:
- $QK^T$ — query আর key-এর dot product (similarity score)
- $\sqrt{d_k}$ দিয়ে scale (stable training-এর জন্য)
- $\text{softmax}$ — score-গুলোকে probability তে পরিণত করে (০ থেকে ১, যোগফল ১)
- $V$ — value-গুলোর weighted sum

নিচের কোডে `torch.matmul` হলো matrix multiplication (উপরের formula-তে QK^T এর জন্য)। `math.sqrt(d_k)` দিয়ে score কে scale করা হয় যাতে value বড় না হয়ে যায়। `F.softmax(scores, dim=-1)` প্রতিটা query-এর জন্য সব key-এর score কে probability তে রূপান্তর করে — যোগফল ১ হয়। শেষে সেই probability দিয়ে value গুলোর weighted sum বের হয়।

```python
import torch
import torch.nn.functional as F
import math

def self_attention(Q, K, V):
    """
    Q, K, V: (batch, seq_len, d_k)
    """
    d_k = Q.size(-1)

    # Similarity scores
    scores = torch.matmul(Q, K.transpose(-2, -1))  # (batch, seq, seq)
    scores = scores / math.sqrt(d_k)                # scale

    # Attention weights
    attention = F.softmax(scores, dim=-1)           # normalize

    # Weighted sum of values
    output = torch.matmul(attention, V)             # (batch, seq, d_v)
    return output
```

> [!tip] কেন Transformer RNN-কে হারিয়ে দিল?
# দুটো কারণ: **১) Parallel** — RNN-এ token একটার পর একটা process হয়, Transformer-এ সব একসাথে। GPU-তে অনেক fast। **২) Long-range** — RNN-এ দূরের token-এর information হারিয়ে যায়, Transformer-এ self-attention যেকোনো দূরের token-এ সরাসরি access করতে পারে।

## Transformer Block

একটা Transformer block কয়েকটা component নিয়ে গঠিত:

```text
Input
  │
  ▼
[Multi-Head Self-Attention]     ← একসাথে অনেক attention head
  │
  [+ Residual]                  ← skip connection
  │
  [Layer Norm]
  │
  ▼
[Feed-Forward Network]          ← প্রতিটা position-এ independently
  │
  [+ Residual]
  │
  [Layer Norm]
  │
  ▼
Output
```

Multi-head attention মানে — একই সময়ে একাধিক attention head বিভিন্ন aspect-এ focus করে। যেমন এক head grammar ধরে, আরেক head semantic।

## ViT — Vision Transformer

2020 সালে এলো এক চমৎকার ভাবনা — image-কে text-এর মতো treat করা যায় কি? ViT (Vision Transformer) এটাই করে।

```text
Image (224×224×3)
     │
     ▼
[Patch] ──► ছবিকে 16×16 patch-এ কেটে ফেলো
     │         (২২৪/১৬ = ১৪ → ১৪×১৪ = ১৯৬টা patch)
     ▼
[Flatten + Linear] ──► প্রতিটা patch একটা "token"
     │                   (word embedding-এর মতো)
     ▼
[Position Embedding] ──► patch-গুলোর position যোগ করো
     │
     ▼
[Transformer Encoder] ──► ঠিক সেই self-attention!
     │
     ▼
[Classification Head] ──► এটা কুত্তা না বিড়াল?
```

> [!note] CNN মরে গেছে?
# পুরোপুরি না। CNN এখনও অনেক জায়গায় কার্যকর — edge device, real-time, কম data। কিন্তু state-of-the-art vision model এখন ViT-ভিত্তিক। Hybrid (CNN + Transformer) model-ও জনপ্রিয়।

## Encoder বনাম Decoder বনাম উভয়

Transformer-র তিনটা রূপ আছে, কাজ অনুযায়ী:

| Type | Architecture | কাজ | উদাহরণ |
|---|---|---|---|
| **Encoder-only** | Bidirectional attention | Understanding, classification | BERT, RoBERTa |
| **Decoder-only** | Causal (masked) attention | Generation, completion | GPT, Llama, Claude |
| **Encoder-Decoder** | উভয় | Sequence-to-sequence, translation | T5, BART |

```text
Encoder-only (BERT):           Decoder-only (GPT):
"The cat sat" → meaning        "The cat sat" → "on the mat"
দ্বিমুখী — সব token দেখে          একমুখী — শুধু আগের token দেখে

Encoder-Decoder (T5):
"Translate: The cat sat" → "বিড়ালটি বসল"
```

> [!tip] কেন Decoder-only এত জনপ্রিয়?
# GPT, Llama, Claude — সবই decoder-only। কারণ: generation task (chat, code, writing) এ সবচেয়ে ভালো, scale করা সহজ, আর অনেক ডাটায় train করলে emergence হয় — নতুন ability আবিষ্কার করে।

## Diffusion Models — Image Generation

Stable Diffusion, DALL-E, Midjourney — এসব diffusion model। ধারণাটা আলাদা:

```text
Forward (noise যোগ করো):  পরিষ্কার image → step by step → pure noise
                             ◄──── শিখো এই process ────

Reverse (noise থেকে image):  pure noise → step by step → পরিষ্কার image
                              ────► এটাই generation ────►
```

Diffusion model noise থেকে step by step পরিষ্কার image বানাতে শেখে। Text condition দিলে (যেমন "a cat on the moon"), সেই text অনুযায়ী image generate করে।

## Practical — PyTorch-এ Self-Attention

নিচের কোডে একটা সম্পূর্ণ Multi-Head Attention layer তৈরি করা হয়েছে। `W_q`, `W_k`, `W_v` হলো তিনটা learnable linear layer যা input থেকে Query, Key, Value vector বানায়। `W_o` শেষে সব head-এর output একসাথে যোগ করে final output দেয়। `num_heads=8` মানে ৮টা আলাদা attention head parallel চলবে — প্রতিটা head `d_model // num_heads` ডাইমেনশন নিয়ে কাজ করে (যেমন 512/8 = 64)। প্রতিটা head ভিন্ন ধরনের relationship (grammar, semantic ইত্যাদি) শিখতে পারে।

```python
import torch
import torch.nn as nn
import math

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model=512, num_heads=8):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x):
        batch_size, seq_len, _ = x.size()

        # Q, K, V তৈরি করো
        Q = self.W_q(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)

        # Scaled dot-product attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        attention = torch.softmax(scores, dim=-1)
        context = torch.matmul(attention, V)

        # Heads একসাথে যোগ করো
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, self.d_model)
        return self.W_o(context)

# ব্যবহার
attention = MultiHeadAttention(d_model=512, num_heads=8)
x = torch.randn(2, 10, 512)  # batch=2, seq_len=10, d_model=512
output = attention(x)
print(f"Input shape:  {x.shape}")
print(f"Output shape: {output.shape}")  # একই shape
```

> [!example] PyTorch 2.x-এ ready-made
# পুরো attention নিজে লেখার দরকার নেই। PyTorch 2.x-এ `nn.MultiheadAttention` বা `torch.nn.functional.scaled_dot_product_attention` (FlashAttention-সমর্থিত) ব্যবহার করো — অনেক fast আর optimized। Hugging Face `transformers` library দিয়ে BERT, GPT, ViT সব ready model এক লাইনে load করা যায়। Keras 3.x-এও transformer layer built-in আছে।