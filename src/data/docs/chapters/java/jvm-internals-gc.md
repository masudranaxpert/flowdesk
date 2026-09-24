# JVM Architecture ও Garbage Collection

জাভার সবচেয়ে বড় শক্তি হলো এর ভার্চুয়াল মেশিন (JVM)। জাভা সোর্স কোড সরাসরি মেশিনের নেটিভ কোডে কম্পাইল না হয়ে bytecode-এ (`.class`) রূপান্তরিত হয়, যা যেকোনো প্ল্যাটফর্মে JVM-এর সাহায্যে রান করতে পারে ("Write Once, Run Anywhere")।

---

## ১. JVM আর্কিটেকচার ওভারভিউ

JVM মূলত ৩টি প্রধান সাবসিস্টেম নিয়ে গঠিত:

```
┌────────────────────────────────────────────────────────┐
│               ClassLoader Subsystem                    │
│      Loading ───► Linking ───► Initialization          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              JVM Runtime Data Areas                    │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │     Heap Memory       │   │  Metaspace (Class)   │  │
│  │ (Eden, Survivor, Old) │   │  (Non-Heap Memory)   │  │
│  └───────────────────────┘   └──────────────────────┘  │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │    JVM Stacks         │   │   Program Counter    │  │
│  │ (Per-Thread Frames)   │   │     (PC) Registers   │  │
│  └───────────────────────┘   └──────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Execution Engine                      │
│   Interpreter  ◄──►  JIT Compiler (C1/C2)  ◄──► GC     │
└────────────────────────────────────────────────────────┘
```

---

## ২. runtime memory বিভাগ: Stack বনাম Heap

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│              Stack Memory              │              Heap Memory               │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ প্রতিটি থ্রেডের জন্য স্বতন্ত্র (Per-Thread)│ পুরো JVM অ্যাপের জন্য শেয়ার্ড গ্লোবাল  │
│ প্রিমিটিভ ভ্যালু ও মেথড ফ্রেম রাখে    │ সব অবজেক্ট ইনস্ট্যান্স ও অ্যারে রাখে   │
│ মেথড শেষ হওয়ার সাথে সাথেই মেমোরি মুক্ত │ Garbage Collector মেমোরি ক্লিন করে      │
│ সাইজ তুলনামূলক ছোট (~1 MB ডিফল্ট)      │ সাইজ অনেক বড় (গিগাবাইট স্কেল)          │
│ স্ট্যাক উপচে পড়লে: `StackOverflowError`│ হিপ মেমোরি ফুরালে: `OutOfMemoryError`  │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

---

## ৩. Generational Garbage Collection আর্কিটেকচার

JVM-এর memory ম্যানেজমেন্ট **Weak Generational Hypothesis** এর ওপর প্রতিষ্ঠিত:
> *"অধিকাংশ object তৈরির কিছুক্ষণের মধ্যেই অপ্রয়োজনীয় হয়ে মারা যায়।"*

```
┌──────────────────────── Young Generation ────────────────────────┐ ┌── Old Generation ──┐
│  ┌────────────────────────┐  ┌─────────────┐  ┌─────────────┐  │ │                     │
│  │      Eden Space        │  │ Survivor S0 │  │ Survivor S1 │  │ │   Tenured / Old     │
│  │   (New objects born)   │  │    (From)   │  │     (To)    │  │ │      Space          │
│  └────────────────────────┘  └─────────────┘  └─────────────┘  │ │ (Long-lived objects)│
└──────────────────────────────────┬───────────────────────────────┘ └──────────┬──────────┘
                                   │ Minor GC                                   │ Major / Full GC
                                   └──────────── Promotion after N cycles ──────┘
```

### memory লাইফসাইকেল:
1. সব নতুন object **Eden Space**-এ তৈরি হয়।
2. Eden ভরে গেলে একটি দ্রুতগতির **Minor GC** রান করে। বেঁচে থাকা object-গুলো Survivor Space (S0)-এ পাঠানো হয়।
3. object-গুলো S0 এবং S1 এর মধ্যে অল্টারনেট করে এবং প্রতিবার তাদের বয়স (Tenuring threshold) বাড়ে।
4. পর্যাপ্ত বয়স (ডিফল্ট ১৫ সাইকেল) পার হলে object-গুলো **Old Generation**-এ স্থানান্তরিত (Promote) হয়।
5. Old Generation ভরে গেলে একটি তুলনামূলক বড় **Major GC বা Full GC** সংঘটিত হয়।

