# Best Practices ও Rust Idioms

Rust শিখলে — এখন সময় Rust এর চিন্তাভাবনা (philosophy) বুঝতে। Rust এর নিজস্ব style, idiom, আর pattern আছে। Python এ "Pythonic" যেমন, Rust এ "Idiomatic Rust"। চলো দেখি।

## Clippy — Rust এর Linter

```bash
rustup component add clippy   # install
cargo clippy                   # run
cargo clippy --fix             # auto-fix
cargo clippy -- -W clippy::all # strict mode
```

Clippy হলো Rust এর official linter — শুধু error না, **idiom suggestion** দেয়।

```rust
// Bad
for i in 0..v.len() {
    println!("{}", v[i]);
}

// Clippy suggests:
for item in &v {
    println!("{}", item);
}
```

> [!tip]
// Clippy তোমার best friend! Code লিখে `cargo clippy` চালাও — Rust idiom গুলো শিখবে কোনো effort ছাড়াই। Production code এর আগে অবশ্যই clippy ক্লিন হতে হবে।

## Formatting

```bash
cargo fmt           # format সব ফাইল
cargo fmt --check   # শুধু check, format করবে না
```

> [!note]
// `cargo fmt` হলো Python এর `black` বা Go এর `gofmt` এর মতো — automatic code formatting। Style debate শেষ! সবার code একই style এ থাকবে। CI তে `cargo fmt --check` রাখো।

## Error Handling Idioms

### Bad

```rust
fn read_config() -> Config {
    let content = std::fs::read_to_string("config.txt").unwrap();
    let config: Config = toml::from_str(&content).unwrap();
    config
}
```

### Good

```rust
fn read_config() -> Result<Config, ConfigError> {
    let content = std::fs::read_to_string("config.txt")
        .context("Failed to read config file")?;
    let config: Config = toml::from_str(&content)
        .context("Failed to parse config")?;
    Ok(config)
}
```

| Rule | কী |
|------|-----|
| `unwrap()` শুধু test এ | Production এ `?` use করো |
| `expect()` শুধু impossible state এ | "This should never happen" |
| Context যোগ করো | `.context("...")` দিয়ে |
| Library এ typed error | `thiserror` দিয়ে |
| Application এ `anyhow` | Quick আর ergonomic |

## Ownership আর Borrowing Idioms

### Function Parameter Idioms

```rust
// BAD — unnecessary ownership
fn process(data: String) { ... }

// GOOD — borrow
fn process(data: &str) { ... }

// BAD — unnecessary String
fn greet(name: String) { ... }

// GOOD — &str
fn greet(name: &str) { ... }

// BAD — unnecessary clone
let s = String::from("hello");
let copy = s.clone();
process(&copy);

// GOOD — borrow
process(&s);
```

> [!tip]
// সবচেয়ে গুরুত্বপূর্ণ Rust idiom — **function parameter এর জন্য `&str` use করো `String` এর বদলে**। এটা সব string type accept করে আর unnecessary allocation এড়ায়।

### Return Value Idioms

```rust
// BAD — return reference when ownership is easy
fn get_name(user: &User) -> &str { &user.name }

// GOOD — return owned when cheap
fn get_name(user: &User) -> String { user.name.clone() }

// BEST — return &str when caller doesn't need ownership
fn get_name(user: &User) -> &str { &user.name }
```

> [!note]
// Context dependent! যদি caller শুধু read করবে, `&str` return করো। যদি caller modify করবে বা store করবে, `String` return করো।

## Builder Pattern

যখন অনেক optional parameter থাকে:

```rust
#[derive(Debug, Default)]
struct ServerConfig {
    host: String,
    port: u16,
    max_connections: usize,
    timeout: u64,
    enable_logging: bool,
}

impl ServerConfig {
    fn new() -> Self {
        Self::default()
    }

    fn host(mut self, host: &str) -> Self {
        self.host = host.to_string();
        self
    }

    fn port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    fn max_connections(mut self, max: usize) -> Self {
        self.max_connections = max;
        self
    }

    fn build(self) -> Self {
        self
    }
}

fn main() {
    let config = ServerConfig::new()
        .host("0.0.0.0")
        .port(8080)
        .max_connections(1000)
        .build();
}
```

