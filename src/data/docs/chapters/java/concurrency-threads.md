# Multithreading ও Classic Concurrency

জাভাতে প্রথম দিন থেকেই concurrency একটি ফার্স্ট-class সিটিজেন। একাধিক thread-এর মাধ্যমে একই সাথে একাধিক কাজ পরিচালনা করে প্রসেসরের মাল্টি-কোর আর্কিটেকচারের সম্পূর্ণ সুবিধা নেওয়াই concurrency-এর লক্ষ্য।

---

## ১. Thread Lifecycle ও thread সৃষ্টির নিয়ম

জাভাতে প্রতিটি প্ল্যাটফর্ম thread সরাসরি অপারেটিং সিস্টেমের কার্নেল thread-এর (OS thread) সাথে ১:১ ম্যাপ করা থাকে।

```
        ┌──────────┐
        │   NEW    │
        └────┬─────┘
             │ start()
             ▼
      ┌──────────────┐
      │   RUNNABLE   │ ◄─── (Ready / Running on CPU)
      └──┬───┬───┬───┘
         │   │   │
  wait() │   │   │ sleep(ms) / join(ms)
         │   │   └──────────────────────► ┌───────────────────┐
         │   │                            │   TIMED_WAITING   │
         │   │ monitor lock               └─────────┬─────────┘
         │   ▼                                      │
         │ ┌──────────────┐                         │
         │ │   BLOCKED    │                         │
         │ └──────────────┘                         │
         ▼                                          ▼
  ┌──────────────┐                          Time expires / notify()
  │   WAITING    │
  └──────────────┘
         │
         │ run() completes or exception
         ▼
  ┌──────────────┐
  │  TERMINATED  │
  └──────────────┘
```

### thread তৈরি: `Thread` বনাম `Runnable`
জাভাতে inheritance-এর সীমাবদ্ধতা (`extends Thread`) এড়াতে সবসময় `Runnable` বা `Callable` ল্যাম্বডা ব্যবহার করা সর্বোত্তম প্র্যাকটিস:

```java
public class ThreadCreationDemo {
    public static void main(String[] args) {
        // Preferred modern way: Runnable lambda
        Runnable task = () -> {
            String threadName = Thread.currentThread().getName();
            System.out.println("Running in thread: " + threadName);
        };

        Thread thread = new Thread(task, "Worker-Thread-1");
        thread.start(); // Spawns OS thread and calls run() asynchronously
    }
}
```

> [!WARNING]
> কখনো সরাসরি `thread.run()` method কল করবেন না। `run()` কল করলে নতুন thread তৈরি না হয়ে বর্তমান কলিং থ্রেডেই সাধারণ method-এর মতো রান করবে। নতুন thread স্পন করার জন্য সবসময় `thread.start()` কল করতে হয়।

---

## ২. Race Condition ও Synchronization

যখন একাধিক thread একই সাথে কোনো শেয়ার্ড mutable ডেটা রিড ও মডিফাই করে, তখন **Race Condition** ঘটে এবং ডেটা করাপ্ট হয়ে যায়।

```java
import java.util.concurrent.locks.ReentrantLock;

public class BankAccountThreadSafety {

    private double balance = 1000.0;
    private final ReentrantLock lock = new ReentrantLock();

    // 1. Thread-safe using synchronized method (Intrinsic Monitor Lock)
    public synchronized void deposit(double amount) {
        balance += amount;
    }

    // 2. Thread-safe using explicit ReentrantLock
    public void withdraw(double amount) {
        lock.lock(); // Acquire lock
        try {
            if (balance >= amount) {
                balance -= amount;
                System.out.println("Withdrawn: " + amount + ", Remaining: " + balance);
            } else {
                System.out.println("Insufficient funds for: " + amount);
            }
        } finally {
            // ALWAYS unlock in finally block to avoid deadlocks!
            lock.unlock();
        }
    }

    public synchronized double getBalance() {
        return balance;
    }
}
```

