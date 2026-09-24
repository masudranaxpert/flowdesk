# Strings ও Memory — String Pool

Java-তে `String` হলো সবচেয়ে বহুল ব্যবহৃত ডেটা টাইপ। অন্যান্য অধিকাংশ প্রোগ্রামিং ভাষার সাথে Java স্ট্রিংয়ের একটি মৌলিক পার্থক্য রয়েছে: **Java-তে স্ট্রিং সম্পূর্ণ অপরিবর্তনীয় (Immutable)**। একবার মেমরিতে একটি স্ট্রিং অবজেক্ট তৈরি হয়ে গেলে তার ভেতরের কোনো ক্যারেক্টার পরিবর্তন করা যায় না।

---

## ১. স্ট্রিং কেন ইমিউটেবল (Immutable)?

Java-এর আর্কিটেক্টরা চারটি প্রধান কারণে স্ট্রিংকে ইমিউটেবল হিসেবে ডিজাইন করেছেন:

1. **স্ট্রিং কনস্ট্যান্ট পুল (String Pool)**: মেমরি বাঁচাতে একই টেক্সটযুক্ত স্ট্রিংগুলোকে র্যামে একবারই স্টোর করে একাধিক রেফারেন্স দিয়ে শেয়ার করা যায়।
2. **নিরাপত্তা (Security)**: ডাটাবেজ কানেকশন ইউআরএল, ইউজারনেম, পাসওয়ার্ড বা নেটওয়ার্ক সকেট ফাইল পাথে স্ট্রিং ব্যবহৃত হয়। স্ট্রিং মিউটেবল হলে অন্য কেউ গোপনে পাথ পরিবর্তন করে সিকিউরিটি হোল তৈরি করতে পারত।
3. **থ্রেড সেফটি (Thread Safety)**: ইমিউটেবল অবজেক্ট কোনো প্রকার সিঙ্ক্রোনাইজেশন বা লক ছাড়াই একাধিক থ্রেড থেকে একযোগে নিরাপদে পড়া যায়।
4. **হ্যাশকড ক্যাশিং (HashCode Caching)**: `String` তার হ্যাশকড একবার হিসাব করে মেমরিতে ক্যাশ করে রাখে। ফলে `HashMap` বা `HashSet` এ লুকআপ অত্যন্ত দ্রুতগতিতে কাজ করে।

---

## ২. স্ট্রিং পুল মেমরি মডেল (String Pool / SCP)

JVM হিপ মেমরির ভেতরে একটি বিশেষ সংরক্ষিত মেমরি অঞ্চল রাখে যাকে **String Constant Pool (SCP)** বলা হয়:

```java
public class StringPoolDemo {
    public static void main(String[] args) {
        // 1. String Literals — stored in String Pool
        String s1 = "Java";
        String s2 = "Java";

        // Both s1 and s2 point to the EXACT same object in String Pool!
        System.out.println(s1 == s2); // true (same reference address)

        // 2. Explicit new operator — creates a new distinct object on Heap
        String s3 = new String("Java");

        System.out.println(s1 == s3);      // false (different heap addresses)
        System.out.println(s1.equals(s3));  // true (same character content)
    }
}
```

### `.intern()` মেথড:
`new String()` দিয়ে তৈরি হিপ অবজেক্টকে জোরপূর্বক স্ট্রিং পুলে রেজিস্টার করাতে `.intern()` ব্যবহার করা হয়:
```java
String s4 = s3.intern();
System.out.println(s1 == s4); // true!
```

---

## ৩. স্ট্রিং কনক্যাটেনেশন ও পারফরম্যান্স ফাঁদ

লুপের ভেতর `+` অপারেটর দিয়ে স্ট্রিং জোড়া লাগানো একটি অত্যন্ত ভয়াবহ পারফরম্যান্স অ্যান্টি-প্যাটার্ন:

```java
// BAD: O(n^2) performance and massive garbage collection overhead!
String result = "";
for (int i = 0; i < 100_000; i++) {
    result += i; // প্রতিটি ইটারেশনে নতুন String অবজেক্ট তৈরি হচ্ছে!
}
```

### সমাধান: `StringBuilder` বনাম `StringBuffer`

