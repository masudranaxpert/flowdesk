## Authentication আর Authorization — পার্থক্য

অনেকেই এই দুটো শব্দ গুলিয়ে ফেলে। কিন্তু এরা আসলে দুটো ভিন্ন জিনিস।

- **Authentication (AuthN)** — তুমি কে? পরিচয় যাচাই। যেমন: username আর password দিলে server check করে তুমি আসলেই কি সেই ব্যক্তি।
- **Authorization (AuthZ)** — তুমি কী করতে পারো? permission। যেমন: তুমি login করেছো, কিন্তু admin panel দেখতে পারবে কি পারবে না — সেটা authorization।

```text
  User
   |
   | username + password
   v
+----------+      Authentication       +----------+
|  Login   |  ----> তুমি কে?  ---->    |  Server  |
|  Screen  |                            |  checks  |
+----------+                            +----------+
                                              |
                                   পরিচয় verify হলে
                                              |
                                              v
                                    Authorization
                                  তুমি কী পারো?
                                    /        \
                               admin?      user?
```

একটা বাস্তব উদাহরণ দিই। তুমি একটা অফিস building এ ঢুকলে:

1. গেট এ পাহারাদার তোমার ID card দেখলো — এটা **authentication**। তুমি কে তা নিশ্চিত হলো।
2. তারপর তুমি server room এ ঢুকতে চাইলে আরেকজন বললো — তোমার সেই access নেই। এটা **authorization**।

## Common Authentication Methods

### Session-based Authentication

সবচেয়ে পুরোনো আর পরিচিত method। User login করলে server একটা **session** create করে নিজের memory বা database এ store করে, আর browser কে একটা `session_id` দিয়ে একটা **cookie** পাঠায়।

```text
Browser                          Server
   |                                |
   |  POST /login (user, pass)     |
   |  ---------------------------→  |
   |                                |
   |         validate credentials   |
   |         create session #123    |
   |                                |
   |   Set-Cookie: session=123     |
   |  ←---------------------------  |
   |                                |
   |  GET /dashboard                |
   |  Cookie: session=123           |
   |  ---------------------------→  |
   |                                |
   |         lookup session #123    |
   |         found user = Karim     |
   |                                |
   |   200 OK (dashboard HTML)     |
   |  ←---------------------------  |
```

সুবিধা: simple, server সব নিয়ন্ত্রণে রাখে। অসুবিধা: প্রতিটা request এ server database/memory lookup করতে হয়। Multiple server থাকলে session share করা ঝামেলা।

### Token-based Authentication

User login করলে server একটা **token** দেয়। Browser সেই token প্রতিটা request এ header এ পাঠায়। Server token verify করে user identify করে। সবচেয়ে জনপ্রিয় token format হলো **JWT**।

```text
Browser                          Server
   |                                |
   |  POST /login (user, pass)     |
   |  ---------------------------→  |
   |                                |
   |   validate, generate JWT       |
   |                                |
   |   { "token": "eyJhb..." }      |
   |  ←---------------------------  |
   |                                |
   |  GET /api/profile              |
   |  Authorization: Bearer eyJhb.. |
   |  ---------------------------→  |
   |                                |
   |   verify JWT signature         |
   |   extract user_id              |
   |                                |
   |   200 OK (user data)           |
   |  ←---------------------------  |
```

সুবিধা: stateless — server কোনো session store করে রাখে না। Mobile app, SPA — সবার জন্য কাজ করে। অসুবিধা: token expire না হলে logout কঠিন, token চুরি হলে বিপদ।

### API Keys

মূলত machine-to-machine communication এর জন্য। একটা long random string যেটা API call এর সাথে পাঠানো হয়।

```http
GET /api/data
X-API-Key: sk-abc123xyz789
```

সুবিধা: simple। অসুবিধা: rotation আর scope management কঠিন, user context থাকে না।

## কখন কোনটা ব্যবহার করবে

| Scenario | Best Method | কেন |
|----------|------------|-----|
| Traditional web app (SSR) | Session | cookie সহজ, server control |
| SPA (React, Vue) | Token (JWT) | stateless, mobile friendly |
| Mobile app | Token (JWT) | cookie ঝামেলা নেই |
| Third-party API | API Key | machine-to-machine |
| Microservices | Token / mTLS | service to service auth |

> [!note] নিজের crypto বানাবে না
# Authentication system এর নিচে ক্রিপ্টোগ্রাফি থাকে — hashing, signing, encryption। এগুলো কখনো নিজে বানাবে না। সবসময় established library ব্যবহার করো (bcrypt, Argon2, PyJWT, ইত্যাদি)। নিজের crypto = guaranteed vulnerability।

## Password কীভাবে Store করতে হয়

Password কখনো plain text এ database এ রাখা যাবে না। কখনো ও না। সবসময় **hash** করে রাখতে হবে।

খারাপ:
```python
# NEVER do this
import hashlib
hashed = hashlib.md5(password.encode()).hexdigest()
```

ভালো:
```python
# Use bcrypt or argon2
import bcrypt

# Hash password
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# Verify
if bcrypt.checkpw(user_input.encode(), hashed):
    print("Password correct!")
```

| Method | Status | কেন |
|--------|--------|-----|
| Plain text | কঠিন নিষেধ | database leak = সব পাসওয়ার্ড ফাঁস |
| MD5 / SHA1 | ভাঙা | অনেক দ্রুত, rainbow table attack |
| bcrypt | ভালো | slow, salt built-in |
| Argon2 | best | modern, memory-hard |
| PBKDF2 | ভালো | widely supported |

## Authentication Flow — Step by Step

একটা typical signup আর login flow:

1. **Signup** — user email আর password দেয়। Server password hash করে database এ save করে।
2. **Login** — user credentials দেয়। Server hash compare করে। মিলে গেলে token বা session দেয়।
3. **Request** — এর পরের প্রতিটা request এ token/cookie সাথে থাকে। Server verify করে।
4. **Logout** — session destroy বা token blacklist করা হয়।

> [!tip] Password requirement সহজ রাখলে ভালো
# অনেক সাইট ১৬ character, special char, number — সব জোর করে। কিন্তু NIST এখন বলে — লম্বা কিন্তু simple password বেশি ভালো। `correct-horse-battery-staple` এর মতো। মানুষ মনে রাখতে পারে, আর brute force করা কঠিন।

## Summary

Authentication হলো পরিচয় যাচাই, authorization হলো permission যাচাই। Web এ মূল তিনটা method — session-based (cookie), token-based (JWT), আর API key। প্রতিটার use case আলাদা। Password সবসময় strong hash (bcrypt/Argon2) দিয়ে store করো। পরের chapter এ JWT নিয়ে গভীরে যাবো।