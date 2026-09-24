# Design Patterns ও Clean Code Best Practices

জাভাতে ক্লিন কোড এবং আর্কিটেকচারাল প্যাটার্ন জানা একজন জুনিয়র প্রোগ্রামার এবং একজন সিনিয়র আর্কিটেক্টের মধ্যে পার্থক্য গড়ে দেয়। জোশুয়া ব্লকের বিশ্বখ্যাত বই *Effective Java* এবং ক্লাসিকাল SOLID প্রিন্সিপাল আধুনিক জাভা ডেভেলপমেন্টের মূল ভিত্তি।

---

## ১. SOLID Principles in Java

```
┌──────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Principle                        │ Java Enterprise Implementation                         │
├──────────────────────────────────┼────────────────────────────────────────────────────────┤
│ **S**ingle Responsibility (SRP)  │ ক্লাস একটি নির্দিষ্ট কাজের জন্য দায়ী থাকবে (Service/Repo)│
│ **O**pen/Closed (OCP)            │ এক্সটেনশনের জন্য উন্মুক্ত, মডিফিকেশনের জন্য বন্ধ         │
│ **L**iskov Substitution (LSP)    │ সাবক্লাস যেন সুপারক্লাসের আচরণ নষ্ট না করে              │
│ **I**nterface Segregation (ISP)  │ বিশালাকার ইন্টারফেস ভেঙে ছোট স্পেসিফিক ইন্টারফেসে রূপান্তর│
│ **D**ependency Inversion (DIP)   │ কনক্রিট ক্লাসে ডিপেন্ড না করে ইন্টারফেসে ডিপেন্ড করা (DI)│
└──────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## ২. আধুনিক জাভায় ডিজাইন প্যাটার্ন

### ১. Singleton Pattern: The Enum Approach
জোশুয়া ব্লকের মতে জাভাতে থ্রেড-সেফ এবং সিরিয়ালাইজেশন-প্রুফ সিঙ্গেলটন তৈরির একমাত্র সেরা উপায় হলো **Enum Singleton**:

```java
// Thread-safe, reflection-proof, and serialization-safe singleton
public enum DatabaseConnectionPool {
    INSTANCE;

    private final String connectionUrl;

    DatabaseConnectionPool() {
        this.connectionUrl = "jdbc:postgresql://cluster.production:5432/main";
        System.out.println("Connection pool initialized once.");
    }

    public void executeQuery(String sql) {
        System.out.println("Executing query on pool: " + sql);
    }
}
```

### ২. Builder Pattern: ফ্লেক্সিবল অবজেক্ট ক্রিয়েশন
অনেকগুলো ফিল্ড এবং অপশনাল প্যারামিটার থাকলে টেলিস্কোপিং কনস্ট্রাক্টরের ঝামেলা এড়াতে বিল্ডার প্যাটার্ন ব্যবহার করা হয়:

```java
public final class EmailMessage {
    private final String recipient;
    private final String subject;
    private final String body;
    private final boolean isHtml;

    private EmailMessage(Builder builder) {
        this.recipient = builder.recipient;
        this.subject = builder.subject;
        this.body = builder.body;
        this.isHtml = builder.isHtml;
    }

    public static class Builder {
        private final String recipient; // Required field
        private String subject = "No Subject"; // Default
        private String body = "";
        private boolean isHtml = false;

        public Builder(String recipient) {
            this.recipient = Objects.requireNonNull(recipient, "Recipient must not be null");
        }

        public Builder subject(String subject) {
            this.subject = subject;
            return this;
        }

        public Builder body(String body) {
            this.body = body;
            return this;
        }

        public Builder asHtml(boolean isHtml) {
            this.isHtml = isHtml;
            return this;
        }

        public EmailMessage build() {
            return new EmailMessage(this);
        }
    }
}
```

### ৩. Strategy Pattern with Modern Lambdas
আধুনিক জাভায় স্ট্র্যাটেজি প্যাটার্নের জন্য বড় বড় ক্লাস তৈরি না করে সরাসরি ফাংশনাল ইন্টারফেস ও ল্যাম্বডা ব্যবহার করা যায়:

```java
import java.util.Map;
import java.util.function.DoubleUnaryOperator;

public class PricingEngine {

    // Strategies defined as pure lambdas!
    private static final Map<String, DoubleUnaryOperator> DISCOUNT_STRATEGIES = Map.of(
        "REGULAR", price -> price,
        "PREMIUM", price -> price * 0.90, // 10% discount
        "VIP",     price -> price * 0.80  // 20% discount
    );

    public static double calculatePrice(double basePrice, String customerTier) {
        DoubleUnaryOperator strategy = DISCOUNT_STRATEGIES.getOrDefault(customerTier, price -> price);
        return strategy.applyAsDouble(basePrice);
    }
}
```

---

## ৩. *Effective Java* সেরা অনুশীলনসমূহ

### ১. কখনো কালেকশন বা অ্যারের পরিবর্তে `null` রিটার্ন করবেন না
```java
// ❌ মারাত্মক ভুল: কলারকে প্রতিবার নাল চেক করতে বাধ্য করে
public List<Order> getOrders(String userId) {
    if (orders.isEmpty()) return null;
    return orders;
}

// ✅ সঠিক: খালি কালেকশন রিটার্ন করুন
public List<Order> getOrders(String userId) {
    if (orders.isEmpty()) return Collections.emptyList(); // Immutable empty list
    return Collections.unmodifiableList(orders);
}
```

### ২. ইনহেরিটেন্সের চেয়ে কম্পোজিশন প্রিফার করুন (Favor Composition over Inheritance)
সুপারক্লাসের মেথড ওভাররাইড করলে ইন্টারনাল ইমপ্লিমেন্টেশন পরিবর্তনের সাথে সাবক্লাসের আচরণ ভেঙে পড়তে পারে (Fragile Base Class Problem)। র‍্যাপার ক্লাস ও কম্পোজিশন কোডকে অনেক বেশি মজবুত ও স্বাধীন রাখে।

### ৩. ইমিউটেবিলিটি (Immutability) গ্রহণ করুন
- ডেটা ক্লাসগুলোর ক্ষেত্রে জাভা ১৬+ **Records** ব্যবহার করুন।
- ফিল্ডগুলোকে সর্বদা `private final` রাখুন।
- আনমডিফায়েবল কালেকশন (`List.of()`, `Set.copyOf()`) ব্যবহার করুন। ইমিউটেবল অবজেক্ট জন্মগতভাবেই থ্রেড-সেফ এবং ক্যাশিংয়ের জন্য সম্পূর্ণ নিরাপদ।

### ৪. ডিটারমিনিস্টিক ভ্যালিডেশন: Eager Argument Validation
মেথডের শুরুতে `Objects.requireNonNull()` বা প্রি-কন্ডিশন চেক করুন:

```java
public void transferMoney(Account source, Account target, double amount) {
    Objects.requireNonNull(source, "Source account cannot be null");
    Objects.requireNonNull(target, "Target account cannot be null");
    if (amount <= 0) {
        throw new IllegalArgumentException("Transfer amount must be positive, given: " + amount);
    }
    // Safe business execution
}
```
