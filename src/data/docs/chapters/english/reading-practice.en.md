# Reading Practice — Tech Articles

So far you have learned grammar, vocabulary, phrases — everything. Now it is time to **apply** them! This chapter is a bit different — I will not teach you anything new here. Instead, I will give you some real tech articles. You will read them, understand them, and translate them.

Remember — you can never become fluent in English without reading practice. Read each passage one by one, match the vocabulary, and answer the questions. Let us begin!

> [!tip] How to Read
> Read the whole passage once (do not stop even if you do not understand every word) → match the vocabulary → read it again → answer the questions.

## Passage 1: What is a REST API?

The passage below is about REST APIs — it explains how web communication works:

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

| Word | Meaning |
|------|---------|
| **communicate** | to exchange information |
| **identified by** | recognized by, marked by |
| **resource** | a data object or entity |
| **stateless** | does not remember previous state |
| **scalable** | can grow to handle more load |
| **maintain** | to keep in good condition |
| **unique** | one of a kind |
| **process** | to handle or deal with |

### Do You Understand?

1. What is the core rule of a REST API? (Why is it called stateless?)
2. What is the difference between a GET and a POST request to `/api/users`?
3. What is the advantage of being stateless?

### Translate This Sentence

> "REST APIs are stateless, meaning each request must contain all the information needed to process it."

## Passage 2: Understanding Git Branching

The passage below is about Git branching — why we use branches and how they work:

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

| Word | Meaning |
|------|---------|
| **simultaneously** | at the same time |
| **interfering** | getting in the way, causing disruption |
| **essentially** | basically, fundamentally |
| **independent** | separate, self-governing |
| **stable** | steady, reliable |
| **merged** | combined together |
| **strategy** | a planned approach |
| **urgent** | requiring immediate attention |

### Do You Understand?

1. What is the difference between the main branch and a feature branch?
2. How many types of branches are there in the Git Flow model? What are they?
3. Why do we use branches — what is the problem with working directly on main?

### Translate This Sentence

> "When you create a branch, you essentially create an independent copy of the codebase."

## Passage 3: Why Python is Popular for Data Science

The passage below is about Python's popularity in data science:

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

| Word | Meaning |
|------|---------|
| **dominant** | the leading, most powerful |
| **ecosystem** | a network of related tools and libraries |
| **manipulation** | changing, controlling, transforming |
| **visualization** | presenting data visually, like charts |
| **readable** | easy to read |
| **reduces** | makes smaller, decreases |
| **integrates** | connects, works together with |
| **versatility** | ability to do many different things |

### Do You Understand?

1. What is the main reason Python is popular for data science?
2. Which libraries are mentioned for data science?
3. What does "reduces the learning curve" mean?

### Translate This Sentence

> "The language feels close to plain English, which reduces the learning curve significantly."

## Passage 4: Introduction to Docker Containers

The passage below is about Docker containers — what they are, why we need them, how they work:

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

| Word | Meaning |
|------|---------|
| **containerization** | the process of packaging into containers |
| **portable** | easily transferable between environments |
| **regardless of** | no matter what, without being affected by |
| **deployed** | put into production, launched |
| **kernel** | the core part of an operating system |
| **eliminates** | removes completely, gets rid of |
| **registry** | a storage repository |
| **instructions** | directions, commands |

### Do You Understand?

1. What is the difference between a Docker container and a virtual machine?
2. What does a Dockerfile do?
3. What does the "it works on my machine" problem mean, and how does Docker solve it?

### Translate This Sentence

> "This ensures that the application runs the same way regardless of where it is deployed."

## Passage 5: How Database Indexing Works

The passage below is about database indexing — how queries become faster:

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

| Word | Meaning |
|------|---------|
| **speed up** | make faster |
| **retrieval** | getting back, finding |
| **scan** | checking each one |
| **matching** | ones that fit the criteria |
| **flipping through** | turning pages one by one |
| **trade-off** | a balance between two things (one improves, the other gets worse) |
| **dramatically** | significantly, noticeably |
| **frequently** | often, repeatedly |

### Do You Understand?

1. How does a database search for records without an index? What is the problem?
2. What are the advantages and disadvantages of indexes?
3. Which columns should be indexed?

### Translate This Sentence

> "An index works similarly to the index at the back of a book."

## Passage 6: What is Machine Learning?

The passage below is about the basic concept of machine learning:

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

| Word | Meaning |
|------|---------|
| **subset** | a smaller part of a larger group |
| **explicitly** | clearly, directly stated |
| **underlying** | hidden beneath the surface |
| **labeled** | tagged, marked with a label |
| **guidance** | direction, supervision |
| **interacting** | engaging with, acting upon |
| **rewards** | positive feedback, prizes |
| **predicts** | forecasts, guesses the future |

### Do You Understand?

1. What is the difference between machine learning and traditional programming?
2. What are the three types of machine learning? Describe each in one line.
3. How does a recommendation system work?

### Translate This Sentence

> "Instead of writing rules by hand, you feed the computer large amounts of data and let it discover the underlying patterns on its own."

---

## Next Steps

If you read these 6 passages and feel — "Yes, I can understand!" — then you are ready! Now it is time to start reading real documentation.

> [!tip] Next Steps
> Start with **MDN Web Docs** (HTML/CSS/JS), **Python Official Docs** (docs.python.org), **React Docs** (react.dev), **Stack Overflow**, **Dev.to / Medium** — start from these places.

> [!important] Daily Habit
> Read at least 1 tech article every day — in English. Even if you do not understand everything, keep reading. Within a week, you will notice you understand much more. There is no shortcut without practice. Keep reading and you will get used to it — one day you will write documentation yourself, you will write blog posts. Best of luck! 🚀