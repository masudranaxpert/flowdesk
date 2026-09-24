# Borrowing ও References

আগের chapter এ দেখলাম ownership move হয়ে যায় — function এ pass করলে variable invalid হয়ে যায়। এটা অসুবিধা! প্রতিবার value নিতে গেলে ownership হারানো মানে না। এই সমস্যার সমাধান হলো **borrowing** — value টা ownership না নিয়ে reference দিয়ে access করা।

## Reference কী?

Reference হলো value টার pointer — ownership না নিয়েই value access করার উপায়। Python এর variable reference এর মতো, কিন্তু Rust এ অনেক বেশি strict rule আছে।

### Immutable Reference — `&`

`&` দিয়ে value টাকে borrow করা যায়:

```rust
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);  // &s1 = reference

    println!("'{}' এর length {}", s1, len);  // s1 এখনো valid!
}

fn calculate_length(s: &String) -> usize {
    s.len()
}   // s reference drop হয়, কিন্তু String value রয়ে গেছে
```

> [!tip]
> খেয়াল করো — `&s1` দিয়ে reference pass করা হয়েছে। Function `s: &String` নিয়েছে — ownership নয়, শুধু reference। Function শেষে value drop হবে না। Python এ `def calc(s):` লিখলে reference pass হয় — Rust এ সেটা explicit।

> [!note]
> **Runtime এ `&s1` মানে কী?** শুধু একটা pointer — 64-bit এ ৮ byte এর একটা address, C এর pointer এর মতোই। `s.len()` call করলে compiler নিজেই ওই pointer **deref** করে ভেতরের `len` field এ পৌঁছায় (auto-deref)। Generated assembly তে C এর pointer pass করার সাথে কোনো পার্থক্য নেই — borrowing এর runtime cost **zero**; পুরো খরচটা compile time এর check এ।

### Mutable Reference — `&mut`

Value modify করতে চাইলে `&mut` দরকার:

```rust
fn main() {
    let mut s = String::from("hello");
    change(&mut s);
    println!("{}", s);  // hello, world
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

> [!warn]
> Mutable reference পেতে হলে original value টাও `mut` হতে হবে। `let s = ...` দিলে `&mut s` পাবে না — `let mut s = ...` লাগবে।

> [!note]
> `&mut String` ও runtime এ সেই একই ৮-byte pointer — কোনো "mutable" badge runtime এ পাহারা দেওয়ার ব্যবস্থা নেই। আসল কাজ type system এর: `push_str` এর মতো mutating method গুলোর signature `&mut self` — ওই badge ছাড়া call করা যায় না। ফলে এক data তে একসাথে দুজনের লেখা **type system ই অসম্ভব করে দেয়**। C++ এ `const` ভুলে গেলে runtime bug; এখানে compile error।

## Borrowing এর ২টা Rule

Rust এর borrowing system এর দুটো strict rule আছে — এগুলো compile time এ check হয়:

### Rule ১: একই সময়ে একটা mutable reference অথবা অনেকগুলো immutable reference

```rust
let mut s = String::from("hello");

let r1 = &s;       // immutable borrow
let r2 = &s;       // আরেকটা immutable borrow — OK
println!("{} {}", r1, r2);

let r3 = &mut s;   // mutable borrow — OK (r1, r2 আর ব্যবহার হচ্ছে না)
r3.push_str("!");
```

```rust
// ERROR!
let mut s = String::from("hello");
let r1 = &s;
let r2 = &mut s;   // ERROR! একই সাথে mutable আর immutable borrow
```

**Borrow checker আসলে কী check করে?** Compiler তোমার কোড আগে একটা ভেতরের form (MIR) এ নামায়, তারপর প্রতিটা borrow এর একটা **live region** হিসাব করে — কোন borrow কোন কোন লাইনে "জীবিত" (তৈরি হওয়া থেকে শেষ ব্যবহার পর্যন্ত):

```text
let r1 = &s;               // r1 এর region শুরু
let r2 = &s;               // r2 এর region — দুটোই immutable, overlap OK
println!("{} {}", r1, r2); // ← r1, r2 এর last use; এরপর দুজন "মৃত"
let r3 = &mut s;           // r3 এর region শুরু — কারো সাথে overlap নেই → OK
```

conflict হয় যখন: একটা **mutable** borrow এর live region আরেকটা borrow এর live region এর সাথে overlap করে। তখন error — যেমন `E0502` (immutable borrow জীবিত অবস্থায় `&mut` নেওয়া) বা `E0499` (দুটো `&mut` একসাথে)। মানে "এক mutable অথবা অনেক immutable" কোনো runtime police না — এটা region-overlap এর একটা হিসাব, পুরোটা compile time এ শেষ।

### Rule ২: Reference সবসময় valid হতে হবে

```rust
// ERROR! dangling reference
fn dangle() -> &String {
    let s = String::from("hello");
    &s  // s এর reference return করছি, কিন্তু s এই function শেষে drop হবে!
}
```

> [!danger]
> Rust এ dangling reference **কখনোই** possible না। Compiler এই error ধরে ফেলবে। C/C++ এ এটা runtime crash হতো, Python এ GC handle করতো। Rust এ compile time এই নিশ্চয়তা পাওয়া যায়।

## Multiple Immutable References

```rust
let s = String::from("hello");
let r1 = &s;
let r2 = &s;
let r3 = &s;

