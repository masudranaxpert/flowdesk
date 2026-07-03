# Process আর Text Tools

এই chapter এ আমরা দুইটা জিনিস শিখবো — এক হলো Linux এ **process** কীভাবে চলে আর control করা যায়, আর দুই হলো text নিয়ে কাজ করার powerful tool গুলো। এই tool গুলো শিখলে তুমি এক লাইনে এমন কাজ করতে পারবে যা GUI দিয়ে করতে ঘণ্টা লাগবে।

## Process কী?

Linux এ যেকোনো চলমান program কে **process** বলে। তুমি terminal খুললে ওটাও একটা process। Browser খুললে সেটাও process। প্রতিটা process এর একটা unique **PID** (Process ID) থাকে।

```text
  Program (file)  →  Execute  →  Process (running)
  script.sh                    PID: 1234
```

> [!note]
> একই program থেকে একাধিক process চলতে পারে। যেমন তুমি ৩ বার Firefox খুললে ৩টা আলাদা process তৈরি হবে, প্রতিটার PID আলাদা।

## ps — Process দেখা

`ps` দিয়ে চলমান process গুলো দেখা যায়।

```bash
# বর্তমান terminal এর process গুলো
ps

# সব process detail সহ দেখো
ps aux
```

```
USER   PID  %CPU %MEM    VSZ   RSS TTY   STAT START  TIME COMMAND
rahim  1234  2.3  1.5 123456 12345 ?    S    10:30  0:05 python app.py
rahim  1235  0.0  0.1  12345  2345 ?    S    10:31  0:00 nginx
root   1     0.0  0.5 123456 12345 ?    Ss   09:00  0:02 /sbin/init
```

| Column | মানে |
|--------|------|
| `USER` | কোন user এর process |
| `PID` | Process ID |
| `%CPU` | CPU এর কত % ব্যবহার করছে |
| `%MEM` | Memory এর কত % ব্যবহার করছে |
| `COMMAND` | কোন command থেকে শুরু হয়েছে |

```bash
# নির্দিষ্ট নাম দিয়ে process খোঁজো
ps aux | grep python
```

## top আর htop — Live Monitoring

`top` দিয়ে real-time এ process আর resource ব্যবহার দেখা যায়।

```bash
top
```

`htop` হলো `top` এর সুন্দর আর interactive version।

```bash
# install করো (Ubuntu)
sudo apt install htop

# চালাও
htop
```

> [!tip]
> `htop` চালালে color coded আর mouse support সহ একটা dashboard দেখবে। F9 চাপলে যেকোনো process kill করা যায় সহজেই। Server debug করার সময় খুব কাজে দেয়।

## kill — Process থামানো

`kill` দিয়ে কোনো process কে terminate করা যায়। PID লাগবে।

```bash
# নরমাল terminate (SIGTERM)
kill 1234

# জোর করে থামাও (SIGKILL — যদি normal kill এ না থামে)
kill -9 1234

# নাম দিয়ে kill করো
killall firefox
pkill -f "python app.py"
```

| Signal | Number | কাজ |
|--------|--------|-----|
| `SIGTERM` | 15 | নরমাল request করে থামাতে |
| `SIGKILL` | 9 | জোর করে থামায়, process পারবে না save |
| `SIGHUP` | 1 | Config reload করতে বলে |
| `SIGINT` | 2 | `Ctrl + C` এর মতো |

> [!warn]
> `kill -9` সবসময় শেষ option। এটা process কে কোনো cleanup করার সুযোগ না দিয়ে থামিয়ে দেয়। Database বা file write করছিল তো data নষ্ট হতে পারে।

## jobs, bg, fg — Background Process

কোনো command কে background এ পাঠানো যায়, যাতে terminal ফাঁকা থাকে।

```bash
# command এর শেষে & দিলে background এ চলবে
python app.py &

# চলমান command কে pause করো: Ctrl + Z
# এরপর background এ পাঠাও
bg

# সব background job দেখো
jobs

# আবার foreground এ আনো
fg %1
```

```
[1]+  Running    python app.py &
```

> [!example]
> তুমি একটা বড় ML training চালাচ্ছো। সেটা `&` দিয়ে background এ পাঠাও। এরপর terminal দিয়ে অন্য কাজ করতে পারবে। `jobs` দিয়ে check করবে training চলছে কিনা।

## Pipe (|) — Command গুলোকে জোড়া

Pipe হলো Linux এর সবচেয়ে powerful concept। এক command এর output কে আরেকটার input বানানো যায়।

```text
command1  |  command2  |  command3
  output      input        input
            =           =
```

```bash
# ls এর output কে grep করো
ls | grep ".py"

# পুরো file list কে sort করো
ls -la | sort

# কতগুলো file আছে গুনো
ls | wc -l
```

> [!tip]
> Pipe এর সৌন্দর্য হলো — তুমি ছোট ছোট command গুলো জোড়া লাগিয়ে বড় কাজ করতে পারো। এটাকে **composability** বলে। Unix philosophy এর মূল ভিত্তি এটাই।

## grep — Text খোঁজা

`grep` দিয়ে কোনো text বা pattern খোঁজা যায়।

