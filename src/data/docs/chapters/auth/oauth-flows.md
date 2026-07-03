## OAuth কোন সমস্যার সমাধান করে

ভাবো তুমি একটা থার্ড পার্টি photo printing app ব্যবহার করছো। এই app কে তোমার Google Photos এর কিছু ছবি দেখতে হবে। এখন তুমি কি সেই app কে তোমার Google এর username আর password দিবে? কখনো না! সে তখন পুরো account access পেয়ে যাবে।

OAuth এই সমস্যার সমাধান দেয়। এটা **delegated access** দেয় — অর্থাৎ তোমার password না দিয়েই একটা app কে তোমার কোনো resource এ limited access দেওয়া যায়।

```text
   ┌─────────┐         ┌──────────┐         ┌──────────────┐
   │  Photo  │         │  Google  │         │    Google    │
   │  App    │         │   Auth   │         │    Photos    │
   │(Client) │         │  Server  │         │(Resource API)│
   └────┬────┘         └─────┬────┘         └──────┬───────┘
        │                    │                     │
        │  ছবি দেখতে চাই     │                     │
        │───────────────────→│                     │
        │                    │                     │
        │  "Photo App তোমার  │                     │
        │   ছবি দেখতে চায়"  │                     │
        │←───────────────────│                     │
        │                    │                     │
        │  তুমি approve করলে  │                     │
        │───────────────────→│                     │
        │                    │                     │
        │   Access Token     │                     │
        │←───────────────────│                     │
        │                    │                     │
        │   GET /photos + Token                    │
        │──────────────────────────────────────────→│
        │                                          │
        │              ছবি গুলো                      │
        │←──────────────────────────────────────────│
```

## OAuth এর Roles

OAuth এ চারটা main role থাকে:

| Role | কে | উদাহরণ |
|------|-----|--------|
| **Resource Owner** | যার ডেটা, সেই user | তুমি |
| **Client** | access চাওয়া app | Photo printing app |
| **Authorization Server** | token issue করে | Google Auth |
| **Resource Server** | ডেটা রাখে, token verify করে | Google Photos API |

অনেক সময় Authorization Server আর Resource Server একই company তে থাকে, কিন্তু logical ভাবে আলাদা।

## Authorization Code Flow — সবচেয়ে common

এটা সবচেয়ে বেশি ব্যবহৃত flow। Web application এর জন্য standard। এখানে ধাপে ধাপে দেখি:

```text
Browser                    Client App              Auth Server
   │                           │                        │
   │  "Login with Google"      │                        │
   │──────────────────────────→│                        │
   │                           │                        │
   │                           │  Redirect to auth URL  │
   │  302 → accounts.google…   │                        │
   │←──────────────────────────│                        │
   │                           │                        │
   │  Login + Consent screen                            │
   │───────────────────────────────────────────────────→│
   │                           │                        │
   │  302 redirect with CODE                             │
   │  ?code=AUTH_CODE         │                        │
   │←───────────────────────────────────────────────────│
   │                           │                        │
   │                           │  POST /token            │
   │                           │  code + client_secret  │
   │                           │───────────────────────→│
   │                           │                        │
   │                           │  Access Token +        │
   │                           │  Refresh Token         │
   │                           │←───────────────────────│
   │                           │                        │
   │   Login success                                   │
   │←──────────────────────────│                        │
```

ধাপ গুলো:

1. User "Login with Google" এ click করে।
2. Client browser কে Google এর authorization URL এ redirect করে।
3. User সেখানে login করে আর consent দেয়।
4. Google browser কে আবার client এর redirect URL এ ফেরায়, সাথে একটা **authorization code** থাকে।
5. Client সেই code আর নিজের `client_secret` নিয়ে auth server এর `/token` endpoint এ POST করে।
6. Auth server verify করে **access token** দেয়।

> [!note] Code কেন, সরাসরি token না?
# Browser redirect এর সময় যদি সরাসরি token পাঠানো হতো, সেটা browser history বা referrer header এ চলে যেতে পারে। Code এর মাধ্যমে একটা extra step যোগ হয় — token সরাসরি client আর auth server এর মধ্যে back-channel এ exchange হয়, secure।

## Authorization URL

```http
GET https://accounts.google.com/o/oauth2/v2/auth?
    response_type=code
    &client_id=YOUR_CLIENT_ID
    &redirect_uri=https://yourapp.com/callback
    &scope=openid email profile
    &state=RANDOM_STRING
```

