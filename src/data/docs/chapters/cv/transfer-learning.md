## Transfer Learning

নতুন করে scratch থেকে model train করা অনেক সময়সাপেক্ষ, অনেক data লাগে, আর অনেক GPU resource দরকার। Transfer learning দিয়ে এই সমস্যা solve হয় — ImageNet এর মতো huge dataset এ pretrained model নিয়ে, তার শেষ কয়েক layer train করলেই নতুন task এ ভালো result পাওয়া যায়। 2026 এ এটা CV এর standard approach — কেউ scratch থেকে train করে না।

## Transfer Learning কী?

Pretrained model (যেমন ResNet50, ImageNet এ trained) এর feature extraction capability reuse করা। ImageNet এ model edge, texture, shape ইত্যাদি general feature শিখে — এগুলো যেকোনো image task এ কাজে লাগে। শুধু শেষের classification layer নতুন task এর জন্য replace করতে হয়।

```text
Transfer Learning Concept:

Pretrained Model (ImageNet)         Your Task (e.g., Cat vs Dog)
┌──────────────────────┐            ┌──────────────────────┐
│ [Conv Layers]        │            │ [Conv Layers]        │ ← FROZEN
│  Learns: edges,      │   reuse    │  (reuse same weights)│
│  textures, shapes    │ ────────→  │                      │
│                      │            │ [FC Layer]           │ ← TRAIN
│ [FC Layer]           │  replace   │  (new, train from    │
│  1000 classes        │            │   scratch for 2 cls) │
└──────────────────────┘            └──────────────────────┘
```

## কেন Transfer Learning ব্যবহার করবে?

| Approach | Data লাগে | Training Time | Accuracy |
|----------|----------|---------------|----------|
| Scratch training | 100K+ images | ঘণ্টা/দিন | মাঝারি |
| Transfer learning | 100-1000 images | মিনিট | ভালো |

নিচের কোডে torchvision থেকে pretrained ResNet50 load করা দেখানো হলো। `weights="DEFAULT"` দিলে সবচেয়ে নতুন pretrained weight download হয়। শেষ layer (`fc`) replace করে নতুন class সংখ্যার জন্য configure করা হয়।

```python
import torch
import torch.nn as nn
import torchvision.models as models

# Load pretrained ResNet50
model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)

# Freeze all layers (feature extraction mode)
for param in model.parameters():
    param.requires_grad = False

# Replace the final classification layer
num_features = model.fc.in_features  # 2048 for ResNet50
num_classes = 5  # Your custom classes
model.fc = nn.Linear(num_features, num_classes)

# Only fc layer parameters will be trained
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total = sum(p.numel() for p in model.parameters())
print(f"Trainable: {trainable:,} / Total: {total:,} "
      f"({trainable/total*100:.1f}%)")
```

## Feature Extraction vs Fine-Tuning

দুটো approach আছে। Feature extraction এ সব backbone freeze করা থাকে, শুধু classifier train হয় — দ্রুত, কম data লাগে। Fine-tuning এ কিছু বা সব layer unfreeze করে train করা হয় — বেশি accuracy, কিন্তু ধীর আর বেশি data দরকার।

```python
# APPROACH 1: Feature Extraction (freeze everything, train only FC)
model_fe = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
for param in model_fe.parameters():
    param.requires_grad = False
model_fe.fc = nn.Linear(model_fe.fc.in_features, 5)

# APPROACH 2: Fine-Tuning (unfreeze last few layers)
model_ft = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)

# Freeze early layers, unfreeze layer4 and fc
for name, param in model_ft.named_parameters():
    if "layer4" in name or "fc" in name:
        param.requires_grad = True
    else:
        param.requires_grad = False

model_ft.fc = nn.Linear(model_ft.fc.in_features, 5)
```

নিচের কোডে সম্পূর্ণ fine-tuning training setup দেখানো হলো। Pretrained model এর জন্য learning rate ছোট রাখা উচিত (1e-4 বা তার কম) — নাহলে pretrained feature নষ্ট হয়ে যায়।

