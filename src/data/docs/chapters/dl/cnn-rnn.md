# CNN আর RNN

সাধারণ neural network সব কাজে কাজে লাগে না। Image এর জন্য একরকম structure, sequence data এর জন্য অন্য রকম। এই chapter এ দেখবো দুটো special architecture — CNN (image এর রাজা) আর RNN/LSTM (sequence এর কিংবদন্তি)।

## CNN — Convolutional Neural Network

### সাধারণ NN দিয়ে Image কেন নয়?

ভাবো একটা 224×224 রঙের ছবি। এর pixel সংখ্যা = 224×224×3 = ১.৫ লক্ষ। যদি একটা fully connected layer বানাও 1000 neuron এর, তাহলে শুধু প্রথম layer এ parameter = ১.৫ লাখ × ১০০০ = ১৫ কোটি! এতো প্যারামিটার train করা প্রায় অসম্ভব, আর overfitting নিশ্চিত।

```text
Plain NN on image:
  224×224×3 = 150,528 input
       ↓
  First layer: 150,528 × 1000 = 150M parameters!
  → too many, too slow, overfits
```

এই সমস্যা সমাধান করতে CNN আসে। CNN parameter শেয়ার করে, আর spatial structure কাজে লাগায়।

> [!note] Spatial Structure
> Image এ pixel গুলোর একটা spatial সম্পর্ক আছে — কাছের pixel গুলো একসাথে যায়। CNN এই structure কাজে লাগায়। Plain NN সব pixel কে independent ভাবে।

## Convolution Operation

CNN এর মূল ইঞ্জিন হলো convolution। একটা ছোট filter (kernel) ছবির উপর দিয়ে slide করে যায়, আর feature map বানায়।

```text
Image (5×5):          Filter (3×3):       Output (3×3):
 ┌─────────────┐      ┌───────┐           ┌───────┐
 │ 1  2  0  1  3│      │ 1  0  │           │ 5  3  │
 │ 0  1  2  1  0│      │ 0  1  │           │ ...   │
 │ 1  0  1  3  2│      │ 1  0  │           │       │
 │ 2  1  0  1  1│      └───────┘           └───────┘
 │ 0  1  2  3  1│
 └─────────────┘
   filter slide করে feature detect করে
```

প্রতিটা position এ filter আর image এর corresponding part গুণ হয়, যোগ হয়, একটা value বের হয়। নিচের কোডে `in_channels=3` মানে রঙের ছবির ৩টা channel (RGB), `out_channels=16` মানে ১৬টা ভিন্ন filter শিখবে (ফলে ১৬টা feature map তৈরি হবে)। `kernel_size=3` হলো ৩×৩ আকারের filter, `stride=1` মানে এক ঘর করে move করবে, আর `padding=1` দিয়ে চারপাশে zero বসানো হয় যাতে output-এর size input-এর সমান থাকে।

```python
import torch
import torch.nn as nn

# একটা conv layer
conv = nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3, stride=1, padding=1)

# dummy image: batch=1, channel=3, 32×32
image = torch.randn(1, 3, 32, 32)
output = conv(image)
print(output.shape)   # torch.Size([1, 16, 32, 32])
```

মূল concept:

- **Kernel/Filter** — ছোট weight matrix যেটা feature detect করে
- **Stride** — কত ঘর করে skip করে filter move করবে
- **Padding** — চারপাশে zero বসিয়ে output size ঠিক রাখা

> [!tip] Feature স্বয়ংক্রিয়ভাবে শেখে
> CNN filter এর weight মানুষ দেয় না — model নিজে train করার সময় শেখে। প্রথম layer edge, পরের layer shape, এভাবে hierarchical হয়।

## Pooling Layer

Pooling layer image ছোট করে, computation কমায়, আর translation invariance আনে।

```text
Max Pooling (2×2):

Input (4×4):          Output (2×2):
 ┌───────────┐         ┌────────┐
 │ 1  3  2  1│         │ 3  4   │
 │ 2  1  4  0│   →     │ 5  6   │
 │ 4  5  1  2│         └────────┘
 │ 3  2  6  1│
 └───────────┘
  প্রতিটা 2×2 ব্লক থেকে max নেওয়া
```

দুই ধরনের pooling:
- **Max Pooling** — সবচেয়ে জনপ্রিয়, সবচেয়ে বড় value নেয়
- **Average Pooling** — গড় নেয়

