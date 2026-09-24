# Iterators ও Closures

Rust এর iterator system অসাধারণ — Python এর iterator protocol আর C++ এর STL algorithm এর সব সুবিধা একসাথে, আর সব **zero-cost abstraction**। এর সাথে closures যুক্ত হলে functional programming করা যায় দারুণভাবে।

## Iterator Basic

Rust এর `Iterator` trait এ শুধু একটাই method থাকতে হয় — `next()`:

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

### Manual Iterator

```rust
let v = vec![1, 2, 3];
let mut iter = v.iter();

println!("{:?}", iter.next());  // Some(&1)
println!("{:?}", iter.next());  // Some(&2)
println!("{:?}", iter.next());  // Some(&3)
println!("{:?}", iter.next());  // None
```

### for Loop

```rust
let v = vec![1, 2, 3];

// &T — immutable reference
for val in v.iter() {
    println!("{}", val);
}

// into_iter() consumes vector and takes ownership:
for val in v.into_iter() {
    println!("{}", val);
}
// v is no longer accessible after move

// &mut T — mutable reference
let mut v2 = vec![1, 2, 3];
for val in v2.iter_mut() {
    *val *= 2;
}
```

> [!tip]
> তিন রকম iteration:
> - `.iter()` — `&T` (immutable borrow, v valid থাকে)
> - `.into_iter()` — ownership (v consume হয়)
> - `.iter_mut()` — `&mut T` (mutable borrow)
> //
> Python এ সব `for x in v` দিয়ে হয়, কিন্তু Rust এ ownership type সচেতনভাবে choose করতে হয়।

> [!note]
> **`for` loop-এর ভেতরে কী হয়?** Compiler লুপটাকে expand করে:
> ```rust
> simplified desugar
> {
>     let mut iter = IntoIterator::into_iter(v.iter());  // Construct iterator instance
>     while let Some(val) = iter.next() {                // Advance iterator until exhaustion
>         println!("{}", val);
>     }
> }
> ```
> মানে `for` নিজে কিছুই জানে না — শুধু `next()` কে `None` পাওয়া পর্যন্ত টানে। আর `v.iter()` এর iterator আসলে দুটা field এর ছোট্ট struct: ভেতরের raw pointer আর বাকি element count। প্রতিটা `next()` = pointer এক ঘর এগোনো + count এক কমা — O(1), কোনো allocation নেই। পুরো iteration এর অবস্থা (state) মাত্র এই দুটা field — এটাই state machine।

## Iterator Adapter — Chain Operations

এবার আসল ম্যাজিক। Rust এর iterator method গুলো chain করা যায় — Python এর generator pipeline এর মতো, কিন্তু zero-cost।

### `map` — Transform

```rust
let v = vec![1, 2, 3, 4, 5];
let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
// [2, 4, 6, 8, 10]
```

### `filter` — Condition

```rust
let v = vec![1, 2, 3, 4, 5, 6];
let evens: Vec<&i32> = v.iter().filter(|x| *x % 2 == 0).collect();
// [2, 4, 6]
```

### Chain Everything

```rust
let result: Vec<i32> = (1..=10)
    .filter(|x| x % 2 == 0)      // [2, 4, 6, 8, 10]
    .map(|x| x * x)               // [4, 16, 36, 64, 100]
    .filter(|x| *x > 20)          // [36, 64, 100]
    .collect();
```

> [!example]
> এটা Python এর list comprehension `[x*x for x in range(1,11) if x%2==0]` এর মতো, কিন্তু Rust এ প্রতিটা step explicit। আর compiler এটাকে একটাই optimized loop এ compile করে — কোনো intermediate allocation ছাড়াই! (zero-cost abstraction)

### Chain এর ভেতরে — Lazy Adapter

প্রথম চমক: `.filter(...)`, `.map(...)` call করার মুহূর্তে **কোনো computation হয় না**। প্রতিটা adapter শুধু একটা ছোট struct return করে যেটা ভেতরের iterator আর closure টা ধরে রাখে — chain মানে একটার ভেতরে আরেকটা wrapper, পেঁয়াজের খোসার মতো:

