# ফাইল সিস্টেম আর Permission

আগের chapter এ আমরা দেখেছি Linux এ সব কিছু file — folder ও file। এবার দেখবো এই file গুলো কীভাবে organize করা আছে, path কীভাবে কাজ করে, আর সবচেয়ে গুরুত্বপূর্ণ — **permission** কীভাবে কাজ করে। Linux এ permission না বুঝলে অনেক কাজেই আটকে যাবে।

## File System Tree

Linux এ পুরো file system একটা **inverted tree** এর মতো। সবার উপরে `/` (root), তার নিচে folder গুলো।

```text
           /  (root)
          /|\
         / | \
      home etc var
       |
     rahim
      |
   Documents/
      |
   notes.txt
```

প্রতিটা file বা folder এর একটা unique **path** থাকে — root থেকে ওই file পর্যন্ত যাওয়ার রাস্তা।

## Absolute vs Relative Path

দুই ভাবে path লেখা যায়:

| Type | উদাহরণ | ব্যাখ্যা |
|------|---------|----------|
| **Absolute** | `/home/rahim/Documents/notes.txt` | root `/` থেকে শুরু, পুরো address |
| **Relative** | `Documents/notes.txt` | বর্তমান folder থেকে শুরু |

```bash
# বর্তমানে আমি /home/rahim এ আছি
pwd
# /home/rahim

# Absolute path দিয়ে access
cat /home/rahim/Documents/notes.txt

# Relative path দিয়ে access (একই জিনিস)
cat Documents/notes.txt
```

কিছু special symbol:

| Symbol | মানে |
|--------|------|
| `.` | বর্তমান folder |
| `..` | এক ধাপ উপরের folder |
| `~` | home folder (`/home/rahim`) |
| `-` | আগের folder যেখানে ছিলে |

```bash
# home থেকে Documents এ যাও
cd Documents

# এক ধাপ উপরে ফিরে যাও (home এ)
cd ..

# Pictures এ যাও relative path দিয়ে
cd ../Pictures
```

> [!tip]
> Tab চাপলে terminal অটো path complete করবে। `/ho` লিখে Tab চাপলে `/home/` হয়ে যাবে। দ্রুত টাইপ করার সবচেয়ে ভালো উপায়।

## ls -la Output বোঝা

`ls -la` দিলে সব file আর detail দেখা যায়। এই output বুঝতে পারা খুব জরুরি:

```bash
ls -la
```

```
total 24
drwxr-xr-x 3 rahim rahim 4096 Jan 15 10:30 .
drwxr-xr-x 5 root  root  4096 Jan 14 18:00 ..
-rw-r--r-- 1 rahim rahim  220 Jan 15 09:15 notes.txt
-rwxr-xr-x 1 rahim rahim 8192 Jan 15 09:00 script.sh
```

প্রতিটা column এর মানে:

| Column | মানে | উদাহরণ |
|--------|------|---------|
| ১ম | Permission + type | `drwxr-xr-x` |
| ২য় | Hard link সংখ্যা | `3` |
| ৩য় | Owner (যার file) | `rahim` |
| ৪র্থ | Group | `rahim` |
| ৫ম | Size (byte) | `4096` |
| ৬ষ্ঠ | Modify হওয়ার date | `Jan 15 10:30` |
| ৭ম | File এর নাম | `notes.txt` |

> [!note]
> প্রথম column এর প্রথম character file এর ধরন বোঝায়: `-` হলো regular file, `d` হলো directory (folder), `l` হলো symlink।

## Permission Model (rwx)

Linux এ প্রতিটা file এর জন্য তিন ধরনের user আর তিন ধরনের permission থাকে।

**User category:**
- **Owner** — file টা যার
- **Group** — file এর group এর সদস্যরা
- **Others** — বাকি সবাই

**Permission:**
- **r** (read) — পড়া যায়
- **w** (write) — লেখা/পরিবর্তন করা যায়
- **x** (execute) — চালানো যায় (program/script হলে)

```text
  rwx     rwx     rwx
  ───     ───     ───
 Owner   Group   Others
```

উদাহরণ: `rw-r--r--`
- Owner: `rw-` (read আর write পারবে, execute পারবে না)
- Group: `r--` (শুধু read)
- Others: `r--` (শুধু read)

> [!example]
> ধরো একটা script.sh file এ permission `rwxr-xr--`। মানে owner সব পারবে, group শুধু read আর execute পারবে, others শুধু read পারবে।

## chmod — Permission পরিবর্তন

`chmod` দিয়ে permission পরিবর্তন করা হয়। দুই ভাবে করা যায় — symbolic আর numeric।

### Symbolic Method

```bash
# Owner কে execute permission দাও
chmod u+x script.sh

# Group থেকে write কেড়ে নাও
chmod g-w script.sh

# Others কে read আর execute দাও
chmod o+rx script.sh

# সবাইকে execute permission দাও
chmod a+x script.sh

# Owner কে সব, group কে read+execute, others কে শুধু read
chmod u=rwx,g=rx,o=r script.sh
```

