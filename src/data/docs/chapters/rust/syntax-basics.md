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

> [!note]
> এই ERROR টা ধরা হয় কোথায়? **Compile time এ, type check এর সময়।** প্রতিটা binding এর সাথে compiler একটা "mutable কিনা" flag রাখে। `mut` ছাড়া ঘোষিত variable এ assignment দেখলেই সে E0384 error দেখায় — তোমার binary তৈরিই হবে না। মানে এই check এর runtime cost **শূন্য** — চলন্ত program এ কোথাও কেউ কিছু check করছে না।

> [!warn]
> Python/C++ এ variable default ভাবে mutable (C++ এ opt-in `const` আছে, Python এ সেটাও নেই)। কিন্তু Rust এ যদি value বদলাতে চাও তবে `mut` keyword লাগবে — default immutable। এটা Rust এর সবচেয়ে বড় design decision — **safety through immutability**।

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
| `i32` | 32 bit | -2³¹ থেকে 2³¹-1 | `int` |
| `u32` | 32 bit (unsigned) | 0 থেকে 2³²-1 | — |
| `i64` | 64 bit | -2⁶³ থেকে 2⁶³-1 | `int` |
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

> [!note]
> **Bounds check এর ভেতরে কী হয়?** `numbers[10]` জাতীয় access এ compiler আগে একটা compare + branch generate করে — `index >= len` হলে সরাসরি panic: `index out of bounds: the len is X but the index is Y`। Check pass করলে তবেই আসল memory read: `*(ptr + index * 4)`। খরচ প্রতি access এ একটা compare — নগণ্য। আর LLVM যদি প্রমাণ করতে পারে index সবসময় valid (যেমন `for i in 0..5` loop এ `numbers[i]`), check টা সম্পূর্ণ মুছে দেয় — C এর মতো raw speed, safety সহ।

## Builtins কোথা থেকে আসে — `String::from` আসলে কী?

এখন থেকে তুমি হাজার হাজার এমন জিনিস দেখবে — `String::from(...)`, `Some(42)`, `Vec::new()`, `x.parse()`, `println!`। মনে হবে ভাষার ভেতরে বানানো কোনো জাদু। আসল গল্পটা অনেক সহজ, আর একবার এই ছবিটা মাথায় ঢুকলে আর কোনো builtin "অচেনা" লাগবে না।

### সবাই আসলে library থেকে এসেছে

Rust ভাষার keyword সংখ্যা মাত্র ~৩৫টা (`let`, `fn`, `match`, `pub`...)। `String`, `Vec`, `Option`, `Some`, `Result`, `Box` — এগুলোর **কোনোটাই keyword না**। সবগুলো সাধারণ type/function, শুধু আসে standard library (**std**) থেকে। আর যেগুলো খুব বেশি লাগে, সেগুলো **prelude** নামের একটা auto-import তালিকায় রাখা হয়েছে — প্রতিটা Rust ফাইলের উপরে না লিখেই compiler নিজে থেকে ঢুকিয়ে দেয়:

```rust
// প্রত্যেক ফাইলের ভেতরে অদৃশ্যভাবে এটা চলে আছে:
use std::prelude::v1::*;
// এই তালিকাতেই আছে: String, Vec, Option, Some, None, Result, Ok, Err,
// Box, clone, drop, Drop, Into, ToString, ... আরও কিছু
```

মানে `Some(42)` লিখলে আসলে ঘটনা এটা — prelude থেকে `Some` নামটা এসেছে, আর সেটা একটা **enum variant**। (Enum কী — পরের chapter গুলোতে বিস্তারিত; আপাতত এটুকু জেনে রাখো: `Option` নামের একটা enum আছে যার দুটো variant `Some` আর `None`। মজার ব্যাপার — data বহন করা variant নিজেই একটা ছোট function, `Some(42)` মানে "42 ঢুকিয়ে একটা Some বানাও"। তাই `let x: Option<i32> = Some(42);` লেখা যায়।)

### `::` আর `.` — দুই রকম ডাকার নিয়ম

```rust
let s = String::from("hello");   // :: — Type এর namespace-এর function (associated function)
let n = s.len();                 // .  — কোনো value-র উপর method
```

