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

> [!note]
> **Vec ভেতরে কেমন?** `Vec<T>` নিজে মাত্র ৩টা word — heap buffer এর pointer, `capacity`, আর `len` (64-bit এ মোট ২৪ byte)। Element গুলো থাকে heap এর একটা contiguous buffer এ। `len` মানে এখন কয়টা element আছে, `capacity` মানে allocate করা জায়গায় সর্বোচ্চ কয়টা ঢুকতে পারে। `v[i]` আসলে `*(ptr + i * size_of::<T>())` — খালি pointer arithmetic, এ জন্যই access O(1)। আর `vec![1, 2, 3]` macro টা compile time এ প্রসারিত হয়ে element count আগেই জেনে নেয়, তাই exact capacity দিয়ে **একবারই** allocate করে — `Vec::new()` নিয়ে একাধিক `push` করলে যেমন বারবার resize হতো, তা হয় না।

### Element যোগ করা

```rust
let mut v = Vec::new();
v.push(1);       // Append to end of vector (amortized O(1))
v.push(2);
v.push(3);

v.insert(0, 0);  // Insert at index 0 (O(n) shifts elements right)
v.extend([4, 5]); // Extend vector with iterator elements
```

> [!note]
> **`push` এর ভেতরে কী হয়?** `push` magic না — তিনটা কাজ করে:
> ১. `len == capacity` কিনা check করে। ২. দরকার হলে নতুন বড় buffer allocate করে (capacity সাধারণত **২×**), পুরনো data সব নতুন জায়গায় bitwise copy (`memcpy`) করে, পুরনোটা free করে। ৩. নতুন value টা buffer এর শেষ slot এ লেখে, `len += 1`।
> তাই বেশিরভাগ push O(1), কিন্তু resize এর মুহূর্তে O(n) — মোট হিসাবে **amortized O(1)**।

আর `insert(0, 0)` ভিন্ন গল্প — index 0 তে বসাতে হলে তার পরের **সব** element এক ঘর করে ডানে সরতে হয়। ভেতরে `ptr::copy` দিয়ে বাকি পুরো অংশ memmove হয়, তাই insert যেকোনো position এই O(n) — আর শুরুতে insert মানে প্রায় পুরো n shift, সবচেয়ে খারাপ case। Loop এ বারবার `insert(0, ..)` করলে O(n²) — এমন কাজের জন্য `VecDeque` (দুই দিকে O(1) add) ব্যবহার করো।

`extend([4, 5])` ভেতরে iterator এর প্রতিটা item এর জন্য push চালায়, কিন্তু শুরুতেই মোট দরকারি জায়গা একবার reserve করে নেয় — তাই মাঝপথে একাধিক resize হয় না।

### Element Access

```rust
let v = vec![10, 20, 30, 40, 50];

// Direct indexing panics if index is out of bounds:
let third = v[2];            // 30

// Safe indexing returning Option<&T>:
let fourth = v.get(3);       // Some(40)
let out_of_bounds = v.get(100); // None

// Rust indices must be non-negative usize
// Access final element via last():
let last = v.last().unwrap(); // 50
```

> [!danger]
> Python এর মতো `v[-1]` কাজ করবে না — Rust এ নেতিবাচক index নেই। `v.last()` বা `v[v.len()-1]` ব্যবহার করতে হবে। আর `v[100]` যদি out of bounds হয়, Rust panic করবে (crash)। `v.get(100)` ব্যবহার করলে `None` পাবে — safe।

> [!note]
> **`v[i]` vs `v.get(i)` — ভেতরে একই কাজ?** প্রায়। দুটোই একটাই comparison চালায়: `index < len` — তাই দুটোই O(1), কোনো লুকানো loop নেই। পার্থক্য শুধু fail branch এ: index বাইরে গেলে `v[i]` ভেতরে `panic!("index out of bounds")` call করে, `v.get(i)` সেই একই check থেকে `None` ফেরত দেয়। মানে `get` এর কোনো extra runtime cost নেই — return টা `Option<&T>`, যেটা niche optimization এর জন্য `&T` এর সমান সাইজ (enums chapter এ দেখবো)।

