# Documentation পড়ার Technique

একটা সত্যি কথা বলি — ভালো developer আর মোটা developer এর পার্থক্য কোথায়? ভালো developer প্রথমে documentation পড়ে, তারপর code লেখে। মোটা developer প্রথমে code লেখে, তারপর error হলে documentation পড়ে।

Documentation পড়া শেখা — এটা একটা skill। কেউ জন্ম থেকে পারে না। কিন্তু একবার pattern বুঝলে, যেকোনো library এর docs — React, Python, Django, FastAPI — সব পড়তে পারবে। আজ সেই technique শিখবো।

## কেন Documentation পড়া সবচেয়ে জরুরি?

ভাবো তো — কেন সব senior developer বলে "docs পড়ো"?

```
কারণ ১: Documentation লিখেছে যারা library বানিয়েছে — তারাই সবচেয়ে ভালো জানে
কারণ ২: Tutorial শুধু একটা কাজ দেখায়, docs পুরো জিনিস বোঝায়
কারণ ৩: Stack Overflow answer ভুল হতে পারে, docs ভুল হয় না
কারণ ৪: নতুন version এসে গেলে tutorial পুরোনো হয়ে যায়, docs update হয়
কারণ ৫: তুমি যদি docs পড়তে না পারো, তাহলে নতুন technology শিখতে পারবে না
```

## Documentation Page এর Anatomy

যেকোনো documentation page এ কিছু common section থাকে। একবার এই structure টা চিনে ফেললে — যেকোনো docs পড়া সহজ।

### একটা Documentation Page এ যা যা থাকে

নিচের structure টা Python docs, React docs, MDN — সব জায়গায় দেখবে:

এখানে একটা documentation page এর সাধারণ structure দেখানো হলো:

```
1. Title          → function/method এর নাম
2. Description    → এটা কী কাজ করে, কেন দরকার
3. Syntax         → কীভাবে call করতে হয়
4. Parameters     → কোন input গুলো দিতে হয়
5. Return Value   → কী value ফেরত দেয়
6. Examples       → code example
7. See Also       → সম্পর্কিত অন্য function
8. Notes/Warnings → খেয়াল রাখার মতো জিনিস
```

এই ৮টা section যেকোনো docs এ থাকে। এখন একটা একটা করে দেখি।

## Function Signature পড়া

Documentation এ সবচেয়ে ভয়ের জিনিস হলো function signature — সেই বড় বড় `()` আর type গুলো। কিন্তু এটা আসলে খুব সহল।

নিচের function signature টা দেখো — এটা একটা function কে describe করে:

এখানে `str.split()` function এর signature দেখানো হলো। প্রতিটা অংশের আলাদা মানে আছে:

```
str.split(sep=None, maxsplit=-1)
│       │    │         │
│       │    │         └── maxsplit: কতবার split করবে (-1 = সব)
│       │    └────────── sep: কোন delimiter দিয়ে split করবে (None = whitespace)
│       └────────────── split: function এর নাম
└────────────────────── str: কোন type এর উপর এটা চলে
```

উপরের signature থেকে বোঝা যাচ্ছে: `str.split()` function টা string এর উপর চলে। `sep` parameter টা optional (default `None`), `maxsplit` ও optional (default `-1`)।

### Type Hint পড়া

নিচের signature টা দেখো — এখানে type hint দেওয়া আছে:

এখানে `->` চিহ্ন দিয়ে return type বোঝানো হয়েছে। আর `list[str]` দিয়ে বোঝানো হয়েছে এটা string এর list:

```python
def sort_list(items: list[str], reverse: bool = False) -> list[str]:
    ...
```

এই signature থেকে পড়ছি: `items` parameter টা একটা string list হতে হবে। `reverse` একটা boolean, default `False`। আর এই function টা string list return করবে।

> [!tip] Arrow (->) মানে return
> `->` দেখলে বুঝবে — এর পরে যে type লেখা, সেটাই function টা return করবে। `-> str` মানে string return করবে। `-> None` মানে কিছু return করবে না।

## Parameter Table পড়া

Documentation এ parameter গুলো সাধারণত table আকারে দেওয়া থাকে। এই table পড়তে পারা খুব জরুরি।

### Parameter Table এর Column গুলো

নিচের table টা দেখো — এটা একটা typical parameter table:

এখানে ৪টা column আছে — প্রতিটার আলাদা কাজ:

| Column | কী বোঝায় | কেন দরকার |
|--------|----------|----------|
| **Name** | parameter এর নাম | call করার সময় এই নাম দিতে হয় |
| **Type** | কোন type এর value দিতে হয় | ভুল type দিলে error আসবে |
| **Default** | না দিলে কী value থাকবে | optional কি required বোঝায় |
| **Description** | এটা কী কাজ করে | কী দিতে হবে সেটা বোঝায় |

