# Rust কী ও কেন শিখবে

Rust হলো একটা systems programming language যেটা C আর C++ এর মতো fast, কিন্তু সাথে একটা বিশাল সুবিধা — **memory safety without garbage collector**। Mozilla 2010 সালে এটা তৈরি শুরু করে, আর আজকে Rust টানা ৯ বছর ধরে Stack Overflow এর survey তে **সবচেয়ে প্রিয় language** (most loved language)।

## Rust কেন শিখবে?

C++ এ memory leak, null pointer, data race — এই সমস্যাগুলো ডিবাগ করা ছিল দুঃস্বপ্ন। Rust এই সমস্যাগুলো **compile time** এই ধরে ফেলে। একটা উদাহরণ দেখি:

```rust
fn main() {
    println!("Hello, World!");
}
```

Python এর মতোই সোজা। কিন্তু ভেতরে Rust C++ এর সমান fast। কোনো garbage collector নেই, কোনো runtime overhead নেই।

> [!note]
> **`println!` আসলে function না — macro।** নামের শেষের `!` চিহ্নটাই সেটা বোঝায়। Compile করার সময় rustc এই লাইনটাকে ভেতরে expand করে: format string parse হয়, argument গুলোর type check হয়, তারপর plain stdout-write কোড generate হয়। তাই runtime এ কোনো format parser চলে না — C এর `printf` যেখানে format string runtime এ parse হয়, Python এ ভুল format ধরা পড়ে runtime exception এ — Rust এ দুটোই compile error।

> [!tip]
> তুমি যদি Python জানো — Rust শেখা তোমার জন্য ভালো সিদ্ধান্ত। Python দ্রুত কোড লেখা যায়, কিন্তু Rust দ্রুত চলে। দুটোই জানলে তুমি সব জায়গায় survive করতে পারবে।

## Python vs C++ vs Rust — তুলনা

| বিষয় | Python | C++ | Rust |
|-------|--------|-----|------|
| **Speed** | ধীর (interpreted) | খুব fast | খুব fast (C++ এর সমান) |
| **Memory Safety** | Safe (GC আছে) | Unsafe (manual) | Safe (GC ছাড়াই!) |
| **Learning Curve** | সহজ | কঠিন | মাঝারি |
| **Garbage Collector** | আছে | নেই | নেই |
| **Concurrency** | GIL সমস্যা | Complex (data race) | Safe (compile-time guarantee) |
| **Use Case** | Script, AI, Web | Game engine, OS | OS, WebAssembly, CLI, Server |

## কোথায় Rust ব্যবহার হয়?

| Field | কী করা যায় | উদাহরণ |
|-------|------------|---------|
| **Systems Programming** | OS, driver, embedded | Linux kernel (Rust support added) |
| **Web** | Backend server, API | Web framework: Actix, Axum |
| **WebAssembly** | Browser এ fast code | Figma, Photoshop web version |
| **CLI Tools** | Fast command-line tool | ripgrep, fd, bat |
| **Blockchain** | Smart contract, crypto | Solana, Polkadot |
| **Game Dev** | Game engine | Bevy engine |

> [!note]
> বড় বড় কোম্পানি — Microsoft, Google, Amazon, Discord, Dropbox — সবাই Rust ব্যবহার করছে। Discord তাদের backend Go থেকে Rust এ সরিয়েছে কারণ Rust তাদের latency অনেক কমিয়েছে।

## Rust ইনস্টল করা

Rust ইনস্টল করার অফিশিয়াল টুল হলো `rustup`। এটা Rust এর সব toolchain ম্যানেজ করে।

### Windows

