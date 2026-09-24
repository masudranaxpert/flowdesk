# Async/Await

Async/await হলো Rust এর I/O-bound concurrency এর জন্য tool। Thread ব্যয়বহুল (প্রতিটা thread এর জন্য OS stack লাগে), কিন্তু async task অনেক হালকা — এক thread এ হাজারো task চলতে পারে। Python এর `asyncio`, JavaScript এর `async/await` এর মতো, কিন্তু zero-cost।

## কেন Async?

| Approach | Best For | Overhead |
|----------|----------|----------|
| **Thread** | CPU-bound work | ~2MB stack per thread |
| **Async** | I/O-bound work (network, file, DB) | ~কয়েকশো byte per task |

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
> // Web server এ হাজারো connection handle করতে হয়। Thread দিয়ে করলে memory শেষ। Async দিয়ে এক thread এ হাজারো connection handle করা যায় — এটাই Node.js, Python asyncio এর কনসেপ্ট, Rust এ অনেক বেশি fast।

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
> // `async fn` return করে `Future` — এটা lazy, শুধু define করলে কিছু হবে না। `.await` call করলে execute হয়। Python এর `async def` আর `await` এর মতোই concept।

`async fn` কম্পাইল হলে ভেতরে আসলে কী হয়? Compiler পুরো body কে একটা **state machine** (enum) বানিয়ে দেয়। প্রতিটা `.await` একটা suspend point — সেখানে execution থামে, আর পরে চালিয়ে যেতে যা যা দরকার তা enum এর variant এ জমা থাকে। মোটামুটি এমন (simplified):

```rust
// async fn fetch_data() -> String — compiler এর চোখে (simplified)
enum FetchData {
    Start,                  // এখনো একবারও poll হয়নি
    Waiting(InnerFuture),   // প্রথম .await এ আটকে আছে
}

impl Future for FetchData {
    type Output = String;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<String> {
        match self {
            // Start: ভেতরের কাজ চালু করো; প্রস্তুত না হলে waker রেজিস্টার করে Pending
            // Waiting: ভেতরের future কে poll করো; Ready হলে পরের state এ
        }
    }
}
```

তাই `fetch_data()` call করা মানে শুধু ওই enum টা value হিসেবে পাওয়া — **কোনো কাজ এখনো শুরু হয়নি**, এজন্যই future lazy। ভালো দিক: future এর size = সবচেয়ে বড় variant এর সমান — একটা সাধারণ struct এর মতোই জানা যায়, heap allocation লাগে না (`spawn`/`Box::pin` করলে তবেই heap এ যায়)।

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
> // Future হলো state machine — poll হয়, যদি ready হয় value দেয়, নাহলে Pending return করে। কিন্তু তোমাকে কখনো manually poll করতে হবে না — runtime (tokio) সব handle করে। এটা Python এর coroutine এর মতো, কিন্তু zero-cost (stack-less coroutine)।

> [!note]
> **`poll` + `Waker` কীভাবে চলে?** Executor বারবার `poll(cx)` call করে। `Poll::Ready(value)` এলে কাজ শেষ। `Pending` return করার আগে future টা নিজের জাগানোর টিকিট রেজিস্টার করে — `cx.waker()` এর clone; `Waker` আসলে একটা ছোট callback object (vtable ভিত্তিক)। যেমন socket এ data না এলে future টা ওই `Waker` I/O driver (epoll) এর কাছে রেখে দেয়; data এলে driver `waker.wake()` করে — task টা আবার executor এর run queue তে ঢুকে যায়, পরে আবার poll হয়। মানে Pending অবস্থায় task কোনো CPU খায় না — busy-waiting কিছুই নেই।

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
> // `#[tokio::main]` macro ছাড়া `async fn main()` কাজ করবে না! কারণ `main` function synchronous হতে হবে — `#[tokio::main]` এটাকে wrap করে runtime start করে।

`#[tokio::main]` আসলে কী লেখে? এটা attribute macro — compile time এ তোমার `async fn main` কে মুড়িয়ে দেয় (simplified):

```rust
// #[tokio::main] এর expansion (simplified)
fn main() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            // তোমার async main এর পুরো body
        });
}
```

Runtime worker thread pool বানায় (thread = logical core সংখ্যা)। প্রতিটা worker এর নিজের run queue আছে + একটা global queue; idle worker অন্যের queue থেকে task **steal** করে (work-stealing scheduler)। Worker এর loop সহজ: queue থেকে task নাও → `poll` করো → `Pending` হলে ছেড়ে দাও, `Ready` হলে complete। তোমার কোড কখনো এই loop দেখে না — সব runtime এর ভেতরে।

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
> // `tokio::join!` দিয়ে একাধিক future একসাথে (concurrent) await করা যায়। Sequential এর চেয়ে অনেক fast — কারণ overlap হয়। Python এ `asyncio.gather()` এর মতো।

> [!note]
> **`.await` এ আসলে কী yield হয়?** Thread না — শুধু তোমার task। `tokio::join!` future গুলোকে পালা করে poll করে: একটা `Pending` দিলে সেটা আপাতত ছেড়ে অন্যটা poll হয় — **একই thread এ**। আর `sleep` আসলে ঘুমায় না: tokio এর timer (hierarchical timing wheel) এ deadline রেজিস্টার করে `Pending` দেয়; সময় হলে timer wheel `Waker` জাগিয়ে দেয়। তাই 10,000 টা concurrent `sleep` এও কোনো thread block হয় না — বিপরীতে `thread::sleep` পুরো thread টাই OS এ ঘুমায়।

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
> // `tokio::spawn` হলো `thread::spawn` এর async version। Task background এ চলে, `await` দিয়ে result collect করা যায়। কিন্তু এটা thread নয় — lightweight task!

