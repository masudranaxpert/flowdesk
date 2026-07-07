# Database — SQLAlchemy 2.0 ও SQLModel সম্পূর্ণ গাইড

তোমার API data in-memory তে রাখলে server restart হলে সব হারিয়ে যাবে। বাস্তবে প্রতিটা application এ একটা database দরকার। এই chapter এ আমরা SQLAlchemy 2.0 আর SQLModel দিয়ে FastAPI তে database integration সম্পূর্কভাবে শিখবো — সবথেকে basic থেকে production-grade pattern পর্যন্ত।

এই chapter অনেক বড় — কারণ database হলো যেকোনো backend এর হৃদপিণ্ড। এখানে ভুল করলে পুরো app ভেঙে যাবে। তাই ধৈর্য ধরে পড়ো।

## Database কেন দরকার?

একটু ভাবো — তুমি একটা e-commerce API বানালে। Users signup করবে, product add হবে, order আসবে। এসব data কোথায় রাখবে?

- **In-memory dict** — server restart হলে সব উধাও। আর another user তোমার data দেখতে পারবে না (different process)।
- **File system** — ধীর, concurrent access problem, no query capability।
- **Database** — permanent storage, concurrent access, powerful queries, relationships, transactions।

SQL (relational) database গুলো সবচেয়ে mature আর widely used। PostgreSQL, MySQL, SQLite — এই তিনটা সবচেয়ে popular।

> [!tip] PostgreSQL শিখো
> Production এর জন্য PostgreSQL সবচেয়ে ভালো choice। এটা open-source, extremely reliable, আর JSON, full-text search, geospatial — সব সাপোর্ট করে। এই chapter এর সব example PostgreSQL এর জন্য, কিন্তু কোড SQLite দিয়েও চলবে।

## SQLAlchemy 2.0 Architecture

SQLAlchemy কে অনেকে শুধু "ORM" মনে করে — কিন্তু আসলে এটা দুটো আলাদা layer:

```
SQLAlchemy 2.0
├── Core (Low-level)
│   ├── Engine — database connection manager
│   ├── Connection — actual DB connection
│   ├── Table — table definition
│   ├── select()/insert()/update()/delete() — SQL construction
│   └── Result — query result handling
│
└── ORM (High-level)
    ├── Session — unit of work, identity map
    ├── Mapped class — Python class → DB table
    ├── Relationship — foreign keys, joins
    └── Mapped[] / mapped_column — type-safe columns
```

**Core** হলো SQL এর Pythonic wrapper — তুমি raw SQL এর কাছাকাছি কোড লেখো, কিন্তু type-safe আর composable।

**ORM** হলো Core এর উপরে একটা layer — তুমি Python object নিয়ে কাজ করো, ORM ভেতরে SQL generate করে।

> [!important] ORM সবসময় দরকার নেই
> অনেকে শুধু ORM ব্যবহার করে আর Core সম্পর্কে জানেই না। কিন্তু complex report query, bulk operation, raw performance দরকার হলে Core জানা থাকা জরুরি। ORM আর Core একসাথে use করা যায় — এক এর মধ্যে conflict নেই।

## Engine Setup — Database Connection

Engine হলো SQLAlchemy এর entry point — এটা database এর সাথে connection manage করে।

### Database URL Formats

```python
# Different database URLs
DATABASE_URLS = {
    # PostgreSQL (async) — production recommended
    "postgres_async": "postgresql+asyncpg://user:pass@localhost:5432/mydb",

    # PostgreSQL (sync)
    "postgres_sync": "postgresql+psycopg2://user:pass@localhost:5432/mydb",

    # MySQL (async)
    "mysql_async": "mysql+aiomysql://user:pass@localhost:3306/mydb",

    # SQLite (development/testing)
    "sqlite": "sqlite:///./app.db",
    "sqlite_memory": "sqlite+aiomysql:///:memory:",

    # SQL Server
    "mssql": "mssql+pyodbc://user:pass@server/db?driver=ODBC+Driver+17+for+SQL+Server",
}
```

URL format হলো: `dialect+driver://user:password@host:port/database`

