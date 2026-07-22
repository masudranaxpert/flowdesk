## Database Migrations with Alembic

প্রোডাকশন ডেটাবেজে টেবিল তৈরি, কলাম সংশোধন বা ইনডেক্স যোগ করার জন্য কখনো `Base.metadata.create_all()` ব্যবহার করা উচিত নয় — কারণ এটি বিদ্যমান টেবিল অল্টার করতে পারে না!

SQLAlchemy এর অফিসিয়াল মাইগ্রেশন টুল হলো **Alembic**।

---

## Alembic Initialization & Setup

Alembic ইনস্টল এবং প্রজেক্ট ইনিশিয়ালাইজেশন:

```bash
pip install alembic

# Initialize Alembic setup in your project directory
alembic init migrations
```

এই কমান্ডটি আপনার প্রজেক্টে একটি `migrations/` (বা `alembic/`) ডিরেক্টরি এবং একটি `alembic.ini` কনফিগারেশন ফাইল তৈরি করবে:

```
my_project/
│── migrations/
│   ├── versions/       # Contains all migration script files
│   ├── env.py          # Migration environment setup script
│   └── script.py.mako
│── alembic.ini         # Main configuration file
└── app/
    └── models.py       # SQLAlchemy Base and Models
```

---

## `alembic.ini` & `env.py` কনফিগারেশন

### ১. `alembic.ini` ফাইলে Database URL সেট করা
```ini
sqlalchemy.url = postgresql://user:password@localhost/dbname
```

### ২. `env.py` ফাইলে Model Base লিঙ্ক করা
Alembic যাতে আপনার মডেলের স্ট্রাকচার বুঝতে পারে এবং Column Type/Length পরিবর্তন ডিটেক্ট করতে পারে, তার জন্য `migrations/env.py` ফাইলে মডেলের `Base.metadata` ও `compare_type=True` যোগ করতে হয়:

```python
# migrations/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# 1. Import your SQLAlchemy models Base
from app.models import Base  # <-- Update this import!

config = context.config

# 2. Set target_metadata
target_metadata = Base.metadata  # <-- Link your metadata here!

# 3. Enable compare_type for detecting column type/length changes
def run_migrations_online() -> None:
    # ...
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,  # <-- Type, Length & Nullable detection
    )
```

---

## Step-by-Step Migration Workflow

```mermaid
flowchart LR
    Edit[1. Edit Models.py] --> Gen[2. alembic revision --autogenerate]
    Gen --> Review[3. Review Script in versions/]
    Review --> Apply[4. alembic upgrade head]
```

### ১. প্রথমবার Table Create করা
ধরা যাক `app/models.py` ফাইলে একটি `User` টেবিল তৈরি করা আছে:

```python
# app/models.py
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
```

#### Step A: স্বয়ংক্রিয় মাইগ্রেশন স্ক্রিপ্ট তৈরি করা
```bash
alembic revision --autogenerate -m "create users table"
```
Alembic মডেলের সাথে ডেটাবেজের বর্তমান অবস্থা তুলনা করে `migrations/versions/` ফোল্ডারে ফাইল জেনারেট করবে:

```python
# migrations/versions/abc123_create_users_table.py
def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

def downgrade() -> None:
    op.drop_table('users')
```

#### Step B: মাইগ্রেশন ডেটাবেজে অ্যাপ্লাই করা (Table Create)
```bash
alembic upgrade head
```

---

### ২. Table Modification (Column Add, Drop & Alter)

প্রজেক্ট চলার সময় `models.py` এ কোনো কলাম পরিবর্তন বা সংযোজন করার গাইড:

#### ক. নতুন Column Add করা
`models.py`-এ কলাম যুক্ত করুন: `phone = Column(String(20), nullable=True)`

```bash
alembic revision --autogenerate -m "add phone column to users"
alembic upgrade head
```
*Generated Code in Migration File:*
```python
op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True))
```

#### খ. পুরোনো Column Delete / Drop করা
`models.py` থেকে কলামটি মুছে ফেলুন (যেমন: `is_active` মুছে ফেলা):

```bash
alembic revision --autogenerate -m "remove is_active column from users"
alembic upgrade head
```
*Generated Code in Migration File:*
```python
op.drop_column('users', 'is_active')
```

#### গ. Column Type, Length, Nullable, Unique বা Default পরিবর্তন করা
`models.py`-এ কলাম পরিবর্তন করুন (যেমন: `name` এর দৈর্ঘ্য ৫০ থেকে বাড়িয়ে ১৫০ করা এবং `nullable=True` করা):

```python
name = Column(String(150), nullable=True)
```

```bash
alembic revision --autogenerate -m "alter name column length and nullable"
alembic upgrade head
```
*Generated Code in Migration File:*
```python
op.alter_column('users', 'name',
               existing_type=sa.String(length=50),
               type_=sa.String(length=150),
               existing_nullable=False,
               nullable=True)
```

---

### ৩. মাইগ্রেশন রোলব্যাক (Downgrade) করা
যদি কোনো ভুল হয়ে থাকে এবং ১ ধাপ পেছনে ফেরত যেতে চান:

```bash
# Rollback one migration step back
alembic downgrade -1

# Rollback to initial state
alembic downgrade base
```

---

## Useful Alembic CLI Commands Cheat Sheet

| Command | Purpose |
| :--- | :--- |
| `alembic init migrations` | প্রজেক্টে alembic ইনিশিয়ালাইজ করে |
| `alembic revision --autogenerate -m "msg"` | মডেলে পরিবর্তনের ওপর ভিত্তি করে মাইগ্রেশন ফাইল বানায় |
| `alembic upgrade head` | সব প্যান্ডিং মাইগ্রেশন ডেটাবেজে রান করে |
| `alembic downgrade -1` | সর্বশেষ মাইগ্রেশনটি রোলব্যাক করে |
| `alembic current` | ডেটাবেজের বর্তমান মাইগ্রেশন হ্যাশ/ভার্সন দেখায় |
| `alembic history` | প্রজেক্টের সব মাইগ্রেশনের হিস্ট্রি দেখায় |

> [!important] Async SQLAlchemy Alembic Setup
> Async App এর ক্ষেত্রে `alembic init -t async migrations` কমান্ড দিয়ে async template ইনিশিয়ালাইজ করতে হয়। এটি `env.py` তে `asyncio` রানার অটোমেটিক সেটআপ করে দেয়!

