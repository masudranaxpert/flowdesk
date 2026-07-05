# Basic Grammar — Sentence Structure

English sentence লেখা মানে ইট পাথর সাজানো না। একটা নিয়ম আছে — কোন word আগে, কোন word পরে। আর ভালো খবর হলো, এই নিয়মটা একবার বুঝলে বাকিটা অনেক সহজ হয়ে যায়। বাংলা আর English এর sentence structure এ একটা বড় পার্থক্য আছে — আজ সেটাই শিখবো।

## Sentence Structure: SVO vs SOV

বাংলায় আমরা যেভাবে কথা বলি: **Subject + Object + Verb** (SOV)
English এ হয়: **Subject + Verb + Object** (SVO)

```
বাংলা (SOV):     আমি  + ভাত  + খাই
                 Subject  Object  Verb

English (SVO):   I     + eat  + rice
                 Subject  Verb  Object
```

এই পার্থক্যটাই সবচেয়ে বড় সমস্যার জায়গা। বাংলায় verb সবার শেষে থাকে, English এ verb মাঝখানে থাকে। চলো আরও কিছু উদাহরণ দেখি:

| বাংলা (SOV) | English (SVO) | ভুল যা হয় |
|-------------|---------------|-----------|
| আমি কোড লিখি | I write code | ~~I code write~~ ❌ |
| সে bug fix করে | He fixes bugs | ~~He bugs fixes~~ ❌ |
| আমরা app deploy করি | We deploy apps | ~~We apps deploy~~ ❌ |
| তুমি data parse করো | You parse data | ~~You data parse~~ ❌ |
| তারা server run করে | They run servers | ~~They servers run~~ ❌ |

> [!important] সবচেয়ে বড় ভুল
> বাংলা থেকে English এ translate করার সময় সবচেয়ে বেশি যে ভুল হয় সেটা হলো — verb টা শেষে রেখে দেওয়া। মনে রাখবে: **English এ verb সবসময় subject এর পরে আসে**, object এর আগে না।

### Developer Sentence উদাহরণ

নিচের code comment টা দেখো — এখানে SVO structure টা খুব স্পষ্ট:

```python
# The function takes a list and returns the first element
def get_first(items):
    return items[0]
```

এই comment টা ভাঙলে: `The function` (Subject) + `takes` (Verb) + `a list` (Object)। আর দ্বিতীয় অংশ: `returns` (Verb) + `the first element` (Object)। এই structure টা মনে রাখলে comment লেখা অনেক সহজ হবে।

## Parts of Speech — সহজ ভাষায়

Sentence এর প্রতিটা word এর একটা কাজ আছে। সেটাকে বলে "part of speech"। চলো 4 টা জরুরি type দেখি:

### 1. Noun (নামপদ) — কোনো জিনিসের নাম

Noun হলো এমন শব্দ যা কোনো জিনিস, মানুষ, জায়গা বা concept এর নাম বোঝায়।

```
Developer এর noun:
  function, variable, array, object, server, database
  user, password, email, request, response, error
  Python, React, GitHub, API, browser
```

> **উদাহরণ:** "The **function** returns a **value**."
> (function = noun, value = noun — দুটোই জিনিসের নাম)

### 2. Verb (ক্রিয়াপদ) — কাজ বোঝায়

Verb হলো এমন শব্দ যা কোনো কাজ বা action বোঝায়। Sentence এ verb না থাকলে sentence হয় না।

```
Developer এর verb:
  write, read, run, return, fetch, send, receive
  fix, update, delete, add, create, build, test
  compile, execute, deploy, debug, crash, load
```

> **উদাহরণ:** "The server **crashed** yesterday."
> (crashed = verb — server কী করলো সেটা বোঝাচ্ছে)

নিচের code তে verb গুলো লক্ষ্য করো — এগুলোই action বোঝায়:

```python
# Fetch the user data from the database
# Validate the email before saving
# Return an error if the password is too short
```