| Symbol | মানে |
|--------|------|
| `u` | Owner (user) |
| `g` | Group |
| `o` | Others |
| `a` | All (সবাই) |
| `+` | Permission যোগ করো |
| `-` | Permission সরাও |
| `=` | ঠিক এতটুকু permission দাও |

### Numeric Method (Octal)

দ্রুত আর প্রফেশনাল উপায়। প্রতিটা permission এর একটা number থাকে:

| Permission | Number |
|------------|--------|
| `r` (read) | 4 |
| `w` (write) | 2 |
| `x` (execute) | 1 |

```bash
# 755 = rwxr-xr-x (owner সব, group আর others read+execute)
chmod 755 script.sh

# 644 = rw-r--r-- (owner read+write, others শুধু read)
chmod 644 notes.txt

# 600 = rw------- (শুধু owner read+write)
chmod 600 secret.txt

# 777 = rwxrwxrwx (সবাই সব — বিপজ্জনক!)
chmod 777 folder/
```

> [!danger]
> `chmod 777` কখনো production এ ব্যবহার করবে না। এর মানে সবাই সব করতে পারবে — এটা বড় security risk। শুধু তখনই ব্যবহার করবে যখন খুব দরকার আর বুঝে শুনে।

## chown আর chgrp

`chown` দিয়ে file এর owner পরিবর্তন করা যায়। `chgrp` দিয়ে group।

```bash
# file এর owner পরিবর্তন
sudo chown karim notes.txt

# owner আর group দুটোই পরিবর্তন
sudo chown karim:developers notes.txt

# শুধু group পরিবর্তন
sudo chgrp developers notes.txt

# পুরো folder recursively পরিবর্তন
sudo chown -R karim:developers project/
```

> [!warn]
> `chown` চালাতে সাধারণত root permission লাগে, তাই `sudo` দিতে হবে। ভুল owner সেট করলে অনেক program কাজ করবে না — যেমন web server এর file এর owner যদি ভুল হয়।

## umask — Default Permission

নতুন file তৈরি করলে default permission কত হবে সেটা `umask` নির্ধারণ করে।

```bash
# বর্তমান umask দেখো
umask
# 022

# umask সেট করো (আরও secure)
umask 027
```

| umask | File তৈরি হলে permission |
|-------|--------------------------|
| `022` | `rw-r--r--` (644) |
| `027` | `rw-r-----` (640) |
| `077` | `rw-------` (600) |

> [!tip]
> Server এ `umask 027` সেট করে রাখা ভালো। এতে নতুন file গুলো others দেখতেই পাবে না, security বাড়বে।

## Special Permission

তিনটা special permission আছে যা advanced scenario তে কাজে লাগে।

### SUID (Set User ID)

একটা program চালালে সেটা owner এর permission এ চলবে।

```bash
# SUID সেট করো (numeric: 4)
chmod 4755 program

# Symbolic
chmod u+s program
```

উদাহরণ: `passwd` command এ SUID আছে — সাধারণ user ও password পরিবর্তন করতে পারে কারণ এটা root এর privilege এ চলে।

### SGID (Set Group ID)

Folder এ দিলে নতুন file গুলো ঐ folder এর group inherit করে।

```bash
chmod 2755 shared_folder/
chmod g+s shared_folder/
```

### Sticky Bit

Folder এ দিলে শুধু owner ই নিজের file delete করতে পারবে। `/tmp` folder এ sticky bit থাকে।

```bash
chmod 1777 /tmp
chmod +t /tmp
```

```bash
# sticky bit আছে কিনা চেক করো
ls -ld /tmp
# drwxrwxrwt  — last t হলো sticky bit
```

> [!note]
> এই special permission গুলো শুরুতে একটু confusing লাগতে পারে। SUID আর SGID মূলত program কে temporary elevated permission দেয়। Sticky bit মূলত shared folder এ নিরাপত্তা দেয়।

## Practice Example

একটা practical scenario দেখি। ধরো তুমি একটা web project সেট আপ করছো:

```bash
# project folder বানাও
mkdir -p /var/www/myapp

# owner আর group সেট করো
sudo chown -R www-data:www-data /var/www/myapp

# folder এ 755, file এ 644 permission দাও
find /var/www/myapp -type d -exec chmod 755 {} \;
find /var/www/myapp -type f -exec chmod 644 {} \;

# verify করো
ls -la /var/www/myapp
```

> [!example]
> এই pattern টা প্রায় সব production server এ ব্যবহৃত হয়। Web server (যেমন Caddy, nginx) `www-data` user এ চলে, তাই file গুলোর owner সেটাই থাকে।

## Summary

Linux এ সব কিছু file আর folder tree তে সাজানো। Absolute আর relative path দুটোই কাজে লাগে। Permission মডেলে rwx আর owner/group/others থাকে। `chmod` দিয়ে permission, `chown` দিয়ে owner পরিবর্তন করা যায়। Numeric method (যেমন 755, 644) দ্রুত আর প্রফেশনাল। পরের chapter এ process আর text tools নিয়ে দেখবো।