# Reading Practice — Tech Articles

এতক্ষণ তোমরা grammar, vocabulary, phrase — সব শিখেছো। এখন সময় হয়েছে সেগুলো **প্রয়োগ** করার! এই chapter টা একটু আলাদা — এখানে আমি কিছু নতুন শেখাবো না। বরং কয়েকটা আসল tech article দেবো, তুমি সেগুলো পড়বে, বোঝবে, আর অনুবাদ করবে।

মনে রাখবে — reading practice ছাড়া কখনো English এ দক্ষ হওয়া যায় না। একটা একটা করে passage পড়ো, vocabulary মিলাও, question গুলোর উত্তর দাও। চলো শুরু করি!

> [!tip] কীভাবে পড়বে
> পুরো passage একবার পড়ো (সব শব্দ না বুঝলেও থামবে না) → vocabulary মিলাও → আবার পড়ো → question গুলোর উত্তর দাও।

## Passage ১: What is a REST API?

নিচের passage টা REST API নিয়ে — কীভাবে web communication কাজ করে সেটা বোঝায়:

```text
A REST API (Representational State Transfer) is a set of rules
for building web services that allow different applications to
communicate with each other over the internet. It uses standard
HTTP methods like GET, POST, PUT, and DELETE to perform operations
on resources.

In a REST API, each resource is identified by a unique URL. For
example, to get a list of users, you send a GET request to
/api/users. To create a new user, you send a POST request to the
same URL with the user data in the request body.

REST APIs are stateless, meaning each request must contain all
the information needed to process it. The server does not store
any data about previous requests. This makes REST APIs scalable
and easy to maintain.
```

### Key Vocabulary

| Word | Meaning (বাংলা) |
|------|----------------|
| **communicate** | যোগাযোগ করা |
| **identified by** | চিহ্নিত করা হয় |
| **resource** | সম্পদ / data object |
| **stateless** | state বা অবস্থা মনে রাখে না |
| **scalable** | বড় করা যায়, scale করা যায় |
| **maintain** | রক্ষণাবেক্ষণ করা |
| **unique** | অদ্বিতীয়, একক |
| **process** | প্রক্রিয়া করা |

### বোঝো কি বলছে?

১. REST API এর মূল নিয়ম কী? (stateless কেন বলা হয়?)
২. `/api/users` URL এ GET আর POST request এর মধ্যে পার্থক্য কী?
৩. Stateless হওয়ার সুবিধা কী?

### অনুবাদ করো

> "REST APIs are stateless, meaning each request must contain all the information needed to process it."

## Passage ২: Understanding Git Branching

নিচের passage টা Git branching নিয়ে — কেন branch ব্যবহার করি আর কীভাবে কাজ করে:

```text
Git branching allows multiple developers to work on the same
project simultaneously without interfering with each other. When
you create a branch, you essentially create an independent copy
of the codebase where you can make changes safely.

The main branch (often called "main" or "master") always contains
stable, production-ready code. Developers create feature branches
for new work, such as "feature/login" or "bugfix/payment-error".
Once the work is complete, the branch is merged back into main.

A common strategy is called Git Flow. In this model, there is a
develop branch for ongoing work, release branches for preparing
production deployments, and hotfix branches for urgent fixes.
This keeps the codebase organized and reduces the risk of bugs
reaching production.
```

### Key Vocabulary

| Word | Meaning (বাংলা) |
|------|----------------|
| **simultaneously** | একই সময়ে |
| **interfering** | হস্তক্ষেপ করা, বাধা দেওয়া |
| **essentially** | মূলত |
| **independent** | স্বাধীন |
| **stable** | স্থিতিশীল |
| **merged** | একত্রিত করা হয়েছে |
| **strategy** | কৌশল |
| **urgent** | জরুরি |

### বোঝো কি বলছে?

১. main branch আর feature branch এর মধ্যে পার্থক্য কী?
২. Git Flow model এ কয় ধরনের branch আছে? কী কী?
৩. কেন branch ব্যবহার করা হয় — সরাসরি main এ কাজ করলে কী সমস্যা?

