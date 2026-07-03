# PyTorch আর TensorFlow

Deep learning লিখতে গেলে framework লাগে। 2026 এ তিনটা প্রধান framework আছে — PyTorch, TensorFlow, আর JAX। এই chapter এ দেখবো প্রতিটা এর philosophy, code pattern, আর কোন পরিস্থিতিতে কোনটা বেছে নেওয়া উচিত।

## Framework গুলোর Comparison

প্রথমে এক নজরে দেখে নিই তিনটাকে:

| Framework | প্রতিষ্ঠাতা | Philosophy | 2026 Status |
|-----------|-------------|-----------|-------------|
| **PyTorch** | Meta (Facebook) | Dynamic, Pythonic | Research এ রাজা |
| **TensorFlow/Keras** | Google | Static, Production | Production এ শক্ত |
| **JAX** | Google | Functional, Autodiff | Research এ rising star |

```text
2026 Framework Landscape:

Research:    PyTorch ████████████████████ 80%
             JAX     ████ 15%
             Others  █ 5%

Production:  TensorFlow ██████████████ 50%
             PyTorch   ████████████ 40%
             Others    █ 10%
```

> [!note] একটা framework শেখো ভালোভাবে
> সব framework এর concept একই — tensor, gradient, layer, loss। একটা ভালোভাবে শিখলে বাকিগুলো শিখতে দুই দিন লাগবে। শুরু PyTorch দিয়েই করো।

## PyTorch — Philosophy

PyTorch এর মূল ভাবনা — Pythonic, dynamic, eager execution। মানে তুমি যা লিখবে, সাথে সাথেই execute হবে। Debug করা সহজ, কোড পড়লেই বোঝা যায়।

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = x ** 2
print(y)   # tensor([1., 4., 9.])
```

কোনো session বানাতে হয় না, compile করতে হয় না। সোজা Python এর মতো। এটাই PyTorch এর আকর্ষণ।

### PyTorch Basics

PyTorch-এ সবকিছুর মূলে আছে **tensor** — এটা NumPy array-এর মতো, কিন্তু GPU-তে চলতে পারে আর automatic gradient calculate করে। `torch.nn` module-এ neural network তৈরির সব building block আছে — `nn.Linear` (fully connected layer), `nn.Module` (সব model-এর base class), activation function সব। `requires_grad=True` দিলে PyTorch সেই tensor-এর সব operation track করে, যাতে পরে `backward()` call করলে automatic gradient বের হয় — এটাই **autograd**।

```python
import torch
import torch.nn as nn

# 1. Tensor — PyTorch এর মূল data structure
x = torch.randn(3, 4)
print(x.shape)

# 2. nn.Module — model define
class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(4, 2)

    def forward(self, x):
        return torch.relu(self.fc(x))

model = MyModel()

# 3. Autograd — automatic gradient
x = torch.tensor(2.0, requires_grad=True)
y = x ** 2 + 3 * x
y.backward()
print(x.grad)   # tensor(7.) — dy/dx = 2x + 3
```

### DataLoader আর Training Loop

PyTorch এ data loading এর জন্য `DataLoader` আছে। Mini-batch এ ডেটা দেয়। এখানে `criterion` হলো loss function (যেমন `CrossEntropyLoss` classification-এ ব্যবহৃত হয়), আর `optimizer` হলো সেই জিনিস যে weight update করে। Training loop-এ পাঁচটা ধাপ থাকে: `model(data)` দিয়ে forward pass, `criterion` দিয়ে loss হিসাব, `optimizer.zero_grad()` দিয়ে আগের gradient মুছে ফেলা, `loss.backward()` দিয়ে নতুন gradient বের করা, আর `optimizer.step()` দিয়ে weight আসলেই update করা।

```python
from torch.utils.data import DataLoader, TensorDataset

