# Shell Scripting বেসিক

এতকর আমরা terminal এ এক এক করে command লিখেছি। কিন্তু কী হবে যদি ১০টা command একসাথে চালাতে হয়? বারবার একই command টাইপ করতে হয়? এখানেই **shell script** আসে। একটা file এ অনেক command লিখে রাখলে, সেটা একসাথে চলবে — আর বারবার চালানো যাবে।

## Shell Script কী?

Shell script হলো একটা text file যেখানে Linux command গুলো পরপর লেখা থাকে। এই file টা execute করলে command গুলো একে একে চলে। এটা দিয়ে automate, backup, system task — সব করা যায়।

```text
  script.sh (text file)
  ┌──────────────────────┐
  │ #!/bin/bash           │
  │ echo "Step 1"         │
  │ mkdir backup          │
  │ cp * backup/          │
  │ echo "Done!"          │
  └──────────────────────┘
            ↓ execute
  সব command পরপর চলবে
```

> [!note]
> Shell script কে programming language ও বলা যায় — variable, loop, condition, function সব আছে। কিন্তু এটা specially command line কাজের জন্য design করা। Python এর মতো general purpose না।

## Shebang

প্রতিটা shell script এর প্রথম লাইনে **shebang** থাকে। এটা system কে বলে কোন shell দিয়ে script টা চালাতে হবে।

```bash
#!/bin/bash          # bash দিয়ে চালাও
#!/bin/sh            # POSIX sh দিয়ে চালাও (portable)
#!/usr/bin/env bash  # যেটা খুঁজে পাবে সেটা দিয়ে
```

`#!` হলো shebang symbol, আর `/bin/bash` হলো shell এর path। এটা না দিলে script টা default shell এ চলবে, যেটা অন্য system এ অন্যরকম হতে পারে — তখন problem হবে।

> [!tip]
> Shebang সবসময় প্রথম লাইনে হবে, কোনো space বা empty line ছাড়া। নাহলে কাজ করবে না। আর script কে execute permission দিতে হবে: `chmod +x script.sh`।

## প্রথম Script

চলো একটা সহজ script লিখি:

```bash
#!/bin/bash
# My first script

echo "Hello, World!"
echo "আজকের তারিখ: $(date)"
echo "তুমি আছো: $(pwd)"
```

এই file কে `hello.sh` নামে save করো। তারপর:

```bash
# execute permission দাও
chmod +x hello.sh

# চালাও
./hello.sh
```

```
Hello, World!
আজকের তারিখ: Fri Jul 3 14:30:00 UTC 2026
তুমি আছো: /home/rahim
```

## Variables

Variable দিয়ে data store করা যায়। খেয়াল রাখবে — সমান চিহ্নের দুই পাশে কোনো space না।

```bash
#!/bin/bash

name="Rahim"
age=25
PI=3.14

echo "নাম: $name"
echo "বয়স: $age"

# command এর output কে variable এ রাখো
current_date=$(date +%Y-%m-%d)
user_count=$(who | wc -l)

echo "আজ: $current_date"
echo "Login করা user: $user_count জন"
```

> [!warn]
> `name = "Rahim"` লিখলে error হবে — সমান চিহ্নের দুই পাশে space থাকলে bash ভাববে এটা একটা command। সবসময় `name="Rahim"` এভাবে লিখবে।

## User Input নেওয়া

`read` দিয়ে user এর কাছ থেকে input নেওয়া যায়।

```bash
#!/bin/bash

read -p "তোমার নাম কী? " username
read -p "কত বছরের project? " years

echo "হ্যালো $username! $years বছরের project — দারুণ!"

# hidden input (password এর জন্য)
read -s -p "Password: " pass
```

## if / else

Condition অনুযায়ী সিদ্ধান্ত নেওয়া যায়।

```bash
#!/bin/bash

age=20

if [ $age -ge 18 ]; then
    echo "তুমি adult"
else
    echo "তুমি এখনো minor"
fi
```

Comparison operator গুলো:

| Operator | মানে | String |
|----------|------|--------|
| `-eq` | সমান (number) | `=` |
| `-ne` | সমান না | `!=` |
| `-gt` | বড় | — |
| `-lt` | ছোট | — |
| `-ge` | বড় বা সমান | — |
| `-le` | ছোট বা সমান | — |

```bash
# file check
if [ -f "config.txt" ]; then
    echo "file আছে"
fi

# directory check
if [ -d "backup" ]; then
    echo "folder আছে"
fi

# একাধিক condition (AND)
if [ $age -gt 18 ] && [ $age -lt 60 ]; then
    echo "working age"
fi
```

## case

অনেক condition থাকলে `case` ব্যবহার করো।

```bash
#!/bin/bash

read -p "কোন দিন? " day

case $day in
    "Saturday"|"Sunday")
        echo "ছুটির দিন!"
        ;;
    "Friday")
        echo "Jumma, half day"
        ;;
    *)
        echo "working day"
        ;;
esac
```

