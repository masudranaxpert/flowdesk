# Enums ও Pattern Matching

Enums হলো Rust এর সবচেয়ে শক্তিশালী feature এর একটা। Python/C++ এর enum এর চেয়ে অনেক বেশি — Rust এর enum প্রতিটা variant এ data বহন করতে পারে। এর সাথে **pattern matching** যুক্ত হলে এটা Rust এর অন্যতম সেরা feature।

## Enum তৈরি

সহজ enum — C++ এর মতো:

```rust
enum Direction {
    Up,
    Down,
    Left,
    Right,
}

fn main() {
    let go = Direction::Up;

    match go {
        Direction::Up => println!("উপরে"),
        Direction::Down => println!("নিচে"),
        Direction::Left => println!("বামে"),
        Direction::Right => println!("ডানে"),
    }
}
```

## Enum এ Data — Rust এর ম্যাজিক

Rust এর enum শুধু label নয় — প্রতিটা variant এ data থাকতে পারে:

```rust
enum Message {
    Quit,                          // কোনো data নেই
    Move { x: i32, y: i32 },       // Named fields (struct এর মতো)
    Write(String),                 // Single value
    ChangeColor(i32, i32, i32),    // Multiple values (tuple এর মতো)
}

fn main() {
    let msg1 = Message::Move { x: 10, y: 20 };
    let msg2 = Message::Write(String::from("hello"));
    let msg3 = Message::ChangeColor(255, 0, 0);

    process(msg1);
    process(msg2);
    process(msg3);
}

fn process(msg: Message) {
    match msg {
        Message::Quit => println!("Quit"),
        Message::Move { x, y } => println!("Move to ({}, {})", x, y),
        Message::Write(text) => println!("Write: {}", text),
        Message::ChangeColor(r, g, b) => println!("Color: rgb({},{},{})", r, g, b),
    }
}
```

> [!tip]
> এটাই Rust এর সবচেয়ে বড় innovation! Python/C++ এ এটা করতে হলে inheritance বা tagged union লাগতো। Rust এ enum একই সাথে type-safe আর data-carrying। C++ এর `std::variant` বা Python এর Union type এর অনেক বেশি powerful।

## `Option<T>` — Null এর সমাধান

Rust এ `null` নেই! এর বদলে `Option<T>` type আছে। Tony Hoare (null এর inventor) নিজেই null কে "billion dollar mistake" বলেছেন। Rust এটা fix করেছে:

```rust
enum Option<T> {
    Some(T),   // value আছে
    None,      // value নেই
}
```

### ব্যবহার

```rust
fn find_user(id: u32) -> Option<String> {
    if id == 1 {
        Some(String::from("Karim"))
    } else {
        None
    }
}

fn main() {
    let user = find_user(1);

    match user {
        Some(name) => println!("User found: {}", name),
        None => println!("User not found"),
    }

    // unwrap — value বের করো (None হলে panic)
    let name = find_user(1).unwrap();  // "Karim"

    // unwrap_or — default দাও
    let name = find_user(99).unwrap_or_else(|| "Unknown".to_string());
}
```

> [!danger]
> Python এ `None` return হলে কোড চলতেই থাকে — পরে কোথাও crash। Rust এ `Option` return হলে compiler তোমাকে **বাধ্য** করবে None case handle করতে। এটাই null safety — compile-time guarantee।

### Option এর helper method

```rust
let x: Option<i32> = Some(5);

x.is_some()       // true
x.is_none()       // false
x.unwrap()        // 5 (None হলে panic)
x.unwrap_or(0)    // 5 (None হলে 0)
x.map(|v| v * 2)  // Some(10)
x.and_then(|v| Some(v + 1))  // Some(6)
x.filter(|v| *v > 3)         // Some(5)
```

## `Result<T, E>` — Error Handling

Error handling এর জন্য Rust এ `Result` type:

```rust
enum Result<T, E> {
    Ok(T),    // Success
    Err(E),   // Error
}
```

```rust
use std::num::ParseIntError;

fn parse_number(s: &str) -> Result<i32, ParseIntError> {
    s.parse::<i32>()
}

fn main() {
    match parse_number("42") {
        Ok(n) => println!("Number: {}", n),
        Err(e) => println!("Error: {}", e),
    }

    match parse_number("abc") {
        Ok(n) => println!("Number: {}", n),
        Err(e) => println!("Error: {}", e),  // Error: invalid digit found in string
    }
}
```

> [!note]
> Error handling নিয়ে পরের chapter গুলোতে বিস্তারিত আলোচনা হবে। আপাতত জেনে রাখো — `Result` আর `Option` দুটোই enum। Rust এ error আর null দুটোই enum দিয়ে handle হয়।

## Pattern Matching — `match`

`match` হলো Rust এর সবচেয়ে শক্তিশালী tool। এটা C/C++ এর `switch` এর অনেক বেশি:

