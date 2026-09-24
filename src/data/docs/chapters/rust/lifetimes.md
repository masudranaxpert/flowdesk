# Lifetimes গভীরে

Lifetimes হলো Rust এর সবচেয়ে কঠিন কনসেপ্ট — কিন্তু একবার বুঝলে এটা যৌক্তিক। Lifetime হলো compiler কে বলা "এই reference টা কতক্ষণ valid থাকবে"। বেশিরভাগ সময় compiler নিজে বুঝে নেয়, কিন্তু কিছু ক্ষেত্রে আমাদের স্পষ্টভাবে বলতে হয়।

## সমস্যা — Reference কতক্ষণ Valid?

নিচের কোডটা দেখো:

```rust
{
    let r;
    {
        let x = 5;
        r = &x;      // r references x
    }                // x goes out of scope and is dropped

    println!("{}", r);  // Error: r refers to deallocated stack memory (dangling reference)
}
```

> [!danger]
> `r` reference টা `x` কে point করছে, কিন্তু `x` আগেই scope ছেড়ে গেছে। এটাই dangling reference। Rust compiler এটা compile time এ ধরে ফেলে — এটাই lifetime এর কাজ।

## Borrow Checker

Rust এর compiler এর একটা অংশ হলো **borrow checker**। এটা প্রতিটা reference এর lifetime analyze করে নিশ্চিত করে যে কোনো reference invalid data কে point করছে না।

Rust এ প্রতিটা reference এর একটা **lifetime** আছে — scope যে পর্যন্ত reference টা valid। Lifetime সাধারণত implicit, compiler infer করে।

### Lifetime আসলে Runtime এ কী করে? — কিছুই না

এটাই সবচেয়ে গুরুত্বপূর্ণ insight: lifetime পুরোপুরি **compile-time এর ব্যাপার**। Runtime এ এর কোনো অস্তিত্ব নেই, কোনো খরচও নেই:

- Memory তে lifetime এর কোনো জিনিস নেই — `'a` কোনো value না, counter না, timestamp না। এটা type system এর একটা **label**, compiler শুধু নিজের হিসাবের জন্য ব্যবহার করে আর binary তৈরি হওয়ার আগেই মুছে ফেলে।
- Runtime এ `&i32` আর `*const i32` — দুটোই একই ৮ byte pointer। Rust এ reference **reference counting করে না**, কোনো validity check ও চালায় না (C++ এর `shared_ptr` এর মতো না)। নিরাপত্তাটা আসে compiler analysis থেকে, তাই cost zero।
- Compiler এ এই হিসাব করে **borrow checker**: প্রতিটা function এর control-flow graph ধরে দেখে কোন reference শেষ বার কোথায় ব্যবহার হলো। একে বলে **NLL (non-lexical lifetimes)** — lifetime শেষ হয় scope এর শেষে না, reference এর **শেষ ব্যবহারের** জায়গায়।

```text
compile time:  borrow checker → lifetime solve → error বা pass → lifetime মুছে যায়
runtime:       খালি pointer + তোমার আসল code — lifetime এর কোনো trace নেই
```

> [!tip]
> Generic type parameter (`Vec<T>`) এর সাথে মেলাও — `T` ও runtime এ নেই, compile time এ প্রতিটা আসল type এর জন্য specialize হয়। `'a` ও ঠিক তেমন একটা generic parameter, শুধু এটা type নয় — "কতক্ষণ valid" সেটাই বহন করে।

## Generic Lifetime এর প্রয়োজন

এই function দেখো:

```rust
// Fails borrow checker validation:
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

> [!warn]
> Compiler বলবে: "return করা reference টা `x` এর lifetime পাবে নাকি `y` এর?" — সে বুঝতে পারছে না। কারণ যেকোনো একটা return হবে, আর compile time এ কোনটা return হবে তা নির্ধারণ করা যায় না।

## Lifetime Annotation — `'a`

সমাধান হলো **lifetime annotation** — compiler কে relationship বোঝানো:

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

> [!note]
> `'a` হলো একটা generic lifetime parameter — Python এর type hint বা C++ এর template এর মতো। এর মানে হলো: "x, y, আর return value — তিনটেরই lifetime একই `'a`"। অর্থাৎ return করা reference টা যতক্ষণ valid, `x` আর `y` ও ততক্ষণ valid থাকতে হবে।

