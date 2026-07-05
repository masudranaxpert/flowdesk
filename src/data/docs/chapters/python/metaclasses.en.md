# Metaclasses and Descriptors

Metaclasses and descriptors are Python's most advanced topics. Understanding them will make Python's inner mechanisms clear to you. But be careful — you won't need these much in day-to-day code. However, if you're building frameworks or designing libraries, knowing them is essential.

## Everything Is an Object

In Python, everything is an object — numbers, strings, functions, and even classes:

```python
class Dog:
    def bark(self):
        return "woof!"

d = Dog()
print(type(d))    # <class '__main__.Dog'> — d is an instance of Dog
print(type(Dog))  # <class 'type'> — the Dog class itself is an instance of type!
```

> [!note]
> The `Dog` class is itself an object — it's an instance of `type`. The thing that creates instances is called a metaclass. In Python, the default metaclass is `type`.

## `type` — The Default Metaclass

`type` actually works in two ways:
1. `type(obj)` — shows the type of an object
2. `type(name, bases, dict)` — dynamically creates a class!

```python
# The usual way to create a class
class Cat:
    species = "feline"
    def meow(self):
        return "meow!"

# The same thing using type
Cat2 = type(
    "Cat2",                           # class name
    (),                               # base classes
    {"species": "feline", "meow": lambda self: "meow!"}  # attributes
)

c = Cat2()
print(c.species)  # feline
print(c.meow())   # meow!
print(type(Cat2)) # <class 'type'>
```

## Writing a Custom Metaclass

```python
class LoggedMeta(type):
    """Logs every class creation"""
    def __new__(mcs, name, bases, namespace):
        print(f"🔧 Creating class: {name}")
        cls = super().__new__(mcs, name, bases, namespace)
        return cls


class Animal(metaclass=LoggedMeta):
    pass
# 🔧 Creating class: Animal

class Dog(Animal):
    pass
# 🔧 Creating class: Dog

class Cat(Animal):
    pass
# 🔧 Creating class: Cat
```

> [!tip]
> A metaclass's `__new__` method is called when the class is created — not when instances are created. This gives you an opportunity to modify the class itself. But usually you won't need this — see the easier alternatives below.

## A Real Metaclass Example — Plugin Registry

```python
class PluginRegistry(type):
    """Automatically registers all subclasses"""
    registry: dict[str, type] = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:  # the base class itself won't be registered
            PluginRegistry.registry[name] = cls
        return cls


class Plugin(metaclass=PluginRegistry):
    """Base plugin class"""
    def run(self):
        raise NotImplementedError


class CSVPlugin(Plugin):
    def run(self):
        return "CSV processing"

class JSONPlugin(Plugin):
    def run(self):
        return "JSON processing"


print(PluginRegistry.registry)
# {'CSVPlugin': <class 'CSVPlugin'>, 'JSONPlugin': <class 'JSONPlugin'>}
```

> [!example]
> This is a real-world pattern — Django's ModelBase and Flask's extension registry work exactly this way. When you define a class, it gets registered automatically — no manual registration needed.

## `__init_subclass__` — An Easier Alternative to Metaclasses

In Python 3.6+, `__init_subclass__` eliminates the need for metaclasses in many cases:

```python
class Plugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str | None = None, **kwargs):
        super().__init_subclass__(**kwargs)
        # Called when each subclass is created
        plugin_name = name or cls.__name__
        Plugin.registry[plugin_name] = cls
        print(f"✅ Plugin registered: {plugin_name}")

    def run(self):
        raise NotImplementedError


class CSVPlugin(Plugin, name="csv"):
    def run(self):
        return "CSV processing"
# ✅ Plugin registered: csv

class JSONPlugin(Plugin, name="json"):
    def run(self):
        return "JSON processing"
# ✅ Plugin registered: json

print(Plugin.registry)  # {'csv': ..., 'json': ...}
```

> [!tip]
> In 90% of cases, `__init_subclass__` gets the job done — no metaclass needed. It's much simpler, more readable, and works properly with inheritance. Try this first, and use metaclasses as a last resort.

## Descriptors — Attribute Access Control

A descriptor is an object that implements `__get__`, `__set__`, or `__delete__` methods. When used as a class attribute, these methods are called during attribute access:

```python
class ValidatedString:
    """Validates a string attribute — cannot be empty"""

    def __init__(self, min_length: int = 0):
        self.min_length = min_length

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f"_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private_name, "")

    def __set__(self, obj, value):
        if not isinstance(value, str):
            raise TypeError(f"{self.name} must be a string")
        if len(value) < self.min_length:
            raise ValueError(
                f"{self.name} must be at least {self.min_length} characters long"
            )
        setattr(obj, self.private_name, value)


class User:
    username = ValidatedString(min_length=3)
    email = ValidatedString(min_length=5)

    def __init__(self, username: str, email: str):
        self.username = username  # __set__ will be called
        self.email = email


user = User("Karim", "karim@example.com")
print(user.username)  # Karim

# user = User("ab", "x")  ← ValueError!
# username must be at least 3 characters long
```

> [!example]
> Descriptors let you build reusable validation logic. Both `username` and `email` use the same `ValidatedString` descriptor — no need to write separate validation code. Django's Model fields and SQLAlchemy's Columns — they're all descriptors!

## `@property` Is Actually a Descriptor

```python
class Property:
    """Simplified version of Python's built-in property"""

    def __init__(self, fget=None, fset=None):
        self.fget = fget
        self.fset = fset

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if self.fget is None:
            raise AttributeError("unreadable attribute")
        return self.fget(obj)

    def __set__(self, obj, value):
        if self.fset is None:
            raise AttributeError("can't set attribute")
        self.fset(obj, value)

    def setter(self, fset):
        return type(self)(self.fget, fset)


# This basically works like @property
class Temperature:
    def __init__(self, celsius: float):
        self._celsius = celsius

    @Property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("Cannot go below absolute zero!")
        self._celsius = value
```

> [!note]
> `@property` is actually a built-in descriptor! It implements `__get__` and `__set__`. When you use `@property`, a descriptor object gets added as a class attribute.

## When Do You Need Metaclasses/Descriptors?

| Use Case | What You Need |
|----------|---------------|
| Validating class attributes | **Descriptor** |
| Read-only / computed property | **`@property`** (descriptor shorthand) |
| Auto-register subclasses | **`__init_subclass__`** |
| Intercepting class creation | **Metaclass** (very rare) |
| ORM / Model field system | **Descriptor + Metaclass** |
| Regular project | **None of these** |

> [!warn]
> **"If you're not sure whether you need a metaclass, you probably don't."** This is a famous quote in the Python community. In most cases, `__init_subclass__`, `@property`, or a simple class hierarchy will do the job. Metaclasses are only needed for framework and library design.

## Summary

A metaclass is a "class for classes" — `type` is the default metaclass. Custom metaclasses let you intercept class creation. But in most cases, `__init_subclass__` is a much easier alternative. A descriptor is an object that implements `__get__`/`__set__` — `@property` is actually a descriptor. Understanding these makes Python's inner mechanisms clear, but you won't need them much in day-to-day code.