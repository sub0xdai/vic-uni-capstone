## 8 Resource Management


### 8.1 Introduction


Effective resource utilization is central to the successful delivery of
the AI-Powered Content Generation Engine. Because this project relies
heavily on third-party AI integration, resources have been strategically
allocated to ensure continuous system availability, secure data
isolation, and rigorous evaluation of the AI-generated outputs. This
section details the human, technical, and temporal resources required to
transition this system from a conceptual proposal into a functional,
measurable SaaS prototype.

### 8.2 Identification and Justification of Required Resources


6.2.1 Human Resources

To ensure deep technical execution and comprehensive system evaluation,
the four-person project team is divided into specialized roles:

- **Jamal** (Backend Architect & Resource Manager): Responsible for
  mapping out system workflows (Sequence Diagrams), allocating project
  resources, configuring the Vercel serverless API routes, and
  integrating the OpenAI API with our automated evaluation logic**.**

- **Daniel** (Frontend Developer & UI/UX Lead): Responsible for
  translating complex system logic into accessible pseudocode and
  designing the high-fidelity user interface (UI Design). Daniel ensures
  the frontend React dashboard provides user-friendly mechanisms for
  capturing business profiles and displaying content quality scores.

- **Semir** (Requirements Analyst & Project Scheduler): Responsible for
  defining the core Functional Requirements and technical Use Cases.
  Crucially, Semir manages the overarching project Timeline, ensuring
  that all development phases and deliverables align strictly with the
  Capstone milestones and industry scheduling standards. Hailu (Risk
  Coordinator & Project Synthesizer): Responsible for conducting
  comprehensive Risk Management.

- **Hailu** identifies potential system and operational risks,
  formulates technical mitigation strategies, and synthesizes the
  overarching project Conclusion to ensure the final proposal aligns
  with our initial scope.

#### 8.2.2 Technology and Software Resources


The project utilizes a modern, scalable cloud stack to minimize
infrastructure overhead while meeting strict non-functional performance
requirements:

- Supabase (Database & Authentication): Justification: Utilized for its
  robust PostgreSQL database and built-in Row-Level Security (RLS).
  Contribution: Essential for securely storing multi-tenant business
  profiles and archiving content drafts and evaluation metrics.

- Vercel (Cloud Hosting & API Routing): Justification: Provides
  serverless deployment capabilities with auto-scaling. Contribution:
  Ensures the system meets the non-functional requirement of handling 50
  concurrent users without exceeding a 2-second interface latency.

- OpenAI GPT-4 / GPT-3.5 APIs (Core Engine): Justification: The primary
  generative models. Contribution: GPT-3.5 will be used for low-latency,
  short-form generation (e.g., social media), while GPT-4 will be
  utilized for complex, long-form content (e.g., blogs).

- Secondary NLP Evaluation APIs (e.g., Twinword): Justification: A
  secondary tool is required to objectively score the LLM’s output.
  Contribution: Fulfills the critical system requirement to benchmark
  generated content against the user's requested tone and SEO keyword
  density.

- GitHub (Version Control): Justification: Industry-standard
  collaborative coding environment. Contribution: Facilitates parallel
  development between Jamal and Daniel, ensuring code integrity and
  reliable backups.

#### 8.2.3 Time Resources and Scheduling


The project will be managed using an Agile methodology, broken into
structured phases across the implementation timeline:

- Phase 1 (Architecture & Database): Configuring Supabase schemas and
  securing authentication workflows.

- Phase 2 (API Integration & Benchmarking): Connecting the GPT API and
  developing the automated evaluation engine to score content.

- Phase 3 (Frontend & User Feedback): Building the dashboard, editor,
  and visual data representations.

- Phase 4 (Testing & Refinement): Load testing Vercel routes and
  conducting accuracy tests on the AI prompt templates.

### 8.3 Contingency Planning and Monitoring


To mitigate technical and operational risks, resource usage will be
strictly monitored via weekly team meetings.

- Budgeting API Usage: Because OpenAI APIs operate on a pay-as-you-go
  token model, the team will utilize the cheaper GPT-3.5 model during
  development and testing phases to preserve financial resources, only
  escalating to GPT-4 for final benchmarking and the Capstone
  demonstration.

- Task Reallocation: Tasks will be tracked via a Kanban board on GitHub
  Projects. If a team member encounters bottlenecks (e.g., API
  integration delays), the team will practice cross-training, allowing
  members to reallocate hours and execute tasks in parallel to ensure
  milestones are not compromised
