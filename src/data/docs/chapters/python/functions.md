Function হলো Python এর আত্মা — একটা reusable code block যেটা তুমি বারবার call করতে পারো। চলো এর সব দিক গভীরে দেখি।

## `def` দিয়ে Function লেখা

```python
def greet(name):
    return f"হ্যালো, {name}!"

print(greet("Karim"))  # হ্যালো, Karim!
```

`def` keyword, তারপর function এর নাম, parenthesis এ parameters, colon, আর নিচে indented body। সোজা!

## Parameters — Positional আর Keyword

```python
def introduce(name, age, city):
    return f"আমি {name}, বয়স {age}, থাকি {city}-এ।"

# Positional arguments — ক্রম ঠিক রাখতে হবে
print(introduce("Sadia", 25, "Dhaka"))

# Keyword arguments — ক্রম গুরুত্বপূর্ণ না
print(introduce(city="Chittagong", name="Rahim", age=30))
```

> [!tip]
> Keyword argument দিলে পড়তে সহজ হয়। বিশেষ করে অনেক parameter থাকলে `introduce(name="X", age=25, city="Y")` লেখা অনেক clean।

## Default Value দেওয়া

```python
def power(base, exponent=2):
    return base ** exponent

print(power(5))       # 25  (exponent default 2)
print(power(5, 3))    # 125
```

Default value থাকলে সেই parameter না দিলেও চলে। তবে মনে রাখবে — default parameter গুলো সবসময় regular parameter এর পরে হতে হবে।

## `*args` আর `**kwargs`

`*args` দিয়ে যত খুশি positional argument নেওয়া যায়, `**kwargs` দিয়ে keyword argument:

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

`*args` আসলে একটা tuple, আর `**kwargs` একটা dict।

## Keyword-Only আর Positional-Only Parameters

Python 3.8+ এ `/` আর `*` দিয়ে parameter কে control করা যায়:

```python
# `/` এর আগের গুলো positional-only
# `*` এর পরের গুলো keyword-only
def connect(host, port, /, *, timeout=30, retry=True):
    print(f"{host}:{port}, timeout={timeout}, retry={retry}")

connect("localhost", 5432, timeout=60)
# connect("localhost", 5432, 60)  ← এটা error! timeout অবশ্যই keyword দিতে হবে
```

> [!note]
> `/` এর আগের parameter গুলো শুধু position দিয়ে দিতে পারবে — keyword দিয়ে না। আর `*` এর পরের গুলো অবশ্যই keyword দিয়ে দিতে হবে। এটা API design এ খুব useful।

## Lambda — এক লাইনের Anonymous Function

```python
square = lambda x: x ** 2
print(square(7))  # 49

# sort করার সময় key হিসেবে
students = [("Karim", 85), ("Sadia", 92), ("Rahim", 78)]
students.sort(key=lambda s: s[1], reverse=True)
print(students)  # [("Sadia", 92), ("Karim", 85), ("Rahim", 78)]
```

Lambda সবসময় একটাই expression return করে। ছোট ছোট কাজে দারুণ, কিন্তু complex logic এর জন্য regular function ই ভালো।

## Multiple Values Return (Tuple)

```python
def min_max(numbers):
    return min(numbers), max(numbers)

low, high = min_max([3, 7, 1, 9, 4])
print(low, high)  # 1 9
```

আসলে এখানে একটা tuple return হচ্ছে, আর tuple unpacking হচ্ছে — কিন্তু মনে হয় একাধিক value return হলো।

## LEGB Scope Rule

Python এ variable খোঁজে এই ক্রমে: **L**ocal → **E**nclosing → **G**lobal → **B**uilt-in।

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

## `global` আর `nonlocal`

```python
counter = 0

def increment():
    global counter  # global variable modify করতে
    counter += 1

increment()
increment()
print(counter)  # 2
```

`nonlocal` ব্যবহার হয় nested function এ enclosing scope এর variable modify করতে:

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
> এই `make_counter()` টা একটা **closure** — `inner` function টা তার বাইরের `count` variable টা "মনে রাখে"। এটাই closure এর মূল আইডিয়া।

## First-Class Functions

Python এ function এর সাথে যা খুশি করা যায় — variable এ রাখা, argument হিসেবে পাঠানো, return করা:

```python
def shout(text):
    return text.upper()

def whisper(text):
    return text.lower()

func = shout   # variable এ রাখলাম
print(func("hello"))  # HELLO

def apply(func, text):   # argument হিসেবে
    return func(text)

print(apply(shout, "hi"))    # HI
print(apply(whisper, "HI"))  # hi
```

## `map` আর `filter`

```python
numbers = [1, 2, 3, 4, 5]

squared = list(map(lambda x: x ** 2, numbers))
print(squared)  # [1, 4, 9, 16, 25]

evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)  # [2, 4]
```

> [!tip]
> তবে 2026 এ সবাই comprehension ব্যবহার করে — `[x**2 for x in numbers]` বা `[x for x in numbers if x % 2 == 0]`। এগুলো `map`/`filter` এর চেয়ে readable। `map`/`filter` জানা থাকা দরকার, কিন্তু comprehension কেই priority দাও।

## Summary

Function হলো Python এর building block। Parameter, default, `*args`/`**kwargs` master করলে অনেক flexible API বানানো যায়। Closure আর first-class function বুঝলে decorator আর functional programming এ দারুণ advantage।