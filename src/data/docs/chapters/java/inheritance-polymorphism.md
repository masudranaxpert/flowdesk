# Inheritance ও Polymorphism

ইনহেরিটেন্স (উত্তরাধিকার) এবং পলিমরফিজম (বহুরূপতা) হলো অবজেক্ট-ওরিয়েন্টেড আর্কিটেকচারের দুটি প্রধান স্তম্ভ। এদের সাহায্যে কোড পুনঃব্যবহারযোগ্য (Reusability) হয় এবং রানটাইমে নমনীয় ডায়নামিক আর্কিটেকচার তৈরি করা সম্ভব হয়।

---

## ১. Inheritance ও `extends` কি-ওয়ার্ড

যখন একটি নতুন ক্লাস (চাইল্ড বা সাব-ক্লাস) অন্য একটি বিদ্যমান ক্লাসের (প্যারেন্ট বা সুপার-ক্লাস) বৈশিষ্ট্য ও মেথডগুলো গ্রহণ করে, তাকে ইনহেরিটেন্স বলে।

```java
// Superclass (Parent)
public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void eat() {
        System.out.println(name + " খাবার খাচ্ছে।");
    }

    public void makeSound() {
        System.out.println("প্রাণীটি সাধারণ শব্দ করছে।");
    }
}

// Subclass (Child)
public class Dog extends Animal {
    private String breed;

    public Dog(String name, String breed) {
        // Must call parent constructor first using super(...)
        super(name);
        this.breed = breed;
    }

    // Method Overriding: replacing parent implementation
    @Override
    public void makeSound() {
        System.out.println(name + " ঘেউ ঘেউ করছে! (" + breed + ")");
    }

    public void fetch() {
        System.out.println(name + " বল কুড়িয়ে আনছে।");
    }
}
```

### `super` কি-ওয়ার্ডের দ্বৈত ভূমিকা:
1. **`super(...)`**: প্যারেন্ট ক্লাসের কনস্ট্রাকটর কল করতে (চাইল্ড কনস্ট্রাকটরের প্রথম লাইনে থাকা বাধ্যতামূলক)।
2. **`super.methodName()`**: চাইল্ড ক্লাসে মেথড ওভাররাইড থাকা সত্ত্বেও প্যারেন্ট ক্লাসের মূল মেথডটিকে এক্সিকিউট করতে।

> [!important]
> **কেন Java-তে একাধিক ক্লাসের ইনহেরিটেন্স (Multiple Inheritance) নিষিদ্ধ?**
> যদি ক্লাস C একই সাথে ক্লাস A এবং B উভয়কে ইনহেরিট করত, এবং উভয়ের ভেতর একই নামের মেথড `display()` থাকত, তবে C এর অবজেক্ট কারটা চালাবে তা নিয়ে গোলকধাঁধা তৈরি হতো (Diamond Problem)। এই বিভ্রান্তি দূর করতে Java-তে ক্লাস লেভেলে মাল্টিপল ইনহেরিটেন্স নিষিদ্ধ করা হয়েছে (ইন্টারফেসের মাধ্যমে এটি সমাধান করা হয়)।

---

## ২. Method Overriding বনাম Overloading

| বৈশিষ্ট্য | Method Overloading (কম্পাইল-টাইম) | Method Overriding (রানটাইম) |
| :--- | :--- | :--- |
| **অবস্থান** | একই ক্লাসের ভেতরে | প্যারেন্ট ও চাইল্ড ক্লাসের মাঝে |
| **মেথডের নাম** | একই | একই |
| **প্যারামিটার** | অবশ্যই ভিন্ন হতে হবে (সংখ্যা বা টাইপ) | হুবহু একই হতে হবে |
| **রিটার্ন টাইপ**| ভিন্ন হতে পারে | একই অথবা কোভ্যারিয়েন্ট সাব-টাইপ |
| **বাইন্ডিং** | স্ট্যাটিক / কম্পাইল-টাইম পলিমরফিজম | ডায়নামিক / রানটাইম পলিমরফিজম |

```java
public class Calculator {
    // Overloading: same name, different parameters
    public int add(int a, int b) { return a + b; }
    public double add(double a, double b) { return a + b; }
    public int add(int a, int b, int c) { return a + b + c; }
}
```

---

## ৩. ডায়নামিক মেথড ডিসপ্যাচ (Runtime Polymorphism)

