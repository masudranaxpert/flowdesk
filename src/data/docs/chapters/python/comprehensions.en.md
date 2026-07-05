# Comprehensions

Comprehension is one of Python's most elegant features — creating a list, dict, set, or generator in a single line. Once you get used to it, you won't want to go back.

## List Comprehension

The basic syntax: `[expression for item in iterable]`

```python
# The old way
squares = []
for i in range(10):
    squares.append(i ** 2)

# With comprehension — in one line!
squares = [i ** 2 for i in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

## Comprehension with Conditions

Adding `if` at the end means only elements matching the condition are taken:

```python
numbers = range(1, 21)

# Even numbers only
evens = [n for n in numbers if n % 2 == 0]
print(evens)  # [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

# Different values based on condition
labels = ["even" if n % 2 == 0 else "odd" for n in numbers]
print(labels[:5])  # ['odd', 'even', 'odd', 'even', 'odd']
```

> [!tip]
> `[expression for ... if ...]` — here `if` filters (which elements to take). But `[a if cond else b for ...]` — here `if-else` decides the value. These are two different things, don't mix them up.

## Nested Comprehension

Two loops together:

```python
# Multiplication table
table = [[i * j for j in range(1, 6)] for i in range(1, 6)]
for row in table:
    print(row)
# [1, 2, 3, 4, 5]
# [2, 4, 6, 8, 10]
# [3, 6, 9, 12, 15]
# [4, 8, 12, 16, 20]
# [5, 10, 15, 20, 25]

# Flattening a 2D list
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Dict Comprehension

`{key_expr: value_expr for ...}`:

```python
# Word length mapping
words = ["apple", "banana", "cherry", "date"]
word_len = {word: len(word) for word in words}
print(word_len)  # {'apple': 5, 'banana': 6, 'cherry': 6, 'date': 4}

# number → square mapping
squares_map = {n: n ** 2 for n in range(1, 6)}
print(squares_map)  # {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# With condition
even_squares = {n: n ** 2 for n in range(1, 10) if n % 2 == 0}
print(even_squares)  # {2: 4, 4: 16, 6: 36, 8: 64}
```

## Set Comprehension

`{expr for ...}`:

```python
# Unique lengths from a list
words = ["a", "bb", "cc", "ddd", "eee", "ffff"]
unique_lengths = {len(w) for w in words}
print(unique_lengths)  # {1, 2, 3, 4}
```

## Generator Expression

Using parentheses `()` creates a generator. It doesn't store the whole list in memory — lazy evaluation:

```python
# List comprehension — stores everything in memory
squares_list = [x ** 2 for x in range(1000000)]

# Generator expression — lazy, uses almost no memory
squares_gen = (x ** 2 for x in range(1000000))

print(next(squares_gen))  # 0
print(next(squares_gen))  # 1
print(next(squares_gen))  # 4
```

> [!warn]
> A generator expression is done once you iterate through it — you can't iterate it a second time. And `len()` doesn't work either. If you need it again, create a new generator.

## When to Use Comprehension vs Regular Loops?

Comprehension isn't always better. It's great for simple tasks, but with complex logic it becomes unreadable:

```python
# ✅ Good — simple, readable
prices = [100, 200, 150, 300]
discounted = [int(p * 0.9) for p in prices]

# ❌ Bad — completely unreadable
# result = [transform(x) for x in data if condition(x) for y in x.sublist if validate(y)]
# Write a regular for loop for this instead

# ✅ Regular loop when logic is complex
results = []
for x in data:
    if not condition(x):
        continue
    for y in x.sublist:
        if validate(y):
            results.append(transform(y))
```

> [!example]
> Rule of thumb: if you can read a comprehension in one line and understand it — comprehension is the best choice. But for nested conditions and multiple loops, write a regular loop. Readability comes first.

## Performance Comparison

```python
import sys

# List — all elements in memory
lst = [x ** 2 for x in range(1000000)]
print(sys.getsizeof(lst))  # ~8448728 bytes

# Generator — lazy, almost nothing in memory
gen = (x ** 2 for x in range(1000000))
print(sys.getsizeof(gen))  # ~200 bytes!
```

> [!tip]
> When working with large datasets or passing to functions like sum/any/all, use generator expressions. You'll save a lot of memory. But if you need to iterate multiple times, use a list comprehension.

## Summary

Comprehensions let you write concise, readable code. List, dict, set — everything in one line. For large data, use generator expressions. Remember — readability should never be sacrificed; for complex logic, regular loops are the best.