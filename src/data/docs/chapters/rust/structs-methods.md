# Structs ও Methods

Python এ class, C++ এ class/struct — Rust এ সেই জায়গায় **struct** আর **impl block**। Rust এর struct data আর behavior আলাদা রাখে — data struct এ, behavior `impl` block এ। চলো দেখি।

## Struct তৈরি

### Named Field Struct

```rust
struct User {
    username: String,
    email: String,
    age: u32,
    active: bool,
}

fn main() {
    let user1 = User {
        username: String::from("karim123"),
        email: String::from("karim@example.com"),
        age: 25,
        active: true,
    };

    println!("Name: {}", user1.username);
}
```

> [!note]
> Python এর class এর instance variable আর Rust এর struct field প্রায় একই। তবে Rust এর struct **immutable by default** — field modify করতে হলে পুরো struct টাকে `mut` করতে হবে। শুধু একটা field `mut` করা যায় না।

### Mutable Struct

```rust
let mut user1 = User {
    username: String::from("karim123"),
    email: String::from("karim@example.com"),
    age: 25,
    active: true,
};

user1.age = 26;  // পুরো struct mut হলেই field change করা যায়
```

### Field Init Shorthand

Variable আর field এর নাম একই হলে shorthand ব্যবহার করা যায়:

```rust
fn build_user(username: String, email: String) -> User {
    User {
        username,    // shorthand: username: username এর জায়গায় শুধু username
        email,       // shorthand
        age: 0,
        active: true,
    }
}
```

### Struct Update Syntax

আগের struct থেকে নতুন struct তৈরি:

```rust
let user2 = User {
    email: String::from("new@example.com"),
    ..user1    // বাকি সব field user1 থেকে নাও
};
// user1 এর ownership move হয়েছে (username String আছে)
```

> [!warn]
> `..user1` দিলে বাকি field গুলো move হয়ে যায় (ownership)। যদি সব field copy type হয় (যেমন সব `i32`), তখন user1 আরও valid থাকবে।

## Tuple Struct

Field এর নাম ছাড়া struct — tuple এর মতো:

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

let black = Color(0, 0, 0);
let origin = Point(0, 0, 0);

println!("R: {}", black.0);  // index দিয়ে access
```

> [!tip]
> `Color` আর `Point` দুটোরই field একই — কিন্তু এগুলো আলাদা type। `black` কে `Point` এর জায়গায় ব্যবহার করা যাবে না। এটা **type safety** — এটাই tuple struct এর মূল সুবিধা।

## Unit-Like Struct

কোনো field নেই এমন struct:

```rust
struct AlwaysEqual;

let subject = AlwaysEqual;
```

> [!note]
> এটা কখন লাগে? যখন type এ কোনো data লাগে না, কিন্তু behavior (trait implementation) দরকার। Rust এর trait system এ এটা কাজে লাগে।

## Methods — `impl` Block

Struct এর method লেখা হয় `impl` block এর ভেতরে:

```rust
struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    // Method — &self parameter
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }

    // Associated function (Python এর @staticmethod এর মতো) — no self
    fn square(size: f64) -> Rectangle {
        Rectangle { width: size, height: size }
    }
}

fn main() {
    let rect1 = Rectangle { width: 30.0, height: 50.0 };
    let rect2 = Rectangle { width: 10.0, height: 40.0 };

    println!("Area: {}", rect1.area());           // 1500
    println!("Can hold: {}", rect1.can_hold(&rect2)); // true

    let square = Rectangle::square(25.0);  // :: syntax
    println!("Square area: {}", square.area()); // 625
}
```

> [!example]
> খেয়াল করো — method এ `&self` (immutable reference), আর associated function এ `self` নেই। Python এ সব method এ `self` parameter বাধ্য, কিন্তু Rust এ `self` optional। Associated function ডাকা হয় `::` দিয়ে (`Rectangle::square`), method ডাকা হয় `.` দিয়ে (`rect1.area()`)।

### `self`, `&self`, `&mut self` — কখন কোনটা?

```rust
impl Rectangle {
    // Read করবে — &self
    fn area(&self) -> f64 { ... }

    // Modify করবে — &mut self
    fn scale(&mut self, factor: f64) {
        self.width *= factor;
        self.height *= factor;
    }