প্রতিটা অংশের মানে:
- `dialect` — কোন database (postgresql, mysql, sqlite)
- `driver` — কোন Python driver (asyncpg, psycopg2, aiomysql)
- `user:password` — credentials
- `host:port` — database server address
- `database` — database name

### Sync vs Async Engine

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine

# SYNC engine — blocking, traditional
sync_engine = create_engine(
    "postgresql+psycopg2://user:pass@localhost:5432/mydb",
    echo=True,            # Log SQL queries (development only)
    pool_size=10,         # Permanent connections in pool
    max_overflow=20,      # Extra burst connections
    pool_pre_ping=True,   # Health check before use
)

# ASYNC engine — non-blocking, recommended for FastAPI
async_engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost:5432/mydb",
    echo=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,    # Recycle connections every hour
)
```

> [!note] echo=True শুধু development এ
> `echo=True` দিলে প্রতিটা SQL query console এ print হয়। এটা debugging এ দারুণ useful, কিন্তু production এ বন্ধ রাখো — performance impact আছে।

### SQLite এর জন্য বিশেষ কনফিগ

```python
# SQLite — extra args needed for async
sqlite_engine = create_async_engine(
    "sqlite+aiosqlite:///./app.db",
    connect_args={
        "check_same_thread": False,  # Allow multi-thread access
    },
)

# SQLite async needs special pool config
from sqlalchemy.pool import NullPool
sqlite_engine = create_async_engine(
    "sqlite+aiosqlite:///./app.db",
    poolclass=NullPool,  # SQLite doesn't benefit from pooling
    connect_args={"check_same_thread": False},
)
```

SQLite এ connection pooling এর দরকার নেই — কারণ SQLite file-based, connection open করা খুব সস্তা।

## Session — The Unit of Work

Session হলো SQLAlchemy ORM এর সবচেয়ে গুরুত্বপূর্ণ concept। এটা শুধু database connection না — এটা একটা **unit of work** pattern implement করে।

### Session Lifecycle

```
1. Session created → empty identity map
2. Objects added → session tracks them
3. Query executed → objects loaded into identity map
4. session.commit() → all changes flushed to DB, transaction committed
5. session.rollback() → all changes discarded
6. Session closed → connection returned to pool
```

### Identity Map

Session একটা **identity map** রাখে — একই primary key এর object বারবার database থেকে load হবে না, session এর ভেতর থেকে return করবে।

```python
# Same primary key = same Python object within a session
user1 = session.get(User, 1)
user2 = session.get(User, 1)
print(user1 is user2)  # True! Same object, no second DB query
```

এটা খুব important — কারণ এর মানে এক session এর ভেতরে object গুলো consistent থাকে।

### Session Factory

```python
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# Create engine
engine = create_async_engine("postgresql+asyncpg://user:pass@localhost:5432/mydb")

# Session factory — NOT a session itself, it CREATES sessions
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't reload objects after commit
    autoflush=False,         # Don't auto-flush before queries
)
```

`expire_on_commit=False` কেন দরকার? Default behavior এ commit হওয়ার পর সব object "expired" হয়ে যায় — পরের access এ আবার database থেকে reload হয়। API response তৈরি করার সময় এটা সমস্যা তৈরি করে, তাই `False` দেওয়া ভালো।

### Session as FastAPI Dependency

FastAPI তে session কে dependency হিসেবে inject করা হয়:

```python
from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield a database session.
    - Creates a fresh session per request
    - Commits on success, rolls back on error
    - Always closes the session
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Use in route
@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user
```

প্রতিটা request একটা fresh session পায়। Request successful হলে `commit()` হয়, error হলে `rollback()` হয়। Session close হয়ে connection pool এ ফেরত যায়।

> [!important] yield dependency কীভাবে কাজ করে
> `yield` এর আগের কোড = setup (session create)
> `yield` এর পরের কোড = cleanup (commit/rollback/close)
> এটা Python context manager pattern — FastAPI এটা automatically handle করে।

## Models — Type-Safe Column Definitions

SQLAlchemy 2.0 এ নতুন `Mapped[]` আর `mapped_column()` syntax চালু হয়েছে — এটা type-safe আর IDE support অনেক ভালো।

### Basic Model

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, Boolean, Integer, BigInteger, Float, DateTime, Date, Time
from datetime import datetime, date
import uuid

class Base(DeclarativeBase):
    """Base class for all models."""
    pass

class User(Base):
    __tablename__ = "users"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Required string fields
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))

    # Optional field (None = NULL)
    bio: Mapped[str | None] = mapped_column(Text, default=None)

    # With default
    is_active: Mapped[bool] = mapped_column(default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # UUID
    public_id: Mapped[uuid.UUID] = mapped_column(
        default=uuid.uuid4,
        unique=True,
    )
```

