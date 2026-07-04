# Self-Attention গণিত ও Multi-Head Attention

গত chapter এ আমরা attention এর সম্পূর্ণ intuition টা বুঝেছিলাম — কীভাবে একটা model বাক্যের প্রতিটা শব্দের সাথে অন্য শব্দগুলোর relationship বুঝতে পারে। এবার সেই intuition কে আমরা math এ নামাবো, আর সাথে কোড লিখবো।

আজকের chapter টা একটু গোঁড়ার দিকের, কিন্তু ভয় পেও না — একদম step by step যাবো, হাতে হাতে ধরে। শেষে তুমি নিজেই scratch থেকে self-attention আর multi-head attention দুটোই কোড করতে পারবে।

## Recap: Attention এর Intuition

এক সেকেন্ড ভাবো — তুমি যখন "The cat sat on the mat because **it** was tired" বাক্যটা পড়ো, তখন "it" শব্দটা আসলে কাকে বোঝায়? Cat কে? Mat কে?

তোমার মাথা চালায় একটা অজানা প্রক্রিয়া — সব শব্দের দিকে তাকায়, কিছু শব্দের সাথে বেশি connection বোধ করে, কিছুর সাথে কম। "it" এর সাথে "cat" এর connection সবচেয়ে বেশি স্বাভাবিক লাগে কারণ cat-ই তো ক্লান্ত হতে পারে, mat নয়।

self-attention হলো ঠিক এই কাজটাই — কোনো শব্দ বাক্যের অন্য কোন কোন শব্দের দিকে বেশি "মনোযোগ" দেবে সেটা নির্ভুল করে বের করা।

```
  "The cat sat on the mat because it was tired"
                                      ↑
                              "it" → attends to "cat"
```

> [!note] একদম সহজ কথায়
> Self-attention = প্রতিটা শব্দ বাক্যের বাকি সব শব্দের সাথে কতটা related সেটার একটা weighted average বানায়।

## গণিত: Step by Step

চলো এবার এই intuition কে সংখ্যা আর matrix এ রূপ দিই। ধরো একটা বাক্যের জন্য আমাদের কাছে আছে embedding matrix **X** — যেখানে প্রতিটা row একটা শব্দের embedding।

### Step 1: Q, K, V তৈরি করা

self-attention এ তিনজন "খেলোয়াড়" থাকে — **Query**, **Key**, আর **Value**। এগুলো input embedding X থেকেই তৈরি হয়, কিন্তু আলাদা আলাদা weight matrix দিয়ে।

```
  X (input embeddings) কে তিনটা ভিন্ন weight matrix দিয়ে গুণ করি:

  Q = X @ W_Q    → "আমি কী খুঁজছি?"
  K = X @ W_K    → "আমার কাছে কী আছে?"
  V = X @ W_V    → "আমি কী দিতে পারি?"
```

একটু analogy দিই। তুমি library এ বই খুঁজছো:

| Component | Library Analogy | কাজ |
|-----------|----------------|-----|
| **Query (Q)** | "আমি কোন book খুঁজছি" | কী খুঁজতে হবে সেটা জিজ্ঞেস করা |
| **Key (K)** | "প্রতিটা book এর label/tag" | প্রতিটা item নিজের সম্পর্কে কী বলছে |
| **Value (V)** | "book এর actual content" | মিলে গেলে যা পাওয়া যায় |

আসলে এটা দেখতে গেলে এতো সহজ — তিনটা weight matrix দিয়ে X কে গুণ করলেই হলো:

```
  Matrix multiplication টা চোখে দেখা যাক:

     X           W_Q          Q
  ┌──────┐    ┌──────┐    ┌──────┐
  │ x1x  │    │      │    │  q1  │
  │ x2x  │  @ │      │  = │  q2  │
  │ x3x  │    │      │    │  q3  │
  │ x4x  │    │      │    │  q4  │
  └──────┘    └──────┘    └──────┘
   (4×d)        (d×d)       (4×d)

  d = embedding dimension
  4 = ধরলাম 4 টা শব্দ
```

একইভাবে K আর V ও তৈরি হয়।

### Step 2: Score বের করা — Q @ K^T

