# Tech Vocabulary — 100+ Words

তুমি হয়তো লক্ষ্য করেছো — developer রা কথা বললে এক অদ্ভুত ভাষায় কথা বলে। "আমি code টা refactor করছি, তারপর deploy করবো।" — এই sentence এ তিনটা English word আছে, আর সবাই বুঝে যায়! Tech দুনিয়ায় কিছু word এমনভাবে ব্যবহৃত হয় যে সেগুলো না জানলে আসলেই বাকি কথাটা বোঝা যায় না।

আজকে আমরা ১০০+ এরকম word শিখবো — category অনুযায়ী সাজানো। প্রতিটা word এর Bengali meaning আর example sentence থাকবে, যাতে তুমি শুধু meaning ই না, কীভাবে ব্যবহার হয় সেটাও বুঝতে পারো।

## Development — Daily Life Words

এই word গুলো প্রতিদিন শুনবে। meeting এ, commit message এ, blog post এ — সব জায়গায়।

| Word | Bengali Meaning | Example Sentence |
|------|----------------|-----------------|
| **deploy** | সার্ভারে ছেড়ে দেওয়া | We will **deploy** the app tonight. (আজ রাতে আমরা app টা deploy করবো) |
| **refactor** | code পরিষ্কার করা, structure বদলানো | I need to **refactor** this function. (আমাকে এই function টা refactor করতে হবে) |
| **debug** | error খুঁজে বের করা | I spent 3 hours **debugging**. (আমি ৩ ঘণ্টা debug করেছি) |
| **compile** | source code থেকে runnable code বানানো | The code won't **compile**. (code টা compile হচ্ছে না) |
| **build** | পুরো project কে executable করা | The **build** failed. (build টা fail করেছে) |
| **test** | ঠিক কাজ করছে কিনা দেখা | Did you write **tests**? (তুমি কি test লিখেছো?) |
| **implement** | কোড করে বানানো | I need to **implement** this feature. (আমাকে এই feature টা implement করতে হবে) |
| **optimize** | দ্রুত বা ভালো করে কাজ করানো | Let's **optimize** this query. (চলো এই query টা optimize করি) |
| **iterate** | বারবার উন্নত করা | We'll **iterate** on the design. (আমরা design টা বারবার উন্নত করবো) |
| **scale** | বড় পরিসরে কাজ করা | Can this **scale** to 1M users? (এটা কি ১০ লক্ষ user এ scale করতে পারবে?) |
| **cache** | পরে ব্যবহারের জন্য জমা রাখা | We should **cache** the results. (আমাদের result গুলো cache করা উচিত) |
| **log** | কী হচ্ছে সেটা লিখে রাখা | Check the **logs** for errors. (error গুলোর জন্য log দেখো) |
| **mock** | নকল data বানানো | Let's use **mock** data. (চলো mock data ব্যবহার করি) |
| **patch** | ছোট ফিক্স বা আপডেট | I applied a **patch**. (আমি একটা patch apply করেছি) |
| **rollback** | আগের অবস্থায় ফেরা | We need to **rollback**. (আমাদের rollback করতে হবে) |
| **ship** | release করা | Let's **ship** it. (চলো এটা ship করি) |
| **deprecate** | পুরোনো বলে চিহ্নিত করা | This API is **deprecated**. (এই API টা deprecated) |

> [!tip] Deploy vs Ship
> দুটোর মানেই বেশ মিল — "release করা।" তবে **deploy** বেশি technical (server এ ছাড়া), আর **ship** টা একটু casual ("হয়ে গেল, চলো পাঠাই")।

## Code — Core Programming Words

এই word গুলো না জানলে কোনো documentation-ই বোঝা যাবে না। এগুলো হলো programming এর মৌলিক শব্দ।

