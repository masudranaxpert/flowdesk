# Modules (JPMS), Maven ও Gradle

জাভা ৯-এর **Java Platform Module System (JPMS - Project Jigsaw)** এবং আধুনিক বিল্ড টুলস যেমন **Maven** ও **Gradle** এন্টারপ্রাইজ সফটওয়্যার আর্কিটেকচার এবং ডিপেন্ডেন্সি ম্যানেজমেন্টের ভিত্তি।

---

## ১. Java Platform Module System (JPMS)

জাভা ৯-এর আগে লাইব্রেরির ভেতরের যেকোনো `public` class `classpath`-এ থাকলে যেকোনো জায়গা থেকে এক্সেস করা যেত, এমনকি রিফ্লেকশন দিয়ে প্রাইভেট ফিল্ডও মডিফাই করা যেত। JPMS **Strong Encapsulation** এবং নির্ভরযোগ্য কনফিগারেশন নিশ্চিত করে।

### `module-info.java` স্ট্রাকচার:
প্রতিটি মডিউলের রুট ফোল্ডারে একটি `module-info.java` ডিক্লেয়ারেশন ফাইল থাকে:

```java
module com.ecommerce.order {
    // 1. Dependencies required by this module
    requires java.sql;
    requires transitive com.ecommerce.payment; // Downstream modules also inherit this

    // 2. Packages exported for public use
    exports com.ecommerce.order.api;
    exports com.ecommerce.order.dto;

    // 3. Qualified export: Only accessible by inventory module
    exports com.ecommerce.order.internal to com.ecommerce.inventory;

    // 4. Open package for runtime reflection (e.g., Spring or Hibernate)
    opens com.ecommerce.order.entity to org.hibernate.orm.core;

    // 5. Service Provider Interface (SPI)
    uses com.ecommerce.payment.spi.PaymentProvider;
}
```

### ডিরেক্টিভগুলোর অর্থ:
- `requires`: মডিউল রান করার জন্য প্রয়োজনীয় অন্য মডিউল।
- `requires transitive`: যে মডিউল এই মডিউলের ওপর ডিপেন্ড করবে, সে স্বয়ংক্রিয়ভাবে ট্রানজিটিভলি ডিপেন্ডেন্সি পাবে।
- `exports`: স্পেসিফিক প্যাকেজকে বাইরের জন্য উন্মুক্ত করা। যা এক্সপোর্ট করা হয়নি তা `public` হওয়া সত্ত্বেও সম্পূর্ণ লুকায়িত থাকবে।
- `opens`: ফ্রেমওয়ার্কগুলোর (Spring/Jackson/Hibernate) জন্য রিফ্লেক্টিভ এক্সেস ওপেন করা।

---

## ২. কাস্টম runtime ইমেজ তৈরি: `jlink`

ক্লাউড এবং ডকার কন্টেইনারে সম্পূর্ণ ৩০০-৪০০ মেগাবাইটের JDK শিপ করার প্রয়োজন নেই। `jlink` টুলের সাহায্যে শুধুমাত্র প্রয়োজনীয় মডিউলগুলো নিয়ে ৩০-৪০ মেগাবাইটের একটি কাস্টম লাইটওয়েট runtime ইমেজ তৈরি করা যায়:

```bash
jlink --module-path $JAVA_HOME/jmods:target/modules \
      --add-modules com.ecommerce.order \
      --output custom-order-runtime \
      --strip-debug \
      --compress 2 \
      --no-header-files \
      --no-man-pages
```

---

## ৩. Apache Maven: কাঠামো ও লাইফসাইকেল

Maven ডিক্লারেটিভ এক্সএমএল কনফিগারেশন (`pom.xml`) এবং কনভেনশন-ওভার-কনফিগারেশন নীতি অনুসরণ করে।

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.company.app</groupId>
    <artifactId>payment-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Compile scope: available everywhere -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.12</version>
        </dependency>

        <!-- Test scope: only for unit/integration tests -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

### Maven স্ট্যান্ডার্ড বিল্ড ফেজসমূহ:
1. `validate` - প্রজেক্ট সঠিক এবং তথ্য পূরণ করা আছে কিনা যাচাই।
2. `compile` - সোর্স কোড কম্পাইল করা।
3. `test` - ইউনিট টেস্টগুলো রান করা (Surefire প্লাগইন)।
4. `package` - JAR বা WAR ফাইলে প্যাকেজ করা।
5. `verify` - ইন্টিগ্রেশন টেস্টের রেজাল্ট চেক করা।
6. `install` - লোকাল রিপোজিটরিতে (`~/.m2/repository`) প্যাকেজ ইনস্টল করা।
7. `deploy` - রিমোট আর্টিক্র্যাক্ট রিপোজিটরিতে (যেমন Nexus বা Artifactory) আপলোড করা।

---

## ৪. Gradle: আধুনিক Kotlin DSL ও হাই-পারফরম্যান্স বিল্ড

Gradle আধুনিক হাইপারফরম্যান্স বিল্ড টুল যা DAG (Directed Acyclic Graph) এবং ইনক্রিমেন্টাল বিল্ড ও বিল্ড ক্যাশিং সাপোর্ট করে।

```kotlin
// build.gradle.kts (Kotlin DSL)
plugins {
    java
    id("org.springframework.boot") version "3.2.4"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.company.app"
version = "1.0.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

### Maven vs Gradle Comparison:
| বৈশিষ্ট্য | Apache Maven | Gradle |
| :--- | :--- | :--- |
| **ভাষা/syntax** | XML (`pom.xml`) | Kotlin DSL / Groovy (`build.gradle.kts`) |
| **বিল্ড স্পিড** | সাধারণ | অত্যন্ত দ্রুত (Build Cache ও Incremental Tasks) |
| **ফ্লেক্সিবিলিটি** | কনভেনশন কেন্দ্রিক, কাস্টম টাস্কে অনমনীয় | অত্যন্ত ফ্লেক্সিবল, যেকোনো স্ক্রিপ্টিং সহজ |
| **লার্নিং কার্ভ** | সহজ ও প্রেডিক্টেবল | একটু জটিল তবে আধুনিক এন্টারপ্রাইজে জনপ্রিয় |
