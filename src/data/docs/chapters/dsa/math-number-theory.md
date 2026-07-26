# Math & Number Theory (Preliminary Core)

কনটেস্টের প্রিলিমিনারি রাউন্ডে Math এবং Number Theory থেকে অন্তত ১-২ টি প্রবলেম থাকেই। এই প্রবলেমগুলো দেখতে খুব সহজ মনে হলেও, গাণিতিক সূত্র বা Number Range এর কারণে প্রচুর Wrong Answer (WA) আসে। 

---

## 🟢 পর্ব ১: বেসিক কনসেপ্ট (The Core Theory)

### ১. GCD (গরিষ্ঠ সাধারণ গুণনীয়ক) এবং LCM (লঘিষ্ঠ সাধারণ গুণিতক)
GCD মানে হলো সবচেয়ে বড় সেই সংখ্যা, যা দিয়ে দুটি সংখ্যাকেই ভাগ করা যায়। 
আর LCM হলো সবচেয়ে ছোট সেই সংখ্যা, যা দুটি সংখ্যারই গুণিতক (নামতায় আছে)। 

**গাণিতিক সূত্র:** 
$\text{LCM}(A, B) = \frac{A \times B}{\gcd(A, B)}$

**স্ট্যান্ডার্ড কোড (C++):**
```cpp
// গসাগু বের করার বেসিক ফাংশন (Euclidean Algorithm)
long long gcd(long long a, long long b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}

// লসাগু বের করার ফাংশন (ওভারফ্লো এড়াতে আগে ভাগ, পরে গুণ)
long long lcm(long long a, long long b) {
    return (a / gcd(a, b)) * b; 
}
```

### ২. Prime Numbers (Sieve of Eratosthenes)
যদি ১ থেকে $10^6$ এর মধ্যে প্রাইম নাম্বার বের করতে হয়, তবে আলাদা আলাদা লুপ চালালে TLE খাবে। 
**ভিজ্যুয়ালাইজেশন:** ১ থেকে ১০০ পর্যন্ত সংখ্যা ভাবো। ২ প্রাইম, তাই ২ এর সব গুণিতক (৪, ৬, ৮...) কেটে দাও। এরপর ৩ প্রাইম, ৩ এর সব গুণিতক (৬, ৯, ১২...) কেটে দাও। এভাবে খুব দ্রুত কাজ হয়ে যায়।

```cpp
const int MAXN = 1000000;
vector<bool> is_prime(MAXN + 1, true);

void sieve() {
    is_prime[0] = is_prime[1] = false;
    for (int p = 2; p * p <= MAXN; p++) {
        if (is_prime[p]) {
            for (int i = p * p; i <= MAXN; i += p)
                is_prime[i] = false;
        }
    }
}
```

---

## 🔴 পর্ব ২: কনটেস্ট অ্যাপ্লিকেশন (Unlock the Algorithm)

চলো দেখি এই বেসিক কনসেপ্টগুলো দিয়ে কীভাবে কনটেস্টের প্রবলেম সলভ হয়!

### 🏏 প্রবলেম ১: Abrar's Pitch Panic (DIU Spring-26 Final)
**প্রবলেম:** মাঠের দৈর্ঘ্য ও প্রস্থের অনুপাত $2:1$। তোমাকে শুধু ওই দৈর্ঘ্য আর প্রস্থের **GCD** এর মান $g$ দেওয়া আছে। ক্ষেত্রফল কত? ($g \le 10^5$)

**Thought Process:**
১. প্রস্থ $W$ হলে, দৈর্ঘ্য $L = 2W$।
২. $\gcd(2W, W) = W$ (কারণ ছোট সংখ্যাটি দিয়ে বড়টিকে ভাগ যায়)।
৩. প্রবলেমে গসাগুর মান দেওয়া আছে $g$। অর্থাৎ প্রস্থ $W = g$।
৪. তাহলে দৈর্ঘ্য $L = 2g$। 
৫. ক্ষেত্রফল = $2g \times g = 2g^2$। (ওভারফ্লো এড়াতে `long long` ব্যবহার করতে হবে)।

```cpp
void solve() {
    long long g;
    cin >> g;
    long long area = 2LL * g * g; 
    cout << area << "\n";
}
```

### 🔢 প্রবলেম ২: Key of Multiples (DIU Fall-24 Final)
**প্রবলেম:** $B$ এর সমান বা ছোট কয়টি ধনাত্মক পূর্ণসংখ্যা আছে যা $A$ এর গুণিতক এবং $C$ দ্বারাও বিভাজ্য?

**Thought Process:**
১. এমন সংখ্যা যা $A$ দিয়েও ভাগ যায়, আবার $C$ দিয়েও ভাগ যায়, তা হলো $\text{LCM}(A, C)$।
২. তাহলে $B$ এর মধ্যে $\text{LCM}(A, C)$ এর গুণিতক কয়টা আছে? $B$ কে $\text{LCM}$ দিয়ে ভাগ করলেই পেয়ে যাব!
৩. **ফাঁদ:** LCM বের করার সময় `A * C` আগে করলে ওভারফ্লো হবে। তাই `(A / gcd) * C` করতে হবে।

```cpp
void solve() {
    long long A, B, C;
    cin >> A >> B >> C;
    long long L = lcm(A, C);
    cout << B / L << "\n";
}
```

### ⚡ প্রবলেম ৩: Modular Exponentiation (Fast Power)
**প্রবলেম প্যাটার্ন:** $A^B \bmod M$ বের করতে হবে, যেখানে $B$ অনেক বড় (যেমন $10^{18}$)। সাধারণ লুপে $B$ বার গুণ করলে TLE খাবে।

**Thought Process:**
১. **মূল আইডিয়া:** $A^{10}$ বের করতে ১০ বার গুণ করার দরকার নেই! $A^{10} = A^5 \times A^5$। আর $A^5 = A^2 \times A^2 \times A$।
২. অর্থাৎ পাওয়ারকে অর্ধেক অর্ধেক করে ভাগ করে ফেললে $O(\log B)$ সময়েই কাজ শেষ!
৩. **Modular:** প্রতি স্টেপে $\bmod M$ নিতে হবে যাতে ওভারফ্লো না হয়। গুণ করার সময় `long long` ব্যবহার করবে।

```cpp
long long power(long long a, long long b, long long m) {
    long long result = 1;
    a %= m;
    while (b > 0) {
        if (b & 1) result = (result * a) % m; // পাওয়ার বিজোড় হলে ফলাফলে গুণ
        a = (a * a) % m;                       // ভিত্তিকে বর্গ করো
        b >>= 1;                               // পাওয়ার অর্ধেক করো
    }
    return result;
}
```

> **কনটেস্ট টিপস:** ফের্মাটের ছোট থিওরেম ($a^{p-1} \equiv 1 \pmod{p}$) দিয়ে Modular Inverse বের করতে হলেও এই ফাংশনটাই লাগবে: `inverse(a) = power(a, p-2, p)`।