X = torch.randn(100, 4)
y = torch.randint(0, 2, (100,))
dataset = TensorDataset(X, y)
loader = DataLoader(dataset, batch_size=16, shuffle=True)

model = MyModel()
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

for epoch in range(5):
    for batch_x, batch_y in loader:
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")
```

> [!tip] PyTorch এর Training Loop
> পাঁচটা লাইন মনে রাখো: forward → loss → zero_grad → backward → step। এটাই PyTorch training এর মূল। সব model এ একই।

## TensorFlow/Keras — Philosophy

TensorFlow এর philosophy একটু আলাদা — static graph, production-ready, high-level API। Keras TensorFlow এর উপর একটা friendly wrapper।

```python
import tensorflow as tf

x = tf.constant([1.0, 2.0, 3.0])
y = tf.square(x)
print(y)   # tf.Tensor([1. 4. 9.], shape=(3,), dtype=float32)
```

### Keras Sequential API

Keras এর Sequential API দিয়ে model বানানো একদম সহজ — এক লাইনে layer যোগ করে যাও। এখানে `Dense` হলো fully connected layer (প্রতিটা neuron আগের layer-এর সব neuron-এর সাথে connected)। `activation="relu"` দিলে hidden layer-এ non-linearity আসে, আর `activation="softmax"` শেষ layer-এ দিলে output গুলো probability হিসেবে আসে (যোগফল ১ হয়) — multi-class classification-এর জন্য এটাই দরকার। `compile()` এ optimizer, loss function আর metrics একসাথে set করে দেয়।

```python
from tensorflow import keras
from tensorflow.keras import layers

model = keras.Sequential([
    layers.Dense(128, activation="relu", input_shape=(4,)),
    layers.Dense(64, activation="relu"),
    layers.Dense(2, activation="softmax")
])

model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.summary()
```

### Keras Training — এক লাইনে!

Keras এ training এক লাইনে হয়ে যায়। এটাই এর সবচেয়ে বড় সুবিধা।

```python
import numpy as np

X = np.random.randn(100, 4)
y = np.random.randint(0, 2, 100)

model.fit(X, y, epochs=10, batch_size=16, validation_split=0.2)
```

`fit()` একটা method এর ভেতর forward, loss, backprop, update — সব handle করে। PyTorch এর manual loop এর চেয়ে অনেক সংক্ষিপ্ত।

> [!example] Keras এর সৌন্দর্য
> Keras এ মাত্র ১০ লাইনে complete neural network train করা যায়। নতুনদের জন্য এটা ideal। কিন্তু custom behavior দরকার হলে PyTorch এর flexibility বেশি।

## Functional API — যখন Sequential যথেষ্ট না

Sequential model linear — একটার পর একটা layer। কিন্তু multi-input, multi-output, skip connection এর জন্য Functional API দরকার।

```python
inputs = keras.Input(shape=(4,))
x = layers.Dense(128, activation="relu")(inputs)
x = layers.Dense(64, activation="relu")(x)
outputs = layers.Dense(2, activation="softmax")(x)

model = keras.Model(inputs=inputs, outputs=outputs)
```

## tf.data — Efficient Pipeline

বড় dataset এর জন্য `tf.data` pipeline বানানো যায়। এটা PyTorch DataLoader এর সমতুল্য। `from_tensor_slices` দিয়ে raw data থেকে dataset তৈরি হয়। এরপর `shuffle(100)` দিয়ে প্রতিবার ডেটা random order-এ আসে (overfitting কমায়), `batch(16)` দিয়ে ১৬টা sample একসাথে process হয়, আর `prefetch(AUTOTUNE)` দিয়ে পরের batch GPU-তে যাওয়ার সময় CPU পাশাপাশি পরের batch prepare করে রাখে — training অনেক fast হয়।

```python
dataset = tf.data.Dataset.from_tensor_slices((X, y))
dataset = dataset.shuffle(100).batch(16).prefetch(tf.data.AUTOTUNE)