পলিমরফিজমের সবচেয়ে শক্তিশালী দিক হলো: **প্যারেন্ট টাইপের রেফারেন্স ভ্যারিয়েবল চাইল্ড টাইপের অবজেক্টকে নির্দেশ করতে পারে**। রানটাইমে কোন মেথডটি কল হবে তা রেফারেন্সের টাইপ নয়, বরং র্যামে থাকা আসল অবজেক্টের ইনস্ট্যান্স টাইপের ওপর ভিত্তি করে নির্ধারিত হয়:

```java
public class PolymorphismDemo {
    public static void main(String[] args) {
        // Parent reference pointing to child instances
        Animal myAnimal1 = new Dog("টমি", "জার্মান শেফার্ড");
        Animal myAnimal2 = new Animal("অজানা জীব");

        // Dynamic Method Dispatch: JVM looks up method table at runtime
        myAnimal1.makeSound(); // Prints: টমি ঘেউ ঘেউ করছে!
        myAnimal2.makeSound(); // Prints: প্রাণীটি সাধারণ শব্দ করছে।

        // myAnimal1.fetch(); // COMPILATION ERROR! Animal রেফারেন্সে fetch() নেই
    }
}
```

### ডাউনকাস্টিং ও `instanceof`:
প্যারেন্ট রেফারেন্স থেকে চাইল্ডের নিজস্ব মেথড কল করতে ডাউনকাস্টিং লাগে। Java 16+ এর প্যাটার্ন ম্যাচিং এটি অত্যন্ত সহজ করেছে:

```java
if (myAnimal1 instanceof Dog dog) {
    dog.fetch(); // Automatically casted to Dog variable 'dog'
}
```

---

## ৪. `final` কি-ওয়ার্ডের ইনহেরিটেন্স নিয়ন্ত্রণ

1. **`final` ক্লাস**: এই ক্লাস থেকে কোনো চাইল্ড ক্লাস তৈরি বা ইনহেরিট করা অসম্ভব।
   - যেমন: `java.lang.String` একটি final ক্লাস, যাতে কেউ এর মেমরি ইমিউটেবিলিটি হ্যাক না করতে পারে।
2. **`final` মেথড**: কোনো সাব-ক্লাস এই মেথডটিকে `@Override` করতে পারে না।

---

## ৫. সর্বজনীন রুট ক্লাস: `java.lang.Object`

Java-তে প্রতিটি ক্লাস স্বয়ংক্রিয়ভাবে `java.lang.Object` ক্লাসকে ইনহেরিট করে। এর প্রধান মেথডসমূহ:

### ক. `==` বনাম `.equals()`:
- `==` তুলনা করে রেফারেন্স অ্যাড্রেস (দুটো ভ্যারিয়েবল হিপের একই মেমরি নির্দেশ করছে কি না)।
- `.equals()` তুলনা করে অবজেক্টের অভ্যন্তরীণ কন্টেন্ট বা ফিল্ডের সমতা।

### খ. `equals()` এবং `hashCode()` এর পবিত্র চুক্তি (Contract):
যদি দুটি অবজেক্টের `.equals()` সত্য (`true`) হয়, তবে তাদের `.hashCode()` অবশ্যই হুবহু একই পূর্ণসংখ্যা রিটার্ন করতে হবে! এটি অমান্য করলে `HashMap` বা `HashSet` এ অবজেক্ট খুঁজে পাওয়া যাবে না।

```java
import java.util.Objects;

public class Product {
    private String id;
    private String name;

    public Product(String id, String name) {
        this.id = id;
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        return Objects.equals(id, product.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Product[id=" + id + ", name=" + name + "]";
    }
}
```

---

## সারসংক্ষেপ

- `extends` দিয়ে চাইল্ড ক্লাস প্যারেন্টের সমস্ত নন-প্রাইভেট মেম্বার লাভ করে।
- `super(...)` চাইল্ড কনস্ট্রাকটরের প্রথম লাইনে প্যারেন্ট ইনিশিয়ালাইজ করে।
- ডায়নামিক মেথড ডিসপ্যাচের মাধ্যমে প্যারেন্ট রেফারেন্স দিয়ে চাইল্ড অবজেক্টের ওভাররাইডেড মেথড নির্বাহ করা যায়।
- কন্টেন্ট সমতার জন্য সর্বদা `equals()` এবং `hashCode()` একসাথে ওভাররাইড করতে হয়।
- পরবর্তী অধ্যায়ে আমরা শিখব Abstract Classes ও Interfaces — চুক্তিভিত্তিক সফটওয়্যার ডিজাইন।
