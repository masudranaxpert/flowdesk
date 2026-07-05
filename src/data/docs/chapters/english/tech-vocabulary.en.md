# Tech Vocabulary — 100+ Words

You may have noticed — when developers talk, they use a strange language. "I'm refactoring the code, then I'll deploy it." — This sentence has three English words, and everyone understands it! In the tech world, some words are used so much that without knowing them, you really cannot follow the rest of the conversation.

Today we will learn 100+ such words — organized by category. Each word comes with its meaning and an example sentence, so you understand not just the meaning, but also how it is used.

## Development — Daily Life Words

You will hear these words every day. In meetings, commit messages, and blog posts — everywhere.

| Word | Meaning | Example Sentence |
|------|---------|-----------------|
| **deploy** | release to a server | We will **deploy** the app tonight. |
| **refactor** | clean up code, restructure | I need to **refactor** this function. |
| **debug** | find and fix errors | I spent 3 hours **debugging**. |
| **compile** | turn source code into runnable code | The code won't **compile**. |
| **build** | turn the whole project into an executable | The **build** failed. |
| **test** | check if it works correctly | Did you write **tests**? |
| **implement** | code and build something | I need to **implement** this feature. |
| **optimize** | make faster or more efficient | Let's **optimize** this query. |
| **iterate** | improve repeatedly over time | We'll **iterate** on the design. |
| **scale** | handle a larger workload | Can this **scale** to 1M users? |
| **cache** | store for later use | We should **cache** the results. |
| **log** | record what is happening | Check the **logs** for errors. |
| **mock** | create fake data | Let's use **mock** data. |
| **patch** | a small fix or update | I applied a **patch**. |
| **rollback** | go back to a previous state | We need to **rollback**. |
| **ship** | release, send out | Let's **ship** it. |
| **deprecate** | mark as old, to be removed | This API is **deprecated**. |

> [!tip] Deploy vs Ship
> Both mean roughly "to release." But **deploy** is more technical (putting it on a server), while **ship** is more casual ("it's done, let's send it out").

## Code — Core Programming Words

Without these words, you cannot understand any documentation. These are the fundamental terms of programming.

| Word | Meaning | Example Sentence |
|------|---------|-----------------|
| **variable** | a named container that holds a value | Store the name in a **variable**. |
| **function** | a reusable block of code | This **function** returns a number. |
| **method** | a function inside an object | Call the `sort()` **method**. |
| **parameter** | the input a function asks for | The **parameter** is required. |
| **argument** | the value you pass to a function | Pass `"hello"` as the **argument**. |
| **return** | the value a function gives back | What does this function **return**? |
| **type** | the kind of data | Check the **type** of this variable. |
| **value** | the actual data stored | The **value** is `null`. |
| **scope** | where a variable is visible | It's out of **scope**. |
| **constant** | something that cannot change | Use a **constant** for the URL. |
| **property** | an attribute of an object | Access the `name` **property**. |
| **attribute** | a characteristic of an element | Set the `id` **attribute**. |
| **instance** | an object created from a class | Create a new **instance**. |
| **constructor** | the function that runs when an object is created | The **constructor** initializes data. |
| **callback** | a function to be called later | Pass a **callback** function. |
| **expression** | code that produces a value | This is a valid **expression**. |
| **statement** | a single line of code that does something | Each line is a **statement**. |

> [!important] Parameter vs Argument
> This is the most confusing pair. Simply put:
> - **Parameter** = the name written in the function definition. In `def greet(name):`, `name` is the parameter.
> - **Argument** = the value you pass when calling the function. In `greet("Rahim")`, `"Rahim"` is the argument.

## Web — API and Network Words

If you do web development, you will see these words every day.

| Word | Meaning | Example Sentence |
|------|---------|-----------------|
| **request** | asking the server for something | Send a GET **request**. |
| **response** | the data the server sends back | The **response** is JSON. |
| **endpoint** | a specific URL of an API | Call this **endpoint**. |
| **route** | which code runs for which URL | Define a **route** for `/users`. |
| **middleware** | code that runs between request and response | Add auth **middleware**. |
| **payload** | the data sent in a request | The **payload** is too large. |
| **header** | metadata of a request/response | Set the `Content-Type` **header**. |
| **body** | the main data of a request/response | The **body** contains form data. |
| **status code** | indicates the result of a request | It returned a 404 **status code**. |
| **session** | a user's temporary state | The **session** expired. |
| **cookie** | small data stored in the browser | Set a **cookie** for auth. |
| **token** | a string that proves identity | The **token** is invalid. |
| **CORS** | cross-origin request permission | Check **CORS** settings. |
| **async** | takes time, will give result later | This is an **async** function. |

