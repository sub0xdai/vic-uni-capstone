## 9 Risk Management


\
### 9.1 Risk Identification

========================

Developing an AI-powered Software-as-a-Service (SaaS) platform presents
technical and operational risks that can affect performance, security,
and project delivery. Early identification enables the team to implement
strategies that minimise negative impacts.

A key risk is AI content quality and hallucination. Large Language
Models (LLMs) may generate inaccurate, irrelevant, or misleading
marketing content. Without proper evaluation, this can undermine the
platform's credibility with small business users. Because the system
depends on automated content generation, maintaining output quality is
essential for trust and usability.

API dependency and service availability are additional risks. The system
relies on an external AI service, in this build the Google Gemini API, to generate
content. If the service is unavailable, experiences latency, or reaches
usage limits, the platform may be unable to generate new content for
users.

Data privacy and security are also critical risks. The platform stores
business profiles, marketing information, and generated content in its
database. Unauthorised access or data leakage between tenants could
compromise confidential information and reduce user trust.

Performance and scalability are additional concerns. As user numbers
grow, the system must handle increased requests to the AI service,
database, and server infrastructure. Inefficient scaling may result in
slow response times or system delays.

Project delivery risks may result from limited development time,
integration challenges, or technical complexity. Because the project
includes multiple components such as frontend development, backend
services, database design, and AI integration, unexpected technical
issues could delay implementation if not carefully managed.

### 9.2 Risk Mitigation Strategy


To address the identified risks, several mitigation strategies are
incorporated into the system design and project management approach.

To reduce the risk of low-quality AI-generated content, the platform
features a content evaluation module that automatically analyzes
generated text using metrics such as readability, keyword relevance, and
tone alignment with the business profile. Users can also rate content
through a star-based feedback system. Together, these mechanisms create
a feedback loop that improves prompt design and maintains high output
quality over time.

To mitigate the risk of external API failures, the generate route classifies every failure into one of four kinds, `timeout`, `unreachable`, `upstream` or `unusable`, and maps each kind to one status code and one plain sentence.
The form keeps what the owner typed.
There is no retry and no exponential backoff: a retry multiplies a billable call and hides the fault, so the build reports the failure instead and lets the owner decide.
This paragraph previously claimed retry logic that does not exist.

To manage data security and privacy risks, the system follows
industry-standard security practices. All client-server communication is
encrypted using HTTPS (TLS). User passwords are stored with secure
hashing algorithms such as bcrypt. Row-Level Security (RLS) ensures each
user can access only their own business data within the multi-tenant
database.

Performance and scalability risks are addressed by deploying the
platform on serverless cloud infrastructure, which enables automatic
scaling based on user demand. The architecture separates frontend,
backend, and database components to ensure efficient processing of AI
requests and database operations without impacting overall platform
performance.

Project management risks are mitigated through structured task
allocation and regular team coordination. Each team member is
responsible for specific technical components, and weekly progress
reviews help identify potential delays early and allow for task
redistribution if needed.

Through these mitigation strategies, the project aims to ensure the
AI-powered platform remains secure and reliable, consistently delivering
value to small business users.

### 9.3 Risk register

The prose above describes the categories.
This register is the version that can be held to account: one row per risk, with who owns it and whether it is actually controlled.

Status means the current state of the mitigation, not the intention: **controlled** means there is a mechanism and it has been exercised, **partial** means the mechanism exists but has not been exercised, **open** means there is no mechanism yet.

| ID | Risk | Likelihood | Impact | Owner | Mitigation | Status |
|---|---|---|---|---|---|---|
| R-01 | Generated content is poor, off-brief or invents facts | High | High | Daniel | A local scorer on five metrics, the owner's rating, and the evaluation experiment that tests whether the score tracks human judgement | Partial: the scorer is live, the experiment has no sample yet |
| R-02 | The AI provider fails, throttles or times out | Medium | High | Daniel | Four failure kinds mapped to plain messages, a thirty second timeout, the input preserved, and no silent retry | Controlled |
| R-03 | One tenant reads another tenant's data | Low | High | Daniel | Row level security on every tenant table, no default grants, and a two-account isolation check run against the live project | Controlled, and re-run after any schema change |
| R-04 | A secret or personal data reaches the repository | Medium | High | Daniel | `.env.local` is ignored, and a pre-commit scan refuses a staged file containing a key, an email, a phone number or a card number | Controlled |
| R-05 | The free Supabase project pauses before the demonstration | High | Medium | Daniel | Wake the project in the week before, and keep the dashboard activity visible | Open |
| R-06 | Only one person can carry the build | High | High | Daniel | Cards are sized to be delegated, `/preview` is the review surface, and the plan names which cards suit which person | Accepted, managed by scope reduction rather than by staffing |
| R-07 | The evaluation experiment is never finished, leaving the rubric unvalidated | High | High | Daniel | The experiment is designed and the tool exists, so what is left is one export and a few ratings | Open, and the largest assessment risk |
| R-08 | Nothing is deployed, so there is no public URL and no load test | High | High | All | A Vercel project and a domain, which need owner credentials | Open |
| R-09 | A stored prompt body is edited into something the scorer cannot use | Low | Medium | Daniel | The route lints a stored body at request time, logs the problem, and falls back to the built-in body | Controlled |
| R-10 | A reader treats the quality score as a guarantee of quality | Medium | Medium | Daniel | The interface shows the reason for each failed check, and the report states that the metric is a heuristic with an unmeasured correlation to human judgement | Partial |

Two rows carry the honest weight of this build: R-07 and R-08.
An unvalidated rubric and an undeployed application are the two findings a marker can reach without reading any code.
