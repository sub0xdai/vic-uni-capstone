## 2 Functional Requirements


### 2.1 Overview


This section outlines the functional requirements for the AI-powered
content generation system. Functional requirements describe the specific
functions and services the system has to offer to the users.

The proposed system shall operate as a Software-as-a-Service (SaaS)
platform, allowing users to utilize the software through a web browser
without installing software (Microsoft, 2023).

The system will use Generative AI to generate marketing content for
small businesses. Generative AI is commonly utilized to boost
productivity in marketing and business tasks (McKinsey & Company, 2023).

### 2.2 Front-End Functional Requirements


The front end is what the users will see and interact with when
browsing.

The system shall allow users to:

- **Authentication:** Users will be able to register, log in, and log
  out by using email and password

- **Validation:** Every required field must be filled out; if not, an
  error message will be shown

- **Security:** The system will not store passwords in plain text. To
  boost security, they will be saved in hashed form, in accordance with
  established security procedures (OWASP Foundation, 2023).

### 2.3 Business Profile Management


After successful login, the system shall allow the user to create and
update a business profile, including the following:

- **Input Fields:** Users provide the target audience, such as Product
  description and industry selection, with a dropdown selection

- **Brand tone:** Users can select tones such as ( Professional, Casual
  and Friendly )

- **Verification:** All fields are mandatory. The system shall verify
  that all mandatory fields are complete before generating content.

### 2.4 Content Generation


The system will provide a structured workflow for generating marketing
content.

**Content Options:** The system shall allow users to select a content
type, such as an Instagram caption, an email draft, or a blog outline

When the user clicks the “Generate” button:

1.  The system will send the business information to the server.

2.  The server will verify the data.

3.  The server constructs a structured prompt based on the profile of
    the business and the industry

4.  The server will send a request to the AI server.

5.  The AI service will generate marketing content.

6.  The system carries out an evaluation to score the content based on
    readability and brand tone before finalization.

7.  The system will display the generated content on the screen

The user will be able to:

- Save the content

- Copy the content

- A feedback rating from 1 to 5 stars is provided by the system, with
  this being weighted at 35% in the algorithm used for evaluation

- The system will process only one AI generation request per user at a
  time.

### 2.5 Content Storage and Management Dashboard


The system will provide a dashboard where users can

- View an overview of stored content, including the total number of
  drafts, average quality score percentage, and the monthly generation
  limit."

- See content type

- See the date of creation

- Delete your saved content

- Users can only access their own content

- The user can view the star rating and the detailed quality score
  metrics (Readability, Tone and Keywords) for their saved content.

### 2.6 Server-End Functional Requirements


The server will manage user authentication, AI requests and database
storage

The server will:

- Encrypt all communication between the user and the server using HTTPS
  (TLS)

- Ensure that passwords are not stored in plain text and are protected
  using secure hashing

- Data verification: Verify login credentials and profile information
  before sending any request to the AI service.

- The server shall create a session after a successful authentication.
  The system shall restrict access to protected features if the user is
  not authenticated.

The server shall confirm if all requested fields are completed before
processing requests.

When the user clicks the “Generate” button, it will:

- The server will verify that the user is authenticated.

- The server will collect the user’s business information.

- The server will create a structured prompt.

- The server will forward the prompt to the AI API.

- The AI server will return the generated content to the server.

- The server will transmit the generated content back to the user
  interface.

### 2.7 Data Storage Requirements


The system shall store generated content in a database.

Each record will include the following:

- User ID

- Generated content

- Content type

- The date and time when the content was created.

- **Quality Score**: A numerical value score between 0.0 and 1.0 that
  represents the effectiveness of the AI output

- **Analysis JSON**: A data object that represents the analysis of
  readability, tone markers and keyword integration

The system shall use foreign keys to link content to the correct user.

### 2.8 Database Requirements


The build creates six tables.
Three were planned in this section and three were added while building, so this section now describes what `web/supabase/schema.sql` actually creates.
Column names and types below are taken from that file.

**User Table**

This table is responsible for the authentication and security of the
SaaS Platform, guaranteeing that each business owner has a unique and
secure account.
It is provided and managed by Supabase Auth rather than created by this schema, which is why password storage is not described here beyond the fact that this project never handles a plaintext password.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| id | UUID (primary key) | Unique identifier for the account holder |
| email | VARCHAR(255) | The user’s unique login address |
| encrypted_password | VARCHAR(255) | Securely hashed and salted user credentials, managed by Supabase |
| created_at | TIMESTAMP | Timestamp of when the account was first registered |