এই comment গুলোর verb গুলো: `Fetch` (আনো), `Validate` (যাচাই করো), `Return` (ফেরত দাও) — প্রতিটা একটা কাজ বোঝাচ্ছে।

### 3. Adjective (বিশেষণ) — noun কে বর্ণনা করে

Adjective হলো এমন শব্দ যা কোনো noun কে বর্ণনা করে — কেমন, কতটা, কোন রকম।

```
Developer এর adjective:
  small, large, empty, full, valid, invalid
  new, old, broken, working, deprecated, optional
  first, last, previous, next, current
```

> **উদাহরণ:** "The **empty** array caused an **unexpected** error."
> (empty = array কে বর্ণনা করছে, unexpected = error কে বর্ণনা করছে)

### 4. Adverb (ক্রিয়াবিশেষণ) — verb কে বর্ণনা করে

Adverb হলো এমন শব্দ যা কোনো verb কে বর্ণনা করে — কীভাবে, কখন, কোথায়, কতটা। অনেক adverb এর শেষে `-ly` থাকে।

```
Developer এর adverb:
  quickly, slowly, carefully, automatically
  always, never, sometimes, usually
  first, then, finally, again
```

> **উদাহরণ:** "The script runs **automatically** every day."
> (automatically = verb "runs" কে বর্ণনা করছে — কীভাবে চলে)

নিচের ছোট টেবিলে চারটা type এর summary দিলাম:

| Part of Speech | কাজ | উদাহরণ | বাংলা মানে |
|----------------|-----|--------|-----------|
| **Noun** | জিনিসের নাম | function, error | function, error |
| **Verb** | কাজ | runs, returns | চালায়, ফেরত দেয় |
| **Adjective** | noun কে বর্ণনা | empty, valid | খালি, বৈধ |
| **Adverb** | verb কে বর্ণনা | quickly, always | দ্রুত, সবসময় |

## Word Order — কোনটা কোথায়?

English এ word order খুব strict। বাংলায় আমরা word গুলো এদিক-ওদিক করে রাখতে পারি, কিন্তু English এ একদম নির্দিষ্ট জায়গায় থাকতে হয়।

### Adjective এর জায়গা

বাংলায় adjective noun এর আগে বা পরে — যেকোনো জায়গায় থাকতে পারে। English এ adjective সবসময় noun এর **আগে** থাকে।

```
✅ সঠিক:    a valid email        (valid = adjective, email = noun)
❌ ভুল:     an email valid

✅ সঠিক:    the empty array
❌ ভুল:     the array empty

✅ সঠিক:    a new feature
❌ ভুল:     a feature new
```

### Adverb এর জায়গা

Adverb সাধারণত verb এর **পরে** থাকে, অথবা sentence এর শেষে।

```
✅ সঠিক:    The function runs quickly
❌ ভুল:     The function quickly runs

✅ সঠিক:    The server crashed yesterday
❌ ভুল:     The server yesterday crashed
```

> [!note] Adjective vs Adverb
> Adjective এর শেষে কিছু থাকে না, adverb এর শেষে অনেক সময় `-ly` থাকে। যেমন: `quick` (adjective) → `quickly` (adverb), `automatic` (adjective) → `automatically` (adverb)।

## বাংলা Speaker দের Common Mistakes

### 1. Article বাদ দেওয়া

বাংলায় "a", "an", "the" এর মতো কিছু নেই। তাই আমরা সবসময় article বাদ দিয়ে দিই।

```
❌ ভুল:     "Function returns value."
✅ সঠিক:    "The function returns a value."

❌ ভুল:     "I created array."
✅ সঠিক:    "I created an array."

❌ ভুল:     "Bug is in file."
✅ সঠিক:    "The bug is in the file."
```

### 2. Subject-Verb Agreement

English এ singular subject এর পরে singular verb, plural subject এর পরে plural verb। বাংলায় এত কড়াকড়ি নেই।

