## Building Neural Networks with nn.Module

PyTorch এ যেকোনো নিউরাল নেটওয়ার্ক ব্লক বা পুরো আর্কিটেকচার তৈরি করার ভিত্তি হলো **`torch.nn.Module`**।

এটি একটি অবজেক্ট ওরিয়েন্টেড বেস ক্লাস যা মডেলের পারামিটার (Weights & Biases), সাব-মডিউলস এবং ডিভাইস স্টেট ম্যানেজ করে।

---

## 1. Custom Neural Network Class তৈরি করার নিয়ম

প্রতিটি Custom Neural Network ক্লাসে দুটি প্রধান বিষয় থাকতে হবে:
1. `super().__init__()` কল করা এবং লেয়ারগুলো ইনস্ট্যান্স ভ্যারিয়েবল হিসেবে ইনিশিয়ালাইজ করা।
2. **`forward(self, x)`** মেথড ডিফাইন করা, যেখানে ইনপুট টেন্সর `x` কীভাবে বিভিন্ন লেয়ারের ভেতর দিয়ে প্রবাহিত হবে তার লজিক থাকে।

```python
import torch
import torch.nn as nn

class MultilayerPerceptron(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, output_dim: int):
        super().__init__()

        # Layer Definitions
        self.fc1 = nn.Linear(input_dim, hidden_dim) # Fully Connected Layer 1
        self.relu = nn.ReLU()                       # Non-linear Activation
        self.dropout = nn.Dropout(p=0.2)            # Regularization
        self.fc2 = nn.Linear(hidden_dim, output_dim)# Output Layer

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Forward pass dataflow
        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout(x)
        out = self.fc2(x)
        return out

# Instantiate Model
model = MultilayerPerceptron(input_dim=784, hidden_dim=128, output_dim=10)
print(model)
```

---

## 2. Using `nn.Sequential` for Quick Stacking

যদি মডেল আর্কিটেকচার সোজা একটার পর একটা লেয়ারের চেইন হয়, তবে `nn.Sequential` দিয়ে দ্রুত মডেল রেডি করা যায়:

```python
sequential_model = nn.Sequential(
    nn.Linear(784, 256),
    nn.ReLU(),
    nn.BatchNorm1d(256),
    nn.Dropout(0.3),
    nn.Linear(256, 10)
)
```

---

## 3. Common PyTorch Neural Network Layers

| Layer Type | PyTorch Module | Typical Usage |
| :--- | :--- | :--- |
| **Dense / Linear** | `nn.Linear(in_features, out_features)` | Tabular Data, MLP Output |
| **2D Convolution** | `nn.Conv2d(in_channels, out_channels, kernel_size)` | Image Processing / CNN |
| **Pooling** | `nn.MaxPool2d(2, 2)`, `nn.AdaptiveAvgPool2d(1)` | Downsampling |
| **Recurrent** | `nn.LSTM(input_size, hidden_size)`, `nn.GRU` | Time Series / Sequential Data |
| **Attention** | `nn.MultiheadAttention(embed_dim, num_heads)` | Transformers & LLM Architecture |
| **Normalization** | `nn.BatchNorm2d`, `nn.LayerNorm` | Stabilizing Gradient & Training |

---

## 4. Model Parameters & Device Movement

মডেলের মোট ট্রেনিংযোগ্য প্যারামিটার (Learnable Parameters) গণনা করা এবং মডেলকে GPU তে পাঠানো:

```python
# 1. Total Trainable Parameters Count
total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Total Trainable Parameters: {total_params:,}")

# 2. Moving Model to GPU / MPS / CPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device) # Transfers all internal model weights to target device

# Test dummy input through model
dummy_input = torch.randn(32, 784).to(device) # Batch size of 32
output = model(dummy_input)
print("Output Shape:", output.shape) # torch.Size([32, 10])
```

> [!important] Never call `model.forward(x)` directly!
> মডেলে ডেটা পাস করার সময় সবসময় **`output = model(x)`** কল করতে হবে। কখনো `model.forward(x)` সরাসরি ডাকবে না! কারণ `model(x)` কল করলে PyTorch এর Internal Hooks, Pre-forward, Post-forward এবং Profiling ইভেন্টগুলো সঠিকভাবে ট্রিগার হয়।
