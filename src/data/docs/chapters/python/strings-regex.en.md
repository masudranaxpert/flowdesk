# Strings and Regex

Working with strings in Python is incredibly easy. And if you master regex, you become invincible at text processing. Let's explore both in depth.

## Strings Are Immutable

In Python, strings can't be changed — every operation creates a new string:

```python
s = "hello"
# s[0] = "H"  ← This will give an error! TypeError

# To change it, you need to create a new string
s = "H" + s[1:]
print(s)  # Hello
```

## Common String Methods

```python
text = "  Hello, World!  "

# strip — removes whitespace from both sides
print(text.strip())   # "Hello, World!"
print(text.lstrip())  # "Hello, World!  "
print(text.rstrip())  # "  Hello, World!"

# split and join
csv = "apple,banana,cherry,date"
items = csv.split(",")
print(items)  # ['apple', 'banana', 'cherry', 'date']

words = ["Python", "is", "awesome"]
sentence = " ".join(words)
print(sentence)  # Python is awesome

# replace and find
greeting = "Hello World"
print(greeting.replace("World", "Python"))  # Hello Python
print(greeting.find("World"))  # 6 (index), returns -1 if not found

# upper, lower, title
print("hello".upper())  # HELLO
print("HELLO".lower())  # hello
print("hello world".title())  # Hello World
```

> [!tip]
> `split()` and `split(" ")` are different things. Without arguments, `split()` splits on any whitespace and skips empty strings. `split(" ")` only splits on single spaces.

## f-strings — Modern String Formatting

Python 3.6+ introduced f-strings, and now they're the standard:

```python
name = "Karim"
age = 25
score = 85.567

# Easy insertion
print(f"Name: {name}, Age: {age}")

# You can write expressions too
print(f"Next year age: {age + 1}")

# Method calls
print(f"Name uppercase: {name.upper()}")

# Format spec — fixed decimal places
print(f"Score: {score:.2f}")  # Score: 85.57

# Padding and alignment
print(f"{name:>10}")   #      Karim (right-align)
print(f"{name:<10}!")  # Karim     !
print(f"{name:^10}")   #   Karim  (center)

# Comma for thousands
print(f"Salary: {1500000:,}")  # Salary: 1,500,000

# Date formatting
from datetime import datetime
now = datetime.now()
print(f"Today: {now:%d/%m/%Y}")  # Today: 03/07/2026
```

> [!note]
> Python 3.14 (Oct 2025) added **t-strings** or **template strings** (PEP 750). They look just like f-strings but are lazy — they don't evaluate the string immediately, instead returning a template object. This is incredibly useful for SQL injection prevention and safe HTML rendering. For now, f-strings remain the standard for everyday use, but t-strings are slowly gaining popularity.

## t-strings (PEP 750) — Python 3.14

```python
# Python 3.14+ — t-strings work as templates
name = "Karim"
# t = t"Hello {name}"  ← Not a direct string, but a template object

# Frameworks render this safely (protecting against XSS)
# In production code, t-strings will gradually replace f-strings
```

## Regex — The `re` Module

```python
import re

text = "My phone number is 01712345678, and email is karim@example.com"
```

### `re.search` — Search Through the Entire Text

```python
# Phone number pattern
phone = re.search(r"\d{11}", text)
if phone:
    print(phone.group())  # 01712345678
```

### `re.findall` — Extract All Matches

```python
numbers = re.findall(r"\d+", "My age is 25, their age is 30")
print(numbers)  # ['25', '30']
```

### `re.sub` — Replace

```python
# Replace all digits with *
masked = re.sub(r"\d", "*", "My pin is 1234")
print(masked)  # My pin is ****
```

### Groups — Extracting Parts of a Match

```python
email_pattern = r"(\w+)@(\w+)\.(\w+)"
match = re.search(email_pattern, "karim@example.com")
if match:
    print(match.group(0))  # karim@example.com (entire match)
    print(match.group(1))  # karim (first group)
    print(match.group(2))  # example (second group)
    print(match.group(3))  # com (third group)
```

### Named Groups

```python
pattern = r"(?P<username>\w+)@(?P<domain>\w+\.\w+)"
m = re.search(pattern, "sadia@gmail.com")
if m:
    print(m.group("username"))  # sadia
    print(m.group("domain"))    # gmail.com
```

## Common Regex Patterns

```python
# Email validation (basic)
emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.]+",
    "Contact: info@site.com, sales@shop.bd")
print(emails)  # ['info@site.com', 'sales@shop.bd']

# Bangladeshi phone numbers
phones = re.findall(r"01\d{9}", "Call: 01712345678 or 01987654321")
print(phones)  # ['01712345678', '01987654321']

# Letters only
words_only = re.findall(r"[a-zA-Z]+", "hello123world456")
print(words_only)  # ['hello', 'world']
```

> [!example]
> Some common regex shorthand:
> | Pattern | Meaning |
> |---------|---------|
> | `\d` | digit (0-9) |
> | `\w` | word char (letter, digit, underscore) |
> | `\s` | whitespace |
> | `.` | any single char |
> | `+` | one or more |
> | `*` | zero or more |
> | `?` | optional (0 or 1) |
> | `{n}` | exactly n times |
> | `^` / `$` | start / end of string |

> [!warn]
> Don't rely entirely on regex for validation. For example, the "perfect" regex for email validation is nearly impossible. Write a good-enough pattern and verify again on the server. Use regex only to catch obvious garbage.

## Summary

Strings are immutable, but methods let you do a lot with them. f-strings are the 2026 formatting standard (with t-strings coming in 3.14). Regex handles pattern matching and text extraction. With practice, these will become second nature.