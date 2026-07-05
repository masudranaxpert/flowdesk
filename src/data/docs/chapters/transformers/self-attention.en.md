# Self-Attention Math and Multi-Head Attention

In the last chapter, we understood the complete intuition of attention — how a model can understand relationships between words in a sentence. Now we'll translate that intuition into math, and write code alongside.

Today's chapter is a bit more technical, but don't worry — we'll go step by step, holding hands. By the end, you'll be able to code both self-attention and multi-head attention from scratch.

## Recap: The Intuition of Attention

Think for a second — when you read "The cat sat on the mat because **it** was tired," what does the word "it" actually refer to? The cat? The mat?

Your brain runs some unknown process — it looks at all the words, feels a stronger connection with some, weaker with others. The connection between "it" and "cat" feels most natural, because a cat can be tired, not a mat.

Self-attention is exactly this task — precisely determining which other words each word should pay more "attention" to.

```
  "The cat sat on the mat because it was tired"
                                      ↑
                              "it" → attends to "cat"
```

> [!note] In the Simplest Words
> Self-attention = each word creates a weighted average with all other words in the sentence, based on how related they are.

## Math: Step by Step

Now let's formalize this intuition into numbers and matrices. Say we have an embedding matrix **X** for a sentence — where each row is a word's embedding.

### Step 1: Creating Q, K, V

Self-attention has three "players" — **Query**, **Key**, and **Value**. These are created from the input embedding X, but using different weight matrices.

```
  Multiply X (input embeddings) by three different weight matrices:

  Q = X @ W_Q    → "What am I looking for?"
  K = X @ W_K    → "What do I have?"
  V = X @ W_V    → "What can I provide?"
```

Let me give an analogy. You're searching for a book in a library:

| Component | Library Analogy | Role |
|-----------|----------------|-----|
| **Query (Q)** | "Which book I'm searching for" | Asking what to search for |
| **Key (K)** | "Each book's label/tag" | What each item says about itself |
| **Value (V)** | "The book's actual content" | What you get when it matches |

It's actually quite simple — just multiply X by three weight matrices:

```
  Let's visualize the matrix multiplication:

     X           W_Q          Q
  ┌──────┐    ┌──────┐    ┌──────┐
  │ x1x  │    │      │    │  q1  │
  │ x2x  │  @ │      │  = │  q2  │
  │ x3x  │    │      │    │  q3  │
  │ x4x  │    │      │    │  q4  │
  └──────┘    └──────┘    └──────┘
   (4×d)        (d×d)       (4×d)

  d = embedding dimension
  4 = let's say 4 words
```

Similarly, K and V are created.

### Step 2: Computing Scores — Q @ K^T

Now the fun part. Each query needs to be matched with all keys. To find how well they match, we compute dot products — multiply **Q and K transposed**.

```
  Why transpose K?

  Q shape:  (4, d)   → each row is a query
  K shape:  (4, d)   → each row is a key

  We want: dot product of each query with each key

  Q @ K^T gives shape (4, 4) → a 4×4 score matrix!
```

Each cell in the score matrix tells — "how strongly word i is related to word j."

```
           word1  word2  word3  word4
  word1  [  23      5      2     -1  ]
  word2  [   4     19      8      3  ]
  word3  [   1     12     27      2  ]
  word4  [   3      1      5     21  ]
```

Notice — the diagonal has the largest numbers, because a word matches itself best. But the other cells are important too — those are the real relationships.

### Step 3: Scaling — by 1/√d_k

Many people skip this, but it's absolutely critical. We divide the scores by √d_k.

> [!important] Why Is Scaling Needed?
> When the embedding dimension (d_k) is large, dot product values become very large. And softmax amplifies large values even more — one word gets almost 1.0, the rest get almost 0. This is called **one-hot** — if this happens, the model only sees one word, the rest become invisible.
>
> Scaling shrinks the scores so softmax can give a nicely distributed weight across all words.

```
  Let's understand with an example:

  Say d_k = 512, then √d_k ≈ 22.6

  Without scaling scores:  [80,  5,  3, -2]
  softmax([80, 5, 3, -2]) ≈ [1.0, 0.0, 0.0, 0.0]  ← only one survived!

  With scaling:            [80/22.6, 5/22.6, 3/22.6, -2/22.6]
                           = [3.54, 0.22, 0.13, -0.09]
  softmax → [0.82, 0.05, 0.04, 0.03]  ← all have some contribution
```

