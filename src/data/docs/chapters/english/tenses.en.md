# Tense — Past, Present, Future

You write a commit: "I **was** fix the bug." — That is wrong. But where is the mistake? Should it be "I **fixed** the bug", or "I **fix** the bug", or "I **have fixed** the bug"? Clearing up this confusion is today's goal.

Tense means — when did the action happen: in the past, in the present, or in the future? As a developer, three tenses are the most useful — and that is what we will learn today.

## Why Is Tense Important?

In Bengali, we add endings like `-ছিল`, `-লাম`, `-বো` to verbs to show tense. In English, the verb form itself changes. And where do developers need tense the most?

```
Where which tense is needed:
─────────────────────────────────────────────
Documentation → Present tense  → "The function returns..."
Commit message → Past tense    → "Fixed the login bug"
PR description → Present perfect → "I have updated the API"
Release notes  → Future tense  → "Will be deprecated in v3.0"
```

> [!important] The Most Common Confusion
> Which tense for commit messages? Which tense for documentation? Many people mistakenly write documentation in past tense — "The function returned a value" (wrong). The correct form is: "The function returns a value" (present tense). Because documentation is always written in the present tense.

## Simple Present Tense — The Language of Documentation

Simple present tense is the most common tense — documentation, code comments, and READMEs all use it.

**Structure:** Subject + Verb (base form) + Object

```
I write code           (I write code)
The function returns... (The function gives back...)
The server runs...     (The server is running...)
The API accepts...     (The API takes in...)
```

> [!note] Singular Subject Rule
> After he/she/it or a singular noun (function, server), the verb gets an `s` at the end: `returns`, `runs`, `accepts`, `sends`, `loads`. After I/we/you/they or a plural noun, no `s` is added.

Look at the documentation example below — everything is in present tense:

```python
"""
This module handles user authentication.

The login function takes a username and password,
validates the credentials, and returns a JWT token.
If the credentials are invalid, it raises an error.
"""
```

What these comments mean:
- `handles` = manages (present tense, singular subject "module")
- `takes` = receives (present tense, singular subject "function")
- `validates` = checks (present tense)
- `returns` = gives back (present tense)
- `raises` = throws (present tense)

All actions are happening in the present — because this module works this way right now. Documentation is always written in the present tense.

> [!tip] Documentation Rule
> Always write documentation in the present tense. "The function **returns** a value" ✅ — not "The function **returned** a value" ❌. Because documentation describes how something works — it did not happen in the past, it is happening now.

## Simple Past Tense — The Language of Commits

Simple past tense is used for actions that have already finished. Git commits, bug reports, and incident reports all use past tense.

**Structure:** Subject + Verb (past form) + Object

```
I fixed the bug        (I fixed the bug)
He added a feature     (He added a feature)
The server crashed     (The server crashed)
We deployed yesterday  (We deployed yesterday)
```

Past forms of common verbs:

| Base Form (Present) | Past Form | Meaning |
|--------------------|-----------|---------|
| fix | fixed | repaired |
| add | added | included |
| update | updated | brought up to date |
| remove | removed | deleted |
| create | created | made |
| run | ran | executed |
| send | sent | dispatched |
| build | built | constructed |
| crash | crashed | went down |
| deploy | deployed | released |

Look at the commit messages below — all in past tense:

```bash
# Past tense commit messages
git commit -m "Fixed memory leak in image processor"
git commit -m "Added pagination to search results"
git commit -m "Updated React to version 18.2"
git commit -m "Removed deprecated API endpoints"
git commit -m "Resolved merge conflict in utils.js"
```

What these commit messages mean:
- `Fixed memory leak` = A memory leak was fixed
- `Added pagination` = Pagination was added
- `Updated React` = React was updated
- `Removed deprecated API endpoints` = Old API endpoints were removed
- `Resolved merge conflict` = A merge conflict was resolved

> [!note] Commit Message Convention
> Many projects do not use past tense for commit messages, but instead use the **imperative** (command) mood: "Fix bug", "Add feature", "Update docs" — so the sentence sounds like a command. According to Git conventions, the imperative mood is more standard. However, past tense is also accepted in many projects. Follow your project's convention.

## Present Perfect Tense — The Language of PR Descriptions

Present perfect tense is used for actions that started in the past but are still relevant — meaning the action is done, and its effect is still present. PR descriptions, changelogs, and status updates all use this tense.

**Structure:** Subject + have/has + Verb (past participle) + Object

```
I have fixed the bug        (I have fixed the bug — still valid)
He has updated the docs     (He has updated the docs — still valid)
We have deployed the app    (We have deployed the app — now running)
The team has resolved all issues (The team has resolved all issues)
```

> [!note] have vs has
> With I/we/you/they, use `have`. With he/she/it or a singular noun, use `has`. `I have fixed`, `He has fixed`, `The team has fixed`.

Look at the PR description below — written in present perfect tense:

```markdown
## What I have done

- I have refactored the authentication module
- I have added unit tests for all new functions
- I have updated the documentation
- I have fixed the race condition in the cache layer
```

What this means:
- `I have refactored` = I have refactored (done, and still in effect)
- `I have added unit tests` = I have added unit tests
- `I have updated the documentation` = I have updated the documentation
- `I have fixed the race condition` = I have fixed the race condition

> [!tip] PR Description Pattern
> Present perfect works best in PR descriptions: "I have done X, I have changed Y". Because the work is done (past), but the result is still active.

## Future Tense — The Language of Release Notes

