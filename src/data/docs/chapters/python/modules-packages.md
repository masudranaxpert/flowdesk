Python এ module আর package হলো code organize করার উপায়। একটা বিশাল প্রজেক্ট কল্পনা করো — সব কোড এক ফাইলে থাকলে দুঃস্বপ্ন! Module আর package দিয়ে সুন্দর ভাগ করে ফেলি।

## `import` Mechanics

```python
# পুরো module import
import math
print(math.pi)           # 3.141592653589793
print(math.sqrt(16))     # 4.0

# নির্দিষ্ট কিছু import
from math import pi, sqrt
print(pi)                # 3.141592653589793
print(sqrt(25))          # 5.0

# alias দিয়ে rename
import numpy as np
from datetime import datetime as dt

# সব কিছু import (avoid করবে!)
# from math import *  ← namespace pollute করে
```

> [!tip]
> `from math import *` এড়িয়ে চলো — এটা সব function বর্তমান namespace এ নিয়ে আসে, যার ফলে নাম conflict হতে পারে। সবসময় specific import বা `import math` ব্যবহার করো।

## নিজের Module বানানো

যেকোনো `.py` ফাইলই একটা module। ধরো `utils.py`:

```python
# utils.py
def greet(name):
    return f"হ্যালো, {name}!"

PI = 3.14159

def _internal_helper():
    """underscore দিয়ে শুরু = private convention"""
    return "এটা internal"
```

এখন অন্য ফাইল থেকে import করো:

```python
# main.py (same folder এ)
from utils import greet, PI

print(greet("Karim"))  # হ্যালো, Karim!
print(PI)              # 3.14159
```

## `__name__ == '__main__'` — কেন দরকার?

```python
# calculator.py
def add(a, b):
    return a + b

def main():
    print(f"2 + 3 = {add(2, 3)}")

if __name__ == "__main__":
    # শুধু সরাসরি রান করলে চলবে
    # import করলে চলবে না
    main()
```

```bash
# সরাসরি রান করলে
python calculator.py
# 2 + 3 = 5

# import করলে main() চলবে না
python -c "from calculator import add; print(add(5, 5))"
# 10
```

> [!note]
> যখন Python কোনো ফাইল সরাসরি রান করে, `__name__` হয় `'__main__'`। কিন্তু import করলে `__name__` হয় module এর নাম (যেমন `'calculator'`)। এই check দিয়ে আমরা "run as script" বনাম "import as module" আলাদা করি।

## Package — ফোল্ডার হিসেবে Module গোছানো

Package হলো ফোল্ডারের ভেতরে module গুলোর সংগ্রহ। পুরোনো structure এ `__init__.py` দরকার ছিল:

```text
myproject/
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── product.py
├── utils/
│   ├── __init__.py
│   └── helpers.py
└── main.py
```

```python
# main.py
from models.user import User
from models.product import Product
from utils.helpers import format_price
```

## Namespace Packages (PEP 420) — `__init__.py` ছাড়াই

Python 3.3+ থেকে namespace package এসেছে — `__init__.py` ছাড়াই package চলে:

```text
myproject/
├── models/          ← কোনো __init__.py নেই!
│   ├── user.py
│   └── product.py
├── utils/
│   └── helpers.py
└── main.py
```

```python
# এটাও কাজ করে!
from models.user import User
from models.product import Product
```

> [!tip]
> 2026 এ অনেক প্রজেক্ট `__init__.py` ব্যবহার করে না — namespace package default। তবে যদি package import করার সময় কিছু initialization বা re-export করতে হয়, তখন `__init__.py` দরকার। সিম্পল ক্ষেত্রে skip করো।

## `__init__.py` কখন দরকার?

```python
# models/__init__.py
from .user import User
from .product import Product

__all__ = ["User", "Product"]
```

```python
# এখন সহজে import
from models import User, Product
# না লিখে প্রতিটা আলাদা করে
# from models.user import User
# from models.product import Product
```

## Relative Import

একই package এর ভেতরে relative import করা যায়:

```python
# models/user.py
from . import product      # একই package এর product module
from ..utils import helper # এক level উপরের utils package

# .  = current package
# .. = parent package
# ... = grandparent package
```

> [!warn]
> Relative import শুধু package এর ভেতরে চলে — standalone script হিসেবে রান করলে `ImportError` দেয়। `python -m package.module` দিয়ে রান করতে হয়, বা absolute import ব্যবহার করো।

## `sys.path` — Python কিভাবে Module খোঁজে?

```python
import sys

print(sys.path)
# ['', '/usr/lib/python314', '/usr/lib/python314/lib-dynload', ...]
```

Python এই ক্রমে module খোঁজে:
1. **Current directory** (বা script এর directory)
2. **PYTHONPATH** environment variable এর directory গুলো
3. **Standard library** directory
4. **Site-packages** (installed package গুলো)

```python
# নিজের directory যোগ করা
import sys
from pathlib import Path

sys.path.insert(0, str(Path("/my/custom/path")))
import my_module  # এখন custom path থেকেও পাবে
```

## Circular Import — সবচেয়ে Common Pitfall

```python
# a.py
from b import say_bye  ← b কে import করছে

def say_hello():
    return say_bye()  # b এর function ব্যবহার করছে
```

```python
# b.py
from a import say_hello  ← a কে import করছে ← CIRCULAR!

def say_bye():
    return "বিদায়"
```

এটা `ImportError` দেবে — `a` import করতে গেলে `b` লাগে, `b` import করতে গেলে `a` লাগে — deadlock!

### সমাধান গুলো:

```python
# সমাধান ১: function এর ভেতরে import করো
# a.py
def say_hello():
    from b import say_bye  # lazy import
    return say_bye()

# সমাধান ২: third module এ শেয়ার করা logic রাখো
# shared.py
def common_function():
    return "shared logic"

# সমাধান ৩: restructure — dependency একদিকে রাখো
# a → b (একদিকে), b → a না
```

> [!danger]
> Circular import হলো architecture এর সমস্যা। যদি হয়, সেটা signal যে তোমার module গুলো ভালো করে separate করা হয় নি। Refactor করো, shared logic কে আলাদা module এ নাও।

## `pyproject.toml` এ Local Package Install

নিজের package locally install করলে import করা সহজ হয়:

```toml
# pyproject.toml
[project]
name = "myproject"
version = "0.1.0"
```

```bash
# editable install — কোড change করলেই effect
uv pip install -e .
# বা পুরোনো উপায়
pip install -e .
```

```python
# এখন যেকোনো জায়গা থেকে
import myproject
```

## Summary

Module হলো `.py` ফাইল, package হলো ফোল্ডার। Namespace package (PEP 420) এ `__init__.py` ছাড়াই চলে। `__name__ == '__main__'` দিয়ে script বনাম module আলাদা করো। Circular import এড়িয়ে চলো — architecture refactor করো। `pyproject.toml` + editable install দিয়ে local development সহজ করো।