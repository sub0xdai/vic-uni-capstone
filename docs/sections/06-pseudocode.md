## 6 Pseudocode


### 6.0 User Auth


The authentication flow is the gateway to every other operation in the
system. Before a user can generate content, manage their profile, or
access their dashboard, the system must verify their identity and
establish a secure session. This algorithm handles both new
registrations and returning logins through a single entry point,
delegating credential storage and session management to Supabase Auth.
The design separates registration from login to enforce profile
completeness for new accounts — a user who registers but never completes
their business profile cannot generate meaningful content, so the system
routes them directly to onboarding.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: left;">FUNCTION authenticateUser(email, password,
isNewRegistration)<br />
<br />
<em>// --- Phase 1: Input Validation ---</em><br />
<em>// Reject malformed inputs before they reach the
authentication</em><br />
<em>// provider. This prevents unnecessary API calls and
ensures</em><br />
<em>// consistent error messaging at the boundary.</em><br />
<br />
IF email is empty OR NOT MATCHES email format THEN<br />
RETURN error("Please enter a valid email address")<br />
ENDIF<br />
<br />
IF password is empty OR LENGTH(password) &lt; 8 THEN<br />
RETURN error("Password must be at least 8 characters")<br />
ENDIF<br />
<br />
<br />
<em>// --- Phase 2: Registration or Login ---</em><br />
<em>// Supabase Auth handles password hashing (bcrypt),
duplicate</em><br />
<em>// detection, and token issuance. The system does not
store</em><br />
<em>// raw passwords at any point.</em><br />
<br />
IF isNewRegistration THEN<br />
<br />
TRY<br />
authResponse = SUPABASE_AUTH.signUp(<br />
email: email,<br />
password: password<br />
)<br />
CATCH duplicateEmailError<br />
RETURN error("An account with this email already exists")<br />
CATCH error<br />
RETURN error("Registration failed. Please try again.")<br />
ENDTRY<br />
<br />
ELSE<br />
<br />
TRY<br />
authResponse = SUPABASE_AUTH.signInWithPassword(<br />
email: email,<br />
password: password<br />
)<br />
CATCH invalidCredentialsError<br />
RETURN error("Incorrect email or password")<br />
CATCH error<br />
RETURN error("Login failed. Please try again.")<br />
ENDTRY<br />
<br />
ENDIF<br />
<br />
<br />
<em>// --- Phase 3: Session Establishment ---</em><br />
<em>// On successful authentication, Supabase returns an access
token</em><br />
<em>// and refresh token. The access token is stored client-side
for</em><br />
<em>// subsequent API requests. The session is validated
server-side</em><br />
<em>// on every protected route.</em><br />
<br />
SET session = {<br />
userId: authResponse.user.id,<br />
accessToken: authResponse.session.accessToken,<br />
refreshToken: authResponse.session.refreshToken,<br />
expiresAt: authResponse.session.expiresAt<br />
}<br />
<br />
STORE session IN secure HTTP-only cookie<br />
<br />
<br />
<em>// --- Phase 4: Post-Authentication Routing ---</em><br />
<em>// New users must complete their business profile before
they</em><br />
<em>// can generate content. Returning users are sent to the
dashboard.</em><br />
<br />
IF isNewRegistration THEN<br />
REDIRECT to "/onboarding/business-profile"<br />
ELSE<br />
profile = GET_BUSINESS_PROFILE(session.userId)<br />
<br />
IF profile is empty THEN<br />
REDIRECT to "/onboarding/business-profile"<br />
ELSE<br />
REDIRECT to "/dashboard"<br />
ENDIF<br />
ENDIF<br />
<br />
RETURN {<br />
success: true,<br />
session: session<br />
}<br />
<br />
ENDFUNCTION</td>
</tr>
</tbody>
</table>

### 6.1 Content Generation Algorithm


The content generation pipeline is the most algorithmically complex
operation in the system. It is not a simple passthrough to the AI API.

Between the user's request and the final output, the system must
assemble a context-aware prompt from stored business data, call the
external model with fault tolerance, and then evaluate the quality of
the returned content against measurable criteria before presenting it to
the user.