See? Without scaling, the model would "fixate" on one thing and lose all other context.

### Step 4: Softmax → Attention Weights

We pass the scaled scores through softmax. Softmax tells us — what percentage of attention each word gets. All values sum to 1.0.

```
  Raw scores (scaled):     Attention weights (after softmax):
  ┌─────────────┐          ┌──────────────┐
  │ 3.5  0.2 -0.1│  ──→    │ 0.85 0.04 0.02│
  └─────────────┘          └──────────────┘
                            Sum = 1.00
```

### Step 5: Output = Weights @ V

The final step — use the attention weights to create a weighted average of values.

```
  Output = Attention_Weights @ V

  Whoever has more weight, contributes more of their value.
  Whoever has less weight, contributes less.
```

> [!note] The Whole Process in One Line
> Each word builds a "blended" representation for itself from all values — the ones it's more related to contribute more.

## The Complete Formula

Combining all steps together:

```
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │   Attention(Q,K,V) = softmax(QK^T / √d_k) V   │
  │                                                 │
  └─────────────────────────────────────────────────┘
```

Memorize this one line. The entire Transformer architecture stands on this formula.

## PyTorch Implementation — From Scratch

Below we'll write the entire self-attention very simply. No magic — just a few lines of matrix operations. Pay attention, each line will match the math above.

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
    # transpose(-2, -1) swaps the last two dimensions
    scores = torch.matmul(Q, K.transpose(-2, -1))

    # Step 2: Scale by 1/sqrt(d_k)
    scores = scores / math.sqrt(d_k)

    # Step 3: Softmax → attention weights
    # dim=-1 means softmax within each row
    attention_weights = F.softmax(scores, dim=-1)

    # Step 4: Output = weights @ V
    output = torch.matmul(attention_weights, V)

    return output, attention_weights
```

This function is very straightforward — four steps, four lines. When computing `scores`, we used `transpose(-2, -1)` to flip K's last two dimensions so the matrix multiplication works correctly. For scaling, we used `math.sqrt(d_k)` — the same thing we discussed above. Finally, softmax and multiply with value — done.

Let's run it and see what happens:

```python
# Let's say batch=1, seq_len=4, d_k=8
torch.manual_seed(42)
Q = torch.randn(1, 4, 8)
K = torch.randn(1, 4, 8)
V = torch.randn(1, 4, 8)

output, weights = self_attention(Q, K, V)

print("Output shape:", output.shape)      # (1, 4, 8)
print("Weights shape:", weights.shape)    # (1, 4, 4)
print("Weights row 0:", weights[0, 0])    # Sum will be 1.0
print("Sum:", weights[0, 0].sum())        # tensor(1.0000)
```

The output shape is the same as input (1, 4, 8) — a new representation for each word. Weights is (4, 4) — the full chart of how much each word looked at every other word.

## Multi-Head Attention: Why One Head Isn't Enough

Now comes the real fun. If we used just a single attention head for everything, what would be the problem?

Think about it — a word can have many types of relationships with other words in a sentence. For example, in "The animal didn't cross the street because **it** was too tired" — the word "it":

- **From a grammar perspective** → acts as the subject of "animal"
- **From a meaning perspective** → refers to "animal" as the cause of being "tired"
- **From a positional perspective** → occupies a specific position, with spacing relationships to neighboring words

Capturing all three aspects with one head is hard. So the Transformer paper said — let multiple heads attend in parallel at the same time. Each head will discover one "perspective."

```
  Multi-Head Attention — different heads, different angles:

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

Each head has its own weight matrices (W_Q^i, W_K^i, W_V^i), so it views the input through a unique "lens." At the end, all heads' outputs are concatenated and passed through a final linear projection.

### How Multi-Head Works

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

Say d_model = 512 and we'll use 8 heads. Then each head gets dimension 512 / 8 = 64. Each head does attention in 64 dimensions, then when all are concatenated back, we get 8 × 64 = 512.

