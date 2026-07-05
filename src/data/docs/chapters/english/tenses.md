# Tense — Past, Present, Future

তুমি একটা commit লিখলে: "I **was** fix the bug।" — এটা ভুল। কিন্তু কোথায় ভুল? "I **fixed** the bug" হবে, নাকি "I **fix** the bug" হবে, নাকি "I **have fixed** the bug" হবে? এই confusion টা দূর করাই আজকের লক্ষ্য।

Tense মানে হলো — কাজটা কখন হয়েছে: অতীতে, বর্তমানে, নাকি ভবিষ্যতে? Developer হিসেবে তিনটা tense সবচেয়ে বেশি কাজে লাগে — আর সেগুলোই আজ শিখবো।

## Tense কেন জরুরি?

বাংলায় আমরা verb এর শেষে `-ছিল`, `-লাম`, `-বো` যোগ করে tense বোঝাই। English এ verb এর রূপ বদলায়। আর developer হিসেবে tense সবচেয়ে বেশি কোথায় লাগে?

```
কোথায় কোন tense লাগে:
─────────────────────────────────────────────
Documentation → Present tense  → "The function returns..."
Commit message → Past tense    → "Fixed the login bug"
PR description → Present perfect → "I have updated the API"
Release notes  → Future tense  → "Will be deprecated in v3.0"
```

> [!important] সবচেয়ে common confusion
> Commit message এ কোন tense? Documentation এ কোন tense? অনেকে ভুল করে documentation এ past tense লেখে — "The function returned a value" (ভুল)। সঠিক হলো: "The function returns a value" (present tense)। কারণ documentation সবসময় present এ লেখা হয়।

## Simple Present Tense — Documentation এর ভাষা

Simple present tense হলো সবচেয়ে common tense — documentation, code comment, README সবখানে এটাই ব্যবহৃত হয়।

**Structure:** Subject + Verb (base form) + Object

```
I write code           (আমি কোড লিখি)
The function returns... (function টা ফেরত দেয়...)
The server runs...     (server টা চলে...)
The API accepts...     (API টা গ্রহণ করে...)
```

> [!note] Singular Subject Rule
> He/she/it বা singular noun (function, server) এর পরে verb এর শেষে `s` যোগ হয়: `returns`, `runs`, `accepts`, `sends`, `loads`। I/we/you/they বা plural noun এর পরে `s` লাগে না।

নিচের documentation উদাহরণ দেখো — সব present tense এ আছে:

```python
"""
This module handles user authentication.

The login function takes a username and password,
validates the credentials, and returns a JWT token.
If the credentials are invalid, it raises an error.
"""
```

এই comment গুলোর মানে:
- `handles` = সামাল দেয় (present tense, singular subject "module")
- `takes` = নেয় (present tense, singular subject "function")
- `validates` = যাচাই করে (present tense)
- `returns` = ফেরত দেয় (present tense)
- `raises` = তোলে/তৈরি করে (present tense)

সব কাজ বর্তমানে হচ্ছে — কারণ এই module টা এখন এভাবেই কাজ করে। Documentation সবসময় present tense এ লেখা হয়।

> [!tip] Documentation Rule
> Documentation এ সবসময় present tense লেখো। "The function **returns** a value" ✅ — "The function **returned** a value" ❌। কারণ documentation বোঝায় জিনিসটা কীভাবে কাজ করে — সেটা অতীতে হয়নি, এখনও হচ্ছে।

## Simple Past Tense — Commit এর ভাষা

Simple past tense ব্যবহার হয় যে কাজ ইতিমধ্যে শেষ হয়ে গেছে। Git commit, bug report, incident report — এসবে past tense লাগে।

**Structure:** Subject + Verb (past form) + Object

```
I fixed the bug        (আমি bug টা ঠিক করেছি)
He added a feature     (সে একটা feature যোগ করেছে)
The server crashed     (server টা crash করেছিল)
We deployed yesterday  (আমরা কালকে deploy করেছিলাম)
```

Common verb গুলোর past form:

| Base Form (বর্তমান) | Past Form (অতীত) | বাংলা মানে |
|--------------------|--------------------|-----------|
| fix | fixed | ঠিক করলাম |
| add | added | যোগ করলাম |
| update | updated | আপডেট করলাম |
| remove | removed | মুছে ফেললাম |
| create | created | তৈরি করলাম |
| run | ran | চালিয়েছিলাম |
| send | sent | পাঠিয়েছিলাম |
| build | built | বানিয়েছিলাম |
| crash | crashed | crash করেছিল |
| deploy | deployed | deploy করেছিলাম |