**business_profile Table**

This table contains the brand identity and context that will be used to
inform the prompts that the AI will receive, which will be used to
create the marketing content that is specific to each business.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| id | UUID (primary key) | Unique identifier for the business profile |
| user_id | UUID (foreign key) | Associates the profile with the correct registered user, one profile per user |
| business_name | TEXT | The official name of the business |
| industry | TEXT | The sector the business operates within, chosen from a fixed list (e.g. Hospitality, Retail) |
| description | TEXT | A summary of the business’s core products/services |
| target_audience | TEXT | Information on who the content is being written for |
| brand_tone | ENUM | Voice to be used, one of Professional, Casual or Friendly |
| created_at, updated_at | TIMESTAMP | When the profile was first saved and last changed |

**generated_content Table**

This table is the core feedback loop that will be used to create
higher-quality content in the future, using the outputs from the AI, the
automated quality metrics and the star ratings provided by the users.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| id | UUID (primary key) | A unique identifier for the drafted content |
| user_id | UUID (foreign key) | Links the content to the user’s dashboard. |
| content_type | ENUM | Identifies the format: a caption, an email or a blog outline |
| topic | TEXT | What the owner asked for |
| keywords | TEXT[] | The keywords the draft was asked to work in |
| content_text | TEXT | The raw marketing text generated by the AI |
| analysis | JSONB | The five metrics and the overall score, stored together so the score cannot contradict them |
| rating | SMALLINT | The 1-5 star manual rating assigned by the user |
| status | ENUM | draft, published or discarded. The interface calls published Ready, because the system marks content for use and distributes nothing |
| status_changed_at | TIMESTAMP | When the status last moved |
| model, temperature | TEXT, NUMERIC | The model and sampling temperature that produced the draft |
| system_prompt, user_prompt | TEXT | The exact prompt text sent, stored in full rather than hashed |
| prompt_version | TEXT | `builtin:1` or `template:<n>`, recording whether a stored template or the built-in body produced the draft |
| usage | JSONB | The provider’s own token counts for the call |
| idempotency_key | TEXT | A per-request identifier, unique per user, so a retry returns the first draft instead of buying a second one |
| created_at | TIMESTAMP | Timestamp of when the content was generated. |

There is no separate `Quality_Score` column, which is a deliberate change from the earlier version of this section.
The score lives inside `analysis` beside the metrics that produce it, so a row cannot hold a headline number that contradicts its own report.
Section 3.13 of the design document records the reasoning and the cost.

**model_rate Table**

The price of a model, so the dashboard can report spend as data rather than as a constant in the code.
Every signed in user may read it and nobody may write it.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| model | TEXT (primary key) | The model the price applies to |
| input_per_million, output_per_million | NUMERIC | Price per million tokens in each direction |
| updated_at | TIMESTAMP | When the price was last changed |

**prompt_template Table**

An instruction body per content type, versioned, so a prompt can change without a code change.
Clients may read it and nobody may write it through the application, so a prompt edit passes through review.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| id | UUID (primary key) | Identifies the template |
| content_type | ENUM | Which of the three formats the body applies to |
| version | INTEGER | Increments per body, and is what `generated_content.prompt_version` refers to |
| body | TEXT | The instruction text sent to the model |
| is_active | BOOLEAN | At most one active row per content type, enforced by a partial unique index |
| created_at | TIMESTAMP | When the version was written |

**generation_lock Table**

The claim that a user has a generation in flight, which is how the system processes one request per user at a time.
A row is taken before the model call and released when the request finishes; a row older than ninety seconds is treated as abandoned.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| user_id | UUID (primary key, foreign key) | The user who holds the lock, one row per user at most |
| acquired_at | TIMESTAMP | When the lock was taken, used for the ninety second stale rule |

**Example:**

|     |         |                   |            |
|-----|---------|-------------------|------------|
| Id  | User_id | Content_type      | Created_at |
| 10  | 1       | social_caption    | 2026-04-02 |

### 2.9 System Flow


The system will operate according to the following workflow

1.  The user registers and logs in

2.  The user provides business information

3.  The user selects a content type,

4.  The user clicks on the “Generate” button.

