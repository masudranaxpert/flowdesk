# Common Tech Phrases

You may have learned English words one by one. But when reading documentation, you will notice — you know all the words, but you cannot understand the whole phrase! "throws an error" — you know the word `throw`, you know the word `error`, but what do they mean together?

Today we will learn 30+ such phrases that appear again and again in documentation, tutorials, and Stack Overflow. Knowing these will make reading documentation 80% easier.

## Phrases That Appear Most in Documentation

You will see the phrases below again and again in React docs, Python docs, and MDN. Without understanding them, you really cannot read documentation.

| Phrase | Meaning | Example Sentence |
|--------|---------|-----------------|
| **throws an error** | produces an error | If the file is missing, this **throws an error**. |
| **raises an exception** | creates an exception | Dividing by zero **raises an exception**. |
| **returns a value** | gives back a value | The function **returns a value** of type string. |
| **is deprecated** | outdated, will be removed in a future version | This method **is deprecated**. Use `fetch()` instead. |
| **optional parameter** | you can provide it or skip it | The second argument is an **optional parameter**. |
| **by default** | the default behavior | **By default**, it sorts in ascending order. |
| **under the hood** | what's happening behind the scenes | Let's see what happens **under the hood**. |
| **out of the box** | works without any setup | It works **out of the box**. |
| **best practice** | the recommended way to do something | It's a **best practice** to validate input. |
| **edge case** | a rare but possible situation | What about the **edge case** where input is null? |
| **boilerplate** | repetitive code you write over and over | Just copy the **boilerplate** code. |
| **side effect** | a change affecting things outside the function | This function has no **side effects**. |
| **immutable** | cannot be changed | Strings are **immutable** in Python. |
| **idempotent** | doing it multiple times gives the same result | PUT requests should be **idempotent**. |
| **asynchronous** | takes time, other work continues meanwhile | This operation is **asynchronous**. |
| **synchronous** | waits until it finishes | It's a **synchronous** call. |
| **syntactic sugar** | nicer syntax to make things easier | Arrow functions are **syntactic sugar**. |
| **verbose** | too long, too wordy | This syntax is too **verbose**. |
| **shorthand** | a shorter way to write something | Here's a **shorthand** for this. |

> [!important] Deprecated — Very Important!
> When you see **deprecated** in documentation, stop using it. It means it still works now, but will be removed in the next version. Find an alternative.

## Where You Will See Each Phrase

### "throws an error" / "raises an exception"

Both mean roughly the same — when a problem occurs, the program stops. Look at the code below:

Here, if you give invalid input, the program will throw an error. This behavior is described in documentation as "throws an error":

```python
def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

In the code above, when `b == 0`, `raise ValueError` throws an error. In documentation, this would be written as: "This function **raises an exception** when `b` is zero."

### "under the hood"

This phrase is very common in documentation. It means — "what is actually happening behind the scenes." For example, React docs might say: "Under the hood, `useState` uses a queue of hooks." It means internally, it maintains a queue.

### "out of the box"

You will see this on framework homepages: "Next.js supports image optimization **out of the box**." It means it works without any plugin or setup. Just install it and you get it.

### "side effect"

This term comes up in React, Redux, and functional programming — everywhere. It means: if a function only takes input and gives output, it has no side effect. But if it changes something outside (database update, DOM change, network call) — that is a side effect.

Look at the code below — it shows whether a function has a side effect:

Here the first function has no side effect — it only takes input and gives output. The second function has a side effect — because it changes an outside `count` variable:

```javascript
// No side effect — pure function
function add(a, b) {
    return a + b;
}

// Has side effect — changes outside state
let count = 0;
function increment() {
    count++;   // ← side effect: changes an outside variable
}
```

## How to Describe Bugs

Now we come to the most important part. When your code has a bug, you need to tell someone — on Stack Overflow or to a colleague. How do you describe it? Learn these phrases.

### Common Patterns for Describing Bugs

| Pattern | Meaning | Example |
|---------|---------|---------|
| **It crashes when...** | it crashes when I do... | It **crashes when** I click submit. |
| **The output is wrong** | the output is incorrect | **The output is wrong** — it should be 10 but I get 20. |
| **I'm getting an error** | I am receiving an error | **I'm getting an error** on line 15. |
| **It doesn't work** | it is not functioning | The button **doesn't work**. |
| **It returns null** | it gives back null | The function **returns null** instead of a string. |
| **Nothing happens** | no response occurs | When I click, **nothing happens**. |
| **It hangs / freezes** | it gets stuck | The app **hangs** when loading data. |
| **I can't reproduce it** | I cannot trigger it again | **I can't reproduce** the issue. |

> [!tip] The Best Way to Describe a Bug
> Always mention three things: (1) **what you tried to do**, (2) **what should have happened**, (3) **what is actually happening**. For example: "When I click submit (1), it should show a success message (2), but instead it crashes (3)."

### Bug Report Example

Look at the example below — this is the structure of a good bug report:

Here the bug is clearly described — what triggers it, what should happen, and what actually happens:

```
Title: App crashes when submitting empty form

