# Python কী ও কেন শিখবে

Python হলো একটা high-level, general-purpose programming language। মানে হলো — এটা মানুষের ভাষার খুব কাছাকাছি পড়ে, আর তুমুর যা ইচ্ছা তাই বানাতে পারবে। Guido van Rossum 1991 সালে এটা বানিয়েছিলেন, আর আজকে এটা দুনিয়ার সবচেয়ে জনপ্রিয় language গুলোর একটা।

## Python কেন শিখবে?

প্রথমত — Python শিখতে একদম সহজ। Syntax সোজা, পড়লেই বুঝে যাবে কী হচ্ছে। এর পর বাজারে demand অনেক বেশি। একটা ছোট উদাহরণ দেখি:

```python
print("Hello, World!")
```

এটাই! এক লাইনে কাজ শেষ। C++ বা Java তে একই কাজ করতে গেলে class, method আর semicolon নিয়ে অনেক কথা। Python এ ঝামেলা কম।

## কোথায় কোথায় Python ব্যবহার হয়?

Python এর use case অনেক বিস্তৃত। চলো দেখি মূল কোথায় কোথায়:

| Field | কী করা যায় | উদাহরণ Library |
|-------|------------|----------------|
| **Web Development** | Backend API, full website | Django, Flask, FastAPI |
| **Data Science** | ডেটা analyze করা | Pandas, NumPy |
| **Machine Learning / AI** | Model train করা | PyTorch, TensorFlow |
| **Automation** | বোরিং কাজ automate করা | Selenium, BeautifulSoup |
| **Scripting** | ছোট ছোট utility tool | Built-in করেই ফেলা যায় |

> [!tip]
> তুমি beginner হলে Python দিয়েই শুরু করো। পরে যেকোনো দিকে (web, data, AI) shift করতে পারবে — কারণ base একদম same।

## Python কোথায় ব্যবহার হয় — রিয়েল উদাহরণ

গুগল, Netflix, Instagram, Spotify — সবাই backend এ Python ব্যবহার করে। Netflix এর recommendation system এ Python চলে। Instagram এর backend এ Django (Python framework) আছে।

AI এর যুগে ChatGPT, self-driving car, image generation — সব জায়গাতেই Python এর dominance আছে কারণ ML library গুলো Python এ সবচেয়ে বেশি mature।

## Python ইনস্টল করা

Python ইনস্টল করা একদম সহজ। ধাপে ধাপে দেখি:

1. **python.org** এ যাও → Downloads section এ ক্লিক করো
2. তোমার OS (Windows / macOS / Linux) অনুযায়ী সর্বশেষ version ডাউনলোড করো
3. Installer run করো — next-next দিলেই হয়

> [!warn]
> Windows এ install করার সময় **"Add Python to PATH"** অপশনটা অবশ্যই tick করবে। নাহলে terminal এ `python` command চলবে না।

ম্যাক বা Linux ব্যবহার করলে homebrew দিয়েও ইনস্টল করতে পারো:

```bash
# macOS (homebrew)
brew install python

# Ubuntu / Debian
sudo apt update && sudo apt install python3
```

### ইনস্টল verify করা

ইনস্টল হয়েছে কিনা চেক করতে terminal বা command prompt খুলে এই command টা দাও:

```bash
python --version
```

যদি দেখো `Python 3.14.0` — তার মানে সব ঠিক আছে, তুমি ready!

## Python 3.14 — সর্বশেষ Version

Python 3.14 October 2025 এ release হয়েছে। এটাই এখন latest stable version। এতে অনেক নতুন ফিচার এসেছে — free-threaded mode (no GIL), JIT compiler, template strings ইত্যাদি। আমরা পরের chapter গুলোতে দেখবো।

> [!note]
> তুমি যদি 3.12 বা 3.13 ব্যবহার করো তবুও কোনো সমস্যা নেই। এই গাইডের ৯৫% কনটেন্ট সব version এ চলবে। শুধু 3.14 specific feature গুলোতে latest version লাগবে।

## প্রথম Program

চলো একদম শুরুতে একটা ছোট program লিখি। `hello.py` নামে একটা file বানাও আর এই কোড লিখো:

```python
name = input("তোমার নাম কী? ")
print(f"হ্যালো, {name}! Python শেখায় স্বাগতম।")
```

এরপর terminal এ রান করো:

```bash
python hello.py
```

Output আসবে এরকম:

```
তোমার নাম কী? Rahim
হ্যালো, Rahim! Python শেখায় স্বাগতম।
```

> [!example]
> এই program টা তে `input()` দিয়ে user এর কাছ থেকে নাম নেওয়া হয়েছে, আর `f"..."` (f-string) দিয়ে সেটাকে message এর ভেতর বসানো হয়েছে।

## Summary

Python শেখা সহজ, demand অনেক, আর যেকোনো field এ কাজ করা যায়। পরের chapter এ আমরা syntax আর basic concept গুলো দেখবো। চলো এগোই!