### অনুবাদ করো

> "When you create a branch, you essentially create an independent copy of the codebase."

## Passage ৩: Why Python is Popular for Data Science

নিচের passage টা Python এর data science এ জনপ্রিয়তা নিয়ে:

```text
Python has become the dominant programming language for data
science due to its simplicity and the rich ecosystem of libraries.
Libraries like NumPy, pandas, and matplotlib provide powerful tools
for data manipulation, analysis, and visualization.

One of the main reasons for Python's popularity is its readable
syntax. Data scientists who may not have a traditional programming
background can quickly learn Python and start working with data.
The language feels close to plain English, which reduces the
learning curve significantly.

Additionally, Python integrates well with other technologies used
in data science, such as Jupyter Notebooks for interactive
analysis, TensorFlow for machine learning, and SQL databases for
data storage. This versatility makes Python the go-to language
for both beginners and experienced data professionals.
```

### Key Vocabulary

| Word | Meaning (বাংলা) |
|------|----------------|
| **dominant** | প্রধান, একচ্ছত্র |
| **ecosystem** | পরিবেশব্যবস্থা |
| **manipulation** | পরিবর্তন, নিয়ন্ত্রণ |
| **visualization** | দৃশ্যায়ন, চার্ট আকারে দেখানো |
| **readable** | পড়তে সহজ |
| **reduces** | কমায় |
| **integrates** | সংযুক্ত হয় |
| **versatility** | বহুমুখিতা |

### বোঝো কি বলছে?

১. Python data science এ জনপ্রিয় হওয়ার মূল কারণ কী?
২. data science এর জন্য কোন কোন library এর নাম বলা হয়েছে?
৩. "learning curve reduces" মানে কী?

### অনুবাদ করো

> "The language feels close to plain English, which reduces the learning curve significantly."

## Passage ৪: Introduction to Docker Containers

নিচের passage টা Docker container নিয়ে — কী, কেন দরকার, কীভাবে কাজ করে:

```text
Docker is a platform that uses containerization to package
applications and their dependencies into a single, portable unit
called a container. This ensures that the application runs the
same way regardless of where it is deployed — whether on a
developer's laptop, a testing server, or in the cloud.

Unlike traditional virtual machines, Docker containers share the
host operating system's kernel rather than running a full OS.
This makes containers much lighter and faster to start. A typical
container takes only seconds to launch, while a virtual machine
might take minutes.

Containers are defined using a Dockerfile, which contains
instructions for building the container image. Once built, the
image can be pushed to a registry like Docker Hub and pulled by
anyone who needs to run the application. This eliminates the
common "it works on my machine" problem.
```

### Key Vocabulary

| Word | Meaning (বাংলা) |
|------|----------------|
| **containerization** | container এ ভরার প্রক্রিয়া |
| **portable** | সহজে স্থানান্তরযোগ্য |
| **regardless of** | নির্বিশেষে |
| **deployed** | deploy করা হয়েছে |
| **kernel** | OS এর মূল অংশ |
| **eliminates** | বাদ দেয়, মুছে দেয় |
| **registry** | নিবন্ধন ভান্ডার |
| **instructions** | নির্দেশনা |

### বোঝো কি বলছে?

১. Docker container আর virtual machine এর মধ্যে পার্থক্য কী?
২. Dockerfile এর কাজ কী?
৩. "it works on my machine" problem মানে কী আর Docker কীভাবে সমাধান করে?

### অনুবাদ করো

> "This ensures that the application runs the same way regardless of where it is deployed."

## Passage ৫: How Database Indexing Works

নিচের passage টা database indexing নিয়ে — কীভাবে query দ্রুত হয়:

