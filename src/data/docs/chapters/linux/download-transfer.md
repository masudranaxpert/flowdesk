## File Download ও Transfer

Linux server এ কাজ করতে গেলে ফাইল download করা আর machine এর মধ্যে transfer করা রোজের কাজ। এই chapter এ আমরা `wget`, `curl`, `scp`, `rsync`, আর `sftp` — পাঁচটা গুরুত্বপূর্ণ tool শিখব। প্রতিটার নিজস্ব use case আছে।

## wget — File Download

`wget` হলো non-interactive file downloader। এটা বিশেষ করে script বা background এ বড় ফাইল download করতে দারুণ। `-c` flag দিয়ে interrupted download resume করা যায়, আর recursive download ও support করে।

```bash
# Download a single file
wget https://example.com/file.zip

# Download and save with a different name
wget -O myname.zip https://example.com/file.zip

# Resume an interrupted download
wget -c https://example.com/large_file.iso

# Download to a specific directory
wget -P /tmp/downloads/ https://example.com/file.zip

# Download in background (large files)
wget -b https://example.com/huge_backup.tar.gz
```

`wget` দিয়ে পুরো website mirror করা যায়। `-r` (recursive), `-l` (level), `-k` (convert links) flag ব্যবহার করে offline browsing এর জন্য site save করা সম্ভব।

```bash
# Mirror an entire website for offline use
wget -m -k -K -E https://example.com/

# Download all PDF files from a page
wget -r -l1 -A.pdf -nd https://example.com/docs/

# Download with authentication
wget --user=username --password=secret https://example.com/protected/file.zip
```

## curl — HTTP Swiss Army Knife

`curl` হলো শুধু download নয় — পুরো HTTP protocol এর সাথে কাজ করার tool। API testing, header inspection, POST request — সব করা যায়। `-o` output file define করে, `-L` redirect follow করে, `-H` custom header পাঠায়।

```bash
# Download a file (output to stdout)
curl https://example.com/file.txt

# Download and save to file
curl -o file.zip https://example.com/file.zip

# Follow redirects (important for shortened URLs)
curl -L -o final.zip https://short.url/abc123

# Show response headers only
curl -I https://example.com/

# Silent progress bar with error output
curl -s -o file.zip https://example.com/file.zip
```

API testing এর জন্য `curl` অপরিহার্য। GET, POST, PUT, DELETE — সব HTTP method support করে। `-d` দিয়ে data, `-H` দিয়ে header পাঠানো যায়।

```bash
# Send a GET request with custom header
curl -H "Authorization: Bearer token123" \
     -H "Accept: application/json" \
     https://api.example.com/users

# Send a POST request with JSON body
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"Karim","age":25}' \
     https://api.example.com/users

# Send form data
curl -X POST \
     -d "username=karim&password=secret" \
     https://api.example.com/login

# Download with resume support
curl -C - -o largefile.iso https://example.com/largefile.iso
```

## scp — Secure Copy

`scp` (Secure Copy Protocol) দিয়ে SSH এর মাধ্যমে machine এর মধ্যে ফাইল transfer করা যায়। syntax সহজ — `scp source destination`। remote machine `user@host:path` format এ লেখা হয়।

```bash
# Copy local file to remote server
scp file.zip user@192.168.1.100:/home/user/

# Copy remote file to local machine
scp user@192.168.1.100:/var/log/app.log ./

# Copy entire directory recursively (-r)
scp -r myproject/ user@server:/opt/apps/

# Use a specific SSH port (-P, capital P)
scp -P 2222 file.zip user@server:/tmp/

# Copy between two remote servers
scp user@server1:/data/file.txt user@server2:/backup/
```

> [!warning] scp deprecated হচ্ছে
> # OpenSSH 9.0 থেকে `scp` protocol পুরনো RCP protocol থেকে SFTP protocol এ পরিবর্তন করা হয়েছে। নতুন প্রজেক্টে `rsync` ব্যবহার করা ভালো — বেশি feature, ভালো performance, আর scp এর কিছু known bug নেই।

## rsync — Incremental Sync

`rsync` হলো সবচেয়ে powerful file transfer tool। এটা শুধু changed portion transfer করে, তাই দ্রুত আর bandwidth-efficient। `-a` (archive mode = recursive + preserve permissions/timestamps), `-v` (verbose), `-z` (compress during transfer) — এই তিন flag সবচেয়ে common।

```bash
# Basic sync (local to remote)
rsync -avz myfolder/ user@server:/path/to/destination/

# Sync remote to local
rsync -avz user@server:/data/ ./local_backup/

# Local sync (like a smart copy)
rsync -avz /source/ /destination/

# Dry run - see what would happen without actually doing it
rsync -avzn /source/ /destination/
```

