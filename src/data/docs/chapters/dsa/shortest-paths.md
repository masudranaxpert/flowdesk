# Shortest Paths & Dijkstra (Preliminary Core)

যেকোনো গ্রাফে যদি এজের (Edge) ওজন সমান না হয় (যেমন কোথাও ১০ টাকা ভাড়া, কোথাও ৫ টাকা ভাড়া), তখন সাধারণ BFS কাজ করে না। তখন আমাদের Shortest Path বের করার জন্য **Dijkstra** এর সাহায্য নিতে হয়।

---

## 🟢 পর্ব ১: বেসিক কনসেপ্ট (The Core Theory)

### ১. Dijkstra's Algorithm কী?
Dijkstra হলো BFS এর বড় ভাই! তবে এখানে সাধারণ Queue এর বদলে **Priority Queue** ব্যবহার করা হয়।
**ভিজ্যুয়ালাইজেশন:** তুমি ঢাকা থেকে চিটাগং যাবে। অনেকগুলো রুট আছে। তুমি একটা খাতায় সব শহরের নাম লিখলে। শুরুতে ঢাকার কস্ট 0, বাকি সব শহরের কস্ট $\infty$ (অনেক বড়)। 
এবার তুমি সবসময় সেই শহরটা বেছে নেবে যার কস্ট এখন পর্যন্ত **সবচেয়ে কম**। সেখান থেকে তার পাশের শহরগুলোর ভাড়া আপডেট করবে। এভাবে একসময় তুমি চিটাগং পৌঁছাবে সবচেয়ে কম ভাড়ায়!

**স্ট্যান্ডার্ড কোড (C++):**
```cpp
const long long INF = 1e18; // অনেক বড় সংখ্যা

void dijkstra(int start, int n, vector<vector<pair<int, int>>>& adj) {
    vector<long long> dist(n + 1, INF);
    // Priority queue (Min-Heap): {cost, node}
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top(); // সবচেয়ে কম কস্টের নোড
        pq.pop();

        if (d > dist[u]) continue; // পুরনো বা বেশি কস্টের ডেটা হলে বাদ দাও

        for (auto edge : adj[u]) {
            int v = edge.first;
            long long weight = edge.second;

            // যদি নতুন রাস্তা দিয়ে গেলে কস্ট কম পড়ে
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }
}
```

---

## 🔴 পর্ব ২: কনটেস্ট অ্যাপ্লিকেশন (Unlock the Algorithm)

Dijkstra অ্যালগরিদম কনটেস্টে বিভিন্ন টুইস্ট (Twist) নিয়ে আসে।

### 🛵 প্রবলেম ১: The Delivery Milestone (DIU Spring-26 Prelim A)
**প্রবলেম:** ফুডপান্ডার একজন রাইডারকে $A$ থেকে খাবার নিয়ে $B$ তে পৌঁছাতে হবে। কিন্তু রাস্তায় তাকে একটি নির্দিষ্ট চেকপয়েন্ট $C$ হয়ে যেতে হবে। সর্বনিম্ন কস্ট কত?

**Thought Process (2-Way Dijkstra):**
১. আমাকে $A \to C \to B$ যেতে হবে।
২. এর মানে হলো, আমাকে একবার $A$ থেকে $C$ এর শর্টেস্ট পাথ বের করতে হবে।
৩. তারপর $C$ থেকে $B$ এর শর্টেস্ট পাথ বের করতে হবে।
৪. অর্থাৎ, আমি যদি $C$ থেকে একবার ডাইকস্ট্রা চালাই, তবে আমি সবার শর্টেস্ট পাথ পেয়ে যাব! (কারণ গ্রাফটি Undirected হলে $A \to C$ এবং $C \to A$ এর কস্ট একই)।
৫. উত্তর হবে: `dist_from_C[A] + dist_from_C[B]`।

```cpp
// C থেকে ডাইকস্ট্রা চালানো হলো
dijkstra(C, n, adj, dist_C); 

// A এবং B এর দূরত্ব যোগ করা
long long total_cost = dist_C[A] + dist_C[B];
cout << total_cost << "\n";
```

### 🕒 প্রবলেম ২: Weird Timing (DIU Spring-26 Prelim A)
**প্রবলেম প্যাটার্ন:** ডাইকস্ট্রা চলাকালীন সময়ে কোনো বিশেষ শর্ত (Condition) জুড়ে দেওয়া। যেমন: কোনো শহরে তুমি রাত ১২টার পর ঢুকতে পারবে না।
**Thought Process (State Dijkstra):**
এই প্রবলেমগুলোতে ডাইকস্ট্রার রিলাক্সেশন স্টেপে (`dist[u] + weight < dist[v]`) একটু পরিবর্তন আনতে হয়।
তুমি শুধু কস্ট আপডেট করবে না, সাথে চেক করবে যে তুমি সেখানে যেতে পারছ কিনা।

```cpp
for (auto edge : adj[u]) {
    int v = edge.first;
    long long weight = edge.second;
    long long arrival_time = dist[u] + weight;

    // যদি পৌঁছানোর সময় ১২টার আগে হয়, তবেই যাব!
    if (arrival_time <= 12 * 60) {
        if (arrival_time < dist[v]) {
            dist[v] = arrival_time;
            pq.push({dist[v], v});
        }
    }
}
```
