# Java Syntax, variable ও data type — Beginner to Advanced

যেকোনো প্রোগ্রামিং ভাষা শেখার প্রথম ধাপ হলো তার শব্দ গঠন ও ব্যাকরণ (Syntax) বোঝা। কম্পিউটারকে কোনো তথ্য মনে রাখতে বললে সে memory-র নির্দিষ্ট একটি জায়গায় তা সংরক্ষণ করে। এই তথ্য রাখার জায়গাকেই প্রোগ্রামিংয়ে বলা হয় **Variable**।

---

## ১. Variable কী ও কীভাবে কাজ করে

Variable হলো memory-তে ডেটা সংরক্ষণ করার জন্য একটি নির্দিষ্ট নামযুক্ত স্থান (Named Storage Location)। প্রোগ্রাম চলার সময় ডেটার ধরন (Data Type) অনুযায়ী JVM মেমরিতে প্রয়োজনীয় জায়গা বরাদ্দ করে।

```
        ┌──────────────────────────────────────────────┐
        │  int age = 25;                               │
        └───────┬───────┬──────┬───────┬───────────────┘
                │       │      │       │
       Data Type ───┘   │      │       └── Semicolon (Statement সমাপ্তি)
    (পূর্ণসংখ্যা)       │      │
                        │      └── Stored Value (প্রকৃত মান)
                 Variable Name
```

### প্রতিটি অংশের অর্থ:
1. **`int` (Data Type)**: Compiler-কে জানায় এই মেমরি ব্লকে ৪-বাইটের পূর্ণসংখ্যা (Integer) সংরক্ষিত হবে।
2. **`age` (Variable Name)**: Memory address-কে নির্দেশ করার জন্য একটি ইউনিক আইডেন্টিফায়ার বা নাম।
3. **`=` (Assignment Operator)**: ডানপাশের মানটিকে বামপাশের ভ্যারিয়েবলে assign বা store করে।
4. **`25` (Value)**: Memory-তে সংরক্ষিত মূল ডেটা।
5. **`;` (Semicolon)**: জাভাতে প্রতিটি স্টেটমেন্টের সমাপ্তি নির্দেশ করতে সেমিকোলন ব্যবহার করা হয়।

---

## ২. Variable Declaration ও Naming Rules

Java একটি কঠোরভাবে টাইপকৃত ভাষা (**Statically-Typed**)। এর অর্থ হলো কোনো variable ব্যবহার করার আগে তার টাইপ বলে দিতে হবে:

```java
// 1. Variable declaration without initialization
int score;

// 2. Value assignment (initialization)
score = 100;

// 3. Combined declaration and initialization (idiomatic)
int totalMarks = 450;
```

### Naming Conventions:
- variable-এর নাম ছোট হাতের অক্ষর দিয়ে শুরু হয় এবং একাধিক শব্দ থাকলে **camelCase** লিখতে হয়: যেমন `userAge`, `studentExamScore`, `isUserLoggedIn`।
- নামের শুরুতে কখনো সংখ্যা হতে পারবে না (`1score` অবৈধ, কিন্তু `score1` বৈধ)।
- জাভার সংরক্ষিত কিওয়ার্ড (যেমন `class`, `int`, `public`, `return`) variable-এর নাম হিসেবে ব্যবহার করা যায় না।

---

## ৩. Primitive Data Types

জাভাতে memory-র সর্বনিম্ন অপচয় নিশ্চিত করতে ৮টি মৌলিক data type তৈরি করা হয়েছে:

| টাইপ | সাইজ | কোন ধরণের ডেটা রাখে? | উদাহরণের রেঞ্জ | বাস্তব ব্যবহার |
| :--- | :--- | :--- | :--- | :--- |
| **`byte`** | 1 Byte | খুব ছোট পূর্ণসংখ্যা | -128 থেকে 127 | নেটওয়ার্ক স্ট্রিম বা বাইট বাফার |
| **`short`** | 2 Bytes | ছোট পূর্ণসংখ্যা | -32,768 থেকে 32,767 | memory সংকীর্ণ হার্ডওয়্যার |
| **`int`** | 4 Bytes | সাধারণ পূর্ণসংখ্যা (ডিফল্ট) | -২ বিলিয়ন থেকে +২ বিলিয়ন | loop কাউন্টার, বয়স, সাধারণ হিসাব |
| **`long`** | 8 Bytes | বিশাল পূর্ণসংখ্যা | -৯ কুইন্টিলিয়ন থেকে +৯ কুইন্টিলিয়ন | টাইমস্ট্যাম্প, ডাটাবেজ প্রাইমারি আইডি |
| **`float`** | 4 Bytes | ছোট দশমিক সংখ্যা | ৬-৭ দশমিক ঘর নির্ভুলতা | গেম ডেভেলপমেন্ট বা গ্রাফিক্স |
| **`double`**| 8 Bytes | বড় দশমিক সংখ্যা (ডিফল্ট) | ১৫-১৬ দশমিক ঘর নির্ভুলতা | বৈজ্ঞানিক ও সাধারণ দশমিক হিসাব |
| **`char`** | 2 Bytes | একক অক্ষর বা বর্ণ (Single Quotes) | 0 থেকে 65,535 (Unicode UTF-16) | `'A'`, `'১'`, `'$'`, `'অ'` |
| **`boolean`**| 1 Bit | সত্য বা মিথ্যা | শুধু `true` অথবা `false` | শর্ত ও সিদ্ধান্ত গ্রহণের লজিক |

```java
public class PrimitiveBasics {
    public static void main(String[] args) {
        byte roll = 15;
        int employeeId = 10452;
        long nationalRevenue = 987654321000L; // Append 'L' suffix for 64-bit integer literal

        float temperature = 36.6f;            // Append 'f' suffix for 32-bit float literal
        double pi = 3.141592653589793;

        char section = 'B';
        boolean isPassed = true;

        System.out.println("আইডি: " + employeeId + " | পাস করেছে: " + isPassed);
    }
}
```

> [!TIP]
> **কেন `long`-এর শেষে `L` এবং `float`-এর শেষে `f` দিতে হয়?**
> জাভা যেকোনো পূর্ণসংখ্যাকে ডিফল্টভাবে `int` এবং যেকোনো দশমিককে `double` মনে করে। compiler-কে স্পষ্ট জানাতে হয় যে সংখ্যাটি একটি `long` বা `float`।

---

## ৪. Type Casting: Widening ও Narrowing

এক টাইপের ডেটাকে অন্য টাইপে রূপান্তর করাকে বলা হয় **Type Casting**।

```
 byte ──► short ──► int ──► long ──► float ──► double   (Widening: Automatic & Safe)

 double ──► float ──► long ──► int ──► short ──► byte   (Narrowing: Explicit / Data Loss Risk)
```

### Widening Casting (Implicit / Safe):
ছোট সাইজের data type থেকে বড় সাইজের data type-এ রূপান্তরকে Widening Casting বলা হয়। এতে কোনো data loss হয় না, তাই Java স্বয়ংক্রিয়ভাবে এই রূপান্তর সম্পন্ন করে:
```java
int marks = 95;
double preciseMarks = marks; // Widening: automatic widening conversion from int to double
```

### Narrowing Casting (Explicit / Manual):
বড় সাইজের data type থেকে ছোট সাইজের data type-এ রূপান্তরকে Narrowing Casting বলা হয়। এতে ডেটার precision loss বা overflow হতে পারে, তাই explicit cast অপারেটর `(targetType)` ব্যবহার করা বাধ্যতামূলক:
```java
double originalSalary = 85400.75;
int roundSalary = (int) originalSalary; // Narrowing: explicit cast required
System.out.println(roundSalary); // Output: 85400 (fractional part truncated)
```

---

## ৫. Local Variable Type Inference (`var`)

