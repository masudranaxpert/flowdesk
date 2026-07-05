# Data Structures

Data structures are ways to organize and store data. Python has 4 main built-in data structures — **list**, **tuple**, **dict**, and **set**. Each has its own use case. Let's look at them one by one.

## List — Ordered and Mutable

A list is an ordered collection, created with square brackets `[]`. It's the most commonly used data structure.

```python
# Creating lists
fruits = ["apple", "banana", "cherry"]
numbers = [10, 20, 30, 40, 50]
mixed = [1, "hello", 3.14, True]   # Mixed types are allowed too

# Element access — starts from 0
print(fruits[0])   # apple
print(fruits[-1])  # cherry (last element)
```

### List Methods

```python
fruits = ["apple", "banana"]

fruits.append("cherry")      # Add to the end
fruits.insert(0, "mango")    # At a specific position
fruits.remove("banana")      # Remove by value
fruits.pop()                 # Remove and return the last one
print(len(fruits))           # Length
```

> [!tip]
> `append()` vs `insert()` — `append` always adds to the end, `insert` at a specific index. If you only need to add at the end, `append` is faster.

### Slicing

You can cut out a portion of a list using the `[start:stop:step]` syntax:

```python
numbers = [10, 20, 30, 40, 50, 60]

print(numbers[1:4])    # [20, 30, 40]  (index 1, 2, 3)
print(numbers[:3])     # [10, 20, 30]  (from start to index 2)
print(numbers[3:])     # [40, 50, 60]  (from index 3 to end)
print(numbers[::-1])   # [60, 50, 40, 30, 20, 10]  (reversed!)
```

### List Comprehension

List comprehensions let you create lists in one line. One of Python's most elegant features:

```python
# The old way
squares = []
for i in range(5):
    squares.append(i ** 2)
# [0, 1, 4, 9, 16]

# List comprehension — in one line!
squares = [i ** 2 for i in range(5)]

# With condition too
evens = [i for i in range(10) if i % 2 == 0]
# [0, 2, 4, 6, 8]
```

## Tuple — Immutable List

A tuple is just like a list, but **immutable** — meaning once created, it can't be changed. Created with parentheses `()`:

```python
point = (3, 5)
color = (255, 128, 0)

print(point[0])   # 3

# point[0] = 10  ← This will give an error!
```

> [!note]
> Why use tuples? When you want data that shouldn't change — like coordinates, RGB colors, fixed configuration. Tuples are faster than lists and use less memory.

## Dictionary (dict) — Key-Value Pairs

A dictionary is a collection of key-value pairs. Created with curly braces `{}`. It's like JSON:

```python
student = {
    "name": "Karim",
    "age": 22,
    "cgpa": 3.75,
    "subjects": ["CSE", "Math", "English"]
}

print(student["name"])           # Karim
print(student["subjects"][0])    # CSE

# Update values
student["age"] = 23
student["dept"] = "CSE"          # Add a new key
```

### Dictionary Methods

```python
print(student.keys())      # All keys
print(student.values())    # All values
print(student.items())     # (key, value) pairs

# .get — returns None if key doesn't exist, no error
print(student.get("phone"))         # None
print(student.get("phone", "N/A"))  # N/A
```

> [!danger]
> `student["phone"]` — if the key doesn't exist, it'll raise `KeyError` and crash your program. But `student.get("phone")` safely returns `None`. So always use `.get()` for uncertain keys.

## Set — Unique Elements

A set is an unordered collection of unique elements. It doesn't keep duplicates:

```python
numbers = {1, 2, 3, 3, 2, 1}
print(numbers)  # {1, 2, 3} — duplicates gone!

# Remove duplicates from a list
names = ["Karim", "Rahim", "Karim", "Sadia"]
unique_names = list(set(names))
print(unique_names)  # ['Rahim', 'Sadia', 'Karim']
```

You can also perform set operations:

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # Union: {1, 2, 3, 4, 5, 6}
print(a & b)   # Intersection: {3, 4}
print(a - b)   # Difference: {1, 2}
```

## Which One to Use When?

| Structure | When to Use | Mutable? |
|-----------|-------------|----------|
| **list** | Ordered sequence, needs to change later | ✅ Yes |
| **tuple** | Fixed data, shouldn't be changed | ❌ No |
| **dict** | Fast lookup by key | ✅ Yes |
| **set** | Unique elements, remove duplicates | ✅ Yes |

> [!example]
> - Need a list of students → **list**
> - Fixed RGB color → **tuple**
> - User's profile (name→value) → **dict**
> - Unique tags or categories → **set**

## Putting It All Together — A Small Example

Let's organize data for a school:

```python
# Student records (list of dicts)
students = [
    {"name": "Karim", "marks": 85},
    {"name": "Rahim", "marks": 92},
    {"name": "Sadia", "marks": 78},
]

# All names in a list
names = [s["name"] for s in students]
print(names)  # ['Karim', 'Rahim', 'Sadia']

# Average marks
avg = sum(s["marks"] for s in students) / len(students)
print(f"Average: {avg:.1f}")  # Average: 85.0
```

## Summary

List, tuple, dict, and set — these four are the backbone of Python data. You'll understand when to use which through practice. In the next chapter, we'll learn OOP.