এবার মজার অংশ। প্রতিটা query কে সব key এর সাথে মেলাতে হবে। কতটা মেলে সেটার score বের করার জন্য dot product করি — **Q আর K এর transpose** কে গুণ করি।

```
  কেন K কে transpose করতে হয়?

  Q এর shape:  (4, d)   → প্রতিটা row একটা query
  K এর shape:  (4, d)   → প্রতিটা row একটা key

  আমরা চাই: প্রতিটা query এর সাথে প্রতিটা key এর dot product

  Q @ K^T দেয় shape (4, 4) → একটা 4×4 score matrix!
```

Score matrix এর প্রতিটা cell বলে দেয় — "i নম্বর শব্দ কতটা দৃঢ়ভাবে j নম্বর শব্দের সাথে related।"

```
           word1  word2  word3  word4
  word1  [  23      5      2     -1  ]
  word2  [   4     19      8      3  ]
  word3  [   1     12     27      2  ]
  word4  [   3      1      5     21  ]
```

খেয়াল করো — diagonal এ সবচেয়ে বড় সংখ্যা, কারণ নিজের সাথে নিজের মিল সবচেয়ে বেশি। কিন্তু অন্য cells-ও গুরুত্বপূর্ণ — সেগুলোই আসল relationship।

### Step 3: Scale করা — 1/√d_k দিয়ে

এটা অনেকেই skip করে যায় কিন্তু একদম critical। Score গুলোকে ভাগ করি √d_k দিয়ে।

> [!important] কেন scaling দরকার?
> যখন embedding dimension (d_k) বড় হয়, dot product এর মান অনেক বড় হয়ে যায়। আর softmax বড় মান পেলে সেগুলোকে আরও বড় করে ফেলে — একটা শব্দ প্রায় 1.0 পেয়ে যায়, বাকি সব প্রায় 0। এটাকে বলে **one-hot** — এমন হলে model শুধু একটা শব্দ দেখে, বাকিগুলো অদৃশ্য হয়ে যায়।
>
> Scaling ছোট করে দেয় score গুলোকে, যাতে softmax সবগুলোর মধ্যে একটা সুন্দর distributed weight দিতে পারে।

```
  উদাহরণ দিয়ে বুঝি:

  ধরো d_k = 512, তাহলে √d_k ≈ 22.6

  Scaling ছাড়া scores:  [80,  5,  3, -2]
  softmax([80, 5, 3, -2]) ≈ [1.0, 0.0, 0.0, 0.0]  ← একটাই বেঁচে গেলো!

  Scaling করলে:        [80/22.6, 5/22.6, 3/22.6, -2/22.6]
                       = [3.54, 0.22, 0.13, -0.09]
  softmax → [0.82, 0.05, 0.04, 0.03]  ← সবগুলোর কিছু contribution আছে
```

দেখলে তো? Scaling ছাড়া model "কিছু একটায় fix" হয়ে যেত, বাকি context হারিয়ে যেতো।

### Step 4: Softmax → Attention Weights

Scaled score গুলোকে softmax এর ভেতর দিয়ে পাঠাই। softmax বলে দেয় — এই শব্দগুলো কত শতাংশ মনোযোগ পাবে। সব যোগ করলে 1.0 হবে।

```
  Raw scores (scaled):     Attention weights (after softmax):
  ┌─────────────┐          ┌──────────────┐
  │ 3.5  0.2 -0.1│  ──→    │ 0.85 0.04 0.02│
  └─────────────┘          └──────────────┘
                            যোগ করলে = 1.00
```

### Step 5: Output = Weights @ V

শেষ ধাপ — attention weights গুলো দিয়ে value গুলোর একটা weighted average বানাই।

```
  Output = Attention_Weights @ V

  যেখানে যার weight বেশি, তার value বেশি হাতে পাবে।
  যার weight কম, তার contribution কম।
```

> [!note] পুরো প্রক্রিয়া এক লাইনে
> প্রতিটা শব্দ সব value গুলো থেকে নিজের জন্য একটা "blended" representation বানায় — যেগুলো বেশি related সেগুলোর অংশ বেশি।

## পুরো Formula