This evaluation step is what distinguishes the platform from a generic
ChatGPT wrapper and directly addresses the core engineering challenge:
how do we know the AI output is actually good?

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: left;">FUNCTION generateMarketingContent(userId,
contentType, topic, keywords)<br />
<br />
<em>// --- Phase 1: Authentication and Rate Limiting ---</em><br />
<em>// Verify the user has an active session and has not
exceeded</em><br />
<em>// their plan's monthly generation limit.</em><br />
<br />
session = GET_SESSION(userId)<br />
IF session is invalid THEN<br />
RETURN error("User is not authenticated")<br />
ENDIF<br />
<br />
usageCount = GET_MONTHLY_USAGE(userId)<br />
planLimit = GET_PLAN_LIMIT(session.planTier)<br />
<br />
IF usageCount &gt;= planLimit THEN<br />
RETURN error("Monthly generation limit reached")<br />
ENDIF<br />
<br />
<em>// --- Phase 2: Business Profile Retrieval ---</em><br />
<em>// Fetch the user's stored brand profile. This is the
foundation</em><br />
<em>// of prompt personalisation -- without it, the AI has no
context</em><br />
<em>// about the business and cannot produce brand-aligned
content.</em><br />
profile = GET_BUSINESS_PROFILE(userId)<br />
IF profile is empty OR profile.brandTone is empty THEN<br />
RETURN error("Business profile is incomplete")<br />
ENDIF<br />
products = GET_PRODUCTS(profile.id)<br />
<br />
<em>// --- Phase 3: Structured Prompt Assembly ---</em><br />
<em>// The prompt is not a raw user query. It is a structured
instruction</em><br />
<em>// that combines the content type template, brand context, and
user</em><br />
<em>// input into a single engineered prompt. This is where the
system</em><br />
<em>// adds value beyond what a user could do manually with
ChatGPT.</em><br />
<br />
SET systemInstruction = BUILD_SYSTEM_PROMPT(<br />
role: "marketing content specialist",<br />
tone: profile.brandTone,<br />
audience: profile.targetAudience,<br />
industry: profile.industry<br />
)<br />
<br />
SET userPrompt = BUILD_USER_PROMPT(<br />
contentType: contentType,<br />
topic: topic,<br />
keywords: keywords,<br />
brandValues: profile.brandValues,<br />
products: products<br />
)<br />
<em>// Apply content-type-specific constraints</em><br />
IF contentType == "Social Media Caption" THEN<br />
APPEND to userPrompt: "Keep under 280 characters. Include a call to
action."<br />
ELSE IF contentType == "Blog Outline" THEN<br />
APPEND to userPrompt: "Structure with H2 headings, intro, 3-5 sections,
conclusion."<br />
ELSE IF contentType == "Email Newsletter" THEN<br />
APPEND to userPrompt: "Include subject line, preview text, body, and CTA
button text."<br />
ENDIF<br />
<br />
<em>// --- Phase 4: AI API Call with Fault Tolerance ---</em><br />
<em>// The external API is a point of failure. The system
implements</em><br />
<em>// retry logic and model fallback to maintain
availability.</em><br />
<br />
SET retryCount = 0<br />
SET maxRetries = 2<br />
SET rawContent = empty<br />
WHILE retryCount &lt;= maxRetries DO<br />
TRY<br />
rawContent = CALL_GPT_API(<br />
model: "gpt-4",<br />
systemPrompt: systemInstruction,<br />
userPrompt: userPrompt,<br />
maxTokens: GET_TOKEN_LIMIT(contentType),<br />
temperature: 0.7<br />
)<br />
BREAK <em>// Success -- exit the retry loop</em><br />
<br />
CATCH timeout OR apiError<br />
retryCount = retryCount + 1<br />
<br />
IF retryCount &gt; maxRetries THEN<br />
<em>// Final fallback: attempt with lighter model</em><br />
TRY<br />
rawContent = CALL_GPT_API(<br />
model: "gpt-3.5-turbo",<br />
systemPrompt: systemInstruction,<br />
userPrompt: userPrompt<br />
)<br />
CATCH error<br />
RETURN error("Content generation unavailable. Input preserved.")<br />
ENDTRY<br />
ENDIF<br />
ENDTRY<br />
ENDWHILE<br />
<br />
<br />
<em>// --- Phase 5: Content Quality Evaluation ---</em><br />
<em>// This is the critical engineering layer. Rather than
returning</em><br />
<em>// raw AI output directly, the system scores the content
against</em><br />
<em>// measurable quality dimensions. This provides the user
with</em><br />
<em>// actionable feedback and allows the system to
auto-reject</em><br />
<em>// clearly poor outputs.</em><br />
<br />
qualityReport = EVALUATE_CONTENT(rawContent, profile, contentType)<br />
<br />
<em>// --- Phase 6: Threshold Check and Auto-Regeneration ---</em><br />
<em>// If the overall quality score falls below the acceptable
threshold,</em><br />
<em>// the system regenerates once with an adjusted prompt that
includes</em><br />
<em>// the specific deficiencies as additional instructions.</em><br />
<br />
IF qualityReport.overallScore &lt; 0.6 THEN<br />
SET adjustedPrompt = userPrompt<br />
APPEND to adjustedPrompt: "Previous attempt scored poorly. Improve on:
"<br />
<br />
IF qualityReport.toneScore &lt; 0.5 THEN<br />
APPEND: "Tone does not match '" + profile.brandTone + "'. "<br />
ENDIF<br />
IF qualityReport.keywordScore &lt; 0.5 THEN<br />
APPEND: "Missing target keywords. "<br />
ENDIF<br />
IF qualityReport.readabilityScore &lt; 0.5 THEN<br />
APPEND: "Simplify language for general audience. "<br />
ENDIF<br />
rawContent = CALL_GPT_API(model: "gpt-4", systemPrompt:
systemInstruction,<br />
userPrompt: adjustedPrompt)<br />
qualityReport = EVALUATE_CONTENT(rawContent, profile, contentType)<br />
ENDIF<br />
<br />
<em>// --- Phase 7: Storage and Response ---</em><br />
draftId = SAVE_DRAFT(<br />
userId: userId,<br />
contentType: contentType,<br />
contentText: rawContent,<br />
analysisJson: qualityReport<br />
)<br />
INCREMENT_MONTHLY_USAGE(userId)<br />
LOG_AUDIT_EVENT(userId, "GENERATE_CONTENT", draftId)<br />
<br />
RETURN {<br />
draftId: draftId,<br />
content: rawContent,<br />
quality: qualityReport<br />
}<br />
ENDFUNCTION</td>
</tr>
</tbody>
</table>

