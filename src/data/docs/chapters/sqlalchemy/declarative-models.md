## Declarative Models — Mapped & mapped_column

SQLAlchemy 2.0 এর সবচেয়ে বড় এবং আধুনিক পরিবর্তন হলো **`Mapped[...]`** টাইপ এনোটেশন এবং **`mapped_column()`** হেলপার ফাংশন। 

এটি Python Type System (PEP 484) এর সাথে ১০০% সামঞ্জস্যপূর্ণ।

---

## Standard Base Class তৈরি করা

SQLAlchemy 2.0 এ সব Model Class `DeclarativeBase` থেকে ইনহেরিট করে।

```python
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Master Base Class
class Base(DeclarativeBase):
    pass
```

---

## Modern Model Definition (User & Post Example)

```python
class User(Base):
    __tablename__ = "users"

    # Primary Key with auto-increment
    id: Mapped[int] = mapped_column(primary_key=True)

    # Required String Column (VARCHAR(50))
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    # Email Column
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # Optional Column (NULL permitted in DB)
    bio: Mapped[Optional[str]] = mapped_column(String(255), default=None)

    # Boolean with Default Value
    is_active: Mapped[bool] = mapped_column(default=True)

    # Timestamp Column with Server Default
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"
```

---

## Python Types vs SQLAlchemy Column Types

`Mapped[T]` টাইপ হিন্ট ব্যবহার করলে SQLAlchemy স্বয়ংক্রিয়ভাবে সঠিক Python/SQL ডাটাটাইপ সনাক্ত করে:

| Python Type Annotation | SQLAlchemy Data Type | Constraints / Default SQL |
| :--- | :--- | :--- |
| `Mapped[int]` | `Integer` | `NOT NULL` |
| `Mapped[Optional[int]]` | `Integer` | `NULL` allowed |
| `Mapped[str]` | `String` / `VARCHAR` | `NOT NULL` |
| `Mapped[bool]` | `Boolean` | `NOT NULL` |
| `Mapped[datetime]` | `DateTime` / `TIMESTAMP` | `NOT NULL` |
| `Mapped[dict]` | `JSON` / `JSONB` | `NOT NULL` |

> [!tip] Type Checker Friendliness
> যখন তুমি `user.username` এনোটেশন দাও `Mapped[str]`, তখন Python Mypy বা Pyright জানে যে `user.username` একটি `str` টাইপ। পুরোনো `Column(String)` মেথডে IDE জানতে পারতো না এটি String নাকি Column object!

---

## Common Columns Mixin Pattern

প্রজেক্টের একাধিক মডেলে বারবার ব্যবহার হওয়া কলামগুলো (যেমন `id`, `created_at`, `updated_at`) একটি **Mixin Class** এ ডিফাইন করা বেস্ট প্র্যাকটিস:

```python
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    price: Mapped[float] = mapped_column(nullable=False)
```