`--delete` flag দিয়ে destination এ extra ফাইল থাকলে সেগুলো মুছে ফেলা হয় — source আর destination exactly same হয়ে যায়। `--exclude` দিয়ে নির্দিষ্ট pattern বাদ দেওয়া যায়।

```bash
# Mirror source to destination (delete extras)
rsync -avz --delete /source/ /backup/

# Exclude specific patterns
rsync -avz --exclude="node_modules/" \
           --exclude=".git/" \
           --exclude="*.pyc" \
           /project/ user@server:/deploy/

# Show progress during transfer
rsync -avz --progress /large_data/ user@server:/backup/

# Resume interrupted transfer (--partial)
rsync -avz --partial --progress /bigfile.iso user@server:/storage/
```

## sftp — Interactive File Transfer

`sftp` হলো interactive file transfer session। `scp` এর মতো one-shot নয় — একটা session খোলে, তারপর multiple command দেওয়া যায়। FTP এর secure version, SSH এর উপর চলে।

```bash
# Connect to a remote server
sftp user@server

# Once connected, common commands:
# put local_file remote_path    - upload
# get remote_file local_path    - download
# ls, cd, pwd                   - navigate remote
# lls, lcd, lpwd                - navigate local
# mkdir, rmdir, rm              - remote file operations
# exit                          - close session
```

নিচে একটা সম্পূর্ণ sftp session এর উদাহরণ দেখানো হলো — connect করা থেকে শুরু করে file upload/download পর্যন্ত।

```text
sftp> cd /var/www/uploads
sftp> put local_report.csv
Uploading local_report.csv to /var/www/uploads/local_report.csv
local_report.csv       100% 245KB   8.2MB/s   00:00
sftp> ls
local_report.csv    data.csv       config.yml
sftp> get data.csv ./
Fetching /var/www/uploads/data.csv to data.csv
sftp> exit
```

## Comparison Table

| Tool | Type | Use Case | Key Feature |
|------|------|----------|-------------|
| `wget` | Download | বড় ফাইল, batch download | Recursive, resume, background |
| `curl` | HTTP tool | API testing, সাধারণ download | All HTTP methods, headers |
| `scp` | Transfer | দ্রুত one-time copy | Simple syntax, SSH-based |
| `rsync` | Sync | Backup, incremental sync | Delta transfer, --delete |
| `sftp` | Interactive | Manual file management | Session-based, ls/cd/put/get |

## Practical Examples

### rsync দিয়ে Backup

প্রতিদিনের backup এর জন্য rsync সেরা। শুধু changed files transfer হয়, তাই দ্রুত। `--backup` আর `--backup-dir` option দিয়ে আগের version ও রাখা যায়।

```bash
#!/bin/bash
# Daily backup script with rsync
# -a: archive mode, -v: verbose, -z: compress
# --delete: remove deleted files from backup
# --backup: keep overwritten files
# --backup-dir: where to store old versions

DATE=$(date +%Y%m%d)
rsync -avz \
  --delete \
  --backup \
  --backup-dir="/backup/incremental/$DATE" \
  /home/user/projects/ \
  /backup/current/
```

### বড় ফাইল Resume সহ Download

বড় ফাইল download করার সময় connection চলে গেলে পুরো ফাইল আবার শুরু করতে হয় না। `wget -c` বা `curl -C -` দিয়ে resume করা যায়।

```bash
# wget resume
wget -c https://example.com/ubuntu-24.04.iso

# curl resume
curl -C - -o ubuntu.iso https://example.com/ubuntu-24.04.iso

# rsync resume (for partially transferred files)
rsync --partial --progress \
  user@server:/data/large_dataset.tar.gz ./
```

### SSH Key সেট আপ

প্রতিবার password টাইপ না করতে চাইলে SSH key ব্যবহার করা উচিত। `ssh-keygen` দিয়ে key pair তৈরি করে `ssh-copy-id` দিয়ে remote server এ যোগ করা হয়।

```bash
# Generate SSH key pair (press Enter for defaults)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to remote server
ssh-copy-id user@server

# Now scp/rsync/sftp will work without password
scp file.zip user@server:/path/
```

> [!tip] rsync trailing slash খুব গুরুত্বপূর্ণ
> # `rsync folder/ dest/` আর `rsync folder dest/` আলাদা কাজ করে। প্রথমটি `folder` এর ভিতরের content copy করে `dest/` তে। দ্বিতীয়টি `folder` নামের directory টা itself copy করে `dest/folder/` এ। Trailing slash ভুল হলে data ভুল জায়গায় যেতে পারে।