# Functional Programming: Lambdas ও Streams API

জাভা ৮-এ ফাংশনাল প্রোগ্রামিংয়ের সংযোজন জাভার ডেভেলপমেন্ট স্টাইলকে আমূল বদলে দিয়েছে। ল্যাম্বডা এক্সপ্রেশন এবং স্ট্রিমস এপিআই কোডকে করে তোলে ডিক্লারেটিভ, সংক্ষিপ্ত, এবং সমান্তরাল প্রসেসিংয়ের উপযোগী।

---

## ১. Functional Interfaces ও Lambda Syntax

যে interface-এ **একটি মাত্র abstract method (SAM - Single Abstract Method)** থাকে, তাকে **Functional Interface** বলে। একে চিহ্নিত করার জন্য `@FunctionalInterface` অ্যানোটেশন ব্যবহার করা হয়।

```java
@FunctionalInterface
public interface Transformer<T, R> {
    R transform(T input);

    // Default or static methods do not break the single abstract method rule
    default void log(T input) {
        System.out.println("Processing: " + input);
    }
}
```

### ল্যাম্বডা syntax বিবর্তন:
ল্যাম্বডা মূলত অ্যানোনিমাস ইনার class-এর সংক্ষিপ্ত রূপ:

```java
// Anonymous inner class (Pre-Java 8)
Transformer<String, Integer> stringLengthOld = new Transformer<String, Integer>() {
    @Override
    public Integer transform(String input) {
        return input.length();
    }
};

// Lambda expression (Java 8+)
Transformer<String, Integer> stringLengthLambda = (input) -> input.length();

// Method Reference
Transformer<String, Integer> stringLengthRef = String::length;
```

---

## ২. স্ট্যান্ডার্ড ফাংশনাল ইন্টারফেসসমূহ (`java.util.function`)

জাভার স্ট্যান্ডার্ড লাইব্রেরি বহুল ব্যবহৃত কাজের জন্য তৈরি interface প্রদান করে:

| interface | method সিগনেচার | উদ্দেশ্য | বাস্তব উদাহরণ |
| :--- | :--- | :--- | :--- |
| `Predicate<T>` | `boolean test(T t)` | কন্ডিশন টেস্ট করা | `x -> x > 10` |
| `Function<T, R>` | `R apply(T t)` | ইনপুটকে অন্য টাইপে রূপান্তর | `user -> user.getEmail()` |
| `Consumer<T>` | `void accept(T t)` | সাইড-ইফেক্ট সম্পাদন (কোনো রিটার্ন নেই) | `System.out::println` |
| `Supplier<T>` | `T get()` | কোনো ইনপুট ছাড়াই ভ্যালু জেনারেট | `() -> UUID.randomUUID()` |
| `UnaryOperator<T>` | `T apply(T t)` | একই টাইপের ডেটা মডিফাই | `str -> str.toUpperCase()` |
| `BinaryOperator<T>` | `T apply(T t1, T t2)` | দুটি সমজাতীয় object-এর মিলন | `(a, b) -> a + b` |

> [!TIP]
> অটবক্সিং ওভারহেড এড়াতে প্রিমিটিভ স্পেশালাইজেশন interface ব্যবহার করুন: যেমন `IntPredicate`, `LongFunction`, `DoubleConsumer` ইত্যাদি। এতে অপ্রয়োজনীয় Heap এলোকেশন বাঁচে।

---

## ৩. Streams API আর্কিটেকচার

স্ট্রিম কোনো ডেটা স্ট্রাকচার নয়; এটি ডেটা সোর্স (কালেকশন, array বা I/O চ্যানেল) থেকে উপাদান গ্রহণ করে পাইপলাইনের মাধ্যমে প্রসেস করার একটি সিকোয়েন্স।

```
  Data Source ───► [ Intermediate Op ] ───► [ Intermediate Op ] ───► [ Terminal Op ]
 (List, Set)          (filter)                   (map)                 (collect)
                           ▲                           ▲                    ▲
                           └──────── Lazy Evaluation ──┴────────────────────┘
                               (Executes only when Terminal Op runs)
```

### পাইপলাইনের ৩টি অংশ:
1. **Source**: কালেকশন (`list.stream()`), array (`Arrays.stream(arr)`), বা ফ্যাক্টরি method (`Stream.of()`).
2. **Intermediate Operations**: উপাদান ফিল্টার বা ট্রান্সফর্ম করে আরেকটি নতুন স্ট্রিম প্রদান করে (Lazy).
3. **Terminal Operation**: পাইপলাইন এক্সিকিউট করে ফাইনাল রেজাল্ট তৈরি করে বা কনজিউম করে।

---

## ৪. Intermediate বনাম Terminal Operations

