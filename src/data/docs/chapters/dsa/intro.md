# C++ Competitive Programming Setup & Complexity Analysis

Competitive Programming (CP) বা "Unlock the Algorithm" এর মতো প্রিলিমিনারি কনটেস্টে ভালো করার প্রধান শর্ত হলো—**লজিক দ্রুত চিন্তা করা এবং কোড ফাস্ট রান করা**। অনেকেই লজিক ঠিক লেখে, কিন্তু Time Limit Exceeded (TLE) বা Wrong Answer (WA) খেয়ে বসে ছোট ছোট ভুলের কারণে। 

এই চ্যাপ্টারে আমরা কনটেস্টের বেসিক পরিবেশ (Setup) এবং কেন আমাদের কোড স্লো বা ভুল হয়, তা একদম ভেতর থেকে বুঝব।

---

## 🟢 পর্ব ১: বেসিক কনসেপ্ট (The Core Theory)

### ১. Fast I/O: তোমার কোড কেন স্লো হয়?
C++ এ আমরা সাধারণত `cin` এবং `cout` ব্যবহার করি। কিন্তু তুমি কি জানো, বাই ডিফল্ট C++ এর `cin/cout` অনেক স্লো? কারণ এরা C এর `scanf/printf` এর সাথে "সিঙ্ক" (Synchronised) অবস্থায় থাকে, যেন তুমি চাইলে কোডের ভেতর `cin` এবং `scanf` একসাথে ব্যবহার করতে পারো। 

**সমাধান (Fast I/O Template):**
কোডের `main()` ফাংশনের শুরুতে এই দুটি লাইন লিখে দিলে `cin/cout` সুপারফাস্ট হয়ে যায়:
```cpp
ios_base::sync_with_stdio(false); // C এবং C++ এর I/O সিঙ্ক বন্ধ করে দেয়
cin.tie(NULL); // cin এবং cout এর ভেতরের অটোমেটিক ফ্লাশিং বন্ধ করে দেয়
```

### ২. `endl` এর মারাত্মক ফাঁদ!
আমরা নতুন লাইনের জন্য `endl` ব্যবহার করতে অভ্যস্ত। কিন্তু `endl` শুধুমাত্র নতুন লাইনই তৈরি করে না, এটি মেমোরি বাফারকে **Flush** করে (জোর করে স্ক্রিনে প্রিন্ট করায়)। লুপের ভেতর যদি ১ লাখ বার `endl` দাও, তোমার কোড ১ লাখ বার স্ক্রিনে আউটপুট ফ্লাশ করবে—যার কারণে TLE নিশ্চিত!
- ❌ **ভুল:** `cout << ans << endl;`
- ✅ **সঠিক:** `cout << ans << "\n";` (`\n` শুধু নতুন লাইন তৈরি করে, ফ্লাশ করে না, তাই অনেক ফাস্ট!)

### ৩. Time Complexity: প্রবলেম দেখেই সলিউশন কীভাবে বুঝব?
> **রুল অফ থাম্ব:** C++ এ ১ সেকেন্ডে প্রায় $10^8$ (১০ কোটি) অপারেশন (যেমন: যোগ, বিয়োগ, লুপ) চলতে পারে।

| ইনপুটের সাইজ ($N$) | যদি এই অ্যালগরিদম চালাও | লুপ কতবার ঘুরবে? | কনটেস্টে পাস করবে? |
| :--- | :--- | :--- | :--- |
| $N \le 10^5$ | $O(N^2)$ (যেমন ২টা নেস্টেড লুপ) | $(10^5)^2 = 10^{10}$ বার | ❌ TLE খাবে (১০ সেকেন্ড লাগবে) |
| $N \le 10^5$ | $O(N \log N)$ (যেমন Sorting) | $10^5 \times 17 \approx 1.7 \times 10^6$ বার | ✅ পাস করবে (খুব দ্রুত) |
| $N \le 10^5$ | $O(N)$ (যেমন সাধারণ একটা লুপ) | $10^5$ বার | ✅ পাস করবে |

