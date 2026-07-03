## রিয়েল প্রজেক্ট: Image Classifier

এতকন theory শিখলাম — এবার সব একসাথে মিলিয়ে একটা সম্পূর্ণ project বানাব। Dataset prepare থেকে শুরু করে training, evaluation, model save, আর deployment — পুরো pipeline। Transfer learning (ResNet50) ব্যবহার করে custom image classifier বানাব যেটা web API হিসেবে deploy হবে।

## Project Pipeline

নিচের diagram এ সম্পূর্ণ project pipeline দেখানো হলো:

```text
[Data Collection] → [Augmentation] → [Train (ResNet50)]
                                              ↓
                                    [Evaluate (confusion matrix)]
                                              ↓
                                    [Save Model] → [FastAPI Deploy]
```

## Dataset Structure

Image classification এর জন্য standard folder structure দরকার। PyTorch এর `ImageFolder` এই structure automatically read করে — প্রতিটা folder = একটা class।

```text
dataset/
├── train/
│   ├── cat/          ← Class "cat"
│   │   ├── cat001.jpg
│   │   ├── cat002.jpg
│   │   └── ... (200+ images)
│   ├── dog/
│   │   ├── dog001.jpg
│   │   └── ...
│   └── bird/
│       ├── bird001.jpg
│       └── ...
├── val/
│   ├── cat/
│   ├── dog/
│   └── bird/
└── test/
    ├── cat/
    ├── dog/
    └── bird/
```

নিচের কোডে data augmentation আর DataLoader setup দেখানো হলো। Training এর জন্য heavy augmentation (flip, rotation, color jitter) — validation/test এর জন্য শুধু resize আর normalize। ImageNet normalization stats pretrained model এর জন্য mandatory।

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import torchvision.models as models
import torchvision.transforms as transforms
import torchvision.datasets as datasets

# Training transforms with augmentation
train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2,
                           saturation=0.2, hue=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# Validation transforms (no augmentation)
val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# Create datasets
train_dataset = datasets.ImageFolder("dataset/train", transform=train_transform)
val_dataset = datasets.ImageFolder("dataset/val", transform=val_transform)

# DataLoaders
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=4)
val_loader = DataLoader(val_dataset, batch_size=32, num_workers=4)

class_names = train_dataset.classes
print(f"Classes: {class_names}")
print(f"Train: {len(train_dataset)}, Val: {len(val_dataset)}")
```

## Model Setup — Transfer Learning

ResNet50 pretrained model load করে শেষ layer replace করা হয়। Fine-tuning করা হয় — শেষের layer4 আর fc layer train করা হবে, বাকি সব freeze। এটা ভালো accuracy দেয় আর দ্রুত train হয়।

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load pretrained ResNet50
model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)

# Fine-tune: unfreeze layer4 + fc
for name, param in model.named_parameters():
    if "layer4" in name:
        param.requires_grad = True
    else:
        param.requires_grad = False

# Replace final layer
num_classes = len(class_names)
model.fc = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(model.fc.in_features, 256),
    nn.ReLU(),
    nn.Linear(256, num_classes)
)
model = model.to(device)

# Different learning rates for different layers
optimizer = torch.optim.AdamW([
    {"params": [p for n, p in model.named_parameters()
                if "layer4" in n and p.requires_grad], "lr": 1e-4},
    {"params": model.fc.parameters(), "lr": 1e-3}
], weight_decay=1e-4)

criterion = nn.CrossEntropyLoss()
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="min", patience=3, factor=0.5
)
```

## Training Loop

নিচের training loop এ model train আর validate করা হয়। Best validation accuracy model save করা হয় — overfitting prevent করার জন্য। Early stopping যোগ করা হয়েছে।

```python
best_val_acc = 0.0
patience_counter = 0

for epoch in range(30):
    # Training phase
    model.train()
    train_loss = 0.0
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        train_loss += loss.item()

    # Validation phase
    model.eval()
    val_loss = 0.0
    correct, total = 0, 0
    all_preds, all_labels = [], []

    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            val_loss += loss.item()

            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    val_acc = correct / total
    scheduler.step(val_loss)

    print(f"Epoch {epoch+1}: Train Loss={train_loss/len(train_loader):.4f}, "
          f"Val Acc={val_acc:.4f}")

    # Save best model
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        patience_counter = 0
        torch.save({
            "model_state_dict": model.state_dict(),
            "class_names": class_names,
            "val_acc": val_acc
        }, "best_model.pth")
        print(f"  → Saved new best model (acc: {val_acc:.4f})")
    else:
        patience_counter += 1
        if patience_counter >= 7:
            print("Early stopping triggered!")
            break

print(f"\nBest validation accuracy: {best_val_acc:.4f}")
```

