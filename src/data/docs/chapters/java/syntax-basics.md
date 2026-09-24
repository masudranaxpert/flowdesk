# Syntax, ভ্যারিয়েবল ও ডেটা টাইপ

Java একটি কঠোরভাবে টাইপকৃত (Statically-Typed) ভাষা। এর অর্থ হলো কোড কম্পাইল করার সময়ই কম্পাইলারকে প্রতিটি ভ্যারিয়েবলের ডেটা টাইপ ও মেমরি সাইজ নিশ্চিত করতে হয়। Java-তে ডেটা টাইপকে দুটি মূল ক্যাটাগরিতে ভাগ করা হয়:
1. **প্রিমিটিভ টাইপ (Primitive Types)**: ৮টি বিল্ট-ইন বেসিক টাইপ যা সরাসরি স্ট্যাক মেমরিতে মান ধারণ করে।
2. **রেফারেন্স টাইপ (Reference Types)**: অবজেক্ট, ক্লাস, ইন্টারফেস এবং অ্যারে — যা হিপ মেমরিতে থাকা ডেটার রেফারেন্স ধারণ করে।

---

## ১. আটটি প্রিমিটিভ ডেটা টাইপ

Java-তে প্রিমিটিভ টাইপগুলোর সাইজ সমস্ত অপারেটিং সিস্টেমে (উইন্ডোজ, লিনাক্স, ম্যাক) নির্দিষ্ট ও অপরিবর্তনীয়:

| টাইপ | সাইজ (Bits / Bytes) | ডিফল্ট মান | ভ্যালু রেঞ্জ | বাস্তব ব্যবহার |
| :--- | :--- | :--- | :--- | :--- |
| `byte` | 8 bits (1 byte) | `0` | -128 থেকে 127 | ফাইল আই/ও, বাইট স্ট্রিম |
| `short` | 16 bits (2 bytes) | `0` | -32,768 থেকে 32,767 | মেমরি-সংকীর্ণ বিশাল অ্যারে |
| `int` | 32 bits (4 bytes) | `0` | -2^31 থেকে 2^31 - 1 (~2 বিলিয়ন) | সাধারণ পূর্ণসংখ্যা ও লুপ কাউন্টার |
| `long` | 64 bits (8 bytes) | `0L` | -2^63 থেকে 2^63 - 1 | টাইমস্ট্যাম্প, ডাটাবেজ প্রাইমারি কি |
| `float` | 32 bits (4 bytes) | `0.0f` | ~6-7 দশমিক ডিজিট প্রিসিশন | গ্রাফিক্স, কম মেমরির ফ্লোট |
| `double`| 64 bits (8 bytes) | `0.0d` | ~15-16 দশমিক ডিজিট প্রিসিশন | বৈজ্ঞানিক গণনা ও ডিফল্ট দশমিক |
| `char` | 16 bits (2 bytes) | `'\u0000'` | 0 থেকে 65,535 (Unicode UTF-16) | একক বর্ণ, আন্তর্জাতিক অক্ষর |
| `boolean`| 1 bit (JVM এ 1 byte)| `false` | `true` অথবা `false` | শর্ত ও লজিক্যাল ফ্ল্যাগ |

> [!important]
> `long` লিটারেলের শেষে সর্বদা `L` (যেমন `5000000000L`) এবং `float` লিটারেলের শেষে `f` (যেমন `3.1416f`) লিখতে হয়। অন্যথায় Java কম্পাইলার এগুলোকে যথাক্রমে ডিফল্ট `int` ও `double` ধরে কম্পাইল এরর দেবে।

```java
public class PrimitiveDemo {
    public static void main(String[] args) {
        // Integer types
        byte age = 25;
        int salary = 85_000;          // Underscores improve number readability
        long nationalDebt = 9_876_543_210L;

        // Floating-point types
        float pi = 3.14159f;
        double precisionValue = 123456.789012345;

        // Character and Boolean
        char grade = 'A';
        boolean isActive = true;

        System.out.println("Status: " + isActive + ", Grade: " + grade);
    }
}
```

