# Modules, Crates ও Cargo

Rust এ code organize করার system Python এর package/module এর চেয়ে কিছুটা আলাদা। চলো দেখি crate, module, path, আর Cargo কীভাবে কাজ করে।

## ধারণা — Crate, Package, Module

| Term | কী | Python Equivalent |
|------|-----|-------------------|
| **Package** | Cargo project — `Cargo.toml` সহ | pip package |
| **Crate** | Compilation unit (library বা binary) | Python module |
| **Module** | Crate এর ভেতরে code organize | Python sub-module |
| **Path** | Item access করার উপায় | import path |

### Crate দুই রকম

1. **Binary crate** — executable বানায় (`main.rs` সহ)
2. **Library crate** — library বানায় (`lib.rs` সহ)

একটা package এ একটা library crate আর একাধিক binary crate থাকতে পারে।

## Cargo — Build Tool আর Package Manager

### নতুন Project

```bash
# Binary project
cargo new my_app

# Library project
cargo new my_lib --lib
```

### Project Structure

```
my_app/
├── Cargo.toml          # Project config
├── Cargo.lock          # Dependency lock
├── src/
│   ├── main.rs         # Binary entry point
│   ├── lib.rs          # Library root (optional)
│   └── utils.rs        # Additional module
├── tests/
│   └── integration.rs  # Integration tests
├── benches/
│   └── my_bench.rs     # Benchmarks
├── examples/
│   └── simple.rs       # Examples
└── target/             # Build output (gitignore)
```

### Cargo.toml

```toml
[package]
name = "my_app"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <email@example.com>"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"

[dev-dependencies]
criterion = "0.5"

[[bin]]
name = "my_app"
path = "src/main.rs"

[profile.release]
opt-level = 3
lto = true
```

> [!tip]
// `Cargo.toml` হলো Python এর `pyproject.toml` বা Node এর `package.json`। এখানে dependency, version, build setting সব থাকে। `Cargo.lock` হলো exact version lock — `package-lock.json` এর মতো।

### Common Commands

```bash
cargo new my_app          # নতুন project
cargo build               # Compile
cargo run                 # Compile আর run
cargo build --release     # Optimized build
cargo check               # Compile check (fast, no binary)
cargo test                # সব test run
cargo test -- --nocapture # test output দেখাও
cargo fmt                 # Code format
cargo clippy              # Linter check
cargo doc --open          # Documentation generate আর open
cargo add serde           # Dependency add
cargo update              # Dependency update
cargo tree                # Dependency tree দেখাও
```

## Module System

### Module Define

```rust
// src/lib.rs
mod math_utils {
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    fn subtract(a: i32, b: i32) -> i32 {
        a - b
    }

    pub mod geometry {
        pub fn circle_area(r: f64) -> f64 {
            std::f64::consts::PI * r * r
        }
    }
}
```

### `pub` — Visibility

Rust এ সবকিছু default ভাবে private। `pub` দিয়ে public করতে হয়:

```rust
mod my_module {
    pub fn public_fn() {}       // accessible from outside
    fn private_fn() {}           // শুধু module এর ভেতরে
    pub(crate) fn crate_fn() {}  // শুধু এই crate এ
}
```

| Visibility | কোথায় accessible |
|------------|------------------|
| (no keyword) | শুধু এই module এ |
| `pub` | সব জায়গায় |
| `pub(crate)` | শুধু এই crate এ |
| `pub(super)` | parent module এ |
| `pub(in path)` | specific path এ |

### `use` — Import

```rust
// Full path
use my_module::math_utils::add;

// Multiple items
use std::collections::{HashMap, HashSet, BTreeMap};

// Alias
use std::io::Result as IoResult;

// Glob import (সাবধান!)
use std::collections::*;

// Nested
use std::{fs::File, io::Read, path::Path};
```

> [!note]
// Python এর `from x import y` আর Rust এর `use x::y;` প্রায় একই। তবে Rust এ `use` শুধু path কে short করে — কোনো code execute করে না (Python এর মতো module side-effect নেই)।

### File-Based Module

Module গুলো separate file এ রাখা যায়:

```
src/
├── main.rs
├── lib.rs
├── math_utils.rs        # mod math_utils এর implementation
└── math_utils/
    └── geometry.rs      # nested module
```

```rust
// src/main.rs বা src/lib.rs
mod math_utils;  // math_utils.rs ফাইল থেকে load

// বা সাথে submodule
mod math_utils {
    pub mod geometry;  // math_utils/geometry.rs থেকে
}
```

> [!tip]
// Rust 2018 edition থেকে দুটো way আছে module file organize করার:
// 1. `math_utils.rs` — flat file
// 2. `math_utils/mod.rs` — folder structure
//
// Flat file (`math_utils.rs`) prefer করো — আরো পরিষ্কার।

### External Crate

```rust
// Cargo.toml
// [dependencies]
// rand = "0.8"

// src/main.rs
use rand::Rng;

fn main() {
    let n = rand::thread_rng().gen_range(1..=100);
    println!("Random: {}", n);
}
```

### Re-export with `pub use`

