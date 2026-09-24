# Concurrency ও Threads

Rust এর concurrency হলো তার সবচেয়ে বড় selling point একটা। Python এ GIL (Global Interpreter Lock) এর কারণে true multi-threading impossible। C++ এ data race হয়ে যায় silently। Rust এ **compile time এ data race impossible** — এটাই Rust এর ইউনিক power।

## Thread তৈরি

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..10 {
            println!("Thread: {}", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("Main: {}", i);
        thread::sleep(Duration::from_millis(1));
    }
}
```

> [!warn]
> উপরের কোডে thread শেষ হওয়ার আগেই main শেষ হয়ে যেতে পারে! Thread এর শেষ হওয়ার guarantee দরকার হলে `.join()` করতে হবে।

> [!note]
> **`thread::spawn` এর ভেতরে কী হয়?** এটা শেষ পর্যন্ত OS কে call করে (Linux এ `pthread_create`) — একটা আসল kernel thread তৈরি হয়। প্রতিটা নতুন thread এর default stack **~2 MiB** (main thread টা OS দেয়, সাধারণত 8 MiB) — তাই 10,000 thread মানে ~20 GB address space। `spawn` সাথে সাথে `JoinHandle` return করে, thread টা parallel এ চলতে থাকে। Signature খেয়াল করো: closure এর bound `F: FnOnce() -> T + Send + 'static` — thread টা main এর বাঁচা ছাড়িয়ে যেতে পারে, তাই borrowed data নিষেধ, ownership (`move`) নেওয়াই পথ। আর `thread::sleep` ভেতরে `clock_nanosleep` syscall দেয় — thread OS এ park হয়ে যায়, CPU পোড়ায় না।

### join — Thread Wait

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        println!("Working in thread...");
        42  // return value
    });

    // Block main thread until spawned thread finishes
    let result = handle.join().unwrap();
    println!("Thread returned: {}", result);
}
```

> [!note]
> **`join` এর ভেতরে কী হয়?** `JoinHandle::join` calling thread কে **block** করে রাখে — ভেতরে OS-level wait (Linux এ futex, মোটামুটি `pthread_join` এর মতো effect)। spawn করা thread শেষ হলে এর return value টা দুই thread এর মাঝের একটা shared slot এ বসে, `join` সেটা তুলে দেয়। Return type `std::thread::Result<T>` — thread এ panic হলে `Err` পাবে (panic thread boundary cross করে ধরা পড়ে), এজন্যই `.unwrap()`। Handle টা drop করে দিলে join হবে না — thread টা "detached" হয়ে background এ চলতে থাকে।

## move Closure — Thread এ Ownership

Thread এর সাথে data pass করতে `move` closure দরকার:

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3, 4, 5];

    let handle = thread::spawn(move || {
        println!("Thread got: {:?}", data); // Ownership of data moved into thread closure
    });

    // println!("{:?}", data); // Error: value borrowed here after move

    handle.join().unwrap();
}
```

> [!tip]
> `move` keyword না দিলে compiler error দেবে — "closure may outlive the current function"। Thread এর lifetime নিশ্চিত না তাই ownership move করাই safe। এটাই Rust এর concurrency safety।

> [!note]
> **ভেতরে কী ঘটে?** Closure এর ধরা variable গুলো একটা compiler-generated struct এ **ownership সহ** ঢোকে (এখানে `Vec` এর pointer+len+capacity টা move হয় — element গুলো copy হয় না)। এই struct টাই `spawn` এ heap এ box করে নতুন thread এর কাছে যায়। Borrow পথটা বন্ধ রাখা হয় `'static` bound এর জন্য — compiler জানে না caller এর stack frame thread এর চেয়ে বাঁচবে কিনা।

## Message Passing — Channel

