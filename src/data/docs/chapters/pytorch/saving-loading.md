## Saving & Loading Models

মডেল ট্রেনিং করার পর সেভ করা, মাঝপথে ট্রেনিং রিস্টার্ট করার জন্য চেকপয়েন্ট রাখা এবং প্রোডাকশনে ডেপ্লয়মেন্টের জন্য মডেল লোড করা অপরিহার্য।

PyTorch এ মডেল সেভ ও লোড করার একাধিক মেথড রয়েছে, যার মধ্যে **`state_dict`** সেভ করা ২০২৬ সালের বেস্ট প্র্যাকটিস।

---

## 1. `state_dict` কী?

`state_dict` হলো একটি সাধারণ Python Dictionary যেখানে মডেলের সব ট্রেনিংযোগ্য Parameters (Weights, Biases) এবং Persistent Buffers (e.g. BatchNorm Running Mean) টেন্সর হিসেবে চাবি-মান (Key-Value) জোড়ায় সংরক্ষিত থাকে।

```python
# View model state_dict keys
for param_tensor in model.state_dict():
    print(param_tensor, "\t", model.state_dict()[param_tensor].size())
```

---

## 2. Recommended Way: Saving & Loading Weights only (`state_dict`)

সরাসরি পুরো মডেল অবজেক্ট সেভ না করে শুধু `state_dict` সেভ ও লোড করা সবচেয়ে নিরাপদ এবং পোর্টেবল:

```python
import torch

# ----------------------------------------------------
# 1. Saving State Dict
# ----------------------------------------------------
MODEL_PATH = "model_weights.pth"
torch.save(model.state_dict(), MODEL_PATH)
print("Model weights saved successfully!")

# ----------------------------------------------------
# 2. Loading State Dict
# ----------------------------------------------------
# A. First recreate the model architecture instance
loaded_model = MyNeuralNetworkArchitecture()

# B. Load saved dictionary weights
weights = torch.load(MODEL_PATH, weights_only=True) # weights_only=True for 2026 Security!

# C. Load dictionary into model instance
loaded_model.load_state_dict(weights)

# D. Set to eval mode if performing inference
loaded_model.eval()
```

---

## 3. Saving & Resuming Full Checkpoints (Optimizer + Epoch + Loss)

দীর্ঘ সময় ধরে চলা ট্রেইনিং মাঝপথে পজ ও পুনরায় শুরু (Resume Training) করার জন্য **Full Checkpoint** সেভ করা হয়:

```python
# Checkpoint Dictionary Definition
checkpoint = {
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'scheduler_state_dict': scheduler.state_dict(),
    'loss': loss.item(),
    'best_val_acc': best_val_acc
}

# Save Checkpoint File
torch.save(checkpoint, "checkpoint_epoch_10.pth")

# ----------------------------------------------------
# Resuming Training from Checkpoint
# ----------------------------------------------------
checkpoint = torch.load("checkpoint_epoch_10.pth", weights_only=True)

model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
start_epoch = checkpoint['epoch'] + 1
print(f"Resuming training from epoch {start_epoch}")
```

---

## 4. 🔒 2026 Security Alert: `weights_only=True`

> [!important] Avoid Arbitrary Code Execution Attacks!
> PyTorch `torch.load()` বাইডিফল্ট Python `pickle` ডিসিওরিয়ালাইজেশন ব্যবহার করে। বিশ্বস্ত স্থান ছাড়া ডাউনলোড করা প্রিটেইন্ড ফাইলে অনাকাঙ্ক্ষিত ক্ষতিকর পাইথন কোড থ্রিট সিকিউরিটি রিক্স তৈরি করতে পারে।
> তাই **PyTorch 2.6+ এ `weights_only=True` বাধ্যতামূলক** সেফটি ফ্লাগ হিসেবে ব্যবহার করা হয় যাতে শুধুমাত্র টেন্সর ডাটা লোড হয় এবং অন্য কোনো পাইথন স্ক্রিপ্ট রান না হতে পারে!
