# Neural Network এর কাজ

আগের chapter এ আমরা দেখলাম deep learning কী। এবার ঢুকবো ভেতরে — একটা neural network আসলে কীভাবে কাজ করে? forward pass, backpropagation, gradient descent — এই সব মিস্ট্রি আজ খুলবো। শেষে PyTorch দিয়ে একদম কাজের একটা example দেখবো।

## Neural Network এর Structure

একটা neural network মূলত তিন ধরনের layer নিয়ে গঠিত:

```text
Input Layer      Hidden Layer 1      Hidden Layer 2      Output Layer
   x1 ──────────────► h1 ──────────────► h4 ──────────────► y1
   x2 ──────────────► h2 ──────────────► h5 ──────────────► y2
   x3 ──────────────► h3 ──────────────► h6
```

- **Input Layer** — raw feature ঢোকে এখানে
- **Hidden Layer** — এখানেই actual learning হয় (এক বা একাধিক)
- **Output Layer** — চূড়ান্ত prediction

প্রতিটা connection এ একটা weight থাকে। প্রতিটা neuron এ একটা bias থাকে। এই weight আর bias ই হলো সেই জিনিস যা model train করার সময় শেখে।

> [!note] Parameter সংখ্যা
> একটা 784-128-64-10 network (MNIST এর জন্য) এ parameter সংখ্যা = 784×128 + 128×64 + 64×10 = ১ লক্ষ+। এতো সংখ্যক parameter model কে flexible করে।

## Forward Pass — সিগন্যাল যাওয়া

Forward pass হলো input থেকে output পর্যন্ত সিগন্যাল পাঠানো। প্রতিটা layer এ দুটো কাজ হয়:

1. **Linear transformation** — `z = W·x + b`
2. **Activation** — `a = activation(z)`

নিচের কোডে `np.dot(W, x)` হলো matrix multiplication — weight matrix `W` আর input vector `x` কে গুণ করে একটা নতুন vector বানায়। এটাই একটা layer-এর মূল কাজ। `relu` function ০-এর নিচের সব value কে ০ করে দেয়, যাতে non-linearity আসে।

```python
import numpy as np

def forward(x, W, b, activation):
    z = np.dot(W, x) + b
    return activation(z)

x = np.array([1.0, 2.0, 3.0])
W = np.random.randn(4, 3)
b = np.random.randn(4)

def relu(z):
    return np.maximum(0, z)

output = forward(x, W, b, relu)
print(output)
```

পুরো network এ এটাই layer এর পর layer হয়।

## Activation Function — কোনটা কখন?

Activation function non-linearity আনে। এটা না থাকলে যত layer ই থাকুক, network একটা linear model হয়ে যায়।

| Function | Range | কখন ব্যবহার |
|----------|-------|------------|
| **ReLU** | [0, ∞) | Hidden layer (default) |
| **Sigmoid** | (0, 1) | Binary classification output |
| **Tanh** | (-1, 1) | Hidden layer (RNN এ) |
| **Softmax** | probability | Multi-class output |

```python
import torch
import torch.nn.functional as F

x = torch.tensor([-2.0, -1.0, 0.0, 1.0, 2.0])

print("ReLU:", F.relu(x))
print("Sigmoid:", torch.sigmoid(x))
print("Tanh:", torch.tanh(x))
print("Softmax:", F.softmax(x, dim=0))
```

> [!tip] ReLU দিয়ে শুরু
> Hidden layer এ ReLU দিয়ে শুরু করো। কারণ — fast, কম vanishing gradient problem, আর বেশিরভাগ ক্ষেত্রে সেরা কাজ করে। এটাই 2026 এর default।

## Loss Function — ভুল মাপা

Model এর prediction আর আসল উত্তরের মধ্যে কতটা পার্থক্য — সেটা measure করে loss function। Model এর লক্ষ্য এই loss কমানো।

```text
Loss = how wrong the model is

MSE (Mean Squared Error):     regression এর জন্য
Cross-Entropy:                classification এর জন্য
```

