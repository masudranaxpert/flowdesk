## Archive ও Compression

Linux এ কাজ করতে গেলে ফাইল compress করা আর extract করা রোজের কাজ। Backup নেওয়া, বড় ফাইল transfer করা, কিংবা software package download করা — সবখানেই compression দরকার। এই chapter এ আমরা zip, tar, gzip, bzip2, xz, আর 7z — সব গুরুত্বপূর্ণ format শিখব।

## Archive vs Compression — পার্থক্য

দুটো জিনিস আলাদা, কিন্তু মানুষ একটা বুঝায়:

- **Archive** — অনেক ফাইলকে একটা ফাইলে প্যাক করা (size কমানো ছাড়াই)। যেমন `tar`
- **Compression** — ফাইলের size কমানো, mathematical algorithm দিয়ে। যেমন `gzip`, `bzip2`

বেশিরভাগ tool দুটোই একসাথে করে। যেমন `tar.gz` — আগে archive করে (tar), তারপর compress করে (gzip)।

## zip ও unzip

`zip` হলো সবচেয়ে পরিচিত format — Windows আর Linux দুই জায়গাতেই কাজ করে। `zip -r` flag দিয়ে recursively folder প্যাক করা হয়, আর `unzip` দিয়ে extract করা হয়।

```bash
# Create a zip archive of an entire folder
zip -r project.zip myproject/

# Extract a zip archive
unzip project.zip

# Extract to a specific directory
unzip project.zip -d /tmp/output/

# View contents without extracting
unzip -l project.zip
```

নির্দিষ্ট ফাইল exclude করে zip বানাতে চাইলে `-x` flag ব্যবহার করা যায়। এটা দরকারি যখন `node_modules` বা `.git` folder বাদ দিতে চাও।

```bash
# Create zip excluding node_modules and .git
zip -r app.zip myapp/ -x "*/node_modules/*" "*/.git/*"

# Password protect a zip (interactive prompt)
zip -r secret.zip docs/ -e
```

## tar — Linux এর রাজা

`tar` (Tape ARchive) হলো Linux এর সবচেয়ে common archive tool। এটা শুধু archive করে, কিন্তু `-z` (gzip), `-j` (bzip2), বা `-J` (xz) flag যোগ করে compression ও করা যায়। flag এর অর্থ: `c` = create, `x` = extract, `v` = verbose, `f` = file।

```bash
# Create a plain tar archive (no compression)
tar -cvf archive.tar myfolder/

# Extract a tar archive
tar -xvf archive.tar

# Create tar.gz (gzip compressed) - most common on Linux
tar -czvf archive.tar.gz myfolder/

# Extract tar.gz
tar -xzvf archive.tar.gz

# Create tar.bz2 (better compression, slower)
tar -cjvf archive.tar.bz2 myfolder/

# Extract tar.bz2
tar -xjvf archive.tar.bz2

# View contents without extracting
tar -tvf archive.tar.gz
```

`tar` এ নির্দিষ্ট ফাইল বাদ দিতে `--exclude` option ব্যবহার করা হয়। pattern match করে যেকোনো path exclude করা যায়।

```bash
# Create tar.gz excluding specific directories
tar -czvf backup.tar.gz /home/user/ \
  --exclude="/home/user/.cache" \
  --exclude="/home/user/node_modules"

# Append files to existing tar
tar -rvf archive.tar newfile.txt
```

> [!tip] tar.gz হলো Linux standard
> # Linux দুনিয়ায় `tar.gz` হলো de facto standard। Software source code, backup, package — সবকিছুতেই এটা ব্যবহার হয়। Windows এ `.zip` common হলেও, Linux server এ তুমি সবচেয়ে বেশি `.tar.gz` দেখবে।

## gzip ও gunzip

`gzip` শুধু একটা ফাইল compress করে (archive করে না)। মূল ফাইলটা `.gz` হয়ে যায়। `gunzip` দিয়ে আবার আগের অবস্থায় ফিরে যায়। এটা বড় log file compress করতে খুব কাজে লাগে।

```bash
# Compress a single file
gzip largefile.log

# Decompress
gunzip largefile.log.gz

# Keep original file while compressing (-k)
gzip -k important.txt

# Compress with best ratio (-9 = max, -1 = fastest)
gzip -9 huge_data.csv
```

## bzip2

`bzip2` হলো `gzip` এর চেয়ে ভালো compression ratio দেয়, কিন্তু ধীর। text file এর জন্য বিশেষ কার্যকরী। একইভাবে `.bz2` extension হয়।

```bash
# Compress with bzip2
bzip2 bigtext.txt

# Decompress
bunzip2 bigtext.txt.bz2

# Keep original
bzip2 -k bigtext.txt
```

## xz

`xz` হলো সবচেয়ে ভালো compression ratio দেয় — কিন্তু সবচেয়ে ধীর। Linux kernel source আর অনেক package `.xz` format এ distribute করা হয় কারণ size ছোট হয়।

```bash
# Compress with xz
xz -z data.tar

# Decompress
xz -d data.tar.xz

# Extreme compression (-9e = extreme)
xz -9e -z huge_backup.tar
```

## 7z — 7-Zip

