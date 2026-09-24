# Java Arrays ও Memory Architecture

Java-তে **অ্যারে (Array)** হলো সবচেয়ে মৌলিক ও বহুল ব্যবহৃত ডেটা স্ট্রাকচার। এটি একই ডেটা টাইপের একাধিক উপাদানকে একটি নির্দিষ্ট ক্রমে সংলগ্ন মেমোরিতে (Contiguous Memory) সংরক্ষণ করে। অন্যান্য অনেক ভাষার (যেমন C/C++) মতো Java-তে অ্যারে কোনো সাধারণ পয়েন্টার নয়, বরং **Java-তে প্রতিটি অ্যারে সরাসরি Heap মেমোরিতে অবস্থিত একটি First-class Object**।

---

## ১. অ্যারে কী ও এর মেমোরি আর্কিটেকচার

Java-তে যেকোনো অ্যারে তৈরি করলে JVM ব্যাকগ্রাউন্ডে একটি স্পেশাল ইন্টারনাল ক্লাস তৈরি করে (যেমন `int[]` এর জন্য `[I`, `String[]` এর জন্য `[Ljava.lang.String;`)।

```
        Stack Memory                                 Heap Memory
┌───────────────────────────┐           ┌─────────────────────────────────────────┐
│                           │           │ Array Object Header (Mark Word, Klass)  │
│  numbers (Reference)      │──────────►├─────────────────────────────────────────┤
│  [Address: 0x7FFF12A0]    │           │ length = 4 (public final int)           │
└───────────────────────────┘           ├───────────┬───────────┬───────────┬─────┤
                                        │ [0] = 10  │ [1] = 25  │ [2] = 40  │ [3] │
                                        └───────────┴───────────┴───────────┴─────┘
                                        ◄──────── Contiguous Memory Block ────────►
```

### মেমোরি কাঠামোর মূল বৈশিষ্ট্য:
1. **Contiguous Allocation**: উপাদানগুলো মেমোরিতে পাশাপাশি থাকে, ফলে ইনডেক্স দিয়ে $O(1)$ কনস্ট্যান্ট টাইমে রেন্ডম অ্যাক্সেস সম্ভব:
   $$\text{Address}(arr[i]) = \text{BaseAddress} + (i \times \text{ElementSize})$$
2. **Fixed Size**: একবার ইনিশিয়ালাইজ করার পর অ্যারের দৈর্ঘ্য বাড়ানো বা কমানো যায় না।
3. **`length` প্রোপার্টি**: প্রতিটি অ্যারে অবজেক্টের নিজস্ব `length` ফিল্ড থাকে যা `public final int`। এটি কোনো মেথড নয় (অর্থাৎ `arr.length` লিখতে হয়, `arr.length()` নয়)।

---

## ২. 1D Array ঘোষণা, ইনস্ট্যানশিয়েশন ও ইনিশিয়ালাইজেশন

Java-তে অ্যারে ৩ ধাপে বা এক লাইনে তৈরি করা যায়:

```java
public class ArrayDeclarationDemo {
    public static void main(String[] args) {
        // 1. Declaration (Only creates a reference variable on Stack, no memory on Heap yet)
        int[] numbers; // Preferred Java style
        int alternativeSyntax[]; // Valid C-style, but discouraged in modern Java

        // 2. Instantiation (Allocates heap memory and initializes to default values)
        numbers = new int[5]; // Default initialized to [0, 0, 0, 0, 0]

        // 3. Assignment by index (0-indexed)
        numbers[0] = 10;
        numbers[1] = 20;

        // 4. Combined Declaration & Array Literal (Memory allocated & initialized together)
        int[] primes = {2, 3, 5, 7, 11};

        // 5. Anonymous Array (Useful when passing directly to methods)
        printArray(new int[]{100, 200, 300});
    }

    public static void printArray(int[] data) {
        for (int val : data) {
            System.out.print(val + " ");
        }
        System.out.println();
    }
}
```

### ডিফল্ট মান (Default Values on Heap):
যখন `new Type[N]` দিয়ে মেমরি বরাদ্দ করা হয়, তখন JVM উপাদানগুলোকে তাদের ডিফল্ট মান দিয়ে পূর্ণ করে:
- সংখ্যা (`byte`, `short`, `int`, `long`): `0`
- দশমিক (`float`, `double`): `0.0`
- বুলিয়ান (`boolean`): `false`
- ক্যারেক্টার (`char`): `'\u0000'`
- অবজেক্ট রেফারেন্স (`String`, কাস্টম ক্লাস): `null`

---

## ৩. Primitive Arrays বনাম Object Arrays (মেমোরি ফাঁদ)

```
Primitive Array: int[] arr = new int[3];
Heap: [ 10 | 20 | 30 ]  (সরাসরি মান সংরক্ষিত)

Object Array: Person[] people = new Person[3];
Heap: [ null | null | null ]  (কেবল ৩টি রেফারেন্স পয়েন্টার বরাদ্দ হয়েছে!)
```

