Generator আর iterator হলো Python এর সবচেয়ে powerful concept গুলোর দুইটা। এগুলো বুঝলে তুমি lazy evaluation করতে পারবে — মানে পুরো ডেটা মেমরিতে না রেখেই process করতে পারবে।

## Iterator Protocol — `__iter__` আর `__next__`

Iterator হলো এমন একটা object যেটা একটা একটা করে value দেয়। Protocol টা হলো:

```python
class CountDown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self  # নিজেকেই return করে

    def __next__(self):
        if self.current <= 0:
            raise StopIteration  # শেষ!
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

`__iter__` থেকে iterator object return হয়, আর `__next__` থেকে এক একটা value। যখন value শেষ, `StopIteration` raise করতে হয়। Python internally এই protocol manage করে।

## হাতে ধরে দেখা — `next()` আর `StopIteration`

```python
numbers = iter([10, 20, 30])  # list কে iterator বানালাম

print(next(numbers))  # 10
print(next(numbers))  # 20
print(next(numbers))  # 30
# print(next(numbers))  ← StopIteration!
```

> [!note]
> list, tuple, dict, set — সব হলো **iterable** (তাদের `__iter__` আছে)। কিন্তু তারা নিজে **iterator** না। `iter()` দিয়ে iterable কে iterator বানাতে হয়।

## `yield` — Generator Function

Generator লেখার সবচেয়ে সহজ উপায় হলো `yield`। Function এ `return` এর জায়গায় `yield` দিলে সেটা generator হয়ে যায়:

```python
def count_up_to(n):
    count = 1
    while count <= n:
        yield count  # value দিয়ে pause হয়ে যায়
        count += 1


gen = count_up_to(5)
print(next(gen))  # 1
print(next(gen))  # 2
print(next(gen))  # 3

# বাকি গুলো একসাথে
for num in gen:
    print(num)
# 4
# 5
```

> [!tip]
> `return` দিলে function শেষ, value return আর done। কিন্তু `yield` দিলে function টা "pause" হয়ে যায় — state মনে রাখে! পরের `next()` call এ সেখান থেকেই আবার শুরু হয়। এটাই generator এর magic।

## Lazy Evaluation — কেন এটা দারুণ?

```python
import sys

# list — সব value মেমরিতে রাখে
big_list = [x ** 2 for x in range(1_000_000)]
print(sys.getsizeof(big_list))  # ~8448728 bytes (8MB+!)

# generator — প্রায় কিছুই মেমরিতে রাখে না
big_gen = (x ** 2 for x in range(1_000_000))
print(sys.getsizeof(big_gen))  # ~200 bytes!!!
```

Generator শুধু একটা value এক সময়ে generate করে, consume হয়ে গেলে next এ যায়। ১০০ কোটি value ও থাকুক — মেমরিতে প্রায় কিছুই লাগে না!

## Generator Function vs Generator Expression

```python
# Generator expression — এক লাইনে (parenthesis)
squares_gen = (x ** 2 for x in range(10))

# Generator function — complex logic এর জন্য
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
> Generator expression concise, কিন্তু complex logic এর জন্য generator function ই বেস্ট। Expression এ `if-else`, multiple statement সব এক লাইনে কঠিন।

## Infinite Generator

```python
def natural_numbers():
    n = 1
    while True:  # কখনো stop হবে না!
        yield n
        n += 1

nums = natural_numbers()
print(next(nums))  # 1
print(next(nums))  # 2
print(next(nums))  # 3
# ... চলতেই থাকবে
```

> [!warn]
> Infinite generator কে `list()` দিয়ে convert করবে না — `list(natural_numbers())` চলবে forever আর memory full করে ফেলবে! `next()` বা `itertools.islice` দিয়ে নির্দিষ্ট সংখ্যক নাও।

## `itertools` — Generator এর ভাণ্ডার

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
colors = cycle(["লাল", "সবুজ", "নীল"])
for _ in range(6):
    print(next(colors))
# লাল সবুজ নীল লাল সবুজ
```

### `chain` — Multiple Iterable জোড়া লাগাও

```python
a = [1, 2, 3]
b = [4, 5, 6]
chained = list(chain(a, b))
print(chained)  # [1, 2, 3, 4, 5, 6]
```

### `islice` — Generator এর একটা অংশ

```python
from itertools import count

# প্রথম ৫টা even number
evens = list(islice((x for x in count() if x % 2 == 0), 5))
print(evens)  # [0, 2, 4, 6, 8]
```

### `product` আর `combinations`

```python
# Cartesian product — সব combination
dice = list(product([1, 2, 3], ["a", "b"]))
print(dice)
# [(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b'), (3, 'a'), (3, 'b')]

# combinations — nCr
pairs = list(combinations([1, 2, 3, 4], 2))
print(pairs)
# [(1, 2), (1, 3), (1, 4), (2, 3), (2, 4), (3, 4)]
```

## রিয়েল উদাহরণ — বিশাল ফাইল Line by Line

```python
from pathlib import Path


def read_large_file(filepath):
    """বিশাল ফাইল এক লাইন করে পড়ে — পুরো ফাইল মেমরিতে না"""
    with open(filepath, encoding="utf-8") as f:
        for line in f:
            yield line.strip()


def count_words(filepath):
    """প্রতিটি লাইনের word count"""
    total = 0
    for line in read_large_file(filepath):
        total += len(line.split())
    return total


def filter_lines(filepath, keyword):
    """keyword যে লাইনগুলোতে আছে সেগুলো"""
    for line in read_large_file(filepath):
        if keyword.lower() in line.lower():
            yield line


# 10GB ফাইল ও হোক — মেমরিতে প্রায় কিছু যাবে না!
# result = count_words("huge_log_file.txt")
```

> [!example]
> এটাই Python এর superpower — 10GB লগ ফাইল process করতে চাইলেও মাত্র কয়েক KB মেমরি লাগবে। কারণ generator এক সময়ে এক লাইন পড়ে, process করে, আর সেটা discard করে। Lazy evaluation এর magic!

## Generator এ State রাখা

```python
def running_average():
    """Streaming average — প্রতিটা value এর পর আপডেট হওয়া average"""
    total = 0
    count = 0
    while True:
        value = yield total / count if count > 0 else 0
        total += value
        count += 1


avg = running_average()
next(avg)          # prime করতে হবে প্রথমে
print(avg.send(10))  # 10.0
print(avg.send(20))  # 15.0
print(avg.send(30))  # 20.0
```

> [!tip]
> `.send()` দিয়ে generator এ value পাঠানো যায় — শুধু value নেওয়া না। এটা advanced pattern, কিন্তু streaming data processing এ খুব useful।

## Summary

Iterator protocol হলো `__iter__` + `__next__` + `StopIteration`। Generator function (`yield`) দিয়ে সহজে iterator বানানো যায়। Generator lazy — বিশাল ডেটা process করতে প্রায় কোনো মেমরি লাগে না। `itertools` হলো generator টুলের ভাণ্ডার। এগুলো master করলে তুমি serious data processing করতে পারবে।