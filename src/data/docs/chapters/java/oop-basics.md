# OOP এর মূল ভিত্তি — Classes, Objects ও কোর ফান্ডামেন্টালস

জাভা একটি অবজেক্ট-ওরিয়েন্টেড ভাষা যেখানে সবকিছু অবজেক্ট ও ক্লাসের ধারণাকে কেন্দ্র করে ডিজাইন করা হয়েছে। বাস্তব জীবনের উপাদানসমূহকে (যেমন ইউজার, ব্যাংক অ্যাকাউন্ট, ইনভেন্টরি আইটেম) তাদের বৈশিষ্ট্য (State / Fields) এবং কার্যক্ষমতা (Behavior / Methods) সহ কোডে মডেলিং করাই Object-Oriented Programming (OOP)-এর মূল উদ্দেশ্য।

---

## ১. Two Paradigms in OOP (Code বনাম Data)

কম্পিউটার বিজ্ঞানে সমস্ত প্রোগ্রাম মূলত দুটি মৌলিক উপাদানের ওপর দাঁড়িয়ে থাকে: **কোড (লজিক/ফাংশন)** এবং **ডেটা (স্টেট)**। এই দুটি উপাদানের সংগঠনের ওপর ভিত্তি করে প্রোগ্রামিংকে দুটি প্যারাডাইমে ভাগ করা হয়:

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│  Procedural / Structured Paradigm    │      Object-Oriented Paradigm        │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ "What is happening" কেন্দ্রিক        │ "Who is being affected" কেন্দ্রিক    │
│ কোড বা ফাংশন মুখ্য, ডেটা গৌণ         │ ডেটা ও তার ওপর পরিচালিত কোড একীভূত  │
│ গ্লোবাল ডেটা অরক্ষিত ও যেকোনো জায়গা  │ ডেটা এনক্যাপসুলেশনের মাধ্যমে ক্লাসে │
│ থেকে মডিফাই হতে পারে                 │ সম্পূর্ণ সুরক্ষিত থাকে              │
│ উদাহরণ: C, Pascal, Fortran           │ উদাহরণ: Java, C++, C#               │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

OOP প্যারাডাইমে ডেটা থাকে সিস্টেমের কেন্দ্রে এবং মেথডগুলো সেই ডেটাকে সুরক্ষিত বাউন্ডারির ভেতরে নিয়ন্ত্রণ করে।

---

## ২. ক্লাস বনাম অবজেক্ট (Blueprint vs Instance)

- **ক্লাস (Class)**: একটি ইউজার-ডিফাইন্ড ব্লুপ্রিন্ট বা টেমপ্লেট। এটি নির্দেশ করে একটি অবজেক্টে কী কী ফিল্ড (ডেটা) এবং মেথড (লজিক) থাকবে।
- **অবজেক্ট (Object)**: ক্লাসের একটি বাস্তব রূপ (Instance) যা রানটাইমে মেমরিতে জায়গা দখল করে।

### মেমরি বিশ্লেষণ (Stack vs Heap):
```java
BankAccount acc = new BankAccount("Karim", 5000);
```

```
     Stack Memory                               Heap Memory
┌────────────────────┐                 ┌───────────────────────────────┐
│                    │                 │  BankAccount Object (Instance)│
│  acc (Reference)   │────────────────►│  - accountNumber: "Karim"     │
│  [Address: 0x4A21] │                 │  - balance: 5000.0            │
└────────────────────┘                 └───────────────────────────────┘
```
1. `BankAccount acc`: স্ট্যাক (Stack) মেমরিতে একটি রেফারেন্স ভেরিয়েবল তৈরি হয় যা হিপের মেমরি অ্যাড্রেস ধরে রাখে।
2. `new BankAccount(...)`: হিপ (Heap) মেমরিতে অবজেক্টটির জন্য মেমরি বরাদ্দ হয় এবং ফিল্ডগুলো ইনিশিয়ালাইজ হয়।

---

## ৩. Fields / Instance Variables ইনিশিয়ালাইজেশনের নিয়ম

জাভাতে ক্লাসের ফিল্ডসমূহ বিভিন্ন ধাপে ইনিশিয়ালাইজ হতে পারে। এদের ডিফল্ট মান এবং ইনিশিয়ালাইজেশনের ক্রম জানা অত্যন্ত গুরুত্বপূর্ণ:

