# Strings গভীরে — String vs &str

Rust এ string নিয়ে confusion সবচেয়ে বেশি — কারণ দুটো string type আছে: `String` আর `&str`। Python এর মতো একটাই string নয়। চলো বুঝি কেন দুটো, আর কখন কোনটা ব্যবহার করবে।

## দুটো String Type — কেন?

| Type | কোথায় | Growable | Ownership | Python Equivalent |
|------|--------|----------|-----------|-------------------|
| `String` | Heap | Yes (mutable) | Owned | `str` (Python এ সবই heap) |
| `&str` | Stack/Binary | No (immutable) | Borrowed | — |

### `String` — Owned, Growable

```rust
let mut s = String::new();              // empty
let s = String::from("hello");          // from literal
let s = "hello".to_string();            // another way
let s: String = "hello".into();         // yet another

// Grow
let mut s = String::from("foo");
s.push_str("bar");     // s = "foobar"
s.push('!');           // s = "foobar!"
s += " extra";         // s = "foobar! extra"
```

`String` হলো heap-allocated, growable, owned string। মূলত এটা একটা `Vec<u8>` wrapper — UTF-8 encoded byte vector।

### `&str` — Borrowed, Immutable

```rust
let s: &str = "hello world";            // string literal — binary এ stored
let s1 = String::from("hello");
let s2: &str = &s1;                      // String এর borrow

fn print_str(s: &str) {
    println!("{}", s);
}

print_str("literal");    // &str — OK
print_str(&s1);          // &String → &str — OK
```

`&str` হলো string slice — কোনো string data এর reference। Ownership নেয় না।

## `String` বনাম `&str` — কখন কোনটা?

> [!tip]
> সহজ নিয়ম:
> - **`String`** — যখন ownership দরকার, modify করতে হবে, বা value বানাতে হবে
> - **`&str`** — যখন শুধু read করবে, function parameter হিসেবে, যখন ownership নিতে চাও না

### Function Parameter হিসেবে

```rust
// ভালো — &str accept করে String আর &str দুটোই
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

// খারাপ — শুধু String accept করে, &str দিলে allocate করতে হবে
fn greet_bad(name: String) {
    println!("Hello, {}!", name);
}

fn main() {
    let name = String::from("Karim");
    greet(&name);       // OK
    greet("Rahim");     // OK — literal
    greet(&name[..3]);  // OK — slice
}
```

> [!note]
> Function parameter এর জন্য সবসময় `&str` prefer করো। এটা সব string type accept করে। এটাকে Rust community তে **"be liberal in what you accept"** principle বলা হয়।

### Return Value হিসেবে

```rust
// String return — owned, caller এর ownership এ চলে যায়
fn make_greeting(name: &str) -> String {
    format!("Hello, {}!", name)
}

// &str return — শুধু input এর উপর ভিত্তি করে (lifetime দরকার)
fn first_word(s: &str) -> &str {
    // ...
    s
}
```

## String Creation আর Conversion

```rust
// String তৈরি
let s1 = String::new();
let s2 = String::from("hello");
let s3 = "hello".to_string();
let s4: String = "hello".into();
let s5 = format!("{} {}", "hello", "world");

// &str থেকে String
let literal = "hello";
let owned = literal.to_string();
let owned2 = String::from(literal);
let owned3 = literal.to_owned();

// String থেকে &str — auto (deref coercion)
let owned = String::from("hello");
let borrowed: &str = &owned;
```

## Concatenation

```rust
// + operator — ownership নেয়
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2;  // s1 এর ownership move হয়েছে, s2 এর borrow

// format! — সবচেয়ে নিরাপদ আর পঠনযোগ্য
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");
let combined = format!("{}-{}-{}", s1, s2, s3);  // s1, s2, s3 সব valid

// push_str — mutate
let mut s = String::from("foo");
s.push_str("bar");
```

> [!warn]
> `+` operator প্রথম operand এর ownership নিয়ে নেয়! `s1 + &s2` দিলে `s1` invalid হয়ে যায়। এটা কনফিউজিং — `format!` ব্যবহার করা বেশি পরিষ্কার।

## UTF-8 আর Indexing

Rust এর string UTF-8 encoded। Python 3 এর মতোই। কিন্তু একটা বড় পার্থক্য:

```rust
let hello = String::from("Hola");

// ERROR! Rust এ string index করা যায় না
// let h = hello[0];

// bytes — কাজ করে
let bytes = hello.as_bytes();   // [72, 111, 108, 97]

// chars — Unicode scalar value
for c in hello.chars() {
    println!("{}", c);
}

// Split — &str return করে
let hola = &hello[0..4];  // "Hola"
```

