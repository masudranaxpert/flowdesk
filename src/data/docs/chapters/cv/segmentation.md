## Segmentation

Segmentation হলো computer vision এর সবচেয়ে fine-grained task — image এর প্রতিটা pixel কে class assign করা। Object detection শুধু bounding box দেয়, কিন্তু segmentation pixel-level precision দেয়। Medical imaging (tumor boundary), autonomous driving (road vs sidewalk), photo editing (background removal) — সবখানে segmentation দরকার। 2026 এ SAM 3 (Segment Anything Model 3) এই জগতে revolution এনেছে।

## Segmentation এর প্রকার

তিন ধরনের segmentation আছে, প্রতিটার precision আর complexity আলাদা:

```text
Semantic:                Instance:                Panoptic:
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ ░░░░▓▓▓▓░░ │         │ ░░░░▓₁▓▓░░ │         │ ░░sky▓₁▓▓░ │
│ ░░░░▓▓▓▓░░ │         │ ░░░░▓₁▓▓░░ │         │ ░░sky▓₁▓▓░ │
│ ▓▓▓▓░░░░▓▓ │         │ ▓₂▓▓░░░░▓₃│         │ grass░░░car│
│ ▓▓▓▓░░░░▓▓ │         │ ▓₂▓▓░░░░▓₃│         │ grass░░░car│
└─────────────┘         └─────────────┘         └─────────────┘
Same class = same       Same class =             Everything =
color                   different instances      labeled
```

| Type | What it segments | Same class instances |
|------|-----------------|---------------------|
| Semantic | প্রতিটা pixel → class | Same label (not distinguished) |
| Instance | শুধু objects (not background) | Separate labels per instance |
| Panoptic | Everything (objects + background) | Separate per instance + stuff |

## U-Net Architecture

U-Net হলো segmentation এর সবচেয়ে influential architecture, 2015 এ medical imaging এর জন্য তৈরি। Encoder (contracting path) feature extract করে, Decoder (expansive path) high-resolution mask তৈরি করে। মূল innovation হলো skip connection — encoder এর feature সরাসরি decoder এ পাঠানো হয়, যাতে fine detail নষ্ট না হয়।

```text
U-Net Architecture:
Encoder (Down)                    Decoder (Up)
572×572 ──Conv──→ 288×288 ──────────────→ 392×392 ──Conv──→ 388×388
                    │  skip conn ↑          │  skip conn ↑
                 136×136 ──────────────→ 200×200
                    │  skip conn ↑          │  skip conn ↑
                  64×64  ──────────────→ 104×104
                    │  skip conn ↑          │  skip conn ↑
                  32×32  ──────────────→  56×56
                    │                       │
                  28×28 (bottleneck)
```

নিচের PyTorch code এ U-Net এর basic structure দেখানো হলো। DoubleConv block (Conv→ReLU→Conv→ReLU) মূল building block। Skip connection গুলো `torch.cat` দিয়ে concatenate করা হয়।

```python
import torch
import torch.nn as nn

class DoubleConv(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.block(x)

class UNet(nn.Module):
    def __init__(self, in_channels=3, num_classes=1):
        super().__init__()
        # Encoder
        self.enc1 = DoubleConv(in_channels, 64)
        self.enc2 = DoubleConv(64, 128)
        self.enc3 = DoubleConv(128, 256)
        self.bottleneck = DoubleConv(256, 512)

        self.pool = nn.MaxPool2d(2)

        # Decoder with skip connections
        self.up3 = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.dec3 = DoubleConv(512, 256)
        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = DoubleConv(256, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = DoubleConv(128, 64)

        self.out = nn.Conv2d(64, num_classes, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        b = self.bottleneck(self.pool(e3))

        d3 = self.dec3(torch.cat([self.up3(b), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))

        return self.out(d1)
```

## SAM 3 — Segment Anything Model 3

Meta এর SAM 3 (2026) হলো universal segmentation model — যেকোনো object যেকোনো image এ segment করতে পারে, training ছাড়াই (zero-shot)। মূল feature: prompt-based segmentation — একটা point click বা text description দিলেই object segment করে। এটা CV এর ChatGPT moment।

```text
SAM 3 Prompt Types:
1. Point prompt:  "segment the object at this pixel"
2. Box prompt:    "segment inside this bounding box"
3. Text prompt:   "segment the cat in this image"
4. Mask prompt:   "refine this rough mask"
```

## SAM ব্যবহার — Hugging Face

Hugging Face transformers দিয়ে SAM ব্যবহার করা খুব সহজ। `SamModel` আর `SamProcessor` দিয়ে model load আর inference করা যায়। Point prompt দিয়ে specify করা হয় কোন object segment করতে হবে।

