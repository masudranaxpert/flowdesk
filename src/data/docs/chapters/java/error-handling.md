# Error Handling ও Exception Architecture

জাভাতে এরর হ্যান্ডলিং একটি অত্যন্ত শক্তিশালী ও সুসংগঠিত object-ওরিয়েন্টেড আর্কিটেকচারের ওপর প্রতিষ্ঠিত। runtime-এ কোনো অপ্রত্যাশিত ঘটনা ঘটলে প্রোগ্রামের স্বাভাবিক এক্সিকিউশন ফ্লো যাতে বিঘ্নিত না হয়ে গ্রেসফুলি হ্যান্ডল করা যায়, সে জন্য জাভার `Throwable` হায়ারার্কি ডিজাইন করা হয়েছে।

---

## ১. Throwable Hierarchy: Error vs Exception

জাভাতে সব ধরণের এরর এবং এক্সেপশনের রুট class হলো `java.lang.Throwable`। এর দুটি প্রধান শাখা রয়েছে:

```
                  ┌────────────────────────┐
                  │ java.lang.Throwable    │
                  └───────────┬────────────┘
                              │
             ┌────────────────┴────────────────┐
             │                                 │
  ┌──────────▼──────────┐           ┌──────────▼──────────┐
  │  java.lang.Error    │           │ java.lang.Exception │
  └──────────┬──────────┘           └──────────┬──────────┘
             │                                 │
     ┌───────┴───────┐                 ┌───────┴──────────────┐
     │ OutOfMemory   │                 │                      │
     │ StackOverflow │      ┌──────────▼───────────┐   ┌──────▼────────────┐
     └───────────────┘      │   RuntimeException   │   │ Checked Exceptions│
                            │     (Unchecked)      │   │   (IOException,   │
                            └──────────┬───────────┘   │   SQLException)   │
                                       │               └───────────────────┘
                               ┌───────┴──────────────┐
                               │ NullPointerException │
                               │ ArithmeticException  │
                               │ IndexOutOfBounds     │
                               └──────────────────────┘
```

### প্রধান পার্থক্য:

| বৈশিষ্ট্য | `java.lang.Error` | `Checked Exception` | `Unchecked Exception` (RuntimeException) |
| :--- | :--- | :--- | :--- |
| **উৎস** | JVM লেভেলের গুরুতর ব্যর্থতা | এক্সটার্নাল ফ্যাক্টর (ফাইল, নেটওয়ার্ক) | প্রোগ্রামারের লজিক্যাল ভুল বা বাগ |
| **compiler চেক** | আনচেকড (compiler চেক করে না) | compile-time-এ বাধ্যতামূলক চেকিং | compiler বাধ্য করে না |
| **রিকভারিবিলিটি** | সাধারণত রিকভার করা অসম্ভব | এপ্লিকেশন হ্যান্ডল করে রিকভার করতে পারে | কোড ফিক্স বা ভ্যালিডেশন দিয়ে প্রিভেন্ট করা উচিত |
| **উদাহরণ** | `OutOfMemoryError`, `StackOverflowError` | `IOException`, `SQLException` | `NullPointerException`, `IllegalArgumentException` |

> [!WARNING]
> কখনো `catch (Error e)` বা `catch (Throwable t)` সাধারণ অ্যাপ্লিকেশন কোডে ব্যবহার করবেন না। JVM লেভেলের memory ফেইলিউর বা thread ডেথ রিকভার করার চেষ্টা করলে সিস্টেম আরও বড় বিপর্যয়ের মুখে পড়তে পারে।

---

## ২. Try, Catch, Finally ও Return এর আচরণ

```java
public class ExceptionFlowDemo {

    public static int parseAndDivide(String input, int divisor) {
        try {
            System.out.println("Executing try block");
            int value = Integer.parseInt(input);
            return value / divisor;
        } catch (NumberFormatException e) {
            System.err.println("Invalid number format: " + e.getMessage());
            return -1;
        } catch (ArithmeticException e) {
            System.err.println("Cannot divide by zero: " + e.getMessage());
            return -2;
        } finally {
            // Always executes, regardless of exception or return in try/catch
            System.out.println("Executing finally cleanup");
        }
    }

    public static void main(String[] args) {
        System.out.println("Result 1: " + parseAndDivide("100", 2));
        System.out.println("---");
        System.out.println("Result 2: " + parseAndDivide("abc", 2));
        System.out.println("---");
        System.out.println("Result 3: " + parseAndDivide("50", 0));
    }
}
```

