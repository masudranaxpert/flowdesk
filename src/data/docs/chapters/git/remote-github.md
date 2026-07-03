# Remote আর GitHub

এতক্ষণ পর্যন্ত সব কাজ local এ — নিজের কম্পিউটারে। কিন্তু বাস্তবে code cloud এ থাকে, যাতে team সবাই access করতে পারে আর backup ও থাকে। এই জন্য **GitHub** (বা GitLab, Bitbucket) ব্যবহার করা হয়।

## Remote কী?

Remote হলো একটা server এ stored repository — যেমন GitHub এ। তোমার local repo আর remote repo এর মধ্যে code sync করা হয়।

```
Local (তোমার PC)  ←→  Remote (GitHub server)
   git push →           ← git pull
```

| Term | মানে |
|------|------|
| **origin** | default remote এর নাম |
| **push** | local change remote এ পাঠানো |
| **pull** | remote change local এ আনা |
| **clone** | remote থেকে সম্পূর্ণ repo download |
| **fork** | অন্যের repo কে নিজের account এ copy |

## GitHub এ Repository তৈরি

1. **github.com** এ account খোলো (না থাকলে)
2. "+" icon → "New repository" ক্লিক করো
3. Repository এর নাম দাও (যেমন `my_project`)
4. Public বা Private বেছে নাও
5. "Create repository" ক্লিক করো

GitHub তোমাকে command দেখাবে কীভাবে connect করতে হয়।

## Remote Connect করা — git remote add

Local repo কে GitHub এর সাথে connect করতে:

```bash
# প্রথমে local repo তৈরি (যদি না থাকে)
git init
git add .
git commit -m "initial commit"

# Remote যোগ করো
git remote add origin https://github.com/tumar-username/my_project.git

# Verify
git remote -v
```

```
origin  https://github.com/tumar-username/my_project.git (fetch)
origin  https://github.com/tumar-username/my_project.git (push)
```

> [!note]
> `origin` হলো remote এর নাম — এটা convention। তুমি চাইলে অন্য নাম ও দিতে পারো, কিন্তু সবাই `origin` ব্যবহার করে।

## Push — Local থেকে Remote এ

Local commit গুলো remote এ পাঠাতে `git push`:

```bash
# প্রথম বার: -u flag লাগে upstream set করতে
git push -u origin main
```

```
Enumerating objects: 5, done.
Writing objects: 100% (5/5), 450 bytes
To https://github.com/tumar-username/my_project.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

এরপর থেকে শুধু:

```bash
git push
```

> [!tip]
- প্রথম push এ `-u` দিলে পরে আর branch name লিখতে হবে না। Git মনে রাখবে `main` track করে `origin/main` কে।

## Pull — Remote থেকে Local এ

Team এর কেউ remote এ code push করলে তোমার local এ আনতে হবে:

```bash
git pull
```

```
Updating a1b2c3d..b2c3d4e
Fast-forward
 app.py | 5 +++--
 1 file changed, 3 insertions(+), 2 deletions(-)
```

> [!danger]
> Push করার আগে সবসময় `git pull` করবে। নাহলে remote এ new commit থাকলে push reject হবে। তখন pull করে resolve করে আবার push করতে হবে।

## Clone — Remote থেকে সম্পূর্ণ Download

GitHub এ কোনো repo থাকলে সেটা সম্পূর্ণ local এ নামিয়ে আনা:

```bash
git clone https://github.com/username/repo-name.git
```

```
Cloning into 'repo-name'...
remote: Enumerating objects: 50, done.
Receiving objects: 100% (50/50), done.
```

এখন `repo-name` নামে একটা folder তৈরি হবে পুরো project সহ।

```bash
cd repo-name
git log --oneline   # সব history দেখো
```

> [!example]
> যেকোনো open source project (React, TensorFlow, Linux kernel) তুমি clone করে নিজের কম্পিউটারে দেখতে পারো। এটাই open source এর power।

## Fork — অন্যের Repo কে Copy

Fork হলো অন্য person এর repo কে তোমার নিজের GitHub account এ copy করা। তারপর তুমি নিজের মতো করে edit করতে পারো:

1. GitHub এ যেকোনো repo তে যাও
2. "Fork" button এ ক্লিক করো
3. তোমার account এ একটা copy তৈরি হবে
4. সেটা clone করে local এ কাজ করো

## Pull Request (PR) Flow

Pull Request হলো তোমার change গুলো main project এ যোগ করার request। এটাই open source contribution এর মূল প্রক্রিয়া:

```
Step ১: Fork করো
Step ২: Clone করো
Step ৩: Feature branch বানাও
Step ৪: কোড change করো আর commit
Step ৫: তোমার fork এ push করো
Step ৬: GitHub এ Pull Request খোলো
```

```bash
# Fork করার পর
git clone https://github.com/tumar-username/their-project.git
cd their-project

# Feature branch
git switch -c fix-typo

# Change করো
echo "fixed" > README.md
git add .
git commit -m "docs: typo fix"

# Push
git push origin fix-typo
```

এরপর GitHub এ গিয়ে "Compare & pull request" button এ ক্লিক করো।

> [!tip]
> Pull Request খুললে project maintainer তোমার code review করবে। সব ঠিক থাকলে merge করবে। মতামত দিলে সে অনুযায়ী আবার update করতে হবে।

## SSH Key Setup (Optional but Recommended)

HTTPS এর বদলে SSH দিয়ে connect করলে বারবার password দিতে হবে না:

```bash
# SSH key তৈরি
ssh-keygen -t ed25519 -C "tumar@email.com"

# Public key দেখো
cat ~/.ssh/id_ed25519.pub
```

এই public key টা GitHub → Settings → SSH Keys এ paste করো। এরপর remote URL SSH তে বদলাও:

```bash
git remote set-url origin git@github.com:username/repo.git
```

> [!note]
> SSH key একবার সেট করলে push/pull এ আর password লাগবে না। Professional developer সবাই SSH ব্যবহার করে।

## Common Remote Command গুলো

| Command | কাজ |
|---------|-----|
| `git remote -v` | সব remote দেখো |
| `git remote add origin <url>` | নতুন remote যোগ |
| `git push origin main` | main branch push |
| `git pull origin main` | main branch pull |
| `git clone <url>` | remote repo download |
| `git remote remove origin` | remote বাদ দাও |

## Daily Team Workflow

```bash
# সকালে শুরু
git pull origin main

# Feature branch বানাও
git switch -c feature-dashboard

# কাজ করো, commit করো
git add .
git commit -m "feat: dashboard UI"

# Push করো
git push origin feature-dashboard

# GitHub এ PR খোলো → Review → Merge

# পরের দিন আবার
git switch main
git pull origin main  # team এর নতুন কাজ আনো
```

## Summary

Remote দিয়ে local আর server (GitHub) এর মধ্যে sync করা হয়। `clone` দিয়ে download, `push` দিয়ে upload, `pull` দিয়ে update আনা। Fork আর PR দিয়ে open source এ contribute করা যায়। পরের chapter এ CI/CD আর GitHub Actions শিখবো।