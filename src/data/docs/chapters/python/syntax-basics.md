# Syntax আর বেসিক কনসেপ্ট

আগের chapter এ Python install করলাম। এবার চলো আসল syntax শিখি — variable, data type, print, input সব। Python এর syntax অনেক সোজা, পড়লেই ইংরেজি মনে হয়।

## Variable — ডেটা রাখার বাক্স

Variable হলো একটা বাক্স যেখানে তুমি ডেটা রাখো। Python এ variable declare করা একদম সহজ — type লিখতে হয় না:

```python
age = 25
name = "Karim"
height = 5.9
is_student = True

print(age)        # 25
print(name)       # Karim
```

দেখলেই বুঝলে — `=` দিয়ে value assign করা হয়। Python automatically বুঝে নেয় কোনটা সংখ্যা, কোনটা text।

> [!tip]
> Variable এর নাম বোঝাপড়া রাখবে। `x = 25` এর চেয়ে `age = 25` অনেক ভালো — পরে পড়লে বুঝবে কী বোঝানো হয়েছে।

## Data Type

Python এ মূল data type গুলো হলো:

| Type | কী জিনিস | উদাহরণ |
|------|----------|--------|
| `int` | পূর্ণসংখ্যা | `42`, `-7`, `0` |
| `float` | দশমিক সংখ্যা | `3.14`, `-0.5` |
| `str` | text / string | `"hello"`, `'Python'` |
| `bool` | True / False | `True`, `False` |

কোনো variable এর type চেক করতে চাইলে `type()` ব্যবহার করো:

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

## print() আর output

`print()` দিয়ে যেকোনো কিছু screen এ দেখানো যায়:

```python
print("Hello World")
print(42)
print(3 + 5)            # 8
print("Sum is:", 10 + 5)  # Sum is: 15
```

## input() — User এর কাছ থেকে ডেটা নেওয়া

`input()` দিয়ে user এর কাছ থেকে কিছু নেওয়া যায়। কিন্তু মনে রাখবে — `input()` সবসময় **string** return করে:

```python
name = input("নাম দাও: ")
age = input("বয়স দাও: ")

print(name, "তোমার বয়স", age)
```

সংখ্যা দরকার হলে `int()` বা `float()` দিয়ে convert করতে হবে:

```python
age = int(input("বয়স দাও: "))
print("পরের বছর তোমার বয়স হবে:", age + 1)
```

> [!danger]
> `input()` থেকে সংখ্যা নিয়ে সরাসরি math করলে error আসবে — কারণ সেটা string। অবশ্যই `int()` বা `float()` দিয়ে convert করবে।

## f-string — ভেরিয়েবল সহজে বসানো

f-string হলো Python এর সবচেয়ে ভালো জিনিস একটা। string এর ভেতর `{}` দিয়ে variable বসিয়ে দেওয়া যায়:

```python
name = "Sadia"
age = 22

print(f"আমার নাম {name}, বয়স {age}")
# আমার নাম Sadia, বয়স 22

# math ও করা যায় ভেতরে
print(f"৫ বছর পর বয়স হবে: {age + 5}")
```

## Comment — কোডে নোট রাখা

Comment দিয়ে কোডে নোট রাখা যায়। `#` দিলে ওই লাইনটা Python run করে না:

```python
# এটা একটা single line comment
score = 95  # এভাবে inline ও যায়

"""
এটা multi-line comment
কয়েক লাইন জুড়ে লেখা যায়
"""
```

## Indentation — Python এর মূল নিয়ম

Python এ `{}` curly brace লাগে না। এর বদলে **indentation** (space/tab) দিয়ে block বোঝানো হয়। এটা Python এর সবচেয়ে unique জিনিস:

```python
if True:
    print("এটা inside the block")    # 4 space indent
    print("এটাও inside")
print("এটা outside")                  # কোনো indent নেই
```

> [!warn]
> Indentation যদি ভুল হয় — tab আর space mix করে ফেলো — তাহলে `IndentationError` আসবে। সব জায়গায় হয় ৪টা space ইউজ করো।

এই block এর নিয়মটাই পরে `if`, `for`, `while`, `function` — সব জায়গায় কাজে লাগবে।

## একসাথে সব — ছোট উদাহরণ

চলো যা শিখলাম সেটা দিয়ে একটা ছোট program বানাই — BMI calculator:

```python
# BMI Calculator
weight = float(input("ওজন কত (kg)? "))
height = float(input("উচ্চতা কত (meter)? "))

bmi = weight / (height ** 2)

print(f"তোমার BMI: {bmi:.2f}")

if bmi < 18.5:
    print("তুমি underweight")
elif bmi < 25:
    print("তোমার ওজন normal")
else:
    print("তোমার overweight")
```

> [!example]
> `{bmi:.2f}` মানে BMI এর মান দশমিকের পরে মাত্র ২ ঘর দেখাবে। যেমন `23.45`।

## Type Conversion

এক type থেকে আরেক type এ যাওয়া যায়:

```python
x = "10"
y = int(x)      # string → int: 10
z = float(x)    # string → float: 10.0
w = str(42)     # int → string: "42"
```

## Summary

এই chapter এ দেখলাম variable, data type, print, input, f-string, comment আর indentation। এগুলো হলো Python এর ভিত্তি। পরের chapter এ control flow (if, loop, function) শিখবো।