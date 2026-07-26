# Binary Search & Binary Search on Answer (Preliminary Core)

সাধারণ Binary Search দিয়ে সর্টেড অ্যারেতে কোনো সংখ্যা খোঁজা যায়, এটা আমরা সবাই জানি। কিন্তু প্রিলিমিনারি কনটেস্টে (যেমন DIU Spring-26) এমন কিছু প্রবলেম আসে যেখানে সরাসরি "সংখ্যা খোঁজার" কথা বলা থাকে না, বরং বলা হয় "সর্বোচ্চ কত" বা "সর্বনিম্ন কত" হতে পারে? 

---

## 🟢 পর্ব ১: বেসিক কনসেপ্ট (The Core Theory)

### ১. Binary Search (কীভাবে কাজ করে?)
ধরো তুমি একটি ডিকশনারিতে "Mango" শব্দটি খুঁজছ। তুমি কি প্রথম পাতা থেকে একটা একটা করে শব্দ খুঁজবে? না! 
তুমি বইটার ঠিক মাঝখানে খুলবে। যদি সেখানে "N" দিয়ে শব্দ থাকে, তুমি বুঝবে "Mango" এর আগে আছে (বামের অর্ধেকাংশে)। তখন তুমি ডান পাশের অর্ধেক পুরোপুরি বাদ দিয়ে দেবে। এটাই বাইনারি সার্চ! 
**শর্ত:** ডেটা অবশ্যই সাজানো (Sorted) থাকতে হবে।

**স্ট্যান্ডার্ড কোড:**
```cpp
int binarySearch(const vector<int>& a, int target) {
    int low = 0, high = a.size() - 1;
    
    while (low <= high) {
        int mid = low + (high - low) / 2;
        
        if (a[mid] == target) return mid; // পেয়ে গেছি!
        else if (a[mid] < target) low = mid + 1; // ডানে আছে
        else high = mid - 1; // বামে আছে
    }
    return -1; // পাওয়া যায়নি
}
```

---

## 🔴 পর্ব ২: কনটেস্ট অ্যাপ্লিকেশন (Binary Search on Answer)

কনটেস্টে আমাদের অ্যানসারের উপর (Answer) বাইনারি সার্চ চালাতে হয়। 

### ⚓ প্রবলেম ১: The Harbor Master's Challenge (DIU Spring-26 Prelim A)
**প্রবলেম:** তোমার কাছে $N$ টি কার্গো বক্স আছে, যাদের ওজন দেওয়া আছে। তোমার কাছে মোট $D$ টি জাহাজ আছে। কার্গোগুলো পরপর জাহাজগুলোতে তুলতে হবে। প্রতিটি জাহাজের **ন্যূনতম ধারণ ক্ষমতা (Minimum Capacity)** কত হলে তুমি সব কার্গো ঠিক $D$ টি জাহাজে পাঠাতে পারবে?

**Thought Process:**
১. আমাকে জাহাজের "ক্যাপাসিটি" বের করতে হবে।
২. **Monotonicity (একমুখী স্বভাব):** জাহাজের ক্যাপাসিটি যত **বাড়বে**, জাহাজ তত **কম** লাগবে। ক্যাপাসিটি যত **কমবে**, জাহাজ তত **বেশি** লাগবে। যখনই এমন Monotonic সম্পর্ক দেখবে, বুঝে নিবে এটা Binary Search on Answer!
৩. **সার্চ স্পেস:**
   - `low = max(সব কার্গোর ওজন)` (অন্তত সবচেয়ে ভারী কার্গোটাকে তো আঁটতে হবে!)
   - `high = sum(সব কার্গোর ওজন)` (সব কার্গো ১টা জাহাজেই দিয়ে দিলে)