## Evaluation — Confusion Matrix

Model evaluate করার জন্য confusion matrix আর classification report দরকার। এতে দেখা যায় কোন class এ ভালো করছে, কোন class এ ভুল করছে।

```python
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Load best model
checkpoint = torch.load("best_model.pth")
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()

# Get predictions on test set
test_dataset = datasets.ImageFolder("dataset/test", transform=val_transform)
test_loader = DataLoader(test_dataset, batch_size=32)

all_preds, all_labels = [], []
with torch.no_grad():
    for images, labels in test_loader:
        images = images.to(device)
        outputs = model(images)
        predicted = outputs.argmax(1).cpu().numpy()
        all_preds.extend(predicted)
        all_labels.extend(labels.numpy())

# Classification report
print(classification_report(all_labels, all_preds, target_names=class_names))

# Confusion matrix visualization
cm = confusion_matrix(all_labels, all_preds)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=class_names, yticklabels=class_names)
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")
plt.savefig("confusion_matrix.png")
```

## Inference — নতুন ছবিতে Prediction

Train করা model দিয়ে নতুন ছবিতে prediction করা যায়। ছবিটা preprocess করে (same transform), model এ pass করে, softmax দিয়ে probability বের করা হয়।

```python
from PIL import Image

def predict_image(image_path, model, class_names, device):
    # Preprocess
    image = Image.open(image_path).convert("RGB")
    input_tensor = val_transform(image).unsqueeze(0).to(device)

    # Predict
    model.eval()
    with torch.no_grad():
        output = model(input_tensor)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)

    # Top 3 predictions
    top3 = torch.topk(probabilities, 3)
    results = []
    for prob, idx in zip(top3.values, top3.indices):
        results.append({
            "class": class_names[idx],
            "confidence": f"{prob.item()*100:.1f}%"
        })
    return results

# Usage
results = predict_image("test_cat.jpg", model, class_names, device)
for r in results:
    print(f"{r['class']}: {r['confidence']}")
```

## Deployment — FastAPI Endpoint

Model কে production এ deploy করার জন্য web API তৈরি করা হয়। FastAPI দিয়ে image upload endpoint বানানো হয় — client ছবি পাঠায়, server prediction ফেরত দেয়।

```python
from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io
import torch

app = FastAPI(title="Image Classifier API")

# Load model at startup
checkpoint = torch.load("best_model.pth", map_location=device)
model.load_state_dict(checkpoint["model_state_dict"])
class_names = checkpoint["class_names"]
model.eval()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read uploaded image
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Preprocess and predict
    input_tensor = val_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(input_tensor)
        probs = torch.nn.functional.softmax(output[0], dim=0)

    # Format response
    top3 = torch.topk(probs, 3)
    predictions = [
        {"class": class_names[idx], "confidence": float(prob)}
        for prob, idx in zip(top3.values, top3.indices)
    ]

    return {"filename": file.filename, "predictions": predictions}

# Run: uvicorn app:app --host 0.0.0.0 --port 8000
```

> [!example] সম্পূর্ণ Pipeline এর মূল সূত্র
> # এই project টা দেখায় কীভাবে transfer learning দিয়ে real classifier বানাতে হয় — মাত্র ১০০-২০০ image per class দিয়েই 90%+ accuracy সম্ভব। মূল সূত্র: (১) সঠিক data augmentation, (২) pretrained model থেকে fine-tune, (৩) proper evaluation (confusion matrix দিয়ে), (৪) production-ready deployment। এই pipeline যেকোনো image classification task এ reuse করা যায় — medical, agriculture, retail সবখানে।

> [!danger] Data Leakage — Augmentation এর বিপদ
> # Data augmentation করার সময় একটা মারাত্মক ভুল হতে পারে: একই image এর augmented version train আর val split দুটোতেই চলে যাওয়া। যেমন cat001.jpg train এ, cat001_flipped.jpg val এ — model আসলে memorize করে ফেলে, real generalization হয় না। মূল image কে আগে split করো, তারপর augmentation শুধু train set এ apply করো। Validation আর test এ কখনো augmentation করবে না। এটা না মানলে 99% accuracy দেখাবে কিন্তু real-world এ কাজ করবে না।