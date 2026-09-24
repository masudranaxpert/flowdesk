# Modern Concurrency: Virtual Threads ও Structured Concurrency

জাভা ২১-এর সবচেয়ে বৈপ্লবিক সংযোজন হলো **Project Loom** এর মাধ্যমে আসা **Virtual Threads** (JEP 444) এবং **Structured Concurrency**। এটি জাভার হাই-থ্রুপুট কনকারেন্ট অ্যাপ্লিকেশন তৈরির নিয়ম সম্পূর্ণ বদলে দিয়েছে।

---

## ১. Platform Threads বনাম Virtual Threads

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│           Platform Threads           │           Virtual Threads            │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ ১:১ OS কার্নেল থ্রেডের সাথে ম্যাপ করা │ M:N আর্কিটেকচার (Loom Runtime পরিচালিত)│
│ সাইজ: ~১ MB (ফিক্সড OS স্ট্যাক মেমোরি)│ সাইজ: ~১ KB (ডায়নামিক JVM হিপ মেমোরি)│
│ লিমিট: সার্ভারে কয়েক হাজার সর্বোচ্চ  │ লিমিট: কোটি কোটি থ্রেড অনায়াসে সম্ভব │
│ থ্রেড ক্রিয়েশন অত্যন্ত ব্যয়বহুল     │ থ্রেড ক্রিয়েশন অবজেক্ট তৈরির মতো সস্তা│
│ থ্রেড পুলিং (Pooling) বাধ্যতামূলক    │ পুলিং নিষিদ্ধ; প্রতি টাস্কে নতুন থ্রেড│
└──────────────────────────────────────┴──────────────────────────────────────┘
```

```
 [ Virtual Thread 1 ]   [ Virtual Thread 2 ]   [ Virtual Thread 3 ]
         │                      │                      │
         └──────────────┬───────┴──────────────────────┘
                        ▼ (Mount / Unmount)
            [ Carrier Platform Thread ] ──► (OS Kernel Thread)
```

### ক্যারিয়ার থ্রেড ও আনমাউন্টিং মেকানিজম:
যখন কোনো ভার্চুয়াল থ্রেড ব্লকিং I/O (যেমন ডেটাবেস কোয়েরি, নেটওয়ার্ক রিকোয়েস্ট, বা `Thread.sleep`) কল করে, JVM ভার্চুয়াল থ্রেডটিকে আন্ডারলায়িং ক্যারিয়ার থ্রেড থেকে **Unmount** করে আলাদা রেখে দেয়। ক্যারিয়ার থ্রেডটি খালি হয়ে অন্য কোনো ভার্চুয়াল থ্রেড রান করতে শুরু করে। I/O শেষ হলে JVM আবার থ্রেডটিকে ক্যারিয়ারে **Mount** করে এক্সিকিউট করে।

---

## ২. Virtual Thread তৈরি ও ব্যবহার

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

public class VirtualThreadDemo {

    public static void main(String[] args) {
        // 1. Direct creation using Thread builder
        Thread vThread = Thread.ofVirtual().name("worker-vthread").start(() -> {
            System.out.println("Running on virtual thread: " + Thread.currentThread());
        });

        // 2. Modern Executor: 1 Virtual Thread per task (NO POOLING!)
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IntStream.range(0, 100_000).forEach(i -> {
                executor.submit(() -> {
                    // Blocking sleep without wasting OS threads
                    Thread.sleep(1000);
                    return i;
                });
            });
            // Try-with-resources waits for all 100,000 tasks to finish!
        }
        System.out.println("Finished 100,000 concurrent tasks smoothly!");
    }
}
```

> [!WARNING]
> **কখনো ভার্চুয়াল থ্রেড পুল করবেন না!**
> ভার্চুয়াল থ্রেড হলো স্বল্পস্থায়ী অবজেক্টের মতো। এদের জন্য `newFixedThreadPool` বানাবেন না। সর্বদা `Executors.newVirtualThreadPerTaskExecutor()` ব্যবহার করুন।

---

## ৩. Thread Pinning সমস্যা ও সমাধান

