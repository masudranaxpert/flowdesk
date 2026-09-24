# Java Control Flow ও loop — Beginner to Advanced

কম্পিউটার প্রোগ্রাম সাধারণত উপর থেকে নিচে প্রতিটি লাইন পরপর চালিয়ে যায়। কিন্তু বাস্তব জীবনে আমাদের সিদ্ধান্ত নিতে হয়: *"যদি বৃষ্টি হয় তবে ছাতা নেব, না হলে নেব না"* কিংবা *"যতক্ষণ না কাজটি শেষ হয়, বারবার করো"*\।

জাভাতে এই ধরণের সিদ্ধান্ত গ্রহণ এবং পুনরাবৃত্তি নিয়ন্ত্রণের মেকানিজমকে বলা হয় **কন্ট্রোল ফ্লো (Control Flow)**।

---

## ১. Conditionals: `if`, `else if` ও `else`

জাভাতে শর্ত (Condition) সর্বদা কঠোরভাবে সত্য (`true`) অথবা মিথ্যা (`false`) হতে হবে।

```java
public class DecisionDemo {
    public static void main(String[] args) {
        int score = 82;

        if (score >= 90) {
            System.out.println("গ্রেড: A+");
        } else if (score >= 80) {
            System.out.println("Grade: A"); // Condition met, branch executed
        } else if (score >= 70) {
            System.out.println("গ্রেড: B");
        } else {
            System.out.println("পুনরায় চেষ্টা করুন");
        }
    }
}
```

> [!NOTE]
> সি বা পাইথনের মতো জাভাতে `if (1)` বা `if ("hello")` লেখা যায় না। শর্তে সর্বদা তুলনামূলক অপারেটর (`==`, `!=`, `>`, `<`, `>=`, `<=`) ব্যবহার করে বুলিয়ান ফলাফল পেতে হয়।

### Ternary Operator:
সহজ কন্ডিশনে variable-এ মান বসাতে এক লাইনেই লেখা যায়:
```java
int age = 19;
// condition ? value_if_true : value_if_false
String status = (age >= 18) ? "প্রাপ্তবয়স্ক" : "অপ্রাপ্তবয়স্ক";
```

---

## ২. Loops ও Iteration

জাভাতে একই কাজ বারবার করানোর জন্য প্রধানত ৩ ধরনের loop রয়েছে:

### for Loop:
```java
//    (1) Init        (2) Condition   (4) Step
for (int i = 1;       i <= 3;         i++) {
    // (3) Loop body execution
    System.out.println("গণনা: " + i);
}
```

#### loop-এর ৪টি ধাপ কীভাবে কাজ করে?
1. **শুরু (`int i = 1`)**: loop শুরুর পূর্বে এই অংশটি **শুধুমাত্র একবার** চলে।
2. **শর্ত (`i <= 3`)**: প্রতিবার loop ঘোরার আগে শর্ত পরীক্ষা হয়। সত্য হলে ভেতরে ঢুকবে, মিথ্যা হলে loop চিরতরে থেমে যাবে।
3. **loop বডি**: কার্লি ব্র্যাকেট `{}` এর ভেতরের কোড রান করে।
4. **বৃদ্ধি (`i++`)**: বডি শেষ হলে কাউন্টার ১ বাড়ে। এরপর আবার ধাপ ২-এ ফিরে গিয়ে শর্ত পরীক্ষা করে।

---

### খ. `while` loop (যখন জানা নেই ঠিক কতক্ষণ ঘুরবে):
যতক্ষণ শর্তটি সত্য থাকবে, ততক্ষণ loop-টি চলতেই থাকবে:
```java
int balance = 500;
while (balance > 0) {
    System.out.println("ক্রয় সম্পন্ন! ব্যালেন্স আছে: " + balance);
    balance -= 100; // Decrement counter to guarantee termination
}
```

> [!WARNING]
> যদি loop-এর ভেতরের শর্ত পরিবর্তনের কোড (`balance -= 100`) লিখতে ভুলে যান, তবে loop-টি চিরকাল ঘুরতেই থাকবে—যাকে বলা হয় **Infinite Loop**।

---

### গ. `do-while` loop (কমপক্ষে একবার চালানো নিশ্চিত করতে):
সাধারণ `while` loop-এ শুরুতে শর্ত মিথ্যা হলে কোড একবারও চলে না। কিন্তু `do-while` আগে একবার কাজ করে, তারপর শর্ত পরীক্ষা করে:
```java
int number = 10;
do {
    System.out.println("শর্ত মিথ্যা হলেও এই লাইনটি একবার চলবেই!");
} while (number < 5);
```

---

## ৩. break vs continue

