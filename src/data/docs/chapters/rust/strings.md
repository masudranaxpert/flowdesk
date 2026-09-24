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

ভেতরে সত্যিই `Vec<u8>` এর মতো: heap buffer এর pointer, `capacity`, আর `len` (byte count) — 64-bit এ মোট ২৪ byte। Python এর `str` immutable, তাই বারবার concatenate করলে প্রতিবার নতুন string তৈরি হয়; Rust এর `String` একটা mutable buffer, তাই append সস্তা।

**`push_str` এর ভেতরে কী হয়?** `Vec::push` এর মতোই তিন ধাপ (simplified):

```rust
pub fn push_str(&mut self, slice: &str) {
    if self.len + slice.len() > self.capacity {
        self.reserve_and_grow();   // Doubles capacity and copies existing bytes (amortized O(1))
    }
    self.buffer[self.len..].copy_from_slice(slice.as_bytes()); // memcpy
    self.len += slice.len();
}
```

`push('!')` ও একই — শুধু আগে char টাকে UTF-8 এ encode করে (ASCII হলে ১ byte, বাংলা/emoji হলে ৩-৪ byte), তারপর ওই byte গুলো append। খরচটা যোগ হওয়া byte সংখ্যার উপর — `String` এর পুরনো অংশ ছোঁয় না, তাই **amortized O(m)**।

আরও দুটো ছোট কথা: `String::new()` **কিছুই allocate করে না** (capacity 0) — প্রথম push হলে তবেই heap এ জায়গা নেয়। আর `String::from("hello")` / `to_string()` হলো binary এর static section এ থাকা literal এর byte গুলো heap এ **copy** করা — এখানেই একটা allocation হয়।

### `&str` — Borrowed, Immutable

```rust
let s: &str = "hello world";            // String literal stored in static rodata section
let s1 = String::from("hello");
let s2: &str = &s1;                      // Borrowing String as immutable &str slice

fn print_str(s: &str) {
    println!("{}", s);
}

print_str("literal");    // &str — OK
print_str(&s1);          // &String → &str — OK
```

`&str` হলো string slice — কোনো string data এর reference। Ownership নেয় না।

ভেতরে `&str` একটা **fat pointer** — দুটো word: data এর pointer আর length, মোট ১৬ byte (64-bit এ)। উপরে `&String → &str` auto-convert হওয়াটা **deref coercion** — `String` ভেতরে `Deref<Target = str>` implement করে, তাই compiler বুঝে যায়। কোনো data copy হয় না, শুধু `(ptr, len)` fat pointer তৈরি হয় — খাঁটি zero cost।

## `String` বনাম `&str` — কখন কোনটা?

> [!tip]
> সহজ নিয়ম:
> - **`String`** — যখন ownership দরকার, modify করতে হবে, বা value বানাতে হবে
> - **`&str`** — যখন শুধু read করবে, function parameter হিসেবে, যখন ownership নিতে চাও না

### Function Parameter হিসেবে

```rust
// Idiomatic: accepts both &str and &String through deref coercion
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

// Anti-pattern: forces caller to allocate String if passing &str
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
// Returns owned String transferring ownership to caller
fn make_greeting(name: &str) -> String {
    format!("Hello, {}!", name)
}

// Returns borrowed slice tied to input lifetime
fn first_word(s: &str) -> &str {
    // ...
    s
}
```

## String Creation আর Conversion

```rust
// String instantiation:
let s1 = String::new();
let s2 = String::from("hello");
let s3 = "hello".to_string();
let s4: String = "hello".into();
let s5 = format!("{} {}", "hello", "world");

// Convert borrowed &str to owned String:
let literal = "hello";
let owned = literal.to_string();
let owned2 = String::from(literal);
let owned3 = literal.to_owned();

// Coerce owned String to borrowed &str slice:
let owned = String::from("hello");
let borrowed: &str = &owned;
```

