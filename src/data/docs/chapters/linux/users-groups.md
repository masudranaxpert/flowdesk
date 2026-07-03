## Linux-এ User আর Group কী?

Linux একটা multi-user system — মানে এক মেশিনে অনেক মানুষ কাজ করতে পারে, আর প্রত্যেকের আলাদা identity আছে। এই identity-ই হলো "user"। আর related user-দের একসাথে group করে রাখা যায় — যেমন `docker` group, `sudo` group, `www-data` group।

দ্রুত নিজের identity চেক করো:

```bash
whoami        # তোমার username
id            # uid, gid, আর কোন কোন group-এ আছো তার পূর্ণ তালিকা
```

`id` চালালে এরকম দেখবে:

```text
uid=1000(devuser) gid=1000(devuser) groups=1000(devuser),27(sudo),998(docker)
```

এর মানে — `devuser` নামের user-টার `uid` হলো 1000, আর সে `sudo` আর `docker` group-এও আছে।

## User Management — তৈরি, পরিবর্তন, মুছে ফেলা

নতুন user বানাও:

```bash
sudo useradd -m -s /bin/bash devuser
sudo passwd devuser
```

`-m` ফ্ল্যাগ দিলে home directory তৈরি হয় (`/home/devuser`), `-s /bin/bash` দিলে default shell হিসেবে bash সেট হয়।

User মুছে ফেলতে চাইলে:

```bash
sudo userdel -r devuser   # -r = home directory সহ মুছে ফেলো
```

## Group ও `usermod -aG`

Group হলো একদল user-কে একসাথে manage করার উপায়। নতুন group বানাও:

```bash
sudo groupadd developers
```

এবার user-কে একটা group-এ যোগ করো — এখানে একটা **খুব গুরুত্বপূর্ণ ব্যাপার** আছে:

```bash
sudo usermod -aG docker devuser
```

> [!warn] `-aG` লেখো, শুধু `-G` না
> `-aG` (append to group) ব্যবহার করলে নতুন group যোগ হয় বাকি group-গুলো রেখে। শুধু `-G` দিলে সে **আগের সব group মুছে দিয়ে** শুধু নতুনটা রাখে — এটা ভুল হয়ে গেলে অনেক permission নষ্ট হয়ে যায়।

## sudo — কেন আর কীভাবে কাজ করে

`sudo` মানে "superuser do" — নিজে root হওয়া ছাড়াই একটা নির্দিষ্ট command কে root permission-এ চালানো। root হলো Linux-এর সর্বোচ্চ authority — uid 0।

কারা কারা `sudo` চালাতে পারবে সেটা একটা config file-এ লেখা থাকে: `/etc/sudoers`। কিন্তু এই file **কখনো সরাসরি `vim` বা `nano` দিয়ে edit করবে না** — syntax ভুল করলে সব sudo ভেঙে যাবে। এর জন্য আছে `visudo`:

```bash
sudo visudo
```

এটা edit করার সময় syntax check করে, তাই নিরাপদ। এখানে একটা line দেখতে পাবে:

```text
%sudo   ALL=(ALL:ALL) ALL
```

মানে — `sudo` group-এর যে কেউ যে কোনো machine-এ যে কোনো user হিসেবে যে কোনো command চালাতে পারবে।

> [!danger] Root হিসেবে কাজ করা কেন খারাপ
> Root হিসেবে রুটিন কাজ করলে একটা typo-ই পুরো system নষ্ট করে দিতে পারে — যেমন `rm -rf /`। আর সব app যদি root-এ চলে তাহলে security-র পুরো কনসেপ্টই মিটে যায়। তাই সবসময় সাধারণ user হিসেবে থেকে শুধু দরকার হলে `sudo` ব্যবহার করো।

## Ownership — `chown` আর `chmod`

প্রতিটা file-এর একজন owner user আর একটা owner group থাকে। দেখতে চাইলে:

```bash
ls -l myfile.txt
# -rw-r--r-- 1 devuser developers 2048 Jul 3 10:00 myfile.txt
```

Owner বদলাতে চাইলে:

```bash
sudo chown devuser:developers myfile.txt
```

## User বদলানো — `su -`

মাঝে মাঝে অন্য user হিসেবে login করতে হয়। তখন:

```bash
su - devuser       # devuser হিসেবে login (password চাইবে)
su -               # root হিসেবে login
```

`-` (dash) দেওয়া মানে — সেই user-এর পুরো environment (PATH, home directory) লোড হবে, না হলে শুধু identity বদলাবে কিন্তু environment আগেরটাই থাকবে।

## Practical — Dev User তৈরি করে Docker Group-এ যোগ করা

```bash
# নতুন dev user তৈরি করো
sudo useradd -m -s /bin/bash devuser
sudo passwd devuser

# sudo আর docker group-এ যোগ করো
sudo usermod -aG sudo devuser
sudo usermod -aG docker devuser

# নিশ্চিত করো
id devuser

# এবার devuser হিসেবে login করে docker চালাও — sudo ছাড়াই চলবে
su - devuser
docker ps
```

> [!tip] Docker group-এর security নোট
> `docker` group-এ থাকলে সে user আসলে root-level access পেয়ে যায় (কারণ container mount করে root filesystem access করা যায়)। তাই শুধু যাদের আসলেই দরকার তাদেরকেই এই group-এ রাখো।