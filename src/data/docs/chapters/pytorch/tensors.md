## PyTorch Tensors A to Z

PyTorch এর সবচেয়ে মৌলিক ডাটা স্ট্রাকচার হলো **Tensor**। 

Tensor হলো NumPy `ndarray` এর মতো বহুমুখী ম্যাট্রিক্স (Multi-dimensional Array), কিন্তু এর বিশাল সুবিধা হলো এটি **GPU/NPU** তে প্যারালাল ক্যালকুলেশন চালাতে পারে এবং অটোমেটিক গ্র্যাডিয়েন্ট ক্যালকুলেট করতে পারে।

---

## 1. Tensor তৈরির বিভিন্ন উপায়

```python
import torch
import numpy as np

# 1. Direct from Python List
data = [[1, 2], [3, 4]]
x_data = torch.tensor(data)

# 2. From NumPy Array (Zero-Copy Shared Memory!)
np_array = np.array([1.0, 2.0, 3.0])
x_np = torch.from_numpy(np_array)

# 3. Special Constructors (Zeros, Ones, Random)
x_zeros = torch.zeros((2, 3))       # 2x3 matrix of 0s
x_ones = torch.ones((3, 3))         # 3x3 matrix of 1s
x_rand = torch.rand((2, 2))         # Random uniform [0, 1)
x_randn = torch.randn((3, 3))       # Random standard Normal Distribution (mean=0, std=1)

print("Random Tensor:\n", x_rand)
```

---

## 2. Tensor Attributes: Shape, Dtype, Device

প্রতিটি Tensor অবজেক্টে ৩টি প্রধান প্রপার্টি থাকে:

```python
tensor = torch.rand(3, 4, dtype=torch.float32)

print(f"Shape of tensor: {tensor.shape}")      # Output: torch.Size([3, 4])
print(f"Datatype of tensor: {tensor.dtype}")   # Output: torch.float32
print(f"Device tensor is stored on: {tensor.device}") # Output: cpu (or cuda:0)
```

### Common Data Types in PyTorch:
- **`torch.float32` (FloatTensor)**: Default for Deep Learning weights.
- **`torch.float16` / `torch.bfloat16`**: Mixed Precision & LLM Training (মেমরি অর্ধেক বাঁচায়!).
- **`torch.int64` (LongTensor)**: Integer labels, class indices & Token IDs.
- **`torch.bool`**: Masking and logical indexing.

---

## 3. Shape Manipulation & Reshaping

মডেলের লেয়ার ট্রান্সফর্মেশনে Tensor এর Shape পরিবর্তন অহরহ প্রয়োজন হয়।

```python
x = torch.arange(12) # [0, 1, 2, ..., 11] (Shape: torch.Size([12]))

# 1. reshape / view (12 -> 3x4)
x_3x4 = x.reshape(3, 4) # or x.view(3, 4)

# 2. -1 inferred dimension (Automatic calculation)
x_auto = x.reshape(2, -1) # Inferred to (2, 6)

# 3. Squeeze & Unsqueeze (Dimension addition/removal)
# Unsqueeze: Add dimension of size 1
x_unsqueezed = x_3x4.unsqueeze(dim=0) # Shape: (1, 3, 4) - useful for batch dimension!

# Squeeze: Remove all dimensions of size 1
x_squeezed = x_unsqueezed.squeeze() # Shape: (3, 4)

# 4. Transpose & Permute (Axis swapping)
x_transposed = x_3x4.T # Shape: (4, 3)
x_permuted = torch.rand(2, 3, 4).permute(2, 0, 1) # Swaps dimensions to (4, 2, 3)
```

---

## 4. Tensor Operations & Matrix Multiplication

### Element-wise Operations
```python
a = torch.tensor([1, 2, 3])
b = torch.tensor([4, 5, 6])

print(a + b)  # [5, 7, 9]
print(a * b)  # Element-wise product: [4, 10, 18]
```

### Matrix Multiplication (`@` operator or `torch.matmul`)
```python
mat1 = torch.rand(2, 3)
mat2 = torch.rand(3, 4)

# Matrix Product: (2x3) @ (3x4) -> (2x4)
res = mat1 @ mat2  # or torch.matmul(mat1, mat2)
print("Matrix Multiplied Shape:", res.shape) # torch.Size([2, 4])
```

> [!important] In-place Operations (`_` suffix)
> PyTorch এ যেকোনো মেথডের শেষে underscore (`_`) থাকলে সেটি **In-place Operation** নির্দেশ করে (যেমন `x.add_(5)` বা `x.zero_()`) যা মেমরি রি-অ্যালোকেশন ছাড়া সরাসরি বিদ্যমান টেন্সর পরিবর্তন করে।