```rust
// src/lib.rs
mod internal {
    pub fn helper() {}
}

pub use internal::helper;  // external user দেখবে শুধু helper()
```

> [!example]
// `pub use` হলো Python এর `__all__` বা `from x import y as y` এর মতো। Library এর internal structure hide করে clean public API বানাতে ব্যবহার হয়।

## Workspace — Multi-Crate Project

বড় project এ একাধিক crate থাকতে পারে:

```
my_workspace/
├── Cargo.toml          # Workspace config
├── frontend/
│   ├── Cargo.toml
│   └── src/
├── backend/
│   ├── Cargo.toml
│   └── src/
└── shared/
    ├── Cargo.toml
    └── src/
```

```toml
# Root Cargo.toml
[workspace]
members = [
    "frontend",
    "backend",
    "shared",
]
```

```toml
# backend/Cargo.toml
[dependencies]
shared = { path = "../shared" }
```

> [!note]
// Workspace দিয়ে একাধিক crate একসাথে build, test, share `target/` directory। বড় project এ এটা essential — যেমন monorepo structure।

## Attribute — Compiler Instruction

```rust
// Allow dead code
#[allow(dead_code)]
fn unused_function() {}

// Conditional compilation
#[cfg(target_os = "linux")]
fn linux_only() {}

#[cfg(test)]
mod tests {}

// Derive macro
#[derive(Debug, Clone, PartialEq)]
struct Point { x: i32, y: i32 }

// Inline hint
#[inline]
fn fast_add(a: i32, b: i32) -> i32 { a + b }
```

## বাস্তব উদাহরণ — Library Structure

```
math_lib/
├── Cargo.toml
├── src/
│   ├── lib.rs           # Public API
│   ├── arithmetic.rs    # Add, subtract, multiply
│   ├── geometry.rs      # Area, perimeter
│   └── stats.rs         # Mean, median, mode
└── tests/
    └── integration.rs
```

```rust
// src/lib.rs
pub mod arithmetic;
pub mod geometry;
pub mod stats;

pub use arithmetic::{add, subtract, multiply, divide};
pub use geometry::{circle_area, rectangle_area};
pub use stats::{mean, median};
```

```rust
// src/arithmetic.rs
pub fn add(a: f64, b: f64) -> f64 { a + b }
pub fn subtract(a: f64, b: f64) -> f64 { a - b }
pub fn multiply(a: f64, b: f64) -> f64 { a * b }
pub fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 { None } else { Some(a / b) }
}
```

```rust
// src/geometry.rs
pub fn circle_area(radius: f64) -> f64 {
    std::f64::consts::PI * radius * radius
}

pub fn rectangle_area(width: f64, height: f64) -> f64 {
    width * height
}
```

```rust
// src/stats.rs
pub fn mean(data: &[f64]) -> Option<f64> {
    if data.is_empty() {
        None
    } else {
        Some(data.iter().sum::<f64>() / data.len() as f64)
    }
}

pub fn median(data: &[f64]) -> Option<f64> {
    if data.is_empty() {
        return None;
    }
    let mut sorted: Vec<f64> = data.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mid = sorted.len() / 2;
    if sorted.len() % 2 == 0 {
        Some((sorted[mid - 1] + sorted[mid]) / 2.0)
    } else {
        Some(sorted[mid])
    }
}
```

```rust
// tests/integration.rs
use math_lib::{add, mean, circle_area};

#[test]
fn test_add() {
    assert!((add(2.0, 3.0) - 5.0).abs() < 0.0001);
}

#[test]
fn test_mean() {
    let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    assert!((mean(&data).unwrap() - 3.0).abs() < 0.0001);
}
```

> [example]
// খেয়াল করো — `lib.rs` এ `pub use` দিয়ে re-export করা হয়েছে। ব্যবহারকারী শুধু `use math_lib::add` লিখবে, পুরো path `math_lib::arithmetic::add` লিখতে হবে না। এটাই clean API design।

## Python vs Rust — Module তুলনা

| Feature | Python | Rust |
|---------|--------|------|
| File = module | Yes (`import file`) | Yes (`mod file;`) |
| Package manager | pip | cargo |
| Virtual env | venv | দরকার নেই! |
| Dependency file | requirements.txt | Cargo.toml |
| Lock file | — (pip) / poetry.lock | Cargo.lock |
| Build | — | cargo build |
| Test runner | pytest | cargo test |
| Linter | flake8/ruff | cargo clippy |
| Formatter | black | cargo fmt |
| Docs | sphinx | cargo doc |

> [!tip]
// Rust এর সবচেয়ে বড় সুবিধা — সব tool একসাথে আসে! Python এ pip, venv, pytest, black, ruff আলাদা আলাদা install করতে হয়। Rust এ `cargo` একটাই টুল সব handle করে।

## Summary

Cargo হলো Rust এর সব কিছু — build, test, doc, fmt, lint। Module system দিয়ে code organize করো, `pub` দিয়ে visibility control করো, `use` দিয়ে import করো। Workspace দিয়ে বড় project manage করো। পরের chapter এ smart pointers দেখবো।