`7z` (7-Zip) হলো একটা powerful format যেটা LZMA/LZMA2 algorithm ব্যবহার করে। খুব ভালো compression ratio দেয় আর password protection + encryption support করে। `7z a` দিয়ে add/create, `7z x` দিয়ে extract করা হয়।

```bash
# Install 7zip on Ubuntu
sudo apt install p7zip-full

# Create a 7z archive
7z a archive.7z myfolder/

# Extract a 7z archive
7z x archive.7z

# Create encrypted archive with password
7z a -p -mhe=on secret.7z sensitive/
```

## Comparison Table — কোনটা কখন ব্যবহার করবে

| Format | Tool | Compression Ratio | Speed | Use Case |
|--------|------|:-:|:-:|----------|
| `.zip` | zip/unzip | মাঝারি | দ্রুত | Windows compatibility, সাধারণ |
| `.tar.gz` | tar + gzip | মাঝারি | দ্রুত | Linux standard, software package |
| `.tar.bz2` | tar + bzip2 | ভালো | ধীর | Text-heavy data, source code |
| `.tar.xz` | tar + xz | সেরা | সবচেয়ে ধীর | Linux kernel, বড় distribution |
| `.7z` | 7z | খুব ভালো | মাঝারি | Encryption, বড় archive |
| `.gz` | gzip/gunzip | মাঝারি | দ্রুত | Single file (log, txt) |

## Practical Examples

### বিভিন্ন Format Extract করা

Linux এ নানা format এর ফাইল download করতে হয়। প্রতিটার extract command আলাদা। নিচের উদাহরণে common format গুলোর extract command দেখানো হলো।

```bash
# .zip
unzip file.zip

# .tar
tar -xvf file.tar

# .tar.gz or .tgz
tar -xzvf file.tar.gz

# .tar.bz2
tar -xjvf file.tar.bz2

# .tar.xz
tar -xJvf file.tar.xz

# .7z
7z x file.7z

# .gz (single file, not archive)
gunzip file.gz

# .rar
unrar x file.rar
```

### Smart Extract Function

প্রতিবার format মনে রাখা কঠিন। একটা bash function বানিয়ে রাখলে যেকোনো format একটা command এ extract করা যায়। নিচের function টা `~/.bashrc` তে যোগ করলে `extract anyfile.zip` এভাবে ব্যবহার করা যাবে।

```bash
# Add to ~/.bashrc - smart extract function
extract() {
  if [ -f "$1" ]; then
    case "$1" in
      *.tar.bz2) tar -xjvf "$1" ;;
      *.tar.gz)  tar -xzvf "$1" ;;
      *.tar.xz)  tar -xJvf "$1" ;;
      *.bz2)     bunzip2 "$1" ;;
      *.rar)     unrar x "$1" ;;
      *.gz)      gunzip "$1" ;;
      *.tar)     tar -xvf "$1" ;;
      *.tbz2)    tar -xjvf "$1" ;;
      *.tgz)     tar -xzvf "$1" ;;
      *.zip)     unzip "$1" ;;
      *.7z)      7z x "$1" ;;
      *) echo "Unknown format: $1" ;;
    esac
  else
    echo "File not found: $1"
  fi
}
```

### Backup তৈরি

`tar` দিয়ে সম্পূর্ণ directory backup নেওয়া যায়। date stamp যোগ করে organized রাখা ভালো। exclude pattern দিয়ে unnecessary ফাইল বাদ দেওয়া যায়।

```bash
# Backup home directory with timestamp
tar -czvf backup_$(date +%Y%m%d).tar.gz /home/user/ \
  --exclude="*/.cache/*" \
  --exclude="*/.local/share/Trash/*" \
  --exclude="*/node_modules/*"

# Split large archive into smaller parts (e.g., 1GB each)
split -b 1G backup.tar.gz "backup_part_"

# Rejoin split files
cat backup_part_* > backup_rejoined.tar.gz
```

> [!note] Compression ratio নির্ভর করে data এর উপর
> # Text ফাইল ভালো compress হয় (৭০-৯০%), কিন্তু JPEG, MP4, ZIP ইত্যাদি already compressed ফাইল আবার compress করলে প্রায় কোনো লাভ হয় না। তাই media ফাইলের backup এ compression এর আশা কম রাখা উচিত।

## Quick Reference

| Task | Command |
|------|---------|
| zip বানাও | `zip -r out.zip folder/` |
| zip খোলো | `unzip out.zip` |
| tar.gz বানাও | `tar -czvf out.tar.gz folder/` |
| tar.gz খোলো | `tar -xzvf out.tar.gz` |
| gzip single file | `gzip file.txt` |
| gzip খোলো | `gunzip file.txt.gz` |
| 7z বানাও | `7z a out.7z folder/` |
| 7z খোলো | `7z x out.7z` |
| ভিতর দেখো | `tar -tvf out.tar.gz` |

> [!tip] tar flag মনে রাখার ট্রিক
> # **c**reate, e**x**tract, **v**erbose, **f**ile, g**z**ip — এই পাঁচটা letter মনে রাখলেই হবে। `tar -czvf` = Create + gZip + Verbose + File। বাংলায় বললে — বানাও (c), জিপ (z), দেখাও (v), ফাইল (f)।