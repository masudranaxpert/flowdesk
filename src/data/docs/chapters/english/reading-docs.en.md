# How to Read Technical Documentation

Let me tell you a truth — what is the difference between a good developer and an average developer? A good developer reads the documentation first, then writes code. An average developer writes code first, and reads the documentation only when they get an error.

Reading documentation is a skill. No one is born with it. But once you understand the patterns, you can read the docs of any library — React, Python, Django, FastAPI — all of them. Today we will learn that technique.

## Why Is Reading Documentation So Important?

Think about it — why do all senior developers say "read the docs"?

```
Reason 1: The people who built the library wrote the documentation — they know it best
Reason 2: A tutorial only shows one task, docs explain the whole thing
Reason 3: Stack Overflow answers can be wrong, docs are not
Reason 4: When a new version comes out, tutorials become outdated, but docs get updated
Reason 5: If you cannot read docs, you cannot learn new technology
```

## Anatomy of a Documentation Page

Every documentation page has some common sections. Once you recognize this structure — reading any docs becomes easy.

### What a Documentation Page Contains

You will see the structure below in Python docs, React docs, MDN — everywhere:

Here is the typical structure of a documentation page:

```
1. Title          → name of the function/method
2. Description    → what it does, why you need it
3. Syntax         → how to call it
4. Parameters     → what inputs to provide
5. Return Value   → what value it returns
6. Examples       → code example
7. See Also       → related functions
8. Notes/Warnings → things to watch out for
```

These 8 sections appear in every documentation. Let us look at them one by one.

## Reading a Function Signature

The scariest thing in documentation is the function signature — those big `()` and types. But it is actually very simple.

Look at the function signature below — it describes a function:

Here is the signature of the `str.split()` function. Each part has a separate meaning:

```
str.split(sep=None, maxsplit=-1)
│       │    │         │
│       │    │         └── maxsplit: how many times to split (-1 = all)
│       │    └────────── sep: which delimiter to split by (None = whitespace)
│       └────────────── split: name of the function
└────────────────────── str: which type it operates on
```

From the signature above, we can understand: the `str.split()` function works on strings. The `sep` parameter is optional (default `None`), `maxsplit` is also optional (default `-1`).

### Reading Type Hints

Look at the signature below — it has type hints:

The `->` symbol indicates the return type. And `list[str]` means a list of strings:

```python
def sort_list(items: list[str], reverse: bool = False) -> list[str]:
    ...
```

From this signature we read: the `items` parameter must be a list of strings. `reverse` is a boolean, default `False`. And this function returns a list of strings.

> [!tip] The arrow (->) means "returns"
> When you see `->`, understand — the type written after it is what the function returns. `-> str` means it returns a string. `-> None` means it returns nothing.

## Reading a Parameter Table

In documentation, parameters are usually given in a table format. Being able to read this table is very important.

### Columns in a Parameter Table

Look at the table below — it is a typical parameter table:

It has 4 columns — each has a different purpose:

| Column | What It Means | Why You Need It |
|--------|--------------|-----------------|
| **Name** | the parameter's name | you use this name when calling |
| **Type** | what type of value to provide | wrong type will cause an error |
| **Default** | the value if you do not provide one | tells if it is optional or required |
| **Description** | what it does | tells you what to provide |

### A Real Example

Look at the parameter table for Python's `list.sort()`:

Here are the two parameters of `list.sort()` — both are optional:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `function` | `None` | A function that serves as a key for the sort comparison. |
| `reverse` | `bool` | `False` | If `True`, the list is sorted in descending order. |

From the table above we understand: both parameters are optional. If you provide `key`, it must be a function. If you provide `reverse`, the list sorts in reverse order.

## Real Example: Reading Python's `list.sort()`

Now let us read a full documentation page together. The documentation for Python's `list.sort()` method.

### Step 1: Title and Description

Python docs say:

> `list.sort(*, key=None, reverse=False)`
> Sort the items of the list in place.

Meaning: sort the items of the list in place (without creating a new list).

### Step 2: What Does "in place" Mean?

Look at the code below — it shows the difference between "in place" and "not in place":

Here `sort()` modifies the original list. But `sorted()` creates a new list:

```python
numbers = [3, 1, 4, 1, 5]

numbers.sort()       # in place — the original list is changed
print(numbers)       # [1, 1, 3, 4, 5]

original = [3, 1, 4]
new_list = sorted(original)   # new list, original is unchanged
```

> [!important] sort() vs sorted()
> `list.sort()` — modifies the original list, returns nothing (`None`)
> `sorted(list)` — creates a new list, original stays unchanged
> This difference is indicated in documentation with the words "in place".

### Step 3: The Parameters

We already saw the parameter table above. Now let us see how to use them:

Look at the code below — here `key` and `reverse` parameters are used:

Here `key=len` means sort by the length of each string. `reverse=True` means descending order:

```python
words = ["banana", "apple", "cherry"]

words.sort(key=len)          # sort by length
print(words)                 # ['apple', 'banana', 'cherry']

words.sort(reverse=True)     # reverse alphabetical
print(words)                 # ['cherry', 'banana', 'apple']
```

