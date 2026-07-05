# Developer হিসেবে English কেন দরকার

চলো একটা সচ্চরিত্রের কথা বলি। তুমি কোড লিখছো, হঠাৎ একটা error এলো — `TypeError: Cannot read properties of undefined (reading 'map')`। এখন তুমি Google এ সার্চ করলে, Stack Overflow এর উত্তরগুলো কোন ভাষায়? English। React এর documentation কোন ভাষায়? English। GitHub এ issue ফাইল করতে হলে কোন ভাষায় লিখতে হয়? English।

এটা কোনো optional skill না — এটা developer এর বেঁচে থাকার ভাষা। তবে ভয় পেও না, তোমাকে Shakespeare হতে হবে না। শুধু এতটুকু পারলেই হবে — যেটা পড়লে বোঝো, যেটা লিখলে অন্যে বোঝে।

## English ছাড়া যা করতে পারবে না

ভাবো তো — English না জানলে কী কী কষ্ট হবে?

```
Problem                          English না জানলে কী হয়
─────────────────────────────────────────────────────────────
Error message পড়া               "TypeError" লেখাটাই ভয়ের, মানে বুঝবে না
Stack Overflow থেকে সাহায্য      প্রশ্ন বুঝবে না, উত্তর বুঝবে না
Documentation পড়া                React/Node/Python docs সব English
GitHub issue / PR লেখা           team এর সাথে communicate করতে পারবে না
npm package বেছে নেওয়া           README বুঝবে না, কোনটা ভালো বুঝবে না
Tutorial দেখা                    YouTube এর ভালো tutorial সব English
Job interview                    প্রশ্ন বুঝবে না, উত্তর দিতে পারবে না
```

এখানে একটা সাধারণ error message দেখো — এটা English পড়তে পারলে কতটা সহজ হয়ে যায়:

নিচের error টা খুব common — React এ যখন কোনো variable এর value আসার আগেই সেটার উপর method call করা হয়। English পড়তে পারলে message টা থেকেই বুঝে যাবে সমস্যা কী।

```
TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (App.js:15)
```

মানে হলো: `undefined` এর উপর `map` function চালানো হয়েছে — অর্থাৎ `UserList` component এ কোনো data লোড হওয়ার আগেই `map` করা হচ্ছে। `Cannot read properties of undefined` = "undefined এর properties পড়া যাচ্ছে না"। একটা লাইন পড়েই সমস্যা বুঝে গেলে!

> [!note] Error Message = সূত্র
> Error message গুলো শুধু এলোমেলো লেখা না। সেখানে নির্দিষ্ট pattern আছে — `ErrorType: What went wrong (where)`। এই pattern টা চিনলে অনেক error দ্রুত solve করা যায়।

## লক্ষ্য: "Technical English", English Literature না

অনেকে ভাবে — "আমার English ভালো না, তাই আমি কোনোদিন ভালো developer হতে পারব না।" এটা একদম ভুল ধারণা।

তোমার লক্ষ্য Shakespeare এর মতো লেখা না। তোমার লক্ষ্য হলো:

```
🎯 Technical English — তুমি যা পারলে হবে:
────────────────────────────────────────────
✅ Error message পড়ে বুঝতে পারা
✅ Documentation পড়ে API ব্যবহার করতে পারা
✅ Stack Overflow উত্তর বুঝতে পারা
✅ Commit message, PR description লেখা
✅ Variable, function এর নাম মানে বসাতে পারা
✅ Code comment পড়ে বুঝতে পারা
✅ সহজ sentence এ নিজের সমস্যা বোঝাতে পারা
```

```
❌ যা পারার দরকার নেই:
─────────────────────
❌ Poetry বা novel লেখা
❌ Complex grammar নিয়ে পড়াশোনা
❌ Native accent এ কথা বলা
❌ 5000+ vocabulary মুখস্থ করা
❌ Academic paper লেখা
```

> [!important] মনে রাখো
> তোমার 300-500 টা technical word আর basic grammar জানলেই documentation পড়া যায়। পুরো English ভাষা শেখার দরকার নেই।

## বাস্তব উদাহরণ: কোথায় কী English লাগে

চলো দেখি developer হিসেবে প্রতিদিন কোথায় কী English লাগে।

### 1. Error Message পড়া

নিচের code টা রান করলে কী error আসবে — সেটা পড়ে বুঝতে পারা জরুরি। লক্ষ্য করো error message এর প্রতিটা word কোনো complex কিছু না।

```python
# Code টা চালালে error আসবে
numbers = [1, 2, 3]
print(numbers[5])
```

```
IndexError: list index out of range
```

`IndexError` = index সংক্রান্ত error, `list index out of range` = "list এর index range এর বাইরে" — অর্থাৎ list এ যতগুলো element আছে তার থেকে বেশি index দিয়ে খোঁজা হয়েছে। এই একটা লাইন বুঝলেই solve করা যায়।

