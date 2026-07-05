# Testing

Testing is a professional developer's superpower — it's the only way to ensure your code actually works correctly. In 2026, the standard for Python testing is **pytest**. Let's see how it works.

## Why Write Tests?

```python
# How do you know this function works correctly?
def is_palindrome(s: str) -> bool:
    s = s.lower().replace(" ", "")
    return s == s[::-1]

# Checking manually — painful and unreliable
# print(is_palindrome("radar"))  # True?
# print(is_palindrome("hello"))  # False?

# ✅ Automated test — write once, use forever
def test_is_palindrome():
    assert is_palindrome("radar") is True
    assert is_palindrome("hello") is False
    assert is_palindrome("A Santa at NASA") is True  # ignores spaces and case
```

> [!tip]
> The biggest benefit of writing tests — you get the confidence to refactor. When you change code, just run the tests to see if anything broke. Otherwise you'd have to check manually — which is never scalable.

## pytest Setup

```bash
# With uv (recommended)
uv add pytest pytest-cov --dev

# The old pip way
pip install pytest pytest-cov
```

Project structure:

```text
myproject/
├── src/
│   └── myproject/
│       └── calculator.py
└── tests/
    ├── __init__.py
    └── test_calculator.py
```

## pytest Basics

```python
# src/myproject/calculator.py
def add(a: float, b: float) -> float:
    return a + b

def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Cannot divide by zero!")
    return a / b
```

```python
# tests/test_calculator.py
from myproject.calculator import add, divide
import pytest


def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(0.1, 0.2) == pytest.approx(0.3)  # float comparison


def test_divide():
    assert divide(10, 2) == 5.0
    assert divide(7, 1) == 7.0


def test_divide_by_zero():
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        divide(10, 0)
```

```bash
# Run tests
pytest tests/
# Or verbosely
pytest tests/ -v
# A specific test
pytest tests/test_calculator.py::test_add
```

> [!note]
> pytest automatically finds and runs all functions starting with `test_` and all classes starting with `Test`. File names must also follow the `test_*.py` pattern.

## `@pytest.mark.parametrize` — One Test, Multiple Inputs

```python
@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 5),
    (-1, 1, 0),
    (0, 0, 0),
    (100, 200, 300),
    (0.5, 0.5, 1.0),
])
def test_add_many_cases(a, b, expected):
    assert add(a, b) == expected


@pytest.mark.parametrize("text, expected", [
    ("radar", True),
    ("hello", False),
    ("level", True),
    ("", True),       # empty string is a palindrome
    ("A", True),      # single character
])
def test_is_palindrome_many(text, expected):
    assert is_palindrome(text) is expected
```

> [!example]
> With `parametrize`, a single test function can run multiple cases. It's the most commonly used pytest feature — less boilerplate, more coverage.

## `@pytest.fixture` — Reusable Setup

```python
import pytest
from myproject.models import Database


@pytest.fixture
def db():
    """A fresh database before each test"""
    database = Database(":memory:")  # in-memory test DB
    database.connect()
    yield database  # provide it to the test
    database.close()  # cleanup after the test


def test_add_user(db):
    db.add_user("Karim")
    users = db.get_users()
    assert len(users) == 1
    assert users[0]["name"] == "Karim"


def test_delete_user(db):
    db.add_user("Sadia")
    db.delete_user("Sadia")
    assert len(db.get_users()) == 0
```

> [!tip]
> Before `yield` is setup, after is teardown. Each test gets a fresh fixture — tests stay independent. This is the golden rule of testing.

## Fixture Scope

```python
@pytest.fixture(scope="session")
def api_client():
    """Created only once for all tests"""
    client = create_test_client()
    yield client
    client.close()


@pytest.fixture(scope="function")  # default — per test
def fresh_data():
    return {"users": []}
```

## Mocking — Faking External Dependencies

```python
from unittest.mock import patch, MagicMock
from myproject.weather import get_weather


@patch("myproject.weather.requests.get")
def test_get_weather(mock_get):
    # Set up a fake response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "temperature": 30,
        "condition": "sunny"
    }
    mock_get.return_value = mock_response

    # Test
    result = get_weather("Dhaka")
    assert result["temperature"] == 30
    assert result["condition"] == "sunny"

    # Verify the API was actually called
    mock_get.assert_called_once_with(
        "https://api.weather.com/Dhaka"
    )
```

> [!note]
> Mocking lets you fake real API calls, databases, and file systems. Tests run fast, and they work even when external services aren't available. `unittest.mock` is the standard mocking library.

## Coverage — How Much Code Has Been Tested

```bash
# Run tests with coverage
pytest tests/ --cov=myproject --cov-report=term-missing
```

```text
Name                           Stmts   Miss  Cover   Missing
------------------------------------------------------------
src/myproject/__init__.py          2      0   100%
src/myproject/calculator.py       12      1    92%   15
src/myproject/models.py           25      5    80%   20-24
------------------------------------------------------------
TOTAL                             39      6    85%
```

> [!tip]
> Don't aim for 100% coverage — but it's important to properly cover critical logic. `term-missing` shows which lines weren't tested. It's a good idea to set a minimum coverage threshold (like 80%) in your CI/CD pipeline.

## TDD — Test Driven Development

```python
# Step 1: Write the test first (RED — it will fail)
def test_fizzbuzz():
    assert fizzbuzz(1) == "1"
    assert fizzbuzz(3) == "Fizz"
    assert fizzbuzz(5) == "Buzz"
    assert fizzbuzz(15) == "FizzBuzz"
    assert fizzbuzz(7) == "7"

# Step 2: Now implement it (GREEN — it will pass)
def fizzbuzz(n: int) -> str:
    if n % 15 == 0:
        return "FizzBuzz"
    if n % 3 == 0:
        return "Fizz"
    if n % 5 == 0:
        return "Buzz"
    return str(n)

# Step 3: Refactor (clean up the code, tests still pass)
```

```python
# TDD with pytest parametrize
@pytest.mark.parametrize("n, expected", [
    (1, "1"), (2, "2"), (3, "Fizz"), (4, "4"),
    (5, "Buzz"), (6, "Fizz"), (10, "Buzz"),
    (15, "FizzBuzz"), (30, "FizzBuzz"),
])
def test_fizzbuzz_tdd(n, expected):
    assert fizzbuzz(n) == expected
```

> [!example]
> TDD flow: **Red** (write a test, see it fail) → **Green** (write the minimum code to pass) → **Refactor** (clean up the code). Following this cycle leads to fewer bugs and better code design.

## `pytest` vs `unittest`

```python
# unittest — Python built-in, verbose
import unittest

class TestCalculator(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)

    def test_divide_zero(self):
        with self.assertRaises(ValueError):
            divide(10, 0)

# pytest — much cleaner
def test_add():
    assert add(2, 3) == 5

def test_divide_zero():
    with pytest.raises(ValueError):
        divide(10, 0)
```

> [!note]
> `unittest` is Python's built-in — no installation needed. But in 2026, everyone uses `pytest` — the syntax is concise, fixtures are powerful, and there are tons of plugins. Keep unittest only for standard-library-only projects.

## Summary

pytest is the 2026 standard for Python testing. Use `assert` for simple tests, `parametrize` for multiple cases, `fixture` for reusable setup, and `mock` to fake external dependencies. Track how much you've tested with coverage. Once you're comfortable with the TDD pattern (Red-Green-Refactor), your code quality will improve significantly.