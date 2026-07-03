String নিয়ে কাজ করা Python এ দারুণ সহজ। আর regex পারলে text processing এ তুমি অজেয়। চলো দুটোই গভীরে দেখি।

## String হলো Immutable

Python এ string change করা যায় না — প্রতিবার new string তৈরি হয়:

```python
s = "hello"
# s[0] = "H"  ← এটা error দেবে! TypeError

# বদলাতে হলে new string বানাতে হয়
s = "H" + s[1:]
print(s)  # Hello
```

## Common String Methods

```python
text = "  Hello, World!  "

# strip — দুই পাশের whitespace কাটে
print(text.strip())   # "Hello, World!"
print(text.lstrip())  # "Hello, World!  "
print(text.rstrip())  # "  Hello, World!"

# split আর join
csv = "apple,banana,cherry,date"
items = csv.split(",")
print(items)  # ['apple', 'banana', 'cherry', 'date']

words = ["Python", "হলো", "দারুণ"]
sentence = " ".join(words)
print(sentence)  # Python হলো দারুণ

# replace আর find
greeting = "Hello World"
print(greeting.replace("World", "Python"))  # Hello Python
print(greeting.find("World"))  # 6 (index), না পেলে -1

# upper, lower, title
print("hello".upper())  # HELLO
print("HELLO".lower())  # hello
print("hello world".title())  # Hello World
```

> [!tip]
> `split()` আর `split(" ")` আলাদা জিনিস। parameter ছাড়া `split()` সব whitespace দিয়ে কাটে আর empty string গুলো skip করে। `split(" ")` শুধু single space দিয়ে কাটে।

## f-strings — আধুনিক String Formatting

Python 3.6+ এ f-string এসেছে, এখন এটাই standard:

```python
name = "Karim"
age = 25
score = 85.567

# সহজ insertion
print(f"নাম: {name}, বয়স: {age}")

# expression ও লেখা যায়
print(f"পরের বছর বয়স: {age + 1}")

# method call
print(f"নাম uppercase: {name.upper()}")

# format spec — দশমিক নির্দিষ্ট ঘরে
print(f"Score: {score:.2f}")  # Score: 85.57

# padding আর alignment
print(f"{name:>10}")   #      Karim (right-align)
print(f"{name:<10}!")  # Karim     !
print(f"{name:^10}")   #   Karim  (center)

# হাজারে comma
print(f"স্যালারি: {1500000:,}")  # স্যালারি: 1,500,000

# date formatting
from datetime import datetime
now = datetime.now()
print(f"আজ: {now:%d/%m/%Y}")  # আজ: 03/07/2026
```

> [!note]
> Python 3.14 (Oct 2025) এ **t-string** বা **template string** (PEP 750) যোগ হয়েছে। f-string এর মতোই দেখতে কিন্তু এটা lazy — string টা তখনই evaluate করে না, বরং একটা template object return করে। এটা SQL injection prevention বা safe HTML rendering এ দারুণ useful। আপাতত f-string ই প্রতিদিনের কাজে standard, তবে t-string ধীরে ধীরে popular হচ্ছে।

## t-string (PEP 750) — Python 3.14

```python
# Python 3.14+ — t-string template হিসেবে কাজ করে
name = "Karim"
# t = t"Hello {name}"  ← সরাসরি string না, template object

# framework গুলো এটাকে safely render করে (XSS থেকে রক্ষা)
# production code এ f-string এর জায়গায় t-string আস্তে আস্তে popular হবে
```

## Regex — `re` Module

```python
import re

text = "আমার ফোন নম্বর 01712345678, আর email হলো karim@example.com"
```

### `re.search` — পুরো text এ খোঁজো

```python
# phone number pattern
phone = re.search(r"\d{11}", text)
if phone:
    print(phone.group())  # 01712345678
```

### `re.findall` — সব match বের করো

```python
numbers = re.findall(r"\d+", "আমার বয়স 25, তার বয়স 30")
print(numbers)  # ['25', '30']
```

### `re.sub` — Replace করো

```python
# সব digit কে * দিয়ে replace
masked = re.sub(r"\d", "*", "My pin is 1234")
print(masked)  # My pin is ****
```

### Groups — Match এর অংশ আলাদা করা

```python
email_pattern = r"(\w+)@(\w+)\.(\w+)"
match = re.search(email_pattern, "karim@example.com")
if match:
    print(match.group(0))  # karim@example.com (পুরো match)
    print(match.group(1))  # karim (প্রথম group)
    print(match.group(2))  # example (দ্বিতীয় group)
    print(match.group(3))  # com (তৃতীয় group)
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
    "যোগাযোগ: info@site.com, sales@shop.bd")
print(emails)  # ['info@site.com', 'sales@shop.bd']

# Bangladeshi phone number
phones = re.findall(r"01\d{9}", "কল করো: 01712345678 বা 01987654321")
print(phones)  # ['01712345678', '01987654321']

# শুধু letters
words_only = re.findall(r"[a-zA-Z]+", "hello123world456")
print(words_only)  # ['hello', 'world']
```

> [!example]
> Regex এর কিছু common shorthand:
> | Pattern | মানে |
> |---------|-------|
> | `\d` | digit (0-9) |
> | `\w` | word char (letter, digit, underscore) |
> | `\s` | whitespace |
> | `.` | যেকোনো single char |
> | `+` | এক বা তার বেশি |
> | `*` | শূন্য বা তার বেশি |
> | `?` | optional (0 বা 1) |
> | `{n}` | ঠিক n বার |
> | `^` / `$` | string এর শুরু / শেষ |

> [!warn]
> Regex validation এ full নির্ভর করবে না। যেমন email validation এর "perfect" regex প্রায় অসম্ভব। যথেষ্ট ভালো pattern লিখে সার্ভারে আবার verify করো। Regex দিয়ে শুধু obvious garbage আটকাও।

## Summary

String immutable, কিন্তু methods দিয়ে অনেক কিছু করা যায়। f-string হলো 2026 এর formatting standard (আর 3.14 এ t-string আসছে)। Regex দিয়ে pattern matching আর text extraction। Practice করতে করতে এগুলো natural হয়ে যাবে।