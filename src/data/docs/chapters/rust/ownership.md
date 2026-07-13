# Ownership — Rust এর হার্ট

এই chapter টা সবচেয়ে গুরুত্বপূর্ণ। Ownership হলো Rust এর সবচেয়ে বড় innovation — এটাই Rust কে বাকি সব language থেকে আলাদা করে। যদি ownership না বুঝো, Rust এ কোড লিখবে না। কিন্তু একবার বুঝলে বাকি সব সহজ হয়ে যাবে।

## সমস্যা — বাকি Language এ কী হয়?

Memory management এর তিনটা way আছে:

| Way | Language | কীভাবে কাজ করে | সমস্যা |
|-----|----------|----------------|--------|
| **Manual** | C/C++ | `malloc`/`free` নিজে করো | Memory leak, double free, use-after-free |
| **Garbage Collector** | Python, Java, Go | Runtime এ GC memory clean করে | Performance overhead, unpredictable pauses |
| **Ownership** | Rust | Compile time এ memory manage | শিখতে একটু কঠিন, কিন্তু কোনো দোষ নেই! |

Rust এ কোনো GC নেই, আর কোনো manual free ও নেই। একটা নিয়ম দিয়ে সব handle হয়।

## Ownership এর ৩টা Rule

এই তিনটা rule মুখস্থ করো:

1. **প্রতিটা value এর একজন owner আছে**
2. **একই সময়ে একজনই owner থাকে**
3. **Owner scope ছাড়লে value drop (free) হয়**

ব্যস! এটাই ownership। চলো একটা একটা করে বুঝি।

### Rule ১: প্রতিটা value এর একজন owner

```rust
{
    let s = String::from("hello");  // s হলো "hello" এর owner
    // s এর scope এ থাকলে "hello" valid
    println!("{}", s);
}   // s এর scope শেষ — "hello" drop (free) হয়ে যায়
```

### Rule ২: একই সময়ে একজনই owner

যখন একটা variable আরেকটাতে assign হয়, **ownership move** হয়:

```rust
let s1 = String::from("hello");
let s2 = s1;  // ownership s1 থেকে s2 তে move হয়েছে!

println!("{}", s1);  // ERROR! s1 আর valid না
```

> [!danger]
> এটা Rust এর সবচেয়ে বিভ্রান্তিকর moment — Python/C++ থেকে এসে এটা দেখলে চমকে যাবে। Python এ `s2 = s1` দিলে দুটোই same value point করে। কিন্তু Rust এ ownership move হয়ে যায় — `s1` invalid হয়ে যায়।

### Rule ৩: Owner scope ছাড়লে drop হয়

```rust
{
    let s = String::from("hello");
}   // s drop হয়েছে — memory automatically free!
// কোনো free() বা delete লাগে না
```

## Move Semantics গভীরে

`String` হলো heap-allocated data। এর ভেতরে তিনটা জিনিস থাকে:

```
String "hello":
┌─────────────┐
│ ptr ───────────► heap: ['h','e','l','l','o']
│ len = 5     │
│ capacity = 5│
└─────────────┘
```

যখন `let s2 = s1` করা হয়, Rust pointer টা copy করে না। এটা **move** করে:

```
s1 (invalid)          s2
┌──────────┐         ┌──────────┐
│ ptr ──────────►    │ ptr ───────────► heap: ['h','e','l','l','o']
│ len = 5  │         │ len = 5  │
│ capacity │         │ capacity │
└──────────┘         └──────────┘
```

> [!note]
> কেন copy করা হয় না? কারণ যদি copy করা হতো, scope শেষে দুজনই free করতে চাইতো — **double free** problem। তাই Rust move করে — একজন owner, একবার free।

### কোন Type কপি হয়, কোনটা Move হয়?

Integer, float, bool, char এগুলো **stack** এ থাকে — সস্তা। এগুলো copy হয়:

```rust
let x = 5;
let y = x;  // copy হয়েছে
println!("{}", x);  // VALID! x এখনো valid
```

কিন্তু `String`, `Vec`, `HashMap` — যেগুলো heap data point করে — move হয়।

| Type | Behavior | কেন |
|------|----------|-----|
| `i32`, `f64`, `bool`, `char` | Copy | Stack-allocated, সস্তা |
| `(i32, i32)` | Copy | ভেতরে সব copy type |
| `[i32; 4]` | Copy | Fixed array, copy type |
| `String` | Move | Heap data point করে |
| `Vec<T>` | Move | Heap data point করে |

