# File I/O ও Modern NIO.2

জাভাতে ইনপুট ও আউটপুট (I/O) প্রসেসিংয়ের দুটি মূল ইকোসিস্টেম রয়েছে: ক্লাসিকাল ব্লকিং `java.io` (Java 1.0) এবং আধুনিক হাই-পারফরম্যান্স `java.nio.file` (NIO.2, Java 7+)।

---

## ১. ক্লাসিক I/O বনাম Modern NIO.2

```
┌─────────────────────────────────┬─────────────────────────────────┐
│        Classic java.io          │       Modern java.nio.file      │
├─────────────────────────────────┼─────────────────────────────────┤
│ Stream-oriented (Byte/Char)     │ Buffer ও Channel oriented       │
│ Synchronous ও Blocking          │ Non-blocking ও Asynchronous     │
│ File ক্লাস (সীমাবদ্ধ এরর মেটাডেটা)│ Path ও Files এপিআই (সরাসরি OS)  │
│ ম্যানুয়াল বাফারিং ও লুপ        │ আধুনিক ডিক্লারেটিভ মেথডস ও স্ট্রিম│
└─────────────────────────────────┴─────────────────────────────────┘
```

---

## ২. `Path` ও `Files` এপিআই-এর আধুনিক ব্যবহার

Java 11+ এ ফাইল রিড এবং রাইট করা অত্যন্ত সংক্ষিপ্ত ও কার্যকর করা হয়েছে:

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class ModernFileIoDemo {

    public static void main(String[] args) {
        Path filePath = Path.of("data", "app-log.txt");

        try {
            // Create parent directories if missing
            if (filePath.getParent() != null) {
                Files.createDirectories(filePath.getParent());
            }

            // 1. Write text directly (Java 11+)
            Files.writeString(filePath, "Log entry: Server started at 08:00\n",
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);

            // 2. Read entire small file into a String
            String content = Files.readString(filePath);
            System.out.println("File Content:\n" + content);

            // 3. File metadata inspection
            System.out.println("File size: " + Files.size(filePath) + " bytes");
            System.out.println("Is readable: " + Files.isReadable(filePath));

        } catch (IOException e) {
            System.err.println("I/O operation failed: " + e.getMessage());
        }
    }
}
```

---

## ৩. বড় ফাইল মেমোরি-দক্ষভাবে রিড করা (`Files.lines`)

পুরো ফাইল একসাথে মেমোরিতে (`Files.readAllBytes` বা `Files.readAllLines`) লোড করলে গিগাবাইট সাইজের ফাইলের ক্ষেত্রে `OutOfMemoryError` দেখা দেয়। `Files.lines()` স্ট্রিম ব্যবহারের মাধ্যমে অলসভাবে (Lazily) লাইন-বাই-লাইন ডেটা লোড করে।

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

public class LargeFileReaderDemo {

    public static void processLargeLogFile(Path logPath) {
        // Files.lines() opens an underlying file descriptor and MUST be closed!
        // Always wrap in try-with-resources
        try (Stream<String> lineStream = Files.lines(logPath)) {

            long errorCount = lineStream
                .filter(line -> line.contains("[ERROR]"))
                .peek(errorLine -> System.out.println("Found alert: " + errorLine))
                .count();

            System.out.println("Total ERROR logs detected: " + errorCount);

        } catch (IOException e) {
            System.err.println("Failed to read log stream: " + e.getMessage());
        }
    }
}
```

> [!CAUTION]
> `Files.lines()` দ্বারা রিটার্ন হওয়া `Stream<String>` অবশ্যই **Try-with-resources** ব্লকে রাখতে হবে। অন্যথায় ফাইলের হ্যান্ডেল/ফাইল ডেসক্রিপ্টর ওপেন থেকে যাবে, যার ফলে **File Descriptor Leak** ঘটবে।

---

## ৪. ডিরেক্টরি ট্রাভার্সাল: `Files.walk` ও `Files.find`

কোনো ডিরেক্টরির গভীরে ঢুকে ফাইল বা ফোল্ডার সার্চ করার জন্য আধুনিক মেথড:

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

public class DirectoryScanDemo {

    public static void findJavaFiles(Path rootDir) {
        try (Stream<Path> paths = Files.walk(rootDir, 5)) { // Max search depth = 5
            paths.filter(Files::isRegularFile)
                 .filter(p -> p.toString().endsWith(".java"))
                 .forEach(path -> System.out.println("Java source: " + path.getFileName()));
        } catch (IOException e) {
            System.err.println("Directory walk error: " + e.getMessage());
        }
    }
}
```

---

## ৫. হাই-পারফরম্যান্স NIO: Channels ও ByteBuffers

লো-লেভেল নেটওয়ার্কিং বা বিশাল ফাইলের অতিদ্রুত প্রসেসিংয়ের জন্য জাভা বাফার ও চ্যানেল আর্কিটেকচার ব্যবহার করে:

```
 [ File / Socket ] ◄── Channel ──► [ ByteBuffer ] ◄── App Logic
```

```java
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

public class FastChannelCopyDemo {

    public static void fastCopy(String src, String dest) {
        try (FileChannel sourceChannel = new RandomAccessFile(src, "r").getChannel();
             FileChannel destChannel = new RandomAccessFile(dest, "rw").getChannel()) {

            // Zero-copy kernel level transfer (Direct OS sendfile syscall)
            long transferred = 0;
            long size = sourceChannel.size();
            while (transferred < size) {
                transferred += sourceChannel.transferTo(transferred, size - transferred, destChannel);
            }
            System.out.println("Transferred " + transferred + " bytes at OS kernel speed.");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

> [!TIP]
> `FileChannel.transferTo()` কার্নেল লেভেলে **Zero-Copy** মেকানিজম ব্যবহার করে। এটি ইউজার স্পেস মেমোরিতে ডেটা কপি না করে সরাসরি OS পেজ ক্যাশ থেকে ডেটা পাঠিয়ে দেয়, যা অত্যন্ত ফাস্ট।