নিচের commit message গুলো দেখো — সব past tense এ আছে:

```bash
# Past tense commit messages
git commit -m "Fixed memory leak in image processor"
git commit -m "Added pagination to search results"
git commit -m "Updated React to version 18.2"
git commit -m "Removed deprecated API endpoints"
git commit -m "Resolved merge conflict in utils.js"
```

এই commit message গুলোর মানে:
- `Fixed memory leak` = memory leak ঠিক করা হয়েছে
- `Added pagination` = pagination যোগ করা হয়েছে
- `Updated React` = React আপডেট করা হয়েছে
- `Removed deprecated API endpoints` = পুরনো API endpoint গুলো মুছে ফেলা হয়েছে
- `Resolved merge conflict` = merge conflict সমাধান করা হয়েছে

> [!note] Commit Message Convention
> অনেক project commit message এ past tense না, **imperative** (command) mood ব্যবহার করে: "Fix bug", "Add feature", "Update docs" — যেন sentence টা command এর মতো শোনায়। Git convention অনুযায়ী imperative mood বেশি standard। তবে past tense ও অনেক project এ accepted। তোমার project এর convention টা follow করো।

## Present Perfect Tense — PR Description এর ভাষা

Present perfect tense ব্যবহার হয় যে কাজ অতীতে শুরু হয়েছে কিন্তু এখনও প্রাসঙ্গিক — অর্থাৎ কাজটা হয়েছে, আর এর প্রভাব এখনও আছে। PR description, changelog, status update — এসবে এটা লাগে।

**Structure:** Subject + have/has + Verb (past participle) + Object

```
I have fixed the bug        (আমি bug টা ঠিক করেছি — এখনও valid)
He has updated the docs     (সে docs আপডেট করেছে — এখনও valid)
We have deployed the app    (আমরা app deploy করেছি — এখন running)
The team has resolved all issues (team সব issue resolve করেছে)
```

> [!note] have vs has
> I/we/you/they এর সাথে `have` বসে। He/she/it বা singular noun এর সাথে `has` বসে। `I have fixed`, `He has fixed`, `The team has fixed`।

নিচের PR description দেখো — present perfect tense এ লেখা:

```markdown
## What I have done

- I have refactored the authentication module
- I have added unit tests for all new functions
- I have updated the documentation
- I have fixed the race condition in the cache layer
```

এর মানে:
- `I have refactored` = আমি refactor করেছি (কাজ হয়েছে, এখনও আছে)
- `I have added unit tests` = unit test যোগ করেছি
- `I have updated the documentation` = documentation আপডেট করেছি
- `I have fixed the race condition` = race condition ঠিক করেছি

> [!tip] PR Description Pattern
> PR description এ present perfect সবচেয়ে ভালো লাগে: "I have done X, I have changed Y"। কারণ কাজ হয়ে গেছে (past), কিন্তু result টা এখনও active।

## Future Tense — Release Notes এর ভাষা

Future tense ব্যবহার হয় যে কাজ ভবিষ্যতে হবে। Release notes, deprecation warning, roadmap — এসবে future tense লাগে।

**Structure:** Subject + will + Verb (base form) + Object

```
The API will change         (API টা পরিবর্তন হবে)
We will deploy tomorrow     (আমরা কালকে deploy করবো)
This feature will be added  (এই feature টা যোগ করা হবে)
The endpoint will be removed (endpoint টা মুছে ফেলা হবে)
```

নিচের release notes দেখো — future tense এ warning দেওয়া হয়েছে:

```markdown
## Upcoming Changes (v3.0)

- The legacy API will be deprecated in version 3.0
- Authentication will require API keys starting from March
- The old dashboard will be removed in the next release
- We will add GraphQL support in version 3.1
```

এর মানে:
- `will be deprecated` = deprecated করা হবে (ভবিষ্যতে)
- `will require` = প্রয়োজন হবে
- `will be removed` = মুছে ফেলা হবে
- `will add` = যোগ করা হবে

> [!important] Deprecation Warning
> `deprecated` শব্দটা অনেক দেখবে। মানে: "এই feature টা এখনও কাজ করছে, কিন্তু ভবিষ্যতের কোনো version এ মুছে ফেলা হবে।" তাই নতুন কোডে এটা ব্যবহার করা উচিত না। "Will be deprecated" = deprecated হবে, "is deprecated" = deprecated হয়ে গেছে।