### ক. ডিফল্ট মান (Default Values):
মেথডের লোকাল ভেরিয়েবলে কোনো ডিফল্ট মান থাকে না (ম্যানুয়ালি ইনিশিয়ালাইজ না করলে কম্পাইল এরর হয়), কিন্তু ক্লাসের ফিল্ডসমূহে JVM স্বয়ংক্রিয়ভাবে ডিফল্ট মান প্রদান করে:
- সংখ্যা (`byte`, `short`, `int`, `long`): `0` বা `0L`
- দশমিক (`float`, `double`): `0.0f` বা `0.0d`
- বুলিয়ান (`boolean`): `false`
- ক্যারেক্টার (`char`): `'\u0000'` (null character)
- যেকোনো রেফারেন্স টাইপ (যেমন `String`, `Object`, `Array`): `null`

### খ. ইনিশিয়ালাইজেশনের ৪টি উপায়:
```java
public class InitializationDemo {

    // 1. Declaration with inline value
    private int status = 1;
    private final String appName;

    // 2. Instance Initializer Block (Runs before constructor every time an instance is created)
    {
        System.out.println("Instance Initializer Block executing...");
    }

    // 3. Static Initializer Block (Runs ONCE when class is loaded into memory)
    static {
        System.out.println("Class loaded into JVM Metaspace.");
    }

    // 4. Constructor Initialization
    public InitializationDemo(String appName) {
        this.appName = appName;
        System.out.println("Constructor executed for: " + appName);
    }
}
```

### এক্সিকিউশন ক্রম (Order of Execution):
1. **Static Initializer Blocks & Static Variables** (ক্লাস যখন প্রথমবার লোড হয় — শুধুমাত্র একবার)।
2. **Instance Initializer Blocks & Inline Field Declarations** (প্রতিবার `new` কল করার সময় কনস্ট্রাক্টরের আগে)।
3. **Constructor Body** (অবজেক্ট তৈরির চূড়ান্ত ধাপে)।

---

## ৪. Variable এর Scope ও Lifetime

জাভাতে ভেরিয়েবলকে তাদের স্কোপ (দৃশ্যমানতা) এবং লাইফটাইম (মেমরিতে টিকে থাকার সময়) অনুযায়ী ৪ ভাগে ভাগ করা হয়:

```
┌─────────────────────┬──────────────────────────┬──────────────────────┬───────────────────────────────┐
│ Variable Type       │ Declared In              │ Memory Location      │ Lifetime                      │
├─────────────────────┼──────────────────────────┼──────────────────────┼───────────────────────────────┤
│ **Instance Var**    │ ক্লাসের ভেতর (মেথডের বাইরে)│ Heap (অবজেক্টের ভেতর) │ অবজেক্ট বেঁচে থাকা পর্যন্ত    │
│ **Static / Class**  │ `static` কিওয়ার্ড সহ     │ Metaspace / Class Area│ ক্লাস আনলোড বা অ্যাপ বন্ধ হওয়া পর্যন্ত │
│ **Local Variable**  │ মেথড বা ব্লকের ভেতরে     │ Stack (Stack Frame)  │ মেথড বা ব্লক শেষ হওয়া পর্যন্ত │
│ **Loop Variable**   │ লুপ হেডার বা বডিতে       │ Stack                │ শুধুমাত্র সংশ্লিষ্ট লুপের চক্র পর্যন্ত │
└─────────────────────┴──────────────────────────┴──────────────────────┴───────────────────────────────┘
```

```java
public class ScopeDemo {
    public static int classVar = 100; // Static scope
    private int instanceVar = 20;     // Instance scope

    public void processData(int parameterVar) { // Parameter scope
        int localVar = 5; // Local scope: accessible only inside processData()

        for (int loopVar = 0; loopVar < 3; loopVar++) { // Loop scope
            int blockVar = loopVar * 2; // Block scope: dies at end of loop body
            System.out.println("Block var: " + blockVar);
        }
        // loopVar and blockVar are inaccessible here!
    }
}
```

---

## ৫. Parameter Passing মেকানিজম (Strictly Pass-by-Value)

> [!IMPORTANT]
> **জাভাতে সবকিছুই строго Pass-by-Value!** জাভাতে কোনো "Pass-by-Reference" নেই।
> - প্রিমিটিভ টাইপ পাস করলে: মানের সরাসরি কপি (Copy of the value) যায়।
> - অবজেক্ট রেফারেন্স পাস করলে: রেফারেন্সের অ্যাড্রেসের একটি কপি (Copy of the reference) যায়।

