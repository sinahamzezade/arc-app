
# Arlo MVP — Full Technical, Product, Feature & Business Roadmap

**Version:** 1.0  
**Product:** Arlo — AI Career Coach  
**MVP Focus:** “Office worker → Data Analyst”  
**Platform:** iOS first  
**Document purpose:** Single source of truth for founders, product designers, iOS developers, backend developers, AI engineers, and future investors.

---

## 1. Executive Summary

Arlo is not a course app. Arlo is an AI personal coach that helps working adults complete a career transformation by combining:

1. Personalized roadmap generation
2. AI coaching
3. Weekly accountability
4. Scenario-based assessments
5. Gamified motivation
6. Progress tracking
7. A future verified skill profile

The MVP should prove one thing:

> Can Arlo help users keep learning for 8 weeks better than normal online courses?

The first MVP should avoid trying to become a full education marketplace, job platform, social network, or bootcamp. It should prove the core loop:

**Goal → Roadmap → Weekly Plan → Lesson → Practice → Reward → Progress → Replan**

---

## 2. Product Positioning

### One-line Pitch

Arlo turns a career goal into a living weekly plan and coaches you until you finish.

### Target Persona

**Primary persona:**  
Working professional, age 25–45, wants to become a data analyst but has limited time.

### User Situation

- Has a full-time job
- Can study 5–10 hours per week
- Has watched YouTube videos but lacks structure
- Has started courses before and quit
- Needs accountability more than content
- Wants career improvement, not just learning for fun

### Core Promise

> “Tell Arlo your goal and your available time. Arlo builds your roadmap, teaches you, keeps you accountable, adapts when life happens, and shows your progress toward job-readiness.”

---

## 3. MVP Goal

The MVP should validate:

1. Users trust AI to create a personalized career roadmap.
2. Users come back weekly because Arlo gives them clear next steps.
3. Gamification increases completion.
4. AI coaching reduces frustration.
5. Users are willing to pay for structured career transformation.

### MVP North Star Metric

**Week-8 Active Learning Retention**

A user is active in week 8 if they complete at least one meaningful learning activity that week.

### Secondary Metrics

- Onboarding completion rate
- Roadmap generation completion rate
- First lesson completion rate
- Weekly plan completion rate
- AI coach usage rate
- Assessment completion rate
- Streak continuation rate
- Trial-to-paid conversion
- Cancellation rate
- NPS

---

## 4. MVP Scope

## 4.1 Must-Have MVP Features

### 1. Authentication

Users can create an account and log in.

Required:
- Email/password
- Apple login
- Google login
- Forgot password
- Email verification
- Secure session management

MVP Acceptance Criteria:
- User can sign up
- User can log in
- User can log out
- User data persists
- App handles failed login states

---

### 2. AI Goal Interview

Instead of a long static form, Arlo interviews the user in a conversational format.

Questions:
- What do you want to become?
- Why is this important to you?
- What is your current job?
- What skills do you already have?
- How many hours per week can you study?
- What days/times work best?
- What is your target deadline?
- What learning style do you prefer?
- What is your confidence level?
- What has made you quit learning before?

Output:
- User goal
- Skill gap
- Timeline estimate
- Weekly study capacity
- Motivation summary
- Difficulty level
- Roadmap generation input

Acceptance Criteria:
- AI asks questions step-by-step
- User can answer naturally
- AI extracts structured data
- User can edit answers before generating roadmap

---

### 3. Personalized Roadmap

Arlo generates a learning roadmap for one initial track: **Data Analyst**.

MVP roadmap structure:
- 6 phases
- 12–18 milestones
- 60–100 lessons
- 4–6 assessments
- 2–3 portfolio projects

Example Data Analyst Roadmap:
1. Orientation & Setup
2. Excel Foundations
3. SQL Foundations
4. Data Cleaning
5. Data Analysis
6. Visualization
7. Python Basics
8. Portfolio Project
9. Interview Prep
10. Job-ready Review

Acceptance Criteria:
- Roadmap is generated from onboarding data
- Roadmap fits weekly availability
- Roadmap has milestones
- Lessons have estimated time
- Lessons contain learning resources
- Roadmap progress updates as user completes tasks

