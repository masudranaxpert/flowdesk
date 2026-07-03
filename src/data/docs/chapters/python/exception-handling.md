Program crash করা খারাপ কিছু না — কিন্তু user কে error দেখানো আরও খারাপ। Exception handling দিয়ে আমরা gracefully error মোকাবিলা করি।

## try / except মূল কাঠামো

```python
try:
    number = int(input("একটা সংখ্যা দাও: "))
    print(f"দ্বিগুণ: {number * 2}")
except ValueError:
    print("এটা সংখ্যা না! সংখ্যা দাও।")
```

`try` block এ error হলে `except` block এ চলে যায়। পুরো program crash করে না।

## পুরো Structure: try / except / else / finally

```python
try:
    # এই code এ error হতে পারে
    f = open("data.txt", "r")
    content = f.read()
except FileNotFoundError:
    # এই specific error হলে
    print("ফাইল পাওয়া গেল না!")
except PermissionError:
    # অন্য specific error
    print("ফাইল পড়ার permission নেই!")
else:
    # কোনো error না হলে এটা চলে
    print(f"ফাইলে {len(content)} অক্ষর আছে")
finally:
    # error হোক বা না হোক — সবসময় চলবে
    print("কাজ শেষ")
    if 'f' in locals():
        f.close()
```

> [!tip]
> `finally` block সবসময় execute হয় — error হলেও, না হলেও, এমনকি `return` বা `break` এর পরেও। সাধারণত cleanup (file close, connection close) এর জন্য ব্যবহার হয়।

## Multiple Exception একসাথে ধরা

```python
try:
    value = int("abc")
except (ValueError, TypeError) as e:
    print(f"Error: {e}")
# Error: invalid literal for int() with base 10: 'abc'
```

`as e` দিলে error message টা `e` তে পাওয়া যায়।

## Common Built-in Exception গুলো

| Exception | কখন হয় |
|-----------|---------|
| `ValueError` | ভুল type এর value (যেমন `int("abc")`) |
| `TypeError` | ভুল type এর operation |
| `KeyError` | dict এ key নেই |
| `IndexError` | list এ index out of range |
| `FileNotFoundError` | ফাইল পাওয়া যায় নি |
| `ZeroDivisionError` | শূন্য দিয়ে ভাগ |
| `AttributeError` | object এ attribute নেই |
| `StopIteration` | iterator শেষ |

## Exception Hierarchy

সব exception `BaseException` থেকে আসে। সাধারণত আমরা `Exception` থেকে আসা গুলো নিয়ে কাজ করি:

```python
try:
    result = 10 / 0
except Exception as e:
    print(type(e).__name__)  # ZeroDivisionError
    print(e)                 # division by zero
```

> [!warn]
> কখনো bare `except:` লিখবে না — এটা `KeyboardInterrupt` বা `SystemExit` ও catch করে ফেলে, যা খুব বিপজ্জনক। সবসময় specific exception ধরো, বা অন্তত `except Exception:` লেখো।

## `raise` — নিজে থেকে Error ছোঁড়া

```python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError(f"পর্যাপ্ত balance নেই! আছে মাত্র {balance}")
    if amount < 0:
        raise ValueError("Negative amount তুলতে পারবে না!")
    return balance - amount

try:
    new_balance = withdraw(500, 1000)
except ValueError as e:
    print(f"Error: {e}")
# Error: পর্যাপ্ত balance নেই! আছে মাত্র 500
```

## Re-raise — Error লগ করে আবার ছুঁড়ে দেওয়া

```python
try:
    data = open("config.json").read()
except FileNotFoundError as e:
    print(f"লগ: config ফাইল পাওয়া গেল না — {e}")
    raise  # আবার একই exception ছুঁড়ে দিলাম
```

শুধু `raise` (parameter ছাড়া) দিলে current exception টা আবার propagate হয়।

## Custom Exception Class

```python
class InsufficientFundsError(Exception):
    """Balance অপর্যাপ্ত হলে এই error"""
    def __init__(self, balance, amount):
        self.balance = balance
        self.amount = amount
        super().__init__(
            f"তুলতে চাইলে {amount}, আছে মাত্র {balance}"
        )


class BankAccount:
    def __init__(self, balance: float):
        self.balance = balance

    def withdraw(self, amount: float) -> float:
        if amount > self.balance:
            raise InsufficientFundsError(self.balance, amount)
        self.balance -= amount
        return self.balance


# ব্যবহার
acc = BankAccount(500)
try:
    acc.withdraw(1000)
except InsufficientFundsError as e:
    print(f"Error: {e}")
    print(f"Balance: {e.balance}, চেয়েছিলে: {e.amount}")
# Error: তুলতে চাইলে 1000, আছে মাত্র 500
# Balance: 500, চেয়েছিলে: 1000
```

> [!example]
> Custom exception তে শুধু message না, যেকোনো extra data (balance, timestamp ইত্যাদি) রাখা যায়। এটা debugging আর error handling এ দারুণ সাহায্য করে।

## `assert` — Debugging Assertion

```python
def calculate_average(numbers: list[float]) -> float:
    assert len(numbers) > 0, "empty list এর average হয় না!"
    return sum(numbers) / len(numbers)

# calculate_average([])  ← AssertionError: empty list এর average হয় না!
```

> [!danger]
> `assert` শুধু debugging এর জন্য। Production এ `python -O` flag দিলে সব assert skip হয়ে যায়। তাই business logic validation এর জন্য `assert` ব্যবহার করবে না — `if` + `raise` ব্যবহার করো।

## রিয়েল উদাহরণ — ফাইল পড়ে Process করা

```python
import json


def load_config(filepath: str) -> dict:
    """JSON config ফাইল safely পড়ে"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ {filepath} পাওয়া গেল না, default ব্যবহার করছি")
        return {"port": 8000, "debug": False}
    except json.JSONDecodeError as e:
        print(f"⚠️ {filepath} তে ভুল JSON: {e}")
        return {"port": 8000, "debug": False}
    except Exception as e:
        print(f"⚠️ অপ্রত্যাশিত error: {e}")
        raise  # unknown error — উপরে পাঠাও


config = load_config("config.json")
print(f"Server starting on port {config['port']}")
```

> [!note]
> `with open(...)` ব্যবহার করলে ফাইল automatically close হয় — `finally` এ `f.close()` করার দরকার নেই। এটাই best practice।

## Summary

Exception handling দিয়ে program robust হয়। `try/except/else/finally` structure মনে রাখো। Specific exception ধরো, custom exception বানাও যখন default গুলো যথেষ্ট না। `assert` শুধু debug এর জন্য। Production code এ always proper error handling রাখো।