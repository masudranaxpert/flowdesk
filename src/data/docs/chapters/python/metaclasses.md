Metaclass আর descriptor হলো Python এর সবচেয়ে advanced topic। এগুলো জানলে Python এর ভেতরের mechanism স্পষ্ট হবে। তবে সতর্কতা — day-to-day code এ এগুলো খুব একটা দরকার হয় না। কিন্তু framework বানাতে বা library design করতে জানা থাকা জরুরি।

## সবকিছুই Object

Python এ সবকিছুই object — number, string, function, এমনকি class ও:

```python
class Dog:
    def bark(self):
        return "woof!"

d = Dog()
print(type(d))    # <class '__main__.Dog'> — d হলো Dog এর instance
print(type(Dog))  # <class 'type'> — Dog class নিজেই type এর instance!
```

> [!note]
> `Dog` class টা নিজে একটা object — এটা `type` এর instance। যেটা থেকে instance তৈরি হয় সেটাকে metaclass বলে। Python এ default metaclass হলো `type`।

## `type` — The Default Metaclass

`type` আসলে দুইভাবে কাজ করে:
1. `type(obj)` — object এর type দেখায়
2. `type(name, bases, dict)` — dynamically class তৈরি করে!

```python
# Class তৈরির পুরোনো উপায়
class Cat:
    species = "feline"
    def meow(self):
        return "meow!"

# একই জিনিস type দিয়ে
Cat2 = type(
    "Cat2",                           # class এর নাম
    (),                               # base class গুলো
    {"species": "feline", "meow": lambda self: "meow!"}  # attributes
)

c = Cat2()
print(c.species)  # feline
print(c.meow())   # meow!
print(type(Cat2)) # <class 'type'>
```

## Custom Metaclass লেখা

```python
class LoggedMeta(type):
    """প্রতিটা class creation এ log করে"""
    def __new__(mcs, name, bases, namespace):
        print(f"🔧 Class তৈরি হচ্ছে: {name}")
        cls = super().__new__(mcs, name, bases, namespace)
        return cls


class Animal(metaclass=LoggedMeta):
    pass
# 🔧 Class তৈরি হচ্ছে: Animal

class Dog(Animal):
    pass
# 🔧 Class তৈরি হচ্ছে: Dog

class Cat(Animal):
    pass
# 🔧 Class তৈরি হচ্ছে: Cat
```

> [!tip]
> Metaclass এর `__new__` method class create হওয়ার সময় call হয় — instance create হওয়ার সময় না। এটা class নিজেকে modify করার সুযোগ দেয়। কিন্তু সাধারণত এটার দরকার হয় না — নিচে সহজ বিকল্প দেখো।

## রিয়েল Metaclass উদাহরণ — Plugin Registry

```python
class PluginRegistry(type):
    """সব subclass কে automatically register করে"""
    registry: dict[str, type] = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:  # base class নিজে register হবে না
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
> এটা real-world pattern — Django এর ModelBase, Flask এর extension registry এভাবেই কাজ করে। Class define করলেই automatically register হয়, manually registration লাগে না।

## `__init_subclass__` — Metaclass এর সহজ বিকল্প

Python 3.6+ এ `__init_subclass__` দিয়ে অনেক ক্ষেত্রে metaclass এর দরকার নেই:

```python
class Plugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, name: str | None = None, **kwargs):
        super().__init_subclass__(**kwargs)
        # প্রতিটা subclass create হলে call হয়
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
> ৯০% ক্ষেত্রে `__init_subclass__` দিয়েই কাজ হয়ে যায় — metaclass এর দরকার নেই। এটা অনেক সহজ, readable, আর inheritance এ ও properly চলে। আগে এটা চেষ্টা করো, metaclass শেষ উপায়।

## Descriptors — Attribute Access Control

Descriptor হলো এমন object যেটা `__get__`, `__set__`, বা `__delete__` method implement করে। যখন এটা class attribute হিসেবে থাকে, attribute access এর সময় এর method গুলো call হয়:

```python
class ValidatedString:
    """String attribute validate করে — empty হতে পারবে না"""

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
            raise TypeError(f"{self.name} অবশ্যই string হতে হবে")
        if len(value) < self.min_length:
            raise ValueError(
                f"{self.name} অন্তত {self.min_length} অক্ষরের হতে হবে"
            )
        setattr(obj, self.private_name, value)


class User:
    username = ValidatedString(min_length=3)
    email = ValidatedString(min_length=5)

    def __init__(self, username: str, email: str):
        self.username = username  # __set__ call হবে
        self.email = email


user = User("Karim", "karim@example.com")
print(user.username)  # Karim

# user = User("ab", "x")  ← ValueError!
# username অন্তত 3 অক্ষরের হতে হবে
```

> [!example]
> Descriptor দিয়ে reusable validation logic বানানো যায়। `username` আর `email` দুটোতেই same `ValidatedString` descriptor ব্যবহার হলো — আলাদা validation code লেখা লাগল না। Django এর Model field, SQLAlchemy এর Column — সবই descriptor!

## `@property` আসলে Descriptor

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


# এটাই মূলত @property এর মতো কাজ করে
class Temperature:
    def __init__(self, celsius: float):
        self._celsius = celsius

    @Property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("পরম শূন্যের নিচে যাওয়া যায় না!")
        self._celsius = value
```

> [!note]
> `@property` আসলে একটা built-in descriptor! `__get__` আর `__set__` implement করা আছে। যখন `@property` ব্যবহার করো, আসলে একটা descriptor object class attribute হিসেবে যোগ হয়।

## কখন Metaclass/Descriptor দরকার?

| Use Case | কোনটা দরকার |
|----------|-------------|
| Class attribute validate করা | **Descriptor** |
| Read-only / computed property | **`@property`** (descriptor shorthand) |
| Subclass automatically register | **`__init_subclass__`** |
| Class creation intercept করা | **Metaclass** (খুব বিরল) |
| ORM / Model field system | **Descriptor + Metaclass** |
| সাধারণ project | **কোনোটাই না** |

> [!warn]
> **"Metaclass দরকার কিনা নিশ্চিত না হলে, তোমার সম্ভবত দরকার নেই।"** এটা Python community এর famous quote। বেশির ভাগ ক্ষেত্রে `__init_subclass__`, `@property`, বা simple class hierarchy দিয়েই কাজ হয়ে যায়। Metaclass শুধু framework আর library design এ দরকার।

## Summary

Metaclass হলো "class এর class" — `type` default metaclass। Custom metaclass দিয়ে class creation intercept করা যায়। কিন্তু বেশির ভাগ ক্ষেত্রে `__init_subclass__` অনেক সহজ বিকল্প। Descriptor হলো `__get__`/`__set__` implement করা object — `@property` আসলে একটা descriptor। এগুলো বুঝলে Python এর ভেতরের mechanism পরিষ্কার হয়, তবে day-to-day code এ খুব একটা লাগে না।