## Tag কী আর কেন দরকার?

Tag হলো একটা specific commit এর নাম — সাধারণত version mark করার জন্য। Branch সময়ের সাথে সামনে যায়, কিন্তু tag একটা fixed point — যেমন "v1.0.0" সবসময় সেই একই commit এ থাকে। Release mark করার জন্য tag ব্যবহার হয়।

```bash
# বর্তমান commit এ একটা tag
git tag v1.0.0

# সব tag দেখো
git tag
# v1.0.0
# v1.1.0
# v2.0.0
```

> [!note]
> Branch আর tag এর পার্থক্য: branch সময়ের সাথে সামনে যায় (mutable)। Tag fixed point (immutable) — একবার বসালে সেখানেই থাকে। Release, milestone, version mark — সব tag দিয়ে করা হয়।

## Lightweight vs Annotated Tag

দুই ধরনের tag আছে:

### Lightweight Tag

শুধু একটা pointer — কোনো extra info নেই:

```bash
git tag v1.0.0
```

### Annotated Tag (Recommend!)

Author, date, message সহ — পূর্ণ tag:

```bash
git tag -a v1.0.0 -m "First stable release"
```

```bash
# Tag এর detail দেখো
git show v1.0.0
```

```text
tag v1.0.0
Tagger: Karim Ahmed <karim@example.com>
Date:   Thu Jan 15 12:00:00 2026 +0600

First stable release

commit a1b2c3d (tag: v1.0.0)
Author: Karim Ahmed <karim@example.com>
...
```

> [!tip]
> Release এর জন্য সবসময় **annotated tag** ব্যবহার করো (`-a -m`)। এতে author, date, message — সব থাকে। Lightweight tag শুধু local quick marking এর জন্য, production release এর জন্য না।

### Old Commit এ Tag

```bash
# নির্দিষ্ট commit এ tag
git tag -a v0.9.0 -m "Beta release" a1b2c3d
```

## Semantic Versioning (SemVer)

Version number এর একটা standard — **MAJOR.MINOR.PATCH**:

```
v1.2.3
│ │ └─ PATCH: bug fix (backward compatible)
│ └─── MINOR: new feature (backward compatible)
└───── MAJOR: breaking change (NOT backward compatible)
```

| Version change | কেন | উদাহরণ |
|----------------|------|---------|
| `1.0.0` → `1.0.1` | Bug fix | typo, crash fix |
| `1.0.0` → `1.1.0` | New feature | নতুন button, API endpoint |
| `1.0.0` → `2.0.0` | Breaking change | API পাল্টে গেছে, আগের কোড কাজ করবে না |

> [!example]
> যদিও তোমার library এর API change হয়ে গেছে, আগের version এর কোড আর কাজ করবে না — তাহলে MAJOR bump করো (`1.x` → `2.0.0`)। ব্যবহারকারী version number দেখেই বুঝবে breaking change এসেছে, সাবধানে আপগ্রেড করতে হবে।

## Pre-release Tags

Production এর আগে testing version:

```bash
git tag -a v2.0.0-alpha.1 -m "Alpha: early testing"
git tag -a v2.0.0-beta.1  -m "Beta: feature complete, testing"
git tag -a v2.0.0-rc.1    -m "Release Candidate: ready unless bugs found"
git tag -a v2.0.0         -m "Stable release"
```

| Stage | মানে |
|-------|------|
| `alpha` | early development, unstable, incomplete |
| `beta` | feature complete কিন্তু bugs থাকতে পারে |
| `rc` (Release Candidate) | production ready যদি কোনো bug না পাওয়া যায় |
| (no suffix) | stable release |

## Tag Push করা

Tag local এ থাকে, push না করলে remote এ যাবে না:

```bash
# একটা tag push
git push origin v1.0.0

# সব tag একসাথে push
git push origin --tags
```

```bash
# Tag delete (local)
git tag -d v1.0.0

# Tag delete (remote)
git push origin --delete v1.0.0
```

> [!warn]
> `git push` শুধু branch push করে, tag করে না! Tag push করার জন্য আলাদাভাবে `git push origin v1.0.0` বা `git push --tags` করতে হয়। এই ভুল অনেকেই করে — tag লোকালে আছে কিন্তু remote এ নেই।

## GitHub Releases

GitHub তে tag থেকে Release তৈরি করা যায় — release notes, binary file attachment সহ:

### GitHub UI থেকে

1. Repository → **Releases** → **Create a new release**
2. Tag বাছো (বা নতুন বানাও)
3. Release title আর description লেখো
4. Binary file attach করো (যদি থাকে)
5. **Publish release**

### CLI থেকে

```bash
# GitHub CLI দিয়ে release create
gh release create v1.0.0 --title "v1.0.0" --notes "First stable release"

# Pre-release
gh release create v2.0.0-beta.1 --prerelease --notes "Beta testing"

# Binary attach
gh release create v1.0.0 installer.exe app-v1.0.0.zip
```

> [!tip]
> GitHub Release এ changelog বা release notes লেখা যায় — কী নতুন, কী fix হয়েছে, breaking change কিছু আছে কিনা। User দের জন্য এটা খুব helpful। Binary file (executable, installer) ও attach করা যায়।

## Changelog Generation

Conventional Commits ব্যবহার করলে changelog automatically generate করা যায়:

```bash
# Conventional Commits format
# feat: new feature → MINOR bump
# fix: bug fix → PATCH bump
# feat!: breaking change → MAJOR bump

# Tools:
# - standard-version / release-please (auto version + changelog)
# - conventional-changelog-cli

npx conventional-changelog -i CHANGELOG.md -s
```

> [!example]
> যদি তোমার team Conventional Commits follow করে (`feat:`, `fix:` ইত্যাদি), তাহলে `release-please` বা `standard-version` দিয়ে version bump আর changelog automatically generate হয়। Manually version আর changelog লেখা লাগে না! GitHub Actions এ এটা automate করা যায়।

## Practical — Complete Release Flow

```bash
# 1. main branch update করো
git switch main
git pull origin main

# 2. নতুন feature merge হয়ে গেছে
# এখন version bump করো

# 3. Annotated tag বসাও
git tag -a v1.2.0 -m "Release v1.2.0: User authentication feature

- feat: JWT login/logout
- feat: Password reset
- fix: Session timeout bug
"

# 4. Tag push করো
git push origin v1.2.0

# 5. GitHub Release create করো
gh release create v1.2.0 \
  --title "v1.2.0 — Authentication" \
  --notes "$(cat <<'EOF'
## What's New
- User login/logout with JWT
- Password reset via email

## Bug Fixes
- Session timeout now works correctly

## Breaking Changes
None — fully backward compatible
EOF
)"

# 6. Verify
gh release list
# v1.2.0   Authentication   Latest   about 1 minute ago
```

```yaml
# .github/workflows/release.yml — Auto release on tag
name: Release
on:
  push:
    tags:
      - "v*"

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

> [!note]
> GitHub Actions দিয়ে release fully automate করা যায়। Tag push করলে CI/CD pipeline চালু হয় — test, build, release notes generate, binary upload — সব automatic। Tag push করাটাই একমাত্র manual step।

## Summary

`git tag -a` দিয়ে annotated tag বানাও (release এর জন্য)। SemVer follow করো: MAJOR.MINOR.PATCH। Pre-release এর জন্য alpha/beta/rc suffix। `git push --tags` দিয়ে tag push করো। GitHub Release তে notes আর binary attach করো। Conventional Commits দিয়ে changelog automate করো। পরের chapter এ best practices শিখবো।