> [!note]
> **`tokio::spawn` এর ভেতরে**: future টা একটা task struct এ মোড়া হয় (task header + future + result slot) আর **heap এ allocate** হয় — মাত্র কয়েকশো byte, তাই 10,000 task = কয়েক MB। Task টা worker queue তে ঢোকে আর যেকোনো worker thread এ poll হতে পারে — এজন্যই future কে `Send + 'static` লাগে (যেখানে বানালাম সেখানেই শেষ হবে — এমন guarantee নেই)। `handle.await` আসলে ছোট্ট একটা future poll করা, যেটা task শেষ হলে result slot থেকে মান তুলে দেয়।

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
> // `timeout` function দিয়ে যেকোনো async operation এ timeout বসানো যায়। Network call এর জন্য essential — নাহলে forever hang করতে পারে।

> [!note]
> **`select!` আর `timeout` এর ভেতরে**: `select!` সব branch এর future পালা করে poll করে (fairness এর জন্য প্রতিবার order ঘোরে), যেটা আগে `Ready` হয় তার branch চলে — বাকি future গুলো **drop** হয়ে যায়। `timeout` আর কিছু না: তোমার future + একটা timer future এর উপরে এই select। Deadline আগে গেলে `Err(Elapsed)`, future আগে শেষ হলে `Ok(value)`।

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
> // `tokio::sync::mpsc` হলো `std::sync::mpsc` এর async version। `.send().await` আর `.recv().await` — non-blocking। Channel full হলে producer wait করে, empty হলে consumer wait করে।

> [!note]
> **ভেতরের ব্যবস্থা**: `mpsc::channel(100)` এ একটা ring buffer + semaphore আছে। বানানোর সময় ১০০টা **permit** মুক্ত থাকে; `send` আগে একটা permit নেয় — buffer full হলে permit নেই, তাই `send().await` নিজেই `Pending` হয়ে অপেক্ষা করে (thread block না করেই)। Consumer `recv` করলে slot খালি, permit ফেরত যায়, অপেক্ষমাণ sender এর `Waker` জাগে। এটাই **backpressure** — producer automatic slow হয়, memory ফুলে ওঠে না।

## Async HTTP Request

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
reqwest = "0.12"
futures = "0.3"
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
> // `reqwest` হলো Rust এর HTTP client — Python এর `requests`/`httpx` এর মতো। Async support সহ। একাধিক request concurrent করা যায় — sequential এর চেয়ে অনেক fast।

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

> [!note]
> **`tokio::fs` ভেতরে কী চলে?** রহস্য কমই আছে — সাধারণ **blocking** ফাইল syscall গুলো (`open`, `read`, `write`) tokio আলাদা একটা **blocking threadpool**-এ পাঠিয়ে দেয় (`spawn_blocking`-এর মতোই), `.await` করার সময় তোমার task টা শুধু Pending হয়ে বসে থাকে — executor thread আটকে থাকে না। মানে এটা কোনো magic non-blocking file I/O না; অনেক concurrent ফাইল read করলে সেই threadpool-ই bottleneck হবে। এজন্যই উপরের টেবিলে File I/O কে "async বা thread" দুই-ই লেখা — ভেতরে কাজ প্রায় একই, শুধু ergonomics আলাদা।

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
> // `Pin` সম্পর্কে শুধু এটুকু জেনে রাখো — এটা internal implementation detail। বেশিরভাগ ক্ষেত্রে তোমাকে manually `Pin` নিয়ে কাজ করতে হবে না। `async/await` আর `Box::pin` সব handle করে। শুধু যদি নিজের Future implement করো, তখন দরকার হবে।

> [!note]
> **কেন `Pin` আসলেই দরকার?** State machine অনেক সময় **self-referential** হয় — এক state এর local variable এর pointer অন্য state এর ভেতরে টিকে থাকে। Future টা memory তে সরলে ওই pointer গুলো dangling হয়ে যাবে। `Pin<&mut T>` type system কে বলে দেয় "এটাকে আর move করা যাবে না" (`Unpin` না হলে `&mut` দিয়ে move করার পথ বন্ধ)। `.await` আর `Box::pin` এসব ভেতরে-ভেতরে সামলায়, তাই তোমার হাতে তা আসে না।

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
> // Syntax প্রায় একই — `async def` → `async fn`, `await` → `.await`। কিন্তু performance difference বিশাল! Python এর asyncio single-threaded, GIL limited। Rust এর tokio multi-threaded, work-stealing, zero-cost। 10x-100x faster।

## কখন Thread, কখন Async?

| Scenario | Use |
|----------|-----|
| CPU-heavy computation | Thread (rayon) |
| Network I/O (HTTP, DB) | Async (tokio) |
| File I/O | Async বা thread |
| Mixed | Async + `spawn_blocking` for CPU |

> [!tip]
> // সহজ নিয়ম — I/O bound হলে async, CPU bound হলে thread। দুটোই দরকার হলে async runtime এর ভেতর `tokio::task::spawn_blocking()` দিয়ে CPU work thread এ পাঠাও।

## Summary

Async/await হলো I/O-bound concurrency এর জন্য। `tokio` হলো standard runtime। `async fn` দিয়ে async function, `.await` দিয়ে wait, `tokio::spawn` দিয়ে background task, `tokio::join!` দিয়ে concurrent wait, `select!` দিয়ে race। Python এর asyncio এর মতো concept, কিন্তু multi-threaded আর zero-cost। পরের chapter এ testing শিখবো।