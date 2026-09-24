# Smart Pointers — Box, Rc, RefCell

Reference (`&T`) হলো Rust এর borrow করার উপায়। কিন্তু মাঝে মাঝে এর চেয়ে বেশি দরকার — heap allocation, shared ownership, interior mutability। এই সমস্যার সমাধান হলো **smart pointer**।

## Reference vs Smart Pointer

| Feature | `&T` / `&mut T` | Smart Pointer |
|---------|----------------|---------------|
| Storage | Stack | Heap (usually) |
| Ownership | Borrow | Own (usually) |
| Lifetime | Compile-time checked | Runtime checked (sometimes) |
| Examples | `&str`, `&[T]` | `Box<T>`, `Rc<T>`, `RefCell<T>` |

## `Box<T>` — Heap Allocation

`Box` হলো সবচেয়ে simple smart pointer — value টা heap এ allocate করে:

```rust
fn main() {
    let x = Box::new(5);
    println!("{}", x);  // 5
}
// Box deallocates heap memory upon exiting scope
```

> [!note]
> `Box::new(5)` এ `5` কে heap এ allocate করে, `x` হলো stack এর pointer। Scope শেষে `Box` drop হয়, heap memory free হয়। C/C++ এর `new`/`delete` এর মতো, কিন্তু automatic cleanup সহ।

ভেতরে দেখলে দুই ধাপ (simplified):

```rust
pub fn new(value: T) -> Box<T> {
    // 1. Allocate heap memory for size_of::<T>() via global allocator
    let ptr = alloc(Layout::new::<T>());
    // 2. Move stack value into allocated heap memory address
    unsafe { ptr::write(ptr, value) };
    Box { ptr }            // Stack contains 8-byte pointer to heap location
}

impl<T> Drop for Box<T> {
    fn drop(&mut self) {
        unsafe { dealloc(self.ptr, Layout::new::<T>()) }   // Deallocate heap memory at scope exit
    }
}
```

memory ছবি: stack এ `x` = ৮-byte pointer, আসল `5` heap এ। খরচ: একবার alloc + একবার free — এই ছোট value এর জন্য heap যেটুকু করে সেটাই দাম (C++ এ `unique_ptr` ঠিক একই জায়গায় থাকে)।

### কেন Box দরকার?

১. **Large data** — stack overflow এড়াতে:

```rust
// Avoid massive stack allocation (risks stack overflow):
let big_array = [0i32; 1_000_000];  // stack overflow risk

// Preferred: heap-allocated array via Box:
let big_array = Box::new([0i32; 1_000_000]);
```

২. **Recursive type** — size compile time এ জানা না থাকলে:

```rust
// Recursive Cons list using Box indirection:
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
}
```

> [!danger]
> `Box` ছাড়া এটা compile হবে না! কারণ `Cons(i32, List)` infinite size চায় — compiler বলবে "recursive type has infinite size"। `Box<List>` দিলে শুধু pointer size (8 bytes) store হয় — finite।

৩. **Trait Object** — runtime polymorphism:

```rust
trait Animal {
    fn sound(&self) -> String;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn sound(&self) -> String { "Woof".into() }
}

impl Animal for Cat {
    fn sound(&self) -> String { "Meow".into() }
}

fn main() {
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog),
        Box::new(Cat),
    ];

    for animal in &animals {
        println!("{}", animal.sound());
    }
}
```

> [!tip]
> যখন একই collection এ একাধিক type store করতে হবে, `Box<dyn Trait>` ব্যবহার করো। এটাই trait object — C++ এর `unique_ptr<Animal>` এর মতো।

### Deref — Transparent Access

`Box` এর ভেতরের value তে access `*` ছাড়াই করা যায় (deref coercion):

```rust
let x = Box::new(5);
// All dereference patterns valid:
println!("{}", *x);   // explicit deref
println!("{}", x);    // auto deref (Display)
let y = x + 1;        // auto deref for operators
```