Rust এর প্রিয় concurrency model হলো **message passing** — "Do not communicate by sharing memory; instead, share memory by communicating":

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let messages = vec!["hello", "from", "thread"];
        for msg in messages {
            tx.send(msg).unwrap();
        }
    });

    for received in rx {
        println!("Got: {}", received);
    }
}
```

> [!example]
> `mpsc` = Multiple Producer, Single Consumer। একাধিক thread send করতে পারে, একজন receive করে। এটা Go এর channel বা Python এর `queue.Queue` এর মতো — কিন্তু type-safe।

`mpsc::channel` এর ভেতরে একটা **queue** আছে (std implementation: linked-list of blocks, প্রতি block এ কয়েকটা message slot), আর দুই পাশ একটা shared structure `Arc` দিয়ে ধরে রাখে। মোটামুটি এমন (simplified):

```rust
// simplified
pub fn channel<T>() -> (Sender<T>, Receiver<T>) {
    let inner = Arc::new(Inner {
        queue: Queue::new(),  // Channel message queue buffer
        // Thread synchronization primitives for receiver notification
    });
    (Sender { inner: inner.clone() }, Receiver { inner })
}
```

- `tx.send(msg)` — queue এ push + ঘুমন্ত receiver থাকলে wake (thread unpark)। `channel()` unbounded, তাই send **blocking না**, প্রায় O(1)।
- `tx.clone()` — শুধু refcount বাড়ে (atomic), queue একই থাকে — তাই multiple producer সম্ভব।
- `for received in rx` — `Receiver` এর `Iterator` impl: queue খালি হলে block, সব Sender drop হয়ে গেলে `None` return → loop শেষ।
- `Receiver` clone করা যায় না — consumer একজনই (নামের শেষ `c`)।

### Multiple Producer

```rust
use std::sync::mpsc;
use std::thread;
use std::sync::Arc;

fn main() {
    let (tx, rx) = mpsc::channel();
    let tx2 = tx.clone();

    thread::spawn(move || {
        tx.send("From thread 1").unwrap();
    });

    thread::spawn(move || {
        tx2.send("From thread 2").unwrap();
    });

    for received in rx {
        println!("{}", received);
    }
}
```

## Shared State — Mutex

যখন shared mutable data দরকার:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final: {}", *counter.lock().unwrap());  // 10
}
```

> [!note]
> `Arc<Mutex<T>>` হলো Rust এর standard shared mutable state pattern।
> - `Arc` — multiple thread এ share করার জন্য (thread-safe reference counting)
> - `Mutex` — এক সময়ে এক thread access করার জন্য (mutual exclusion)
> - `.lock()` — lock acquire করে, `MutexGuard` return করে
> - Guard drop হলে lock automatically release হয় (RAII)

> [!note]
> **`Mutex::lock` এর ভেতরে কী হয়?** দুই ধাপ:
> ১. **Fast path** — lock এর state একটা atomic variable; খালি থাকলে এক atomic exchange দিয়েই দখল হয়ে যায়, কোনো syscall নেই।
> ২. **Slow path** — ব্যস্ত থাকলে কিছুক্ষণ spin করে, তারপর thread টা OS এর কাছে ঘুমিয়ে দেয় (Linux এ **futex**, অন্য OS এ সমতুল্য primitive) — অপেক্ষায় CPU খরচ শূন্য। Guard drop হলে unlock + একজন waiter কে wake।
>
> `lock()` যে `Result` দেয় তার কারণ **poison mechanism**: lock ধরে থাকা অবস্থায় thread panic করলে mutex poisoned হয়, পরের সব `lock()` `Err(PoisonError)` দেয় — shared data সম্ভবত অসঙ্গত হয়ে গেছে, তাই চুপচাপ চলতে দেওয়া হয় না। জোর করে মান নিতে চাইলে `e.into_inner()`। আর `Arc<Mutex<T>>` জোড়া কেন? `Mutex` নিজে কাউকে share করতে পারে না; `Arc` এর atomic refcount (clone এ `fetch_add`, drop এ `fetch_sub`, শূন্য হলে free — lock-free) একই Mutex এর মালিকানা অনেক thread কে একসাথে দেয়। `Rc` এখানে non-atomic count নিয়ে data race করত, তাই compile error।

### RwLock — Multiple Reader, One Writer

