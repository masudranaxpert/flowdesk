# Traits ও Generics

Traits আর Generics হলো Rust এর abstraction এর মূল হাতিয়ার। Python এর class inheritance / duck typing, C++ এর template/concept — Rust এ সেই জায়গায় traits আর generics। একসাথে দেখি।

## Trait — Behavior এর Contract

Trait হলো method signature এর একটা set — কোনো type কী behavior support করে তার চুক্তি। Python এর abstract base class বা Java/C++ এর interface এর মতো, কিন্তু অনেক বেশি powerful।

### Trait Define আর Implement

```rust
// Trait define
trait Summary {
    fn summarize(&self) -> String;
}

// Struct define
struct Article {
    title: String,
    author: String,
    content: String,
}

struct Tweet {
    username: String,
    text: String,
}

// Trait implement for Article
impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{} by {}", self.title, self.author)
    }
}

// Trait implement for Tweet
impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.username, self.text)
    }
}

fn main() {
    let article = Article {
        title: String::from("Rust Guide"),
        author: String::from("Karim"),
        content: String::from("Rust is awesome..."),
    };
    println!("{}", article.summarize());  // Rust Guide by Karim
}
```

> [!note]
> Python এ class এর ভেতরেই method থাকে। Rust এ data (struct) আর behavior (trait impl) আলাদা! একই struct এর জন্য একাধিক trait implement করা যায় — সব আলাদা `impl` block এ। এটা Rust এর একটা বড় design difference।

### Default Method

Trait এ default implementation দেওয়া যায়:

```rust
trait Summary {
    fn summarize(&self) -> String;

    // Default method — override না করলে এটাই ব্যবহার হবে
    fn preview(&self) -> String {
        format!("{}...", &self.summarize()[..50.min(self.summarize().len())])
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.username, self.text)
    }
    // preview() override করিনি — default ব্যবহার হবে
}
```

## Trait as Parameter

### `impl Trait` Syntax

```rust
fn print_summary(item: &impl Summary) {
    println!("{}", item.summarize());
}
```

### Trait Bound Syntax

```rust
// উপরেরটার সমতুল্য — explicit
fn print_summary<T: Summary>(item: &T) {
    println!("{}", item.summarize());
}

// Multiple trait bounds
fn display_info<T: Summary + std::fmt::Display>(item: &T) {
    println!("{}", item);
}
```

> [!tip]
> `impl Trait` হলো syntactic sugar — ছোট আর পঠনযোগ্য। কিন্তু যদি একাধিক parameter same type হতে হবে, trait bound `<T: Trait>` ব্যবহার করো:

```rust
// দুটো parameter same type — trait bound দরকার
fn longest<T: PartialOrd>(a: T, b: T) -> T {
    if a > b { a } else { b }
}
```

### `where` Clause

Trait bound বেশি হলে `where` clause পরিষ্কার:

```rust
// এটা পড়তে কষ্ট
fn complex<T: Summary + Clone, U: std::fmt::Debug + Display>(a: T, b: U) -> String { ... }

// where clause — পরিষ্কার
fn complex<T, U>(a: T, b: U) -> String
where
    T: Summary + Clone,
    U: std::fmt::Debug + Display,
{
    ...
}
```

## Trait as Return Type

```rust
fn create_summary() -> impl Summary {
    Tweet {
        username: String::from("bot"),
        text: String::from("hello"),
    }
}
```

> [!warn]
> `-> impl Trait` দিয়ে শুধু **এক** type return করা যায়। যদি একাধিক type return করতে চাও (যেমন Article বা Tweet), trait object (`Box<dyn Trait>`) ব্যবহার করতে হবে — পরে দেখবো।

## Generics — Type Parameter

Generics দিয়ে একই code একাধিক type এর জন্য লেখা যায়। C++ এর template এর মতো, কিন্তু type-safe (monomorphization)।

### Generic Function

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in &list[1..] {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("Largest: {}", largest(&numbers));  // 100

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("Largest: {}", largest(&chars));    // 'y'
}
```

### Generic Struct

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let int_point = Point { x: 5, y: 10 };           // Point<i32>
    let float_point = Point { x: 1.0, y: 4.0 };       // Point<f64>
}

// Multiple type parameter
struct Point2<T, U> {
    x: T,
    y: U,
}

let mixed = Point2 { x: 5, y: 1.0 };  // Point2<i32, f64>
```

### Generic Method

```rust
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// শুধু f64 এর জন্য method
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

> [!example]
// খেয়াল করো — `impl<T> Point<T>` সব type এর জন্য। কিন্তু `impl Point<f64>` শুধু f64 এর জন্য। এটা Rust এর একটা দারুণ feature — specific type এর জন্য extra method দেওয়া যায়।

## Monomorphization — Zero-Cost Abstraction

Rust এর generics compile time এ specific type এ expand হয় — এটাকে **monomorphization** বলে। Runtime এ কোনো overhead নেই।

```rust
// তোমার কোড
fn largest<T: PartialOrd>(list: &[T]) -> &T { ... }
let a = largest(&[1, 2, 3]);        // i32
let b = largest(&[1.0, 2.0, 3.0]); // f64

