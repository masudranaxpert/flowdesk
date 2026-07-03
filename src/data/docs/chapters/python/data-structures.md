# Data Structures

Data structure মানে ডেটা organize করে রাখার উপায়। Python এ মূল ৪টা built-in data structure আছে — **list**, **tuple**, **dict**, আর **set**। প্রতিটার নিজস্ব use case আছে। চলো এক এক করে দেখি।

## List — Ordered আর Mutable

List হলো ordered কালেকশন, square bracket `[]` দিয়ে বানানো হয়। সবচেয়ে বেশি ব্যবহার হয় এটাই।

```python
# list তৈরি
fruits = ["apple", "banana", "cherry"]
numbers = [10, 20, 30, 40, 50]
mixed = [1, "hello", 3.14, True]   # mixed type ও রাখা যায়

# element access — 0 থেকে শুরু
print(fruits[0])   # apple
print(fruits[-1])  # cherry (last element)
```

### List Method গুলো

```python
fruits = ["apple", "banana"]

fruits.append("cherry")      # শেষে যোগ
fruits.insert(0, "mango")    # নির্দিষ্ট position এ
fruits.remove("banana")      # value দিয়ে remove
fruits.pop()                 # শেষেরটা remove আর return
print(len(fruits))           # length
```

> [!tip]
> `append()` vs `insert()` — `append` সবসময় শেষে যোগ করে, `insert` নির্দিষ্ট index এ। যদি শুধু শেষে লাগে তবে `append` দ্রুত।

### Slicing

List এর একটা অংশ কেটে নেওয়া যায় `[start:stop:step]` syntax দিয়ে:

```python
numbers = [10, 20, 30, 40, 50, 60]

print(numbers[1:4])    # [20, 30, 40]  (index 1, 2, 3)
print(numbers[:3])     # [10, 20, 30]  (শুরু থেকে index 2)
print(numbers[3:])     # [40, 50, 60]  (index 3 থেকে শেষ)
print(numbers[::-1])   # [60, 50, 40, 30, 20, 10]  (reverse!)
```

### List Comprehension

List comprehension দিয়ে এক লাইনে list বানানো যায়। Python এর সবচেয়ে elegant ফিচার:

```python
# পুরোনো উপায়
squares = []
for i in range(5):
    squares.append(i ** 2)
# [0, 1, 4, 9, 16]

# list comprehension — এক লাইনে!
squares = [i ** 2 for i in range(5)]

# condition ও
evens = [i for i in range(10) if i % 2 == 0]
# [0, 2, 4, 6, 8]
```

## Tuple — Immutable List

Tuple হলো list এর মতোই, কিন্তু **immutable** — মানে একবার বানালে আর change করা যায় না। Parenthesis `()` দিয়ে বানানো হয়:

```python
point = (3, 5)
color = (255, 128, 0)

print(point[0])   # 3

# point[0] = 10  ← এটা error দেবে!
```

> [!note]
> Tuple কেন ব্যবহার করবে? যখন চাও ডেটা change না হোক — যেমন coordinates, RGB color, fixed configuration। Tuple list থেকে দ্রুত আর কম memory নেয়।

## Dictionary (dict) — Key-Value Pair

Dictionary হলো key-value pair এর কালেকশন। Curly brace `{}` দিয়ে বানানো হয়। JSON এর মতো:

```python
student = {
    "name": "Karim",
    "age": 22,
    "cgpa": 3.75,
    "subjects": ["CSE", "Math", "English"]
}

print(student["name"])           # Karim
print(student["subjects"][0])    # CSE

# value update
student["age"] = 23
student["dept"] = "CSE"          # নতুন key যোগ
```

### Dictionary Method

```python
print(student.keys())      # সব key
print(student.values())    # সব value
print(student.items())     # (key, value) pair

# .get — key না থাকলে None দেয়, error না
print(student.get("phone"))         # None
print(student.get("phone", "N/A"))  # N/A
```

> [!danger]
> `student["phone"]` — key না থাকলে `KeyError` দেবে আর program crash করবে। কিন্তু `student.get("phone")` দিলে safely `None` পাবে। তাই uncertain key এ `.get()` ব্যবহার করো।

## Set — Unique Elements

Set হলো unique element এর unordered কালেকশন। Duplicate রাখে না:

```python
numbers = {1, 2, 3, 3, 2, 1}
print(numbers)  # {1, 2, 3} — duplicate গেল!

# list থেকে duplicate remove
names = ["Karim", "Rahim", "Karim", "Sadia"]
unique_names = list(set(names))
print(unique_names)  # ['Rahim', 'Sadia', 'Karim']
```

Set operation ও করা যায়:

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # union: {1, 2, 3, 4, 5, 6}
print(a & b)   # intersection: {3, 4}
print(a - b)   # difference: {1, 2}
```

## কোনটা কখন ব্যবহার করবে?

| Structure | কখন ব্যবহার করবে | Mutable? |
|-----------|-------------------|----------|
| **list** | Ordered sequence, পরে বদলাতে হবে | ✅ হ্যাঁ |
| **tuple** | Fixed data, change করতে দেওয়া যাবে না | ❌ না |
| **dict** | Key দিয়ে fast lookup | ✅ হ্যাঁ |
| **set** | Unique element, duplicate দূর করতে | ✅ হ্যাঁ |

> [!example]
> - Student list লাগলে → **list**
> - Fixed RGB color → **tuple**
> - User এর profile (name→value) → **dict**
> - Unique tags বা category → **set**

## সব একসাথে — ছোট উদাহরণ

একটা school এর ডেটা organize করি:

```python
# student records (dict)
students = [
    {"name": "Karim", "marks": 85},
    {"name": "Rahim", "marks": 92},
    {"name": "Sadia", "marks": 78},
]

# সবার নাম list এ
names = [s["name"] for s in students]
print(names)  # ['Karim', 'Rahim', 'Sadia']

# average marks
avg = sum(s["marks"] for s in students) / len(students)
print(f"Average: {avg:.1f}")  # Average: 85.0
```

## Summary

List, tuple, dict, set — এই চারটাই Python data এর মেরুদণ্ড। কোনটা কখন লাগবে সেটা practice করতে করতেই বুঝবে। পরের chapter এ OOP শিখবো।