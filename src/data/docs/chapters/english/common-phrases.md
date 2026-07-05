# Common Tech Phrases

তুমি হয়তো একটা একটা করে English word শিখেছো। কিন্তু documentation পড়ার সময় দেখবে — word গুলো তো চেনা, কিন্তু পুরো phrase টার মানে কিছুতেই বুঝতে পারছো না! "throws an error" — তুমি `throw` শব্দটা জানো, `error` শব্দটা জানো, কিন্তু দুটো মিলে কী বোঝায়?

আজকে আমরা এমন ৩০+ phrase শিখবো যেগুলো documentation, tutorial, Stack Overflow — সব জায়গায় বারবার দেখবে। এগুলো জানলে ৮০% documentation পড়া সহজ হয়ে যাবে।

## Documentation এ যে Phrase গুলো সবচেয়ে বেশি আসে

নিচের phrase গুলো React docs, Python docs, MDN — সব জায়গায় বারবার দেখবে। এগুলো না বুঝলে আসলেই documentation পড়া যায় না।

| Phrase | Bengali Meaning | Example Sentence |
|--------|----------------|-----------------|
| **throws an error** | error throw করে | If the file is missing, this **throws an error**. (file না থাকলে এটা error throw করে) |
| **raises an exception** | exception তোলে | Dividing by zero **raises an exception**. (শূন্য দিয়ে ভাগ করলে exception ওঠে) |
| **returns a value** | একটা value ফেরত দেয় | The function **returns a value** of type string. (function টা string type এর value ফেরত দেয়) |
| **is deprecated** | পুরোনো, নতুন version এ থাকবে না | This method **is deprecated**. Use `fetch()` instead. (এই method টা deprecated। `fetch()` ব্যবহার করো) |
| **optional parameter** | দিতেও পারো, নাও দিতে পারো | The second argument is an **optional parameter**. (দ্বিতীয় argument টা optional) |
| **by default** | default হিসেবে | **By default**, it sorts in ascending order. (default হিসেবে এটা ascending order এ sort করে) |
| **under the hood** | ভেতরে ভেতরে যা হয় | Let's see what happens **under the hood**. (চলো দেখি ভেতরে ভেতরে কী হয়) |
| **out of the box** | কোনো setup ছাড়াই | It works **out of the box**. (এটা কোনো setup ছাড়াই কাজ করে) |
| **best practice** | সবচেয়ে ভালো উপায় | It's a **best practice** to validate input. (input validate করাটা best practice) |
| **edge case** | বিরল কিন্তু সম্ভাব্য situation | What about the **edge case** where input is null? (input null হলে কী হবে সেই edge case?) |
| **boilerplate** | বারবার লেখা একই code | Just copy the **boilerplate** code. (শুধু boilerplate code টা copy করো) |
| **side effect** | function এর বাইরে প্রভাব | This function has no **side effects**. (এই function এর কোনো side effect নেই) |
| **immutable** | পরিবর্তন করা যায় না | Strings are **immutable** in Python. (Python এ string গুলো immutable) |
| **idempotent** | একই কাজ বারবার করলেও result একই | PUT requests should be **idempotent**. (PUT request গুলো idempotent হওয়া উচিত) |
| **asynchronous** | সময় লাগবে, অন্য কাজ চলতে থাকবে | This operation is **asynchronous**. (এই operation টা asynchronous) |
| **synchronous** | শেষ না হওয়া পর্যন্ত অপেক্ষা করো | It's a **synchronous** call. (এটা একটা synchronous call) |
| **syntactic sugar** | সহজ করার জন্য সুন্দর syntax | Arrow functions are **syntactic sugar**. (Arrow function গুলো syntactic sugar) |
| **verbose** | অনেক বড়, অনেক কথা | This syntax is too **verbose**. (এই syntax টা অনেক verbose) |
| **shorthand** | ছোট করে লেখার উপায় | Here's a **shorthand** for this. (এটার একটা shorthand আছে) |

> [!important] Deprecated — খুব গুরুত্বপূর্ণ!
> Documentation এ **deprecated** দেখলে সেটা আর ব্যবহার করবে না। মানে এটা এখনও কাজ করছে, কিন্তু পরের version এ বাদ দেওয়া হবে। Alternative খুঁজে বের করো।

## প্রতিটা Phrase কোথায় দেখবে

### "throws an error" / "raises an exception"

