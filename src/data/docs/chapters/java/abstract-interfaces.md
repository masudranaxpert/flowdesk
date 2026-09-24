# Abstract Classes ও Interfaces

সফটওয়্যার ইঞ্জিনিয়ারিংয়ে অ্যাবস্ট্রাকশন (Abstraction) হলো অপ্রয়োজনীয় বাস্তবায়ন বা জটিলতা আড়াল করে কেবল প্রয়োজনীয় চুক্তি বা ইন্টারফেস প্রকাশ করা। Java-তে চুক্তিভিত্তিক আর্কিটেকচার গড়ে তোলার জন্য দুটি প্রধান হাতিয়ার রয়েছে: **অ্যাবস্ট্রাক্ট ক্লাস (Abstract Class)** এবং **ইন্টারফেস (Interface)**।

---

## ১. Abstract Class — অসম্পূর্ণ ব্লুপ্রিন্ট

অ্যাবস্ট্রাক্ট ক্লাস হলো এমন একটি ক্লাস যার সরাসরি কোনো অবজেক্ট (`new`) তৈরি করা যায় না। এটি সাধারণ ক্লাসের মতো স্টেট (ফিল্ড) ও পূর্ণাঙ্গ মেথড ধারণ করতে পারে, সাথে কিছু মেথডকে অসম্পূর্ণ (`abstract`) রেখে চাইল্ড ক্লাসকে তা বাস্তবায়ন করতে বাধ্য করে:

```java
// Abstract base class
public abstract class PaymentProcessor {
    protected String transactionId;

    // Abstract classes can have constructors
    public PaymentProcessor(String transactionId) {
        this.transactionId = transactionId;
    }

    // Concrete method shared by all processors
    public void logTransaction() {
        System.out.println("অডিট লগ: ট্রানজ্যাকশন আইডি " + transactionId);
    }

    // Abstract method: MUST be implemented by subclasses
    public abstract boolean processPayment(double amount);
}
```

```java
public class BkashPayment extends PaymentProcessor {
    private String mobileNumber;

    public BkashPayment(String transactionId, String mobileNumber) {
        super(transactionId);
        this.mobileNumber = mobileNumber;
    }

    @Override
    public boolean processPayment(double amount) {
        System.out.println("বিকাশ অ্যাকাউন্ট " + mobileNumber + " থেকে " + amount + " টাকা পেমেন্ট সম্পন্ন।");
        return true;
    }
}
```

---

## ২. Interface — আচরণের খাঁটি চুক্তি

ইন্টারফেস হলো মেথডের একটি বিশুদ্ধ চুক্তি — "কোনো ক্লাস কী কী কাজ করতে পারবে"। এটি কোনো ইনস্ট্যান্স স্টেট ধরে রাখে না:

```java
public interface Drivable {
    // All fields are implicitly: public static final
    int MAX_SPEED = 180;

    // Abstract method (implicitly: public abstract)
    void startEngine();
    void accelerate(int speed);
}
```

---

## ৩. ইন্টারফেসের বিবর্তন (Java 8 এবং Java 9)

পূর্বে ইন্টারফেসে কোনো মেথডের বডি থাকা নিষিদ্ধ ছিল। কিন্তু আধুনিক Java-তে ইন্টারফেস অত্যন্ত শক্তিশালী:

### ক. Default Methods (Java 8):
বিদ্যমান ক্লায়েন্ট কোড না ভেঙে ইন্টারফেসে নতুন মেথড যোগ করতে `default` মেথড আনা হয় (যেমন Java Collections-এ `stream()` মেথড যোগ করার জন্য):

```java
public interface Vehicle {
    void drive();

    // Default method with fallback implementation
    default void stop() {
        System.out.println("যানবাহনটি ব্রেক চেপে থেমে গেছে।");
    }
}
```

### খ. Static Methods (Java 8):
ইউটিলিটি বা ফ্যাক্টরি মেথড সরাসরি ইন্টারফেসে রাখতে:
```java
public interface Formatter {
    static String clean(String text) {
        return text.trim().toLowerCase();
    }
}
```