সব step কে একসাথে লিখলে যা হয়:

```
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │   Attention(Q,K,V) = softmax(QK^T / √d_k) V   │
  │                                                 │
  └─────────────────────────────────────────────────┘
```

এই একটা line মুখস্থ রাখো। পুরো Transformer architecture এই formula এর উপর দাঁড়িয়ে আছে।

## PyTorch Implementation — Scratch থেকে

নিচে আমরা গোটা self-attention কে খুব simple ভাবে লিখবো। কোনো জাদু নেই — শুধু কয়েক লাইন matrix operation। মন দিয়ে দেখো, প্রতিটা লাইন উপরের math এর সাথে মিলে যাবে।

```python
import torch
import torch.nn.functional as F
import math

def self_attention(Q, K, V):
    """
    Single-head self-attention.
    Q, K, V: shape (batch, seq_len, d_k)
    """
    d_k = Q.size(-1)

    # Step 1: Score = Q @ K^T
    # transpose(-2, -1) দিয়ে last two dimension swap করি
    scores = torch.matmul(Q, K.transpose(-2, -1))

    # Step 2: Scale by 1/sqrt(d_k)
    scores = scores / math.sqrt(d_k)

    # Step 3: Softmax → attention weights
    # dim=-1 মানে প্রতিটা row এর ভেতরে softmax
    attention_weights = F.softmax(scores, dim=-1)

    # Step 4: Output = weights @ V
    output = torch.matmul(attention_weights, V)

    return output, attention_weights
```

উপরের ফাংশনটা একদম সোজা — চারটা ধাপ, চারটা লাইন। `scores` বের করার সময় `transpose(-2, -1)` দিয়ে K এর শেষ দুই dimension উল্টে দিয়েছি, যাতে matrix multiplication ঠিকমতো হয়। scaling এ `math.sqrt(d_k)` ব্যবহার করেছি যেটা উপরে আলোচনা করা সেই একই জিনিস। শেষে softmax আর value এর সাথে গুণ — ব্যস।

একটু চালিয়ে দেখি আসলে কী হয়:

```python
# ধরলাম batch=1, seq_len=4, d_k=8
torch.manual_seed(42)
Q = torch.randn(1, 4, 8)
K = torch.randn(1, 4, 8)
V = torch.randn(1, 4, 8)

output, weights = self_attention(Q, K, V)

print("Output shape:", output.shape)      # (1, 4, 8)
print("Weights shape:", weights.shape)    # (1, 4, 4)
print("Weights row 0:", weights[0, 0])    # যোগফল 1.0 হবে
print("Sum:", weights[0, 0].sum())        # tensor(1.0000)
```

output এর shape input এর মতোই (1, 4, 8) — প্রতিটা শব্দের জন্য একটা করে নতুন representation। weights হলো (4, 4) — কোন শব্দ কোন শব্দের দিকে কতটা তাকিয়েছে সেটার পুরো ছক।

## Multi-Head Attention: একটা মাথা কেন কম পড়ে

এবার আসি আসল মজায়। একটা single attention head দিয়ে যদি পুরো attention হতো, তাহলে সমস্যা কী?

ভাবো — একটা শব্দের সাথে বাক্যের অন্য শব্দের কত রকমের relationship থাকতে পারে। যেমন "The animal didn't cross the street because **it** was too tired" — এই বাক্যে "it" শব্দটা:

- **Grammar এর দিক থেকে** → "animal" এর subject হিসেবে কাজ করছে
- **Meaning এর দিক থেকে** → "tired" হওয়ার কারণ হিসেবে "animal" কে নির্দেশ করছে
- **Position এর দিক থেকে** → নির্দিষ্ট একটা স্থানে আছে, আগে-পিছের শব্দের সাথে একটা spacing relationship আছে

একটা head দিয়ে এই তিনটা aspect একসাথে capture করা কঠিন। তাই Transformer paper এ বলা হয়েছে — একই সময়ে একাধিক head parallel ভাবে attention করুক। প্রতিটা head একটা করে "perspective" খুঁজে বের করবে।