দুটোর মানে প্রায় একই — কোনো সমস্যা হলে program থামিয়ে দেওয়া। নিচের code টা দেখো:

এখানে ভুল input দিলে program error throw করবে। এই behavior টাই documentation এ "throws an error" দিয়ে বোঝানো হয়:

```python
def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

উপরের code এ `b == 0` হলে `raise ValueError` দিয়ে error throw করা হয়েছে। Documentation এ এটাকেই বলবে: "This function **raises an exception** when `b` is zero."

### "under the hood"

এই phrase টা documentation এ খুব common। মানে — "ভেতরে ভেতরে আসলে কী হচ্ছে।" যেমন React docs এ বলবে: "Under the hood, `useState` uses a queue of hooks." মানে ভেতরে ভেতরে এটা একটা queue maintain করে।

### "out of the box"

Framework এর homepage এ এটা প্রায় দেখবে: "Next.js supports image optimization **out of the box**." মানে কোনো plugin বা setup ছাড়াই এটা কাজ করে। ইনস্টল করলেই পাবে।

### "side effect"

এই term টা React, Redux, functional programming — সব জায়গায় আসে। মানে হলো: একটা function শুধু input নিয়ে output দিলে সেটার side effect নেই। কিন্তু যদি সেটা বাইরের কিছু পরিবর্তন করে (database update, DOM change, network call) — সেটাই side effect।

নিচের code টা দেখো — এটায় side effect আছে কিনা বোঝাচ্ছে:

এখানে প্রথম function টার কোনো side effect নেই — শুধু input নিয়ে output দেয়। দ্বিতীয় function টায় side effect আছে — কারণ সেটা বাইরের `count` variable পরিবর্তন করছে:

```javascript
// No side effect — pure function
function add(a, b) {
    return a + b;
}

