# CI/CD আর GitHub Actions

CI/CD হলো modern software development এর সবচেয়ে জরুরি concept একটা। এটা দিয়ে code push করার সাথে সাথে automatically test, build, আর deploy হয়ে যায়। GitHub Actions দিয়ে এটা খুব সহজে সেট আপ করা যায়।

## CI/CD কী?

| Term | Full Form | কী করে |
|------|-----------|--------|
| **CI** | Continuous Integration | code push করলে automatically test চলে |
| **CD** | Continuous Delivery/Deployment | test pass করলে automatically deploy হয় |

```
Developer push করো → CI: Test চলে → CD: Deploy হয় → Production
     ↓                   ↓                   ↓
   GitHub           GitHub Actions        Server/Cloud
```

> [!tip]
> আগে developer ম্যানুয়ালি test করতো, ম্যানুয়ালি deploy করতো — অনেক সময় আর ভুল হতো। CI/CD দিয়ে এটা automatic। প্রতিটা push এ test চলে, bug ধরা পড়ে আগেই।

## CI/CD কেন দরকার?

- **Bug আগেই ধরা** — code merge হওয়ার আগে test pass করতে হবে
- **Manual work কম** — deploy করতে আলাদা করে কিছু করতে হয় না
- **Confidence** — main branch সবসময় stable থাকে
- **Speed** — মিনিটের মধ্যে test আর deploy

> [!danger]
> কোনো automated test না থাকলে CI/CD এর কিছু কাজ নেই। আগে test লিখতে হবে, তারপর CI সেট আপ করতে হবে।

## GitHub Actions কী?

GitHub Actions হলো GitHub এর built-in CI/CD tool। এটা দিয়ে তুমি একটা YAML file লিখে workflow define করো — কখন কী কাজ হবে। আর GitHub automatically সেটা run করবে।

> [!note]
> GitHub Actions এর কিছুই extra cost ছাড়া public repo এর জন্য free! Private repo এর জন্যও মাসে ২০০০ মিনিট free minutes পাওয়া যায়।

## Workflow File তৈরি

GitHub Actions এর workflow `.github/workflows/` folder এ YAML file হিসেবে থাকে। চলো একটা Python test workflow বানাই:

### Project Structure

```
my_project/
├── .github/
│   └── workflows/
│       └── test.yml        ← CI workflow
├── src/
│   ├── __init__.py
│   └── calculator.py
├── tests/
│   ├── __init__.py
│   └── test_calculator.py
└── requirements.txt
```

### Sample Code আর Test

```python
# src/calculator.py
def add(a, b):
    return a + b

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

```python
# tests/test_calculator.py
from src.calculator import add, divide
import pytest

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

def test_divide():
    assert divide(10, 2) == 5

def test_divide_by_zero():
    with pytest.raises(ValueError):
        divide(10, 0)
```

```
# requirements.txt
pytest>=7.0
```

## GitHub Actions Workflow YAML

```yaml
# .github/workflows/test.yml
name: Python Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.14'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest tests/ -v
```

## YAML Key গুলো Step by Step

চলো প্রতিটা key বুঝি:

### `name` — Workflow এর নাম

```yaml
name: Python Tests
```

GitHub Actions tab এ এই নাম দেখাবে।

### `on` — কখন Trigger হবে

```yaml
on:
  push:
    branches: [ main, develop ]    # main/develop এ push হলে
  pull_request:
    branches: [ main ]              # main এ PR খুললে
```

> [!tip]
> তুমি চাইলে আরো trigger যোগ করতে পারো — `schedule` (cron), `workflow_dispatch` (manual button), `release` (new release publish হলে) ইত্যাদি।

### `jobs` — কী কাজ হবে

```yaml
jobs:
  test:                          # job এর নাম
    runs-on: ubuntu-latest       # কোন OS এ চলবে
```

`runs-on` এ option: `ubuntu-latest`, `windows-latest`, `macos-latest`।

### `steps` — ধাপে ধাপে কাজ

```yaml
    steps:
      - name: Checkout code
        uses: actions/checkout@v4        # তোমার repo এর code download
```

`uses` দিয়ে pre-built action ব্যবহার করা হয়। `actions/checkout@v4` হলো GitHub এর official action — repo এর code কে runner এ download করে।

```yaml
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.14'          # Python 3.14 install
```

```yaml
      - name: Install dependencies
        run: pip install -r requirements.txt    # terminal command
```

`run` দিয়ে সরাসরি terminal command চালানো যায়।

```yaml
      - name: Run tests
        run: pytest tests/ -v
```

> [!example]
> পুরো workflow টা যা করে: code download করো → Python install করো → dependency install করো → test চালাও। যদি কোনো step fail করে, পুরো workflow fail হবে আর GitHub তোমাকে ❌ red mark দেখাবে।

## আরো Advanced Workflow

### Multiple Python Version Test

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.12', '3.13', '3.14']

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v
```

> [!note]
> `matrix` strategy দিয়ে একই test একাধিক Python version এ চালানো যায়। library বানালে এটা খুব দরকার — compatibility যাচাই হয়।

### Code Coverage Report

```yaml
      - name: Run tests with coverage
        run: pytest --cov=src --cov-report=xml tests/

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

### Deploy on Success (CD)

```yaml
jobs:
  test:
    # ... test job (উপরের মতো)

  deploy:
    needs: test                    # test pass করলেই deploy হবে
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'   # শুধু main branch এ

    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # এখানে deploy script থাকবে
```

> [!warn]
> Deploy job এ `needs: test` দেওয়া খুব জরুরি। এতে test fail করলে deploy হবে না। আর `if: github.ref == 'refs/heads/main'` দিয়ে শুধু main branch এ deploy নিশ্চিত করো।

## Workflow Run দেখা

GitHub এ তোমার repo তে **"Actions"** tab এ যাও। সেখানে প্রতিটা workflow run এর result দেখতে পাবে:

- ✅ Green — সব test pass
- ❌ Red — কোনো test fail
- 🟡 Yellow — এখনো running

> [!example]
> যদি test fail করে, Actions tab এ ক্লিক করে কোন step এ fail করেছে সেটার log দেখো। line by line output থাকবে — exact error message সহ।

## Common Pre-built Actions

GitHub Marketplace এ হাজার হাজার ready action আছে:

| Action | কাজ |
|--------|-----|
| `actions/checkout@v4` | repo code download |
| `actions/setup-python@v5` | Python install |
| `actions/cache@v4` | dependency cache (faster) |
| `codecov/codecov-action` | coverage report |
| `peaceiris/actions-gh-pages` | GitHub Pages deploy |

## Summary

CI/CD দিয়ে code push করলে automatically test আর deploy হয়। GitHub Actions দিয়ে YAML file লিখে workflow সেট আপ করা যায়। `on` trigger, `jobs` কাজ, `steps` ধাপ — এই তিনটা মিলেই workflow। এটাই modern software development এর standard। এখন তুমি professional CI/CD pipeline সেট আপ করতে পারবে!