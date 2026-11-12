## 10 Timeline & Milestone


<span class="mark">The following is a project timetable for the
development of the AI Content Generation Engine, commencing with the
design phase on February 16, 2026 and ending with the project in
November 2026.</span>

### 10.1 NIT3003 – IT Capstone Project 1


At this phase, the "Logic Blueprint" of the AI Content Generation Engine
is addressed, which includes the requirements and design of the AI
Content Generation Engine.

|  |  |  |  |  |  |
|----|----|----|----|----|----|
| **Task ID** | **Component Name** | **Owner(s)** | **Start Date** | **End Date** | **Duration** |
| 1.1 | Research on AI Content Generation | Semir Abdu | 16/02/2026 | 22/02/2026 | 7 Days |
| 1.3.1 | Introduction | Hailu Tesfaye | 17/02/2026 | 22/02/2026 | 6 Days |
| 1.3.2 | Functional Requirements | Semir Abdu | 17/02/2026 | 22/02/2026 | 6 Days |
| 1.3.3 | Non-Functional Requirements | Jamal Hussein | 17/02/2026 | 22/02/2026 | 6 Days |
| 1.4.1 | Use Case Logic | Semir Abdu | 23/02/2026 | 07/03/2026 | 13 Days |
| 1.4.2 | Sequence Diagram | Jamal Hussein | 23/02/2026 | 07/03/2026 | 13 Days |
| 1.4.3 | Pseudocode | Daniel Palazzolo | 23/02/2026 | 07/03/2026 | 13 Days |
| 1.4.4 | UI Design | Daniel Palazzolo | 23/02/2026 | 07/03/2026 | 13 Days |
| 1.4.6 | Risk Management | Hailu Tesfaye | 23/02/2026 | 07/03/2026 | 13 Days |
| 1.4.7 | Timeline & Gantt Setup | Semir Abdu | 23/02/2026 | 07/03/2026 | 13 Days |
| 1.4.8 | Conclusion (Capstone 1) | Hailu Tesfaye | 23/02/2026 | 07/03/2026 | 13 Days |

**NIT3003 – IT Capstone Project 1 Gant Chart**

<img src="../assets/media/image7.png"
style="width:6.5in;height:2.51389in" />

### 10.2 Project implementation


At this phase, the documentation of the Capstone Project 1 is
transformed into a code and database format.

|  |  |  |  |  |  |
|----|----|----|----|----|----|
| **Task ID** | **Technical Component** | **Owner(s)** | **Start Date** | **End Date** | **Duration** |
| 2.1.1 | Environment Setup | Team | 13/03/2026 | 27/05/2026 | 76 Days |
| 2.1.2 | Database Schema Design | Semir Abdu | 28/03/2026 | 30/04/2026 | 33 Days |
| 2.1.3 | Content Table Implementation | Team | 01/05/2026 | 31/05/2026 | 31 Days |
| 2.2.1 | AI API Integration | Jamal Hussein | 01/06/2026 | 15/07/2026 | 45 Days |
| 2.2.2 | Prompt Engineering | Jamal Hussein | 16/07/2026 | 15/08/2026 | 31 Days |
| 2.2.3 | Rating System Logic | Semir Abdu | 16/08/2026 | 31/08/2026 | 15 Days |
| 2.3.1 | User Authentication | Hailu Tesfaye | 01/09/2026 | 20/09/2026 | 20 Days |
| 2.3.2 | Content Display UI | Daniel Palazzolo | 21/09/2026 | 15/10/2026 | 25 Days |

**Project implementation Gantt chart**

<img src="../assets/media/image6.png"
style="width:6.5in;height:1.84722in" />

### 10.3 NIT4001 – IT Capstone Project 2


This is the final phase, which includes the benchmarking and the final
oral presentation.

|  |  |  |  |  |  |
|----|----|----|----|----|----|
| **Task ID** | **Assessment Component** | **Owner(s)** | **Start Date** | **End Date** | **Duration** |
| 3.1.1 | Progress Diary | All Members | 02/11/2026 | 07/11/2026 | 6 Days |
| 3.2.1 | Programming Code (Tech Build) | All Members | 09/11/2026 | 13/11/2026 | 5 Days |
| 3.2.3 | Project Poster / ePoster | All Members | 09/11/2026 | 13/11/2026 | 5 Days |
| 3.2.6 | Final Edits & Proofreading | All Members | 20/11/2026 | 21/11/2026 | 2 Days |
| 3.3.1 | Final Oral Presentation | All Members | 23/11/2026 | 24/11/2026 | 2 Days |

**NIT4001 – IT Capstone Project 2 Gant chart**

<img src="../assets/media/image11.png"
style="width:6.5in;height:3.25in" />

### 10.4 Contingency Planning


**Logic Buffer:** There is a buffer of one day between Capstone 1
(12/03) and Implementation (13/03) to synchronize the receipt of final
proposal feedback.

**Service Fallback:** The system will fall back to GPT-3.5 Turbo when
the latency of GPT-4 is beyond the performance requirement of 15-45
seconds.
This plan was written against OpenAI.
The build moved to Gemini behind a provider port, so the fallback is now a configuration change rather than a second integration, and no second model is configured today.

**Database Redundancy:** The team will deploy a PostgreSQL instance when
there is a downtime of Supabase (Task 2.1.2) to continue the development
of the Rating System Logic.

### 10.5 Task dependencies

The three charts above carry owners and dates but no arrows.
This table is the dependency list the charts cannot show, so a reader can see what actually blocks what.

| Task | Depends on | Why |
|---|---|---|
| Business profile form | Auth screens | A profile belongs to a signed-in user |
| Generation route | Profile form, database schema | It reads the profile and writes a row |
| Evaluation module | Generator port | It scores the text the port returns |
| Rating persistence | Evaluation module | A rating recomputes the stored report, which only exists once the module does |
| Dashboard draft list | Generation route | There is nothing to list until drafts exist |
| Draft detail page | Dashboard list, evaluation module | It is opened from a row and shows the stored report |
| Prompt templates as data | Evaluation module | The route lints a stored body against the structures the scorer checks |
| Evaluation experiment | Draft detail page, real drafts, external raters | It needs drafts to rate and people to rate them |
| Load test | Deployment | There is no URL to test until the app is deployed |
| Deployment | Owner credentials, a domain | Neither is in the repository |

The critical path runs through deployment, not through features.
Everything above it can be built and checked locally; the deployment gate is the one that needs somebody else to act.
