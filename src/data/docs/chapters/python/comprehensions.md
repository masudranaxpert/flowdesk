Comprehension হলো Python এর সবচেয়ে elegant feature গুলোর একটা — এক লাইনে list, dict, set বা generator বানিয়ে ফেলা। একবার অভ্যস্ত হলে আর ছাড়তে পারবে না।

## List Comprehension

মূল syntax: `[expression for item in iterable]`

```python
# পুরোনো উপায়
squares = []
for i in range(10):
    squares.append(i ** 2)

# comprehension দিয়ে — এক লাইনে!
squares = [i ** 2 for i in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

## Condition সহ Comprehension

শেষে `if` যোগ করলে শুধু condition মিললে সেই element টা নেওয়া হয়:

```python
numbers = range(1, 21)

# জোড় সংখ্যা গুলো
evens = [n for n in numbers if n % 2 == 0]
print(evens)  # [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

# condition দিয়ে ভিন্ন value রাখা
labels = ["জোড়" if n % 2 == 0 else "বিজোড়" for n in numbers]
print(labels[:5])  # ['বিজোড়', 'জোড়', 'বিজোড়', 'জোড়', 'বিজোড়']
```

> [!tip]
> `[expression for ... if ...]` — এখানে `if` টা filter করে (কোন element নেওয়া হবে)। কিন্তু `[a if cond else b for ...]` — এখানে `if-else` টা value ঠিক করে। দুইটা ভিন্ন জিনিস, mix করবে না।

## Nested Comprehension

দুইটা loop একসাথে:

```python
# গুণের টেবিল
table = [[i * j for j in range(1, 6)] for i in range(1, 6)]
for row in table:
    print(row)
# [1, 2, 3, 4, 5]
# [2, 4, 6, 8, 10]
# [3, 6, 9, 12, 15]
# [4, 8, 12, 16, 20]
# [5, 10, 15, 20, 25]

# 2D list flatten
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Dict Comprehension

`{key_expr: value_expr for ...}`:

```python
# শব্দের length ম্যাপ
words = ["apple", "banana", "cherry", "date"]
word_len = {word: len(word) for word in words}
print(word_len)  # {'apple': 5, 'banana': 6, 'cherry': 6, 'date': 4}

# number → square mapping
squares_map = {n: n ** 2 for n in range(1, 6)}
print(squares_map)  # {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# condition সহ
even_squares = {n: n ** 2 for n in range(1, 10) if n % 2 == 0}
print(even_squares)  # {2: 4, 4: 16, 6: 36, 8: 64}
```

## Set Comprehension

`{expr for ...}`:

```python
# list থেকে unique length গুলো
words = ["a", "bb", "cc", "ddd", "eee", "ffff"]
unique_lengths = {len(w) for w in words}
print(unique_lengths)  # {1, 2, 3, 4}
```

## Generator Expression

Parenthesis `()` দিলে generator হয়। পুরো list মেমরিতে রাখে না — lazy evaluation:

```python
# list comprehension — সব মেমরিতে রাখে
squares_list = [x ** 2 for x in range(1000000)]

# generator expression — lazy, প্রায় কোনো মেমরি লাগে না
squares_gen = (x ** 2 for x in range(1000000))

print(next(squares_gen))  # 0
print(next(squares_gen))  # 1
print(next(squares_gen))  # 4
```

> [!warn]
> Generator expression একবার iterate করলে শেষ — দ্বিতীয়বার আবার iterate করা যায় না। আর `len()` ও কাজ করে না। আবার লাগলে নতুন generator বানাতে হবে।

## কখন Comprehension বনাম Regular Loop?

Comprehension সবসময় ভালো না। সহজ কাজে দারুণ, কিন্তু complex logic এ অপঠনযোগ্য হয়ে যায়:

```python
# ✅ ভালো — সহজ, readable
prices = [100, 200, 150, 300]
discounted = [int(p * 0.9) for p in prices]

# ❌ খারাপ — একদম readable না
# result = [transform(x) for x in data if condition(x) for y in x.sublist if validate(y)]
# এটার জন্য regular for loop লেখো

# ✅ regular loop যখন logic complex
results = []
for x in data:
    if not condition(x):
        continue
    for y in x.sublist:
        if validate(y):
            results.append(transform(y))
```

> [!example]
> নিয়ম: comprehension যদি এক লাইনে পড়ে বুঝতে পারো — তাহলে comprehension ই বেস্ট। কিন্তু nested condition আর multiple loop এর জন্য regular loop লেখো। Readability সবার আগে।

## Performance Comparison

```python
import sys

# list — সব element মেমরিতে
lst = [x ** 2 for x in range(1000000)]
print(sys.getsizeof(lst))  # ~8448728 bytes

# generator — lazy, প্রায় কিছুই মেমরিতে না
gen = (x ** 2 for x in range(1000000))
print(sys.getsizeof(gen))  # ~200 bytes!
```

> [!tip]
> বড় dataset এর সাথে কাজ করলে বা sum/any/all এর মত function এ pass করলে generator expression ব্যবহার করো। মেমরি অনেক বাঁচবে। কিন্তু একাধিকবার iterate করতে হলে list comprehension নাও।

## Summary

Comprehension দিয়ে concise, readable code লেখা যায়। List, dict, set — সব কিছুই এক লাইনে। বড় ডেটার জন্য generator expression। মনে রাখবে — readability কখনো কমানো যাবে না, complex logic এ regular loop ই সেরা।