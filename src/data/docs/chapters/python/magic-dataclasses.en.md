# Magic Methods, Dataclasses & Properties

Magic methods (dunder methods), dataclass, and property — these three make Python classes much more powerful and clean. Let's see how.

## Magic Methods (Dunder Methods)

`__init__`, `__str__`, `__repr__` — these double-underscore methods are called magic methods or dunder methods. Python calls them internally.

```python
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def __repr__(self):
        # For developers — shows up in debugging
        return f"Product(name={self.name!r}, price={self.price})"

    def __str__(self):
        # For users — shows up in print
        return f"{self.name} — ${self.price}"

    def __eq__(self, other):
        if not isinstance(other, Product):
            return NotImplemented
        return self.price == other.price

    def __lt__(self, other):
        return self.price < other.price

    def __len__(self):
        return len(self.name)


p1 = Product("Laptop", 80000)
p2 = Product("Phone", 50000)

print(p1)           # Laptop — $80000 (__str__)
print(repr(p1))     # Product(name='Laptop', price=80000) (__repr__)
print(p1 < p2)      # False  (__lt__)
print(p1 == p2)     # False  (__eq__)
print(len(p1))      # 6  (__len__)
```

### `__lt__` for Sorting

```python
products = [
    Product("Phone", 50000),
    Product("Tablet", 30000),
    Product("Laptop", 80000),
]

# With __lt__, you can sort
products.sort()
for p in products:
    print(p)
# Tablet — $30000
# Phone — $50000
# Laptop — $80000
```

### Container Behavior — `__getitem__` and `__len__`

```python
class Playlist:
    def __init__(self, name, songs):
        self.name = name
        self.songs = songs

    def __len__(self):
        return len(self.songs)

    def __getitem__(self, index):
        return self.songs[index]

    def __contains__(self, item):
        return item in self.songs


pl = Playlist("My Songs", ["Ei Obelay", "Amar Sonar Bangla", "Pithuture"])

print(len(pl))           # 3
print(pl[0])             # Ei Obelay
print(pl[-1])            # Pithuture
print("Amar Sonar Bangla" in pl)  # True

# You can even iterate over it!
for song in pl:
    print(f"🎵 {song}")
```

> [!tip]
> If you have `__getitem__`, Python can automatically iterate with `for x in obj`. You don't always need to write a separate `__iter__`.

## `@property` — Controlled Attribute Access

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius  # setter will run

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("Cannot go below absolute zero!")
        self._celsius = value


t = Temperature(25)
print(t.fahrenheit)  # 77.0

t.celsius = 100
print(t.fahrenheit)  # 212.0

# t.celsius = -300  ← ValueError!
```

> [!note]
> With `@property`, you can make an attribute read-only or validated. From the outside, it looks like a regular attribute, but inside there's logic running. This is Pythonic encapsulation.

## `@dataclass` — Eliminate Boilerplate

The old way of writing classes has a lot of boilerplate:

```python
# ❌ Old way — verbose
class ProductOld:
    def __init__(self, name, price, quantity=0):
        self.name = name
        self.price = price
        self.quantity = quantity

    def __repr__(self):
        return f"ProductOld(name={self.name!r}, price={self.price}, quantity={self.quantity})"

    def __eq__(self, other):
        if not isinstance(other, ProductOld):
            return NotImplemented
        return (self.name, self.price, self.quantity) == (other.name, other.price, other.quantity)
```

The same thing with a dataclass in one line:

```python
from dataclasses import dataclass, field


@dataclass
class Product:
    name: str
    price: float
    quantity: int = 0
    tags: list[str] = field(default_factory=list)

    def total_value(self) -> float:
        return self.price * self.quantity


p1 = Product("Laptop", 80000, 5)
p2 = Product("Laptop", 80000, 5)
p3 = Product("Phone", 50000, 3)

print(p1)                 # Product(name='Laptop', price=80000, quantity=5, tags=[])
print(p1 == p2)           # True — automatic __eq__
print(p1.total_value())   # 400000
```

### Frozen Dataclass — Immutable

```python
@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(3, 5)
# p.x = 10  ← FrozenInstanceError! Cannot change

# When frozen, you can use it in sets or as dict keys
points = {Point(1, 2), Point(3, 4), Point(1, 2)}
print(len(points))  # 2 (duplicate removed)
```

> [!example]
> A mutable default value (like `tags: list = []`) can never be used directly as a default — all instances would share the same list! Use `field(default_factory=list)` instead. This is a very common gotcha.

## `enum.Enum` — Named Constants

```python
from enum import Enum, auto


class OrderStatus(Enum):
    PENDING = auto()
    PROCESSING = auto()
    SHIPPED = auto()
    DELIVERED = auto()
    CANCELLED = auto()


order = OrderStatus.PROCESSING
print(order)              # OrderStatus.PROCESSING
print(order.name)         # PROCESSING
print(order.value)        # 2

if order == OrderStatus.PROCESSING:
    print("Order is being processed...")
```

> [!tip]
> Use Enum instead of magic numbers (like `status = 1` meaning pending). The code becomes easier to read, and you get autocomplete in your IDE.

## `__slots__` — Memory Optimization

```python
# Regular class — each object has a __dict__ (more memory)
class PointDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# With __slots__ — no __dict__ — much less memory
class PointSlots:
    __slots__ = ('x', 'y')

    def __init__(self, x, y):
        self.x = x
        self.y = y


import sys
p1 = PointDict(1, 2)
p2 = PointSlots(1, 2)
print(sys.getsizeof(p1.__dict__))  # ~104 bytes
# p2 doesn't even have a __dict__ — much less memory!
```

> [!warn]
> With `__slots__`, you can't dynamically add new attributes — `p2.z = 5` will give an error. Only use it when you need to create millions of objects and save memory. Regular projects don't need it.

## Summary

Magic methods make classes Pythonic — sorting, comparing, iterating all feel natural. `@property` gives controlled access. `@dataclass` eliminates boilerplate. Enum removes magic numbers. `__slots__` is only for memory-critical cases.