---

## ৩. `volatile` বনাম `Atomic` ক্লাসেস

### `volatile` কী করে:
জাভাতে প্রতিটি CPU কোরের নিজস্ব L1/L2 ক্যাশ থাকে। একটি thread যখন variable আপডেট করে, তখন অন্য thread সেই পরিবর্তন দেখতে নাও পারে। `volatile` কিওয়ার্ড memory দৃশ্যমানতা (**Visibility Guarantee / Happens-Before**) নিশ্চিত করে। এটি সরাসরি মেইন memory থেকে রিড/রাইট করে।

```java
public class WorkerFlag {
    // volatile ensures any thread immediately sees updates to running
    private volatile boolean running = true;

    public void stop() {
        this.running = false;
    }

    public void runLoop() {
        while (running) {
            // Do ongoing work
        }
        System.out.println("Worker stopped safely.");
    }
}
```

> [!CAUTION]
> `volatile` শুধুমাত্র **Visibility** নিশ্চিত করে, **Atomicity** নিশ্চিত করে না। অর্থাৎ `count++` অপারেশনে (যা রিড, ইনক্রিমেন্ট এবং রাইট—৩টি স্টেপ) `volatile` thread-সেফ নয়।

### `java.util.concurrent.atomic` (Lock-Free Thread Safety):
অ্যাটমিক ক্লাসসমূহ কোনো লকিং ছাড়াই হার্ডওয়্যার লেভেলের **CAS (Compare-And-Swap)** ইন্সট্রাকশন ব্যবহার করে লক-ফ্রি পারফরম্যান্স দেয়:

```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicCounterDemo {
    private final AtomicInteger counter = new AtomicInteger(0);

    public void increment() {
        // Atomic lock-free increment
        counter.incrementAndGet();
    }

    public int getValue() {
        return counter.get();
    }
}
```

---

## ৪. ExecutorService ও Thread Pool ম্যানেজমেন্ট

ম্যানুয়ালি `new Thread()` তৈরি করা একটি অ্যান্টি-প্যাটার্ন; কারণ প্রতিটি thread তৈরিতে memory এলোকেশন এবং কন্টেক্সট সুইচিং ওভারহেড রয়েছে। প্রোডাকশনে সবসময় **ExecutorService** ব্যবহার করতে হয়।

```java
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class ExecutorServiceDemo {

    public static void main(String[] args) throws Exception {
        // Create a pool of 4 reusable worker threads
        ExecutorService pool = Executors.newFixedThreadPool(4);

        // Submitting a Callable task that returns a value
        Callable<String> fetchTask = () -> {
            Thread.sleep(500); // Simulate network latency
            return "Fetched remote data successfully";
        };

        Future<String> futureResult = pool.submit(fetchTask);

        System.out.println("Doing other operations while waiting for task...");

        // Blocking get with timeout to prevent hanging forever
        String data = futureResult.get(2, TimeUnit.SECONDS);
        System.out.println("Result received: " + data);

        // Graceful shutdown pattern
        shutdownExecutor(pool);
    }

    public static void shutdownExecutor(ExecutorService pool) {
        pool.shutdown(); // Stop accepting new tasks
        try {
            if (!pool.awaitTermination(3, TimeUnit.SECONDS)) {
                pool.shutdownNow(); // Force cancel running tasks
            }
        } catch (InterruptedException e) {
            pool.shutdownNow();
            Thread.currentThread().interrupt(); // Restore interrupted status
        }
    }
}
```

### ডেডলক (Deadlock) প্রিভেনশন টিপস:
1. **Lock Ordering**: সবসময় সকল thread-এ একই অর্ডারে একাধিক লক অ্যাকোয়ার করুন (যেমন: Lock A তারপর Lock B)।
2. **Lock Timeout**: অনন্তকাল আটকে না থেকে `tryLock(timeout, unit)` ব্যবহার করুন।