### একটা Real Example

নিচে Python এর `list.sort()` এর parameter table দেখো:

এখানে `list.sort()` এর দুটো parameter দেখানো হলো — দুটোই optional:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `function` | `None` | A function that serves as a key for the sort comparison. (sort করার জন্য কোন value ব্যবহার করবে সেটা বলে দেয় এমন function) |
| `reverse` | `bool` | `False` | If `True`, the list is sorted in descending order. (`True` দিলে descending order এ sort হবে) |

উপরের table থেকে যা বুঝলাম: দুটো parameter ই optional। `key` দিতে হলে একটা function দিতে হবে। `reverse` দিলে reverse এ sort হবে।

## Real Example: Python এর `list.sort()` পড়ি

এখন পুরো documentation page টা একসাথে পড়ি। Python এর `list.sort()` method এর documentation।

### Step 1: Title আর Description

Python docs এ লেখা:

> `list.sort(*, key=None, reverse=False)`
> Sort the items of the list in place.

Bengali অনুবাদ: list এর item গুলোকে জায়গায় (in place — নতুন list না বানিয়ে) sort করো।

### Step 2: "in place" মানে কী?

নিচের code টা দেখো — এটা "in place" আর "not in place" এর পার্থক্য বোঝায়:

এখানে `sort()` original list কেই পরিবর্তন করে। কিন্তু `sorted()` একটা নতুন list বানায়:

```python
numbers = [3, 1, 4, 1, 5]

numbers.sort()       # in place — original list change হয়
print(numbers)       # [1, 1, 3, 4, 5]

original = [3, 1, 4]
new_list = sorted(original)   # নতুন list, original এ পরিবর্তন নেই
```

> [!important] sort() vs sorted()
> `list.sort()` — original list পরিবর্তন করে, কিছু return করে না (`None`)
> `sorted(list)` — নতুন list বানায়, original অপরিবর্তিত থাকে
> এই পার্থক্য documentation এ "in place" শব্দ দিয়ে বোঝানো হয়।

### Step 3: Parameter গুলো

উপরে আমরা parameter table দেখেছি। এখন সেগুলো কীভাবে use করবে:

নিচের code টা দেখো — এখানে `key` আর `reverse` parameter ব্যবহার করা হয়েছে:

এখানে `key=len` দিয়ে বলা হয়েছে string এর length অনুযায়ী sort করতে। `reverse=True` দিয়ে descending order:

```python
words = ["banana", "apple", "cherry"]

words.sort(key=len)          # length অনুযায়ী sort
print(words)                 # ['apple', 'banana', 'cherry']

words.sort(reverse=True)     # reverse alphabetical
print(words)                 # ['cherry', 'banana', 'apple']
```

উপরের code এ `key=len` মানে হলো sort করার সময় প্রতিটা word এর length দেখো। `reverse=True` মানে descending order এ sort করো।

### Step 4: Notes আর Warnings

Python docs এ একটা গুরুত্বপূর্ণ warning আছে:

> This method sorts the list in place, using only `<` comparisons between items. Exceptions are not suppressed.

Bengali: এই method প্রতিটা item কে শুধু `<` দিয়ে compare করে। Exception suppress করা হয় না — মানে কোনো error এলে সেটা দেখাবে।

> [!warning] Return Value খেয়াল রাখো
> `list.sort()` কিছু return করে না (`None` return করে)। অনেকে ভুলে এভাবে লেখে: `new_list = old_list.sort()` — এতে `new_list` এ `None` চলে যায়! নতুন list চাইলে `sorted()` ব্যবহার করো।

## যেকোনো Docs পড়ার Step-by-Step Method

যেকোনো documentation page পড়ার সময় এই ধাপ গুলো follow করো:

```
ধাপ ১: Title পড়ো → function এর নাম বোঝো
ধাপ ২: Description পড়ো → এটা কী করে বোঝো
ধাপ ৩: Syntax দেখো → কীভাবে call করতে হয় দেখো
ধাপ ৪: Parameter table পড়ো → কী কী input দিতে হবে বোঝো
ধাপ ৫: Return value দেখো → কী পাবে বোঝো
ধাপ ৬: Example রান করো → নিজে চালিয়ে দেখো
ধাপ ৭: Notes পড়ো → কোনো warning বা exception আছে কিনা দেখো
```

## MDN vs Python Docs vs React Docs — Structure Comparison

তিনটা documentation site এর structure একটু আলাদা। কিন্তু একবার বুঝলে সব পড়া যায়।

