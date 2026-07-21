## Engine, Connection & Connection Pooling

SQLAlchemy তে ডেটাবেজের সাথে যোগাযোগ করার প্রধান চালিকাশক্তি বা প্রবেশদ্বার হলো **Engine**। 

Engine হলো একটি Connection Factory যা Underlying Database Driver (DBAPI) এবং Connection Pool ম্যানেজ করে।

---

## Engine তৈরি করা: `create_engine`

SQLAlchemy তে `create_engine()` ব্যবহার করে Engine অবজেক্ট ইনিশিয়ালাইজ করা হয়।

```python
from sqlalchemy import create_engine

# Database Connection URL Format:
# dialect+driver://username:password@host:port/database

# PostgreSQL Example:
DATABASE_URL = "postgresql+psycopg://postgres:secret@localhost:5432/mydatabase"

engine = create_engine(
    DATABASE_URL,
    echo=True,         # SQL query log করার জন্য (Development এ উপযোগী)
    pool_size=10,      # Maximum active connections maintain করবে
    max_overflow=20,   # High traffic এ extra ২০টি সংযোগ তৈরি করতে পারবে
    pool_recycle=3600, # প্রতি ১ ঘণ্টায় স্টেল কানেকশন রিসাইকেল করবে
    pool_pre_ping=True # Connection নেওয়ার আগে টেস্ট করে দেখবে সংযোগ সচল আছে কি না
)
```

> [!important] Connection Pre-Ping (`pool_pre_ping=True`)
> Production পরিবেশে DB Server যদি কানেকশন ডিসকানেক্ট করে দেয় (Disconnect Error), তবে `pool_pre_ping=True` সেট করা থাকলে SQLAlchemy অটোমেটিক কানেকশন ড্রপ ডিটেক্ট করে নতুন কানেকশন রি-এস্টাবলিশ করে।

---

## Direct Connection & Transaction Handling

ডেটাবেজে দুই ধরনের কাজ করা হয়:
1. **শুধুমাত্র তথ্য পড়া (Read / SELECT)**: এতে ডেটাবেজে কোনো পরিবর্তন হয় না।
2. **তথ্য পরিবর্তন করা (Write / INSERT, UPDATE, DELETE)**: এতে ডেটাবেজে পরিবর্তন হয়।

তথ্য পরিবর্তন করার সময় আমাদের **Transaction (ট্রানজ্যাকশন)** এর কনসেপ্ট বুঝতে হবে।

---

## 💡 সহজ কথায় `COMMIT` এবং `ROLLBACK` কী?

ধরে নাও তুমি ব্যাংক অ্যাকাউন্টের সিস্টেম বানাচ্ছ। রহিম তার অ্যাকাউন্ট থেকে ৫০০ টাকা করিমের অ্যাকাউন্টে পাঠাবে। এখানে ২ টি কাজ করতে হবে:
- **কাজ ১:** রহিমের অ্যাকাউন্ট থেকে ৫০০ টাকা মাইনাস করা।
- **কাজ ২:** করিমের অ্যাকাউন্ট এ ৫০০ টাকা প্লাস করা।

এখন যদি **কাজ ১** হওয়ার পর বিদ্যুৎ চলে যায় বা সার্ভার ক্র্যাশ করে এবং **কাজ ২** না হয় — তবে রহিমের টাকা কেটে নেওয়া হলো কিন্তু করিম পেল না! এটি ডেটাবেজের জন্য এক ভয়াবহ ভুল অবস্থা (`Data Corruption`)।

এখানেই আসে Transaction এর ২টি মূল শব্দ:

- 🟢 **`COMMIT` (স্থায়ীভাবে সেভ করা):** সব কাজ (কাজ ১ এবং কাজ ২) যখন ১০০% সঠিকভাবে শেষ হবে, তখন ডেটাবেজকে বলা হয় `COMMIT` করো — অর্থাৎ পরিবর্তনগুলো স্থায়ীভাবে ডিস্কে সেভ করো।
- 🔴 **`ROLLBACK` (আগের অবস্থায় ফেরত আনা):** কাজ ১ বা কাজ ২ এর যেকোনো একটিতে যদি কোনো এরর বা ঝামেলা হয়, তখন ডেটাবেজকে বলা হয় `ROLLBACK` করো — অর্থাৎ অর্ধেক হওয়া সব কাজ বাতিল করে ডেটাবেজকে ঠিক আগের নিরাপদ অবস্থায় ফিরিয়ে নাও! (রহিমের ৫০০ টাকা ফেরত দাও)।