5.  The server sends a request to the AI service.

6.  The AI generates marketing content.

7.  The server stores the content in the database.

8.  The system displays the generated content to the user.

9.  The user can save or erase the content.

This demonstrates how the front-end, server, AI service and databases
all work together.

### 2.10 Requirement identifiers

Each requirement above now carries an identifier, so the design, the plan and the report can refer to one line instead of a paragraph.
The third and fourth columns are where the requirement is implemented and where it is checked.

| ID | Requirement | Implemented in | Checked by |
|---|---|---|---|
| FR-01 | A person can register with an email and a password | `web/app/login`, Supabase Auth | Browser check |
| FR-02 | A person can log in | `web/app/login` | Browser check |
| FR-03 | A person can log out | `web/components/nav-bar.tsx` | Browser check |
| FR-04 | A required field that is left empty shows an error message | `web/lib/profile.ts`, `web/components/profile-form.tsx` | `web/lib/profile.test.ts` |
| FR-05 | Passwords are never stored in plain text | Supabase Auth, not handled by this code | Supabase Auth |
| FR-06 | The owner can create and update a business profile | `web/app/onboarding`, `web/components/profile-form.tsx` | Browser check, `/preview` |
| FR-07 | Every profile field is mandatory and checked before generation | `web/lib/profile.ts`, `web/app/api/generate/route.ts` | `web/lib/profile.test.ts` |
| FR-08 | The owner selects one of three content types | `web/components/generator-panel.tsx` | `/preview`, `web/lib/types.test.ts` |
| FR-09 | The server builds a structured prompt from the profile and the industry | `web/lib/prompts.ts` | `web/lib/prompts.test.ts` |
| FR-10 | The server sends the request to the AI service and returns the content | `web/lib/generator.ts`, `web/lib/gemini.ts` | `web/lib/gemini.test.ts` |
| FR-11 | The content is evaluated before it is shown | `web/lib/evaluate.ts` | `web/lib/evaluate.test.ts` |
| FR-12 | The content is displayed | `web/app/generate`, `web/app/draft/[id]` | `/preview`, browser check |
| FR-13 | The owner can save the content | `web/lib/draft-save.ts`, both pages that edit | `web/lib/draft-save.test.ts` |
| FR-14 | The owner can copy the content | `web/components/draft-editor.tsx` | `/preview` |
| FR-15 | A 1-5 star rating is recorded and weighted at 35 percent | `web/lib/types.ts`, `web/lib/score.ts` | `web/lib/score.test.ts` |
| FR-16 | One generation request is processed per user at a time | `web/app/api/generate/route.ts`, `web/supabase/schema.sql` | `web/lib/schema-sync.test.ts`, and the SQL run against a local Postgres |
| FR-17 | The dashboard shows total drafts, average quality and the monthly limit | `web/app/dashboard/page.tsx` | Browser check |
| FR-18 | The dashboard shows the content type and the creation date | `web/components/draft-list.tsx` | `/preview` |
| FR-19 | The owner can delete saved content | `web/app/dashboard/page.tsx` | Browser check |
| FR-20 | A user can only read their own content | Row level security in `web/supabase/schema.sql` | `docs/plan/tenancy-check.md` |
| FR-21 | The owner can see the star rating and the detailed quality metrics for saved content | `web/app/draft/[id]`, `web/components/quality-card.tsx` | `/preview`, browser check |
| FR-22 | Each record stores the user, the content, the type, the time, the score and the analysis | `web/supabase/schema.sql` | `web/lib/schema-sync.test.ts` |
| FR-23 | Content is linked to its user by a foreign key | `web/supabase/schema.sql` | `web/lib/schema-sync.test.ts` |
| FR-24 | A session is created after authentication and protected pages refuse an unauthenticated request | `web/proxy.ts`, `web/lib/supabase/*` | Browser check: `/dashboard` answers 307 to `/login` |
| FR-25 | The server verifies every field before it calls the AI service | `web/app/api/generate/route.ts` | `web/lib/types.test.ts`, `web/lib/prompts.test.ts` |

Two things this table makes visible.
First, several requirements are checked by a browser walk rather than by a test, because they are screen behaviour, and the walk has not been recorded for each of them yet.
Second, the identifiers are new: the proposal was marked without them, and the review on 15 March 2026 recorded their absence as a traceability gap.
