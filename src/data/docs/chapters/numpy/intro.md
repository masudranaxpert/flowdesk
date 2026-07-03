# NumPy কী ও ইনস্টল

NumPy (Numerical Python) হলো Python এর সবচেয়ে জরুরি library গুলোর একটা — scientific computing এর জন্য। Data science, machine learning, যেকোনো numerical work — সবখানে NumPy লাগে। Pandas, PyTorch, TensorFlow সবার নিচে NumPy ই চলে।

## NumPy কী?

NumPy এর মূল জিনিস হলো **ndarray** — N-dimensional array। এটা Python list এর মতো, কিন্তু অনেক দ্রুত আর powerful।

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])
print(arr)            # [1 2 3 4 5]
print(type(arr))      # <class 'numpy.ndarray'>
```

## Python List এর চেয়ে কেন দ্রুত?

এই প্রশ্নটা খুব জরুরি। আসলে পার্থক্য কোথায়?

### 1. Contiguous Memory

Python list এর প্রতিটা element আলাদা memory তে scattered থাকে। কিন্তু NumPy array সব element এক জায়গায় contiguous memory block এ রাখে। এতে CPU cache অনেক ভালো কাজ করে।

```
Python List:  [ptr] → [obj]    [ptr] → [obj]    [ptr] → [obj]
                                   (scattered, slow)

NumPy Array:  [int][int][int][int][int]
              (contiguous, fast cache access)
```

### 2. C-Backed Operations

NumPy এর ভেতরে সব math operation **C আর Fortran** এ লেখা — Python এ না। তাই loop এর চেয়ে কয়েক শ গুণ দ্রুত।

```python
import numpy as np
import time

# Python list — loop দিয়ে
py_list = list(range(1_000_000))
start = time.time()
py_result = [x * 2 for x in py_list]
print(f"Python list: {time.time() - start:.4f}s")

# NumPy — vectorized
np_arr = np.arange(1_000_000)
start = time.time()
np_result = np_arr * 2
print(f"NumPy: {time.time() - start:.4f}s")
```

```
Python list: 0.0823s
NumPy: 0.0012s
```

> [!tip]
> NumPy কেই বলে দ্রুত। কারণ ভেতরে C চলে, আর contiguous memory তে ডেটা থাকে। তাই large numerical computation এ সবসময় NumPy ব্যবহার করবে।

### 3. Fixed Data Type

Python list এ যেকোনো type মেশানো যায় — `[1, "hello", 3.14]`। কিন্তু NumPy array তে সব element same type এর হয়। এতে type check এর overhead থাকে না।

## NumPy ইনস্টল করা

NumPy install করা একদম সহজ — `pip` দিয়ে:

```bash
pip install numpy
```

verify করতে চাইলে:

```python
import numpy as np
print(np.__version__)
```

```
2.1.3
```

> [!note]
> Anaconda ব্যবহার করলে NumPy আগে থেকেই installed থাকে। `conda install numpy` দিয়ে ও install করা যায়।

## `import numpy as np` Convention

NumPy সবসময় `np` alias দিয়ে import করা হয়। এটা দুনিয়াজুড়ে convention — কেউ `import numpy` লেখে না, সবাই `import numpy as np` লেখে। এতে কোড ছোট আর readable হয়।

```python
import numpy as np

arr = np.array([1, 2, 3])
print(np.sum(arr))   # np. prefix দিয়ে সব function access
```

## NumPy Array vs Python List — এক নজরে

| Feature | Python List | NumPy Array |
|---------|-------------|-------------|
| Speed | ধীর | দ্রুত |
| Memory | বেশি | কম |
| Data Type | Mixed | Fixed (homogeneous) |
| Math Operation | Element-wise না | Element-wise ✅ |
| Multi-dimensional | Nested list | Native support |
| Broadcasting | না | ✅ আছে |

> [!example]
> যদি তোমার শুধু কয়েকটা element রাখতে হয় আর math কম — Python list ই চলবে। কিন্তু numerical computation, large data, matrix operation — এসবে অবশ্যই NumPy।

## কোথায় কোথায় NumPy ব্যবহার হয়?

- **Data Science** — Pandas এর নিচে NumPy চলে
- **Machine Learning** — weight, matrix operation সব NumPy দিয়ে
- **Image Processing** — image হলো NumPy array (pixels)
- **Scientific Simulation** — physics, engineering calculation
- **Financial Analysis** — stock price, statistical model

## Summary

NumPy হলো numerical Python এর ভিত্তি। Python list থেকে দ্রুত, memory efficient, আর powerful। পরের chapter এ আমরা array তৈরি আর basic operation শিখবো।