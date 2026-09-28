# Photo Catcher — Autonomous Product Build Handoff

## 0. Mission

You are responsible for taking Photo Catcher from its current idea/product-definition stage to a real, testable, deployable mobile application.

Your responsibility is not limited to writing code.

You should act as the combined:

- Product Manager
- UX Designer
- Mobile Engineer
- Backend Engineer
- QA Engineer
- DevOps / Release Engineer

for the project.

The intended workflow is:

Product Definition → Research → UX → Architecture → Implementation → Testing → Backend → Production Configuration → Release Preparation → Deployment

Do not stop after producing plans, specifications, mockups, or partial implementations.

The objective is to produce a working product.

## 1. Product Vision

### Working Name

Photo Catcher

The name is provisional and may change later.

### Core Idea

Photo Catcher is not another photo gallery.

It is a mobile application for collecting memories through symbolic photographs.

The central concept is:

> **One photo opens the whole memory.**

A photograph of food, a ticket, a building, a landscape, an object, or another seemingly ordinary thing can become the symbolic entrance to an entire memory.

That symbolic photograph becomes a **Memory Object**.

Inside it, the user may store:

- related photos
- videos
- notes
- date
- location

The user collects these Memory Objects inside larger containers called **Memory Jars**.

The conceptual structure is:

Memory Jar → Symbolic Photo → Memory Album

The core loop is:

**Capture → Collect → Remember**

The central product principle is:

> **We're not collecting photos. We're collecting memories.**

## 2. Example Experience

Imagine a user traveling to Japan.

They create:

**Japan 2026**

Inside the Jar are symbolic memories such as:

- ramen
- Tokyo Tower
- train ticket
- Shinkansen
- Mt. Fuji

The ramen photograph is not simply another image in a gallery.

Opening it may reveal:

**Ramen Night**

Cover:

A photograph of the ramen.

Inside:

- ramen photo
- restaurant photo
- photo with a friend
- short video
- location
- date
- short note

The cover photograph acts as the visual trigger for the entire experience.

## 3. Product Philosophy

Traditional photo applications primarily organize:

Photo → Photo → Photo → Photo

Photo Catcher should organize:

Memory → Memory → Memory

It is not intended to replace Apple Photos, Google Photos, or the device gallery.

Instead, it should operate as a:

**Memory Curation Layer**

on top of the user's existing photo library.

The user intentionally selects moments worth remembering.

## 4. Symbolic Photo

The most important concept in the product is the Symbolic Photo.

The symbolic photograph does not need to be:

- the highest-quality image
- the most beautiful image
- a portrait
- the technically best photograph

It should be:

**the image that makes the user remember the moment.**

Examples:

- Travel → airplane ticket
- Date → food they ate
- College → campus building
- Family → dinner table
- Friendship → strange/funny photograph
- Cooking → finished meal

The symbolic photograph functions like a visual memory icon.

## 5. Memory Jar

Memory Objects are collected inside Memory Jars.

Examples:

- Japan 2026
- Hawaii
- College
- Cooking
- Us
- Family
- Travels

A Jar should feel different from a normal filesystem folder.

The emotional concept is:

**a place where memories accumulate over time.**

After years of use, opening Photo Catcher should feel like looking at a collection of the user's life rather than browsing a filesystem.

## 6. Core Data Model

### MemoryJar

Minimum conceptual fields:

- id
- name
- createdAt
- updatedAt

Possible future fields:

- cover
- theme
- ordering
- collaborators

Do not implement future fields unless they are needed.

### Memory

A Memory is the primary object in the application.

Minimum fields:

- id
- jarId
- coverPhoto
- createdAt

Optional MVP fields:

- title
- photos
- videos
- note
- memoryDate
- location

Future possibilities:

- people
- tags
- voice
- music
- AI metadata

Do not implement speculative fields simply because they may eventually be useful.

## 7. Critical UX Requirement

Creating a Memory must be extremely fast.

The application must support the minimum flow:

