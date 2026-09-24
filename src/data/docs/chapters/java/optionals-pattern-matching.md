# Modern Features: Optional ও Pattern Matching

জাভাতে `NullPointerException` (NPE) কে বলা হয় স্যার টনি হোয়ারের "The Billion-Dollar Mistake"। আধুনিক জাভায় (Java 8 থেকে Java 21) এই সমস্যা দূর করতে এবং কোডের টাইপ সেফটি বাড়াতে দুটি যুগান্তকারী ফিচার যুক্ত হয়েছে: `Optional<T>` এবং **Pattern Matching**।

---

## ১. `java.util.Optional<T>`: সঠিক ব্যবহার ও ফিলোসফি

`Optional` হলো একটি সিঙ্গেল-ভ্যালু কন্টেইনার, যা একটি নন-নাল অবজেক্ট ধারণ করতে পারে অথবা সম্পূর্ণ খালি (`empty`) থাকতে পারে। এর মূল উদ্দেশ্য হলো মেথডের রিটার্ন টাইপ হিসেবে ব্যবহৃত হয়ে কলারকে স্পষ্টভাবে সতর্ক করা যে মানটি অনুপস্থিত থাকতে পারে।

```java
import java.util.Optional;

public class OptionalDeepDive {

    public record User(String id, String name, String email) {}

    public static Optional<User> findUserById(String id) {
        if ("usr-1".equals(id)) {
            return Optional.of(new User("usr-1", "Rahim", "rahim@example.com"));
        }
        return Optional.empty(); // Return empty instead of null
    }

    public static void main(String[] args) {
        Optional<User> userOpt = findUserById("usr-1");

        // 1. Declarative functional processing
        userOpt.map(User::email)
               .map(String::toLowerCase)
               .ifPresent(email -> System.out.println("Sending email to: " + email));

        // 2. orElse vs orElseGet difference
        // orElse evaluates eagerly (runs computeDefault even if userOpt is present)
        String name1 = userOpt.map(User::name).orElse(computeDefault());

        // orElseGet evaluates lazily (runs computeDefault ONLY if userOpt is empty)
        String name2 = userOpt.map(User::name).orElseGet(OptionalDeepDive::computeDefault);

        System.out.println("Resolved name: " + name2);
    }

    private static String computeDefault() {
        System.out.println("Costly default calculation running...");
        return "Anonymous User";
    }
}
```

### `orElse` বনাম `orElseGet` সূক্ষ্ম পার্থক্য:
- `orElse(new HeavyObject())`: অপশনাল প্রেজেন্ট থাকুক বা না থাকুক, `new HeavyObject()` সর্বদা তাৎক্ষণিকভাবে মেমোরিতে তৈরি হবে।
- `orElseGet(() -> new HeavyObject())`: শুধুমাত্র যখন অপশনাল খালি থাকবে, তখনই ল্যাম্বডা এক্সিকিউট হয়ে অবজেক্ট তৈরি হবে। পারফরম্যান্সের জন্য সর্বদা `orElseGet` প্রিফার করুন।

> [!CAUTION]
> **Optional Anti-Patterns:**
> 1. কখনো `opt.get()` সরাসরি কল করবেন না `isPresent()` চেক না করে (`NoSuchElementException` হতে পারে)।
> 2. ফিল্ড টাইপ বা মেথড প্যারামিটার হিসেবে `Optional` ব্যবহার করবেন না। এটি সিরিয়ালাইজেবল নয় এবং মেমোরি ফুটপ্রিন্ট বাড়ায়।

---

## ২. Pattern Matching for `instanceof` (Java 16+)

ক্লাসিক জাভাতে টাইপ চেক করার পর ম্যানুয়ালি টাইপ কাস্টিং করতে হতো। আধুনিক জাভায় টাইপ প্যাটার্ন ম্যাচিংয়ের মাধ্যমে কাস্টিং স্বয়ংক্রিয় হয়ে গেছে:

```java
public class InstanceOfEvolution {

    // Pre-Java 16: Verbose and error-prone
    public static void processOld(Object obj) {
        if (obj instanceof String) {
            String s = (String) obj; // Redundant manual cast
            System.out.println("Length: " + s.length());
        }
    }

    // Java 16+: Pattern Matching for instanceof
    public static void processModern(Object obj) {
        // Pattern variable 's' is automatically extracted and strongly typed
        if (obj instanceof String s && !s.isBlank()) {
            System.out.println("Modern length: " + s.length());
        } else if (obj instanceof Integer i) {
            System.out.println("Square of number: " + (i * i));
        }
    }
}
```

---

## ৩. Pattern Matching for `switch` (Java 21 LTS)

Java 21-এ `switch` স্টেটমেন্ট এবং এক্সপ্রেশন শুধু প্রিমিটিভ ও স্ট্রিং নয়, যেকোনো অবজেক্ট টাইপের উপর প্যাটার্ন ম্যাচ করতে পারে এবং সাথে গার্ড ক্লজ (`when`) সাপোর্ট করে।

```java
public class SwitchPatternMatching {

    sealed interface PaymentMethod permits CreditCard, Bkash, BankTransfer {}
    record CreditCard(String cardNumber, double limit) implements PaymentMethod {}
    record Bkash(String mobileNumber, boolean isMerchant) implements PaymentMethod {}
    record BankTransfer(String iban, String swiftCode) implements PaymentMethod {}

    public static String processPayment(PaymentMethod payment, double amount) {
        return switch (payment) {
            // Guard clause using 'when'
            case CreditCard cc when amount > cc.limit() -> 
                "Declined: Transaction exceeds credit card limit of " + cc.limit();
                
            case CreditCard cc -> 
                "Processed $" + amount + " via Credit Card ending in " + cc.cardNumber().substring(12);

            case Bkash bk when bk.isMerchant() -> 
                "Merchant Bkash payment received from: " + bk.mobileNumber();

            case Bkash bk -> 
                "Personal Bkash transfer received from: " + bk.mobileNumber();

            case BankTransfer bt -> 
                "Bank wire scheduled for IBAN: " + bt.iban();

            // Direct null handling inside switch!
            case null -> "Payment method cannot be null!";
        };
    }
}
```

### প্রধান সুবিধাসমূহ:
1. **Exhaustiveness**: `PaymentMethod` যেহেতু একটি `sealed interface`, কম্পাইলার নিশ্চিত করে সব সাবটাইপ কাভার করা হয়েছে কিনা। তাই কোনো `default` ব্রাঞ্চের প্রয়োজন পড়ে না।
2. **First-class Null Support**: আগে সুইচে `null` পাস করলে সাথে সাথে `NullPointerException` দিত; এখন `case null` দিয়ে গ্রেসফুলি হ্যান্ডল করা যায়।

---

## ৪. Record Patterns & Deconstruction (Java 21)

Java 21-এর অন্যতম রোমাঞ্চকর ফিচার হলো **Record Patterns**। এটি কোনো রেকর্ডের ভেতর থেকে তার কম্পোনেন্টগুলোকে সরাসরি ভেঙে (Deconstruct) আলাদা ভেরিয়েবলে বের করে আনে।

```java
public class RecordPatternDemo {

    public record Point(int x, int y) {}
    public record Circle(Point center, int radius) {}
    public record Rectangle(Point topLeft, Point bottomRight) {}

    public static void describeShape(Object shape) {
        switch (shape) {
            // Nested record deconstruction in a single line!
            case Circle(Point(int x, int y), int r) -> 
                System.out.println("Circle at (" + x + ", " + y + ") with radius " + r);

            case Rectangle(Point(int x1, int y1), Point(int x2, int y2)) -> 
                System.out.printf("Rectangle from (%d, %d) to (%d, %d)%n", x1, y1, x2, y2);

            case null, default -> 
                System.out.println("Unknown or invalid shape.");
        }
    }

    public static void main(String[] args) {
        Circle circle = new Circle(new Point(10, 20), 5);
        describeShape(circle);
    }
}
```

> [!TIP]
> Record deconstruction কোডের বয়লারপ্লেট গেটার কল সম্পূর্ণ দূর করে। জটিল নেস্টেড অবজেক্ট গ্রাফ থেকে ডেটা এক্সট্রাক্ট করা এখন এক লাইনেই অত্যন্ত পরিষ্কারভাবে সম্ভব।
