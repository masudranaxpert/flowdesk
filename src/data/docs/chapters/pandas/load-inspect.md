# ডেটা লোড আর দেখা

বাস্তবে data analysis করতে গেলে প্রথম কাজই হলো ডেটা লোড করা। CSV, Excel, JSON — যেকোনো format থেকে Pandas দিয়ে ডেটা নিয়ে আসা যায়। এরপর দেখা লাগে ডেটা কেমন।

## CSV লোড করা

CSV (Comma-Separated Values) হলো সবচেয়ে common format। `pd.read_csv()` দিয়ে লোড করা হয়:

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df.head())
```

```
   id    name  age    city  cgpa
0   1   Karim   22   Dhaka  3.75
1   2   Rahim   24   Chattogram  3.50
2   3   Sadia   21   Sylhet  3.90
3   4   Tania   23   Dhaka  3.65
4   5   Jamal   20   Khulna  3.20
```

> [!tip]
> `pd.read_csv()` এ অনেক option আছে। যেমন `sep=";"` দিলে semicolon separated ফাইল পড়বে, `encoding="utf-8"` দিলে Bengali text ঠিক পড়বে।

## JSON লোড করা

API থেকে ডেটা আসলে সাধারণত JSON format এ থাকে:

```python
df = pd.read_json("data.json")
print(df.head())
```

URL থেকে ও সরাসরি পড়া যায়:

```python
url = "https://api.example.com/data.json"
df = pd.read_json(url)
```

## অন্যান্য Format

```python
# Excel
df = pd.read_excel("report.xlsx", sheet_name="Sheet1")

# TSV (tab separated)
df = pd.read_csv("data.tsv", sep="\t")

# SQL database
# from sqlalchemy import create_engine
# engine = create_engine("sqlite:///mydb.db")
# df = pd.read_sql("SELECT * FROM users", engine)
```

> [!note]
> Excel পড়তে হলে `openpyxl` package লাগবে: `pip install openpyxl`। SQL এর জন্য `sqlalchemy` লাগবে।

## head() আর tail() — উপরে/নিচে দেখা

বিশাল dataset পুরো print করলে terminal ভরে যাবে। তাই শুধু উপরের বা নিচের কয়েকটা row দেখি:

```python
df = pd.read_csv("students.csv")

# প্রথম ৫ row
print(df.head())

# নির্দিষ্ট সংখ্যক row
print(df.head(3))

# শেষের ৫ row
print(df.tail())

# শেষের ২ row
print(df.tail(2))
```

> [!tip]
> ডেটা লোড করার সাথে সাথে `df.head()` দিয়ে একবার দেখে নাও। এতে বুঝবে column গুলো কী কী, ডেটা ঠিকমতো এসেছে কিনা।

## info() — Structure দেখা

`df.info()` দিয়ে column, type, missing value — সব এক নজরে দেখা যায়:

```python
print(df.info())
```

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 100 entries, 0 to 99
Data columns (total 5 columns):
 #   Column  Non-Null Count  Dtype
---  ------  --------------  -----
 0   id      100 non-null    int64
 1   name    100 non-null    object
 2   age     98 non-null     float64
 3   city    100 non-null    object
 4   cgpa    95 non-null     float64
dtypes: float64(2), int64(1), object(2)
memory usage: 4.0+ KB
```

> [!example]
> দেখো — `age` এ ৯৮টা non-null আছে, মানে ২টা missing! `cgpa` তে ৫টা missing। এভাবে `info()` দিয়ে missing value এর ধারণা পাওয়া যায়। আর `object` dtype মানে string/text।

## describe() — Statistics Summary

`df.describe()` দিয়ে numerical column গুলোর statistics দেখা যায়:

```python
print(df.describe())
```

```
              id        age       cgpa
count  100.00000  98.000000  95.000000
mean    50.50000  22.142857   3.452105
std     29.01149   2.105389   0.452190
min      1.00000  18.000000   2.100000
25%     25.75000  20.000000   3.150000
50%     50.50000  22.000000   3.500000
75%     75.25000  24.000000   3.800000
max    100.00000  28.000000   4.000000
```

> [!note]
> `describe()` শুধু numeric column দেখায় default ভাবে। সব column দেখতে চাইলে `df.describe(include='all')` দাও। এখানে count, mean, std, min, max, quartiles — সব একসাথে!

## Column Select করা

```python
# একটা column (Series return করে)
print(df["name"])

# একাধিক column (DataFrame return করে)
print(df[["name", "age", "cgpa"]])
```

### Column এর Unique Value

```python
print(df["city"].unique())         # সব unique city
print(df["city"].nunique())        # কয়টা unique
print(df["city"].value_counts())   # প্রতিটা কয়বার আছে
```

```
['Dhaka' 'Chattogram' 'Sylhet' 'Khulna' 'Rajshahi']

5

city
Dhaka         35
Chattogram    20
Sylhet        18
Khulna        15
Rajshahi      12
```

> [!tip]
> `value_counts()` হলো সবচেয়ে useful function একটা। যেকোনো categorical column এর distribution দেখতে এটাই ব্যবহার করো।

## কয়েকটা দরকারি Method

```python
# row আর column সংখ্যা
print(df.shape)      # (100, 5)

# শুধু column name গুলো
print(df.columns.tolist())   # ['id', 'name', 'age', 'city', 'cgpa']

# data type গুলো
print(df.dtypes)

# প্রতিটা column এ missing value সংখ্যা
print(df.isnull().sum())
```

```
id       0
name     0
age      2
city     0
cgpa     5
dtype: int64
```

> [!warn]
> Missing value check করা খুব জরুরি। `df.isnull().sum()` দিয়ে প্রতিটা column এ কতটা NaN আছে দেখো। পরে clean-filter chapter এ এগুলো handle করা শিখবো।

## Summary

এই chapter এ দেখলাম — `read_csv`/`read_json` দিয়ে ডেটা লোড, `head`/`tail`/`info`/`describe` দিয়ে inspect, আর `value_counts`/`unique` দিয়ে column explore করা। এই গুলো হলো EDA (Exploratory Data Analysis) এর প্রথম ধাপ। পরের chapter এ clean আর filter করা শিখবো।