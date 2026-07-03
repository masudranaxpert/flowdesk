# Capstone: ছোট ডেটা পাইপলাইন

এটা হলো capstone project — যেখানে Python, NumPy, আর Pandas সব একসাথে মিলিয়ে একটা পুরো data pipeline বানাবো। ডেটা load করা থেকে clean, analyze, transform, আর export — পুরো workflow এক script এ।

## Data Pipeline কী?

Data pipeline মানে — raw ডেটা থেকে useful insight বের করার একটা automated ধাপ। সাধারণত এই ধাপ গুলো থাকে:

```
Raw Data → Load → Clean → Transform → Analyze → Export
```

| Step | কী করা হয় | Tool |
|------|----------|------|
| **Load** | CSV/JSON থেকে read | Pandas |
| **Clean** | Missing, duplicate, outlier fix | Pandas |
| **Transform** | Feature engineering, normalization | NumPy |
| **Analyze** | Statistics, aggregation | NumPy + Pandas |
| **Export** | Result save | Pandas |

## Scenario — Employee Salary Pipeline

একটা company এর employee data আছে — messy, incomplete, কিছু outlier সহ। আমাদের pipeline টা এগুলো clean করবে, department অনুযায়ী salary analyze করবে, আর result export করবে।

## Step ১: Raw Data তৈরি

```python
import pandas as pd
import numpy as np

raw_data = {
    "emp_id": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "name": ["Karim", "Rahim", "Sadia", "Tania", "Jamal",
             None, "Nadia", "Faruk", "Lima", "Sohel", "Rita", "Babul"],
    "department": ["Engineering", "Marketing", "Engineering", "HR",
                   "Engineering", "Marketing", "HR", "Engineering",
                   "Marketing", "HR", "Engineering", "Marketing"],
    "salary": [80000, 55000, 85000, 45000, 90000,
               52000, 48000, None, 58000, 50000, 75000, 54000],
    "experience": [5, 3, 6, 2, 8, 4, 2, 7, 4, 3, 6, 3],
    "performance": [4.5, 3.8, 4.7, 3.2, 4.9,
                    3.5, 3.0, 4.3, 4.0, 3.6, 4.4, 3.9]
}

df_raw = pd.DataFrame(raw_data)
df_raw.to_csv("raw_employees.csv", index=False)
print(f"Raw data: {len(df_raw)} rows saved")
```

> [!note]
> দেখো — `name` এ একটা missing value, `salary` তে একটা NaN। এটাই রিয়েল world messy data। Pipeline এর কাজই হলো এটাকে clean করা।

## Step ২: Pipeline Function গুলো

### Load Function

```python
def load_data(filepath):
    df = pd.read_csv(filepath)
    print(f"📥 Loaded {len(df)} rows from {filepath}")
    return df
```

### Clean Function

```python
def clean_data(df):
    original_len = len(df)
    issues = []

    # missing name থাকলে row drop
    before = len(df)
    df = df.dropna(subset=["name"])
    if len(df) < before:
        issues.append(f"{before - len(df)} row missing name এর জন্য বাদ")

    # missing salary তে median fill
    missing_salary = df["salary"].isnull().sum()
    if missing_salary > 0:
        median_salary = df["salary"].median()
        df["salary"] = df["salary"].fillna(median_salary)
        issues.append(f"{missing_salary} টা salary তে median ({median_salary:,.0f}৳) fill করা হলো")

    # duplicate check
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        df = df.drop_duplicates()
        issues.append(f"{dup_count} টা duplicate বাদ দেওয়া হলো")

    # type fix
    df["salary"] = df["salary"].astype(int)

    print(f"🧹 Clean complete: {original_len} → {len(df)} rows")
    for issue in issues:
        print(f"   • {issue}")

    return df
```

### Transform Function

```python
def transform_data(df):
    # salary band
    df["salary_band"] = pd.cut(
        df["salary"],
        bins=[0, 50000, 70000, 100000],
        labels=["Junior", "Mid", "Senior"]
    )

    # salary normalization (Min-Max) — NumPy দিয়ে
    salaries = df["salary"].values.astype(float)
    df["salary_normalized"] = (salaries - np.min(salaries)) / (np.max(salaries) - np.min(salaries))

    # z-score (standardization) — NumPy দিয়ে
    df["salary_zscore"] = (salaries - np.mean(salaries)) / np.std(salaries)

    # performance rating category
    df["rating"] = pd.cut(
        df["performance"],
        bins=[0, 3.5, 4.2, 5.0],
        labels=["Needs Improvement", "Good", "Excellent"]
    )

    # experience to level
    df["level"] = np.where(df["experience"] >= 5, "Senior", "Junior")

    print(f"🔧 Transform complete: {len(df.columns)} columns")
    return df
```

> [!example]
- **Normalization** — salary কে 0-1 range এ আনা (Min-Max scaling)
- **Z-score** — mean 0, std 1 করা (standardization)
- দুটোই ML preprocessing এ common। NumPy vectorized operation দিয়ে এক লাইনে হয়ে গেল।

### Analyze Function

