# Macros — Declarative ও Procedural

Rust এ macro হলো code যেটা code generate করে — metaprogramming। C এর `#define`, C++ এর template, Python এর decorator — সব থেকে শক্তিশালী। দুই রকম macro আছে: **declarative** (`macro_rules!`) আর **procedural** (derive, attribute, function-like)।

## Macro কী? কেন?

```rust
// println! is a declarative macro, not a function
println!("Hello, {}!", "world");

// Variadic arguments handled cleanly without runtime overhead
// Pattern-based syntax extension:
```

### Function vs Macro

| Feature | Function | Macro |
|---------|----------|-------|
| When evaluated | Runtime | Compile-time |
| Argument count | Fixed | Variable |
| Type checking | Per-call | After expansion |
| Recursion | Runtime | Compile-time (token expansion) |

> [!note]
> Function fixed argument count চায়। কিন্তু `println!("{} {}", a, b)` এ variable argument! Macro দিয়েই এটা সম্ভব। Macro compile হওয়ার আগেই expand হয়ে code generate করে — runtime এ কোনো overhead নেই।

> [!note]
> **Macro কম্পাইলের কোন ধাপে চলে?** Pipeline মোটামুটি এমন: **tokenize → macro expand → name resolution → type check → codegen**। `macro_rules!` খুব আগে, parsing এর মাঝপথে expand হয় — generated code পরের ধাপে (type check সহ) হাতে-লেখা code এর মতোই ঢোকে। Side effect: macro এর ভেতরের **type error ধরা পড়ে expansion এর পরে**, call site এ — তাই macro error এর message অনেক সময় দূরের জায়গা দেখায়। আর runtime overhead **শূন্য**: expansion এর পরে macro-generated code আর নিজে লেখা সেই code এর মধ্যে কোনো পার্থক্য নেই।

## Declarative Macro — `macro_rules!`

### Basic Syntax

```rust
macro_rules! say_hello {
    () => {
        println!("Hello!");
    };
}

fn main() {
    say_hello!();  // Hello!
}
```

### Pattern Matching

Macro parameter pattern match করে:

```rust
macro_rules! greet {
    // Empty
    () => {
        println!("Hello, stranger!");
    };

    // Single name
    ($name:expr) => {
        println!("Hello, {}!", $name);
    };

    // Name with greeting
    ($greeting:expr, $name:expr) => {
        println!("{}, {}!", $greeting, $name);
    };
}

fn main() {
    greet!();                    // Hello, stranger!
    greet!("Karim");             // Hello, Karim!
    greet!("Hi", "Sadia");       // Output: Hi, Sadia!
}
```

> [!note]
> **`macro_rules!` এর ভেতরে**: তোমার source আগে **token tree** এ ভাগ হয় (AST না — শুধু bracket-এ গুছানো token গাছ)। Invocation এলে token tree টা pattern গুলোর সাথে **উপর থেকে নিচে** মেলানো হয় — প্রথম যেটা match করে সেটাই expand, **backtracking নেই**। তাই pattern এর order গুরুত্বপূর্ণ: specific টা আগে, সাধারণ পরে। আর `$x:expr` জাতীয় fragment এ সামান্য parse হয়, তাই তার পরে শুধু কিছু নির্দিষ্ট token (`=>`, `,`, `;` ইত্যাদি) আসতে পারে — ambiguity আটকাতে এই নিয়ম।

### Fragment Specifier

Macro parameter এর ধরন specify করা যায়:

| Specifier | কী accept করে | Example |
|-----------|---------------|---------|
| `$x:expr` | Expression | `1 + 2`, `foo()` |
| `$x:ident` | Identifier | `variable_name` |
| `$x:ty` | Type | `i32`, `Vec<String>` |
| `$x:stmt` | Statement | `let x = 5;` |
| `$x:block` | Block | `{ ... }` |
| `$x:literal` | Literal | `42`, `"hello"` |
| `$x:path` | Path | `std::io::Result` |

### Repetition — `$(...)*`

Variable number argument এর জন্য:

```rust
macro_rules! sum {
    // Zero or more
    ($($x:expr),*) => {
        {
            let mut total = 0;
            $(
                total += $x;
            )*
            total
        }
    };

    // Trailing comma
    ($($x:expr,)*) => {
        sum!($($x),*)
    };
}

fn main() {
    let result = sum!(1, 2, 3, 4, 5);
    println!("{}", result);  // 15

    let result2 = sum!(1, 2, 3,);
    println!("{}", result2);  // 6
}
```

> [!tip]
> `$(...)*` হলো "zero or more" repetition, `$(...)+` হলো "one or more"। এগুলো দিয়ে variable argument macro বানানো যায় — `vec![]`, `println!`, `format!` সব এই দিয়ে বানানো।

> [!note]
> **`$(...)*` expand কীভাবে হয়?** এটা **compile-time loop unrolling** — `sum!(1, 2, 3)` হলে generated code এ সোজা `total += 1; total += 2; total += 3;` বসে যায়। Runtime এ কোনো loop নেই। Macro এর "recursion" ও একই — macro নিজের আরেকটা invocation generate করে, সেটাও compile time এই খোলে; খুব গভীর হলে expansion limit ধরে compiler থামিয়ে দেয়।