```java
public class ParameterPassingDeepDive {

    public static void modifyPrimitive(int x) {
        x = 99; // Modifies only the local stack copy
    }

    public static void reassignObject(Person p) {
        // p is a copy of caller's reference. Reassigning p does NOT change caller's reference!
        p = new Person("Changed Name");
    }

    public static void mutateObject(Person p) {
        // Mutates the actual object on Heap that both references point to!
        p.setName("Updated In Method");
    }

    public static void main(String[] args) {
        int num = 10;
        modifyPrimitive(num);
        System.out.println("num after call: " + num); // Still 10!

        Person person = new Person("Original");
        
        reassignObject(person);
        System.out.println("person after reassign: " + person.getName()); // Still "Original"!

        mutateObject(person);
        System.out.println("person after mutate: " + person.getName()); // Changed to "Updated In Method"!
    }
}
```

---

## ৬. Arrays (অ্যারে ও মেমোরি আর্কিটেকচার)

জাভাতে অ্যারে হলো একটি অবজেক্ট যা হিপ মেমরিতে সংরক্ষিত হয়। অ্যারের সাইজ ফিক্সড এবং এলিমেন্টগুলো মেমরিতে সংলগ্নভাবে (Contiguous) অবস্থান করে।

```java
import java.util.Arrays;

public class ArrayMastery {

    public static void main(String[] args) {
        // 1. One-dimensional Array Declaration and Allocation
        int[] numbers = new int[5]; // Allocated on Heap, default initialized to [0, 0, 0, 0, 0]
        numbers[0] = 10;
        numbers[1] = 20;

        // Array literal
        String[] fruits = {"Apple", "Banana", "Cherry"};

        // Array length property (NOT a method!)
        System.out.println("Numbers length: " + numbers.length);

        // 2. Multi-dimensional (Jagged) Arrays
        // In Java, 2D arrays are arrays of arrays (can have different column lengths)
        int[][] jaggedMatrix = new int[3][];
        jaggedMatrix[0] = new int[]{1, 2};
        jaggedMatrix[1] = new int[]{3, 4, 5, 6};
        jaggedMatrix[2] = new int[]{7};

        // 3. Traversal using Enhanced For-Loop
        for (String fruit : fruits) {
            System.out.println("Fruit: " + fruit);
        }

        // 4. Utility operations via java.util.Arrays
        int[] data = {5, 2, 8, 1, 9};
        Arrays.sort(data);
        System.out.println("Sorted: " + Arrays.toString(data)); // [1, 2, 5, 8, 9]

        int index = Arrays.binarySearch(data, 8);
        System.out.println("Index of 8: " + index);
    }
}
```

> [!TIP]
> `numbers.length` হলো একটি ফিল্ড/প্রোপার্টি (ব্র্যাকেট ছাড়া), অন্যদিকে `string.length()` হলো একটি মেথড। এই পার্থক্যটি পরীক্ষায় বহুল পরিচিত একটি প্রশ্ন।

---

## ৭. Variable Argument (vararg: `type... name`)

Java 5-এ পরিচিত পাওয়া **Varargs** মেথডকে অনির্দিষ্ট সংখ্যক আর্গুমেন্ট গ্রহণ করার সুবিধা দেয়। কম্পাইলার ব্যাকগ্রাউন্ডে এই আর্গুমেন্টগুলোকে একটি অ্যারেতে র্যাপ করে দেয়:

```java
public class VarargsDemo {

    // Vararg method accepting zero or more integers
    public static int sum(int baseMultiplier, int... numbers) {
        int total = 0;
        // 'numbers' is treated as a regular int[] array inside the method
        for (int n : numbers) {
            total += n;
        }
        return total * baseMultiplier;
    }

    public static void main(String[] args) {
        System.out.println("Result 1: " + sum(2));             // 0 numbers passed -> 0
        System.out.println("Result 2: " + sum(2, 5, 10));         // 2 numbers -> (5+10)*2 = 30
        System.out.println("Result 3: " + sum(1, 1, 2, 3, 4, 5)); // 5 numbers -> 15
    }
}
```

### Varargs এর দুটি অপরিহার্য নিয়ম:
1. একটি মেথডে **শুধুমাত্র একটি** vararg প্যারামিটার থাকতে পারে।
2. Vararg প্যারামিটারটিকে অবশ্যই মেথড প্যারামিটার লিস্টের **সর্বশেষ উপাদান** হতে হবে (`(int... nums, String name)` কম্পাইল এরর দেবে; `(String name, int... nums)` বৈধ)।

