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

> [!note]
> **`unwrap()` এর ভেতরে কী হয়?** কোনো magic নেই — ঠিক এই match টাই চলে:
> ```rust
> Simplified standard library Result implementation
> pub fn unwrap(self) -> T {
>     match self {
>         Ok(v) => v,
>         Err(e) => panic!("called `unwrap()` on an `Err` value: {:?}", e),
>     }
> }
> ```
> মানে `unwrap` নিজে কোনো crash করে না — ভেতরে `match`, আর `Err` হলে `panic!` (নিচের unwinding চালু হয়)। `expect("msg")` একই জিনিস, শুধু panic message এর শুরুতে তোমার দেওয়া `msg` বসে। `Ok` হলে খরচ প্রায় শূন্য — একটা branch মাত্র।

### Panic এর ভেতরে — Stack Unwinding

`panic!` মানেই instant crash না। ভেতরে দুই ধাপ চলে — **মেসেজ প্রিন্ট**, তারপর **unwind**:

```text
panic!("crash and burn")
  ১. Panic handler — stderr এ message + file:line print করে
  ২. Unwinding শুরু — call stack উল্টো দিকে (caller দিকে) walk করে:
       প্রতিটা frame এ:
         - ওই frame এর local variable গুলোর Drop::drop চালায়
           (open file close হয়, Mutex unlock হয়, heap memory free হয়)
         - তারপর এক frame উপরে যায়
  ৩. main পেরিয়ে গেলে process শেষ — exit code 101
```

মানে panic হলে যাত্রাপথের **প্রতিটা scope পরিষ্কার** হয়ে যায় — RAII ভাঙে না। C++ এর exception ঠিক এই unwind mechanics ই ব্যবহার করে; পার্থক্য হলো Rust এ এটা সাধারণত catch করার উপায় নেই (`std::panic::catch_unwind` আছে, কিন্তু সেটা FFI আর test harness এর জন্য)।

`Cargo.toml` এ `[profile.release]` এ `panic = "abort"` দিলে unwind বন্ধ — panic হলে সরাসরি OS এ abort (exit code 134, কোনো drop চলে না, খোলা file গুলো OS বন্ধ করে দেয়)। Binary ছোট আর একটু দ্রুত হয়, তাই অনেক release build এ এটা চালু করা হয়।

## Result Type

```rust
enum Result<T, E> {
    Ok(T),    // Success variant containing value
    Err(E),   // Error variant containing error value
}
```

`Result` হলো Rust এর error handling এর মূল। এটা একটা enum — `Ok` হলো success, `Err` হলো error। দুটোই data বহন করে।

> [!note]
> **memory-তে `Result` কেমন?** মোটামুটি একটা tagged union — একটা tag (Ok না Err) + দুই variant এর মধ্যে বড়টার সমান জায়গা। কিন্তু compiler চালাক: কোনো type এ "কখনো বৈধ হতে পারে না" এমন bit pattern (niche) থাকলে tag রাখারই দরকার পড়ে না। যেমন `&T` pointer কখনো null হয় না, তাই `Option<&i32>` আসলে ঠিক ৮ byte — pointer এর null মানেই None। একই কাজ `Result` এও হয় যখন variant গুলোর type এ niche থাকে। একে বলে **niche optimization** — তাই Rust এ error সাথে করে বয়ে বেড়ানোর আলাদা জায়গা খরচ হয় না।

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

> [!note]
> প্রসঙ্গত `File::open` এর ভেতরে কী হয়? তোমার কোডে কিছুই চলে না — সরাসরি OS এর `open` syscall (Linux) যায়। OS ফাইল খুঁজে না পেলে error code ফেরত দেয়, std সেটাকে `io::Error` এ মুড়ে সেই error code থেকে `ErrorKind::NotFound` এর মতো kind বসিয়ে দেয় — এজন্যই `error.kind()` match করা চলে।

## `?` Operator — সবচেয়ে দারুণ Feature