আগে অনেক বড় বড় class-এর নাম বারবার দুই পাশে লিখতে হতো:
```java
// Verbose type syntax prior to Java 10:
Scanner scanner = new Scanner(System.in);
HashMap<String, Integer> studentGrades = new HashMap<String, Integer>();

// Local variable type inference via 'var' (Java 10+):
var scanner = new Scanner(System.in);
var studentGrades = new HashMap<String, Integer>();
var message = "Hello"; // Compiler infers String
var count = 50;        // Compiler infers int
```

> [!WARNING]
> **`var` ব্যবহারের ৩টি নিয়ম:**
> ১. `var` কিন্তু ডায়নামিক জাভাস্ক্রিপ্ট নয়! একবার টাইপ নির্ধারণ হলে পরবর্তীতে অন্য টাইপ রাখা যায় না (`var x = 10; x = "Hi";` এরর দেবে)।
> ২. এটি শুধুমাত্র **method-এর ভেতরের local variableে** ব্যবহার করা যাবে। class-এর ফিল্ড বা method-এর parameter-এ `var` লেখা সম্পূর্ণ নিষিদ্ধ।
> ৩. `var` লেখার সময়ই প্রাথমিক মান দিতে হবে (`var x;` লিখলে compiler টাইপ বুঝতে না পেরে এরর দেবে)।

---

## ৬. Constants ও `final` Keyword

কোনো variable-এর মান যাতে ভবিষ্যতে কেউ ভুল করেও পরিবর্তন করতে না পারে, তার জন্য নামের শুরুতে `final` কিওয়ার্ড ব্যবহার করা হয়:

```java
public class ConstantsDemo {
    public static void main(String[] args) {
        final double VAT_RATE = 0.15; // Constant rate (immutable)
        
        // VAT_RATE = 0.20; // Compilation error: cannot assign a value to final variable
        System.out.println("ভ্যাট রেট: " + VAT_RATE);
    }
}
```

---

## ৭. Console Input (`Scanner`)

প্রোগ্রাম চালানোর সময় কীবোর্ড থেকে ইউজারের তথ্য গ্রহণ করতে `java.util.Scanner` class ব্যবহার করা হয়:

```java
import java.util.Scanner;

public class ConsoleInputDemo {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

        System.out.print("আপনার নাম লিখুন: ");
        String name = input.nextLine(); // Reads complete line of text input

        System.out.print("আপনার বয়স লিখুন: ");
        int age = input.nextInt();      // Reads integer input token

        System.out.println("হ্যালো " + name + ", আপনার বয়স " + age + " বছর।");

        input.close(); // Release underlying scanner stream resources
    }
}
```

### nextLine() Buffer Issue ও সমাধান:
যখন `nextInt()` দিয়ে সংখ্যা পড়ার পরপরই `nextLine()` দিয়ে টেক্সট পড়তে যাবেন, তখন দেখবেন টেক্সট ইনপুট না নিয়েই কোড স্কিপ হয়ে গেছে!
- **কারণ**: সংখ্যা লেখার পর ইউজার যে `Enter` চাপে, সেই নিউলাইন ক্যারেক্টারটি বাফারে রয়ে যায়। `nextLine()` সেই এন্টারটিকেই গ্রহণ করে ফেলে।
- **সমাধান**: `nextInt()` এর ঠিক পরে একটি অতিরিক্ত `input.nextLine();` কল দিয়ে বাফার খালি করে নিন।

---

## সারসংক্ষেপ
1. Variable হলো memory-তে ডেটা সংরক্ষণ করার একটি নামযুক্ত রেফারেন্স বা স্টোরেজ।
2. পূর্ণসংখ্যার জন্য `int`, বিশাল সংখ্যার জন্য `long`, দশমিকের জন্য `double`, লেখার জন্য `String` সবচেয়ে বেশি ব্যবহৃত হয়।
3. `int[]` data type-কে নির্দেশ করে, তাই ব্র্যাকেট সর্বদা টাইপের সাথে লাগানোই আধুনিক নিয়ম।
4. method-এর ভেতরে কোড সংক্ষেপ করতে `var` এবং অপরিবর্তনীয় মান সুরক্ষিত রাখতে `final` ব্যবহার করুন।