    // Ownership নিয়ে নেবে — self
    fn into_square(self) -> Rectangle {
        let avg = (self.width + self.height) / 2.0;
        Rectangle { width: avg, height: avg }
    }
}
```

| Form | Ownership | কখন ব্যবহার |
|------|-----------|------------|
| `&self` | Borrow (read) | শুধু data পড়বে |
| `&mut self` | Borrow (write) | Data modify করবে |
| `self` | Take ownership | Consumer — এরপর caller এর struct invalid |
| `&self` (default) | Most common | বেশিরভাগ method |

## Debug আর Display — `#[derive(Debug)]`

Struct print করতে চাইলে `Debug` trait derive করতে হবে:

```rust
#[derive(Debug)]
struct Rectangle {
    width: f64,
    height: f64,
}

fn main() {
    let rect = Rectangle { width: 30.0, height: 50.0 };
    println!("{:?}", rect);     // Rectangle { width: 30.0, height: 50.0 }
    println!("{:#?}", rect);    // Pretty print
}
```

> [!tip]
> Python এ সব কিছু print করা যায়। Rust এ না — struct এর জন্য `Debug` trait লাগে। `#[derive(Debug)]` দিলে compiler automatically এই trait implement করে দেয়। ডিবাগ করার সময় এটা খুব কাজে দেয়।

## আরও Derive Macro

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = p1.clone();
    println!("Equal: {}", p1 == p2);  // true
}
```

| Trait | কী করে | Python Equivalent |
|-------|--------|-------------------|
| `Debug` | `{:?}` format | `__repr__` |
| `Clone` | `.clone()` | `copy.deepcopy()` |
| `Copy` | Implicit copy | — |
| `PartialEq` | `==` operator | `__eq__` |
| `Hash` | HashMap key | `__hash__` |
| `Default` | Default value | — |

## বাস্তব উদাহরণ — Bank Account

```rust
#[derive(Debug)]
struct BankAccount {
    owner: String,
    balance: f64,
}

impl BankAccount {
    fn new(owner: &str, initial_balance: f64) -> Self {
        BankAccount {
            owner: owner.to_string(),
            balance: initial_balance,
        }
    }

    fn deposit(&mut self, amount: f64) {
        self.balance += amount;
        println!("{} টাকা জমা। Balance: {:.2}", amount, self.balance);
    }

    fn withdraw(&mut self, amount: f64) -> bool {
        if self.balance >= amount {
            self.balance -= amount;
            println!("{} টাকা তোলা হলো। Balance: {:.2}", amount, self.balance);
            true
        } else {
            println!("পর্যাপ্ত টাকা নেই! Balance: {:.2}", self.balance);
            false
        }
    }

    fn transfer(&mut self, target: &mut BankAccount, amount: f64) -> bool {
        if self.withdraw(amount) {
            target.deposit(amount);
            true
        } else {
            false
        }
    }
}

fn main() {
    let mut karim = BankAccount::new("Karim", 5000.0);
    let mut rahim = BankAccount::new("Rahim", 2000.0);

    karim.deposit(1000.0);
    karim.transfer(&mut rahim, 3000.0);

    println!("{:#?}", karim);
    println!("{:#?}", rahim);
}
```

> [!example]
> খেয়াল করো — `deposit` আর `withdraw` method গুলো `&mut self` নিয়েছে (balance change করছে)। `transfer` একটা অ্যাকাউন্ট থেকে আরেকটাতে টাকা পাঠাচ্ছে। পুরোটা type-safe আর ownership পরিষ্কার — কোনো race condition possible না।

## Python Class vs Rust Struct তুলনা

```python
# Python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height
```

```rust
// Rust
struct Rectangle { width: f64, height: f64 }

impl Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}
```

> [!note]
> Python এ data আর behavior একসাথে class এ। Rust এ data struct এ, behavior `impl` এ — আলাদা। এর সুবিধা হলো একই struct এর জন্য একাধিক `impl` block থাকতে পারে, আর trait implementation আলাদা করা যায়।

## Summary

Struct হলো Rust এর data structure — Python এর class এর data অংশ। Method লেখা হয় `impl` block এ। `&self`, `&mut self`, `self` — তিন রকম method parameter। `#[derive(Debug)]` দিয়ে print করা যায়। পরের chapter এ দেখবো **enums আর pattern matching** — Rust এর আরেকটা powerhouse feature।