### Remove আর Pop

```rust
let mut v = vec![1, 2, 3, 4, 5];

let last = v.pop();          // Some(5), v = [1, 2, 3, 4]
v.remove(0);                 // Remove at index 0 (shifts elements, O(n))
v.truncate(2);               // v = [2, 3]
v.clear();                   // v = []
```

> [!note]
> **এদের ভেতরে:** `pop()` হলো O(1) — `len -= 1` করে শেষ element টা পড়ে return করে। খেয়াল করো capacity **কমে না** — buffer এর জায়গা দখলেই থাকে, পরের push গুলো তখন resize ছাড়াই চলে। `remove(i)` হলো O(n) — i এর পরের সব element এক ঘর বাঁয়ে memmove হয় (`insert` এর আয়নার মতো), তারপর `len -= 1`। `truncate(n)` আর `clear()` বাদ পড়া element গুলোর `Drop` চালিয়ে `len` কমিয়ে দেয় — কিন্তু buffer free **হয় না**। জায়গা সত্যিই ছাড়াতে চাইলে `shrink_to_fit()` ডাকতে হয়।

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
    *val *= 2;  // Dereference mutable reference (*val) to mutate underlying value
}
// v2 = [2, 4, 6]

// Consume vector ownership (into_iter):
for val in v {
    println!("{}", val);
}
// Vector consumed; elements moved into loop scope
```

> [!note]
> **কেন `*val` লিখতে হলো?** `for val in &mut v2` loop-এ `val` সরাসরি সংখ্যা নয়, বরং memory-র একটি রেফারেন্স (`&mut i32`)। রেফারেন্সের পেছনের আসল সংখ্যাটিকে পরিবর্তন করতে ডিরিফারেন্স অপারেটর `*` ব্যবহার করা হয়।
> 
> **তিন রকম ইটারেশন মনে রাখবে:**
> 1. `for val in &v` — শুধু পড়ার জন্য ধারের রেফারেন্স (`&T`), ভেক্টর অক্ষত থাকে।
> 2. `for val in &mut v` — প্রতিটি উপাদান পরিবর্তন করতে (`&mut T`), ভেক্টর অক্ষত থাকে।
> 3. `for val in v` — মালিকানা move হয় (`T`), loop শেষে পুরো ভেক্টর memory থেকে মুছে যায়।

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

> [!note]
> **এই operations এর ভেতরে:**
> - `len()`/`is_empty()` — শুধু stored field পড়া, O(1)।
> - `contains(&3)` — ভেতরে একটা loop: প্রতিটা element এর সাথে `PartialEq` তুলনা, প্রথম match এ থেমে যায় — O(n)। Data sorted থাকলে `binary_search(&3)` O(log n)।
> - `&v[1..3]` — **zero cost slice**: নতুন data তৈরি হয় না, শুধু একটা নতুন fat pointer `(ptr + 1, len = 2)` বসে। `split_at(2)` ও তাই — দুটো slice, কোনো copy নেই।
> - `sort()` — stable sort, ভিত্তি merge sort (Rust 1.81+ এ "driftsort" নামের adaptive version)। সাধারণ case এ O(n log n); আগে থেকে sorted/প্রায় sorted input এ আরও দ্রুত। `sort_by` ও একই engine, শুধু comparator আলাদা।
> - `dedup()` — শুধু **adjacent** duplicate মুছে, O(n): একটা window এগিয়ে যায়, current element আগেরটার সমান হলে skip, না হলে সামনে compact করে লেখে। এ জন্যই `[1, 2, 1]` dedup করলে অপরিবর্তিত থাকে — এটা দূরের duplicate খোঁজেই না। Global dedup দরকার হলে আগে `sort()` করে তারপর `dedup()`, অথবা `HashSet` এ collect করো (তখন order হারাবে)।

### Vec থেকে String তৈরি

```rust
let chars = vec!['h', 'e', 'l', 'l', 'o'];
let s: String = chars.into_iter().collect();
```

> [!note]
> এই এক লাইনে দুটো নতুন মুখ। **`.into_iter()`** — ownership নিয়ে নেওয়া iterator (`chars` Vec-টা এরপর ব্যবহার করা যাবে না, কারণ `String` বানাতেই element গুলো খরচ হয়ে যাবে)। আর **`.collect()`** — iterator থেকে collection বানায়; target type annotation (`let s: String`) দেখে বুঝে নেয় কী বানাতে হবে। পুরো iterator-জগৎের গল্প iterators chapter-এ — আপাতত মনে রাখো: `into_iter()` = element-এর ownership-সহ iterator, `collect()` = জমা করে নতুন collection।

## HashMap

`HashMap<K, V>` হলো Rust এর key-value store — Python এর `dict` এর মতো।

### তৈরি আর Insert

```rust
use std::collections::HashMap;