## Tense Comparison Table

নিচের table টা মজার — একই কাজ ৪ ভাবে বলা যায়, কোন tense এ কী মানে বোঝায়:

| Tense | Structure | Example | বাংলা মানে | কোথায় লাগে |
|-------|-----------|---------|-----------|------------|
| **Present** | Subject + V1(s) | "The function **returns** a value" | function টা value ফেরত দেয় | Documentation |
| **Past** | Subject + V2 | "I **fixed** the bug" | আমি bug টা ঠিক করেছি | Commit message |
| **Present Perfect** | Subject + have/has + V3 | "I **have fixed** the bug" | আমি bug টা ঠিক করেছি (এখনও valid) | PR description |
| **Future** | Subject + will + V1 | "The API **will change**" | API টা পরিবর্তন হবে | Release notes |
| **Imperative** | V1 (no subject) | "**Fix** the bug" | bug টা ঠিক করো | Command/commit |

> [!note] Imperative Mood
> Imperative mood হলো command বা নির্দেশ — "Fix the bug", "Add a comment", "Update the file"। এখানে subject (I/you) থাকে না, শুধু verb দিয়ে শুরু হয়। Git commit convention এ imperative mood সবচেয়ে বেশি recommended: "Fix bug" ✅ না যে "Fixed bug" ❌।

## Code Comment এ কোন Tense?

নিচের code comment গুলো দেখো — কোন tense এ লেখা আছে বোঝার চেষ্টা করো:

```javascript
// Present: This function checks if the user is logged in
// Past: The previous version did not handle this case
// Present Perfect: We have moved authentication to a separate module
// Future: This endpoint will be removed in v2.0
// Imperative: Always validate user input before processing
```

এই comment গুলোর মানে:
- `checks if the user is logged in` = user logged in কিনা check করে (present)
- `did not handle this case` = এই case টা handle করত না (past)
- `have moved authentication` = authentication কে move করেছি (present perfect)
- `will be removed` = মুছে ফেলা হবে (future)
- `Always validate user input` = সবসময় user input validate করো (imperative — command)

নিচের documentation comment টা লক্ষ্য করো — সব present tense:

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

- `converts` = convert করে (present)
- `reads` = পড়ে (present)
- `parses` = parse করে (present)
- `returns` = ফেরত দেয় (present)

সব present tense — কারণ documentation মানে হলো "এই কোড কীভাবে কাজ করে"।

## Common Mistakes

### 1. Documentation এ Past Tense

```
❌ ভুল:     "The function returned a value."
✅ সঠিক:    "The function returns a value."
```

কারণ: documentation প্রতিনিয়ত পড়া হয়, তাই present tense লাগে। Past tense দিলে মনে হবে এটা এখন আর কাজ করে না।

### 2. Commit এ Present Tense

```
❌ ভুল:     "I fix the bug"  (present tense — কাজ হয়নি এমন মনে হয়)
✅ সঠিক:    "I fixed the bug" বা "Fix the bug"  (past বা imperative)
```

### 3. Auxiliary Verb ভুল

```
❌ ভুল:     "I has fixed the bug"  (I এর সাথে has না)
✅ সঠিক:    "I have fixed the bug"

❌ ভুল:     "He have updated the code"  (He এর সাথে have না)
✅ সঠিক:    "He has updated the code"
```

> [!tip] Quick Rule
> `I/we/you/they` + `have` + past participle। `He/she/it` + `has` + past participle। "I have fixed", "He has fixed", "The team has fixed", "We have fixed"।

## Summary Table — কোথায় কোন Tense

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

> [!important] মূল কথা
> Documentation = Present, Commit = Past/Imperative, PR = Present Perfect, Release notes = Future (upcoming) বা Past (done)। এই rule টা মনে রাখলে 90% confusion দূর হবে।

## Quick Exercise

নিচের sentence গুলো কোন tense এ আছে — বোঝার চেষ্টা করো:

| Sentence | কোন Tense? |
|----------|-----------|
| "The function returns an array" | Present ✅ |
| "I have fixed the bug" | Present Perfect ✅ |
| "The endpoint will be removed" | Future ✅ |
| "We added a new feature" | Past ✅ |
| "Always check for null values" | Imperative ✅ |

পরের chapter এ আমরা article আর preposition শিখবো — a/an/the কখন বসে, in/on/at এর confusion কীভাবে দূর করবে।