```java
public class ObjectArrayPitfall {

    static class Person {
        String name;
        Person(String name) { this.name = name; }
    }

    public static void main(String[] args) {
        Person[] team = new Person[2]; // Allocates space for 2 Person references (null)

        // ❌ PITFALL: team[0] is still null!
        // team[0].name = "Rahim"; // Throws NullPointerException!

        // ✅ CORRECT: Must instantiate each element individually
        team[0] = new Person("Rahim");
        team[1] = new Person("Karim");

        System.out.println("Member 1: " + team[0].name);
    }
}
```

> [!CAUTION]
> অবজেক্টের অ্যারে তৈরি করলে ভেতরের অবজেক্টগুলো নিজে থেকে তৈরি হয় না! `new Person[5]` কেবল ৫টি `null` রেফারেন্স ধারণ করার জায়গা তৈরি করে। প্রতিটি ইনডেক্সে আলাদাভাবে `new Person(...)` অ্যাসাইন না করে কল করলে `NullPointerException` ঘটবে।

---

## ৪. Multi-dimensional ও Jagged (Ragged) Arrays

Java-তে সি-এর মতো ফ্ল্যাট টু-ডাইমেনশনাল ম্যাট্রিক্স নেই। **Java-তে 2D Array হলো মূলত "Arrays of Arrays"** — অর্থাৎ একটি প্যারেন্ট অ্যারে যার প্রতিটি স্লটে অন্য একটি সাব-অ্যারের রেফারেন্স সংরক্ষিত থাকে।

```
 jaggedMatrix (Heap)
 ┌───────────┐
 │ [0] ──────┼─────► [ 1, 2 ]       (length = 2)
 ├───────────┤
 │ [1] ──────┼─────► [ 3, 4, 5, 6 ] (length = 4)
 ├───────────┤
 │ [2] ──────┼─────► [ 7 ]          (length = 1)
 └───────────┘
```

```java
public class MultiDimArrayDemo {
    public static void main(String[] args) {
        // 1. Regular 2D Rectangular Matrix (3 rows x 3 columns)
        int[][] matrix = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };

        // 2. Jagged (Ragged) Array: Rows with uneven column lengths
        int[][] jagged = new int[3][]; // Only outer array instantiated
        jagged[0] = new int[2];        // Row 0 has 2 columns
        jagged[1] = new int[4];        // Row 1 has 4 columns
        jagged[2] = new int[1];        // Row 2 has 1 column

        jagged[0][0] = 99;
        jagged[1][3] = 42;

        // Traversal using Nested Loops
        for (int i = 0; i < jagged.length; i++) {
            for (int j = 0; j < jagged[i].length; j++) {
                System.out.print(jagged[i][j] + " ");
            }
            System.out.println();
        }
    }
}
```

---

## ৫. অ্যারে কপি ও ক্লোনিং (Shallow Copy বনাম Deep Copy)

জাভাতে একটি অ্যারে রেফারেন্স অন্য ভেরিয়েবলে অ্যাসাইন করলে (`arr2 = arr1;`) নতুন কোনো অ্যারে তৈরি হয় না; উভয় ভেরিয়েবল একই মেমরি অ্যাড্রেস পয়েন্ট করে। নতুন কপি তৈরি করার ৩টি শক্তিশালী উপায়:

```java
import java.util.Arrays;

public class ArrayCopyDemo {
    public static void main(String[] args) {
        int[] original = {10, 20, 30, 40, 50};

        // 1. System.arraycopy (Fastest: Native OS C++ Syscall level transfer)
        int[] copy1 = new int[original.length];
        System.arraycopy(original, 0, copy1, 0, original.length);

        // 2. Arrays.copyOf and Arrays.copyOfRange
        int[] copy2 = Arrays.copyOf(original, original.length);
        int[] subArray = Arrays.copyOfRange(original, 1, 4); // Index 1 to 3: [20, 30, 40]

        // 3. clone() method
        int[] copy3 = original.clone();

        System.out.println("Sub array: " + Arrays.toString(subArray));
    }
}
```

> [!WARNING]
> **Object Array-এর Shallow Copy ঝুঁকি:**
> প্রিমিটিভ অ্যারে ক্লোন করলে মান পুরোপুরি কপি হয়। কিন্তু কাস্টম অবজেক্টের অ্যারে ক্লোন করলে কেবল অবজেক্টের রেফারেন্স অ্যাড্রেসগুলো কপি হয়। ফলে ক্লোন করা অ্যারের ভেতরের কোনো অবজেক্টের স্টেট পরিবর্তন করলে মূল অ্যারের অবজেক্টও পরিবর্তিত হয়ে যায়!

---

## ৬. `java.util.Arrays` ইউটিলিটি ক্লাস