যখন read অনেক বেশি হয় write এর চেয়ে:

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));

    // Multiple reader
    let r1 = Arc::clone(&data);
    let h1 = thread::spawn(move || {
        let read = r1.read().unwrap();
        println!("Reader 1: {:?}", *read);
    });

    let r2 = Arc::clone(&data);
    let h2 = thread::spawn(move || {
        let read = r2.read().unwrap();
        println!("Reader 2: {:?}", *read);
    });

    h1.join().unwrap();
    h2.join().unwrap();

    // One writer
    let w = Arc::clone(&data);
    thread::spawn(move || {
        let mut write = w.write().unwrap();
        write.push(4);
    }).join().unwrap();

    println!("Final: {:?}", *data.read().unwrap());
}
```

| Type | Multiple Read | Multiple Write | Read + Write |
|------|:---:|:---:|:---:|
| `Mutex` | No | No | No |
| `RwLock` | Yes | No | No |

> [!tip]
> Read-heavy workload এ `RwLock` better। Write-heavy এ `Mutex` simpler আর সামান্য fast।

> [!note]
> **`RwLock` এর ভেতরে** একটা shared state + waiter queue আছে (Mutex এর মতোই futex-based)। `read()` এ একাধিক reader একসাথে state hold করতে পারে; `write()` চাইলে state টা পুরো exclusive হতে হয়। Writer অপেক্ষা করছে এমন অবস্থায় নতুন reader গুলোও queue তে দাঁড়ায় — writer starvation এড়াতে। তবে প্রতি read/write এ atomic bookkeeping আছে, তাই খুব ছোট data তে `Mutex` প্রায়ই সস্তা পড়ে।

## Send আর Sync — Thread Safety Trait

Rust এর concurrency safety এর মূলে দুটো trait:

### `Send` — Thread এর মধ্যে Transfer

`Send` trait থাকলে type টা এক thread থেকে আরেক thread এ ownership transfer করা যায়:

```rust
// Vec<i32> — Send (safe to transfer)
let v = vec![1, 2, 3];
thread::spawn(move || {
    println!("{:?}", v);  // OK
}).join();

// Rc<T> — NOT Send!
let rc = std::rc::Rc::new(5);
// thread::spawn(move || {  // ERROR! Rc is not Send
//     println!("{}", rc);
// });
```

### `Sync` — Multiple Thread এ Share

`Sync` trait থাকলে `&T` multiple thread এ share করা যায়:

```rust
// Arc<T> — Sync (if T: Send + Sync)
// Mutex<T> — Sync (if T: Send)
// Rc<T> — NOT Sync!
```

> [!danger]
> `Rc` কখনো thread এর মধ্যে share করা যায় না — এটা `Send` বা `Sync` না। কারণ `Rc` এর reference count atomic নয় — data race হতে পারে। Multi-threaded এর জন্য অবশ্যই `Arc` ব্যবহার করো। Compiler এটা enforce করে!

> [!note]
> **`Send`/`Sync` ভেতরে কী আছে?** কিছুই না — দুটো **marker trait**, কোনো method নেই, শুধু একটা compile-time সত্য। Compiler এগুলো **auto trait** হিসেবে গাছের মতো বানায়: struct এর সব field `Send` হলে struct ও `Send`; `Sync` মানে সংক্ষেপে `&T: Send` (reference টা অন্য thread এ যেতে পারে)। `Rc` এর count non-atomic বলে std তে সেটা ইচ্ছা করে `!Send + !Sync` রাখা। `thread::spawn` এর `Send + 'static` bound এর সাথে মিলে এই type system ই data race কে compile error বানায়।

## বাস্তব উদাহরণ — Parallel Sum