### গ. Private Methods (Java 9):
একাধিক ডিফল্ট মেথডের কমন কোড ডুপ্লিকেশন কমাতে ইন্টারফেসে প্রাইভেট মেথড লেখা যায়:
```java
public interface Logger {
    default void logInfo(String msg) { log("INFO", msg); }
    default void logError(String msg) { log("ERROR", msg); }

    // Private helper method inside interface
    private void log(String level, String msg) {
        System.out.println("[" + level + "] " + msg);
    }
}
```

---

## ৪. মাল্টিপল ইন্টারফেস বাস্তবায়ন (Multiple Inheritance of Type)

Java-তে একাধিক ক্লাস ইনহেরিট করা নিষিদ্ধ হলেও, একটি ক্লাস যত ইচ্ছা ততগুলো ইন্টারফেস `implements` করতে পারে:

```java
public class Smartphone implements Camera, GPS, Phone {
    @Override public void takePhoto() { /* ... */ }
    @Override public void locateCoordinates() { /* ... */ }
    @Override public void makeCall(String number) { /* ... */ }
}
```

### ডিফল্ট মেথড কনফ্লিক্ট সমাধান:
যদি দুটি ইন্টারফেসে একই নামের `default` মেথড থাকে, তবে ইমপ্লিমেন্টিং ক্লাসকে অবশ্যই মেথডটি ওভাররাইড করে স্পষ্টভাবে বলতে হবে সে কারটা ব্যবহার করবে:
```java
@Override
public void display() {
    InterfaceA.super.display(); // Explicitly resolve conflict
}
```

---

## ৫. Functional Interface ও `@FunctionalInterface`

যে ইন্টারফেসে **একটিমাত্র অ্যাবস্ট্রাক্ট মেথড** (Single Abstract Method বা SAM) থাকে, তাকে ফাংশনাল ইন্টারফেস বলে। এটি ল্যাম্বডা এক্সপ্রেশনের ভিত্তি:

```java
@FunctionalInterface
public interface Validator<T> {
    boolean validate(T value);
    // Object ক্লাসের মেথড বা default/static মেথড থাকতে পারে, কিন্তু abstract মেথড মাত্র ১টি!
}
```

---

## ৬. Abstract Class বনাম Interface — সিদ্ধান্ত ম্যাট্রিক্স

| বৈশিষ্ট্য | Abstract Class | Interface |
| :--- | :--- | :--- |
| **গতি ও সম্পর্ক** | "is-a" সম্পর্ক (Dog is an Animal) | "can-do" সম্পর্ক (Plane can Fly) |
| **মাল্টিপল ইনহেরিটেন্স** | না, মাত্র একটি ক্লাস extends করা যায় | **হ্যাঁ, একাধিক ইন্টারফেস implements করা যায়** |
| **ইনস্ট্যান্স ফিল্ড (State)**| হ্যাঁ, non-static, non-final ফিল্ড রাখা যায় | না, কেবল `public static final` কনস্ট্যান্ট |
| **কনস্ট্রাকটর** | হ্যাঁ, কনস্ট্রাকটর থাকতে পারে | না, কোনো কনস্ট্রাকটর থাকতে পারে না |
| **ব্যবহারের সেরা ক্ষেত্র** | চাইল্ডদের মাঝে স্টেট ও বেস কোড শেয়ার করতে | সম্পূর্ণ অসম্পর্কিত ক্লাসের আচরণ সংজ্ঞায়িত করতে |

---

## সারসংক্ষেপ

- অ্যাবস্ট্রাক্ট ক্লাস স্টেট ও বেস লজিক শেয়ার করে ("is-a" রিলেশন)।
- ইন্টারফেস খাঁটি আচরণ ও মেথড চুক্তি নির্ধারণ করে ("can-do" রিলেশন)।
- Java 8+ ইন্টারফেসে `default`, `static` এবং Java 9 এ `private` মেথড সমর্থন করে।
- ফাংশনাল ইন্টারফেসে ঠিক একটিমাত্র অ্যাবস্ট্রাক্ট মেথড থাকে যা ল্যাম্বডার জন্য প্রযোজ্য।
- পরবর্তী অধ্যায়ে আমরা শিখব আধুনিক ডেটা মডেলিং — Records ও Sealed Classes।
