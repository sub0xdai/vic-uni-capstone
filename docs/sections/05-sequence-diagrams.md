
## 5 Sequence Diagrams

### 5.1 Approach

Five diagrams follow, each covering one scenario. The authentication scenarios and content-generation scenarios use the participants relevant to their respective flows.

The diagrams reflect the current implementation in the repository. Authentication is handled by Supabase Auth through the browser client. The generation API independently verifies the user, retrieves the business profile, checks usage limits, calls Google Gemini, evaluates the returned content and saves the result.

The quality evaluator is implemented, but the current generation route does not automatically regenerate content when its score is below the quality threshold. The diagrams therefore show the behaviour that the code actually performs rather than the earlier proposed behaviour.

### 5.2 Scenario: Sign in and reach the dashboard

```plantuml
@startuml
title Scenario 1: Sign in and reach the dashboard
autonumber

actor "Small Business Owner" as User
participant "Browser\n(Login Page)" as Browser
participant "Supabase Auth" as Auth
participant "Proxy\n(session guard)" as Proxy
participant "Next.js Dashboard" as Server
database "Supabase Database" as DB

User -> Browser: Enter email and password
User -> Browser: Submit login form
activate Browser

Browser -> Auth: signInWithPassword(email, password)
activate Auth
Auth --> Browser: Successful authentication and session
deactivate Auth

Browser -> Browser: router.push("/dashboard")
Browser -> Proxy: GET /dashboard
activate Proxy

Proxy -> Auth: getClaims()
activate Auth
Auth --> Proxy: Authentication claims
deactivate Auth

Proxy -> Server: Continue dashboard request
activate Server
Server -> DB: Retrieve dashboard data
DB --> Server: Available dashboard data
Server --> Proxy: Dashboard response
deactivate Server

Proxy --> Browser: Dashboard response
deactivate Proxy
Browser --> User: Display dashboard
deactivate Browser

@enduml
```

![Scenario 1: sequence-01-login-success](../assets/media/sequence-01-login-success.png)


### 5.3 Scenario: Generate content successfully

```plantuml
@startuml
title Scenario 2: Generate content successfully
autonumber

actor "Small Business Owner" as User
participant "Browser\n(React client)" as Browser
participant "Generate API Route\n(Next.js)" as Server
database "Supabase\n(Auth and Postgres)" as DB
participant "Google Gemini API" as Gemini
participant "Local Quality Evaluator" as Evaluator

User -> Browser: Select content type, topic and keywords
User -> Browser: Submit generation request
activate Browser

Browser -> Server: POST /api/generate
activate Server

Server -> Server: Parse and validate request
Server -> DB: auth.getUser()
DB --> Server: Authenticated user

Server -> DB: Check idempotency key (if provided)
DB --> Server: Existing result or no matching result

Server -> DB: Retrieve business_profile
DB --> Server: Business profile

Server -> DB: Count current-month generations
DB --> Server: Usage count

Server -> DB: Acquire generation lock
DB --> Server: Lock acquired

Server -> Server: Build system and user prompts
Server -> Server: Load active prompt template (if available)

Server -> Gemini: generateContent request
activate Gemini
Gemini --> Server: Generated content and usage
deactivate Gemini

Server -> Evaluator: evaluateDraft(content, type, keywords, tone, rating=null)
activate Evaluator
Evaluator --> Server: Quality report
deactivate Evaluator

Server -> DB: Insert generated_content with analysis
DB --> Server: Saved draft

Server -> DB: Release generation lock

Server --> Browser: 201 Created with saved draft
deactivate Server

Browser --> User: Display generated draft and analysis
deactivate Browser

@enduml
```

![Scenario 2: sequence-02-generation-success](../assets/media/sequence-02-generation-success.png)


### 5.4 Scenario: Generate content, model unavailable

```plantuml
@startuml
title Scenario 3: Generate content, model unavailable
autonumber

actor "Small Business Owner" as User
participant "Browser\n(React client)" as Browser
participant "Generate API Route\n(Next.js)" as Server
database "Supabase\n(Auth and Postgres)" as DB
participant "Google Gemini API" as Gemini

User -> Browser: Click Generate
activate Browser
Browser -> Server: POST /api/generate
activate Server

Server -> Server: Validate request
Server -> DB: Verify user with auth.getUser()
DB --> Server: Authenticated user

Server -> DB: Retrieve business profile
DB --> Server: Business profile

Server -> DB: Check monthly usage and acquire lock
DB --> Server: Usage permitted and lock acquired

Server -> Server: Assemble prompts
Server -> Gemini: generateContent request
activate Gemini

alt Timeout or unreachable
    Gemini --x Server: Timeout or connection failure
    Server --> Browser: 504 Gateway Timeout
else Upstream or unusable response
    Gemini --x Server: Upstream error or unusable response
    Server --> Browser: 502 Bad Gateway
end

deactivate Gemini

Server -> DB: Release generation lock
note over Server, DB
No generated draft is saved
when model generation fails.
end note

deactivate Server
Browser --> User: Display generation error
deactivate Browser

@enduml
```