`nn.MaxPool2d(kernel_size=2, stride=2)` মানে প্রতিটা ২×২ window থেকে সবচেয়ে বড় value টা নেওয়া হবে, আর `stride=2` দিয়ে পরের window-এ যাওয়া হবে — ফলে feature map-এর size অর্ধেক হয়ে যায়। যেমন ৩২×৩২ input থেকে ১৬×১৬ output আসবে।

```python
pool = nn.MaxPool2d(kernel_size=2, stride=2)
x = torch.randn(1, 16, 32, 32)
out = pool(x)
print(out.shape)   # torch.Size([1, 16, 16, 16])
```

## Typical CNN Architecture

একটা classic CNN এর structure:

```text
Input Image
    ↓
[Conv → ReLU → Pool]    ← feature extraction
    ↓
[Conv → ReLU → Pool]
    ↓
[Conv → ReLU → Pool]
    ↓
Flatten
    ↓
[Fully Connected]       ← classification
    ↓
[Softmax]
    ↓
Output (class probabilities)
```

## Famous CNN Architectures

ইতিহাসে কিছু legendary CNN architecture আছে:

| Model | Year | বৈশিষ্ট্য |
|-------|------|----------|
| **LeNet** | 1998 | প্রথম CNN, digit recognition |
| **AlexNet** | 2012 | Deep learning revolution |
| **VGG** | 2014 | Uniform 3×3 filter |
| **ResNet** | 2015 | Skip connection, 152 layer |
| **EfficientNet** | 2019 | Optimal scaling |
| **ConvNeXt** | 2022 | Modern, transformer কে challenge |

> [!note] ResNet এর যাদু
> ResNet skip connection আনে — input কে কয়েক layer পরে যোগ করে দেয়। এতে অনেক deep network train করা যায়। এটা ছাড়া ১০০+ layer network train করা প্রায় অসম্ভব ছিল।

## Practical — CNN with PyTorch

একটা সম্পূর্ণ CNN classifier দেখি: প্রথমে `conv1` ১টা channel থেকে ৩২টা feature map extract করে, `pool` ছবির size অর্ধেক করে, `conv2` ৩২ থেকে ৬৪ channel বানায়। তারপর `x.view(-1, ...)` দিয়ে ২D feature map কে ১D vector-এ flatten করা হয়, যাতে fully connected layer-এ ঢোকানো যায়। শেষে ১০টা class-এর output আসে। Training loop আগের মতোই — forward → loss → zero_grad → backward → step।

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

train_data = datasets.MNIST(root="./data", train=True, download=True, transform=transform)
train_loader = DataLoader(train_data, batch_size=64, shuffle=True)