## Loop গুলো

### for Loop

```bash
#!/bin/bash

# list এর উপর loop
for name in Rahim Karim Jamal; do
    echo "হ্যালো, $name"
done

# number range
for i in {1..5}; do
    echo "Count: $i"
done

# C-style for loop
for ((i=0; i<5; i++)); do
    echo "Index: $i"
done
```

### while Loop

```bash
#!/bin/bash

count=1
while [ $count -le 5 ]; do
    echo "Count: $count"
    ((count++))
done

# file এর প্রতিটা line পড়ো
while read line; do
    echo "Line: $line"
done < data.txt
```

> [!tip]
> যখন একটা file এর প্রতিটা line process করতে হবে, `while read line` pattern টা খুব কাজে দেয়। এটা দিয়ে CSV parse করা যায়, config file পড়া যায়।

## Functions

একই কাজ বারবার না করে function বানিয়ে রাখা যায়।

```bash
#!/bin/bash

greet() {
    local name=$1
    echo "হ্যালো, $name! স্বাগতম।"
}

add() {
    local a=$1
    local b=$2
    echo $((a + b))
}

greet "Rahim"
result=$(add 10 20)
echo "10 + 20 = $result"
```

```bash
#!/bin/bash
# function with return value

is_even() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0    # true
    else
        return 1    # false
    fi
}

if is_even 10; then
    echo "10 জোড় সংখ্যা"
fi
```

## Arrays আর String Manipulation

```bash
#!/bin/bash

fruits=("Apple" "Banana" "Cherry" "Mango")

echo "প্রথম: ${fruits[0]}"
echo "সব: ${fruits[@]}"
echo "সংখ্যা: ${#fruits[@]}"

for fruit in "${fruits[@]}"; do
    echo "ফল: $fruit"
done

# নতুন element যোগ
fruits+=("Orange")

# String manipulation
text="Hello, World!"
echo "Length: ${#text}"
echo "Uppercase: ${text^^}"
echo "Lowercase: ${text,,}"
echo "Substring: ${text:0:5}"
echo "Replace: ${text/World/Linux}"
```

## Exit Codes আর Command Substitution

প্রতিটা command শেষ হওয়ার পর একটা **exit code** দেয়। `0` মানে success, অন্য যেকোনো number মানে error।

```bash
#!/bin/bash

mkdir /test_folder

if [ $? -eq 0 ]; then
    echo "folder তৈরি হয়েছে"
else
    echo "error হয়েছে!"
fi

# command substitution
today=$(date +%Y-%m-%d)
file_count=$(ls | wc -l)
echo "আজ: $today, মোট file: $file_count"

# explicit exit code
exit 0    # success
exit 1    # error
```

> [!note]
> `$?` দিয়ে আগের command এর exit code দেখা যায়। এটা script এ error handling এর মূল ভিত্তি। প্রতিটা গুরুত্বপূর্ণ command এর পর check করা ভালো।

## Practical Script: Backup

একটা practical backup script:

```bash
#!/bin/bash
# Backup important files

SOURCE="$HOME/Documents"
BACKUP_DIR="$HOME/backup"
DATE=$(date +%Y%m%d_%H%M%S)
ARCHIVE="backup_$DATE.tar.gz"

if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "backup folder তৈরি হলো"
fi

tar -czf "$BACKUP_DIR/$ARCHIVE" "$SOURCE"

if [ $? -eq 0 ]; then
    echo "✅ Backup successful: $ARCHIVE"
    echo "Size: $(du -h $BACKUP_DIR/$ARCHIVE | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi
```

> [!example]
> এই script টা Documents folder কে compressed archive বানিয়ে backup folder এ রাখে। প্রতিবার চালালে timestamp সহ নতুন file তৈরি হবে। এটাকে cron job এ দিলে daily automatic backup হবে।

## Script Debug

কোনো script ঠিক কাজ করছে না? Debug mode তে চালাও:

```bash
# প্রতিটা command আগে দেখাও
bash -x script.sh

# script এর ভেতরে debug on
set -x    # debug start
# ... command গুলো ...
set +x    # debug stop
```

> [!tip]
> Production script এর শুরুতে `set -e` দিয়ে রাখলে, কোনো command fail করলে পুরো script থামবে। এতে আধা কাজ হওয়ার ঝামেলা থাকে না। আর `set -u` দিলে undefined variable এ error দেবে।

## Summary

Shell script দিয়ে বারবার করা কাজ automate করা যায়। Shebang, variable, condition, loop, function — এগুলোই মূল। Backup script তৈরি করতে পারলে তুমি ready। পরের chapter এ Caddy web server নিয়ে শুরু করবো — Linux এর এই জ্ঞান সেখানে কাজে লাগবে।