খেয়াল করো — `Mapped[str]` মানে field টা required (NOT NULL), `Mapped[str | None]` মানে optional (NULL allowed)। Python type hint থেকেই nullable কিনা বোঝা যায় — আলাদা `nullable=True` লেখার দরকার নেই।

### Column Types Reference

```python
# Complete column types reference
class Product(Base):
    __tablename__ = "products"

    # Integers
    id: Mapped[int] = mapped_column(primary_key=True)
    stock_count: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(BigInteger, default=0)  # Large numbers

    # Strings
    name: Mapped[str] = mapped_column(String(200))      # VARCHAR(200)
    description: Mapped[str | None] = mapped_column(Text) # TEXT, no length limit
    sku: Mapped[str] = mapped_column(String(50), unique=True)

    # Numbers
    price: Mapped[float] = mapped_column(Float(precision=10, decimal_return_scale=2))
    weight: Mapped[float | None] = mapped_column(Float)

    # Boolean
    is_published: Mapped[bool] = mapped_column(default=False)

    # Date/Time
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expiry_date: Mapped[date | None] = mapped_column(Date)

    # JSON (PostgreSQL native)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, default=dict)

    # Enum
    from sqlalchemy import Enum as SAEnum
    from enum import Enum as PyEnum

    status: Mapped[str] = mapped_column(
        SAEnum("draft", "published", "archived", name="product_status"),
        default="draft",
    )
```

### Table-Level Constraints

```python
from sqlalchemy import UniqueConstraint, Index, CheckConstraint, ForeignKey

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    total: Mapped[float] = mapped_column(default=0)

    # Table-level constraints
    __table_args__ = (
        # Composite unique constraint
        UniqueConstraint("user_id", "order_number", name="uq_user_order_number"),

        # Check constraint — database-level validation
        CheckConstraint("total >= 0", name="ck_total_positive"),

        # Index for query performance
        Index("ix_orders_user_status", "user_id", "status"),
    )
```

- `UniqueConstraint` — একাধিক column এর combination unique হবে
- `CheckConstraint` — database-level validation (total কখনো negative হবে না)
- `Index` — query fast করার জন্য composite index

## Querying — select() গভীরে

SQLAlchemy 2.0 এর `select()` হলো query building এর মূল হাতিয়ার।

### Basic SELECT

```python
from sqlalchemy import select

# Get all users
result = await session.execute(select(User))
users = result.scalars().all()  # List[User]

# Get single user by primary key
user = await session.get(User, 1)

# Get single user with query
result = await session.execute(
    select(User).where(User.email == "john@example.com")
)
user = result.scalar_one_or_none()  # User or None

# scalar_one() — exactly one result required (raises if 0 or 2+)
# scalar_one_or_none() — zero or one result (raises if 2+)
# first() — first result or None
# all() — list of results
```

### WHERE — Filtering

```python
# Comparison operators
result = await session.execute(
    select(User).where(User.age >= 18)
)

# Multiple WHERE = AND
result = await session.execute(
    select(User).where(
        User.age >= 18,
        User.is_active == True,
    )
)

# OR
from sqlalchemy import or_, and_
result = await session.execute(
    select(User).where(
        or_(
            User.email == "john@example.com",
            User.email == "jane@example.com",
        )
    )
)

# IN
result = await session.execute(
    select(User).where(User.id.in_([1, 2, 3, 4, 5]))
)

# NOT IN
result = await session.execute(
    select(User).where(~User.id.in_([1, 2, 3]))
)

# LIKE / ILIKE (case-insensitive)
result = await session.execute(
    select(User).where(User.full_name.ilike("%john%"))
)

# IS NULL / IS NOT NULL
result = await session.execute(
    select(User).where(User.bio.is_(None))      # bio IS NULL
)
result = await session.execute(
    select(User).where(User.bio.isnot(None))    # bio IS NOT NULL
)

# BETWEEN
result = await session.execute(
    select(User).where(User.age.between(18, 65))
)
```

