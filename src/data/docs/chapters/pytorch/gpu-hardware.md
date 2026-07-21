## GPU & Hardware Acceleration (CUDA/MPS/ROCm)

PyTorch এর সর্বপ্রধান শক্তি হলো এটি ভিন্ন ভিন্ন হার্ডওয়্যার অ্যাক্সিলারেটরে কোনো কোড স্ট্রাকচার না বদলেই নির্বিঘ্নে একই কোড রান করতে পারে।

---

## 1. Hardware Agnostic Device Setup (CUDA, MPS, CPU)

২০২৬ সালের ইউনিভার্সাল ডিভাইস সিলেক্টর প্যাটার্ন:

```python
import torch

def get_best_device() -> torch.device:
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"⚡ Using NVIDIA GPU: {torch.cuda.get_device_name(0)}")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
        print("🍏 Using Apple Silicon GPU (Metal Performance Shaders)")
    else:
        device = torch.device("cpu")
        print("💻 Using Standard CPU Execution")
    return device

device = get_best_device()
```

---

## 2. Moving Tensors & Models to Accelerator

মডেল এবং টেন্সর দুটিকেই অ্যাক্সিলারেটর ডিভাইসে পাঠাতে হয়:

```python
# 1. Move Model to Target Device
model = MyModel().to(device)

# 2. Move Inputs/Targets in loop
inputs = inputs.to(device)
targets = targets.to(device)
```

---

## 3. Automatic Mixed Precision (AMP) with `torch.cuda.amp`

সাধারণত ট্রেইনিং 32-bit Float (`FP32`) এ চলে। **Mixed Precision (`FP16` / `BF16`)** ব্যবহার করলে:
- GPU Memory Usage ৫০% কমে যায়!
- Tensor Cores ব্যবহারের ফলে ট্রেইনিং স্পিড ২ থেকে ৩ গুণ বেড়ে যায়!

```python
from torch.cuda.amp import autocast, GradScaler

# Create GradScaler for FP16 gradient scaling (prevents underflow)
scaler = GradScaler(enabled=(device.type == "cuda"))

for inputs, targets in train_loader:
    inputs, targets = inputs.to(device), targets.to(device)
    optimizer.zero_grad()

    # 1. Runs forward pass in Mixed Precision (FP16 / BF16)
    with autocast(device_type=device.type, dtype=torch.bfloat16):
        outputs = model(inputs)
        loss = criterion(outputs, targets)

    # 2. Scaled Backward Pass & Optimizer Step
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

---

## 4. Multi-GPU Training Patterns (DP vs DDP)

একটি পিসিতে একাধিক GPU থাকলে ট্রেইনিং ডিস্ট্রিবিউট করা:

| Feature | `torch.nn.DataParallel` (DP) | `torch.nn.parallel.DistributedDataParallel` (DDP) |
| :--- | :--- | :--- |
| **Model** | Single-Process Multi-Thread | Multi-Process (Each GPU runs own process) |
| **GIL Bottleneck** | Python GIL বাধা সৃষ্টি করে | GIL Free (Best Performance) |
| **Efficiency** | মাঝারি (~ 50-60% scaling) | সর্বোচ্চ (~ 95%+ Linear Scaling) |
| **Use Case** | Quick prototype script | Production & LLM Fine-tuning |

```python
# Modern Recommended DDP Setup:
# torchrun --nproc_per_node=4 train_script.py
```