model.fit(dataset, epochs=10)
```

## Model Saving আর Loading

উভয় framework এ model save/load করা যায়।

### PyTorch

PyTorch-এ model save করার standard practice হলো শুধু weight (parameter value) গুলো save করা — এটাকে `state_dict` বলে। পুরো model class definition আলাদাভাবে থাকে, save করা file-এ শুধু numeric weight থাকে। Load করার সময় প্রথমে empty model বানিয়ে তার উপর saved weight বসাতে হয়।

```python
# save
torch.save(model.state_dict(), "model.pth")

# load
model = MyModel()
model.load_state_dict(torch.load("model.pth"))
model.eval()
```

### TensorFlow

TensorFlow-এ পুরো model একসাথে save হয় — architecture, weight, optimizer state সব। একটা `.keras` file-এ সব থাকে, তাই load করা সহজ — class definition আলাদাভাবে রাখতে হয় না।

```python
# save (complete model)
model.save("my_model.keras")

# load
loaded = keras.models.load_model("my_model.keras")
```

> [!note] state_dict vs whole model
> PyTorch এ শুধু weight (`state_dict`) save করাই standard practice। কারণ class definition সবসময় দরকার হয়। TensorFlow এ পুরো model একসাথে save হয়।

## GPU Usage

GPU use করা দুটো framework এই সহজ।

### PyTorch

PyTorch-এ GPU ব্যবহার করতে হলে model আর data দুটোকেই explicitly GPU-তে পাঠাতে হয়। `torch.cuda.is_available()` দিয়ে চেক করা হয় GPU আছে কিনা, আর `.to(device)` দিয়ে tensor বা model সেই device-এ পাঠানো হয়।

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
x = x.to(device)
y = y.to(device)
```

### TensorFlow

```python
# TensorFlow automatically detects GPU
# কোনো extra code লাগে না
print("GPU available:", tf.config.list_physical_devices("GPU"))
```

> [!tip] GPU Debug
> PyTorch এ tensor device মিলে না গেলে error আসে। সব tensor আর model একই device এ রাখো। এটা PyTorch এর একটা common ঝামেলা।

## JAX — নতুন প্রতিযোগী

JAX Google এর নতুন framework। Functional programming style, autodiff এর জন্য অসাধারণ। Research এ জনপ্রিয়তা বাড়ছে। JAX-এ `jnp` হলো JAX-এর নিজস্ব NumPy version — সব NumPy function এর মতো কাজ করে কিন্তু GPU/TPU-তে run হয় আর automatic differentiation support করে। `jax.grad()` একটা function নিয়ে তার derivative function বানিয়ে দেয় — যেমন এখানে `loss_fn` এর gradient বের করা হচ্ছে।

```python
import jax
import jax.numpy as jnp

def loss_fn(x):
    return jnp.sum(x ** 2)

grad_fn = jax.grad(loss_fn)
print(grad_fn(jnp.array([1.0, 2.0, 3.0])))   # [2., 4., 6.]
```

JAX এর শক্তি — XLA compiler দিয়ে অনেক fast execution, functional style, আর সহজে parallelize করা। কিন্তু learning curve বেশি।

> [!warn] JAX এখন mature
> 2026 এ JAX অনেক mature হয়েছে। Google এর ভেতরে Gemini সহ বড় model train এ JAX use হয়। কিন্তু beginner এর জন্য এখনো PyTorch ই best।

## কোনটা বেছে নেবে 2026 এ?

```text
তোমার লক্ষ্য কী?
       │
       ├──► Research / Paper implementation ──► PyTorch
       │
       ├──► Production deployment ──────────► TensorFlow (Keras)
       │
       ├──► Maximum performance / research ──► JAX
       │
       ├──► Beginner learning ─────────────► PyTorch
       │
       └──► Quick prototype ───────────────► Keras
```

