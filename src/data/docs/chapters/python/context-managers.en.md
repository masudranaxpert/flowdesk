# Context Managers

With the `with` statement, we create a context where setup and teardown are guaranteed — even if an error occurs, resources will be properly closed. That's the core idea of context managers.

## What Does `with` Guarantee?

```python
# Without with — problem!
f = open("data.txt", "w")
f.write("Some text")
# If an error happens here, f.close() will never be called!
f.close()

# With with — close is guaranteed
with open("data.txt", "w") as f:
    f.write("Some text")
# The file is already closed here, even if there's an error!
```

> [!tip]
> The biggest benefit of `with` — whether an error happens or not, cleanup (close, disconnect, release) will still happen. This is the Pythonic way of resource management.

## The Mechanism Behind It — `__enter__` and `__exit__`

```python
class FileManager:
    def __init__(self, filepath, mode):
        self.filepath = filepath
        self.mode = mode
        self.file = None

    def __enter__(self):
        print(f"📂 Opening {self.filepath}...")
        self.file = open(self.filepath, self.mode, encoding="utf-8")
        return self.file  # goes to the variable after `as`

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"📁 Closing {self.filepath}...")
        if self.file:
            self.file.close()
        return False  # whether to propagate the exception


with FileManager("test.txt", "w") as f:
    f.write("Hello!")
# 📂 Opening test.txt...
# 📁 Closing test.txt...
```

The three parameters of `__exit__`:
- `exc_type` — the exception type (`None` if no error occurred)
- `exc_val` — the exception value
- `exc_tb` — the traceback

> [!note]
> Returning `True` from `__exit__` suppresses the exception — it won't propagate outside. Returning `False` lets it propagate normally. Generally, return `False` — suppressing errors is not a good practice.

## Custom Context Manager Class

A context manager like a database connection:

```python
class DatabaseConnection:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.connected = False

    def __enter__(self):
        print(f"🔌 Connecting to {self.db_url}...")
        # Actual connection code would go here
        self.connected = True
        return self

    def query(self, sql: str):
        if not self.connected:
            raise RuntimeError("No connection!")
        print(f"🔍 Query: {sql}")
        return [{"id": 1, "name": "Karim"}]

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"🔌 Disconnecting from {self.db_url}...")
        self.connected = False
        if exc_type is not None:
            print(f"⚠️ An error occurred: {exc_val}")
        return False


# Usage
with DatabaseConnection("postgresql://localhost/mydb") as db:
    users = db.query("SELECT * FROM users")
    print(users)
# 🔌 Connecting to postgresql://localhost/mydb...
# 🔍 Query: SELECT * FROM users
# [{'id': 1, 'name': 'Karim'}]
# 🔌 Disconnecting from postgresql://localhost/mydb...
```

> [!example]
> Notice — even if the query throws an error, the disconnect will still happen. That's the power of context managers. Database, network connections, locks — this is essential for all resource management.

## `contextlib.contextmanager` — The Easy Way

Instead of writing a class, you can make a context manager with just a function and a decorator. This is much more commonly used:

```python
from contextlib import contextmanager
import time


@contextmanager
def timer(label: str):
    """A context manager for measuring execution time"""
    start = time.perf_counter()
    try:
        yield  # The code inside the with block runs here
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
> Code before `yield` = setup (like `__enter__`), code after `yield` = teardown (like `__exit__`). This is the pattern for `contextlib.contextmanager`.

## Context Manager with Error Handling

```python
from contextlib import contextmanager


@contextmanager
def safe_operation(resource_name: str):
    print(f"✅ Acquired {resource_name}")
    try:
        yield resource_name
    except Exception as e:
        print(f"❌ Error occurred, cleaning up: {e}")
        raise  # re-raising
    else:
        print(f"✅ Successfully released {resource_name}")
    finally:
        print(f"🧹 {resource_name} cleanup complete")


try:
    with safe_operation("file_handle") as r:
        print(f"Working with {r}...")
        raise ValueError("Something went wrong!")
except ValueError:
    print("Caught the exception outside")
# ✅ Acquired file_handle
# Working with file_handle...
# ❌ Error occurred, cleaning up: Something went wrong!
# 🧹 file_handle cleanup complete
# Caught the exception outside
```

## `contextlib.suppress` — Ignore Specific Exceptions

```python
from contextlib import suppress

# Pythonic version of try/except/pass
with suppress(FileNotFoundError):
    open("nonexistent.txt").read()
print("Moved on!")  # Without any error

# This is equivalent to:
# try:
#     open("nonexistent.txt").read()
# except FileNotFoundError:
#     pass
```

> [!note]
> `suppress` only ignores the specific exceptions you name. Other exceptions will still propagate. It's much cleaner than `try/except/pass`.

## Nested `with` Statements

```python
# Multiple resources at once
with open("input.txt", encoding="utf-8") as fin, \
     open("output.txt", "w", encoding="utf-8") as fout:
    for line in fin:
        fout.write(line.upper())

# In Python 3.10+, with parentheses it's even cleaner:
with (
    open("input.txt", encoding="utf-8") as fin,
    open("output.txt", "w", encoding="utf-8") as fout,
):
    content = fin.read()
    fout.write(content.upper())
```

## Real Example — Temporary Directory

```python
from contextlib import contextmanager
from pathlib import Path
import tempfile
import shutil


@contextmanager
def temp_workspace(prefix: str = "work_"):
    """Creates a temporary directory, deletes it at the end"""
    tmpdir = Path(tempfile.mkdtemp(prefix=prefix))
    print(f"📂 Workspace created: {tmpdir}")
    try:
        yield tmpdir
    finally:
        shutil.rmtree(tmpdir)
        print(f"🧹 Workspace deleted: {tmpdir}")


with temp_workspace() as workdir:
    output_file = workdir / "result.txt"
    output_file.write_text("processing complete!", encoding="utf-8")
    print(f"File written: {output_file}")
    print(f"File exists? {output_file.exists()}")  # True

# The temp directory is already deleted here!
```

## Async Context Manager

Python also has async context managers — `async with`:

```python
import asyncio


class AsyncTimer:
    async def __aenter__(self):
        print("⏰ Timer started")
        self.start = asyncio.get_event_loop().time()
        return self

    async def __aexit__(self, *exc):
        elapsed = asyncio.get_event_loop().time() - self.start
        print(f"⏰ Timer ended: {elapsed:.2f}s")
        return False


async def main():
    async with AsyncTimer():
        await asyncio.sleep(1)
        print("Work done!")

asyncio.run(main())
# ⏰ Timer started
# Work done!
# ⏰ Timer ended: 1.00s
```

## Summary

Context managers are the Pythonic way of resource management — guaranteed setup + teardown. You can write them as classes with `__enter__`/`__exit__`, or easily as functions with `contextlib.contextmanager`. Use `suppress` to ignore exceptions. Use nested `with` for multiple resources. There are also async context managers for async code.