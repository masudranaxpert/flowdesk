## Relationships & Joins

বাস্তবমুখী প্রজেক্টে ডেটাবেজ টেবিলগুলো একে অপরের সাথে সম্পর্কযুক্ত থাকে (যেমন User -> Posts, Post -> Comments)।

SQLAlchemy তে 관계 ডিফাইন করতে **`ForeignKey`** এবং **`relationship()`** যৌথভাবে ব্যবহৃত হয়।

---

## One-to-Many Relationship (১ টি User -> বহু Posts)

```python
from typing import List
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)

    # One-to-Many Relationship to Post
    # back_populates ensures bilateral synchronization
    posts: Mapped[List["Post"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan" # User ডিলিট করলে তার সব post অটো ডিলিট হবে
    )

class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(nullable=False)

    # Foreign Key Column pointing to users.id
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Many-to-One Relationship back to User
    author: Mapped["User"] = relationship(back_populates="posts")
```

---

## Relationships এর সাথে CRUD ব্যবহারের সহজ নিয়ম

`relationship` থাকার ফলে কাস্টম ID না সেট করেই পাইথনিক উপায়ে নেস্টেড ডেটা ইনসার্ট করা যায়:

```python
with Session(engine) as session:
    # new user containing post objects directly
    user = User(
        username="rahim_ai",
        posts=[
            Post(title="PyTorch vs TensorFlow 2026", content="PyTorch is booming!"),
            Post(title="SQLAlchemy 2.0 Guide", content="Mapped columns are great.")
        ]
    )
    
    session.add(user)
    session.commit()
    # SQLAlchemy automatic-ভাবে Foreign Key (user_id) অ্যাসাইন করে দিবে!
```

---

## Many-to-Many Relationship (Post <-> Tag)

মেনি-টু-মেনি রিলেশনশিপের জন্য একটি মধ্যবর্তী **Junction / Secondary Table** লাগে।

```python
from sqlalchemy import Table, Column

# Association Table Definition
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)

class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))

    # Many-to-Many Link to Tag
    tags: Mapped[List["Tag"]] = relationship(
        secondary=post_tags,
        back_populates="posts"
    )

class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)

    posts: Mapped[List["Post"]] = relationship(
        secondary=post_tags,
        back_populates="tags"
    )
```

---

## Modern Explicit Joins Query Syntax

`select()` স্টেটমেন্টে `join()` ব্যবহার করে কুয়েরি করা:

```python
from sqlalchemy import select

with Session(engine) as session:
    # Explicit Inner Join Query
    stmt = (
        select(Post.title, User.username)
        .join(Post.author) # User table join
        .where(User.username == "rahim_ai")
    )
    
    results = session.execute(stmt).all()
    for title, username in results:
        print(f"Post: {title} by {username}")
```
