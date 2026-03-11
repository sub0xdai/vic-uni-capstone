# 🚀 AI-Driven Development Lifecycle (AIDLC) Framework

**Core Philosophy:** Build context incrementally. Every step produces an artifact that becomes the exact context the AI needs for the next step. Never skip directly to coding.
**Cycle Duration ("Bolts"):** 2-3 days max.
**Universal Loop:** At every step, apply the **Plan ➡️ Execute ➡️ Validate** cycle.

---

## 🧭 PHASE 1: INCEPTION
*Establish business context and behavioral requirements before thinking about technology.*

### Step 1.1: Business Intent & Requirements Generation
* **Human Action:** Define the core customer pain point or business goal.
* **AI Action:** Analyze the intent, write user stories, define acceptance criteria, and ask clarifying questions (e.g., edge cases, blind spots).
* **Prompt Example:** *"I want to build [System/Feature]. Ask me up to 5 clarifying questions about the business rules, user roles, and edge cases. Once answered, generate a comprehensive PRD (Product Requirements Document) with detailed User Stories and Acceptance Criteria."*
* **Validation Check:** Does the PRD accurately reflect the business goal? Are all edge cases accounted for?

### Step 1.2: Work Unit Decomposition & Roadmap
* **Human Action:** Review the generated requirements.
* **AI Action:** Group requirements into actionable, highly cohesive, and loosely coupled work units. Suggest an optimal sequence of development.
* **Prompt Example:** *"Based on the PRD, break these requirements down into logical system boundaries (work units) following high cohesion and loose coupling. Create an implementation roadmap dictating what we should build first, second, and third, including complexity estimations."*
* **Validation Check:** Are the units right-sized (not too massive, not too small)? Does the build sequence logically stack?

---

## 🏗️ PHASE 2: CONSTRUCTION
*Transform business requirements into working technical solutions through progressive refinement.*

### Step 2.1: Conceptual Modeling (Domain-Driven Design)
* **Rule:** NO technology decisions yet.
* **Human Action:** Feed the AI the approved work units.
* **AI Action:** Identify Entities, Value Objects, and Aggregates.
* **Prompt Example:** *"Using Domain-Driven Design principles, analyze the [Work Unit] from our roadmap. Identify the core Entities, Value Objects, and Aggregates. Do not suggest databases or frameworks yet; focus purely on business logic modeling."*
* **Validation Check:** Does the domain model correctly represent real-world business rules? Catch misunderstandings here, not later.

### Step 2.2: Logical Architecture & Tech Selection
* **Human Action:** Transition from abstract concepts to system design.
* **AI Action:** Suggest system components, interfaces, integration patterns, and evaluate trade-offs for compute platforms and databases.
* **Prompt Example:** *"Based on our Conceptual Model, design the logical architecture. Suggest integration patterns (e.g., event-driven vs REST). Provide 2-3 options for compute platforms and databases, detailing the pros and cons of each based on our specific requirements."*
* **Validation Check:** Have you officially approved the data schemas and chosen the tech stack based on the AI's trade-off analysis?

### Step 2.3: Source Code & Automated Tests Generation
* **Human Action:** Provide the AI with the PRD (Phase 1) + Domain Model (Phase 2.1) + Architecture (Phase 2.2). Focus on strategic oversight.
* **AI Action:** Generate the implementation code and automated tests based on the acceptance criteria.
* **Prompt Example:** *"Here is our approved Architecture, Domain Model, and Acceptance Criteria. Generate the implementation code for [Specific Component]. Afterwards, generate comprehensive automated tests that cover all the acceptance criteria."*
* **Validation Check:** Do the tests pass? Does the code align with the strategic intent without you needing to micromanage every line?

### Step 2.4: Infrastructure as Code (IaC) & Pre-Prod Validation
* **Human Action:** Prepare for deployment.
* **AI Action:** Write IaC templates (Terraform, AWS CDK, etc.) and set up non-production testing environments.
* **Prompt Example:** *"Write the [Terraform/CDK] templates to deploy this component. Include configurations for a staging environment so we can validate the logical design and source code."*
* **Validation Check:** Does the system deploy cleanly in staging? Does it function end-to-end?

---

## ⚙️ PHASE 3: OPERATION
*Integrate with production with a focus on observability and self-healing.*

### Step 3.1: Production Deployment & Observability
* **Human Action:** Execute the deployment using the validated IaC templates from Step 2.4.
* **AI Action:** Assist with setting up monitoring, logging, and rollback capabilities.
* **Prompt Example:** *"Using our IaC templates, what are the specific metrics and distributed logs we need to monitor for this system? Generate the configuration for our monitoring dashboard and write a quick-rollback script."*
* **Validation Check:** Is the system live? Are metrics actively flowing into your dashboard?

### Step 3.2: AI-Assisted Incident Management
* **Human Action:** Maintain critical oversight. DO NOT let AI auto-restart production or auto-merge PRs without human approval.
* **AI Action:** Spot anomalies in logs, correlate events to find root causes, and suggest fixes for bugs.
* **Prompt Example (When a bug occurs):** *"Here are the recent error logs and metrics from production. Correlate these events to identify the root cause of the failure, and suggest a code or infrastructure fix."*
* **Validation Check:** Does the AI's suggested fix align with the system architecture? (If yes, approve and apply).

---
**🏁 End of Cycle:** Rinse and repeat this framework for the next "Bolt" on your implementation roadmap.
