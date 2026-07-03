# Control Flow

Control flow মানে হলো — program কীভাবে চলবে সেটা control করা। কখন কোন কাজ হবে, কতবার repeat হবে, কখন থামবে — এসব। Python এ `if`, `for`, `while` দিয়ে এই কাজ করা হয়।

## if / elif / else

`if` দিয়ে condition check করা হয়। শর্ত সত্যি হলে ভেতরের কোড চলে:

```python
score = 85

if score >= 90:
    print("Grade: A+")
elif score >= 80:
    print("Grade: A")
elif score >= 70:
    print("Grade: B")
else:
    print("Grade: C")
```

এখানে `elif` মানে "else if" — একাধিক condition চেক করার জন্য। `else` হলো সব ব্যর্থ হলে শেষ option।

> [!tip]
> Python এ condition লেখার জন্য `&&`, `||` না — বরং `and`, `or` শব্দ ব্যবহার করো। আর `!` এর জায়গায় `not`।

Comparison operator গুলো:

| Operator | মানে | উদাহরণ |
|----------|------|--------|
| `==` | সমান কিনা | `a == b` |
| `!=` | সমান না | `a != b` |
| `>` | বড় | `a > b` |
| `<` | ছোট | `a < b` |
| `>=` | বড় বা সমান | `a >= b` |
| `<=` | ছোট বা সমান | `a <= b` |

## for Loop

`for` loop দিয়ে কোনো কিছুর উপর iterate করা হয়:

```python
# list এর উপর loop
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
```

```
apple
banana
cherry
```

## range() Function

`range()` দিয়ে সংখ্যার sequence তৈরি করা যায়:

```python
# 0 থেকে 4 (5 আসবে না)
for i in range(5):
    print(i)
# 0 1 2 3 4

# 2 থেকে 9, step 2
for i in range(2, 10, 2):
    print(i)
# 2 4 6 8
```

> [!note]
> `range(n)` দিলে `0` থেকে `n-1` পর্যন্ত যায়। `n` আসবে না। এটা অনেকেই confuse হয়।

## while Loop

`while` loop ততক্ষণ চলে যতক্ষণ condition সত্যি থাকে:

```python
count = 0
while count < 5:
    print(f"Count: {count}")
    count += 1
```

```
Count: 0
Count: 1
Count: 2
Count: 3
Count: 4
```

> [!danger]
> `while` loop এ condition যদি কখনো false না হয় — তাহলে infinite loop হয়ে যাবে। সবসময় ভেতরে condition বদলানোর কোড রাখবে।

## break আর continue

- `break` — loop থেকে সম্পূর্ণ বেরিয়ে যাওয়া
- `continue` — বর্তমান iteration skip করে পরেরটায় যাওয়া

```python
# break: 5 পেলে থেমে যাও
for i in range(10):
    if i == 5:
        break
    print(i)
# 0 1 2 3 4

# continue: জোড় সংখ্যা skip
for i in range(6):
    if i % 2 == 0:
        continue
    print(i)
# 1 3 5
```

## Function — কোড পুনরায় ব্যবহার

Function হলো কোডের একটা block যেটা বারবার call করা যায়। `def` দিয়ে function define করা হয়:

```python
def greet(name):
    print(f"হ্যালো, {name}!")

greet("Rahim")   # হ্যালো, Rahim!
greet("Sadia")   # হ্যালো, Sadia!
```

## Parameter আর return

Function এ parameter দেওয়া যায়, আর `return` দিয়ে মান ফেরত দেওয়া যায়:

```python
def add(a, b):
    return a + b

result = add(5, 3)
print(result)  # 8
```

## Default Parameter

Parameter এ default value দেওয়া যায়। function call করার সময় value না দিলে default ব্যবহার হবে:

```python
def greet(name, greeting="হ্যালো"):
    print(f"{greeting}, {name}!")

greet("Karim")              # হ্যালো, Karim!
greet("Karim", "Good morning")  # Good morning, Karim!
```

## *args আর **kwargs

কখনো হয়তো জানবে না কতগুলো argument আসবে। তখন `*args` আর `**kwargs` লাগবে:

```python
# *args: যত খুশি positional argument
def sum_all(*args):
    return sum(args)

print(sum_all(1, 2, 3))       # 6
print(sum_all(10, 20, 30, 40)) # 100

# **kwargs: keyword argument
def show_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

show_info(name="Karim", age=25, city="Dhaka")
# name: Karim
# age: 25
# city: Dhaka
```

> [!example]
> `*args` দিয়ে tuple আকারে সব positional value পাওয়া যায়। `**kwargs` দিয়ে dict আকারে keyword value। নাম `args`/`kwargs` হতেই হবে এমন না — `*` আর `**` টাই মূল জিনিস।

## সব একসাথে — Calculator Function

```python
def calculator(a, b, operation="add"):
    if operation == "add":
        return a + b
    elif operation == "sub":
        return a - b
    elif operation == "mul":
        return a * b
    elif operation == "div":
        return a / b if b != 0 else "ভাগ করা যায় না"
    else:
        return "unknown operation"

print(calculator(10, 5))               # 15
print(calculator(10, 5, "mul"))        # 50
print(calculator(10, 0, "div"))        # ভাগ করা যায় না
```

## Summary

এই chapter এ দেখলাম `if/elif/else`, `for`, `while`, `break/continue`, আর function। এগুলো ছাড়া কোনো program ই হয় না। পরের chapter এ data structure (list, dict, tuple, set) দেখবো।