> [!tip] Status Code Memory Trick
> - **2xx** = Success (OK)
> - **3xx** = Redirect (go somewhere else)
> - **4xx** = Client error (your fault)
> - **5xx** = Server error (server's fault)

## Version Control — Git Words

Without Git, you cannot work in a team. You will see these words in commit messages, PR reviews — everywhere.

| Word | Meaning | Example Sentence |
|------|---------|-----------------|
| **commit** | save changes | Make a **commit**. |
| **push** | send from local to remote | **Push** the changes. |
| **pull** | bring from remote to local | **Pull** before you start. |
| **merge** | combine two branches | **Merge** the feature branch. |
| **branch** | work on a separate line | Create a new **branch**. |
| **rebase** | reorganize commits | **Rebase** onto main. |
| **clone** | copy a remote repository | **Clone** the repo. |
| **fork** | copy someone's repo to your account | **Fork** the project. |
| **stash** | temporarily set aside work | **Stash** your changes. |
| **checkout** | switch to a branch or file | **Checkout** to main. |
| **revert** | undo a commit | **Revert** the last commit. |
| **cherry-pick** | take a specific commit | **Cherry-pick** that fix. |
| **conflict** | two people changed the same spot | Resolve the **conflict**. |

> [!note] Rebase vs Merge
> Both combine two branches. But **merge** creates a new commit, while **rebase** lines up commits in a straight line. Rebase keeps history cleaner, but if you don't understand it well, it can cause trouble.

## Database — Data Words

If you work with databases, you cannot do without these words.

| Word | Meaning | Example Sentence |
|------|---------|-----------------|
| **query** | ask the database something | Run this **query**. |
| **schema** | the structure of a database | Design the **schema** first. |
| **migration** | changing the database structure | Run the **migration**. |
| **index** | a structure to speed up search | Add an **index** on `email`. |
| **relation** | a link between two tables | Define the **relation**. |
| **table** | rows and columns of data | Create a **table** for users. |
| **row** | a single record | Insert a new **row**. |
| **column** | a single field | Add a **column** for age. |
| **primary key** | a unique ID for each row | Set `id` as **primary key**. |
| **foreign key** | a reference to another table | Add a **foreign key** to `users`. |
| **join** | bring data from two tables together | Use `INNER JOIN`. |
| **transaction** | a group of operations done together | Wrap it in a **transaction**. |
| **seed** | provide initial data | Run the **seed** script. |
| **backup** | keep a copy for safety | Take a **backup**. |

## DevOps — Server and Infrastructure Words

If you work with DevOps, you will see these words every day.

| Word | Meaning | Example Sentence |
|------|---------|-----------------|
| **container** | an isolated, packaged environment | Build a Docker **container**. |
| **image** | the blueprint for a container | Pull the latest **image**. |
| **volume** | persistent storage for a container | Mount a **volume**. |
| **pipeline** | automated steps from build to deploy | The CI **pipeline** is broken. |
| **deploy** | release to production | **Deploy** to staging first. |
| **provision** | set up and prepare a server | **Provision** a new server. |
| **scale** | increase or decrease resources | **Scale** to 5 instances. |
| **orchestrate** | manage multiple containers | Use Kubernetes to **orchestrate**. |
| **registry** | storage for images | Push to the **registry**. |
| **config** | configuration file | Update the **config** file. |
| **node** | a machine in a cluster | The **node** is down. |
| **pod** | the smallest unit in Kubernetes | Restart the **pod**. |

> [!tip] Container vs Image
> **Image** = a template or recipe. **Container** = a running instance created from that recipe. One image can create many containers.

## Confusing Pairs — Words Everyone Mixes Up

Some word pairs have similar meanings but are actually different. Without understanding these, reading documentation is hard.

### Parameter vs Argument

In a function definition, it's a parameter. When calling the function, it's an argument. The code below makes it clear:

Here `name` is the parameter (in the function definition), and `"Rahim"` is the argument (in the function call):

```python
def greet(name):       # 'name' = parameter
    print(f"Hello {name}")

greet("Rahim")          # "Rahim" = argument
```

### Library vs Framework

| Library | Framework |
|---------|-----------|
| You call it | It calls you |
| Use what you need | Must follow its structure |
| Example: React, Lodash | Example: Next.js, Django |

> [!important] How to Remember
> A **library** is like a toolbox — take what you need. A **framework** is like a house — you must stay in its designated rooms.

### Compile vs Interpret

The code below shows the difference between these two:

A compiled language (C, Java) converts the entire code into machine code at once. An interpreted language (Python, JavaScript) reads and runs line by line:

```
Compiled (C, Java):     source.c → compiler → executable → run
                        (compile once, run many times)

Interpreted (Python):   source.py → interpreter → line by line run
                        (reads line by line every time)
```

Compiled code runs faster, but compiling takes time. Interpreted code runs slower but is easier to test.

### Declare vs Define

Declare = "Something exists, with this name." Define = "This thing works like this, here is how."

Here the first line declares (gives the name), and the second part defines (gives the actual implementation):

```c
int add(int a, int b);          // Declaration: the name is given

int add(int a, int b) {          // Definition: the actual code
    return a + b;
}
```

> [!note] Simple Way to Remember
> **Declare** = "I will make a function, its name is `add`." (just the name)
> **Define** = "The `add` function works like this." (the actual code)

## Memory Strategy

Just reading words is not enough — you have to remember them. Here are some tips:

> [!tip] 5 Ways to Remember Words
> 1. **5 words a day** — not 100 at once, go slowly
> 2. **Use them in your own code** — in commit messages and comments
> 3. **Make flashcards** — use Anki or simple paper cards
> 4. **Study confusing pairs carefully** — mixing up parameter and argument is embarrassing
> 5. **When reading documentation**, underline unfamiliar words — look them up later

## Next Steps

These 100+ words will not be memorized in one reading. But when reading documentation, writing commit messages, or reading Stack Overflow questions — you will see these words again and again. Over time, they will stick.

In the next chapter, we will see how these words combine to form phrases, and how to understand those phrases.