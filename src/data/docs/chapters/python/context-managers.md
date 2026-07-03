`with` statement দিয়ে আমরা এমন একটা context তৈরি করি যেখানে setup আর teardown guaranteed — error হলেও resource properly close হবেই। এটাই context manager এর মূল কথা।

## `with` কী গ্যারান্টি দেয়?

```python
# without with — সমস্যা!
f = open("data.txt", "w")
f.write("কিছু লেখা")
# এখানে error হলে f.close() কখনো call হবে না!
f.close()

# with দিলে — close guaranteed
with open("data.txt", "w") as f:
    f.write("কিছু লেখা")
# এখানে ফাইল already closed, error হলেও!
```

> [!tip]
> `with` এর সবচেয়ে বড় সুবিধা — error হোক বা না হোক, cleanup (close, disconnect, release) ঠিকই হবে। এটাই resource management এর Pythonic উপায়।

## পেছনের Mechanism — `__enter__` আর `__exit__`

```python
class FileManager:
    def __init__(self, filepath, mode):
        self.filepath = filepath
        self.mode = mode
        self.file = None

    def __enter__(self):
        print(f"📂 {self.filepath} খুলছি...")
        self.file = open(self.filepath, self.mode, encoding="utf-8")
        return self.file  # as এর পরের variable এ যায়

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"📁 {self.filepath} বন্ধ করছি...")
        if self.file:
            self.file.close()
        return False  # exception propagate করবে কিনা


with FileManager("test.txt", "w") as f:
    f.write("হ্যালো!")
# 📂 test.txt খুলছি...
# 📁 test.txt বন্ধ করছি...
```

`__exit__` এর তিনটা parameter:
- `exc_type` — exception এর type (কোনো error না হলে `None`)
- `exc_val` — exception এর value
- `exc_tb` — traceback

> [!note]
> `__exit__` থেকে `True` return করলে exception suppress হয়ে যায় — বাইরে propagate হবে না। `False` দিলে normal propagate। সাধারণত `False` ই return করবে, error কে suppress করা ভালো না।

## Custom Context Manager Class

একটা database connection এর মত context manager:

```python
class DatabaseConnection:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.connected = False

    def __enter__(self):
        print(f"🔌 {self.db_url} এ connect হচ্ছে...")
        # এখানে actual connection code থাকবে
        self.connected = True
        return self

    def query(self, sql: str):
        if not self.connected:
            raise RuntimeError("connection নেই!")
        print(f"🔍 Query: {sql}")
        return [{"id": 1, "name": "Karim"}]

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"🔌 {self.db_url} disconnect হচ্ছে...")
        self.connected = False
        if exc_type is not None:
            print(f"⚠️ Error হয়েছে: {exc_val}")
        return False


# ব্যবহার
with DatabaseConnection("postgresql://localhost/mydb") as db:
    users = db.query("SELECT * FROM users")
    print(users)
# 🔌 postgresql://localhost/mydb এ connect হচ্ছে...
# 🔍 Query: SELECT * FROM users
# [{'id': 1, 'name': 'Karim'}]
# 🔌 postgresql://localhost/mydb disconnect হচ্ছে...
```

> [!example]
> লক্ষ্য করো — query তে error হলেও disconnect ঠিকই হবে। এটাই context manager এর power। Database, network connection, lock — সব resource management এ এটা জরুরি।

## `contextlib.contextmanager` — সহজ উপায়

Class না লিখে একটা function আর decorator দিয়েও context manager বানানো যায়। এটা অনেক বেশি ব্যবহৃত:

```python
from contextlib import contextmanager
import time


@contextmanager
def timer(label: str):
    """Execution time measure করার context manager"""
    start = time.perf_counter()
    try:
        yield  # এখানে with block এর code চলে
    finally:
        elapsed = time.perf_counter() - start
        print(f"⏱️ {label}: {elapsed:.4f}s")


with timer("data processing"):
    total = sum(x ** 2 for x in range(1_000_000))
    print(f"Result: {total}")
# Result: 333332833333500000
# ⏱️ data processing: 0.0521s
```

> [!tip]
> `yield` এর আগের code = setup (যা `__enter__` এর মত), `yield` এর পরের code = teardown (যা `__exit__` এর মত)। এটাই `contextlib.contextmanager` এর pattern।