| Word | Bengali Meaning | Example Sentence |
|------|----------------|-----------------|
| **variable** | একটা নাম যেখানে value থাকে | Store the name in a **variable**. (নাম টা একটা variable এ রাখো) |
| **function** | একটা ব্লক কোড যেটা বারবার চালানো যায় | This **function** returns a number. (এই function টা একটা number ফেরত দেয়) |
| **method** | object এর ভেতরের function | Call the `sort()` **method**. (`sort()` method টা call করো) |
| **parameter** | function যে input টা চায় | The **parameter** is required. (parameter টা দেওয়া লাগবে) |
| **argument** | function কে যা value পাঠানো হয় | Pass `"hello"` as the **argument**. (`"hello"` কে argument হিসেবে পাঠাও) |
| **return** | function যা value ফেরত দেয় | What does this function **return**? (এই function টা কী return করে?) |
| **type** | data এর ধরন | Check the **type** of this variable. (এই variable এর type দেখো) |
| **value** | variable এ থাকা আসল data | The **value** is `null`. (value টা `null`) |
| **scope** | কোথায় একটা variable দেখা যায় | It's out of **scope**. (এটা scope এর বাইরে) |
| **constant** | যেটা পরিবর্তন করা যায় না | Use a **constant** for the URL. (URL এর জন্য constant ব্যবহার করো) |
| **property** | object এর একটা attribute | Access the `name` **property**. (`name` property তে access করো) |
| **attribute** | element এর বৈশিষ্ট্য | Set the `id` **attribute**. (`id` attribute টা set করো) |
| **instance** | class থেকে বানানো একটা object | Create a new **instance**. (নতুন instance বানাও) |
| **constructor** | object তৈরির সময় যে function চলে | The **constructor** initializes data. (constructor data initialize করে) |
| **callback** | পরে চালানোর জন্য দেওয়া function | Pass a **callback** function. (একটা callback function পাঠাও) |
| **expression** | একটা value দেয় এমন code | This is a valid **expression**. (এটা একটা valid expression) |
| **statement** | এক লাইন code যা কিছু করে | Each line is a **statement**. (প্রতিটা লাইন একটা statement) |

> [!important] Parameter vs Argument
> এটা সবচেয়ে বেশি confuse করে। সহজ করে বলি:
> - **Parameter** = function এর definition এ যে নাম লেখা। `def greet(name):` — এখানে `name` হলো parameter।
> - **Argument** = function কে call করার সময় যে value দেওয়া হয়। `greet("Rahim")` — এখানে `"Rahim"` হলো argument।

## Web — API আর Network এর Words

Web development করলে এই word গুলো প্রতিদিন দেখবে।

| Word | Bengali Meaning | Example Sentence |
|------|----------------|-----------------|
| **request** | client থেকে server কে কিছু চাওয়া | Send a GET **request**. (একটা GET request পাঠাও) |
| **response** | server থেকে ফেরত আসা data | The **response** is JSON. (response টা JSON) |
| **endpoint** | API এর একটা নির্দিষ্ট URL | Call this **endpoint**. (এই endpoint টা call করো) |
| **route** | কোন URL এ কোন code চলবে | Define a **route** for `/users`. (`/users` এর জন্য route বানাও) |
| **middleware** | request আর response এর মাঝের code | Add auth **middleware**. (auth middleware যোগ করো) |
| **payload** | request এ পাঠানো data | The **payload** is too large. (payload টা অনেক বড়) |
| **header** | request/response এর metadata | Set the `Content-Type` **header**. (`Content-Type` header টা set করো) |
| **body** | request/response এর মূল data | The **body** contains form data. (body তে form data আছে) |
| **status code** | request এর result বোঝায় | It returned a 404 **status code**. (এটা 404 status code দিলো) |
| **session** | user এর একটা সময়ের state | The **session** expired. (session expire হয়ে গেছে) |
| **cookie** | browser এ রাখা ছোট data | Set a **cookie** for auth. (auth এর জন্য cookie set করো) |
| **token** | পরিচয় প্রমাণ একটা string | The **token** is invalid. (token টা invalid) |
| **CORS** | cross-origin request permission | Check **CORS** settings. (CORS settings দেখো) |
| **async** | সময় লাগবে, পরে result দেবে | This is an **async** function. (এটা একটা async function) |

> [!tip] Status Code মনে রাখার ট্রিক
> - **2xx** = Success (ঠিক আছে)
> - **3xx** = Redirect (অন্য জায়গায় যাও)
> - **4xx** = Client fault (তোমার ভুল)
> - **5xx** = Server fault (server এর ভুল)

## Version Control — Git এর Words

Git না জানলে টিমে কাজ করা যায় না। এই word গুলো commit message, PR review — সব জায়গায় দেখবে।

