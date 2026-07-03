## কেন Deep Learning-এ Math দরকার?

Neural network-এর পেছনে মূলত দুটো math-এর শাখা কাজ করে — **Linear Algebra** (matrix operation) আর **Calculus** (gradient descent)। ভয় পাওয়ার কিছু নেই — আমরা intuitive ভাবে বুঝব, textbook-এর মতো প্রমাণ করব না।

## Scalars, Vectors, Matrices, Tensors

ডাটার প্রতিটা আকারের একটা নাম আছে:

| নাম | কী | NumPy উদাহরণ | Dimension |
|---|---|---|---|
| Scalar | একটা সংখ্যা | `np.array(5)` | 0D |
| Vector | সংখ্যার list | `np.array([1, 2, 3])` | 1D |
| Matrix | সংখ্যার গ্রিড | `np.array([[1,2],[3,4]])` | 2D |
| Tensor | n-ডাইমেনশনাল অ্যারে | `np.zeros((2,3,4))` | 3D+ |

নিচের কোডে `np.array` দিয়ে বিভিন্ন ডাইমেনশনের NumPy array তৈরি করা হয়েছে। `.shape` attribute দিয়ে প্রতিটা array-এর dimension দেখা যায় — deep learning-এ shape বোঝা খুব important কারণ প্রতিটা layer-এর input আর output shape মিলতে হয়।

```python
import numpy as np

scalar = 3.14
vector = np.array([1.0, 2.0, 3.0])       # shape: (3,)
matrix = np.array([[1, 2], [3, 4]])       # shape: (2, 2)
tensor = np.zeros((2, 3, 4))              # shape: (2, 3, 4) — ২টা ৩×৪ matrix

print(f"Vector shape: {vector.shape}")
print(f"Tensor shape: {tensor.shape}")
```

Deep learning-এ image হলো 3D tensor `(height, width, channels)`, আর এক batch image হলো 4D tensor `(batch, height, width, channels)`।

## কেন Linear Algebra? — Weight × Input

Neural network-এর প্রতিটা layer মূলত একটা matrix multiplication করে। ধরো একটা layer-এ ৩টা input আছে আর ২টা output প্রয়োজন:

```text
Input: [x₁, x₂, x₃]     shape: (3,)

Weight matrix:           shape: (3, 2)
┌ w₁₁  w₁₂ ┐
│ w₂₁  w₂₂ │
└ w₃₁  w₃₂ ┘

Output = Input × Weight  shape: (2,)
```

প্রতিটা output হলো সব input-এর weighted sum:

$$y_1 = x_1 w_{11} + x_2 w_{21} + x_3 w_{31}$$

```python
# পুরো layer এক লাইনে
input_vec = np.array([1.0, 2.0, 3.0])
weights = np.array([[0.1, 0.4],
                    [0.2, 0.5],
                    [0.3, 0.6]])
biases = np.array([0.1, 0.2])

output = input_vec @ weights + biases   # @ = matrix multiply
print(output)  # [1.5  3.3]
```

পুরো নেটওয়ার্ক হলো এই ধরনের অনেকগুলো matrix multiplication-এর chain।

## Dot Product — Similarity Measure

Dot product হলো দুটা vector-এর উপাদান-উপাদান গুণ করে যোগ করা:

$$\vec{a} \cdot \vec{b} = a_1 b_1 + a_2 b_2 + \dots + a_n b_n$$

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

dot_product = np.dot(a, b)   # 1×4 + 2×5 + 3×6 = 32
```

Dot product বড় হলে দুটো vector একই direction-এ আছে — attention mechanism-এ query আর key-এর dot product করে similarity measure করা হয়।

## Derivative আর Gradient — Loss-এর ঢাল

Calculus-এর সবচেয়ে গুরুত্বপূর্ণ ধারণা — **derivative** বা **slope**।

একটা simple function: $y = x^2$

```text
        y
        │        ╱
        │      ╱
        │    ╱
        │  ╱        derivative (slope):
        │╱          পাহাড়ের ঢাল কোন দিকে?
  ──────┼────── x   ঢাল নিচে হলে সেদিকে যাও — loss কমবে
```

Derivative বলে দেয় function কোন দিকে বাড়ছে আর কোন দিকে কমছে।

$$\frac{d}{dx} x^2 = 2x$$

$x = 3$ হলে slope $= 6$ (ধনাত্মক, মানে $x$ বাড়ালে $y$ বাড়বে)।
$x = -3$ হলে slope $= -6$ (ঋণাত্মক, মানে $x$ কমালে $y$ বাড়বে)।

> [!tip] Intuition
# পাহাড়ে দাঁড়িয়ে আছো, চোখ বন্ধ করে পায়ের নিচে ঢাল অনুভব করছো। ঢাল যেদিকে নিচে, সেদিকে এক কদম হাঁটলে তুমি নিচে নামবে। Gradient ঠিক সেই ঢাল — এটা বলে দেয় কোন দিকে গেলে loss কমবে।

## Partial Derivative — একাধিক Variable

Function-এ যখন অনেক variable থাকে, তখন একটা variable ধরে রেখে বাকিগুলোর সাপেক্ষে derivative করা হয় — এটাই partial derivative।

$$f(x, y) = x^2 + y^2$$

$$\frac{\partial f}{\partial x} = 2x, \quad \frac{\partial f}{\partial y} = 2y$$

সব partial derivative একসাথে একটা vector হয় — এটাই **gradient** $\nabla f$:

$$\nabla f = \left[\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}\right] = [2x, 2y]$$

Gradient হলো এমন একটা vector যে **loss বাড়ার দিক** নির্দেশ করে। আমরা উল্টো দিকে গেলে loss কমবে।

## Chain Rule — Backpropagation-এর ইঞ্জিন

Neural network-এ অনেক layer থাকে, একটার output পরেরটার input। Loss কমাতে হলে প্রতিটা weight-এর উপর কতটা প্রভাব পড়ে সেটা বের করতে হয়। এটাই chain rule করে:

$$y = f(g(x))$$

$$\frac{dy}{dx} = \frac{dy}{dg} \times \frac{dg}{dx}$$

```text
x → [Layer 1] → h₁ → [Layer 2] → h₂ → [Layer 3] → Loss
                                                    │
              ◄────── chain rule ◄─────── ◄─────────┘
              প্রতিটা layer-এর gradient আলাদা বের হয়