## Error Handling সহ Context Manager

```python
from contextlib import contextmanager


@contextmanager
def safe_operation(resource_name: str):
    print(f"✅ {resource_name} acquire করলাম")
    try:
        yield resource_name
    except Exception as e:
        print(f"❌ Error হলো, cleanup করছি: {e}")
        raise  # re-raise করছি
    else:
        print(f"✅ {resource_name} সফলভাবে release করলাম")
    finally:
        print(f"🧹 {resource_name} cleanup complete")


try:
    with safe_operation("file_handle") as r:
        print(f"{r} দিয়ে কাজ করছি...")
        raise ValueError("কিছু একটা ভুল হলো!")
except ValueError:
    print("বাইরে exception ধরলাম")
# ✅ file_handle acquire করলাম
# file_handle দিয়ে কাজ করছি...
# ❌ Error হলো, cleanup করছি: কিছু একটা ভুল হলো!
# 🧹 file_handle cleanup complete
# বাইরে exception ধরলাম
```

## `contextlib.suppress` — নির্দিষ্ট Exception Ignore

```python
from contextlib import suppress

# try/except/pass এর Pythonic version
with suppress(FileNotFoundError):
    open("nonexistent.txt").read()
print("এগিয়ে গেছি!")  # কোনো error ছাড়াই

# এটা নিচের এর সমতুল্য:
# try:
#     open("nonexistent.txt").read()
# except FileNotFoundError:
#     pass
```

> [!note]
> `suppress` শুধু নির্দিষ্ট করা exception গুলোই ignore করে। অন্য exception হলে propagate হবে। এটা `try/except/pass` এর চেয়ে অনেক clean।

## Nested `with` Statement

```python
# একাধিক resource একসাথে
with open("input.txt", encoding="utf-8") as fin, \
     open("output.txt", "w", encoding="utf-8") as fout:
    for line in fin:
        fout.write(line.upper())

# Python 3.10+ এ parentheses দিয়ে আরও পরিষ্কার:
with (
    open("input.txt", encoding="utf-8") as fin,
    open("output.txt", "w", encoding="utf-8") as fout,
):
    content = fin.read()
    fout.write(content.upper())
```

## রিয়েল উদাহরণ — Temporary Directory

```python
from contextlib import contextmanager
from pathlib import Path
import tempfile
import shutil


@contextmanager
def temp_workspace(prefix: str = "work_"):
    """Temporary directory বানায়, শেষে মুছে ফেলে"""
    tmpdir = Path(tempfile.mkdtemp(prefix=prefix))
    print(f"📂 Workspace তৈরি: {tmpdir}")
    try:
        yield tmpdir
    finally:
        shutil.rmtree(tmpdir)
        print(f"🧹 Workspace মুছে ফেলা হলো: {tmpdir}")


with temp_workspace() as workdir:
    output_file = workdir / "result.txt"
    output_file.write_text("processing complete!", encoding="utf-8")
    print(f"ফাইল লেখা হলো: {output_file}")
    print(f"ফাইল আছে? {output_file.exists()}")  # True

# এখানে temp directory already মুছে গেছে!
```

## Async Context Manager

Python এ async context manager ও আছে — `async with`:

```python
import asyncio


class AsyncTimer:
    async def __aenter__(self):
        print("⏰ Timer শুরু")
        self.start = asyncio.get_event_loop().time()
        return self

    async def __aexit__(self, *exc):
        elapsed = asyncio.get_event_loop().time() - self.start
        print(f"⏰ Timer শেষ: {elapsed:.2f}s")
        return False


async def main():
    async with AsyncTimer():
        await asyncio.sleep(1)
        print("কাজ হলো!")

asyncio.run(main())
# ⏰ Timer শুরু
# কাজ হলো!
# ⏰ Timer শেষ: 1.00s
```

## Summary

Context manager হলো resource management এর Pythonic উপায় — setup + teardown guaranteed। Class দিয়ে `__enter__`/`__exit__` লিখতে পারো, বা `contextlib.contextmanager` দিয়ে সহজে function হিসেবে। `suppress` দিয়ে exception ignore। Nested `with` দিয়ে multiple resource। Async context manager ও আছে async code এর জন্য।