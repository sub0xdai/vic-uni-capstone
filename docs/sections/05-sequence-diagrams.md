## 5 Sequence Diagrams

### 5.1 Approach

Five diagrams follow, each covering exactly one scenario.

An earlier version of this document combined authentication, generation, evaluation, export and error handling into a single diagram.
That made the failure paths unreadable and hid the trust boundary, because the browser was shown reading the database directly.
Each scenario is now drawn separately, so the success path stays clean and each failure path can be traced on its own.

Actors, participants and their ordering are identical across all five diagrams.
The reader learns the participants once.

Rendered images are inserted after the source below is reviewed, since the previous diagram no longer matches the architecture.

### 5.2 Scenario: Sign in and reach the dashboard

```plantuml
@startuml
title Scenario 1: Sign in and reach the dashboard
autonumber

actor       "Small Business Owner"            as User
participant "Browser\n(React client)"         as Browser
participant "Proxy\n(session guard)"          as Proxy
participant "Server\n(Next.js)"               as Server
database    "Supabase\n(Auth, Postgres, RLS)" as Supabase

User    -> Browser  : Enter email and password
activate Browser
Browser -> Proxy    : POST /login
activate Proxy
Proxy   -> Supabase : signInWithPassword(email, password)
activate Supabase
Supabase --> Proxy  : access and refresh tokens
deactivate Supabase
Proxy   -> Proxy    : Write HTTP-only session cookies
Proxy   --> Browser : 303 redirect to /dashboard
deactivate Proxy

Browser -> Proxy    : GET /dashboard with cookies
activate Proxy
Proxy   -> Supabase : getClaims()
activate Supabase
Supabase --> Proxy  : claims, including the user identifier
deactivate Supabase
Proxy   -> Server   : Forward authenticated request
activate Server
Server  -> Supabase : select business_profile where user_id = auth.uid()
activate Supabase
Supabase --> Server : profile row, filtered by RLS
deactivate Supabase
Server  --> Proxy   : page payload
deactivate Server
Proxy   --> Browser : 200 dashboard
deactivate Proxy
Browser --> User    : Dashboard with saved drafts
deactivate Browser

@enduml
```

### 5.3 Scenario: Generate content, quality above threshold

```plantuml
@startuml
title Scenario 2: Generate content, quality above threshold
autonumber

actor       "Small Business Owner"            as User
participant "Browser\n(React client)"         as Browser
participant "Proxy\n(session guard)"          as Proxy
participant "Server\n(Next.js)"               as Server
database    "Supabase\n(Auth, Postgres, RLS)" as Supabase
participant "OpenAI API"                      as OpenAI

User    -> Browser   : Select content type, enter topic and keywords
activate Browser
Browser -> Proxy     : POST /api/generate
activate Proxy
Proxy   -> Supabase  : getClaims()
Supabase --> Proxy   : claims
Proxy   -> Server    : authenticated request
deactivate Proxy
activate Server

Server  -> Supabase  : select business_profile where user_id = auth.uid()
activate Supabase
Supabase --> Server  : brand tone, audience, industry
deactivate Supabase

Server  -> Server    : buildSystemPrompt(profile)
Server  -> Server    : buildUserPrompt(type, topic, keywords, constraints)

Server  -> OpenAI    : chat completion
activate OpenAI
OpenAI  --> Server   : generated draft
deactivate OpenAI

Server  -> Server    : score readability, tone, keywords, structure
Server  -> Supabase  : select past ratings for this content type
activate Supabase
Supabase --> Server  : ratings, or none for a new user
deactivate Supabase
Server  -> Server    : overall score, above the 0.6 threshold

Server  -> Supabase  : insert generated_content with analysis
activate Supabase
Supabase --> Server  : draft identifier
deactivate Supabase

Server  --> Browser  : 201 with draft, text and analysis
deactivate Server
Browser --> User     : Render in the editor with the quality card
deactivate Browser

@enduml
```

### 5.4 Scenario: Generate content, model unavailable