> [!note]
> **Auto-deref কীভাবে হয়?** Compiler এর compile-time ট্রিক — **deref coercion**। Type মিলছে না দেখলে compiler নিজেই `Deref::deref` call বসিয়ে দেয়, যতবার লাগে ততবার (`&Box<String>` → `&String` → `&str`)। Method call এও একই: প্রথমে `Box` এর নিজের method খোঁজে, না পেলে এক deref করে `String` এ, তারপর `str` এ। Runtime এ খরচ শূন্য — pointer follow করা ছাড়া কিছুই না।

## `Rc<T>` — Shared Ownership

যখন একই data এর একাধিক owner দরকার:

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(String::from("shared"));

    let r1 = Rc::clone(&data);  // Increments strong reference count without deep copy
    let r2 = Rc::clone(&data);

    println!("Count: {}", Rc::strong_count(&data));  // 3
    println!("{} {} {}", data, r1, r2);

    // Dropping r1 decrements count; data remains alive
    drop(r1);
    println!("Count: {}", Rc::strong_count(&data));  // 2
}
// Data deallocated when strong reference count reaches 0
```

> [!note]
> `Rc` (Reference Counted) হলো Python এর garbage collector এর ছোট ভাই। Reference count track করে — শেষ reference drop হলে data free হয়। কিন্তু **single-threaded only**! Multi-threaded এর জন্য `Arc` দরকার।

memory-তে `Rc` কেমন? Heap এ একটা control block — দুটো counter + আসল data:

```rust
// Internal RcBox heap layout:
struct RcInner<T> {
    strong: usize,   // Strong reference count
    weak: usize,     // Weak reference count
    value: T,        // Inner payload data
}
```

তাহলে ভেতরের হিসাব:

- `Rc::clone(&data)` কোনো data copy করে **না** — শুধু `strong += 1` (একটা সাধারণ increment, ১-২ cycle)। নতুন `Rc` মানে একই pointer এর আরেকটা ৮-byte copy। এজন্যই "cheap"।
- প্রতিটা `Rc` drop হলে `strong -= 1`; ফল ০ হলে (আর কেউ owner নেই) ভেতরের `value.drop()` চালিয়ে heap block free। (একটু সূক্ষ্মতা: block টা শেষ `Weak` পর্যন্ত বাঁচে — `weak` counter ০ হলে তবেই শেষ free।)
- `Rc::strong_count(&data)` = ওই counter টা পড়া মাত্র। সব operation O(1)।
- Counter দুটো সাধারণ (non-atomic) — দুই thread একসাথে clone করলে হিসাব ভেঙে যাবে (data race)। এজন্যই `Rc` কে thread এ পাঠানো compiler বারণ করে (`!Send`)।

### কখন Rc দরকার?

```rust
use std::rc::Rc;

struct Node {
    value: i32,
    children: Vec<Rc<Node>>,
}

fn main() {
    let leaf = Rc::new(Node { value: 3, children: vec![] });

    let branch1 = Rc::new(Node {
        value: 1,
        children: vec![Rc::clone(&leaf)],
    });

    let branch2 = Rc::new(Node {
        value: 2,
        children: vec![Rc::clone(&leaf)],  // Multiple owners share reference to leaf node
    });

    println!("Leaf ref count: {}", Rc::strong_count(&leaf));  // 3
}
```

> [!example]
> Tree বা graph structure এ একই node কে একাধিক parent থেকে point করতে হলে `Rc` দরকার। Ownership rule (একজন owner) এর বিপরীতে `Rc` একাধিক owner allow করে।

### `Rc::clone` vs `clone`

```rust
let s = Rc::new(String::from("hello"));

// Rc::clone is fast: increments reference counter without copying heap data
let s2 = Rc::clone(&s);