```
  Multi-Head Attention — ভিন্ন head ভিন্ন দিক:

  Head 1: 🎯 Grammar relationship
       ┌───────────────────────────────┐
       │ it ──→ animal (subject link) │
       └───────────────────────────────┘

  Head 2: 🎯 Meaning / semantics
       ┌───────────────────────────────┐
       │ it ──→ tired (cause-effect)  │
       └───────────────────────────────┘

  Head 3: 🎯 Positional pattern
       ┌───────────────────────────────┐
       │ it ──→ because (adjacency)    │
       └───────────────────────────────┘
```

প্রতিটা head এর নিজস্ব weight matrix থাকে (W_Q^i, W_K^i, W_V^i), তাই সে একটা unique "lens" দিয়ে input দেখে। শেষে সব head এর output কে concatenate করে একটা final linear projection করা হয়।

### Multi-Head কীভাবে কাজ করে

```
                    ┌────────────┐
         Q, K, V ──→│  Head 1    │──→ O1 ─┐
              │     └────────────┘        │
              │     ┌────────────┐        │
              ├────→│  Head 2    │──→ O2 ─┤
              │     └────────────┘        │     ┌──────────┐
              │     ┌────────────┐        ├────→│ Concat   │──→ Linear ──→ Output
              └────→│  Head h    │──→ Oh ─┘     │ + Proj   │
                    └────────────┘              └──────────┘
```

ধরো d_model = 512 আর আমরা 8 টা head ব্যবহার করবো। তাহলে প্রতিটা head এ dimension হবে 512 / 8 = 64। প্রতিটা head 64 dimension এ attention করবে, তারপর সবগুলো কে আবার জোড়া লাগালে ফিরে পাবো 8 × 64 = 512।

> [!important] Dimension splitting
> d_model কে h ভাগ করে প্রতিটা head এ পাঠানো হয়। এটাকে বলে d_k = d_model / h। যেমন d_model=512, h=8 হলে প্রতিটা head এর dimension = 64। এটাকে "split into heads" বলে।

## PyTorch: Multi-Head Attention Code

নিচের কোডটা একটু লম্বা, কিন্তু একদম scratch থেকে লেখা। প্রতিটা ধাপ আলাদা করে রেখেছি যাতে বুঝতে সুবিধা হয়। মূল কৌশল হলো — একটা বড় weight matrix দিয়ে সব head এর Q, K, V একসাথে বানানো, তারপর "view" আর "transpose" দিয়ে head গুলো আলাদা করা।

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model=512, num_heads=8):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads  # প্রতিটা head এর dimension

        # Q, K, V আর output projection এর জন্য 4 টা linear layer
        self.W_Q = nn.Linear(d_model, d_model)
        self.W_K = nn.Linear(d_model, d_model)
        self.W_V = nn.Linear(d_model, d_model)
        self.W_O = nn.Linear(d_model, d_model)

    def forward(self, x):
        batch_size, seq_len, d_model = x.size()

        # Step 1: Linear projection
        Q = self.W_Q(x)  # (batch, seq, d_model)
        K = self.W_K(x)
        V = self.W_V(x)

        # Step 2: Split into multiple heads
        # shape পরিবর্তন: (batch, seq, d_model) → (batch, seq, num_heads, d_k)
        # তারপর transpose: (batch, num_heads, seq, d_k)
        Q = Q.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)

        # Step 3: Scaled dot-product attention (প্রতিটা head এ)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        attention_weights = F.softmax(scores, dim=-1)
        head_output = torch.matmul(attention_weights, V)
        # head_output shape: (batch, num_heads, seq, d_k)

        # Step 4: Concat all heads
        # transpose ফিরিয়ে দিই: (batch, seq, num_heads, d_k)
        # তারপর reshape: (batch, seq, d_model)
        head_output = head_output.transpose(1, 2).contiguous()
        concat_output = head_output.view(batch_size, seq_len, self.d_model)

        # Step 5: Final linear projection
        output = self.W_O(concat_output)

        return output
