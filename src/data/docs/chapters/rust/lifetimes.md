# Lifetimes গভীরে

Lifetimes হলো Rust এর সবচেয়ে কঠিন কনসেপ্ট — কিন্তু একবার বুঝলে এটা যৌক্তিক। Lifetime হলো compiler কে বলা "এই reference টা কতক্ষণ valid থাকবে"। বেশিরভাগ সময় compiler নিজে বুঝে নেয়, কিন্তু কিছু ক্ষেত্রে আমাদের স্পষ্টভাবে বলতে হয়।

## সমস্যা — Reference কতক্ষণ Valid?

নিচের কোডটা দেখো:

```rust
{
    let r;
    {
        let x = 5;
        r = &x;      // r হলো x এর reference
    }                // x এখানে drop হয়ে গেছে!

    println!("{}", r);  // ERROR! r একটা dead reference point করছে
}
```

> [!danger]
> `r` reference টা `x` কে point করছে, কিন্তু `x` আগেই scope ছেড়ে গেছে। এটাই dangling reference। Rust compiler এটা compile time এ ধরে ফেলে — এটাই lifetime এর কাজ।

## Borrow Checker

Rust এর compiler এর একটা অংশ হলো **borrow checker**। এটা প্রতিটা reference এর lifetime analyze করে নিশ্চিত করে যে কোনো reference invalid data কে point করছে না।

Rust এ প্রতিটা reference এর একটা **lifetime** আছে — scope যে পর্যন্ত reference টা valid। Lifetime সাধারণত implicit, compiler infer করে।

## Generic Lifetime এর প্রয়োজন

এই function দেখো:

```rust
// এটা compile হবে না!
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
    // result valid যতক্ষণ s1 আর s2 দুটোই valid
}
```

```rust
fn main() {
    let s1 = String::from("hello");
    let result;
    {
        let s2 = String::from("world!");
        result = longest(s1.as_str(), s2.as_str());
        println!("{}", result);  // OK — এখানে সব valid
    }
    // এখানে result ব্যবহার করলে ERROR — s2 drop হয়ে গেছে
}
```

## Lifetime Elision Rules

বেশিরভাগ সময় lifetime annotation লেখার দরকার নেই। Compiler তিনটা rule (elision rules) দিয়ে automatically infer করে:

### Rule ১: প্রতিটা reference parameter এর নিজস্ব lifetime

```rust
fn foo(x: &str, y: &str)
// পরিণত হয়:
fn foo<'a, 'b>(x: &'a str, y: &'b str)
```

### Rule ২: যদি একটাই input reference, output ও সেটাই

```rust
fn foo(x: &str) -> &str
// পরিণত হয়:
fn foo<'a>(x: &'a str) -> &'a str
```

### Rule ৩: যদি `&self` বা `&mut self` থাকে, output ও self এর lifetime

```rust
fn foo(&self, x: &str) -> &str
// পরিণত হয়:
fn foo<'a, 'b>(&'a self, x: &'b str) -> &'a str
```

> [!tip]
> এই তিন rule এর পরেও যদি compiler lifetime infer করতে না পারে — তখনই তোমাকে explicitly annotation লিখতে হবে। বেশিরভাগ function এ এটা লাগে না।

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

## বাস্তব উদাহরণ — Parser

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