| বৈশিষ্ট্য | `StringBuilder` (আধুনিক পছন্দ) | `StringBuffer` (লেগ্যাসি) |
| :--- | :--- | :--- |
| **থ্রেড সেফটি** | থ্রেড-সেফ নয় (নন-সিঙ্ক্রোনাইজড) | থ্রেড-সেফ (`synchronized` মেথড) |
| **পারফরম্যান্স** | **সর্বোচ্চ দ্রুতগতি** | সিঙ্ক্রোনাইজেশন লকের কারণে ধীর |
| **ব্যবহারের ক্ষেত্র** | সাধারণ সিঙ্গেল-থ্রেডেড স্ট্রিং অপারেশন | একাধিক থ্রেড থেকে একযোগে শেয়ার্ড বাফার |

```java
// GOOD: O(n) performance using StringBuilder
StringBuilder sb = new StringBuilder(100_000); // Pre-allocate capacity
for (int i = 0; i < 100_000; i++) {
    sb.append(i);
}
String finalResult = sb.toString();
```

---

## ৪. টেক্সট ব্লক — Text Blocks (Java 15+)

SQL কোয়েরি, JSON বা HTML লেখার সময় ব্যাকস্ল্যাশ এস্কেপ (`\n`, `\"`) কোডকে অপাঠ্য করে তুলত। Java 15 থেকে ট্রিপল কোটেশন (`"""`) ভিত্তিক মাল্টি-লাইন টেক্সট ব্লক এসেছে:

```java
public class TextBlockDemo {
    public static void main(String[] args) {
        // Multiline clean JSON without escaping quotes
        String jsonPayload = """
            {
                "userId": 101,
                "name": "Masud Rana",
                "role": "Software Architect",
                "skills": ["Java 21", "Spring Boot", "Rust"]
            }
            """;

        System.out.println(jsonPayload);
    }
}
```

---

## ৫. কম্প্যাক্ট স্ট্রিংস (Compact Strings - Java 9+)

Java 8 পর্যন্ত প্রতিটি স্ট্রিং `char[]` অ্যারে হিসেবে সংরক্ষিত হতো, যার অর্থ প্রতিটি ক্যারেক্টার মেমরিতে বাধ্যতামূলকভাবে **২ বাইট (১৬ বিট)** নিত, যদিও বেশিরভাগ ইংরেজি অক্ষর মাত্র ১ বাইটেই ধরে।

Java 9 থেকে JVM স্ট্রিংকে ইন্টারনালি `byte[]` অ্যারে এবং একটি `coder` ফ্ল্যাগ দিয়ে অপটিমাইজ করেছে:
- শুধুমাত্র ল্যাটিন/ইংরেজি ক্যারেক্টার থাকলে: প্রতি ক্যারেক্টারে মাত্র **১ বাইট** জায়গা নেয়।
- বাংলা বা ইমোজি থাকলে: স্বয়ংক্রিয়ভাবে UTF-16 এর জন্য **২ বাইট** এনকোডিংয়ে সুইচ করে।
- এর ফলে যেকোনো সাধারণ এন্টারপ্রাইজ অ্যাপ্লিকেশনে কোনো কোড পরিবর্তন ছাড়াই হিপ মেমরি ব্যবহার প্রায় **৪০-৫০% পর্যন্ত হ্রাস পায়**!

---

## সারসংক্ষেপ

- Java-তে `String` কঠোরভাবে ইমিউটেবল; এর ফলে নিরাপত্তা, স্ট্রিং পুল ও থ্রেড সেফটি নিশ্চিত হয়।
- স্ট্রিং লিটারেল মেমরির String Constant Pool এ শেয়ার্ড থাকে; অবজেক্ট তৈরিতে `==` নয়, সর্বদা `.equals()` ব্যবহার করো।
- লুপের ভেতর স্ট্রিং জোড়া লাগাতে `+` পরিহার করে সর্বদা `StringBuilder` ব্যবহার করো।
- আধুনিক টেক্সট ব্লক (`"""`) এস্কেপ ক্যারেক্টার ছাড়া পরিচ্ছন্ন মাল্টি-লাইন স্ট্রিং লেখার সুবিধা দেয়।
- পরবর্তী অধ্যায়ে আমরা শিখব Java Collections Framework — List, Set, Map ও ডেটা স্ট্রাকচার।