---

### 4. Lesson Screen

Each lesson should feel like a mission, not homework.

Lesson types:
- Video lesson
- Reading
- Practice task
- Quiz
- Reflection
- Mini project

Lesson screen includes:
- Title
- Funny mission name
- Estimated time
- Learning objective
- Resource link
- Notes
- Ask Arlo button
- Mark complete button
- XP reward

Acceptance Criteria:
- User can start lesson
- User can open resource
- User can ask AI about lesson
- User can mark complete
- Completion triggers reward screen

---

### 5. AI Coach — Arlo

Arlo is the persistent AI coach.

Capabilities:
- Explain concepts simply
- Answer lesson questions
- Debug basic SQL/Python
- Encourage user
- Summarize lesson
- Replan if user is stuck
- Remember motivation
- Give weekly recap

Tone:
- Funny
- Supportive
- Slightly dramatic
- Never insulting unless user enables Roast Mode later

Acceptance Criteria:
- User can ask questions
- AI answers within context of roadmap and lesson
- AI does not invent unavailable resources
- AI gives safe, practical guidance
- Conversations are saved

---

### 6. Weekly Planner

Arlo turns roadmap into weekly commitments.

Planner includes:
- Weekly study goal
- Study days
- Task list
- Estimated hours
- Completed vs planned
- Replan button

User actions:
- Move task
- Skip task
- Reschedule
- Reduce week
- Add extra session

Acceptance Criteria:
- User sees weekly plan
- User can mark tasks complete
- User can reschedule tasks
- Missed tasks can be replanned
- Weekly streak updates based on weekly commitment, not daily usage

---

### 7. Progress Dashboard

Dashboard answers:

> What should I do today?

Components:
- Today’s task
- Weekly progress
- XP
- Weekly streak
- Current rank
- Next milestone
- Motivational message from Arlo
- Continue button

Acceptance Criteria:
- Home screen is useful within 5 seconds
- User always knows next action
- Progress is visually clear
- App does not feel empty after onboarding

---

### 8. Gamification Engine

MVP gamification should include:
- XP
- Coins
- Gems
- Weekly streaks
- Badges
- Chests
- Career ranks
- Arlo avatar customization

Important:
The product vision says adults should not be punished with daily streaks. Use **weekly commitment streaks** for core retention. Daily quests can exist, but the main streak should be weekly.

Acceptance Criteria:
- Completing lesson grants XP
- Completing weekly goal maintains streak
- Badges unlock based on achievements
- Chests can grant random rewards
- User can spend gems/coins on cosmetic items

---

### 9. Rewards & Celebration

Reward screens are critical.

Events:
- Lesson complete
- Quiz passed
- Weekly goal complete
- Badge unlocked
- Chest opened
- Rank promotion
- Portfolio submitted

Reward screen includes:
- Arlo animation
- Confetti
- XP
- Gems/coins
- Progress update
- Continue button

Acceptance Criteria:
- Completion always feels rewarding
- Rewards are stored reliably
- User cannot exploit repeated rewards

---

### 10. Notifications

MVP notification types:
- Planned study reminder
- Streak risk reminder
- Weekly recap
- Missed week recovery
- Badge unlocked
- Replan suggestion

Tone examples:
- “You planned SQL tonight. I warmed up the database dungeon.”
- “Your weekly streak is safe if you finish one small task today.”
- “Life happened? No guilt. Want me to rebuild this week?”

Acceptance Criteria:
- User can enable/disable notifications
- Notifications respect user preference
- Notifications are not spammy
- Study reminders are connected to planned sessions

---

### 11. Profile

Profile includes:
- User avatar
- Arlo avatar
- Current rank
- XP
- Streak
- Badges
- Roadmap progress
- Settings
- Subscription

Acceptance Criteria:
- User can see identity and progress
- User can change profile details
- User can access settings
- User can manage subscription

---

### 12. Subscription

MVP monetization:
- Free trial
- Pro monthly
- Pro yearly

Suggested MVP pricing:
- Free: limited roadmap preview, limited AI messages
- Pro: full roadmap, AI coach, progress, rewards
- Early adopter: discounted yearly plan

