## Async SQLAlchemy — AsyncEngine & AsyncSession

আধুনিক High-Performance Web Framework (যেমন **FastAPI** বা **Sanic**) এর সাথে নন-ব্লকিং I/O ডেটাবেজ অপারেশন চালানোর জন্য **Async SQLAlchemy** আবশ্যক।

SQLAlchemy 2.0 তে Async support এখন প্রথম শ্রেণীর নাগরিকে পরিণত হয়েছে।

---

## 🛠️ প্রয়োজনীয় ড্রাইভারসমূহ

Async SQLAlchemy ব্যবহার করার জন্য Async-compatible Database Driver ইনস্টল করতে হয়:
- PostgreSQL: `asyncpg` বা `psycopg` (with async extension)
- SQLite: `aiosqlite`
- MySQL: `aiomysql` or `asyncmy`

```bash
pip install "sqlalchemy[asyncio]" asyncpg aiosqlite
```

---

## Async Engine & SessionFactory তৈরি করা

Async Operations এ `create_engine` এর বদলে **`create_async_engine`** এবং `Session` এর বদলে **`AsyncSession`** ব্যবহৃত হয়।

```python
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import select, String

# 1. Async Database URL (Note driver: postgresql+asyncpg)
ASYNC_DB_URL = "postgresql+asyncpg://postgres:secret@localhost:5432/mydatabase"
# SQLite async format: "sqlite+aiosqlite:///./test.db"

# 2. Async Engine
async_engine = create_async_engine(
    ASYNC_DB_URL,
    echo=True,
    pool_size=20,
    max_overflow=10
)

# 3. Async Session Factory
AsyncSessionFactory = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False # Async এ commit পর auto-expire বন্ধ রাখা ভালো
)
```

---

## Async CRUD Operations (with await)

Async SQLAlchemy তে সব I/O কলগুলোতে explicit **`await`** স্টেটমেন্ট ব্যবহার করতে হয়:

```python
class Base(DeclarativeBase):
    pass

class Item(Base):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

async def async_main():
    # 1. Create Tables asynchronously
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Insert Data
    async with AsyncSessionFactory() as session:
        async with session.begin(): # Auto-commit block
            item1 = Item(name="Gaming Laptop")
            item2 = Item(name="Mechanical Keyboard")
            session.add_all([item1, item2])

    # 3. Fetch Data with await session.scalars()
    async with AsyncSessionFactory() as session:
        stmt = select(Item).where(Item.name.like("%Gaming%"))
        result = await session.scalars(stmt)
        items = result.all()
        
        for item in items:
            print(f"Item: {item.id} - {item.name}")

if __name__ == "__main__":
    asyncio.run(async_main())
```

---

## FastAPI এর সাথে Production Dependency Injection Pattern

FastAPI তে Async Session inject করার ২০২৬ গোল্ডেন প্যাটার্ন:

```python
from typing import AsyncGenerator
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI()

# Session Generator function
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# FastAPI Endpoint with Depends
@app.get("/items/{item_id}")
async def read_item(item_id: int, db: AsyncSession = Depends(get_db_session)):
    stmt = select(Item).where(Item.id == item_id)
    item = (await db.scalars(stmt)).first()
    if not item:
        return {"error": "Item not found"}
    return {"id": item.id, "name": item.name}
```

> [!warning] Async এ Lazy Loading এড়িয়ে চলবে!
> Async Context এ সাধারণ Lazy Loading ট্রাই করলে `sqlalchemy.exc.MissingGreenlet` এরর দেয়! তাই Async কোয়েটিতে সবসময় `selectinload()` বা `joinedload()` অথবা `AsyncAttrs` ব্যবহার করবে।
