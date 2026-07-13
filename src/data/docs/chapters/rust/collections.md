# Collections — Vec, HashMap

Rust এর standard library তে অনেক collection আছে। সবচেয়ে বেশি ব্যবহৃত দুটো — `Vec` (Python list) আর `HashMap` (Python dict)। চলো গভীরে যাই।

## Vec — Growable Array

`Vec<T>` হলো Rust এর growable array — Python এর `list` বা C++ এর `std::vector` এর মতো। Heap-allocated, dynamically resized।

### তৈরি করা

```rust
// Empty Vec
let v1: Vec<i32> = Vec::new();

// With initial values
let v2 = vec![1, 2, 3, 4, 5];

// With capacity (performance optimization)
let v3: Vec<i32> = Vec::with_capacity(100);

// From iterator
let v4: Vec<i32> = (1..=5).collect();
```

> [!tip]
> `Vec::with_capacity(n)` ব্যবহার করলে Rust একবারে `n` এর জায়গা allocate করে। যদি জানো কতটা element ঢুকবে, এটা reallocation বাঁচায় — performance বাড়ে।

### Element যোগ করা

```rust
let mut v = Vec::new();
v.push(1);       // শেষে যোগ
v.push(2);
v.push(3);

v.insert(0, 0);  // index 0 তে insert → [0, 1, 2, 3]
v.extend([4, 5]); // একাধিক যোগ → [0, 1, 2, 3, 4, 5]
```

### Element Access

```rust
let v = vec![10, 20, 30, 40, 50];

// Index — panic হতে পারে
let third = v[2];            // 30

// get — safe (Option return করে)
let fourth = v.get(3);       // Some(40)
let out_of_bounds = v.get(100); // None

// নেতিবাচক index নেই! v[-1] error
// শেষ element:
let last = v.last().unwrap(); // 50
```

> [!danger]
> Python এর মতো `v[-1]` কাজ করবে না — Rust এ নেতিবাচক index নেই। `v.last()` বা `v[v.len()-1]` ব্যবহার করতে হবে। আর `v[100]` যদি out of bounds হয়, Rust panic করবে (crash)। `v.get(100)` ব্যবহার করলে `None` পাবে — safe।

### Remove আর Pop

```rust
let mut v = vec![1, 2, 3, 4, 5];

let last = v.pop();          // Some(5), v = [1, 2, 3, 4]
v.remove(0);                 // v = [2, 3, 4] (O(n) — shift করে)
v.truncate(2);               // v = [2, 3]
v.clear();                   // v = []
```

### Iteration

```rust
let v = vec![1, 2, 3, 4, 5];

// Immutable borrow
for val in &v {
    println!("{}", val);
}

// Mutable borrow
let mut v2 = vec![1, 2, 3];
for val in &mut v2 {
    *val *= 2;  // dereference করে value change
}
// v2 = [2, 4, 6]

// Ownership নিয়ে নেওয়া
for val in v {
    println!("{}", val);
}
// v এখন invalid — ownership move হয়েছে
```

> [!note]
> `for val in &v` — borrow করে (v valid থাকে)। `for val in v` — ownership নেয় (v invalid হয়)। Python এ এই পার্থক্য নেই — Rust এ সচেতন হতে হবে।

### Iteration with Index

```rust
for (i, val) in v.iter().enumerate() {
    println!("Index {}: {}", i, val);
}
```

### Common Operations

```rust
let v = vec![1, 2, 3, 4, 5];

// Information
v.len();           // 5
v.is_empty();      // false
v.contains(&3);    // true

// Slicing
let slice: &[i32] = &v[1..3];  // [2, 3]

// Split
let (left, right) = v.split_at(2);  // [1, 2], [3, 4, 5]

// Sort
let mut nums = vec![3, 1, 4, 1, 5, 9, 2, 6];
nums.sort();                    // [1, 1, 2, 3, 4, 5, 6, 9]
nums.sort_by(|a, b| b.cmp(a)); // descending

// Dedup
let mut dupes = vec![1, 1, 2, 2, 3];
dupes.dedup();  // [1, 2, 3]
```

### Vec থেকে String তৈরি

```rust
let chars = vec!['h', 'e', 'l', 'l', 'o'];
let s: String = chars.into_iter().collect();
```

## HashMap

`HashMap<K, V>` হলো Rust এর key-value store — Python এর `dict` এর মতো।

### তৈরি আর Insert

```rust
use std::collections::HashMap;

let mut scores: HashMap<String, i32> = HashMap::new();

scores.insert(String::from("Karim"), 95);
scores.insert(String::from("Rahim"), 87);
```

### Access

```rust
// get — Option return করে
let karim_score = scores.get("Karim");  // Some(&95)
let unknown = scores.get("Unknown");     // None

// Iteration
for (name, score) in &scores {
    println!("{}: {}", name, score);
}
```

### Insert আর Update

```rust
// Overwrite — আগের value হারিয়ে যায়
scores.insert(String::from("Karim"), 100);

// entry — শুধু তখনই insert যদি key না থাকে
scores.entry(String::from("Rahim")).or_insert(50);  // আগে থেকে আছে, বদলবে না
scores.entry(String::from("Sadia")).or_insert(78);  // নতুন, insert হবে
```

> [!tip]
> `entry().or_insert()` হলো Python এর `dict.setdefault()` এর মতো। এটা "insert if absent" pattern এর জন্য perfect — দুবার lookup করা লাগে না।

