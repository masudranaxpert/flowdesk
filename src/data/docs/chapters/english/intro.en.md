# Why Developers Need English

Let me tell you something real. You are writing code, and suddenly an error pops up — `TypeError: Cannot read properties of undefined (reading 'map')`. Now you search Google for help. The Stack Overflow answers — what language are they in? English. The React documentation — what language? English. When you file an issue on GitHub, what language do you write in? English.

This is not an optional skill — it is the survival language of a developer. But do not be afraid. You do not need to become Shakespeare. You just need to be able to do this: read something and understand it, write something so others understand it.

## What You Cannot Do Without English

Think about it — what struggles will you face without English?

```
Problem                          What happens without English
─────────────────────────────────────────────────────────────
Reading error messages           "TypeError" itself looks scary, you won't understand it
Getting help from Stack Overflow  You won't understand questions or answers
Reading documentation             React/Node/Python docs are all in English
Writing GitHub issues / PRs       You can't communicate with the team
Choosing an npm package           You won't understand READMEs or which one is good
Watching tutorials                The best YouTube tutorials are all in English
Job interviews                    You won't understand questions or give answers
```

Look at this common error message — see how easy it becomes when you can read English:

The error below is very common — in React, when you call a method on a variable before its value has arrived. If you can read English, you can understand the problem just from the message itself.

```
TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (App.js:15)
```

It means: the `map` function was called on `undefined` — that is, in the `UserList` component, `map` is being called before any data has loaded. `Cannot read properties of undefined` is exactly what it sounds like — you are trying to read a property of something that does not exist. Just reading one line and you already understand the problem!

> [!note] Error Message = A Formula
> Error messages are not just random text. They follow a specific pattern — `ErrorType: What went wrong (where)`. Once you recognize this pattern, you can solve many errors much faster.

## The Goal: "Technical English", Not English Literature

Many people think — "My English is not good, so I can never be a good developer." This is completely wrong.

Your goal is not to write like Shakespeare. Your goal is:

```
🎯 Technical English — what you need to be able to do:
────────────────────────────────────────────
✅ Read an error message and understand it
✅ Read documentation and use an API
✅ Understand Stack Overflow answers
✅ Write commit messages and PR descriptions
✅ Give meaningful names to variables and functions
✅ Read code comments and understand them
✅ Explain your problem in simple sentences
```

```
❌ What you do NOT need to do:
─────────────────────────────
❌ Write poetry or novels
❌ Study complex grammar
❌ Speak with a native accent
❌ Memorize 5000+ vocabulary words
❌ Write academic papers
```

> [!important] Remember
> With just 300–500 technical words and basic grammar, you can read documentation. You do not need to learn the entire English language.

## Real Examples: Where English Is Needed

Let's see where a developer needs English every single day.

### 1. Reading Error Messages

When you run the code below, what error will appear? Being able to read and understand it is crucial. Notice that every word in the error message is nothing complex.

```python
# Running this code will cause an error
numbers = [1, 2, 3]
print(numbers[5])
```

```
IndexError: list index out of range
```

`IndexError` = an error related to an index, `list index out of range` means "the index is beyond the bounds of the list" — that is, you tried to access an index that is larger than the number of elements in the list. Understanding this one line is enough to fix it.

### 2. Reading Documentation

Let's look at a sentence from React's documentation:

> "The `useState` hook lets you add state to functional components."

What does this mean? "`useState` hook allows you to add state to a functional component." Simple, right? `lets you add` = "gives you the ability to add." This kind of sentence makes up 90% of documentation.

### 3. Writing Commit Messages

The commit messages below need to be written every day. Notice — each one is no more than 5–8 words.

```bash
# Good commit messages — clear and short
git commit -m "Fix login bug on mobile devices"
git commit -m "Add dark mode toggle to settings page"
git commit -m "Update README with installation steps"
git commit -m "Remove unused imports from utils"
```

Here `Fix` = repair, `Add` = include, `Update` = bring up to date, `Remove` = delete — just 4–5 verbs and you can write your daily commit messages. Memorizing these verbs will take you a long way.

### 4. Writing PR Descriptions

```
## What does this PR do?
This PR adds password reset functionality.

## Changes
- Added forgot_password endpoint
- Updated email template
- Added rate limiting for reset attempts

## Testing
Tested manually with Gmail and Yahoo email addresses.
```

What does this mean? Here is a quick breakdown:

- `What does this PR do?` = What does this PR do?
- `This PR adds password reset functionality` = This PR adds the password reset feature
- `Changes` = What was changed
- `Added forgot_password endpoint` = A forgot_password endpoint was added
- `Testing` = How it was tested
- `Tested manually` = Tested by hand

## What We Say in Bengali vs What to Say in English

