# Generators & Iterators

Generators and iterators are two of Python's most powerful concepts. Once you understand them, you can do lazy evaluation — meaning you can process data without loading it all into memory.

## Iterator Protocol — `__iter__` and `__next__`

An iterator is an object that gives you one value at a time. The protocol is:

```python
class CountDown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self  # returns itself

    def __next__(self):
        if self.current <= 0:
            raise StopIteration  # done!
        self.current -= 1
        return self.current + 1


cd = CountDown(5)
for num in cd:
    print(num)
# 5
# 4
# 3
# 2
# 1
```

`__iter__` returns the iterator object, and `__next__` returns one value at a time. When values are exhausted, you raise `StopIteration`. Python manages this protocol internally.

## Hands-On — `next()` and `StopIteration`

```python
numbers = iter([10, 20, 30])  # turned the list into an iterator

print(next(numbers))  # 10
print(next(numbers))  # 20
print(next(numbers))  # 30
# print(next(numbers))  ← StopIteration!
```

> [!note]
> list, tuple, dict, set — they are all **iterable** (they have `__iter__`). But they are not **iterators** themselves. You use `iter()` to turn an iterable into an iterator.

## `yield` — Generator Functions

The easiest way to write a generator is with `yield`. If you use `yield` instead of `return` in a function, it becomes a generator:

```python
def count_up_to(n):
    count = 1
    while count <= n:
        yield count  # gives the value and pauses
        count += 1


gen = count_up_to(5)
print(next(gen))  # 1
print(next(gen))  # 2
print(next(gen))  # 3

# The rest all at once
for num in gen:
    print(num)
# 4
# 5
```

> [!tip]
> With `return`, the function ends — value returned and done. But with `yield`, the function "pauses" — it remembers its state! The next `next()` call resumes from there. That's the magic of generators.

## Lazy Evaluation — Why Is It Awesome?

```python
import sys

# list — keeps all values in memory
big_list = [x ** 2 for x in range(1_000_000)]
print(sys.getsizeof(big_list))  # ~8448728 bytes (8MB+!)

# generator — keeps almost nothing in memory
big_gen = (x ** 2 for x in range(1_000_000))
print(sys.getsizeof(big_gen))  # ~200 bytes!!!
```

A generator only generates one value at a time. Once consumed, it moves to the next. Even with a billion values — it takes almost no memory!

## Generator Function vs Generator Expression

```python
# Generator expression — in one line (parentheses)
squares_gen = (x ** 2 for x in range(10))

# Generator function — for complex logic
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fib = fibonacci()
for _ in range(10):
    print(next(fib), end=" ")
# 0 1 1 2 3 5 8 13 21 34
```

> [!note]
> Generator expressions are concise, but for complex logic, generator functions are best. Writing `if-else` and multiple statements in one line for an expression is hard.

## Infinite Generator

```python
def natural_numbers():
    n = 1
    while True:  # never stops!
        yield n
        n += 1

nums = natural_numbers()
print(next(nums))  # 1
print(next(nums))  # 2
print(next(nums))  # 3
# ... keeps going
```

> [!warn]
> Never convert an infinite generator with `list()` — `list(natural_numbers())` will run forever and fill up memory! Use `next()` or `itertools.islice` to take a specific number.

## `itertools` — The Generator Toolkit

```python
from itertools import count, cycle, chain, islice, product, combinations
```

### `count` — Infinite Counter

```python
for i in zip(count(1), ["a", "b", "c"]):
    print(i)
# (1, 'a')
# (2, 'b')
# (3, 'c')
```

### `cycle` — Repeat Forever

```python
colors = cycle(["red", "green", "blue"])
for _ in range(6):
    print(next(colors))
# red green blue red green blue
```

### `chain` — Join Multiple Iterables

```python
a = [1, 2, 3]
b = [4, 5, 6]
chained = list(chain(a, b))
print(chained)  # [1, 2, 3, 4, 5, 6]
```

### `islice` — A Slice of a Generator

```python
from itertools import count

# First 5 even numbers
evens = list(islice((x for x in count() if x % 2 == 0), 5))
print(evens)  # [0, 2, 4, 6, 8]
```

### `product` and `combinations`

```python
# Cartesian product — all combinations
dice = list(product([1, 2, 3], ["a", "b"]))
print(dice)
# [(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b'), (3, 'a'), (3, 'b')]

# combinations — nCr
pairs = list(combinations([1, 2, 3, 4], 2))
print(pairs)
# [(1, 2), (1, 3), (1, 4), (2, 3), (2, 4), (3, 4)]
```

## Real Example — Huge File Line by Line

```python
from pathlib import Path


def read_large_file(filepath):
    """Reads a huge file one line at a time — not the whole file into memory"""
    with open(filepath, encoding="utf-8") as f:
        for line in f:
            yield line.strip()


def count_words(filepath):
    """Word count for each line"""
    total = 0
    for line in read_large_file(filepath):
        total += len(line.split())
    return total


def filter_lines(filepath, keyword):
    """Lines that contain the keyword"""
    for line in read_large_file(filepath):
        if keyword.lower() in line.lower():
            yield line


# Even a 10GB file — barely anything goes into memory!
# result = count_words("huge_log_file.txt")
```

> [!example]
> This is Python's superpower — even processing a 10GB log file takes only a few KB of memory. Because the generator reads one line at a time, processes it, and discards it. The magic of lazy evaluation!

## Keeping State in a Generator

```python
def running_average():
    """Streaming average — updates after each value"""
    total = 0
    count = 0
    while True:
        value = yield total / count if count > 0 else 0
        total += value
        count += 1


avg = running_average()
next(avg)          # must prime it first
print(avg.send(10))  # 10.0
print(avg.send(20))  # 15.0
print(avg.send(30))  # 20.0
```

> [!tip]
> With `.send()`, you can send values into a generator — not just take values from it. This is an advanced pattern, but very useful for streaming data processing.

## Summary

The iterator protocol is `__iter__` + `__next__` + `StopIteration`. With generator functions (`yield`), you can easily make iterators. Generators are lazy — processing huge data takes almost no memory. `itertools` is a treasure trove of generator tools. Master these and you can do serious data processing.