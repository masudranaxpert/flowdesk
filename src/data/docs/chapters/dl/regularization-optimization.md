## Overfitting — Model যখন মুখস্থ করে ফেলে

Overfitting হলো deep learning-এর সবচেয়ে common সমস্যা। Model training data-র pattern না শিখে পুরো training set মুখস্থ করে ফেলে — ফলে নতুন ডাটায় (test/production) খারাপ ফল দেয়।

```text
Training Accuracy:  99%  😍
Test Accuracy:      65%  😱
                     ↑
              Overfitting! Training মুখস্থ করেছে, generalization হয়নি
```

> [!warn] Training accuracy high ≠ ভালো model
# অনেকেই training accuracy ৯৯% দেখে খুশি হয়ে যায়। কিন্তু আসল পরীক্ষা হলো validation/test accuracy। Train আর test-এর মধ্যে অনেক gap থাকলে overfitting নিশ্চিত।

## Dropout — র‍্যান্ডম Neuron বন্ধ করা

Dropout training-এর সময় random ভাবে কিছু neuron "বন্ধ" করে দেয় (zero করে দেয়)। ফলে model একটা নির্দিষ্ট neuron-এর উপর অতিরিক্ত নির্ভর করতে পারে না — সব neuron-কে কাজে লাগাতে হয়।

```text
Normal Network:          With Dropout (p=0.5):
 ┌───────────┐            ┌───────────┐
 │  ○  ○  ○  │            │  ○  ✕  ○  │   ← ✕ = dropped
 │   \ | /   │            │   \ | /   │
 │    ○ ○    │            │    ✕ ○    │
 │     |     │            │     |     │
 │     ○     │            │     ○     │
 └───────────┘            └───────────┘
 সব connected             কিছু randomly off
```

```python
import torch
import torch.nn as nn

class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.dropout1 = nn.Dropout(p=0.3)     # ৩০% dropout
        self.fc2 = nn.Linear(256, 128)
        self.dropout2 = nn.Dropout(p=0.3)
        self.fc3 = nn.Linear(128, 10)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.dropout1(x)                  # training-এ চলে, eval-এ না
        x = torch.relu(self.fc2(x))
        x = self.dropout2(x)
        return self.fc3(x)
```

> [!note] Dropout training বনাম inference
# Dropout শুধু training mode-এ active (`model.train()`)। Inference-এ (`model.eval()`) dropout off থাকে — সব neuron active থাকে। ভুলে গেলে খারাপ ফল আসবে।

## L1/L2 Weight Regularization

Weight-গুলো অনেক বড় হয়ে গেলে overfitting বাড়ে। Regularization weight-গুলো ছোট রাখে:

**L2 (Weight Decay):** loss-এ weights-এর square যোগ করো:

$$L_{total} = L_{data} + \lambda \sum_i w_i^2$$

**L1:** weights-এর absolute value যোগ করো:

$$L_{total} = L_{data} + \lambda \sum_i |w_i|$$

```python
# PyTorch-তে weight decay (L2)
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
    weight_decay=0.01,    # L2 regularization strength
)
```

> [!tip] Adam + weight_decay ≠ AdamW
# আগে `Adam`-এ `weight_decay` প্যারামিটার ছিল কিন্তু সেটা ভুল ভাবে implement করা ছিল। `AdamW` correct way — 2026-এ standard optimizer হলো **AdamW**।

## Batch Normalization আর Layer Norm

Normalization training অনেক stable আর fast করে। দুটো ধরন:

**Batch Norm:** এক batch-এর মধ্যে প্রতিটা feature-এর mean আর variance বের করে normalize করে। CNN-এ ভালো কাজ করে।

**Layer Norm:** একটা sample-এর সব feature-এর mean আর variance নিয়ে normalize করে। Transformer/RNN-এ ব্যবহৃত।

```python
# Batch Norm — CNN-এর জন্য
self.bn = nn.BatchNorm2d(64)      # 64 channels

# Layer Norm — Transformer-এর জন্য
self.ln = nn.LayerNorm(768)       # hidden dim 768
```

## Data Augmentation

ডাটা কৃত্রিমভাবে বাড়ানো — একই image-এর অনেক variant তৈরি করা, যাতে model বিভিন্ন transformation সহ্য করতে পারে:

```python
import torchvision.transforms as T

transform = T.Compose([
    T.RandomHorizontalFlip(),        # ৫০% সম্ভাবনায় flip
    T.RandomRotation(15),            # ±১৫ ডিগ্রি rotate
    T.ColorJitter(                   # color একটু বদলাও
        brightness=0.2, contrast=0.2, saturation=0.2
    ),
    T.RandomResizedCrop(224),        # random crop + resize
    T.ToTensor(),
])
```