### Annotation এর মানে

`'a` নামটা যেকোনো কিছু হতে পারে — `'a`, `'b`, `'input`। convention হলো short lowercase letter। এটা কোনো specific lifetime নয় — এটা generic constraint যেখানে compiler প্রতিটা call এর জন্য actual lifetime calculate করে।

### ব্যবহার উদাহরণ

```rust
fn main() {
    let s1 = String::from("long string");
    let s2 = String::from("hi");

    let result = longest(s1.as_str(), s2.as_str());
    println!("Longest: {}", result);
    // Lifetime constraint: result valid as long as both s1 and s2 are alive
}
```

```rust
fn main() {
    let s1 = String::from("long string is long");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("Longest: {}", result); // Valid: both s1 and s2 are in scope
    } // s2 lifetime ends here and is dropped

    // Error if result is accessed after s2 is dropped:
    // println!("Longest: {}", result); 
    // COMPILER ERROR: E0597 `s2` does not live long enough!
}
```

### কেন এই এররটি ঘটল? (Aha! Moment):
1. `longest` function-এর সিগনেচারে বলা হয়েছে: `longest<'a>(x: &'a str, y: &'a str) -> &'a str`।
2. এর অর্থ: রিটার্ন করা রেফারেন্সটির lifetime হবে ইনপুট `x` এবং `y` এর মধ্যে **যেটির জীবনকাল ছোট**, ঠিক সেটির সমান।
3. এখানে `s1` বাইরের ব্লকে জীবিত, কিন্তু `s2` ভেতরের ব্লকে সীমাবদ্ধ। ফলে `'a` এর কার্যকর সীমা দাঁড়ায় ভেতরের ছোট্ট ব্লকটি।
4. যখন ভেতরের ব্লকটি শেষ হয়, `s2` memory থেকে drop হয়ে যায়। সুতরাং `result` আর কোনোভাবেই ভ্যালিড থাকতে পারে না।
5. compiler runtime-এ কোনো ক্র্যাশ বা ড্যাঙ্গলিং pointer হতে দেওয়ার আগেই compile-time-এ `E0597` এরর দিয়ে কোডটি আটকে দেয়।

## Lifetime Elision Rules

বেশিরভাগ সময় lifetime annotation লেখার দরকার নেই। Compiler তিনটা rule (elision rules) দিয়ে automatically infer করে:

### Rule ১: প্রতিটা reference parameter এর নিজস্ব lifetime

```rust
fn foo(x: &str, y: &str)
// Lifetime elision rule applied:
fn foo<'a, 'b>(x: &'a str, y: &'b str)
```

### Rule ২: যদি একটাই input reference, output ও সেটাই

```rust
fn foo(x: &str) -> &str
// Lifetime elision rule applied:
fn foo<'a>(x: &'a str) -> &'a str
```

### Rule ৩: যদি `&self` বা `&mut self` থাকে, output ও self এর lifetime

```rust
fn foo(&self, x: &str) -> &str
// Lifetime elision rule applied:
fn foo<'a, 'b>(&'a self, x: &'b str) -> &'a str
```

> [!tip]
> এই তিন rule এর পরেও যদি compiler lifetime infer করতে না পারে — তখনই তোমাকে explicitly annotation লিখতে হবে। বেশিরভাগ function এ এটা লাগে না।

Elision টা কোনো বুদ্ধিদীপ্ত অনুমান না — একটা **নির্দিষ্ট deterministic algorithm**: rule গুলো ক্রমান্বয়ে apply হয়। উপরের `longest` function এ compiler ঠিক এভাবে চেষ্টা করেছিল:

```text
fn longest(x: &str, y: &str) -> &str

Rule ১ → প্রতিটা reference parameter নিজের lifetime পায়:
         fn longest<'a, 'b>(x: &'a str, y: &'b str) -> ???
Rule ২ → একটাই input reference হলে output ও সেটাই:
         কিন্তু এখানে ২টা input — rule টা লাগেই না
Rule ৩ → &self থাকলে output = self এর lifetime:
         এটা free function, self নেই — লাগে না

ফলাফল: output lifetime এখনো অজানা → compiler annotation চায়
```

