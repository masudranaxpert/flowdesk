## Production Best Practices & Performance

প্রোডাকশন গ্রেড অ্যাপ্লিকেশনে SQLAlchemy ব্যবহারের জন্য কিছু মেমরি, কানেকশন এবং কোয়েরি পারফরম্যান্স অপটিমাইজেশন নিয়ম কঠোরভাবে মেনে চলা উচিত।

---

## 1. Clean Session Lifecycle Management

Session কখনোই গ্লোবাল ভ্যারিয়েবল হিসেবে দীর্ঘক্ষণ খোলা রাখা উচিত নয়। প্রতি HTTP Request বা Background Task এ **Short-Lived Session** খোলা ও বন্ধ করা উচিত।

```python
# ✅ Best Practice: Context Manager with automatic closure
def get_user_by_id(user_id: int):
    with Session(engine) as session:
        return session.get(User, user_id)
        # Session is automatically closed here!
```

---

## 2. Bulk Operations Optimization

হাজার হাজার রো ইনসার্ট বা আপডেট করার সময় সাধারণ loop এ `session.add()` চালানো ধীরগতির। সে ক্ষেত্রে **`insert()` / `update()` statement with list of dicts** অথবা **`session.add_all()`** ব্যবহার করা উচিত।

```python
# ❌ Slow: Loop with add
# for data in huge_list:
#     session.add(User(**data))

# ✅ Fast: Bulk Insert Query Execution (SQLAlchemy 2.0 Bulk Insert)
from sqlalchemy import insert

users_data = [
    {"username": f"user_{i}", "email": f"user_{i}@example.com"}
    for i in range(10000)
]

with Session(engine) as session:
    session.execute(insert(User), users_data)
    session.commit()
```

---

## 3. Selecting Specific Columns only (DTO Pattern)

টেবিলের সব কলামের দরকার না থাকলে শুধু নির্দিষ্ট কলাম সিলেক্ট করলে মেমরি ও নেটওয়ার্ক ব্যান্ডউইথ বাঁচে:

```python
# ❌ Fetches entire row metadata
users = session.scalars(select(User)).all()

# ✅ Fetches only required columns tuple (Extremely fast & lightweight)
stmt = select(User.id, User.username).where(User.is_active == True)
results = session.execute(stmt).all()
for user_id, username in results:
    print(user_id, username)
```

---

## 4. Connection Pool Size Tuning Checklist

আপনার Web Server (e.g. Gunicorn with Uvicorn workers) যদি multiple worker প্রক্রিয়া চালায়:

```python
# Recommended pool configuration per worker:
engine = create_engine(
    DATABASE_URL,
    pool_size=5,        # Keep initial pools small per worker process
    max_overflow=10,    # Spike capacity
    pool_timeout=30,    # Max seconds to wait for connection from pool
    pool_recycle=1800,  # Recycle stale connection every 30 minutes
    pool_pre_ping=True  # Avoid dropped connection crashes
)
```

---

## 2026 Production Checklist Cheat Sheet

- [x] **`Mapped` & `mapped_column` type annotations ব্যবহার করেছো?**
- [x] **সব ১-টু-মেনি রিলেশনে `selectinload` ব্যবহার করা হয়েছে (N+1 সমাধান)?**
- [x] **সব Async কোডে `AsyncSession` ও `asyncpg` ব্যবহার নিশ্চিত করা হয়েছে?**
- [x] **মাইগ্রেশনের জন্য Alembic ব্যবহার করা হয়েছে?**
- [x] **`pool_pre_ping=True` অন রাখা আছে?**
- [x] **প্যাজিনেশনে `limit()` ও `offset()` ব্যবহার করা হয়েছে?**