// Has side effect — changes outside state
let count = 0;
function increment() {
    count++;   // ← side effect: বাইরের variable পরিবর্তন করছে
}
```

## How to Describe Bugs

এখন আসি সবচেয়ে গুরুত্বপূর্ণ অংশে। তোমার code এ bug হলে, Stack Overflow তে বা সহকর্মীকে বলতে হবে। কীভাবে বলবে? এই phrase গুলো শিখে রাখো।

### Bug Describe করার Common Pattern

| Pattern | Bengali Meaning | Example |
|---------|----------------|---------|
| **It crashes when...** | যখন... করি তখন crash করে | It **crashes when** I click submit. (submit এ click করলে crash করে) |
| **The output is wrong** | output টা ভুল | **The output is wrong** — it should be 10 but I get 20. (output ভুল — ১০ হওয়ার কথা ছিল, ২০ আসছে) |
| **I'm getting an error** | একটা error আসছে | **I'm getting an error** on line 15. (line 15 এ একটা error আসছে) |
| **It doesn't work** | কাজ করছে না | The button **doesn't work**. (button টা কাজ করছে না) |
| **It returns null** | null return করে | The function **returns null** instead of a string. (function টা string এর জায়গায় null return করে) |
| **Nothing happens** | কিছুই হয় না | When I click, **nothing happens**. (click করলে কিছুই হয় না) |
| **It hangs / freezes** | আটকে যায় | The app **hangs** when loading data. (data load করার সময় app আটকে যায়) |
| **I can't reproduce it** | আমি আবার করতে পারছি না | **I can't reproduce** the issue. (আমি issue টা reproduce করতে পারছি না) |

> [!tip] Bug Describe করার সেরা উপায়
> সবসময় তিনটা জিনিস বলো: (১) **কী করতে চাইলে**, (২) **কী হওয়ার কথা ছিল**, (৩) **প্রকৃতপক্ষে কী হচ্ছে**। যেমন: "When I click submit (১), it should show a success message (২), but instead it crashes (৩)।"

### Bug Report Example

নিচের example টা দেখো — এটা একটা ভালো bug report এর structure:

এখানে bug টা পরিষ্কারভাবে বোঝানো হয়েছে — কী করলে হয়, কী হওয়ার কথা, আর প্রকৃতপক্ষে কী হয়:

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

উপরের bug report এ পরিষ্কার — empty form submit করলে app crash করে, `validateForm` function এ `trim()` call করার সময় value undefined।

## How to Ask for Help (Stack Overflow Pattern)

Stack Overflow তে ভালো প্রশ্ন না করলে কেউ উত্তর দেবে না। কিন্তু ভালো প্রশ্ন করলে মিনিটে উত্তর পাবে। নিচে কিছু common pattern দেওয়া হলো।

### প্রশ্ন শুরু করার Phrase

| Pattern | Bengali Meaning | Example |
|---------|----------------|---------|
| **How do I...?** | কীভাবে করবো? | **How do I** sort a list of dictionaries by a key? (dictionary এর list কে key দিয়ে কীভাবে sort করবো?) |
| **Why does...?** | কেন... হয়? | **Why does** my code throw a TypeError? (আমার code কেন TypeError throw করে?) |
| **What's the difference between...?** | এর মধ্যে পার্থক্য কী? | **What's the difference between** `==` and `===`? (`==` আর `===` এর মধ্যে পার্থক্য কী?) |
| **Is there a way to...?** | কোনো উপায় আছে কি? | **Is there a way to** reverse a string in Python? (Python এ string reverse করার কোনো উপায় আছে কি?) |
| **I'm trying to...** | আমি চেষ্টা করছি... | **I'm trying to** read a CSV file but getting an error. (আমি CSV file read করার চেষ্টা করছি কিন্তু error আসছে) |
| **I'm getting...** | আমাকে... আসছে | **I'm getting** a KeyError when accessing the dictionary. (dictionary access করার সময় KeyError আসছে) |

### ভালো প্রশ্ন লেখার Structure

নিচের structure টা follow করলে তোমার প্রশ্ন সবাই পড়বে আর উত্তর দেবে:

এখানে একটা ভালো Stack Overflow প্রশ্ন এর structure দেখানো হলো — পরিষ্কার title, সমস্যা, যা চেষ্টা করেছো, আর code:

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

উপরের প্রশ্ন টায় সব আছে — কী চাও, কী try করেছো, কী error বা সমস্যা। এটা পড়ে কেউ ৩০ সেকেন্ডে উত্তর দিতে পারবে।

> [!important] Stack Overflow এ যা করবে না
> ❌ "It doesn't work, help!" — কী না কাজ করছে সেটা বলো নি
> ❌ "URGENT!!! Please help!" — urgent বললে কেউ আরও দ্রুত সাহায্য করবে না
> ❌ পুরো code paste করা — শুধু relevant অংশ দাও
> ❌ Screenshot দিয়ে code দেখানো — code সবসময় text এ দাও

## Code Comment এ Common Phrase

Code comment পড়ার সময়ও এই phrase গুলো দেখবে:

নিচের code টা দেখো — এখানে comment এ কিছু common phrase ব্যবহৃত হয়েছে:

এখানে comment গুলো দেখায় কেন কোনো কাজ করা হয়েছে, কোনটা deprecated, কোনটা workaround:

```python
# TODO: refactor this to use a class
# FIXME: this breaks for empty strings
# HACK: temporary workaround for issue #123
# NOTE: deprecated, will be removed in v2.0
# WARNING: do not modify this line
result = data.strip()  # edge case: empty string returns ""
```

উপরের comment গুলোর মানে:
- **TODO** = পরে এটা করতে হবে
- **FIXME** = এখানে bug আছে, fix করতে হবে
- **HACK** = সাময়িকভাবে এভাবে করা হয়েছে, স্থায়ী সমাধান না
- **NOTE** = খেয়াল রাখো
- **WARNING** = সাবধান, পরিবর্তন করবে না

## মনে রাখার টিপস

> [!tip] Phrase মনে রাখার উপায়
> 1. **Context এ শিখো** — শুধু list পড়লে হবে না, documentation এ দেখলে মনে রাখো
> 2. **নিজে ব্যবহার করো** — code comment এ, commit message এ এই phrase গুলো লেখো
> 3. **Confusing pair চিনে রাখো** — `throws an error` আর `raises an exception` একই জিনিস
> 4. **Bengali ভাবো, English লেখো** — প্রথমে বাংলায় ভাবো, তারপর English এ translate করো

## Summary

আজকে যা শিখলে:
- Documentation এ সবচেয়ে common ২০+ phrase
- Bug describe করার সঠিক ভাষা
- Stack Overflow তে ভালো প্রশ্ন করার structure
- Code comment এ common marker (TODO, FIXME, HACK)

এই phrase গুলো একবার ভালো করে শিখলে documentation পড়ার ভয় অনেকটা কমে যাবে। পরের chapter এ দেখবো কীভাবে একটা documentation page পুরোপুরি পড়তে হয়।