---

## 🔴 পর্ব ২: কনটেস্ট অ্যাপ্লিকেশন (Traps & Mistakes)

কনটেস্টে সহজ প্রবলেমেও আমরা যে ভুলগুলো করি:

### ১. Integer Overflow (সবচেয়ে বড় শত্রু!)
C++ এ একটি `int` ভেরিয়েবল সর্বোচ্চ $\approx 2 \times 10^9$ পর্যন্ত সংখ্যা ধরে রাখতে পারে।
**উদাহরণ:** ধরো একটা প্রবলেমে আয়তক্ষেত্রের ক্ষেত্রফল বের করতে বলল, যেখানে দৈর্ঘ্য $L = 10^6$ এবং প্রস্থ $W = 10^6$।
তুমি যদি কোড লেখো:
```cpp
int L = 1000000;
int W = 1000000;
int area = L * W; // L * W = 10^12 
```
$10^{12}$ সংখ্যাটি `int` এর ধারণক্ষমতা ($2 \times 10^9$) এর চেয়ে অনেক বড়! ফলে মেমোরি "ওভারফ্লো" করবে এবং উল্টাপাল্টা নেগেটিভ উত্তর প্রিন্ট হবে।

**✅ সঠিক উপায়:** সবসময় বড় সংখ্যার জন্য 64-bit এর `long long` ব্যবহার করো!
```cpp
long long L = 1000000;
long long W = 1000000;
long long area = 1LL * L * W; // 1LL গুণ করলে অটোমেটিক long long হয়ে যায়!
```

### ২. Array Out of Bounds (অ্যারের বাইরে যাওয়া)
ইনপুট সাইজ $N = 10^5$ হলে আমরা অনেক সময় `int arr[100000]` ডিক্লেয়ার করি। কিন্তু কনটেস্টে অনেক সময় আমরা 1-based indexing (অর্থাৎ `arr[1]` থেকে `arr[N]` পর্যন্ত) ব্যবহার করি। তখন লুপ `N` পর্যন্ত চললে `arr[100000]` এ এক্সেস করতে গিয়ে মেমোরি এরর (RTE) খাবে।
**সমাধান:** সবসময় অ্যারের সাইজ ইনপুটের চেয়ে ৫ বা ১০ বেশি ডিক্লেয়ার করবে।
```cpp
const int MAXN = 100005; // N এর সর্বোচ্চ মান 10^5 হলে, আমি 100005 নিলাম
int arr[MAXN];
```

### ৩. Modulo Arithmetic (আপনি কেন লার্জ নাম্বার ভয় পাবেন না)
অনেক প্রবলেমে উত্তর $10^9 + 7$ দিয়ে modulo করে প্রিন্ট করতে বলে। এর কারণ, খুব বড় সংখ্যা প্রিন্ট করা বা তুলনা করা সমস্যা সৃষ্টি করে।
```cpp
const long long MOD = 1000000007;
long long result = (a * b) % MOD; // Modulo করা হয়েছে প্রতিটি গুণের পর
```

### ৪. Common Data Type Limits (রেফারেন্স)
| Type | Min Value | Max Value | Use Case |
| :--- | :--- | :--- | :--- |
| `int` | $-2^{31}$ ≈ $-2.1 \times 10^9$ | $2^{31}-1$ ≈ $2.1 \times 10^9$ | Small ranges, competitive programming |
| `long long` | $-2^{63}$ ≈ $-9.2 \times 10^{18}$ | $2^{63}-1$ ≈ $9.2 \times 10^{18}$ | Large numbers, products, sums |
| `double` | $\approx 2.2 \times 10^{-308}$ | $\approx 1.8 \times 10^{308}$ | Floating point (avoid in CP if possible) |

---

## 🟡 পর্ব ৩: CP Template (কপি-পেস্ট এবং যাও!)