Future tense is used for actions that will happen in the future. Release notes, deprecation warnings, and roadmaps all use future tense.

**Structure:** Subject + will + Verb (base form) + Object

```
The API will change         (The API will change)
We will deploy tomorrow     (We will deploy tomorrow)
This feature will be added  (This feature will be added)
The endpoint will be removed (The endpoint will be removed)
```

Look at the release notes below — giving warnings in future tense:

```markdown
## Upcoming Changes (v3.0)

- The legacy API will be deprecated in version 3.0
- Authentication will require API keys starting from March
- The old dashboard will be removed in the next release
- We will add GraphQL support in version 3.1
```

What this means:
- `will be deprecated` = will be deprecated (in the future)
- `will require` = will require
- `will be removed` = will be removed
- `will add` = will add

> [!important] Deprecation Warning
> You will see the word `deprecated` a lot. It means: "This feature still works right now, but it will be removed in some future version." So you should not use it in new code. "Will be deprecated" = will be deprecated, "is deprecated" = has already been deprecated.

## Tense Comparison Table

The table below is interesting — the same action can be expressed in 4 ways, and each tense conveys a different meaning:

| Tense | Structure | Example | Meaning | Where It's Used |
|-------|-----------|---------|---------|-----------------|
| **Present** | Subject + V1(s) | "The function **returns** a value" | The function gives back a value | Documentation |
| **Past** | Subject + V2 | "I **fixed** the bug" | I fixed the bug | Commit message |
| **Present Perfect** | Subject + have/has + V3 | "I **have fixed** the bug" | I have fixed the bug (still valid) | PR description |
| **Future** | Subject + will + V1 | "The API **will change**" | The API will change | Release notes |
| **Imperative** | V1 (no subject) | "**Fix** the bug" | Fix the bug | Command/commit |

> [!note] Imperative Mood
> The imperative mood is a command or instruction — "Fix the bug", "Add a comment", "Update the file". There is no subject (I/you), it starts directly with a verb. The Git commit convention most recommends the imperative mood: "Fix bug" ✅ rather than "Fixed bug" ❌.

## Which Tense in Code Comments?

Look at the code comments below — try to identify which tense each one uses:

```javascript
// Present: This function checks if the user is logged in
// Past: The previous version did not handle this case
// Present Perfect: We have moved authentication to a separate module
// Future: This endpoint will be removed in v2.0
// Imperative: Always validate user input before processing
```

What these comments mean:
- `checks if the user is logged in` = checks whether the user is logged in (present)
- `did not handle this case` = did not handle this case (past)
- `have moved authentication` = have moved authentication (present perfect)
- `will be removed` = will be removed (future)
- `Always validate user input` = always validate user input (imperative — command)

Notice the documentation comment below — all present tense:

```python
# This function converts a CSV file to a JSON object.
# It reads the file line by line, parses each row,
# and returns a list of dictionaries.
# If the file is empty, it returns an empty list.
def csv_to_json(filepath):
    import csv
    with open(filepath) as f:
        return list(csv.DictReader(f))
```

- `converts` = converts (present)
- `reads` = reads (present)
- `parses` = parses (present)
- `returns` = returns (present)

All present tense — because documentation means "how this code works."

## Common Mistakes

### 1. Past Tense in Documentation

```
❌ Wrong:     "The function returned a value."
✅ Correct:   "The function returns a value."
```

Reason: documentation is read all the time, so present tense is needed. With past tense, it would seem like this no longer works.

### 2. Present Tense in Commits

```
❌ Wrong:     "I fix the bug"  (present tense — sounds like it hasn't been done)
✅ Correct:   "I fixed the bug" or "Fix the bug"  (past or imperative)
```

### 3. Auxiliary Verb Errors

```
❌ Wrong:     "I has fixed the bug"  (Do not use "has" with "I")
✅ Correct:   "I have fixed the bug"

❌ Wrong:     "He have updated the code"  (Do not use "have" with "He")
✅ Correct:   "He has updated the code"
```

> [!tip] Quick Rule
> `I/we/you/they` + `have` + past participle. `He/she/it` + `has` + past participle. "I have fixed", "He has fixed", "The team has fixed", "We have fixed".

## Summary Table — Which Tense Where

| Context | Tense | Example |
|---------|-------|---------|
| Documentation | Present | "The function **returns** a value" |
| Code comment (how it works) | Present | "This module **handles** errors" |
| Code comment (command) | Imperative | "**Always validate** input" |
| Commit message | Past / Imperative | "**Fixed** the bug" / "**Fix** the bug" |
| PR description | Present Perfect | "I **have updated** the API" |
| Release notes (upcoming) | Future | "**Will be deprecated** in v3.0" |
| Release notes (done) | Past | "**Added** dark mode in v2.0" |
| Issue report | Present / Past | "The app **crashes** when..." |
| Changelog | Past | "**Removed** legacy endpoints" |

> [!important] Key Takeaway
> Documentation = Present, Commit = Past/Imperative, PR = Present Perfect, Release notes = Future (upcoming) or Past (done). Remember this rule and 90% of your confusion will disappear.

## Quick Exercise

Try to identify which tense each sentence below uses:

| Sentence | Which Tense? |
|----------|-------------|
| "The function returns an array" | Present ✅ |
| "I have fixed the bug" | Present Perfect ✅ |
| "The endpoint will be removed" | Future ✅ |
| "We added a new feature" | Past ✅ |
| "Always check for null values" | Imperative ✅ |

In the next chapter, we will learn articles and prepositions — when to use a/an/the, and how to clear up the confusion between in/on/at.