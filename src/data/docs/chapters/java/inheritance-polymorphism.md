# Inheritance ও Polymorphism

Inheritance এবং Polymorphism হলো object-ওরিয়েন্টেড আর্কিটেকচারের দুটি প্রধান স্তম্ভ। এদের সাহায্যে কোড পুনঃব্যবহারযোগ্য (Reusability) হয় এবং runtime-এ নমনীয় ডায়নামিক আর্কিটেকচার তৈরি করা সম্ভব হয়।

---

## ১. Inheritance ও `extends` কি-ওয়ার্ড

যখন একটি নতুন class (চাইল্ড বা সাব-class) অন্য একটি বিদ্যমান class-এর (প্যারেন্ট বা সুপার-class) বৈশিষ্ট্য ও method-গুলো গ্রহণ করে, তাকে inheritance বলে।

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
1. **`super(...)`**: প্যারেন্ট class-এর constructor কল করতে (চাইল্ড constructor-এর প্রথম লাইনে থাকা বাধ্যতামূলক)।
2. **`super.methodName()`**: চাইল্ড class-এ method ওভাররাইড থাকা সত্ত্বেও প্যারেন্ট class-এর মূল মেথডটিকে এক্সিকিউট করতে।

> [!important]
> **কেন Java-তে একাধিক class-এর inheritance (Multiple Inheritance) নিষিদ্ধ?**
> যদি class C একই সাথে class A এবং B উভয়কে ইনহেরিট করত, এবং উভয়ের ভেতর একই নামের method `display()` থাকত, তবে C এর object কারটা চালাবে তা নিয়ে গোলকধাঁধা তৈরি হতো (Diamond Problem)। এই বিভ্রান্তি দূর করতে Java-তে class লেভেলে মাল্টিপল inheritance নিষিদ্ধ করা হয়েছে (interface-এর মাধ্যমে এটি সমাধান করা হয়)।

---

## ২. Method Overriding বনাম Overloading

| বৈশিষ্ট্য | Method Overloading (compile-time) | Method Overriding (runtime) |
| :--- | :--- | :--- |
| **অবস্থান** | একই class-এর ভেতরে | প্যারেন্ট ও চাইল্ড class-এর মাঝে |
| **method-এর নাম** | একই | একই |
| **parameter** | অবশ্যই ভিন্ন হতে হবে (সংখ্যা বা টাইপ) | হুবহু একই হতে হবে |
| **রিটার্ন টাইপ**| ভিন্ন হতে পারে | একই অথবা কোভ্যারিয়েন্ট সাব-টাইপ |
| **বাইন্ডিং** | স্ট্যাটিক / compile-time polymorphism | ডায়নামিক / runtime polymorphism |

```java
public class Calculator {
    // Overloading: same name, different parameters
    public int add(int a, int b) { return a + b; }
    public double add(double a, double b) { return a + b; }
    public int add(int a, int b, int c) { return a + b + c; }
}
```

---

## ৩. ডায়নামিক method ডিসপ্যাচ (Runtime Polymorphism)

polymorphism-এর সবচেয়ে শক্তিশালী দিক হলো: **প্যারেন্ট টাইপের reference variable চাইল্ড টাইপের object-কে নির্দেশ করতে পারে**। runtime-এ কোন method-টি কল হবে তা রেফারেন্সের টাইপ নয়, বরং র্যামে থাকা আসল object-এর ইনস্ট্যান্স টাইপের ওপর ভিত্তি করে নির্ধারিত হয়:

```java
public class PolymorphismDemo {
    public static void main(String[] args) {
        // Parent reference pointing to child instances
        Animal myAnimal1 = new Dog("টমি", "জার্মান শেফার্ড");
        Animal myAnimal2 = new Animal("অজানা জীব");

        // Dynamic Method Dispatch: JVM looks up method table at runtime
        myAnimal1.makeSound(); // Dispatches Dog implementation at runtime
        myAnimal2.makeSound(); // Dispatches base Animal implementation

        // myAnimal1.fetch(); // Compilation error: fetch() undefined on Animal reference type
    }
}
```

### ডাউনকাস্টিং ও `instanceof`:
প্যারেন্ট রেফারেন্স থেকে চাইল্ডের নিজস্ব method কল করতে ডাউনকাস্টিং লাগে। Java 16+ এর প্যাটার্ন ম্যাচিং এটি অত্যন্ত সহজ করেছে:

```java
if (myAnimal1 instanceof Dog dog) {
    dog.fetch(); // Automatically casted to Dog variable 'dog'
}
```

---

## ৪. `final` কি-ওয়ার্ডের inheritance নিয়ন্ত্রণ

1. **`final` class**: এই class থেকে কোনো চাইল্ড class তৈরি বা ইনহেরিট করা অসম্ভব।
   - যেমন: `java.lang.String` একটি final class, যাতে কেউ এর memory ইমিউটেবিলিটি হ্যাক না করতে পারে।
2. **`final` method**: কোনো সাব-class এই মেথডটিকে `@Override` করতে পারে না।

---

## ৫. সর্বজনীন রুট class: `java.lang.Object`

Java-তে প্রতিটি class স্বয়ংক্রিয়ভাবে `java.lang.Object` class-কে ইনহেরিট করে। এর প্রধান মেথডসমূহ:

### ক. `==` বনাম `.equals()`:
- `==` তুলনা করে রেফারেন্স অ্যাড্রেস (দুটো variable heap-এর একই memory নির্দেশ করছে কি না)।
- `.equals()` তুলনা করে object-এর অভ্যন্তরীণ কন্টেন্ট বা ফিল্ডের সমতা।

### খ. `equals()` এবং `hashCode()` এর পবিত্র চুক্তি (Contract):
যদি দুটি object-এর `.equals()` সত্য (`true`) হয়, তবে তাদের `.hashCode()` অবশ্যই হুবহু একই পূর্ণসংখ্যা রিটার্ন করতে হবে! এটি অমান্য করলে `HashMap` বা `HashSet` এ object খুঁজে পাওয়া যাবে না।

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

- `extends` দিয়ে চাইল্ড class প্যারেন্টের সমস্ত নন-প্রাইভেট মেম্বার লাভ করে।
- `super(...)` চাইল্ড constructor-এর প্রথম লাইনে প্যারেন্ট ইনিশিয়ালাইজ করে।
- ডায়নামিক method ডিসপ্যাচের মাধ্যমে প্যারেন্ট রেফারেন্স দিয়ে চাইল্ড object-এর ওভাররাইডেড method নির্বাহ করা যায়।
- কন্টেন্ট সমতার জন্য সর্বদা `equals()` এবং `hashCode()` একসাথে ওভাররাইড করতে হয়।
- পরবর্তী অধ্যায়ে আমরা শিখব Abstract Classes ও Interfaces — চুক্তিভিত্তিক সফটওয়্যার ডিজাইন।
