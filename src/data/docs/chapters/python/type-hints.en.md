# Type Hints

Type hints are one of Python's most important features — they make your code self-documenting and bug-free. In 2026, having type hints in all production code is the standard.

## Why Type Hints?

```python
# ❌ without type hints — what should you pass?
def process(data):
    return data * 2

# string? list? int? nobody knows!
process("hello")  # "hellohello"
process([1, 2])   # [1, 2, 1, 2]
process(5)        # 10

# ✅ with type hints — everything is clear
def double(n: int) -> int:
    return n * 2

print(double(5))   # 10
# double("hello")  ← IDE warning! mypy error!
```

## Basic Annotations

```python
# Variable annotation
name: str = "Karim"
age: int = 25
score: float = 95.5
active: bool = True

# Function annotation
def greet(name: str, times: int = 1) -> str:
    return (f"Hello, {name}! " * times).strip()

print(greet("Karim", 2))  # Hello, Karim! Hello, Karim!
```

> [!note]
> Python does not enforce type hints at runtime — they are just hints. Actual checking is done by external tools (mypy, pyright). So if you write `greet(123)`, it won't raise an error at runtime, but a type checker will flag it.

## Modern Syntax — 2026 Style

```python
# ✅ Modern (Python 3.9+) — built-in generic types
from collections import Counter

def average(nums: list[float]) -> float:
    return sum(nums) / len(nums)

def word_count(text: str) -> dict[str, int]:
    return dict(Counter(text.split()))

def unique_items(items: set[int]) -> list[int]:
    return sorted(items)

# ❌ Old style (from typing module)
# from typing import List, Dict, Set
# def average(nums: List[float]) -> float: ...
```

### `X | None` — Instead of `Optional`

```python
# ✅ Modern (Python 3.10+)
def find_user(user_id: int) -> dict | None:
    if user_id in database:
        return database[user_id]
    return None

# ❌ Old style
# from typing import Optional
# def find_user(user_id: int) -> Optional[dict]: ...

# Multiple types union
def process(data: str | int | None = None) -> str:
    if data is None:
        return "empty"
    return str(data)
```

### Tuple Types

```python
# Fixed length tuple
point: tuple[float, float] = (3.5, 7.2)
rgb: tuple[int, int, int] = (255, 128, 0)

# Variable length tuple (homogeneous)
scores: tuple[int, ...] = (85, 92, 78, 95)
```

## PEP 695 — Generic Syntax (Python 3.12+)

```python
# ✅ PEP 695 — new syntax, much cleaner!
def first[T](items: list[T]) -> T:
    return items[0]

def pair_to_dict[K, V](pairs: list[tuple[K, V]]) -> dict[K, V]:
    return dict(pairs)

# Generic class
class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def __len__(self) -> int:
        return len(self._items)


# Usage
names: Stack[str] = Stack()
names.push("Karim")
name = names.pop()  # type: str — the IDE knows!

nums: Stack[int] = Stack()
nums.push(42)
num = nums.pop()    # type: int
```

> [!tip]
> PEP 695 generic syntax is the 2026 standard. Previously you had to use `TypeVar` and `Generic` — now just `def first[T](...)` and you're done!

### Old TypeVar (legacy)

```python
# ❌ Old style — verbose
from typing import TypeVar

T = TypeVar("T")

def first(items: list[T]) -> T:
    return items[0]
```

## `TypedDict` — Specifying Types for Dicts

```python
from typing import TypedDict


class UserProfile(TypedDict):
    name: str
    age: int
    email: str | None


def create_profile(data: UserProfile) -> str:
    return f"{data['name']} ({data['age']})"

# ✅ Correct
user: UserProfile = {"name": "Karim", "age": 25, "email": None}
print(create_profile(user))

# ❌ Wrong — type checker will catch this
# bad: UserProfile = {"name": "Karim", "age": "twenty"}
#                                  age needs to be an int!
```

## `Protocol` — Structural Subtyping (Typed Version of Duck Typing)

```python
from typing import Protocol


class Drawable(Protocol):
    def draw(self) -> None: ...


class Circle:
    def draw(self) -> None:
        print("Drawing a Circle")


class Square:
    def draw(self) -> None:
        print("Drawing a Square")


def render(shape: Drawable) -> None:
    shape.draw()

# Circle and Square don't inherit from any base class
# but because they have the draw() method, the type checker is happy
render(Circle())  # Drawing a Circle
render(Square())  # Drawing a Square
```

> [!example]
> `Protocol` is the typed version of duck typing — "if it walks like a duck and quacks like a duck, it's a duck." But now the type checker also verifies that the object has the required methods.

## `Callable` and `Any`

```python
from typing import Callable, Any

# Callable — the type of a function
def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

print(apply(lambda x, y: x + y, 3, 5))  # 8

# Any — anything goes (avoid using!)
def log_anything(data: Any) -> None:
    print(data)
```

> [!warn]
> Using `Any` means you lose all the benefits of type checking. The less `Any` you have, the better. Only use it as a last resort when you truly don't know the type.

## Type Checking Tools

### `mypy` — Static Type Checker

```bash
# Install
uv add mypy --dev

# Check
mypy myproject/
```

```python
# mypy will catch this:
def add(a: int, b: int) -> int:
    return a + b

result = add(5, "hello")  # error: Argument 2 has incompatible type "str"
```

### `pyright` / Pylance — Faster Type Checker

```bash
# standalone
uv add pyright --dev
pyright myproject/

# or use the Pylance extension in VS Code (built-in pyright)
```

> [!tip]
> `pyright` (and VS Code's Pylance) is much faster and gives real-time feedback — it shows errors as you type. `mypy` is better suited for CI/CD pipelines. Both are popular, so pick whichever you prefer.

## Before / After — A Real Example

```python
# ❌ Before — nothing is clear
def get_stats(data):
    result = {}
    result["mean"] = sum(data) / len(data)
    result["count"] = len(data)
    if len(data) > 1:
        variance = sum((x - result["mean"]) ** 2 for x in data) / (len(data) - 1)
        result["std"] = variance ** 0.5
    return result

stats = get_stats([1, 2, 3])
print(stats["meen"])  # KeyError! a typo that will only be caught at runtime
```

```python
# ✅ After — everything is clear
from dataclasses import dataclass


@dataclass
class Stats:
    mean: float
    count: int
    std: float | None = None


def get_stats(data: list[float]) -> Stats:
    n = len(data)
    mean = sum(data) / n
    std = None
    if n > 1:
        variance = sum((x - mean) ** 2 for x in data) / (n - 1)
        std = variance ** 0.5
    return Stats(mean=mean, count=n, std=std)


stats = get_stats([1.0, 2.0, 3.0])
print(stats.mean)  # 2.0 — attribute access, the IDE catches typos!
print(stats.count) # 3
print(stats.std)   # 1.0
```

## Summary

Type hints make your code self-documenting, improve IDE support, and catch bugs early. Use modern syntax — `list[int]` (not typing.List), `X | None` (not Optional), PEP 695 generic syntax. Model complex types using `TypedDict` and `Protocol`. Check your code with `mypy` or `pyright`. In 2026, a serious Python project without type hints is unimaginable.