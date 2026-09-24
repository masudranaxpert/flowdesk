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

> [!note]
> **ভেতরে কী হচ্ছে?** এই field-less enum টা runtime এ আসলে **একটা ছোট integer** মাত্র — ৪টা variant, তাই `u8` ই যথেষ্ট: `std::mem::size_of::<Direction>()` দেবে `1`। `Direction::Up` মানে ভেতরে `0`, `Down` মানে `1` — এই সংখ্যাটার নাম **discriminant**। আর `match` compile হয় C এর `switch` এর মতো — discriminant পড়ে সরাসরি ঠিক branch এ jump। C++ enum থেকে পার্থক্য: সেখানে ভুল integer ঢুকিয়ে দিলে UB, এখানে `Direction` type ছাড়া অন্য কিছু ঢোকানোই সম্ভব না।

## Enum এ Data — Rust এর ম্যাজিক

Rust এর enum শুধু label নয় — প্রতিটা variant এ data থাকতে পারে:

```rust
enum Message {
    Quit,                          // Unit variant with no associated data
    Move { x: i32, y: i32 },       // Struct-like variant with named fields
    Write(String),                 // Single value
    ChangeColor(i32, i32, i32),    // Tuple-like variant with positional fields
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

### Enum ভেতরে Memory তে কীভাবে সাজানো?

Compiler একটা enum রাখে **tag + payload union** আকারে:

```text
Message এর জন্য:

┌───────────────┬─────────────────────────────────┐
│ discriminant  │ payload (union)                 │
│ (কোন variant) │ সব variant একই জায়গা share করে  │
└───────────────┴─────────────────────────────────┘

Quit          → tag=0, payload ফাঁকা
Move {x, y}   → tag=1, payload: (i32, i32)
Write(String) → tag=2, payload: String (২৪ byte)
```

- একসময়ে একটাই variant থাকে, তাই payload জায়গাটা সব variant **share** করে — union এর মতো। ধারণাটা: size = tag + সবচেয়ে বড় variant (+ alignment padding); উপরের `Message` এ সবচেয়ে বড় variant `Write(String)` (২৪ byte)।
- তবে বাস্তবে `repr(Rust)` এর exact layout compiler নিজে ঠিক করে — আর সে চালাক: `String`-এর মতো payload-এ niche থাকলে (pointer কখনো null না) **tag আলাদা করে বসায়ই না**, ভেতরের ফাঁকা bit pattern এ encode করে দেয়। তাই `size_of::<Message>()` মাপলে পাবে মাত্র **২৪ byte** — `String`-এর সমান, tag-এর জন্য একটা extra byte-ও নেই। নিচে `Option`-এর niche optimization এই একই ট্রিকের বিশেষ রূপ।

## `Option<T>` — Null এর সমাধান

Rust এ `null` নেই! এর বদলে `Option<T>` type আছে। Tony Hoare (null এর inventor) নিজেই null কে "billion dollar mistake" বলেছেন। Rust এটা fix করেছে:

```rust
enum Option<T> {
    Some(T),   // Contains wrapped value
    None,      // Represents absence of value
}
```


> [!note]
> **`Some(42)`-র গোড়ার গল্প:** আগের chapter গুলোতে `Some(42)` ব্যবহার করেছিলাম বলেছিলাম "পূর্ণ গল্প এখানে" — এই নাও। `Some` আর `None` কোনো function বা keyword না — উপরের enum-এর **দুটো variant**, আর prelude-এর কল্যাণে বিনা import-এ পাওয়া যায়। মজার অংশ: data বহন করা variant (`Some(T)`) নিজেই একটা **ছোট function** — `Some(42)` লিখলে ভেতরে ৪২ ঢুকিয়ে tagged value বানিয়ে দেয়, ঠিক function call-এর মতোই (চলবেও `let f = Some; let x = f(42);` — সত্যি!)। আর কেন দরকার: Rust-এ null নেই বলে "মান না-থাকা" একটা **type-এ বাঁধা অবস্থা** — function `Option<String>` return করলে caller কে `Some`/`None` দুটোই সামলাতেই হবে, compiler জোর করাবে। Python-এ `None` return করলে ভুলে গেলে পরে কোথাও `AttributeError` — Rust-এ সেই ভুল করার সুযোগই নেই।

এই ছোট enum এর layout টা কিন্তু চমকপ্রদ:

> [!note]
> **Niche optimization:** `&T` এর জগতে `0` (null address) কখনো valid reference হতে পারে না — Rust সেই ফাঁকা মানটাকে (niche) কাজে লাগায়। `None` বোঝাতে ভেতরের pointer টাকেই `0` লিখে দেয় — তাই **`Option<&T>` এর size `&T` এর সমান** (64-bit এ ৮ byte), আলাদা tag byte লাগে না! `Option<Box<T>>`, `Option<NonZeroU32>` ও একই সুবিধা পায়। বিপরীতে `Option<i32>` — প্রতিটা bit pattern ই valid মান, ফাঁকা কিছু নেই — তাই আলাদা tag লাগে: size হয় ৮ byte, value ৪ byte আর tag বসে বাকি padding এ। মানে `Option` ভারী কিছু না — বেশিরভাগ ক্ষেত্রেই zero-cost abstraction।

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

    // unwrap extracts value or panics on None:
    let name = find_user(1).unwrap();  // "Karim"

    // unwrap_or provides fallback default on None:
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
x.unwrap()        // Extracts 5 (panics if None)
x.unwrap_or(0)    // Extracts 5 (defaults to 0 if None)
x.map(|v| v * 2)  // Some(10)
x.and_then(|v| Some(v + 1))  // Some(6)
x.filter(|v| *v > 3)         // Some(5)
```

