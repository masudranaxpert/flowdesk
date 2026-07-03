## Object Detection

Image classification শুধু বলে "এটা কী" — কিন্তু কোথায় সেটা বলে না। Object detection দুটোই করে — "কী" আর "কোথায়"। যেমন self-driving car এর জানা দরকার শুধু সামনে মানুষ আছে না, সে কোথায় আছে সেটাও। YOLO (You Only Look Once) আর RT-DETR হলো 2026 এর সবচেয়ে আধুনিক detector।

## Classification vs Detection

| Task | Question | Output |
|------|----------|--------|
| Classification | এটা কী? | Class label (cat, dog, car) |
| Detection | কী আর কোথায়? | Class + bounding box (x, y, w, h) |
| Segmentation | প্রতিটা pixel কার? | Pixel-level mask |

```text
Classification:          Detection:              Segmentation:
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Cat        │         │ ┌───┐       │         │ ░░▓▓▓░░░░░ │
│             │         │ │Cat│  ┌───┐│         │ ░▓▓▓▓▓░░▓▓ │
│             │         │ └───┘  │Dog││         │ ░▓▓▓▓░░░▓▓ │
│             │         │        └───┘│         │ ░░░░░░░░▓▓ │
└─────────────┘         └─────────────┘         └─────────────┘
One label               Boxes + labels          Pixel masks
```

## Bounding Box

Object detection এর output হলো bounding box — object কে ঘিরে একটা rectangle। সাধারণত `(x, y, width, height)` বা `(x1, y1, x2, y2)` format এ represent করা হয়। YOLO format এ `(center_x, center_y, width, height)` — সব value image dimension দিয়ে normalize করা (0-1)।

## YOLO Architecture

YOLO (You Only Look Once) হলো single-stage detector — একবারে পুরো image process করে সব object detect করে। Two-stage detector (Faster R-CNN) এর চেয়ে অনেক দ্রুত, কিন্তু কিছুটা accuracy কম। Real-time detection এর জন্য YOLO সবচেয়ে popular।

```text
YOLO Architecture (simplified):
Input Image → Backbone (feature extraction) → Neck (FPN) → Head (detection)

416×416×3   →   DarkNet/CSPNet      →   PANet    →  Grid + Predictions
                                                        ↓
                                              [BBox + Class + Confidence]
```

YOLO image কে grid এ ভাগ করে (যেমন 13×13)। প্রতিটা grid cell prediction করে — সেখানে object আছে কিনা, যদি থাকে bounding box আর class কী।

## YOLO Versions (2026)

YOLO অনেক version এ বিবর্তিত হয়েছে। Ultralytics (YOLOv8, YOLOv11) সবচেয়ে popular আর easy-to-use।

| Version | Year | Key Feature | Speed |
|---------|------|-------------|-------|
| YOLOv8 | 2023 | Anchor-free, mAP ভালো | Fast |
| YOLOv11 | 2024 | Efficiency improved, SOTA | Very fast |
| RT-DETR | 2023 | Transformer-based, real-time | Fast |
| RF-DETR | 2025 | Real-time Foundation DETR | Fast |

## Ultralytics দিয়ে Inference

Ultralytics library দিয়ে YOLO v11 ব্যবহার করা খুব সহজ। Pretrained model download হয় automatically, কোড মাত্র কয়েক লাইন। `YOLO("yolo11n.pt")` দিয়ে model load করা হয় — `n` মানে nano (সবচেয়ে ছোট আর দ্রুত)।

```bash
# Install ultralytics
pip install ultralytics
```

```python
from ultralytics import YOLO

# Load pretrained YOLO v11 model (nano = fastest, x = most accurate)
model = YOLO("yolo11n.pt")  # Options: n, s, m, l, x

# Run inference on an image
results = model("street.jpg")

# Display results
for result in results:
    boxes = result.boxes
    for box in boxes:
        # Bounding box coordinates
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        confidence = box.conf[0].item()
        class_id = int(box.cls[0].item())
        class_name = model.names[class_id]

        print(f"{class_name}: {confidence:.2f} "
              f"at ({x1:.0f}, {y1:.0f}, {x2:.0f}, {y2:.0f})")

# Save annotated image
result.save("output_detected.jpg")
```

নিচের কোডে real-time webcam detection দেখানো হলো। `model.stream()` দিয়ে webcam বা video stream process করা যায় — প্রতিটা frame এ object detect হয়।