// Deep clone copies heap buffer (O(n) performance cost)
let s3 = (*s).clone();
```

> [!warn]
> `Rc::clone(&s)` আর `s.clone()` আলাদা! `Rc::clone` reference count বাড়ায় (cheap), `s.clone()` data copy করে (expensive)। Clippy তোমাকে সাহায্য করবে ভুল ধরতে।

### Rc Cycle আর `Weak` — কেন দরকার

`Rc` এর একটা সর্বনাশ: দুটো node যদি একে অপরকে `Rc` দিয়ে ধরে (parent → child, আবার child → parent), দুজনের `strong` count কখনো ০ হয় না — drop কেউ করতে পারে না, heap block চিরকাল leak। Python এ GC এর cycle detector এটা ধরে ফেলে, Rust এ `Rc` এর ভেতরে কেউ নেই।

সমাধান `Weak` — এমন pointer যেটা ownership নেয় না: clone করলে `strong` না বাড়িয়ে `weak` counter বাড়ে, তাই data বাঁচিয়ে রাখতে পারে না — আর cycle ভেঙে যায়:

```rust
use std::rc::{Rc, Weak};

struct Node {
    children: Vec<Rc<Node>>,   // Strong references from parent to children
    parent: Weak<Node>,        // Weak back-reference to parent avoids reference cycle leaks
}
```

`Weak` থেকে value নিতে হলে `parent.upgrade()` — ভেতরে শুধু একটা check: strong count > 0? থাকলে `Some(Rc)`, data drop হয়ে গেলে `None`। Dangling pointer হওয়ার সুযোগই নেই। চর্চা: parent → child strong (`Rc`), child → parent weak (`Weak`)।

## `RefCell<T>` — Interior Mutability

যখন immutable reference দিয়ে data modify করতে হয়:

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // borrow_mut — mutable access
    data.borrow_mut().push(4);

    // borrow — immutable access
    println!("{:?}", data.borrow());  // [1, 2, 3, 4]
}
```

> [!danger]
> `RefCell` borrowing rule runtime এ check করে! যদি একই সময়ে দুটো mutable borrow নাও, **runtime panic** হবে। Compiler compile time এ ধরবে না। সাবধান!

```rust
let data = RefCell::new(5);
let b1 = data.borrow_mut();
let b2 = data.borrow_mut();  // PANIC! Already borrowed
```

ভেতরে কী চলে? কোনো lock নেই — মাত্র একটা `Cell<BorrowFlag>` (একটা integer), তিন অবস্থায় থাকে:

```text
0        → কেউ ধরেনি (unused)
1, 2, 3… → এতগুলো immutable borrow চলছে (shared)
-1       → একটা mutable borrow চলছে (exclusive)
```

```rust
// Simplified
pub fn borrow(&self) -> Ref<'_, T> {
    match self.flag.get() {
        EXCLUSIVE => panic!("already borrowed: BorrowError"),   // runtime panic!
        n         => { self.flag.set(n + 1); Ref { /* drop এ flag ঠিক করবে */ } }
    }
}

pub fn borrow_mut(&self) -> RefMut<'_, T> {
    if self.flag.get() != 0 {
        panic!("already borrowed: BorrowMutError");             // runtime panic!
    }
    self.flag.set(EXCLUSIVE);
    RefMut { /* drop এ flag ০ করবে */ }
}
```

মানে প্রতিটা `borrow`/`borrow_mut` call এ একটা integer পড়া-লেখা ছাড়া কিছুই না — compile-time borrow check এর চেয়ে ধীর, কিন্তু Mutex এর lock থেকে অনেক সস্তা। Panic টা হয় ঠিক এই flag check এ। `Ref`/`RefMut` guard object টা scope শেষে drop হলে flag আগের অবস্থায় ফিরে যায় — সেটাও আবার `Drop` trait এর কাজ।

### কখন RefCell দরকার?

```rust
use std::cell::RefCell;

struct Messenger {
    messages: RefCell<Vec<String>>,
}

impl Messenger {
    fn new() -> Self {
        Messenger {
            messages: RefCell::new(Vec::new()),
        }
    }

    fn send(&self, msg: &str) {
        // Interior mutability: mutate inner RefCell while self reference is immutable
        self.messages.borrow_mut().push(msg.to_string());
    }
}

fn main() {
    let m = Messenger::new();
    m.send("Hello");
    m.send("World");
    println!("{:?}", m.messages.borrow());
}
```

