## Real Implementation

এই chapter এ আমরা দেখবো কীভাবে বাস্তবে authentication implement করা হয় — Express.js এ JWT middleware, Google OAuth, Redis এ session, আর password reset flow।

## Express.js এ JWT Auth Middleware

Node.js এর Express framework এ authentication middleware কীভাবে লেখা যায় দেখি। এটা একটা প্যাটার্ন যেটা production এ ব্যাপক ব্যবহৃত।

```javascript
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "dev-secret-change-me";

// Middleware to verify JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] });
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid token" });
  }
}

// Role-based authorization middleware
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
```

Routes এ ব্যবহার:

```javascript
const express = require("express");
const bcrypt = require("bcrypt");
const { authenticate, requireRole } = require("./authMiddleware");

const app = express();
app.use(express.json());

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    SECRET_KEY,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, type: "refresh" },
    SECRET_KEY,
    { expiresIn: "7d" }
  );

  res.json({ accessToken, refreshToken });
});

// Protected route
app.get("/profile", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Admin only route
app.delete("/users/:id", authenticate, requireRole("admin"), (req, res) => {
  res.json({ message: "User deleted" });
});
```

> [!example] Middleware pattern
# `authenticate` middleware প্রতিটা protected route এর আগে বসে। এটা request header থেকে token নেয়, verify করে, আর `req.user` তে user information রাখে। পরের middleware বা route handler এটা ব্যবহার করে। এই separation কোড কে পরিষ্কার আর reusable রাখে।

## Google OAuth Integration

Passport.js দিয়ে Google OAuth integrate করা যায়। User কে নিজের password মনে রাখতে হয় না — Google account দিয়ে login।

```javascript
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
        });
      }

      done(null, user);
    }
  )
);

// Routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT for the authenticated user
    const token = jwt.sign({ sub: req.user.id }, SECRET_KEY, {
      expiresIn: "15m",
    });
    // Redirect to frontend with token
    res.redirect(`https://yourapp.com/auth/callback?token=${token}`);
  }
);
```

## Session-based Auth with Redis

Multiple server থাকলে in-memory session কাজ করে না। Redis একটা external session store হিসেবে ব্যবহার করা যায় — সব server একই Redis দেখে।

```javascript
const redis = require("redis");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});
redisClient.connect().catch(console.error);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only
      httpOnly: true, // JS can't access cookie
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    req.session.userId = user.id;
    res.json({ message: "Logged in" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});
```

| Approach | State | Scalability | Storage |
|----------|-------|-------------|---------|
| In-memory session | Stateful | Single server only | RAM |
| Redis session | Stateful | Multiple servers | Redis |
| JWT | Stateless | Any scale | None (token itself) |

## Password Reset Flow

Password reset একটা sensitive flow। যদি ভুল বানানো হয়, attacker যে কারো account নিয়ে নিতে পারে।

```text
User                    Server                    Email Service
 │                        │                            │
 │ forgot password email  │                            │
 │───────────────────────→│                            │
 │                        │                            │
 │                        │  generate reset token      │
 │                        │  save hash in DB (expiry)  │
 │                        │                            │
 │                        │  send email with link      │
 │                        │───────────────────────────→│
 │                        │                            │
 │                        │   email delivered          │
 │                        │←───────────────────────────│
 │   "check your email"   │                            │
 │←───────────────────────│                            │
 │                        │                            │
 │  click link:           │                            │
 │  /reset?token=xxx      │                            │
 │───────────────────────→│                            │
 │                        │                            │
 │                        │  verify token + check expiry│
 │                        │  allow new password        │
 │                        │                            │
 │   "enter new password" │                            │
 │←───────────────────────│                            │
 │                        │                            │
 │  POST new password +   │                            │
 │  token                 │                            │
 │───────────────────────→│                            │
 │                        │  verify token again        │
 │                        │  hash new password         │
 │                        │  update DB                 │
 │                        │  invalidate old token      │
 │                        │                            │
 │   "password changed"   │                            │
 │←───────────────────────│                            │
```

```javascript
const crypto = require("crypto");

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return same response to prevent email enumeration
  if (!user) {
    return res.json({ message: "If email exists, reset link sent" });
  }

  // Generate secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save hash (not raw token) with 1 hour expiry
  user.resetTokenHash = tokenHash;
  user.resetTokenExpiry = Date.now() + 3600000;
  await user.save();

  // Send email
  await sendEmail(user.email, `Reset link: https://app.com/reset?token=${resetToken}`);

  res.json({ message: "If email exists, reset link sent" });
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});
```

> [!warn] Frontend এ token কোথায় রাখবে
# Access token কোথায় store করবে সেটা নিয়ে অনেক তর্ক আছে। `localStorage` সহজ কিন্তু XSS attack এ চুরি হতে পারে। `httpOnly cookie` secure কিন্তু CSRF risk আসে। Best practice: access token short-lived রাখো, refresh token `httpOnly secure cookie` তে রাখো, আর CSRF token ব্যবহার করো। সব কিছু একসাথে দরকার — কোনো single solution নেই।

## Summary

Real authentication এ middleware pattern সবচেয়ে clean — `authenticate` আর `requireRole` আলাদা করে রাখো। Google OAuth এর জন্য Passport.js production-ready। Redis session multiple server এর জন্য। Password reset এ সবসময় token hash করে store করো, expiry দাও, আর email enumeration prevent করো। Token storage এ XSS আর CSRF — দুটোই মাথায় রাখো।