# Async/Await

Async/await হলো Rust এর I/O-bound concurrency এর জন্য tool। Thread ব্যয়বহুল (প্রতিটা thread এর জন্য OS stack লাগে), কিন্তু async task অনেক হালকা — এক thread এ হাজারো task চলতে পারে। Python এর `asyncio`, JavaScript এর `async/await` এর মতো, কিন্তু zero-cost।

## কেন Async?

| Approach | Best For | Overhead |
|----------|----------|----------|
| **Thread** | CPU-bound work | ~2MB stack per thread |
| **Async** | I/O-bound work (network, file, DB) | ~few bytes per task |

```rust
// Thread approach — 10,000 threads = 20GB memory!
for _ in 0..10_000 {
    thread::spawn(|| { /* ... */ });
}

// Async approach — 10,000 tasks = few MB memory!
for _ in 0..10_000 {
    tokio::spawn(async { /* ... */ });
}
```

> [!note]
// Web server এ হাজারো connection handle করতে হয়। Thread দিয়ে করলে memory শেষ। Async দিয়ে এক thread এ হাজারো connection handle করা যায় — এটাই Node.js, Python asyncio এর কনসেপ্ট, Rust এ অনেক বেশি fast।

## `async fn` — Async Function

```rust
async fn fetch_data() -> String {
    // simulated async work
    String::from("data received")
}

async fn main_logic() {
    let result = fetch_data().await;
    println!("{}", result);
}
```

> [!tip]
// `async fn` return করে `Future` — এটা lazy, শুধু define করলে কিছু হবে না। `.await` call করলে execute হয়। Python এর `async def` আর `await` এর মতোই concept।

## Future Trait

`async fn` মূলত `Future` trait return করে:

```rust
trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

enum Poll<T> {
    Ready(T),
    Pending,
}
```

> [!note]
// Future হলো state machine — poll হয়, যদি ready হয় value দেয়, নাহলে Pending return করে। কিন্তু তোমাকে কখনো manually poll করতে হবে না — runtime (tokio) সব handle করে। এটা Python এর coroutine এর মতো, কিন্তু zero-cost (stack-less coroutine)।

## Tokio — Async Runtime

Rust এর language এ async syntax আছে, কিন্তু runtime আলাদা। সবচেয়ে জনপ্রিয় runtime হলো **tokio**:

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
#[tokio::main]
async fn main() {
    println!("Hello from async!");

    let result = async_operation().await;
    println!("{}", result);
}

async fn async_operation() -> String {
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    "Done!".to_string()
}
```

> [!warn]
// `#[tokio::main]` macro ছাড়া `async fn main()` কাজ করবে না! কারণ `main` function synchronous হতে হবে — `#[tokio::main]` এটাকে wrap করে runtime start করে।

## Concurrent Tasks

```rust
use tokio::time::{sleep, Duration};

async fn fetch_user(id: u32) -> String {
    sleep(Duration::from_millis(100)).await;
    format!("User {}", id)
}

async fn fetch_posts(uid: u32) -> Vec<String> {
    sleep(Duration::from_millis(150)).await;
    vec![format!("Post 1 by {}", uid), format!("Post 2 by {}", uid)]
}

#[tokio::main]
async fn main() {
    // Sequential — 100ms + 150ms = 250ms
    let user = fetch_user(1).await;
    let posts = fetch_posts(1).await;
    println!("Sequential: {:?}", posts);

    // Concurrent — max(100ms, 150ms) = 150ms
    let (user, posts) = tokio::join!(fetch_user(1), fetch_posts(1));
    println!("Concurrent: {} {:?}", user, posts);
}
```

> [!example]
// `tokio::join!` দিয়ে একাধিক future একসাথে (concurrent) await করা যায়। Sequential এর চেয়ে অনেক fast — কারণ overlap হয়। Python এ `asyncio.gather()` এর মতো।

## Spawn — Background Task

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    // Background task — await না করেই চলতে থাকে
    let handle = tokio::spawn(async {
        sleep(Duration::from_secs(2)).await;
        println!("Background task done!");
        42
    });

    println!("Main continues...");

    // পরে result collect করা যায়
    let result = handle.await.unwrap();
    println!("Background returned: {}", result);
}
```

> [!note]
// `tokio::spawn` হলো `thread::spawn` এর async version। Task background এ চলে, `await` দিয়ে result collect করা যায়। কিন্তু এটা thread নয় — lightweight task!

## Select — Race Condition (Good Kind)

একাধিক future থেকে যেটা আগে শেষ হয়:

```rust
use tokio::select;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let result = select! {
        _ = sleep(Duration::from_millis(100)) => "Timeout 1 won",
        _ = sleep(Duration::from_millis(50)) => "Timeout 2 won",
    };

    println!("{}", result);  // Timeout 2 won (faster)
}
```

### Real-World Select — Timeout

```rust
use tokio::select;
use tokio::time::{sleep, timeout, Duration};