loop-এর স্বাভাবিক চক্র পরিবর্তন করতে দুটি বিশেষ কিওয়ার্ড ব্যবহৃত হয়:

- **`break`**: loop-কে তাৎক্ষণিকভাবে চিরতরে বন্ধ করে loop-এর বাইরে বের হয়ে আসে।
- **`continue`**: বর্তমান চক্রের বাকি কাজটুকু স্কিপ করে সরাসরি পরবর্তী চক্রে লাফিয়ে চলে যায়।

```java
public class JumpDemo {
    public static void main(String[] args) {
        for (int i = 1; i <= 5; i++) {
            if (i == 2) {
                continue; // Skip current iteration when condition is met
            }
            if (i == 4) {
                break; // Terminate loop immediately upon matching condition
            }
            System.out.println("সংখ্যা: " + i);
        }
        // Output: 1, 3
    }
}
```

---

## ৪. আধুনিক Switch Expressions (Java 14+)

পুরনো সি-স্টাইলের সুইচে প্রতিটি কেসের পর `break;` লিখতে ভুলে গেলে নিচে সাইলেন্টলি ফল-থ্রু (Fall-through) হয়ে ভয়ানক বাগ হতো। আধুনিক জাভায় এসেছে অ্যারো syntax (`->`):

```java
public class ModernSwitchDemo {
    public static void main(String[] args) {
        String day = "FRIDAY";

        // Switch expression directly returning assigned value:
        String dayType = switch (day) {
            case "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY" -> "কর্মদিবস";
            case "SATURDAY", "SUNDAY" -> "ছুটির দিন";
            default -> "অবৈধ দিন";
        };

        System.out.println(day + " হলো: " + dayType);
    }
}
```

### কেন আধুনিক সুইচ এত চমৎকার?
1. কোনো `break` লেখার দরকার নেই; কখনোই ভুল করে নিচের কেসে গড়িয়ে পড়ে না।
2. কমা দিয়ে একাধিক শর্ত একসাথে লেখা যায় (`case "SATURDAY", "SUNDAY"`).
3. সরাসরি এক্সপ্রেশন হিসেবে variable-এ অ্যাসাইন করা যায়।

### `yield` কিওয়ার্ড:
যদি কোনো কেসে এক লাইনের বেশি হিসাব-নিকাশ করে মান ফেরত দিতে হয়, তখন `return` এর বদলে `yield` লেখা হয়:
```java
int bonus = switch (role) {
    case "MANAGER" -> 5000;
    case "DEVELOPER" -> {
        int baseBonus = 3000;
        int overtime = 1200;
        yield baseBonus + overtime; // Yield calculated value from block
    }
    default -> 1000;
};
```

---

## ৫. Pattern Matching in Switch (Java 21 LTS)

Java 21-এ সুইচ স্টেটমেন্ট শুধু string বা সংখ্যা নয়, যেকোনো object-এর টাইপ দেখে স্বয়ংক্রিয়ভাবে কাস্টিং ও প্যাটার্ন ম্যাচ করতে পারে:

```java
public class PatternSwitchDemo {
    static void checkType(Object obj) {
        String description = switch (obj) {
            case Integer i -> "এটি একটি পূর্ণসংখ্যা, যার বর্গ: " + (i * i);
            case String s when s.length() > 5 -> "লম্বা টেক্সট: " + s.toUpperCase();
            case String s -> "ছোট টেক্সট: " + s;
            case null -> "Object is null"; // Pattern matching with direct null handling
            default -> "অন্য কোনো অবজেক্ট টাইপ: " + obj.toString();
        };

        System.out.println(description);
    }
}
```

> [!TIP]
> `when` ক্লজটিকে বলা হয় **গার্ড (Guard)**। এটি টাইপ ম্যাচ করার পাশাপাশি অতিরিক্ত শর্ত (যেমন `s.length() > 5`) যাচাই করতে পারে।

---

## সারসংক্ষেপ
1. সত্য-মিথ্যা সিদ্ধান্তের জন্য `if-else` বা ternary operator `? :` ব্যবহার করুন।
2. জানা সংখ্যক ঘূর্ণনের জন্য `for` loop এবং অনির্দিষ্ট মেয়াদের জন্য `while` loop ব্যবহার করুন।
3. চক্র পুরোপুরি থামাতে `break` এবং বর্তমান চক্রটি এড়িয়ে যেতে `continue` ব্যবহার করুন।
4. আধুনিক Java 14+ এ সবসময় অ্যারো syntax (`->`) সুইচ এক্সপ্রেশন ব্যবহার করুন, যা নিরাপদ ও ত্রুটিমুক্ত।