### 6.2 Content Quality Evaluation Sub-Algorithm


The evaluation function scores AI output across five measurable
dimensions. Each metric produces a normalised score between 0.0 and 1.0.
The overall score is a weighted average, allowing the system to
prioritise dimensions most relevant to each content type.

\- Readability (0.10) — sentence/word length analysis

\- Tone Alignment (0.20) — pattern matching against brand tone markers

\- Keyword Integration (0.20) — checks target terms appear in output

\- Structural Compliance (0.15) — validates format matches content type

\- User Satisfaction (0.35) — user input carries heaviest weight

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: left;"><p>FUNCTION EVALUATE_CONTENT(content,
profile, contentType)<br />
<br />
<em>// --- Metric 1: Readability (Weight: 0.20) ---</em><br />
<em>// Measures how accessible the text is for the target
audience.</em><br />
<em>// Uses average sentence length and average word length as
proxies</em><br />
<em>// for reading difficulty (derived from Flesch-Kincaid
principles).</em><br />
<br />
SET sentences = SPLIT content INTO sentences<br />
SET words = SPLIT content INTO words<br />
SET avgSentenceLength = COUNT(words) / COUNT(sentences)<br />
SET avgWordLength = SUM(character count of each word) /
COUNT(words)<br />
<br />
<em>// Target: 15-20 words per sentence, 4-6 chars per word for general
audience</em><br />
IF avgSentenceLength BETWEEN 12 AND 22 AND avgWordLength &lt; 7
THEN<br />
readabilityScore = 1.0<br />
ELSE IF avgSentenceLength &gt; 30 OR avgWordLength &gt; 8 THEN<br />
readabilityScore = 0.3<br />
ELSE<br />
readabilityScore = 0.7<br />
ENDIF<br />
<br />
<em>// --- Metric 2: Tone Alignment (Weight: 0.30) ---</em><br />
<em>// Checks whether the generated content matches the user's
chosen</em><br />
<em>// brand tone by searching for tone-indicative language
patterns.</em><br />
<br />
SET toneMarkers = GET_TONE_MARKERS(profile.brandTone)<br />
<em>// e.g., "Professional" -&gt; ["furthermore", "we recommend", "our
solution"]</em><br />
<em>// e.g., "Casual" -&gt; ["hey", "check out", "awesome", "you'll
love"]</em><br />
<em>// e.g., "Friendly" -&gt; ["we'd love to", "just for you", "happy to
help"]</em><br />
<br />
SET matchCount = 0<br />
FOR EACH marker IN toneMarkers DO<br />
IF content CONTAINS marker (case-insensitive) THEN<br />
matchCount = matchCount + 1<br />
ENDIF<br />
ENDFOR<br />
<br />
toneScore = matchCount / COUNT(toneMarkers)<br />
SET toneScore = MIN(toneScore, 1.0) <em>// Cap at 1.0</em><br />
<br />
<em>// --- Metric 3: Keyword Integration (Weight: 0.25) ---</em><br />
<em>// Verifies that the user's specified keywords and brand
terms</em><br />
<em>// appear naturally in the generated content.</em><br />
<br />
SET targetTerms = COMBINE(profile.keywords, product names from
profile)<br />
SET foundCount = 0<br />
<br />
FOR EACH term IN targetTerms DO<br />
IF content CONTAINS term (case-insensitive) THEN<br />
foundCount = foundCount + 1<br />
ENDIF<br />
ENDFOR<br />
<br />
IF COUNT(targetTerms) &gt; 0 THEN<br />
keywordScore = foundCount / COUNT(targetTerms)<br />
ELSE<br />
keywordScore = 1.0 <em>// No keywords specified, skip penalty</em><br />
ENDIF<br />
<em>// --- Metric 4: Structural Compliance (Weight: 0.25) ---</em><br />
<em>// Validates that the output meets the structural
expectations</em><br />
<em>// for the requested content type.</em><br />
<br />
IF contentType == "Social Media Caption" THEN<br />
IF LENGTH(content) &lt;= 280 AND content CONTAINS call-to-action phrase
THEN<br />
structureScore = 1.0<br />
ELSE IF LENGTH(content) &gt; 500 THEN<br />
structureScore = 0.2<br />
ELSE<br />
structureScore = 0.6<br />
ENDIF<br />
<br />
ELSE IF contentType == "Blog Outline" THEN<br />
SET headingCount = COUNT occurrences of heading markers in content<br />
IF headingCount &gt;= 3 AND content CONTAINS intro paragraph THEN<br />
structureScore = 1.0<br />
ELSE IF headingCount &gt;= 1 THEN<br />
structureScore = 0.6<br />
ELSE<br />
structureScore = 0.3<br />
ENDIF<br />
<br />
ELSE IF contentType == "Email Newsletter" THEN<br />
hasSubjectLine = content CONTAINS "Subject:" OR first line is
short<br />
hasCTA = content CONTAINS action phrase ("Shop now", "Learn more",
etc.)<br />
IF hasSubjectLine AND hasCTA THEN<br />
structureScore = 1.0<br />
ELSE<br />
structureScore = 0.5<br />
ENDIF<br />
ENDIF</p>
<p><em>// --- Metric 5: User Satisfaction (Weight: 0.35) ---</em><br />
<em>// The heaviest-weighted metric. Historical user ratings are the
most</em><br />
<em>// direct signal of content quality -- they capture subjective
value</em><br />
<em>// that automated metrics cannot measure (relevance, usefulness,
voice).</em><br />
<em>// This creates a feedback loop: past ratings actively shape how
future</em><br />
<em>// content is scored, so the system learns from real user
judgement.</em><br />
<br />
SET pastRatings = GET_USER_RATINGS(<br />
userId: userId,<br />
contentType: contentType,<br />
brandTone: profile.brandTone<br />
)<br />
<br />
IF COUNT(pastRatings) &gt;= 3 THEN<br />
<em>// Sufficient history -- use the actual average, normalised
from</em><br />
<em>// the 1-5 star scale to 0.0-1.0</em><br />
SET avgRating = SUM(pastRatings) / COUNT(pastRatings)<br />
SET userSatisfactionScore = avgRating / 5.0<br />
ELSE<br />
<em>// Insufficient data -- fall back to a neutral score so new
users</em><br />
<em>// are not penalised and this metric does not dominate on sparse
data</em><br />
SET userSatisfactionScore = 0.7<br />
ENDIF<br />
<br />
<br />
<em>// --- Calculate Weighted Overall Score ---</em><br />
<br />
SET overallScore = (readabilityScore * 0.10)<br />
+ (toneScore * 0.20)<br />
+ (keywordScore * 0.20)<br />
+ (structureScore * 0.15)<br />
+ (userSatisfactionScore * 0.35)<br />
<br />
RETURN {<br />
overallScore: overallScore,<br />
readabilityScore: readabilityScore,<br />
toneScore: toneScore,<br />
keywordScore: keywordScore,<br />
structureScore: structureScore,<br />
userSatisfactionScore: userSatisfactionScore<br />
}</p>
<p>ENDFUNCTION</p></td>
</tr>
</tbody>
</table>