1. **rustup-init.exe** ডাউনলোড করো — [rustup.rs](https://rustup.rs) থেকে
2. রান করো — next-next দিলেই হবে
3. Visual Studio C++ Build Tools লাগবে (C++ linker এর জন্য)

### macOS / Linux

Terminal এ এই কমান্ডটা দাও:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### ইনস্টল verify করা

```bash
rustc --version
cargo --version
```

যদি দেখো `rustc 1.85.0` আর `cargo 1.85.0` — তার মানে সব ঠিক আছে!

> [!warn]
> Windows এ Rust কাজ করাতে চাইলে **Visual Studio Build Tools** অবশ্যই ইনস্টল করতে হবে। এটা ছাড়া Rust compile হবে না।

## Cargo — Rust এর সব কিছু

Rust এ `cargo` হলো একই সাথে package manager, build tool, আর test runner। Python এর `pip` + `venv` + `pytest` — সব এক জায়গায়।

নতুন প্রজেক্ট তৈরি করা:

```bash
cargo new my_project
cd my_project
```

এটা এই structure তৈরি করবে:

```
my_project/
├── Cargo.toml      # pyproject.toml / package.json এর মতো
├── src/
│   └── main.rs     # entry point
└── target/         # build output (gitignore করা থাকে)
```

রান করা:

```bash
cargo run
```

> [!example]
> `Cargo.toml` হলো Python এর `pyproject.toml` বা Node এর `package.json` এর মতো। এখানে dependency, version, metadata সব থাকে।

## প্রথম Program

`cargo new` করার পর `src/main.rs` ফাইলে এই কোডটা থাকবে:

```rust
fn main() {
    println!("Hello, world!");
}
```

চলো একটু বদলাই — user এর নাম নিয়ে greeting করি:

```rust
use std::io;

fn main() {
    println!("তোমার নাম কী?");

    let mut name = String::new();
    io::stdin()
        .read_line(&mut name)
        .expect("Failed to read line");

    println!("হ্যালো, {}! Rust শেখায় স্বাগতম।", name.trim());
}
```

রান করো `cargo run` দিয়ে:

```
তোমার নাম কী?
Rahim
হ্যালো, Rahim! Rust শেখায় স্বাগতম।
```

> [!tip]
> Python এ এই কাজটা এক লাইনে হতো (`input()`)। Rust এ একটু বেশি কোড লাগে, কিন্তু এর কারণ হলো Rust সব কিছু explicit রাখে — কোনো hidden magic নেই।

### এই Program এ ভেতরে কী ঘটছে?

ছোট দেখলেও এই কোডে পাঁচটা জিনিস কাজ করছে — প্রতিটার ভেতরে যা চলে:

- **`use std::io;`** — তোমার প্রথম `use` দেখা। মানে: "standard library-র `io` module টা এই ফাইলে এনে নাও, যাতে সংক্ষেপে `io::stdin()` লিখতে পারি।" `std` হলো Rust-এর সাথেই আসা বিশাল library — `String`, `Vec`, file, network সব ওখানে। মনে রেখো: Rust-এর আসল keyword মাত্র ~৩৫টা; `String`, `Some` এগুলো "ভাষার জাদু" না, library-র সাধারণ type (বিস্তারিত পরের chapter-এর "Builtins কোথা থেকে আসে" section-এ)।
- **`String::new()`** — এই মুহূর্তে কোনো heap allocation হয় না। শুধু একটা খালি `String` header তৈরি হয়: `len = 0`, `capacity = 0`। Memory লাগবে যখন প্রথম byte ঢুকবে, তখন।
- **`io::stdin().read_line(&mut name)`** — terminal থেকে newline পর্যন্ত byte গুলো পড়ে সরাসরি `name` এর buffer এ লেখে (buffer ছোট হলে বড় করে নেয়), শেষে `Ok(কত byte পড়লাম)` অথবা `Err` return করে। তাই return type হলো `io::Result<usize>` — এই error handle না করলে compiler ছাড়বে না।
- **`.expect("...")`** — `Result` এর উপর চলা একটা check: `Ok(v)` হলে ভেতরের value বের করে দেয়, `Err` হলে তোমার message দিয়ে সাথে সাথে panic — মানে program বন্ধ। Magic কিছু না, check + early exit।
- **`.trim()`** — নতুন String বানায় না, copy ও হয় না। শুধু একটা `&str` slice return করে — শুরু-শেষের whitespace বাদ দিয়ে pointer আর length একটু সরিয়ে। O(1), zero allocation।

> [!tip]
> খেয়াল করো — `trim()` এর মতো অনেক std method আসলে নতুন data বানায় না, পুরনো data দেখার "জানালা" (slice) বানায়। Rust এর performance এর একটা বড় সোর্স এটাই।

## কেন Rust সবার থেকে আলাদা?

Rust এর মূল innovation হলো **Ownership system**। এই কনসেপ্টের কারণে:

1. **Garbage collector লাগে না** — memory compile time এ manage হয়
2. **Data race হতে পারে না** — concurrent code automatically safe
3. **Null pointer exception নেই** — `Option<T>` দিয়ে null safety
4. **Performance আর safety একসাথে** — trade-off করতে হয় না

### Compile Pipeline — তোমার কোড machine code হওয়ার পথ

Rust ahead-of-time compiled — `cargo run` দিলে ভেতরে এই pipeline চলে:

```text
main.rs
  │  rustc: parse → type check → borrow check (ownership/borrowing rule গুলো এখানে verify হয়)
  ▼
ভেতরের intermediate form (MIR) → LLVM IR
  │  LLVM optimizer: অপ্রয়োজনীয় কোড বাদ, function inline, loop unroll
  ▼
machine code (binary) — এরপর চলন্ত program এর সাথে আর কোনো runtime নেই
```

Python এ interpreter প্রতি লাইন runtime এ চলে, Java এ JIT পরে optimize করে। Rust এ পুরো ব্যাপারটা build এর সময়েই শেষ। এখান থেকেই "builtin গুলো zero-cost কেন" বোঝা যায়:

- `println!`, `vec!` এর মতো macro compile time এ expand হয়ে সরাসরি সাধারণ Rust কোড হয়ে যায় — runtime এ macro engine বলে কিছু নেই।
- `String`, `Vec` এর method গুলো সাধারণ Rust-লেভেল কোড — LLVM সেগুলো তোমার কোডে inline করে দেয়, ফলে hand-written C এর সমান (মাঝে মাঝে তার চেয়েও ভালো) machine code বেরোয়।
- Ownership/borrow এর সব check compile time এই শেষ — চলন্ত program এ GC বা reference counting কিছুই চলে না। Safety এর "বিল" build time এই পরিশোধ হয়।

পরের chapter গুলোতে আমরা এক এক করে সব শিখবো। মনে রাখবে — Rust শুরুতে একটু কঠিন মনে হবে (especially ownership আর borrowing), কিন্তু একবার concept পরিষ্কার হলে এর চেয়ে দারুণ language আর নেই।

## Summary

Rust হলো fast + safe + modern systems language। C++ এর power, Python এর tooling ecosystem, আর নিজস্ব memory safety guarantee। পরের chapter এ আমরা syntax আর basic concept গুলো দেখবো। চলো এগোই!