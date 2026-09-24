# Java কী ও JVM আর্কিটেকচার

Java হলো বিশ্বের সবচেয়ে প্রভাবশালী, নির্ভরযোগ্য ও বহুল ব্যবহৃত object-ওরিয়েন্টেড এন্টারপ্রাইজ প্রোগ্রামিং ভাষা। ১৯৯৫ সালে সান মাইক্রোসিস্টেমসের (বর্তমানে ওরাকল) জেমস গসলিংয়ের নেতৃত্বে এটি তৈরি হয়। Java-এর মূল দর্শন ছিল **WORA (Write Once, Run Anywhere)** — অর্থাৎ একটি মেশিনে কোড লিখে কম্পাইল করলে তা যেকোনো অপারেটিং সিস্টেমে কোনো পরিবর্তন ছাড়াই নির্বাহ হতে পারবে।

আজকের আধুনিক **Java 21 LTS** শুধুমাত্র চিরাচরিত এন্টারপ্রাইজ সিস্টেমেই সীমাবদ্ধ নয়; এটি ক্লাউড-নেটিভ মাইক্রোসার্ভিসেস, হাই-থ্রুপুট ফিনটেক প্ল্যাটফর্ম, অ্যান্ড্রয়েড ডেভেলপমেন্ট এবং বিগ ডেটা ইঞ্জিনিয়ারিংয়ে (Apache Spark, Kafka) রাজত্ব করছে।

---

## ১. Java কেন শিখবে?

সি বা সি++ এ সরাসরি মেশিন কোডে compile হয়, যার ফলে এক ওএসের বাইনারি অন্য ওএসে চলে না এবং memory ম্যানেজমেন্ট প্রোগ্রামারকে নিজে করতে হয়। পাইথনে কোড সহজে লেখা গেলেও তা ইন্টারপ্রেটেড হওয়ায় তুলনামূলক ধীরগতির।

Java এই দুই চরমপন্থার মাঝে একটি নিখুঁত ভারসাম্য তৈরি করেছে:
1. **প্ল্যাটফর্ম Platform Independence**: সোর্স কোড সরাসরি মেশিন কোডে কম্পাইল না হয়ে প্ল্যাটফর্ম-নিরপেক্ষ **Bytecode (.class) ফাইলের** রূপান্তরিত হয়।
2. **অটোমেটিক memory ম্যানেজমেন্ট**: আধুনিক ও উচ্চক্ষমতাসম্পন্ন **Garbage Collector (GC)** রিলিজ হওয়া object-গুলোর memory নিজে থেকেই মুক্ত করে, ফলে memory লিকের ঝুঁকি হ্রাস পায়।
3. **উচ্চ গতিসম্পন্ন JIT Compiler**: ঘন ঘন এক্সিকিউট হওয়া কোডকে (HotSpot) runtime-এ সরাসরি অপটিমাইজড নেটিভ মেশিন কোডে রূপান্তর করে প্রায় সি++ এর কাছাকাছি পারফরম্যান্স প্রদান করে।
4. **শক্তিশালী টাইপ সেফটি ও ব্যাকওয়ার্ড কম্প্যাটিবিলিটি**: ২০ বছর আগের লেখা Java কোডও কোনো পরিবর্তন ছাড়াই আধুনিক Java 21 runtime-এ নির্বিঘ্নে চলতে পারে।

```java
// Main application entry point
public class Main {
    public static void main(String[] args) {
        // Output greeting to the standard console
        System.out.println("Hello, Java 21 World!");
    }
}
```

### প্রথম কোডের লাইন-বাই-লাইন বিশ্লেষণ:

1. **`public class Main`**:
   - Java-তে সমস্ত কোড কোনো না কোনো class-এর ভেতরে থাকতে হয়।
   - class-এর নাম `Main` হলে সোর্স ফাইলের নাম অবশ্যই `Main.java` হতে হবে।
   - `public` access modifier নির্দেশ করে এই class-টি যেকোনো প্যাকেজ বা ওএস runtime থেকে এক্সেসযোগ্য।
