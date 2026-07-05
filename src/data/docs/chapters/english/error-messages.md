# Error Message বোঝা ও Fix করা

একটা কথা শুরুতেই বলে দিই — error message তোমার শত্রু না, বন্ধু। কোনো developer error দেখে ভয় পায় না, error দেখে খুশি হয় — কারণ error বলছে ঠিক কোথায় সমস্যা! যেটা আসলে ভয়ের, সেটা হলো — code চলছে কিন্তু ভুল output দিচ্ছে, আর কোনো error নেই।

আজকে আমরা শিখবো — error message গুলো কীভাবে পড়তে হয়, কী বোঝায়, আর কীভাবে fix করতে হয়।

## Error Message = তোমার গাইড

মনে করো — তুমি অন্ধ হয়ে হাঁটছো। একটা গর্তে পড়লে। এখন দুটো উপায়: কাঁদো — "কেন আমার সাথে এমন হয়?" অথবা বুঝো — "ঠিক কোথায় গর্ত ছিল, পরের বার সাবধানে হাঁটবো"। Error message হলো সেই গর্তের সংকেত — কী ভুল হয়েছে, কোথায়, কেন।

```
ভুল মানসিকতা                    সঠিক মানসিকতা
────────────────────────────────────────────────────────
"আবার error! 😫"               "ঠিক কোথায় সমস্যা বলো? 🤔"
"কেন আমার সাথে এমন হয়?"       "এই error message টা কী বলছে?"
"এটা solve করতে পারবো না"      "Google তে সার্চ করি, হয়তো উত্তর আছে"
```

## Error Message এর Anatomy

প্রতিটা error message এ কিছু common অংশ থাকে। একবার এই structure টা চিনলে যেকোনো error বোঝা যায়।

নিচের error message টা দেখো — এখানে চারটা অংশ আছে:

এখানে একটা typical Python error দেখানো হলো — প্রতিটা অংশ আলাদা করে চিহ্নিত:

```
File "main.py", line 15, in <module>
    result = data["name"]
                ~~~~^^^^^^
KeyError: 'name'
│             │
│             └── Description: 'name' নামের key dictionary তে নেই
└── Error Type: KeyError — dictionary key এর সমস্যা
```

উপরের error থেকে যা বুঝলাম:
- **File**: `main.py` — কোন file এ সমস্যা
- **Line**: `15` — কোন line এ সমস্যা
- **Error Type**: `KeyError` — কোন ধরনের error
- **Description**: `'name'` — ঠিক কোন key এর সমস্যা

## Python Traceback পড়া — Bottom-Up

Python error পড়ার সবচেয়ে গুরুত্বপূর্ণ নিয়ম: **নিচ থেকে উপরে পড়ো**। কারণ সবচেয়ে গুরুত্বপূর্ণ তথ্য থাকে নিচের লাইনে।

নিচের traceback টা দেখো — এটা উপর থেকে নিচে না, নিচ থেকে উপরে পড়তে হবে:

এখানে একটা Python traceback দেখানো হলো — শেষ লাইন থেকে শুরু করো:

```python
Traceback (most recent call last):
  File "app.py", line 10, in <module>
    process_user(user_id)
  File "app.py", line 7, in process_user
    return get_data(id)
  File "app.py", line 3, in get_data
    return db["users"][id]
KeyError: 'users'
```

উপরের traceback পড়ার সঠিক উপায় — নিচ থেকে উপরে:

```
১. KeyError: 'users'           ← সবচেয়ে গুরুত্বপূর্ণ: 'users' key নেই
২. line 3: db["users"][id]     ← ঠিক এই line এ problem
৩. line 7: get_data(id)        ← get_data function call করেছে
৪. line 10: process_user(...)  ← এখান থেকে সব শুরু
```

> [!important] সবসময় শেষ লাইন প্রথমে পড়ো
> Traceback এর শেষ লাইনে থাকে error type আর description — এটাই সমস্যার মূল কারণ। এটা বুঝলে অর্ধেক solve হয়ে যায়। তারপর উপরের লাইন গুলো দেখো কোন path এ এসেছে।

## Common Error Pattern গুলো

এখন সবচেয়ে common error গুলো দেখি — কোনটা কী কারণে হয় আর কীভাবে fix করবে।

### NameError — Variable Define করনি

নিচের error টা দেখো — এটা খুব common:

এখানে `count` variable define করা হয়নি, কিন্তু use করা হচ্ছে:

```python
print(count)
# NameError: name 'count' is not defined
```