- **`String::from(...)`** — `String` type-এর নাম ধরে ডাকা function। এটা কোনো value-র উপর চলে না; বরং **নতুন value বানিয়ে দেয়** (একে constructor-ও বলে)। `Vec::new()`, `Box::new(x)`, `Option::Some(x)` — সব এই প্যাটার্ন। ভেতরে কোনো magic নেই — `structs-methods` chapter এ দেখবে এগুলো `impl` block-এ লেখা সাধারণ function, `self` parameter ছাড়া।
- **`s.len()`** — বর্তমান value-র উপর method; ভেতরে `len(&s)`-এর মতোই কাজ।
- **নামের শেষে `!`** (`println!`, `vec!`) — macro; compile time এ code generate করে (macros chapter)।
- **`#[...]`** (`#[derive(Debug)]`) — compiler-কে দেওয়া নির্দেশ (attribute)।

| চেহারা | কী | উদাহরণ |
|--------|-----|---------|
| `Type::fn()` | Type-এর associated function — নতুন value বানায় | `String::from`, `Vec::new` |
| `value.method()` | value-র উপর method | `s.len()`, `v.push(1)` |
| `name!()` | macro — compile-time codegen | `println!`, `vec!` |
| `#[name]` | compiler attribute | `#[derive(Debug)]` |

### `let s = "hello"` লিখলেই তো হতো?

হতো! কিন্তু দুটো জিনিস আলাদা:

```rust
let a = "hello";                 // &str — binary-র read-only section-এ বসে থাকা literal
let b = String::from("hello");   // String — runtime-এ heap-এ নতুন buffer বানিয়ে copy
```

`"hello"` literal ওখানেই থাকবে যেখানে compile হওয়ার সময় বসানো হয়েছে — ওটা বদলানো, বাড়ানো যায় না। `String::from` heap-এ তোমার নিয়ন্ত্রণের একটা **বাড়ানো-যোগ্য copy** বানায়। কখন কোনটা — সেটাই `strings` chapter-এর মূল আলোচনা; ownership chapter-এ এর গভীর কারণ পাবে। আপাতত নিয়ম: শুধু পড়বে → literal/`&str` যথেষ্ট; modify করবে বা own করবে → `String`।

### চেনা-না জিনিস পেলে করো কী?

