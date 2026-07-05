# Syntax and Basic Concepts

In the previous chapter, we installed Python. Now let's learn the actual syntax — variables, data types, print, input, and everything else. Python's syntax is very straightforward; it almost reads like English.

## Variable — A Box for Storing Data

A variable is a box where you store data. Declaring a variable in Python is super easy — you don't need to write the type:

```python
age = 25
name = "Karim"
height = 5.9
is_student = True

print(age)        # 25
print(name)       # Karim
```

As you can see, `=` is used to assign a value. Python automatically figures out what's a number and what's text.

> [!tip]
> Keep variable names meaningful. `x = 25` is not as good as `age = 25` — when you read it later, you'll understand what it means.

## Data Types

Here are the main data types in Python:

| Type | What It Is | Examples |
|------|-----------|----------|
| `int` | Integer numbers | `42`, `-7`, `0` |
| `float` | Decimal numbers | `3.14`, `-0.5` |
| `str` | Text / string | `"hello"`, `'Python'` |
| `bool` | True / False | `True`, `False` |

To check the type of a variable, use `type()`:

```python
x = 10
y = 3.14
z = "hello"
w = True

print(type(x))   # <class 'int'>
print(type(y))   # <class 'float'>
print(type(z))   # <class 'str'>
print(type(w))   # <class 'bool'>
```

## print() and Output

`print()` can be used to display anything on the screen:

```python
print("Hello World")
print(42)
print(3 + 5)            # 8
print("Sum is:", 10 + 5)  # Sum is: 15
```

## input() — Getting Data from the User

`input()` lets you take input from the user. But remember — `input()` always returns a **string**:

```python
name = input("Enter your name: ")
age = input("Enter your age: ")

print(name, "your age is", age)
```

If you need a number, you must convert it using `int()` or `float()`:

```python
age = int(input("Enter your age: "))
print("Next year you will be:", age + 1)
```

> [!danger]
> If you take a number from `input()` and try math directly, you'll get an error — because it's a string. Always convert with `int()` or `float()`.

## f-string — Inserting Variables Easily

The f-string is one of Python's best features. You can insert variables inside a string using `{}`:

```python
name = "Sadia"
age = 22

print(f"My name is {name}, age {age}")
# My name is Sadia, age 22

# You can even do math inside
print(f"In 5 years, age will be: {age + 5}")
```

## Comments — Leaving Notes in Code

Comments let you leave notes in your code. When you add `#`, Python ignores that line:

```python
# This is a single line comment
score = 95  # Inline comments work too

"""
This is a multi-line comment
You can write across multiple lines
"""
```

## Indentation — Python's Core Rule

Python doesn't use `{}` curly braces. Instead, **indentation** (spaces/tabs) is used to define blocks. This is Python's most unique feature:

```python
if True:
    print("This is inside the block")    # 4 space indent
    print("This is also inside")
print("This is outside")                  # No indent
```

> [!warn]
> If your indentation is wrong — like mixing tabs and spaces — you'll get an `IndentationError`. Always use 4 spaces everywhere.

This block rule will come in handy later with `if`, `for`, `while`, and `functions` — everywhere.

## Putting It All Together — A Small Example

Let's build a small program with what we've learned — a BMI calculator:

```python
# BMI Calculator
weight = float(input("What's your weight (kg)? "))
height = float(input("What's your height (meter)? "))

bmi = weight / (height ** 2)

print(f"Your BMI: {bmi:.2f}")

if bmi < 18.5:
    print("You are underweight")
elif bmi < 25:
    print("Your weight is normal")
else:
    print("You are overweight")
```

> [!example]
> `{bmi:.2f}` means the BMI value will show only 2 digits after the decimal. For example, `23.45`.

## Type Conversion

You can convert from one type to another:

```python
x = "10"
y = int(x)      # string → int: 10
z = float(x)    # string → float: 10.0
w = str(42)     # int → string: "42"
```

## Summary

In this chapter, we covered variables, data types, print, input, f-strings, comments, and indentation. These are the foundations of Python. In the next chapter, we'll learn control flow (if, loops, functions).