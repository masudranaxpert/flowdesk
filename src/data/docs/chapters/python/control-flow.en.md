# Control Flow

Control flow means — controlling how your program runs. When something should happen, how many times it should repeat, when it should stop — things like that. In Python, we use `if`, `for`, and `while` for this.

## if / elif / else

`if` is used to check conditions. If the condition is true, the code inside runs:

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

Here `elif` means "else if" — for checking multiple conditions. `else` is the final option when everything else fails.

> [!tip]
> In Python, don't use `&&` or `||` for conditions — use the words `and` and `or` instead. And use `not` instead of `!`.

Here are the comparison operators:

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` | Equal to | `a == b` |
| `!=` | Not equal | `a != b` |
| `>` | Greater than | `a > b` |
| `<` | Less than | `a < b` |
| `>=` | Greater or equal | `a >= b` |
| `<=` | Less or equal | `a <= b` |

## for Loop

A `for` loop is used to iterate over something:

```python
# Loop over a list
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

`range()` generates a sequence of numbers:

```python
# 0 to 4 (5 is not included)
for i in range(5):
    print(i)
# 0 1 2 3 4

# 2 to 9, step 2
for i in range(2, 10, 2):
    print(i)
# 2 4 6 8
```

> [!note]
> `range(n)` goes from `0` to `n-1`. The number `n` itself is not included. Many people get confused by this.

## while Loop

A `while` loop keeps running as long as the condition is true:

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
> If the condition in a `while` loop never becomes false, you'll get an infinite loop. Always include code inside that changes the condition.

## break and continue

- `break` — completely exit the loop
- `continue` — skip the current iteration and move to the next one

```python
# break: stop when we hit 5
for i in range(10):
    if i == 5:
        break
    print(i)
# 0 1 2 3 4

# continue: skip even numbers
for i in range(6):
    if i % 2 == 0:
        continue
    print(i)
# 1 3 5
```

## Functions — Reusable Code

A function is a block of code that you can call repeatedly. You define a function using `def`:

```python
def greet(name):
    print(f"Hello, {name}!")

greet("Rahim")   # Hello, Rahim!
greet("Sadia")   # Hello, Sadia!
```

## Parameters and return

Functions can take parameters, and `return` sends a value back:

```python
def add(a, b):
    return a + b

result = add(5, 3)
print(result)  # 8
```

## Default Parameters

You can give parameters default values. If you don't provide a value when calling the function, the default is used:

```python
def greet(name, greeting="Hello"):
    print(f"{greeting}, {name}!")

greet("Karim")              # Hello, Karim!
greet("Karim", "Good morning")  # Good morning, Karim!
```

## *args and **kwargs

Sometimes you don't know how many arguments will come. That's when you need `*args` and `**kwargs`:

```python
# *args: any number of positional arguments
def sum_all(*args):
    return sum(args)

print(sum_all(1, 2, 3))       # 6
print(sum_all(10, 20, 30, 40)) # 100

# **kwargs: keyword arguments
def show_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

show_info(name="Karim", age=25, city="Dhaka")
# name: Karim
# age: 25
# city: Dhaka
```

> [!example]
> `*args` gives you all positional values as a tuple. `**kwargs` gives you keyword values as a dict. The names don't have to be `args`/`kwargs` — the `*` and `**` are what matter.

## Putting It All Together — Calculator Function

```python
def calculator(a, b, operation="add"):
    if operation == "add":
        return a + b
    elif operation == "sub":
        return a - b
    elif operation == "mul":
        return a * b
    elif operation == "div":
        return a / b if b != 0 else "Cannot divide by zero"
    else:
        return "unknown operation"

print(calculator(10, 5))               # 15
print(calculator(10, 5, "mul"))        # 50
print(calculator(10, 0, "div"))        # Cannot divide by zero
```

## Summary

In this chapter, we covered `if/elif/else`, `for`, `while`, `break/continue`, and functions. Without these, no program can exist. In the next chapter, we'll look at data structures (list, dict, tuple, set).