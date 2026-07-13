# Error Handling — Result, Option, ?

Rust এর error handling পদ্ধতি Python/C++ থেকে সম্পূর্ণ আলাদা। কোনো `try/catch` নেই, কোনো exception নেই। এর বদলে Rust error কে **value** হিসেবে treat করে — `Result` আর `Option` enum দিয়ে। এটা শুরুতে অদ্ভুত মনে হলেও, ব্যবহার করতে করতে দেখবে এর চেয়ে নিরাপদ আর পরিষ্কার পদ্ধতি আর নেই।

## দুটো Approach

| Approach | কখন | Example |
|----------|------|---------|
| **Panic** (`panic!`) | Unrecoverable error — programmer mistake | Array out of bounds, impossible state |
| **Result** | Recoverable error — expected failure | File not found, network error, parse error |

### Panic — Unrecoverable

```rust
fn main() {
    let v = vec![1, 2, 3];
    println!("{}", v[99]);  // panic! index out of bounds
}
```

`panic!` হলো program crash — কোনো recovery নেই। Python এর `RuntimeError` বা C++ এর `abort()` এর মতো। এটা শুধু তখনই হওয়া উচিত যখন program এর state এতটা খারাপ যে চালানো অর্থহীন।

```rust
// Manual panic
panic!("crash and burn");

// panic with format
panic!("Error: {} not found", filename);
```

> [!danger]
> `unwrap()` আর `expect()` সবসময় panic করতে পারে। Production code এ এগুলো avoid করো — proper error handling করো। শুধু prototype বা script এ ব্যবহার করো।

## Result Type

```rust
enum Result<T, E> {
    Ok(T),    // Success — value আছে
    Err(E),   // Error — error value আছে
}
```

`Result` হলো Rust এর error handling এর মূল। এটা একটা enum — `Ok` হলো success, `Err` হলো error। দুটোই data বহন করে।

### ব্যবহার

```rust
use std::fs::File;

fn main() {
    let result = File::open("hello.txt");

    match result {
        Ok(file) => {
            println!("File opened: {:?}", file);
        }
        Err(error) => {
            println!("Error: {}", error);
        }
    }
}
```

### Different Error Types

```rust
use std::fs::File;
use std::io::ErrorKind;

fn open_file(filename: &str) -> File {
    match File::open(filename) {
        Ok(file) => file,
        Err(error) if error.kind() == ErrorKind::NotFound => {
            match File::create(filename) {
                Ok(file) => file,
                Err(e) => panic!("Cannot create file: {}", e),
            }
        }
        Err(error) => panic!("Cannot open file: {}", error),
    }
}
```

> [!example]
> এখানে file not found হলে নতুন file create করা হচ্ছে, অন্য error হলে panic। এটা recovery logic — Python এ `try/except FileNotFoundError` এর মতো, কিন্তু Rust এ compiler নিশ্চিত করে সব case handle হয়েছে।

## `?` Operator — সবচেয়ে দারুণ Feature

`?` operator error propagation কে একদম সহজ করে দেয়:

```rust
// ছাড়া ? — verbose
fn read_username() -> Result<String, std::io::Error> {
    let file = File::open("username.txt")?;
    // ... এখনো অনেক কোড লাগবে

    let mut file = match File::open("username.txt") {
        Ok(f) => f,
        Err(e) => return Err(e),   // error propagate
    };

    let mut username = String::new();
    match file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),         // error propagate
    }
}

// দিয়ে ? — একদম সোজা!
fn read_username_short() -> Result<String, std::io::Error> {
    let mut file = File::open("username.txt")?;
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username)
}
```

> [!tip]
> `?` operator হলো Rust এর magic wand। এটা `Result` থেকে value বের করে — যদি `Ok` হয় value দেয়, যদি `Err` হয় function থেকে early return করে error propagate করে। Python এর কোনো সমতুল্য নেই — এটা Rust এর নিজস্ব innovation।

### `?` Chain

```rust
use std::fs;
use std::io;
use std::num::ParseIntError;

fn read_config() -> Result<i32, Box<dyn std::error::Error>> {
    let content = fs::read_to_string("config.txt")?;
    let number: i32 = content.trim().parse()?;
    Ok(number)
}
```

> [!note]
> `Box<dyn std::error::Error>` হলো generic error type — যেকোনো error accept করে। এটা quick আর easy, কিন্তু পরে আরো typed error ব্যবহার করা ভালো।

## `Option` ও `?`

`?` operator `Option` এর সাথেও কাজ করে:

```rust
fn first_char(s: &str) -> Option<char> {
    let c = s.chars().next()?;
    Some(c.to_uppercase().next()?)
}
```

## Custom Error Type

Production code এ proper error type বানানো উচিত:

```rust
use std::fmt;
use std::error::Error;

#[derive(Debug)]
enum AppError {
    IoError(std::io::Error),
    ParseError(std::num::ParseIntError),
    NotFound(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::IoError(e) => write!(f, "IO error: {}", e),
            AppError::ParseError(e) => write!(f, "Parse error: {}", e),
            AppError::NotFound(s) => write!(f, "Not found: {}", s),
        }
    }
}

impl Error for AppError {}

// From trait — automatic conversion
impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::IoError(e)
    }
}

impl From<std::num::ParseIntError> for AppError {
    fn from(e: std::num::ParseIntError) -> Self {
        AppError::ParseError(e)
    }
}

fn read_config() -> Result<i32, AppError> {
    let content = std::fs::read_to_string("config.txt")?;  // io::Error → AppError
    let number: i32 = content.trim().parse()?;              // ParseIntError → AppError
    Ok(number)
}
```

> [!warn]
> এটা verbose মনে হতে পারে। কিন্তু `thiserror` crate ব্যবহার করলে অনেক কম কোডে হয়:

## `thiserror` — Ergonomic Error Types

```toml
# Cargo.toml
[dependencies]
thiserror = "2"
```

```rust
use thiserror::Error;

#[derive(Debug, Error)]
enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Parse error: {0}")]
    Parse(#[from] std::num::ParseIntError),

    #[error("Not found: {0}")]
    NotFound(String),
}
```

> [!tip]
> `thiserror` derive macro দিয়ে `Display`, `Error`, `From` — সব automatically implement হয়। এটা Rust এর error handling এর standard approach। Production code এ এটাই ব্যবহার করো।

## `anyhow` — Application Error

Library এর জন্য `thiserror`, কিন্তু application এর জন্য `anyhow`:

```toml
[dependencies]
anyhow = "1"
```

```rust
use anyhow::{Context, Result};

fn read_config() -> Result<i32> {
    let content = std::fs::read_to_string("config.txt")
        .context("Failed to read config file")?;
    let number: i32 = content.trim().parse()
        .context("Failed to parse config")?;
    Ok(number)
}

fn main() -> Result<()> {
    let n = read_config()?;
    println!("Config value: {}", n);
    Ok(())
}
```

> [!example]
> `anyhow` দিয়ে error এ context যোগ করা যায় — "Failed to read config file: No such file or directory"। এটা debugging এ খুব সাহায্য করে। Application code এর জন্য এটাই best choice।

## Error Handling Strategy

| Scenario | Approach | Example |
|----------|----------|---------|
| Prototype/script | `unwrap()`, `expect()` | Quick hack |
| Library API | Custom error + `thiserror` | Public API |
| Application | `anyhow` + `?` + `.context()` | Main binary |
| Impossible state | `panic!()` or `unreachable!()` | Logic error |
| External error | `?` + `From` impl | IO, network, parse |

> [!note]
> **Library** এ detailed typed error দাও (`thiserror`) — caller কে specific error handle করতে হবে। **Application** এ `anyhow` ব্যবহার করো — শুধু দরকার error propagate আর context যোগ করা।

## unwrap বনাম ? — কখন কোনটা?

```rust
// BAD — panic করতে পারে
fn bad() {
    let file = File::open("config.txt").unwrap();
}

// GOOD — error propagate করে
fn good() -> Result<File, std::io::Error> {
    let file = File::open("config.txt")?;
    Ok(file)
}

// ALSO OK — test code এ unwrap fine
#[test]
fn test_parse() {
    let n: i32 = "42".parse().unwrap();  // test এ OK
    assert_eq!(n, 42);
}
```

> [!tip]
> নিয়ম:
> - Test এ → `unwrap()` বা `expect()` — fine
> - Prototype এ → `unwrap()` — acceptable
> - Production এ → `?` operator ব্যবহার করো
> - `main()` এ → `Result<()>` return করো, শেষে `?` দাও

## `main()` এ Error Return

Rust এ `main` function ও `Result` return করতে পারে:

```rust
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let content = std::fs::read_to_string("file.txt")?;
    println!("{}", content);
    Ok(())
}
```

> [!note]
> যদি `main` থেকে `Err` return হয়, Rust automatically error print করে আর exit code 1 দেয়। এটা খুব clean — কোনো manual error printing লাগে না।

## তুলনা — Python vs Rust Error Handling

```python
# Python — try/except
try:
    with open("file.txt") as f:
        data = f.read()
    number = int(data)
except FileNotFoundError as e:
    print(f"File error: {e}")
except ValueError as e:
    print(f"Parse error: {e}")
```

```rust
// Rust — Result + ?
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let data = std::fs::read_to_string("file.txt")?;
    let number: i32 = data.trim().parse()?;
    println!("{}", number);
    Ok(())
}
```

> [!example]
> Python এর `try/except` আর Rust এর `?` — দুটোই error handling করে। কিন্তু Rust এর সুবিধা হলো compiler তোমাকে বাধ্য করে error handle করতে। Python এ forgot to handle করলেও চলে — runtime এ crash। Rust এ compile error!

## Summary

Rust এ error handling `Result` আর `Option` দিয়ে। `?` operator error propagation কে সহজ করে। Library এর জন্য `thiserror`, application এর জন্য `anyhow`। `unwrap()` শুধু test আর prototype এ। Production এ সবসময় proper error handling করো। পরের chapter এ traits আর generics শিখবো — Rust এর আরেকটা বড় feature।