> [!tip]
> `RefCell` দরকার যখন struct এর method `&self` (immutable) নেয় কিন্তু ভেতরের data modify করতে চায়। এটাকে **interior mutability pattern** বলে। Mock object, cache, আর lazy initialization এ দরকার হয়।

## `Rc<RefCell<T>>` — Combo

Shared ownership + mutability — graph structure এর জন্য:

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    let shared_list = Rc::new(RefCell::new(vec![1, 2, 3]));

    let owner1 = Rc::clone(&shared_list);
    let owner2 = Rc::clone(&shared_list);

    // Mutate through RefCell borrow_mut():
    owner1.borrow_mut().push(4);

    // Shared observers see mutated state:
    println!("{:?}", owner2.borrow());  // [1, 2, 3, 4]
}
```

> [!example]
> `Rc<RefCell<T>>` হলো Python এর mutable shared state এর equivalent। একাধিক owner, mutable — কিন্তু runtime borrow check সহ। Graph algorithm, observer pattern এ দরকার হয়।

## `Arc<T>` — Thread-Safe Rc

Multi-threaded এ `Rc` ব্যবহার করা যায় না — data race! এর বদলে `Arc` (Atomic Reference Counted):

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let handles: Vec<_> = (0..3)
        .map(|_| {
            let data = Arc::clone(&data);
            thread::spawn(move || {
                println!("{:?}", data);
            })
        })
        .collect();

    for handle in handles {
        handle.join().unwrap();
    }
}
```

> [!warn]
> **`Rc` = single-threaded, `Arc` = multi-threaded**। Thread এর সাথে `Rc` send করলে compile error! `Arc` ব্যবহার করো। `Arc` এর reference count atomic operation দিয়ে হয় — সামান্য ধীর কিন্তু thread-safe।

**`Arc` এ count কীভাবে বাড়ে-কমে?** `Rc` এর মতোই, শুধু কাজটা **atomic instruction** এ:

```text
Rc::clone:  strong += 1                    → সাধারণ add — দুই thread এ একসাথে করলে race
Arc::clone: strong.fetch_add(1)            → atomic add — race অসম্ভব
Arc drop:   যদি strong.fetch_sub(1) == 1   → শেষ owner, এখন value drop + free
```

Atomic op CPU তে "lock-prefixed" instruction — অন্য core গুলোর cache line invalidate করে, তাই সাধারণ increment এর চেয়ে কয়েক গুণ ধীর। দামটা সব জায়গায় দিতে হয় না বলেই Rust দুটো type রেখেছে: single-thread এ `Rc` (দ্রুত), thread জুড়লে `Arc`। আর "শেষ owner" check টাও atomic — দুই thread একসাথে শেষ দুই owner drop করলেও free ঠিক **একবারই** হয়, double-free অসম্ভব।

## `Mutex<T>` আর `RwLock<T>` — Thread-Safe Mutability

