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
    let s = String::from("hello"); // s owns allocated String on heap
    // s is valid within this lexical scope
    println!("{}", s);
}   // s exits scope: memory automatically freed via Drop trait
```

এখানে `String::from("hello")` এর ভেতরে কী হয় আর সাধারণ literal (`"hello"`) থেকে পার্থক্য কোথায় — এটা পরিষ্কার করা জরুরি:

- **Literal `"hello"`** — compile time এই তোমার binary এর read-only section (rodata) এ বসে যায়। Allocation হয় না, free ও হয় না — program চলার সময় ওখানেই থাকে। Type পাও: `&'static str` — একটা pointer + length, মাত্র দুই word।
- **`String::from("hello")`** — runtime এ তিন ধাপ: ① heap এ নতুন buffer allocate, ② literal এর bytes গুলো ওই buffer এ copy (memcpy), ③ `String` header বানানো — `(ptr, len, capacity)`। খরচ O(n), n = length। মানে এটা **মালিকানা-সহ, বাড়ানো যায়** এমন String কেনার দাম।

Stack এ থাকে মাত্র তিনটা machine word (64-bit এ ২৪ byte) — আসল `h,e,l,l,o` heap এ। নিচের diagram টা এই structure ই দেখাচ্ছে।

### Rule ২: একই সময়ে একজনই owner

যখন একটা variable আরেকটাতে assign হয়, **ownership move** হয়:

```rust
let s1 = String::from("hello");
let s2 = s1;  // Move semantics: ownership transferred from s1 to s2

println!("{}", s1);  // Compilation error: value borrowed after move
```

> [!danger]
> এটা Rust এর সবচেয়ে বিভ্রান্তিকর moment — Python/C++ থেকে এসে এটা দেখলে চমকে যাবে। Python এ `s2 = s1` দিলে দুটোই same value point করে। কিন্তু Rust এ ownership move হয়ে যায় — `s1` invalid হয়ে যায়।

### Rule ৩: Owner scope ছাড়লে drop হয়

```rust
{
    let s = String::from("hello");
}   // Out of scope: drop deallocates heap buffer automatically
// RAII pattern eliminates manual memory deallocation
```

**`drop` এর ভেতরে কী হয়?** Magic না — compiler প্রতিটা scope এর শেষে নিজে থেকে একটা cleanup call ঢুকিয়ে দেয়:

```rust
// User source code:
{
    let s = String::from("hello");
    println!("{}", s);
}

// Compiler generated drop invocation:
{
    let s = String::from("hello");
    println!("{}", s);
    String::drop(s); // Drop trait implementation releases heap allocation
}
```

ধাপে ধাপে: `String` জানে তার `ptr` কোন heap buffer ধরে আছে → `Drop::drop` ওই buffer এর জন্য dealloc call করে (C এর `free(ptr)` এর মতো) → শেষ। যদি value তে heap data-ই না থাকে (যেমন `i32`), drop call টা no-op — LLVM ওটা মুছেই দেয়। Struct হলে প্রতিটা field নিজের drop পায়, ঘোষণার ক্রম ধরে। মানে "automatic memory management" এর পুরো রহস্য: compile time এ বসানো deterministic `free()` — GC এর মতো কোনো background চালক নেই।

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

আরেকটা রহস্য ভেঙে দিই — **move কোনো "invalid flag" set করে না।** Runtime এ যা ঘটে:

১. `let s2 = s1` মানে শুধু ২৪-byte header টা (ptr, len, capacity) **bit-by-bit copy** — C এর struct assign এর মতোই। Heap এ কিছুই যায় আসে না।
২. `s1` এর "invalid" হওয়া runtime এর অবস্থা না — এটা **compile time এর তথ্য**: borrow checker এর হিসাবে `s1` dead হয়ে যায়, তাই ওকে ব্যবহারের লাইন compile ই হয় না।
৩. Generated assembly তে `s1` নামের কিছু আর থাকে না — একটা buffer, একটা pointer, ব্যস।

তাই move এর পুরো খরচ: কয়েকটা register move instruction। Safety পুরোটা compile time এ, runtime এ এক ফোঁটাও check নেই — **zero-cost abstraction** এর চমৎকার নমুনা।

### কোন Type কপি হয়, কোনটা Move হয়?

Integer, float, bool, char এগুলো **stack** এ থাকে — সস্তা। এগুলো copy হয়:

```rust
let x = 5;
let y = x;  // Types implementing Copy perform shallow bitwise copy
println!("{}", x);  // Primitive integer x remains fully valid
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

> [!note]
> এখানে হঠাৎ দুটো নতুন মুখ — `#[derive(...)]` আর trait। **Trait** হলো "এই type এই কাজটা পারে" এর নাম-ওয়ালা contract (method-এর তালিকা) — traits chapter এ পুরো আলোচনা। আর **`#[derive(Copy, Clone)]`** হলো compiler-কে বলা: "এই দুটো trait-এর বিল্ট-ইন implementation আমার struct-এর জন্য লিখে দাও" — অর্থাৎ `#[...]` হলো compiler নির্দেশ (attribute), derive হলো সেই নির্দেশের একটা প্রকার যা compile time-এ code জেনারেট করে। হাতে লেখা আর derive-করা implementation-এ কোনো পার্থক্য হয় না।

```rust
#[derive(Copy, Clone)]
struct Point {
    x: i32,
    y: i32,
}

let p1 = Point { x: 1, y: 2 };
let p2 = p1;  // Copy trait allows p1 to remain accessible
```

