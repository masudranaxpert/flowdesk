Decorator শুনতে একটু ভয়ংকর লাগলেও আসলে ব্যাপারটা খুব সহজ। ব্যাস, একটা function যে আরেকটা function return করে — এটাই। আর সেটা দিয়ে খুব সুন্দর করে existing function এর behavior বদলানো যায়, function টাকে না ছুঁয়েই।

## ধাপে ধাপে — Function যে Function Return করে

Python এ function হলো first-class object — মানে variable এ রাখা, argument হিসেবে পাঠানো, আর return করা যায়:

```python
def create_greeting(greeting_word):
    def greet(name):
        return f"{greeting_word}, {name}!"
    return greet  # function return করছি, call করছি না

hello = create_greeting("হ্যালো")
print(hello("Karim"))  # হ্যালো, Karim!

bonjour = create_greeting("Bonjour")
print(bonjour("Sadia"))  # Bonjour, Sadia!
```

`create_greeting` inner `greet` function টা return করছে। আর `greet` তার বাইরের `greeting_word` variable টা "মনে রাখে" — এটাই closure।

## প্রথম সহজ Decorator

Decorator হলো এমন একটা function যেটা আরেকটা function নেয়, কিছু extra behavior যোগ করে, আর modified function return করে:

```python
def shout(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result.upper() + "!!!"
    return wrapper

@shout
def greet(name):
    return f"hello {name}"

print(greet("karim"))  # HELLO KARIM!!!
```

`@shout` মানে হলো — `greet = shout(greet)`। Decorator টা `greet` কে wrap করে দিল।

## `@timer` — Real Example

```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"⏱️ {func.__name__} চলতে লাগলো {elapsed:.4f} সেকেন্ড")
        return result
    return wrapper

@timer
def slow_sum(n):
    total = 0
    for i in range(n):
        total += i
    return total

print(slow_sum(1_000_000))
# ⏱️ slow_sum চলতে লাগলো 0.0521 সেকেন্ড
# 499999500000
```

> [!tip]
> `*args, **kwargs` দেওয়ার কারণ — wrapper যেন যেকোনো signature এর function handle করতে পারে। এটা decorator লেখার standard pattern।

## `functools.wraps` — কেন দরকার?

Decorator ব্যবহার করলে একটা সমস্যা হয় — wrapped function এর নাম, docstring হারিয়ে যায়:

```python
def timer(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@timer
def my_function():
    """এটা আমার function"""
    pass

print(my_function.__name__)      # wrapper (!!! সমস্যা)
print(my_function.__doc__)       # None
```

সমাধান — `functools.wraps`:

```python
from functools import wraps

def timer(func):
    @wraps(func)  # ← এটা দিলে নাম আর docstring ঠিক থাকে
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"⏱️ {func.__name__}: {elapsed:.4f}s")
        return result
    return wrapper

@timer
def my_function():
    """এটা আমার function"""
    pass

print(my_function.__name__)  # my_function ✅
print(my_function.__doc__)   # এটা আমার function ✅
```

> [!danger]
> প্রতিটা decorator এ `@wraps(func)` অবশ্যই দেবে। নাহলে debugging, logging, documentation — সব ভেঙে যায়। এটা non-negotiable।

## Argument সহ Decorator

Decorator নিজেও argument নিতে পারে — এর জন্য এক level বেশি nesting লাগে:

```python
def repeat(times):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def say_hi(name):
    print(f"হাই {name}!")

say_hi("Karim")
# হাই Karim!
# হাই Karim!
# হাই Karim!
```

`@repeat(3)` আসলে দুই ধাপে কাজ করে — আগে `repeat(3)` call হয়ে `decorator` return করে, তারপর সেটা `say_hi` কে wrap করে।

## Decorator Stack করা

একাধিক decorator একসাথে ব্যবহার করা যায় — নিচ থেকে উপরে order এ apply হয়:

```python
@timer
@repeat(3)
def process(data):
    """data process করে"""
    return data.upper()

# আসলে: process = timer(repeat(3)(process))
```

উপরের decorator আগে execute হয় (wrapper হিসেবে), ভেতরের decorator পরে।

## `@retry` — Production-Ready Decorator

```python
import time
import logging
from functools import wraps

def retry(max_attempts=3, delay=1.0):
    """Failed call কে automatically retry করে"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    logging.warning(
                        f"Attempt {attempt}/{max_attempts} failed: {e}"
                    )
                    if attempt < max_attempts:
                        time.sleep(delay)
            raise last_exception
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def fetch_data(url):
    import random
    if random.random() < 0.7:  # 70% সম্ভাবনা fail
        raise ConnectionError("Network error!")
    return f"Data from {url}"

try:
    result = fetch_data("https://api.example.com")
    print(result)
except ConnectionError:
    print("সব attempt fail করেছে!")
```

## Class-Based Decorator

Decorator function না হয়ে class ও হতে পারে — `__call__` method দিয়ে:

```python
class CountCalls:
    def __init__(self, func):
        self.func = func
        self.count = 0
        wraps(func)(self)  # metadata preserve

    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"📞 {self.func.__name__} called {self.count} বার")
        return self.func(*args, **kwargs)

@CountCalls
def say_hello():
    print("হ্যালো!")

say_hello()  # 📞 say_hello called 1 বার → হ্যালো!
say_hello()  # 📞 say_hello called 2 বার → হ্যালো!
say_hello()  # 📞 say_hello called 3 বার → হ্যালো!
```

> [!example]
> Class-based decorator তে state (যেমন call count) খুব সহজে রাখা যায় — কারণ `self.count` instance variable। Function-based decorator এ এটা করতে গেলে `nonlocal` লাগত।

## Common Built-in Decorator গুলো

```python
class MyClass:
    count = 0

    @staticmethod
    def utility():
        """self লাগে না — independent function"""
        return "I'm a utility"

    @classmethod
    def create(cls):
        """class এর reference দিয়ে factory method"""
        cls.count += 1
        return f"Instance #{cls.count}"

    @property
    def display(self):
        """attribute এর মতো access"""
        return "read-only value"


print(MyClass.utility())       # I'm a utility
print(MyClass.create())        # Instance #1
```

### `@functools.lru_cache` — Automatic Memoization

```python
from functools import lru_cache
import time

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

start = time.perf_counter()
print(fibonacci(100))  # সেকেন্ডের ভগ্নাংশে!
print(f"সময়: {time.perf_counter() - start:.6f}s")
print(fibonacci.cache_info())
# CacheInfo(hits=98, misses=101, maxsize=128, currsize=101)
```

> [!note]
> Python 3.9+ এ `@lru_cache` এর সংক্ষিপ্ত রূপ `@cache` ও আছে (`from functools import cache`) — এটা unlimited cache। Pure function (একই input → একই output) এর জন্য দারুণ performance boost।

## Summary

Decorator হলো function যেটা আরেকটা function wrap করে extra behavior যোগ করে। `@wraps` সবসময় দেবে। Argument সহ decorator এ এক extra nesting লাগে। Class-based decorator state রাখতে পারে। `@lru_cache` আর `@property` হলো সবচেয়ে common built-in decorator। Decorator master করলে অনেক clean, reusable code লেখা যায়।