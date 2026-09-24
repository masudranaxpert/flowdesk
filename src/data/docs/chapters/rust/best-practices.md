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
> // Clippy তোমার best friend! Code লিখে `cargo clippy` চালাও — Rust idiom গুলো শিখবে কোনো effort ছাড়াই। Production code এর আগে অবশ্যই clippy ক্লিন হতে হবে।

## Formatting

```bash
cargo fmt           # format সব ফাইল
cargo fmt --check   # শুধু check, format করবে না
```

> [!note]
> // `cargo fmt` হলো Python এর `black` বা Go এর `gofmt` এর মতো — automatic code formatting। Style debate শেষ! সবার code একই style এ থাকবে। CI তে `cargo fmt --check` রাখো।

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
> // সবচেয়ে গুরুত্বপূর্ণ Rust idiom — **function parameter এর জন্য `&str` use করো `String` এর বদলে**। এটা সব string type accept করে আর unnecessary allocation এড়ায়।

> [!note]
> **কেন `&str` দ্রুত?** `String` = heap-allocated struct: pointer + len + capacity (২৪ byte) + আলাদা heap buffer। `&str` = শুধু **fat pointer**: data pointer + length (১৬ byte), নিজের কোনো allocation নেই। `greet(name: String)` লিখলে caller কে ownership দিতে হয় নয়তো `clone()` — মানে malloc + O(n) memcpy। `&str` এ দুটোই বাদ, আর `&String` পাঠালে **deref coercion** automatic `&str` বানিয়ে দেয়, তাই caller এর কোনো ঝামেলা নেই। `&[T]` vs `&Vec<T>` হুবহু একই গল্প।

### Return Value Idioms

```rust
// BAD — শুধু পড়ানোর জন্যও প্রতি call-এ clone (heap allocation + memcpy)
fn get_name(user: &User) -> String { user.name.clone() }

// GOOD — caller পড়বে শুধু: &str return, zero allocation
fn get_name(user: &User) -> &str { &user.name }
```

> [!note]
> // Context dependent! যদি caller শুধু read করবে, `&str` return করো। যদি caller modify করবে বা store করবে, `String` return করো।

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

> [!example]
> // Builder pattern হলো Rust এর অন্যতম common pattern — fluent API দিয়ে configuration। অনেক optional parameter থাকলে এটা ব্যবহার করো। `derive_builder` crate দিয়ে auto-generate করা যায়।

> [!note]
> **Builder কেন সস্তা?** প্রতিটা method `self` **by value** নিয়ে `self` return করে — পুরোটা move, কোনো clone বা allocation নেই; chain টা ownership এর হাতবদল মাত্র। Rust এ named/optional argument নেই, builder টাই সেই ফাঁক পূরণ করে; `derive_builder` crate এই method গুলো proc-macro দিয়ে generate করে দেয় (macros chapter দেখো)।

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
> // Newtype pattern হলো Rust এর সবচেয়ে সহজ কিন্তু powerful idiom। `u64` দিয়ে user ID আর product ID আলাদা type বানাও — accidental mix-up impossible। Zero runtime cost, compile-time safety।

> [!note]
> **খরচ শূন্য কেন?** এক-field struct এর memory layout মূলত ভেতরের type টারই সমান — `UserId(u64)` ঠিক `u64` এর মতোই ৮ byte, register এ চলে, কোনো indirection নেই; সব check compile time এ। Bonus: এই wrapper দিয়ে foreign type এর জন্য foreign trait implement করা যায় (orphan rule এর ফাঁকি) — আচরণ ঠিক করা বা নতুন `Send`/`Sync` বাউন্ড বসানো যায়।

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
> // Rust এ iterator loop এর চেয়ে পছন্দ করা হয় — কারণ zero-cost আর পড়তে সহজ। Python এ list comprehension prefer করা হয়, Rust এ iterator chain।

> [!note]
> **কেন iterator chain "zero-cost"?** `map`, `filter` প্রতিটা নতুন type return করে (`Map`, `Filter` — ছোট struct, শুধু source iterator + closure ধরে রাখে) — সব lazy, কিন্তু সব generic, তাই LLVM পুরো chain **inline** করে ফেলে ও auto-vectorize করে — প্রায়ই hand-written loop এর চেয়ে ভালো machine code বের হয়। আর `v[i]` indexing এ প্রতি step এ **bounds check** হয়; iterator এ সীমা আগেই জানা, check বাদ যায়। Python এ comprehension দ্রুত হয় C-level এ নামার জন্য; Rust এ দুই রকম লেখাতেই একই machine code আসে — তাই পড়তে যেটা সহজ (iterator) সেটাই বাছো।

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

**`?` এর expansion** দেখো (simplified):