```rust
// Simplified standard library Map iterator pattern:
struct Map<I, F> { iter: I, f: F }       // Adapter holding inner iterator and transformation closure

impl<I: Iterator, B, F: FnMut(I::Item) -> B> Iterator for Map<I, F> {
    type Item = B;
    fn next(&mut self) -> Option<B> {
        self.iter.next().map(&mut self.f)     // Pull next item and apply closure transformation
    }
}

struct Filter<I, P> { iter: I, predicate: P }

impl<I: Iterator, P: FnMut(&I::Item) -> bool> Iterator for Filter<I, P> {
    type Item = I::Item;
    fn next(&mut self) -> Option<I::Item> {
        loop {
            match self.iter.next() {
                Some(x) if (self.predicate)(&x) => return Some(x),  // Return first match satisfying predicate
                Some(_) => continue,          // Skip unmatched elements
                None => return None,
            }
        }
    }
}
```

আসল খেলা শুরু হয় **consumer** এ — `collect`, `sum`, `for` loop। ওরা `next()` টানতে থাকে, আর প্রতিটা টান ভেতর থেকে পুরো chain ভেদ করে উৎস পর্যন্ত যায়, পথে প্রতিটা স্তর নিজের কাজটা করে। তাই element গুলো এক স্রোতে বয়ে যায় — একটা item filter→map→filter একসাথে পার হয়, মাঝপথে কোনো intermediate `Vec` তৈরি হয় না।

**Zero-cost কোথায়?** প্রতিটা adapter আলাদা concrete type, তাই monomorphization + inlining এর পর compiler পুরো chain কে **একটাই plain `for` loop** বানিয়ে দেয় — হাতে লেখা loop-এর সমান machine code, একটা function call পর্যন্ত বাকি থাকে না।

আর `collect` নিজেও চালাক: শুরুতেই উৎসের `size_hint()` দেখে (কমপক্ষে/সর্বোচ্চ কত element আসবে) একবারে ঠিক capacity দিয়ে `Vec` allocate করে — তাই fill করার সময় বারবার grow হয় না।

## Closures — Anonymous Function

Closure হলো anonymous function — Python এর `lambda` বা JavaScript এর arrow function এর মতো।

### Syntax

```rust
// Fully explicit closure syntax:
let add = |x: i32, y: i32| -> i32 { x + y };

// Type inferred
let add = |x, y| x + y;

// Zero-parameter closure:
let greet = || println!("Hello!");

// Multiline
let compute = |x: i32| {
    let doubled = x * 2;
    let squared = doubled * doubled;
    squared
};
```

### Environment Capture

Closure তার চারপাশের variable capture করতে পারে — এটাই Python closure আর Rust closure এর মিল:

```rust
let name = String::from("Karim");
let greet = || println!("Hello, {}!", name); // Borrows name from enclosing scope
greet();
```

### Fn, FnMut, FnOnce — তিন রকম Closure environment কে কীভাবে capture করে তার উপর নির্ভর করে তিন trait:

```rust
// FnOnce captures variables by value (callable once):
let name = String::from("Karim");
let greet = move || {  // 'move' forces capture by value (ownership transfer)
    println!("{}", name);
};
greet();
// name is moved into closure environment

// FnMut captures variables by mutable reference:
let mut count = 0;
let mut increment = || { count += 1; };
increment();
increment();
println!("{}", count);  // 2

// Fn captures variables by immutable reference:
let pi = 3.14159;
let area = |r: f64| pi * r * r;  // Immutably borrows pi from scope
println!("{}", area(5.0));
```

| Trait | Capture | কখন |
|-------|---------|-----|
| `Fn` | `&T` (immutable) | Read only |
| `FnMut` | `&mut T` (mutable) | Modify environment |
| `FnOnce` | `T` (ownership) | Consume environment |

> [!note]
> Rust compiler automatically সবচেয়ে কম restrictive trait choose করে। তোমাকে explicit করতে হয় না। শুধু `move` keyword দরকার হয় যখন closure এর ownership নিতে হবে (যেমন thread spawn)।

### Closure আসলে একটা Anonymous Struct

Closure দেখতে magic, ভেতরে সাদামাটা — compiler প্রতিটা closure এর জন্য একটা নাম-হীন struct বানায়, আর **captured variable গুলো হলো তার field**। `Fn`/`FnMut`/`FnOnce` আসলে ওই struct এ তিন রকম call method:

```rust
let mut count = 0;
let mut increment = || { count += 1; };

// Conceptual compiler-generated closure struct:
struct Closure1<'a> {
    count: &'a mut i32,      // Captured environment stored as struct field
}

impl<'a> FnMut<()> for Closure1<'a> {
    fn call_mut(&mut self) {
        *self.count += 1;    // Mutate captured state through reference
    }
}
```

তিন trait এর পার্থক্য পুরোপুরি এটাই — **capture কীভাবে field এ ঢোকে**:

| Trait | Field এ কী থাকে | call এ self |
|-------|------------------|-------------|
| `FnOnce` | value নিজেই (`T`, ownership) | `self` consume — তাই একবারই |
| `FnMut` | `&mut T` | `&mut self` — বারবার, বদলানো যায় |
| `Fn` | `&T` | `&self` — বারবার, শুধু পড়া |

Compiler closure এর body দেখে ঠিক করে: শুধু পড়ছে → `Fn`, লিখছে → `FnMut`, value টাই move করছে (যেমন `move` closure) → `FnOnce`। সবচেয়ে কম restrictive টা জিতে নেয়। `move` keyword মানে capture করার মুহূর্তেই field এ value move হবে — borrow না। আর যেহেতু প্রতিটা closure একটা আলাদা type, trait parameter (`impl Fn`) এ ঢুকলে monomorphization এ closure call ও inline হয়ে যায় — iterator chain zero-cost হওয়ার আরেকটা কারণ এটাই।

## `move` Closure

```rust
let data = vec![1, 2, 3];

// Without move: borrows reference
let print_borrow = || println!("{:?}", data);

// With move: transfers ownership
let print_owned = move || println!("{:?}", data);

print_borrow();
print_owned();
// data moved into print_owned closure
```

> [!tip]
> `move` closure বিশেষ করে দরকার হয় thread spawn এ — কারণ thread এর lifetime parent function এর চেয়ে বেশি হতে পারে। Ownership move করলে safe।

## Powerful Iterator Methods

### `fold` — Reduce/Accumulate

```rust
let v = vec![1, 2, 3, 4, 5];
let sum: i32 = v.iter().fold(0, |acc, x| acc + x);
// 15

// Built-in iterator consumer sum():
let sum: i32 = v.iter().sum();

// Product
let product: i32 = v.iter().product();
// 120

// Custom fold
let concat: String = vec!["a", "b", "c"].iter().fold(
    String::new(),
    |mut acc, &s| { acc.push_str(s); acc }
);
// "abc"
```

> [!note]
> **`fold` এর ভেতরে?** একদম plain loop — `acc = init` রেখে প্রতিটা `next()` এর item এ `acc = f(acc, x)`; O(n), zero allocation। `sum()` আর `product()` ভেতরে fold কেই call করে (`sum` ≈ `fold(0, |a, x| a + x)`)।

### `enumerate` — Index সহ

```rust
for (i, val) in vec!["a", "b", "c"].iter().enumerate() {
    println!("{}: {}", i, val);
}
```

### `zip` — দুটো Iterator জোড়া

```rust
let names = vec!["Karim", "Rahim", "Sadia"];
let scores = vec![85, 92, 78];

for (name, score) in names.iter().zip(scores.iter()) {
    println!("{}: {}", name, score);
}
```

> [!note]
> **`zip` এর ভেতরে?** দুটো iterator ধরে রাখা আরেকটা adapter struct — প্রতিটা `next()` এ দুই পাশ থেকে একটা করে টেনে জোড়া বানায়, কোনো এক পাশ `None` দিলেই থেমে যায়। `enumerate` আরও সহজ: ভেতরের iterator + একটা counter, প্রতিটা item এর সাথে `i += 1` জুড়ে দেয়।

### `take` আর `skip`

```rust
let v: Vec<i32> = (1..=10).collect();

let first_three: Vec<i32> = v.iter().take(3).cloned().collect();
// [1, 2, 3]

let skip_three: Vec<i32> = v.iter().skip(3).cloned().collect();
// [4, 5, 6, 7, 8, 9, 10]
```

> [!note]
> দুটোই আবার adapter struct — ভেতরে একটা counter ছাড়া কিছু না। `take(n)` প্রতিটা `next()` এ count বাড়ায়, n পার হলে `None` দেয়; `skip(n)` প্রথম `next()` call এই n টা item খেয়ে ফেলে, তারপর সরাসরি ভেতরেরটা টানে। কেউই আগে থেকে কিছু compute করে না — সব lazy।

### `find` আর `position`

```rust
let v = vec![1, 2, 3, 4, 5];

let first_even = v.iter().find(|x| *x % 2 == 0);  // Some(&2)
let pos = v.iter().position(|x| *x == 3);          // Some(2)
```

> [!note]
> **Short-circuit family** — `find`, `position`, `any`, `all` সবাই একই খেলা খেলে: পরপর `next()` টেনে predicate চালায়, শর্ত মিললেই **থেমে যায়** — বাকি element দেখেও না। ভেতরের রেসিপি এক: `position` ≈ `enumerate` + `find`, `any` = `find` এর bool version, `all` = উল্টো শর্ত। `count()` আর `max()`/`min()` ভেতরে সাধারণ `fold` চালায় — ওদের থামার কোনো কারণ নেই।