### ORDER BY, LIMIT, OFFSET

```python
# Order by
result = await session.execute(
    select(User)
    .order_by(User.created_at.desc())  # DESC
    # .order_by(User.created_at.asc())  # ASC (default)
)

# Multiple order by
result = await session.execute(
    select(User)
    .order_by(User.is_active.desc(), User.full_name.asc())
)

# Limit + Offset (pagination)
result = await session.execute(
    select(User)
    .order_by(User.id)
    .offset(20)   # Skip first 20
    .limit(10)    # Take 10
)
```

### Aggregate Functions

```python
from sqlalchemy import func, count, sum as sql_sum, avg, min as sql_min, max as sql_max

# Count total users
result = await session.execute(
    select(func.count(User.id))
)
total_users = result.scalar_one()

# Count active users
result = await session.execute(
    select(func.count(User.id)).where(User.is_active == True)
)

# Average age
result = await session.execute(
    select(func.avg(User.age))
)

# GROUP BY — count users by active status
result = await session.execute(
    select(
        User.is_active,
        func.count(User.id).label("user_count"),
    )
    .group_by(User.is_active)
)
for row in result:
    print(f"Active={row.is_active}, Count={row.user_count}")

# HAVING — filter after grouping
result = await session.execute(
    select(
        User.country,
        func.count(User.id).label("user_count"),
    )
    .group_by(User.country)
    .having(func.count(User.id) > 100)  # Only countries with 100+ users
)
```

### DISTINCT

```python
from sqlalchemy import distinct

# Get unique countries
result = await session.execute(
    select(distinct(User.country))
)
countries = result.scalars().all()
```

## Advanced Queries — Joins ও Subqueries

### JOIN

```python
# User -> Orders (one-to-many)
# Get users with their order count
result = await session.execute(
    select(
        User,
        func.count(Order.id).label("order_count"),
    )
    .outerjoin(Order, Order.user_id == User.id)  # LEFT JOIN
    .group_by(User.id)
)

# INNER JOIN — only users who have orders
result = await session.execute(
    select(User)
    .join(Order, Order.user_id == User.id)
    .distinct()  # Avoid duplicate users
)

# Multiple JOINs
result = await session.execute(
    select(Order, User, Product)
    .join(User, Order.user_id == User.id)
    .join(OrderItem, OrderItem.order_id == Order.id)
    .join(Product, OrderItem.product_id == Product.id)
    .where(Order.status == "completed")
)
```

### Subqueries

```python
# Subquery: users who spent more than average
avg_spending = (
    select(func.sum(Order.total).label("total"))
    .group_by(Order.user_id)
    .scalar_subquery()
)

result = await session.execute(
    select(User)
    .join(Order, Order.user_id == User.id)
    .group_by(User.id)
    .having(func.sum(Order.total) > avg_spending)
)

# EXISTS subquery
from sqlalchemy import exists
result = await session.execute(
    select(User).where(
        exists().where(Order.user_id == User.id)
    )
)
# Users who have at least one order
```

### Window Functions (PostgreSQL)

```python
from sqlalchemy import over

# Rank users by spending within each country
result = await session.execute(
    select(
        User.full_name,
        User.country,
        func.sum(Order.total).label("total_spent"),
        func.rank().over(
            partition_by=User.country,
            order_by=func.sum(Order.total).desc(),
        ).label("country_rank"),
    )
    .join(Order, Order.user_id == User.id)
    .group_by(User.id, User.full_name, User.country)
)
```

## Relationships — Model গুলোর মধ্যে Connection

### One-to-Many

```python
from sqlalchemy.orm import relationship, Relationship

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    # One department has many employees
    employees: Mapped[list["Employee"]] = relationship(
        back_populates="department",
        cascade="all, delete-orphan",  # Delete employees when department deleted
    )

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    salary: Mapped[float] = mapped_column(default=0)

    # FK to department
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
    )

    # Many employees belong to one department
    department: Mapped["Department"] = relationship(back_populates="employees")
```