---

## ৮. Recursion (রিকার্শন ও কল স্ট্যাক)

যখন কোনো মেথড নিজের ভেতর থেকে নিজেকেই পুনরায় কল করে সমস্যা সমাধান করে, তাকে **Recursion** বলে। প্রতিটি রিকার্সিভ কলের জন্য স্ট্যাক মেমরিতে একটি নতুন স্ট্যাক ফ্রেম (Stack Frame) যুক্ত হয়।

```java
public class RecursionDemo {

    // Factorial calculation using recursion
    public static long factorial(int n) {
        // 1. Base Case: stops the infinite recursive spiral
        if (n <= 1) {
            return 1;
        }
        // 2. Recursive Case: breaking down into smaller subproblem
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        System.out.println("5! = " + factorial(5)); // Output: 120
    }
}
```

```
Call Stack Execution for factorial(3):
┌───────────────────────────┐
│ factorial(1) -> returns 1 │ ◄── Base Case reached (Unwinding starts)
├───────────────────────────┤
│ factorial(2) -> 2 * 1     │
├───────────────────────────┤
│ factorial(3) -> 3 * 2     │
└───────────────────────────┘
```

> [!WARNING]
> যদি রিকার্শনে **Base Case** সঠিকভাবে সংজ্ঞায়িত না থাকে বা রিকার্শন খুব গভীর হয়, তবে স্ট্যাক মেমরি পূর্ণ হয়ে JVM ক্র্যাশ করবে এবং **`java.lang.StackOverflowError`** ঘটবে।

---

## ৯. Packages ও Import মেকানিজম

প্যাকেজ হলো সম্পর্কিত ক্লাস এবং ইন্টারফেসের একটি কন্টেইনার বা নেমস্পেস। এটি ফাইলিং সিস্টেমের ডিরেক্টরি কাঠামোর সাথে সরাসরি ১:১ ম্যাপ করা থাকে।

```java
// Package declaration must be the FIRST non-comment line in the file
package com.company.ecommerce.payment;

// Importing specific classes from other packages
import java.util.List;
import java.time.LocalDateTime;

// Static import allows using static members without specifying the class name
import static java.lang.Math.PI;
import static java.lang.Math.sqrt;

public class PaymentProcessor {
    public double calculateInterest(double principal) {
        return sqrt(principal) * PI; // Using statically imported Math functions directly
    }
}
```

### প্যাকেজের সুবিধা:
1. **নেমিং কনফ্লিক্ট প্রতিরোধ**: দুটি ভিন্ন প্যাকেজে একই নামের ক্লাস (যেমন `java.util.Date` এবং `java.sql.Date`) নিরাপদে সহাবস্থান করতে পারে।
2. **অ্যাক্সেস কন্ট্রোল**: Package-private লেভেলে ক্লাসের অভ্যন্তরীণ উপাদানগুলোকে প্যাকেজের বাইরে সম্পূর্ণ লুকানো যায়।
3. **কনভেনশন**: ইন্টারন্যাশনালি ডোমেইন নেম উল্টো করে প্যাকেজ নামকরণ করা হয় (যেমন `com.google.gson` বা `org.springframework.boot`)।

---

## ১০. এক্সেস মডিফায়ার ম্যাট্রিক্স (Access Modifiers)

Java-তে চারটি প্রধান ভিজিবিলিটি লেভেল রয়েছে যা ক্লাসের ফিল্ড, মেথড এবং কনস্ট্রাকটরের এক্সেসিবিলিটি নিয়ন্ত্রণ করে:

| Modifier | একই ক্লাস | একই প্যাকেজ | সাব-ক্লাস (অন্য প্যাকেজে) | বাইরের যেকোনো প্যাকেজ |
| :--- | :---: | :---: | :---: | :---: |
| `private` | ✅ | ❌ | ❌ | ❌ |
| *(default / package-private)* | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ (Inheritance দ্বারা) | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

---

## ১১. কনস্ট্রাকটর ও `this(...)` চেইনিং

কনস্ট্রাকটর হলো অবজেক্টের স্টেট ইনিশিয়ালাইজ করার বিশেষ মেথড। এক কনস্ট্রাকটর থেকে একই ক্লাসের অন্য কনস্ট্রাকটর কল করতে `this(...)` ব্যবহৃত হয়:

