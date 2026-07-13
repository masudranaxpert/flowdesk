# Macros — Declarative ও Procedural

Rust এ macro হলো code যেটা code generate করে — metaprogramming। C এর `#define`, C++ এর template, Python এর decorator — সব থেকে শক্তিশালী। দুই রকম macro আছে: **declarative** (`macro_rules!`) আর **procedural** (derive, attribute, function-like)।

## Macro কী? কেন?

```rust
// println! হলো macro, function না
println!("Hello, {}!", "world");

// function দিয়ে এটা করা কঠিন — variable argument
// macro দিয়ে সহজ
```

### Function vs Macro

| Feature | Function | Macro |
|---------|----------|-------|
| When evaluated | Runtime | Compile-time |
| Argument count | Fixed | Variable |
| Type checking | Per-call | After expansion |
| Recursion | Runtime | Compile-time (token expansion) |

> [!note]
// Function fixed argument count চায়। কিন্তু `println!("{} {}", a, b)` এ variable argument! Macro দিয়েই এটা সম্ভব। Macro compile হওয়ার আগেই expand হয়ে code generate করে — runtime এ কোনো overhead নেই।

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
    greet!("হাই", "Sadia");      // হাই, Sadia!
}
```

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
// `$(...)*` হলো "zero or more" repetition, `$(...)+` হলো "one or more"। এগুলো দিয়ে variable argument macro বানানো যায় — `vec![]`, `println!`, `format!` সব এই দিয়ে বানানো।

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
// এটা `vec!` macro এর simplified version। খেয়াল করো — তিন pattern: empty, `[value; count]`, আর `[a, b, c, ...]`। Pattern matching দিয়ে যেটা match করে সেটাই expand হয়।

## Common Built-in Macros

```rust
// Printing
println!("Hello {}", "world");
eprintln!("Error: {}", error);
print!("No newline");
format!("{} {}", a, b);

// Debug
dbg!(some_variable);          // stderr এ print করে value + location
println!("{:?}", debug_value);

// Assert
assert!(condition);
assert_eq!(a, b);
assert_ne!(a, b);
debug_assert!(condition);     // release build এ skip

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
// `dbg!()` হলো Rust এর সবচেয়ে useful debug macro — এটা value print করে সাথে file:line information। `println!` এর চেয়ে debugging এ অনেক বেশি useful।

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
// Procedural macro complex! `syn` (parse Rust code), `quote` (generate Rust code), `proc-macro2` — তিনটা crate লাগে। কিন্তু `#[derive(Debug)]` এর মতো derive macro ব্যবহার করা সহজ — বানানোই কঠিন।

### 2. Attribute Macro

Function বা struct এ attribute দিয়ে transform:

```rust
#[route(GET, "/users")]
fn get_users() { ... }

// Attribute macro এটাকে transform করে
```

### 3. Function-Like Macro

`macro_rules!` এর মতো কিন্তু procedural:

```rust
let sql = sql! {
    SELECT * FROM users WHERE age > 18
};
// sql! macro SQL syntax parse করে compile-time validate
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
// তোমার প্রায়ই procedural macro বানাতে হবে না — common গুলো crate আকারে available। শুধু `#[derive(...)]` দিয়ে use করো। বানানো advanced topic — `serde` এর macro গুলো দেখে inspire হও।

## Macro Hygiene

Rust এর macro hygienic — macro এর ভেতরের identifier caller এর variable এর সাথে conflict করে না:

```rust
macro_rules! using_x {
    ($e:expr) => {
        {
            let x = 42;  // macro এর নিজস্ব x
            $e           // caller এর expression
        }
    };
}

fn main() {
    let x = "hello";  // caller এর x
    let result = using_x!(x.len());  // এখানে x হলো caller এর x
    println!("{}", result);  // 5 (caller এর x এর length)
}
```

> [!note]
// C এর macro এ identifier conflict হয় (unhygienic)। Rust এ এটা safe — macro এর ভেতরের `x` আর caller এর `x` আলাদা। এটাই macro hygiene।

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
// এখানে `info!`, `error!`, `debug!` macro বানানো হয়েছে — সব `log!` macro call করে। `debug!` শুধু debug build এ print করে (`#[cfg(debug_assertions)]`)। Release build এ এই code থাকবেই না — zero overhead!

## Python vs Rust — Metaprogramming

| Feature | Python | Rust |
|---------|--------|------|
| Decorator | `@decorator` | `#[attribute]` |
| Code generation | `exec()`, metaclass | Macro |
| Compile-time | None | Macro (powerful) |
| Type introspection | `type()`, `isinstance()` | Trait + generic |
| Risk | Runtime error | Compile-time safe |

> [!tip]
// Rust এর macro Python এর decorator এর চেয়ে অনেক বেশি powerful। Code generate করা যায় compile-time এ। কিন্তু সাথে complexity — macro গুলো পড়তে কঠিন। সাবধানে ব্যবহার করো।

## Summary

Macro হলো Rust এর metaprogramming tool। Declarative (`macro_rules!`) — pattern matching দিয়ে code generate। Procedural — `syn` + `quote` দিয়ে custom derive/attribute। `println!`, `vec!`, `dbg!` — সব macro। বেশিরভাগ সময় তোমাকে macro বানাতে হবে না — built-in আর crate এর macro গুলোই যথেষ্ট। শেষ chapter এ best practices দেখবো।