| Situation | In Bengali | In English |
|-----------|------------|------------|
| Code is not working | "কোড টা কাজ করছে না" | "The code is not working" |
| Found a bug | "একটা bug পেলাম" | "I found a bug" |
| Need to deploy | "deploy করতে হবে" | "We need to deploy this" |
| Asking for help | "ভাই, একটু সাহায্য করো" | "Can you help me with this?" |
| Asking for code review | "কোড টা দেখে দাও" | "Could you review my code?" |
| Don't understand | "বুঝতে পারছি না" | "I don't understand this" |
| Say it again | "আরেকবার বলো" | "Could you explain that again?" |
| Fixed something | "আমি এটা ঠিক করেছি" | "I fixed this issue" |
| Added a new feature | "নতুন feature বানিয়েছি" | "I added a new feature" |
| Removed old code | "পুরনো কোড মুছেছি" | "I removed the old code" |
| This won't work | "এটা কাজ করবে না" | "This won't work" |
| Good idea | "ভালো আইডিয়া!" | "That's a great idea!" |

> [!tip] Spot the Pattern
> Did you notice? Most sentences are very short — Subject + Verb + Object. "I found a bug", "I fixed this", "We need to deploy". You do not need complex sentences.

## Learning Roadmap

You do not need to learn everything at once. Here is a practical roadmap:

```
Step 1: Vocabulary (1–2 weeks)
─────────────────────────────────
Memorize 10–15 technical words every day:
  function, variable, array, object, loop, condition
  return, parameter, argument, method, property
  error, exception, debug, compile, execute
  fetch, request, response, endpoint, API

Step 2: Reading Documentation (2–4 weeks)
──────────────────────────────────────────
Read short documentation sections:
  → Easy pages on MDN
  → "Quick Start" in React docs
  → First chapter of a Python tutorial
  → README file of an npm package

Step 3: Writing Practice (4–6 weeks)
─────────────────────────────────────
Write small things:
  → Write code comments in English
  → Write commit messages properly
  → Try answering questions on Stack Overflow
  → Write a project README

Step 4: Communication (6–8 weeks)
──────────────────────────────────────
Practice communicating more actively:
  → File a GitHub issue
  → Write PR review comments
  → Ask questions on Discord/Slack
  → Ask a question on Stack Overflow
```

> [!note] It Takes Time
> This will not happen in one day. But if you practice 30 minutes every day, you will feel comfortable in 3–6 months. And once you are comfortable — the entire world's documentation is in your hands.

## 25 Common Words to Start With

The words below are the most frequently used by developers. Memorize them and half the work is done.

| Word | Meaning | Example |
|------|---------|---------|
| function | a block of code that does a task | "This function returns a value" |
| variable | a named container for data | "Declare a variable" |
| parameter | input defined in a function | "Pass a parameter" |
| return | give back a result | "Return the result" |
| assign | give a value to something | "Assign a value" |
| declare | announce something exists | "Declare a function" |
| define | specify how something works | "Define a class" |
| implement | write the actual code for | "Implement the interface" |
| initialize | set up for first use | "Initialize the variable" |
| execute | run or carry out | "Execute the function" |
| call | invoke or trigger | "Call the method" |
| handle | deal with, manage | "Handle the error" |
| trigger | cause to happen | "Trigger the event" |
| parse | read and interpret | "Parse the JSON" |
| fetch | go get data | "Fetch data from API" |
| update | make current | "Update the record" |
| remove | delete, take away | "Remove the element" |
| iterate | go through each item | "Iterate over the array" |
| validate | check for correctness | "Validate the input" |
| deprecated | outdated, will be removed | "This method is deprecated" |
| async | asynchronous, takes time | "Async function" |
| render | display on screen | "Render the component" |
| compile | translate to runnable code | "Compile the code" |
| deploy | release to a server | "Deploy to production" |
| debug | find and fix errors | "Debug the issue" |

> [!tip] Vocabulary Tip
> Do not just memorize words — use them in sentences. For example, after learning "return", write "This function returns the total price." If you do not use words in sentences, you will forget them.

## A Small Challenge

Finally, here is a small challenge. Can you understand the code comments below?

```javascript
// This function calculates the total price of items in the cart
// It takes an array of items and returns a number
function calculateTotal(items) {
    let total = 0;
    for (let item of items) {
        total += item.price;
    }
    return total;
}
```

What does this mean? Here is a breakdown:

- `This function calculates the total price` = This function computes the total cost
- `of items in the cart` = of the items inside the cart
- `It takes an array of items` = It receives an array of items as input
- `and returns a number` = and gives back a number as output

Did you notice? All the words are simple. `calculates` = computes, `takes` = receives, `returns` = gives back. You will need to read comments like this every day — and over time, this will become completely natural.

> [!important] Start Today
> Start today. Every day, read one documentation page, read one Stack Overflow answer, learn five new words. After six months, you will be amazed at how far you have come.

## Summary

- Knowing English as a developer is essential — error messages, documentation, and Stack Overflow are all in English
- You do not need to be fluent — just knowing "technical English" is enough
- With 300–500 technical words and basic grammar, you can handle 90% of the work
- Roadmap: vocabulary → reading documentation → writing → communication
- Practice 30 minutes every day — you will feel comfortable in 3–6 months

In the next chapter, we will learn basic grammar — how sentences are structured, what Subject-Verb-Object means — all in simple language.