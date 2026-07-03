# Git কী ও কেন দরকার

Git হলো দুনিয়ার সবচেয়ে জনপ্রিয় **version control system**। সহজ ভাষায় বললে — Git তোমার কোডের প্রতিটা version save করে রাখে, যাতে তুমি যেকোনো সময় আগের version এ ফিরে যেতে পারো, একসাথে অনেকে মিলে কাজ করতে পারো।

## Version Control কী?

ধরো তুমি একটা বড় project করছো। ফাইল এডিট করলে, কিছু break হয়ে গেলে — কী ছিল আগে সেটা মনে নেই। `main.py`, `main_v2.py`, `main_final.py`, `main_final_final.py` — এভাবে ফাইল copy করে রাখা লাগে। Version control দিয়ে এই সমস্যার সমাধান হয়।

```
Version 1 → Version 2 → Version 3 → Version 4 (current)
                 ↑
           যেকোনো version এ ফিরে যাওয়া যায়
```

> [!note]
> Git কোডের **snapshot** রাখে। প্রতিটা commit হলো একটা snapshot — সেই মুহূর্তে তোমার পুরো project কেমন ছিল সেটার একটা ছবি।

## Git কেন দরকার?

| সমস্যা | Git ছাড়া | Git দিয়ে |
|--------|---------|---------|
| কিছু break করলে | আগের version হারিয়ে গেছে | এক command এ ফিরে যাও |
| Team এ কাজ | ফাইল আদান-প্রদান ঝামেলা | সবাই একসাথে কাজ করতে পারে |
| কে কী change করেছে | ট্র্যাক নেই | প্রতিটা change এর history |
| Branch এ experiment | মূল কোড নষ্ট হওয়ার ভয় | আলাদা branch এ try করো |

## Snapshot vs Diff — Git এর Concept

কিছু version control system (যেমন SVN) **diff** store করে — মানে কী কী পরিবর্তন হয়েছে সেটা। কিন্তু Git **snapshot** রাখে — প্রতিটা commit এ পুরো project এর একটা complete state।

```
Commit A ──→ Commit B ──→ Commit C
[snapshot]   [snapshot]   [snapshot]
```

> [!tip]
> Snapshot approach এর কারণে Git খুব দ্রুত। যেকোনো version এ যেতে সরাসরি jump করা যায়, একটা একটা diff apply করতে হয় না।

## Git ইনস্টল করা

### Windows

1. **git-scm.com** এ যাও
2. "Download for Windows" এ ক্লিক করো
3. Installer run করো — next-next দিলেই হয়

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install git
```

### macOS

```bash
brew install git
```

### Verify করা

```bash
git --version
```

```
git version 2.46.0
```

> [!note]
> Windows এ Git install করলে **Git Bash** নামে একটা terminal ও সাথে আসে। এটা Linux এর মতো command চালায়। অনেকে Git Bash ব্যবহার করে prefer করে।

## Git Config — প্রথম বার Setup

Git install করার পর সবার আগে নিজের নাম আর email configure করতে হয়। এটা একবারই করা লাগে:

```bash
git config --global user.name "Tumi R Nam"
git config --global user.email "tumar@email.com"
```

Verify করতে চাইলে:

```bash
git config --list
```

```
user.name=Tumi R Nam
user.email=tumar@email.com
core.editor=code --wait
```

> [!danger]
> Email টা তোমার GitHub এর email এর সাথে match করবে। নাহলে GitHub তে commit গুলো তোমার profile এ show করবে না — contribution graph ও আসবে না।

### Default Editor Set

```bash
# VS Code কে default editor বানাতে
git config --global core.editor "code --wait"

# বা nano
git config --global core.editor "nano"
```

### Default Branch Name

নতুন Git version এ default branch এর নাম `main` দেওয়া ভালো:

```bash
git config --global init.defaultBranch main
```

> [!tip]
> আগে default branch এর নাম `master` ছিল। এখন industry standard হলো `main`। তাই এটা সেট করে রাখো।

## কোথায় কোথায় Git ব্যবহার হয়?

- **GitHub / GitLab / Bitbucket** — code hosting platform, Git এর উপর ভিত্তি করে বানা
- **Team Collaboration** — ১০০+ developer একসাথে কাজ করে
- **Open Source** — Linux kernel, React, VS Code — সব Git দিয়ে manage হয়
- **CI/CD** — code push করলে automatically test আর deploy হয়
- **Backup** — পুরো project history cloud এ safe

## Git এর মূল Concept গুলো

| Term | মানে |
|------|------|
| **Repository (repo)** | Git দিয়ে track করা একটা project folder |
| **Commit** | একটা snapshot / save point |
| **Branch** | আলাদা কাজের line |
| **Remote** | GitHub এর মতো server এ stored copy |
| **Staging Area** | commit করার আগে prepare করার জায়গা |

> [!example]
> ধরো তুমি একটা website বানাচ্ছো। Git দিয়ে প্রতিটা feature যোগ করার পর commit করবে। কিছু ভাঙলে আগের commit এ ফিরে যাবে। Team এর সবাই নিজ নিজ branch এ কাজ করবে, শেষে merge করবে।

## Summary

Git হলো version control — কোডের প্রতিটা version save করে রাখে। নাম আর email configure করে শুরু করা যায়। পরের chapter এ basic workflow (init, add, commit) শিখবো।