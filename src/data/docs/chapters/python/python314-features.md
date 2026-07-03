# Python 3.14 এর নতুন ফিচার

Python 3.14 October 2025 এ officially release হয়েছে। এই version টা অনেক বড় — কারণ এতে performance, syntax, আর developer experience সব দিক থেকে উন্নতি এসেছে। চলো এক এক করে দেখি।

## Free-Threaded Mode (No GIL)

Python এ একটা historical সমস্যা ছিল — **GIL (Global Interpreter Lock)**। এর কারণে multi-core CPU তে ও multiple thread সত্যিকারের parallel ভাবে চলতে পারতো না। Python 3.14 এ **free-threaded build** officially আসছে — GIL disable করা যায়!

> [!note]
> GIL একটা lock ছিল যেটা একসাথে শুধু একটা thread কে Python bytecode execute করতে দিত। Free-threaded mode এ এই restriction উঠে গেছে।

কিভাবে ব্যবহার করবে? Free-threaded build আলাদাভাবে install করতে হয়:

```bash
# Ubuntu এ free-threaded Python
sudo apt install python3.14-nogil
```

```python
import sys
print(sys._is_gil_enabled())  # False হবে free-threaded build এ
```

> [!warn]
> Free-threaded mode এখনো experimental। সব C extension এখনো support করে না। Production এ use করার আগে ভালো করে test করবে।

## JIT Compiler

Python 3.13 এ JIT (Just-In-Time) compiler প্রথম আসে, আর 3.14 এ সেটা আরো improve হয়েছে। JIT hot code গুলো runtime এ native machine code এ compile করে — ফলে অনেক দ্রুত চলে।

```python
# JIT enable করে রান করা
# python -X jit program.py
```

```python
# এই ধরনের loop JIT এ অনেক দ্রুত চলে
def heavy_computation(n):
    total = 0
    for i in range(n):
        total += i ** 2
    return total

print(heavy_computation(1_000_000))
```

> [!tip]
> JIT ছাড়াও অনেকে alternative হিসেবে PyPy ব্যবহার করে — কিন্তু Python 3.14 এর built-in JIT দিয়েও ভালো speedup পাওয়া যাচ্ছে।

## Template Strings (PEP 750)

Python 3.14 এ নতুন একটা feature এসেছে — **Template Strings**, যেটা `t"..."` syntax দিয়ে লেখা হয় (PEP 750)। এটা সাধারণ f-string এর চেয়ে বেশি powerful — কারণ এটা string compose করে না শুধু, বরং একটা `Template` object দেয় যেটা পরে render করা যায়।

```python
from string.templatelib import Template

name = "Karim"
t = t"হ্যালো {name}, স্বাগতম!"
print(t)          # হ্যালো Karim, স্বাগতম!
print(type(t))    # <class 'string.templatelib.Template'>
```

f-string এ একবার evaluate হলে শেষ। কিন্তু template string এ তুমি পরে আলাদা ভাবে render করতে পারো, ভিন্ন context এ use করতে পারো — যেমন HTML, SQL, বা log message এর জন্য খুব useful।

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
> Template string এর সবচেয়ে বড় use case হলো — safe rendering আর custom formatting। Web framework আর logging library গুলো এটা heavily ব্যবহার করবে।

## Deferred Annotations (PEP 649 / 749)

আগে forward reference এর জন্য আমাদের প্রতিটা file এর উপরে লিখতে হতো:

```python
from __future__ import annotations  # Python 3.14 এ আর লাগবে না!
```

Python 3.14 থেকে annotation গুলো automatically **deferred** (lazy) হবে — মানে সেগুলো string হিসেবে store থাকবে আর শুধু দরকার হলে evaluate হবে। `from __future__ import annotations` এর আর দরকার নেই!

```python
class Node:
    def __init__(self, value: int, next: Node | None = None):
        #                ^^^^^^^^ forward reference — এখন সরাসরি চলে!
        self.value = value
        self.next = next
```

আগে এই কোড error দিত কারণ `Node` তখনো define হয়নি। 3.14 এ lazy evaluation এর কারণে সমস্যা নেই।

> [!tip]
> Pydantic, FastAPI এর মতো library গুলো যেগুলো type annotation এর উপর নির্ভর করে, তারা 3.14 এ অনেক বেশি clean হবে।

## Improved Colorized Multiline REPL

Python 3.14 এ REPL (interactive shell) অনেক উন্নত হয়েছে:

- **Multiline editing** — আগের থেকে অনেক ভালো
- **Colorized output** — syntax highlight সহ
- **Command history** search করা যায় (`Ctrl+R`)
- **Paste mode** — কয়েক লাইন paste করলে একসাথে চলে

```python
# REPL এ এখন সরাসরি function লিখে দেখা যায়
>>> def factorial(n):
...     if n <= 1:
...         return 1
...     return n * factorial(n - 1)
...
>>> factorial(5)
120
```

> [!note]
> কালার আর multiline support দেখতে পেতে terminal এ শুধু `python` লিখে enter দাও। 3.14 এ default ভাবে সব চালু থাকবে।

## Subinterpreters API

Python 3.14 এ subinterpreters এর জন্য stable Python API এসেছে। এর মানে হলো — একই process এর ভেতরে একাধিক independent Python interpreter চালানো যায়, প্রত্যেকটা আলাদা GIL সহ।

```python
import interpreters

# নতুন subinterpreter তৈরি
interp = interpreters.create()
interp.prepare_main(name="worker")

# সেখানে code run করো
interp.run("print('আমি subinterpreter থেকে কথা বলছি!')")
```

> [!tip]
> Subinterpreter দিয়ে parallel workload চালানো যায় multiprocessing এর মতো — কিন্তু কম overhead সহ। Web server আর async framework গুলো এটা ব্যবহার করবে।

## Zstandard Compression in Stdlib

Python 3.14 থেকে **Zstandard (Zstd)** compression সরাসরি standard library তে এসেছে। আর কোনো external package লাগবে না।

```python
import compression.zstd

data = b"হাজার হাজার বার repeat হওয়া ডেটা " * 1000

# Compress
compressed = compression.zstd.compress(data)
print(f"Original: {len(data)} bytes")
print(f"Compressed: {len(compressed)} bytes")

# Decompress
original = compression.zstd.decompress(compressed)
assert original == data  # হুবহু same
```

| Format | Ratio | Speed | Use Case |
|--------|-------|-------|----------|
| **zstd** | ভালো | দ্রুত | Modern default |
| **gzip** | মোটামুটি | ধীর | Legacy compatibility |
| **bzip2** | ভালো | ধীর | যেখানে size গুরুত্বপূর্ণ |

> [!example]
> Zstd Facebook (Meta) তৈরি করেছে। gzip এর চেয়ে দ্রুত decompress করে আর ভালো ratio দেয়। log file, database backup এ এখন standard হয়ে উঠছে।

## সব একসাথে — কোনটা কোথায় লাগবে

```python
import sys
import compression.zstd

# Python version চেক
print(f"Python {sys.version}")

# 3.14 এ annotation lazy — কোনো future import লাগবে না
class TreeNode:
    def __init__(self, data: int, children: list[TreeNode] | None = None):
        self.data = data
        self.children = children or []

# Template string (PEP 750)
node_count = 42
msg = t"Tree এ {node_count} টা node আছে"
print(msg)
```

## Summary

Python 3.14 তে বড় বড় update এসেছে — free-threaded mode, JIT, template string, lazy annotation, improved REPL, subinterpreter, আর Zstd compression। এগুলো মিলিয়ে Python এখন আরো দ্রুত আর developer friendly।