### `any`, `all`, `count`

```rust
let v = vec![1, 2, 3, 4, 5];

v.iter().any(|x| *x == 3);    // true
v.iter().all(|x| *x > 0);     // true
v.iter().count();              // 5
v.iter().max();                // Some(&5)
v.iter().min();                // Some(&1)
```

### `flat_map` — Flatten

```rust
let nested = vec![vec![1, 2], vec![3, 4], vec![5]];
let flat: Vec<&i32> = nested.iter().flat_map(|v| v.iter()).collect();
// [1, 2, 3, 4, 5]
```

### `chunk_by` — Consecutive Equal Groups

```rust
let v = vec![1, 1, 2, 2, 2, 3, 1];
for (key, group) in &v.iter().chunk_by(|x| *x) {
    println!("{:?}: {:?}", key, group.collect::<Vec<_>>());
}
```

## Own Iterator Implement করা

```rust
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count < 5 {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let counter = Counter::new();

    // Enables full iterator adapter chain
    let result: Vec<u32> = counter
        .map(|x| x * 2)
        .filter(|x| x > 4)
        .collect();
    // [6, 8, 10]
}
```

> [!example]
> শুধু `next()` implement করলেই সব iterator method (map, filter, collect, sum...) free পেয়ে যাও! এটাই Rust এর trait system এর শক্তি।

## Python vs Rust — Iterator তুলনা

```python
# Python — list comprehension
result = [x*x for x in range(1, 11) if x % 2 == 0]
```

```rust
// Rust — iterator chain
let result: Vec<i32> = (1..=11)
    .filter(|x| x % 2 == 0)
    .map(|x| x * x)
    .collect();
```

```python
# Python — generator (lazy)
def squares(n):
    for x in range(n):
        yield x * x

for s in squares(10):
    print(s)
```

```rust
// Rust — iterator (lazy)
fn squares(n: u32) -> impl Iterator<Item = u32> {
    (0..n).map(|x| x * x)
}

for s in squares(10) {
    println!("{}", s);
}
```

> [!note]
> দুটোই lazy evaluation। কিন্তু Rust এর iterator zero-cost — কোনো runtime overhead নেই। Python এর generator এ protocol overhead আছে। এবং Rust compiler lazy chain কে optimize করে single loop এ পরিণত করে।

## বাস্তব উদাহরণ — Data Pipeline

```rust
struct Student {
    name: String,
    grade: f64,
}

fn main() {
    let students = vec![
        Student { name: "Karim".into(), grade: 85.0 },
        Student { name: "Rahim".into(), grade: 45.0 },
        Student { name: "Sadia".into(), grade: 92.0 },
        Student { name: "Maya".into(), grade: 55.0 },
        Student { name: "Arif".into(), grade: 78.0 },
    ];

    // Passed students, sorted by grade (descending), names only
    let mut passed: Vec<&Student> = students
        .iter()
        .filter(|s| s.grade >= 60.0)
        .inspect(|s| println!("  passing: {} ({})", s.name, s.grade))
        .collect();
    passed.sort_by(|a, b| b.grade.partial_cmp(&a.grade).unwrap());

    let top_students: Vec<String> = passed
        .into_iter()
        .map(|s| s.name.clone())
        .collect();
    println!("Passed: {:?}", top_students);

    // Simpler approach
    let best = students
        .iter()
        .filter(|s| s.grade >= 60.0)
        .max_by(|a, b| a.grade.partial_cmp(&b.grade).unwrap());

    if let Some(student) = best {
        println!("Top student: {} ({})", student.name, student.grade);
    }

    let avg: f64 = students.iter().map(|s| s.grade).sum::<f64>() / students.len() as f64;
    println!("Average: {:.2}", avg);
}
```

> [!tip]
> খেয়াল করো — data pipeline এ এক লাইনে filter → map → sum সব হয়ে যাচ্ছে। এটাই functional programming এর শক্তি। প্রতিটা step পড়লেই বোঝা যায় কী হচ্ছে — ঠিক Python এর pandas pipeline এর মতো।

## Summary

Iterators আর closures হলো Rust এর functional side। Iterator chain দিয়ে map/filter/collect pipeline বানাও, closure দিয়ে inline function লেখো। সব zero-cost — compiler single optimized loop বানায়। Python এর list comprehension এর equivalent, কিন্তু type-safe আর fast। পরের chapter এ modules আর cargo দেখবো।