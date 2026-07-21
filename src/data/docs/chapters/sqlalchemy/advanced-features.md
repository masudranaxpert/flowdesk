## Advanced Querying & Hybrid Attributes

জটিল বিঝনেস লজিক, রিয়েল-টাইম ক্যালকুলেটেড প্রপার্টিজ এবং অ্যাডভান্সড এসকিউএল (CTE, Window Functions) হ্যান্ডেল করার জন্য SQLAlchemy অত্যন্ত নমনীয় টেকনিক অফার করে।

---

## 1. Hybrid Properties (`@hybrid_property`)

`hybrid_property` এমন একটি ডেকোরেটর যা Python Level এ যেমন একটি সাধারণ প্রপার্টি হিসেবে কাজ করে, তেমনি SQL Query Level এও ডাইরেক্ট এক্সপ্রেশনে কনভার্ট হতে পারে!

```python
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import select, String

class Base(DeclarativeBase):
    pass

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(50))
    last_name: Mapped[str] = mapped_column(String(50))
    salary: Mapped[float] = mapped_column()

    # Hybrid Property Definition
    @hybrid_property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    # Expression builder for SQL Queries
    @full_name.expression
    def full_name(cls):
        return cls.first_name + " " + cls.last_name
```

### Hybrid Property ব্যবহারের উদাহরণ:
```python
# 1. Python In-Memory Instance Access
emp = Employee(first_name="Masud", last_name="Rana")
print(emp.full_name) # Outputs: "Masud Rana"

# 2. Directly filtering inside SQL Select Query!
with Session(engine) as session:
    stmt = select(Employee).where(Employee.full_name == "Masud Rana")
    employee = session.scalars(stmt).first()
```

---

## 2. Common Table Expressions (CTE)

জটিল সাব-কোয়েরিগুলোকে ক্লিন করার জন্য SQL CTE (`WITH` clause) ব্যবহার করা হয়:

```python
from sqlalchemy import select, func

# 1. Define a CTE for average salary by department
high_salary_cte = (
    select(
        Employee.department_id,
        func.avg(Employee.salary).label("avg_sal")
    )
    .group_by(Employee.department_id)
    .cte("dept_avg_salaries")
)

# 2. Use CTE in main query join
stmt = (
    select(Employee)
    .join(high_salary_cte, Employee.department_id == high_salary_cte.c.department_id)
    .where(Employee.salary > high_salary_cte.c.avg_sal)
)
```

---

## 3. SQL Window Functions

SQL Window Functions (যেমন `ROW_NUMBER()`, `RANK()`, `OVER()`) খুব সহজে লেখা যায়:

```python
from sqlalchemy import select, func

# Rank employees by salary within their department
rank_col = func.rank().over(
    order_by=Employee.salary.desc(),
    partition_by=Employee.department_id
).label("salary_rank")

stmt = select(Employee.first_name, Employee.salary, rank_col)
```

---

## 4. Safe Raw SQL with `text()`

মাঝে মাঝে বিশেষ জটিল বা কাস্টম SQL স্টেটমেন্ট ডাইরেক্ট এক্সিকিউট করতে হতে পারে। সে ক্ষেত্রে `text()` ও Parameter Binding নিরাপদ:

```python
from sqlalchemy import text, select

with Session(engine) as session:
    # Parameterized safe raw SQL execution
    stmt = text("SELECT id, username FROM users WHERE is_active = :status AND age > :min_age")
    result = session.execute(stmt, {"status": True, "min_age": 18})
    
    for row in result:
        print(row.id, row.username)
```