2. **`public static void main(String[] args)`**:
   - এটি Java অ্যাপ্লিকেশনের এক্সিকিউশন এন্ট্রি পয়েন্ট।
   - `public`: JVM যাতে বাইরে থেকে এই method কল করতে পারে।
   - `static`: class-এর কোনো object তৈরি না করেই যেন JVM সরাসরি method-টি এক্সিকিউট করতে পারে।
   - `void`: method-টি ওএস-কে কোনো মান রিটার্ন করে না।
   - `String[] args`: কমান্ড-লাইন থেকে পাস করা string argument-এর array।
3. **`System.out.println("Hello, Java 21 World!");`**:
   - `System`: Java স্ট্যান্ডার্ড লাইব্রেরির একটি বিল্ট-ইন class (`java.lang.System`)।
   - `out`: স্ট্যান্ডার্ড আউটপুট স্ট্রিম নির্দেশক static member (`PrintStream`)।
   - `println()`: কনসোলে টেক্সট প্রিন্ট করে স্বয়ংক্রিয়ভাবে নতুন লাইনে চলে যাওয়ার method।
   - লাইনের শেষে সেমিকোলন (`;`) বাধ্যতামূলক।

---

## ২. JDK বনাম JRE বনাম JVM

বিগিনারদের কাছে এই তিনটি শব্দের পার্থক্য প্রায়শই গুলিয়ে যায়। চলো আর্কিটেকচারাল হায়ারার্কিটি সহজে বুঝি:

```mermaid
flowchart TD
    subgraph JDK["JDK (Java Development Kit)"]
        subgraph JRE["JRE (Java Runtime Environment)"]
            subgraph JVM["JVM (Java Virtual Machine)"]
                JIT["JIT Compiler & HotSpot"]
                GC["Garbage Collector"]
                INT["Bytecode Interpreter"]
            end
            LIBS["Core Class Libraries (rt.jar, java.base)"]
        end
        TOOLS["Dev Tools (javac, jdb, jshell, jar)"]
    end
```

| উপাদান | পূর্ণরূপ | প্রধান দায়িত্ব |
| :--- | :--- | :--- |
| **JVM** | Java Virtual Machine | bytecode এক্সিকিউট করে, memory বরাদ্দ করে এবং প্ল্যাটফর্ম-স্পেসিফিক মেশিন ইন্সট্রাকশনে রূপান্তর করে। |
| **JRE** | Java Runtime Environment | JVM এবং কোড রান করার জন্য প্রয়োজনীয় স্ট্যান্ডার্ড class লাইব্রেরিসমূহের সমষ্টি। |
| **JDK** | Java Development Kit | কোড কম্পাইল ও ডেভেলপ করার সম্পূর্ণ প্যাকেজ (javac compiler, debugger, jshell এবং JRE সহ)। |

> [!note]
> Java 11 এর পর থেকে ওরাকল আলাদাভাবে স্ট্যান্ডঅ্যালোন JRE ডাউনলোড দেওয়া বন্ধ করেছে। আধুনিক ডেভেলপমেন্টে শুধুমাত্র **JDK** ইনস্টল করলেই স্বয়ংক্রিয়ভাবে runtime সহ সবকিছু পাওয়া যায়।

---

## ৩. bytecode ও JIT কম্পাইলেশন মেকানিজম

Java কোড কীভাবে এক্সিকিউট হয় তার পূর্ণ পাইপলাইন:

