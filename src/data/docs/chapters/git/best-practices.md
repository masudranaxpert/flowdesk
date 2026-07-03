## Conventional Commits

Commit message এর একটা standard format — যাতে message দেখেই বোঝা যায় কী ধরনের change:

```
type(scope): description

feat: new feature → MINOR version bump
fix: bug fix → PATCH version bump
docs: documentation change
style: formatting, no code change
refactor: code restructuring, no behavior change
test: adding tests
chore: build, deps, config
perf: performance improvement
ci: CI/CD changes
```

```bash
# ভালো commit message
git commit -m "feat: user login with JWT authentication"
git commit -m "fix: crash when password is empty"
git commit -m "docs: update API documentation"
git commit -m "chore: upgrade pandas to 2.2.3"

# খারাপ commit message
git commit -m "stuff"
git commit -m "fixed it"
git commit -m "changes"
```

> [!tip]
> Conventional Commits এর সুবিধা: (১) History পরিষ্কার, (২) Changelog automatically generate হয়, (৩) Version bump automatically হয়, (৪) Teammate দেখেই বোঝে change এর type। `feat:` দেখলে feature, `fix:` দেখলে bug fix — স্পষ্ট।

### Breaking Change Mark

```bash
# Breaking change — MAJOR version bump
git commit -m "feat!: remove deprecated API endpoints"
# অথবা footer এ
git commit -m "feat: redesign API

BREAKING CHANGE: response format changed from XML to JSON"
```

## Small Focused Commits

এক commit এ একটা কাজ। এক commit এ পুরো feature + bug fix + formatting — এটা খারাপ practice।

```bash
# ❌ খারাপ — সব একসাথে
git add -A
git commit -m "add login, fix bug, update docs, change colors"

# ✅ ভালো — আলাদা commit
git add auth/login.py
git commit -m "feat: add login function"

git add auth/session.py
git commit -m "fix: session timeout calculation"

git add README.md
git commit -m "docs: update setup instructions"
```

> [!note]
> ছোট focused commit এর সুবিধা: review করা সহজ, revert করা সহজ, `git bisect` দিয়ে debug করা সহজ, history meaningful। প্রতিটা commit এ একটা logical change থাকা উচিত।

## .gitignore Deep Dive

`.gitignore` file এ বলে দেওয়া যায় কোন file গুলো Git এ track করবে না:

```gitignore
# .gitignore

# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
*.egg-info/

# Environment variables
.env
.env.local
*.env

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Build output
dist/
build/
*.exe

# Data files (large)
*.csv
*.parquet
*.npy
data/raw/

# Logs
*.log
logs/

# Jupyter
.ipynb_checkpoints/
```

### Global .gitignore

প্রতিটা project এ আলাদা `.gitignore` না বানিয়ে system-wide ignore করা যায়:

```bash
# Global gitignore set করো
git config --global core.excludesfile ~/.gitignore_global

# ~/.gitignore_global
.DS_Store
.vscode/
.idea/
*.swp
```

> [!danger]
> কখনো `.env`, `credentials.json`, API key file commit করবে না! একবার push হয়ে গেলে Git history থেকে মুছতে হয় (hard)। GitHub তে secret push হলে bot স্বয়ংক্রিয়ভাবে তোমাকে warning দেয়। সবসময় `.env` কে `.gitignore` এ রাখো আর `.env.example` দিয়ে template share করো।

### Already Tracked File Ignore

```bash
# File আগে থেকে tracked হলে .gitignore কাজ করবে না
# প্রথমে untrack করো (file local এ থাকবে)
git rm --cached .env
git commit -m "chore: remove .env from tracking"

# এখন .gitignore তে যোগ করো
echo ".env" >> .gitignore
```

## Git Hooks

Hook হলো event-triggered script — commit বা push এর আগে স্বয়ংক্রিয়ভাবে কোনো কাজ হবে।