In the code above, `key=len` means when sorting, look at the length of each word. `reverse=True` means sort in descending order.

### Step 4: Notes and Warnings

Python docs have an important warning:

> This method sorts the list in place, using only `<` comparisons between items. Exceptions are not suppressed.

Meaning: this method compares each item only using `<`. Exceptions are not suppressed — meaning if any error occurs, it will be shown.

> [!warning] Watch the Return Value
> `list.sort()` returns nothing (it returns `None`). Many people mistakenly write: `new_list = old_list.sort()` — this puts `None` into `new_list`! If you want a new list, use `sorted()`.

## Step-by-Step Method for Reading Any Docs

When reading any documentation page, follow these steps:

```
Step 1: Read the Title → understand the function name
Step 2: Read the Description → understand what it does
Step 3: Look at the Syntax → see how to call it
Step 4: Read the parameter table → understand what inputs to provide
Step 5: Check the return value → understand what you get back
Step 6: Run the Example → try it yourself
Step 7: Read the Notes → check for any warnings or exceptions
```

## MDN vs Python Docs vs React Docs — Structure Comparison

The structure of these three documentation sites is a bit different. But once you understand them, you can read all of them.

| Feature | MDN (JavaScript) | Python Docs | React Docs |
|---------|-----------------|-------------|------------|
| **Structure** | Reference + Guide | Reference + Tutorial | Concept + API Reference |
| **Where are examples** | Interactive (runs in browser) | Code block | Live code editor |
| **Parameter table** | Yes, very detailed | Yes, concise | Inside concepts |
| **Browser support** | Shows which browsers support it | N/A | N/A |
| **Version** | ECMAScript version | Python version (3.8, 3.9, etc.) | React version |

> [!note] When to Read Which Docs?
> - **MDN**: for JavaScript, CSS, HTML
> - **Python Docs**: for the Python standard library
> - **React Docs**: for React
> - **Library README/GitHub**: for npm packages or Python packages

## What to Do When You Do Not Understand a Word?

When reading documentation, you will not understand every word. That is normal. But if you get stuck on every unknown word, you will never finish reading the docs.

### Strategy: Skip → Infer → Look Up

```
1. Skip: keep reading even if you do not understand the word
2. Infer: guess the meaning from the surrounding context
3. Look Up: check the word in a dictionary later
```

Look at the sentence below — even if you do not know the word "coerce", you can understand it from context:

Here, even without knowing the word `coerce`, you can understand from the whole sentence that two types are being matched:

```
"JavaScript will coerce the string '5' to a number when you do '5' * 2."
```

Even if you do not know the word `coerce`, you can tell — when you do `'5' * 2`, JavaScript converts the string to a number. So `coerce` probably means "to force a conversion." And that is exactly right!

> [!tip] You do not need to know every word
> Do you know every word when you speak your native language? No. But you still understand the conversation. Reading documentation is the same — understanding 80% is enough, you will learn the other 20% later.

## Searching Effectively

You need to know how to search within documentation. Reading the entire page to find something is not smart.

Use these techniques:

Here are some ways to search within documentation using Ctrl+F:

```
Press Ctrl+F → type the keyword → press Enter

Keywords to search for:
- "error"    → is there any error scenario
- "return"   → what is the return value
- "example"  → where is the code example
- "default"  → what is the default value
- "optional" → which parameter is optional
```

## Practical Exercise

Now I will give you a documentation snippet. Your job is to read it and understand — what does this function do, what parameters does it need, what does it return.

Try to read and understand the documentation snippet below:

Here is the documentation for a function — find each section:

```text
json.dumps(obj, *, indent=None, sort_keys=False)

Serialize obj as a JSON formatted string.

Parameters:
  obj        — The Python object to serialize (Required)
  indent     — Number of spaces for indentation (Optional, Default: None)
  sort_keys  — If True, dictionary keys are sorted (Optional, Default: False)

Returns:
  A string containing the JSON representation of obj.

Example:
  >>> json.dumps({"name": "Rahim", "age": 25})
  '{"name": "Rahim", "age": 25}'

  >>> json.dumps({"b": 1, "a": 2}, sort_keys=True)
  '{"a": 2, "b": 1}'
```

From the documentation above, you can understand:
- **Function**: `json.dumps()` — converts a Python object into a JSON string
- **Required parameter**: `obj` — any Python object
- **Optional parameters**: `indent` (default `None`), `sort_keys` (default `False`)
- **Return**: a JSON string
- With `sort_keys=True`, dictionary keys will be sorted alphabetically

> [!note] Check Your Answers
> What did you understand from the snippet above? If you understood all of it, then you can read documentation! If something was unclear, go back and reread that section.

## Summary

What we learned today:
- The 8 common sections of a documentation page
- The technique for reading function signatures
- Reading parameter tables
- Reading the full documentation of `sort()` in English
- Strategies for not getting stuck on unknown words
- Searching effectively

In the next chapter, we will see — how to read error messages and how to fix them. Errors are not your enemy — they are your friends!