`?` operator error propagation কে একদম সহজ করে দেয়:

```rust
// Explicit error handling without '?' operator:
fn read_username() -> Result<String, std::io::Error> {
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

// Idiomatic error propagation with '?' operator:
fn read_username_short() -> Result<String, std::io::Error> {
    let mut file = File::open("username.txt")?;
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username)
}
```

> [!tip]
> `?` operator হলো Rust এর magic wand। এটা `Result` থেকে value বের করে — যদি `Ok` হয় value দেয়, যদি `Err` হয় function থেকে early return করে error propagate করে। Python এর কোনো সমতুল্য নেই — এটা Rust এর নিজস্ব innovation।

### `?` এর ভেতরে — Desugaring

`?` কোনো runtime feature না — compiler compile time এ প্রতিটা `expr?` কে expand করে:

```rust
// Expansion of '?' operator:
match file.read_to_string(&mut username) {
    Ok(val) => val,                          // Unwraps inner value upon success
    Err(err) => return Err(From::from(err)), // Converts and early-returns error
}
```

দুটো গুরুত্বপূর্ণ খুঁটিনাটি:

১. **`From::from(err)`** — automatic error conversion এখানেই ঘটে। তোমার type এ `impl From<io::Error> for AppError` থাকলে `?` নিজেই `io::Error` কে `AppError` বানিয়ে দেয় (নিচের Custom Error Type section দেখো)। `Box<dyn Error>` এ প্রায় সব error type এর জন্য `From` impl থাকে, তাই ওখানেও `?` চলে।

২. **Zero-cost** — পুরো জিনিসটা একটা branch + return: কোনো exception throw, allocation, stack trace নেই। Compiler `Err` path কে "cold" হিসেবে mark করে, ফলে CPU branch predictor `Ok` path ধরে রাখে — happy path কার্যত খরচহীন। Python এর exception throw/catch (stack trace বানানো, handler খোঁজা) এর সাথে তুলনাই হয় না।

`Option` এর সাথে `?` একই desugar — শুধু `Err(e) => return Err(From::from(e))` এর জায়গায় `None => return None`। আর `.parse()` নিজে কী করে? ভেতরে `FromStr` trait এর `from_str` call করে আর `Result` return করে — তাই `?` তার সাথেও বসে যায়।

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

> [!note]
> এই type-টার গোড়ার গল্প দুটো জিনিসের জোড়ায়। **`dyn Error`** মানে "যেকোনো type যেটা `Error` trait implement করে" (io::Error, ParseIntError — সবাই) — একে trait object বলে। আর **`Box<...>`** হলো heap-এ রাখার smart pointer — trait object-এর size compile time-এ জানা নেই বলে Box-এ মুড়িয়ে রাখতে হয়। মনে রাখার সংক্ষেপ: **"যেকোনো error, boxed"** — quick script-এর জন্য দারুণ, typed error (`AppError`) পরেই আসছে। `Box`-এর পূর্ণ গল্প smart-pointers chapter-এ, `dyn Trait`-এর traits chapter-এ।

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
// Anti-pattern: unwrap panics if Result is Err:
fn bad() {
    let file = File::open("config.txt").unwrap();
}

// Recommended: propagate error via '?' operator:
fn good() -> Result<File, std::io::Error> {
    let file = File::open("config.txt")?;
    Ok(file)
}

// Acceptable: unwrap in unit tests to fail fast:
#[test]
fn test_parse() {
    let n: i32 = "42".parse().unwrap();  // Safe in test suites with known valid inputs
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

> [!note]
> ভেতরের mechanics: `main` এর return type হতে হয় `Termination` trait implement করা কিছু। `Result<(), E>` থেকে `Err(e)` পেলে runtime `e` এর `Debug` format stderr এ ছাপে আর exit code দেয় `1`; `Ok` বা plain `()` হলে `0`। মানে "automatic error print" টা আসলে `Termination` impl এর কাজ — shell এ `echo $?` করলে সেই code টা দেখবে।

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