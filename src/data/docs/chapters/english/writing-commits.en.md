# Writing Git Commits and PR Descriptions

You might think — "I already wrote the code, what else should I write in the commit message?" My friend, many people make this mistake. Let me tell you a truth — your team reads your commit messages, your manager reads them, and six months later you will read them yourself and wonder "what did I do in this commit?"

A bad commit message means — everyone is frustrated. A good commit message means — everyone loves you. Today we will learn how to write professional commit messages and PR descriptions — all in English.

## Why Do Good Commit Messages Matter?

Think about it — you are looking for a bug fix from 3 months ago. You run `git log`, and you see these messages:

You will not understand anything from these messages:

```
fixed it
changes
stuff
update
asdfasdf
final final final v2
```

These messages mean nothing. Now look at these:

You can tell exactly what happened just by reading these messages:

```
fix(auth): handle empty password during login
feat(payment): add bKash payment gateway integration
docs(readme): update installation instructions
refactor(api): simplify response formatting logic
```

> [!important] Remember
> A commit message is the history of your code. Six months later, this message will tell you why you made this change. Write good messages for your future self.

## Conventional Commits Format

There is a standard format for writing commit messages — called **Conventional Commits**. When you use it, you can tell what kind of change happened just by looking at the message.

The format for Conventional Commits is `type(scope): description` — meaning what kind of change, where, and what happened:

```
type(scope): description

┌─────────────────────────────────────────────┐
│ type    → what kind of change                │
│ scope   → which module/area changed (optional) │
│ description → what happened                  │
└─────────────────────────────────────────────┘
```

### What Are the Types?

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | When you add a new feature | `feat(auth): add login validation` |
| `fix` | When you fix a bug | `fix(api): handle null response` |
| `docs` | Documentation change | `docs(readme): update setup steps` |
| `style` | Formatting, no code change | `style(ui): fix indentation` |
| `refactor` | Code changed, behavior stays same | `refactor(auth): simplify token logic` |
| `test` | Adding or changing tests | `test(api): add unit tests for login` |
| `chore` | Build, deps, config | `chore: upgrade react to v18.3` |
| `perf` | Performance improvement | `perf(db): add index to users table` |
| `ci` | CI/CD pipeline change | `ci: add automated testing workflow` |

> [!tip] How to Remember the Types
> **feat** = feature (something new), **fix** = bug fix, **docs** = documentation, **refactor** = reorganize, **test** = tests, **chore** = cleanup. These 6 are the most common.

### Some Real Examples

Look at these commits — type, scope, description are all clear:

```bash
feat(auth): add OAuth2 login with Google
fix(payment): resolve duplicate charge issue
docs(api): add response examples for all endpoints
refactor(user): extract validation logic to separate module
test(auth): add integration tests for password reset
chore(deps): upgrade express to 4.19.2
perf(search): cache frequently used queries
```

Here you can tell from each message — what kind of change, in which module, and what happened. This is a professional commit.

## Structure of a Commit Message

A complete commit message is not just a subject line. It has a structure.

Here is the structure of a good commit message — subject, body, and footer:

```
fix(auth): handle empty password during login

Previously, empty password caused 500 error. Now validates
input and returns 400 with proper error message.

Closes #142
```

Here the first line is the subject, then a blank line, then the body (details), and at the end the footer (issue reference).

### Three Rules

> [!important] Subject Line Rules
> 1. Keep it **under 50 characters** (max 72)
> 2. Use **imperative mood** — write "Fix", not "Fixed" or "Fixes"
> 3. Do **not** put a dot (.) at the end of the subject

### What Is Imperative Mood?

Imperative mood means — a commanding tone. "Fix the bug", "Add the feature", "Update the docs". This is the Git standard.

Look at the table below to understand imperative mood clearly:

| ❌ Wrong (Past/Fixed) | ✅ Correct (Imperative) | Meaning |
|----------------------|------------------------|---------|
| Fixed the bug | Fix the bug | fix the bug |
| Added login feature | Add login feature | add the login feature |
| Updated documentation | Update documentation | update the documentation |
| Removed old code | Remove old code | remove the old code |
| Changed API response | Change API response | change the API response |

> [!note] Why Imperative Mood?
> Because `git merge` messages use this format — "Merge branch X into Y". So follow Git's convention and use imperative mood.

## Before / After: Bad vs Good Commits

| Situation | ❌ Bad Message | ✅ Good Message |
|-----------|---------------|----------------|
| New feature | `did some stuff` | `feat(auth): add email validation on signup` |
| Bug fix | `fixed it` | `fix(api): handle null response from payment gateway` |
| Documentation | `docs` | `docs(readme): add environment variable setup guide` |
| Refactor | `cleanup` | `refactor(auth): extract JWT logic to middleware` |
| Dependency | `updated stuff` | `chore(deps): upgrade react-router to v6.22` |
| Style change | `formatted` | `style(components): fix inconsistent indentation` |
| Test | `tests` | `test(user): add tests for profile update flow` |

## PR Description Template

It is not just commit messages — the description of a Pull Request (PR) is equally important. The reviewer needs to understand what you did, why you did it, and how to test it.

Here is a professional PR description template — copy this format and use it in your own project:

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

When the reviewer sees this template, they immediately understand — what changed, why, and how to test it. It saves everyone's time.

## Writing Code Review Comments

When you review someone else's code, you need to write comments in English — and they must be **gentle and polite**. Nobody wants to hear "this is wrong, fix it."

Look at the table below — how to turn an aggressive comment into a polite one:

| Situation | ❌ Aggressive / Bad | ✅ Polite / Good |
|-----------|---------------------|-----------------|
| Found a mistake | This is wrong. | I think there might be an issue here. Could you check? |
| Giving a suggestion | You should change this. | Could you consider using a different approach here? |
| Asking a question | Why did you do this? | Could you walk me through the reasoning behind this? |
| Know a better way | This is bad code. | I wonder if there's a simpler way to handle this. What do you think? |
| Found a bug | This will crash. | This might cause an issue when input is null. Could you add a check? |
| Disagreeing | That makes no sense. | I see it differently. Could we discuss this approach? |

> [!tip] The Golden Rule of Tone
> Start with **"Could you..."**, avoid **"You should..."**. When you give suggestions as questions, people feel good. When you give commands, they get defensive.

## Common Mistakes to Avoid

> [!important] Common Mistakes
> 1. **Grammatically wrong message** — Instead of "Added some fix", write "fix(auth): add password validation"
> 2. **All lowercase or all UPPERCASE** — Follow the `fix(api): handle null response` format (lowercase type)
> 3. **Vague words** — "update", "fix", "change" alone do not mean anything, write what you updated
> 4. **Grammar tense** — Not "Fixed" or "Fixes", use the imperative "Fix"
> 5. **Emoji or slang** — You cannot write "🔥 fixed it lol" in a professional repository

## Key Takeaways

- Use the **type(scope): description** format in commit messages
- Keep the subject line **under 50 characters**, in imperative mood
- PR description should include **What, Why, How to test** — all three
- Code review comments should be **polite and constructive**
- Write good messages for your future self — six months later you will thank yourself