**মানে**: `count` নামের variable টা define করা হয়নি। আগে `count = 0` লেখা দরকার ছিল।

### TypeError — ভুল Type এর Data

নিচের error টা দেখো — এখানে number আর string যোগ করা হচ্ছে:

এখানে `int` আর `str` যোগ করা যায় না, তাই error:

```python
result = 5 + "10"
# TypeError: unsupported operand type(s) for +: 'int' and 'str'
```

**মানে**: `int` আর `str` যোগ করা যায় না। `str(5) + "10"` বা `5 + int("10")` লেখা দরকার।

### IndexError — List এর বাইরে

নিচের error টা দেখো — list এ ৩টা item আছে কিন্তু ৫ম টা access করা হচ্ছে:

এখানে list এ মাত্র ৩টা item আছে, কিন্তু index 5 access করা হচ্ছে:

```python
fruits = ["apple", "banana", "cherry"]
print(fruits[5])
# IndexError: list index out of range
```

**মানে**: list এ index 5 এ কিছু নেই। list এ মাত্র ৩টা item (index 0, 1, 2)।

### KeyError — Dictionary তে Key নেই

নিচের error টা দেখো — dictionary তে `"email"` key নেই:

এখানে `"email"` key টা dictionary তে নেই, কিন্তু access করা হচ্ছে:

```python
user = {"name": "Rahim", "age": 25}
print(user["email"])
# KeyError: 'email'
```

**মানে**: `"email"` key টা dictionary তে নেই। `user.get("email")` ব্যবহার করলে error না দিয়ে `None` পাবে।

### AttributeError — None এর উপর Method Call

নিচের error টা দেখো — এটা সবচেয়ে বেশি confuse করে:

এখানে `data` variable টা `None`, কিন্তু এর উপর `.split()` method call করা হচ্ছে:

```python
data = None
words = data.split(",")
# AttributeError: 'NoneType' object has no attribute 'split'
```

**মানে**: `data` variable টার value `None`। আর `None` এর কোনো method নেই। মানে `data` তে আসল value আসেনি — হয়তো কোনো function `None` return করেছে।

> [!tip] NoneType Error এর কারণ
> `'NoneType' object has no attribute X` দেখলে বুঝবে — কোনো variable এ `None` আছে, সেটার উপর method call করা হয়েছে। সমাধান: দেখো সেই variable এ কোথা থেকে value আসছে, আর কেন `None` আসছে।

### ImportError — Package Install করনি

নিচের error টা দেখো — package install করা নেই:

এখানে `pandas` package install করা নেই, তাই import করা যাচ্ছে না:

```python
import pandas
# ModuleNotFoundError: No module named 'pandas'
```

**মানে**: `pandas` package টা install করা নেই। `pip install pandas` চালাও।

## Error Type Summary Table

নিচের table টা save করে রাখো — error দেখলে এখান থেকে দ্রুত বুঝবে সমস্যা কী:

| Error Type | English Meaning | Bengali Explanation | How to Fix |
|------------|----------------|--------------------|------------| 
| `NameError` | Name is not defined | Variable define করনি | Variable define করো, spelling চেক করো |
| `TypeError` | Wrong type | ভুল type এর data use করছো | Type convert করো (`int()`, `str()`) |
| `IndexError` | Index out of range | List এর বাইরে access করছো | Length চেক করো, index কমাও |
| `KeyError` | Key not found | Dictionary তে এই key নেই | `.get()` ব্যবহার করো, key চেক করো |
| `AttributeError` | No attribute | None বা wrong type এর উপর method call | Variable এর value চেক করো |
| `ImportError` | No module | Package install করনি | `pip install` করো |
| `ValueError` | Wrong value | সঠিক type কিন্তু ভুল value | Value validate করো |
| `SyntaxError` | Invalid syntax | Code এর grammar ভুল | Typo খোঁজো, bracket চেক করো |
| `IndentationError` | Wrong indentation | Indentation ভুল দিয়েছো | Space/tab ঠিক করো |
| `ZeroDivisionError` | Division by zero | শূন্য দিয়ে ভাগ করছো | ভাগ করার আগে check করো |

## Google এ Error Search করার Technique

Error পেলে সবার প্রথম কাজ — Google এ search করা। কিন্তু সবাই ভালো করে search করতে পারে না।

### ভালো Search vs খারাপ Search

নিচের comparison টা দেখো — কীভাবে search করলে দ্রুত উত্তর পাবে:

```
❌ খারাপ Search:
   "python error"
   "help my code broken"
   "why this error"

✅ ভালো Search:
   "KeyError: 'name' python dictionary"
   "TypeError: unsupported operand type(s) for + int and str"
   "AttributeError NoneType object has no attribute split"
```