`back_populates` দুই দিকের link তৈরি করে — `department.employees` দিলে employee list পাবে, `employee.department` দিলে department object পাবে।

`cascade="all, delete-orphan"` মানে department delete করলে সেই department এর সব employee-ও delete হবে।

### One-to-One

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True)

    # uselist=False makes it one-to-one
    profile: Mapped["UserProfile | None"] = relationship(
        back_populates="user",
        uselist=False,  # KEY: one-to-one, not one-to-many
        cascade="all, delete-orphan",
    )

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,  # KEY: ensures one-to-one
    )
    bio: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    user: Mapped["User"] = relationship(back_populates="profile")
```

`uselist=False` আর FK তে `unique=True` — এই দুটো মিলে one-to-one enforce করে।

### Many-to-Many

```python
from sqlalchemy import Table, Column

# Association table — links students and courses
student_course = Table(
    "student_course",
    Base.metadata,
    Column("student_id", ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
    Column("course_id", ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("enrolled_at", DateTime, default=datetime.utcnow),  # Extra data
    Column("grade", Float, nullable=True),  # Extra data on the link
)

class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    courses: Mapped[list["Course"]] = relationship(
        secondary=student_course,  # The association table
        back_populates="students",
    )

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    credits: Mapped[int] = mapped_column(default=3)

    students: Mapped[list["Student"]] = relationship(
        secondary=student_course,
        back_populates="courses",
    )
```

Many-to-many তে একটা **association table** দরকার — এটা একটা helper table যেটাতে দুটো FK থাকে। `secondary=student_course` দিয়ে relationship কে বলা হয় কোন table দিয়ে link তৈরি করতে হবে।

### Eager vs Lazy Loading

```python
# LAZY loading (default) — N+1 problem!
# This causes separate query for each department's employees
users = await session.execute(select(User))
for user in users.scalars():
    print(user.profile.bio)  # SEPARATE query for each profile!

# EAGER loading — join in one query
from sqlalchemy.orm import selectinload, joinedload, subqueryload

# selectinload — separate IN query (best for collections)
users = await session.execute(
    select(User).options(selectinload(User.orders))
)

# joinedload — single JOIN query (best for one-to-one)
users = await session.execute(
    select(User).options(joinedload(User.profile))
)

# Multiple eager loads
users = await session.execute(
    select(User).options(
        selectinload(User.orders).selectinload(Order.items),
        joinedload(User.profile),
    )
)
```

> [!warn] N+1 Query Problem
> Lazy loading এর সবচেয়ে বড় সমস্যা হলো N+1 — প্রথমে ১টা query দিয়ে users load হয়, তারপর প্রতিটা user এর relationship access করার সময় আলাদা query চলে। ১০০টা user হলে ১০১টা query! `selectinload` বা `joinedload` use করে এটা এক query তে solve করা যায়।

## Transactions — Commit ও Rollback

Transaction মানে এক বা একাধিক operation এর একটা group — সব success হলে সব commit হবে, একটাও fail হলে সব rollback হবে।

```python
# Basic transaction — handled by get_session dependency
async with async_session_factory() as session:
    try:
        # Multiple operations in one transaction
        user = User(email="new@example.com", full_name="New User")
        session.add(user)
        await session.flush()  # Get user.id without committing

        profile = UserProfile(user_id=user.id, bio="Hello!")
        session.add(profile)

        # Both saved together — all or nothing
        await session.commit()

    except Exception:
        await session.rollback()
        raise
```

### Nested Transactions (Savepoints)

```python
# Nested transaction — try risky operation, rollback to savepoint if fails
async with async_session_factory() as session:
    user = User(email="user@example.com", full_name="Test User")
    session.add(user)
    await session.flush()

    # Start a savepoint
    async with session.begin_nested():
        try:
            # Risky operation
            order = Order(user_id=user.id, total=-100)  # Invalid!
            session.add(order)
            await session.flush()  # Will fail due to CHECK constraint
        except Exception:
            pass  # Savepoint rolled back, but user is still saved

    # User is still in the session, only the order was rolled back
    await session.commit()
```

## CRUD Pattern — Complete Example

এখন একটা complete CRUD example দেখি — User management সহ full endpoint:

```python
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from pydantic import BaseModel, EmailStr
from typing import Annotated
import uuid

# ── Setup ──────────────────────────────────────────────────

engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/mydb")
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

# ── Models ─────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    full_name: Mapped[str] = mapped_column()
    age: Mapped[int | None] = mapped_column(default=None)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

# ── Schemas ────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    age: int | None = None

class UserUpdate(BaseModel):
    full_name: str | None = None
    age: int | None = None
    is_active: bool | None = None

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    age: int | None
    is_active: bool
    created_at: datetime

# ── Dependency ─────────────────────────────────────────────

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

SessionDep = Annotated[AsyncSession, Depends(get_session)]

# ── App ────────────────────────────────────────────────────

app = FastAPI(title="User API")

# ── CREATE ─────────────────────────────────────────────────

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(data: UserCreate, session: SessionDep):
    # Check duplicate email
    existing = await session.execute(
        select(User).where(User.email == data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(**data.model_dump())
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user

# ── READ (single) ──────────────────────────────────────────

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: uuid.UUID, session: SessionDep):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user

# ── READ (list with pagination + filter) ───────────────────

@app.get("/users", response_model=list[UserResponse])
async def list_users(
    session: SessionDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_active: bool | None = None,
    search: str | None = None,
):
    query = select(User)

    # Apply filters
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%"))

    # Order + paginate
    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)

    result = await session.execute(query)
    return result.scalars().all()

# ── UPDATE (partial) ───────────────────────────────────────

@app.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    session: SessionDep,
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    # Only update provided fields
    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)

    await session.flush()
    await session.refresh(user)
    return user

# ── DELETE ─────────────────────────────────────────────────

@app.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, session: SessionDep):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    await session.delete(user)
    return None