| Parameter | কী |
|-----------|-----|
| `response_type` | `code` — auth code flow |
| `client_id` | তোমার app এর ID |
| `redirect_uri` | token পাওয়ার URL |
| `scope` | কী permission লাগবে |
| `state` | CSRF protection |

## Token Exchange

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_FROM_STEP_4
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=https://yourapp.com/callback
```

```json
{
  "access_token": "ya29.a0...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "1//0g..."
}
```

## PKCE — Public Client এর জন্য

**PKCE** (Proof Key for Code Exchange) হলো Authorization Code Flow এর একটা extension। SPA বা mobile app এ `client_secret` hide করা যায় না — সেই জন্য PKCE দরকার।

```text
Client                        Auth Server
  │                               │
  │  code_verifier = random(43)   │
  │  code_challenge = SHA256(verifier) │
  │                               │
  │  Auth request + code_challenge│
  │──────────────────────────────→│
  │                               │
  │  authorization code           │
  │←──────────────────────────────│
  │                               │
  │  Token request + code_verifier│
  │──────────────────────────────→│
  │                               │
  │  Server: SHA256(verifier)     │
  │  == stored challenge?         │
  │                               │
  │  Access Token                 │
  │←──────────────────────────────│
```

PKCE তে client একটা random `code_verifier` generate করে, তার hash (`code_challenge`) auth request এর সাথে পাঠায়। Token exchange এর সময় আসল `code_verifier` পাঠায়। যদি attacker code intercept করে, তার কাছে verifier নেই — token পাবে না।

> [!tip] SPA আর Mobile App এ সবসময় PKCE
# React, Vue, বা mobile app — যেখানে client code browser/app এ থাকে, সেখানে `client_secret` secure না। সেই জন্য সবসময় PKCE use করো। আধুনিক OAuth 2.1 তে PKCE সব flow এর জন্য mandatory।

## Client Credentials Flow — Machine to Machine

User নেই — দুটো service এর মধ্যে auth। যেমন: একটা backend service আরেকটা API কে call করছে।

```http
POST https://auth.example.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=SERVICE_ID
&client_secret=SERVICE_SECRET
&scope=read:data
```

কোনো user consent নেই, কোনো redirect নেই। সরাসরি client id + secret দিয়ে token আসে।

```text
  Backend Service                Auth Server           API
       │                             │                  │
       │  POST /token (credentials)  │                  │
       │────────────────────────────→│                  │
       │                             │                  │
       │      Access Token           │                  │
       │←────────────────────────────│                  │
       │                             │                  │
       │  GET /data + Bearer token                     │
       │───────────────────────────────────────────────→│
       │                                                │
       │                    Data                        │
       │←───────────────────────────────────────────────│
```

## Refresh Token Flow

Access token expire হয়ে গেলে user কে আবার login করতে হবে না। Refresh token দিয়ে নতুন access token নেওয়া যায়।

```http
POST https://auth.example.com/token

grant_type=refresh_token
&refresh_token=YOUR_REFRESH_TOKEN
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

## বিভিন্ন Flow এর তুলনা

| Flow | User? | Best For | PKCE? |
|------|-------|----------|-------|
| Authorization Code | হ্যাঁ | Web app (server-side) | optional |
| Auth Code + PKCE | হ্যাঁ | SPA, Mobile | mandatory |
| Client Credentials | না | Service to service | N/A |
| Implicit (deprecated) | হ্যাঁ | ~~old SPAs~~ | বাদ দাও |

> [!danger] Implicit Flow আর ব্যবহার করবে না
# আগে SPA এর জন্য Implicit Flow ছিল — সরাসরি browser এ token আসতো। কিন্তু এটা insecure — token browser history তে চলে যায়, refresh করা যায় না। OAuth 2.1 তে এটা deprecated। এখন Authorization Code + PKCE ব্যবহার করো।

## Summary

OAuth 2.0 সমাধান করে delegated access — password ছাড়া limited permission দেওয়া। চারটা role: resource owner, client, authorization server, resource server। সবচেয়ে common flow হলো Authorization Code Flow। SPA আর mobile এর জন্য PKCE mandatory। Machine-to-machine এর জন্য Client Credentials। Implicit Flow deprecated — ব্যবহার করবে না।