```

মানে — loss থেকে শুরু করে পেছনে পেছনে প্রতিটা layer-এর gradient বের হয়। এই process-কে **backpropagation** বলে। PyTorch/TensorFlow স্বয়ংক্রিয়ভাবে এই chain rule করে (autograd)।

> [!note] Autograd — তোমাকে করতে হবে না
# PyTorch-র `autograd` বা TensorFlow-র `GradientTape` স্বয়ংক্রিয়ভাবে সব partial derivative আর chain rule হিসাব করে। তুমি শুধু forward pass লেখো, gradient স্বয়ংক্রিয়ভাবে বের হয়ে যাবে। কিন্তু কী হচ্ছে সেটা বোঝা জরুরি।

## Gradient Descent — পাহাড় থেকে নামা

Loss function-এর সর্বনিম্ন বিন্দু (minimum) খুঁজে বের করার পদ্ধতি:

$$\theta_{new} = \theta_{old} - \eta \cdot \nabla L$$

যেখানে:
- $\theta$ = model parameters (weights)
- $\eta$ = learning rate (কদমের দৈর্ঘ্য)
- $\nabla L$ = loss-এর gradient

```text
Loss
 │
 │ \
 │  \        উপর থেকে নিচে নামছো
 │   \       প্রতি কদমে gradient-এর উল্টো দিকে যাও
 │    \___
 │        \___
 │            \____
 │                 \___________  ← Minimum (সেরা উত্তর)
 └───────────────────────────── Parameters
```

```python
# সহজ gradient descent উদাহরণ
import numpy as np

# f(x) = x² - এর minimum খুঁজি
x = 5.0           # শুরুর অবস্থান
lr = 0.1          # learning rate

for step in range(50):
    gradient = 2 * x       # df/dx = 2x
    x = x - lr * gradient  # update
    if step % 10 == 0:
        print(f"Step {step}: x = {x:.4f}")

print(f"Final: x = {x:.4f}")  # x ≈ 0 (minimum)
```

## Learning Rate — কদমের দৈর্ঘ্য

Learning rate ($\eta$) খুব গুরুত্বপূর্ণ hyperparameter:

| Learning Rate | কী হবে |
|---|---|
| খুব বড় | minimum skip করে হারিয়ে যাবে (diverge) |
| খুব ছোট | অনেক ধীর, সময় নষ্ট |
| ঠিক | দ্রুত আর নিরাপদে minimum-এ পৌঁছাবে |

```text
Loss
 │      বড় lr: এদিক-ওদিক লাফাচ্ছে, diverge
 │     /\
 │    /  \      ঠিক lr: মসৃণভাবে নিচে নামছে
 │   /    \___
 │  /         \___
 │ /              \____
 │  ছোট lr: অনেক ধীরে নামছে
 └──────────────────────── Steps
```

> [!tip] Learning rate scheduling
# 2026-এ standard practice হলো training শুরুতে বড় learning rate, ধীরে ধীরে কমানো (warmup + cosine decay)। PyTorch-এ `torch.optim.lr_scheduler.CosineAnnealingLR` দিয়ে এটা করা যায়।

## Practical — NumPy দিয়ে সম্পূর্ণ Concept

নিচের কোডে NumPy দিয়ে একটা complete neuron তৈরি করা হয়েছে — `np.dot(x, weights)` দিয়ে input আর weight-এর matrix multiplication, তারপর `np.exp` দিয়ে sigmoid activation। এরপর gradient descent manually implement করা হয়েছে — `np.outer` দিয়ে gradient calculate করে weight update করা হয়। এটা দেখায় যে PyTorch/TF এর ভেতরে আসলে কী হচ্ছে।

```python
import numpy as np

# একটা ছোট "neuron" — linear + activation
def neuron(x, weights, bias):
    z = np.dot(x, weights) + bias     # linear algebra
    return 1 / (1 + np.exp(-z))       # sigmoid activation

# Forward pass
x = np.array([0.5, -0.3, 0.8])
W = np.array([[0.1, 0.4], [-0.2, 0.5], [0.3, -0.1]])
b = np.array([0.1, -0.2])

hidden = neuron(x, W, b)
print(f"Hidden layer output: {hidden}")

# Gradient descent — loss কমানো
target = np.array([1.0, 0.0])
lr = 0.01

for epoch in range(100):
    output = neuron(x, W, b)
    error = output - target           # loss-এর derivative সহজ রূপ
    # gradient update (autograd না থাকলে হাতে করতে হয়)
    grad_W = np.outer(x, error * output * (1 - output))
    W = W - lr * grad_W

final = neuron(x, W, b)
print(f"After training: {final}")
```

> [!example] Framework-এ সব automatic
# PyTorch 2.x-এ সব matrix math, gradient, chain rule `torch.Tensor` আর `autograd` স্বয়ংক্রিয়ভাবে করে। তোমার শুধু forward pass লেখা লাগে। `torch.compile` দিয়ে এই math-গুলো আরও fast compile করা যায়। কিন্তু ভেতরে কী হচ্ছে সেটা বোঝা এতটুকু জরুরি।