```

উপরের কোডে `view` আর `transpose` কৌশলটা হলো মূল জিনিস — একটা বড় d_model dimension কে num_heads ভাগে ভাগ করে দেওয়া, যাতে প্রতিটা head আলাদাভাবে কাজ করতে পারে। শেষে আবার জোড়া লাগিয়ে W_O দিয়ে project করা হয়। এই W_O matrix টা model কে শেখায় কোন head এর output কতটা গুরুত্ব পাবে।

চালিয়ে দেখি:

```python
model = MultiHeadAttention(d_model=512, num_heads=8)
x = torch.randn(2, 10, 512)  # batch=2, seq_len=10, d_model=512

output = model(x)
print("Output shape:", output.shape)  # torch.Size([2, 10, 512])
```

দেখো — input আর output দুটোরই shape একই (2, 10, 512)। এটাই Transformer এর সুন্দর দিক — প্রতিটা layer এর input আর output dimension একই থাকে, তাই যত খুশি তত layer stack করা যায়।

## Single-Head vs Multi-Head: Comparison

| বৈশিষ্ট্য | Single-Head Attention | Multi-Head Attention |
|----------|----------------------|---------------------|
| **Perspective** | একটাই view | একাধিক parallel views |
| **Capacity** | কম — একটা relationship ধরতে পারে | বেশি — কয়েক রকম relationship একসাথে |
| **Computation** | কম | একটু বেশি কিন্তু parallelizable |
| **Dimension per head** | সম্পূর্ণ d_model | d_model / h প্রতিটা head এ |
| **Parameters** | কম | বেশি (h গুণ বেশি weight matrix) |
| **Result quality** | ভালো কিন্তু সীমিত | উল্লেখযোগ্য ভালো |
| **Paper default** | — | h = 8, d_k = 64 |

> [!warn] ভুল ধারণা
> অনেকে ভাবে multi-head এ প্রতিটা head আলাদা আলাদা শব্দ দেখে। না — প্রতিটা head সব শব্দই দেখে, কিন্তু ভিন্ন "lens" দিয়ে। মানে একই data, ভিন্ন interpretation।

## ভিন্ন Head কীভাবে ভিন্নভাবে Attend করে

এটা দেখা যায় যে trained model এ বিভিন্ন head সত্যিই ভিন্ন pattern শেখে। কিছু head syntactic relationship ধরে (subject-verb, modifier-noun), কিছু head semantic similarity ধরে, কিছু head শুধু adjacent শব্দের দিকে তাকায়।

```
  একটা trained model এ attention pattern (conceptual):

  Sentence: "The quick brown fox jumps over the lazy dog"

  Head 1 (adjacency):  প্রতিটা শব্দ তার ঠিক পাশের শব্দে তাকায়
    The → quick → brown → fox → jumps → ...

  Head 2 (subject-verb):  fox আর jumps এর মধ্যে সবচেয়ে বেশি weight
    fox ──────────── jumps

  Head 3 (determiner-noun):  The তার noun এর দিকে তাকায়
    The ── fox, the ── dog

  Head 4 (rare words):  "over" আর "lazy" এর মধ্যে long-range link
    over ─────────── lazy
```

> [!note] মজার তথ্য
> গবেষণায় দেখা গেছে — Transformer এর কিছু head আসলে খুব সাধারণ কাজ করে (যেমন শুধু previous শব্দ দেখা), আবার কিছু head বেশ জটিল linguistic pattern ধরে। কিছু head কে remove করলেও model ঠিকঠাক চলে — অর্থাৎ redundancy আছে।

## পরিশেষে

আজ আমরা গোটা self-attention এর গণিত আর multi-head এর concept একদম scratch থেকে দেখলাম। মূল জিনিসগুলো যা মাথায় রাখবে:

- **Attention formula**: softmax(QK^T / √d_k) V — এই একটা লাইন।
- **Scaling** critical — না হলে softmax one-hot হয়ে যায়।
- **Multi-head** দিয়ে একই সময়ে কয়েক রকমের relationship ধরা যায়।
- **Dimension**: d_model কে h ভাগ করে প্রতিটা head এ d_k = d_model/h পাঠানো হয়।

পরের chapter এ দেখবো কীভাবে position information যোগ করা হয় — কারণ self-attention নিজে থেকে word order বোঝে না, আর সেটা একটা বিশাল সমস্যা।