প্রতিটা std type/method-এর বিস্তারিত doc আছে — terminal-এ `cargo doc --open` চালালেই **নিজের project-এর সাথে std-র documentation** খুলবে, অথবা [doc.rust-lang.org/std](https://doc.rust-lang.org/std/)। Editor-এ `String::` লিখে থামলে autocomplete-এ সব associated function দেখাবে — `.method` গুলোও তাই। এই দুটো অভ্যাসই হলো "আসলে builtin গুলোর ভেতরটা শেখার" প্রধান দরজা; এই docs-এর প্রতিটা chapter সেই ভেতরটাই একটা একটা করে খুলে দেখাচ্ছে।

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

### Shadowing এর ভেতরে আসলে কী হয়?

শব্দটা বড় শোনালেও ভেতরের ঘটনা সহজ — shadowing মূলত একটা **compile time এর name-resolution** ব্যাপার:

১. প্রতিটা `let x = ...` একটা **নতুন binding** তৈরি করে — নতুন stack slot, চাইলে নতুন type।
২. এরপর `x` নাম দেখলে compiler "সবচেয়ে সাম্প্রতিক" binding টাকে ধরে — পুরোনো binding টা scope এ এখনো বেঁচে আছে, শুধু নাম দিয়ে পৌঁছানোর রাস্তাটা বন্ধ।
৩. পুরোনো value টা তার নিজের scope শেষ না হওয়া পর্যন্ত drop হয় না।

Runtime এ কোনো "shadow lookup" চলে না। আর LLVM দেখে যে পুরোনো value আর কেউ read করছে না, তাই বেশিরভাগ সময় একই stack slot দ্বিতীয়বার ব্যবহার করে নেয়। মোট কথা: shadowing এর cost **zero**। Python এ `x = ...` হলো একই object এর নাম বদলানো, এখানে আসলেই নতুন binding — এই পার্থক্যটাই type change করতে দেয়।

## Type Annotation

বেশিরভাগ সময় compiler type infer করে। কিন্তু কখনো সখ্যা সখ্যা explicitly বলে দিতে হয়:

```rust
let guess: u32 = "42".parse().expect("Not a number!");
let numbers: Vec<i32> = Vec::new();
```

> [!note]
> **`.parse()` এর ভেতরে:** string এর character গুলো একটা একটা পড়ে digit এ convert করে, শেষে `Result<u32, ParseIntError>` দেয় — সফল হলে value, ব্যর্থ হলে error object। কোনো crash না, খরচ O(n)।
> Annotation কেন লাগে? `parse` generic — `u32`, `i64`, `f64` যেটার জন্যই কাজ করতে পারত। কোন type বানাবে সেটা compiler কে বলে দিতে হয়, নাহলে "type annotations needed" error।
> **`Vec::new()`** এখনো একটা byte ও allocate করে না — খালি header মাত্র। প্রথম `push` এ গিয়ে memory নেবে (বিস্তারিত collections chapter এ)।

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

### `println!` এর ভেতরে — compile time এ কী ঘটে?

নামের শেষের `!` বলে দিচ্ছে এটা function না — **macro**। Compile এর সময় rustc এই লাইনটাকে ভেঙে মোটামুটি এই কোড বানায়:

```rust
// println!("আমার নাম {}, বয়স {}", name, age)
// আসলে expand হয়ে এটা হয় (simplified):
{
    let args = format_args!("আমার নাম {}, বয়স {}", name, age); // format টুকরোগুলো compile time এই জোড়া লাগানো
    std::io::_print(args); // stdout এ write — ভেতরে lock + write
}
```

এই expansion এর ফলে তিনটা সুবিধা, সবগুলো compile time এ:

১. **Format string check compile time এ** — `{}` এর সংখ্যা আর argument এর সংখ্যা মিলছে না? Compile error, run করার আগেই ধরা। C এর `printf` এ এটা runtime garbage output, Python এ runtime exception।
২. **`{name}` implicit capture** — compiler ওই নামের local variable নিজেই খুঁজে নেয়, আলাদা pass করতে হয় না।
৩. **`{:?}` মানে Debug** — ওই type এর `Debug` trait এর `fmt` method compile time এ বসে যায়, তাই যেকোনো Debug-implementing type এ চলে।

Runtime এ যা হয়: stdout lock করে formatted টেক্সট একবারে write (line-buffered) — তাই thread একাধিক হলেও print গুলো মেশে না। Write fail করলে (যেমন stdout বন্ধ) `println!` **panic** করে।

## const আর static

Compile-time constant এর জন্য `const`:

```rust
const MAX_USERS: u32 = 100_000;
const PI: f64 = 3.14159265359;
```

> [!warn]
> `const` আর `let` এর পার্থক্য — `const` এর value compile time এই জানা থাকতে হবে। কোনো function call বা runtime computation হবে না। naming convention হলো UPPER_SNAKE_CASE।

> [!note]
> **`const` এর ভেতরে:** এটা আসলে variable-ই না — compiler প্রতিটা ব্যবহারের জায়গায় value টা সরাসরি **inline** করে দেয় (C এর `#define` এর মতো, কিন্তু type-checked)। তাই `MAX_USERS` এর নিজের কোনো memory address থাকাও দরকার নেই — `100_000` সরাসরি instruction এ বসে যেতে পারে। Runtime cost: zero।

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

// Statement হিসেবে লিখলে ব্লকের মান হয় unit type `()`
let w: i32 = {
    let z = 3;
    z + 1;  // semicolon আছে → এটি statement, কোনো মান রিটার্ন করে না (রিটার্ন করে `()`)
};          // COMPILER ERROR! expected `i32`, found `()`
```

> [!tip]
> এই expression/statement পার্থক্য হলো Rust এর সবচেয়ে গুরুত্বপূর্ণ syntax rule। মনে রাখবে — **semicolon দিলে statement (মান হয় `()`), semicolon না দিলে expression (শেষ এক্সপ্রেশনের মানটিই ব্লকের রিটার্ন মান)**।

> [!note]
> ভেতরের ঘটনা: প্রতিটা block `{}` একটি expression, যার টাইপ হলো তার শেষ এক্সপ্রেশনের টাইপ। কিন্তু এক্সপ্রেশনের পরে `;` বসালে সেটি statement হয়ে যায় আর মান দেয় **`()`** — unit type, মানে "কিছুই না"। ফাংশন বা ব্লকে কোনো টাইপ প্রত্যাশা করলে unit type মেলায় না বলে কম্পাইলার এরর দেয়।

## Type Casting — কোনো Implicit টাইপ রূপান্তর নেই

Python বা C/C++ এ ছোট টাইপ স্বয়ংক্রিয়ভাবে বড় টাইপে কনভার্ট হয়ে যায় (যেমন `5 + 2.5` সরাসরি `7.5` হয়ে যায়)। কিন্তু Rust এ **implicit conversion সম্পূর্ণ নিষিদ্ধ**:

```rust
let a: i32 = 10;
let b: f64 = 2.5;

// ERROR! Rust এ দুটি ভিন্ন টাইপের মধ্যে সরাসরি অপারেশন করা যায় না
// let sum = a + b; 

// সঠিক সমাধান: `as` কিওয়ার্ড দিয়ে explicit type casting:
let sum = (a as f64) + b; // 12.5 (উভয়ই f64)
println!("Sum: {}", sum);
```

> [!note]
> Rust কেন কঠোর? কারণ implicit casting অনেক সময় সূক্ষ্ম প্রেসিলেশন লস (precision loss) বা ওভারফ্লোর সৃষ্টি করে। তাই প্রোগ্রামারকে `as` কিওয়ার্ড দিয়ে সচেতনভাবে রূপান্তর করতে বাধ্য করা হয়।

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

### BMI প্রোগ্রামের লাইন-বাই-লাইন বিশ্লেষণ:
1. **`let weight: f64 = weight.trim().parse().expect("Not a number");`**:
   - এখানে একই নামের `weight` ভেরিয়েবলকে **shadowing** করা হয়েছে।
   - প্রথমে ইউজার থেকে নেওয়া `String` বাফারের স্পেস বাদ দিয়ে `.trim()` করা হয়, তারপর `.parse()` স্ট্রিং থেকে `f64` ফ্লোটিং-পয়েন্ট সংখ্যায় রূপান্তর করে।
   - টাইপ অ্যানোটেশন `: f64` কম্পাইলারকে স্পষ্ট করে দেয় কোন সংখ্যায় পার্স করতে হবে।
2. **`let bmi = weight / (height * height);`**:
   - গাণিতিক হিসাব। দুটি `f64` এর মধ্যে ভাগ ও গুণ হচ্ছে।
3. **`println!("তোমার BMI: {:.2}", bmi);`**:
   - `{:.2}` ফরম্যাট স্পেসিফায়ার নির্দেশ করে দশমিকের পর ঠিক ২ ঘর পর্যন্ত সংখ্যাটি প্রিন্ট করতে হবে।
4. **`let category = if bmi < 18.5 { ... } else { ... };`**:
   - `if/else` এখানে একটি এক্সপ্রেশন হিসেবে কাজ করছে। প্রতিটি ব্রাঞ্চ থেকে একটি `&str` মান রিটার্ন হয়ে সরাসরি `category` ভেরিয়েবলে বসে যাচ্ছে। কোনো টেনারি অপারেটর বা বাহ্যিক মিউটেবল ভেরিয়েবল লাগে না।

## Summary

এই অধ্যায়ে আমরা শিখলাম:
- ভেরিয়েবল ডিফল্টভাবে immutable; পরিবর্তনযোগ্য করতে `let mut` লাগে।
- প্রিমিটিভ স্কেলার টাইপ (integers, floats, bool, char) এবং কম্পাউন্ড টাইপ (tuple, array)।
- `as` কিওয়ার্ড দিয়ে explicit type casting করতে হয়; implicit casting নেই।
- Shadowing দিয়ে একই ভেরিয়েবল নাম ব্যবহার করে টাইপ ও মান উভয়ই নিরাপদে প্রতিস্থাপন করা যায়।
- ব্লকের শেষ লাইনে সেমিকোলন না থাকলে তা রিটার্ন এক্সপ্রেশন, আর সেমিকোলন দিলে স্টেটমেন্ট (মান হয় `()`)।
পরের অধ্যায়ে আমরা Rust-এর decision-making ও control flow (if/else, loops, match) বিস্তারিত শিখব।