### 2. Documentation পড়া

React এর documentation থেকে একটা sentence দেখি:

> "The `useState` hook lets you add state to functional components."

এর মানে: "`useState` hook টা functional component এ state যোগ করতে দেয়।" — সহজ না? `lets you add` = "যোগ করতে দেয়/দেয় সুযোগ"। এই ধরনের sentence ই documentation এ 90% আছে।

### 3. Commit Message লেখা

নিচের commit message গুলো প্রতিদিন লিখতে হয়। লক্ষ্য করো — প্রতিটা 5-8 word এর বেশি না।

```bash
# ভালো commit message — clear আর ছোট
git commit -m "Fix login bug on mobile devices"
git commit -m "Add dark mode toggle to settings page"
git commit -m "Update README with installation steps"
git commit -m "Remove unused imports from utils"
```

এখানে `Fix` = ঠিক করা, `Add` = যোগ করা, `Update` = আপডেট করা, `Remove` = মুছে ফেলা — মাত্র 4-5 টা verb দিয়েই প্রতিদিনের commit message হয়ে যায়। এই verb গুলো মনে রাখলেই অনেকখানি হবে।

### 4. PR Description লেখা

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

এর মানে কী? একটু অনুবাদ করে দিই:

- `What does this PR do?` = এই PR টা কী করে?
- `This PR adds password reset functionality` = এই PR password reset feature যোগ করে
- `Changes` = কী কী পরিবর্তন হয়েছে
- `Added forgot_password endpoint` = forgot_password endpoint যোগ করা হয়েছে
- `Testing` = কীভাবে test করা হয়েছে
- `Tested manually` = হাতে হাতে test করা হয়েছে

## বাংলায় যা বলি vs English এ যা বলতে হয়

| পরিস্থিতি | বাংলায় যা বলি | English এ যা বলতে হয় |
|-----------|---------------|----------------------|
| কোড কাজ করছে না | "কোড টা কাজ করছে না" | "The code is not working" |
| Bug পেয়েছি | "একটা bug পেলাম" | "I found a bug" |
| Deploy করতে হবে | "deploy করতে হবে" | "We need to deploy this" |
| সাহায্য চাইছি | "ভাই, একটু সাহায্য করো" | "Can you help me with this?" |
| কোড রিভিউ চাইছি | "কোড টা দেখে দাও" | "Could you review my code?" |
| বুঝতে পারছি না | "বুঝতে পারছি না" | "I don't understand this" |
| আবার বলো | "আরেকবার বলো" | "Could you explain that again?" |
| এটা ঠিক করেছি | "আমি এটা ঠিক করেছি" | "I fixed this issue" |
| নতুন feature যোগ করেছি | "নতুন feature বানিয়েছি" | "I added a new feature" |
| পুরনো কোড মুছেছি | "পুরনো কোড মুছেছি" | "I removed the old code" |
| এটা কাজ করবে না | "এটা কাজ করবে না" | "This won't work" |
| ভালো আইডিয়া | "ভালো আইডিয়া!" | "That's a great idea!" |

> [!tip] Pattern ধরো
> খেয়াল করেছো? বেশিরভাগ sentence ই খুব ছোট — Subject + Verb + Object। "I found a bug", "I fixed this", "We need to deploy"। Complex sentence লাগে না।

## শেখার Roadmap

সব একসাথে শেখার দরকার নেই। একটা practical roadmap দিচ্ছি:

```
Step 1: Vocabulary (১-২ সপ্তাহ)
─────────────────────────────────
প্রতিদিন 10-15 টা technical word মুখস্থ করো:
  function, variable, array, object, loop, condition
  return, parameter, argument, method, property
  error, exception, debug, compile, execute
  fetch, request, response, endpoint, API

Step 2: Documentation পড়া (২-৪ সপ্তাহ)
──────────────────────────────────────────
ছোট ছোট documentation section পড়ো:
  → MDN এর সহজ পেজ
  → React docs এর "Quick Start"
  → Python tutorial এর প্রথম অধ্যায়
  → npm package এর README file

Step 3: লেখার অভ্যাস (৪-৬ সপ্তাহ)
─────────────────────────────────────
ছোট ছোট জিনিস লেখো:
  → Code comment লেখো English এ
  → Commit message লেখো properly
  → Stack Overflow এ উত্তর লেখার চেষ্টা করো
  → Project README লেখো

Step 4: Communication (৬-৮ সপ্তাহ)
──────────────────────────────────────
দ্রুত কথা বলার চেষ্টা করো:
  → GitHub issue ফাইল করো
  → PR review comment লেখো
  → Discord/Slack এ প্রশ্ন করো
  → Stack Overflow এ প্রশ্ন করো
```

