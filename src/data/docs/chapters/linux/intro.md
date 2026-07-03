# Linux ও Terminal পরিচিতি

Linux হলো দুনিয়ার সবচেয়ে বেশি ব্যবহৃত operating system গুলোর একটা। বিশ্বাস করতে পারো না? যেটা দিয়ে তুমি এই মুহূর্তে ইন্টারনেট ব্যবহার করছো, যে server এ Google আর Facebook চলে, যে IoT device গুলো ঘরে ঘরে আছে — প্রায় সব জায়গাতেই Linux আছে। এই chapter এ আমরা Linux আর terminal এর সাথে পরিচিত হবো।

## Linux কী?

Linux হলো একটা **open-source operating system kernel**। Linus Torvalds 1991 সালে এটা বানিয়েছিলেন। বলা যায় — Windows বা macOS এর মতোই একটা OS, কিন্তু সবচেয়ে বড় পার্থক্য হলো Linux সম্পূর্ণ **free** আর **open-source**। কেউ লুকিয়ে রাখে না ভেতরে কী আছে, কেউ টাকা চায় না।

> [!note]
> Linux technically শুধু একটা **kernel** — হার্ডওয়্যার আর software এর মাঝে যোগাযোগ করার যেটা। কিন্তু সবাই পুরো OS কেই Linux বলে। আসলে পুরো প্যাকেজ কে বলে **Linux distribution** বা সংক্ষেপে **distro**।

## Linux কেন শিখবে?

তুমি হয়তো ভাবছো — আমি তো Python শিখবো, ML শিখবো, তাহলে Linux কেন লাগবে? এর উত্তর হলো:

| কারণ | ব্যাখ্যা |
|------|----------|
| **Server এ Linux** | দুনিয়ার ৯৬% server Linux এ চলে। Deploy করতে গেলে Linux জানা লাগবে |
| **Free আর Open** | কোনো লাইসেন্স ফি নেই, সব ফ্রি |
| **Secure** | Windows এর তুলনায় virus আর malware অনেক কম |
| **CLI Power** | Terminal দিয়ে যা করা যায়, GUI দিয়ে তার অর্ধেকও নয় |
| **Developer Friendly** | Python, Docker, Git — সব tool Linux এ সবচেয়ে ভালো চলে |
| **ML/AI** | GPU, CUDA, training — সব Linux এ সবচেয়ে stable |

> [!tip]
> তুমি যদি ML বা backend developer হতে চাও, তাহলে Linux জানা বাধ্যতামূলক। Windows এ কাজ করলেও deploy করার সময় Linux server এ যেতে হবে।

## Linux Distribution (Distro) গুলো

Linux কে নিজে নিজে install করা যায় না — kernel এর সাথে আরও অনেক tool যোগ করে একটা পুরো package বানানো হয়। এই package গুলোকেই distro বলে। কয়েকটা জনপ্রিয় distro দেখি:

```text
        Linux Kernel (core)
              |
   +----------+----------+
   |          |          |
 Ubuntu    Fedora     Arch
 (easy)   (modern)  (DIY/custom)
   |          |          |
 Debian    CentOS    Manjaro
 (stable)  (server)  (beginner-arch)
```

| Distro | কে ব্যবহার করে | বৈশিষ্ট্য |
|--------|---------------|----------|
| **Ubuntu** | Beginner আর developer | সবচেয়ে জনপ্রিয়, সহজ, অনেক documentation |
| **Debian** | Server, stability প্রিয় | অনেক stable, Ubuntu এর parent |
| **Fedora** | Latest feature প্রিয় | Red Hat এর upstream, bleeding edge |
| **Arch** | Power user, DIY প্রিয় | নিজে নিজে সব configure করতে হয় |
| **CentOS / Rocky** | Enterprise server | Red Hat এর free version |

> [!example]
> তুমি beginner হলে **Ubuntu 24.04 LTS** দিয়ে শুরু করো। এটা সবচেয়ে beginner-friendly আর সব tool এর support পাওয়া যায়। LTS মানে Long Term Support — ৫ বছর support পাবে।

## Terminal কী?

**Terminal** হলো সেই জায়গা যেখানে তুমি text দিয়ে computer কে command দাও। Windows এ এটাকে Command Prompt বা PowerShell বলে। Linux এ সবচেয়ে বেশি কাজ হয় terminal দিয়েই।

```text
+------------------------------------------+
|  user@ubuntu:~$                          |
|  > ls                                    |
|  > cd Documents                          |
|  > python script.py                      |
+------------------------------------------+
         Text-based interface
```

> [!note]
> Terminal হলো শুধু একটা window। ভেতরে যে program command গুলো চালায় তাকে **shell** বলে। Bash হলো Linux এ default shell।

## প্রথম Command গুলো

চলো একদম বেসিক কিছু command শিখি। Terminal খুলে এগুলো একটা একটা করে চালাও।

### pwd — কোথায় আছো?

`pwd` মানে **print working directory**। এটা বলে দেবে তুমি এই মুহূর্তে কোন folder এ আছো।