println!("{}, {}, {}", r1, r2, r3);  // সব OK
```

অনেকগুলো reader একসাথে পড়তে পারে — কোনো সমস্যা নেই। ঠিক database এর read lock এর মতো।

## কেন এই Rule গুলো?

> [!note]
> এই rule গুলো কঠিন মনে হলেও একটা বিশাল সুবিধা দেয় — **compile-time data race prevention**। Python এ এই সমস্যা runtime এ crash হয়। C++ এ undefined behavior। Rust এ compile error।

Data race কী? দুটো thread একই data তে একটা read আরেকটা write করছে — ফলাফল unpredictable। Rust এ এটা **impossible** কারণ compiler এই rule enforce করে।

## NLL — Non-Lexical Lifetimes

আগের Rust version এ একটা সমস্যা ছিল — reference এর scope curly brace পর্যন্ত থাকতো। 2018 edition থেকে **NLL** (Non-Lexical Lifetimes) এসেছে — reference শেষ ব্যবহারের পরই scope শেষ হয়:

```rust
let mut s = String::from("hello");

let r1 = &s;
let r2 = &s;
println!("{} {}", r1, r2);

// r1, r2 এর last use ছিল উপরের println
// তাই নিচে mutable reference নেওয়া যায়!
let r3 = &mut s;
r3.push_str("!");
```

> [!tip]
> NLL এর আগে এই কোড compile হতো না। এখন চলে — কারণ compiler বুঝতে পারে `r1` আর `r2` আর ব্যবহার হচ্ছে না। এটা Rust এর usability অনেক বাড়িয়েছে।

ভেতরের হিসাবটা দেখো: NLL এ প্রতিটা reference এর lifetime হলো একটা **region** — curly brace এর জ্যামিতি না। Compiler প্রতিটা লাইনে দেখে কোন borrow কোথায় **ব্যবহার** হচ্ছে, আর region টাকে শেষ ব্যবহার পর্যন্ত টেনে বাড়ায়। `r1`, `r2` শেষ ব্যবহৃত হয়েছে `println!` এ — তাই তাদের region ওখানেই শেষ, `&mut s` নেওয়ার আগেই দুজন মৃত। মজার ব্যাপার: নিয়ম বদলায়নি, **"একই সময়ে" শব্দটার মাপ বদলেছে** — brace এর সময় থেকে ব্যবহারের সময়।

## Slice — Reference এর Special Type

Slice হলো collection এর একটা contiguous portion এর reference:

### String Slice

```rust
let s = String::from("hello world");

let hello = &s[0..5];     // "hello"
let world = &s[6..11];    // "world"
let whole = &s[..];       // "hello world"

println!("{} {}", hello, world);
```

> [!example]
> Slice হলো Python এর slicing (`s[0:5]`) এর মতো, কিন্তু Rust এ এটা reference — ownership নেয় না। মূল `String` এর একটা অংশ point করে।

> [!note]
> **Slice এর ভেতরে কী আছে?** `&str` হলো **fat pointer** — দুইটা machine word: ① শুরুর address, ② length। `&s[0..5]` করলে ঘটে দুটো কাজ: ① range টা valid কিনা check (byte boundary যেন UTF-8 character না ভাঙে — ভাঙলে panic), ② `(ptr + 0, 5)` জাতীয় নতুন fat pointer তৈরি। কোনো data copy হয় না — O(1), zero allocation। Python এ `s[0:5]` একটা নতুন string বানায় (copy); Rust এ slice শুধু একটা "জানালা"।

### String Literal হলো Slice

```rust
let s: &str = "hello world";  // এটা string slice!
```

`"hello"` হলো `&str` type — এটা binary এর read-only অংশ point করে। এটাও slice এর একটা form।

> [!note]
> ভেতরটা আরো মজার — `"hello world"` literal টা **compile time এই binary এর read-only section (rodata) এ বসে যায়**, আর `'static` মানে এই pointer পুরো program জুড়ে valid। Allocation নেই, free নেই — binary load হলেই data ওখানে। ফলে একটা সুবিধা: string literal function থেকে return করলেও dangling হয় না — data টা function এর stack এ না, binary তে।

