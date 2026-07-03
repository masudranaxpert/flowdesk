## Image Processing — OpenCV

Image processing হলো computer vision এর ভিত্তি। ছবি নিয়ে কাজ করার আগে সেটাকে process করতে হয় — resize, filter, edge detect, threshold। OpenCV (Open Source Computer Vision Library) হলো এই কাজের জন্য সবচেয়ে popular library, C++ এ লেখা কিন্তু Python binding আছে।

## OpenCV Install

নিচের command দিয়ে OpenCV install করা হয়। `opencv-python` হলো main package। `opencv-contrib-python` দিলে extra module পাওয়া যায় (SIFT, SURF ইত্যাদি)।

```bash
# Install OpenCV
pip install opencv-python

# For additional modules (SIFT, tracking, etc.)
pip install opencv-contrib-python

# For headless environments (servers without display)
pip install opencv-python-headless
```

## Image Read, Write, Display

সবচেয়ে basic operation — ছবি read করা, window এ দেখানো, আর save করা। `cv2.imread` দিয়ে ছবি load হয় NumPy array হিসেবে, `cv2.imwrite` দিয়ে save হয়। মনে রাখবে — OpenCV BGR format ব্যবহার করে।

```python
import cv2

# Read image (default: color, BGR format)
img = cv2.imread("photo.jpg")

# Read as grayscale
gray_img = cv2.imread("photo.jpg", cv2.IMREAD_GRAYSCALE)

# Read with alpha channel (transparency)
rgba_img = cv2.imread("photo.png", cv2.IMREAD_UNCHANGED)

# Display image in a window
cv2.imshow("My Image", img)
cv2.waitKey(0)  # Wait for any key press
cv2.destroyAllWindows()

# Save image
cv2.imwrite("output.jpg", img)
```

## Color Conversion

বিভিন্ন কাজের জন্য বিভিন্ন color space দরকার। `cv2.cvtColor` দিয়ে conversion করা হয়। BGR2GRAY সবচেয়ে common — edge detection আর face detection এর আগে grayscale এ convert করতে হয়।

```python
# Convert BGR to Grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Convert BGR to RGB (for matplotlib display)
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# Convert BGR to HSV (for color filtering)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# Convert BGR to LAB (for color difference)
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)

print(f"Original shape: {img.shape}")  # (H, W, 3)
print(f"Gray shape: {gray.shape}")     # (H, W)
```

## Resizing ও Cropping

মডেল গুলো fixed size input চায় (যেমন 224×224)। `cv2.resize` দিয়ে resize করা হয়। Cropping হলো NumPy array slicing — সহজ আর দ্রুত।

```python
# Resize to fixed dimensions
resized = cv2.resize(img, (224, 224))

# Resize with aspect ratio preserved
h, w = img.shape[:2]
aspect = w / h
new_w = 300
new_h = int(new_w / aspect)
resized_aspect = cv2.resize(img, (new_w, new_h))

# Crop using array slicing: image[y1:y2, x1:x2]
cropped = img[100:400, 200:600]

# Crop center region
ch, cw = h // 2, w // 2
center_crop = img[ch-112:ch+112, cw-112:cw+112]
```

## Filtering — Noise Reduction

Noise (দাগ, grain) ছবির quality নষ্ট করে। Filter দিয়ে noise কমানো যায়। `GaussianBlur` সবচেয়ে common — smooth, natural result দেয়। `medianBlur` salt-and-pepper noise এর জন্য ভালো।

```python
# Simple blur (average of neighbors)
blurred = cv2.blur(img, (5, 5))

# Gaussian blur (weighted average, most common)
gaussian = cv2.GaussianBlur(img, (5, 5), sigmaX=0)

# Median blur (good for salt-and-pepper noise)
median = cv2.medianBlur(img, 5)

# Bilateral filter (preserves edges while smoothing)
bilateral = cv2.bilateralFilter(img, 9, 75, 75)
```

Bilateral filter বিশেষ — noise কমায় কিন্তু edge ঠিক রাখে। যেখানে edge preservation দরকার সেখানে ব্যবহার করা উচিত, যদিও slow।

## Edge Detection

Edge (ধার) detect করা object boundary খোঁজার প্রথম ধাপ। Canny edge detector সবচেয়ে popular — দুটা threshold ব্যবহার করে strong আর weak edge আলাদা করে। Sobel operator হলো আরও simple gradient-based method।