প্রতিটি কনটেস্টে একটি বেসিক টেমপ্লেট থাকলে কাজ ৫ গুণ দ্রুত হয়। এটি মেমোরিতে রাখো বা একটি ফাইলে সেভ করে রাখো:

```cpp
#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
typedef vector<int> vi;
typedef vector<ll> vll;
typedef pair<int, int> pii;
typedef pair<ll, ll> pll;

const int MAXN = 100005;
const ll MOD = 1000000007;
const ll INF = 1e18;

int n, m;
int arr[MAXN];

void fast_io() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
}

void solve() {
    cin >> n;
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    // তোমার লজিক এখানে লিখো
    
    cout << "Answer\n"; // সবসময় "\n" ব্যবহার করো, endl না!
}

int main() {
    fast_io();
    
    int t;
    cin >> t; // টেস্ট কেস সংখ্যা
    while (t--) {
        solve();
    }
    
    return 0;
}
```

---

## 🟣 পর্ব ৪: Commonly Used STL (যা সবসময় লাগে)

| Container/Function | কী করে | Example |
| :--- | :--- | :--- |
| `vector<T>` | Dynamic array | `vector<int> v; v.push_back(5);` |
| `sort(v.begin(), v.end())` | সাজানো (ascending) | সাজানো ডেটা পেতে |
| `sort(v.rbegin(), v.rend())` | সাজানো (descending) | বড় থেকে ছোট |
| `set<T>` | Unique elements, sorted | `set<int> s; s.insert(5);` |
| `map<K, V>` | Key-value pairs | `map<string, int> freq;` |
| `unordered_map<K, V>` | Hash map (faster) | ফ্রিকোয়েন্সি কাউন্টিং |
| `priority_queue<T>` | Max-heap | `priority_queue<int> pq;` |
| `queue<T>` | FIFO | BFS-এর জন্য |
| `stack<T>` | LIFO | DFS, expression evaluation |
| `lower_bound(v.begin(), v.end(), x)` | প্রথম যেখানে $\ge x$ | Binary search on sorted array |
| `upper_bound(v.begin(), v.end(), x)` | প্রথম যেখানে $> x$ | Range queries |

---

## 🔵 পর্ব ৫: Problem-Solving Approach (লজিক দ্রুত কীভাবে চিন্তা করবে?)

### ধাপ ১: প্রবলেম ভালোমতো পড়া
- Input এবং Output বুঝো
- Edge cases দেখো (N=1, all zeros, negatives, etc.)
- Constraints বুঝো (N এর সাইজ থেকে অ্যালগরিদম সাজাও)

### ধাপ ২: অ্যালগরিদম চয়ন করা
```
N ≤ 20? → Brute force / Backtracking (2^N)
N ≤ 500? → O(N^2) / O(N^2 log N) থিংক করো
N ≤ 10^5? → O(N) / O(N log N) লাগবে
N ≤ 10^6? → O(N) ছাড়া কিছু করা যাবে না
```

### ধাপ ৩: কোড লেখা এবং টেস্টিং
- Sample input টেস্ট করো
- নিজে কয়েকটা টেস্ট কেস তৈরি করো
- Edge cases টেস্ট করো (empty array, single element, max/min values)

---

## 🟠 পর্ব ৬: Input/Output Patterns (কনটেস্টে কী আসে?)

### Pattern 1: Single Testcase
```
Input:
5
1 2 3 4 5

Output:
Answer
```

### Pattern 2: Multiple Testcases
```
Input:
3          // t = 3 টেস্ট কেস
5
1 2 3 4 5
3
10 20 30
2
100 200

Output:
Ans1
Ans2
Ans3
```

### Pattern 3: Grid/Matrix
```
Input:
3 4        // n rows, m columns
1 2 3 4
5 6 7 8
9 10 11 12

Code:
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        cin >> grid[i][j];
    }
}
```

---

