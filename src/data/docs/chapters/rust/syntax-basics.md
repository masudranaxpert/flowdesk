# Syntax আর বেসিক কনসেপ্ট

আগের chapter এ Rust ইনস্টল করলাম। এবার চলো আসল syntax শিখি — variable, data type, mutability, shadowing সব। Python/C++ এর সাথে তুলনা করে বুঝবো।

## Variable — ডেটা রাখার বাক্স

Rust এ variable তৈরি করা হয় `let` দিয়ে:

```rust
let age = 25;
let name = "Karim";
let height = 5.9;
let is_student = true;
```

Python এর মতোই দেখতে, কিন্তু একটা বড় পার্থক্য আছে — **Rust এর variable default ভাবে immutable**। মানে একবার value দিলে আর বদলানো যাবে না:

```rust
let x = 5;
x = 6; // ERROR! cannot assign twice to immutable variable
```

> [!warn]
> Python/C++ এ variable সবসময় mutable। কিন্তু Rust এ যদি value বদলাতে চাও তবে `mut` keyword লাগবে। এটা Rust এর সবচেয়ে বড় design decision — **safety through immutability**।

### Mutable Variable

`mut` দিলে variable টা mutable হয়:

```rust
let mut x = 5;
println!("x = {x}"); // x = 5

x = 6;
println!("x = {x}"); // x = 6
```

> [!tip]
> Rust এ `mut` লিখতে হয় বলে তুমি সচেতনভাবে decide করো কোন variable mutable হবে। এটা bug অনেক কমায় — কারণ accidental mutation আটকে যায় compile time এ।

## Data Type

Rust statically typed — প্রতিটা value এর একটা নির্দিষ্ট type আছে। কিন্তু বেশিরভাগ ক্ষেত্রে compiler automatically infer করে নেয় (Python এর মতোই feel দেয়)।

### Integer Type

| Type | Size | Range | Python Equivalent |
|------|------|-------|-------------------|
| `i32` | 32 bit | -2³১ থেকে ২³১-১ | `int` |
| `u32` | 32 bit (unsigned) | 0 থেকে ২³²-১ | — |
| `i64` | 64 bit | বড় সংখ্যা | `int` |
| `usize` | platform dependent | array index | — |

```rust
let a: i32 = 42;
let b: u32 = 100;
let c: i64 = 1_000_000; // underscore দিয়ে readable
```

> [!note]
> Default integer type হলো `i32`। বেশিরভাগ ক্ষেত্রে এটাই ব্যবহার করবে। `usize` ব্যবহার করবে array/vector indexing এ।

### Float Type

```rust
let pi: f64 = 3.14159;  // 64-bit float (default)
let e: f32 = 2.71828;   // 32-bit float
```

### Boolean

```rust
let is_active: bool = true;
let is_rust_fun = true;  // type inferred
```

### Character

Rust এ `char` হলো 4-byte Unicode scalar value — Python এর string এর single character এর চেয়ে বেশি:

```rust
let letter = 'A';
let emoji = '🎉';
let bangla = 'ক';
```

### Tuple আর Array

```rust
// Tuple — একাধিক type এর value
let person: (&str, i32, f64) = ("Karim", 25, 5.9);
let name = person.0;  // "Karim"
let age = person.1;   // 25

// Array — fixed size, same type
let numbers: [i32; 5] = [1, 2, 3, 4, 5];
let first = numbers[0];  // 1
let zeros = [0; 10];     // 10টা 0 এর array
```

> [!danger]
> Array এর invalid index access করলে Rust **panic** করে (runtime crash)। কিন্তু C/C++ এর মতো undefined behavior হবে না। Rust bounds check করে।

## Shadowing — Rust এর মজার ফিচার

Rust এ একই নামের variable আবার declare করা যায় `let` দিয়ে। আগের variable টা shadow হয়ে যায়:

```rust
let x = 5;
let x = x + 1;       // x = 6
let x = x * 2;       // x = 12
let x = "twelve";    // x এখন string! type change করা গেলো!
```

> [!tip]
> Shadowing এর সবচেয়ে বড় সুবিধা — **type পরিবর্তন করা যায়** একই নামে। `mut` দিয়ে এটা করা যায় না কারণ `mut` same type রাখে।

Python এ এটা reassignment, কিন্তু Rust এ shadowing একটা নতুন variable তৈরি করে — পুরোনোটা যখন scope ছাড়বে তখন drop হবে।

