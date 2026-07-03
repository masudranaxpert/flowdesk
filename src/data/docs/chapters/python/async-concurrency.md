Async/await হলো Python এ concurrency handle করার modern উপায়। বিশেষ করে I/O-heavy কাজে (API call, database query, file read) এটা synchronous code এর চেয়ে কয়েক গুণ fast। চলো বুঝি কিভাবে।

## Sync vs Async — মূল পার্থক্য

**Synchronous**: একটা কাজ শেষ হওয়া পর্যন্ত অপেক্ষা করো, তারপর পরের।

**Asynchronous**: একটা কাজে অপেক্ষা করতে হলে, এর মধ্যে অন্য কাজ করো।

```python
# Sync — সব কাজ serial
import time

def fetch_data_sync(url):
    time.sleep(1)  # 1 সেকেন্ড network delay simulation
    return f"Data from {url}"

start = time.perf_counter()
for url in ["api1.com", "api2.com", "api3.com"]:
    print(fetch_data_sync(url))
print(f"মোট সময়: {time.perf_counter() - start:.2f}s")
# Data from api1.com
# Data from api2.com
# Data from api3.com
# মোট সময়: 3.01s  ← একটার পর একটা!
```

```python
# Async — সব কাজ একসাথে
import asyncio
import time

async def fetch_data_async(url):
    await asyncio.sleep(1)  # non-blocking wait
    return f"Data from {url}"

async def main():
    start = time.perf_counter()
    # তিনটা একসাথে চলে!
    results = await asyncio.gather(
        fetch_data_async("api1.com"),
        fetch_data_async("api2.com"),
        fetch_data_async("api3.com"),
    )
    for r in results:
        print(r)
    print(f"মোট সময়: {time.perf_counter() - start:.2f}s")

asyncio.run(main())
# Data from api1.com
# Data from api2.com
# Data from api3.com
# মোট সময়: 1.00s  ← সব একসাথে!
```

> [!tip]
> ৩ সেকেন্ডের কাজ ১ সেকেন্ডে হলো! কারণ async এ যখন একটা task `await` করছে (I/O wait), সেই সময় অন্য task গুলো চলে। এটাই concurrency — কোনো অপেক্ষা idle থাকে না।

## `async def` আর `await`

```python
import asyncio

async def greet(name: str) -> str:
    await asyncio.sleep(0.5)  # non-blocking pause
    return f"হ্যালো, {name}!"

async def main():
    # await দিলে result আসা পর্যন্ত wait করে
    message = await greet("Karim")
    print(message)

asyncio.run(main())  # সবথেকে উপরের entry point
```

> [!note]
> `async def` দিয়ে function টা coroutine হয়ে যায়। Coroutine সরাসরি call করলে কিছু হয় না — `await` বা `asyncio.run()` দিয়ে schedule করতে হয়।

## `asyncio.gather` — একসাথে অনেক Task

```python
import asyncio

async def fetch_with_delay(url: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"✅ {url} থেকে ডেটা এলো ({delay}s)"

async def main():
    # সব task একসাথে start
    results = await asyncio.gather(
        fetch_with_delay("fast.com", 0.5),
        fetch_with_delay("medium.com", 1.0),
        fetch_with_delay("slow.com", 1.5),
    )
    for result in results:
        print(result)

asyncio.run(main())
# ✅ fast.com থেকে ডেটা এলো (0.5s)
# ✅ medium.com থেকে ডেটা এলো (1.0s)
# ✅ slow.com থেকে ডেটা এলো (1.5s)
# মোট সময়: ~1.5s (সবচেয়ে ধীরের সময়), 3s না!
```

## রিয়েল উদাহরণ — Multiple API Calls

```python
import asyncio

async def fetch_user(user_id: int) -> dict:
    """Simulated API call"""
    await asyncio.sleep(0.3)  # network delay
    return {"id": user_id, "name": f"User_{user_id}", "active": True}

async def fetch_all_users() -> list[dict]:
    user_ids = range(1, 11)  # 10 জন user

    # সব একসাথে fetch
    tasks = [fetch_user(uid) for uid in user_ids]
    users = await asyncio.gather(*tasks)
    return list(users)

async def main():
    users = await fetch_all_users()
    active_count = sum(1 for u in users if u["active"])
    print(f"{len(users)} জন user, {active_count} জন active")

asyncio.run(main())
```

> [!example]
> এই উদাহরণে ১০টা API call ৩ সেকেন্ডে না, ০.৩ সেকেন্ডে শেষ হবে! Real world এ `aiohttp` বা `httpx` async client দিয়ে actual HTTP request করবে। Pattern একই।