> [!note]
> নতুন তিনটা মুখ এই block-এ: **`.into()`** — সাধারণ conversion method (`Into` trait): "context-এর target type-এ রূপান্তর করো" — এখানে `let s4: String` annotation-ই বলে দিচ্ছে `&str → String` করতে হবে; ভেতরে `String::from`-কেই ডাকে, খরচ সমান (traits chapter-এ `From`/`Into`-এর পূর্ণ গল্প)। **`.to_owned()`** — `to_string()`-এরই আরেক নাম, `Clone` trait থেকে — শুধু `to_string()` সুবিধাজনক নাম। আর **`format!(...)`** — macro; কোনো operand-এর ownership না নিয়ে সবসময় **নতুন String allocate** করে (`Concatenation` section-এ এর ভেতরটা দেখেছি)। চার রকম নাম দেখে ঘাবড়িয়ো না — কাজ মূলত দুটোই: heap-এ copy করা (from/to_string/into/to_owned), নাহলে নতুন বানানো (format!)।

## Concatenation

```rust
// Addition operator consumes ownership of left operand:
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2;  // s1 ownership consumed; s2 borrowed via reference

// format! macro preserves ownership of all operand arguments:
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");
let combined = format!("{}-{}-{}", s1, s2, s3);  // s1, s2, and s3 remain valid

// push_str — mutate
let mut s = String::from("foo");
s.push_str("bar");
```

> [!warn]
> `+` operator প্রথম operand এর ownership নিয়ে নেয়! `s1 + &s2` দিলে `s1` invalid হয়ে যায়। এটা কনফিউজিং — `format!` ব্যবহার করা বেশি পরিষ্কার।

`+` কেন ownership নেয়? কারণ ভেতরে এই trait implementation টা কাজ করে:

```rust
// Conceptual std::ops::Add implementation:
impl Add<&str> for String {
    type Output = String;

    fn add(mut self, other: &str) -> String {
        self.push_str(other);   // Appends to existing heap buffer without extra allocation
        self                    // Returns modified buffer reusing capacity
    }
}
```

দেখো — `add` প্রথম operand টা **by value** (`self`) নেয়, কারণ append হয় ওই operand এর নিজের buffer এ — নতুন allocation বাঁচে, কিন্তু মালিকানা move হয়ে যায়। এ জন্যই `s1 + &s2` এর পরে `s1` invalid। অথচ `format!` ভেতরে formatting machinery চালিয়ে **সবসময় নতুন String** বানায় — কোনো operand এর মালিকানা নেয় না, তাই সবাই পরেও valid থাকে। দুই approach এর সুবিধা-অসুবিধা এখান থেকেই আসে।

## UTF-8 আর Indexing

Rust এর string UTF-8 encoded। Python 3 এর মতোই। কিন্তু একটা বড় পার্থক্য:

```rust
let hello = String::from("Hola");

// Error: direct integer indexing is disallowed to prevent UTF-8 boundary errors
// let h = hello[0];

// Iterate by raw bytes:
let bytes = hello.as_bytes();   // [72, 111, 108, 97]

// chars — Unicode scalar value
for c in hello.chars() {
    println!("{}", c);
}

// Split yields borrowed &str sub-slices:
let hola = &hello[0..4];  // "Hola"
```

> [!danger]
> Rust এ `s[0]` কাজ করে না! কারণ UTF-8 এ একটা character একাধিক byte হতে পারে। `"বাংলা"` এর প্রতিটা character ৩ বাইট! তাই byte index দিলে character এর মাঝখানে পড়তে পারে — panic। তাই Rust string indexing disable করেছে।

**`chars()` ভেতরে কী করে?** এটা একটা UTF-8 decoder — প্রতি step এ একটা Unicode scalar value পড়ে:

```text
শুরুর byte (lead byte) দেখেই বোঝে character টা কয় byte এর:
  0xxxxxxx                            → ১ byte (ASCII)
  110xxxxx 10xxxxxx                   → ২ byte
  1110xxxx 10xxxxxx 10xxxxxx          → ৩ byte (বাংলা এখানে!)
  11110xxx 10xxxxxx 10xxxxxx 10xxxxxx → ৪ byte (emoji এখানে)
```