```java
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class StreamPipelineDeepDive {

    public record Order(String id, String customerId, double amount, String status) {}

    public static void main(String[] args) {
        List<Order> orders = List.of(
            new Order("O1", "C1", 120.0, "COMPLETED"),
            new Order("O2", "C2", 450.0, "PENDING"),
            new Order("O3", "C1", 300.0, "COMPLETED"),
            new Order("O4", "C3", 80.0,  "CANCELLED"),
            new Order("O5", "C2", 210.0, "COMPLETED")
        );

        // 1. Filtering, Mapping & Sorting
        List<String> highValueCompletedOrders = orders.stream()
            .filter(o -> "COMPLETED".equals(o.status()))     // Intermediate: Filter
            .filter(o -> o.amount() >= 200.0)                 // Intermediate: Filter
            .sorted((a, b) -> Double.compare(b.amount(), a.amount())) // Intermediate: Sort desc
            .map(Order::id)                                   // Intermediate: Extract ID
            .collect(Collectors.toList());                    // Terminal: List creation

        System.out.println("High Value Completed Orders: " + highValueCompletedOrders);

        // 2. Advanced Grouping by Customer ID & Aggregating Total Spent
        Map<String, Double> spendingPerCustomer = orders.stream()
            .filter(o -> "COMPLETED".equals(o.status()))
            .collect(Collectors.groupingBy(
                Order::customerId,
                Collectors.summingDouble(Order::amount)
            ));

        System.out.println("Spending per customer: " + spendingPerCustomer);
    }
}
```

---

## ৫. Lazy Evaluation ও Short-Circuiting

স্ট্রিম অপারেশনের সবচেয়ে বড় সুবিধা হলো **Lazy Evaluation**। টার্মিনাল অপারেশন কল না হওয়া পর্যন্ত কোনো ইন্টারমিডিয়েট অপারেশন এক্সিকিউট হয় না।

```java
import java.util.List;

public class LazyEvaluationDemo {
    public static void main(String[] args) {
        List<String> names = List.of("Alice", "Bob", "Charlie", "David", "Eve");

        String result = names.stream()
            .filter(name -> {
                System.out.println("Filter evaluated for: " + name);
                return name.length() > 3;
            })
            .map(name -> {
                System.out.println("Map transformed: " + name);
                return name.toUpperCase();
            })
            // findFirst() is short-circuiting: stops processing as soon as 1 match is found
            .findFirst()
            .orElse("NONE");

        System.out.println("Final Result: " + result);
    }
}
```

### কনসোল আউটপুট বিশ্লেষণ:
```
Filter evaluated for: Alice
Map transformed: Alice
Final Result: ALICE
```
এখানে লক্ষ্য করুন: "Bob", "Charlie", "David" কোনোটির জন্যই ফিল্টার বা ম্যাপ রান হয়নি! কারণ `findFirst()` প্রথম ম্যাচ পাওয়ার সাথে সাথেই পাইপলাইন শর্ট-সার্কিট (বন্ধ) করে দেয়।

---

## ৬. Parallel Streams ও এর ঝুঁকি

`collection.parallelStream()` ব্যবহার করে জাভার ডিফল্ট `ForkJoinPool.commonPool()` দিয়ে ডেটা সমান্তরালে প্রসেস করা যায়। তবে এটি অসতর্কভাবে ব্যবহার করলে বিপজ্জনক হতে পারে।

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.IntStream;

public class ParallelStreamPitfall {

    public static void main(String[] args) {
        // ❌ RACE CONDITION: ArrayList is not thread-safe!
        List<Integer> unsafeList = new ArrayList<>();
        IntStream.range(0, 1000).parallel().forEach(unsafeList::add);
        System.out.println("Expected: 1000, Actual: " + unsafeList.size()); // Flaky, less than 1000 or throws ArrayIndexOutOfBoundsException

        // ✅ SAFE: Use Collectors or Thread-Safe structures
        List<Integer> safeList = IntStream.range(0, 1000)
            .parallel()
            .boxed()
            .collect(Collectors.toList());
        System.out.println("Safe collected size: " + safeList.size()); // Always 1000
    }
}
```

### কখন Parallel Streams ব্যবহার করবেন:
- ডেটাসেট অনেক বড় (যেমন: ১০,০০০+ এলিমেন্ট)।
- প্রতিটি উপাদানের ক্যালকুলেশন হেভি (CPU-intensive)।
- কোনো স্টেটফুল বা সাইড-ইফেক্ট লজিক নেই।
- I/O বা ব্লকিং অপারেশনের ক্ষেত্রে কখনো Parallel Streams ব্যবহার করবেন না (কমন পুল ব্লক হয়ে পুরো অ্যাপ স্লো হয়ে যাবে)।