```rust
use std::thread;

fn parallel_sum(data: &[i32], chunks: usize) -> i64 {
    let chunk_size = (data.len() + chunks - 1) / chunks;
    let mut handles = vec![];

    for chunk in data.chunks(chunk_size) {
        let chunk = chunk.to_vec();
        handles.push(thread::spawn(move || {
            chunk.iter().map(|&x| x as i64).sum::<i64>()
        }));
    }

    handles.into_iter()
        .map(|h| h.join().unwrap())
        .sum()
}

fn main() {
    let data: Vec<i32> = (1..=1_000_000).collect();
    let result = parallel_sum(&data, 4);
    println!("Sum: {}", result);  // 500000500000
}

// Accumulator uses i64 to prevent integer overflow
// Exceeds i32::MAX (2.14B); i32 would panic on debug overflow
// Safe 64-bit summation:

```

> [!example]
> এখানে data কে ৪ ভাগে ভাগ করে ৪ thread এ আলাদা ভাবে sum করা হচ্ছে। শেষে সব partial sum যোগ করা হচ্ছে। এটা data parallelism — Rust এ এটা safe আর fast। Python এ এটা GIL এর কারণে impossible।

## তুলনা — Concurrency

| Feature | Python | C++ | Rust |
|---------|--------|-----|------|
| GIL | আছে (thread limited) | নেই | নেই |
| Thread | `threading.Thread` | `std::thread` | `thread::spawn` |
| Lock | `threading.Lock` | `std::mutex` | `std::sync::Mutex` |
| Channel | `queue.Queue` | — | `mpsc::channel` |
| Data race | Possible (rare w/ GIL) | Possible (UB!) | **Impossible!** |
| Compile check | None | None | **Send/Sync trait** |

> [!note]
> Rust এর concurrency model এর সবচেয়ে বড় সুবিধা — **fearless concurrency**। Python/C++ এ concurrent code লিখতে ভয় লাগে — data race, deadlock, race condition। Rust এ compiler তোমাকে protect করে। Data race compile error — এটাই Rust এর সবচেয়ে বড় innovation।

## Rayon — Data Parallelism

বাস্তব প্রজেক্টে thread manually manage না করে `rayon` crate ব্যবহার করো:

```toml
[dependencies]
rayon = "1"
```

```rust
use rayon::prelude::*;

fn main() {
    let data: Vec<i32> = (1..=1_000_000).collect();

    // Sequential
    let sum: i64 = data.iter().map(|&x| x as i64).sum();

    // Data parallelism via Rayon parallel iterator:
    let parallel_sum: i64 = data.par_iter().map(|&x| x as i64).sum();

    // Parallel map
    let doubled: Vec<i32> = data.par_iter().map(|x| x * 2).collect();

    // Parallel filter
    let evens: Vec<&i32> = data.par_iter().filter(|x| *x % 2 == 0).collect();

    println!("Sum: {}, Parallel: {}", sum, parallel_sum);
}
```

> [!tip]
> `rayon` দিয়ে sequential iterator থেকে parallel iterator বানাতে শুধু `iter()` কে `par_iter()` তে বদলাও! Thread pool, work stealing, load balancing — সব automatic। Python এর `multiprocessing.Pool` এর মতো, কিন্তু অনেক বেশি ergonomic আর fast।

> [!note]
> **`par_iter()` এর ভেতরে কী হয়?** Rayon একটা **global thread pool** রাখে (worker = logical core সংখ্যা)। Data range টা divide-and-conquer ভাবে **recursively split** হয় (fork-join), worker দের নিজের deque তে কাজ বসে, কেউ idle হলে অন্যের queue থেকে **steal** করে। শেষে partial result গুলো জোড়া মেলে। একটা সূক্ষ্ম বিষয়: float sum এর মতো order-dependent operation এ sequential আর parallel ফল সামান্য আলাদা হতে পারে — integer এ পার্থক্য নেই।

## Summary

Rust এর concurrency = fearless। `thread::spawn` দিয়ে thread বানাও, `Arc<Mutex<T>>` দিয়ে shared state manage করো, channel দিয়ে message passing করো। `Send`/`Sync` trait দিয়ে compiler data race prevent করে। `rayon` দিয়ে data parallelism এক লাইনে। পরের chapter এ async/await দেখবো — I/O-bound concurrency এর জন্য।