```python
# Real-time detection from webcam
results = model.stream(source=0, show=True, conf=0.5)

# Detection from video file
results = model("video.mp4", save=True, conf=0.5)

# Batch processing
results = model(["img1.jpg", "img2.jpg", "img3.jpg"])
```

## Training Custom Detector

নিজের dataset দিয়ে custom object detector train করা যায়। Ultralytics এটা খুব সহজ করে দিয়েছে। YOLO format dataset structure আর training একটাই command এ হয়ে যায়।

```text
Custom Dataset Structure:
my_dataset/
├── images/
│   ├── train/
│   │   ├── img001.jpg
│   │   ├── img002.jpg
│   │   └── ...
│   └── val/
│       ├── img101.jpg
│       └── ...
├── labels/
│   ├── train/
│   │   ├── img001.txt    ← YOLO format labels
│   │   └── ...
│   └── val/
│       └── ...
└── dataset.yaml           ← Dataset config
```

নিচের YAML file dataset এর configuration define করে। `nc` হলো class সংখ্যা, `names` হলো class এর নাম list। Path গুলো relative বা absolute দুটোই হতে পারে।

```yaml
# dataset.yaml
path: ./my_dataset
train: images/train
val: images/val

nc: 3  # number of classes
names: ["cat", "dog", "bird"]
```

নিচের কোডে সম্পূর্ণ training process দেখানো হলো। এক লাইন command এ model train হয়ে যায় — epochs, image size, batch size সব parameter pass করা হয়।

```python
from ultralytics import YOLO

# Load a model (start from pretrained YOLOv11n)
model = YOLO("yolo11n.pt")

# Train on custom dataset
results = model.train(
    data="dataset.yaml",
    epochs=100,
    imgsz=640,
    batch=16,
    device=0,           # GPU (use "cpu" if no GPU)
    patience=20,         # Early stopping
    save=True,
    project="runs/detect",
    name="custom_model"
)

# After training, the best model is saved as:
# runs/detect/custom_model/weights/best.pt
```

## Non-Maximum Suppression (NMS)

Object detection এ একই object এর উপর অনেকগুলো overlapping box predict হয়। NMS দিয়ে redundant box গুলো remove করা হয় — শুধু highest confidence box রাখা হয়, বাকিগুলো (IoU > threshold) মুছে ফেলা হয়।

```text
Before NMS:               After NMS:
┌─────────────┐           ┌─────────────┐
│ ┌─┐         │           │ ┌─┐         │
│ │ │ ┌─┐     │           │ │ │         │
│ └─┘ │ │     │    →      │ └─┘         │
│   ┌─┘ │     │           │             │
│   └───┘     │           │             │
└─────────────┘           └─────────────┘
3 overlapping boxes       1 clean box (best confidence)
```

## Evaluation Metrics

Object detection এর quality measure করার জন্য কিছু metric আছে। IoU (Intersection over Union) হলো সবচেয়ে basic — predicted box আর ground truth box কতটা overlap করে সেটা measure করে।

নিচের formula আর code এ IoU calculation দেখানো হলো। IoU > 0.5 সাধারণত "correct" detection হিসেবে ধরা হয়।

```python
def calculate_iou(box1, box2):
    # box format: [x1, y1, x2, y2]
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    # Intersection area
    intersection = max(0, x2 - x1) * max(0, y2 - y1)

    # Union area
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - intersection

    iou = intersection / union if union > 0 else 0
    return iou

# mAP = mean Average Precision (most important metric)
# Calculated by averaging AP across all classes
```

| Metric | কী Measure করে | Formula |
|--------|----------------|---------|
| IoU | Box overlap quality | Intersection / Union |
| Precision | Detection accuracy | TP / (TP + FP) |
| Recall | Detection completeness | TP / (TP + FN) |
| mAP@0.5 | Mean Average Precision at IoU=0.5 | Average AP across classes |
| mAP@0.5:0.95 | Strict metric, multiple IoU thresholds | Average mAP at various IoU |

> [!tip] Pretrained Model দিয়ে শুরু করো
> # Object detection scratch থেকে train করা অনেক সময়সাপেক্ষ আর অনেক data লাগে। 99% ক্ষেত্রে pretrained YOLO দিয়ে শুরু করা উচিত — এটা COCO dataset এ 80 class detect করতে পারে। যদি custom class দরকার হয়, pretrained weight দিয়ে fine-tune করো। মাত্র 100-500 image দিয়ে ভালো result পাওয়া যায়। বড় model (yolo11x) accuracy বেশি দেয়, ছোট model (yolo11n) speed বেশি দেয় — use case অনুযায়ী বাছো।