**Photo → Choose Jar → Done**

A user should NOT be required to enter:

- title
- description
- location
- tags
- people
- date
- metadata

before saving a Memory.

Additional information can be added later.

Guiding principle:

> **Capture first. Organize later.**

Friction during capture is one of the largest product risks.

## 8. MVP Question

The MVP exists to test one primary hypothesis:

> Does using one symbolic photograph as the entrance to an entire memory provide enough value to feel meaningfully different from simply creating albums in a normal Photos application?

Every MVP feature must contribute to testing this hypothesis.

Do not add features merely because they are technically interesting.

## 9. MVP Scope

The first usable product should support:

### Memory Jars

- Create Jar
- Name Jar
- View Jars
- Open Jar

### Memories

- Select or capture symbolic photo
- Choose destination Jar
- Create Memory
- View Memories within Jar
- Open Memory

### Memory Content

- Add related photos
- Add related videos
- Add short note
- View all associated content

### Memory Detail

The user can return later and experience the Memory as one coherent object.

## 10. Explicit Non-Goals for MVP

Do NOT turn the MVP into:

### Another Gallery

The experience cannot simply become a standard photo grid.

### Cloud Backup Product

Photo backup is not the core value proposition.

### Social Network

Do not introduce:

- followers
- likes
- public profiles
- public feed

### Complex Journal

Do not require long writing sessions.

### AI Photo Application

AI generation is not the product.

### Feature Collection

Do not add features simply because they seem useful.

Protect the core experience.

## 11. AI Policy

AI is not required for the initial product.

Photo Catcher must provide value without AI.

Possible future AI capabilities include:

### Memory Grouping

Detect photographs likely belonging to the same event.

Example:

"These photos were taken around the same place and time. Add them to this Memory?"

### Cover Recommendation

Recommend symbolic cover candidates.

### Memory Title

Suggest titles such as:

"Rainy Night in Tokyo"

### Memory Summary

Generate a short description based on photos, videos, metadata, and notes.

### Rediscovery

Surface memories through experiences such as:

"Remember this?"

or:

"2 years ago today"

AI must assist memory organization.

**AI must never become the author of the user's memories.**

## 12. Visual Direction

Do not assume that Memory Jars must literally look like glass jars.

Explore metaphors such as:

- Jar
- Box
- Shelf
- Capsule
- Scrapbook
- Memory Room
- Polaroid collection
- Photo cards

The important emotional property is:

**I am collecting memories.**

A possible interaction is that creating a Memory visually causes the photo/object to fall or settle into the collection.

Animation should reinforce the concept without slowing down the capture workflow.

## 13. Initial Information Architecture

Keep the application structurally simple.

Preferred starting structure:

- **01 — Home** — Displays Memory Jars.
- **02 — Jar** — Displays the Memories belonging to that Jar.
- **03 — Capture / Add Memory** — Take or select symbolic photograph. Choose Jar. Save immediately.
- **04 — Memory** — Add optional related content.
- **05 — Memory Detail** — Rediscover and view the complete memory.

Do not create unnecessary screens.

## 14. Privacy Principles

Photos and videos are highly personal.

Privacy should influence architecture from the beginning.

Investigate and make explicit decisions regarding:

- local vs cloud storage
- original photo handling
- photo-library permissions
- backups
- deletion
- authentication
- shared content permissions
- encryption requirements

Prefer the minimum device permissions necessary.

Do not request access to the user's entire photo library unless the feature genuinely requires it.

## 15. Product Boundaries

Photo Catcher is independent from other projects.

### Shared Board

Shared Board is about:

**Presence / Communication**

It lets close people leave things for one another to see now.

Photo Catcher is about:

**Memory / Collection**

It preserves moments for the user's future self.

### AI Sketch Game

AI Sketch Game follows:

Draw → Judge → Transform → Play Again

Photo Catcher follows:

Capture → Collect → Remember

They must remain separate products and repositories.

## 16. AIverse / ADOS Relationship