### vec! Macro — Real Example

```rust
macro_rules! my_vec {
    () => { Vec::new() };

    ($elem:expr; $n:expr) => {
        vec![$elem; $n]
    };

    ($($x:expr),+ $(,)?) => {
        {
            let mut v = Vec::new();
            $(
                v.push($x);
            )+
            v
        }
    };
}

fn main() {
    let v1 = my_vec![1, 2, 3, 4, 5];
    let v2 = my_vec![];
    let v3 = my_vec![0; 10];
}
```

> [!example]
> এটা `vec!` macro এর simplified version। খেয়াল করো — তিন pattern: empty, `[value; count]`, আর `[a, b, c, ...]`। Pattern matching দিয়ে যেটা match করে সেটাই expand হয়।

> [!note]
> **আসল `vec!` আরো চালাক**: `vec![1, 2, 3]` এ আলাদা আলাদা `push` করে capacity বাড়ায় না — সব element একবারে এক টুকরো buffer এ বসিয়ে সরাসরি `Vec` বানায়, মোটে **একটাই allocation**। `vec![0u8; 1_000_000]` জাতীয় zero-filled ক্ষেত্রে allocator এর `alloc_zeroed` fast path কাজে লাগে — OS এ zero page ready-made, তাই প্রায় বিনামূল্যে। `my_vec!` এর `push` loop ঠিকই চলে, কিন্তু capacity 0 থেকে বাড়তে বাড়তে কয়েকবার realloc হয়।

## Common Built-in Macros

```rust
// Printing
println!("Hello {}", "world");
eprintln!("Error: {}", error);
print!("No newline");
format!("{} {}", a, b);

// Debug
dbg!(some_variable);          // Prints value and source code location to stderr
println!("{:?}", debug_value);

// Assert
assert!(condition);
assert_eq!(a, b);
assert_ne!(a, b);
debug_assert!(condition);     // Stripped from optimized release builds

// Compile-time
env!("CARGO_PKG_VERSION");    // compile-time env variable
file!();                       // current file name
line!();                       // current line number
column!();                     // current column
module_path!();                // module path

// include
include_str!("file.txt");     // file content compile-time include
include_bytes!("data.bin");   // binary file include
concat!("a", "b", "c");       // compile-time string concat

// Write
writeln!(io::stdout(), "text")?;
write!(buffer, "text")?;

// Matches
matches!(value, pattern);     // true/false if matches
```

> [!note]
> `dbg!()` হলো Rust এর সবচেয়ে useful debug macro — এটা value print করে সাথে file:line information। `println!` এর চেয়ে debugging এ অনেক বেশি useful।

**`println!` এর ভেতরে কী হয়?** Expansion মোটামুটি এমন (simplified):

```rust
// Expansion of formatted print macro:
{
    std::io::_print(format_args!("hi {0}\n", name));
}
```

`_print` এ `stdout()` এর **lock** নেওয়া হয় (দুই thread একসাথে print করলে যাতে অক্ষর মিশে না যায়), তারপর formatted output টা `LineWriter` এ যায় — stdout line-buffered, newline দেখলেই flush। মানে প্রতিটা `println!` = lock + write + unlock; hot loop এ নিজে একবার lock ধরে `writeln!` করলে দ্রুত হয়।

`assert_eq!(a, b)` এর expansion ও মজার (simplified):

```rust
match (&a, &b) {
    (l, r) if *l == *r => {}   // Values equal: assertion succeeds without action
    _ => panic!(
        "assertion `left == right` failed\n  left: {:?}\n right: {:?}",
        l, r
    ),  // Includes caller file!() and line!() source locations
}
```

এজন্যই দুই type এ `PartialEq` + `Debug` দুটোই দরকার — failure এ দুই পাশের মান debug format এ ছাপা হয় (testing chapter এ আরো বিস্তারিত আছে)। আর `env!`/`include_str!`/`concat!` জাতীয় compile-time macro গুলো value টা **binary তে বসিয়ে দেয়** — runtime এ কোনো খোঁজাখুঁজি নেই।

## Procedural Macro

Procedural macro হলো Rust code যেটা Rust code generate করে। তিন রকম:

### 1. Derive Macro

সবচেয়ে common — `#[derive(...)]`:

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}
```

Custom derive macro বানাতে হলে:

```toml
# Cargo.toml (separate crate)
[lib]
proc-macro = true

[dependencies]
syn = "2"
quote = "1"
proc-macro2 = "1"
```

```rust
// src/lib.rs (derive macro crate)
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    let expanded = quote! {
        impl #name {
            fn hello_macro() {
                println!("Hello from {}!", stringify!(#name));
            }
        }
    };

    expanded.into()
}
```

```rust
// Usage
use hello_macro::HelloMacro;

#[derive(HelloMacro)]
struct Pancakes;