### 6.3 Content Review and Publish Algorithm


Once the content generation pipeline returns a draft, the user enters
the review phase. This is where the system transitions from automated
processing to human-in-the-loop decision-making. The user can edit the
AI-generated text in a rich-text editor, rate the content quality, and
then either copy it for use on external platforms or discard it. This
algorithm governs the post-generation workflow — from rendering the
draft in the editor through to the final export action.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: left;">FUNCTION reviewAndPublishContent(userId,
draftId)<br />
<br />
<em>// --- Phase 1: Draft Retrieval and Rendering ---</em><br />
<em>// Load the saved draft and its quality report from the
database,</em><br />
<em>// then present the content in an editable rich-text editor
so</em><br />
<em>// the user can review and refine before publishing.</em><br />
<br />
session = GET_SESSION(userId)<br />
IF session is invalid THEN<br />
RETURN error("User is not authenticated")<br />
ENDIF<br />
<br />
draft = GET_DRAFT(draftId, userId)<br />
<br />
IF draft is empty THEN<br />
RETURN error("Draft not found")<br />
ENDIF<br />
<br />
IF draft.userId != userId THEN<br />
RETURN error("Access denied")<br />
ENDIF<br />
<br />
RENDER rich-text editor WITH {<br />
content: draft.contentText,<br />
qualityReport: draft.analysisJson,<br />
contentType: draft.contentType<br />
}<br />
<br />
<br />
<em>// --- Phase 2: User Editing ---</em><br />
<em>// The user may modify the AI-generated content freely. All
edits</em><br />
<em>// are made client-side in the rich-text editor. The system
tracks</em><br />
<em>// whether the content has been modified so it can update
the</em><br />
<em>// stored draft when the user saves.</em><br />
<br />
AWAIT user interaction<br />
<br />
SET editedContent = GET_EDITOR_CONTENT()<br />
SET hasChanges = (editedContent != draft.contentText)<br />
<br />
IF hasChanges THEN<br />
TRY<br />
UPDATE_DRAFT(<br />
draftId: draftId,<br />
contentText: editedContent,<br />
editedAt: CURRENT_TIMESTAMP()<br />
)<br />
CATCH error<br />
DISPLAY notification("Failed to save changes. Please try again.")<br />
RETURN<br />
ENDTRY<br />
ENDIF<br />
<br />
<br />
<em>// --- Phase 3: Content Rating ---</em><br />
<em>// The user rates the content on a 1-5 star scale. This
rating</em><br />
<em>// feeds back into the quality evaluation algorithm (Metric
5:</em><br />
<em>// User Satisfaction) for future generations, closing the</em><br />
<em>// feedback loop between human judgement and automated
scoring.</em><br />
<br />
SET userRating = AWAIT user star rating input <em>// 1-5
scale</em><br />
<br />
IF userRating is provided THEN<br />
SAVE_RATING(<br />
draftId: draftId,<br />
userId: userId,<br />
rating: userRating<br />
)<br />
ENDIF<br />
<br />
<br />
<em>// --- Phase 4: Publish / Export ---</em><br />
<em>// The system does not publish directly to social media
platforms.</em><br />
<em>// Instead, it provides copy-to-clipboard and plain-text
export</em><br />
<em>// so the user can paste into their chosen publishing
channel.</em><br />
<em>// This keeps the system scope focused and avoids
third-party</em><br />
<em>// API integration complexity.</em><br />
<br />
SET publishAction = AWAIT user action <em>// "copy" or
"discard"</em><br />
<br />
IF publishAction == "copy" THEN<br />
COPY editedContent TO system clipboard<br />
DISPLAY notification("Content copied to clipboard")<br />
<br />
UPDATE_DRAFT(<br />
draftId: draftId,<br />
status: "published"<br />
)<br />
<br />
LOG_AUDIT_EVENT(userId, "PUBLISH_CONTENT", draftId)<br />
<br />
ELSE IF publishAction == "discard" THEN<br />
UPDATE_DRAFT(<br />
draftId: draftId,<br />
status: "discarded"<br />
)<br />
<br />
LOG_AUDIT_EVENT(userId, "DISCARD_CONTENT", draftId)<br />
ENDIF<br />
<br />
REDIRECT to "/dashboard"<br />
<br />
ENDFUNCTION</td>
</tr>
</tbody>
</table>

The review flow ensures the user always has final control over what gets
published. The AI generates and the system evaluates, but the human
decides. This separation is deliberate — it positions the platform as an
assistant rather than a replacement, which aligns with the target
audience of small business owners who want to maintain their brand voice
while saving time on content creation.