```python
import torch.nn as nn

# regression
mse_loss = nn.MSELoss()
pred = torch.tensor([2.5, 3.1])
actual = torch.tensor([3.0, 3.0])
print("MSE:", mse_loss(pred, actual))

# classification
ce_loss = nn.CrossEntropyLoss()
logits = torch.tensor([[2.0, 0.1, -1.0]])
target = torch.tensor([0])
print("CE:", ce_loss(logits, target))
```

> [!note] Cross-Entropy কেন
> Classification এ cross-entropy MSE এর চেয়ে ভালো কাজ করে। কারণ এটা probability distribution compare করে, আর gradient বেশি strong দেয়।

## Gradient Descent — ভুল থেকে শেখা

Gradient descent এর ভাবনা সোজা — পাহাড়ের উপরে দাঁড়িয়ে আছো, নিচে নামতে হবে। যেদিকে ঢাল কম, সেদিকে এক পা যাও। আবার দেখো, আবার পা। এভাবেই ক্রমে নিচে পৌঁছাবে।

```text
Loss
 │
 │  \
 │   \        \
 │    \      /  \
 │     \___/      \___
 │                    \____
 └─────────────────────────► Weight
        ↑    ↑    ↑
       step গুলো
```

```python
learning_rate = 0.01

# gradient descent step
with torch.no_grad():
    weight -= learning_rate * weight.grad
```

`learning_rate` হলো পা এর দৈর্ঘ্য। অনেক বড় হলে minimum পার হয়ে যাবে, অনেক ছোট হলে সময় লাগবে।

> [!warn] Learning Rate সবচেয়ে important
> LR বেশি বড় — model diverge করবে। LR বেশি ছোট — training slow আর stuck হতে পারে। সাধারণত 0.001 থেকে শুরু করো। Adam optimizer এ 0.001 default।

## Backpropagation — ভুল ছড়ানো

Forward pass এ prediction হলো। এখন loss বের হলো। কিন্তু কোন weight কতটা পরিবর্তন করবে? এটা বের করার প্রক্রিয়াই backpropagation।

Backpropagation chain rule of calculus ব্যবহার করে। ভাবো — output থেকে পেছনে পেছনে loss এর দায় ভাগ করে দেওয়া হয় প্রতিটা weight এ।

```text
Forward:  x → z1 → a1 → z2 → a2 → loss
Backward: loss → ∂/∂a2 → ∂/∂z2 → ∂/∂a1 → ∂/∂z1 → ∂/∂W
```

ভাগ্য ভালো, PyTorch এই সব automatically করে দেয় — `autograd` নামে। আমাদের হাতে হাতে chain rule মাথায় রাখতে হয় না।

```python
import torch

x = torch.tensor(2.0, requires_grad=True)
y = x ** 2 + 3 * x + 1
y.backward()   # autograd computes gradient
print(x.grad)  # dy/dx = 2x + 3 = 7
```

> [!example] Chain Rule সহজ করে
> ভাবো একটা পাইপ লাইন। শেষ থেকে পানি ফেরত পাঠাচ্ছো — প্রতিটা joint এ একটু একটু করে ভাগ হয়। Backprop ঠিক তেমনি loss কে ভাগ করে weight এর উপর distribute করে।

## Epoch, Batch Size, Iteration

Training এ তিনটা term প্রায়ই আসে:

- **Epoch** — পুরো dataset একবার দেখা
- **Batch Size** — একসাথে কতটা sample process করবে
- **Iteration** — এক epoch এ কতবার weight update

```text
Dataset: 1000 samples
Batch Size: 100
→ Iteration per epoch: 1000 / 100 = 10
→ 1 epoch = 10 iterations
```

Mini-batch gradient descent সবচেয়ে জনপ্রিয় — পুরো dataset না দেখে, ছোট batch এ দেখে update করে। Memory efficient আর fast।

> [!tip] Batch Size
> GPU memory অনুযায়ী batch size বেছো। সাধারণত 32, 64, 128 জনপ্রিয়। বড় batch = stable gradient, কিন্তু memory বেশি লাগে।