> [example]
// Builder pattern হলো Rust এর অন্যতম common pattern — fluent API দিয়ে configuration। অনেক optional parameter থাকলে এটা ব্যবহার করো। `derive_builder` crate দিয়ে auto-generate করা যায়।

## Newtype Pattern

Type safety এর জন্য wrapper type:

```rust
struct UserId(u64);
struct ProductId(u64);

fn get_user(id: UserId) { ... }
fn get_product(id: ProductId) { ... }

fn main() {
    let user_id = UserId(42);
    let product_id = ProductId(100);

    get_user(user_id);          // OK
    // get_user(product_id);    // ERROR! type mismatch
}
```

> [!tip]
// Newtype pattern হলো Rust এর সবচেয়ে সহজ কিন্তু powerful idiom। `u64` দিয়ে user ID আর product ID আলাদা type বানাও — accidental mix-up impossible। Zero runtime cost, compile-time safety।

## Iterators over Loops

```rust
// BAD — imperative loop
let mut sum = 0;
for i in 0..v.len() {
    sum += v[i] * 2;
}

// GOOD — functional iterator
let sum: i32 = v.iter().map(|x| x * 2).sum();

// BAD — manual filter + collect
let mut evens = Vec::new();
for &x in &v {
    if x % 2 == 0 {
        evens.push(x);
    }
}

// GOOD — iterator chain
let evens: Vec<i32> = v.iter().filter(|&&x| x % 2 == 0).cloned().collect();
```

> [!note]
// Rust এ iterator loop এর চেয়ে পছন্দ করা হয় — কারণ zero-cost আর পড়তে সহজ। Python এ list comprehension prefer করা হয়, Rust এ iterator chain।

## `?` over `match` for Error Propagation

```rust
// BAD — verbose match
fn read_file() -> Result<String, io::Error> {
    let content = match fs::read_to_string("file.txt") {
        Ok(c) => c,
        Err(e) => return Err(e),
    };
    Ok(content)
}

// GOOD — ? operator
fn read_file() -> Result<String, io::Error> {
    let content = fs::read_to_string("file.txt")?;
    Ok(content)
}
```

## Prefer `&str` over `&String`

```rust
// BAD
fn greet(name: &String) { ... }

// GOOD — &str accepts both String and &str
fn greet(name: &str) { ... }
```

## Prefer `&[T]` over `&Vec<T>`

```rust
// BAD
fn sum(data: &Vec<i32>) -> i32 { ... }

// GOOD — &[T] accepts Vec, array, slice
fn sum(data: &[i32]) -> i32 { ... }
```

## Prefer Traits over Concrete Types

```rust
// BAD — locked to Vec
fn process(items: &Vec<Item>) { ... }

// GOOD — any iterator
fn process(items: impl Iterator<Item = &Item>) { ... }

// GOOD — any reader
fn read_data(reader: impl std::io::Read) { ... }
```

> [!tip]
// API design এর সবচেয়ে গুরুত্বপূর্ণ নিয়ম — **accept trait, return concrete**। Parameter এর জন্য `impl Trait` বা `&[T]`, return এর জন্য concrete type। এটা flexibility আর clarity এর balance।

## Use `derive` Macros

```rust
// BAD — manual implementation
impl std::fmt::Debug for Point {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "Point {{ x: {}, y: {} }}", self.x, self.y)
    }
}

impl Clone for Point {
    fn clone(&self) -> Self {
        Point { x: self.x, y: self.y }
    }
}

// GOOD — derive
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct Point {
    x: i32,
    y: i32,
}
```

## Avoid Unnecessary `clone()`

```rust
// BAD — unnecessary clone
fn process(data: &Vec<String>) {
    let copy = data.clone();
    for item in &copy {
        println!("{}", item);
    }
}

// GOOD — borrow directly
fn process(data: &Vec<String>) {
    for item in data {
        println!("{}", item);
    }
}
```

