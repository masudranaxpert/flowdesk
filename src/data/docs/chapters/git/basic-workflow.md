# Basic Workflow

আগের chapter এ Git ইনস্টল আর config করলাম। এবার চলো আসল workflow শিখি — একটা project শুরু করা, কোড যোগ করা, commit করা, history দেখা। এই গুলো হলো Git এর day-to-day command।

## Repository তৈরি — git init

প্রথমে একটা folder বানিয়ে সেটাকে Git repository বানাতে হবে:

```bash
mkdir my_project
cd my_project
git init
```

```
Initialized empty Git repository in /Users/asus/my_project/.git/
```

> [!note]
> `git init` চালালে ওই folder এ একটা `.git` নামে hidden folder তৈরি হয়। এটাই Git এর engine — সব history, snapshot এখানে store থাকে। এই folder টা কখনো delete করবে না!

## Working Directory আর Staging Area

Git এ তিনটা area আছে:

```
Working Directory → Staging Area → Repository (.git)
  (তোমার ফাইল)      (prepare)       (committed history)
```

| Area | কী | Command |
|------|-----|---------|
| **Working Directory** | তোমার সব ফাইল, যেমন আছে | — |
| **Staging Area** | commit করার জন্য selected | `git add` |
| **Repository** | permanently saved history | `git commit` |

> [!tip]
> Staging area হলো "shopping cart" এর মতো। তুমি যে ফাইল গুলো commit করতে চাও সেগুলো আগে cart এ add করো (`git add`), তারপর checkout করো (`git commit`)।

## Status দেখা — git status

সবচেয়ে বেশি ব্যবহার হওয়া command হলো `git status` — কী পরিবর্তন হয়েছে সেটা দেখায়:

```bash
git status
```

কিছু ফাইল তৈরি করি আগে:

```bash
echo "# My Project" > README.md
echo "print('Hello')" > main.py
```

এখন status দেখি:

```
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        README.md
        main.py

nothing added to commit but use "git add" to track
```

> [!example]
> Git বলছে — দুটো নতুন ফাইল আছে যেগুলো এখনো track হয়নি ("untracked")। এগুলোকে add করতে হবে।

## ফাইল Add করা — git add

Staging area তে ফাইল যোগ করার জন্য `git add` ব্যবহার করি:

```bash
# একটা ফাইল
git add README.md

# সব ফাইল একসাথে
git add .

# নির্দিষ্ট pattern
git add *.py
```

এখন আবার status দেখি:

```bash
git status
```

```
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   README.md
        new file:   main.py
```

> [!note]
> দেখো — ফাইল গুলো এখন "Changes to be committed" section এ। মানে staging area তে আছে। এখন commit করা যাবে।

## Commit করা — git commit

Commit হলো একটা permanent snapshot। message সহ save করা হয়:

```bash
git commit -m "প্রথম commit: README আর main.py যোগ করা হলো"
```

```
[main (root-commit) a1b2c3d] প্রথম commit: README আর main.py যোগ করা হলো
 2 files changed, 2 insertions(+)
 create mode 100644 README.md
 create mode 100644 main.py
```

> [!tip]
> Commit message যত descriptive হবে তত ভালো। কী পরিবর্তন করেছো সেটা লেখো। পরে অনেক commit হলে বুঝতে সুবিধা হবে।

### Commit Message Convention

ভালো commit message এর format:

```bash
git commit -m "feat: login page যোগ করা হলো"
git commit -m "fix: payment bug fix করা হলো"
git commit -m "docs: README update"
```

| Prefix | মানে |
|--------|------|
| `feat:` | নতুন feature |
| `fix:` | bug fix |
| `docs:` | documentation |
| `refactor:` | code refactor |
| `test:` | test যোগ |

## History দেখা — git log

সব commit এর history দেখতে `git log`:

```bash
git log
```

```
commit a1b2c3d4e5f6... (HEAD -> main)
Author: Tumi R Nam <tumar@email.com>
Date:   Fri Jul 4 10:30:00 2026 +0600

    প্রথম commit: README আর main.py যোগ করা হলো
```

এক লাইনে সংক্ষিপ্ত দেখতে:

```bash
git log --oneline
```

```
a1b2c3d প্রথম commit: README আর main.py যোগ করা হলো
```

> [!example]
> `--oneline` flag টা খুব useful। প্রতিটা commit এক লাইনে দেখায়। অনেক commit থাকলে এভাবে দেখা সহজ।

## পরিবর্তন করে আবার Commit

ফাইল এডিট করি:

```python
# main.py — এডিট করা হলো
print("Hello, World!")
print("Welcome to Git!")
```

```bash
git status       # modified: main.py
git add main.py
git commit -m "feat: welcome message যোগ করা হলো"
git log --oneline
```

```
f7e8d9c feat: welcome message যোগ করা হলো
a1b2c3d প্রথম commit: README আর main.py যোগ করা হলো
```

## .gitignore — যা Track করতে চাও না

কিছু ফাইল থাকে যেগুলো Git এ commit করা উচিত না — password, API key, build output, virtual environment। এগুলো বাদ দিতে `.gitignore` file বানানো হয়:

```bash
# .gitignore ফাইল তৈরি
```

```
# Python
__pycache__/
*.pyc
.venv/
venv/

# Environment / Secret
.env
credentials.json

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

> [!danger]
> কখনো password, API key, বা `.env` file Git এ commit করবে না! একবার push হয়ে গেলে GitHub থেকে মুছেও ফেললে history তে থেকে যায়। `.gitignore` আগে সেট করে নাও।

## সম্পূর্ণ Workflow এক নজরে

```bash
# ১. প্রজেক্ট শুরু
git init

# ২. ফাইল তৈরি
echo "# My Project" > README.md

# ৩. যা commit করতে চাও সেটা add করো
git add .

# ৪. Commit করো
git commit -m "initial commit"

# ৫. আরও কাজ করো
echo "print('hello')" > app.py

# ৬. আবার add আর commit
git add app.py
git commit -m "feat: app.py যোগ করা হলো"

# ৭. History দেখো
git log --oneline
```

> [!tip]
> এই cycle টাই Git এর জীবন — `status` → `add` → `commit` → repeat। প্রতিদিন ডজন বার করবে। অভ্যস্ত হলে আর ভাবতেও হবে না।

## Summary

Basic Git workflow হলো: `git init` → `git status` → `git add` → `git commit` → `git log`। `.gitignore` দিয়ে sensitive ফাইল বাদ দাও। পরের chapter এ branching আর merge শিখবো।