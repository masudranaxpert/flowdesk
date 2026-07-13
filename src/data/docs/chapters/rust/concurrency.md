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
// উপরের কোডে thread শেষ হওয়ার আগেই main শেষ হয়ে যেতে পারে! Thread এর শেষ হওয়ার guarantee দরকার হলে `.join()` করতে হবে।

### join — Thread Wait

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        println!("Working in thread...");
        42  // return value
    });

    // Main thread wait করবে যতক্ষণ না spawn thread শেষ হয়
    let result = handle.join().unwrap();
    println!("Thread returned: {}", result);
}
```

## move Closure — Thread এ Ownership

Thread এর সাথে data pass করতে `move` closure দরকার:

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3, 4, 5];

    let handle = thread::spawn(move || {
        println!("Thread got: {:?}", data);  // data এর ownership thread এ
    });

    // println!("{:?}", data);  // ERROR! data move হয়েছে

    handle.join().unwrap();
}
```

> [!tip]
// `move` keyword না দিলে compiler error দেবে — "closure may outlive the current function"। Thread এর lifetime নিশ্চিত না তাই ownership move করাই safe। এটাই Rust এর concurrency safety।

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
// `mpsc` = Multiple Producer, Single Consumer। একাধিক thread send করতে পারে, একজন receive করে। এটা Go এর channel বা Python এর `queue.Queue` এর মতো — কিন্তু type-safe।

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
// `Arc<Mutex<T>>` হলো Rust এর standard shared mutable state pattern।
// - `Arc` — multiple thread এ share করার জন্য (thread-safe reference counting)
// - `Mutex` — এক সময়ে এক thread access করার জন্য (mutual exclusion)
// - `.lock()` — lock acquire করে, `MutexGuard` return করে
// - Guard drop হলে lock automatically release হয় (RAII)

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
// Read-heavy workload এ `RwLock` better। Write-heavy এ `Mutex` simpler আর সামান্য fast।

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
// `Rc` কখনো thread এর মধ্যে share করা যায় না — এটা `Send` বা `Sync` না। কারণ `Rc` এর reference count atomic নয় — data race হতে পারে। Multi-threaded এর জন্য অবশ্যই `Arc` ব্যবহার করো। Compiler এটা enforce করে!

## বাস্তব উদাহরণ — Parallel Sum

```rust
use std::thread;

fn parallel_sum(data: &[i32], chunks: usize) -> i32 {
    let chunk_size = (data.len() + chunks - 1) / chunks;
    let mut handles = vec![];

    for chunk in data.chunks(chunk_size) {
        let chunk = chunk.to_vec();
        handles.push(thread::spawn(move || {
            chunk.iter().sum::<i32>()
        }));
    }

    handles.into_iter()
        .map(|h| h.join().unwrap())
        .sum()
}

fn main() {
    let data: Vec<i32> = (1..=1_000_000).collect();
    let result = parallel_sum(&data, 4);
    println!("Sum: {}", result);  // 1784293664 (or whatever the sum is)
}
```

> [!example]
// এখানে data কে ৪ ভাগে ভাগ করে ৪ thread এ আলাদা ভাবে sum করা হচ্ছে। শেষে সব partial sum যোগ করা হচ্ছে। এটা data parallelism — Rust এ এটা safe আর fast। Python এ এটা GIL এর কারণে impossible।

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
// Rust এর concurrency model এর সবচেয়ে বড় সুবিধা — **fearless concurrency**। Python/C++ এ concurrent code লিখতে ভয় লাগে — data race, deadlock, race condition। Rust এ compiler তোমাকে protect করে। Data race compile error — এটাই Rust এর সবচেয়ে বড় innovation।

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
    let sum: i32 = data.iter().sum();

    // Parallel — শুধু par_iter()!
    let parallel_sum: i32 = data.par_iter().sum();

    // Parallel map
    let doubled: Vec<i32> = data.par_iter().map(|x| x * 2).collect();

    // Parallel filter
    let evens: Vec<&i32> = data.par_iter().filter(|x| *x % 2 == 0).collect();

    println!("Sum: {}, Parallel: {}", sum, parallel_sum);
}
```

> [!tip]
// `rayon` দিয়ে sequential iterator থেকে parallel iterator বানাতে শুধু `iter()` কে `par_iter()` তে বদলাও! Thread pool, work stealing, load balancing — সব automatic। Python এর `multiprocessing.Pool` এর মতো, কিন্তু অনেক বেশি ergonomic আর fast।

## Summary

Rust এর concurrency = fearless। `thread::spawn` দিয়ে thread বানাও, `Arc<Mutex<T>>` দিয়ে shared state manage করো, channel দিয়ে message passing করো। `Send`/`Sync` trait দিয়ে compiler data race prevent করে। `rayon` দিয়ে data parallelism এক লাইনে। পরের chapter এ async/await দেখবো — I/O-bound concurrency এর জন্য।