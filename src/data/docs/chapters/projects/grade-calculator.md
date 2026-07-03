# প্রজেক্ট ৩: Grade Calculator

এই প্রজেক্টে NumPy দিয়ে statistics (mean, std) আর Pandas দিয়ে student records এর table manage করবো। প্রতিটা student এর mark থেকে letter grade assign করবো আর class statistics বের করবো।

## প্রজেক্ট Overview

| Feature | কী করবে |
|---------|---------|
| Student Records | নাম, বিষয়, নম্বর store |
| Grade Assignment | নম্বর থেকে letter grade (A+, A, B...) |
| Statistics | Class average, std, highest, lowest |
| Ranking | Top performer গুলো দেখা |
| Export | Result CSV তে save |

## Sample Data তৈরি

```python
import pandas as pd
import numpy as np

np.random.seed(10)

students = [f"Student_{i:02d}" for i in range(1, 21)]
subjects = ["Math", "Physics", "Chemistry", "English", "Programming"]

# ২০ জন student এর ৫ বিষয়ে mark (30-100 এর মধ্যে)
data = np.random.randint(30, 101, size=(20, 5))

df = pd.DataFrame(data, columns=subjects)
df.insert(0, "name", students)

print(df.head())
```

```
        name  Math  Physics  Chemistry  English  Programming
0  Student_01    49       91         59       96           71
1  Student_02    59       76         93       51           82
2  Student_03    56       61         88       82           68
3  Student_04    97       59         70       87           41
4  Student_05    59       95         75       82           83
```

## Grade Calculation Function

```python
def get_letter_grade(mark):
    if mark >= 90:
        return "A+"
    elif mark >= 80:
        return "A"
    elif mark >= 70:
        return "B+"
    elif mark >= 60:
        return "B"
    elif mark >= 50:
        return "C"
    elif mark >= 40:
        return "D"
    else:
        return "F"
```

> [!tip]
> Grade boundary গুলো তুমি চাইলে বদলাতে পারো। এটা standard Bangladeshi grading system এর কাছাকাছি।

## প্রতিটা Subject এর Grade বের করা

```python
# প্রতিটা subject এ grade column যোগ
for subject in subjects:
    df[f"{subject}_grade"] = df[subject].apply(get_letter_grade)

# Average আর Overall Grade
df["average"] = df[subjects].mean(axis=1).round(2)
df["overall_grade"] = df["average"].apply(get_letter_grade)

print(df[["name", "average", "overall_grade"]].head())
```

```
        name  average overall_grade
0  Student_01    73.20             B+
1  Student_02    72.20             B+
2  Student_03    71.00             B+
3  Student_04    70.80             B+
4  Student_05    78.80             B+
```

## NumPy দিয়ে Class Statistics

```python
all_marks = df[subjects].values   # NumPy array

print(f"Class Average:     {np.mean(all_marks):.2f}")
print(f"Standard Dev:      {np.std(all_marks):.2f}")
print(f"Highest Mark:      {np.max(all_marks)}")
print(f"Lowest Mark:       {np.min(all_marks)}")
print(f"Median:            {np.median(all_marks):.2f}")
print(f"Range:             {np.max(all_marks) - np.min(all_marks)}")
```

```
Class Average:     65.57
Standard Dev:      18.42
Highest Mark:      100
Lowest Mark:       30
Median:            67.00
Range:             70
```

> [!example]
> Standard deviation ১৮.৪২ — মানে marks বেশ ছড়িয়ে আছে। কেউ ১০০ পেয়েছে, কেউ ৩০। এই spread বোঝাতেই std দরকার।

## Subject-wise Analysis

```python
subject_stats = pd.DataFrame({
    "mean": df[subjects].mean(),
    "std": df[subjects].std(),
    "max": df[subjects].max(),
    "min": df[subjects].min(),
    "pass_rate": (df[subjects] >= 40).sum() / len(df) * 100
}).round(2)

print(subject_stats)
```

```
             mean    std  max  min  pass_rate
Math        66.10  20.46   97   32       85.0
Physics     64.25  18.89   95   35       80.0
Chemistry   67.30  17.58  100   32       85.0
English     62.00  19.76   96   30       80.0
Programming 68.20  16.35   98   39       95.0
```

> [!note]
- Programming এ pass rate সবচেয়ে বেশি (৯৫%) — মানে student গুলো ভালো করেছে।
- English এ average সবচেয়ে কম — হয়তো এখানে improvement দরকার।

## Grade Distribution

```python
grade_counts = df["overall_grade"].value_counts()
print("\nOverall Grade Distribution:")
print(grade_counts)
```

```
Overall Grade Distribution:
B+    6
B     5
C     3
A     3
A+    1
D     1
F     1
```

## Top Performers Ranking

```python
ranking = df.sort_values("average", ascending=False).reset_index(drop=True)
ranking["rank"] = ranking.index + 1

print("\n--- Class Ranking ---")
print(ranking[["rank", "name", "average", "overall_grade"]].head(5).to_string(index=False))
```

```
--- Class Ranking ---
 rank        name  average overall_grade
    1  Student_08    88.40             A
    2  Student_11    86.60             A
    3  Student_15    84.80             A
    4  Student_12    79.60             B+
    5  Student_05    78.80             B+
```

## Scholarship Eligibility

```python
# A+ বা A পাওয়া student গুলো scholarship eligible
scholarship = df[df["overall_grade"].isin(["A+", "A"])][["name", "average", "overall_grade"]]
scholarship = scholarship.sort_values("average", ascending=False)

print(f"\n🎓 Scholarship Eligible ({len(scholarship)} জন):")
print(scholarship.to_string(index=False))
```

## At-Risk Students

```python
# যাদের কোনো subject এ F
failed = df[df[subjects].lt(40).any(axis=1)]

print(f"\n⚠️ At-Risk Students ({len(failed)} জন):")
for _, row in failed.iterrows():
    fail_subjects = [s for s in subjects if row[s] < 40]
    print(f"  {row['name']}: {', '.join(fail_subjects)}")
```

> [!warn]
> At-risk student গুলোকে early identify করা জরুরি। এই analysis দিয়ে teacher রা জানতে পারবে কাকে extra help দরকার।

## Export Result

```python
ranking.to_csv("result_2024.csv", index=False)
print("✅ Result 'result_2024.csv' তে save হয়েছে!")
```

## Full Pipeline — এক ফাইলে

```python
def generate_result(input_file="marks.csv"):
    df = pd.read_csv(input_file)
    subjects = [c for c in df.columns if c not in ["name", "id"]]

    for s in subjects:
        df[f"{s}_grade"] = df[s].apply(get_letter_grade)

    df["average"] = df[subjects].mean(axis=1).round(2)
    df["overall_grade"] = df["average"].apply(get_letter_grade)
    df = df.sort_values("average", ascending=False)
    df["rank"] = range(1, len(df) + 1)

    df.to_csv("result.csv", index=False)
    print(f"✅ {len(df)} student এর result তৈরি হয়েছে!")
    return df

if __name__ == "__main__":
    generate_result()
```

## Summary

এই প্রজেক্টে NumPy দিয়ে statistical analysis (mean, std, median) আর Pandas দিয়ে tabular data management করলাম। Grade calculation, ranking, scholarship filtering — সব একসাথে। পরের chapter এ capstone project করবো।