```bash
# file এ "error" শব্দ খোঁজো
grep "error" app.log

# case-insensitive খোঁজো
grep -i "error" app.log

# line number সহ দেখাও
grep -n "import" main.py

# মিল না হওয়া line দেখাও (inverse)
grep -v "comment" data.txt

# recursive খোঁজো পুরো folder এ
grep -r "TODO" .
```

```bash
grep -rn "def " src/
```

```
src/main.py:15:def calculate(x, y):
src/utils.py:8:def helper(name):
```

> [!note]
> `grep -rn` হলো developer এর সবচেয়ে ব্যবহৃত combination। পুরো codebase এ কোনো function বা variable কোথায় defined আছে সেটা খুঁজে বের করতে।

## sed — Stream Editor

`sed` দিয়ে text পরিবর্তন করা যায়, file edit না করেই।

```bash
# "foo" কে "bar" দিয়ে replace করো (প্রতিটা line এ প্রথমটা)
sed 's/foo/bar/' file.txt

# সব occurrence replace করো
sed 's/foo/bar/g' file.txt

# আসল file ই modify করো
sed -i 's/foo/bar/g' file.txt

# নির্দিষ্ট line delete করো
sed '5d' file.txt
```

## awk — Column Processor

`awk` column ভিত্তিক কাজে দারুণ powerful।

```bash
# ২য় column দেখাও
awk '{print $2}' data.txt

# একটা condition দিয়ে filter
awk '$3 > 50 {print $1, $3}' scores.txt

# delimiter হিসেবে comma (CSV এর জন্য)
awk -F',' '{print $1, $2}' data.csv
```

```bash
# ps এর output থেকে শুধু PID আর COMMAND দেখাও
ps aux | awk '{print $2, $11}'
```

## cut, sort, uniq

ছোট কিন্তু কাজের আরও কিছু tool:

```bash
# নির্দিষ্ট field কেটে নাও (delimiter সহ)
cut -d: -f1 /etc/passwd

# sort করো
sort names.txt
sort -n numbers.txt       # numeric sort
sort -r numbers.txt       # reverse

# ডুপ্লিকেট সরাও (আগে sort করা লাগে)
sort names.txt | uniq
sort names.txt | uniq -c  # count সহ
```

## head, tail, wc

```bash
# file এর প্রথম 10 line
head file.txt
head -n 20 file.txt       # 20 line

# শেষের 10 line
tail file.txt
tail -n 5 file.txt        # শেষের 5 line

# live এ দেখো (log file এর জন্য)
tail -f /var/log/syslog

# word/line/character count
wc file.txt
wc -l file.txt            # শুধু line count
```

> [!tip]
> `tail -f` হলো log debugging এর সবচেয়ে ব্যবহৃত tool। Server এ কী হচ্ছে real-time এ দেখতে পারবে। নতুন log আসলে সাথে সাথে দেখাবে।

## tee — Output দুই জায়গায়

`tee` দিয়ে output একই সাথে screen এ আর file এ save করা যায়।

```bash
# output দেখাও আর সাথে file এ ও save করো
ls -la | tee output.txt

# append করো
ls -la | tee -a output.txt
```

## xargs — Input কে Argument

`xargs` এক command এর output কে আরেকটার argument বানায়।

```bash
# খোঁজা file গুলো delete করো
find . -name "*.tmp" | xargs rm

# প্রতিটা file এর জন্য আলাদা command
find . -name "*.py" | xargs wc -l
```

## find — File খোঁজা

`find` দিয়ে condition অনুযায়ী file খোঁজা যায়।

```bash
# নাম দিয়ে খোঁজো
find . -name "*.py"

# type দিয়ে (f=file, d=directory)
find . -type d -name "test"

# size দিয়ে (100MB এর বড়)
find . -size +100M

# সম্প্রতি modify হওয়া (৭ দিনের মধ্যে)
find . -mtime -7

# খুঁজে delete করো
find . -name "*.log" -delete
```

## Real-World Pipeline

সব tool গুলো জোড়া লাগিয়ে একটা real example:

```bash
# error log গুলো খুঁজে কতবার আসছে count করো, top 10 দেখাও
grep "ERROR" app.log | awk '{print $5}' | sort | uniq -c | sort -rn | head -10
```

এই এক লাইন কী করলো:
1. `grep` দিয়ে শুধু ERROR line গুলো বের করলো
2. `awk` দিয়ে ৫ম column (error code) নিলো
3. `sort` করলো
4. `uniq -c` দিয়ে গুনলো প্রতিটা কতবার এসেছে
5. `sort -rn` দিয়ে count অনুযায়ী descending সাজালো
6. `head -10` দিয়ে শীর্ষ ১০টা দেখালো

> [!example]
> এই pipeline টা হলো আসলে একটা mini data analysis tool। Log file থেকে সবচেয়ে বেশি আসা error গুলো বের করছে — সব এক লাইনে। এটাই Linux command line এর power।

## Summary

Process control আর text tool গুলো Linux এর power এর মূল। `ps` আর `kill` দিয়ে process manage করো। Pipe দিয়ে ছোট tool গুলো জোড়া দিয়ে বড় কাজ করো। `grep`, `sed`, `awk`, `find` — এগুলো developer এর daily tool। পরের chapter এ shell scripting শিখবো যেখানে এই command গুলো এক script এ automate করা যাবে।