fn main() {
    Pancakes::hello_macro();  // Hello from Pancakes!
}
```

> [!danger]
> Procedural macro complex! `syn` (parse Rust code), `quote` (generate Rust code), `proc-macro2` — তিনটা crate লাগে। কিন্তু `#[derive(Debug)]` এর মতো derive macro ব্যবহার করা সহজ — বানানোই কঠিন।

> [!note]
> **Derive আসলে proc-macro — "code লেখার code"**। Compile time এ compiler তোমার struct এর tokens (`TokenStream`) proc-macro crate কে দেয় — এই crate টা আলাদা binary হিসেবে **compiler নিজেই চালায়**। ওই code `syn` দিয়ে parse করে, `quote!` দিয়ে নতুন tokens লেখে, generated tokens (যেমন `impl Debug for Point { … }`) তোমার crate এ ঢুকে type check হয়। তাই `#[derive(Debug)]` এর সব খরচ compile time এ — binary তে কোনো reflection বা runtime metadata নেই, Python এর metaclass এর মতো runtime overhead কিছুই নেই।

### 2. Attribute Macro

Function বা struct এ attribute দিয়ে transform:

```rust
#[route(GET, "/users")]
fn get_users() { ... }

// Attribute macro transforms item syntax at compile time
```

### 3. Function-Like Macro

`macro_rules!` এর মতো কিন্তু procedural:

```rust
let sql = sql! {
    SELECT * FROM users WHERE age > 18
};
// Procedural macro validates query syntax during compilation
```

## Popular Procedural Macro Crates

| Crate | কী করে |
|-------|---------|
| `serde` | `#[derive(Serialize, Deserialize)]` — JSON, YAML |
| `clap` | `#[derive(Parser)]` — CLI argument parsing |
| `thiserror` | `#[derive(Error)]` — error type |
| `tokio` | `#[tokio::main]` — async entry point |
| `rocket` | `#[get("/")]` — web framework route |
| `actix` | `#[get("/api")]` — web framework route |

> [!tip]
> তোমার প্রায়ই procedural macro বানাতে হবে না — common গুলো crate আকারে available। শুধু `#[derive(...)]` দিয়ে use করো। বানানো advanced topic — `serde` এর macro গুলো দেখে inspire হও।

## Macro Hygiene

Rust এর macro hygienic — macro এর ভেতরের identifier caller এর variable এর সাথে conflict করে না:

```rust
macro_rules! using_x {
    ($e:expr) => {
        {
            let x = 42;  // Macro hygienic scope variable
            $e           // Caller expression evaluation
        }
    };
}

fn main() {
    let x = "hello";  // Caller scope variable
    let result = using_x!(x.len());  // Hygiene ensures x resolves in caller scope
    println!("{}", result);  // Outputs 5 (evaluates caller variable)
}
```

> [!note]
> C এর macro এ identifier conflict হয় (unhygienic)। Rust এ এটা safe — macro এর ভেতরের `x` আর caller এর `x` আলাদা। এটাই macro hygiene।

## বাস্তব উদাহরণ — Custom Logger Macro

```rust
macro_rules! log {
    ($level:expr, $($arg:tt)*) => {
        println!("[{}] {}", $level, format!($($arg)*));
    };
}

macro_rules! info {
    ($($arg:tt)*) => { log!("INFO", $($arg)*); };
}

macro_rules! error {
    ($($arg:tt)*) => { log!("ERROR", $($arg)*); };
}

macro_rules! debug {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        log!("DEBUG", $($arg)*);
    };
}

fn main() {
    info!("Server started on port {}", 8080);
    error!("Failed to connect: {}", "timeout");
    debug!("Internal state: x = {}", 42);
}
```

> [!example]
> এখানে `info!`, `error!`, `debug!` macro বানানো হয়েছে — সব `log!` macro call করে। `debug!` শুধু debug build এ print করে (`#[cfg(debug_assertions)]`)। Release build এ এই code থাকবেই না — zero overhead!

## Python vs Rust — Metaprogramming

| Feature | Python | Rust |
|---------|--------|------|
| Decorator | `@decorator` | `#[attribute]` |
| Code generation | `exec()`, metaclass | Macro |
| Compile-time | None | Macro (powerful) |
| Type introspection | `type()`, `isinstance()` | Trait + generic |
| Risk | Runtime error | Compile-time safe |

> [!tip]
> Rust এর macro Python এর decorator এর চেয়ে অনেক বেশি powerful। Code generate করা যায় compile-time এ। কিন্তু সাথে complexity — macro গুলো পড়তে কঠিন। সাবধানে ব্যবহার করো।

## Summary

Macro হলো Rust এর metaprogramming tool। Declarative (`macro_rules!`) — pattern matching দিয়ে code generate। Procedural — `syn` + `quote` দিয়ে custom derive/attribute। `println!`, `vec!`, `dbg!` — সব macro। বেশিরভাগ সময় তোমাকে macro বানাতে হবে না — built-in আর crate এর macro গুলোই যথেষ্ট। শেষ chapter এ best practices দেখবো।