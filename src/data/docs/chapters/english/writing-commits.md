# Git Commit ও PR Description লেখা

তুমি হয়তো ভাবো — "code তো লিখে দিলাম, commit message এ আবার কী লিখব?" ভাই, এই ভুলটা অনেকেই করে। একটা সত্যি কথা শোনো — তোমার commit message গুলো তোমার team পড়ে, তোমার manager পড়ে, আর ছ'মাস পর তুমি নিজেও পড়বে আর ভাববে "আমি কী করেছিলাম এই commit এ?"

খারাপ commit message মানে — সবাই হতাশ। ভালো commit message মানে — সবাই তোমাকে ভালোবাসে। আজ শিখবো কীভাবে professional commit message আর PR description লিখতে হয় — সব English এ।

## কেন Good Commit Message দরকার?

ভাবো তো — তুমি ৩ মাস আগের একটা bug fix খুঁজছো। `git log` চালাও, আর দেখো এই message গুলো:

নিচের message গুলো দেখলে কিছুই বোঝা যাবে না:

```
fixed it
changes
stuff
update
asdfasdf
final final final v2
```

এই message গুলো কিছুই বোঝায় না। এখন এই গুলো দেখো:

এই message গুলো দেখলেই বোঝা যাচ্ছে কী হয়েছে:

```
fix(auth): handle empty password during login
feat(payment): add bKash payment gateway integration
docs(readme): update installation instructions
refactor(api): simplify response formatting logic
```

> [!important] মনে রাখো
> Commit message হলো তোমার code এর ইতিহাস। ৬ মাস পর কেন এই change করেছিলে — সেটা এই message ই বলবে। ভবিষ্যতের তোমার নিজের জন্যই ভালো message লেখো।

## Conventional Commits Format

Commit message লেখার একটা standard format আছে — যাকে **Conventional Commits** বলে। এটা ব্যবহার করলে message দেখেই বোঝা যায় কী ধরনের change হয়েছে।

Conventional Commits এর format হলো `type(scope): description` — মানে কী ধরনের change, কোথায়, আর কী হয়েছে:

```
type(scope): description

┌─────────────────────────────────────────────┐
│ type    → কী ধরনের change                    │
│ scope   → কোন module/area তে change (optional) │
│ description → কী হয়েছে                        │
└─────────────────────────────────────────────┘
```

### Type গুলো কী কী?

| Type | কখন ব্যবহার করবে | উদাহরণ |
|------|------------------|--------|
| `feat` | নতুন feature যোগ করলে | `feat(auth): add login validation` |
| `fix` | কোনো bug fix করলে | `fix(api): handle null response` |
| `docs` | documentation change | `docs(readme): update setup steps` |
| `style` | formatting, no code change | `style(ui): fix indentation` |
| `refactor` | code পরিবর্তন, behavior একই | `refactor(auth): simplify token logic` |
| `test` | test যোগ/পরিবর্তন | `test(api): add unit tests for login` |
| `chore` | build, deps, config | `chore: upgrade react to v18.3` |
| `perf` | performance improvement | `perf(db): add index to users table` |
| `ci` | CI/CD pipeline change | `ci: add automated testing workflow` |

> [!tip] Type মনে রাখার উপায়
> **feat** = feature (নতুন জিনিস), **fix** = bug ঠিক, **docs** = documentation, **refactor** = সাজানো, **test** = test, **chore** = ঝাড়া ঝাড়া। এই ৬টা সবচেয়ে common।

### কিছু বাস্তব উদাহরণ

নিচের commit গুলো দেখো — type, scope, description সব স্পষ্ট:

```bash
feat(auth): add OAuth2 login with Google
fix(payment): resolve duplicate charge issue
docs(api): add response examples for all endpoints
refactor(user): extract validation logic to separate module
test(auth): add integration tests for password reset
chore(deps): upgrade express to 4.19.2
perf(search): cache frequently used queries
```

এখানে প্রতিটা message দেখেই বোঝা যাচ্ছে — কী ধরনের change, কোন module এ, আর কী হয়েছে। এটাই professional commit।

## Commit Message এর Structure

একটা complete commit message শুধু subject line না। এর একটা structure আছে।

একটা ভালো commit message এর structure নিচে দেওয়া হলো — subject, body, আর footer:

```
fix(auth): handle empty password during login

Previously, empty password caused 500 error. Now validates
input and returns 400 with proper error message.

Closes #142
```

এখানে প্রথম line হলো subject, এরপর blank line, তারপর body (বিস্তারিত), আর শেষে footer (issue reference)।

### তিনটা Rule

> [!important] Subject Line Rules
> ১. **৫০ character এর মধ্যে** রাখো (max 72)
> ২. **Imperative mood** ব্যবহার করো — "Fix" লেখো, "Fixed" বা "Fixes" না
> ৩. Subject এর শেষে **dot (.) দেবে না**

### Imperative Mood — কী জিনিস?

Imperative mood মানে — command করার ভঙ্গি। "Fix the bug", "Add the feature", "Update the docs"। এটা Git এর standard।