### কোড বিশ্লেষণ:
1. `try` ব্লকে রিস্কি অপারেশনগুলো থাকে। এখানে দুটি পটেনশিয়াল এক্সেপশন হতে পারে: string কনভার্সনে `NumberFormatException` এবং ভাগ করার সময় `ArithmeticException`।
2. `catch` ব্লক সুনির্দিষ্ট এক্সেপশন ধরে। একাধিক ক্যাচ ব্লকের ক্ষেত্রে বেশি স্পেসিফিক সাবক্লাস প্রথমে এবং জেনেরিক সুপারক্লাস পরে দিতে হয়।
3. `finally` ব্লক রিটার্ন স্টেটমেন্টের আগেই রান করে। যদি `try` ব্লকে `return 50;` থাকে, তাও JVM আগে `finally` এক্সিকিউট করে তারপর ভ্যালু রিটার্ন করে।

> [!CAUTION]
> `finally` ব্লকের ভেতরে কখনো এক্সপ্লিসিট `return` স্টেটমেন্ট ব্যবহার করবেন না। `finally`-এর রিটার্ন স্টেটমেন্ট `try` বা `catch` ব্লকের রিটার্ন ভ্যালু এমনকি নিক্ষেপ করা এক্সেপশনও সাপ্রেস (মুছে) ফেলে।

---

## ৩. Try-With-Resources ও AutoCloseable

জাভা ৭-এ পরিচিতি পাওয়া **Try-with-resources** স্টেটমেন্টটি রিসোর্স লিক পুরোপুরি দূর করে। যে সমস্ত class `java.lang.AutoCloseable` অথবা `java.io.Closeable` interface ইমপ্লিমেন্ট করে, সেগুলোকে ব্র্যাকেটের ভেতরে ইনিশিয়ালাইজ করলে ব্লক শেষে JVM স্বয়ংক্রিয়ভাবে `close()` method ইনভোক করে।

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class ResourceManagementDemo {

    // Custom resource implementing AutoCloseable
    static final class DatabaseConnection implements AutoCloseable {
        private final String connectionString;

        public DatabaseConnection(String connectionString) {
            this.connectionString = connectionString;
            System.out.println("Connection opened to: " + connectionString);
        }

        public void executeQuery(String sql) {
            System.out.println("Running query: " + sql);
        }

        @Override
        public void close() {
            System.out.println("Closing connection to: " + connectionString);
        }
    }

    public static void main(String[] args) {
        // Try-with-resources handles multiple resources in reverse declaration order
        try (DatabaseConnection db = new DatabaseConnection("jdbc:postgres://localhost:5432/app");
             BufferedReader reader = new BufferedReader(new FileReader("config.txt"))) {
            
            db.executeQuery("SELECT * FROM users");
            String line = reader.readLine();
            System.out.println("Config line: " + line);

        } catch (IOException e) {
            System.err.println("File I/O error occurred: " + e.getMessage());
        }
        // Both db and reader are guaranteed to be closed here automatically!
    }
}
```

### Suppressed Exceptions:
যখন `try` ব্লকে এক্সেপশন ঘটে এবং স্বয়ংক্রিয়ভাবে `close()` রান করার সময়ও আরেকটি এক্সেপশন ঘটে, তখন মূল এক্সেপশনটি অগ্রাধিকার পায় এবং ক্লোজিংয়ের এররটি **Suppressed Exception** হিসেবে যুক্ত হয়। এটি `e.getSuppressed()` দিয়ে উদ্ধার করা যায়।

---

## ৪. Multi-Catch ও Exception Rethrowing

জাভা ৭ থেকে একাধিক অসংশ্লিষ্ট (disjoint) এক্সেপশনকে একটি ক্যাচ ব্লকে পাইপ (`|`) সাইন দিয়ে হ্যান্ডল করা যায়:

```java
import java.io.IOException;
import java.sql.SQLException;