### Destructuring

```rust
enum Shape {
    Circle(f64),
    Rectangle(f64, f64),
    Triangle(f64, f64, f64),
}

fn area(shape: Shape) -> f64 {
    match shape {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Rectangle(w, h) => w * h,
        Shape::Triangle(a, b, c) => {
            let s = (a + b + c) / 2.0;
            (s * (s - a) * (s - b) * (s - c)).sqrt()
        }
    }
}
```

### Binding আর Guards

```rust
enum Temperature {
    Celsius(f64),
    Fahrenheit(f64),
}

fn describe(temp: Temperature) {
    match temp {
        Temperature::Celsius(t) if t < 0.0 => println!("বরফ!"),
        Temperature::Celsius(t) if t < 20.0 => println!("ঠান্ডা"),
        Temperature::Celsius(t) if t < 30.0 => println!("আরাম"),
        Temperature::Celsius(t) => println!("গরম! {}°C", t),
        Temperature::Fahrenheit(t) => println!("{}°F", t),
    }
}
```

### Multiple Patterns আর Range

```rust
let n = 5;

match n {
    1 | 2 | 3 => println!("Small"),
    4..=7 => println!("Medium"),       // inclusive range
    8..=100 => println!("Large"),
    _ => println!("Huge or negative"),
}
```

### Binding with `@`

```rust
match age {
    n @ 0..=12 => println!("Child: {}", n),
    n @ 13..=19 => println!("Teen: {}", n),
    n @ 20..=100 => println!("Adult: {}", n),
    _ => println!("Invalid"),
}
```

## `if let` আর `while let`

শুধু একটা pattern match করতে চাইলে ছোট syntax:

```rust
let some_value = Some(42);

// match দিয়ে
match some_value {
    Some(v) => println!("{}", v),
    _ => {},
}

// if let দিয়ে — ছোট
if let Some(v) = some_value {
    println!("{}", v);
}

// while let — loop সহ
let mut stack = vec![1, 2, 3];
while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

> [!tip]
> `if let` ব্যবহার করো যখন শুধু একটা case দরকার। পুরো exhaustive matching দরকার হলে `match` ব্যবহার করো। `match` তোমাকে সব case cover করতে বাধ্য করবে — safety guarantee।

## Enum এ Method — `impl`

Enum এও struct এর মতো method লেখা যায়:

```rust
impl Message {
    fn call(&self) {
        match self {
            Message::Quit => println!("Quitting"),
            Message::Move { x, y } => println!("Moving to ({}, {})", x, y),
            Message::Write(s) => println!("Writing: {}", s),
            Message::ChangeColor(r, g, b) => println!("RGB: ({}, {}, {})", r, g, b),
        }
    }
}
```

## Python vs Rust — Enum তুলনা

```python
# Python — dataclass দিয়ে approximate
from dataclasses import dataclass
from typing import Union

@dataclass
class Move: x: int; y: int
@dataclass
class Write: text: str
class Quit: pass

Message = Union[Quit, Move, Write]

# match নেই (Python 3.10 এ এসেছে, কিন্তু exhaustive না)
```

```rust
// Rust — native enum
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

// match — exhaustive, compiler-enforced
```

> [!example]
> Python 3.10 এ `match` এসেছে, কিন্তু exhaustive check করে না — কোনো case miss করলেও চলে। Rust এ compiler জোর করে সব case handle করতে বলে। এটাই Rust এর safety advantage।

## বাস্তব উদাহরণ — State Machine

```rust
#[derive(Debug)]
enum GameState {
    Menu,
    Playing { score: u32, lives: u8 },
    Paused { score: u32, lives: u8 },
    GameOver { final_score: u32 },
}

impl GameState {
    fn next(self) -> Self {
        match self {
            GameState::Menu => GameState::Playing { score: 0, lives: 3 },
            GameState::Playing { score, lives } if lives == 0 => {
                GameState::GameOver { final_score: score }
            }
            GameState::Playing { score, lives } => {
                GameState::Paused { score, lives }
            }
            GameState::Paused { score, lives } => {
                GameState::Playing { score, lives }
            }
            GameState::GameOver { .. } => GameState::Menu,
        }
    }
}

fn main() {
    let state = GameState::Menu;
    let state = state.next();
    let state = GameState::Playing { score: 100, lives: 0 };
    let state = state.next();
    println!("{:?}", state);  // GameOver { final_score: 100 }
}
```

## Summary

Enums আর pattern matching হলো Rust এর অন্যতম সেরা feature। Enum variant এ data বহন করতে পারে, `match` দিয়ে exhaustive pattern matching করা যায়, `Option` দিয়ে null safety, `Result` দিয়ে error handling। পরের chapter এ দেখবো collections — Vec আর HashMap।