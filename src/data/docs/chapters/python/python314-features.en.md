# Python 3.14 New Features

Python 3.14 was officially released in October 2025. This version is significant — it brings improvements across performance, syntax, and developer experience. Let's look at each one.

## Free-Threaded Mode (No GIL)

Python had a historical problem — the **GIL (Global Interpreter Lock)**. Because of it, multiple threads couldn't truly run in parallel on a multi-core CPU. Python 3.14 brings the **free-threaded build** officially — the GIL can be disabled!

> [!note]
> The GIL was a lock that allowed only one thread at a time to execute Python bytecode. In free-threaded mode, this restriction is removed.

How to use it? The free-threaded build needs to be installed separately:

```bash
# Free-threaded Python on Ubuntu
sudo apt install python3.14-nogil
```

```python
import sys
print(sys._is_gil_enabled())  # Will be False in a free-threaded build
```

> [!warn]
> Free-threaded mode is still experimental. Not all C extensions support it yet. Test thoroughly before using it in production.

## JIT Compiler

The JIT (Just-In-Time) compiler first arrived in Python 3.13, and it's been further improved in 3.14. The JIT compiles hot code into native machine code at runtime — making it run much faster.

```python
# Running with JIT enabled
# python -X jit program.py
```

```python
# This kind of loop runs much faster with JIT
def heavy_computation(n):
    total = 0
    for i in range(n):
        total += i ** 2
    return total

print(heavy_computation(1_000_000))
```

> [!tip]
> Besides the JIT, many people use PyPy as an alternative — but Python 3.14's built-in JIT also provides good speedups.

## Template Strings (PEP 750)

Python 3.14 introduces a new feature — **Template Strings**, written with `t"..."` syntax (PEP 750). This is more powerful than regular f-strings — because it doesn't just compose a string, it gives you a `Template` object that can be rendered later.

```python
from string.templatelib import Template

name = "Karim"
t = t"Hello {name}, welcome!"
print(t)          # Hello Karim, welcome!
print(type(t))    # <class 'string.templatelib.Template'>
```

With f-strings, once evaluated, it's done. But with template strings, you can render them later, use them in different contexts — very useful for HTML, SQL, or log messages.

```python
from string.templatelib import Template

def to_html(t: Template) -> str:
    parts = []
    for item in t:
        if isinstance(item, str):
            parts.append(item)
        else:
            parts.append(f"<b>{item.value}</b>")
    return "".join(parts)

user = "Sadia"
msg = t"Welcome, {user}!"
print(to_html(msg))  # Welcome, <b>Sadia</b>!
```

> [!example]
> The biggest use case for template strings — safe rendering and custom formatting. Web frameworks and logging libraries will use this heavily.

## Deferred Annotations (PEP 649 / 749)

Previously, for forward references, we had to write at the top of every file:

```python
from __future__ import annotations  # No longer needed in Python 3.14!
```

Starting from Python 3.14, annotations are automatically **deferred** (lazy) — meaning they're stored as strings and only evaluated when needed. No more need for `from __future__ import annotations`!

```python
class Node:
    def __init__(self, value: int, next: Node | None = None):
        #                ^^^^^^^^ forward reference — now works directly!
        self.value = value
        self.next = next
```

Previously this code would error because `Node` wasn't defined yet. In 3.14, thanks to lazy evaluation, there's no problem.

> [!tip]
> Libraries like Pydantic and FastAPI that rely on type annotations will be much cleaner in 3.14.

## Improved Colorized Multiline REPL

Python 3.14's REPL (interactive shell) has been greatly improved:

- **Multiline editing** — much better than before
- **Colorized output** — with syntax highlighting
- **Command history** search (`Ctrl+R`)
- **Paste mode** — pasting multiple lines runs them all at once

```python
# Now you can write functions directly in the REPL
>>> def factorial(n):
...     if n <= 1:
...         return 1
...     return n * factorial(n - 1)
...
>>> factorial(5)
120
```

> [!note]
> To see the colors and multiline support, just type `python` in the terminal and press Enter. In 3.14, everything is enabled by default.

## Subinterpreters API

Python 3.14 brings a stable Python API for subinterpreters. This means — you can run multiple independent Python interpreters within the same process, each with its own GIL.

```python
import interpreters

# Create a new subinterpreter
interp = interpreters.create()
interp.prepare_main(name="worker")

# Run code in it
interp.run("print('I am speaking from a subinterpreter!')")
```

> [!tip]
> Subinterpreters let you run parallel workloads like multiprocessing — but with less overhead. Web servers and async frameworks will use this.

## Zstandard Compression in Stdlib

Starting from Python 3.14, **Zstandard (Zstd)** compression is directly available in the standard library. No external package needed anymore.

```python
import compression.zstd

data = b"data repeated thousands of times " * 1000

# Compress
compressed = compression.zstd.compress(data)
print(f"Original: {len(data)} bytes")
print(f"Compressed: {len(compressed)} bytes")

# Decompress
original = compression.zstd.decompress(compressed)
assert original == data  # exactly the same
```

| Format | Ratio | Speed | Use Case |
|--------|-------|-------|----------|
| **zstd** | Good | Fast | Modern default |
| **gzip** | Moderate | Slow | Legacy compatibility |
| **bzip2** | Good | Slow | When size matters most |

> [!example]
> Zstd was created by Facebook (Meta). It decompresses faster than gzip and gives a better ratio. It's becoming the standard for log files and database backups.

## All Together — What Goes Where

```python
import sys
import compression.zstd

# Check Python version
print(f"Python {sys.version}")

# 3.14 has lazy annotations — no future import needed
class TreeNode:
    def __init__(self, data: int, children: list[TreeNode] | None = None):
        self.data = data
        self.children = children or []

# Template string (PEP 750)
node_count = 42
msg = t"The tree has {node_count} nodes"
print(msg)
```

## Summary

Python 3.14 brings major updates — free-threaded mode, JIT, template strings, lazy annotations, improved REPL, subinterpreters, and Zstd compression. Together, these make Python faster and more developer-friendly than ever.