Lead byte থেকেই length বের হয়, তারপর continuation byte (`10xxxxxx`) গুলোর free bit জোড়া দিয়ে পুরো code point বানায়। তাই `for c in s.chars()` কখনো character এর মাঝখানে ভাঙবে না — কিন্তু random access ও হলো না: i-তম character চাইলে O(i) করে হেঁটে যেতে হয়। এই trade-off এর জন্যই Rust indexing disable করেছে।

### Bangla String Example

```rust
let bangla = String::from("নমস্কার");

println!("Len (bytes): {}", bangla.len());     // 18 (6 char × 3 byte)
println!("Chars: {}", bangla.chars().count());  // 6

for (i, c) in bangla.chars().enumerate() {
    println!("{}: {}", i, c);
}
```

খেয়াল করো — `len()` হলো O(1), কারণ শুধু stored `len` field পড়ে (byte count)। কিন্তু `chars().count()` হলো O(n) — পুরো string decode করে গুনতে হয়। "কয়টা character" কোথাও stored থাকে না — UTF-8 এ সেটা variable-length।

## Slicing

```rust
let s = String::from("hello world");

let hello: &str = &s[0..5];     // "hello"
let world: &str = &s[6..11];    // "world"
let full: &str = &s[..];         // "hello world"
```

> [!warn]
> Slice করার সময় সাবধান — character boundary তে cut করতে হবে। নাহলে panic। `&s[0..3]` যদি ৩ বাইট একটা character এর মাঝখানে পড়ে, runtime panic হবে।

ভেতরে প্রতিটা slice এর আগে দুটো check চলে: `start <= end`, আর দুটো index ই **character boundary** তে আছে কিনা (ওই byte টা কোনো character এর শুরু, অর্থাৎ lead byte কিনা)। যেকোনো একটা fail করলে panic। পাস করলে result সেই একই zero-cost fat pointer — কোনো copy নেই।

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

> [!note]
> `split(',')`, `lines()`, `chars()` — সবগুলো **lazy iterator**: ডাকার সময় কিছুই করে না, প্রতিবার `next()` ডাকলে একটা করে piece দেয়। কোনো নতুন `String` allocate হয় না — প্রতিটা piece মূল string এর একটা `&str` slice মাত্র। তাই `csv.split(',')` শুধু loop করলে **zero allocation**; `collect()` করলে তবেই একটা `Vec` allocate হয় (কিন্তু character data নিজে copy হয় না)। Python এর `str.split()` সাথে সাথেই পুরো list বানায় — বড় text process করার সময় এই পার্থক্য কাজে দেয়।

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

// Collect split tokens into vector:
let parts: Vec<&str> = "a,b,c".split(',').collect();
// ["a", "b", "c"]

// Reverse
let reversed: String = "hello".chars().rev().collect();
```

> [!note]
> **কয়েকটা method এর ভেতরে:**
> - `contains("World")` — substring search। একটা char খুঁজলে সোজা byte scan; `&str` pattern হলে std এর optimized **two-way algorithm** চলে — O(n+m)। `starts_with`/`ends_with` আরও সস্তা: শুধু শুরু/শেষের কয়েক byte তুলনা করে, পুরো string ঘাঁটে না।
> - `to_uppercase()` — শুধু ASCII flip করা না; ভেতরে **Unicode case mapping table** খোঁজে। জটিলতা: uppercase করলে byte length বদলাতে পারে — `"straße".to_uppercase()` হলো `"STRASSE"` ('ß' → "SS")! উত্তরের size আগে থেকে জানা যায় না, তাই এটা **নতুন String allocate** করে।
> - `trim()` — সবচেয়ে সস্তা: শুরু-শেষের whitespace character গুলো skip করে বাকিটার **slice** ফেরত দেয় — কোনো copy/allocation নেই, খাঁটি zero cost। Unicode whitespace rule (`char::is_whitespace`) মেনে trim হয়।
> - `replace("World", "Rust")` — পুরো string scan করে নতুন `String` এ লিখে যায় — সবসময় নতুন allocation।
> - `"hello".chars().rev().collect()` — char গুলো উল্টে নতুন String এ আবার UTF-8 encode করে লেখে — এটাও নতুন allocation।

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