public class MultiCatchDemo {

    public void processData(String source) throws IOException, SQLException {
        try {
            if ("db".equals(source)) {
                throw new SQLException("Database connection timeout");
            } else {
                throw new IOException("Unable to read remote file");
            }
        } catch (IOException | SQLException ex) {
            // In multi-catch, 'ex' is implicitly final
            System.err.println("Data processing failed: " + ex.getMessage());
            // Rethrowing the original exception
            throw ex;
        }
    }
}
```

> [!NOTE]
> Multi-catch ক্লজে parameter variable-টি (`ex`) ডিফল্টভাবে `final` থাকে। আপনি `ex = new IOException();` দিয়ে এটিকে পুনরায় অ্যাসাইন করতে পারবেন না।

---

## ৫. Custom Exception ও Exception Chaining

এন্টারপ্রাইজ অ্যাপ্লিকেশনে ডোমেন স্পেসিফিক এক্সেপশন তৈরি করা স্ট্যান্ডার্ড প্র্যাকটিস। এর মাধ্যমে কারিগরি লো-লেভেল এররকে (যেমন `SQLException`) একটি বিজনেস-লেভেল এক্সেপশনে র্যাপ (Wrap) করে থ্রো করা যায়। একে **Exception Chaining** বলে।

```java
// Custom unchecked business exception
public class OrderProcessingException extends RuntimeException {

    private final String orderId;

    public OrderProcessingException(String message, String orderId) {
        super(message);
        this.orderId = orderId;
    }

    // Constructor with root cause for exception chaining
    public OrderProcessingException(String message, String orderId, Throwable cause) {
        super(message, cause);
        this.orderId = orderId;
    }

    public String getOrderId() {
        return orderId;
    }
}
```

### চেইনিংয়ের ব্যবহারিক প্রয়োগ:

```java
public class PaymentGatewayService {

    public void chargeCard(String orderId, double amount) {
        try {
            // Simulating a low-level network failure
            connectToTerminal();
        } catch (java.net.ConnectException ex) {
            // Preserving original cause with exception chaining
            throw new OrderProcessingException("Payment gateway unreachable for order", orderId, ex);
        }
    }

    private void connectToTerminal() throws java.net.ConnectException {
        throw new java.net.ConnectException("Connection refused: 192.168.1.100:443");
    }

    public static void main(String[] args) {
        PaymentGatewayService service = new PaymentGatewayService();
        try {
            service.chargeCard("ORD-98214", 450.00);
        } catch (OrderProcessingException e) {
            System.err.println("Business Error: " + e.getMessage());
            System.err.println("Order Reference: " + e.getOrderId());
            System.err.println("Root Cause: " + e.getCause().getClass().getName() + " - " + e.getCause().getMessage());
            e.printStackTrace();
        }
    }
}
```

---

## ৬. Enterprise Anti-Patterns ও Best Practices

### ১. কখনো এক্সেপশন Swallow (গিলে ফেলা) করবেন না
```java
// Anti-pattern: swallowing exception hides failure root cause without trace
try {
    process();
} catch (Exception e) {
}

// Recommended: log error context or rethrow to upper layer
try {
    process();
} catch (Exception e) {
    logger.error("Processing failed for payload", e);
    throw new ServiceException("Processing failed", e);
}
```

### ২. লগ এবং থ্রো একসাথে করবেন না (Log and Throw Anti-Pattern)
```java
// Anti-pattern: logging and rethrowing causes duplicate logs in stack traces
// Every layer prints redundant error messages
catch (IOException e) {
    logger.error("Failed to read", e);
    throw new ServiceException(e);
}

// Recommended: either handle and log locally, or wrap and rethrow
```

### ৩. সাধারণ ফ্লো কন্ট্রোলের জন্য Exception ব্যবহার করবেন না
Exception তৈরি ও থ্রো করার সময় সম্পূর্ণ Call Stack তৈরি করতে হয় (`fillInStackTrace()`), যা অত্যন্ত এক্সপেনসিভ। কন্ডিশনাল লজিকের ক্ষেত্রে `if/else` বা `Optional` ব্যবহার করুন।