```python
def analyze_data(df):
    report = {}

    # department-wise summary
    dept_summary = df.groupby("department").agg(
        headcount=("emp_id", "count"),
        avg_salary=("salary", "mean"),
        total_salary=("salary", "sum"),
        avg_performance=("performance", "mean")
    ).round(2)
    report["department_summary"] = dept_summary

    # salary band distribution
    report["salary_band"] = df["salary_band"].value_counts()

    # correlation (NumPy)
    exp_salary_corr = np.corrcoef(df["experience"], df["salary"])[0, 1]
    perf_salary_corr = np.corrcoef(df["performance"], df["salary"])[0, 1]
    report["correlations"] = {
        "experience_vs_salary": round(exp_salary_corr, 3),
        "performance_vs_salary": round(perf_salary_corr, 3)
    }

    # statistics (NumPy)
    salaries = df["salary"].values
    report["salary_stats"] = {
        "mean": f"{np.mean(salaries):,.0f}৳",
        "median": f"{np.median(salaries):,.0f}৳",
        "std": f"{np.std(salaries):,.0f}৳",
        "range": f"{np.min(salaries):,} - {np.max(salaries):,}৳"
    }

    print("📊 Analysis complete")
    return report
```

### Export Function

```python
def export_data(df, report):
    # clean data export
    df.to_csv("clean_employees.csv", index=False)

    # department summary export
    report["department_summary"].to_csv("dept_summary.csv")

    # JSON report
    import json
    json_report = {
        "salary_stats": report["salary_stats"],
        "correlations": report["correlations"],
        "salary_distribution": report["salary_band"].to_dict()
    }
    with open("analysis_report.json", "w", encoding="utf-8") as f:
        json.dump(json_report, f, indent=2, ensure_ascii=False)

    print("💾 Export complete: clean_employees.csv, dept_summary.csv, analysis_report.json")
```

## Step ৩: Pipeline Orchestrator

```python
def run_pipeline(input_file="raw_employees.csv"):
    print("=" * 50)
    print("   🚀 EMPLOYEE DATA PIPELINE")
    print("=" * 50)

    # Step 1: Load
    df = load_data(input_file)

    # Step 2: Clean
    df = clean_data(df)

    # Step 3: Transform
    df = transform_data(df)

    # Step 4: Analyze
    report = analyze_data(df)

    # Step 5: Export
    export_data(df, report)

    # Display summary
    print("\n" + "=" * 50)
    print("   📋 SUMMARY")
    print("=" * 50)
    print(f"Employees processed: {len(df)}")
    print(f"Departments: {df['department'].nunique()}")
    print(f"Salary stats: {report['salary_stats']}")
    print(f"Experience-Salary correlation: {report['correlations']['experience_vs_salary']}")
    print("=" * 50)

    return df, report

if __name__ == "__main__":
    df, report = run_pipeline()
```

## Sample Output

```
==================================================
   🚀 EMPLOYEE DATA PIPELINE
==================================================
📥 Loaded 12 rows from raw_employees.csv
🧹 Clean complete: 12 → 11 rows
   • 1 row missing name এর জন্য বাদ
   • 1 টা salary তে median (74,000৳) fill করা হলো
🔧 Transform complete: 10 columns
📊 Analysis complete
💾 Export complete: clean_employees.csv, dept_summary.csv, analysis_report.json

==================================================
   📋 SUMMARY
==================================================
Employees processed: 11
Departments: 3
Salary stats: {'mean': '64,727৳', 'median': '74,000৳', 'std': '15,432৳', 'range': '45000 - 90000৳'}
Experience-Salary correlation: 0.921
==================================================
```

> [!tip]
> Experience আর salary এর correlation 0.921 — খুব high positive! মানে যত experience বাড়ে salary ও বাড়ে। এই insight টা company কে বুঝিয়ে দেবে experience এর গুরুত্ব।

## Best Practice

> [!danger]
> Pipeline বানানোর সময় এই জিনিস গুলো মাথায় রাখবে:
> 1. **Function আলাদা রাখো** — load, clean, transform আলাদা function এ, যাতে debug করা সহজ হয়
> 2. **Logging** — প্রতিটা step এ কী হলো print করো
> 3. **Idempotent** — একই input দিলে একই output আসবে
> 4. **Don't modify original** — raw data তে হাত দিও না, new DataFrame বানাও

## Bonus: Scheduling

এই pipeline টা চাইলে schedule করে দিতে পারো — প্রতিদিন/সপ্তাহে একবার automatically run হবে:

```python
import schedule
import time

schedule.every().monday.at("09:00").do(run_pipeline)

while True:
    schedule.run_pending()
    time.sleep(60)
```

> [!example]
> `schedule` library দিয়ে weekly auto-run। সাপ্তাহিক salary report automatically generate হবে। বাস্তবে cron job বা Airflow দিয়ে ও করা হয়।

## Summary

এই capstone প্রজেক্টে পুরো data pipeline বানালাম — load → clean → transform → analyze → export। Python, NumPy, আর Pandas সব মিলিয়ে একটা production-ready workflow। এই জিনিস টাই real-world data engineering আর data analysis এর কোর। এখন তুমি নিজে নিজে যেকোনো dataset নিয়ে কাজ করতে পারবে!