> [!warn]
// `clone()` তোমার friend, কিন্তু overuse করলে performance কমে। Clippy তোমাকে unnecessary clone ধরতে সাহায্য করবে। শুধু তখন clone করো যখন ownership সত্যিই দরকার।

## Documentation Idioms

```rust
/// Short one-line description.
///
/// Longer description explaining details.
///
/// # Arguments
///
/// * `name` - The name of the user
/// * `age` - The age of the user
///
/// # Returns
///
/// Returns a greeting string.
///
/// # Errors
///
/// Returns error if name is empty.
///
/// # Examples
///
/// ```
/// let greeting = greet("Karim", 25);
/// assert_eq!(greeting, "Hello, Karim!");
/// ```
fn greet(name: &str, age: u32) -> String {
    format!("Hello, {}!", name)
}
```

> [!note]
// Rust doc comment (`///`) structured — `# Arguments`, `# Returns`, `# Errors`, `# Examples`। এগুলো `cargo doc` এ HTML documentation বানায়। Doc test গুলো `cargo test` এ run হয়।

## Performance Tips

### 1. Use `&str` not `String` for parameters

```rust
fn process(data: &str) { ... }  // no allocation
```

### 2. Pre-allocate Vec

```rust
let mut v: Vec<i32> = Vec::with_capacity(1000);  // no reallocation
```

### 3. Use `String::with_capacity`

```rust
let mut s = String::with_capacity(100);
```

### 4. Avoid unnecessary `Box`

```rust
// Only use Box when needed (large data, recursive type, trait object)
let x = 5;          // stack — fast
let x = Box::new(5); // heap — slower, only if needed
```

### 5. Use `Cow` for sometimes-owned data

```rust
use std::borrow::Cow;

fn process(input: &str) -> Cow<str> {
    if input.contains("bad") {
        Cow::Owned(input.replace("bad", "good"))  // allocate
    } else {
        Cow::Borrowed(input)  // no allocation
    }
}
```

### 6. Profile before optimizing

```bash
cargo build --release
# Use perf (Linux), Instruments (macOS), or flamegraph
cargo install flamegraph
cargo flamegraph -- main
```

> [!danger]
// Premature optimization করো না! প্রথমে correct code লেখো, তারপর profile করে bottleneck খুঁজে বের করো, তারপর optimize করো। Rust এর default performance অনেক ভালো — কম optimize করতে হয়।

## Rust Checklist — Production Ready

| Item | Check |
|------|-------|
| `cargo clippy` clean | ✅ |
| `cargo fmt` applied | ✅ |
| `cargo test` passes | ✅ |
| No `unwrap()` in production code | ✅ |
| Public API documented | ✅ |
| Error types properly defined | ✅ |
| Dependencies pinned in Cargo.lock | ✅ |
| CI/CD pipeline set up | ✅ |
| README.md with usage | ✅ |
| LICENSE file | ✅ |

## Learning Path — এরপর কী?

এই ২০টি chapter শেষ হওয়ার পর তোমার Rust foundation solid। এরপর:

1. **Practice** — [Rustlings](https://github.com/rust-lang/rustlings) exercises করো
2. **Build** — একটা CLI tool বানাও (clap দিয়ে)
3. **Web** — Axum বা Actix-web দিয়ে API বানাও
4. **Read** — Rust standard library source code পড়ো
5. **Contribute** — open source Rust project এ contribute করো

> [!tip]
// Rust শেখা একটা journey। Ownership, borrowing, lifetimes — শুরুতে কঠিন, কিন্তু একবার click করলে তুমি Rust ছাড়া আর কিছুতে কাজ করতে চাইবে না। কারণ Rust তোমাকে confidence দেয় — "if it compiles, it works"।

## Summary

Idiomatic Rust = clean, safe, আর performant code। Clippy আর fmt তোমার guide। `&str` over `String`, iterator over loop, `?` over match, newtype for safety, builder pattern for config। Error handling এ typed error (library) বা anyhow (app)। Performance এ profile first, optimize later। এখন তুমি Rust এ কোড লেখার জন্য ready — go build something awesome!