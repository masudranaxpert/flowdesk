## IP Address আর Interface দেখা

আগে সবাই `ifconfig` ব্যবহার করত, কিন্তু সেটা এখন deprecated — modern Linux-এ `ip` command ব্যবহার করো:

```bash
ip addr           # সব interface-এর IP address
ip -br addr       # compact view — শুধু নাম আর IP
ip route          # routing table — default gateway সহ
```

`ip -br addr` চালালে এরকম পাবে:

```text
lo               UNKNOWN        127.0.0.1/8 ::1/128
eth0             UP             192.168.1.50/24 fe80::a00:27ff:fe4e:66a1/64
```

এখানে `eth0` হলো তোমার main network interface, আর `lo` হলো loopback (localhost)।

## Ping — সংযোগ আছে কি নেই?

```bash
ping -c 4 8.8.8.8         # Google DNS-এ 4টা packet পাঠাও
ping -c 4 google.com      # hostname-ও দেওয়া যায়
```

`-c 4` মানে শুধু 4 বার। না দিলে অনন্তকাল চলতে থাকবে।

## Port আর Open Connection — `ss`

আগে `netstat` ছিল popular, কিন্তু এখন আধুনিক replacement হলো `ss` (socket statistics):

```bash
ss -tulpn
```

ফ্ল্যাগগুলোর মানে:
- `-t` = TCP
- `-u` = UDP
- `-l` = শুধু listening port
- `-p` = কোন process ব্যবহার করছে
- `-n` = numeric (hostname resolve না করে সরাসরি নাম্বার দেখাও)

এরকম output পাবে:

```text
LISTEN  0  128  0.0.0.0:80   0.0.0.0:*  users:(("nginx",pid=1234,fd=6))
LISTEN  0  128  0.0.0.0:22   0.0.0.0:*  users:(("sshd",pid=5678,fd=3))
```

> [!tip] Port conflict debug
> কোনো app চালাতে গিয়ে "address already in use" এলে `sudo ss -tulpn | grep :8080` চালাও — কোন process ধরে রেখেছে সেটা জানতে পারবে।

## curl — API Request করা

`curl` হলো সবচেয়ে essential tool — HTTP request করার জন্য:

```bash
# GET request
curl https://api.github.com/users/octocat

# শুধু headers দেখতে (status code, content-type)
curl -I https://example.com

# POST request করে JSON পাঠানো
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahim","email":"rahim@example.com"}'

# Authorization header সহ
curl -H "Authorization: Bearer mytoken123" https://api.example.com/me
```

## SSH — সুরক্ষিত Remote Login

SSH মানে হলো একটা সুরক্ষিত টানেল, যেটা দিয়ে তুমি অন্য কম্পিউটারে নিরাপদে ঢুকতে পারবে — password plain text-এ যায় না, সব traffic encrypted।

প্রথমে key pair তৈরি করো:

```bash
ssh-keygen -t ed25519 -C "devuser@laptop"
```

এটা দুটা file বানায়:
- `~/.ssh/id_ed25519` — private key (এটা **কারো সাথে শেয়ার করবে না**)
- `~/.ssh/id_ed25519.pub` — public key (এটা server-এ দিতে হয়)

Server-এ public key কপি করো:

```bash
ssh-copy-id user@server-ip
# এবার থেকে password ছাড়াই login হবে
ssh user@server-ip
```

> [!warn] Private key কখনো Git-এ push করবে না
> `id_ed25519` (private key) যদি কেউ পেয়ে যায়, সে তোমার সব server-এ ঢুকতে পারবে। এটা সবসময় local-এ থাকবে, permission `600` হবে।

### SSH Config — বারবার IP না মনে রাখতে চাইলে

`~/.ssh/config` file বানাও:

```text
Host myserver
    HostName 192.168.1.100
    User devuser
    IdentityFile ~/.ssh/id_ed25519
    Port 2222
```

এবার শুধু এতটুকু লিখলেই হবে:

```bash
ssh myserver
```

## scp আর rsync — File কপি করা

```bash
# scp — সহজ কিন্তু simple
scp myfile.txt user@server:/home/user/

# rsync — বড় file বা অনেক file-এর জন্য ভালো, শুধু পরিবর্তিত অংশ পাঠায়
rsync -avz ./project/ user@server:/home/user/project/
```

`-a` = archive mode (permission, symlink সহ), `-v` = verbose, `-z` = compress।

## UFW Firewall

`ufw` (Uncomplicated Firewall) হলো Ubuntu-এর simple firewall tool:

```bash
sudo ufw allow 22         # SSH allow
sudo ufw allow 80         # HTTP allow
sudo ufw allow 443        # HTTPS allow
sudo ufw enable           # firewall চালু করো
sudo ufw status verbose   # কোন কোন port open আছে
```

> [!danger] UFW চালু করার আগে ভাবো
> যদি SSH port block হয়ে যায়, তাহলে remote server-ে আর ঢুকতে পারবে না। সবসময় আগে `sudo ufw allow 22` করে তারপর `ufw enable` করো।

## Practical — Server-এ SSH করে API Test করা

```bash
# ১. Server-এ login
ssh myserver

# ২. কোন port-গুলো open আছে দেখো
sudo ss -tulpn

# ৩. একটা public API কল করো
curl -s https://api.github.com/zen

# ৪. ফিরে এসে local file server-এ পাঠাও
rsync -avz ./deploy.sh myserver:/home/devuser/
```