| Feature | MDN (JavaScript) | Python Docs | React Docs |
|---------|-----------------|-------------|------------|
| **Structure** | Reference + Guide | Reference + Tutorial | Concept + API Reference |
| **Example কোথায়** | Interactive (browser এ চলে) | Code block | Live code editor |
| **Parameter table** | হ্যাঁ, খুব detailed | হ্যাঁ, concise | Concept এর ভেতরে |
| **Browser support** | দেখায় কোন browser এ চলে | N/A | N/A |
| **Version** | ECMAScript version | Python version (3.8, 3.9, etc.) | React version |

> [!note] কোন Docs কখন পড়বে?
> - **MDN**: JavaScript, CSS, HTML এর জন্য
> - **Python Docs**: Python standard library এর জন্য
> - **React Docs**: React এর জন্য
> - **Library এর README/GitHub**: npm package বা Python package এর জন্য

## কোনো Word না বুঝলে কী করবে?

Documentation পড়ার সময় সব শব্দ বুঝবে না। এটা normal। কিন্তু প্রতিটা unknown word এ আটকে গেলে docs পড়াই হবে না।

### কৌশল: Skip → Infer → Look Up

```
১. Skip করো: শব্দটা না বুঝেও পড়ে যাও
২. Infer করো: আশেপাশের context থেকে অনুমান করো — মানে কী হতে পারে?
৩. Look Up করো: পরে সেই শব্দটা dictionary তে দেখো
```

নিচের বাক্যটা দেখো — এখানে "coerce" শব্দটা না জানলেও context থেকে বোঝা যায়:

এখানে `coerce` শব্দটা না জানলেও পুরো বাক্য থেকে বোঝা যায় — দুটো type কে match করানো হচ্ছে:

```
"JavaScript will coerce the string '5' to a number when you do '5' * 2."
```

`coerce` শব্দটা না জানলেও বুঝতে পারছো — `'5' * 2` করলে JavaScript string কে number এ রূপান্তর করে। তাই `coerce` মানে সম্ভবত "জোর করে রূপান্তর করা"। আর সত্যিই সেটাই!

> [!tip] সব শব্দ জানার দরকার নেই
> তুমি কি বাংলায় কথা বলার সময় সব শব্দ জানো? না। কিন্তু তবুও কথা বুঝতে পারো। Documentation পড়ার সময়ও একই — ৮০% বুঝলেই হবে, বাকি ২০% পরে শিখবে।

## Effective Search করা

Documentation এর ভেতরে খুঁজতে জানতে হবে। পুরো page পড়ে খোঁজা বোকামি।

নিচের technique গুলো ব্যবহার করো:

এখানে Ctrl+F দিয়ে documentation এ খোঁজার কিছু উপায় দেখানো হলো:

```
Ctrl+F চাপো → keyword লেখো → Enter

Keyword যা খুঁজবে:
- "error"    → কোনো error scenario আছে কিনা
- "return"   → return value কী
- "example"  → code example কোথায়
- "default"  → default value কী
- "optional" → কোন parameter টা optional
```

## Practical Exercise

এখন একটা documentation snippet দিচ্ছি। তোমার কাজ হলো এটা পড়ে বোঝা — এই function টা কী করে, কী parameter লাগে, কী return করে।

নিচের documentation snippet টা পড়ে বোঝার চেষ্টা করো:

এখানে একটা function এর documentation দেওয়া হলো — প্রতিটা section খুঁজে বের করো:

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

উপরের documentation থেকে তুমি যা বুঝতে পারবে:
- **Function**: `json.dumps()` — একটা Python object কে JSON string এ রূপান্তর করে
- **Required parameter**: `obj` — যেকোনো Python object
- **Optional parameter**: `indent` (default `None`), `sort_keys` (default `False`)
- **Return**: একটা JSON string
- `sort_keys=True` দিলে dictionary key গুলো alphabetically sort হবে

> [!note] উত্তর মিলিয়ে দাও
> উপরের snippet থেকে কী বুঝলে? যদি পুরোটা বুঝতে পারো, তাহলে তুমি documentation পড়তে পারো! যদি কিছু না বুঝো, সেটা কোন section এ সমস্যা — সেটা আবার পড়ো।

## Summary

আজকে যা শিখলে:
- Documentation page এর ৮টা common section
- Function signature পড়ার technique
- Parameter table পড়া
- `sort()` এর পুরো documentation বাংলায় পড়া
- Unknown word এ আটকে না থাকার কৌশল
- Effective search করা

পরের chapter এ দেখবো — error message গুলো কীভাবে পড়তে হয় আর কীভাবে fix করতে হয়। Error গুলো তোমার শত্রু না — বন্ধু!