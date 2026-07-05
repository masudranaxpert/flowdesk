# File I/O

Reading and writing files is one of the most common tasks in programming. In Python, it's super easy — especially when you use `pathlib`. Let's see how.

## The `open` Function and Modes

```python
# Reading a file (read mode - default)
f = open("notes.txt", "r")
content = f.read()
f.close()  # Must close it!

# Writing to a file (write mode — previous content gets erased)
f = open("output.txt", "w")
f.write("New text")
f.close()

# Append mode — adds to the end
f = open("log.txt", "a")
f.write("\nNew log entry")
f.close()
```

Common modes:

| Mode | Meaning |
|------|---------|
| `"r"` | Read (default) — file must exist |
| `"w"` | Write — erases previous content |
| `"a"` | Append — adds to the end |
| `"r+"` | Read + Write |
| `"b"` | Binary mode (e.g. `"rb"`, `"wb"`) |

> [!warn]
> The examples above are just for demonstration — in production, never use `open()` + `close()` like this. Use the `with` statement below.

## The `with` Statement — Most Important

With `with`, the file closes automatically — even if an error occurs:

```python
with open("notes.txt", "r", encoding="utf-8") as f:
    content = f.read()
# The file is already closed here!

# Reading an entire file in one line
with open("data.txt", encoding="utf-8") as f:
    text = f.read()

# Reading line by line (memory efficient)
with open("big_file.txt", encoding="utf-8") as f:
    for line in f:
        print(line.strip())
```

> [!tip]
> Always specify `encoding="utf-8"`. On Windows, the default encoding can be different, which causes encoding errors. UTF-8 is the universal standard.

## Different Ways to Write

```python
# Writing entire text at once
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("First line\n")
    f.write("Second line\n")

# Writing a list of strings at once
lines = ["Line 1", "Line 2", "Line 3"]
with open("output.txt", "w", encoding="utf-8") as f:
    f.writelines(f"{line}\n" for line in lines)
```

## `pathlib` — The 2026 Standard

`pathlib` is the modern, object-oriented approach for file paths. Everyone uses `pathlib` instead of `os.path` now:

```python
from pathlib import Path

# Creating a Path object
p = Path("data/notes.txt")

# Reading an entire file in one line
content = p.read_text(encoding="utf-8")
print(content)

# Writing in one line
p.write_text("New content!", encoding="utf-8")

# File information
print(p.exists())        # True/False
print(p.is_file())       # Whether it's a file
print(p.suffix)          # .txt (extension)
print(p.stem)            # notes (name without extension)
print(p.parent)          # data (folder)
print(p.name)            # notes.txt
```

### Path Operations

```python
# Path join — using the `/` operator!
base = Path("/home/user")
config = base / "projects" / "myapp" / "config.json"
print(config)  # /home/user/projects/myapp/config.json

# Finding all .txt files
for txt_file in Path(".").glob("*.txt"):
    print(txt_file)

# Recursively finding all Python files
for py_file in Path(".").rglob("*.py"):
    print(py_file)

# Creating folders
Path("output/logs").mkdir(parents=True, exist_ok=True)
```

> [!note]
> `Path("a") / "b" / "c"` is much more readable than `os.path.join("a", "b", "c")`. In 2026, `pathlib` is the standard — `os.path` is legacy.

## JSON — Configuration and Data

```python
import json

data = {
    "name": "Karim",
    "skills": ["Python", "FastAPI", "PostgreSQL"],
    "active": True,
    "score": 95.5
}

# Writing to a JSON file
with open("profile.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Reading from a JSON file
with open("profile.json", encoding="utf-8") as f:
    loaded = json.load(f)

print(loaded["skills"])  # ['Python', 'FastAPI', 'PostgreSQL']

# Parsing JSON from a string
json_str = '{"name": "Sadia", "age": 25}'
person = json.loads(json_str)
print(person["name"])  # Sadia

# Converting an object to a JSON string
print(json.dumps(data, indent=2))
```

> [!tip]
> With `ensure_ascii=False`, Bengali (or any non-ASCII) text gets written properly in JSON. Otherwise it gets escaped like `\u0995`.

## CSV — Tabular Data

```python
import csv

# Writing CSV
with open("students.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "score", "grade"])
    writer.writeheader()
    writer.writerow({"name": "Karim", "score": 85, "grade": "A"})
    writer.writerow({"name": "Sadia", "score": 92, "grade": "A+"})

# Reading CSV
with open("students.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['name']}: {row['score']} ({row['grade']})")
# Karim: 85 (A)
# Sadia: 92 (A+)
```

> [!note]
> When writing CSV on Windows, you must pass `newline=""` — otherwise you get extra blank lines. This is a common gotcha.

## Binary Files

```python
# Binary mode — images, PDFs, etc.
with open("photo.jpg", "rb") as f:
    data = f.read()
    print(f"File size: {len(data)} bytes")

with open("copy.jpg", "wb") as f:
    f.write(data)
```

## Pickle — Be Careful!

```python
import pickle

# Saving a Python object
data = {"users": [{"name": "Karim"}], "count": 1}
with open("data.pkl", "wb") as f:
    pickle.dump(data, f)

# Reading it back
with open("data.pkl", "rb") as f:
    loaded = pickle.load(f)
    print(loaded)
```

> [!warn]
> Only use `pickle` for your own trusted data. **Never** load someone else's `.pkl` file — pickle can execute arbitrary code! This is a serious security risk. Don't eat pickle from unknown sources. JSON is always safer.

## Real Example — Settings Manager

```python
import json
from pathlib import Path


class Settings:
    def __init__(self, filepath: str = "settings.json"):
        self.path = Path(filepath)
        self.data: dict = self._load()

    def _load(self) -> dict:
        if self.path.exists():
            return json.loads(self.path.read_text(encoding="utf-8"))
        return {}

    def save(self) -> None:
        self.path.write_text(
            json.dumps(self.data, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )

    def get(self, key: str, default=None):
        return self.data.get(key, default)

    def set(self, key: str, value) -> None:
        self.data[key] = value
        self.save()


settings = Settings()
settings.set("theme", "dark")
settings.set("language", "bn")
print(settings.get("theme"))  # dark
```

## Summary

Use `with open(...)` for file I/O — it cleans up automatically. `pathlib.Path` is the modern standard — use it instead of `os.path`. JSON is best for configuration and data exchange. Be careful with pickle — it's dangerous with untrusted data.