```mermaid
flowchart TD
    Start[Transaction শুরু] --> Step1[কাজ ১: রহিমের টাকা মাইনাস]
    Step1 --> Step2[কাজ ২: করিমের টাকা প্লাস]
    Step2 --> Check{সব কাজ সফল?}
    Check -->|হ্যাঁ (Success)| Commit[🟢 COMMIT: স্থায়ীভাবে DB তে Save]
    Check -->|না (Error/Crash)| Rollback[🔴 ROLLBACK: আগের অবস্থায় Refund / Reset]
```

---

## 🔍 `engine.connect()` vs `engine.begin()` — কোনটি কেন ব্যবহার করবে?

### ১. `engine.connect()` (শুধুমাত্র তথ্য পড়ার জন্য)
যখন তুমি শুধু ডেটাবেজ থেকে তথ্য রিড করবে (যেমন SELECT query), তখন `engine.connect()` ব্যবহার করা সহজ:

```python
from sqlalchemy import text

# explicit connection checkout (Read-only scenario)
with engine.connect() as connection:
    result = connection.execute(text("SELECT 'Hello SQLAlchemy 2.0'"))
    print(result.scalar())
```

### ২. `engine.begin()` (তথ্য পরিবর্তন বা কমার্শিয়াল ট্রানজ্যাকশনের জন্য 👍)
কেন `engine.connect()` এর বদলে `engine.begin()` ব্যবহার করবে?

যদি তুমি `engine.connect()` দিয়ে INSERT/UPDATE করতে চাও, তবে তোমাকে নিজে হাতে `try...except` লিখে ম্যানুয়ালি `conn.commit()` এবং `conn.rollback()` লিখতে হতো:

```python
# ❌ ম্যানুয়ালি Commit / Rollback লেখার পুরোনো ঝামেলাযুক্ত উপায়:
conn = engine.connect()
try:
    conn.execute(text("INSERT INTO logs VALUES ('login')"))
    conn.commit() # ম্যানুয়ালি সেভ করতে হয়
except Exception:
    conn.rollback() # ম্যানুয়ালি রোলব্যাক করতে হয়
finally:
    conn.close()
```

**এর সমাধান হলো `engine.begin()`!**
`engine.begin()` একটি Context Manager (`with` block) তৈরি করে যা **অটোমেটিক Commit ও Rollback** হ্যান্ডেল করে:

```python
# ✅ আধুনিক ও নিরাপদ উপায় (Auto-Commit & Auto-Rollback)
with engine.begin() as conn:
    conn.execute(
        text("INSERT INTO logs (message) VALUES (:msg)"),
        {"msg": "User logged in successfully"}
    )
    # ১. যদি এই ব্লকের সব কোড সফলভাবে চলে -> অটোমেটিক COMMIT হবে!
    # ২. যদি কোনো এরর (Exception) ঘটে -> অটোমেটিক ROLLBACK হয়ে ডেটাবেজ সুরক্ষিত থাকবে!
```

---

## Connection Pooling আর্কিটেকচার

ডেটাবেজের সাথে নতুন TCP Connection তৈরি করা অনেক সময়সাপেক্ষ ও ব্যয়বহুল। SQLAlchemy **Connection Pool** প্যাটার্ন ব্যবহার করে কানেকশন পুনর্নবীকরণ (Reuse) করে।

```mermaid
flowchart LR
    AppThread[Application Threads] --> Pool[SQLAlchemy QueuePool]
    Pool -->|Reuse Conn 1| DB[(Database)]
    Pool -->|Reuse Conn 2| DB
    Pool -->|Reuse Conn 3| DB
```

### প্রধান Connection Pool Type সমূহ:
1. **`QueuePool`** (Default): নির্দিষ্ট সংখ্যক কানেকশন মেমরিতে জমা করে রাখে এবং থ্রেড-সেফ লাইনে সার্ভিস দেয়।
2. **`NullPool`**: কোনো কানেকশন পুলে জমিয়ে রাখে না। সার্ভারলেস বা AWS Lambda এ ব্যবহৃত হয়।
3. **`StaticPool`**: ইন-মেমরি SQLite টেস্টের জন্য একক কানেকশন ধরে রাখে।

```python
from sqlalchemy.pool import NullPool

# Serverless (AWS Lambda / Cloud Functions) এর জন্য setup:
serverless_engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool
)
```