let mut scores: HashMap<String, i32> = HashMap::new();

scores.insert(String::from("Karim"), 95);
scores.insert(String::from("Rahim"), 87);
```

> [!note]
> **`HashMap` ভেতরে কেমন?** std Rust এর `HashMap` আসলে **hashbrown** crate — SwissTable design এর উপর দাঁড়ানো:
> - দুটো আলাদা array রাখে — প্রতি slot এর জন্য ১ byte করে **control byte** (slot খালি/ভরা/মুছে-ফেলা কিনা + key এর hash এর উপরের ৭ bit), আর key-value pair গুলোর array।
> - probing এ একসাথে **১৬টা control byte** SIMD instruction দিয়ে compare করে — এক scan এ ১৬ slot এর খবর, এ জন্যই দ্রুত।
> - Table **~87.5% (৭/৮)** পর্যন্ত ভরা চলে; তার বেশি হলে সব key আবার hash করে দ্বিগুণ বড় table এ সরে (resize)। মানে গড়ে ৮ slot এর মধ্যে ১টা ফাঁকা — probe chain ছোট থাকে।
> - Default hasher **SipHash-1-3** — প্রতিটা map নিজস্ব random seed নেয়, যাতে attacker ইচ্ছাকৃত collision ঘটিয়ে lookup slow করতে (hash-flooding DoS) না পারে। এই security এর দাম হলে ধীর গতি — নিজের data বিশ্বস্ত হলে `ahash`/`FxHashMap` জাতীয় faster hasher বসানো যায়।
>
> **`insert(k, v)` এর ধাপগুলো:** key hash করে → control byte প্রোব করে slot খোঁজে → কোনো slot এ same key থাকলে `PartialEq` দিয়ে compare করে নিশ্চিত হয় → value লেখে (আগে থেকে থাকলে পুরনোটা drop করে), আর load factor পার হলে আগে resize। গড়ে এক probe, তাই **amortized O(1)**।

### Access

```rust
// Returns Option<&V> without panicking:
let karim_score = scores.get("Karim");  // Some(&95)
let unknown = scores.get("Unknown");     // None

// Iteration
for (name, score) in &scores {
    println!("{}: {}", name, score);
}
```

> [!note]
> `get("Karim")` ও insert এর পথেই চলে — hash → probe → key compare; মিললে `Some(&value)` (value এর **reference**, copy হয় না), না মিললে `None`। গড়ে O(1)। আর iteration ভেতরে control byte array হেঁটে ভরা slot গুলো দেয় — order টা hash এর উপর নির্ভর করে, তাই দেখতে "random", প্রতিবার run এ আলাদা।

### Insert আর Update

```rust
// Overwrites existing value for key:
scores.insert(String::from("Karim"), 100);

