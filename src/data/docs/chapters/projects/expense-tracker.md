# প্রজেক্ট ১: Expense Tracker

চলো যা শিখলাম তা দিয়ে একটা আসল প্রজেক্ট বানাই — **Expense Tracker**। এটা একটা CLI tool যেটা তোমার খরচ ট্র্যাক করবে, CSV file এ save করবে, আর category অনুযায়ী summary দেখাবে।

## প্রজেক্ট Overview

| Feature | কী করবে |
|---------|---------|
| Add Expense | নতুন খরচ যোগ করা |
| View All | সব খরচ দেখা |
| Summary | Category অনুযায়ী total |
| Monthly Report | মাস অনুযায়ী খরচ |
| Export | CSV file এ save |

## Library Import

```python
import pandas as pd
from datetime import datetime
import os

EXPENSE_FILE = "expenses.csv"
```

## Expense যোগ করার Function

```python
def add_expense():
    print("\n--- নতুন খরচ যোগ করুন ---")

    date = datetime.now().strftime("%Y-%m-%d")
    category = input("Category (Food/Transport/Bills/Shopping/Other): ").strip()
    description = input("বিবরণ: ").strip()
    amount = float(input("টাকার পরিমাণ: "))

    new_entry = {
        "date": date,
        "category": category,
        "description": description,
        "amount": amount
    }

    if os.path.exists(EXPENSE_FILE):
        df = pd.read_csv(EXPENSE_FILE)
        df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
    else:
        df = pd.DataFrame([new_entry])

    df.to_csv(EXPENSE_FILE, index=False)
    print(f"✅ {amount}৳ এর '{description}' যোগ হলো!")
```

> [!tip]
> এখানে CSV file exist করে কিনা চেক করা হয়েছে। যদি file না থাকে, নতুন বানানো হবে। আর থাকলে আগের ডেটার সাথে যোগ হবে।

## সব খরচ দেখা

```python
def view_all():
    if not os.path.exists(EXPENSE_FILE):
        print("❌ কোনো খরচের তথ্য নেই!")
        return

    df = pd.read_csv(EXPENSE_FILE)
    print("\n--- সব খরচ ---")
    print(df.to_string(index=False))
    print(f"\nমোট: {df['amount'].sum():.2f}৳")
```

## Category অনুযায়ী Summary

```python
def summary_by_category():
    if not os.path.exists(EXPENSE_FILE):
        print("❌ কোনো খরচের তথ্য নেই!")
        return

    df = pd.read_csv(EXPENSE_FILE)
    df["date"] = pd.to_datetime(df["date"])

    summary = df.groupby("category")["amount"].agg(["sum", "count", "mean"])
    summary = summary.sort_values("sum", ascending=False)

    print("\n--- Category অনুযায়ী Summary ---")
    print(summary.to_string())

    total = df["amount"].sum()
    print(f"\nমোট খরচ: {total:.2f}৳")
```

## Monthly Report

```python
def monthly_report():
    if not os.path.exists(EXPENSE_FILE):
        print("❌ কোনো খরচের তথ্য নেই!")
        return

    df = pd.read_csv(EXPENSE_FILE)
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M")

    monthly = df.groupby("month")["amount"].sum()

    print("\n--- মাসিক খরচ ---")
    print(monthly.to_string())
```

> [!example]
> এখানে `dt.to_period("M")` দিয়ে তারিখ থেকে month extract করা হয়েছে। এতে 2024-01-15 আর 2024-01-20 দুটোই "2024-01" এ যাবে। এভাবে monthly aggregation করা যায়।

## Search আর Filter

```python
def search_category(category_name):
    if not os.path.exists(EXPENSE_FILE):
        print("❌ কোনো খরচের তথ্য নেই!")
        return

    df = pd.read_csv(EXPENSE_FILE)
    result = df[df["category"].str.lower() == category_name.lower()]

    if len(result) == 0:
        print(f"'{category_name}' এ কোনো খরচ নেই।")
    else:
        print(result.to_string(index=False))
        print(f"\n{category_name} এ মোট: {result['amount'].sum():.2f}৳")
```

## Delete Last Entry

```python
def delete_last():
    if not os.path.exists(EXPENSE_FILE):
        print("❌ কোনো খরচের তথ্য নেই!")
        return

    df = pd.read_csv(EXPENSE_FILE)
    if len(df) == 0:
        print("ফাইল খালি!")
        return

    deleted = df.iloc[-1]
    df = df.iloc[:-1]
    df.to_csv(EXPENSE_FILE, index=False)
    print(f"🗑️ শেষ entry মুছে ফেলা হলো: {deleted['description']} - {deleted['amount']}৳")
```

## Main Menu — সব একসাথে

```python
def main():
    print("\n💰 Expense Tracker 💰")

    while True:
        print("\n" + "=" * 30)
        print("1. খরচ যোগ করুন")
        print("2. সব খরচ দেখুন")
        print("3. Category Summary")
        print("4. মাসিক Report")
        print("5. Category Search")
        print("6. শেষ entry মুছুন")
        print("7. Exit")
        print("=" * 30)

        choice = input("অপশন নির্বাচন করুন (1-7): ").strip()

        if choice == "1":
            add_expense()
        elif choice == "2":
            view_all()
        elif choice == "3":
            summary_by_category()
        elif choice == "4":
            monthly_report()
        elif choice == "5":
            cat = input("Category নাম: ")
            search_category(cat)
        elif choice == "6":
            delete_last()
        elif choice == "7":
            print("বিদায়! 👋")
            break
        else:
            print("❌ ভুল অপশন!")

if __name__ == "__main__":
    main()
```

## Sample Run আর Output

```
💰 Expense Tracker 💰

==============================
1. খরচ যোগ করুন
2. সব খরচ দেখুন
3. Category Summary
4. মাসিক Report
5. Category Search
6. শেষ entry মুছুন
7. Exit
==============================
অপশন নির্বাচন করুন (1-7): 3

--- Category অনুযায়ী Summary ---
            sum  count   mean
category
Food      3500      5  700.0
Transport 1800      3  600.0
Bills     5000      2 2500.0
Shopping  3000      2 1500.0

মোট খরচ: 13300.00৳
```

> [!note]
> দেখো — Food এ সবচেয়ে বেশি entry আছে (৫টা), কিন্তু Bills এ সবচেয়ে বেশি টাকা (৫০০০৳)। এভাবে expense pattern বোঝা যায়।

## Run করার উপায়

```bash
python expense_tracker.py
```

> [!warn]
> এই প্রজেক্ট টা চালাতে হলে `pandas` install থাকতে হবে: `pip install pandas`। আর `expenses.csv` file same folder এ তৈরি হবে।

## Bonus Ideas

তুমি চাইলে আরো feature যোগ করতে পারো:

- **Budget Alert** — মাসে নির্দিষ্ট amount পার হলে warning
- **Export to Excel** — `df.to_excel("report.xlsx")`
- **Visualization** — matplotlib দিয়ে chart
- **Recurring Expense** — fixed monthly bill auto entry

> [!example]
> চাইলে summary এ matplotlib যোগ করে pie chart দেখাতে পারো: `df.groupby('category')['amount'].sum().plot(kind='pie')`। তাহলে কোন category তে কত খরচ হয়েছে চোখে দেখা যাবে।

## Summary

এই প্রজেক্টে Pandas দিয়ে CSV read/write, groupby, filtering — সব একসাথে করলাম। এটা একটা পুরো কাজের application। একই pattern দিয়ে inventory manager, habit tracker, আরো অনেক কিছু বানানো যায়।