Photo Catcher should be developed as an independent product and repository.

AIverse may eventually orchestrate its development.

Conceptually:

AIverse
→ Photo Catcher Project
→ Specification
→ ADOS Run
→ AI Implementation
→ Independent Review
→ Validation
→ Pull Request
→ Merge

AIverse is the development orchestration environment.

Photo Catcher is the actual consumer product.

Do not introduce runtime dependencies between Photo Catcher and AIverse.

## 17. Your First Responsibility: Challenge the Product

Do NOT immediately begin coding.

First critically evaluate the product concept.

The most important question is:

> **Why would someone use Photo Catcher instead of simply creating an album in Apple Photos or Google Photos?**

Analyze:

- actual user behavior
- capture friction
- organizational friction
- emotional value
- rediscovery
- long-term retention
- existing alternatives
- competing products
- possible reasons the concept may fail

Do not protect the idea from criticism.

If part of the concept is weak, identify it and improve it while preserving the fundamental vision.

However, do not replace Photo Catcher with an unrelated product.

## 18. Product Discovery Phase

Before implementation, complete:

1. Product critique
2. User scenarios
3. Existing Photos/Gallery comparison
4. Competitor research
5. Product differentiation
6. Core hypothesis
7. MVP success criteria
8. Memory Object definition
9. Memory Jar UX
10. Capture workflow

Record important conclusions in repository documentation.

Recommended documents may include:

- `PRODUCT_BRIEF.md`
- `PRODUCT_ASSESSMENT.md`
- `MVP.md`
- `UX_FLOW.md`
- `ARCHITECTURE.md`

Use only documents that provide real value.

Do not create documentation for documentation's sake.

## 19. Competitive Research

Research current products before implementation.

At minimum investigate relevant capabilities from:

- Apple Photos
- Google Photos
- journaling applications
- memory applications
- scrapbook applications
- photo diary applications

Determine whether another product already provides essentially the same interaction.

Document concrete differentiation rather than relying on marketing language.

## 20. User Scenarios

Create realistic scenarios before implementation.

At minimum test the concept against situations such as:

- **Travel** — A user wants to preserve a ramen dinner from a Japan trip.
- **Relationship** — A user wants to preserve an ordinary but emotionally meaningful date.
- **College** — A student wants to preserve memorable moments across several years.
- **Family** — A user wants to preserve small family moments without maintaining a traditional journal.
- **Cooking** — A user wants to remember meaningful dishes and the situations around them.

Use these scenarios to identify unnecessary steps.

## 21. UX Requirement

Optimize aggressively for low friction.

Target:

**New Memory in seconds, not minutes.**

The primary capture path should ideally require:

1. Choose/take photo
2. Choose Jar
3. Save

Everything else should be optional or deferred.

Measure interaction count when designing the flow.

## 22. Technical Decision Authority

The following are currently undecided:

- React Native vs Flutter vs Native
- backend
- database
- authentication
- cloud storage
- local-first architecture
- synchronization
- AI provider
- analytics
- deployment infrastructure

You are authorized to research and select appropriate technologies.

Prioritize:

1. simplicity
2. maintainability
3. mobile reliability
4. privacy
5. development speed
6. reasonable operating cost
7. future extensibility

Do not select infrastructure simply because it is fashionable.

Record major technical decisions and their reasoning.

## 23. Default Implementation Philosophy

Prefer the smallest architecture capable of validating the product.

Avoid premature:

- microservices
- complex state infrastructure
- elaborate backend abstractions
- AI pipelines
- recommendation systems
- social architecture
- scaling infrastructure

Build for real use, but do not build hypothetical scale before product validation.

## 24. Development Sequence

After product discovery, proceed autonomously through:

### Phase 1 — Product Validation

Complete the product analysis and define the MVP.

Exit condition: The distinction between Photo Catcher and a normal Photos album is explicit and testable.

### Phase 2 — UX

Create the complete MVP wireflow.

