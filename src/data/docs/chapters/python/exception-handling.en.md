# Exception Handling

A program crashing isn't necessarily bad — but showing raw errors to users is worse. With exception handling, we deal with errors gracefully.

## The Basic try / except Structure

```python
try:
    number = int(input("Enter a number: "))
    print(f"Double: {number * 2}")
except ValueError:
    print("That's not a number! Please enter a number.")
```

If an error occurs in the `try` block, it jumps to the `except` block. The whole program doesn't crash.

## The Full Structure: try / except / else / finally

```python
try:
    # This code might raise an error
    f = open("data.txt", "r")
    content = f.read()
except FileNotFoundError:
    # If this specific error occurs
    print("File not found!")
except PermissionError:
    # Another specific error
    print("No permission to read the file!")
else:
    # This runs if no error occurred
    print(f"File has {len(content)} characters")
finally:
    # This always runs — error or no error
    print("Task complete")
    if 'f' in locals():
        f.close()
```

> [!tip]
> The `finally` block always executes — whether there's an error or not, even after `return` or `break`. It's typically used for cleanup (closing files, closing connections).

## Catching Multiple Exceptions Together

```python
try:
    value = int("abc")
except (ValueError, TypeError) as e:
    print(f"Error: {e}")
# Error: invalid literal for int() with base 10: 'abc'
```

Using `as e` gives you the error message in `e`.

## Common Built-in Exceptions

| Exception | When It Happens |
|-----------|-----------------|
| `ValueError` | Wrong type of value (like `int("abc")`) |
| `TypeError` | Wrong type of operation |
| `KeyError` | Key not found in dict |
| `IndexError` | List index out of range |
| `FileNotFoundError` | File not found |
| `ZeroDivisionError` | Division by zero |
| `AttributeError` | Object doesn't have the attribute |
| `StopIteration` | Iterator is exhausted |

## Exception Hierarchy

All exceptions come from `BaseException`. We usually work with exceptions derived from `Exception`:

```python
try:
    result = 10 / 0
except Exception as e:
    print(type(e).__name__)  # ZeroDivisionError
    print(e)                 # division by zero
```

> [!warn]
> Never write a bare `except:` — it catches `KeyboardInterrupt` and `SystemExit` too, which is very dangerous. Always catch specific exceptions, or at least use `except Exception:`.

## `raise` — Throwing Errors Yourself

```python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError(f"Insufficient balance! Only {balance} available")
    if amount < 0:
        raise ValueError("Cannot withdraw a negative amount!")
    return balance - amount

try:
    new_balance = withdraw(500, 1000)
except ValueError as e:
    print(f"Error: {e}")
# Error: Insufficient balance! Only 500 available
```

## Re-raise — Log the Error Then Throw Again

```python
try:
    data = open("config.json").read()
except FileNotFoundError as e:
    print(f"Log: config file not found — {e}")
    raise  # Re-raise the same exception
```

Just `raise` (without parameters) propagates the current exception again.

## Custom Exception Classes

```python
class InsufficientFundsError(Exception):
    """This error when balance is insufficient"""
    def __init__(self, balance, amount):
        self.balance = balance
        self.amount = amount
        super().__init__(
            f"Tried to withdraw {amount}, but only {balance} available"
        )


class BankAccount:
    def __init__(self, balance: float):
        self.balance = balance

    def withdraw(self, amount: float) -> float:
        if amount > self.balance:
            raise InsufficientFundsError(self.balance, amount)
        self.balance -= amount
        return self.balance


# Usage
acc = BankAccount(500)
try:
    acc.withdraw(1000)
except InsufficientFundsError as e:
    print(f"Error: {e}")
    print(f"Balance: {e.balance}, You wanted: {e.amount}")
# Error: Tried to withdraw 1000, but only 500 available
# Balance: 500, You wanted: 1000
```

> [!example]
> Custom exceptions can hold not just a message, but any extra data (balance, timestamp, etc.). This is incredibly helpful for debugging and error handling.

## `assert` — Debugging Assertions

```python
def calculate_average(numbers: list[float]) -> float:
    assert len(numbers) > 0, "Cannot calculate average of an empty list!"
    return sum(numbers) / len(numbers)

# calculate_average([])  ← AssertionError: Cannot calculate average of an empty list!
```

> [!danger]
> `assert` is only for debugging. In production, running `python -O` skips all assertions. So don't use `assert` for business logic validation — use `if` + `raise` instead.

## Real-World Example — Reading and Processing a File

```python
import json


def load_config(filepath: str) -> dict:
    """Safely reads a JSON config file"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ {filepath} not found, using defaults")
        return {"port": 8000, "debug": False}
    except json.JSONDecodeError as e:
        print(f"⚠️ Invalid JSON in {filepath}: {e}")
        return {"port": 8000, "debug": False}
    except Exception as e:
        print(f"⚠️ Unexpected error: {e}")
        raise  # Unknown error — send it up


config = load_config("config.json")
print(f"Server starting on port {config['port']}")
```

> [!note]
> Using `with open(...)` automatically closes the file — no need for `f.close()` in `finally`. This is the best practice.

## Summary

Exception handling makes your programs robust. Remember the `try/except/else/finally` structure. Catch specific exceptions, and create custom exceptions when the defaults aren't enough. Use `assert` only for debugging. Always include proper error handling in production code.