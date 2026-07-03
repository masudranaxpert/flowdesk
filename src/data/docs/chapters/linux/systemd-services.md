## Systemd কী আর কেন দরকার?

systemd হলো Linux-এর init system — মানে boot হওয়ার সময় সবার আগে যে process চলে শুরু হয় (PID 1)। এর কাজ হলো বাকি সব service manage করা — কোনটা চালু হবে, কোনটা বন্ধ হবে, কোন ক্রমে চালু হবে, crash করলে আবার restart হবে কি না — এসব।

আধুনিক প্রায় সব Linux distro-তে (Ubuntu, Debian, Fedora, Arch) systemd-ই standard।

> [!note] systemd শুধু service-ই নয়
> systemd logging (`journalctl`), timer (cron-এর alternative), network management, mount — অনেক কিছু করে। আমরা এখানে service management-এর দিকে ফোকাস করব।

## systemctl — Service Control

সবচেয়ে common কমান্ডগুলো:

```bash
# service এখন কী অবস্থায় আছে
systemctl status nginx

# চালু করো / বন্ধ করো / রিস্টার্ট করো
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# boot হওয়ার সময় অটোমেটিক চালু হবে কি না
sudo systemctl enable nginx       # auto-start on boot
sudo systemctl disable nginx      # auto-start বন্ধ করো

# কনফিগ রিলোড (restart ছাড়া)
sudo systemctl reload nginx
```

`systemctl status nginx` চালালে এরকম দেখবে:

```text
● nginx.service - The nginx HTTP and reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: active (running) since Fri 2026-07-03 10:00:00 UTC
   Main PID: 1234 (nginx)
```

`active (running)` দেখলে বুঝবে ঠিক চলছে। `enabled` মানে boot-এ auto-start চালু।

## Unit কী?

systemd-তে সবকিছু এক একটা "unit"। কয়েক ধরনের unit আছে:

| Unit Type | কাজ | ফাইল এক্সটেনশন |
|---|---|---|
| `.service` | একটা background process | `.service` |
| `.timer` | নির্দিষ্ট সময়ে কিছু চালাও (cron-এর মতো) | `.timer` |
| `.target` | একগাদা unit-এর গ্রুপ | `.target` |
| `.socket` | socket-activated service | `.socket` |

সব active unit দেখতে:

```bash
systemctl list-units --type=service
systemctl list-units --state=running     # শুধু যেগুলো চলছে
systemctl list-unit-files --state=enabled # কোনগুলো auto-start চালু
```

## journalctl — Log দেখা

systemd-র নিজস্ব log system আছে — `journalctl` দিয়ে দেখা যায়:

```bash
# একটা specific service-এর সব log
journalctl -u nginx

# real-time follow (tail -f এর মতো)
journalctl -u nginx -f

# শেষ ১০০ লাইন
journalctl -u nginx -n 100

# আজকের log
journalctl -u nginx --since today

# নির্দিষ্ট সময় থেকে
journalctl --since "2026-07-03 10:00:00" --until "2026-07-03 12:00:00"

# error আর warning শুধু
journalctl -p err
```

> [!tip] Debug-এর সেরা বন্ধু
> কোনো service চালু হচ্ছে না? `sudo systemctl restart nginx && journalctl -u nginx -n 50 --no-pager` চালাও — error message তাড়াতাড়ি ধরা যাবে।

## Custom Service File লেখা

তোমার নিজের Node/Python app-কে systemd service বানাতে চাইলে একটা `.service` file লিখতে হবে।

```ini
# /etc/systemd/system/myapp.service

[Unit]
Description=My Node.js Application
After=network.target

[Service]
Type=simple
User=devuser
WorkingDirectory=/home/devuser/myapp
ExecStart=/usr/bin/node /home/devuser/myapp/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

প্রতিটা section-এর মানে:
- **`[Unit]`** — description আর dependency (নেটওয়ার্ক চালু হওয়ার পরে চালু হবে)
- **`[Service]`** — মূল config: কোন user, কোন directory, কোন command চালাবে, crash করলে কী হবে
- **`[Install]`** — boot-এর কোন stage-এ auto-start হবে

Python app-এর জন্য একই structure, শুধু `ExecStart` বদলাবে:

```ini
ExecStart=/home/devuser/myapp/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 app:app
```

## Service Activate করা

File লেখার পর এই কদমগুলো মনে রাখো:

```bash
# ১. systemd-কে বলো নতুন file পড়তে
sudo systemctl daemon-reload

# ২. চালু করো
sudo systemctl start myapp

# ৩. boot-এ auto-start চালু করো
sudo systemctl enable myapp

# ৪. status চেক করো
systemctl status myapp
```

> [!danger] daemon-reload কখন দরকার?
> `.service` file এডিট করার পর **সবসময়** `systemctl daemon-reload` চালাতে হবে। নাহলে systemd পুরোনো কনফিগ ব্যবহার করতে থাকবে — এটা ভুলে গেলে দিন-রাত debug করবে কেন পরিবর্তন কাজ করছে না।

## Practical — Node App-কে Auto-Start Service বানানো

ধরো তোমার Node app `/home/devuser/myapp/`-এ আছে। সম্পূর্ণ flow:

```bash
# ১. service file বানাও
sudo nano /etc/systemd/system/myapp.service
# (উপরের template বসাও, তোমার path অনুযায়ী)

# ২. systemd reload + enable + start
sudo systemctl daemon-reload
sudo systemctl enable myapp
sudo systemctl start myapp

# ৩. কাজ করছে কি না চেক করো
systemctl status myapp
curl http://localhost:3000

# ৪. log দেখো
journalctl -u myapp -f

# ৫. পরে আবার deploy করলে শুধু restart
sudo systemctl restart myapp
```

এবার তোমার app server restart হলেও অটোমেটিক চালু হবে, crash করলে ৫ সেকেন্ডে restart হবে — সব অটোমেটিক!