Validate: Capture → Collect → Remember

Exit condition: Every core user action has a defined path.

### Phase 3 — Architecture

Choose:

- mobile framework
- persistence model
- media handling
- backend if needed
- authentication if needed
- storage strategy
- analytics strategy

Exit condition: The MVP can be implemented without unresolved architectural blockers.

### Phase 4 — Repository

Create or initialize the repository.

Establish:

- project structure
- README
- environment configuration
- linting
- formatting
- tests
- CI where appropriate

### Phase 5 — Functional MVP

Implement the smallest complete loop:

Create Jar → Create Memory → Open Memory

This loop must work before secondary features are expanded.

### Phase 6 — Media

Implement:

- related photos
- videos
- notes

Verify real-device behavior.

### Phase 7 — Persistence

Ensure Memories survive:

- app restart
- device restart where applicable
- navigation
- application updates where applicable

### Phase 8 — UX Polish

Improve:

- loading states
- empty states
- errors
- permission handling
- deletion
- editing
- transitions
- capture speed

Do not over-polish before the core loop works.

### Phase 9 — QA

Test:

- first launch
- permissions
- Jar creation
- Memory creation
- photo selection
- camera capture
- video handling
- notes
- deletion
- failed media access
- app restart
- large images
- multiple Memories
- multiple Jars

Test on real devices when possible.

### Phase 10 — Production Preparation

Prepare:

- production environment
- secrets
- privacy policy
- account deletion flow if accounts exist
- permissions declarations
- app icons
- splash assets
- store metadata
- release builds
- crash/error handling

### Phase 11 — Deployment

Take the application as far through actual deployment as available credentials and platform restrictions allow.

This includes, where appropriate:

- backend deployment
- database migrations
- storage configuration
- production environment variables
- CI/CD
- Android production build
- iOS production build
- store submission preparation
- public policy pages

Do not describe deployment hypothetically if you can actually perform it.

## 25. Autonomous Execution Rules

The default behavior is:

**Proceed without asking for permission for routine reversible decisions.**

Do not repeatedly ask:

- "Should I continue?"
- "Would you like me to implement this?"
- "Should I move to the next phase?"
- "Do you want me to run the tests?"

If the next action is clearly required to complete the project, perform it.

You may:

- create files
- modify code
- refactor
- install normal dependencies
- write tests
- run tests
- create migrations
- configure development infrastructure
- create documentation
- fix bugs
- make reasonable technical decisions

without requesting confirmation each time.

## 26. When You MUST Ask

Pause when an action requires information or authorization that cannot safely be inferred.

Examples:

- credentials
- payment
- paid service activation
- irreversible deletion
- production data destruction
- legal acceptance
- developer-account enrollment
- store agreements
- sensitive account configuration
- external action with meaningful cost
- product decision that fundamentally changes the original concept

When blocked, ask for the smallest specific action needed.

Bad:

"Please configure the backend."

Good:

"I've completed the application and backend configuration. Deployment is blocked because the production project requires authentication. Please log in to the CLI, then tell me when authentication succeeds."

Continue autonomously immediately after the blocker is resolved.

## 27. Decision Rule

When multiple reasonable options exist:

1. identify the options
2. compare meaningful tradeoffs
3. choose the best default
4. record the decision
5. continue

Do not transfer every technical decision to the owner.

Escalate only decisions with significant product, financial, privacy, or irreversible consequences.

## 28. Testing Rule

A feature is not complete because code exists.

A feature is complete when its intended behavior has been validated.

Use appropriate combinations of:

- unit tests
- integration tests
- static analysis
- type checking
- linting
- build validation
- device testing
- manual end-to-end verification

Do not hide failing tests.

Do not remove tests merely to obtain a passing build.

Fix the underlying issue unless the test itself is demonstrably invalid.

## 29. Real Device Validation

Because Photo Catcher depends heavily on:

- camera
- photo library
- videos
- storage
- permissions
- mobile lifecycle behavior

simulator-only validation is insufficient.

