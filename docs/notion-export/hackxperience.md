# HackXperience

[Database](Database%203a6acb885ece80a29196f410aa25efc4.md)

Emochi (Emotion + Mochi)

[https://hackxperience2026.simitclub.com/guide](https://hackxperience2026.simitclub.com/guide)

# Characters (Emochi)

| Character | Role | Personality | Core Question | Covers |
| --- | --- | --- | --- | --- |
| **Cheer** | Optimism | Encourages possibilities and celebrates wins | **"What could go right?"** | Happiness, hope, excitement, optimism, motivation |
| **Fear**  | Protection | Identifies risks and keeps you safe | **"Is it safe?"** | Fear, worry, shyness, insecurity, embarrassment, social anxiety |
| **Stress (Buzzy)**  | Pressure | Responds to pressure and urgency | **"Can we handle this now?"** | Stress, pressure, overwhelm, panic, urgency |
| **Tear** | Reflection | Acknowledges and processes difficult emotions | **"How do we really feel?"** | Sadness, disappointment, loneliness, regret, grief |
| **Calm (Zen)** | Balance | Slows everyone down and brings clarity | **"Let's slow down."** | Peace, mindfulness, patience, acceptance |
| **Social (Bubble)** | Connection | Encourages support and collaboration | **"Who can we do this with?"** | Friendship, communication, teamwork, openness, relationships |
| **Rest (Dozy)** | Recovery | Protects physical and mental energy | **"Do we need a break?"** | Tiredness, exhaustion, burnout, recovery, self-care |
| **Judge (Wisey)** | Moderator | Listens to every perspective and summarizes fairly | **"What's the most balanced next step?"** | Logic, reflection, balanced reasoning |

# Emotions → Characters Mappings

Combined

| Emotion / Situation | Moodlings |
| --- | --- |
| Motivated | Cheer + Social |
| Reflective | Calm + Tear |
| Embarrassed | Fear + Tear |
| Anxious | Fear + Stress |
| Overwhelmed | Stress + Rest |
| Relieved | Calm + Cheer |
| Grateful | Cheer + Social |
| Frustrated | Stress + Calm |
| Need Support | Social + Cheer |
| Missing Someone | Social + Tear |
| Teamwork | Social + Cheer |
| Conflict | Fear + Social + Calm |
| Taking a Break | Rest + Calm |
| Starting Something New | Cheer + Fear |
| Presentation / Interview | Fear + Stress + Cheer |
| Finished a Goal | Cheer + Rest |
		

# Features

Core

- Asks Interests (will use again to give advices)
- Personality Assessment (assign MBTI)
- Daily Check-in (sleep time, work hour, feeling)
- AI agent customization (7 characters)
- Meeting Room (AI agents debate)
- Jude Summary
- Outcome logging
- Memory (remember achievement, worries, goals, outcomes)
- emotion score maps to level (100 scores, 10 levels)
- Direct chat (Whisper mode)
- Find Friends (see their emochi scores)
- Bonk animation
    
    ![](https://investorplace.com/wp-content/uploads/2023/01/bonk1600-768x432.png)

Scope B

(Nice-to-Have)

- Emotion Timeline (weekly emotional growth)
- Meeting Journal (save meeting history)

Scope C

(Stretch Goals)

- Character Relationships
    - Characters remember each other.
- Meeting Analytics (emotion insights)
- Daily Character Gifts/Challenges
    - quote
    - challenge
    - compliment
    - breathing exercise
    - joke
		

# User Flow

```
Landing Page (characters gathering)
    │
    ▼
Sign Up
    │
    ▼
Personality Quiz
    │
    ▼
Initialize Emochi Scores
(50 ± MBTI)
    │
    ▼
Choose Interests
    │
    ▼
Dashboard
    │
    ├── Mood Ping (Daily Check-in)
    │       │
    │       ▼
    │   Update Emochi Score
    │ 
    ├── Profile / See Emochi Score
    │       
    ├── bg sound on/off toggle  
    │       
    ├── bg sound on/off toggle 
    │       
    ├── search friends   
    │
    └── Start Meeting
            │
            ▼
      Emochi Debate
            │
            ▼
      Judge Verdict
            │
            ▼
      Outcome Logging
            │
            ▼
      Update Emochi Scores
            │
            ▼
      Save Memory
            │
            ▼
      Dashboard
```

# Interests

Users can choose up to 5 interests so Emochi can personalize conversations, suggestions, and support based on what the user enjoy.

### Entertainment

- Music
- Movies & TV
- Gaming
- Anime
- Reading

### Sports & Fitness

- Gym
- Running
- Walking
- Cycling
- Dancing
- Yoga

### Creativity

- Drawing
- Photography
- Writing
- Cooking
- Baking

### Learning & Career

- Coding
- AI & Technology
- Studying
- Business
- Language Learning

### Social

- Friends
- Family
- Volunteering
- Networking

### Relaxation

- Meditation
- Journaling
- Nature
- Pets
- Gardening

### Travel & Lifestyle

- Traveling
- Shopping
- Fashion
- Cafés
- Food Exploration

# Personalisation order

When Wisey communicates, consider information in order

1. **Current Emochi scores** (most important)
    - How is the user feeling now?
2. **Past memories**
    - What happened before?
3. **Interests**
    - Use examples they enjoy.
4. **MBTI**
    - Adjust communication style only.

# 23 Questions

| Dimension | Option A | Option B |
| --- | --- | --- |
| Energy | Introvert (I) | Extravert (E) |
| Information | Sensing (S) | Intuition (N) |
| Decision | Thinking (T) | Feeling (F) |
| Lifestyle | Judging (J) | Perceiving (P) |

Each answer earns **1 point**.

## Part A  (I / E)

### Q1

After a busy week, how do you prefer to recharge?

- ☐ Spend time alone (+I)
- ☐ Spend time with friends (+E)

### Q2

During group discussions, you usually...

- ☐ Listen before speaking (+I)
- ☐ Speak as ideas come (+E)

### Q3

At a social event, you tend to...

- ☐ Talk with a few people deeply (+I)
- ☐ Meet lots of different people (+E)

### Q4

When solving a difficult problem, you prefer to...

- ☐ Think quietly first (+I)
- ☐ Discuss it with others (+E)

### Q5

Which activity sounds more enjoyable?

- ☐ Spend quiet time by yourself (+I)
- ☐ Spend time with friends or family (+E)

## Part B (S / N)

### Q6

When learning something new, you prefer...

- ☐ Practical examples (+S)
- ☐ Big-picture ideas (+N)

### Q7

You usually notice...

- ☐ Facts and details (+S)
- ☐ Patterns and possibilities (+N)

### Q8

During brainstorming, you...

- ☐ Focus on realistic ideas (+S)
- ☐ Think of creative possibilities (+N)

### Q9

You trust more...

- ☐ Facts and past experience (+S)
- ☐ Gut feelings and possibilities (+N)

### Q10

You prefer...

- ☐ Proven methods (+S)
- ☐ Trying something different (+N)

## Part C (T / F)

### Q11

When making decisions, you usually...

- ☐ Focus on logic (+T)
- ☐ Consider feelings (+F)

### Q12

A friend asks for advice. You first...

- ☐ Offer solutions (+T)
- ☐ Listen and comfort them (+F)

### Q13

Which is more important?

- ☐ Fairness (+T)
- ☐ Harmony (+F)

### Q14

In disagreements, you...

- ☐ Discuss facts (+T)
- ☐ Consider everyone's emotions (+F)

### Q15

People describe you as...

- ☐ Objective (+T)
- ☐ Compassionate (+F)

## Part D (J / P)

### Q16

Your daily schedule is usually...

- ☐ Planned (+J)
- ☐ Flexible (+P)

### Q17

Before a trip, you...

- ☐ Plan everything (+J)
- ☐ Decide along the way (+P)

### Q18

When given a deadline, you usually...

- ☐ Finish well before it (+J)
- ☐ Finish close to the deadline (+P)

### Q19

When working on a project, you prefer to...

- ☐ Finish tasks one by one (+J)
- ☐ Work on different tasks as inspiration comes (+P)

### Q20

You prefer...

- ☐ A clear plan (+J)
- ☐ Keeping options open (+P)

## Lifestyle

### Q21. On most days, how many hours do you sleep?

- ☐ Less than 5 hours
- ☐ 5–6 hours
- ☐ 7–9 hours
- ☐ More than 9 hours

### Q22. How stressful has your life been recently?

- ☐ Very relaxed
- ☐ Slightly stressful
- ☐ Quite stressful
- ☐ Extremely stressful

### Q23. How often do you spend quality time with friends or family?

- ☐ Rarely
- ☐ Sometimes
- ☐ Often
- ☐ Very often

# Score Mapping

All characters start with a **base score of 50**.

scores always stay   0 ≤ Score ≤ 100

| MBTI Trait | Increase | Decrease |
| --- | --- | --- |
| **Introvert (I)** | Calm +3, Rest +2 | Social -2 |
| **Extravert (E)** | Social +3, Cheer +2 | Rest -2 |
| **Sensing (S)** | Fear +3, Stress +2 | Cheer -2 |
| **Intuition (N)** | Cheer +3, Calm +2 | Fear -2 |
| **Thinking (T)** | Calm +3, Stress +2 | Tear -2 |
| **Feeling (F)** | Tear +3, Social +2 | Stress -2 |
| **Judging (J)** | Stress +3, Fear +2 | Rest -2 |
| **Perceiving (P)** | Rest +3, Cheer +2 | Stress -2 |

Q21. Sleep Hours

| Sleep | Increase | Decrease |
| --- | --- | --- |
| Less than 5 | Rest +3, Stress +2 | Calm -2 |
| 5–6 | Rest +2 | Cheer -1 |
| 7–9 | Calm +3, Cheer +2 | Stress -2 |
| More than 9 | Rest +2, Calm +1 | Stress -2 |

Q22. How stressful has your life been recently?

| Stress Level | Increase | Decrease |
| --- | --- | --- |
| Very Relaxed | Calm +3, Cheer +2 | Stress -2 |
| Slightly Stressful | Stress +1 | — |
| Quite Stressful | Stress +2, Fear +1 | Calm -2 |
| Extremely Stressful | Stress +3, Fear +2 | Cheer -2 |

Q23. How often do you spend quality time with friends or family?

| Social Time | Increase | Decrease |
| --- | --- | --- |
| Rarely | Tear +2, Rest +1 | Social -3 |
| Sometimes | Social +1 | — |
| Often | Social +3, Cheer +2 | Tear -2 |
| Very Often | Social +5, Cheer +3 | Fear -2 |

# Daily Check-in Mapping (Daily Ping)

## 1. Feeling (Choose up to 2)

| Feeling | Increase | Decrease |
| --- | --- | --- |
| Happy | Cheer +3 | Tear -3 |
| Excited | Cheer +3 | Rest -2 |
| Hopeful | Cheer +3, Calm +2 | Fear -2 |
| Calm | Calm +3 | Stress -3 |
| Stressed | Stress +3 | Calm -3 |
| Anxious | Fear +3, Stress +2 | Calm -2 |
| Worried | Fear +3 | Cheer -2 |
| Sad | Tear +3 | Cheer -3 |
| Tired | Rest +3 | Cheer -2 |
| Lonely | Tear +2, Social +3 | Cheer -2 |

## 2. Sleep Time

| Sleep Hours | Increase | Decrease |
| --- | --- | --- |
| Less than 5 | Rest +3, Stress +2 | Calm -2 |
| 5–6 | Rest +2 | — |
| 7–9 | Calm +3, Cheer +2 | Stress -2 |
| More than 9 | Rest +2 | - |

## 3. Work / Study Hours

| Hours | Increase | Decrease |
| --- | --- | --- |
| 0–3 | Rest +2 | Stress -2 |
| 4–7 | No Change | No Change |
| 8–10 | Stress +3 | Calm -2 |
| >10 | Stress +3, Rest +2 | Cheer -2 |

# Daily Score Decay

To prevent scores from staying too high forever:

At the beginning of each day, Every Emochi moves **1 point toward 50. (-1)**

# Design

[ AI prompts for each character](AI%20prompts%20for%20each%20character%203a6acb885ece8053b058f90b43698458.md)

[Assets](Assets%203a6acb885ece8059b614f855ce1fcdba.md)

# Pre-Hackathon Checklist

- [x]  app name
- [x]  character names
- [x]  character colors
- [x]  Write AI prompts for each character
- [x]  Write Judge prompt
- [x]  Finalize MBTI questions
- [x]  Finalize MBTI mapping
- [x]  Finalize character score calculation
- [x]  Define daily check-in effects
- [x]  Define outcome logging effects
- [x]  Define memory structure
- [x]  Consultation questions