```java
public class User {
    private String name;
    private String email;
    private int loyaltyPoints;

    // Default constructor chaining to master constructor
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

---

## ১২. স্ট্যাটিক বনাম ইনস্ট্যান্স মেম্বার (Static vs Instance)

- **ইনস্ট্যান্স মেম্বার**: প্রতিটি অবজেক্টের জন্য মেমরিতে আলাদা কপি তৈরি হয়।
- **স্ট্যাটিক মেম্বার**: সম্পূর্ণ ক্লাসের জন্য মেমরিতে একটিমাত্র শেয়ার্ড কপি থাকে যা ক্লাসের নাম দিয়ে সরাসরি এক্সেস করা যায় (`ClassName.method()`)।

```java
public class Counter {
    public static int totalInstances = 0; // Shared across all instances
    public int instanceId;               // Unique per instance

    public Counter() {
        totalInstances++;
        this.instanceId = totalInstances;
    }
}
```

---

## ১৩. এনক্যাপসুলেশন (Encapsulation)

এনক্যাপসুলেশন হলো অবজেক্টের অভ্যন্তরীণ ফিল্ডসমূহকে `private` রেখে সরাসরি বাহ্যিক মডিফিকেশন থেকে গোপন রাখা এবং নিয়ন্ত্রিত পাবলিক মেথডের (Getters & Setters) মাধ্যমে বিজনেস ভ্যালিডেশন নিশ্চিত করা।

```java
public class BankAccount {
    private double balance; // Encapsulated

    public double getBalance() {
        return this.balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            this.balance += amount;
        } else {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }
    }
}
```

---

## ১৪. Garbage Collection ও অবজেক্টের লাইফসাইকেল

জাভাতে C++ এর মতো ম্যানুয়ালি `free()` বা `delete` করতে হয় না। রানটাইমে JVM-এর Garbage Collector (GC) অবজেক্টের মেমরি স্বয়ংক্রিয়ভাবে রিলিজ করে।

### কখন একটি অবজেক্ট GC-র জন্য যোগ্য (Eligible for GC) হয়:
একটি অবজেক্ট তখনই GC-র জন্য এলিজিবল হয় যখন অ্যাপ্লিকেশনের কোনো লাইভ থ্রেড থেকে তার কাছে পৌঁছানো যায় না (**Unreachable**)।

```java
public class GcEligibilityDemo {

    public static void main(String[] args) {
        // Case 1: Nullifying reference variable
        Person p1 = new Person("Alice");
        p1 = null; // Object "Alice" is now unreachable and eligible for GC

        // Case 2: Reassigning reference variable
        Person p2 = new Person("Bob");
        Person p3 = new Person("Charlie");
        p2 = p3; // Object "Bob" is now unreachable and eligible for GC

        // Case 3: Objects created inside method
        createTempObject(); // The object created inside dies once method finishes execution
    }

    private static void createTempObject() {
        Person temp = new Person("Temp");
    }
}
```

### Island of Isolation (বিচ্ছিন্ন দ্বীপ):
যদি দুটি অবজেক্ট পরস্পরকে রেফার করে (`A.ref = B; B.ref = A;`), কিন্তু বাইরের কোনো সক্রিয় রেফারেন্স তাদের ধরে না রাখে, তবে পুরো গ্রুপটি আনরিচেবল গণ্য হয়ে GC দ্বারা ডিলিট হয়ে যায়।

---

## সারসংক্ষেপ

- **Two Paradigms**: Procedural প্রোগ্রামিং লজিক কেন্দ্রিক ("what happens"); OOP ডেটা ও লজিক একত্রীকরণ কেন্দ্রিক ("who is affected")।
- **Stack vs Heap**: রেফারেন্স থাকে Stack-এ, মূল অবজেক্ট থাকে Heap-এ।
- **Parameter Passing**: জাভা সর্বদা ১০০% **Pass-by-Value**। অবজেক্ট রেফারেন্স পাস করলেও মেমরির রেফারেন্স পয়েন্টারটি কপি হয়।
- **Arrays & Varargs**: অ্যারে ফিক্সড সাইজ অবজেক্ট; varargs (`type...`) ব্যাকগ্রাউন্ডে অ্যারে হিসেবে কম্পাইল হয়।
- **Recursion**: বেস কেস ছাড়া রিকার্শন চালালে `StackOverflowError` ঘটে।
- **Access Control**: Packages ও Access Modifiers কোডের নিরাপত্তা ও মডুলারিটি নিশ্চিত করে।