---

## ৪. আধুনিক Garbage Collectors (G1GC বনাম ZGC)

| গারবেজ কালেক্টর | অ্যালগরিদম টাইপ | ডিফল্ট ইন | STW Pause Time | টার্গেট ইউসকেস |
| :--- | :--- | :--- | :--- | :--- |
| **G1 GC** (Garbage-First) | Region-based, Generational | Java 9+ | ২০০ মিলিসেকেন্ডের নিচে | মাল্টি-গিগাবাইট heap, ব্যালেন্সড থ্রুপুট |
| **ZGC** (Z Garbage Collector) | Colored Pointers, Load Barriers | Java 21 LTS | **১ মিলিসেকেন্ডের নিচে (< 1ms)** | হাই-পারফরম্যান্স আল্ট্রা লো-লেটেন্সি ফিনটেক |
| **Parallel GC** | Multi-threaded Mark-Copy | Java 8 (Legacy) | দীর্ঘ পজ (Pause) টাইম | ব্যাকগ্রাউন্ড ব্যাচ জব (High Throughput) |

---

## ৫. এন্টারপ্রাইজ JVM টিউনিং ফ্ল্যাগসমূহ

প্রোডাকশন এনভায়রনমেন্টে JVM চালু করার কিছু বহুল ব্যবহৃত ও পরীক্ষিত ফ্ল্যাগ:

```bash
# Production Startup Command Example:
java -Xms4g -Xmx4g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/var/log/dumps/oom.hprof \
     -Xlog:gc*:file=/var/log/gc.log:time,uptime,pid:filecount=5,filesize=100M \
     -jar enterprise-app.jar
```

### ফ্ল্যাগের ব্যাখ্যা:
- `-Xms4g -Xmx4g`: ইনিশিয়াল এবং ম্যাক্সিমাম heap সাইজ সমান রাখা হয়েছে, যাতে runtime-এ heap রিসাইজিংয়ের কারণে JVM ওভারহেড না হয়।
- `-XX:+UseG1GC`: G1 কালেক্টর সক্রিয় করা।
- `-XX:MaxGCPauseMillis=200`: GC পজ টাইম ২০০ মিলিসেকেন্ডের মধ্যে রাখার সফট গোল নির্ধারণ।
- `-XX:+HeapDumpOnOutOfMemoryError`: memory লিকের কারণে ক্র্যাশ করলে সাথে সাথে memory অ্যানালাইসিস ডাম্প ফাইল তৈরি করবে।
- `-Xlog:gc*`: আধুনিক ইউনিফায়েড GC লগিং যা প্রোডাকশন পারফরম্যান্স পর্যবেক্ষণে ব্যবহৃত হয়।

---

## ৬. memory লিক শনাক্তকরণ ও প্রতিরোধ

জাভাতে memory লিক বলতে বোঝায় এমন কোনো object যা প্রোগ্রামের লজিকের আর কোনো কাজে লাগবে না, কিন্তু কোনো সক্রিয় রুট রেফারেন্সের সাথে যুক্ত থাকায় GC তাকে ডিলিট করতে পারছে না।

### প্রধান কারণসমূহ:
1. **Unbounded Static Collections**: কোনো `static List` বা `static Map` এ ডেটা অ্যাড করতেই থাকা কিন্তু কখনোই ক্লিয়ার না করা।
2. **Unclosed Resources**: ডেটাবেস কানেকশন, সকেট বা ফাইল হ্যান্ডেল খোলা রাখা।
3. **Forgotten Listeners**: ইভেন্ট লিসেনার রেজিস্টার করে আনরেজিস্টার না করা।
4. **ThreadLocal Variable Leaks**: thread পুলে টাস্ক শেষে `ThreadLocal.remove()` কল না করা।
