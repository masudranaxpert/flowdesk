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
// x drop হলে heap memory automatically free
```

> [!note]
// `Box::new(5)` এ `5` কে heap এ allocate করে, `x` হলো stack এর pointer। Scope শেষে `Box` drop হয়, heap memory free হয়। C/C++ এর `new`/`delete` এর মতো, কিন্তু automatic cleanup সহ।

### কেন Box দরকার?

১. **Large data** — stack overflow এড়াতে:

```rust
// Stack এ ১ মিলিয়ন i32 — খারাপ!
let big_array = [0i32; 1_000_000];  // stack overflow risk

// Heap এ — ভালো
let big_array = Box::new([0i32; 1_000_000]);
```

২. **Recursive type** — size compile time এ জানা না থাকলে:

```rust
// Cons List — Lisp এর list
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
// `Box` ছাড়া এটা compile হবে না! কারণ `Cons(i32, List)` infinite size চায় — compiler বলবে "recursive type has infinite size"। `Box<List>` দিলে শুধু pointer size (8 bytes) store হয় — finite।

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
// যখন একই collection এ একাধিক type store করতে হবে, `Box<dyn Trait>` ব্যবহার করো। এটাই trait object — C++ এর `unique_ptr<Animal>` এর মতো।

### Deref — Transparent Access

`Box` এর ভেতরের value তে access `*` ছাড়াই করা যায় (deref coercion):

```rust
let x = Box::new(5);
// তিনটেই কাজ করে
println!("{}", *x);   // explicit deref
println!("{}", x);    // auto deref (Display)
let y = x + 1;        // auto deref for operators
```

## `Rc<T>` — Shared Ownership

যখন একই data এর একাধিক owner দরকার:

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(String::from("shared"));

    let r1 = Rc::clone(&data);  // reference count বাড়ে
    let r2 = Rc::clone(&data);

    println!("Count: {}", Rc::strong_count(&data));  // 3
    println!("{} {} {}", data, r1, r2);

    // r1 drop হলে count ২, কিন্তু data এখনো alive
    drop(r1);
    println!("Count: {}", Rc::strong_count(&data));  // 2
}
// শেষ reference drop হলে data free হয়
```

> [!note]
// `Rc` (Reference Counted) হলো Python এর garbage collector এর ছোট ভাই। Reference count track করে — শেষ reference drop হলে data free হয়। কিন্তু **single-threaded only**! Multi-threaded এর জন্য `Arc` দরকার।

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
        children: vec![Rc::clone(&leaf)],  // leaf এর দুটো owner!
    });

    println!("Leaf ref count: {}", Rc::strong_count(&leaf));  // 3
}
```

> [!example]
// Tree বা graph structure এ একই node কে একাধিক parent থেকে point করতে হলে `Rc` দরকার। Ownership rule (একজন owner) এর বিপরীতে `Rc` একাধিক owner allow করে।

### `Rc::clone` vs `clone`

```rust
let s = Rc::new(String::from("hello"));

// Rc::clone — cheap! শুধু reference count বাড়ায়
let s2 = Rc::clone(&s);

// (*s).clone() — expensive! String data copy করে
let s3 = (*s).clone();
```

> [!warn]
// `Rc::clone(&s)` আর `s.clone()` আলাদা! `Rc::clone` reference count বাড়ায় (cheap), `s.clone()` data copy করে (expensive)। Clippy তোমাকে সাহায্য করবে ভুল ধরতে।

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
// `RefCell` borrowing rule runtime এ check করে! যদি একই সময়ে দুটো mutable borrow নাও, **runtime panic** হবে। Compiler compile time এ ধরবে না। সাবধান!

```rust
let data = RefCell::new(5);
let b1 = data.borrow_mut();
let b2 = data.borrow_mut();  // PANIC! Already borrowed
```

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
        // &self immutable, কিন্তু messages modify করছি!
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
// `RefCell` দরকার যখন struct এর method `&self` (immutable) নেয় কিন্তু ভেতরের data modify করতে চায়। এটাকে **interior mutability pattern** বলে। Mock object, cache, আর lazy initialization এ দরকার হয়।

## `Rc<RefCell<T>>` — Combo

Shared ownership + mutability — graph structure এর জন্য:

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    let shared_list = Rc::new(RefCell::new(vec![1, 2, 3]));

    let owner1 = Rc::clone(&shared_list);
    let owner2 = Rc::clone(&shared_list);

    // owner1 modify করছে
    owner1.borrow_mut().push(4);

    // owner2 দেখছে — পরিবর্তন দেখা যাবে!
    println!("{:?}", owner2.borrow());  // [1, 2, 3, 4]
}
```

> [!example]
// `Rc<RefCell<T>>` হলো Python এর mutable shared state এর equivalent। একাধিক owner, mutable — কিন্তু runtime borrow check সহ। Graph algorithm, observer pattern এ দরকার হয়।

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
// **`Rc` = single-threaded, `Arc` = multi-threaded**। Thread এর সাথে `Rc` send করলে compile error! `Arc` ব্যবহার করো। `Arc` এর reference count atomic operation দিয়ে হয় — সামান্য ধীর কিন্তু thread-safe।

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
// `Arc<Mutex<T>>` হলো Rust এর standard shared mutable state pattern। Python এর `threading.Lock` এর মতো, কিন্তু Rust এ compiler নিশ্চিত করে lock acquire না করে data access করা যাবে না। Concurrency chapter এ আরো দেখবো।

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
// Decision tree:
// 1. Single owner, compile-time check → `Box<T>`
// 2. Multiple owner, single-thread → `Rc<T>`
// 3. Multiple owner, multi-thread → `Arc<T>`
// 4. Need to mutate through `&self` → `RefCell<T>` (single) / `Mutex<T>` (multi)
// 5. Shared mutable, multi-thread → `Arc<Mutex<T>>`

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
    assert_eq!(5, *x);  // Deref এর কারণে কাজ করে
}
```

> [!note]
// `Deref` trait এর কারণে `Box<String>` কে `&str` এর মতো treat করা যায় — deref coercion। এটাই Rust এর smart pointer গুলোকে seamless করে তোলে।

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
}
```

> [!example]
// `Drop` trait হলো C++ এর destructor বা Python এর `__del__` এর মতো। Resource cleanup এর জন্য — file close, connection close, memory free। Rust এ memory leak practically impossible কারণ `Drop` automatic।

## Summary

Smart pointer গুলো ownership আর borrowing এর সীমা পূরণ করে। `Box` — heap allocation, `Rc` — shared ownership (single-thread), `Arc` — shared ownership (multi-thread), `RefCell` — interior mutability, `Mutex` — thread-safe mutation। পরের chapter এ concurrency আর threading দেখবো — যেখানে `Arc` আর `Mutex` ব্যবহার হবে।