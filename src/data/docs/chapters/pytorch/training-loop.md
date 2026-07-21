## Training Loop — Loss, Optimizer & Scheduler

PyTorch এ মডেল ট্রেইনিং করার পূর্ণাঙ্গ পাইপলাইন একটি সুস্পষ্ট পাইথনিক লুপের মাধ্যমে পরিচালিত হয়।

একটি আদর্শ Training Loop এ মোট ৫টি প্রধান ধাপ থাকে:

```mermaid
flowchart TD
    Start[1. Forward Pass: predictions = model(inputs)] --> Loss[2. Compute Loss: loss = criterion(preds, targets)]
    Loss --> Zero[3. Zero Gradients: optimizer.zero_grad()]
    Zero --> Back[4. Backward Pass: loss.backward()]
    Back --> Step[5. Update Weights: optimizer.step()]
```

---

## 1. Criterion (Loss Function) & Optimizer নির্বাচন

```python
import torch
import torch.nn as nn
import torch.optim as optim

# Model & Device Setup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 2)
).to(device)

# 1. Loss Function (CrossEntropyLoss for Multi-class Classification)
criterion = nn.CrossEntropyLoss()

# 2. Optimizer (AdamW is the 2026 Gold Standard Optimizer)
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

# 3. Learning Rate Scheduler (Reduce LR when loss plateaus)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=2, factor=0.5)
```

---

## 2. Complete Complete Epoch Training & Validation Loop

```python
def train_one_epoch(model, dataloader, criterion, optimizer, device):
    model.train() # Set model to training mode (enables Dropout, BatchNorm)
    running_loss = 0.0
    correct = 0
    total = 0

    for inputs, targets in dataloader:
        inputs, targets = inputs.to(device), targets.to(device)

        # 1. Forward Pass
        outputs = model(inputs)
        loss = criterion(outputs, targets)

        # 2. Zero Gradients
        optimizer.zero_grad()

        # 3. Backward Pass
        loss.backward()

        # Optional: Gradient Clipping to prevent Exploding Gradients
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        # 4. Optimizer Step
        optimizer.step()

        # Metrics calculation
        running_loss += loss.item() * inputs.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(targets).sum().item()
        total += targets.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc


def validate(model, dataloader, criterion, device):
    model.eval() # Set model to evaluation mode (disables Dropout)
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad(): # Disable autograd for validation
        for inputs, targets in dataloader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, targets)

            running_loss += loss.item() * inputs.size(0)
            _, preds = outputs.max(1)
            correct += preds.eq(targets).sum().item()
            total += targets.size(0)

    val_loss = running_loss / total
    val_acc = correct / total
    return val_loss, val_acc
```

---

## 3. Training Master Execution Loop

```python
epochs = 10
best_val_loss = float('inf')

for epoch in range(epochs):
    train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
    val_loss, val_acc = validate(model, val_loader, criterion, device)

    # Step LR Scheduler based on validation loss
    scheduler.step(val_loss)

    print(f"Epoch {epoch+1:02d}/{epochs} | "
          f"Train Loss: {train_loss:.4f} Acc: {train_acc*100:.2f}% | "
          f"Val Loss: {val_loss:.4f} Acc: {val_acc*100:.2f}%")

    # Save Best Model Checkpoint
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        torch.save(model.state_dict(), "best_model.pth")
```

> [!important] `model.train()` vs `model.eval()`
> ট্রেইনিং করার আগে অবশ্যই **`model.train()`** এবং ভ্যালিডেশন/ইনফারেন্স করার আগে **`model.eval()`** সুইচ করতে ভুলবে না! অন্যথায় Dropout এবং BatchNorm লেয়ারগুলো ট্রেইনিং কালীন ভুল আচরণ করবে।
