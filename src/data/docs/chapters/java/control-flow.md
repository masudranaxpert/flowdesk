# Control Flow ও Modern Switch

যেকোনো বাস্তবধর্মী অ্যাপ্লিকেশনে সিদ্ধান্ত গ্রহণ (Decision Making) এবং পুনরাবৃত্তি (Looping) অপরিহার্য। Java-তে শর্তসাপেক্ষ এক্সিকিউশনের জন্য রয়েছে ঐতিহ্যবাহী `if-else`, আধুনিক `switch` এক্সপ্রেশন এবং বিভিন্ন ধরনের লুপ। আধুনিক Java 14+ ও Java 21-এ `switch` স্টেটমেন্ট এক বৈপ্লবিক রূপ নিয়েছে, যা সি-স্টাইলের পুরানো ফল-থ্রু বাগ দূর করে প্যাটার্ন ম্যাচিং সমর্থন করে।

---

## ১. if / else if / else

Java-তে শর্ত সর্বদা কঠোরভাবে `boolean` (`true` বা `false`) হতে হয়। পাইথন বা সি-এর মতো কোনো পূর্ণসংখ্যা (`if (1)`) বা অবজেক্টের সরাসরি ট্রুথি/ফলসি মূল্যায়ন Java অনুমোদন করে না:

```java
public class IfElseDemo {
    public static void main(String[] args) {
        int score = 85;

        if (score >= 90) {
            System.out.println("গ্রেড: A+");
        } else if (score >= 80) {
            System.out.println("গ্রেড: A");
        } else if (score >= 70) {
            System.out.println("গ্রেড: B");
        } else {
            System.out.println("পুনরায় চেষ্টা করো");
        }
    }
}
```

### টারনারি অপারেটর (Ternary Operator):
সংক্ষিপ্ত এক লাইনের কন্ডিশনাল অ্যাসাইনমেন্টের জন্য:
```java
int time = 20;
String greeting = (time < 18) ? "শুভ দিন" : "শুভ সন্ধ্যা";
```

---

## ২. আধুনিক Switch Expressions (Java 14+)

ঐতিহ্যবাহী সি-স্টাইল `switch` এ প্রতিটি কেসের পর `break` লিখতে ভুলে গেলে নিচে সাইলেন্টলি ফল-থ্রু (Fall-through) হয়ে অপ্রত্যাশিত বাগ সৃষ্টি হতো। আধুনিক Java 14+ থেকে অ্যারো সিনট্যাক্স (`->`) ভিত্তিক **Switch Expression** চালু হয়েছে যা সরাসরি ভ্যালু রিটার্ন করতে পারে:

```java
public class ModernSwitchDemo {
    public static void main(String[] args) {
        String day = "SATURDAY";

        // Switch as an expression returning a value directly
        String dayType = switch (day) {
            case "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY" -> "কর্মদিবস";
            case "SATURDAY", "SUNDAY" -> "ছুটির দিন";
            default -> "অবৈধ দিন";
        };

        System.out.println(day + " হলো: " + dayType);
    }
}
```

### প্রধান সুবিধাসমূহ:
1. **কোনো `break` কি-ওয়ার্ডের প্রয়োজন নেই**: অ্যারো সিনট্যাক্সে কখনো ফল-থ্রু ঘটে না।
2. **একাধিক কেস একত্রীকরণ**: কমা দিয়ে একাধিক শর্ত একসাথে লেখা যায় (`case A, B, C -> ...`)।
3. **এক্সপ্রেশন হিসেবে সরাসরি রিটার্ন**: ভ্যারিয়েবলে মান অ্যাসাইন করা যায়।

### `yield` কি-ওয়ার্ড:
যদি কোনো কেসের ভেতরে একাধিক লাইনের ব্লক এক্সিকিউট করে মান ফেরত দিতে হয়, তখন `yield` ব্যবহার করা হয়:

```java
int calculatedValue = switch (code) {
    case 1 -> 100;
    case 2 -> {
        // Multi-line block computation
        int factor = computeFactor();
        yield factor * 200; // Return value from block
    }
    default -> 0;
};
```

---

## ৩. Pattern Matching in Switch (Java 21+)