Acceptance Criteria:
- User can start free trial
- User can subscribe
- User can restore purchases
- Subscription state syncs with backend
- Feature access changes based on plan

---

## 4.2 Not MVP

Do not build in MVP:
- Full job board
- Human coach marketplace
- AR treasure hunt
- Spotify integration
- Real multiplayer voice rooms
- Employer hiring portal
- Full admin CMS with every feature
- Advanced social network
- Complex guild system
- Web app

These are Phase 2+.

---

## 5. Recommended MVP User Flow

### First Session

1. Splash
2. Welcome
3. Sign up
4. Meet Arlo
5. Goal interview
6. Roadmap preview
7. Choose weekly commitment
8. First weekly plan
9. First lesson
10. Reward screen
11. Home dashboard

### Daily/Weekly Loop

1. Notification or app open
2. Home shows today’s mission
3. User completes lesson/practice
4. User asks Arlo if stuck
5. User earns reward
6. Progress updates
7. End of week recap
8. Arlo replans next week

### Failure Recovery Loop

1. User misses sessions
2. Arlo detects missed plan
3. App shows “No guilt” recovery message
4. User chooses:
   - Keep plan
   - Reduce workload
   - Rebuild week
5. Streak freeze or recovery badge may apply

---

## 6. Feature Breakdown by Screen

## 6.1 Splash Screen

Purpose:
- Brand impression
- Fast loading

Elements:
- Arlo logo
- Arlo animation
- Short tagline

Technical:
- Check auth session
- Check onboarding status
- Route user

---

## 6.2 Welcome Screen

Purpose:
- Explain value in 5 seconds

Elements:
- Arlo illustration
- Headline
- 3 benefit cards
- Get started button
- Login link

Copy:
“Your AI career coach. A plan, a path, and a coach who does not let you quit.”

---

## 6.3 Goal Interview Screen

Purpose:
- Collect user data without feeling like a form

Elements:
- Chat messages
- Quick reply chips
- Text input
- Progress indicator
- Edit previous answer

Technical:
- AI prompt with structured output
- Store each answer
- Validate missing fields
- Create goal profile

---

## 6.4 Roadmap Preview

Purpose:
- Show the user that Arlo understood them

Elements:
- Target role
- Timeline
- Weekly hours
- Skill gap
- Confidence score
- Phase list
- Start button

---

## 6.5 Home Dashboard

Purpose:
- Make next action obvious

Elements:
- Greeting
- Today’s mission
- Weekly progress card
- Streak card
- XP card
- Next milestone
- Arlo message

---

## 6.6 Roadmap Screen

Purpose:
- Long-term motivation

Elements:
- Visual path
- Current lesson
- Locked lessons
- Milestones
- Boss challenges
- Portfolio checkpoints

---

## 6.7 Lesson Screen

Purpose:
- Focused learning

Elements:
- Mission title
- Resource
- Objectives
- Notes
- Ask Arlo
- Complete button

---

## 6.8 AI Coach Screen

Purpose:
- Always-available help

Elements:
- Chat
- Suggested prompts
- Lesson context
- Roadmap context
- Memory hints

---

## 6.9 Weekly Planner

Purpose:
- Accountability

Elements:
- Calendar week
- Tasks
- Planned vs completed hours
- Replan button
- Streak status

---

## 6.10 Assessment Screen

Purpose:
- Measure real skill

Elements:
- Scenario
- Dataset/file
- Questions
- Answer input
- Submit
- AI feedback
- Retry

---

## 6.11 Reward Screen

Purpose:
- Dopamine and retention

Elements:
- Big Arlo
- XP
- Gems
- Coins
- Badge if any
- Share option
- Continue

---

## 6.12 Profile Screen

Purpose:
- Identity and long-term status

Elements:
- User info
- Arlo avatar
- Rank
- Badges
- Skill profile preview
- Settings
- Subscription

---

## 7. Gamification System

## 7.1 XP

XP rewards:
- Complete lesson: 20–40 XP
- Complete quiz: 30–60 XP
- Pass assessment: 100–250 XP
- Submit project: 300–500 XP
- Complete weekly goal: 150 XP bonus
- Help another user later: 10–30 XP

