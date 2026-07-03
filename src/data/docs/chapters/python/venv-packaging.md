Virtual environment (venv) হলো Python development এর সবচেয়ে গুরুত্বপূর্ণ concept গুলোর একটা। এটা ছাড়া আসলে কোনো serious project করা যায় না। আর 2026 এ `uv` এসে পুরো জিনিসটাকে দাঁড় করিয়ে দিয়েছে। চলো দেখি।

## কেন Virtual Environment দরকার?

সমস্যাটা এমন — তোমার system Python এ `requests` এর version 2.31 আছে। Project A এর দরকার `requests==2.28`, Project B এর দরকার `requests==2.32`। System এ একসাথে দুটো version থাকতে পারে না! Venv হলো সমাধান — প্রতি project এর জন্য আলাদা isolated environment।

```text
Project A venv → requests 2.28
Project B venv → requests 2.32
System Python  → পরিষ্কার!
```

> [!danger]
> কখনো system Python এ directly `pip install` করবে না! Linux এ এটা OS break করে দিতে পারে। সবসময় venv ব্যবহার করো।

## পুরোনো উপায় — `python -m venv`

```bash
# venv তৈরি
python -m venv .venv

# activate (Windows)
.venv\Scripts\activate

# activate (macOS/Linux)
source .venv/bin/activate

# এখন pip install করো
pip install requests fastapi

# deactivate
deactivate
```

> [!note]
> `.venv` folder টা `.gitignore` এ রাখবে। এটা কখনো commit করবে না। কারণ এটা machine-specific — প্রতিটা developer নিজের venv বানাবে।

## `uv` — 2026 এর Standard

`uv` (Astral এর তৈরি) হলো 2026 এর dominant package আর venv manager। এটা Rust এ লেখা — pip এর চেয়ে 10-100x faster। সবাই এখন uv ব্যবহার করে:

```bash
# uv ইনস্টল (একবারই)
# macOS/Linux:
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows:
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

```bash
# venv তৈরি — সেকেন্ডের ভগ্নাংশে!
uv venv

# package install
uv pip install requests fastapi

# requirements থেকে install
uv pip install -r requirements.txt

# সব install (pyproject.toml থেকে)
uv sync
```

### `uv` Project Management

`uv` শুধু pip alternative না — এটা full project manager:

```bash
# নতুন project শুরু
uv init myproject
cd myproject

# dependency যোগ
uv add fastapi
uv add pytest --dev  # dev dependency

# সব dependency install
uv sync

# project এর ভেতরে কমান্ড রান
uv run python main.py
uv run pytest
```

> [!tip]
> `uv add` দিলে সে package automatically `pyproject.toml` এ যোগ হয় আর install ও হয়। আলাদাভাবে `pyproject.toml` edit করার দরকার নেই। `uv sync` দিলে lock file থেকে exact version গুলো install হয় — reproducible build guaranteed!

## `requirements.txt` বনাম `pyproject.toml`

### `requirements.txt` — সহজ কিন্তু limited

```text
# requirements.txt
requests==2.32.3
fastapi>=0.100.0
pytest>=8.0.0
```

### `pyproject.toml` — 2026 এর Standard

```toml
[project]
name = "my-awesome-project"
version = "0.1.0"
description = "একটা দারুণ Python project"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "httpx>=0.27.0",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "ruff>=0.7.0",
    "mypy>=1.13.0",
]

[project.scripts]
myapp = "myproject.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

> [!note]
> `pyproject.toml` এখন Python packaging এর single source of truth। `setup.py` আর `setup.cfg` legacy। সব modern tool (uv, hatch, poetry, pip) এটা support করে।

## Minimal `pyproject.toml` একটা Package এর জন্য

ধরো তোমার project structure:

```text
myproject/
├── pyproject.toml
├── src/
│   └── myproject/
│       ├── __init__.py
│       └── main.py
└── README.md
```

```toml
# pyproject.toml
[project]
name = "myproject"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["requests>=2.32"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/myproject"]
```

## Locally Install করা — Editable Mode

```bash
# uv দিয়ে (recommended)
uv pip install -e .

# পুরোনো pip দিয়ে
pip install -e .

# -e মানে editable — কোড change করলে reinstall লাগে না!
```

এখন তোমার package যেকোনো জায়গা থেকে import করা যাবে:

```python
from myproject.main import do_something
```

## Lock File — Reproducible Build

`uv` দিয়ে lock file তৈরি করলে exact version pinned থাকে:

```bash
uv lock    # uv.lock ফাইল তৈরি
uv sync    # lock file থেকে exact version install
```

```text
# uv.lock (auto-generated, হাতে edit করবে না)
# এখানে প্রতিটা package এর exact version + hash থাকে
# CI/CD তে বা অন্য developer এর কাছে একই environment guarantee করে
```

> [!example]
> Lock file টা git এ commit করবে। `.venv` কখনো করবে না। এভাবে সব developer আর CI তে একই version এর dependency থাকে — "works on my machine" সমস্যা থাকে না।

## PyPI তে Publish করা (সংক্ষেপে)

```bash
# Build করো
uv build
# dist/ ফোল্ডারে .whl আর .tar.gz তৈরি হবে

# PyPI তে upload
uv publish
# বা পুরোনো উপায়
twine upload dist/*
```

> [!warn]
> PyPI তে publish করার আগে ভালো করে test করো। একবার publish করা version আর delete বা re-upload করা যায় না। `version` number সবসময় বাড়াতে থাকবে (0.1.0 → 0.1.1 → 0.2.0)।

## `pip` vs `uv` দ্রুততার তুলনা

```bash
# pip দিয়ে
pip install fastapi uvicorn sqlalchemy
# ⏳ 8-12 সেকেন্ড

# uv দিয়ে
uv pip install fastapi uvicorn sqlalchemy
# ⚡ 0.3 সেকেন্ড!
```

> [!tip]
> `uv` এর speed difference শুধু install এ না — dependency resolution, venv creation, cache — সব জায়গায়। 2026 এ new project শুরু করলে সরাসরি `uv` দিয়ে শুরু করো। Existing project এ ও `uv pip` দিয়ে শুরু করতে পারো, এটা pip এর drop-in replacement।

## Summary

Venv হলো isolation এর key — প্রতি project এ আলাদা dependency। 2026 এ `uv` হলো standard — pip এর চেয়ে 10-100x faster। `pyproject.toml` হলো packaging এর single source of truth। Lock file দিয়ে reproducible build। `uv pip install -e .` দিয়ে local development। নতুন project শুরু করলে `uv init` দিয়ে শুরু করো।