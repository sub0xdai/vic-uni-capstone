## 3 Non-Functional Requirements


### 3.1 System Scalability and Multi-tenancy


As the platform utilises a SaaS model to support multiple small business
accounts simultaneously, the system must employ a robust multi-tenant
architecture. The database design must ensure strict logical isolation
of tenant data to prevent data leakage between competing businesses. The
system must be capable of scaling horizontally to support a minimum of
50 concurrent users during the prototype phase without performance
degradation. Furthermore, the backend infrastructure must handle
simultaneous API requests to the external Large Language Model (LLM),
implementing a queuing system to manage rate limits if the request
volume exceeds 100 requests per minute.

### 3.2 System Reliability and Uptime


Small businesses rely on consistent marketing activity for growth;
therefore, the platform must achieve a target availability of 99.9%
during business hours (9:00 AM – 5:00 PM AEST). To mitigate the risk of
"hallucinations" or factual errors common in Generative AI (Cillo &
Rubera, 2025), the system must implement an error-handling feedback
loop. If the external AI API fails or times out, the system must degrade
gracefully by preserving the user’s input data locally and displaying a
user-friendly error message within 1 second, rather than crashing the
application session.

### 3.3 Performance and Latency


While Generative AI processing is computationally intensive, the user
interface must remain responsive to encourage adoption among
non-technical business owners.

- Interface Latency: The dashboard and content editor interfaces must
  load within 2 seconds on standard broadband connections (Sample 01,
  2025).

- Generation Latency: Acknowledging that LLM generation takes time, the
  "Content Generator" module must initiate the request immediately and
  provide a visual progress indicator. Short-form content (e.g., social
  media captions) must be generated within 15 seconds, while long-form
  content (e.g., blog outlines) must be completed within 45 seconds.

### 3.4 Security and Data Privacy


Given that the platform processes proprietary business data and customer
profiles, security is paramount to building trust. All data transmission
between the client, the SaaS server, and the external AI provider must
be encrypted using HTTPS (TLS 1.3). To protect user credentials,
passwords must be hashed and salted using bcrypt or a comparable
algorithm before storage. Additionally, considering the ethical concerns
regarding AI data privacy (Rosário & Raimundo, 2025), the system must
not use user-specific proprietary data to train the shared public model
unless explicit consent is granted. API keys used to integrate with the
LLM must be stored in secure environment variables, never exposed in the
client-side code.

### 3.5 Usability and User Experience (UX)


Adopting AI technology can be daunting for small business owners lacking
technical expertise (Keegan et al., 2024). Therefore, the system must
prioritise a high level of usability. The interface for defining the
"Brand Voice" and "Target Audience" must utilise clear, non-technical
language and tooltips, ensuring that a user can complete a content
generation task with fewer than 5 clicks after logging in. The design
must be responsive, fully functional on both desktop (1920x1080) and
tablet devices, catering to business owners managing operations on the
go (Liando et al., 2025).

### 3.6 Non-functional requirements register

A non-functional requirement that cannot be measured is a wish, and the review on 15 March 2026 recorded the missing measurement column as a gap.
Every requirement above now has an identifier, a target, a way to measure it, and an honest status.

"Inherited" means the capability comes from the hosting platform rather than from this code, so it is only as good as that platform, and this project has not measured it either way.

| ID | Requirement | Target | How it would be measured | Status | Justification |
|---|---|---|---|---|---|
| NFR-01 | Tenant isolation | No user reads another user's row | A query with one user's token and no filter returns only that user's rows, and a cross-tenant write is refused | Measured, `docs/plan/tenancy-check.md` | Isolation is the security boundary of a multi-tenant SaaS product |
| NFR-02 | Availability | 99.9 percent during business hours | An uptime monitor with an alert, or the platform's own reported availability | Unmeasured, inherited from the host | Small businesses publish on a schedule, so an outage costs them a day |
| NFR-03 | Graceful AI failure | A plain message within 1 second, input preserved | Remove the API key, press Generate, time the message, check the form still holds the topic and keywords | Behaviour implemented, timing unmeasured | Losing typed input on a failed call is the failure users remember |
| NFR-04 | Interface latency | Dashboard and editor under 2 seconds | Browser network panel on a throttled connection, five runs, report the median | Unmeasured | Owners use this between other jobs, on a laptop or a tablet |
| NFR-05 | Generation latency | Caption under 15 seconds, outline under 45 | Time the request end to end for each content type, ten runs per type, report the median and the worst | Unmeasured, the route stores tokens but not duration | The wait is the cost of the feature, so it has to be stated |
| NFR-06 | Transport security | TLS 1.3 | Inspect the certificate and the negotiated protocol on the deployed URL | Unmeasured, inherited | Business profiles and drafts are commercial information |
| NFR-07 | Credential storage | Salted hash, never plaintext | Inspect the auth table; this code never handles a password | Inherited from Supabase Auth | A leaked password list is unrecoverable for the owner |
| NFR-08 | No training on user data | The provider does not train on this traffic | Read the provider's terms for the paid tier and record the answer with the date | Unmeasured, a terms question rather than a code question | Owners will paste material they do not want in a public model |
| NFR-09 | Few clicks to generate | Under 5 after login | Count the interactions from the dashboard to a generated draft | Counted: open Generate, choose a type, type a topic, press Generate | The audience is explicitly non-technical |
| NFR-10 | Responsive layout | Desktop 1920x1080 and tablet | Resize each screen to both sizes and record screenshots | Unmeasured | Business owners manage operations away from a desk |

Seven of the ten rows say unmeasured or inherited, and that is the honest position rather than a gap in the writing.
Two of them, NFR-04 and NFR-05, are cheap to measure and are the first thing to do once the app is deployed.
The load test card, `G4`, covers NFR-02 and the concurrency part of section 3.1.
