Testing হলো professional developer এর superpower — code যে ঠিক কাজ করে সেটা ensure করার একমাত্র উপায়। 2026 এ Python testing এর standard হলো **pytest**। চলো দেখি কিভাবে।

## কেন Test লিখবে?

```python
# এই function টা ঠিক আছে কিনা কিভাবে জানবে?
def is_palindrome(s: str) -> bool:
    s = s.lower().replace(" ", "")
    return s == s[::-1]

# ম্যানুয়ালি check — কষ্টকর আর unreliable
# print(is_palindrome("radar"))  # True?
# print(is_palindrome("hello"))  # False?

# ✅ Automated test — একবার লিখে সারাজীবন চলবে
def test_is_palindrome():
    assert is_palindrome("radar") is True
    assert is_palindrome("hello") is False
    assert is_palindrome("A Santa at NASA") is True  # space আর case ignore
```

> [!tip]
> Test লেখার সবচেয়ে বড় সুবিধা — refactor করার সাহস পাও। কোড বদলালে কিছু ভাঙলো কিনা সেটা test run করেই জানা যায়। নইলে ম্যানুয়ালি check করতে হতো — সেটা কখনো scalable না।

## pytest Setup

```bash
# uv দিয়ে (recommended)
uv add pytest pytest-cov --dev

# পুরোনো pip দিয়ে
pip install pytest pytest-cov
```

প্রজেক্ট structure:

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
        raise ValueError("শূন্য দিয়ে ভাগ চলে না!")
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
    with pytest.raises(ValueError, match="শূন্য দিয়ে ভাগ"):
        divide(10, 0)
```

```bash
# test রান করো
pytest tests/
# বা verbose
pytest tests/ -v
# নির্দিষ্ট test
pytest tests/test_calculator.py::test_add
```

> [!note]
> pytest সব `test_` দিয়ে শুরু হওয়া function আর `Test` দিয়ে শুরু হওয়া class খুঁজে নিয়ে run করে। File এর নাম ও `test_*.py` হতে হবে।

## `@pytest.mark.parametrize` — এক Test, একাধিক Input

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
    ("", True),       # empty string palindrome
    ("A", True),      # single char
])
def test_is_palindrome_many(text, expected):
    assert is_palindrome(text) is expected
```

> [!example]
> `parametrize` দিয়ে একটা test function এ multiple case run করা যায়। এটা সবচেয়ে বেশি ব্যবহৃত pytest feature — boilerplate কম, coverage বেশি।

## `@pytest.fixture` — Reusable Setup

```python
import pytest
from myproject.models import Database


@pytest.fixture
def db():
    """প্রতিটা test এর আগে fresh database"""
    database = Database(":memory:")  # in-memory test DB
    database.connect()
    yield database  # test এর জন্য দিলাম
    database.close()  # test শেষে cleanup


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
> `yield` এর আগে setup, পরে teardown। প্রতিটা test ফাইলে fresh fixture পাবে — test গুলো independent থাকে। এটা testing এর golden rule।

## Fixture Scope

```python
@pytest.fixture(scope="session")
def api_client():
    """সব test এর জন্য একবারই create হবে"""
    client = create_test_client()
    yield client
    client.close()


@pytest.fixture(scope="function")  # default — প্রতি test এ
def fresh_data():
    return {"users": []}
```

## Mocking — External Dependency Fake করা

```python
from unittest.mock import patch, MagicMock
from myproject.weather import get_weather


@patch("myproject.weather.requests.get")
def test_get_weather(mock_get):
    # Fake response setup
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

    # Verify API call হয়েছে কিনা
    mock_get.assert_called_once_with(
        "https://api.weather.com/Dhaka"
    )
```

> [!note]
> Mocking দিয়ে real API call, database, file system কে fake করা যায়। Test fast চলে, আর external service available না থাকলেও test চলে। `unittest.mock` হলো standard mocking library।

## Coverage — কতটুকু Code Test হয়েছে

```bash
# coverage সহ test রান
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
> ১০০% coverage লক্ষ্য না — কিন্তু critical logic গুলো properly cover করা জরুরি। `term-missing` দিয়ে কোন line test হয় নি সেটা দেখা যায়। CI/CD pipeline এ minimum coverage threshold (যেমন ৮০%) রাখা ভালো।

## TDD — Test Driven Development

```python
# ধাপ ১: Test আগে লিখো (RED — fail করবে)
def test_fizzbuzz():
    assert fizzbuzz(1) == "1"
    assert fizzbuzz(3) == "Fizz"
    assert fizzbuzz(5) == "Buzz"
    assert fizzbuzz(15) == "FizzBuzz"
    assert fizzbuzz(7) == "7"

# ধাপ ২: এখন implement করো (GREEN — pass করবে)
def fizzbuzz(n: int) -> str:
    if n % 15 == 0:
        return "FizzBuzz"
    if n % 3 == 0:
        return "Fizz"
    if n % 5 == 0:
        return "Buzz"
    return str(n)

# ধাপ ৩: Refactor করো (code সুন্দর করো, test পাস থাকবে)
```

```python
# pytest parametrize দিয়ে TDD
@pytest.mark.parametrize("n, expected", [
    (1, "1"), (2, "2"), (3, "Fizz"), (4, "4"),
    (5, "Buzz"), (6, "Fizz"), (10, "Buzz"),
    (15, "FizzBuzz"), (30, "FizzBuzz"),
])
def test_fizzbuzz_tdd(n, expected):
    assert fizzbuzz(n) == expected
```

> [!example]
> TDD flow: **Red** (test লেখো, fail দেখো) → **Green** (minimum code লিখে pass করো) → **Refactor** (code পরিষ্কার করো)। এই সাইকেল মেনে চললে bug কম হয় আর code design ভালো হয়।

## `pytest` বনাম `unittest`

```python
# unittest — Python built-in, verbose
import unittest

class TestCalculator(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)

    def test_divide_zero(self):
        with self.assertRaises(ValueError):
            divide(10, 0)

# pytest — অনেক clean
def test_add():
    assert add(2, 3) == 5

def test_divide_zero():
    with pytest.raises(ValueError):
        divide(10, 0)
```

> [!note]
> `unittest` Python এর built-in — কোনো install লাগে না। কিন্তু 2026 এ সবাই `pytest` ব্যবহার করে — syntax concise, fixture powerful, plugin অনেক। unittest শুধু standard library only project এর জন্য রাখো।

## Summary

pytest হলো 2026 এর Python testing standard। `assert` দিয়ে সহজ test, `parametrize` দিয়ে multiple case, `fixture` দিয়ে reusable setup, `mock` দিয়ে external dependency fake। Coverage দিয়ে কতটুকু test হয়েছে track করো। TDD pattern (Red-Green-Refactor) অভ্যস্ত হলে code quality অনেক ভালো হয়।