নিচের table টা দেখলে imperative mood পরিষ্কার বোঝা যাবে:

| ❌ ভুল (Past/Fixed) | ✅ সঠিক (Imperative) | বাংলা অর্থ |
|---------------------|---------------------|-----------|
| Fixed the bug | Fix the bug | bug টা ঠিক করো |
| Added login feature | Add login feature | login feature যোগ করো |
| Updated documentation | Update documentation | documentation আপডেট করো |
| Removed old code | Remove old code | পুরোনো code সরাও |
| Changed API response | Change API response | API response পরিবর্তন করো |

> [!note] কেন Imperative Mood?
> কারণ `git merge` এর message এ এই format ই থাকে — "Merge branch X into Y"। তাই Git এর convention অনুযায়ী imperative mood ব্যবহার করো।

## Before / After: খারাপ vs ভালো Commit

| Situation | ❌ খারাপ Message | ✅ ভালো Message |
|-----------|----------------|----------------|
| নতুন feature | `did some stuff` | `feat(auth): add email validation on signup` |
| Bug fix | `fixed it` | `fix(api): handle null response from payment gateway` |
| Documentation | `docs` | `docs(readme): add environment variable setup guide` |
| Refactor | `cleanup` | `refactor(auth): extract JWT logic to middleware` |
| Dependency | `updated stuff` | `chore(deps): upgrade react-router to v6.22` |
| Style change | `formatted` | `style(components): fix inconsistent indentation` |
| Test | `tests` | `test(user): add tests for profile update flow` |

## PR Description Template

শুধু commit message না — Pull Request (PR) এর description ও সমান গুরুত্বপূর্ণ। reviewer কে বোঝাতে হবে কী করেছ, কেন করেছ, আর কীভাবে test করবে।

নিচে একটা professional PR description template দেওয়া হলো — এই format টা copy করে নিজের project এ ব্যবহার করো:

```markdown
## Description
Brief description of what this PR does and why.

## Changes
- Added email validation on signup form
- Updated error messages to be more user-friendly
- Added unit tests for validation logic

## Related Issue
Fixes #142

## How to Test
1. Run `npm start`
2. Go to /signup page
3. Enter invalid email like "test@"
4. Verify error message appears

## Screenshots
(if applicable, add screenshots here)
```

এই template টা দেখলে reviewer সাথে সাথে বুঝে যাবে — কী change হয়েছে, কেন, আর কীভাবে test করতে হবে। সময় ও বাঁচবে সবার।

## Code Review Comment লেখা

যখন তুমি অন্যের code review করবে, তখন English এ comment লিখতে হবে — আর সেটা **নিভৃত আর ভদ্র** হতে হবে। কেউ তো চায় না "এটা ভুল, ঠিক করো" শুনতে।

নিচের table টা দেখো — কীভাবে আক্রমণাত্মক comment কে নম্র comment এ পরিণত করতে হয়:

| Situation | ❌ Aggressive / খারাপ | ✅ Polite / ভালো |
|-----------|----------------------|-----------------|
| ভুল ধরা পড়েছে | This is wrong. | I think there might be an issue here. Could you check? |
| Suggestion দিতে | You should change this. | Could you consider using a different approach here? |
| Question করতে | Why did you do this? | Could you walk me through the reasoning behind this? |
| Better way আছে | This is bad code. | I wonder if there's a simpler way to handle this. What do you think? |
| Bug খুঁজে পেয়েছি | This will crash. | This might cause an issue when input is null. Could you add a check? |
| Disagree করতে | That makes no sense. | I see it differently. Could we discuss this approach? |

> [!tip] Tone এর Golden Rule
> **"Could you..."** দিয়ে শুরু করো, **"You should..."** এড়িয়ে চলো। প্রশ্ন আকারে suggestion দিলে মানুষ ভালো বোধ করে, command দিলে defensive হয়ে যায়।

## বাঙালিরা যে Mistake গুলো বেশি করে

> [!important] Common Mistakes
> ১. **Grammatically ভুল message** — "Added some fix" না লিখে "fix(auth): add password validation" লেখো
> ২. **সব lowercase বা সব UPPERCASE** — `fix(api): handle null response` format মেনে চলো (lowercase type)
> ৩. **Vague word** — "update", "fix", "change" একা একা কিছু বোঝায় না, কী update সেটা লেখো
> ৪. **Grammar tense** — "Fixed" বা "Fixes" না, imperative "Fix" ব্যবহার করো
> ৫. **Emoji বা slang** — professional repository তে "🔥 fixed it lol" লেখা যাবে না

## মূল যেটা মনে রাখবে

- Commit message এ **type(scope): description** format ব্যবহার করো
- Subject line **৫০ character এর মধ্যে**, imperative mood এ
- PR description এ **What, Why, How to test** — এই তিনটা থাকবে
- Code review comment **নম্র আর constructive** হবে
- ভবিষ্যতের তোমার নিজের জন্য ভালো message লেখো — ৬ মাস পর তুমি নিজেই thank you বলবে