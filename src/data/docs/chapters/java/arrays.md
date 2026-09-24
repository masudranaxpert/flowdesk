# Java Arrays — Beginner to Advanced

প্রোগ্রামিংয়ে প্রায়ই আমাদের একই ধরণের অনেকগুলো ডেটা একসাথে সংরক্ষণ করতে হয়। যেমন: class-এর ৫০ জন শিক্ষার্থীর রোল নম্বর বা সপ্তাহের ৭ দিনের তাপমাত্রা। ৫০টি আলাদা variable (`roll1, roll2, roll3...`) তৈরি করা যেমন কঠিন, তেমনি তা পরিচালনা করাও অসম্ভব।

এই সমস্যার সবচেয়ে সহজ ও মৌলিক সমাধান হলো **Array**।

---

## ১. Array কী ও Memory Structure

Array হলো একটি contiguous (ধারাবাহিক) memory ব্লক যেখানে একই data type-এর উপাদানগুলো ক্রমানুসারে সংরক্ষিত থাকে।
- Array-র প্রতিটি উপাদান memory-তে পাশাপাশি (consecutively) অবস্থান করে।
- প্রতিটি উপাদানের অবস্থান নির্দেশ করার জন্য ০ থেকে শুরু হওয়া একটি সংখ্যা ব্যবহার করা হয়, যাকে **Index** বলে।

```
  ইনডেক্স:       [0]      [1]      [2]      [3]      [4]
             ┌────────┬────────┬────────┬────────┬────────┐
  মান (Value): │   10   │   25   │   40   │   55   │   90   │
             └────────┴────────┴────────┴────────┴────────┘
  মেমোরি:     0x100    0x104    0x108    0x10C    0x110  (ধারাবাহিক মেমোরি)
```

> [!NOTE]
> **array-র দুটি প্রধান নিয়ম:**
> ১. **Same Data Type (Homogeneous)**: একই array-তে সংখ্যা এবং লেখা একসাথে রাখা যায় না। যদি `int` array হয়, তবে সব উপাদানই পূর্ণসংখ্যা হতে হবে।
> ২. **Fixed Size**: একবার array-র সাইজ নির্ধারণ করে ফেললে পরবর্তীতে তা আর ছোট বা বড় করা যায় না।

---

## ২. array syntax: `[]` ব্র্যাকেট আগে না পরে?

একজন নতুন শিক্ষার্থীর সবচেয়ে সাধারণ প্রশ্ন: `[]` ব্র্যাকেটটি কি টাইপের পরে লিখব, নাকি variable-এর নামের পরে?

```java
int[] numbers; // Preferred Java style (type-centric declaration)
int numbers[]; // Valid C/C++ style, discouraged in idiomatic Java
```

### কেন `int[] numbers` লেখা উত্তম?
- জাভাতে `int[]` পুরোটিকে একটি স্বতন্ত্র **data type** বিবেচনা করা হয় — যার অর্থ "একটি পূর্ণসংখ্যার array"।
- একাধিক variable ডিক্লেয়ার করার সময় এটি মারাত্মক বিভ্রান্তি এড়ায়:
  ```java
  int[] a, b; // Both a and b are declared as int[]
  
  int x[], y; // x is an array, while y is a primitive int
  ```
  তাই সবসময় টাইপের পরেই `[]` লেখা পেশাদার জাভা কোডের মানদণ্ড।

---

## ৩. তিনটি ধাপে array তৈরি (Step-by-Step)

জাভাতে একটি array পুরোপুরি তৈরি করতে ৩টি কাজ করতে হয়:

```java
public class ArrayStepByStep {
    public static void main(String[] args) {
        // Step 1: Declaration (reference variable declared on Stack)
        // No heap memory allocated yet
        int[] scores;

        // Step 2: Instantiation (allocate heap space for 5 integers)
        // 'new' allocates continuous memory block on Heap
        scores = new int[5];

        // Step 3: Initialization (assign values by 0-based index)
        // Store elements into specific indexed memory slots
        scores[0] = 85; // Element at index 0
        scores[1] = 92; // Element at index 1
        scores[2] = 78; // Element at index 2
        scores[3] = 90; // Element at index 3
        scores[4] = 88; // Element at index 4

        // Read element from index 0:
        System.out.println("প্রথম শিক্ষার্থীর স্কোর: " + scores[0]);
    }
}
```

### new Keyword ও Memory Allocation:
জাভাতে প্রিমিটিভ সংখ্যা সরাসরি stack memoryতে থাকে, কিন্তু array হলো একটি object। `new int[5]` লেখার মাধ্যমে JVM-কে বলা হয়: *"heap memoryতে ৫টি পূর্ণসংখ্যা রাখার মতো পর্যাপ্ত খালি জায়গা বরাদ্দ করো।"*

---

## ৪. index ০ থেকে কেন শুরু হয়?

