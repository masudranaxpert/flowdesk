# Control Flow — if/else, loop, match

আগের chapter এ variable আর function শিখলাম। এবার চলো control flow দেখি — কীভাবে decision নিতে হয়, কীভাবে loop চালাতে হয়। Rust এ control flow Python/C++ এর মতোই, কিন্তু কিছু মজার পার্থক্য আছে।

## if / else if / else

Rust এর `if` খুবই straightforward:

```rust
let score = 85;

if score >= 90 {
    println!("A+");
} else if score >= 80 {
    println!("A");
} else if score >= 70 {
    println!("B");
} else {
    println!("F");
}
```

> [!note]
> Python এর মতো Rust এও condition এ parentheses লাগে না। কিন্তু C++ এর মতো curly brace `{}` বাধ্যতামূলক — এক লাইনের জন্যও।

### if হলো Expression

Rust এ `if` একটা expression — মানে এটা value return করতে পারে। Python এ এটা সম্ভব না (ternary operator লাগে), কিন্তু Rust এ সরাসরি:

```rust
let score = 75;
let grade = if score >= 80 { "A" } else { "B" };
// grade = "B"
```

> [!tip]
> Python এ এটা করতে হতো `grade = "A" if score >= 80 else "B"`। Rust এ `if` ই হলো ternary — আলাদা operator নেই। কিন্তু দুই branch এর **type একই হতে হবে**:

```rust
// Compilation error: if and else branches have mismatched types
let value = if true { 5 } else { "hello" };
```

### if expression এর ভেতরে — compiler কী করে?

`if` কে expression ভাবার সবচেয়ে সহজ উপায় — machine level এ ভাবা। Compiler এই কোডটাকে মোটামুটি এমন generate করে:

```text
; grade = if score >= 80 { "A" } else { "B" } (conceptual x86-64)
cmp   score, 80
jl    .else              ; condition মিথ্যা হলে .else এ ঝাঁপ
lea   rax, [.str_A]      ; সত্য হলে rax এ "A" এর address
jmp   .done
.else:
lea   rax, [.str_B]      ; মিথ্যা path ও rax এই value রাখে
.done:
; দুই রাস্তাই একই register (rax) এ value রেখে যায়
; — সেটাই "if এর return value", পরের কোড ওখান থেকে পায়
```

মানে "expression" বলতে আসলে এটাই: **প্রতিটা branch শেষ হয় একটা value register এ**। C এর ternary `x ? a : b` ঠিক এভাবেই compile হয় — Rust শুধু সেই ক্ষমতাটা পুরো `if/else` কে দিয়েছে। সাথে দুটো compile-time নিয়মও এখানেই বোঝা যায়:

- **Condition সবসময় `bool`** — C/Python এর মতো "truthy/falsy" coercion নেই। `if 5 {}` লিখলেই error, কারণ branch শুরুর conditional jump এর জন্য ১-bit উত্তর লাগে, `5` দিয়ে jump decision নেওয়া যায় না।
- **দুই branch এর type unify হয় compile time এ** — এক branch দেয় `i32`, আরেকটা `&str` — compiler বুঝতে পারে না কোন type এর value register ধরবে, তাই error।

## loop — Infinite Loop

Rust এ `loop` হলো infinite loop (C++ এর `while(true)` এর মতো):

```rust
let mut count = 0;

loop {
    count += 1;
    if count == 10 {
        break;
    }
}
```

### loop থেকে Value Return

Rust এ `break` value return করতে পারে:

```rust
let mut counter = 0;

let result = loop {
    counter += 1;
    if counter == 10 {
        break counter * 2;  // result = 20
    }
};
```

> [!example]
> এটা Rust এর একটা দারুণ ফিচার। Python/C++ এ loop থেকে value return করা যায় না — external variable লাগে।