async fn slow_api() -> String {
    sleep(Duration::from_secs(5)).await;
    "Data".to_string()
}

#[tokio::main]
async fn main() {
    // 2 second timeout
    match timeout(Duration::from_secs(2), slow_api()).await {
        Ok(result) => println!("Got: {}", result),
        Err(_) => println!("Timeout! API too slow"),
    }
}
```

> [!tip]
// `timeout` function দিয়ে যেকোনো async operation এ timeout বসানো যায়। Network call এর জন্য essential — নাহলে forever hang করতে পারে।

## Channels — Async Communication

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(100);

    // Producer
    tokio::spawn(async move {
        for i in 0..5 {
            tx.send(i).await.unwrap();
            println!("Sent: {}", i);
        }
    });

    // Consumer
    while let Some(msg) = rx.recv().await {
        println!("Received: {}", msg);
    }
}
```

> [!note]
// `tokio::sync::mpsc` হলো `std::sync::mpsc` এর async version। `.send().await` আর `.recv().await` — non-blocking। Channel full হলে producer wait করে, empty হলে consumer wait করে।

## Async HTTP Request

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
reqwest = "0.12"
```

```rust
use reqwest;
use tokio;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Single request
    let body = reqwest::get("https://httpbin.org/get")
        .await?
        .text()
        .await?;
    println!("Response: {}", &body[..100]);

    // Concurrent requests
    let urls = vec![
        "https://httpbin.org/get",
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/2",
    ];

    let futures: Vec<_> = urls.iter()
        .map(|url| reqwest::get(*url))
        .collect();

    let results = futures::future::join_all(futures).await;

    Ok(())
}
```

> [!example]
// `reqwest` হলো Rust এর HTTP client — Python এর `requests`/`httpx` এর মতো। Async support সহ। একাধিক request concurrent করা যায় — sequential এর চেয়ে অনেক fast।

## Async File I/O

```rust
use tokio::fs;
use tokio::io::AsyncReadExt;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let mut file = fs::File::open("input.txt").await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    println!("Read {} bytes", contents.len());

    fs::write("output.txt", &contents).await?;
    println!("Written!");
    Ok(())
}
```

## `Pin` — Why?

`Pin` হলো Rust এর একটা advanced type যা async self-referential struct safe রাখে:

```rust
use std::pin::Pin;
use std::future::Future;

// সাধারণত তোমাকে Pin নিয়ে ভাবতে হবে না
// শুধু জেনে রাখো — Future pinned হয়ে যায় memory তে
// যাতে self-referencing safe থাকে
```

> [!danger]
// `Pin` সম্পর্কে শুধু এটুকু জেনে রাখো — এটা internal implementation detail। বেশিরভাগ ক্ষেত্রে তোমাকে manually `Pin` নিয়ে কাজ করতে হবে না। `async/await` আর `Box::pin` সব handle করে। শুধু যদি নিজের Future implement করো, তখন দরকার হবে।

## Python vs Rust — Async তুলনা

```python
# Python — asyncio
import asyncio

async def fetch_data():
    await asyncio.sleep(1)
    return "data"

async def main():
    result = await fetch_data()
    print(result)

asyncio.run(main())
```

```rust
// Rust — tokio
async fn fetch_data() -> String {
    tokio::time::sleep(Duration::from_secs(1)).await;
    "data".to_string()
}

#[tokio::main]
async fn main() {
    let result = fetch_data().await;
    println!("{}", result);
}
```

> [!note]
// Syntax প্রায় একই — `async def` → `async fn`, `await` → `.await`। কিন্তু performance difference বিশাল! Python এর asyncio single-threaded, GIL limited। Rust এর tokio multi-threaded, work-stealing, zero-cost। 10x-100x faster।

## কখন Thread, কখন Async?

| Scenario | Use |
|----------|-----|
| CPU-heavy computation | Thread (rayon) |
| Network I/O (HTTP, DB) | Async (tokio) |
| File I/O | Async বা thread |
| Mixed | Async + `spawn_blocking` for CPU |

> [!tip]
// সহজ নিয়ম — I/O bound হলে async, CPU bound হলে thread। দুটোই দরকার হলে async runtime এর ভেতর `tokio::task::spawn_blocking()` দিয়ে CPU work thread এ পাঠাও।

## Summary

Async/await হলো I/O-bound concurrency এর জন্য। `tokio` হলো standard runtime। `async fn` দিয়ে async function, `.await` দিয়ে wait, `tokio::spawn` দিয়ে background task, `tokio::join!` দিয়ে concurrent wait, `select!` দিয়ে race। Python এর asyncio এর মতো concept, কিন্তু multi-threaded আর zero-cost। পরের chapter এ testing শিখবো।