> [!note]
> ভেতরের ব্যাপার: `Copy` মানে assignment এ **bitwise copy** — compiler নিজেই করে দেয়, কোনো `clone()` call ঢোকে না। আর একটা কঠোর নিয়ম: একই type `Copy` আর `Drop` **দুটোই হতে পারে না** — কারণ copy মানে একাধিক copy, প্রত্যেকে scope শেষে free করতে চাইলে double free! Compiler এই জুটি দেখলেই আটকে দেয়। এজন্যই heap-data-ওয়ালা `String`/`Vec` কখনো `Copy` হতে পারে না।

## Function এ Ownership Transfer

Function এ value pass করলে ownership function এর parameter এ চলে যায়:

```rust
fn main() {
    let s = String::from("hello");
    takes_ownership(s);     // Ownership of s transferred into function parameter
    // println!("{}", s);   // Error: s is invalid following ownership transfer

    let x = 5;
    makes_copy(x);           // Integer copied by value onto callee stack frame
    println!("{}", x);       // x remains valid in current scope
}

fn takes_ownership(some_string: String) {
    println!("{}", some_string);
}   // some_string goes out of scope and frees heap buffer

fn makes_copy(some_integer: i32) {
    println!("{}", some_integer);
}   // some_integer stack frame popped without heap cleanup
```

> [!note]
> এই function call গুলোর runtime খরচ কত? `takes_ownership(s)` মানে শুধু ২৪-byte header টা callee এর stack frame এ copy — ব্যস, এটাই move এর দাম। Function শেষ হলে compiler parameter-এর জন্য drop call বসিয়ে দেয় (owner তখন ওই function)। `makes_copy(x)` আরো সস্তা — `i32` একটা register-এর ব্যাপার, drop করার কিছু নেই।

### Function থেকে Ownership ফেরত

Function return করলে ownership caller এর কাছে ফিরে আসে:

```rust
fn main() {
    let s1 = gives_ownership();        // Takes ownership returned by function

    let s2 = String::from("hello");
    let s3 = takes_and_gives_back(s2); // s2 moved into function, returned ownership stored in s3
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

println!("s1 = {}, s2 = {}", s1, s2);  // Both bindings valid
```

> [!warn]
> `clone()` expensive — heap data copy করে। Performance-sensitive code এ বারবার clone ব্যবহার করা ভালো না। তবে prototype বা যেখানে clarity দরকার, সেখানে fine।

**`clone()` এর ভেতরে কী হয়?** মোটামুটি এই কোড (simplified):

```rust
// Simplified implementation of String::clone:
fn clone(&self) -> String {
    let buf = alloc(self.len);       // 1. Allocate dedicated heap buffer matching capacity
    memcpy(buf, self.ptr, self.len); // 2. Copy byte buffer contents to new heap location
    String { ptr: buf, len: self.len, capacity: self.len } // 3. Return independent owned String
}
```

খেয়াল করো — clone ঠিক `len` ততটা allocate করে, পুরনো spare capacity টানে না (এজন্যই clone করা String এর capacity = len হয়)। ক্লোনের পর দুটি আলাদা heap buffer, দুজন আলাদা owner — একজন drop হলে আরেকজন অক্ষত। খরচ: একটা allocation (সবচেয়ে ব্যয়বহুল অংশ) + O(n) memcpy। তাই hot loop এ বারবার clone মানে বারবার allocation — পরের chapter এর **borrowing** দিয়ে এই খরচ অনেকটাই এড়ানো যায়।


## Ownership এর কারণ — কেন এত ঝামেলা?

> [!note]
> এই "ঝামেলা" আসলে দুর্দান্ত feature। Ownership এর কারণে:
> - Accidental memory leak হয় না — প্রতিটা value deterministic ভাবে free হয় (ইচ্ছাকৃত `mem::forget` বা `Rc` cycle দিয়ে leak করা যায়, কিন্তু সেগুলোও memory-safe)
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
    // Moving s1 directly would invalidate caller variable binding
    // Accessing moved s1 below causes compiler error E0382
    let len = calculate_length(s1.clone()); // Explicit clone creates independent copy

    println!("'{}' এর length {}", s1, len);
}

fn calculate_length(s: String) -> usize {
    s.len()
}   // Function exit: owned parameter s dropped and freed
```

### কেন এই সতর্কতা?
- যদি `s1.clone()` না লিখে `calculate_length(s1)` লেখা হতো, `s1` function-এর parameter `s`-এ move হয়ে যেত।
- function-এর ব্র্যাকেট `}` শেষ হওয়া মাত্র `s` memory থেকে drop হয়ে যেত।
- ফলস্বরূপ, `main` function-এ এসে `println!("{}", s1);` কল করলে compiler তীব্র আপত্তি জানাত:
  `error[E0382]: borrow of moved value: s1`
- পরের অধ্যায়ে আমরা দেখব কীভাবে **Borrowing (`&s1`)** ব্যবহার করে এই অপ্রয়োজনীয় `clone()` সম্পূর্ণ পরিহার করা যায়।

## Summary

Ownership হলো Rust এর হার্ট। তিনটা rule মনে রাখো: একজন owner, move semantics, আর scope ছাড়লে drop। পরের chapter এ দেখবো কীভাবে **borrowing** আর **reference** দিয়ে ownership না নিয়েই value access করা যায় — সেটাই প্রতিদিনের Rust programming এ ব্যবহার হয়।