```bash
# Hook গুলো এই ফোল্ডারে
.git/hooks/
```

### Pre-commit Hook

Commit এর আগে code check করা:

```bash
# .git/hooks/pre-commit (executable করতে হবে)
#!/bin/sh
echo "Running lint check..."
ruff check . || exit 1
echo "All checks passed!"
```

### Pre-commit Framework

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
```

```bash
# Install
pip install pre-commit
pre-commit install

# এখন প্রতিটা commit এ স্বয়ংক্রিয়ভাবে lint + format হবে
```

> [!example]
> `pre-commit` framework দিয়ে team-wide hook share করা যায়। প্রতিজন developer `pre-commit install` একবার চালাবে, তারপর প্রতিটা commit এ স্বয়ংক্রিয়ভাবে lint, format, type check হবে। খারাপ কোড কখনো commit হবে না। JS/TS project এ `husky` একই কাজ করে।

## Submodules

আরেকটা Git repository কে তোমার project এর ভেতর embed করা:

```bash
# Submodule add
git submodule add https://github.com/team/shared-lib.git libs/shared

# Clone with submodules
git clone --recurse-submodules https://github.com/you/project.git

# Existing clone এ submodule init
git submodule update --init --recursive
```

> [!warn]
> Submodule tricky! সবসময় সঠিক commit এ locked থাকে, update করতে হয় manually। Teammate গুলো confuse হয় — "submodule দেখা যাচ্ছে না"। সাধারণত monorepo (সব এক repo তে) submodule এর চেয়ে ভালো। Submodule শুধু তখন, যখন আলাদা repo maintain করতেই হবে (shared library, vendored code)।

## git bisect — Regression খোঁজা

কোনো change এ bug ঢুকেছে — কোন commit এ? `bisect` দিয়ে binary search করা যায়:

```bash
# Bug আছে এমন commit (bad)
git bisect start
git bisect bad HEAD

# ঠিক ছিল এমন commit (good)
git bisect good v1.0.0

# Git এখন middle commit এ checkout করবে
# তুমি test করো
git bisect good   # অথবা
git bisect bad

# কয়েকবার করলে exact commit পাবে
# শেষে
git bisect reset
```

> [!tip]
> `bisect` হলো debugging superpower। ১০০ commit এ bug ঢুকেছে — linear search এ ১০০ বার test। `bisect` দিয়ে মাত্র $\log_2(100) \approx 7$ বার! প্রতিটা step এ অর্ধেক commit বাদ যায়।

## Monorepo Brief

একাধিক project বা package এক Git repository তে:

```text
my-monorepo/
├── frontend/
├── backend/
├── shared/
├── docs/
└── .github/
    └── workflows/
```

> [!note]
> Monorepo এর সুবিধা: shared code easy, atomic cross-project change, single CI/CD। অসুবিধা: repository বড়, permission management complex, CI complex। Google, Meta — সব বড় কোম্পানি monorepo ব্যবহার করে। Tools: `nx`, `turborepo`, `bazel`।

## PR Hygiene

```markdown
## Pull Request Template

### What does this PR do?
Brief description of the change.

### Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

### Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] Branch is up to date with main
```

> [!example]
> ভালো PR এর বৈশিষ্ট্য: ছোট (২০০ line এর কম ideal), একটা logical change, পরিষ্কার title আর description, test সহ, screenshot (যদি UI change হয়)। Reviewer এর জন্য সহজ করো — সে তোমার পুরো context জানে না।

## Summary

Conventional Commits format ব্যবহার করো (`feat:`, `fix:` ইত্যাদি)। ছোট focused commit লেখো। `.gitignore` তে secret, build output, data file রাখো। Pre-commit hook দিয়ে code quality enforce করো। `git bisect` দিয়ে regression debug করো। Submodule এ সাবধান, সাধারণত monorepo ভালো। PR ছোট আর descriptive রাখো। এই best practice গুলো professional Git workflow এর ভিত্তি।