Steps to reproduce:
1. Open the form page
2. Leave all fields empty
3. Click "Submit"

Expected: Show validation error message
Actual: App crashes with TypeError

Error message:
TypeError: Cannot read properties of undefined (reading 'trim')
    at validateForm (Form.js:42)
```

The bug report above is clear — when you submit an empty form, the app crashes, because the value is undefined when `trim()` is called in the `validateForm` function.

## How to Ask for Help (Stack Overflow Pattern)

If you do not ask a good question on Stack Overflow, no one will answer. But ask a good question and you will get an answer in minutes. Here are some common patterns.

### Phrases to Start a Question

| Pattern | Meaning | Example |
|---------|---------|---------|
| **How do I...?** | how can I do...? | **How do I** sort a list of dictionaries by a key? |
| **Why does...?** | why does... happen? | **Why does** my code throw a TypeError? |
| **What's the difference between...?** | what is the difference between...? | **What's the difference between** `==` and `===`? |
| **Is there a way to...?** | is there any way to...? | **Is there a way to** reverse a string in Python? |
| **I'm trying to...** | I am attempting to... | **I'm trying to** read a CSV file but getting an error. |
| **I'm getting...** | I am receiving... | **I'm getting** a KeyError when accessing the dictionary. |

### Structure for Writing a Good Question

Follow the structure below and everyone will read your question and answer it:

Here is the structure of a good Stack Overflow question — a clear title, the problem, what you tried, and your code:

```
Title: How to remove duplicates from a list while preserving order?

I have a list:
my_list = [1, 3, 2, 3, 1, 4, 2]

I want to remove duplicates but keep the original order.
Expected output: [1, 3, 2, 4]

I tried using set() but it doesn't preserve order:
list(set(my_list))  # → [1, 2, 3, 4] — order lost

How can I do this in Python 3.7+?
```

The question above has everything — what you want, what you tried, and what the problem is. Anyone can answer this in 30 seconds.

> [!important] What NOT to Do on Stack Overflow
> ❌ "It doesn't work, help!" — you didn't say what doesn't work
> ❌ "URGENT!!! Please help!" — saying urgent won't make people help faster
> ❌ Pasting your entire code — only give the relevant part
> ❌ Showing code as a screenshot — always provide code as text

## Common Phrases in Code Comments

You will also see these phrases when reading code comments:

Look at the code below — the comments use some common phrases:

Here the comments show why something was done, what is deprecated, and what is a workaround:

```python
# TODO: refactor this to use a class
# FIXME: this breaks for empty strings
# HACK: temporary workaround for issue #123
# NOTE: deprecated, will be removed in v2.0
# WARNING: do not modify this line
result = data.strip()  # edge case: empty string returns ""
```

What the comments above mean:
- **TODO** = this needs to be done later
- **FIXME** = there is a bug here, it needs to be fixed
- **HACK** = this is done temporarily, not a permanent solution
- **NOTE** = pay attention to this
- **WARNING** = be careful, do not change this

## Memory Tips

> [!tip] How to Remember Phrases
> 1. **Learn in context** — just reading a list is not enough, notice them when reading documentation
> 2. **Use them yourself** — write these phrases in code comments and commit messages
> 3. **Recognize confusing pairs** — `throws an error` and `raises an exception` mean the same thing
> 4. **Think in Bengali, write in English** — first think in Bengali, then translate to English

## Summary

What we learned today:
- The 20+ most common phrases in documentation
- The right language for describing bugs
- The structure for asking good questions on Stack Overflow
- Common markers in code comments (TODO, FIXME, HACK)

Once you learn these phrases well, the fear of reading documentation will decrease a lot. In the next chapter, we will see how to read a full documentation page from start to finish.