> [!note] সময় লাগবে
> এটা একদিনে হবে না। কিন্তু প্রতিদিন 30 মিনিট করে practice করলে 3-6 মাসে তুমি comfortable হয়ে যাবে। আর একবার comfortable হলে — পুরো পৃথিবীর documentation তোমার হাতে।

## শুরু করার জন্য 25 টা কমন Word

নিচের word গুলো developer হিসেবে সবচেয়ে বেশি ব্যবহৃত হয়। এগুলো মুখস্থ করলেই 50% কাজ হয়ে যাবে।

| Word | মানে | উদাহরণ |
|------|------|--------|
| function | ফাংশন/কাজ | "This function returns a value" (এই function টা একটা value ফেরত দেয়) |
| variable | ভেরিয়েবল | "Declare a variable" (একটা variable তৈরি করো) |
| parameter | প্যারামিটার | "Pass a parameter" (একটা parameter পাঠাও) |
| return | ফেরত দেওয়া | "Return the result" (result ফেরত দাও) |
| assign | বরাদ্দ করা | "Assign a value" (একটা value বরাদ্দ করো) |
| declare | ঘোষণা করা | "Declare a function" (একটা function তৈরি করো) |
| define | সংজ্ঞায়িত করা | "Define a class" (একটা class তৈরি করো) |
| implement | বাস্তবায়ন করা | "Implement the interface" (interface টা কোডে লেখো) |
| initialize | শুরু করা | "Initialize the variable" (variable টা শুরু করো) |
| execute | চালানো | "Execute the function" (function টা চালাও) |
| call | কল করা | "Call the method" (method টা কল করো) |
| handle | সামাল দেওয়া | "Handle the error" (error টা সামাল দাও) |
| trigger | ট্রিগার করা | "Trigger the event" (event টা চালু করো) |
| parse | বিশ্লেষণ করা | "Parse the JSON" (JSON টা পড়ে বুঝো) |
| fetch | আনা | "Fetch data from API" (API থেকে data আনো) |
| update | আপডেট করা | "Update the record" (record টা আপডেট করো) |
| remove | মুছে ফেলা | "Remove the element" (element টা মুছে ফেলো) |
| iterate | পুনরাবৃত্তি করা | "Iterate over the array" (array এর উপর দিয়ে যাও) |
| validate | যাচাই করা | "Validate the input" (input টা যাচাই করো) |
| deprecated | অবচিত | "This method is deprecated" (এই method টা আর ব্যবহার করা উচিত না) |
| async | asynchronous | "Async function" (asynchronous function) |
| render | রেন্ডার করা | "Render the component" (component টা প্রদর্শন করো) |
| compile | কম্পাইল করা | "Compile the code" (code টা compile করো) |
| deploy | ডেপ্লয় করা | "Deploy to production" (production এ deploy করো) |
| debug | ডিবাগ করা | "Debug the issue" (সমস্যাটা debug করো) |

> [!tip] Vocabulary Tip
> Word গুলো শুধু মুখস্থ করবে না — বাক্যে ব্যবহার করো। যেমন "return" শিখলে, লেখো "This function returns the total price."। বাক্যে না বসালে word ভুলে যাবে।

## ছোট একটা Challenge

শেষে একটা ছোট challenge দিই। নিচের কোড comment গুলো পড়ে বুঝতে পারছো?

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

এর মানে কী? অনুবাদ করে দিই:

- `This function calculates the total price` = এই function টা মোট দাম হিসাব করে
- `of items in the cart` = cart এর জিনিসগুলোর
- `It takes an array of items` = এটা একটা item এর array নেয়
- `and returns a number` = আর একটা number ফেরত দেয়

খেয়াল করেছো? সব word ই সহজ। `calculates` = হিসাব করে, `takes` = নেয়, `returns` = ফেরত দেয়। এই ধরনের comment প্রতিদিন পড়তে হবে — আর পড়তে পড়তে এটাই স্বাভাবিক হয়ে যাবে।

> [!important] শুরু করো আজই
> আজ থেকেই শুরু করো। প্রতিদিন একটা documentation page পড়ো, একটা Stack Overflow answer পড়ো, পাঁচটা নতুন word শিখো। ছয় মাস পর নিজেই অবাক হবে তুমি কতটা এগিয়েছো।

## Summary

- Developer হিসেবে English জানা একদম জরুরি — error message, documentation, Stack Overflow সবই English এ
- তোমাকে fluent হতে হবে না — শুধু "technical English" জানলেই হবে
- 300-500 technical word আর basic grammar দিয়েই 90% কাজ হয়ে যায়
- Roadmap: vocabulary → documentation পড়া → লেখা → communication
- প্রতিদিন 30 মিনিট practice করো — 3-6 মাসে comfortable হয়ে যাবে

পরের chapter এ আমরা basic grammar শিখবো — sentence কীভাবে সাজায়, Subject-Verb-Object কী — সব সহজ ভাষায়।