```python
# Canny edge detection (most popular)
edges = cv2.Canny(gray, threshold1=100, threshold2=200)

# Sobel operator (X and Y gradients)
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

# Combine Sobel X and Y
import numpy as np
sobel_combined = np.sqrt(sobelx**2 + sobely**2).astype(np.uint8)

# Laplacian edge detection
laplacian = cv2.Laplacian(gray, cv2.CV_64F)
```

## Thresholding

Thresholding দিয়ে ছবিকে binary (শুধু সাদা-কালো) করা যায়। Simple threshold এ fixed value থাকে, adaptive threshold এ local area অনুযায়ী threshold vary করে — uneven lighting এ ভালো কাজ করে।

```python
# Simple binary threshold
ret, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

# Otsu's method (automatically finds optimal threshold)
ret, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
print(f"Otsu threshold value: {ret}")

# Adaptive threshold (good for uneven lighting)
adaptive = cv2.adaptiveThreshold(
    gray, 255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY,
    blockSize=11,
    C=2
)
```

## Morphology

Morphological operation গুলো binary image এর shape manipulate করে। Erosion (পাতলা), Dilation (মোটা), Opening (noise removal), Closing (gap fill) — এসব খুব দরকারী preprocessing step।

```python
# Create a kernel (structuring element)
kernel = np.ones((5, 5), np.uint8)

# Erosion - shrinks white regions
eroded = cv2.erode(binary, kernel, iterations=1)

# Dilation - expands white regions
dilated = cv2.dilate(binary, kernel, iterations=1)

# Opening = erosion followed by dilation (removes noise)
opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

# Closing = dilation followed by erosion (fills holes)
closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

# Gradient = difference between dilation and erosion (edge)
gradient = cv2.morphologyEx(binary, cv2.MORPH_GRADIENT, kernel)
```

## Drawing — Shape ও Text

Image processing এ সাধারণত result visualize করতে shape বা text draw করতে হয়। Bounding box, label, keypoint ইত্যাদি draw করার জন্য OpenCV এর drawing function গুলো দরকারী।

```python
import numpy as np

# Create a blank image
canvas = np.zeros((400, 400, 3), dtype=np.uint8)

# Draw a rectangle (image, top-left, bottom-right, color, thickness)
cv2.rectangle(canvas, (50, 50), (200, 150), (0, 255, 0), 2)

# Draw a filled rectangle (thickness = -1)
cv2.rectangle(canvas, (250, 50), (350, 150), (0, 0, 255), -1)

# Draw a circle (image, center, radius, color, thickness)
cv2.circle(canvas, (200, 300), 50, (255, 0, 0), 3)

# Draw a line
cv2.line(canvas, (0, 0), (400, 400), (255, 255, 0), 2)

# Draw text (image, text, position, font, size, color, thickness)
cv2.putText(canvas, "OpenCV Demo", (80, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
```

## Operation Reference Table

| Operation | Function | Use Case |
|-----------|----------|----------|
| Read | `cv2.imread()` | Load image |
| Write | `cv2.imwrite()` | Save image |
| Convert color | `cv2.cvtColor()` | BGR ↔ RGB/GRAY/HSV |
| Resize | `cv2.resize()` | Fixed size for models |
| Crop | `img[y1:y2, x1:x2]` | Region of interest |
| Gaussian blur | `cv2.GaussianBlur()` | Noise reduction |
| Canny edge | `cv2.Canny()` | Edge detection |
| Threshold | `cv2.threshold()` | Binary image |
| Adaptive threshold | `cv2.adaptiveThreshold()` | Uneven lighting |
| Erode | `cv2.erode()` | Remove small objects |
| Dilate | `cv2.dilate()` | Connect components |
| Draw rectangle | `cv2.rectangle()` | Bounding box |
| Draw text | `cv2.putText()` | Label |

> [!tip] OpenCV Coordinate System
> # OpenCV তে coordinate `(x, y)` format এ দিতে হয়, কিন্তু NumPy array indexing `(y, x)`। অর্থাৎ `img[y, x]` দিয়ে pixel access করতে হয়, কিন্তু `cv2.rectangle(img, (x, y), ...)` দিয়ে draw করতে হয়। এই উল্টো হওয়া অনেক bug এর কারণ। Shape ও `(height, width, channels)` format এ আসে, width আগে নয়। মাথায় রাখবে — image shape = (rows, cols) = (height, width)।