```text
Database indexing is a technique used to speed up data retrieval
operations. Without an index, a database must scan every row in a
table to find matching records — this is called a full table scan
and it is extremely slow for large datasets.

An index works similarly to the index at the back of a book.
Instead of flipping through every page, you look up the keyword
in the index, find the page number, and go directly there. A
database index works the same way — it creates a separate data
structure that allows the database to find records quickly.

However, indexes come with a trade-off. While they dramatically
improve read performance, they slow down write operations such
as INSERT, UPDATE, and DELETE. This is because the index must be
updated every time the data changes. Therefore, you should only
add indexes on columns that are frequently used in WHERE clauses
or JOIN conditions.
```

### Key Vocabulary

| Word | Meaning (বাংলা) |
|------|----------------|
| **speed up** | দ্রুত করা |
| **retrieval** | উদ্ধার, খুঁজে বের করা |
| **scan** | প্রতিটি পরীক্ষা করা |
| **matching** | মিল আছে এমন |
| **flipping through** | পাতা ওল্টানো |
| **trade-off** | একটা বেশি হলে আরেকটা কমে |
| **dramatically** | নাটকীয়ভাবে |
| **frequently** | প্রায়ই |

### বোঝো কি বলছে?

১. Index ছাড়া database কীভাবে record খোঁজে? সেটার সমস্যা কী?
২. Index এর সুবিধা আর অসুবিধা কী?
৩. কোন column এ index করা উচিত?

### অনুবাদ করো

> "An index works similarly to the index at the back of a book."

## Passage ৬: What is Machine Learning?

নিচের passage টা machine learning এর basic concept নিয়ে:

```text
Machine learning is a subset of artificial intelligence that
enables computers to learn patterns from data without being
explicitly programmed. Instead of writing rules by hand, you
feed the computer large amounts of data and let it discover the
underlying patterns on its own.

There are three main types of machine learning. In supervised
learning, the model is trained on labeled data — for example,
thousands of images tagged as "cat" or "dog". In unsupervised
learning, the model finds patterns in unlabeled data without any
guidance. Reinforcement learning involves an agent that learns
by interacting with an environment and receiving rewards or
penalties for its actions.

A common real-world application is recommendation systems. When
Netflix suggests a movie or YouTube recommends a video, that is
machine learning at work. The system analyzes your past behavior,
finds patterns in what you watch, and predicts what you might
enjoy next.
```

### Key Vocabulary

| Word | Meaning (বাংলা) |
|------|----------------|
| **subset** | উপসমষ্টি |
| **explicitly** | স্পষ্টভাবে |
| **underlying** | ভেতরের, গোপন |
| **labeled** | লেবেল করা, চিহ্নিত |
| **guidance** | পথ দেখানো |
| **interacting** | মিথস্ক্রিয়া করা |
| **rewards** | পুরস্কার |
| **predicts** | ভবিষ্যদ্বাণী করে |

### বোঝো কি বলছে?

১. Machine learning আর traditional programming এর পার্থক্য কী?
২. Machine learning এর তিন ধরন কী কী? এক লাইনে বলো।
৩. Recommendation system কীভাবে কাজ করে?

### অনুবাদ করো

> "Instead of writing rules by hand, you feed the computer large amounts of data and let it discover the underlying patterns on its own."

---

## Next Steps

এই ৬টা passage পড়ে যদি মনে হয় — "হ্যাঁ, আমি বুঝতে পারছি!" — তাহলে তুমি প্রস্তুত! এখন সময় এসেছে আসল documentation পড়ার।

> [!tip] পরবর্তী পদক্ষেপ
> **MDN Web Docs** (HTML/CSS/JS), **Python Official Docs** (docs.python.org), **React Docs** (react.dev), **Stack Overflow**, **Dev.to / Medium** — এই জায়গাগুলো থেকে শুরু করো।

> [!important] Daily Habit
> প্রতিদিন অন্তত ১টা tech article পড়ো — English এ। পুরো না বুঝলেও পড়তে থাকো। এক সপ্তাহে দেখবে অনেক বেশি বুঝতে পারছো। Practice ছাড়া কোনো shortcut নেই। পড়তে পড়তে অভ্যস্ত হও — একদিন তুমি নিজেই documentation লিখবে, blog লিখবে। শুভকামনা! 🚀