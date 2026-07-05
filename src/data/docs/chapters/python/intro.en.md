# What is Python and Why Learn It

Python is a high-level, general-purpose programming language. That means — it reads very close to human language, and you can build almost anything you want with it. Guido van Rossum created it back in 1991, and today it's one of the most popular languages in the world.

## Why Should You Learn Python?

First of all — Python is incredibly easy to learn. The syntax is straightforward; you can read it and immediately understand what's happening. On top of that, the demand in the job market is huge. Let's look at a small example:

```python
print("Hello, World!")
```

That's it! One line and you're done. In C++ or Java, doing the same thing involves classes, methods, and semicolons — a lot of hassle. Python keeps things simple.

## Where is Python Used?

Python's use cases are incredibly broad. Let's look at the main areas:

| Field | What You Can Do | Example Libraries |
|-------|----------------|-------------------|
| **Web Development** | Backend APIs, full websites | Django, Flask, FastAPI |
| **Data Science** | Analyzing data | Pandas, NumPy |
| **Machine Learning / AI** | Training models | PyTorch, TensorFlow |
| **Automation** | Automating boring tasks | Selenium, BeautifulSoup |
| **Scripting** | Small utility tools | Can be done with built-ins alone |

> [!tip]
> If you're a beginner, start with Python. Later you can shift to any direction (web, data, AI) — because the foundation stays exactly the same.

## Where Python is Used — Real-World Examples

Google, Netflix, Instagram, Spotify — they all use Python in their backends. Netflix's recommendation system runs on Python. Instagram's backend is built with Django (a Python framework).

In the age of AI, ChatGPT, self-driving cars, image generation — Python dominates everywhere because the ML libraries are the most mature in Python.

## Installing Python

Installing Python is very easy. Let's go step by step:

1. Go to **python.org** → click on the Downloads section
2. Download the latest version for your OS (Windows / macOS / Linux)
3. Run the installer — just click next-next and you're done

> [!warn]
> When installing on Windows, make sure to tick the **"Add Python to PATH"** option. Otherwise the `python` command won't work in the terminal.

If you're on Mac or Linux, you can also install via Homebrew:

```bash
# macOS (homebrew)
brew install python

# Ubuntu / Debian
sudo apt update && sudo apt install python3
```

### Verifying the Installation

To check if Python is installed, open your terminal or command prompt and run:

```bash
python --version
```

If you see `Python 3.14.0` — everything is fine, you're ready to go!

## Python 3.14 — The Latest Version

Python 3.14 was released in October 2025. This is now the latest stable version. It comes with many new features — free-threaded mode (no GIL), JIT compiler, template strings, and more. We'll explore these in later chapters.

> [!note]
> If you're using 3.12 or 3.13, that's totally fine. About 95% of the content in this guide works on all versions. Only the 3.14-specific features will need the latest version.

## Your First Program

Let's write a small program right at the start. Create a file called `hello.py` and write this code:

```python
name = input("What's your name? ")
print(f"Hello, {name}! Welcome to learning Python.")
```

Then run it in the terminal:

```bash
python hello.py
```

The output will look something like:

```
What's your name? Rahim
Hello, Rahim! Welcome to learning Python.
```

> [!example]
> In this program, `input()` takes the user's name, and `f"..."` (f-string) inserts it into the message.

## Summary

Python is easy to learn, has huge demand, and can be used in any field. In the next chapter, we'll cover syntax and basic concepts. Let's move forward!