```rust
// let content = fs::read_to_string("file.txt")?;
let content = match fs::read_to_string("file.txt") {
    Ok(v) => v,
    Err(e) => return Err(From::from(e)),  // From conversion + early return
};
```

মানে `?` শুধু shorthand না — Err এর পথে **`From::from` conversion** চালায় (`io::Error` থেকে তোমার function এর error type এ automatic রূপান্তর)। ভেতরে branch ছাড়া কিছুই নেই — zero-cost।

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
> // API design এর সবচেয়ে গুরুত্বপূর্ণ নিয়ম — **accept trait, return concrete**। Parameter এর জন্য `impl Trait` বা `&[T]`, return এর জন্য concrete type। এটা flexibility আর clarity এর balance।

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

> [!note]
> **`derive` ভেতরে কী করে?** প্রতিটা derive একটা **proc-macro** — compile time এ struct টা দেখে impl block লিখে দেয়: `PartialEq` হলে field-by-field `==` (short-circuit সহ), `Hash` হলে field গুলো hash করার code। মানে হাতে লেখা impl আর generated impl হুবহু একই জিনিস — runtime reflection নেই, overhead নেই। ভেতরের প্রক্রিয়া macros chapter এ বিস্তারিত।

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
> // `clone()` তোমার friend, কিন্তু overuse করলে performance কমে। Clippy তোমাকে unnecessary clone ধরতে সাহায্য করবে। শুধু তখন clone করো যখন ownership সত্যিই দরকার।

> [!note]
> **`clone()` এর আসল খরচ**: `String`/`Vec` clone = নতুন heap allocation + পুরো data **memcpy** — O(n)। `Vec<String>` clone = প্রতিটা string এর জন্য আলাদা allocation। Borrow (`&T`) = zero — মাত্র ৮-১৬ byte pointer pass। তাই "ownership দরকার না হলে clone করো না" নিয়মটা অলংকার না — flamegraph এ সোজা দেখা যায়।

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
> // Rust doc comment (`///`) structured — `# Arguments`, `# Returns`, `# Errors`, `# Examples`। এগুলো `cargo doc` এ HTML documentation বানায়। Doc test গুলো `cargo test` এ run হয়।

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

> [!note]
> **`with_capacity` এর লাভ**: সাধারণ `push` এ capacity শেষ হলে বারবার নতুন বড় buffer allocate + পুরনো সব copy হয় (growth ~২×)। আগে থেকে সঠিক capacity নিলে **একবারই** allocation — বাকি push গুলো শুধু slot এ লেখা, amortized O(1), কোনো copy নেই। `String::with_capacity` হুবহু একই জিনিস।

### 4. Avoid unnecessary `Box`

```rust
// Only use Box when needed (large data, recursive type, trait object)
let x = 5;          // stack — fast
let x = Box::new(5); // heap — slower, only if needed
```

> [!note]
> **`Box` এর খরচ**: একটা heap allocation + পরে সব access pointer এর পিছনে (cache miss হতে পারে)। ছোট value এ শুধু অপচয়। Box সত্যিই লাগে: recursive type (size অসীম হয়ে যেত), trait object (`dyn Trait`), বা বড় value move করার সময় stack copy এড়াতে।

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

> [!note]
> **`Cow` এর ভেতরে**: একটা enum — `Borrowed(&'a str)` বা `Owned(String)`। Mutation না লাগলে শুধু reference ঘোরে (zero allocation); `to_mut()` বা `into_owned()` call হলে তবেই copy হয় — নামটাই তো "clone on write"। খরচ conditional: বেশিরভাগ input অপরিবর্তিত থাকলে প্রায় সব call allocation-free।

### 6. Profile before optimizing

```bash
cargo build --release
# Use perf (Linux), Instruments (macOS), or flamegraph
cargo install flamegraph
cargo flamegraph -- main
```

> [!danger]
> // Premature optimization করো না! প্রথমে correct code লেখো, তারপর profile করে bottleneck খুঁজে বের করো, তারপর optimize করো। Rust এর default performance অনেক ভালো — কম optimize করতে হয়।

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
> // Rust শেখা একটা journey। Ownership, borrowing, lifetimes — শুরুতে কঠিন, কিন্তু একবার click করলে তুমি Rust ছাড়া আর কিছুতে কাজ করতে চাইবে না। কারণ Rust তোমাকে confidence দেয় — "if it compiles, it works"।

## Summary

Idiomatic Rust = clean, safe, আর performant code। Clippy আর fmt তোমার guide। `&str` over `String`, iterator over loop, `?` over match, newtype for safety, builder pattern for config। Error handling এ typed error (library) বা anyhow (app)। Performance এ profile first, optimize later। এখন তুমি Rust এ কোড লেখার জন্য ready — go build something awesome!