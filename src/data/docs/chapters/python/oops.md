# Object Oriented Programming (OOP)

OOP মানে হলো — সত্যি দুনিয়ার জিনিসকে কোডে তুলে ধরা। যেমন "গাড়ি", "ব্যাংক অ্যাকাউন্ট", "প্রাণী" — এসব একেকটা object। OOP তে আমরা `class` বানিয়ে সেখান থেকে `object` তৈরি করি।

## Class আর Object

**Class** হলো blueprint (নকশা)। **Object** হলো সেই নকশা থেকে বানানো আসল জিনিস। যেমন — "গাড়ি" হলো class, আর তোমার সামনের টোয়োটা গাড়িটা হলো object।

```python
class Car:
    def __init__(self, brand, model, year):
        self.brand = brand
        self.model = model
        self.year = year

    def start_engine(self):
        print(f"{self.brand} {self.model} এর engine চালু!")

# object তৈরি
my_car = Car("Toyota", "Corolla", 2024)
my_car.start_engine()   # Toyota Corolla এর engine চালু!
```

## `__init__` আর `self`

`__init__` হলো constructor — object বানানোর সময় automatically call হয়। `self` হলো object নিজের reference — Java/C++ এর `this` এর মতো।

```python
class Student:
    def __init__(self, name, roll):
        self.name = name        # instance variable
        self.roll = roll

    def display(self):
        print(f"নাম: {self.name}, Roll: {self.roll}")

s1 = Student("Karim", 101)
s2 = Student("Sadia", 102)
s1.display()   # নাম: Karim, Roll: 101
s2.display()   # নাম: Sadia, Roll: 102
```

> [!tip]
> `self` সব method এর প্রথম parameter হিসেবে থাকবে। এটা Python এর নিয়ম। নাম `self` না হলে ও চলবে, কিন্তু convention হলো সবাই `self` লেখে।

## Method — Class এর ভেতরের Function

Class এর ভেতরের function কে method বলে। Object এর উপর call করা হয়:

```python
class Calculator:
    def add(self, a, b):
        return a + b

    def multiply(self, a, b):
        return a * b

calc = Calculator()
print(calc.add(5, 3))         # 8
print(calc.multiply(4, 2))    # 8
```

## Inheritance — উত্তরাধিকার

Inheritance দিয়ে এক class আরেকটা থেকে property আর method inherit করতে পারে। existing code reuse করা যায়:

```python
# Parent class
class Animal:
    def __init__(self, name):
        self.name = name

    def eat(self):
        print(f"{self.name} খাচ্ছে")

    def sleep(self):
        print(f"{self.name} ঘুমাচ্ছে")

# Child class — Animal থেকে inherit
class Dog(Animal):
    def bark(self):
        print(f"{self.name} ঘেউ ঘেউ করছে!")

# Child class
class Cat(Animal):
    def meow(self):
        print(f"{self.name} মিয়াও করছে!")

dog = Dog("Tommy")
dog.eat()     # Tommy খাচ্ছে  (Animal থেকে inherit)
dog.bark()    # Tommy ঘেউ ঘেউ করছে!

cat = Cat("Kitty")
cat.sleep()   # Kitty ঘুমাচ্ছে
cat.meow()    # Kitty মিয়াও করছে!
```

## Multi-level Inheritance

Inheritance chain হতে পারে — A → B → C:

```python
class Vehicle:
    def move(self):
        print("চলছি...")

class Car(Vehicle):
    def honk(self):
        print("বিপ বিপ!")

class SportsCar(Car):
    def turbo(self):
        print("🚀 Turbo mode!")

sc = SportsCar()
sc.move()    # Vehicle থেকে
sc.honk()    # Car থেকে
sc.turbo()   # নিজের
```

## super() — Parent এর Method Call

Child class থেকে parent এর method call করতে `super()` লাগে:

```python
class Animal:
    def __init__(self, name):
        self.name = name
        print(f"{self.name} জন্ম নিল")

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)    # parent এর __init__ call
        self.breed = breed
        print(f"{self.name} হলো {self.breed}")

d = Dog("Rex", "Labrador")
# Rex জন্ম নিল
# Rex হলো Labrador
```

## Polymorphism — একই Method, ভিন্ন Behavior

Polymorphism মানে — একই নামের method বিভিন্ন class এ ভিন্নভাবে কাজ করে:

```python
class Bird:
    def sound(self):
        print("চিক চিক")

class Dog:
    def sound(self):
        print("ঘেউ ঘেউ")

class Cat:
    def sound(self):
        print("মিয়াও")

# একই method, ভিন্ন object
animals = [Bird(), Dog(), Cat()]
for animal in animals:
    animal.sound()
# চিক চিক
# ঘেউ ঘেউ
# মিয়াও
```

## Encapsulation — Private Variable

Encapsulation দিয়ে ডেটা লুকানো যায়, শুধু method দিয়ে access করা যায়। Python এ `_` বা `__` underscore দিয়ে private indicate করা হয়:

```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self._balance = balance    # _ দিয়ে protected

    def deposit(self, amount):
        if amount > 0:
            self._balance += amount
            print(f"{amount} জমা হলো")

    def withdraw(self, amount):
        if 0 < amount <= self._balance:
            self._balance -= amount
            print(f"{amount} তুলে নিলে")
        else:
            print("পর্যাপ্ত balance নেই!")

    def get_balance(self):
        return self._balance

acc = BankAccount("Karim", 5000)
acc.deposit(2000)       # 2000 জমা হলো
acc.withdraw(1000)      # 1000 তুলে নিলে
print(f"Balance: {acc.get_balance()}")  # Balance: 6000
```

> [!warn]
> Python এ `_balance` কে technically access করা যায় — এটা শুধু convention। `__balance` (double underscore) দিলে name mangling হয়, সেটা একটু বেশি protected। কিন্তু পুরোপুরি private হয় না Python এ।

## রিয়েল উদাহরণ — Library System

```python
class Book:
    def __init__(self, title, author):
        self.title = title
        self.author = author
        self.is_borrowed = False

    def __str__(self):
        status = "ধারে" if self.is_borrowed else "available"
        return f"'{self.title}' by {self.author} ({status})"


class Library:
    def __init__(self):
        self.books = []

    def add_book(self, book):
        self.books.append(book)
        print(f"যোগ হলো: {book.title}")

    def borrow(self, title):
        for book in self.books:
            if book.title == title and not book.is_borrowed:
                book.is_borrowed = True
                print(f"তুমি ধার নিলে: {book.title}")
                return
        print("বই পাওয়া যায় নি")

    def show_all(self):
        for book in self.books:
            print(book)


lib = Library()
lib.add_book(Book("Python Basics", "Guido"))
lib.add_book(Book("Deep Learning", "Goodfellow"))
lib.borrow("Python Basics")
lib.show_all()
```

> [!example]
> এই Library class এ encapsulation (`self.books`), আর composition (Library এর ভেতরে Book object) দেখানো হয়েছে। এটাই real-world OOP design।

## Summary

OOP তে class হলো blueprint, object হলো instance। Inheritance দিয়ে code reuse, polymorphism দিয়ে flexibility, encapsulation দিয়ে protection। এগুলো দিয়েই real-world software বানানো হয়।