// Compiler generate করে (conceptually):
fn largest_i32(list: &[i32]) -> &i32 { ... }
fn largest_f64(list: &[f64]) -> &f64 { ... }
```

> [!tip]
// এটাই "zero-cost abstraction" — generic code লেখো, compiler specific version বানায়। C++ এর template এর মতো, কিন্তু Python এর generic (duck typing) এর চেয়ে অনেক fast কারণ runtime type check নেই।

## Trait Object — Dynamic Dispatch

যদি runtime এ একাধিক type store করতে হয়, trait object ব্যবহার করো:

```rust
fn main() {
    let articles: Vec<Box<dyn Summary>> = vec![
        Box::new(Article {
            title: String::from("News"),
            author: String::from("AP"),
            content: String::from("..."),
        }),
        Box::new(Tweet {
            username: String::from("user"),
            text: String::from("Hello"),
        }),
    ];

    for article in &articles {
        println!("{}", article.summarize());
    }
}
```

### Static vs Dynamic Dispatch

| Feature | `impl Trait` (Static) | `Box<dyn Trait>` (Dynamic) |
|---------|----------------------|---------------------------|
| Dispatch | Compile-time | Runtime (vtable) |
| Performance | Fast (inlined) | Slightly slower |
| Flexibility | One type only | Multiple types |
| Memory | Stack | Heap (Box) |
| Use when | Type known at compile time | Runtime polymorphism needed |

> [!note]
// সাধারণ নিয়ম — `impl Trait` prefer করো (fast)। শুধু তখনই `dyn Trait` যখন একই collection এ একাধিক type রাখতে হবে। এটা C++ এর virtual function, Python এর duck typing এর সমতুল্য।

## Common Standard Traits

### `Display` আর `Debug`

```rust
use std::fmt;

struct City {
    name: String,
    population: u64,
}

// Display — user-friendly ({} format)
impl fmt::Display for City {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} (pop: {})", self.name, self.population)
    }
}

// Debug — developer-friendly ({:?} format)
// #[derive(Debug)] দিলে automatically হয়
```

### `Clone` আর `Copy`

```rust
#[derive(Clone, Copy)]
struct Color {
    r: u8,
    g: u8,
    b: u8,
}

let c1 = Color { r: 255, g: 0, b: 0 };
let c2 = c1;  // copy — c1 এখনো valid
```

### `PartialEq` আর `Eq`

```rust
#[derive(PartialEq, Eq)]
struct UserId(u32);

let id1 = UserId(1);
let id2 = UserId(1);
println!("{}", id1 == id2);  // true
```

### `From` আর `Into`

```rust
impl From<i32> for UserId {
    fn from(val: i32) -> Self {
        UserId(val as u32)
    }
}

let id: UserId = 42i32.into();  // From → Into automatic
```

## Trait Object বনাম Generic — সিদ্ধান্ত

```rust
// Generic — static dispatch, fast
fn print_all<T: Summary>(items: &[T]) {
    for item in items {
        println!("{}", item.summarize());
    }
}

// Trait object — dynamic dispatch, flexible
fn print_all_dyn(items: &[Box<dyn Summary>]) {
    for item in items {
        println!("{}", item.summarize());
    }
}
```

> [!tip]
// সিদ্ধান্ত:
// - একই type এর list → generic (`Vec<T>`)
// - মিশ্র type এর list → trait object (`Vec<Box<dyn Trait>>`)
// - Performance-critical → generic
// - Flexibility-critical → trait object

## বাস্তব উদাহরণ — Plugin System

```rust
trait Plugin {
    fn name(&self) -> &str;
    fn execute(&self, input: &str) -> String;
}

struct UppercasePlugin;
struct ReversePlugin;

impl Plugin for UppercasePlugin {
    fn name(&self) -> &str { "uppercase" }
    fn execute(&self, input: &str) -> String {
        input.to_uppercase()
    }
}

impl Plugin for ReversePlugin {
    fn name(&self) -> &str { "reverse" }
    fn execute(&self, input: &str) -> String {
        input.chars().rev().collect()
    }
}

fn run_plugins(input: &str, plugins: &[Box<dyn Plugin>]) {
    for plugin in plugins {
        println!("{}: {}", plugin.name(), plugin.execute(input));
    }
}

fn main() {
    let plugins: Vec<Box<dyn Plugin>> = vec![
        Box::new(UppercasePlugin),
        Box::new(ReversePlugin),
    ];

    run_plugins("Hello Rust", &plugins);
    // uppercase: HELLO RUST
    // reverse: tsuR olleH
}
```

> [!example]
// এখানে দুটো ভিন্ন type (UppercasePlugin আর ReversePlugin) একই `Vec` এ store করা হয়েছে — `Box<dyn Plugin>` দিয়ে। এটাই trait object এর শক্তি — runtime polymorphism, C++ এর virtual function এর মতো।

## Python vs Rust — Abstraction তুলনা

| Concept | Python | Rust |
|---------|--------|------|
| Interface | ABC / Protocol | Trait |
| Inheritance | `class Dog(Animal):` | — (নেই!) |
| Duck typing | Automatic | `impl Trait` |
| Generic | Duck typing | `<T: Trait>` |
| Polymorphism | Implicit | `dyn Trait` or generic |

> [!note]
// Rust এ inheritance নেই! এটা deliberate decision। এর বদলে composition + trait ব্যবহার করো। এটা আরো flexible আর কম confusing।

## Summary

Traits হলো behavior এর contract, generics হলো type parameter। `impl Trait` দিয়ে static dispatch (fast), `Box<dyn Trait>` দিয়ে dynamic dispatch (flexible)। Monomorphization এর কারণে generic code zero-cost। পরের chapter এ iterators আর closures শিখবো — Rust এর functional side।