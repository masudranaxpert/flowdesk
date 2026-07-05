# Functions

Functions are the soul of Python — a reusable block of code that you can call again and again. Let's explore every aspect in depth.

## Writing a Function with `def`

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("Karim"))  # Hello, Karim!
```

The `def` keyword, then the function name, parameters in parentheses, a colon, and an indented body below. Simple!

## Parameters — Positional and Keyword

```python
def introduce(name, age, city):
    return f"I'm {name}, age {age}, I live in {city}."

# Positional arguments — order must be maintained
print(introduce("Sadia", 25, "Dhaka"))

# Keyword arguments — order doesn't matter
print(introduce(city="Chittagong", name="Rahim", age=30))
```

> [!tip]
> Keyword arguments make code easier to read. Especially with many parameters, writing `introduce(name="X", age=25, city="Y")` is much cleaner.

## Giving Default Values

```python
def power(base, exponent=2):
    return base ** exponent

print(power(5))       # 25  (exponent defaults to 2)
print(power(5, 3))    # 125
```

When a default value is set, that parameter becomes optional. But remember — default parameters must always come after regular parameters.

## `*args` and `**kwargs`

`*args` lets you accept any number of positional arguments, and `**kwargs` handles keyword arguments:

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4, 5))  # 15

def make_profile(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

make_profile(name="Karim", role="dev", team="backend")
# name: Karim
# role: dev
# team: backend
```

`*args` is actually a tuple, and `**kwargs` is a dict.

## Keyword-Only and Positional-Only Parameters

In Python 3.8+, you can control parameters using `/` and `*`:

```python
# Parameters before `/` are positional-only
# Parameters after `*` are keyword-only
def connect(host, port, /, *, timeout=30, retry=True):
    print(f"{host}:{port}, timeout={timeout}, retry={retry}")

connect("localhost", 5432, timeout=60)
# connect("localhost", 5432, 60)  ← This is an error! timeout must be passed as keyword
```

> [!note]
> Parameters before `/` can only be passed by position — not by keyword. And parameters after `*` must be passed as keywords. This is very useful in API design.

## Lambda — One-Line Anonymous Functions

```python
square = lambda x: x ** 2
print(square(7))  # 49

# As a sort key
students = [("Karim", 85), ("Sadia", 92), ("Rahim", 78)]
students.sort(key=lambda s: s[1], reverse=True)
print(students)  # [("Sadia", 92), ("Karim", 85), ("Rahim", 78)]
```

Lambdas always return a single expression. They're great for small tasks, but for complex logic, regular functions are better.

## Returning Multiple Values (Tuple)

```python
def min_max(numbers):
    return min(numbers), max(numbers)

low, high = min_max([3, 7, 1, 9, 4])
print(low, high)  # 1 9
```

What's actually happening is a tuple is being returned and then unpacked — but it feels like multiple values are returned.

## LEGB Scope Rule

Python looks for variables in this order: **L**ocal → **E**nclosing → **G**lobal → **B**uilt-in.

```python
x = "global"

def outer():
    x = "enclosing"

    def inner():
        x = "local"
        print(x)  # local

    inner()
    print(x)  # enclosing

outer()
print(x)  # global
```

## `global` and `nonlocal`

```python
counter = 0

def increment():
    global counter  # to modify a global variable
    counter += 1

increment()
increment()
print(counter)  # 2
```

`nonlocal` is used in nested functions to modify a variable from the enclosing scope:

```python
def make_counter():
    count = 0
    def inner():
        nonlocal count
        count += 1
        return count
    return inner

c = make_counter()
print(c())  # 1
print(c())  # 2
print(c())  # 3
```

> [!example]
> This `make_counter()` is a **closure** — the `inner` function "remembers" the outer `count` variable. That's the core idea of closures.

## First-Class Functions

In Python, you can do whatever you want with functions — store them in variables, pass them as arguments, return them:

```python
def shout(text):
    return text.upper()

def whisper(text):
    return text.lower()

func = shout   # stored in a variable
print(func("hello"))  # HELLO

def apply(func, text):   # passed as an argument
    return func(text)

print(apply(shout, "hi"))    # HI
print(apply(whisper, "HI"))  # hi
```

## `map` and `filter`

```python
numbers = [1, 2, 3, 4, 5]

squared = list(map(lambda x: x ** 2, numbers))
print(squared)  # [1, 4, 9, 16, 25]

evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)  # [2, 4]
```

> [!tip]
> But in 2026, everyone uses comprehensions — `[x**2 for x in numbers]` or `[x for x in numbers if x % 2 == 0]`. These are more readable than `map`/`filter`. Knowing `map`/`filter` is important, but prioritize comprehensions.

## Summary

Functions are Python's building blocks. Master parameters, defaults, and `*args`/`**kwargs`, and you can build very flexible APIs. Understanding closures and first-class functions gives you a huge advantage in decorators and functional programming.