```bash
pwd
```

```
/home/rahim
```

### ls — কী কী আছে?

`ls` দিয়ে দেখো এই folder এ কী কী file আছে।

```bash
ls
```

```
Desktop  Documents  Downloads  Music  Pictures  Videos
```

আরও detail দেখতে `-l` flag দাও:

```bash
ls -l
```

```
drwxr-xr-x 2 rahim rahim 4096 Jan 15 10:30 Desktop
-rw-r--r-- 1 rahim rahim  220 Jan 15 09:15 notes.txt
```

### cd — Folder পরিবর্তন

`cd` মানে **change directory**। অন্য folder এ যেতে:

```bash
# Documents folder এ যাও
cd Documents

# এক ধাপ উপরে যাও
cd ..

# সরাসরি home এ যাও
cd ~
```

### whoami — কে আমি?

```bash
whoami
```

```
rahim
```

### echo — কিছু print করো

```bash
echo "Hello Linux!"
echo "আমার নাম রহিম"
```

```
Hello Linux!
আমার নাম রহিম
```

> [!tip]
> তুমি terminal এ যে command গুলো লেখো, সেগুলো history তে save থাকে। উপরের তীর ↑ চাপলে আগের command গুলো আসবে। আবার চালাতে পারবে সহজেই।

## Shell এর ধরন

Shell হলো সেই program যেটা তোমার command বুঝে আর execute করে। কয়েক ধরনের shell আছে:

| Shell | বৈশিষ্ট্য |
|-------|----------|
| **bash** | সবচেয়ে বেশি ব্যবহৃত, default প্রায় সব distro তে |
| **zsh** | bash এর advanced version, autocomplete ভালো |
| **fish** | সবচেয়ে user-friendly, color suggestion দেয় |

```bash
# তোমার shell কোনটা চেক করো
echo $SHELL
```

```
/bin/bash
```

> [!note]
> macOS এ default shell এখন zsh। অনেকে macOS এ Oh My Zsh ব্যবহার করে যা terminal কে সুন্দর আর powerful করে।

## Linux File System Hierarchy

Windows এ C:, D: এর মতো drive থাকে। কিন্তু Linux এ সব কিছু একটা **tree** এর মতো সাজানো — root `/` থেকে শুরু।

```text
/
├── home/       ← তোমার personal file গুলো
│   └── rahim/
│       ├── Documents/
│       └── Downloads/
├── etc/        ← configuration file গুলো
├── var/        ← log, cache, variable data
├── usr/        ← installed program আর library
├── bin/        ← essential command (ls, cd, cat)
├── tmp/        ← temporary file
└── dev/        ← device file (USB, disk)
```

| Folder | কী থাকে |
|--------|---------|
| `/home` | প্রতিটা user এর নিজস্ব personal folder |
| `/etc` | System আর program এর config file |
| `/var` | Log file, database, mail ইত্যাদি |
| `/usr` | User program, library, documentation |
| `/bin` | Essential binary (ls, cp, mv এর মতো command) |
| `/tmp` | Temporary file — reboot হলে মুছে যায় |
| `/dev` | Hardware device গুলো file হিসেবে |

> [!warn]
> Linux এ সব কিছু file — এমনকি hardware ও। `/dev/sda` হলো তোমার hard disk! এই concept টা শুরুতে অদ্ভুত লাগতে পারে, কিন্তু অভ্যস্ত হলে খুব powerful।

## Command চালানোর কিছু Tip

কিছু ছোট কিন্তু কাজের command আর shortcut:

```bash
# clear screen
clear

# কোনো command এর manual দেখো
man ls

# command এর short help
ls --help

# আগের command history
history
```

> [!tip] Keyboard Shortcut
> `Ctrl + L` দিলে screen clear হবে (clear command এর মতো)।
> `Ctrl + C` দিলে চলমান command থামবে।
> `Tab` চাপলে filename বা command autocomplete হবে।

## Linux কোথায় পাবে — ছাড়াই Install না করে

Linux install না করেও try করা যায়:

1. **WSL (Windows Subsystem for Linux)** — Windows এ Linux চালাও
2. **Virtual Box / VMWare** — Virtual machine বানাও
3. **Live USB** — Pendrive থেকে boot করে try করো
4. **Docker** — Container এ Linux environment

```bash
# Windows এ WSL install
wsl --install
```

> [!example]
> তুমি Windows এ কাজ করো, কিন্তু Linux ও লাগে। তখন WSL সবচেয়ে ভালো option। Visual Studio Code এর সাথে WSL integrate হয়, তাই development experience অনেক smooth হয়।

## Summary

Linux হলো open-source OS, server আর developer দের প্রথম পছন্দ। Ubuntu দিয়ে শুরু করলে সবচেয়ে সহজ হবে। Terminal দিয়ে command চালানো শিখলে অনেক কাজ দ্রুত করা যায়। `pwd`, `ls`, `cd`, `whoami`, `echo` — এই পাঁচটা command দিয়ে শুরু করো। পরের chapter এ file system আর permission নিয়ে detail এ দেখবো।