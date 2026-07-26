# Advanced Data Structures (Disjoint Set Union)

কনটেস্টের প্রিলিমিনারিতে খুব বেশি হার্ড ডেটা স্ট্রাকচার (যেমন Segment Tree বা Fenwick Tree) সচরাচর আসে না। তবে **Disjoint Set Union (DSU)** থেকে প্রায়ই প্রবলেম থাকে, বিশেষ করে যখন বন্ধুত্বের নেটওয়ার্ক (Friendship Network) বা গ্রাফের কানেক্টিভিটি নিয়ে প্রশ্ন করা হয়।

---

## 🟢 পর্ব ১: বেসিক কনসেপ্ট (The Core Theory)

### ১. DSU বা Union-Find কী?
**ভিজ্যুয়ালাইজেশন:** ধরো তোমার ক্লাসে অনেকগুলো ছোট ছোট বন্ধুত্বের গ্রুপ আছে। 
- গ্রুপ ১ এর লিডার হলো A। (A, B, C বন্ধু)।
- গ্রুপ ২ এর লিডার হলো X। (X, Y বন্ধু)।

এখন C এবং Y যদি বন্ধু হয়, তার মানে গ্রুপ ১ এবং গ্রুপ ২ এখন একটাই বড় গ্রুপ হয়ে যাবে! 
DSU মূলত দুটি কাজ খুব দ্রুত করে:
১. **Find:** একজন মানুষ কোন গ্রুপে আছে (তার লিডার কে) তা খুঁজে বের করা।
২. **Union:** দুটি আলাদা গ্রুপকে এক করে দেওয়া।

**DSU এর মূল কোড (Path Compression সহ):**
```cpp
int parent[100005];

// শুরুতে সবাই নিজের নিজের লিডার
void make_set(int n) {
    for (int i = 1; i <= n; i++) {
        parent[i] = i; 
    }
}

// লিডার কে তা খুঁজে বের করা (Path Compression)
int find_set(int v) {
    if (v == parent[v]) return v; // আমি নিজেই আমার লিডার!
    
    // আমার প্যারেন্টকে ডাকব, আর তার লিডারকেই সরাসরি আমার প্যারেন্ট বানিয়ে দেব!
    return parent[v] = find_set(parent[v]); 
}

// দুটি গ্রুপকে এক করা
void union_sets(int a, int b) {
    a = find_set(a); // a এর লিডার
    b = find_set(b); // b এর লিডার
    if (a != b) {
        parent[b] = a; // b এর লিডারকে a এর আন্ডারে দিয়ে দিলাম
    }
}
```

---

## 🔴 পর্ব ২: কনটেস্ট অ্যাপ্লিকেশন (Unlock the Algorithm)

### 🤝 প্রবলেম ১: The Farmer's Fence (Spring-26 Prelim B)
**প্রবলেম প্যাটার্ন:** কৃষকের অনেকগুলো খামার আছে। সে বিভিন্ন খামারের মাঝে বেড়া ভেঙে রাস্তা বানাচ্ছে। তোমাকে বলতে হবে সব খামার কি একে অপরের সাথে যুক্ত হয়েছে কিনা?
**Thought Process:**
১. শুরুতে প্রতিটি খামার আলাদা (সবাই নিজের লিডার)। `make_set(N)`.
২. কৃষক যখনই দুটি খামার $U$ এবং $V$ এর মাঝে রাস্তা বানাবে, তুমি `union_sets(U, V)` কল করে তাদের এক গ্রুপে ঢুকিয়ে দেবে।
৩. শেষে তুমি যেকোনো একটি খামারের লিডার বের করবে এবং চেক করবে বাকি সব খামারের লিডারও একই ব্যক্তি কিনা! যদি সবার লিডার একই হয়, তবে সবাই এক গ্রুপে আছে!

```cpp
void solve_farmer() {
    // ... input N (খামার) এবং M (রাস্তা) ...
    make_set(N);
    
    for (int i = 0; i < M; i++) {
        int u, v;
        cin >> u >> v;
        union_sets(u, v);
    }
    
    int main_leader = find_set(1);
    bool all_connected = true;
    for (int i = 2; i <= N; i++) {
        if (find_set(i) != main_leader) {
            all_connected = false;
            break;
        }
    }
    
    if (all_connected) cout << "YES\n";
    else cout << "NO\n";
}
```

### 🚫 প্রবলেম ২: Unfriending (Summer-25 A)
**প্রবলেম প্যাটার্ন:** কিছু বন্ধুত্বের সম্পর্ক দেওয়া আছে। এখন কিছু মানুষ আনফ্রেন্ড করছে। আনফ্রেন্ড করার পর কার গ্রুপে কতজন আছে?
**Thought Process:**
DSU তে আনফ্রেন্ড (Union ভাঙা) করা খুব কঠিন! তাই আমরা একটু "চালাকি" (Offline Processing) করব। 
আমরা প্রবলেমটাকে পেছন থেকে (Reverse) সলভ করব! 
আনফ্রেন্ড করাকে যদি আমরা উল্টো দিক থেকে ভাবি, তবে সেটি হবে "নতুন করে ফ্রেন্ড হওয়া"। 
আমরা একদম শেষের অবস্থা থেকে শুরু করব, আর একে একে ফ্রেন্ড বানাব (`union_sets`), যা DSU দিয়ে খুব সহজেই করা যায়!

### 🌉 প্রবলেম ৩: Kruskal's MST (সবচেয়ে সস্তা সংযোগ)
**প্রবলেম প্যাটার্ন:** $N$ টি শহরকে সড়ক দিয়ে যুক্ত করতে হবে যেন সবাই একে অপরের সাথে যুক্ত থাকে (Connected)। প্রতিটি সম্ভাব্য সড়কের কস্ট দেওয়া আছে। সর্বনিম্ন কত টাকায় কাজ সারা যায়?

**Thought Process (Minimum Spanning Tree):**
১. এটি ক্লাসিক **MST (Minimum Spanning Tree)** প্রবলেম। Kruskal এর মূল আইডিয়া হলো: **সবচেয়ে সস্তা এজ আগে নাও, কিন্তু cycle বানিয়ো না।**
২. DSU এখানে "cycle চেক করার" জন্য কাজে লাগে — যদি একটি এজের দুই প্রান্তের নোড আগে থেকেই একই গ্রুপে থাকে, সেটা যোগ করলে cycle বানাবে, তাই বাদ দাও।
৩. **ধাপ:**
   - সব এজকে ওজন অনুসারে ছোট থেকে বড় সর্ট করো।
   - প্রতিটি এজ $(u, v, w)$ এর জন্য: যদি `find(u) != find(v)` হয়, তবে `union(u, v)` করো এবং $w$ কে total এ যোগ করো।

```cpp
struct Edge {
    int u, v;
    long long w;
    bool operator<(const Edge& o) const { return w < o.w; }
};

long long kruskal(int n, vector<Edge>& edges) {
    sort(edges.begin(), edges.end());
    make_set(n);
    
    long long total_cost = 0;
    int edges_used = 0;
    
    for (auto& e : edges) {
        if (find_set(e.u) != find_set(e.v)) {
            union_sets(e.u, e.v);
            total_cost += e.w;
            edges_used++;
            if (edges_used == n - 1) break; // MST তে ঠিক N-1 টা এজ
        }
    }
    return total_cost;
}
```

> **প্যাটার্ন চিনবে:** "সব নোডকে যুক্ত করতে সর্বনিম্ন কত কস্ট?" — MST। Kruskal + DSU সবচেয়ে সহজ ইমপ্লিমেন্টেশন।