```python
import torch.optim as optim
from torch.utils.data import DataLoader
import torchvision.transforms as transforms
import torchvision.datasets as datasets

# IMPORTANT: Use ImageNet normalization for pretrained models
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

train_dataset = datasets.ImageFolder("data/train", transform=transform)
val_dataset = datasets.ImageFolder("data/val", transform=transform)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_ft = model_ft.to(device)

# Lower learning rate for fine-tuning
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model_ft.parameters(), lr=0.0001)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.1)

for epoch in range(10):
    model_ft.train()
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        outputs = model_ft(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    scheduler.step()

    # Validation
    model_ft.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model_ft(images)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    print(f"Epoch {epoch+1}: Val Acc = {correct/total:.4f}")
```

## Hugging Face Transformers

PyTorch manual code এর বদলে Hugging Face transformers দিয়ে আরও সহজে transfer learning করা যায়। `AutoModelForImageClassification` দিয়ে যেকোনো pretrained model load করা যায় — ViT, EfficientNet, DataParallel।

```python
from transformers import (
    AutoModelForImageClassification,
    AutoImageProcessor,
    TrainingArguments,
    Trainer
)
import torch

# Load pretrained ViT (Vision Transformer)
model_name = "google/vit-base-patch16-224"
processor = AutoImageProcessor.from_pretrained(model_name)
model = AutoModelForImageClassification.from_pretrained(
    model_name,
    num_labels=5,
    ignore_mismatched_sizes=True
)

# Training arguments
training_args = TrainingArguments(
    output_dir="./vit-finetuned",
    num_train_epochs=10,
    per_device_train_batch_size=32,
    learning_rate=2e-5,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
)

# Trainer handles the training loop automatically
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
)
trainer.train()
```

## CLIP — Zero-Shot Classification

CLIP (Contrastive Language-Image Pre-training) OpenAI এর model যেটা image আর text এর মধ্যে relationship শিখেছে। সবচেয়ে দারুণ বিষয় — zero-shot classification, কোনো training ছাড়াই। শুধু text prompt দাও "a photo of a cat" vs "a photo of a dog", CLIP বলে দেবে কোনটা।

নিচের কোডে CLIP দিয়ে zero-shot classification দেখানো হলো। `CLIPProcessor` image আর text একসাথে process করে, `CLIPModel` similarity score calculate করে।

```python
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import torch

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

image = Image.open("mystery.jpg")

# Define possible classes as text prompts
texts = [
    "a photo of a cat",
    "a photo of a dog",
    "a photo of a bird",
    "a photo of a fish"
]

# Process both image and text
inputs = processor(text=texts, images=image, return_tensors="pt", padding=True)
outputs = model(**inputs)

# Get prediction
logits = outputs.logits_per_image
probs = logits.softmax(dim=1)

for text, prob in zip(texts, probs[0]):
    print(f"{text}: {prob.item()*100:.1f}%")
```

## Pretrained Models (2026)

| Model | Type | Best For | Size |
|-------|------|----------|------|
| ResNet50 | CNN | General classification | 25MB |
| EfficientNet-B7 | CNN | High accuracy | 66MB |
| ViT-Base | Transformer | Modern, scalable | 86MB |
| CLIP | Multi-modal | Zero-shot, retrieval | 60MB |
| DINOv2 | Self-supervised | Feature extraction | 80MB |

> [!tip] সবসময় Transfer Learning দিয়ে শুরু করো
> # Computer vision প্রজেক্ট শুরু করার সবচেয়ে গুরুত্বপূর্ণ rule: **শুধুমাত্র বাধ্য না হলে scratch থেকে train করবে না**। প্রথমে pretrained model দিয়ে feature extraction try করো — মাত্র কয়েক মিনিটে ভালো baseline পাবে। যদি accuracy কম হয়, তখন fine-tuning করো। যদি সেটাও না কাজ করে, তখন scratch থেকে train করার কথা ভাবো। ImageNet এ trained model edge, texture, shape — এসব feature শিখেছে যা যেকোনো image task এ কাজে লাগে। এই knowledge reuse না করা অপচয়।