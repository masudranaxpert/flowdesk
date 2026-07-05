# Basic Grammar — Sentence Structure

Writing an English sentence is not like stacking bricks randomly. There is a rule — which word comes first, which word comes next. And the good news is, once you understand this rule, everything else becomes much easier. There is a big difference between Bengali and English sentence structure — and that is exactly what we will learn today.

## Sentence Structure: SVO vs SOV

How we speak in Bengali: **Subject + Object + Verb** (SOV)
In English it is: **Subject + Verb + Object** (SVO)

```
Bengali (SOV):   I     + rice  + eat
                 Subject  Object  Verb

English (SVO):   I     + eat   + rice
                 Subject  Verb  Object
```

This difference is the biggest source of confusion. In Bengali, the verb comes at the very end. In English, the verb comes in the middle. Let's look at more examples:

| Bengali (SOV) | English (SVO) | The Mistake |
|---------------|---------------|-------------|
| আমি কোড লিখি | I write code | ~~I code write~~ ❌ |
| সে bug fix করে | He fixes bugs | ~~He bugs fixes~~ ❌ |
| আমরা app deploy করি | We deploy apps | ~~We apps deploy~~ ❌ |
| তুমি data parse করো | You parse data | ~~You data parse~~ ❌ |
| তারা server run করে | They run servers | ~~They servers run~~ ❌ |

> [!important] The Biggest Mistake
> When translating from Bengali to English, the most common mistake is leaving the verb at the end. Remember: **In English, the verb always comes right after the subject**, not before the object.

### Developer Sentence Example

Look at the code comment below — the SVO structure is very clear here:

```python
# The function takes a list and returns the first element
def get_first(items):
    return items[0]
```

Breaking this comment down: `The function` (Subject) + `takes` (Verb) + `a list` (Object). And the second part: `returns` (Verb) + `the first element` (Object). Remembering this structure will make writing comments much easier.

## Parts of Speech — In Simple Terms

Every word in a sentence has a job. That job is called a "part of speech." Let's look at 4 essential types:

### 1. Noun — The name of something

A noun is a word that names a thing, person, place, or concept.

```
Developer nouns:
  function, variable, array, object, server, database
  user, password, email, request, response, error
  Python, React, GitHub, API, browser
```

> **Example:** "The **function** returns a **value**."
> (function = noun, value = noun — both are names of things)

### 2. Verb — Shows an action

A verb is a word that shows an action or something happening. Without a verb, a sentence is not a sentence.

```
Developer verbs:
  write, read, run, return, fetch, send, receive
  fix, update, delete, add, create, build, test
  compile, execute, deploy, debug, crash, load
```

> **Example:** "The server **crashed** yesterday."
> (crashed = verb — shows what the server did)

Look at the verbs in the code below — each one shows an action:

```python
# Fetch the user data from the database
# Validate the email before saving
# Return an error if the password is too short
```

The verbs in these comments: `Fetch` (go get), `Validate` (check), `Return` (give back) — each one describes an action.

### 3. Adjective — Describes a noun

An adjective is a word that describes a noun — what kind, how much, which one.

```
Developer adjectives:
  small, large, empty, full, valid, invalid
  new, old, broken, working, deprecated, optional
  first, last, previous, next, current
```

> **Example:** "The **empty** array caused an **unexpected** error."
> (empty = describes the array, unexpected = describes the error)

### 4. Adverb — Describes a verb

An adverb is a word that describes a verb — how, when, where, how much. Many adverbs end with `-ly`.

```
Developer adverbs:
  quickly, slowly, carefully, automatically
  always, never, sometimes, usually
  first, then, finally, again
```

> **Example:** "The script runs **automatically** every day."
> (automatically = describes the verb "runs" — how it runs)

Here is a quick summary table of all four types:

| Part of Speech | Job | Example | Meaning |
|----------------|-----|---------|---------|
| **Noun** | Names a thing | function, error | a thing, a concept |
| **Verb** | Shows action | runs, returns | an action |
| **Adjective** | Describes a noun | empty, valid | what kind |
| **Adverb** | Describes a verb | quickly, always | how, when |

## Word Order — What Goes Where?

In English, word order is very strict. In Bengali, we can move words around, but in English, each word must be in its specific place.

### Adjective Position

