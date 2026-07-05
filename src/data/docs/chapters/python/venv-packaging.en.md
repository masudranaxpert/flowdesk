# Virtual Environments & Packaging

Virtual environments (venv) are one of the most important concepts in Python development. Without it, you really can't do any serious project. And in 2026, `uv` has completely changed the game. Let's see.

## Why Do You Need Virtual Environments?

The problem is this — your system Python has `requests` version 2.31. Project A needs `requests==2.28`, Project B needs `requests==2.32`. You can't have two versions at the same time on the system! Venv is the solution — a separate isolated environment for each project.

```text
Project A venv → requests 2.28
Project B venv → requests 2.32
System Python  → clean!
```

> [!warn]
> Never directly `pip install` into the system Python! On Linux, this can break the OS. Always use a venv.

## The Old Way — `python -m venv`

```bash
# Create a venv
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Now pip install
pip install requests fastapi

# Deactivate
deactivate
```

> [!note]
> Put the `.venv` folder in `.gitignore`. Never commit it. Because it's machine-specific — each developer creates their own venv.

## `uv` — The 2026 Standard

`uv` (made by Astral) is the dominant package and venv manager of 2026. It's written in Rust — 10-100x faster than pip. Everyone uses uv now:

```bash
# Install uv (once)
# macOS/Linux:
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows:
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

```bash
# Create a venv — in a fraction of a second!
uv venv

# Install packages
uv pip install requests fastapi

# Install from requirements
uv pip install -r requirements.txt

# Install everything (from pyproject.toml)
uv sync
```

### `uv` Project Management

`uv` is not just a pip alternative — it's a full project manager:

```bash
# Start a new project
uv init myproject
cd myproject

# Add a dependency
uv add fastapi
uv add pytest --dev  # dev dependency

# Install all dependencies
uv sync

# Run commands inside the project
uv run python main.py
uv run pytest
```

> [!tip]
> With `uv add`, the package automatically gets added to `pyproject.toml` and installed. No need to separately edit `pyproject.toml`. With `uv sync`, exact versions are installed from the lock file — reproducible builds guaranteed!

## `requirements.txt` vs `pyproject.toml`

### `requirements.txt` — Simple but Limited

```text
# requirements.txt
requests==2.32.3
fastapi>=0.100.0
pytest>8.0.0
```

### `pyproject.toml` — The 2026 Standard

```toml
[project]
name = "my-awesome-project"
version = "0.1.0"
description = "An awesome Python project"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "httpx>=0.27.0",
    "pydantic>2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>8.0",
    "pytest-cov>5.0",
    "ruff>0.7.0",
    "mypy>1.13.0",
]

[project.scripts]
myapp = "myproject.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

> [!note]
> `pyproject.toml` is now the single source of truth for Python packaging. `setup.py` and `setup.cfg` are legacy. All modern tools (uv, hatch, poetry, pip) support it.

## Minimal `pyproject.toml` for a Package

Let's say your project structure is:

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

## Installing Locally — Editable Mode

```bash
# With uv (recommended)
uv pip install -e .

# With old pip
pip install -e .

# -e means editable — code changes don't need reinstall!
```

Now your package can be imported from anywhere:

```python
from myproject.main import do_something
```

## Lock File — Reproducible Builds

Creating a lock file with `uv` pins exact versions:

```bash
uv lock    # Creates uv.lock file
uv sync    # Installs exact versions from lock file
```

```text
# uv.lock (auto-generated, don't edit by hand)
# Contains exact version + hash for every package
# Guarantees the same environment in CI/CD or for other developers
```

> [!example]
> Commit the lock file to git. Never commit `.venv`. This way all developers and CI have the same dependency versions — no "works on my machine" problem.

## Publishing to PyPI (Briefly)

```bash
# Build
uv build
# Creates .whl and .tar.gz in the dist/ folder

# Upload to PyPI
uv publish
# Or the old way
twine upload dist/*
```

> [!warn]
> Test thoroughly before publishing to PyPI. Once a version is published, it can't be deleted or re-uploaded. The `version` number should always increase (0.1.0 → 0.1.1 → 0.2.0).

## `pip` vs `uv` Speed Comparison

```bash
# With pip
pip install fastapi uvicorn sqlalchemy
# ⏳ 8-12 seconds

# With uv
uv pip install fastapi uvicorn sqlalchemy
# ⚡ 0.3 seconds!
```

> [!tip]
> The speed difference of `uv` isn't just in installation — it's everywhere: dependency resolution, venv creation, caching. In 2026, start new projects directly with `uv`. For existing projects, you can start with `uv pip` too — it's a drop-in replacement for pip.

## Summary

Venv is the key to isolation — separate dependencies for each project. In 2026, `uv` is the standard — 10-100x faster than pip. `pyproject.toml` is the single source of truth for packaging. Lock files give reproducible builds. Use `uv pip install -e .` for local development. Start new projects with `uv init`.