---

## ২. টাইপ কাস্টিং (Type Casting)

এক টাইপের মানকে অন্য টাইপে রূপান্তর করার ক্ষেত্রে Java দুটি নিয়ম মেনে চলে:

### ক. ওয়াইডেনিং কাস্টিং (Widening / Implicit Casting):
ছোট আকারের টাইপকে বড় আকারের টাইপে রূপান্তর করতে কোনো ম্যানুয়াল সিনট্যাক্স লাগে না, এটি স্বয়ংক্রিয় ও নিরাপদ:
`byte -> short -> char -> int -> long -> float -> double`

```java
int myInt = 9;
double myDouble = myInt; // Automatic widening: 9.0
```

### খ. ন্যারোয়িং কাস্টিং (Narrowing / Explicit Casting):
বড় আকারের টাইপকে ছোট আকারের টাইপে রূপান্তর করার সময় ডেটা লস বা ট্রাঙ্কেশন (Truncation) ঘটতে পারে, তাই ব্র্যাকেট দিয়ে স্পষ্ট কাস্টিং বাধ্যতামূলক:

```java
double originalPrice = 99.99;
// Manual explicit cast: fractional part is truncated
int integerPrice = (int) originalPrice; // integerPrice = 99
```

> [!warning]
> পূর্ণসংখ্যার ওভারফ্লো (Overflow): যদি কোনো `int` যার মান `130`, তাকে জোরপূর্বক `(byte)` এ কাস্ট করা হয়, তবে সাইকেল ঘুরে এর মান হবে `-126` (টু'স কমপ্লিমেন্ট র্যাপ-অ্যারাউন্ড)।

---

## ৩. র্যাপার ক্লাস ও অটোবক্সিং (Autoboxing / Unboxing)

প্রতিটি প্রিমিটিভ টাইপের জন্য Java-তে একটি করে অবজেক্ট ওরিয়েন্টেড **Wrapper Class** রয়েছে:
`int -> Integer`, `char -> Character`, `double -> Double`, `boolean -> Boolean` ইত্যাদি।

- **Autoboxing**: প্রিমিটিভ মানকে স্বয়ংক্রিয়ভাবে র্যাপার অবজেক্টে রূপান্তর করা (`Integer obj = 50;`)।
- **Unboxing**: র্যাপার অবজেক্ট থেকে সরাসরি প্রিমিটিভ মানে ফিরে আসা (`int val = obj;`)।

```java
// Autoboxing: primitive int converted to Integer object
Integer boxedNumber = 100;

// Unboxing: Integer object converted back to primitive int
int primitiveNumber = boxedNumber;
```

> [!danger]
> **লুপের ভেতর অটোবক্সিংয়ের পারফরম্যান্স ফাঁদ**:
> ```java
> Long sum = 0L; // Wrapper class!
> for (long i = 0; i < 1_000_000; i++) {
>     sum += i; // প্রতি ইটারেশনে নতুন Long অবজেক্ট তৈরি হচ্ছে!
> }
> ```
> উপরের কোডটিতে ১ মিলিয়ন অবজেক্ট হিপ মেমরিতে তৈরি ও ফেলে দেওয়া হয়, যা প্রিমিটিভ `long sum = 0L;` এর চেয়ে প্রায় ১০ গুণ ধীরগতির! লুপ বা পারফরম্যান্স-ক্রিটিকাল কোডে সর্বদা প্রিমিটিভ টাইপ ব্যবহার করো।

---

## ৪. `var` — লোকাল ভ্যারিয়েবল টাইপ ইনফারেন্স (Java 10+)

Java 10 থেকে লোকাল ভ্যারিয়েবলের স্পষ্ট টাইপের নাম বারবার না লিখে কম্পাইলারকে নিজে থেকে টাইপ নির্ধারণ করতে দেওয়ার জন্য `var` কি-ওয়ার্ড যুক্ত করা হয়েছে:

```java
// Without var (verbose)
Map<String, List<Integer>> userScores = new HashMap<>();

// With var (clean and readable)
var modernScores = new HashMap<String, List<Integer>>();
var message = "Hello from modern Java"; // Inferred as String
var count = 42;                         // Inferred as int
```

### `var` ব্যবহারের সোনালী নিয়মাবলী:
1. `var` কোনো ডায়নামিক টাইপ (যেমন জাভাস্ক্রিপ্টের var) নয়! এটি কম্পাইল টাইমে ফিক্সড টাইপ পায়।
2. এটি শুধুমাত্র **মেথডের ভেতরের লোকাল ভ্যারিয়েবলে** ব্যবহারযোগ্য। ক্লাসের ফিল্ড, মেথড প্যারামিটার বা রিটার্ন টাইপে `var` লেখা নিষিদ্ধ।
3. ঘোষণার সময় ভ্যালু ইনিশিয়ালাইজ করা বাধ্যতামূলক (`var x;` কম্পাইল এরর দেবে)।

---

## ৫. কনস্ট্যান্ট ও `final` কি-ওয়ার্ড

কোনো ভ্যারিয়েবলের মান যাতে পরবর্তীতে পরিবর্তন করা না যায়, তার জন্য `final` কি-ওয়ার্ড ব্যবহৃত হয়:

```java
public class Constants {
    // Global constant naming convention: SCREAMING_SNAKE_CASE
    public static final double SALES_TAX_RATE = 0.075;

    public void calculate() {
        final int maxAttempts = 3;
        // maxAttempts = 5; // COMPILATION ERROR! Cannot assign a value to final variable
    }
}
```

---

## ৬. কনসোল থেকে ইউজার ইনপুট গ্রহণ

টার্মিনালে ইউজারের কাছ থেকে ডেটা রিড করার দুটি জনপ্রিয় উপায়:

```java
import java.util.Scanner;

public class UserInputDemo {
    public static void main(String[] args) {
        // Create scanner instance wrapping standard input
        Scanner scanner = new Scanner(System.in);

        System.out.print("তোমার নাম লেখো: ");
        String name = scanner.nextLine();

        System.out.print("তোমার বয়স লেখো: ");
        int age = scanner.nextInt();

        System.out.println("স্বাগতম, " + name + "! তোমার বয়স " + age + " বছর।");

        // Close resource to prevent input stream leak
        scanner.close();
    }
}
```

### ইনপুটের পরিচিত ফাঁদ (`nextLine()` Trap):
যখন `nextInt()` বা `nextDouble()` পড়ার পর সরাসরি `nextLine()` পড়া হয়, তখন পূর্বে ইনপুট দেওয়া এন্টারের নিউলাইন (`\n`) ক্যারেক্টারটি `nextLine()` তৎক্ষণাৎ গ্রহণ করে ফাঁকা স্ট্রিং রিটার্ন করে দেয়। এই সমস্যা দূর করতে `nextInt()` এর ঠিক পরে একটি অতিরিক্ত `scanner.nextLine()` কল করে বাফার পরিষ্কার করতে হয়।

---

## সারসংক্ষেপ

- Java-তে ৮টি প্রিমিটিভ টাইপ সরাসরি স্ট্যাক মেমরিতে সংরক্ষিত হয়।
- ওয়াইডেনিং কাস্টিং নিরাপদ ও স্বয়ংক্রিয়; ন্যারোয়িং কাস্টিংয়ে ব্র্যাকেট দিয়ে এক্সপ্লিসিট কাস্ট করতে হয়।
- অবজেক্টের তালিকায় (Collections) ব্যবহারের জন্য Wrapper ক্লাস লাগে, তবে লুপে অটোবক্সিং সিপিইউ ওভারহেড তৈরি করে।
- `var` মেথডের লোকাল স্কোপে কোডকে সংক্ষিপ্ত ও পরিষ্কার করে।
- পরবর্তী অধ্যায়ে আমরা Java-এর আধুনিক Control Flow ও Pattern Matching Switch শিখব।