In Bengali, adjectives can go before or after nouns. In English, adjectives always come **before** the noun.

```
✅ Correct:   a valid email        (valid = adjective, email = noun)
❌ Wrong:     an email valid

✅ Correct:   the empty array
❌ Wrong:     the array empty

✅ Correct:   a new feature
❌ Wrong:     a feature new
```

### Adverb Position

Adverbs usually come **after** the verb, or at the end of the sentence.

```
✅ Correct:   The function runs quickly
❌ Wrong:     The function quickly runs

✅ Correct:   The server crashed yesterday
❌ Wrong:     The server yesterday crashed
```

> [!note] Adjective vs Adverb
> Adjectives do not have a special ending, but many adverbs end with `-ly`. For example: `quick` (adjective) → `quickly` (adverb), `automatic` (adjective) → `automatically` (adverb).

## Common Mistakes for Bengali Speakers

### 1. Dropping Articles

Bengali does not have words like "a", "an", or "the". So we tend to drop them entirely.

```
❌ Wrong:     "Function returns value."
✅ Correct:   "The function returns a value."

❌ Wrong:     "I created array."
✅ Correct:   "I created an array."

❌ Wrong:     "Bug is in file."
✅ Correct:   "The bug is in the file."
```

### 2. Subject-Verb Agreement

In English, a singular subject takes a singular verb, and a plural subject takes a plural verb. Bengali is not as strict about this.

```
❌ Wrong:     "The function return a value."  (function = singular)
✅ Correct:   "The function returns a value."

❌ Wrong:     "The functions returns a value."  (functions = plural)
✅ Correct:   "The functions return a value."

❌ Wrong:     "He fix bugs."  (he = singular)
✅ Correct:   "He fixes bugs."
```

> [!tip] Simple Rule
> After a singular subject (he/she/it/one function), the verb gets an `s` or `es` at the end: `returns`, `fixes`, `runs`, `loads`. After a plural subject (they/functions), the verb does not change.

### 3. Wrong Use of Am/Is/Are

```
❌ Wrong:     "I am writing code yesterday."  (past tense does not use "am")
✅ Correct:   "I was writing code yesterday."

❌ Wrong:     "The code are broken."  (code = singular)
✅ Correct:   "The code is broken."

❌ Wrong:     "There is many bugs."  (many bugs = plural)
✅ Correct:   "There are many bugs."
```

## Practice: Understanding Code Comments

Look at the code below — can you understand the comments?

Try to understand the comment in the code below. Find the SVO structure — which is the subject, which is the verb, which is the object.

```python
# This function validates the user input before processing
def validate_input(data):
    if not data:
        raise ValueError("Input cannot be empty")
    return True
```

Breaking this comment down:
- `This function` = Subject
- `validates` = Verb
- `the user input` = Object
- `before processing` = when (adverb phrase)

Meaning: "This function validates user input before processing it." And `raise ValueError` means "throw an error" — that is, create an error.

Let's look at another example — this one has both adjectives and adverbs:

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

## Exercise: Bengali to English

Try converting the Bengali sentences below into English. Keep the SVO structure in mind.

| Bengali Sentence | What is it in English? |
|------------------|----------------------|
| এই function টা একটা error return করে | This function returns an error |
| সে একটা নতুন feature বানিয়েছে | He created a new feature |
| আমি database থেকে data fetch করছি | I am fetching data from the database |
| এই কোডটা ঠিক কাজ করছে না | This code is not working properly |
| Server টা হঠাৎ crash করেছে | The server crashed suddenly |
| এই array টা empty | This array is empty |
| আমরা কালকে deploy করবো | We will deploy tomorrow |
| Bug টা login page এ আছে | The bug is in the login page |

> [!important] Practice
> Every day, take 5–10 Bengali sentences and convert them to English. At first, you will make mistakes — that is normal. You learn from mistakes. Within a week, you will notice the difference.

## Summary

- English sentence structure: **Subject + Verb + Object** (SVO) — Bengali uses SOV
- The verb always comes right after the subject — not before the object
- Adjectives go before nouns, adverbs go after verbs
- Common mistakes: dropping articles, subject-verb agreement, am/is/are errors
- Reading code comments and identifying the SVO structure helps you understand the meaning

In the next chapter, we will learn tenses — past, present, future — and where to use which tense.