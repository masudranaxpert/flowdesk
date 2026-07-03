Type hints হলো Python এর সবচেয়ে গুরুত্বপূর্ণ feature গুলোর একটা — এটা তোমার code কে self-documenting আর bug-free করে। 2026 এ সব production code এ type hints থাকাটা standard।

## কেন Type Hints?

```python
# ❌ without type hints — কী pass করবে?
def process(data):
    return data * 2

# string? list? int? কেউ জানে না!
process("hello")  # "hellohello"
process([1, 2])   # [1, 2, 1, 2]
process(5)        # 10

# ✅ with type hints — সবস্পষ্ট
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
    return (f"হ্যালো, {name}! " * times).strip()

print(greet("Karim", 2))  # হ্যালো, Karim! হ্যালো, Karim!
```

> [!note]
> Python runtime এ type hints enforce করে না — এগুলো শুধু hints। Actual checking করে external tool গুলো (mypy, pyright)। তাই `greet(123)` লিখলে runtime এ error দেবে না, কিন্তু type checker error দেখাবে।

## Modern Syntax — 2026 স্টাইল

```python
# ✅ Modern (Python 3.9+) — built-in generic types
from collections import Counter

def average(nums: list[float]) -> float:
    return sum(nums) / len(nums)

def word_count(text: str) -> dict[str, int]:
    return dict(Counter(text.split()))

def unique_items(items: set[int]) -> list[int]:
    return sorted(items)

# ❌ পুরোনো (typing module থেকে)
# from typing import List, Dict, Set
# def average(nums: List[float]) -> float: ...
```

### `X | None` — `Optional` এর জায়গায়

```python
# ✅ Modern (Python 3.10+)
def find_user(user_id: int) -> dict | None:
    if user_id in database:
        return database[user_id]
    return None

# ❌ পুরোনো
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
# ✅ PEP 695 — নতুন syntax, অনেক clean!
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


# ব্যবহার
names: Stack[str] = Stack()
names.push("Karim")
name = names.pop()  # type: str — IDE জানে!

nums: Stack[int] = Stack()
nums.push(42)
num = nums.pop()    # type: int
```

> [!tip]
> PEP 695 generic syntax হলো 2026 এর standard। আগে `TypeVar` আর `Generic` দিয়ে করতে হতো — এখন `def first[T](...)` এভাবে সোজা!

### পুরোনো TypeVar (legacy)

```python
# ❌ পুরোনো — verbose
from typing import TypeVar

T = TypeVar("T")

def first(items: list[T]) -> T:
    return items[0]
```

## `TypedDict` — Dict এর Type নির্দিষ্ট করা

```python
from typing import TypedDict


class UserProfile(TypedDict):
    name: str
    age: int
    email: str | None


def create_profile(data: UserProfile) -> str:
    return f"{data['name']} ({data['age']})"

# ✅ সঠিক
user: UserProfile = {"name": "Karim", "age": 25, "email": None}
print(create_profile(user))

# ❌ ভুল — type checker ধরবে
# bad: UserProfile = {"name": "Karim", "age": "twenty"}
#                                  age তে int দরকার!
```

## `Protocol` — Structural Subtyping (Duck Typing এর Typed রূপ)

```python
from typing import Protocol


class Drawable(Protocol):
    def draw(self) -> None: ...


class Circle:
    def draw(self) -> None:
        print("Circle আঁকছি")


class Square:
    def draw(self) -> None:
        print("Square আঁকছি")


def render(shape: Drawable) -> None:
    shape.draw()

# Circle আর Square কোনো base class inherit করে না
# কিন্তু draw() মেথড থাকায় type checker happy
render(Circle())  # Circle আঁকছি
render(Square())  # Square আঁকছি
```

> [!example]
> `Protocol` হলো duck typing এর typed version — "যদি হাঁরাতে পারে আর ডাকতে পারে, তাহলে হাঁস"। কিন্তু এখন type checker টাও verify করে যে object এ required method আছে কিনা।

## `Callable` আর `Any`

```python
from typing import Callable, Any

# Callable — function এর type
def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

print(apply(lambda x, y: x + y, 3, 5))  # 8

# Any — যা খুশি (avoid করবে!)
def log_anything(data: Any) -> None:
    print(data)
```

> [!warn]
> `Any` ব্যবহার করলে type checking এর সুবিধা পাওয়া যায় না। যত কম `Any` থাকবে, তত ভালো। সত্যিই যখন type জানা না থাকে, তখনই শেষ উপায় হিসেবে ব্যবহার করো।

## Type Checking Tools

### `mypy` — Static Type Checker

```bash
# ইনস্টল
uv add mypy --dev

# চেক করো
mypy myproject/
```

```python
# mypy ধরবে:
def add(a: int, b: int) -> int:
    return a + b

result = add(5, "hello")  # error: Argument 2 has incompatible type "str"
```

### `pyright` / Pylance — Faster Type Checker

```bash
# standalone
uv add pyright --dev
pyright myproject/

# বা VS Code এ Pylance extension (built-in pyright)
```

> [!tip]
> `pyright` (আর VS Code এর Pylance) অনেক fast আর real-time feedback দেয় — টাইপ করার সাথে সাথে error দেখায়। `mypy` CI/CD pipeline এর জন্য ভালো। দুটোই popular, তোমার পছন্দ মতো বেছে নাও।

## Before / After — বাস্তব উদাহরণ

```python
# ❌ Before — কিছুই স্পষ্ট না
def get_stats(data):
    result = {}
    result["mean"] = sum(data) / len(data)
    result["count"] = len(data)
    if len(data) > 1:
        variance = sum((x - result["mean"]) ** 2 for x in data) / (len(data) - 1)
        result["std"] = variance ** 0.5
    return result

stats = get_stats([1, 2, 3])
print(stats["meen"])  # KeyError! typo কিন্তু runtime এ ধরা দেবে
```

```python
# ✅ After — সব স্পষ্ট
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
print(stats.mean)  # 2.0 — attribute access, typo করলে IDE ধরবে!
print(stats.count) # 3
print(stats.std)   # 1.0
```

## Summary

Type hints দিয়ে code self-documenting হয়, IDE support ভালো হয়, bug আগে ধরা পড়ে। Modern syntax ব্যবহার করো — `list[int]` (typing.List না), `X | None` (Optional না), PEP 695 generic syntax। `TypedDict` আর `Protocol` দিয়ে জটিল type model করো। `mypy` বা `pyright` দিয়ে check করো। 2026 এ type hints ছাড়া serious Python project কল্পনায় ও নেই।