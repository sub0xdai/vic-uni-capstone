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


The system will use three tables.

**User Table**

This table is responsible for the authentication and security of the
SaaS Platform, guaranteeing that each business owner has a unique and
secure account.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| Id | INT (primary key) | Unique identifier for the account holder |
| email | VARCHAR(255) | The user’s unique login address |
| password | VARCHAR(255) | Securely hashed user credentials |
| Created_at | DATETIME | Timestamp of when the account was first registered |

**Business_Profile Table**

This table contains the brand identity and context that will be used to
inform the prompts that the AI will receive, which will be used to
create the marketing content that is specific to each business.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| id | INT (Primary key) | Unique identifier for the business profile |
| User_id | INT (Foreign key) | Associate the profile with the correct registered user |
| Business_name | VARCHAR(255) | The official name of the business |
| industry | VARCHAR(100) | The sector the business operates within (e.g. hospitality, Retail). |
| description | TEXT | A summary of the business’s core products/services |
| Target_audience | TEXT | Information on who the content is being written for |
| Brand_tone | VARCHAR(50) | Voice to be used (e.g. Professional, Casual). |

**Generated_Content Table**

This table is the core feedback loop that will be used to create
higher-quality content in the future, using the outputs from the AI, the
automated quality metrics and the star ratings provided by the users.

|  |  |  |
|----|----|----|
| Field | Type | Description |
| Id | INT (Primary key) | A unique identifier for the drafted content |
| User_id | INT (Foreign key) | Links the content to the user’s dashboard. |
| Content_type | VARCHAR(100) | Identifies the format (e.g instagram Caption). |
| Content_text | TEXT | The raw marketing text generated by the AI |
| Quality_Score | DECIMAL(3,2) | The 0.0 - 1.0 efficiency score was calculated from the automated evaluation. |
| Analysis_JSON | TEXT/JSON | Detailed data on the breakdown of the readability and keywords. |
| Rating | INT | The 1-5 star manual rating assigned by the user. |
| Created_at | DATETIME | Timestamp of when the content was generated. |

**Example:**

|     |         |                   |            |
|-----|---------|-------------------|------------|
| Id  | User_id | Content_type      | Created_at |
| 10  | 1       | Instagram Caption | 2026-04-02 |

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
