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
// ERROR — দুই branch এ ভিন্ন type
let value = if true { 5 } else { "hello" };
```

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

### Nested loop এ break/continue

`break` আর `continue` শুধু কাছের loop এই কাজ করে। কিন্তু label দিয়ে বাইরের loop ও control করা যায়:

```rust
let mut count = 0;

'outer: loop {
    count += 1;
    let mut remaining = 10;

    loop {
        if remaining == 9 {
            break;  // ভেতরের loop থেকে বেরো
        }
        if count == 3 {
            break 'outer;  // বাইরের loop থেকে বেরো!
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

// Exclusive range (1..5 মানে 1 থেকে 4)
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

শুধু একটা pattern match করতে চাইলে `if let` ব্যবহার করা যায়:

```rust
let some_value = Some(42);

// match দিয়ে
match some_value {
    Some(val) => println!("Value: {}", val),
    None => {},
}

// if let দিয়ে — ছোট
if let Some(val) = some_value {
    println!("Value: {}", val);
}
```

> [!tip]
> `if let` ব্যবহার করো যখন শুধু একটা case দরকার আর বাকিগুলো ignore করতে চাও। পুরো হাত ধরে match করতে চাইলে `match` ব্যবহার করো।

## while let — Loop সহ Match

```rust
let mut stack = vec![1, 2, 3];

while let Some(top) = stack.pop() {
    println!("{}", top);  // 3, 2, 1
}
```

Python এ এটা করতে হতো `while stack: top = stack.pop()`। Rust এ `Option` সহ safe ভাবে।

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