## Practical Example — MNIST with PyTorch

এবার একদম complete example দেখি। MNIST digit classification — 28×28 পিক্সেলের হাতের লেখা digit (0-9) চিনবে। এখানে `torchvision` হলো PyTorch-এর image dataset library — এর ভেতরে MNIST, CIFAR সহ বিখ্যাত dataset ready পাওয়া যায়। `transforms.Compose` দিয়ে image-এ কী preprocessing হবে সেটা define করা হয় (যেমন image কে tensor-এ রূপান্তর)। Model-টি তিনটা fully connected layer নিয়ে তৈরি — `28*28 = 784` input থেকে শুরু করে ধাপে ধাপে ছোট হয়ে শেষে ১০টা class-এর output দেয়।

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# 1. Data prepare
transform = transforms.Compose([transforms.ToTensor()])
train_data = datasets.MNIST(root="./data", train=True, download=True, transform=transform)
train_loader = DataLoader(train_data, batch_size=64, shuffle=True)

# 2. Model define
class SimpleNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(28 * 28, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 10)

    def forward(self, x):
        x = x.view(-1, 28 * 28)
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

model = SimpleNN()

# 3. Loss and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 4. Training loop
for epoch in range(3):
    for images, labels in train_loader:
        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")
```

> [!note] zero_grad কেন
> PyTorch gradient accumulate করে। তাই প্রতিটা step এ আগের gradient মুছে ফেলতে হয় — তাই `optimizer.zero_grad()`। নাহলে ভুল gradient হবে।

## Training Loop — ধাপে ধাপে

প্রতিটা iteration এ যা হয়:

```text
1. Forward Pass:    predictions = model(inputs)
2. Compute Loss:    loss = criterion(predictions, labels)
3. Zero Gradient:   optimizer.zero_grad()
4. Backward Pass:   loss.backward()
5. Update Weights:  optimizer.step()
```

এই ৫ টা ধাপই হলো deep learning training এর মূল। যেকোনো framework, যেকোনো model — এই pattern ই থাকে।

```python
# এক iteration এর সম্পূর্ণ code
images, labels = next(iter(train_loader))

# step 1
outputs = model(images)

# step 2
loss = criterion(outputs, labels)

# step 3
optimizer.zero_grad()

# step 4
loss.backward()

# step 5
optimizer.step()
```

## Model Evaluation

Train হওয়ার পর model এর আসল পরীক্ষা test data তে। Evaluation এর সময় `model.eval()` দিয়ে model কে inference mode-এ নিতে হয়, আর `torch.no_grad()` দিয়ে gradient tracking বন্ধ করতে হয় — এতে memory বাঁচে আর calculation দ্রুত হয়। `torch.max(outputs, 1)` প্রতিটা sample-এর সবচেয়ে বড় probability-ওয়ালা class বের করে।

```python
test_data = datasets.MNIST(root="./data", train=False, transform=transform)
test_loader = DataLoader(test_data, batch_size=1000)

correct = 0
total = 0
model.eval()
with torch.no_grad():
    for images, labels in test_loader:
        outputs = model(images)
        _, predicted = torch.max(outputs, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

print(f"Accuracy: {100 * correct / total:.2f}%")
```

সাধারণত এই simple network ৯৭%+ accuracy দেয় MNIST এ।

> [!tip] train() আর eval()
> Training এর সময় `model.train()`, evaluation এর সময় `model.eval()`। Dropout, BatchNorm এর মতো layer behavior এর উপর নির্ভর করে। ভুলে গেলে ভুল ফলাফল আসবে।

## Summary

Neural network এর কাজ হলো forward pass এ prediction করা, loss মাপা, তারপর backpropagation দিয়ে gradient বের করে weight update করা। Activation function non-linearity আনে, loss function ভুল মাপে, optimizer weight update করে। PyTorch এ এই পুরো process মাত্র কয়েক লাইনে হয়। পরের chapter এ দেখবো CNN আর RNN — image আর sequence data এর জন্য special network।