```cpp
// এই ফাংশনটি চেক করবে 'capacity' দিয়ে D টা জাহাজে কাজ হয় কিনা
bool check(long long capacity, const vector<long long>& a, int D) {
    int ships_needed = 1;
    long long current_weight = 0;

    for (long long weight : a) {
        if (current_weight + weight > capacity) {
            ships_needed++; // নতুন একটা জাহাজ লাগবে
            current_weight = weight;
        } else {
            current_weight += weight;
        }
    }
    return ships_needed <= D; 
}

void solve_harbor() {
    // ... input ...
    long long low = max_val, high = sum_val, ans = sum_val; 

    while (low <= high) {
        long long mid = low + (high - low) / 2; // মাঝখানের ক্যাপাসিটি ধরলাম
        
        if (check(mid, a, d) == true) {
            ans = mid;        // কাজ হচ্ছে, সেভ করে রাখলাম
            high = mid - 1;   // আরও ছোট ক্যাপাসিটি খুঁজতে বামে যাব!
        } else {
            low = mid + 1;    // কাজ হচ্ছে না, ক্যাপাসিটি বাড়াতে ডানে যাব!
        }
    }
    cout << ans << "\n";
}
```

### ❄️ প্রবলেম ২: AC Installation Plan (DIU Spring-25 Final)
**প্রবলেম:** বাজেট $X$ টাকার মধ্যে তুমি সর্বোচ্চ কয়টি এসি বসাতে পারবে? (এসির বিল ধাপে ধাপে বাড়ে)।
**Thought Process:**
১. এসি বসালে বিল সবসময় বাড়ে (কমে না)। এটি একটি Monotonic Function।
২. `low = 0` (কোনো এসি না), `high = 10^12` (অনেক এসি)। 
৩. $mid$ সংখ্যক এসি ধরে মোট বিল হিসাব করব। 
৪. যদি বিল বাজেটের চেয়ে কম বা সমান হয়, তবে আমরা আরও বেশি এসি বসানোর চেষ্টা করব (`low = mid + 1`)। 
৫. বেশি হয়ে গেলে এসি কমাব (`high = mid - 1`)।

### 🐄 প্রবলেম ৩: Aggressive Cows (সর্বোচ্চ সর্বনিম্ন দূরত্ব)
**প্রবলেম:** একটি সরল রেখায় $N$ টি স্টল (Stall) এর পজিশন দেওয়া আছে। কৃষকের $C$ টি গরু আছে যাদের প্রতিটিকে আলাদা আলাদা স্টলে রাখতে হবে। গরুগুলো আক্রমণাত্মক (Aggressive), তাই যেকোনো দুই গরুর মধ্যে ন্যূনতম দূরত্ব যত সম্ভব **সর্বোচ্চ (Maximum)** করতে হবে। সেই দূরত্বটি কত?

**Thought Process:**
১. **Monotonicity চেক:** দূরত্ব যত **ছোট** হবে, তত বেশি গরু বসানো যাবে। দূরত্ব যত **বড়** হবে, তত কম গরু বসানো যাবে। ক্লাসিক Binary Search on Answer!
২. **সার্চ স্পেস:** `low = 1` (ন্যূনতম দূরত্ব), `high = max(pos) - min(pos)` (সর্বোচ্চ সম্ভাব্য দূরত্ব)।
৩. **check(d):** প্রথম স্টলে ১ম গরু বসাও। এরপর প্রতিটি পরবর্তী স্টলে দেখো — শেষ যেখানে গরু বসিয়েছি, তার থেকে দূরত্ব $\ge d$ হলে সেখানে বসাও।
৪. `check(mid)` true হলে দূরত্ব আরও বাড়ানোর চেষ্টা করব (`low = mid + 1`)।

```cpp
bool canPlace(vector<int>& stalls, int c, int d) {
    int count = 1, last = stalls[0]; // ১ম গরু ১ম স্টলে
    for (int i = 1; i < stalls.size(); i++) {
        if (stalls[i] - last >= d) {
            count++;
            last = stalls[i];
            if (count >= c) return true;
        }
    }
    return false;
}

void solve_cows() {
    sort(stalls.begin(), stalls.end());
    int low = 1, high = stalls.back() - stalls.front(), ans = 0;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (canPlace(stalls, c, mid)) {
            ans = mid;       // এই দূরত্বে হচ্ছে, সেভ করে রাখলাম
            low = mid + 1;   // আরও বাড়ানোর চেষ্টা
        } else {
            high = mid - 1;  // দূরত্ব কমাতে হবে
        }
    }
    cout << ans << "\n";
}
```