```python
from transformers import SamModel, SamProcessor
from PIL import Image
import torch

# Load SAM model and processor
model = SamModel.from_pretrained("facebook/sam-vit-huge")
processor = SamProcessor.from_pretrained("facebook/sam-vit-huge")

# Load image
image = Image.open("photo.jpg").convert("RGB")

# Provide a point prompt (where the object is)
input_points = [[[450, 320]]]  # (x, y) coordinates

# Process and predict
inputs = processor(image, input_points=input_points, return_tensors="pt")
with torch.no_grad():
    outputs = model(**inputs)

masks = processor.image_processor.post_process_masks(
    outputs.pred_masks.cpu(),
    inputs["original_sizes"].cpu(),
    inputs["reshaped_input_sizes"].cpu()
)

print(f"Generated {len(masks[0])} mask candidates")
```

নিচের কোডে automatic mask generation দেখানো হলো — কোনো prompt ছাড়া SAM পুরো image এর সব object segment করে। এটা SAM এর সবচেয়ে impressive capability।

```python
from transformers import SamModel, SamProcessor, SamMaskDecoderConfig
from sam2 import SAM2ImagePredictor  # SAM 3 / SAM 2 API

# Automatic mask generation (no prompts needed)
predictor = SAM2ImagePredictor.from_pretrained("facebook/sam2-hiera-large")

import numpy as np
image_array = np.array(image)

# Predict all masks automatically
predictor.set_image(image_array)
masks, scores, logits = predictor.predict(
    point_coords=None,
    box=None,
    multimask_output=True,
    point_labels=None
)

print(f"Found {len(masks)} segments")
for i, mask in enumerate(masks):
    print(f"  Mask {i}: {mask.sum()} pixels, score: {scores[i]:.3f}")
```

## Mask Representation

Segmentation এর output হলো mask — প্রতিটা pixel এর জন্য 0 (background) বা 1 (object)। দুটো common format আছে: binary mask (pixel grid) আর polygon (coordinate list)।

```python
import numpy as np

# Binary mask format: 2D array, same size as image
mask = np.zeros((480, 640), dtype=np.uint8)
mask[100:300, 200:500] = 1  # White rectangle = object

# Polygon format: list of (x, y) coordinates
polygon = [(200, 100), (500, 100), (500, 300), (200, 300)]

# Convert polygon to mask using OpenCV
import cv2
mask_from_poly = np.zeros((480, 640), dtype=np.uint8)
cv2.fillPoly(mask_from_poly, [np.array(polygon)], 1)
```

## Evaluation Metrics

Segmentation quality measure করার জন্য pixel-level metric দরকার। mIoU (mean Intersection over Union) সবচেয়ে common, Dice coefficient medical imaging এ popular।

নিচের কোডে দুটো metric এর calculation দেখানো হলো। উভয়ই 0-1 range এ — 1 মানে perfect segmentation, 0 মানে সম্পূর্ণ ভুল।

```python
import numpy as np

def calculate_miou(pred_mask, true_mask, num_classes=2):
    ious = []
    for cls in range(num_classes):
        pred = (pred_mask == cls)
        true = (true_mask == cls)
        intersection = np.logical_and(pred, true).sum()
        union = np.logical_or(pred, true).sum()
        iou = intersection / union if union > 0 else 0
        ious.append(iou)
    return np.mean(ious)

def calculate_dice(pred_mask, true_mask):
    intersection = np.logical_and(pred_mask, true_mask).sum()
    total = pred_mask.sum() + true_mask.sum()
    dice = 2 * intersection / total if total > 0 else 0
    return dice

# Example
pred = np.array([[1, 1, 0], [1, 0, 0], [0, 0, 0]])
true = np.array([[1, 1, 0], [0, 0, 0], [0, 0, 0]])
print(f"mIoU: {calculate_miou(pred, true):.4f}")
print(f"Dice: {calculate_dice(pred, true):.4f}")
```

## Segmentation এর Use Cases

| Domain | Task | Model |
|--------|------|-------|
| Medical | Tumor/organ segmentation | U-Net, nnU-Net |
| Autonomous driving | Lane, road, pedestrian | DeepLab, SegFormer |
| Photo editing | Background removal | SAM 3 |
| Satellite | Land use mapping | U-Net |
| AR/VR | Hand/body tracking | Mask R-CNN |
| Agriculture | Crop/weed segmentation | U-Net variants |

> [!example] SAM 3 Zero-shot Capability
> # SAM 3 এর সবচেয়ে অবিশ্বাস্য বিষয় হলো zero-shot capability — এটা এমন object segment করতে পারে যা training data তে ছিল না। একটা অদ্ভুত medical scan, একটা never-before-seen product photo — সবকিছুতে কাজ করে। শুধু একটা point click করো, SAM 3 বুঝে যাবে কোন object টা segment করতে হবে। এর আগে প্রতিটা domain এ আলাদা model train করতে হতো — medical এর জন্য একটা, autonomous driving এর জন্য আরেকটা। এখন একটাই model সব কাজে চলে। এটা foundation model paradigm এর জয়।