```
❌ ভুল:     "The function return a value."  (function = singular)
✅ সঠিক:    "The function returns a value."

❌ ভুল:     "The functions returns a value."  (functions = plural)
✅ সঠিক:    "The functions return a value."

❌ ভুল:     "He fix bugs."  (he = singular)
✅ সঠিক:    "He fixes bugs."
```

> [!tip] Simple Rule
> Singular subject (he/she/it/একটা function) এর পরে verb এর শেষে `s` বা `es` যোগ হয়: `returns`, `fixes`, `runs`, `loads`। Plural subject (they/functions) এর পরে verb এর শেষে কিছু যোগ হয় না।

### 3. Am/Is/Are এর ভুল ব্যবহার

```
❌ ভুল:     "I am writing code yesterday."  (past tense তে am লাগে না)
✅ সঠিক:    "I was writing code yesterday."

❌ ভুল:     "The code are broken."  (code = singular)
✅ সঠিক:    "The code is broken."

❌ ভুল:     "There is many bugs."  (many bugs = plural)
✅ সঠিক:    "There are many bugs."
```

## Code Comment বোঝার অনুশীলন

নিচের code গুলো দেখো — comment গুলো পড়ে বুঝতে পারছো?

নিচের code এ comment টা বোঝার চেষ্টা করো। SVO structure খুঁজে বের করো — subject কোনটা, verb কোনটা, object কোনটা।

```python
# This function validates the user input before processing
def validate_input(data):
    if not data:
        raise ValueError("Input cannot be empty")
    return True
```

এই comment টা ভাঙলে:
- `This function` = Subject
- `validates` = Verb
- `the user input` = Object
- `before processing` = কখন (adverb phrase)

মানে: "এই function টা processing এর আগে user input validate করে।" আর `raise ValueError` মানে "error raise করো" অর্থাৎ একটা error তৈরি করো।

আরেকটা উদাহরণ দেখো — এখানে adjective আর adverb দুটোই আছে:

```javascript
// The async function fetches user data from the external API
// It returns a promise that resolves with the complete user profile
async function getUserProfile(userId) {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
}
```

- `async function` = adjective (async) + noun (function)
- `fetches` = verb
- `user data` = adjective (user) + noun (data)
- `external API` = adjective (external) + noun (API)
- `returns a promise` = verb + noun
- `complete user profile` = adjective (complete) + noun (profile)

## Exercise: বাংলা থেকে English

নিচের বাংলা sentence গুলো English এ convert করার চেষ্টা করো। SVO structure মাথায় রেখো।

| বাংলা Sentence | English এ কী হবে? |
|----------------|-------------------|
| এই function টা একটা error return করে | This function returns an error |
| সে একটা নতুন feature বানিয়েছে | He created a new feature |
| আমি database থেকে data fetch করছি | I am fetching data from the database |
| এই কোডটা ঠিক কাজ করছে না | This code is not working properly |
| Server টা হঠাৎ crash করেছে | The server crashed suddenly |
| এই array টা empty | This array is empty |
| আমরা কালকে deploy করবো | We will deploy tomorrow |
| Bug টা login page এ আছে | The bug is in the login page |

> [!important] Practice করো
> প্রতিদিন ৫-১০ টা বাংলা sentence নিও, English এ convert করো। শুরুতে ভুল হবে — সেটাই normal। ভুল থেকেই শিখবে। এক সপ্তাহের মধ্যে পার্থক্য টের পাবে।

## Summary

- English sentence structure: **Subject + Verb + Object** (SVO) — বাংলায় হয় SOV
- Verb সবসময় subject এর ঠিক পরে আসে — object এর আগে না
- Adjective noun এর আগে থাকে, adverb verb এর পরে থাকে
- Common mistakes: article বাদ দেওয়া, subject-verb agreement, am/is/are ভুল
- Code comment পড়ে SVO structure চিনলে মানে বোঝা যায়

পরের chapter এ আমরা tense শিখবো — past, present, future — আর কোথায় কোন tense ব্যবহার করতে হয়।