class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, 3)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(32, 64, 3)
        self.fc1 = nn.Linear(64 * 5 * 5, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = x.view(-1, 64 * 5 * 5)
        x = torch.relu(self.fc1(x))
        return self.fc2(x)

model = SimpleCNN()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

for epoch in range(3):
    for images, labels in train_loader:
        outputs = model(images)
        loss = criterion(outputs, labels)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")
```

এই simple CNN MNIST এ ৯৯%+ accuracy দেয় — plain NN এর চেয়ে অনেক ভালো।

> [!tip] CNN সব কাজে
> Image classification ছাড়াও CNN object detection, face recognition, medical image analysis — সব জায়গায় use হয়। 2026 পর্যন্ত medical imaging এ CNN এখনো dominant।

## RNN — Sequential Data এর জন্য

RNN (Recurrent Neural Network) sequence data এর জন্য design করা — যেমন text, speech, time series। এখানে order matter করে।

```text
Sequence: "I love deep learning"

RNN প্রতিটা word একসাথে process করে, আর memory রাখে:

  word1 ──► [RNN] ──► h1 ──┐
                          │
  word2 ──► [RNN] ──► h2 ──┐
                          │
  word3 ──► [RNN] ──► h3 ──► output
```

প্রতিটা step এ RNN দুটো জিনিয়ে input নেয়: current word আর আগের hidden state। hidden state এ আগের তথ্য store থাকে। নিচের কোডে `input_size=10` মানে প্রতিটা input token ১০-ডাইমেনশনের vector, `hidden_size=20` মানে RNN-এর memory ২০-ডাইমেনশনের (বড় হলে বেশি মনে রাখতে পারে কিন্তু বেশি parameter লাগে)। `batch_first=True` দিলে input shape হয় `(batch, sequence_length, input_size)` — এটা পড়তে সহজ বলে default হিসেবে use করা হয়।

```python
import torch.nn as nn

rnn = nn.RNN(input_size=10, hidden_size=20, batch_first=True)
x = torch.randn(1, 5, 10)   # batch=1, seq_len=5, input=10
output, hidden = rnn(x)
print(output.shape)   # torch.Size([1, 5, 20])
```

## Vanishing Gradient Problem

RNN এর একটা বড় সমস্যা — লম্বা sequence তে আগের তথ্য ভুলে যায়। কারণ gradient backprop এ সময়ে হারিয়ে যায়।

```text
Long sentence:
"The cat, which I saw yesterday near the river, ... was hungry"

RNN "cat" এর কথা ভুলে গিয়ে "was" এ গিয়ে confuse হয়।
```

> [!warn] RNN এর দুর্বলতা
> ৫০+ word sequence তে plain RNN প্রায় useless। এই সমস্যা সমাধান করতেই LSTM আর GRU আসে।

## LSTM — স্মার্ট Memory

LSTM (Long Short-Term Memory) RNN এর উন্নত version। এতে gate নামে তিনটা mechanism থাকে যেগুলো memory নিয়ন্ত্রণ করে।

```text
LSTM এর তিনটা Gate:

1. Forget Gate:   আগের তথ্য কী মনে রাখবে, কী ভুলবে
2. Input Gate:    নতুন তথ্য কতটা add করবে
3. Output Gate:   কোন তথ্য output দেবে
```

```text
       ┌─────────────────────────────┐
       │  Forget Gate  Input Gate    │
prev ─►│       │           │         │─► new hidden
state  │       ▼           ▼         │    state
       │    [memory cell update]     │
       │       │                     │
       │  Output Gate ─────────      │
       └─────────────────────────────┘
```

LSTM-এর parameter গুলো RNN-এর মতোই — `input_size` আর `hidden_size`। পার্থক্য হলো LSTM দুটো জিনিস return করে: `hidden` (short-term memory, যেমন RNN-এ) আর `cell` (LSTM-এর নিজস্ব long-term memory state)। এই cell state-ই হলো LSTM-এর মূল শক্তি — এর ভেতর দিয়ে information সহজে flow করতে পারে, ফলে দীর্ঘ sequence-ও মনে রাখতে পারে।

```python
lstm = nn.LSTM(input_size=10, hidden_size=20, batch_first=True)
x = torch.randn(1, 10, 10)
output, (hidden, cell) = lstm(x)
print(output.shape)
```

> [!example] LSTM এর জাদু
> LSTM ১৯৯৭ সালে আসে। ২০ বছর ধরে sequential data এর রাজা ছিল। Machine translation, speech recognition, text generation — সব জায়গায়। 2017 পর্যন্ত।

## GRU — LSTM এর ছোট ভাই

GRU (Gated Recurrent Unit) LSTM এর simplified version। কম parameter, fast, প্রায় same performance।

```python
gru = nn.GRU(input_size=10, hidden_size=20, batch_first=True)
```

| বিষয় | LSTM | GRU |
|-------|------|-----|
| Gate | ৩ টা | ২ টা |
| Parameter | বেশি | কম |
| Speed | slow | fast |
| Performance | একটু বেশি | প্রায় same |

> [!tip] কোনটা use করবে
> ছোট dataset বা speed দরকার — GRU। দীর্ঘ sequence বা বেশি accuracy — LSTM। তবে 2026 এ নতুন project এ transformer ই best choice।

## Practical — Text Generation with LSTM

একটা simple character-level text generation model:

```python
class TextGenLSTM(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x, hidden=None):
        emb = self.embed(x)
        out, hidden = self.lstm(emb, hidden)
        return self.fc(out), hidden

model = TextGenLSTM(vocab_size=100, embed_dim=32, hidden_dim=64)
x = torch.randint(0, 100, (1, 10))
out, hidden = model(x)
print(out.shape)   # torch.Size([1, 10, 100])
```

## CNN vs RNN — কখন কোনটা?

```text
Image, Spatial Data ──► CNN
Sequence, Time Data  ──► RNN/LSTM (or Transformer)
```

> [!danger] 2026 Reality Check
> RNN/LSTM এখন legacy। নতুন project এ sequence data এর জন্য transformer use করো। RNN শুধু শেখার জন্য আর পুরোনো code maintain করার জন্য দরকার। Transformer RNN কে প্রায় সব জায়গায় হারিয়ে দিয়েছে।

## Summary

CNN image এর জন্য, RNN/LSTM sequence এর জন্য। CNN convolution + pooling দিয়ে hierarchical feature শেখে। RNN hidden state দিয়ে memory রাখে, LSTM gate দিয়ে long-term memory যোগ করে। 2026 এ image এ CNN এখনো relevant, কিন্তু sequence এ transformer চ্যাম্পিয়ন। পরের chapter এ framework comparison দেখবো।