দৈনন্দিন জীবনে আমরা গণনা শুরু করি ১ থেকে, কিন্তু প্রোগ্রামিংয়ে array-র index শুরু হয় **০ (Zero)** থেকে।

এর কারণ হলো কম্পিউটারের অভ্যন্তরীণ memory হিসাব:
- array-র variable-টি (`scores`) memory-র একদম শুরুর অ্যাড্রেসটি (Base Address) চিনে রাখে।
- index নির্দেশ করে শুরুর অ্যাড্রেস থেকে উপাদানটি কত ঘর দূরে (Offset) আছে।
- প্রথম উপাদানটি শুরুর বিন্দুতেই থাকে, অর্থাৎ দূরত্ব হলো `০`। তাই প্রথম ঘর হলো `scores[0]`।
- ৫ সাইজের array-র শেষ ঘরটির দূরত্ব হবে `৪` ঘর দূরে, তাই শেষ index `scores[4]`।

> [!WARNING]
> **ArrayIndexOutOfBoundsException (সবচেয়ে পরিচিত ভুল):**
> যদি ৫ সাইজের array-তে কেউ `scores[5]` এক্সেস করতে চায়, তবে Java তাৎক্ষণিকভাবে এরর ছুড়ে মারবে। কারণ বৈধ index কেবল `০` থেকে `৪` পর্যন্ত।

---

## ৫. মান না দিলে ঘরে কী থাকে? (স্বয়ংক্রিয় ডিফল্ট মান)

যদি আপনি `new int[3]` লিখেন কিন্তু ঘরে কোনো মান না বসান, তবে Java নিজে থেকেই ঘরগুলো খালি না রেখে ডিফল্ট মান দিয়ে দেয়:

| array-র data type | স্বয়ংক্রিয় ডিফল্ট মান |
| :--- | :--- |
| `int`, `byte`, `short`, `long` | `0` |
| `double`, `float` | `0.0` |
| `boolean` | `false` |
| `char` | `'\u0000'` (খালি ক্যারেক্টার) |
| object বা `String` | `null` |

---

## ৬. এক লাইনে array তৈরি (Array Literals)

মান জানা থাকলে ধাপ ১, ২ ও ৩ আলাদা না করে এক লাইনেই সংক্ষেপে array ডিক্লেয়ার ও মান দেওয়া যায়:

```java
// Array literal syntax (combines declaration, allocation, and initialization)
int[] ages = {18, 21, 24, 20, 22};
String[] friends = {"Rahim", "Karim", "Sabbir"};

// Array length property (immutable dimension)
System.out.println("Total items: " + friends.length); // Output: 3
```

> [!TIP]
> লক্ষ্য করুন: array-র ক্ষেত্রে `friends.length` কোনো method নয়, এটি একটি প্রোপার্টি (তাই শেষে কোনো ব্র্যাকেট `()` নেই)। কিন্তু স্ট্রিংয়ের ক্ষেত্রে `name.length()` method লিখতে হয়।

---

## ৭. loop দিয়ে array-র সব উপাদান পড়া

array-তে ১০০টি উপাদান থাকলে ১০০ বার `println` না লিখে loop ব্যবহার করা হয়:

```java
public class ArrayLoopDemo {
    public static void main(String[] args) {
        int[] marks = {75, 82, 90, 68, 95};

        // 1. Traditional indexed for-loop:
        System.out.println("--- সাধারণ for লুপ ---");
        for (int i = 0; i < marks.length; i++) {
            System.out.println("ইনডেক্স " + i + " এর মান: " + marks[i]);
        }

        // 2. Enhanced for-each loop:
        System.out.println("--- ফর-ইচ লুপ ---");
        for (int m : marks) {
            System.out.println("প্রাপ্ত নম্বর: " + m);
        }
    }
}
```

---

## ৮. object-এর array ও memory ফাঁদ

সাধারণ সংখ্যার array আর object-এর (যেমন `String` বা কাস্টম class) array-র মধ্যে একটি বিশাল পার্থক্য রয়েছে যা নতুনরা ভুল করে:

```java
class Student {
    String name;
    Student(String name) { this.name = name; }
}

public class ObjectArrayDemo {
    public static void main(String[] args) {
        Student[] list = new Student[2]; // Allocates array of reference pointers; values are null

        // Warning: accessing list[0].name before instantiation throws NullPointerException
        // System.out.println(list[0].name);

        // Correct: instantiate concrete object for each slot
        list[0] = new Student("Karim");
        list[1] = new Student("Fahim");

        System.out.println("প্রথম ছাত্র: " + list[0].name);
    }
}
```

---

## ৯. বহুমাত্রিক array (2D ও Jagged Arrays)

### ২ডি ম্যাট্রিক্স (Rows ও Columns):
স্কুলের ক্লাসরুমে টেবিলের সারির মতো রো (Row) এবং কলাম (Column) আকারে ডেটা রাখতে 2D array লাগে:

```java
public class TwoDimArrayDemo {
    public static void main(String[] args) {
        // 2D Array matrix (3 rows x 2 columns)
        int[][] matrix = {
            {1, 2},
            {3, 4},
            {5, 6}
        };

        // Access row index 1, column index 0:
        System.out.println("Value: " + matrix[1][0]); // Output: 3

        // Traverse 2D matrix with nested loops:
        for (int row = 0; row < matrix.length; row++) {
            for (int col = 0; col < matrix[row].length; col++) {
                System.out.print(matrix[row][col] + " ");
            }
            System.out.println();
        }
    }
}
```

### জ্যাগেড array (Jagged / Ragged Array):
জাভাতে ২ডি array আসলে "array-র ভেতরে অন্য একটি array"। ফলে প্রতিটি রো-এর কলাম সাইজ সমান না-ও হতে পারে:

```java
int[][] uneven = new int[3][]; // 3 rows
uneven[0] = new int[2]; // Row 0 has 2 columns
uneven[1] = new int[5]; // Row 1 has 5 columns
uneven[2] = new int[1]; // Row 2 has 1 column
```

---

## ১০. array কপি করা (`a = b` কেন কপি নয়?)

যদি আপনি লিখেন:
```java
int[] a = {1, 2, 3};
int[] b = a; // Reference copy only (both point to same heap array)
b[0] = 99;
System.out.println(a[0]); // Prints 99 due to shared reference
```
কারণ `b = a` লিখলে কোনো নতুন array তৈরি হয় না; দুটো variable memory-র একই বাড়িকে নির্দেশ করে।

### সত্যিকারভাবে নতুন কপি তৈরির ৩টি উপায়:
```java
import java.util.Arrays;

public class CopyDemo {
    public static void main(String[] args) {
        int[] original = {10, 20, 30, 40};

        // 1. Shallow copy via Arrays.copyOf:
        int[] copy1 = Arrays.copyOf(original, original.length);

        // 2. High-performance native memory copy via System.arraycopy:
        int[] copy2 = new int[original.length];
        System.arraycopy(original, 0, copy2, 0, original.length);

        // 3. Array cloning via clone():
        int[] copy3 = original.clone();
    }
}
```

---

## ১১. `java.util.Arrays` ইউটিলিটি টুলস

জাভার সাথে একটি চমৎকার রেডিমেড টুলবক্স আছে যার নাম `java.util.Arrays`:

```java
import java.util.Arrays;

public class ArraysHelperDemo {
    public static void main(String[] args) {
        int[] numbers = {45, 12, 85, 32, 8};

        // 1. Print array contents:
        System.out.println("Array: " + Arrays.toString(numbers)); // [45, 12, 85, 32, 8]

        // 2. In-place dual-pivot Quicksort:
        Arrays.sort(numbers);
        System.out.println("Sorted: " + Arrays.toString(numbers)); // [8, 12, 32, 45, 85]

        // 3. Binary search on sorted array:
        int index = Arrays.binarySearch(numbers, 32);
        System.out.println("৩২ পাওয়া গেছে ইনডেক্স: " + index);

        // 4. Compare element values across two arrays:
        int[] a = {1, 2};
        int[] b = {1, 2};
        System.out.println("Equal: " + Arrays.equals(a, b)); // true
    }
}
```

---

## ১২. Array vs ArrayList

| বিষয় | সাধারণ Array (`int[]`) | `ArrayList` (কালেকশন) |
| :--- | :--- | :--- |
| **আকার** | ফিক্সড (পরিবর্তন করা যায় না) | ডায়নামিক (প্রয়োজনে নিজে থেকেই বাড়ে) |
| **প্রিমিটিভ সমর্থন** | সরাসরি `int`, `double` রাখতে পারে | সরাসরি পারে না, Wrapper object লাগে (`Integer`) |
| **গতি ও memory** | অত্যন্ত ফাস্ট ও memory সাশ্রয়ী | সামান্য ধীরগতির |
| **কখন ব্যবহার করবেন** | যখন উপাদানের সংখ্যা আগে থেকেই নির্দিষ্ট জানা থাকে | যখন উপাদানের সংখ্যা প্রতিনিয়ত বাড়তে বা কমতে পারে |

---

## সারসংক্ষেপ (Quick Revision)
1. array তৈরি করার সবচেয়ে ভালো syntax: `int[] arr = new int[size];`
2. index সর্বদা `0` থেকে শুরু হয়ে `size - 1` এ শেষ হয়।
3. array-র সাইজ জানার জন্য কোনো ব্র্যাকেট ছাড়া `arr.length` ব্যবহার করুন।
4. কনসোলে সুন্দরভাবে দেখতে `Arrays.toString(arr)` ব্যবহার করুন।
5. একটি নতুন কপি তৈরি করতে `Arrays.copyOf(arr, arr.length)` ব্যবহার করুন।