> [!important] Dimension Splitting
> d_model is divided into h parts, each sent to a head. This is called d_k = d_model / h. For example, d_model=512, h=8 means each head's dimension = 64. This is called "split into heads."

## PyTorch: Multi-Head Attention Code

The code below is a bit longer, but written entirely from scratch. Each step is kept separate for clarity. The key trick is — use one large weight matrix to create all heads' Q, K, V simultaneously, then use "view" and "transpose" to separate the heads.

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
        self.d_k = d_model // num_heads  # dimension per head

        # 4 linear layers for Q, K, V and output projection
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
        # Reshape: (batch, seq, d_model) → (batch, seq, num_heads, d_k)
        # Then transpose: (batch, num_heads, seq, d_k)
        Q = Q.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)

        # Step 3: Scaled dot-product attention (per head)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        attention_weights = F.softmax(scores, dim=-1)
        head_output = torch.matmul(attention_weights, V)
        # head_output shape: (batch, num_heads, seq, d_k)

        # Step 4: Concat all heads
        # Transpose back: (batch, seq, num_heads, d_k)
        # Then reshape: (batch, seq, d_model)
        head_output = head_output.transpose(1, 2).contiguous()
        concat_output = head_output.view(batch_size, seq_len, d_model)

        # Step 5: Final linear projection
        output = self.W_O(concat_output)

        return output
```

In this code, the `view` and `transpose` trick is the key thing — splitting a large d_model dimension into num_heads parts, so each head can work independently. At the end, they're concatenated and projected with W_O. This W_O matrix teaches the model how much importance each head's output gets.

Let's run it:

```python
model = MultiHeadAttention(d_model=512, num_heads=8)
x = torch.randn(2, 10, 512)  # batch=2, seq_len=10, d_model=512

output = model(x)
print("Output shape:", output.shape)  # torch.Size([2, 10, 512])
```

See — both input and output have the same shape (2, 10, 512). This is the beauty of Transformers — each layer's input and output dimensions are the same, so you can stack as many layers as you want.

## Single-Head vs Multi-Head: Comparison

| Feature | Single-Head Attention | Multi-Head Attention |
|---------|----------------------|---------------------|
| **Perspective** | One view | Multiple parallel views |
| **Capacity** | Lower — captures one relationship | Higher — captures several relationships at once |
| **Computation** | Less | Slightly more but parallelizable |
| **Dimension per head** | Full d_model | d_model / h per head |
| **Parameters** | Fewer | More (h times more weight matrices) |
| **Result quality** | Good but limited | Significantly better |
| **Paper default** | — | h = 8, d_k = 64 |

> [!warn] Misconception
> Many people think multi-head means each head sees different words. No — each head sees all words, but through a different "lens." Same data, different interpretation.

## How Different Heads Attend Differently

It's been observed that in trained models, different heads indeed learn different patterns. Some heads capture syntactic relationships (subject-verb, modifier-noun), some capture semantic similarity, some just look at adjacent words.

```
  Attention patterns in a trained model (conceptual):

  Sentence: "The quick brown fox jumps over the lazy dog"

  Head 1 (adjacency):  Each word looks at its immediate neighbor
    The → quick → brown → fox → jumps → ...

  Head 2 (subject-verb):  Highest weight between fox and jumps
    fox ──────────── jumps

  Head 3 (determiner-noun):  The looks at its noun
    The ── fox, the ── dog

  Head 4 (rare words):  Long-range link between "over" and "lazy"
    over ─────────── lazy
```

> [!note] Fun Fact
> Research has shown — some heads in Transformers actually do very simple tasks (like just looking at the previous word), while others capture quite complex linguistic patterns. Some heads can even be removed and the model still works fine — meaning there's redundancy.

## In Conclusion

Today we saw the complete math of self-attention and the concept of multi-head from scratch. Key things to keep in mind:

- **Attention formula**: softmax(QK^T / √d_k) V — this one line.
- **Scaling** is critical — without it, softmax becomes one-hot.
- **Multi-head** captures multiple types of relationships simultaneously.
- **Dimensions**: d_model is divided into h parts, each head gets d_k = d_model/h.

In the next chapter, we'll see how position information is added — because self-attention doesn't understand word order on its own, and that's a huge problem.