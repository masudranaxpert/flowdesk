ফাইল পড়া আর লেখা হলো programming এর সবচেয়ে common কাজ গুলোর একটা। Python এ এটা খুব সহজ — বিশেষ করে `pathlib` ব্যবহার করলে। চলো দেখি কিভাবে।

## `open` Function আর Modes

```python
# ফাইল পড়া (read mode - default)
f = open("notes.txt", "r")
content = f.read()
f.close()  # অবশ্যই close করতে হবে!

# ফাইল লেখা (write mode — আগের content মুছে যায়)
f = open("output.txt", "w")
f.write("নতুন লেখা")
f.close()

# Append mode — শেষে যোগ করে
f = open("log.txt", "a")
f.write("\nনতুন log entry")
f.close()
```

Common modes:

| Mode | মানে |
|------|-------|
| `"r"` | Read (default) — ফাইল থাকতে হবে |
| `"w"` | Write — আগের content মুছে দেয় |
| `"a"` | Append — শেষে যোগ করে |
| `"r+"` | Read + Write |
| `"b"` | Binary mode (যেমন `"rb"`, `"wb"`) |

> [!warn]
> উপরের উদাহরণ গুলো দেখানোর জন্য — production এ এভাবে `open()` + `close()` করবে না। নিচের `with` দেখো।

## `with` Statement — সবচেয়ে গুরুত্বপূর্ণ

`with` দিলে ফাইল automatically close হয় — error হলেও:

```python
with open("notes.txt", "r", encoding="utf-8") as f:
    content = f.read()
# এখানে ফাইল already closed!

# এক লাইনে পুরো ফাইল পড়া
with open("data.txt", encoding="utf-8") as f:
    text = f.read()

# line by line পড়া (মেমরি efficient)
with open("big_file.txt", encoding="utf-8") as f:
    for line in f:
        print(line.strip())
```

> [!tip]
> সবসময় `encoding="utf-8"` লিখবে। Windows এ default encoding আলাদা হতে পারে, যা encoding error করে। UTF-8 হলো universal standard।

## লেখার বিভিন্ন উপায়

```python
# একসাথে পুরো text
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("প্রথম লাইন\n")
    f.write("দ্বিতীয় লাইন\n")

# list of strings একসাথে
lines = ["লাইন ১", "লাইন ২", "লাইন ৩"]
with open("output.txt", "w", encoding="utf-8") as f:
    f.writelines(f"{line}\n" for line in lines)
```

## `pathlib` — 2026 এর Standard

`pathlib` হলো ফাইল path এর জন্য modern, object-oriented approach। `os.path` এর জায়গায় সবাই এখন `pathlib` ব্যবহার করে:

```python
from pathlib import Path

# Path object তৈরি
p = Path("data/notes.txt")

# পুরো ফাইল এক লাইনে পড়া
content = p.read_text(encoding="utf-8")
print(content)

# এক লাইনে লেখা
p.write_text("নতুন content!", encoding="utf-8")

# ফাইলের তথ্য
print(p.exists())        # True/False
print(p.is_file())       # ফাইল কিনা
print(p.suffix)          # .txt (extension)
print(p.stem)            # notes (নাম, extension ছাড়া)
print(p.parent)          # data (folder)
print(p.name)            # notes.txt
```

### Path Operations

```python
# Path join — `/` operator দিয়ে!
base = Path("/home/user")
config = base / "projects" / "myapp" / "config.json"
print(config)  # /home/user/projects/myapp/config.json

# সব .txt ফাইল খোঁজা
for txt_file in Path(".").glob("*.txt"):
    print(txt_file)

# recursively সব Python ফাইল
for py_file in Path(".").rglob("*.py"):
    print(py_file)

# ফোল্ডার তৈরি
Path("output/logs").mkdir(parents=True, exist_ok=True)
```

> [!note]
> `os.path.join("a", "b", "c")` এর জায়গায় `Path("a") / "b" / "c"` অনেক বেশি readable। 2026 এ `pathlib` ই standard — `os.path` legacy।

## JSON — Configuration আর Data

```python
import json

data = {
    "name": "Karim",
    "skills": ["Python", "FastAPI", "PostgreSQL"],
    "active": True,
    "score": 95.5
}

# JSON ফাইলে লেখা
with open("profile.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# JSON ফাইল থেকে পড়া
with open("profile.json", encoding="utf-8") as f:
    loaded = json.load(f)

print(loaded["skills"])  # ['Python', 'FastAPI', 'PostgreSQL']

# string থেকে JSON parse
json_str = '{"name": "Sadia", "age": 25}'
person = json.loads(json_str)
print(person["name"])  # Sadia

# object কে JSON string বানানো
print(json.dumps(data, indent=2))
```

> [!tip]
> `ensure_ascii=False` দিলে Bengali text ঠিকভাবে লেখা হয় JSON এ। নাহলে `\u0995` এর মত escaped হয়ে যায়।

## CSV — Tabular Data

```python
import csv

# CSV লেখা
with open("students.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "score", "grade"])
    writer.writeheader()
    writer.writerow({"name": "Karim", "score": 85, "grade": "A"})
    writer.writerow({"name": "Sadia", "score": 92, "grade": "A+"})

# CSV পড়া
with open("students.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['name']}: {row['score']} ({row['grade']})")
# Karim: 85 (A)
# Sadia: 92 (A+)
```

> [!note]
> CSV লেখার সময় `newline=""` দেওয়া জরুরি Windows এ — নাহলে extra blank line আসে। এটা একটা common gotcha।

## Binary Files

```python
# Binary mode — image, PDF ইত্যাদি
with open("photo.jpg", "rb") as f:
    data = f.read()
    print(f"ফাইল সাইজ: {len(data)} bytes")

with open("copy.jpg", "wb") as f:
    f.write(data)
```

## Pickle — সাবধান!

```python
import pickle

# Python object save
data = {"users": [{"name": "Karim"}], "count": 1}
with open("data.pkl", "wb") as f:
    pickle.dump(data, f)

# আবার পড়া
with open("data.pkl", "rb") as f:
    loaded = pickle.load(f)
    print(loaded)
```

> [!danger]
> `pickle` ব্যবহার করবে শুধু নিজের trusted data এর জন্য। অন্য কারো দেওয়া `.pkl` ফাইল **কখনো** load করবে না — pickle arbitrary code execute করতে পারে! এটা একটা serious security risk। অচেনা source থেকে pickle খাবে না। JSON সবসময় safer।

## রিয়েল উদাহরণ — Settings Manager

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

ফাইল I/O তে `with open(...)` ব্যবহার করো — automatic cleanup হয়। `pathlib.Path` হলো modern standard — `os.path` এর জায়গায় এটাই ব্যবহার করো। JSON configuration আর data exchange এর জন্য সেরা। Pickle এ সাবধান — untrusted data এ বিপজ্জনক।