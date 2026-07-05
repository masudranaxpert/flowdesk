# Async and Concurrency

Async/await is Python's modern way of handling concurrency. Especially for I/O-heavy tasks (API calls, database queries, file reads), it's several times faster than synchronous code. Let's understand how.

## Sync vs Async — The Core Difference

**Synchronous**: Wait for one task to finish, then move to the next.

**Asynchronous**: If one task needs to wait, work on something else in the meantime.

```python
# Sync — all tasks are serial
import time

def fetch_data_sync(url):
    time.sleep(1)  # simulating 1 second network delay
    return f"Data from {url}"

start = time.perf_counter()
for url in ["api1.com", "api2.com", "api3.com"]:
    print(fetch_data_sync(url))
print(f"Total time: {time.perf_counter() - start:.2f}s")
# Data from api1.com
# Data from api2.com
# Data from api3.com
# Total time: 3.01s  ← one after another!
```

```python
# Async — all tasks run together
import asyncio
import time

async def fetch_data_async(url):
    await asyncio.sleep(1)  # non-blocking wait
    return f"Data from {url}"

async def main():
    start = time.perf_counter()
    # All three run at the same time!
    results = await asyncio.gather(
        fetch_data_async("api1.com"),
        fetch_data_async("api2.com"),
        fetch_data_async("api3.com"),
    )
    for r in results:
        print(r)
    print(f"Total time: {time.perf_counter() - start:.2f}s")

asyncio.run(main())
# Data from api1.com
# Data from api2.com
# Data from api3.com
# Total time: 1.00s  ← all at once!
```

> [!tip]
> 3 seconds of work done in 1 second! Because in async, when one task is `await`-ing (I/O wait), other tasks run during that time. That's concurrency — no idle waiting.

## `async def` and `await`

```python
import asyncio

async def greet(name: str) -> str:
    await asyncio.sleep(0.5)  # non-blocking pause
    return f"Hello, {name}!"

async def main():
    # await waits until the result is ready
    message = await greet("Karim")
    print(message)

asyncio.run(main())  # the top-level entry point
```

> [!note]
> Using `async def` turns the function into a coroutine. Calling a coroutine directly does nothing — you need to schedule it with `await` or `asyncio.run()`.

## `asyncio.gather` — Many Tasks at Once

```python
import asyncio

async def fetch_with_delay(url: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"✅ Data received from {url} ({delay}s)"

async def main():
    # All tasks start together
    results = await asyncio.gather(
        fetch_with_delay("fast.com", 0.5),
        fetch_with_delay("medium.com", 1.0),
        fetch_with_delay("slow.com", 1.5),
    )
    for result in results:
        print(result)

asyncio.run(main())
# ✅ Data received from fast.com (0.5s)
# ✅ Data received from medium.com (1.0s)
# ✅ Data received from slow.com (1.5s)
# Total time: ~1.5s (the slowest one's time), not 3s!
```

## Real Example — Multiple API Calls

```python
import asyncio

async def fetch_user(user_id: int) -> dict:
    """Simulated API call"""
    await asyncio.sleep(0.3)  # network delay
    return {"id": user_id, "name": f"User_{user_id}", "active": True}

async def fetch_all_users() -> list[dict]:
    user_ids = range(1, 11)  # 10 users

    # Fetch all at once
    tasks = [fetch_user(uid) for uid in user_ids]
    users = await asyncio.gather(*tasks)
    return list(users)

async def main():
    users = await fetch_all_users()
    active_count = sum(1 for u in users if u["active"])
    print(f"{len(users)} users, {active_count} active")

asyncio.run(main())
```

> [!example]
> In this example, 10 API calls finish not in 3 seconds, but in 0.3 seconds! In the real world, you'd use an async client like `aiohttp` or `httpx` for actual HTTP requests. The pattern is the same.

## When to Use Async, Threads, or Processes?

| Scenario | Best Choice | Why |
|----------|-------------|-----|
| I/O heavy (API, DB, file) | **async/await** | lightweight, many connections |
| I/O heavy (legacy library) | **ThreadPoolExecutor** | when async isn't supported |
| CPU heavy (calculation) | **ProcessPoolExecutor** | need to bypass the GIL |

### `concurrent.futures` — Thread and Process Pools

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
> Using threads for CPU-bound work gives no benefit — because of the GIL, only one thread executes Python at a time. For CPU-heavy work, use ProcessPool, since each process has its own GIL and memory space.

## The GIL (Global Interpreter Lock)

The GIL is a mutex that ensures only one thread executes Python bytecode at any given time.

```python
# The GIL's impact — no speedup from threads for CPU work
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

# Two threads — no benefit due to the GIL!
start = time.perf_counter()
t1 = threading.Thread(target=cpu_work)
t2 = threading.Thread(target=cpu_work)
t1.start(); t2.start()
t1.join(); t2.join()
print(f"Threads: {time.perf_counter() - start:.2f}s")
# Sequential and Thread times are about the same!
```

### Free-Threaded Mode — Python 3.13+ (PEP 703)

Python 3.13+ has an experimental free-threaded build (no-GIL):

```bash
# Installing free-threaded Python (more mature in 3.14)
# It's a separate build — the default install still has the GIL

# Check if GIL is enabled
python -c "import sys; print(sys._is_gil_enabled())"
# True  = GIL on (default)
# False = free-threaded mode

# Enable free-threaded mode (experimental)
PYTHON_GIL=0 python script.py
```

> [!warn]
> Free-threaded mode is more mature in Python 3.14, but still experimental. Not all C extensions support free-threading. Thoroughly test before using in production. In 2026, for most projects, standard GIL mode + async/multiprocessing is still the best approach.

## `asyncio.create_task` — Background Tasks

```python
import asyncio

async def background_job():
    for i in range(5):
        print(f"🔄 Background: {i}")
        await asyncio.sleep(0.5)
    print("✅ Background done!")

async def main():
    # Start a background task
    task = asyncio.create_task(background_job())

    # Do other work in the meantime
    print("Main task starting...")
    await asyncio.sleep(2)
    print("Main task continuing...")

    # Wait for the background task to finish
    await task
    print("All done!")

asyncio.run(main())
```

## Summary

Async/await is the best way to handle I/O-bound concurrency — it's incredibly fast for API calls, databases, and file operations. Use `asyncio.gather` for many tasks at once. Use threads for I/O with legacy libraries, and processes for CPU-heavy work. Due to the GIL, threads give no benefit for CPU work — use ProcessPool instead. Free-threaded mode (3.14) is experimentally available, but use it with caution.