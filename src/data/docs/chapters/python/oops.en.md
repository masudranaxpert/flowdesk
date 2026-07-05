# Object Oriented Programming (OOP)

OOP means — representing real-world things in code. Things like "car", "bank account", "animal" — each of these is an object. In OOP, we create a `class` and then make `object`s from it.

## Class and Object

A **Class** is a blueprint (design). An **Object** is the actual thing made from that blueprint. For example — "Car" is a class, and the Toyota parked in front of you is an object.

```python
class Car:
    def __init__(self, brand, model, year):
        self.brand = brand
        self.model = model
        self.year = year

    def start_engine(self):
        print(f"{self.brand} {self.model}'s engine started!")

# Creating an object
my_car = Car("Toyota", "Corolla", 2024)
my_car.start_engine()   # Toyota Corolla's engine started!
```

## `__init__` and `self`

`__init__` is the constructor — it gets called automatically when an object is created. `self` is a reference to the object itself — like `this` in Java/C++.

```python
class Student:
    def __init__(self, name, roll):
        self.name = name        # instance variable
        self.roll = roll

    def display(self):
        print(f"Name: {self.name}, Roll: {self.roll}")

s1 = Student("Karim", 101)
s2 = Student("Sadia", 102)
s1.display()   # Name: Karim, Roll: 101
s2.display()   # Name: Sadia, Roll: 102
```

> [!tip]
> `self` must be the first parameter of every method. That's the rule in Python. The name doesn't technically have to be `self`, but the convention is that everyone writes `self`.

## Method — A Function Inside a Class

A function inside a class is called a method. It's called on an object:

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

## Inheritance

With inheritance, one class can inherit properties and methods from another. This lets you reuse existing code:

```python
# Parent class
class Animal:
    def __init__(self, name):
        self.name = name

    def eat(self):
        print(f"{self.name} is eating")

    def sleep(self):
        print(f"{self.name} is sleeping")

# Child class — inherits from Animal
class Dog(Animal):
    def bark(self):
        print(f"{self.name} says woof woof!")

# Child class
class Cat(Animal):
    def meow(self):
        print(f"{self.name} says meow!")

dog = Dog("Tommy")
dog.eat()     # Tommy is eating  (inherited from Animal)
dog.bark()    # Tommy says woof woof!

cat = Cat("Kitty")
cat.sleep()   # Kitty is sleeping
cat.meow()    # Kitty says meow!
```

## Multi-level Inheritance

An inheritance chain can go like — A → B → C:

```python
class Vehicle:
    def move(self):
        print("Moving...")

class Car(Vehicle):
    def honk(self):
        print("Beep beep!")

class SportsCar(Car):
    def turbo(self):
        print("🚀 Turbo mode!")

sc = SportsCar()
sc.move()    # From Vehicle
sc.honk()    # From Car
sc.turbo()   # Its own
```

## super() — Calling a Parent's Method

To call a parent's method from a child class, you use `super()`:

```python
class Animal:
    def __init__(self, name):
        self.name = name
        print(f"{self.name} was born")

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)    # calling parent's __init__
        self.breed = breed
        print(f"{self.name} is a {self.breed}")

d = Dog("Rex", "Labrador")
# Rex was born
# Rex is a Labrador
```

## Polymorphism — Same Method, Different Behavior

Polymorphism means — the same named method works differently in different classes:

```python
class Bird:
    def sound(self):
        print("Chirp chirp")

class Dog:
    def sound(self):
        print("Woof woof")

class Cat:
    def sound(self):
        print("Meow")

# Same method, different objects
animals = [Bird(), Dog(), Cat()]
for animal in animals:
    animal.sound()
# Chirp chirp
# Woof woof
# Meow
```

## Encapsulation — Private Variables

With encapsulation, you can hide data and only allow access through methods. In Python, `_` or `__` underscores indicate private:

```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self._balance = balance    # _ means protected

    def deposit(self, amount):
        if amount > 0:
            self._balance += amount
            print(f"{amount} deposited")

    def withdraw(self, amount):
        if 0 < amount <= self._balance:
            self._balance -= amount
            print(f"{amount} withdrawn")
        else:
            print("Insufficient balance!")

    def get_balance(self):
        return self._balance

acc = BankAccount("Karim", 5000)
acc.deposit(2000)       # 2000 deposited
acc.withdraw(1000)      # 1000 withdrawn
print(f"Balance: {acc.get_balance()}")  # Balance: 6000
```

> [!warn]
> In Python, `_balance` is technically accessible — it's just a convention. With `__balance` (double underscore), name mangling happens, making it a bit more protected. But nothing is fully private in Python.

## Real Example — Library System

```python
class Book:
    def __init__(self, title, author):
        self.title = title
        self.author = author
        self.is_borrowed = False

    def __str__(self):
        status = "borrowed" if self.is_borrowed else "available"
        return f"'{self.title}' by {self.author} ({status})"


class Library:
    def __init__(self):
        self.books = []

    def add_book(self, book):
        self.books.append(book)
        print(f"Added: {book.title}")

    def borrow(self, title):
        for book in self.books:
            if book.title == title and not book.is_borrowed:
                book.is_borrowed = True
                print(f"You borrowed: {book.title}")
                return
        print("Book not found")

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
> This Library class demonstrates encapsulation (`self.books`) and composition (Book objects inside Library). This is real-world OOP design.

## Summary

In OOP, a class is the blueprint and an object is the instance. Inheritance gives you code reuse, polymorphism gives flexibility, and encapsulation gives protection. These are the building blocks of real-world software.