### Update Existing Value

```rust
let text = "hello world wonderful world";
let mut word_count: HashMap<&str, i32> = HashMap::new();

for word in text.split_whitespace() {
    let count = word_count.entry(word).or_insert(0);
    *count += 1;
}

// {"hello": 1, "world": 2, "wonderful": 1}
```

> [!example]
> এটা classic word-count example। Python এ `Counter` বা `defaultdict` দিয়ে করা যায়। Rust এ `entry().or_insert()` দিয়ে — এক লাইনেই হয়।

### Remove

```rust
scores.remove("Rahim");
```

### Common Operations

```rust
let mut map = HashMap::new();
map.insert("a", 1);
map.insert("b", 2);

map.len();              // 2
map.is_empty();         // false
map.contains_key("a");  // true
map.keys();             // iterator over keys
map.values();           // iterator over values
```

## BTreeMap — Sorted HashMap

`HashMap` unordered — iteration order random। যদি sorted order দরকার হয়, `BTreeMap` ব্যবহার করো:

```rust
use std::collections::BTreeMap;

let mut map = BTreeMap::new();
map.insert("banana", 2);
map.insert("apple", 5);
map.insert("cherry", 8);

for (key, value) in &map {
    println!("{}: {}", key, value);
}
// apple: 5
// banana: 2
// cherry: 8  — sorted order!
```

> [!note]
> `BTreeMap` internally B-tree ব্যবহার করে। Lookup একটু ধীর `HashMap` থেকে, কিন্তু sorted iteration পাওয়া যায়। যখন order দরকার, তখন এটা ব্যবহার করো।

## HashSet

`HashSet<T>` হলো unique value এর collection — Python এর `set` এর মতো:

```rust
use std::collections::HashSet;

let mut fruits: HashSet<&str> = HashSet::new();
fruits.insert("apple");
fruits.insert("banana");
fruits.insert("apple");  // duplicate — ঢুকবে না

println!("{}", fruits.len());  // 2

// Set operations
let set1: HashSet<i32> = [1, 2, 3, 4].into_iter().collect();
let set2: HashSet<i32> = [3, 4, 5, 6].into_iter().collect();

let intersection: Vec<&i32> = set1.intersection(&set2).collect(); // [3, 4]
let union: Vec<&i32> = set1.union(&set2).collect();               // [1, 2, 3, 4, 5, 6]
let diff: Vec<&i32> = set1.difference(&set2).collect();           // [1, 2]
```

## Collection তুলনা

| Rust | Python | C++ | কী জিনিস |
|------|--------|-----|----------|
| `Vec<T>` | `list` | `std::vector` | Growable array |
| `HashMap<K,V>` | `dict` | `std::unordered_map` | Hash table |
| `BTreeMap<K,V>` | — | `std::map` | Sorted map |
| `HashSet<T>` | `set` | `std::unordered_set` | Unique values |
| `BTreeSet<T>` | — | `std::set` | Sorted unique |
| `[T; N]` | — | `std::array` | Fixed array |
| `&[T]` | slice | — | Borrowed slice |
| `VecDeque<T>` | `collections.deque` | `std::deque` | Double-ended queue |
| `LinkedList<T>` | — | `std::list` | Linked list |

> [!tip]
> বেশিরভাগ ক্ষেত্রে `Vec` আর `HashMap` ই যথেষ্ট। Rust এ `LinkedList` খুব কম ব্যবহৃত হয় — cache-unfriendly হওয়ায়। যেখানে Python এ list সব কাজে চলে, Rust এ ওই কাজগুলো `Vec` দিয়েই হয়।

## বাস্তব উদাহরণ — Student Database

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct Student {
    name: String,
    grades: Vec<f64>,
}

impl Student {
    fn new(name: &str) -> Self {
        Student {
            name: name.to_string(),
            grades: Vec::new(),
        }
    }

    fn add_grade(&mut self, grade: f64) {
        self.grades.push(grade);
    }

    fn average(&self) -> f64 {
        if self.grades.is_empty() {
            0.0
        } else {
            let sum: f64 = self.grades.iter().sum();
            sum / self.grades.len() as f64
        }
    }
}

fn main() {
    let mut db: HashMap<String, Student> = HashMap::new();

    let mut karim = Student::new("Karim");
    karim.add_grade(85.0);
    karim.add_grade(90.0);
    karim.add_grade(78.0);
    db.insert("karim".to_string(), karim);

    let mut rahim = Student::new("Rahim");
    rahim.add_grade(92.0);
    rahim.add_grade(88.0);
    db.insert("rahim".to_string(), rahim);

    for (id, student) in &db {
        println!("{}: avg = {:.2}", student.name, student.average());
    }
}
```

> [!example]
> এখানে `Vec` (grades এর জন্য) আর `HashMap` (student database এর জন্য) দুটোই ব্যবহার হয়েছে। Python এর list+dict combination এর মতোই — কিন্তু type-safe আর ownership দিয়ে protected।

## Summary

Collections হলো Rust programming এর daily driver। `Vec` list এর জন্য, `HashMap` key-value এর জন্য, `HashSet` unique value এর জন্য। Python এর সাথে API প্রায় একই — শুধু ownership আর type সচেতন হতে হবে। পরের chapter এ Strings নিয়ে গভীরে যাবো।