Rules:
- XP should reward proof of skill more than passive watching
- Users should not farm XP by repeating the same easy task
- Repeat lesson rewards should be reduced

---

## 7.2 Gems

Gems are premium-like soft currency.

Earn gems:
- Weekly goal complete
- Badge unlock
- Chest reward
- Assessment pass
- Subscription bonus

Spend gems:
- Avatar items
- Streak protection
- Special chests
- Cosmetic themes

---

## 7.3 Coins

Coins are common currency.

Earn coins:
- Lessons
- Daily quests
- Mini tasks
- Chests

Spend coins:
- Basic cosmetics
- Common chest
- Arlo food/toys

---

## 7.4 Badges

MVP badges:
1. First Step — Complete first lesson
2. SQL Spark — Finish SQL basics
3. Weekly Warrior — Complete first weekly goal
4. 4-Week Flame — Maintain 4 weekly streaks
5. Comeback Eagle — Return after missing a week
6. Night Owl — Study after 10pm
7. Early Bird — Study before 8am
8. Quiz Crusher — Pass 5 quizzes
9. Project Starter — Start first portfolio project
10. Job-Ready Path — Finish MVP roadmap

---

## 7.5 Ranks

Suggested ranks:
1. Curious Egg
2. Brave Hatchling
3. Rookie Eagle
4. Data Scout
5. Semi Ninja
6. Full Ninja
7. Query Warrior
8. Chart Wizard
9. Insight Hunter
10. Portfolio Hero
11. Interview Ranger
12. Job-Ready Eagle

Ranks should unlock based on XP + milestone completion, not XP alone.

---

## 7.6 Chests

Chest types:
- Common Chest
- Weekly Chest
- Boss Chest
- Legendary Chest

Rewards:
- Coins
- Gems
- XP boost
- Avatar item
- Streak freeze
- Badge skin

Chest logic:
- Use weighted random reward table
- Store chest opening results server-side
- Prevent client-side manipulation

---

## 8. Arlo Mascot System

Arlo should be a product feature, not just decoration.

## 8.1 Arlo Personality

Traits:
- Funny
- Dramatic
- Encouraging
- Slightly sarcastic
- Loyal coach

Voice examples:
- “Tiny task. Big future.”
- “I prepared your SQL dungeon.”
- “You vanished for three days. I survived. Barely.”
- “That answer was suspiciously good. I’m proud.”

---

## 8.2 Arlo States

- Happy
- Proud
- Thinking
- Worried
- Sleepy
- Coach mode
- Detective mode
- Boss mode
- Celebration
- Roast mode

---

## 8.3 Arlo Customization

MVP cosmetics:
- Hats
- Glasses
- Hoodies
- Capes
- Backgrounds

Future:
- Wings
- Pets
- Seasonal outfits
- Rare animated skins

---

## 9. AI System Design

## 9.1 AI Components

Arlo needs multiple AI agents/modules:

1. Goal Interview Agent
2. Skill Gap Agent
3. Roadmap Generator
4. Resource Curator
5. Weekly Planner
6. Lesson Coach
7. Assessment Evaluator
8. Replanning Agent
9. Motivation Agent
10. Safety/Policy Agent

They can all use the same model initially but should have separate prompts and schemas.

---

## 9.2 Structured Outputs

Every AI output that affects product state must be JSON.

Example roadmap schema:

```json
{
  "target_role": "Data Analyst",
  "timeline_weeks": 24,
  "weekly_hours": 8,
  "phases": [
    {
      "title": "SQL Foundations",
      "description": "Learn how to query relational data",
      "milestones": [
        {
          "title": "SELECT basics",
          "lessons": [
            {
              "title": "Filtering data",
              "type": "practice",
              "estimated_minutes": 30,
              "xp_reward": 30
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 9.3 AI Guardrails

The AI must not:
- Promise guaranteed jobs
- Give fake certificates
- Invent resource URLs
- Claim user is job-ready without assessment
- Provide unsafe career/financial guarantees
- Generate copyrighted course content copied from paid sources

The AI should:
- Explain uncertainty
- Recommend free resources
- Encourage practical practice
- Ask clarification if goal is vague
- Replan realistically

---

## 9.4 Prompt Versioning

Every production prompt should have:
- Prompt ID
- Version number
- Last updated date
- Owner
- Test cases
- Expected output schema

Example:
- `goal_interview_v1`
- `roadmap_generator_v1`
- `weekly_replanner_v1`
- `assessment_evaluator_v1`

---

## 10. Resource Discovery System

MVP can use a semi-curated resource library instead of fully dynamic web search.

## 10.1 Recommended MVP Approach

Start with curated resources for Data Analyst:
- SQL
- Excel
- Python
- Tableau/Power BI
- Statistics basics
- Portfolio projects

Why:
- Safer
- Faster
- Better quality
- Avoids broken links
- Easier assessment design

## 10.2 Resource Table Fields

- id
- title
- provider
- url
- type
- skill_tags
- difficulty
- estimated_minutes
- language
- quality_score
- free_or_paid
- last_checked_at

## 10.3 Future Dynamic Resource Validation

Later:
- Check if URL still works
- Extract metadata
- Score resource freshness
- Compare with user feedback
- Replace poor resources automatically

---

## 11. Backend Architecture

## 11.1 Recommended MVP Backend

Use Supabase for speed:
- Auth
- PostgreSQL
- Storage
- Edge Functions
- Realtime
- Row Level Security

## 11.2 Backend Responsibilities

- User auth
- Store onboarding answers
- Store roadmap
- Store lesson progress
- Store XP and rewards
- Store AI conversations
- Store subscriptions
- Run server-side reward logic
- Send notifications
- Track analytics events

---

## 12. Database Schema

## 12.1 users

Stores auth-level user references.

Fields:
- id
- email
- created_at
- updated_at

---

## 12.2 profiles

Fields:
- id
- user_id
- display_name
- avatar_url
- timezone
- language
- current_rank
- total_xp
- coins
- gems
- weekly_streak
- created_at
- updated_at

---

## 12.3 goals

Fields:
- id
- user_id
- target_role
- target_deadline
- weekly_hours
- motivation
- current_profession
- experience_summary
- confidence_score
- status
- created_at

---

## 12.4 roadmaps

Fields:
- id
- user_id
- goal_id
- title
- description
- timeline_weeks
- current_phase_id
- progress_percent
- generated_by_prompt_version
- created_at
- updated_at

---

## 12.5 roadmap_phases

Fields:
- id
- roadmap_id
- title
- description
- order_index
- locked
- completed_at

---

## 12.6 milestones

Fields:
- id
- phase_id
- title
- description
- type
- order_index
- xp_reward
- completed_at

---

## 12.7 lessons

Fields:
- id
- milestone_id
- title
- mission_name
- description
- lesson_type
- estimated_minutes
- difficulty
- xp_reward
- order_index
- resource_id
- status

---

## 12.8 resources

Fields:
- id
- title
- url
- provider
- resource_type
- skill_tags
- difficulty
- estimated_minutes
- quality_score
- is_free
- last_checked_at

---

## 12.9 lesson_progress

Fields:
- id
- user_id
- lesson_id
- status
- started_at
- completed_at
- time_spent_minutes
- xp_awarded
- retry_count

---

## 12.10 weekly_plans

Fields:
- id
- user_id
- roadmap_id
- week_start
- week_end
- planned_minutes
- completed_minutes
- status
- streak_eligible
- created_at

---

## 12.11 weekly_plan_tasks

Fields:
- id
- weekly_plan_id
- lesson_id
- task_type
- scheduled_date
- estimated_minutes
- status
- completed_at

---

## 12.12 achievements

Fields:
- id
- code
- title
- description
- category
- icon_url
- reward_xp
- reward_gems
- rarity

---

## 12.13 user_achievements

Fields:
- id
- user_id
- achievement_id
- unlocked_at

---

## 12.14 inventory_items

Fields:
- id
- name
- category
- rarity
- price_coins
- price_gems
- asset_url

---

## 12.15 user_inventory

Fields:
- id
- user_id
- item_id
- acquired_at
- equipped

---

## 12.16 ai_conversations

Fields:
- id
- user_id
- context_type
- context_id
- title
- created_at

---

## 12.17 ai_messages

Fields:
- id
- conversation_id
- role
- content
- prompt_version
- token_count
- created_at

---

## 12.18 assessments

Fields:
- id
- roadmap_id
- title
- scenario
- skill_tags
- passing_score
- xp_reward

---

## 12.19 assessment_attempts

Fields:
- id
- assessment_id
- user_id
- answer
- score
- feedback_json
- passed
- created_at

---

## 12.20 subscriptions

Fields:
- id
- user_id
- provider
- provider_customer_id
- plan
- status
- current_period_end
- created_at

---

## 13. API / Edge Function Plan

## 13.1 Auth

Handled by Supabase Auth.

## 13.2 create_goal

Input:
- onboarding answers

Output:
- goal record

Logic:
- validate user
- store goal
- trigger roadmap generation

---

## 13.3 generate_roadmap

Input:
- goal_id

Output:
- roadmap JSON

Logic:
- call AI roadmap generator
- validate schema
- create phases, milestones, lessons
- assign resources

---

## 13.4 generate_weekly_plan

Input:
- roadmap_id
- week_start
- user availability

Output:
- weekly plan

Logic:
- select next lessons
- fit into user availability
- create tasks

---

## 13.5 complete_lesson

Input:
- lesson_id

Output:
- rewards

Logic:
- check if already completed
- mark complete
- award XP
- update progress
- check achievements
- return reward payload

---

## 13.6 ask_coach

Input:
- message
- context_type
- context_id

Output:
- AI response

Logic:
- retrieve user context
- retrieve lesson/roadmap context
- call AI
- save messages

---

## 13.7 submit_assessment

Input:
- assessment_id
- answer

Output:
- score and feedback

Logic:
- call evaluator
- validate score
- save attempt
- award reward if passed

---

## 13.8 open_chest

Input:
- chest_type

Output:
- reward result

Logic:
- server-side random reward
- apply reward
- save transaction

---

## 14. iOS App Architecture

## 14.1 Recommended Pattern

SwiftUI + MVVM

Layers:
- Views
- ViewModels
- Services
- Repositories
- Models
- Design System

## 14.2 Main Modules

- AuthModule
- OnboardingModule
- RoadmapModule
- LessonModule
- CoachModule
- PlannerModule
- ProgressModule
- RewardsModule
- ProfileModule
- SubscriptionModule

## 14.3 Local Storage

Use:
- Keychain for tokens
- UserDefaults for light preferences
- SQLite/CoreData later if offline mode is needed

MVP can start mostly online-first.

---

## 15. Design System

## 15.1 Brand Style

Mood:
- Playful
- Premium
- Motivational
- Clean
- Friendly

Colors:
- Primary purple: #6B4EFF
- Deep navy: #101923
- Soft lavender: #F6F2FF
- Success green: #62D84E
- Coin yellow: #FFC928
- Gem purple: #B35CFF
- Alert orange: #FF8A3D

Typography:
- Display: Fredoka or similar
- Body: Nunito or SF Pro Rounded
- Production iOS: SF Pro Rounded recommended for native feel

---

## 15.2 Components

Core components:
- Primary button
- Secondary button
- Mission card
- Roadmap node
- XP pill
- Gem counter
- Streak card
- Lesson card
- Reward modal
- Arlo speech bubble
- Progress ring
- Badge card
- Chest modal
- AI chat bubble

---

## 16. Analytics Plan

Track events:
- app_opened
- signup_started
- signup_completed
- onboarding_started
- onboarding_completed
- roadmap_generated
- lesson_started
- lesson_completed
- coach_message_sent
- weekly_plan_created
- weekly_task_completed
- streak_maintained
- streak_broken
- badge_unlocked
- chest_opened
- subscription_started
- trial_started
- trial_converted
- subscription_cancelled

Every event should include:
- user_id
- timestamp
- platform
- app_version
- roadmap_id if relevant
- lesson_id if relevant

---

## 17. Notification Strategy

## 17.1 Notification Types

1. Study reminder
2. Streak risk
3. Weekly recap
4. Recovery message
5. Reward reminder
6. Subscription/trial reminder

## 17.2 Rules

- Never more than 1–2 per day
- Respect quiet hours
- Let user choose tone
- Make notifications useful, not generic
- Include next action

---

## 18. Business Roadmap

## 18.1 Pre-Launch

Goals:
- Validate demand before building too much
- Build waitlist
- Interview users
- Create early community

Actions:
- Landing page
- Waitlist form
- 20 user interviews
- Data analyst track validation
- Prototype testing
- TikTok/LinkedIn content
- Reddit posts in career change communities
- Email newsletter

---

## 18.2 Beta Launch

Audience:
- 100–300 early users

Offer:
- Free or discounted lifetime early adopter plan

Goals:
- Measure retention
- Find confusing screens
- Improve roadmap quality
- Improve AI coach tone
- Validate willingness to pay

---

## 18.3 Public Launch

Channels:
- Product Hunt
- LinkedIn founder story
- Reddit
- TikTok learning journey videos
- Indie Hackers
- Career-change newsletters
- Data analyst communities

Message:
“Not another course. A coach who helps you finish.”

---

## 18.4 Pricing Strategy

MVP pricing suggestion:

### Free
- Roadmap preview
- 3 lessons
- Limited AI coach messages
- Basic progress

### Pro Monthly — $19–29/month
- Full roadmap
- Unlimited lessons
- AI coach
- Weekly planner
- Gamification
- Progress

### Pro Yearly — $149–199/year
- Discounted annual plan
- Bonus gems
- Exclusive Arlo cosmetic

### Future Premium — $49–129/month
- Portfolio review
- Human coach
- Mock interview
- Career profile

---

## 19. Admin Panel MVP

Build simple admin later, but MVP needs at least internal tools.

Admin features:
- View users
- View roadmaps
- View AI errors
- View subscriptions
- Manage resources
- Manage badges
- See analytics dashboard
- Manually grant rewards
- Disable bad resources

Can be built with:
- Supabase Studio first
- Later custom Next.js admin

---

## 20. Security & Privacy

## 20.1 Required

- Row Level Security in Supabase
- Secure auth tokens
- No sensitive data in logs
- API keys never in app client
- Server-side reward logic
- Rate limiting for AI calls
- User data export/delete later

## 20.2 AI Privacy

Tell users:
- AI uses their goal, progress, and lesson context
- User can delete account
- User should not upload highly sensitive documents in MVP

---

## 21. Testing Strategy

## 21.1 Product Testing

- Onboarding usability
- Roadmap quality review
- Lesson completion flow
- Reward flow
- Replan flow
- Subscription flow

## 21.2 Technical Testing

- Unit tests for reward logic
- Unit tests for XP calculation
- API tests
- Auth tests
- AI schema validation tests
- Payment sandbox tests

## 21.3 Beta Testing

Recruit:
- 20 friends/family
- 50 target users
- 100 public beta users

Ask:
- Was roadmap useful?
- Did you know what to do next?
- Did Arlo help?
- Did rewards motivate you?
- Would you pay?

---

## 22. Development Timeline

## Phase 0 — Product Definition (Week 0)

Deliverables:
- Final MVP scope
- Design system
- Database schema
- AI prompts v1
- Feature priority
- User stories

---

## Phase 1 — Foundation (Weeks 1–2)

Build:
- iOS project setup
- Supabase setup
- Auth
- Basic navigation
- Design system
- Profile table
- Analytics setup
- Error tracking

Exit Criteria:
- User can sign up/login
- App has stable navigation
- Backend connection works

---

## Phase 2 — Onboarding + Goal Interview (Weeks 3–4)

Build:
- AI chat onboarding
- Structured answer extraction
- Goal creation
- Roadmap preview UI

Exit Criteria:
- User completes interview
- Goal saved
- AI creates structured profile

---

## Phase 3 — Roadmap + Lessons (Weeks 5–6)

Build:
- Roadmap generation
- Roadmap UI
- Lesson screen
- Resource linking
- Lesson completion

Exit Criteria:
- User can see roadmap
- User can complete lessons
- Progress updates

---

## Phase 4 — Weekly Planner + AI Coach (Weeks 7–8)

Build:
- Weekly plan generation
- Planner screen
- Replan logic
- AI coach with context
- Conversation history

Exit Criteria:
- User can follow weekly tasks
- User can ask Arlo about lessons
- Missed tasks can be replanned

---

## Phase 5 — Gamification (Weeks 9–10)

Build:
- XP system
- Coins/gems
- Badges
- Reward screen
- Chests
- Rank progression
- Arlo avatar basics

Exit Criteria:
- Rewards work reliably
- User sees progression
- Badge unlocks work

---

## Phase 6 — Payments + Notifications (Weeks 11–12)

Build:
- RevenueCat
- Trial
- Paywall
- Push notifications
- Reminder scheduling

Exit Criteria:
- User can subscribe
- Notifications work
- Trial state is handled

---

## Phase 7 — Beta QA (Weeks 13–14)

Build/fix:
- App Store polish
- Crash fixes
- Analytics review
- AI response quality
- UX improvements
- Performance

Exit Criteria:
- TestFlight ready
- No critical bugs
- Beta cohort ready

---

## Phase 8 — Launch (Weeks 15–16)

Tasks:
- App Store submission
- Landing page
- Product Hunt plan
- Email waitlist
- Launch content
- Support process

Exit Criteria:
- Public launch
- First paying users
- First retention data

---

## 23. Team Plan

## Solo Founder Version

You can build MVP with:
- 1 iOS developer
- 1 backend/AI developer
- 1 product designer
- Founder doing product/business/content

## Small Team Version

Ideal:
- Product/founder
- iOS developer
- Backend engineer
- AI engineer
- Designer
- Part-time growth marketer

---

## 24. Risk Register

## Risk 1: Too many features

Mitigation:
- Build core loop first
- Cut social/guild/AR
- Use feature flags

## Risk 2: AI roadmap quality is poor

Mitigation:
- Start with curated templates
- Human review first track
- User feedback after roadmap

## Risk 3: Users do not return

Mitigation:
- Weekly planner
- Smart reminders
- Reward loop
- Recovery loop

## Risk 4: Too expensive AI usage

Mitigation:
- Cache outputs
- Use smaller models for simple tasks
- Limit free tier AI messages
- Summarize conversations

## Risk 5: App feels childish

Mitigation:
- Premium UI
- Funny but respectful tone
- Career outcome focus
- Let user reduce gamification intensity

---

## 25. Final MVP Build Order

Build exactly in this order:

1. Auth
2. Profile
3. Onboarding
4. Goal creation
5. Roadmap generation
6. Roadmap UI
7. Lesson completion
8. Progress tracking
9. AI coach
10. Weekly planner
11. Rewards
12. Badges
13. Notifications
14. Subscription
15. Analytics
16. TestFlight

Do not start with:
- Guilds
- Feed
- AR
- Job radar
- Spotify
- Full marketplace

Those are attractive but dangerous before retention is proven.

---

## 26. Future Roadmap After MVP

## v1.1
- Better assessments
- Portfolio project review
- More badges
- More Arlo cosmetics

## v1.2
- Friend feed
- Follow users
- Reactions
- Share achievements

## v1.3
- Guilds
- Weekly events
- Boss battles

## v1.4
- Skill profile export
- LinkedIn share cards
- PDF profile

## v2.0
- More tracks:
  - Frontend Developer
  - Digital Marketing
  - UX/UI
  - Cloud Support
  - Product Management

## v3.0
- Employer / B2B reskilling
- Human coach network
- Hiring partner dashboard

---

## 27. Key Product Philosophy

Arlo should never feel like:

- A boring course list
- A chatbot that prints a plan
- A childish game with no career value
- A stressful productivity app

Arlo should feel like:

> A funny, intelligent AI coach that turns your real career transformation into a clear, rewarding adventure.

The MVP wins if the user opens Arlo and immediately thinks:

> “I know exactly what to do next, and I feel motivated to do it.”
