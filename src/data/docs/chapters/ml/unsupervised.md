## Unsupervised Learning কী

**Unsupervised Learning** হলো এমন ML যেখানে ডেটাতে কোনো label বা answer থাকে না। Model কে শুধু কাঁচা ডেটা দেওয়া হয়, আর সে নিজেই লুকিয়ে থাকা pattern বা structure খুঁজে বের করে।

ভাবো তোমার কাছে হাজার গুলো customer এর purchase data আছে, কিন্তু কাউকেই কোনো category তে ভাগ করা নেই। Unsupervised learning দিয়ে তুমি খুঁজে বের করতে পারো — এরা আসলে ৩-৪ টা আলাদা গোষ্ঠীতে ভাগ হয়। কেউ বেশি spend করে কমবার, কেউ কম spend করে বারবার।

```text
  Supervised                    Unsupervised

  Labeled Data                  Unlabeled Data

  ● ● ● ●                       ● ● ● ●
  (red) (blue)                  (no color, no label)
  
  Model learns boundary         Model finds groups
  "এটা red, ওটা blue"           "এই গুলো একসাথে, ওই গুলো আলাদা"
```

| Feature | Supervised | Unsupervised |
|---------|-----------|-------------|
| Label | আছে | নেই |
| Goal | Predict | Discover |
| Evaluation | Accuracy, etc. | Subjective, domain-based |
| Examples | Classification, Regression | Clustering, PCA |

## K-Means Clustering

**K-Means** হলো সবচেয়ে popular clustering algorithm। এটা ডেটা কে K টা group এ ভাগ করে।

### Algorithm কীভাবে কাজ করে

```text
Step 1: K টা random center (centroid) বসাও

       ●     ●           ●     ●
                ●    ●         ●         ★ = centroid
      ●     ●      ●        
                     ●     ●  ★    ★  ★

Step 2: প্রতিটা point কে নিকটস্থ centroid এ assign করো

Step 3: প্রতিটা cluster এর centroid নতুন করে হিসাব করো (গড়)

Step 4: Step 2 আর 3 repeat করো যতক্ষণ না centroid shift করা বন্ধ করে

Final Result:

    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ ● ● ●   │    │   ● ●   │    │ ●  ●  ● │
    │  ● ●    │    │  ● ● ●  │    │  ● ● ●  │
    │   ● ●   │    │ ●    ●  │    │ ●   ●   │
    └─────────┘    └─────────┘    └─────────┘
     Cluster 1      Cluster 2      Cluster 3
```

### sklearn এ K-Means

```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import make_blobs
import numpy as np

# Synthetic data — 4 natural groups
X, _ = make_blobs(n_samples=300, centers=4, random_state=42)

# Scale data first!
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# K-Means with K=4
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
labels = kmeans.fit_predict(X_scaled)

print(f"Cluster centers:\n{kmeans.cluster_centers_}")
print(f"Inertia (within-cluster sum): {kmeans.inertia_:.2f}")
```

> [!note] Clustering এর আগে অবশ্যই scale করো
# K-Means distance ভিত্তিক। যদি একটা feature এর range হাজার হাজার (salary) আর আরেকটার শতকে (age), তাহলে salary dominate করবে। StandardScaler দিয়ে সব feature কে একই scale এ আনো — এটা clustering এর জন্য বাধ্যতামূলক।

## K কীভাবে বাছবে — Elbow Method

K-Means এ K এর মান আগে থেকে জানতে হয়। সবচেয়ে common method হলো **Elbow Method**।

```python
import matplotlib.pyplot as plt

inertias = []
K_range = range(1, 11)

for k in K_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_scaled)
    inertias.append(km.inertia_)

plt.plot(K_range, inertias, "bo-")
plt.xlabel("Number of clusters (K)")
plt.ylabel("Inertia")
plt.title("Elbow Method")
plt.show()
```

```text
  Inertia
     │
  600│  ●
     │    ●
  400│      ●
     │        ●
  200│          ●━━━●━━━●━━━●━━━●
     │          ↑ elbow here
  100│          K=4
     └──────────────────────────── K
        1   2   3   4   5   6 ...
```

যেখানে line হঠাৎ করে সমতল হয়ে যায় (elbow) — সেটাই optimal K। উপরের graph এ K=4 এ elbow।

## PCA — Dimensionality Reduction

**PCA (Principal Component Analysis)** একটা technique যেটা অনেক feature কে কম feature এ compress করে, এমনভাবে যেন maximum information থেকে যায়।

ভাবো তোমার 100 টা feature আছে। কিন্তু অনেক feature হয়তো একে অপরের সাথে correlated (যেমন height আর weight)। PCA এই redundant information কে combine করে ২-৩ টা "principal component" এ নামিয়ে আনে।

```text
  100 features                    2 features
  ┌──────────┐     PCA            ┌──────────┐
  │ feature1 │                   │  PC1     │
  │ feature2 │     ──────→       │  PC2     │
  │  ...     │                   │          │
  │feature100│                   └──────────┘
  └──────────┘
    full data                 visualizable!
```

```python
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import load_iris

# Load high-dimensional data
iris = load_iris()
X = iris.data  # 4 features

# Scale first
X_scaled = StandardScaler().fit_transform(X)

# Reduce to 2 dimensions
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

print(f"Original shape: {X.shape}")     # (150, 4)
print(f"Reduced shape:  {X_pca.shape}") # (150, 2)
print(f"Explained variance: {pca.explained_variance_ratio_}")
# [0.73, 0.23] — PC1 captures 73%, PC2 captures 23%
```

> [!tip] Visualization এর জন্য PCA দারুণ
# 4D বা 100D ডেটা কে visualization করা যায় না। PCA দিয়ে 2D তে নামিয়ে এনে scatter plot বানালে চোখ দিয়েই cluster বা pattern দেখা যায়। Exploratory data analysis এর প্রথম ধাপ হিসেবে PCA খুব useful।

## কখন Unsupervised Use করবে

| Use Case | Example | Algorithm |
|----------|---------|-----------|
| Customer segmentation | Marketing groups | K-Means |
| Anomaly detection | Fraud, outlier | DBSCAN, Isolation Forest |
| Dimensionality reduction | 1000 features → 50 | PCA |
| Topic discovery | Document grouping | LDA, NMF |
| Image compression | Reduce pixels | PCA |

### Anomaly Detection Example

```python
from sklearn.ensemble import IsolationForest

# Normal transactions + a few anomalies
X_normal = np.random.normal(50, 10, (1000, 2))
X_anomaly = np.random.uniform(0, 100, (20, 2))
X_all = np.vstack([X_normal, X_anomaly])

iso_forest = IsolationForest(contamination=0.02, random_state=42)
predictions = iso_forest.fit_predict(X_all)

# -1 = anomaly, 1 = normal
anomalies = X_all[predictions == -1]
print(f"Found {len(anomalies)} anomalies")
```

## Summary

Unsupervised learning এ label ছাড়াই ডেটা থেকে pattern খোঁজা হয়। K-Means সবচেয়ে popular clustering algorithm — K বাছাই এর জন্য elbow method। PCA দিয়ে high-dimensional ডেটা কম dimension এ আনা যায়, visualization সহজ হয়। Clustering এর আগে অবশ্যই data scale করো। Anomaly detection, customer segmentation, exploratory analysis — এসবের জন্য unsupervised দারুণ useful।