## Plaintext Password — কখনো না!

সবচেয়ে basic নিয়ম — password **কখনো** plaintext-এ ডাটাবেসে রাখবে না। কোনোভাবেই না। ডাটাবেস leak হলে সব user-এর password পাবলিক হয়ে যাবে, আর মানুষ একই password অনেক জায়গায় ব্যবহার করে — তাই সব জায়গায় access হারাবে।

> [!danger] এটা কখনো করবে না
# `INSERT INTO users (password) VALUES ('mypassword123')` — এটা সবচেয়ে খারাপ যা করতে পারো। একটুও encryption নেই, কেউ database dump পেলেই শেষ।

## Hash vs Encryption — পার্থক্য বুঝো

এই দুটো আলাদা জিনিস আর অনেকে confuse করে:

| | Hash | Encryption |
|---|---|---|
| দিক | একমুখী (one-way) | দ্বিমুখী (two-way) |
| উদ্দেশ্য | verify করা (password ঠিক আছে কি না) | পরে আবার ফেরত পাওয়া |
| উদাহরণ | password storage | credit card number storage |
| Reversible? | **না** — hash থেকে original ফেরত পাওয়া যায় না | হ্যাঁ — key দিয়ে decrypt করা যায় |

Password-এর জন্য **hash** ব্যবহার করতে হয় কারণ আমাদের original password ফেরত পেতে হয় না — শুধু verify করতে হয় যে user-এর দেওয়া password আর stored hash match করে কি না।

## Salt — Rainbow Table পরাস্ত করা

শুধু hash করলেও সমস্যা আছে — দুজন মানুষের password একই হলে hash-ও একই হবে। আর attacker "rainbow table" (precomputed hash table) ব্যবহার করে common password-এর hash সহজেই বের করে ফেলে।

Salt হলো প্রতিটা password-এর সাথে unique random string যোগ করা — তাহলে একই password-এর hash-ও আলাদা হয়:

```text
password: "hello123"
salt:     "x7k9m2"
hash("x7k9m2" + "hello123") → a8f3b2c1...
```

আধুনিক hashing library (bcrypt, argon2) স্বয়ংক্রিয়ভাবে salt generate করে আর hash-এর ভেতরেই রেখে দেয় — তোমাকে আলাদাভাবে manage করতে হয় না।

> [!tip] Pepper
# Salt-এর পাশাপাশি একটা "pepper" ব্যবহার করা যায় — এটা একটা secret key যেটা hash-এর ভেতরে থাকে না, সার্ভারের environment variable-এ থাকে। ডাটাবেস leak হলেও pepper না থাকলে hash break করা যাবে না।

## ধীর Hash বনাম দ্রুত Hash

Hashing algorithm দুই ধরনের হয় আর password-এর জন্য এটা খুব গুরুত্বপূর্ণ:

| | Fast Hash | Slow Hash |
|---|---|---|
| Algorithm | MD5, SHA-1, SHA-256 | bcrypt, argon2, scrypt |
| উদ্দেশ্য | file integrity, checksum | password |
| Speed | অত্যন্ত দ্রুত | ইচ্ছাকৃতভাবে ধীর |
| Password-এর জন্য? | **খারাপ** — brute force সহজ | **ভালো** — brute force কঠিন |

> [!warn] SHA-256 password-এর জন্য যথেষ্ট নয়
# SHA-256 দ্রুত hash করে — আধুনিক GPU প্রতি সেকেন্ডে কোটি কোটি SHA-256 চালাতে পারে। Brute force attack-এ password মিনিটেই break হয়ে যাবে। Password-এর জন্য ধীর hash (bcrypt/argon2) বাধ্যতামূলক।

## Argon2id — 2026-এর সেরা পছন্দ

OWASP অনুযায়ী **argon2id** হলো 2026-এ password hashing-এর recommended algorithm। এটা memory-hard (অনেক RAM লাগে) আর GPU-তে parallelize করা কঠিন — brute force অত্যন্ত ব্যয়বহুল হয়ে যায়।

bcrypt এখনও গ্রহণযোগ্য, কিন্তু argon2id আরও শক্তিশালী।

### Python উদাহরণ — argon2-cffi

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher(
    time_cost=3,        # iterations
    memory_cost=65536,  # 64 MB RAM
    parallelism=4,      # threads
)

# Hash করা
password = "mySecretPassword123"
hashed = ph.hash(password)
print(hashed)
# $argon2id$v=19$m=65536,t=3,p=4$abc123...$xyz789...

# Verify করা
try:
    ph.verify(hashed, password)
    print("Password ঠিক আছে!")
except VerifyMismatchError:
    print("ভুল password!")
```

### Python উদাহরণ — bcrypt

```python
import bcrypt

password = "mySecretPassword123".encode('utf-8')

# Hash করা (salt অটোমেটিক)
hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
print(hashed)

# Verify করা
if bcrypt.checkpw(password, hashed):
    print("Password ঠিক আছে!")
else:
    print("ভুল password!")
```

> [!note] bcrypt `rounds` (cost factor)
# `rounds=12` মানে hashing ২^১২ = ৪০৯৬ বার চলবে। বেশি বার = বেশি secure কিন্তু বেশি ধীর। 2026-এ `rounds=12` বা `13` ভালো balance — user কয়েক মিলিসেকেন্ড অপেক্ষা করবে, attacker brute force করতে গিয়ে মার খাবে।

## Timing Attack প্রতিরোধ

Password compare করার সময় সাধারণ `==` ব্যবহার করবে না — এটা timing attack-এর ঝুঁকি তৈরি করে। Attacker compare-এর সময় মেপে কোন character পর্যন্ত match করেছে সেটা বের করতে পারে।

Python-এ constant-time comparison:

```python
import secrets

# সঠিক উপায় — constant-time comparison
is_valid = secrets.compare_digest(user_input, stored_value)
```

## Practical — Hash আর Verify Flow

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import secrets

ph = PasswordHasher()

def register_user(username: str, password: str):
    """নতুন user register — password hash করে store করো।"""
    hashed = ph.hash(password)
    # database-এ store করো: username, hashed
    print(f"User {username} registered. Hash: {hashed[:30]}...")

def login_user(username: str, password: str, stored_hash: str):
    """Login — stored hash দিয়ে verify করো।"""
    try:
        ph.verify(stored_hash, password)
        print(f"Login successful! Welcome {username}.")

        # পরবর্তী security-র জন্য rehash দরকার কি না চেক
        if ph.check_needs_rehash(stored_hash):
            new_hash = ph.hash(password)
            print("Hash আপডেট করা হলো (নতুন parameters সহ)।")
    except VerifyMismatchError:
        print("ভুল password!")
```

```python
# ব্যবহার
register_user("rahim", "MySecurePass!2026")
login_user("rahim", "MySecurePass!2026", stored_hash="$argon2id$...")
```

> [!example] পাসওয়ার্ড রিলেটেড আরও আধুনিক জিনিস
# 2026-এ passkeys / WebAuthn ক্রমশ জনপ্রিয় হচ্ছে — password-ই দিতে হয় না, device-এ থাকা cryptographic key দিয়ে authenticate হয়। তবুও password system থাকলে argon2id ব্যবহার করাই সেরা উপায়।