| Word | Bengali Meaning | Example Sentence |
|------|----------------|-----------------|
| **commit** | পরিবর্তন সেভ করা | Make a **commit**. (একটা commit করো) |
| **push** | local থেকে remote এ পাঠানো | **Push** the changes. (change গুলো push করো) |
| **pull** | remote থেকে local এ আনা | **Pull** before you start. (শুরু করার আগে pull করো) |
| **merge** | দুটো branch এক করা | **Merge** the feature branch. (feature branch টা merge করো) |
| **branch** | আলাদা লাইনে কাজ করা | Create a new **branch**. (নতুন branch বানাও) |
| **rebase** | commit গুলো পুনরায় সাজানো | **Rebase** onto main. (main এর উপর rebase করো) |
| **clone** | remote repository কে copy করা | **Clone** the repo. (repo টা clone করো) |
| **fork** | অন্যের repo এর copy নিজের account এ | **Fork** the project. (project টা fork করো) |
| **stash** | কাজ সাময়িকভাবে সরিয়ে রাখা | **Stash** your changes. (change গুলো stash করো) |
| **checkout** | branch বা file পরিবর্তন করা | **Checkout** to main. (main এ checkout করো) |
| **revert** | commit বাতিল করে আগের state এ যাওয়া | **Revert** the last commit. (শেষ commit টা revert করো) |
| **cherry-pick** | নির্দিষ্ট একটা commit নেওয়া | **Cherry-pick** that fix. (ওই fix টা cherry-pick করো) |
| **conflict** | একই জায়গায় দুজন change করেছে | Resolve the **conflict**. (conflict টা resolve করো) |

> [!note] Rebase vs Merge
> দুটোই দুই branch কে এক করে। কিন্তু **merge** একটা নতুন commit বানায়, আর **rebase** commit গুলোকে সোজা সারিতে সাজিয়ে দেয়। History পরিষ্কার রাখতে rebase ভালো, কিন্তু বুঝে না হলে কষ্ট করে না।

## Database — Data মানের Words

Database নিয়ে কাজ করলে এই word গুলো না জানলে চলবে না।

| Word | Bengali Meaning | Example Sentence |
|------|----------------|-----------------|
| **query** | database কে কিছু জিজ্ঞেস করা | Run this **query**. (এই query টা চালাও) |
| **schema** | database এর structure | Design the **schema** first. (আগে schema design করো) |
| **migration** | database structure পরিবর্তন | Run the **migration**. (migration টা চালাও) |
| **index** | search দ্রুত করার জন্য structure | Add an **index** on `email`. (`email` এ index বানাও) |
| **relation** | দুটো table এর মধ্যে সম্পর্ক | Define the **relation**. (relation টা define করো) |
| **table** | data এর সারি আর কলাম | Create a **table** for users. (user এর জন্য table বানাও) |
| **row** | একটা record | Insert a new **row**. (নতুন row যোগ করো) |
| **column** | একটা field | Add a **column** for age. (age এর জন্য column যোগ করো) |
| **primary key** | প্রতিটা row এর ইউনিক id | Set `id` as **primary key**. (`id` কে primary key করো) |
| **foreign key** | অন্য table এর reference | Add a **foreign key** to `users`. (`users` এ foreign key যোগ করো) |
| **join** | দুটো table এর data একসাথে আনা | Use `INNER JOIN`. (`INNER JOIN` ব্যবহার করো) |
| **transaction** | একসাথে হওয়া একগুচ্ছ operation | Wrap it in a **transaction**. (এটাকে transaction এ রাখো) |
| **seed** | প্রাথমিক data দেওয়া | Run the **seed** script. (seed script টা চালাও) |
| **backup** | নিরাপত্তার জন্য copy রাখা | Take a **backup**. (একটা backup নাও) |

## DevOps — Server আর Infrastructure Words

DevOps নিয়ে কাজ করলে এই word গুলো প্রতিদিন দেখবে।

| Word | Bengali Meaning | Example Sentence |
|------|----------------|-----------------|
| **container** | সব কিছু প্যাকেজ করা isolated পরিবেশ | Build a Docker **container**. (Docker container বানাও) |
| **image** | container এর blueprint | Pull the latest **image**. (latest image টা pull করো) |
| **volume** | container এর data সংরক্ষণ | Mount a **volume**. (একটা volume mount করো) |
| **pipeline** | build থেকে deploy পর্যন্ত automated ধাপ | The CI **pipeline** is broken. (CI pipeline টা ভেঙে গেছে) |
| **deploy** | production এ ছাড়া | **Deploy** to staging first. (আগে staging এ deploy করো) |
| **provision** | server বানিয়ে প্রস্তুত করা | **Provision** a new server. (নতুন server provision করো) |
| **scale** | resource বাড়ানো বা কমানো | **Scale** to 5 instances. (৫টা instance এ scale করো) |
| **orchestrate** | একাধিক container manage করা | Use Kubernetes to **orchestrate**. (orchestrate করতে Kubernetes ব্যবহার করো) |
| **registry** | image এর storage | Push to the **registry**. (registry তে push করো) |
| **config** | configuration file | Update the **config** file. (config file টা update করো) |
| **node** | cluster এর একটা machine | The **node** is down. (node টা down) |
| **pod** | Kubernetes এর ক্ষুদ্রতম একক | Restart the **pod**. (pod টা restart করো) |