## Early Stopping

Validation loss বাড়তে শুরু করলে training থামিয়ে দাও — আর overfit করতে দাও না:

```python
best_val_loss = float('inf')
patience = 5
wait = 0

for epoch in range(100):
    train_loss = train_one_epoch(model, ...)
    val_loss = validate(model, ...)

    if val_loss < best_val_loss:
        best_val_loss = val_loss
        wait = 0
        torch.save(model.state_dict(), "best_model.pt")  # সেরাটা save
    else:
        wait += 1
        if wait >= patience:
            print(f"Early stopping at epoch {epoch}")
            break
```

## Optimizer — SGD থেকে AdamW পর্যন্ত

| Optimizer | কী করে | কখন |
|---|---|---|
| **SGD** | basic gradient descent | সহজ, কিন্তু ধীর |
| **SGD + Momentum** | আগের দিক মনে রাখে | image classification (fine-tune) |
| **Adam** | adaptive learning rate per parameter | সবচেয়ে popular |
| **AdamW** | Adam + correct weight decay | **2026-এ default choice** |

```python
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
    betas=(0.9, 0.999),
    weight_decay=0.01,
)
```

## Learning Rate Scheduling

Training-এর শুরুতে বড় learning rate, ধীরে ধীরে কমানো — fast convergence আর stable ending:

```python
from torch.optim.lr_scheduler import CosineAnnealingLR, LinearLR

# Warmup (শুরুতে ধীরে বাড়াও)
warmup = LinearLR(optimizer, start_factor=0.1, total_iters=5)

# Cosine decay (ধীরে ধীরে কমাও)
cosine = CosineAnnealingLR(optimizer, T_max=95)

scheduler = torch.optim.lr_scheduler.SequentialLR(
    optimizer, schedulers=[warmup, cosine], milestones=[5]
)
```

> [!tip] Warmup কেন দরকার?
# Training-এর একদম শুরুতে weights random। বড় learning rate দিলে weights অতিরিক্ত নড়বড় করবে। Warmup-এ ছোট lr দিয়ে শুরু করে ধীরে বাড়ানো হয় — model stable হয়ে গেলে full lr-এ যাওয়া যায়। Transformer training-ে warmup বাধ্যতামূলক।

## Mixed Precision Training

GPU-তে `fp16` বা `bf16` (bfloat16) ব্যবহার করে memory অর্ধেক আর speed দ্বিগুণ:

```python
from torch.amp import autocast, GradScaler

scaler = GradScaler()  # fp16-র জন্য

for inputs, targets in dataloader:
    optimizer.zero_grad()

    # Mixed precision forward pass
    with autocast(device_type="cuda", dtype=torch.float16):
        outputs = model(inputs)
        loss = criterion(outputs, targets)

    # Backward pass with scaling
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

> [!note] bf16 বনাম fp16
# `bf16` (bfloat16) আধুনিক GPU (Ampere+) এ ভালো — fp16-এর numeric range problem নেই। যদি GPU support করে, `torch.bfloat16` ব্যবহার করো।

## Practical — সম্পূর্ণ PyTorch Training Loop

```python
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

# ১. Model (dropout সহ)
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.BatchNorm1d(256),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(256, 128),
    nn.BatchNorm1d(128),
    nn.ReLU(),
    nn.Dropout(0.2),
    nn.Linear(128, 10),
)

# ২. AdamW + cosine scheduler
optimizer = AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
scheduler = CosineAnnealingLR(optimizer, T_max=50)
criterion = nn.CrossEntropyLoss()

# ৩. Training loop (early stopping সহ)
best_val = float('inf')
for epoch in range(50):
    model.train()
    for X_batch, y_batch in train_loader:
        optimizer.zero_grad()
        loss = criterion(model(X_batch), y_batch)
        loss.backward()
        optimizer.step()

    scheduler.step()

    # Validation
    model.eval()
    with torch.no_grad():
        val_loss = sum(
            criterion(model(X), y) for X, y in val_loader
        ) / len(val_loader)

    if val_loss < best_val:
        best_val = val_loss
        torch.save(model.state_dict(), "best.pt")

    print(f"Epoch {epoch}: train={loss:.4f} val={val_loss:.4f} lr={scheduler.get_last_lr()[0]:.6f}")
```

> [!example] torch.compile — ফ্রি speedup
# PyTorch 2.x-এ `model = torch.compile(model)` এক লাইন যোগ করলেই training ১.৫-২x fast হয়। কোনো কোড পরিবর্তন লাগে না, শুধু compile হওয়ার সময় একটু বেশি লাগে (প্রথম epoch)।