# ── Count endpoint ─────────────────────────────────────────

@app.get("/users/count")
async def count_users(
    session: SessionDep,
    is_active: bool | None = None,
):
    query = select(func.count(User.id))
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    result = await session.execute(query)
    return {"count": result.scalar_one()}
```

## SQLModel — FastAPI + Pydantic + SQLAlchemy একসাথে

SQLModel হলো Sebastián Ramíquez (FastAPI creator) তৈরি একটা library যেটা Pydantic আর SQLAlchemy কে এক করে দেয়। ফলে একই class দিয়ে database model আর API schema দুটোই handle করা যায়।

```python
from sqlmodel import SQLModel, Field, Session, create_engine, select
from typing import Optional

# Database setup (sync engine for simplicity)
engine = create_engine("postgresql+psycopg2://user:pass@localhost/mydb")

# ── One model = DB table + Pydantic schema ─────────────────

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str = Field(max_length=100)
    age: Optional[int] = None
    is_active: bool = Field(default=True)

# ── Create schema (for input validation, NOT a table) ──────

class UserCreate(SQLModel):
    email: str
    full_name: str
    age: Optional[int] = None

# ── Response schema (for output, hides fields) ─────────────

class UserRead(SQLModel):
    id: int
    email: str
    full_name: str
    is_active: bool

# ── Update schema ──────────────────────────────────────────

class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
```

খেয়াল করো — `table=True` দিলে সেটা database table হবে, না দিলে শুধু Pydantic schema হবে (validation এর জন্য)। এতে কোড কম লাগে, কিন্তু flexibility ও কম।

### SQLModel CRUD

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session

app = FastAPI()

def get_session():
    with Session(engine) as session:
        yield session

@app.post("/users", response_model=UserRead)
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    db_user = User.from_orm(user)  # Convert create schema to DB model
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.get("/users", response_model=list[UserRead])
def list_users(
    skip: int = 0,
    limit: int = 20,
    session: Session = Depends(get_session),
):
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return users
```

> [!tip] SQLModel বনাম raw SQLAlchemy — কোনটা?
> **SQLModel** ব্যবহার করো যদি: ছোট-মাঝারি project, দ্রুত development, কম boilerplate চাও।
> **Raw SQLAlchemy 2.0** ব্যবহার করো যদি: বড় project, complex query, বেশি control দরকার, team এ SQLAlchemy experienced।
> SQLModel এখনও কিছু advanced SQLAlchemy feature সাপোর্ট করে না। Complex query দরকার হলে raw SQLAlchemy ই বেছে নাও।

