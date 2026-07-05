# Modules & Packages

In Python, modules and packages are how you organize code. Imagine a huge project — if all the code was in one file, it would be a nightmare! With modules and packages, we can split it up nicely.

## `import` Mechanics

```python
# Import an entire module
import math
print(math.pi)           # 3.141592653589793
print(math.sqrt(16))     # 4.0

# Import specific things
from math import pi, sqrt
print(pi)                # 3.141592653589793
print(sqrt(25))          # 5.0

# Rename with an alias
import numpy as np
from datetime import datetime as dt

# Import everything (avoid this!)
# from math import *  ← pollutes the namespace
```

> [!tip]
> Avoid `from math import *` — it brings all functions into the current namespace, which can cause name conflicts. Always use specific imports or `import math`.

## Creating Your Own Module

Any `.py` file is a module. Let's say `utils.py`:

```python
# utils.py
def greet(name):
    return f"Hello, {name}!"

PI = 3.14159

def _internal_helper():
    """Starting with underscore = private convention"""
    return "This is internal"
```

Now import it from another file:

```python
# main.py (in the same folder)
from utils import greet, PI

print(greet("Karim"))  # Hello, Karim!
print(PI)              # 3.14159
```

## `__name__ == '__main__'` — Why Do You Need It?

```python
# calculator.py
def add(a, b):
    return a + b

def main():
    print(f"2 + 3 = {add(2, 3)}")

if __name__ == "__main__":
    # Only runs when executed directly
    # Won't run when imported
    main()
```

```bash
# When run directly
python calculator.py
# 2 + 3 = 5

# When imported, main() won't run
python -c "from calculator import add; print(add(5, 5))"
# 10
```

> [!note]
> When Python runs a file directly, `__name__` becomes `'__main__'`. But when imported, `__name__` becomes the module's name (like `'calculator'`). With this check, we distinguish between "run as script" vs "import as module".

## Packages — Organizing Modules as Folders

A package is a collection of modules inside a folder. In the old structure, you needed `__init__.py`:

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

## Namespace Packages (PEP 420) — Without `__init__.py`

Since Python 3.3, namespace packages exist — packages work without `__init__.py`:

```text
myproject/
├── models/          ← No __init__.py!
│   ├── user.py
│   └── product.py
├── utils/
│   └── helpers.py
└── main.py
```

```python
# This works too!
from models.user import User
from models.product import Product
```

> [!tip]
> In 2026, many projects don't use `__init__.py` — namespace packages are the default. However, if you need to do some initialization or re-export when importing a package, then you need `__init__.py`. For simple cases, skip it.

## When Do You Need `__init__.py`?

```python
# models/__init__.py
from .user import User
from .product import Product

__all__ = ["User", "Product"]
```

```python
# Now you can easily import
from models import User, Product
# Instead of writing each one separately
# from models.user import User
# from models.product import Product
```

## Relative Imports

Inside the same package, you can use relative imports:

```python
# models/user.py
from . import product      # product module in the same package
from ..utils import helper # utils package one level up

# .  = current package
# .. = parent package
# ... = grandparent package
```

> [!warn]
> Relative imports only work inside packages — running as a standalone script gives `ImportError`. You need to run with `python -m package.module`, or use absolute imports.

## `sys.path` — How Python Finds Modules

```python
import sys

print(sys.path)
# ['', '/usr/lib/python314', '/usr/lib/python314/lib-dynload', ...]
```

Python searches for modules in this order:
1. **Current directory** (or the script's directory)
2. Directories in the **PYTHONPATH** environment variable
3. **Standard library** directory
4. **Site-packages** (installed packages)

```python
# Adding your own directory
import sys
from pathlib import Path

sys.path.insert(0, str(Path("/my/custom/path")))
import my_module  # Now it'll find it from the custom path too
```

## Circular Import — The Most Common Pitfall

```python
# a.py
from b import say_bye  ← importing b

def say_hello():
    return say_bye()  # using b's function
```

```python
# b.py
from a import say_hello  ← importing a ← CIRCULAR!

def say_bye():
    return "Goodbye"
```

This will give an `ImportError` — importing `a` needs `b`, importing `b` needs `a` — deadlock!

### Solutions:

```python
# Solution 1: Import inside the function
# a.py
def say_hello():
    from b import say_bye  # lazy import
    return say_bye()

# Solution 2: Put shared logic in a third module
# shared.py
def common_function():
    return "shared logic"

# Solution 3: Restructure — keep dependencies one-directional
# a → b (one direction), not b → a
```

> [!warn]
> Circular import is an architecture problem. If it happens, it's a signal that your modules aren't properly separated. Refactor and move shared logic to a separate module.

## Local Package Install with `pyproject.toml`

Installing your own package locally makes importing easy:

```toml
# pyproject.toml
[project]
name = "myproject"
version = "0.1.0"
```

```bash
# Editable install — changes to code take effect immediately
uv pip install -e .
# Or the old way
pip install -e .
```

```python
# Now from anywhere
import myproject
```

## Summary

A module is a `.py` file, a package is a folder. Namespace packages (PEP 420) work without `__init__.py`. Use `__name__ == '__main__'` to distinguish script vs module. Avoid circular imports — refactor your architecture. Use `pyproject.toml` + editable install for easy local development.