// Entry API: insert only if key does not exist
scores.entry(String::from("Rahim")).or_insert(50);  // Key exists; keeps existing value
scores.entry(String::from("Sadia")).or_insert(78);  // Key absent; inserts default 78
```

> [!tip]
> `entry().or_insert()` হলো Python এর `dict.setdefault()` এর মতো। এটা "insert if absent" pattern এর জন্য perfect — দুবার lookup করা লাগে না।

`entry().or_insert()` এর ভেতরে আসলে এই কোড চলে (simplified):

```rust
// Single hash calculation for both lookup and insertion
pub fn entry(&mut self, key: K) -> Entry<'_, K, V> {
    match self.get_inner(&key) {
        Some(_) => Entry::Occupied(/* slot এর location মনে রাখে */),
        None    => Entry::Vacant(/* insert করার জায়গা */),
    }
}
```

`Entry` হলো একটা enum — `Occupied` মানে key আছে, `Vacant` মানে নেই। `or_insert()` শুধু Vacant হলে insert করে। এক lookup, তাই দ্রুত — `contains_key` + `insert` লিখলে একই কাজে hash + probe **দুবার** লাগতো।

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

`remove` ও একই পথে চলে — hash → probe → key compare → মিললে ওই slot এর control byte "deleted" (tombstone) করে key-value টা drop করে। Tombstone রাখা জরুরি — নাহলে পরে ঢোকা কোনো key এর probe chain মাঝপথে ভেঙে যেত।

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

B-tree এর কাজের ধরন: প্রতিটা node এ অনেকগুলো key একসাথে থাকে (Rust এ সাধারণত ১১টা)। lookup মানে — একটা node পড়ো → node এর ভেতরে **binary search** করে ঠিক subtree বের করো → পরের node। tree এর height খুবই কম (লাখখানেক element এও ৪-৫ level), আর এক node এর সব key memory তে পাশাপাশি — cache friendly। Complexity সবসময় **O(log n)**, খারাপ case নেই (hash table এর মতো collision worry নেই)। আরেকটা পার্থক্য: `HashMap` এর key তে `Hash + Eq` লাগে, `BTreeMap` এ শুধু `Ord` — আর range query free: `map.range("b".."d")` দিয়ে একটা সীমার সব key পাওয়া যায়।

## HashSet

`HashSet<T>` হলো unique value এর collection — Python এর `set` এর মতো:

```rust
use std::collections::HashSet;

let mut fruits: HashSet<&str> = HashSet::new();
fruits.insert("apple");
fruits.insert("banana");
fruits.insert("apple");  // Duplicate element ignored by Set

println!("{}", fruits.len());  // 2

// Set operations
let set1: HashSet<i32> = [1, 2, 3, 4].into_iter().collect();
let set2: HashSet<i32> = [3, 4, 5, 6].into_iter().collect();

let intersection: Vec<&i32> = set1.intersection(&set2).collect(); // [3, 4]
let union: Vec<&i32> = set1.union(&set2).collect();               // [1, 2, 3, 4, 5, 6]
let diff: Vec<&i32> = set1.difference(&set2).collect();           // [1, 2]
```

> [!note]
> **HashSet ভেতরে কী?** মূলত `HashMap<T, ()>` — একই SwissTable, value হিসেবে ফাঁকা unit `()`। `insert("apple")` দ্বিতীয়বার ডাকলে ভেতরে hash → probe → key compare হয়ে already-present বুঝে কিছুই লেখে না — এ জন্যই duplicate ঢোকে না। `intersection`/`union`/`difference` ও একই hash + probe mechanism ব্যবহার করে: `intersection` দুটোর **ছোট** set টা iterate করে প্রতিটা element অন্য set এ `contains` করে দেখে — তাই O(min(n, m))। union এ duplicate একবারই আসে, কারণ ভেতরে insert হয় আর insert-time এই duplicate check।

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