## 🟤 পর্ব ৭: Helpful Macros (আরও ফাস্ট কোডিং এর জন্য)

```cpp
#define ll long long
#define vi vector<int>
#define vll vector<ll>
#define pii pair<int, int>
#define all(x) (x).begin(), (x).end()
#define sz(x) (int)(x).size()
#define clr(x) memset(x, 0, sizeof(x))
#define pb push_back
#define mp make_pair
#define fi first
#define se second

#define FOR(i, n) for (int i = 0; i < n; i++)
#define RFOR(i, n) for (int i = n - 1; i >= 0; i--)
#define REP(i, a, b) for (int i = a; i <= b; i++)

#define MAX(a, b) max((a), (b))
#define MIN(a, b) min((a), (b))
```

---

## 🔴 পর্ব ৮: Common Mistakes & How to Avoid (প্রিলিমিনারিতে ফেইল হওয়ার চেয়ে বাঁচা!)

### Mistake 1: Integer Overflow in Intermediate Steps
```cpp
// ❌ ভুল
int result = a * b / c;  // a * b overflow হতে পারে

// ✅ সঠিক
long long result = 1LL * a * b / c;  // 1LL দিয়ে প্রথমেই long long করো
```

### Mistake 2: Off-by-One Errors
```cpp
// ❌ ভুল (অনেক সময় লুপ ১ বার কম ঘুরে)
for (int i = 1; i < n; i++) { }  // i = n এ যাবে না!

// ✅ সঠিক
for (int i = 1; i <= n; i++) { }  // i = n পর্যন্ত যাবে
```

### Mistake 3: Uninitialized Variables
```cpp
// ❌ ভুল
int ans;
ans += x;  // ans এর ভ্যালু কী? গার্বেজ!

// ✅ সঠিক
int ans = 0;
ans += x;
```

### Mistake 4: String Input Gotcha
```cpp
// ❌ ভুল
int n;
string s;
cin >> n >> s;  // যদি n এর পরে newline থাকে, s এ সমস্যা হবে

// ✅ সঠিক
int n;
string s;
cin >> n;
cin.ignore();  // newline ignore করো
getline(cin, s);  // পুরো লাইন নাও
```

---

## 💡 পর্ব ৯: Quick Debugging Tips

### Trick 1: Debug Output
```cpp
#ifdef DEBUG
#define dbg(x) cerr << #x " = " << x << "\n"
#else
#define dbg(x)
#endif

// ব্যবহার করো: dbg(ans);
// যখন DEBUG define করবে, তখন সব output stderr-এ যাবে
```

### Trick 2: Assertion (প্রোগ্রাম এমন ভাবে ক্র্যাশ করাও যা সমস্যা চিহ্নিত করে)
```cpp
assert(n > 0 && n <= 100000);  // যদি false হয়, প্রোগ্রাম থেমে যাবে
```

### Trick 3: Simple Brute Force Test
বড় সলিউশন লিখার আগে, একটি সাধারণ (slow) সলিউশন দিয়ে ছোট ইনপুটে টেস্ট করো। তারপর দুটো আউটপুট compare করো।

---

## 🎯 পর্ব ১০: Memory & Constraints Reference

- **Stack Size:** ~৮ MB (বড় লোকাল অ্যারে stack overflow করতে পারে)
- **Typical Time Limit:** ১-२ সেকেন্ড
- **Typical Memory Limit:** ২৫৬ MB

```cpp
// ✅ Safe: Global array (heap-এ যায়)
int arr[1000005];

// ❌ Risky: Local array এর বড় সাইজ
int main() {
    int arr[1000005];  // stack overflow সম্ভব!
}
```

---

এই চ্যাপ্টারের সব কনসেপ্ট মাথায় রাখলে পরের সব algorithms বুঝতে এবং implement করতে সহজ হবে। এখন প্রস্তুত? চল, **Math & Number Theory** নিয়ে শিখতে শুরু করি! 🚀
