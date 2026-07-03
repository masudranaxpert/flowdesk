## Rebase কী?

`git rebase` হলো branch এর commit গুলোকে নতুন base এর উপর replay করা। সহজ কথায় — তোমার branch এর "ground" পাল্টে দেওয়া, যেন মনে হয় তুমি সবসময় latest code থেকে শুরু করেছিলে।

```
Rebase আগে:
main:     A ── B ── C ── D
                    \
feature:              E ── F

Rebase পরে:
main:     A ── B ── C ── D
                            \
feature:                      E' ── F'  (replayed!)
```

> [!note]
> Rebase মানে হলো feature branch এর commit গুলো নেওয়া হয়, main এর latest commit এর পরে একে একে আবার apply করা হয়। Commit গুলোর hash change হয় (E হয়ে E' হয়) কারণ নতুন parent তে apply হচ্ছে। কিন্তু ভেতরের change একই থাকে।

## Basic Rebase

```bash
# feature branch এ আছো
git switch feature

# main এর উপর rebase করো
git rebase main
```

```text
Successfully rebased and updated refs/heads/feature.
```

```bash
# এখন feature এর সব commit main এর উপরে চলে এসেছে
# fast-forward merge করলেই হলো
git switch main
git merge feature   # fast-forward, কোনো merge commit নেই!
```

> [!tip]
> Rebase এর সবচেয়ে বড় সুবিধা — history linear আর পরিষ্কার থাকে। Merge এর মতো extra merge commit তৈরি হয় না। Feature branch history দেখতে সোজা লাইনের মতো।

## Interactive Rebase — Commit গুলো Edit করা

`git rebase -i` দিয়ে commit গুলো squash, reword, reorder, এমনকি drop করা যায়:

```bash
git rebase -i HEAD~3
```

```text
pick a1b2c3d feat: login UI
pick d4e5f6g fix: typo in button text
pick h7i8j9k feat: logout function

# Commands:
# pick   = যেমন আছে রাখো
# reword = commit message বদলাও
# squash = আগের commit এর সাথে মিলিয়ে দাও
# drop   = মুছে ফেলো
# সবার উপর থেকে তলার দিকে সাজাও
```

```text
# squash দিয়ে ৩টা commit কে ১টা বানাই
pick a1b2c3d feat: login UI
squash d4e5f6g fix: typo in button text
squash h7i8j9k feat: logout function
```

> [!example]
> Feature বানানোর সময় অনেক ছোট ছোট commit হয় — "fix typo", "wip", "test"। PR দেওয়ার আগে `rebase -i` দিয়ে এগুলো এক clean commit এ squash করে দাও। Reviewer দেখবে একটা পরিষ্কার commit, ভেতরে কোনো noise নেই।

## Rebase vs Merge

| Feature | Rebase | Merge |
|---------|--------|-------|
| History | Linear, clean | Merge commit সহ, preserve |
| Commit hash | Change হয় | একই থাকে |
| কখন | local feature branch | public/shared branch |
| Conflict | প্রতিটা commit এ হতে পারে | একবারে হয় |

```bash
# Rebase workflow (clean history, recommend!)
git switch feature
git rebase main
git switch main
git merge feature        # fast-forward — clean!

# Merge workflow (preserve history)
git switch main
git merge feature        # merge commit create হবে
```

> [!danger]
> **কখনো public/shared branch rebase করবে না!** যেমন `main` বা teammate এর branch। Rebase করলে commit hash পাল্টে যায়, teammate এর local history এর সাথে conflict হবে, সব ভেঙে পড়বে। শুধু local feature branch rebase করো।

## Rebase Conflict Resolve

Rebase এর সময় conflict হলে প্রতিটা commit এ resolve করতে হয়:

```bash
git rebase main

# CONFLICT!
# ফাইল edit করে conflict resolve করো
git add .
git rebase --continue

# একটা commit skip করতে চাও?
git rebase --skip

# পুরো rebase বাতিল!
git rebase --abort
```

> [!warn]
> Rebase এ conflict প্রতিটা commit এ আলাদাভাবে resolve করতে হয় — merge এর মতো একবারে নয়। এটা কিছুটা বিরক্তিকর। তাই feature branch এ commit বেশি থাকলে `rebase -i` দিয়ে আগে squash করে নাও, তারপর rebase করো।

## git stash — Work-in-Progress সরিয়ে রাখা

কাজ চলছে, commit করতে চাও না, কিন্তু branch change করতে হবে — তখন `stash`:

```bash
# বর্তমান কাজ stash এ রাখো
git stash

# এখন working directory clean — branch change করো
git switch main
git pull

# ফিরে এসে stash ফেরত নাও
git switch feature
git stash pop
```

```bash
# Multiple stash
git stash list
# stash@{0}: WIP on feature: a1b2c3d
# stash@{1}: WIP on main: d4e5f6g

# নির্দিষ্ট stash apply
git stash apply stash@{1}

# Stash with message
git stash push -m "half-done login feature"

# Stash মুছে ফেলো
git stash drop stash@{0}
```

> [!tip]
> `stash` হলো কাজের মেজে জিনিস সরিয়ে রাখা আর দরকারে ফেরত নেওয়া। commit না করেই কাজ সংরক্ষণ করা যায়। `stash pop` দিলে stash apply আর delete একসাথে হয়। `stash apply` দিলে stash list এ থেকে যায় — নিরাপদ।

## git cherry-pick — নির্দিষ্ট Commit Apply

একটা branch এর নির্দিষ্ট commit অন্য branch এ apply করতে চাও:

```bash
# feature branch এ একটা দারুণ commit আছে
# শুধু সেটা main এ নিয়ে যেতে চাও

git switch main
git cherry-pick a1b2c3d   # commit hash
```

```
main:     A ── B ── ── ── E'  (cherry-picked!)
                       /
feature:  A ── B ── C ── D
```

> [!note]
> Cherry-pick দিয়ে এক commit এর change অন্য branch এ apply করা যায়। Hotfix main এ লাগলে কিন্তু feature branch এ ও দরকার — তখন cherry-pick। তবে নিয়মিত workflow এর জন্য merge/rebase ব্যবহার করো, cherry-pick শুধু specific case এ।

## git reflog — Lifesaver!

ভুলে branch delete করে ফেলেছো? Rebase ভুল করেছো? `reflog` দিয়ে সব recover করা যায়:

```bash
# সব reference log দেখো
git reflog
```

```text
a1b2c3d HEAD@{0}: rebase: checkout main
d4e5f6g HEAD@{1}: commit: feat: new feature
h7i8j9k HEAD@{2}: checkout: moving to feature
```

```bash
# ভুলে delete করা branch recover
git switch -b recovered-branch HEAD@{2}

# অথবা নির্দিষ্ট hash এ যাও
git reset --hard HEAD@{5}
```

> [!danger]
> `git reflog` হলো তোমার lifesaver! Git প্রায় সব কিছুর reference রাখে — এমনকি "deleted" commit ও। প্যানিক করবে না, প্রথমে `git reflog` চালাও। কোনো commit সত্যিকারে হারায় না — শুধু reflog থেকে খুঁজে বের করতে হয়।

## Modern Commands — switch আর restore

```bash
# পুরোনো — checkout সব কাজ করে, confuse হওয়ার সুযোগ
git checkout feature
git checkout -- file.txt

# নতুন — পরিষ্কার, specific
git switch feature        # branch change
git switch -c new-branch  # branch তৈরি আর switch
git restore file.txt      # file আগের state এ ফেরত
git restore --staged file.txt  # unstage (keep changes)
```

> [!tip]
> `git checkout` এক command অনেক কাজ করে — branch switch, file restore, সব। Confuse হওয়া সহজ। নতুন `git switch` (branch) আর `git restore` (file) পরিষ্কার — প্রতিটার নির্দিষ্ট কাজ। Modern Git এ সবসময় এগুলো ব্যবহার করো।

## Summary

`git rebase` দিয়ে commit গুলো clean linear history তে সাজানো যায়। `rebase -i` দিয়ে squash/reword/reorder। Public branch কখনো rebase করবে না! `git stash` দিয়ে work-in-progress সরিয়ে রাখো। `git cherry-pick` দিয়ে নির্দিষ্ট commit apply করো। `git reflog` হলো সব ভুল recover করার lifesaver। নতুন `git switch`/`git restore` ব্যবহার করো। পরের chapter এ tags আর releases শিখবো।