## Type Annotation

বেশিরভাগ সময় compiler type infer করে। কিন্তু কখনো সখ্যা সখ্যা explicitly বলে দিতে হয়:

```rust
let guess: u32 = "42".parse().expect("Not a number!");
let numbers: Vec<i32> = Vec::new();
```

## println! আর Formatting

Rust এ print করার জন্য `println!` macro ব্যবহার হয়:

```rust
let name = "Sadia";
let age = 22;

// {} — Display format
println!("আমার নাম {}, বয়স {}", name, age);

// নাম দিয়ে (Rust 1.58+)
println!("আমার নাম {name}, বয়স {age}");

// Debug format (যেকোনো type এর জন্য)
let arr = [1, 2, 3];
println!("Array: {:?}", arr);  // Array: [1, 2, 3]

// Pretty debug
println!("Array: {:#?}", arr);
```

> [!example]
> Python এর f-string আর Rust এর `{name}` syntax প্রায় একই। তবে Rust এ `{:?}` debug format বেশি শক্তিশালী — যেকোনো struct, enum, array সুন্দর করে print করে।

## const আর static

Compile-time constant এর জন্য `const`:

```rust
const MAX_USERS: u32 = 100_000;
const PI: f64 = 3.14159265359;
```

> [!warn]
> `const` আর `let` এর পার্থক্য — `const` এর value compile time এই জানা থাকতে হবে। কোনো function call বা runtime computation হবে না। naming convention হলো UPPER_SNAKE_CASE।

## Comment

```rust
// Single line comment

/// Doc comment (function/struct এর উপরে)
/// cargo doc দিয়ে documentation generate হয়

//! Module level doc comment
```

> [!note]
> Rust এ doc comment (`///`) আসলে documentation tool এর জন্য। `cargo doc` চালালে HTML documentation তৈরি হয়। Python এর docstring এর মতো, কিন্তু আরো powerful।

## Function — ভূমিকা

Function লেখা হয় `fn` দিয়ে:

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b   // শেষ expression হলো return value (semicolon নেই!)
}

fn greet(name: &str) {
    println!("হ্যালো, {}!", name);
}

fn main() {
    let result = add(3, 5);
    greet("Karim");
}
```

> [!danger]
> Rust এ `->` দিয়ে return type বোঝায়। আর শেষ line এ যদি **semicolon না থাকে**, সেটা return value হিসেবে কাজ করে। এটা Rust এর একটা unique নিয়ম — **expression vs statement**।

### Expression vs Statement

```rust
// Statement — value return করে না (semicolon আছে)
let x = 5;

// Expression — value return করে (semicolon নেই)
let y = {
    let z = 3;
    z + 1   // semicolon নেই → এটাই block এর value
};          // y = 4

// Statement হিসেবে লিখলে return হবে না
let w = {
    let z = 3;
    z + 1;  // semicolon আছে → এটা statement, return করবে না
};          // ERROR!
```

> [!tip]
> এই expression/statement distinction হলো Rust এর সবচেয়ে গুরুত্বপূর্ণ syntax rule। মনে রাখবে — **semicolon দিলে statement, না দিলে expression**।

## একসাথে সব — BMI Calculator

```rust
use std::io;

fn main() {
    println!("ওজন কত (kg)?");
    let mut weight = String::new();
    io::stdin().read_line(&mut weight).expect("Failed");
    let weight: f64 = weight.trim().parse().expect("Not a number");

    println!("উচ্চতা কত (meter)?");
    let mut height = String::new();
    io::stdin().read_line(&mut height).expect("Failed");
    let height: f64 = height.trim().parse().expect("Not a number");

    let bmi = weight / (height * height);
    println!("তোমার BMI: {:.2}", bmi);

    let category = if bmi < 18.5 {
        "underweight"
    } else if bmi < 25.0 {
        "normal"
    } else {
        "overweight"
    };

    println!("তুমি {}", category);
}
```

> [!example]
> খেয়াল করো — `weight` variable দুইবার ব্যবহার হয়েছে কিন্তু দ্বিতীয়বার `let` দিয়ে shadow করা হয়েছে (string থেকে float এ convert)। এটাই shadowing এর real-world use case।

## Summary

এই chapter এ দেখলাম — immutable by default, `mut`, data types, shadowing, function, expression vs statement। Rust এর syntax C++ এর মতো, কিন্তু safety rule Python এর মতো strict। পরের chapter এ control flow শিখবো।