### Array Slice

```rust
let arr = [1, 2, 3, 4, 5];
let part: &[i32] = &arr[1..4];  // [2, 3, 4]

fn sum_slice(nums: &[i32]) -> i32 {
    nums.iter().sum()
}

let total = sum_slice(&arr);  // 15
```

> [!tip]
> **`nums.iter().sum()` এর ভেতরে:** `iter()` element গুলোর উপর একটা pointer চালায়, `sum()` সবকিছু একটাই loop এ fold করে যোগ করে। LLVM পুরোটাকে মিলিয়ে একটা সাধারণ summing loop বানায় — মাঝপথে কোনো নতুন array তৈরি হয় না। (Iterator এর পুরো গল্প পরের chapter এ।)

## Borrowing in Practice — বাস্তব উদাহরণ

```rust
fn main() {
    let mut words = String::from("hello beautiful world");

    let first = first_word(&words);  // 5 (first word length)
    println!("First word length: {}", first);

    words.clear();  // mutable operation

    // first এখনো 5, কিন্তু words empty
    // Rust আমাদের বাধ্য করবে না clear করার আগে first ব্যবহার করতে
}

fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return i;
        }
    }
    s.len()
}
```

> [!note]
> এই function `&String` নিয়েছে — ownership নেয়নি। মূল value intact আছে। এটাই borrowing এর শক্তি — value access করো, ownership নাও নিয়ে।

> [!note]
> কৌতূহল-জাগানো কথা: এই function যদি `usize` এর বদলে **`&str` slice** return করত (মূল string এর অংশ point করে), তবু এই নির্দিষ্ট কোড চলত — কারণ `first` এর শেষ ব্যবহার `println!` এ, `clear()` এর আগেই NLL ওই borrow কে মেরে দেয়। কিন্তু `clear()` এর **পরে** `first` ছাপতে গেলেই `E0502` — immutable borrow জীবিত অবস্থায় `clear` এর দরকারি `&mut` নেওয়া যাবে না। মানে slice return করলে compiler নিজে থেকেই তোমাকে ordering ঠিক রাখতে বাধ্য করে — এটাই borrowing এর আসল নিরাপত্তা।

## `&str` vs `&String` — Function Parameter

Function parameter হিসেবে `&str` ব্যবহার করা ভালো — এটা আরো flexible:

```rust
// এটা universal — String আর &str দুটোই accept করে
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let s = String::from("Karim");
    greet(&s);       // &String থেকে &str এ auto-convert
    greet("Rahim");  // &str — direct
}
```

> [!tip]
> Function parameter এর জন্য সবসময় `&str` prefer করো `&String` এর চেয়ে। কারণ `&str` দিয়ে string literal আর `String` দুটোর reference-ই accept করা যায়।

> [!note]
> **`&String` → `&str` conversion কীভাবে হয়?** এটা **deref coercion** — `String` তার `Deref` trait implementation এ বলে দেয় সে `&str` এ "খুলে যায়"। Compiler compile time এ নিজেই `&s` কে `&s[..]` (পুরো string এর slice) এ বদলে দেয়। Generated code এ বাড়তি কাজ: একটা pointer + length বানানো মাত্র — cost zero। C++ এ implicit conversion এ সাবধান থাকতে হয়; এখানে নিয়মটা ছোট আর নিরাপদ — `Deref` chain ধরে compiler যত দরকার তত ধাপ নিজেই বসিয়ে দেয়।

## Borrowing তুলনা

| Concept | Python | C++ | Rust |
|---------|--------|-----|------|
| Pass by value | `x` (reference) | `x` (copy) | `x` (move) |
| Pass by reference | automatic | `&x` / `const&` | `&x` |
| Pass by mutable ref | automatic | `&x` | `&mut x` |
| Multiple readers | possible | possible | possible |
| Reader + writer | race possible | race possible | **compile error!** |

## Summary

Borrowing হলো ownership এর সবচেয়ে গুরুত্বপূর্ণ companion। `&` দিয়ে immutable reference, `&mut` দিয়ে mutable reference। দুটো rule: এক mutable অথবা অনেক immutable, আর reference সবসময় valid। পরের chapter এ lifetimes শিখবো — reference কতক্ষণ valid থাকবে তার formal system।