Java-এর স্ট্যান্ডার্ড লাইব্রেরির `java.util.Arrays` ক্লাসে দৈনন্দিন কাজের জন্য প্রচুর অপ্টিমাইজড স্ট্যাটিক মেথড রয়েছে:

```java
import java.util.Arrays;

public class ArraysUtilityDemo {
    public static void main(String[] args) {
        int[] data = {12, 5, 89, 43, 2, 77};

        // 1. String representation
        System.out.println("Array: " + Arrays.toString(data));

        // 2. Sorting (Uses Dual-Pivot Quicksort for primitives, O(N log N))
        Arrays.sort(data);
        System.out.println("Sorted: " + Arrays.toString(data)); // [2, 5, 12, 43, 77, 89]

        // 3. Binary Search (Array MUST be sorted beforehand!)
        int index = Arrays.binarySearch(data, 43);
        System.out.println("Index of 43: " + index); // Returns index (positive) or negative if absent

        // 4. Fill with constant value
        int[] buffer = new int[5];
        Arrays.fill(buffer, -1);
        System.out.println("Filled: " + Arrays.toString(buffer)); // [-1, -1, -1, -1, -1]

        // 5. Equality check (Deep vs Shallow)
        int[] a = {1, 2, 3};
        int[] b = {1, 2, 3};
        System.out.println("a == b: " + (a == b)); // false (Different memory addresses)
        System.out.println("Arrays.equals: " + Arrays.equals(a, b)); // true (Compares contents)

        // 6. 2D Array inspection using deepToString
        int[][] grid = {{1, 2}, {3, 4}};
        System.out.println("Grid: " + Arrays.deepToString(grid)); // [[1, 2], [3, 4]]
    }
}
```

---

## ৭. Array বনাম `ArrayList` তুলনামূলক বিশ্লেষণ

এন্টারপ্রাইজ অ্যাপ্লিকেশনে প্রায়শই সিদ্ধান্ত নিতে হয়: কখন সাধারণ Array ব্যবহার করব এবং কখন `ArrayList` ব্যবহার করব?

| বৈশিষ্ট্য | `T[]` (Native Array) | `ArrayList<T>` (Collections Framework) |
| :--- | :--- | :--- |
| **আকার (Sizing)** | ফিক্সড (স্থায়ী), পরিবর্তনের সুযোগ নেই | ডায়নামিক, স্বয়ংক্রিয়ভাবে বৃদ্ধি পায় (১.৫ গুণ) |
| **পারফরম্যান্স** | অত্যন্ত দ্রুত (সরাসরি মেমরি অ্যাড্রেস অফসেট) | সামান্য ধীর (ইন্টারনাল মেথড কল ও ক্যাপাসিটি চেক) |
| **মেমরি লোকালিটি** | উচ্চতম CPU ক্যাশ লোকালিটি (Contiguous) | পয়েন্টার চেইজিং (হিপে ছড়ানো অবজেক্ট রেফারেন্স) |
| **প্রিমিটিভ সাপোর্ট**| সরাসরি প্রিমিটিভ রাখে (`int[]`, `double[]`) | প্রিমিটিভ সরাসরি পারে না, র্যাপার অবজেক্ট লাগে (`Integer`) |
| **অটোবক্সিং ওভারহেড**| কোনো বক্সিং ওভারহেড নেই | প্রচুর অবজেক্ট এলোকেশন ও মেমরি অপচয় |
| **উপযুক্ত ক্ষেত্র** | ফিক্সড সাইজ বাফার, ম্যাট্রিক্স, হাই-স্পিড কম্পিউটেশন | পরিবর্তনশীল সাইজ, ঘনঘন সংযোজন ও ডেটাবেস রেজাল্ট |

---

## ৮. এন্টারপ্রাইজ Best Practices ও Effective Java টিপস

### ১. কখনো অ্যারের ক্ষেত্রে `null` রিটার্ন করবেন না (Item 54 - Effective Java)
```java
// ❌ মারাত্মক ভুল: কলারকে NullPointerException এড়াতে প্রতিবার নাল চেক করতে বাধ্য করে
public String[] getUserRoles(String userId) {
    if (roles.isEmpty()) return null;
    return roles.toArray(new String[0]);
}

// ✅ সঠিক: দৈর্ঘ্য শূন্যের খালি অ্যারে রিটার্ন করুন
private static final String[] EMPTY_ROLES = new String[0];

public String[] getUserRoles(String userId) {
    if (roles.isEmpty()) return EMPTY_ROLES;
    return roles.toArray(new String[0]);
}
```

### ২. ArrayIndexOutOfBoundsException প্রিভেনশন
সর্বদা লুপের বাউন্ড হিসেবে `i < arr.length` ব্যবহার করুন, কখনো হার্ডকোডেড সংখ্যা বা `i <= arr.length` লিখবেন না (কারণ শেষ উপাদানটির ইনডেক্স সর্বদা `length - 1`)।