`Arc` শুধু shared read দেয়। Modify করতে হলে `Mutex` বা `RwLock` দরকার:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());  // 10
}
```

> [!note]
> `Arc<Mutex<T>>` হলো Rust এর standard shared mutable state pattern। Python এর `threading.Lock` এর মতো, কিন্তু Rust এ compiler নিশ্চিত করে lock acquire না করে data access করা যাবে না। Concurrency chapter এ আরো দেখবো।

> [!note]
> **`lock()` এর ভেতরে?** Linux এ futex — lock ফাঁকা থাকলে একটা atomic compare-and-swap, কয়েক ন্যানোসেকেন্ডেই ঢুকে যাওয়া; না পেলে thread টা kernel এ ঘুমিয়ে যায়, unlock হলে OS জাগিয়ে দেয়। আর `lock()` কেন `Result` দেয় জানো? **Poisoning** — lock ধরে রেখে কেউ panic করলে ভেতরের data অবিশ্বস্ত ধরা হয়, পরের সব `lock()` তখন `Err` দেয় (চাইলে `unwrap()` দিয়ে অবহেলা করা যায়)।

## Smart Pointer তুলনা

| Type | Ownership | Mutability | Thread-Safe | Use Case |
|------|-----------|------------|-------------|----------|
| `Box<T>` | Single | Compile-time | Yes | Heap alloc, trait object |
| `Rc<T>` | Shared | Compile-time | No | Graph, tree (single-thread) |
| `Arc<T>` | Shared | Compile-time | Yes | Shared data (multi-thread) |
| `RefCell<T>` | Single | Runtime | No | Interior mutability |
| `Mutex<T>` | Single | Runtime | Yes | Thread-safe mutate |
| `Arc<Mutex<T>>` | Shared | Runtime | Yes | Shared mutable state |

> [!tip]
> Decision tree:
> 1. Single owner, compile-time check → `Box<T>`
> 2. Multiple owner, single-thread → `Rc<T>`
> 3. Multiple owner, multi-thread → `Arc<T>`
> 4. Need to mutate through `&self` → `RefCell<T>` (single) / `Mutex<T>` (multi)
> 5. Shared mutable, multi-thread → `Arc<Mutex<T>>`

## Deref Trait — Auto Dereference

Smart pointer গুলো `Deref` trait implement করে যাতে transparent access পাওয়া যায়:

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let x = MyBox::new(5);
    assert_eq!(5, *x);  // Deref trait auto-dereferences custom smart pointer
}
```

> [!note]
> `Deref` trait এর কারণে `Box<String>` কে `&str` এর মতো treat করা যায় — deref coercion। এটাই Rust এর smart pointer গুলোকে seamless করে তোলে।

## Drop Trait — Custom Cleanup

Smart pointer scope ছাড়লে `Drop` trait এর `drop` method call হয়:

```rust
struct CustomPointer {
    data: String,
}

impl Drop for CustomPointer {
    fn drop(&mut self) {
        println!("Dropping: {}", self.data);
    }
}

fn main() {
    let a = CustomPointer { data: "first".into() };
    let b = CustomPointer { data: "second".into() };
    println!("End of main");
}
// Output:
// End of main
// Dropping: second  (reverse order!)
// Dropping: first

```

> [!example]
> `Drop` trait হলো C++ এর destructor বা Python এর `__del__` এর মতো। Resource cleanup এর জন্য — file close, connection close, memory free। Rust এ memory leak practically impossible কারণ `Drop` automatic।

> [!note]
> **Drop কীভাবে চলে?** Scope শেষে compiler এর বসানো "drop glue" প্রতিটা local variable এর জন্য `Drop::drop` call করে — **ঘোষণার উল্টো ক্রমে** (b আগে, a পরে — কারণ পরে ঘোষিতটা আগেরটার data borrow করতে পারে)। `Box`, `Rc`, `File`, `MutexGuard` — সবার cleanup এই একই পথে চলে। `drop(x)` function টা আসলে কোনো কাজ করে না — শুধু `x` কে ফাঁকা `_` এ move করে, move হলেই destructor সাথে সাথে চলে। উল্টোদিকে `std::mem::forget(x)` দিলে বা `Rc` cycle তৈরি হলে drop হয় না — তাই সত্যি বলতে Rust ও leak করা যায়, শুধু compiler এর নিয়মের বাইরে গেলে।

## Summary

Smart pointer গুলো ownership আর borrowing এর সীমা পূরণ করে। `Box` — heap allocation, `Rc` — shared ownership (single-thread), `Arc` — shared ownership (multi-thread), `RefCell` — interior mutability, `Mutex` — thread-safe mutation। পরের chapter এ concurrency আর threading দেখবো — যেখানে `Arc` আর `Mutex` ব্যবহার হবে।