তিন rule শেষ করেও output lifetime কোনো input এর সাথে যুক্ত করা না গেলে তবেই error — তখন তুমি `'a` দিয়ে সম্পর্কটা হাতে বলে দাও। অথচ `fn foo(x: &str) -> &str` এলে Rule ২ একাই সব solve করে ফেলে — এ কারণেই বেশিরভাগ function এ annotation লাগে না।

## Struct এ Lifetime

Struct এ reference field থাকলে lifetime annotation বাধ্যতামূলক:

```rust
struct Excerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence;

    {
        let words = novel.split('.').next().unwrap();
        let excerpt = Excerpt { part: words };
        println!("{}", excerpt.part);
    }
}
```

> [!note]
> এই ছোট্ট লাইনে তিনটা method প্রথমবার দেখা হলো — `.split('.')` string-কে `.`-এর কাটায় কাটা একটা **lazy iterator** দেয় (নতুন array allocate করে না), `.next()` তার প্রথম টুকরা `Option<&str>` হিসেবে দেয় — টুকরা থাকলে `Some`, না থাকলে `None`। আর `.unwrap()` সেই `Option`-এর খোলস ছাড়িয়ে ভেতরের মান বের করে; খালি (`None`) পেলে panic। এখানে শুধু এই এক ব্যবহারের জন্য যথেষ্ট — `Option`-এর পূর্ণ গল্প enums chapter-এ, `unwrap`-এর নিরাপদ বিকল্প error-handling chapter-এ।

> [!warn]
> `Excerpt` struct এ `part` field টা `&'a str` — মানে struct টা যতক্ষণ alive থাকবে, মূল `str` ও ততক্ষণ alive থাকতে হবে। নাহলে dangling reference! এটাই lifetime annotation struct এ কেন দরকার।

## `'static` Lifetime

`'static` হলো সবচেয়ে বড় lifetime — পুরো program জুড়ে valid:

```rust
let s: &'static str = "I live forever";
```

> [!note]
> সব string literal `'static` lifetime পায় — কারণ এগুলো binary এর read-only section এ store হয়, যেটা program এর পুরো lifetime valid।

> [!danger]
> `'static` খারাপ জিনিস না, কিন্তু "fix lifetime error" এর সমাধান হিসেবে `'static` ব্যবহার করা ভুল। এটা memory leak এর সমতুল্য হতে পারে। শুধু তখনই ব্যবহার করো যখন data সত্যিই program জুড়ে থাকা দরকার (global constant, embedded data)।

## Real-World Example — Parser

```rust
struct Config<'a> {
    name: &'a str,
    version: &'a str,
}

impl<'a> Config<'a> {
    fn new(name: &'a str, version: &'a str) -> Self {
        Config { name, version }
    }

    fn display(&self) -> &str {
        self.name
    }
}

fn main() {
    let name = "MyApp";
    let version = "1.0.0";

    let config = Config::new(name, version);
    println!("{} v{}", config.name, config.version);
}
```

## Lifetime তুলনা — Python/C++ vs Rust

| বিষয় | Python | C++ | Rust |
|-------|--------|-----|------|
| Reference validity | GC handle করে | Manual — crash possible | **Compile-time guarantee** |
| Dangling pointer | সম্ভব না (GC) | সম্ভব (UB) | **সম্ভব না** |
| Complexity | None | Low | Medium (lifetime annotation) |
| Safety | Runtime | None | **Compile-time** |

> [!tip]
> Python/C++ থেকে এসে lifetime কঠিন মনে হবে। কিন্তু এটাই Rust কে memory-safe করে। বেশিরভাগ কোডে lifetime annotation লাগে না — elision rule গুলো handle করে। শুধু struct এ reference থাকলে বা একাধিক reference থেকে return করলে দরকার।

## Summary

Lifetime হলো compiler কে reference এর validity scope বোঝানোর উপায়। তিনটা elision rule বেশিরভাগ কাজ handle করে। যখন compiler নিজে বুঝতে পারে না, তখন `'a` annotation লাগে। `'static` হলো program-wide lifetime। পরের chapter এ দেখবো struct আর method — যেখানে lifetime প্রায়ই ব্যবহার হয়।