When the project reaches appropriate milestones, provide exact instructions for any owner-side device action that cannot be automated.

Keep these requests minimal and specific.

Example:

1. Install/open this build.
2. Create a Jar called "Hawaii."
3. Select one existing photo.
4. Close the app completely.
5. Reopen it.
6. Tell me whether the Memory remains visible.

Use the result to continue debugging.

## 30. Privacy Rule

Never upload personal media to external services unnecessarily.

If cloud media storage is introduced:

- document what is uploaded
- document where it is stored
- document deletion behavior
- use appropriate access controls
- avoid public media URLs unless explicitly required

Prefer privacy-preserving architecture when tradeoffs are otherwise similar.

## 31. Cost Rule

Prefer free or inexpensive infrastructure during MVP validation.

Before introducing infrastructure that can create meaningful recurring cost:

- explain the cost model
- explain why it is necessary
- consider cheaper alternatives

Do not activate paid infrastructure without owner approval.

## 32. Security Rule

Never commit:

- API keys
- service-role keys
- passwords
- signing secrets
- private credentials

Use environment variables and platform secret management.

Ensure `.gitignore` and environment handling are correct before pushing.

## 33. Git / Repository Discipline

Use understandable commits tied to meaningful milestones.

Avoid one enormous final commit if the work naturally consists of multiple validated stages.

Before important commits:

- run relevant tests
- inspect changes
- verify secrets are not included

Keep the repository in a state another engineer can understand.

## 34. Definition of MVP Done

The MVP is not done merely when screens exist.

It is done when a real user can:

1. install/open Photo Catcher
2. create a Memory Jar
3. choose or take a symbolic photo
4. save it as a Memory
5. immediately return to normal app usage
6. later reopen Photo Catcher
7. find the Jar
8. recognize the symbolic photo
9. open the Memory
10. view related photos/videos/notes
11. add or modify optional content
12. return later and still find the Memory intact

At that point the core hypothesis can actually be tested.

## 35. Product Success Signal

The most important early signal is not:

- number of photos uploaded
- time spent in app
- AI usage
- number of features used

The important behavioral question is:

> **Do users intentionally create Memory Objects and later return to them?**

Secondary useful signals may include:

- Memories created per active user
- percentage of users creating a second Memory
- percentage creating a second Jar
- time required to create a Memory
- percentage of Memories revisited
- Memories revisited after 7/30 days

Do not optimize engagement for its own sake.

## 36. Future Features

Do not implement these until the core experience is validated:

- Shared Memory Jars
- Couple Jar
- Family Jar
- Map View
- Timeline
- People
- Annual Memory Jar
- Anniversary Memories
- Travel Recap
- AI Memory Recap
- Video montage
- Scrapbook export
- physical photo books
- printing

Preserve architectural flexibility where inexpensive, but do not build these now.

## 37. Working Product Statement

**Photo Catcher**

*One photo opens the whole memory.*

Photo Catcher lets users choose one symbolic photograph—a meal, ticket, building, place, object, or ordinary moment—as the entrance to a complete memory containing related photos, videos, and notes.

Those memories are collected into Memory Jars, gradually turning the application into a curated collection of the user's life.

Core loop: **Capture → Collect → Remember**

Core principle: **We're not collecting photos. We're collecting memories.**

## 38. Final Instruction

Start with product analysis, not implementation.

Challenge the idea.

Research alternatives.

Determine why Photo Catcher deserves to exist alongside Apple Photos and Google Photos.

Then define the smallest product capable of testing that difference.

Once the MVP direction is sufficiently supported, continue through UX, architecture, implementation, testing, production preparation, and deployment without waiting for routine approval.

At every stage ask:

> **Does this make Capture → Collect → Remember better?**

If not, it probably does not belong in the MVP.

The goal is not to produce a large codebase.

The goal is to produce the smallest real product capable of proving—or disproving—the Photo Catcher idea.

Begin now with Phase 1: Product Validation.
