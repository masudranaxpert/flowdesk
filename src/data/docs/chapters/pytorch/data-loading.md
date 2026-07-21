## Dataset & DataLoader Pipeline

রিয়েল ওয়ার্ল্ড ডিপ লার্নিং প্রজেক্টে বিশাল ডেটাসেট (Image, Text, Audio, Tabular) মেমরিতে একসাথে লোড করে ট্রেইনিং করা অসম্ভব।

PyTorch দুটি ক্লাসের মাধ্যমে একটি দক্ষ ও প্যারালাল ডেটা প্রসেসিং পাইপলাইন প্রদান করে:
1. **`torch.utils.data.Dataset`**: ডেটাসেট সংরক্ষণ এবং সিঙ্গেল স্যাম্পল `(feature, label)` এক্সট্র্যাক্ট করে।
2. **`torch.utils.data.DataLoader`**: ব্যাচিং (Batching), শাফলিং (Shuffling) এবং মাল্টি-প্রসেস সমান্তরাল লোডিং (Multi-process Parallel Loading) ম্যানেজ করে।

---

## 1. Custom Dataset তৈরি করার নিয়ম

যেকোনো কাস্টম `Dataset` ক্লাসকে `torch.utils.data.Dataset` থেকে ইনহেরিট করতে হয় এবং আবশ্যকভাবে নিচের ৩টি মেথড ইমপ্লিমেন্ট করতে হয়:
1. `__init__`: ফাইল পাথ, ডেটা লোড বা ট্রান্সফর্মেশন সেটআপ।
2. **`__len__`**: ডেটাসেটের মোট স্যাম্পল সংখ্যা রিটার্ন করে (`len(dataset)`)।
3. **`__getitem__(self, idx)`**: ইনডেক্স `idx` অনুযায়ী নির্দিষ্ট স্যাম্পল ও লেবেল টেন্সর হিসেবে রিটার্ন করে।

```python
import torch
from torch.utils.data import Dataset, DataLoader

class SyntheticDataset(Dataset):
    def __init__(self, num_samples: int = 1000):
        # Generate dummy 10-feature tabular data
        self.x_data = torch.randn(num_samples, 10)
        self.y_data = torch.randint(0, 2, (num_samples,)) # Binary labels 0 or 1

    def __len__(self) -> int:
        return len(self.x_data)

    def __getitem__(self, idx: int):
        sample_x = self.x_data[idx]
        sample_y = self.y_data[idx]
        return sample_x, sample_y

# Instantiate Dataset
dataset = SyntheticDataset(num_samples=5000)
print(f"Total Dataset Size: {len(dataset)}")
```

---

## 2. `DataLoader` এর মাধ্যমে ব্যাচিং ও পারফরম্যান্স অপটিমাইজেশন

```python
train_loader = DataLoader(
    dataset=dataset,
    batch_size=64,       # Mini-batch size
    shuffle=True,        # Shuffle data every epoch (overfits prevent করতে)
    num_workers=4,       # Background CPU multiprocess count to prefetch data
    pin_memory=True,     # Fast CPU -> GPU memory transfer
    drop_last=True       # Drop last incomplete batch
)

# Iterating over DataLoader in Training Loop
for batch_idx, (features, labels) in enumerate(train_loader):
    print(f"Batch {batch_idx+1}: Features shape {features.shape}, Labels shape {labels.shape}")
    break
```

```mermaid
flowchart LR
    Disk[(Data on Disk / RAM)] --> Workers[CPU Workers num_workers=4]
    Workers --> Transforms[Data Transforms & Augmentations]
    Transforms --> Batch[Batch Queue Pin Memory]
    Batch --> GPU[(GPU VRAM for Training)]
```

---

## 3. Data Transformations with `torchvision.transforms` (Image Example)

ছবি প্রসেসিং এবং Augmentation করার জন্য `torchvision.transforms.v2` ব্যবহার করা হয়:

```python
from torchvision import transforms

# Production Image Augmentation Pipeline
image_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])
```

> [!tip] `pin_memory=True` এবং `num_workers` টিপস
> - Windows এ `num_workers` ডিফল্ট `0` বা `2` রাখা নিরাপদ (Multiprocessing Limit)।
> - Linux/Ubuntu এ CPU Core সংখ্যা অনুযায়ী `num_workers=4` বা `8` সেট করলে GPU কখনোই ডেটার জন্য অলস বসে থাকবে না!