## কখন Async, কখন Thread, কখন Process?

| Scenario | Best Choice | কেন |
|----------|-------------|-----|
| I/O heavy (API, DB, file) | **async/await** | lightweight, অনেক connection |
| I/O heavy (legacy library) | **ThreadPoolExecutor** | async support না থাকলে |
| CPU heavy (calculation) | **ProcessPoolExecutor** | GIL bypass করতে হবে |

### `concurrent.futures` — Thread আর Process Pool

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time

# CPU-bound work — ProcessPool
def heavy_compute(n: int) -> int:
    total = 0
    for i in range(n):
        total += i ** 2
    return total

# ThreadPool — I/O bound
def fetch(url: str) -> str:
    time.sleep(0.5)
    return f"Data from {url}"

# Thread pool (I/O bound)
with ThreadPoolExecutor(max_workers=5) as executor:
    urls = ["api1.com", "api2.com", "api3.com"]
    results = list(executor.map(fetch, urls))
    print(results)

# Process pool (CPU bound)
with ProcessPoolExecutor() as executor:
    numbers = [10_000_000, 10_000_000, 10_000_000]
    results = list(executor.map(heavy_compute, numbers))
    print(f"Results: {results}")
```

> [!tip]
> Thread দিয়ে CPU-bound কাজ করলে কোনো লাভ নেই — GIL এর কারণে এক সময়ে একটাই thread Python execute করে। CPU-heavy কাজে ProcessPool ব্যবহার করো, কারণ process গুলোর আলাদা GIL আর memory space থাকে।

## The GIL (Global Interpreter Lock)

GIL হলো একটা mutex যেটা নিশ্চিত করে যে একই সময়ে শুধু একটা thread Python bytecode execute করবে।

```python
# GIL এর প্রভাব — thread দিয়ে CPU কাজ করলে কোনো speedup নেই
import threading
import time

def cpu_work():
    total = 0
    for i in range(10_000_000):
        total += i
    return total

# Single thread
start = time.perf_counter()
cpu_work()
cpu_work()
print(f"Sequential: {time.perf_counter() - start:.2f}s")

# Two threads — GIL এর কারণে কোনো লাভ নেই!
start = time.perf_counter()
t1 = threading.Thread(target=cpu_work)
t2 = threading.Thread(target=cpu_work)
t1.start(); t2.start()
t1.join(); t2.join()
print(f"Threads: {time.perf_counter() - start:.2f}s")
# Sequential আর Thread time প্রায় একই!
```

### Free-Threaded Mode — Python 3.13+ (PEP 703)

Python 3.13+ এ free-threaded build (no-GIL) experimental ভাবে available:

```bash
# Free-threaded Python install করা (3.14 এ আরও mature)
# এটা একটা আলাদা build — default install এ GIL আছে

# Check করো GIL enabled কিনা
python -c "import sys; print(sys._is_gil_enabled())"
# True  = GIL on (default)
# False = free-threaded mode

# Free-threaded mode enable (experimental)
PYTHON_GIL=0 python script.py
```

> [!warn]
> Free-threaded mode Python 3.14 এ আরও mature হলেও এখনো experimental। সব C extension free-threaded support করে না। Production এ ব্যবহার করার আগে thorough testing করো। 2026 এ বেশির ভাগ project এর জন্য standard GIL mode + async/multiprocessing ই best approach।

## `asyncio.create_task` — Background Task

```python
import asyncio

async def background_job():
    for i in range(5):
        print(f"🔄 Background: {i}")
        await asyncio.sleep(0.5)
    print("✅ Background শেষ!")

async def main():
    # Background task start
    task = asyncio.create_task(background_job())

    # এর মধ্যে অন্য কাজ
    print("মূল কাজ শুরু...")
    await asyncio.sleep(2)
    print("মূল কাজ চলছে...")

    # Background task শেষ হওয়া পর্যন্ত wait
    await task
    print("সব শেষ!")

asyncio.run(main())
```

## Summary

Async/await হলো I/O-bound concurrency এর সেরা উপায় — API call, database, file কাজে দারুণ fast। `asyncio.gather` দিয়ে একসাথে অনেক task। Thread দিয়া I/O (legacy library), Process দিয়া CPU-heavy কাজ। GIL এর কারণে thread এ CPU কাজে কোনো লাভ নেই — ProcessPool use করো। Free-threaded mode (3.14) experimental ভাবে available, তবে সাবধানে ব্যবহার করো।