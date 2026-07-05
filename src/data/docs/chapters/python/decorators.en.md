# Decorators

Decorators might sound scary, but they're actually very simple. Basically, a function that returns another function — that's it. And with it, you can beautifully change the behavior of an existing function without even touching it.

## Step by Step — A Function That Returns a Function

In Python, functions are first-class objects — meaning they can be stored in variables, passed as arguments, and returned:

```python
def create_greeting(greeting_word):
    def greet(name):
        return f"{greeting_word}, {name}!"
    return greet  # returning the function, not calling it

hello = create_greeting("Hello")
print(hello("Karim"))  # Hello, Karim!

bonjour = create_greeting("Bonjour")
print(bonjour("Sadia"))  # Bonjour, Sadia!
```

`create_greeting` returns the inner `greet` function. And `greet` "remembers" the outer `greeting_word` variable — this is a closure.

## Your First Simple Decorator

A decorator is a function that takes another function, adds some extra behavior, and returns the modified function:

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

`@shout` means — `greet = shout(greet)`. The decorator wrapped `greet`.

## `@timer` — A Real Example

```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"⏱️ {func.__name__} took {elapsed:.4f} seconds")
        return result
    return wrapper

@timer
def slow_sum(n):
    total = 0
    for i in range(n):
        total += i
    return total

print(slow_sum(1_000_000))
# ⏱️ slow_sum took 0.0521 seconds
# 499999500000
```

> [!tip]
> The reason for `*args, **kwargs` — so the wrapper can handle functions with any signature. This is the standard pattern for writing decorators.

## `functools.wraps` — Why Do You Need It?

Using decorators causes one problem — the wrapped function's name and docstring get lost:

```python
def timer(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@timer
def my_function():
    """This is my function"""
    pass

print(my_function.__name__)      # wrapper (!!! problem)
print(my_function.__doc__)       # None
```

The solution — `functools.wraps`:

```python
from functools import wraps

def timer(func):
    @wraps(func)  # ← This keeps the name and docstring intact
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"⏱️ {func.__name__}: {elapsed:.4f}s")
        return result
    return wrapper

@timer
def my_function():
    """This is my function"""
    pass

print(my_function.__name__)  # my_function ✅
print(my_function.__doc__)   # This is my function ✅
```

> [!warn]
> You must always use `@wraps(func)` in every decorator. Otherwise debugging, logging, documentation — everything breaks. This is non-negotiable.

## Decorators with Arguments

A decorator itself can take arguments — this requires one extra level of nesting:

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
    print(f"Hi {name}!")

say_hi("Karim")
# Hi Karim!
# Hi Karim!
# Hi Karim!
```

`@repeat(3)` actually works in two steps — first `repeat(3)` is called and returns `decorator`, then that wraps `say_hi`.

## Stacking Decorators

Multiple decorators can be used together — they apply from bottom to top:

```python
@timer
@repeat(3)
def process(data):
    """Processes data"""
    return data.upper()

# Actually: process = timer(repeat(3)(process))
```

The top decorator executes first (as the wrapper), the inner decorator later.

## `@retry` — A Production-Ready Decorator

```python
import time
import logging
from functools import wraps

def retry(max_attempts=3, delay=1.0):
    """Automatically retries a failed call"""
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
    if random.random() < 0.7:  # 70% chance of failure
        raise ConnectionError("Network error!")
    return f"Data from {url}"

try:
    result = fetch_data("https://api.example.com")
    print(result)
except ConnectionError:
    print("All attempts failed!")
```

## Class-Based Decorator

A decorator doesn't have to be a function — it can also be a class, using the `__call__` method:

```python
class CountCalls:
    def __init__(self, func):
        self.func = func
        self.count = 0
        wraps(func)(self)  # preserve metadata

    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"📞 {self.func.__name__} called {self.count} times")
        return self.func(*args, **kwargs)

@CountCalls
def say_hello():
    print("Hello!")

say_hello()  # 📞 say_hello called 1 times → Hello!
say_hello()  # 📞 say_hello called 2 times → Hello!
say_hello()  # 📞 say_hello called 3 times → Hello!
```

> [!example]
> In a class-based decorator, keeping state (like call count) is very easy — because `self.count` is an instance variable. In a function-based decorator, you'd need `nonlocal` for this.

## Common Built-in Decorators

```python
class MyClass:
    count = 0

    @staticmethod
    def utility():
        """Doesn't need self — independent function"""
        return "I'm a utility"

    @classmethod
    def create(cls):
        """Factory method using class reference"""
        cls.count += 1
        return f"Instance #{cls.count}"

    @property
    def display(self):
        """Access like an attribute"""
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
print(fibonacci(100))  # In a fraction of a second!
print(f"Time: {time.perf_counter() - start:.6f}s")
print(fibonacci.cache_info())
# CacheInfo(hits=98, misses=101, maxsize=128, currsize=101)
```

> [!note]
> In Python 3.9+, there's also a shorthand `@cache` (`from functools import cache`) — it's an unlimited cache. For pure functions (same input → same output), it gives a huge performance boost.

## Summary

A decorator is a function that wraps another function to add extra behavior. Always use `@wraps`. Decorators with arguments need one extra nesting level. Class-based decorators can hold state. `@lru_cache` and `@property` are the most common built-in decorators. Master decorators and you'll write much cleaner, more reusable code.