Java 21 LTS এ `switch` এক্সপ্রেশনে সরাসরি টাইপ প্যাটার্ন ম্যাচিং ও গার্ড কন্ডিশন (`when`) যুক্ত হয়েছে, যা পূর্বে প্রচুর ভার্বোস `instanceof` চেকিং লাগত:

```java
public class PatternMatchingSwitch {
    static void printFormatted(Object obj) {
        // Switch matches object runtime type directly
        String result = switch (obj) {
            case Integer i -> String.format("পূর্ণসংখ্যা: %d (দ্বিগুণ: %d)", i, i * 2);
            case Long l    -> String.format("লং সংখ্যা: %d", l);
            case Double d  -> String.format("দশমিক সংখ্যা: %.2f", d);
            case String s when s.length() > 5 -> "লম্বা স্ট্রিং: " + s.toUpperCase();
            case String s  -> "ছোট স্ট্রিং: " + s;
            case null      -> "নাল অবজেক্ট পাওয়া গেছে!";
            default        -> "অজানা অবজেক্ট টাইপ: " + obj.toString();
        };

        System.out.println(result);
    }
}
```

> [!tip]
> খেয়াল করো `case null -> ...` সরাসরি হ্যান্ডেল করা যায়! পুরানো Java-তে switch-এ নাল অবজেক্ট আসলে তাৎক্ষণিক `NullPointerException` ঘটত।

---

## ৪. লুপ ও পুনরাবৃত্তি (Loops)

Java-তে ৪ ধরনের লুপ রয়েছে:

### ক. ক্লাসিক্যাল For লুপ:
```java
// Initialization; condition; increment
for (int i = 1; i <= 5; i++) {
    System.out.println("গণনা: " + i);
}
```

### খ. এনহ্যান্সড For লুপ (For-Each):
অ্যারে বা কালেকশনের প্রতিটি উপাদান সহজে ইটারেট করতে:
```java
String[] fruits = {"আম", "জাম", "কাঁঠাল"};
for (String fruit : fruits) {
    System.out.println("ফল: " + fruit);
}
```

### গ. While এবং Do-While লুপ:
- `while`: শুরুতে শর্ত যাচাই করে, মিথ্যা হলে একবারও চলে না।
- `do-while`: আগে একবার বডি এক্সিকিউট করে, তারপর শর্ত যাচাই করে (ন্যূনতম একবার চলা নিশ্চিত)।

```java
int count = 0;
do {
    System.out.println("কমপক্ষে একবার প্রিন্ট হবে: " + count);
    count++;
} while (count < 1);
```

---

## ৫. লেবেলযুক্ত লুপ (Labeled Loops)

নেস্টেড লুপের গভীরে কাজ করার সময় ভেতরের লুপ থেকে সরাসরি বাইরের লুপটি ব্রেক বা কন্টিনিউ করতে লেবেল সিনট্যাক্স ব্যবহার করা হয়:

```java
public class LabeledLoopDemo {
    public static void main(String[] args) {
        // Outer loop label
        searchMatrix:
        for (int row = 0; row < 5; row++) {
            for (int col = 0; col < 5; col++) {
                if (row == 2 && col == 3) {
                    System.out.println("লক্ষ্য পাওয়া গেছে! পুরো গ্রিড স্ক্যান বন্ধ।");
                    break searchMatrix; // Exits the outer loop immediately
                }
            }
        }
    }
}
```

---

## সারসংক্ষেপ

- Java-তে কন্ডিশন কঠোরভাবে `boolean` হতে হয়।
- আধুনিক `switch` এক্সপ্রেশন (`->`) ফল-থ্রু মুক্ত, ভ্যালু রিটার্ন করতে পারে এবং Java 21 এ প্যাটার্ন ম্যাচিং সমর্থন করে।
- কালেকশন ও অ্যারের জন্য `for-each` লুপ সবচেয়ে নিরাপদ ও পঠনযোগ্য।
- নেস্টেড লুপে এক্সিট করতে লেবেলযুক্ত `break label;` ব্যবহার করা যায়।
- পরবর্তী অধ্যায়ে আমরা Java-এর প্রাণকেন্দ্র — Classes, Objects ও Encapsulation শিখব।