![Scenario 3: sequence-03-model-unavailable](../assets/media/sequence-03-model-unavailable.png)


### 5.5 Scenario: Generate content with a low quality score

```plantuml
@startuml
title Scenario 4: Generate content with a low quality score
autonumber

actor "Small Business Owner" as User
participant "Browser\n(React client)" as Browser
participant "Generate API Route\n(Next.js)" as Server
database "Supabase\n(Auth and Postgres)" as DB
participant "Google Gemini API" as Gemini
participant "Local Quality Evaluator" as Evaluator

User -> Browser: Submit generation request
activate Browser
Browser -> Server: POST /api/generate
activate Server

Server -> Server: Validate request
Server -> DB: Verify user and retrieve business profile
DB --> Server: Authenticated user and profile

Server -> DB: Check usage and acquire generation lock
DB --> Server: Usage permitted and lock acquired

Server -> Server: Build prompts
Server -> Gemini: generateContent request
activate Gemini
Gemini --> Server: Generated draft
deactivate Gemini

Server -> Evaluator: evaluateDraft(..., rating=null)
activate Evaluator
Evaluator --> Server: Quality report below threshold
deactivate Evaluator

note over Server
The needsRegeneration() helper exists
in score.ts, but the generation route
does not call it.

No automatic regeneration occurs.
end note

Server -> DB: Insert draft with its quality report
DB --> Server: Saved draft

Server -> DB: Release generation lock
Server --> Browser: 201 Created with draft and analysis
deactivate Server

Browser --> User: Display draft and low quality score
deactivate Browser

@enduml
```

![Scenario 4: sequence-04-low-quality-score](../assets/media/sequence-04-low-quality-score.png)


### 5.6 Scenario: Sign in with an invalid password

```plantuml
@startuml
title Scenario 5: Sign in with an invalid password
autonumber

actor "Small Business Owner" as User
participant "Browser\n(Login Page)" as Browser
participant "Supabase Auth" as Auth

User -> Browser: Enter email and incorrect password
User -> Browser: Submit login form
activate Browser

Browser -> Auth: signInWithPassword(email, password)
activate Auth
Auth --> Browser: Authentication error
deactivate Auth

Browser -> Browser: setMessage(error.message)
Browser --> User: Display authentication error

note right of Browser
The user remains on the login page.
Dashboard navigation does not occur.
The error message comes from Supabase.
end note

deactivate Browser
@enduml
```

![Scenario 5: sequence-05-login-invalid-password](../assets/media/sequence-05-login-invalid-password.png)


### 5.7 Participants and their implementation

Each participant maps to a module in the repository, allowing the diagrams to be checked against the implementation.

| Participant | Implementation | Responsibility |
|---|---|---|
| Browser | `app/**/*.tsx`, `components/*.tsx` | Rendering, form state and user interactions |
| Proxy | `proxy.ts` | Authentication claim checks and protected-route handling |
| Generate API Route | `app/api/generate/route.ts` | Request validation, authentication, usage limits, locking, generation and persistence |
| Supabase | Supabase client and `supabase/schema.sql` | Authentication, database storage and row-level security |
| Google Gemini API | `web/lib/gemini.ts`, `web/lib/generator.ts` | AI text generation |
| Local Quality Evaluator | `web/lib/evaluate.ts`, `web/lib/score.ts` | Readability, tone, keyword, structure and satisfaction scoring |

### 5.8 Implementation status

All five scenarios describe functionality present in, or directly connected to, the current demonstration build.

The login page uses Supabase browser authentication. The proxy checks authentication claims when protected pages are requested. The generation API separately verifies the authenticated user before processing a request.

Content generation uses Google Gemini. After receiving the generated draft, the route calls the local quality evaluator once and stores the resulting analysis with the draft. The evaluator calculates readability, tone alignment, keyword coverage, structural compliance and user satisfaction. During initial generation, the rating is passed as `null`, resulting in a neutral satisfaction score.

The `needsRegeneration()` helper exists in `web/lib/score.ts`, and the quality threshold is defined in the scoring implementation. However, the current generation route does not call this helper. Consequently, a low-scoring draft is not automatically regenerated. If evaluation fails, the route logs the failure and can still save the draft with a null analysis value.

The current implementation does not retry failed Gemini requests. Generation failures return an appropriate error response, and the generation lock is released in the route's cleanup process.