> [!tip] Error Search এর ৫টা নিয়ম
> ১. **Exact error message** copy করো — পুরো না, শুধু error type আর description
> ২. **File path বা line number বাদ দাও** — সেটা তোমার নির্দিষ্ট, অন্যের না
> ৩. **Language/framework এর নাম যোগ করো** — "python", "react", "javascript"
> ৪. **Site filter করো** — "site:stackoverflow.com KeyError dictionary"
> ৫. **Quote ব্যবহার করো** — `"KeyError" python dictionary`

### File Path আর Line Number বাদ দাও

নিচের example টা দেখো — file path আর line number বাদ দিয়ে শুধু error type আর description search করো:

এখানে একটা error থেকে কোন অংশ search করবে সেটা দেখানো হলো:

```text
Original Error:
  File "C:\Users\asus\project\app.py", line 42, in process
    return data["username"]
  KeyError: 'username'

Google Search Query:
  KeyError: 'username' python dictionary fix
```

File path আর line number বাদ দাও — সেটা শুধু তোমার নির্দিষ্ট। Error type আর description রাখো।

## Stack Overflow উত্তর পড়া

Google search এর পর সবচেয়ে বেশি Stack Overflow result পাবে। ভালো উত্তর চিনতে জানতে হবে।

> [!important] কোন উত্তর পড়বে?
> ১. **Accepted answer** (✅ সবুজ tick) প্রথমে পড়ো — প্রশ্নকারী বলেছে কাজ করেছে
> ২. সবচেয়ে বেশি **upvote** পাওয়া উত্তর পড়ো — community ভালো বলেছে
> ৩. **0 upvote** বা **negative vote** উত্তর এড়িয়ে যাও
> ৪. Code copy করার আগে **version** আর **date** দেখো — পুরোনো উত্তর obsolete হতে পারে

## Real Error Debug Example

এখন পুরো একটা error debug করার process দেখি। ধরো তুমি API থেকে data আনছো:

এখানে `requests.get()` দিয়ে API call করে JSON parse করা হচ্ছে:

```python
import requests

def get_user_info(user_id):
    response = requests.get(f"https://api.example.com/users/{user_id}")
    data = response.json()
    return data["name"]

name = get_user_info(123)
print(name)
```

উপরের code চালালে নিচের error আসতে পারে — নিচ থেকে পড়া শুরু করো:

এখানে একটা `KeyError` আসছে:

```text
Traceback (most recent call last):
  File "app.py", line 9, in <module>
    name = get_user_info(123)
  File "app.py", line 6, in get_user_info
    return data["name"]
KeyError: 'name'
```

**Debug steps**:
```
Step 1: KeyError: 'name' → Dictionary তে 'name' key নেই
Step 2: line 6: data["name"] → ঠিক এই line এ problem
Step 3: API response তে হয়তো "name" key নেই → print(data) করে দেখো
```

নিচের fixed code টা দেখো — `.get()` method দিয়ে safe access করা হয়েছে:

এখানে key না থাকলে `"Unknown"` return করবে, error দেবে না:

```python
def get_user_info(user_id):
    response = requests.get(f"https://api.example.com/users/{user_id}")
    data = response.json()
    print(data)  # Debug: দেখো data তে কী আছে
    return data.get("name", "Unknown")  # Safe access

name = get_user_info(123)
print(name)
```

দুটো পরিবর্তন: (১) `print(data)` দিয়ে actual data দেখা যাচ্ছে, (২) `.get("name", "Unknown")` দিয়ে safe access — key না থাকলে error না দিয়ে `"Unknown"` দেবে।

> [!tip] Debug করার সেরা উপায়
> Error খুঁজছো? **Print everything!** Variable এ কী আছে সব print করো। `print(type(x))`, `print(x)`, `print(len(x))` — দেখবে সমস্যা নিজেই ধরা পড়বে। Senior developer রাও এভাবেই debug করে!

## Summary

আজকে যা শিখলে:
- Error message পড়ার technique (bottom-up)
- ১০টা common error type আর তাদের meaning
- Google এ error search করার সঠিক উপায়
- Stack Overflow উত্তর পড়ার method
- Real error debug করার step-by-step process

**মনে রাখো**: error তোমার শত্রু না, গাইড। Error পড়ে বুঝলে solve করা সহজ। পরের বার error দেখলে ভয় না পেয়ে — পড়ো, বুঝো, fix করো। এটাই developer এর জীবন!