**`break value` এর mechanism টা কী?** `loop` আসলে একটা block expression — `break expr` মানে "loop এর একদম শেষে ঝাঁপ দাও, সাথে expr এর value টা result register এ রেখে যাও"। Compiler এর চোখে loop এর type হয় তার ভেতরের `break` গুলোর type — এখানে সব break দেয় `i32`, তাই `result: i32`। আর যদি কোনো `break` না থাকে (চিরকাল চলবে এমন loop), loop এর type হয় `!` — "never": এই expression থেকে কখনো value ফিরবেই না, compiler সেটা জেনে পরের কোডকে unreachable ধরে। Python/C++ এ loop value return করে না বলে বাইরে আলাদা `mut` variable লাগে — Rust এ সেই boilerplate নেই।

### Nested loop এ break/continue

`break` আর `continue` শুধু কাছের loop এই কাজ করে। কিন্তু label দিয়ে বাইরের loop ও control করা যায়:

```rust
let mut count = 0;

'outer: loop {
    count += 1;
    let mut remaining = 10;

    loop {
        if remaining == 9 {
            break; // Terminate innermost loop
        }
        if count == 3 {
            break 'outer; // Break out of labeled outer loop
        }
        remaining -= 1;
    }
}
// count = 3
```

## while Loop

```rust
let mut n = 5;

while n > 0 {
    println!("{}!", n);
    n -= 1;
}
println!("Liftoff!");
```

Python এর সাথে একই — শুধু curly brace আর `let mut` বাড়তে।

## for Loop

Rust এর `for` loop Python এর মতোই — range বা iterator উপর iterate করে:

```rust
// Range
for i in 1..=5 {
    println!("{}", i);  // 1, 2, 3, 4, 5
}

// Exclusive range: 1..5 includes 1 through 4
for i in 1..5 {
    println!("{}", i);  // 1, 2, 3, 4
}

// Array
let fruits = ["apple", "banana", "mango"];
for fruit in fruits {
    println!("{}", fruit);
}

// Reverse
for i in (1..=5).rev() {
    println!("{}", i);  // 5, 4, 3, 2, 1
}
```

> [!tip]
> Rust এ range হলো `start..end` (exclusive) আর `start..=end` (inclusive)। Python এর `range(1, 5)` আর `range(1, 6)` এর মতো।

### for এর ভেতরে — সবকিছু iterator

Rust এ `for` নিজে কোনো loop machine না — সবসময় **iterator** এ নেমে যায়:

```rust
// for i in 1..=5 { println!("{}", i); }
// Desugared iterator loop mechanics:
{
    let mut iter = (1..=5).into_iter(); // Stack-allocated range iterator (zero-cost)
    while let Some(i) = iter.next() {   // Yield next item until iterator returns None
        println!("{}", i);
    }
}
```

- `1..=5` কোনো list না — `RangeInclusive` নামের ছোট struct, ভেতরে মোটামুটি দুইটা সংখ্যা। Memory: দুইটা `i32`, zero allocation।
- প্রতি ধাপে `next()`, শেষ হলে `None` — `while let` ওখানেই থামে।
- LLVM পুরোটাকে আবার সহজ counter-loop এ (`i++; cmp; jle`) গুটিয়ে ফেলে — C এর `for(int i=1; i<=5; i++)` এর সমান assembly, abstraction এর দাম শূন্য।

### Enumerate — Index সহ Loop

Python এর `enumerate()` এর মতো:

```rust
let fruits = ["apple", "banana", "mango"];

for (index, fruit) in fruits.iter().enumerate() {
    println!("{}: {}", index, fruit);
}
// 0: apple
// 1: banana
// 2: mango
```

> [!note]
> **`.enumerate()` এর ভেতরে:** এটা একটা iterator **adapter** — মূল iterator কে ভেতরে মুড়িয়ে রাখে, সাথে নিজের একটা counter রাখে। প্রতি `next()` এ counter +১ করে `(index, item)` tuple দেয়। নতুন কোনো array/vector বানায় না, allocation zero — প্রতি ধাপে extra cost একটা counter increment মাত্র। LLVM সাধারণত পুরোটাকে index-based pointer arithmetic এ optimize করে ফেলে।

## match — Rust এর Powerhouse

`match` হলো Rust এর সবচেয়ে শক্তিশালী control flow tool। C/C++ এর `switch` এর অনেক বেশি — এটা pattern matching করে:

```rust
let number = 3;

match number {
    1 => println!("One"),
    2 => println!("Two"),
    3 => println!("Three"),
    4 | 5 => println!("Four or Five"),  // OR pattern
    6..=10 => println!("Six to Ten"),   // Range pattern
    _ => println!("Something else"),     // default (wildcard)
}
```

> [!warn]
> `match` এ **সব case cover করতে হবে** — নাহলে compile error। `_` wildcard দিয়ে "বাকি সব" বোঝানো যায়। এটা Rust এর safety guarantee — কোনো case miss হবে না।

### match এর ভেতরে — exhaustiveness check আর codegen

দুই ধাপে ঘটে, দুটোই compile time এ:

**ধাপ ১ — exhaustiveness check:** compiler pattern গুলো থেকে একটা decision tree বানায় আর verify করে — input এর সব সম্ভাব্য value কি কোনো না কোনো arm এ পড়বে? `i32` এর মতো type এ সম্ভাব্য value অসীম, তাই `_` লাগেই। কিন্তু enum (যেমন `Option`) হলে variant সংখ্যা finite আর type system এ লেখা থাকে — compiler জানে `Some`/`None` ছাড়া আর কিছু হতে পারে না, তাই একটা variant বাদ দিলেই `E0004: non-exhaustive patterns`। মানে এই safety টা দাঁড়িয়ে আছে compiler এর type knowledge এর উপর।

**ধাপ ২ — কোড generate:** pattern দেখে compiler দ্রুততম strategy বাছে:

```text
১. ঘন, পরপর integer pattern (1,2,3…10 জাতীয়):
   jump table — একটা indexed jump, compare করারও দরকার নেই। O(1)।
২. ছড়ানো সংখ্যা:
   compare chain / binary search — উপর থেকে নিচে মিলিয়ে দেখা।
৩. guard (x if শর্ত) থাকলে:
   উপর থেকে নিচে sequential check — guard এর ফলাফল pattern দেখে আগে থেকে জানা যায় না।
```

মানে `match` শক্তিশালী হয়েও ধীর না — C এর best-case `switch` এর মতোই fast, সাথে exhaustiveness guarantee। (Enum আর pattern এর গভীর ব্যাপার পরের chapter গুলোতে।)

### match হলো Expression

`if` এর মতো `match` ও value return করে:

```rust
let grade = 85;

let letter = match grade {
    90..=100 => "A",
    80..=89 => "B",
    70..=79 => "C",
    _ => "F",
};
```

### Tuple Destructuring

```rust
let point = (3, 5);

match point {
    (0, 0) => println!("Origin"),
    (x, 0) => println!("X axis: {}", x),
    (0, y) => println!("Y axis: {}", y),
    (x, y) => println!("Point ({}, {})", x, y),
}
```

### Guard — Extra Condition

```rust
let pair = (2, -3);

match pair {
    (x, y) if x == y => println!("Equal"),
    (x, y) if x + y == 0 => println!("Opposite"),
    _ => println!("Other"),
}
```

## if let — Short match

শুরুতেই একটা নতুন মুখ: `Some(42)`। এটা কোথা থেকে এলো? `Option` নামের একটা std type আছে (prelude থেকে auto-import হয়) যার মান দুই রকম হতে পারে — `Some(মান)` মানে "মান আছে", `None` মানে "নেই"। Rust-এ null নেই, এটাই তার বিকল্প — "মান নে-ও-তে-পারে" বোঝানোর type-safe উপায়। (`Some` আসলে enum-এর একটা variant, আর variant-টা নিজেই value বানানোর ছোট function — enum-এর পূর্ণ গল্প পরের chapter গুলোতে।) আপাতত এটুকু জানলেই নিচের কোড পড়া যাবে:

শুধু একটা pattern match করতে চাইলে `if let` ব্যবহার করা যায়:

```rust
let some_value = Some(42);
match some_value {
    Some(val) => println!("Value: {}", val),
    None => {},
}

// Concise pattern match with if let:
if let Some(val) = some_value {
    println!("Value: {}", val);
}
```

