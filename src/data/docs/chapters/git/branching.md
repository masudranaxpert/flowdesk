# Branching আর Merge

Branching হলো Git এর সবচেয়ে powerful feature। এটা ছাড়া team এ কাজ করা প্রায় অসম্ভব। Branch দিয়ে তুমি মূল কোড না ছুঁয়ে নতুন feature experiment করতে পারো। শেষে merge করে একসাথে নিয়ে আসতে পারো।

## Branch কী আর কেন দরকার?

Branch হলো একটা independent line of work। ধরো তোমার main project এ কাজ চলছে। তুমি একটা নতুন feature যোগ করতে চাও — কিন্তু ভয় আছে কোড break হতে পারে। এখন একটা নতুন branch বানালে, সেখানে experiment করো। মূল `main` branch এ কোনো change না হয়।

```
main:     A ── B ────────────── E (merge)
                 \             /
feature:          C ── D ──────
```

> [!tip]
> Branch হলো parallel universe এর মতো। তুমি এক universe এ experiment করো, ভালো হলে main universe এ আনো। খারাপ হলে branch টা delete করে দাও।

## Branch তৈরি আর Switch করা

### Branch তৈরি

```bash
git branch feature-login
```

### Branch এ Switch করা

```bash
git checkout feature-login
# অথবা নতুন syntax (পরিষ্কার)
git switch feature-login
```

> [!note]
> `git checkout` আর `git switch` দুটোই কাজ করে। `switch` হলো নতুন command, শুধু branch switch এর জন্য। `checkout` অনেক কাজ করে তাই confuse হওয়ার সুযোগ বেশি। নতুন Git version এ `switch` ব্যবহার করো।

### এক command এ branch আর switch

```bash
git checkout -b feature-login
# অথবা
git switch -c feature-login
```

এটা branch তৈরি করবে আর সাথে সাথে switch ও করবে।

### সব Branch দেখা

```bash
git branch
```

```
* feature-login
  main
```

`*` দিয়ে বোঝানো হয় তুমি এই মুহূর্তে কোন branch এ আছো।

## Branch এ কাজ করা

এখন feature branch এ কাজ শুরু করি:

```bash
git switch -c feature-login

# নতুন ফাইল
echo "def login():
    pass" > auth.py

git add auth.py
git commit -m "feat: login function যোগ করা হলো"
```

আরও কাজ:

```python
# auth.py — এডিট
def login(username, password):
    if username == "admin" and password == "1234":
        return "Login successful"
    return "Invalid credentials"
```

```bash
git add auth.py
git commit -m "feat: login logic implement করা হলো"
```

এখন branch গুলোর state:

```
main:          A ── B
                    \
feature-login:        C ── D
```

> [!example]
> `main` branch এ কোনো change নেই। সব পরিবর্তন `feature-login` branch এ। যখন কাজ শেষ হবে, তখন `main` এ merge করবো।

## Merge — Branch একসাথে আনা

Feature কাজ শেষ হলে `main` এ merge করতে হবে:

```bash
# Step ১: main এ যাও
git switch main

# Step ২: feature branch merge করো
git merge feature-login
```

```
Updating a1b2c3d..f4e5d6c
Fast-forward
 auth.py | 5 +++++
 1 file changed, 5 insertions(+)
 create mode 100644 auth.py
```

### Fast-forward vs Three-way Merge

| Type | কখন হয় | Diagram |
|------|---------|---------|
| **Fast-forward** | main এ কোনো new commit নেই | সোজা line এ সামনে যায় |
| **Three-way** | main আর feature দুটোতেই new commit আছে | একটা merge commit তৈরি হয় |

```
Fast-forward:     A ── B ── C ── D  (main catch up)

Three-way:        A ── B ────────── E (merge commit)
                       \           /
  feature:              C ── D ────
```

> [!note]
> Fast-forward merge এ কোনো merge commit তৈরি হয় না। কিন্তু main আর feature দুটোতেই আলাদা commit থাকলে three-way merge হয় আর একটা merge commit তৈরি হয়।

## Merge Conflict — সমস্যা সমাধান

কখনো main আর feature branch এ একই file এর একই অংশ change হতে পারে। তখন merge conflict হয়।

```bash
git switch main
echo "# Version 2" >> README.md
git add README.md
git commit -m "docs: README update"

git switch feature-login
echo "# Feature branch version" >> README.md
git add README.md
git commit -m "docs: README আপডেট feature branch এ"

git switch main
git merge feature-login
```

```
Auto-merging README.md
CONFLICT (content): Merge conflict in README.md
Automatic merge failed; fix conflicts and then commit the result.
```

> [!danger]
> Conflict হলে Git automatically merge করতে পারে না। তোমাকে manually resolve করতে হবে।

### Conflict Resolve করা

ফাইল খুললে দেখবে এরকম:

```
# My Project
<<<<<<< HEAD
# Version 2
=======
# Feature branch version
>>>>>>> feature-login
```

- `<<<<<<< HEAD` — main branch এর version
- `=======` — দুটোর separator
- `>>>>>>> feature-login` — feature branch এর version

তোমাকে decide করতে হবে কোনটা রাখবে। manually এডিট করো:

```
# My Project
# Version 2 (main এর টা রাখলাম)
```

এরপর:

```bash
git add README.md
git commit -m "merge: conflict resolve করা হলো"
```

> [!tip]
> Conflict resolve করার সময় VS Code খুব helpful। এটা "Accept Current", "Accept Incoming", "Accept Both" option দেখায়। এক ক্লিকে resolve করা যায়।

## Branch Delete করা

Merge হয়ে গেলে branch টা আর দরকার নেই। delete করে দাও:

```bash
git branch -d feature-login
```

যদি merge না হয়ে থাকে কিন্তু তবুও delete করতে চাও:

```bash
git branch -D feature-login
```

## Branching Strategy — Best Practice

```
main ──────●──────────────●────────── (production)
            \             /
develop      ●───●───●───●────────── (integration)
              \       /
feature/login   ●───●●               (your work)
```

> [!example]
- **main** — সবসময় stable, production ready
- **develop** — integration আর testing
- **feature/xyz** — প্রতিটা নতুন feature আলাদা branch এ

> [!warn]
> কখনো সরাসরি `main` এ কাজ করবে না। সবসময় feature branch বানিয়ে কাজ করো। শেষে PR (pull request) দিয়ে merge করো। এটাই professional workflow।

## Summary

Branch দিয়ে parallel কাজ করা যায়। `git branch`, `git switch`, `git merge` — এই তিনটাই মূল command। Conflict হলে manually resolve করতে হয়। পরের chapter এ remote আর GitHub শিখবো।