ভার্চুয়াল থ্রেড যখন নেটিভ মেথড অথবা ক্লাসিকাল `synchronized` ব্লকের ভেতর কোনো ব্লকিং I/O কল করে, তখন JVM ভার্চুয়াল থ্রেডটিকে ক্যারিয়ার থ্রেড থেকে আনমাউন্ট করতে পারে না। একে **Thread Pinning** বলে।

```java
import java.util.concurrent.locks.ReentrantLock;

public class ThreadPinningFix {

    // ❌ ঝুঁকিপূর্ণ: synchronized ব্লকে I/O থাকলে ক্যারিয়ার থ্রেড পিন হয়ে যায়
    public synchronized String blockedMethodOld() {
        return callExternalHttpService(); // Blocks entire carrier OS thread!
    }

    // ✅ সমাধান: ReentrantLock ব্যবহার করুন
    private final ReentrantLock lock = new ReentrantLock();

    public String blockedMethodModern() {
        lock.lock();
        try {
            return callExternalHttpService(); // Virtual thread safely unmounts!
        } finally {
            lock.unlock();
        }
    }

    private String callExternalHttpService() {
        try { Thread.sleep(200); } catch (Exception ignored) {}
        return "data";
    }
}
```

---

## ৪. Asynchronous Composition: `CompletableFuture`

লুমের পাশাপাশি জটিল অ্যাসিনক্রোনাস পাইপলাইন ম্যানেজ করার জন্য `CompletableFuture` একটি অপরিহার্য টুল:

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

public class CompletableFuturePipeline {

    public static void main(String[] args) {
        CompletableFuture<String> pipeline = CompletableFuture.supplyAsync(() -> {
            System.out.println("Fetching user profile...");
            return "user_123";
        }).thenCompose(userId -> CompletableFuture.supplyAsync(() -> {
            System.out.println("Fetching orders for " + userId);
            return List.of("Order_A", "Order_B");
        })).thenApply(orders -> {
            System.out.println("Formatting order receipt...");
            return "Total Orders: " + orders.size();
        }).exceptionally(ex -> {
            System.err.println("Pipeline failed: " + ex.getMessage());
            return "Fallback: 0 orders";
        });

        System.out.println("Result: " + pipeline.join());
    }
}
```

---

## ৫. Structured Concurrency (Java 21 Preview)

মাল্টি-থ্রেডিংয়ের সবচেয়ে বিপজ্জনক দিক হলো **Thread Leakage** বা অরফান থ্রেড (একটি সাবটাস্ক ফেইল করলেও অন্য সাবটাস্ক ব্যাকগ্রাউন্ডে আজীবন রান হতে থাকা)। **Structured Concurrency** নিশ্চিত করে যে সব সাবটাস্ক একই ব্লকে শুরু এবং একই ব্লকে শেষ হবে।

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.function.Supplier;

public class StructuredConcurrencyDemo {

    public record UserDashboard(String profile, String orderHistory) {}

    public static UserDashboard fetchDashboardData(String userId) throws Exception {
        // ShutdownOnFailure: If any subtask fails, cancel all other sibling subtasks!
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            
            Supplier<String> profileSubtask = scope.fork(() -> fetchProfile(userId));
            Supplier<String> ordersSubtask = scope.fork(() -> fetchOrders(userId));

            // Wait for both subtasks to complete or any one to fail
            scope.join();
            scope.throwIfFailed(); // Throw exception if any subtask failed

            // Both tasks are guaranteed to succeed here safely
            return new UserDashboard(profileSubtask.get(), ordersSubtask.get());
        }
    }

    private static String fetchProfile(String id) throws Exception {
        Thread.sleep(100);
        return "Profile data of " + id;
    }

    private static String fetchOrders(String id) throws Exception {
        Thread.sleep(150);
        return "Orders of " + id;
    }
}
```

> [!TIP]
> `StructuredTaskScope` কোডের অ্যাসিনক্রোনাস থ্রেড ম্যানেজমেন্টকে ক্লাসিকাল স্ট্রাকচার্ড ব্লকের (`try-catch` বা মেথড কলের) মতো পরিষ্কার ও অনুমেয় করে তোলে। কোনো সাবটাস্ক ফেইল করলে বাকিগুলো অটোমেটিক বাতিল হয়ে রিসোর্স সাশ্রয় হয়।