> [!tip] সোজা recommendation
> 2026 এ শিখতে শুরু করলে — PyTorch। পুরো ML/AI community PyTorch এ shift করেছে। Hugging Face, সব research code, tutorial — সব PyTorch এ। TensorFlow শুধু তখনই যখন তোমার company তা use করে।

## Comparison — একই Model দুই Framework এ

একই neural network দুই framework এ দেখি:

### PyTorch Version

PyTorch এ একটা classifier model `nn.Module` inherit করে তৈরি করা হয়েছে। `nn.Linear(784, 128)` মানে ৭৮৪টা input নিয়ে ১২৮টা output দেয়। `forward()` method-এ data কীভাবে layer থেকে layer যাবে সেটা define করা থাকে। Training loop এ আগের মতো forward → loss → zero_grad → backward → step একই pattern অনুসরণ করা হয়েছে।

```python
import torch
import torch.nn as nn

class Classifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        return self.fc2(x)

model = Classifier()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

for epoch in range(3):
    for x, y in train_loader:
        out = model(x)
        loss = criterion(out, y)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
```

### TensorFlow/Keras Version

Keras-এ একই model অনেক কম কোডে লেখা যায়। `Sequential` এ শুধু layer গুলো একটার পর একটা যোগ করলেই হয় — `forward()` method আলাদাভাবে লিখতে হয় না। `compile()` এ optimizer আর loss set করে, `fit()` এ পুরো training এক লাইনে হয়ে যায়।

```python
from tensorflow import keras
from tensorflow.keras import layers

model = keras.Sequential([
    layers.Dense(128, activation="relu", input_shape=(784,)),
    layers.Dense(10, activation="softmax")
])

model.compile(optimizer="adam", loss="sparse_categorical_crossentropy")
model.fit(train_data, epochs=3, batch_size=32)
```

কোড দুটো দেখো — Keras অনেক ছোট, কিন্তু PyTorch অনেক explicit। উভয়ের সুবিধা অসুবিধা আছে।

> [!example] প্রকৃত পার্থক্য
> দুটো framework এ একই model train করলে accuracy একই আসবে। পার্থক্য শুধু developer experience এ। PyTorch = control আর flexibility। Keras = simplicity আর speed of development।

## Deployment

Production এ model deploy করার সময় framework choice গুরুত্বপূর্ণ।

- **PyTorch** → TorchServe, ONNX export করে deploy
- **TensorFlow** → TF Serving, TFLite (mobile), TF.js (browser)
- **JAX** → সাধারণত PyTorch/TensorFlow এ convert করে deploy

ONNX (Open Neural Network Exchange) হলো একটা universal format — PyTorch বা TensorFlow যেকোনো framework-এর model কে ONNX-এ export করলে সেটা Caffe2, ONNX Runtime, সহ অন্যান্য inference engine-এ চালানো যায়। এখানে `torch.onnx.export()` এ একটা dummy input দিতে হয় যাতে PyTorch trace করে model-এর computation graph বুঝতে পারে।

```python
# PyTorch থেকে ONNX export
dummy = torch.randn(1, 784)
torch.onnx.export(model, dummy, "model.onnx")
```

> [!danger] Mobile এ TFLite
> Mobile app এ model deploy করতে চাইলে TensorFlow Lite সবচেয়ে mature। PyTorch Mobile আছে কিন্তু TFLite এর মতো battle-tested না। Edge device এ TensorFlow এখনো প্রাধান্য।

## Summary

PyTorch dynamic, Pythonic, research এ রাজা। TensorFlow/Keras production-ready, সহজ API, deployment এ শক্ত। JAX functional, দ্রুত, research এ rising। 2026 এ শিখতে শুরু করলে PyTorch শেখো, production এ গেলে TensorFlow জানো। দুটোই একই concept, শুধু syntax আর philosophy আলাদা। একটা ভালোভাবে জানলে বাকিটা সহজে শেখা যায়।