এই helper গুলোর ভেতরে সবাই একই কাঠামো — variant check + সেই অনুযায়ী কাজ:

```rust
// Conceptual internal representation:
pub fn unwrap(self) -> T {
    match self {
        Some(v) => v,
        None => panic!("called `Option::unwrap()` on a `None` value"),
    }
}

pub fn map<U, F: FnOnce(T) -> U>(self, f: F) -> Option<U> {
    match self {
        Some(v) => Some(f(v)),
        None => None,
    }
}
```

কোনো exception machinery নেই — প্রতিটা method একটা `match`: tag check + payload extract। `and_then` (flatMap), `filter`, `unwrap_or` সব একই ছাঁচে গড়া।

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

`Result<T, E>` এর layout ও ঠিক সেই একই ছাঁচের — tag + union। `Result<&T, &E>` ও niche optimization পায়, size থাকে reference এর সমান।

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

> [!note]
> **`match` কেন exhaustive check করে, ভেতরে কী হয়?** Compiler এর কাছে একটা **exhaustiveness checker** আছে — এটা গাণিতিক প্রমাণের মতো কাজ করে: তোমার pattern গুলো দিয়ে সব সম্ভাব্য value cover হয় কিনা হিসাব করে, আর কেউ বাদ পড়লে error এ **ঠিক কোন variant miss হলো** নাম ধরে বলে দেয়। এই check শুধু safety না — performance ও দেয়: সব case cover থাকলে compiler জানে কোনো fallback path দরকার নেই, তাই উপরের `Shape` এর মতো match compile হয় সরাসরি **jump table** এ (tag পড়ে index হিসাব, তারপর ওই branch এ লাফ) — `if-else` chain এর চেয়ে অনেক দ্রুত। Guard (`if t < 0.0`) ঢুকলে jump table আর সম্ভব না, তখন হয় সাজানো branch chain।

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

// Exhaustive matching via match expression:
match some_value {
    Some(v) => println!("{}", v),
    _ => {},
}

// Single-pattern handling via if let:
if let Some(v) = some_value {
    println!("{}", v);
}

// Pattern-driven loop via while let:
let mut stack = vec![1, 2, 3];
while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

> [!tip]
> `if let` ব্যবহার করো যখন শুধু একটা case দরকার। পুরো exhaustive matching দরকার হলে `match` ব্যবহার করো। `match` তোমাকে সব case cover করতে বাধ্য করবে — safety guarantee।

ভেতরের কথা: `if let` আসলে match এরই **syntactic sugar** — compiler দুটোকে একইভাবে compile করে:

```rust
// Desugared representation:
if let PATTERN = value { body }
// Expanded output:
match value {
    PATTERN => body,
    _ => {}
}
```

`while let Some(top) = stack.pop()` ও তাই — `pop()` প্রতি ঘূর্ণনে একটা `Option` return করে, loop সেটার tag check করে; `None` এলেই থেমে যায়। খরচ প্রতি iteration এ একটা comparison — ব্যস।

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
# Python approximation via dataclasses
from dataclasses import dataclass
from typing import Union

@dataclass
class Move: x: int; y: int
@dataclass
class Write: text: str
class Quit: pass

Message = Union[Quit, Move, Write]

# Non-exhaustive structural matching in Python
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