```plantuml
@startuml
title Scenario 3: Generate content, model unavailable
autonumber

actor       "Small Business Owner"            as User
participant "Browser\n(React client)"         as Browser
participant "Server\n(Next.js)"               as Server
database    "Supabase\n(Auth, Postgres, RLS)" as Supabase
participant "OpenAI API"                      as OpenAI

User    -> Browser : Click Generate
activate Browser
Browser -> Server  : POST /api/generate
activate Server

Server  -> Supabase : select business_profile
activate Supabase
Supabase --> Server : profile
deactivate Supabase
Server  -> Server   : assemble prompt
Server  -> OpenAI   : chat completion
activate OpenAI
OpenAI  --x Server  : timeout, 429 or 5xx
deactivate OpenAI

Server  -> Server   : back off, then retry once
Server  -> OpenAI   : chat completion, attempt 2
activate OpenAI
OpenAI  --x Server  : fails again
deactivate OpenAI

Server  -> Server   : abandon generation, write nothing
Server  --> Browser : 502 ok false, model unavailable
deactivate Server
Browser --> User    : Inline error, entered topic and keywords preserved
deactivate Browser

@enduml
```

### 5.5 Scenario: Generate content, quality below threshold

```plantuml
@startuml
title Scenario 4: Generate content, quality below threshold
autonumber

actor       "Small Business Owner"            as User
participant "Browser\n(React client)"         as Browser
participant "Server\n(Next.js)"               as Server
database    "Supabase\n(Auth, Postgres, RLS)" as Supabase
participant "OpenAI API"                      as OpenAI

User    -> Browser : Click Generate
activate Browser
Browser -> Server  : POST /api/generate
activate Server

Server  -> Supabase : select business_profile
activate Supabase
Supabase --> Server : profile
deactivate Supabase
Server  -> OpenAI   : chat completion, attempt 1
activate OpenAI
OpenAI  --> Server  : draft
deactivate OpenAI

Server  -> Server   : score the draft
Server  -> Server   : overall score below 0.6
Server  -> Server   : append the deficient dimensions to the prompt

Server  -> OpenAI   : chat completion, attempt 2
activate OpenAI
OpenAI  --> Server  : revised draft
deactivate OpenAI
Server  -> Server   : re-score, no further regeneration

Server  -> Supabase : insert generated_content with both reports
activate Supabase
Supabase --> Server : draft identifier
deactivate Supabase

Server  --> Browser : 201 with the revised draft and a regeneration notice
deactivate Server
Browser --> User    : Render, noting one regeneration occurred
deactivate Browser

@enduml
```

### 5.6 Scenario: Sign in with an invalid password

```plantuml
@startuml
title Scenario 5: Sign in with an invalid password
autonumber

actor       "Small Business Owner"            as User
participant "Browser\n(React client)"         as Browser
participant "Proxy\n(session guard)"          as Proxy
database    "Supabase\n(Auth, Postgres, RLS)" as Supabase

User    -> Browser : Enter a wrong password
activate Browser
Browser -> Proxy   : POST /login
activate Proxy
Proxy   -> Supabase : signInWithPassword()
activate Supabase
Supabase --> Proxy : error, invalid credentials
deactivate Supabase

Proxy   -> Proxy   : Write no cookies
Proxy   --> Browser : 401 with a generic message
deactivate Proxy

Browser --> User    : "Incorrect email or password", password field cleared
deactivate Browser

note right of Proxy
  The message is identical whether the email
  exists or not, so the response cannot be used
  to enumerate registered accounts.
end note

@enduml
```

### 5.7 Participants and their implementation

Each participant maps to a module in the repository, so the diagram can be checked against the code.

| Participant | Implementation | Responsibility |
|---|---|---|
| Browser | `app/**/page.tsx`, `components/*.tsx` | Rendering, form state, clipboard and rating interactions |
| Proxy | `proxy.ts` | Session refresh, route guarding, no cookies for unauthenticated requests |
| Server | `app/api/*/route.ts`, Server Components | Authentication check, prompt assembly, model call, scoring, persistence |
| Supabase | `supabase/schema.sql` | Authentication, storage, and row-level security policies |
| OpenAI API | called from `app/api/generate/route.ts` | Text generation only |

### 5.8 Implementation status

Scenarios 1, 2, 3 and 5 correspond to the demonstration build.

Scenario 4 depends on the quality evaluation engine, which is designed in the pseudocode and not yet implemented.
It is scheduled after the demonstration build, because the evaluation requires a working generation pipeline to measure.
Scoring is performed locally from readability, tone, keyword and structural metrics, with historical user ratings read from the database.
No external scoring vendor is used, which removes a dependency that the previous version of this document assumed but never implemented.
