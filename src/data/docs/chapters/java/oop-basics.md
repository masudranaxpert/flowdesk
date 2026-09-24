# OOP এর মূল ভিত্তি — Classes ও Objects

Java হলো একটি খাঁটি অবজেক্ট-ওরিয়েন্টেড ভাষা যেখানে সবকিছু অবজেক্টের ধারণাকে কেন্দ্র করে আবর্তিত হয়। অবজেক্ট-ওরিয়েন্টেড প্রোগ্রামিং (OOP) বাস্তব জীবনের উপাদানসমূহকে (যেমন ইউজার, ব্যাংক অ্যাকাউন্ট, গাড়ি) তাদের বৈশিষ্ট্য (State / Fields) এবং কার্যক্ষমতা (Behavior / Methods) সহ কোডে মডেলিং করার সুযোগ দেয়।

---

## ১. ক্লাস বনাম অবজেক্ট (Blueprint vs Instance)

- **ক্লাস (Class)**: একটি ব্যবহারকারী-সংজ্ঞায়িত ব্লুপ্রিন্ট বা টেমপ্লেট। এটি নির্দেশ করে একটি অবজেক্টে কী কী ফিল্ড এবং মেথড থাকবে।
- **অবজেক্ট (Object)**: ক্লাসের একটি বাস্তব রূপ যা রানটাইমে মেমরিতে তৈরি হয়।

### মেমরি বিশ্লেষণ (Stack vs Heap):
যখন তুমি `BankAccount acc = new BankAccount("Karim", 5000);` লেখো:
1. `new BankAccount(...)`: হিপ (Heap) মেমরিতে অবজেক্টটির জন্য মেমরি বরাদ্দ হয় এবং ফিল্ডগুলো ইনিশিয়ালাইজ হয়।
2. `BankAccount acc`: স্ট্যাক (Stack) মেমরিতে একটি রেফারেন্স ভেরিয়েবল তৈরি হয় যা হিপে থাকা সেই অবজেক্টের মেমরি অ্যাড্রেস ধরে রাখে।

```java
public class BankAccount {
    // 1. Private fields (encapsulated state)
    private String accountNumber;
    private double balance;

    // 2. Parameterized constructor
    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }

    // 3. Instance methods (behavior)
    public void deposit(double amount) {
        if (amount > 0) {
            this.balance += amount;
            System.out.println(amount + " টাকা জমা হয়েছে। বর্তমান ব্যালেন্স: " + this.balance);
        }
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && this.balance >= amount) {
            this.balance -= amount;
            System.out.println(amount + " টাকা উত্তোলন সফল।");
            return true;
        }
        System.out.println("অপর্যাপ্ত ব্যালেন্স বা অবৈধ পরিমাণ!");
        return false;
    }

    // Getter method
    public double getBalance() {
        return this.balance;
    }
}
```

---

## ২. কনস্ট্রাকটর ও `this(...)` চেইনিং

কনস্ট্রাকটর হলো একটি বিশেষ মেথড যার নাম ক্লাসের নামের সাথে হুবহু মিল থাকে এবং এর কোনো রিটার্ন টাইপ থাকে না। অবজেক্ট ইনিশিয়ালাইজ করার সময় এটি স্বয়ংক্রিয়ভাবে কল হয়।

### কনস্ট্রাকটর চেইনিং (Constructor Chaining):
এক কনস্ট্রাকটর থেকে একই ক্লাসের অন্য কনস্ট্রাকটর কল করতে `this(...)` ব্যবহৃত হয়। এটি কোডের পুনরাবৃত্তি (DRY Principle) দূর করে:

```java
public class User {
    private String name;
    private String email;
    private int loyaltyPoints;

    // Default constructor chaining to 3-param constructor
    public User(String name, String email) {
        this(name, email, 0); // Must be the first statement
    }

    // Master constructor
    public User(String name, String email, int loyaltyPoints) {
        this.name = name;
        this.email = email;
        this.loyaltyPoints = loyaltyPoints;
    }
}
```