## Alembic — Database Migration

`create_all()` শুধু নতুন table বানায় — পুরোনো table এ নতুন column add করতে পারে না। এই কাজের জন্য **Alembic** দরকার।

### Setup

```bash
# Install
pip install alembic

# Initialize in project
alembic init alembic
```

এতে এই structure তৈরি হয়:
```
project/
├── alembic.ini          # Configuration (DB URL, etc.)
└── alembic/
    ├── env.py           # Migration environment
    ├── script.py.mako   # Template for new migrations
    └── versions/        # Migration scripts (auto-generated)
```

### Configure env.py

```python
# alembic/env.py
from myapp.models import Base  # Import YOUR models
from alembic import context

# Point Alembic to your models
target_metadata = Base.metadata

# For async, modify the run_migrations_online function
# to use async engine:
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def run_async_migrations():
    engine = create_async_engine(config.get_main_option("sqlalchemy.url"))
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()
```

### Create ও Apply Migrations

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Add age column to users"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback to specific migration
alembic downgrade abc123

# Show migration history
alembic history --verbose

# Show current migration
alembic current
```

### Manual Migration Example

কখনো autogenerate ঠিক migration বানাতে পারে না। তখন manually লিখতে হয়:

```python
# alembic/versions/a1b2c3_add_user_age.py
"""Add age column to users

Revision ID: a1b2c3
Revises: x9y8z7
Create Date: 2026-01-15
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add column
    op.add_column("users", sa.Column("age", sa.Integer(), nullable=True))

    # Backfill data (existing users get default age)
    op.execute("UPDATE users SET age = 25 WHERE age IS NULL")

    # Create index
    op.create_index("ix_users_age", "users", ["age"])

def downgrade():
    op.drop_index("ix_users_age", table_name="users")
    op.drop_column("users", "age")
```

### Data Migration

শুধু structure না, data-ও migrate করতে পারে:

```python
def upgrade():
    # Add new column
    op.add_column("products", sa.Column("slug", sa.String(200), nullable=True))

    # Generate slugs from names
    conn = op.get_bind()
    products = conn.execute(sa.text("SELECT id, name FROM products")).fetchall()
    for product in products:
        slug = product.name.lower().replace(" ", "-")
        conn.execute(
            sa.text("UPDATE products SET slug = :slug WHERE id = :id"),
            {"slug": slug, "id": product.id},
        )

    # Now make it NOT NULL
    op.alter_column("products", "slug", nullable=False)
```

> [!important] Migration review করো
> `--autogenerate` সবসময় ১০০% সঠিক না। Column rename করলে সেটা drop + add হিসেবে detect হতে পারে — data হারাতে পারে! প্রতিটা migration script review করে তারপর apply করো।

## Connection Pooling Deep Dive

প্রতিটা database connection open করা expensive — TCP connection, authentication, session setup। Connection pooling এই connections reuse করে।

```python
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/mydb",
    pool_size=10,          # 10 permanent connections
    max_overflow=20,       # +20 burst connections = 30 total max
    pool_timeout=30,       # Wait 30s if all connections busy
    pool_recycle=3600,     # Recycle every hour (prevent stale)
    pool_pre_ping=True,    # Health check before use
)
```

### Pool Tuning Guidelines

| Parameter | Default | Production Recommendation | Why |
|---|---|---|---|
| `pool_size` | 5 | 10-20 | Depends on DB max_connections ÷ app instances |
| `max_overflow` | 10 | 10-20 | Burst traffic handling |
| `pool_timeout` | 30 | 30 | Don't wait too long |
| `pool_recycle` | -1 (never) | 3600 (1hr) | MySQL closes idle after 8hr (wait_timeout) |
| `pool_pre_ping` | False | **True** | Prevents "connection already closed" errors |

> [!important] Database max_connections
> PostgreSQL default `max_connections = 100`। যদি তোমার app 4টা worker চালায়, প্রতিটায় `pool_size=10, max_overflow=20`, তাহলে সর্বোচ্চ 4 × 30 = 120 connections — DB এর limit exceed করবে! হিসাব মিলিয়ে pool size set করো।

## Testing Database

Database সহ testing এর জন্য আলাদা test database দরকার।

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

TEST_DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/test_db"

@pytest.fixture(scope="function")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine):
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

@pytest.fixture
async def client(test_engine):
    # Override dependency
    async def get_test_session():
        async with async_sessionmaker(test_engine)() as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

# Test
async def test_create_user(client):
    response = await client.post("/users", json={
        "email": "test@example.com",
        "full_name": "Test User",
    })
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"
```

## Production Patterns

### Repository Pattern

বড় project এ route handler এ সরাসরি query না লিখে, একটা **repository layer** রাখো:

```python
class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self.session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def create(self, data: UserCreate) -> User:
        user = User(**data.model_dump())
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def list(self, skip: int = 0, limit: int = 20) -> list[User]:
        result = await self.session.execute(
            select(User).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def delete(self, user: User) -> None:
        await self.session.delete(user)

# Dependency
async def get_user_repo(session: SessionDep) -> UserRepository:
    return UserRepository(session)

# Route — clean, no SQL
@app.get("/users/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    repo: Annotated[UserRepository, Depends(get_user_repo)],
):
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user
```

### Health Check Endpoint

```python
@app.get("/health")
async def health_check(session: SessionDep):
    try:
        result = await session.execute(select(1))
        result.scalar_one()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(503, f"Database error: {e}")
```

### Database Lifecycle (Startup/Shutdown)

```python
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
```

## Request Flow Diagram

```mermaid
flowchart TD
    R[Client Request] --> EP[Route Handler]
    EP -->|Depends| GS[get_session]
    GS -->|borrow connection| POOL[Connection Pool]
    POOL -->|check out| CONN[DB Connection]
    CONN -->|wrap in| SES[AsyncSession]
    EP -->|execute queries| SES
    SES -->|generate SQL| DB[(PostgreSQL)]
    DB -->|return rows| SES
    SES -->|map to objects| EP
    EP -->|yield success| GS
    GS -->|commit transaction| DB
    GS -->|return connection| POOL
    GS -->|send response| R
```

## ORM Comparison

| Feature | SQLAlchemy 2.0 | SQLModel | Tortoise ORM | Django ORM |
|---|---|---|---|---|
| Async | ✅ Full | ⚠️ Sync only* | ✅ Native | ⚠️ Partial |
| Type hints | ✅ Mapped[] | ✅ Native | ✅ Native | ❌ Strings |
| Pydantic | ❌ Separate | ✅ Built-in | ✅ Built-in | ❌ |
| Migration | Alembic | Alembic | Aerich | Built-in |
| Learning curve | Steep | Easy | Easy | Easy |
| Complex queries | ✅ Very powerful | ⚠️ Limited | ⚠️ Moderate | ⚠️ Moderate |
| Raw SQL fallback | ✅ Easy | ✅ Via SQLAlchemy | ⚠️ | ⚠️ |
| Best for | Large apps | FastAPI projects | Async-first | Django projects |

*SQLModel async support তৈরি হচ্ছে, এখন পর্যন্ত sync engine use করতে হয়।

## Summary

এই chapter এ যা শিখলাম:

- **SQLAlchemy Architecture** — Core (low-level) vs ORM (high-level)
- **Engine** — sync vs async, connection URLs, pool configuration
- **Session** — unit of work, identity map, commit/rollback lifecycle
- **Models** — `Mapped[]`, `mapped_column()`, constraints, indexes
- **Querying** — `select()`, `where()`, `or_()`, `func.count()`, GROUP BY, HAVING
- **Advanced queries** — JOIN, subquery, window functions, EXISTS
- **Relationships** — one-to-one, one-to-many, many-to-many, eager vs lazy loading
- **Transactions** — commit, rollback, nested savepoints
- **CRUD** — complete User management API
- **SQLModel** — FastAPI + Pydantic + SQLAlchemy combined
- **Alembic** — auto migration, manual migration, data migration
- **Connection pooling** — pool_size, max_overflow, pre_ping, recycling
- **Testing** — test database, fixtures, dependency override
- **Production patterns** — repository pattern, health check, lifecycle events