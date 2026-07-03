## Distro Family — কোন প্যাকেজ ম্যানেজার?

Linux-এর অনেক পরিবার (distro family) আছে, আর প্রত্যেক পরিবারের নিজস্ব package manager আছে:

| Distro Family | Package Manager | উদাহরণ |
|---|---|---|
| Debian / Ubuntu | `apt` (`.deb`) | Ubuntu, Mint, Pop!_OS |
| Red Hat / Fedora | `dnf` (`.rpm`) | Fedora, RHEL, CentOS Stream |
| Arch | `pacman` | Arch, Manjaro, EndeavourOS |
| SUSE | `zypper` | openSUSE |

> [!note] কোনটা শিখবে?
> Server-এর জগতে Ubuntu/Debian সবচেয়ে বেশি চলে, তাই `apt` ভালোভাবে শিখলেই ৮০% কাজ চলে যাবে। বাকিগুলো দেখলেই বুঝে যাবে — concept একই।

## apt — Debian/Ubuntu-র প্যাকেজ ম্যানেজার

সবচেয়ে common কাজগুলো:

```bash
# ১. package list আপডেট করো (কিছু install করার আগে সবসময় করো)
sudo apt update

# ২. সব installed package আপডেট করো
sudo apt upgrade

# ৩. নতুন package install করো
sudo apt install nginx

# ৪. package মুছে ফেলো
sudo apt remove nginx          # শুধু binary
sudo apt purge nginx           # config file সহ মুছে ফেলো

# ৫. একসাথে কয়েকটা install
sudo apt install git curl wget vim

# ৬. package খুঁজে বের করো
apt search python3
apt show nginx                 # বিস্তারিত তথ্য দেখো
```

> [!tip] `update` আর `upgrade` এক না
> `apt update` শুধু available package-এর list রিফ্রেশ করে — কিছু install করে না। `apt upgrade` আসলে update করে install করা package-গুলো। এই দুটো নাম একটু confusing করে রাখা।

## PPA — Personal Package Archive

কখনো official repository-তে নতুন version থাকে না। তখন PPA ব্যবহার করা যায় (Ubuntu-তে):

```bash
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.12
```

> [!warn] PPA-র ঝুঁকি
> যেকোনো PPA যোগ করলে সেই maintainer-কে তোমার system-এ package install করার permission দেওয়া হয়। তাই শুধু well-known, trusted PPA ব্যবহার করো।

## Snap আর Flatpak — Universal Package

নতুন দুটা universal packaging system এসেছে যেগুলো distro-independent:

| Feature | Snap | Flatpak |
|---|---|---|
| কোন company | Canonical (Ubuntu) | Red Hat সমর্থিত |
| কোন ক্ষেত্রে ভালো | CLI tools, server apps | Desktop GUI apps |
| Sandboxed | হ্যাঁ | হ্যাঁ |

```bash
# Snap উদাহরণ
sudo snap install code --classic

# Flatpak উদাহরণ
flatpak install flathub com.spotify.Client
```

সাধারণত: server-এর জন্য `apt` আর `snap` কাজে লাগে, desktop app-এর জন্য `flatpak` বা `snap` ভালো।

## `.deb` ফাইল সরাসরি Install

মাঝে মাঝে কোনো software-এর website থেকে `.deb` ফাইল ডাউনলোড করতে হয়:

```bash
wget https://example.com/package_1.0_amd64.deb
sudo dpkg -i package_1.0_amd64.deb

# যদি dependency মিস করে, এটা ঠিক করো
sudo apt --fix-broken install
```

## `apt-file` — কোন Package-এ কোন File

মাঝে মাঝে দরকার হয় — "এই `.so` file কোন package-এ আছে?"

```bash
sudo apt install apt-file
sudo apt-file update
apt-file search libssl.so    # কোন package-এ এই file আছে
```

## Package Hold — আপডেট থামিয়ে রাখা

কোনো specific package যদি আপডেট করতে না চাও:

```bash
sudo apt-mark hold nginx
sudo apt-mark unhold nginx
```

## Practical — nginx আর Node.js Install

```bash
# ১. প্রথমে package list আপডেট
sudo apt update && sudo apt upgrade -y

# ২. nginx install করো
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# ৩. Node.js (NodeSource repository থেকে নতুন version)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# ৪. ভার্সন চেক করো
nginx -v
node -v
npm -v
```

> [!example] কেন সরাসরি `apt install nodejs` করি না?
> Ubuntu-র default repository-তে পুরোনো Node version থাকে। NodeSource repository যোগ করলে সবসময় latest LTS পাওয়া যায়। এটাই modern উপায়।