> [!tip]
> সাধারণ নিয়ম — **stack-allocated value copy হয়, heap-allocated value move হয়**। Integer copy করা সস্তা, কিন্তু String এর heap data copy করা ব্যয়বহুল।

### Copy Trait

নিজের type কে copy করার যোগ্য বানাতে `#[derive(Copy, Clone)]` দিতে হয় (পরের chapter এ trait শিখবো):

```rust
#[derive(Copy, Clone)]
struct Point {
    x: i32,
    y: i32,
}

let p1 = Point { x: 1, y: 2 };
let p2 = p1;  // copy — p1 এখনো valid!
```

## Function এ Ownership Transfer

Function এ value pass করলে ownership function এর parameter এ চলে যায়:

```rust
fn main() {
    let s = String::from("hello");
    takes_ownership(s);     // s এর ownership function এ চলে গেছে
    // println!("{}", s);   // ERROR! s আর valid না

    let x = 5;
    makes_copy(x);           // x copy হয়েছে
    println!("{}", x);       // VALID! x এখনো আছে
}

fn takes_ownership(some_string: String) {
    println!("{}", some_string);
}   // some_string drop হয়েছে — memory free

fn makes_copy(some_integer: i32) {
    println!("{}", some_integer);
}   // some_integer scope শেষ, কিন্তু কিছু করার নেই (copy ছিল)
```

### Function থেকে Ownership ফেরত

Function return করলে ownership caller এর কাছে ফিরে আসে:

```rust
fn main() {
    let s1 = gives_ownership();        // gives_ownership এর return এর owner s1

    let s2 = String::from("hello");
    let s3 = takes_and_gives_back(s2); // s2 এর ownership function এ গেছে, আবার ফিরে এসেছে s3 এ
}

fn gives_ownership() -> String {
    String::from("from the function")
}

fn takes_and_gives_back(a_string: String) -> String {
    a_string
}
```

> [!example]
> এটা কষ্টকর — প্রতিবার function call এ ownership নিয়ে আবার ফেরত দিতে হয়। কিন্তু এর সমাধান হলো **borrowing** — পরের chapter এ শিখবো।

## Clone — Deep Copy করতে চাইলে

কখনো সখনো move না করে actual copy দরকার হতে পারে। `clone()` method দিয়ে:

```rust
let s1 = String::from("hello");
let s2 = s1.clone();   // deep copy

println!("s1 = {}, s2 = {}", s1, s2);  // দুটোই valid
```

> [!warn]
> `clone()` expensive — heap data copy করে। Performance-sensitive code এ বারবার clone ব্যবহার করা ভালো না। তবে prototype বা যেখানে clarity দরকার, সেখানে fine।

## Ownership এর কারণ — কেন এত ঝামেলা?

> [!note]
> এই "ঝামেলা" আসলে দুর্দান্ত feature। Ownership এর কারণে:
> - Memory leak হবে না (C/C++ এর সমস্যা)
> - GC এর overhead নেই (Python/Java এর সমস্যা)
> - Data race হবে না (concurrency এ বিশাল সুবিধা)
> - Use-after-free, double-free সব impossible

Python এর ক্ষেত্রে GC সব handle করে। কিন্তু GC এর কারণে:
- Memory usage বেশি হয়
- Random pause হয় (GC pause)
- Latency spike হয়

Rust এ এই সমস্যা নেই — compile time এ সব memory management handle হয়।

## একসাথে সব — Ownership Flow

```rust
fn main() {
    // Stack data — copy
    let x = 5;
    let y = x;
    println!("x = {}, y = {}", x, y);

    // Heap data — move
    let s1 = String::from("hello");
    let len = calculate_length(s1.clone()); // clone করলাম যাতে s1 আর থাকে

    println!("'{}' এর length {}", s1, len);
}

fn calculate_length(s: String) -> usize {
    s.len()
}   // s drop হয়ে যায়
```

> [!tip]
> এখনকার জন্য `clone()` ব্যবহার করো যখন compiler ownership error দেখায়। পরের chapter এ শিখবো কীভাবে **borrowing** দিয়ে এই সমস্যা আরো ভালো ভাবে solve করা যায় — clone ছাড়াই।

## Summary

Ownership হলো Rust এর হার্ট। তিনটা rule মনে রাখো: একজন owner, move semantics, আর scope ছাড়লে drop। পরের chapter এ দেখবো কীভাবে **borrowing** আর **reference** দিয়ে ownership না নিয়েই value access করা যায় — সেটাই প্রতিদিনের Rust programming এ ব্যবহার হয়।