1. **সোর্স কোড (`.java`)**: মানুষের পাঠযোগ্য সাধারণ টেক্সট ফাইল।
2. **কম্পাইলেশন (`javac Main.java`)**: Java compiler সোর্স কোড পরীক্ষা করে প্ল্যাটফর্ম-নিরপেক্ষ **bytecode (`Main.class`)** ফাইল তৈরি করে।
3. **Class Loader**: JVM রান করার সময় প্রয়োজনীয় class-গুলো memory-তে লোড ও Bytecode Verifier দিয়ে ভ্যালিডেট করে।
4. **Interpreter**: bytecode-কে এক লাইন এক লাইন করে মেশিন কোডে রূপান্তর করে তৎক্ষণাৎ এক্সিকিউট করে (দ্রুত স্টার্টআপের জন্য)।
5. **JIT Compiler**: ইন্টারপ্রেটার চলাকালীন যে কোডগুলো বারবার এক্সিকিউট হচ্ছে (হটস্পট loop বা ঘন ঘন কল হওয়া method), সেগুলোকে রিয়েলটাইমে সরাসরি অত্যন্ত অপটিমাইজড নেটিভ মেশিন কোডে compile করে memory-তে ক্যাশ করে রাখে।

> [!tip]
> এই ইন্টারপ্রেটার + JIT হাইব্রিড আর্কিটেকচারের কারণেই Java অ্যাপ্লিকেশন স্টার্ট হওয়ার কিছুক্ষণ পর (Warm-up Period শেষে) সি বা সি++ কোডের প্রায় সমান দ্রুতগতিতে চলতে শুরু করে!

---

## ৪. টার্মিনালে কোড রান করার পদ্ধতি

### ট্র্যাডিশনাল পদ্ধতি (Java 1 থেকে বর্তমান):
```bash
# 1. Compile source code into bytecode (.class)
javac Main.java

# 2. Execute compiled class file via JVM (without .class extension)
java Main
```

### আধুনিক সিঙ্গেল-ফাইল পদ্ধতি (Java 11+):
Java 11 থেকে কোনো ম্যানুয়াল `javac` কম্পাইল ধাপ ছাড়াই সরাসরি `.java` ফাইল রান করা যায়:
```bash
java Main.java
```

### ইন্টারেক্টিভ REPL (`jshell` - Java 9+):
পাইথনের মতো টার্মিনালে তাৎক্ষণিক কোড টেস্ট করতে Java-তে রয়েছে `jshell`:
```bash
$ jshell
|  Welcome to JShell -- Version 21
jshell> int x = 10;
x ==> 10
jshell> System.out.println(x * 5);
50
```

---

## ৫. C++ vs Python vs Java vs Rust — সারসংক্ষেপ

| বিষয় | C++ | Python | Java 21 | Rust |
| :--- | :--- | :--- | :--- | :--- |
| **এক্সিকিউশন মডেল** | Native Binary | Interpreted | Bytecode + JIT | Native Binary |
| **memory ম্যানেজমেন্ট** | Manual (`malloc`/`free`) | GC (Reference Counting) | **Modern GC (G1/ZGC)** | Ownership (No GC) |
| **প্ল্যাটফর্ম স্বাধীনতা** | না (Recompile লাগে) | হ্যাঁ (ইন্টারপ্রেটার সাপেক্ষে) | **হ্যাঁ (WORA)** | না (Recompile লাগে) |
| **concurrency** | OS Threads | GIL বাধা | **Virtual Threads (Loom)** | OS Threads (Fearless) |
| **এন্টারপ্রাইজ অ্যাডপশন**| সিস্টেমস/গেমিং | এআই/স্ক্রিপ্টিং | **বিশ্বের #১ এন্টারপ্রাইজ ব্যাকএন্ড** | আধুনিক ক্লাউড/টুলস |

---

## সারসংক্ষেপ

- Java হলো প্ল্যাটফর্ম-স্বাধীন object-ওরিয়েন্টেড ভাষা যা bytecode ও JVM আর্কিটেকচারের ওপর কাজ করে।
- JDK তে থাকে ডেভেলপমেন্ট টুলস (`javac`), আর JVM নির্বাহ করে memory ও bytecode এক্সিকিউশন।
- আধুনিক Java 21 এ রয়েছে ভার্চুয়াল থ্রেডস, প্যাটার্ন ম্যাচিং ও আধুনিক syntax।
- পরবর্তী অধ্যায়ে আমরা Java-এর syntax, primitive data type, র্যাপার class এবং `var` type inference শিখব।
