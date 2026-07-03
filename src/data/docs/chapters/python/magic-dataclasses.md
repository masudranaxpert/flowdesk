Magic methods (dunder methods), dataclass আর property — এই তিনটা দিয়ে Python class গুলো আরও powerful আর clean হয়। চলো দেখি কিভাবে।

## Magic Methods (Dunder Methods)

`__init__`, `__str__`, `__repr__` — এই double-underscore ওয়ালা গুলোকে magic method বা dunder method বলে। Python internally এগুলো call করে।

```python
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def __repr__(self):
        # developer এর জন্য — debugging এ দেখায়
        return f"Product(name={self.name!r}, price={self.price})"

    def __str__(self):
        # user এর জন্য — print এ দেখায়
        return f"{self.name} — ৳{self.price}"

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

print(p1)           # Laptop — ৳80000 (__str__)
print(repr(p1))     # Product(name='Laptop', price=80000) (__repr__)
print(p1 < p2)      # False  (__lt__)
print(p1 == p2)     # False  (__eq__)
print(len(p1))      # 6  (__len__)
```

### Sorting এর জন্য `__lt__`

```python
products = [
    Product("Phone", 50000),
    Product("Tablet", 30000),
    Product("Laptop", 80000),
]

# __lt__ থাকলে sort করা যায়
products.sort()
for p in products:
    print(p)
# Tablet — ৳30000
# Phone — ৳50000
# Laptop — ৳80000
```

### Container Behavior — `__getitem__` আর `__len__`

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


pl = Playlist("বাংলা গান", ["Ei Obelay", "Amar Sonar Bangla", "Pithuture"])

print(len(pl))           # 3
print(pl[0])             # Ei Obelay
print(pl[-1])            # Pithuture
print("Amar Sonar Bangla" in pl)  # True

# এমনকি iterate ও করা যায়!
for song in pl:
    print(f"🎵 {song}")
```

> [!tip]
> `__getitem__` থাকলে Python automatically `for x in obj` এ iterate করতে পারে। আলাদা `__iter__` লেখার দরকার নেই সব ক্ষেত্রে।

## `@property` — Controlled Attribute Access

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius  # setter চলবে

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("পরম শূন্যের নিচে যাওয়া যায় না!")
        self._celsius = value


t = Temperature(25)
print(t.fahrenheit)  # 77.0

t.celsius = 100
print(t.fahrenheit)  # 212.0

# t.celsius = -300  ← ValueError!
```

> [!note]
> `@property` দিয়ে একটা attribute কে read-only বা validated বানানো যায়। বাইরে থেকে মনে হয় সাধারণ attribute, কিন্তু ভেতরে logic চলে। এটাই Pythonic encapsulation।

## `@dataclass` — Boilerplate মুছে ফেলো

পুরোনো উপায়ে class লিখলে অনেক boilerplate:

```python
# ❌ পুরোনো — verbose
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

একই জিনিস dataclass দিয়ে এক লাইনে:

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
print(p1 == p2)           # True — automatically __eq__
print(p1.total_value())   # 400000
```

### Frozen Dataclass — Immutable

```python
@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(3, 5)
# p.x = 10  ← FrozenInstanceError! change করা যায় না

# frozen থাকলে set এ বা dict key হিসেবে ব্যবহার করা যায়
points = {Point(1, 2), Point(3, 4), Point(1, 2)}
print(len(points))  # 2 (duplicate removed)
```

> [!example]
> Mutable default value (যেমন `tags: list = []`) কখনো directly default হিসেবে দেওয়া যায় না — সব instance same list share করবে! এর জন্য `field(default_factory=list)` ব্যবহার করো। এটা একটা খুব common gotcha।

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
    print("অর্ডার প্রসেস হচ্ছে...")
```

> [!tip]
> Magic numbers (যেমন `status = 1` মানে pending) এর জায়গায় Enum ব্যবহার করো। Code পড়তে সহজ হয়, আর IDE এ autocomplete পাওয়া যায়।

## `__slots__` — Memory Optimization

```python
# সাধারণ class — প্রতি object এ একটা __dict__ থাকে (বেশি memory)
class PointDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# __slots__ দিলে __dict__ থাকে না — অনেক কম memory
class PointSlots:
    __slots__ = ('x', 'y')

    def __init__(self, x, y):
        self.x = x
        self.y = y


import sys
p1 = PointDict(1, 2)
p2 = PointSlots(1, 2)
print(sys.getsizeof(p1.__dict__))  # ~104 bytes
# p2 এর __dict__ ই নেই — অনেক কম memory!
```

> [!warn]
> `__slots__` দিলে dynamically new attribute যোগ করা যায় না — `p2.z = 5` error দেবে। শুধু যখন লক্ষ লক্ষ object তৈরি করতে হবে আর memory বাঁচানো দরকার, তখনই ব্যবহার করো। সাধারণ project এ দরকার হয় না।

## Summary

Magic methods দিয়ে class গুলো Pythonic হয় — sort, compare, iterate সব natural। `@property` দিয়ে controlled access। `@dataclass` দিয়ে boilerplate মুছে ফেলো। Enum দিয়ে magic numbers দূর করো। `__slots__` শুধু memory-critical case এ।