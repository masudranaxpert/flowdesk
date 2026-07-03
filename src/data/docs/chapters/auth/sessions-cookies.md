## Session কীভাবে কাজ করে?

HTTP হলো stateless — প্রতিটা request independent, সার্ভার আগের request মনে রাখে না। তাই "login আছে" এই অবস্থা maintain করার জন্য session দরকার।

Session-এর কাজের ধরন:

```text
১. User login করে (username + password)
২. Server verify করে, একটা unique session ID generate করে
৩. এই session ID ডাটাবেস/memory-তে রাখে
৪. Browser-কে একটা cookie দেয় যেটায় session ID আছে
৫. পরের প্রতিটা request-এ browser cookie পাঠায়
৬. Server session ID দেখে user চিনে ফেলে
```

```text
Browser                          Server
  │                                │
  │── POST /login (user, pass) ──►│
  │                                │ ── verify, create session
  │◄── Set-Cookie: sid=abc123 ────│
  │                                │
  │── GET /profile                │
  │   Cookie: sid=abc123 ────────►│
  │                                │ ── lookup session abc123
  │◄── 200 OK (user data) ────────│
```

> [!note] Session data কোথায় থাকে?
# Session data server-এ থাকে — memory, Redis, database — যেকোনো জায়গায়। Browser-এ শুধু session ID থাকে। তাই session data leak হওয়ার ভয় নেই, শুধু session ID সুরক্ষিত রাখলেই চলে।

## Cookie Attributes — সুরক্ষার চাবি

Cookie পাঠানোর সময় কিছু security attribute দেওয়া বাধ্যতামূলক:

### HttpOnly

JavaScript থেকে cookie access করা যাবে না — XSS attack প্রতিরোধ:

```http
Set-Cookie: sid=abc123; HttpOnly
```

### Secure

শুধু HTTPS-এ পাঠানো হবে — plaintext HTTP-তে যাবে না:

```http
Set-Cookie: sid=abc123; Secure; HttpOnly
```

### SameSite

Cross-site request-এ cookie যাবে কি না — CSRF defense:

| Value | কী করে |
|---|---|
| `Strict` | শুধু same-site request-এ যায় — সবচেয়ে নিরাপদ |
| `Lax` | সাধারণ GET navigation-এ যায়, POST-এ যায় না — default আর balanced |
| `None` | সব request-এ যায় — `Secure` বাধ্যতামূলক, ঝুঁকিপূর্ণ |

```http
Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax
```

> [!warn] SameSite=None কেন বিপজ্জনক
# `SameSite=None` দিলে third-party website থেকে তোমার সাইটে request গেলেও cookie যাবে — এটা CSRF attack-এর দরজা খোলা রাখে। শুধু কোনো উপায় না থাকলে (যেমন third-party embed) ব্যবহার করো, আর তখনও `Secure` বাধ্যতামূলক।

## Session Fixation Attack

Attack ধরন হলো — attacker browser-এ একটা session ID set করে দেয়, user যখন login করে সেই ID-ই থেকে যায়, আর attacker সেই ID দিয়ে access পেয়ে যায়।

প্রতিরোধ — login করার পর **অবশ্যই** নতুন session ID generate করো:

```python
# Flask উদাহরণ
@app.route("/login", methods=["POST"])
def login():
    user = verify_credentials(request.form)
    if user:
        session.clear()          # পুরোনো session মুছো
        session["user_id"] = user.id  # নতুন session ID অটো generate
        return redirect("/dashboard")
```

## CSRF — Cross-Site Request Forgery

CSRF-এর ধরন — attacker তোমার সাইটে একটা form submit করায় যখন তুমি logged in থাকো। যেহেতু browser অটোমেটিক cookie পাঠায়, request valid মনে হয়।

দুটো প্রতিরোধ:

**১. SameSite cookie** — সবচেয়ে সহজ আর কার্যকর:

```http
Set-Cookie: sid=abc123; SameSite=Lax
```

**২. CSRF Token** — প্রতিটা form-এ একটা hidden token থাকে, server verify করে:

```python
# Login-এর সময় CSRF token generate করো
import secrets

csrf_token = secrets.token_urlsafe(32)
session["csrf_token"] = csrf_token

# Form-এ hidden field হিসেবে দাও
# <input type="hidden" name="csrf_token" value="{{ csrf_token }}">

# Submit-এর সময় verify করো
@app.route("/transfer", methods=["POST"])
def transfer():
    if request.form["csrf_token"] != session.get("csrf_token"):
        abort(403, "CSRF token invalid")
    # ... transfer logic
```

> [!tip] দুটোই ব্যবহার করো
# `SameSite=Lax` cookie আর CSRF token — দুটোই ব্যবহার করা সবচেয়ে ভালো (defense in depth)। একটা fail করলেও আরেকটা রক্ষা করবে।

## Cookie-based বনাম Token-based

| | Session/Cookie | Token (JWT) |
|---|---|---|
| State | Server-এ session store করা | Stateless — token-এই সব তথ্য |
| Scale | Multiple server-এ session share করতে হয় (Redis) | যে কোনো server verify করতে পারে |
| Revoke | সহজ — session delete করো | কঠিন — token expire পর্যন্ত valid |
| Best for | Traditional web app (server-rendered) | SPA, mobile app, API |
| CSRF ঝুঁকি | হ্যাঁ — token দরকার | কম — token header-এ যায় |

> [!note] SPA-র জন্য OAuth 2.1 + PKCE
# Single Page App আর mobile app-এর জন্য OAuth 2.1-এ PKCE (Proof Key for Code Exchange) বাধ্যতামূলক। সরাসরি token না নিয়ে authorization code + PKCE flow ব্যবহার করতে হয়।

## Practical — Secure Cookie + CSRF Token Setup

একটা Flask উদাহরণ:

```python
from flask import Flask, request, session, redirect, render_template_string
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_urlsafe(32)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,    # production-এ HTTPS লাগবে
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=3600,  # ১ ঘণ্টা
)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = verify_user(request.form["username"], request.form["password"])
        if user:
            session.clear()  # session fixation প্রতিরোধ
            session["user_id"] = user.id
            session["csrf_token"] = secrets.token_urlsafe(32)
            return redirect("/dashboard")
    return render_template_string(login_form)

@app.route("/update-profile", methods=["POST"])
def update_profile():
    # CSRF verify
    if request.form.get("csrf_token") != session.get("csrf_token"):
        return "CSRF token invalid", 403

    # এখানে আসল কাজ
    return "Profile updated!"
```

> [!example] Session storage — Redis
# Production-এ session memory-তে রাখলে server restart হলে সব user logout হয়ে যাবে। তাই Redis বা database-এ session store করা standard — fast, scalable, আর server restart-এও টিকে থাকে।