> [!important]
> `this(...)` কল সর্বদা কনস্ট্রাকটরের প্রথম লাইনে থাকতে হয়। যদি তুমি কোনো কাস্টম কনস্ট্রাকটর না লেখো, তবে Java কম্পাইলার নিজে থেকে একটি শূন্য-প্যারামিটারের ডিফল্ট কনস্ট্রাকটর প্রদান করে। কিন্তু একবার কোনো কাস্টম কনস্ট্রাকটর লিখলে কম্পাইলারের ডিফল্ট কনস্ট্রাকটর স্বয়ংক্রিয়ভাবে বাতিল হয়ে যায়।

---

## ৩. এক্সেস মডিফায়ার ম্যাট্রিক্স (Access Modifiers)

Java-তে চারটি ভিজিবিলিটি লেভেল রয়েছে:

| Modifier | একই ক্লাস | একই প্যাকেজ | সাব-ক্লাস (অন্য প্যাকেজ) | বৈশ্বিক বিশ্ব (যেখানে সেখানে) |
| :--- | :---: | :---: | :---: | :---: |
| `private` | Yes | No | No | No |
| *(default / package-private)* | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes (Inheritance দ্বারা) | No |
| `public` | Yes | Yes | Yes | Yes |

---

## ৪. স্ট্যাটিক বনাম ইনস্ট্যান্স মেম্বার (Static vs Instance)

- **ইনস্ট্যান্স মেম্বার**: প্রতিটি অবজেক্টের জন্য মেমরিতে আলাদা কপি তৈরি হয়।
- **স্ট্যাটিক মেম্বার**: সম্পূর্ণ ক্লাসের জন্য মেমরিতে একটিমাত্র কপি থাকে, যা সমস্ত অবজেক্ট শেয়ার করে। ক্লাসের নাম দিয়ে সরাসরি এক্সেস করা যায় (`ClassName.method()`)।

```java
public class Counter {
    // Shared among all instances in Metaspace/Class area
    public static int totalInstances = 0;

    // Unique per instance on Heap
    public int instanceId;

    public Counter() {
        totalInstances++;
        this.instanceId = totalInstances;
    }

    // Static utility method
    public static void displayGlobalCount() {
        System.out.println("মোট তৈরি হয়েছে: " + totalInstances);
        // Note: static মেথড থেকে সরাসরি instance field (this.instanceId) এক্সেস করা অবৈধ!
    }
}
```

### স্ট্যাটিক ইনিশিয়ালাইজেশন ব্লক (`static { ... }`):
ক্লাসটি যখন JVM-এ প্রথমবার লোড হয়, তখন জটিল কনফিগারেশন বা ড্রাইভার ইনিশিয়ালাইজ করতে স্ট্যাটিক ব্লক একবার রান করে:
```java
static {
    // Runs only once when class is loaded into memory
    System.out.println("ক্লাস মেমরিতে লোড হয়েছে।");
}
```

---

## ৫. এনক্যাপসুলেশন (Encapsulation)

এনক্যাপসুলেশন হলো অবজেক্টের অভ্যন্তরীণ স্টেটকে সরাসরি বাহ্যিক পরিবর্তন থেকে গোপন রাখা এবং শুধুমাত্র নিয়ন্ত্রিত পাবলিক মেথডের (Getters & Setters) মাধ্যমে প্রবেশাধিকার প্রদান করা।

```java
public class Employee {
    private double salary;

    public double getSalary() {
        return this.salary;
    }

    public void setSalary(double salary) {
        if (salary >= 0) {
            this.salary = salary;
        } else {
            throw new IllegalArgumentException("বেতন ঋণাত্মক হতে পারে না!");
        }
    }
}
```

---

## সারসংক্ষেপ

- ক্লাস হলো ডেটা ও লজিকের ব্লুপ্রিন্ট, অবজেক্ট হলো হিপ মেমরিতে থাকা তার জীবন্ত ইনস্ট্যান্স।
- কনস্ট্রাকটর ইনিশিয়ালাইজেশনের কাজ করে এবং `this(...)` দিয়ে চেইনিং করা যায়।
- ফিল্ড সর্বদা `private` রেখে এনক্যাপসুলেশন বজায় রাখা পেশাদার কোডের নিয়ম।
- `static` মেম্বার সমস্ত অবজেক্টের মাঝে শেয়ার্ড থাকে এবং ক্লাসের নামে অ্যাক্সেস হয়।
- পরবর্তী অধ্যায়ে আমরা শিখব Inheritance ও Polymorphism — কোড রিইউজ ও ডায়নামিক ডিসপ্যাচ।
