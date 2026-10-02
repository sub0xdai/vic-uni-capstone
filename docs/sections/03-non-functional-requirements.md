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