> [!tip] Container vs Image
> **Image** = একটা template বা recipe। **Container** = সেই recipe দিয়ে বানানো চলমান instance। একটা image থেকে অনেক container বানানো যায়।

## Confusing Pairs — যেগুলো সবাই গুলিয়ে ফেলে

কিছু word pair এমন আছে যেগুলো মানে প্রায় এক, কিন্তু আসলে আলাদা। এগুলো না বুঝলে documentation পড়া কঠিন।

### Parameter vs Argument

Function definition এ parameter, call করার সময় argument। নিচের code টা দেখলে পরিষ্কার হবে:

এখানে `name` হলো parameter (function definition এ), আর `"Rahim"` হলো argument (function call এ):

```python
def greet(name):       # 'name' = parameter
    print(f"Hello {name}")

greet("Rahim")          # "Rahim" = argument
```

### Library vs Framework

| Library | Framework |
|---------|-----------|
| তুমি call করো | সে call করে তোমাকে |
| যা দরকার ব্যবহার করো | structure মেনে চলতে হয় |
| Example: React, Lodash | Example: Next.js, Django |

> [!important] মনে রাখার উপায়
> **Library** হলো একটা toolbox — যা দরকার নাও। **Framework** হলো একটা house — তোমার নির্দিষ্ট ঘরে থাকতে হবে।

### Compile vs Interpret

নিচের code টা দেখো — এটা এই দুটোর পার্থক্য বোঝায়:

এখানে compiled language (C, Java) পুরো code কে একবারে machine code এ রূপান্তর করে। Interpreted language (Python, JavaScript) line by line পড়ে চালায়:

```
Compiled (C, Java):     source.c → compiler → executable → run
                        (একবার compile, বারবার run)

Interpreted (Python):   source.py → interpreter → line by line run
                        (প্রতি বার line by line চলে)
```

Compile করা code দ্রুত চলে, কিন্তু প্রতিবার compile করতে সময় লাগে। Interpret করা code ধীরে চলে কিন্তু পরীক্ষা করা সহজ।

### Declare vs Define

Declare = "একটা জিনিস আছে, এই নামে।" Define = "এই জিনিসটা এমন, এটা কীভাবে কাজ করে।"

এখানে প্রথম লাইনে declare করা হয়েছে (নাম বলা হয়েছে), আর দ্বিতীয় অংশে define করা হয়েছে (আসল implementation দেওয়া হয়েছে):

```c
int add(int a, int b);          // Declaration: নাম বলা হলো

int add(int a, int b) {          // Definition: আসল code
    return a + b;
}
```

> [!note] সহজ করে মনে রাখো
> **Declare** = "আমি একটা function বানাবো, নাম `add`।" (শুধু নাম বলা)
> **Define** = "`add` function টা এভাবে কাজ করবে।" (আসল কোড দেওয়া)

## মনে রাখার Strategy

শুধু word পড়লে হবে না — মনে রাখতে হবে। কিছু tip:

> [!tip] Word মনে রাখার ৫টা উপায়
> 1. **প্রতিদিন ৫টা word** — একসাথে ১০০টা না, ধীরে ধীরে
> 2. **নিজের code এ ব্যবহার করো** — commit message এ, comment এ
> 3. **Flashcard বানাও** — Anki বা সাধারণ কার্ডে
> 4. **Confusing pair খুব ভালো করে পড়ো** — parameter vs argument মিলিয়ে ফেললে লজ্জায় পড়বে
> 5. **Documentation পড়ার সময়** অপরিচিত word underline করো — পরে দেখো

## পরবর্তী ধাপ

এই ১০০+ word গুলো একবার পড়েই মুখস্থ হবে না। কিন্তু documentation পড়ার সময়, commit message লেখার সময়, Stack Overflow তে প্রশ্ন পড়ার সময় — এই word গুলো বারবার দেখবে। দেখতে দেখতেই মনে থাকবে।

পরের chapter এ আমরা দেখবো — এই word গুলো মিলে কীভাবে phrase বানায়, আর সেই phrase গুলো কীভাবে বুঝবে।