> [!danger]
> Rust এ `s[0]` কাজ করে না! কারণ UTF-8 এ একটা character একাধিক byte হতে পারে। `"বাংলা"` এর প্রতিটা character ৩ বাইট! তাই byte index দিলে character এর মাঝখানে পড়তে পারে — panic। তাই Rust string indexing disable করেছে।

### Bangla String Example

```rust
let bangla = String::from("নমস্কার");

println!("Len (bytes): {}", bangla.len());     // 18 (6 char × 3 byte)
println!("Chars: {}", bangla.chars().count());  // 6

for (i, c) in bangla.chars().enumerate() {
    println!("{}: {}", i, c);
}
```

## Slicing

```rust
let s = String::from("hello world");

let hello: &str = &s[0..5];     // "hello"
let world: &str = &s[6..11];    // "world"
let full: &str = &s[..];         // "hello world"
```

> [!warn]
> Slice করার সময় সাবধান — character boundary তে cut করতে হবে। নাহলে panic। `&s[0..3]` যদি ৩ বাইট একটা character এর মাঝখানে পড়ে, runtime panic হবে।

## Iteration

```rust
let s = String::from("hello");

// chars — Unicode scalar value
for c in s.chars() {
    print!("{}", c);  // h e l l o
}

// bytes — raw byte
for b in s.bytes() {
    println!("{}", b);  // 104 101 108 108 111
}

// lines
let text = "line 1\nline 2\nline 3";
for line in text.lines() {
    println!("{}", line);
}

// split
let csv = "a,b,c,d";
for part in csv.split(',') {
    println!("{}", part);
}
```

## Useful Methods

```rust
let s = String::from("Hello, World!");

// Information
s.len();           // byte length
s.is_empty();      // false
s.contains("World"); // true
s.starts_with("Hello"); // true
s.ends_with("!");  // true

// Transform
let upper = s.to_uppercase();     // "HELLO, WORLD!"
let lower = s.to_lowercase();     // "hello, world!"
let trimmed = "  hi  ".trim();    // "hi"
let replaced = s.replace("World", "Rust"); // "Hello, Rust!"

// Split আর collect
let parts: Vec<&str> = "a,b,c".split(',').collect();
// ["a", "b", "c"]

// Reverse
let reversed: String = "hello".chars().rev().collect();
```

## Performance Comparison

| Operation | String | &str |
|-----------|--------|------|
| Creation | Heap alloc | Zero cost |
| Pass to function | Move (or `&`) | Copy (pointer copy) |
| Clone | Deep copy (expensive) | Cheap |
| Modify | O(1) amortized push | Cannot modify |

> [!tip]
> Performance-critical code এ `&str` ব্যবহার করো যতটা সম্ভব। `String` শুধু তখনই যখন তুমি modify করবে বা value এর ownership নিতে চাও।

## String Conversion Summary

```
String ←──── to_string() ──── &str (literal)
  │                                │
  │         as_str() / &*          │
  └────────────────────────────────┘
  │
  └── push_str(), format!(), +
```

## বাস্তব উদাহরণ — Text Processor

```rust
fn word_stats(text: &str) -> (usize, usize, String) {
    let words: Vec<&str> = text.split_whitespace().collect();
    let word_count = words.len();
    let char_count = text.chars().count();

    let longest = words
        .iter()
        .max_by_key(|w| w.len())
        .unwrap_or(&"");

    (word_count, char_count, longest.to_string())
}

fn main() {
    let text = "the quick brown fox jumps over the lazy dog";
    let (words, chars, longest) = word_stats(text);

    println!("Words: {}", words);       // 9
    println!("Characters: {}", chars);   // 43
    println!("Longest word: {}", longest); // "jumps"
}
```

> [!example]
> খেয়াল করো — `text: &str` parameter দুটোই accept করে (`String` আর literal)। Return এ `String` দেওয়া হয়েছে কারণ `longest` borrow করলে lifetime annotation লাগতো। Practical trade-off।

## Summary

Rust এ দুটো string type — `String` (owned, growable, heap) আর `&str` (borrowed, immutable, slice)। Function parameter এর জন্য `&str` best, return value এর জন্য প্রায়ই `String`। UTF-8 encoding এর কারণে indexing করা যায় না — chars() বা bytes() ব্যবহার করতে হয়। পরের chapter এ error handling শিখবো — `Result`, `Option`, `?` operator।