> [!tip]
> `if let` ব্যবহার করো যখন শুধু একটা case দরকার আর বাকিগুলো ignore করতে চাও। পুরো হাত ধরে match করতে চাইলে `match` ব্যবহার করো।

**`if let` এর ভেতরে কী হয়?** এটা কোনো নতুন mechanism না — compiler এটাকে সরাসরি `match` এ রূপান্তর করে:

```rust
// if let Some(val) = some_value { body }
// Desugared equivalent pattern:
match some_value {
    Some(val) => { body },
    _ => {},
}
```

`while let` ও একই — শুধু match টা loop এর ভেতরে বসে: প্রতি ধাপে match, `None` পেলে loop ভেঙে বেরিয়ে যায়। মানে দুটোই match এর shorthand — আলাদা runtime ব্যবস্থা কিছু নেই।

## while let — Loop সহ Match

```rust
let mut stack = vec![1, 2, 3];

while let Some(top) = stack.pop() {
    println!("{}", top);  // 3, 2, 1
}
```

Python এ এটা করতে হতো `while stack: top = stack.pop()`। Rust এ `Option` সহ safe ভাবে।

এখানে দুটা builtin এর ভেতরে কী চলছে:

- **`vec![1, 2, 3]`** — macro, compile time এ expand হয়: ঠিক ৩টা element এর জন্য **একবারই** memory allocate করে, element গুলো সরাসরি ওই buffer এ বসিয়ে দেয়।
- **`stack.pop()`** — ভেতরের ধাপ: ① `len == 0`? হলে `None`। ② নাহলে শেষ slot থেকে value টা move করে বের করো, ③ `len -= 1`, ④ `Some(value)` দাও। O(1), কোনো memory free হয় না — capacity আগের মতোই থাকে, পরের `push` তাই আবার O(1)।

আর লক্ষ্য করো — pop এর উত্তর **`Option` এ মোড়ানো**: খালি stack থেকে pop মানে crash না, `None`। আর তোমাকে `None` case টা `while let` দিয়ে handle করতেই হয়। Python এ `list.pop()` খালি হলে `IndexError` — সেই class এর bug এখানে type system ই আটকায়।

## Control Flow তুলনা

| কনসেপ্ট | Python | C++ | Rust |
|---------|--------|-----|------|
| if/else | `if x:` | `if (x) {}` | `if x {}` |
| Ternary | `a if x else b` | `x ? a : b` | `if x { a } else { b }` |
| Infinite loop | `while True:` | `while(true) {}` | `loop {}` |
| for range | `for i in range(5):` | `for(int i=0; i<5; i++)` | `for i in 0..5 {}` |
| Switch | — | `switch` | `match` |
| Pattern matching | — | — | `match`, `if let` |

> [!note]
> Rust এ `switch` নেই — `match` হলো switch এর অনেক বেশি powerful বিকল্প। Pattern matching, destructuring, range, guard — সব এক জায়গায়।

## একসাথে সব — FizzBuzz

```rust
fn main() {
    for n in 1..=20 {
        let result = match (n % 3, n % 5) {
            (0, 0) => "FizzBuzz",
            (0, _) => "Fizz",
            (_, 0) => "Buzz",
            _ => "Number",
        };

        if result == "Number" {
            println!("{}", n);
        } else {
            println!("{}", result);
        }
    }
}
```

> [!example]
> খেয়াল করো — tuple matching দিয়ে `(n % 3, n % 5)` একসাথে check করা হয়েছে। Python এ এটা করা যায়, কিন্তু Rust এ compiler নিশ্চিত করে সব case cover করা হয়েছে।

## Summary

Rust এর control flow পরিচিত কিন্তু powerful। `if` আর `match` দুটোই expression — value return করে। `loop` থেকেও value return করা যায়। `match` হলো Rust এর সবচেয়ে বড় weapon — exhaustive pattern matching সহ। পরের chapter এ আসছে Rust এর সবচেয়ে গুরুত্বপূর্ণ কনসেপ্ট — Ownership।