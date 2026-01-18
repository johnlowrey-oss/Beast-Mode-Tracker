# Beast Transformation Hub - Product Requirements Document

## Original Problem Statement
Transform a single HTML file into a full-stack "Beast Transformation Hub" application. This personal app is designed to help the user track, organize, plan, and get motivation for his fitness goals.

## User Persona
Working father with 2 kids, working towards 12% body fat goal.

## Core Requirements
1. **Full Stack Application:** React frontend + FastAPI backend + MongoDB
2. **Core Tracking:** Habits, body metrics (weight, body fat), supplement intake, protein, and water consumption
3. **AI-Powered Features:** Motivational quotes, recipe generation, and weekly coaching feedback using Gemini via Emergent LLM Key
4. **Advanced Meal Planning:**
   - Plan meals 1-4 weeks in advance
   - System suggests meals but allows manual overrides (shuffle/swap)
   - Generate shopping list from meal plan
   - Inventory system to track purchased ingredients
   - Smart meal suggestions based on available inventory
   - Flag meals requiring advance preparation
   - Recipe scaling for family vs. individual portions
5. **Caloric Intake Management:** Set daily targets, suggest meals to meet targets
6. **Weekly Summary & Workout Tracking:** Track weekly stats and log workouts
7. **Intuitive Workflow:** Onboarding, Today's Focus section, seamless navigation

## Optimized User Workflow

### Day 1: First Time User
1. **Onboarding Modal** walks user through:
   - Step 1: Set calorie target (4 preset options)
   - Step 2: Generate meal plan (1-4 weeks)
   - Step 3: Welcome with daily flow explanation
2. User starts with populated dashboard

### Weekly Planning (Sunday)
1. Open "Plan Meals" → Select weeks → Generate
2. Review meals, swap any disliked ones
3. **"Next: View Shopping List"** button guides to shopping
4. Copy list to phone if needed

### Shopping Day
1. Use "Shop" quick action → Check items off
2. Items auto-add to inventory
3. Uncheck if mistake → auto-removes from inventory

### Prep Day
1. See "Prep Reminders" on dashboard
2. Click **"Recipe"** button directly from prep task
3. Mark done → Ingredients deducted

### Daily Flow
1. **Today's Focus** section at top shows:
   - Habit toggle (one click)
   - Workout toggle (opens logger)
   - Meals status (quick glance)
2. **Goal Progress bar** shows BF% progress toward 12% goal
3. Quick actions for Meals, Shop, Prep
4. Log workout (auto-fills from schedule)

### Weekly Review
1. Weekly Summary shows: Habits %, Prep %, Workouts, Body change
2. "Get AI Coaching" for personalized feedback

## What's Been Implemented

### December 2025 - January 2026
- **Full-Stack Migration:** Converted HTML to React + FastAPI + MongoDB
- **AI Integration:** Gemini 2.5 Pro for recipes, motivation, and weekly coaching
- **Backend APIs:** Complete CRUD for all features
- **Frontend:**
  - **Onboarding flow** (3-step setup for new users)
  - **Goal Progress bar** (BF% → 12% goal visualization)
  - **Today's Focus section** (Habit toggle, Workout toggle, Meals status)
  - **Quick action buttons** (Meals, Shop, Prep)
  - Dashboard with all tracking widgets
  - Meal Planner with **"Next: View Shopping List"** navigation
  - Prep Checklist with **Recipe buttons** for each task
  - Shopping List with Copy to Clipboard
  - Inventory modal with full CRUD
  - Weekly Summary with AI Coaching
  - Workout Tracker with auto-fill from schedule

### Bug Fixes
- [FIXED] Meal swap UI not updating
- [FIXED] Shopping list toggle inventory bug
- [FIXED] Settings endpoint missing defaults
- [FIXED] Daily habit toggle API endpoint
- [FIXED] Recipe button React state timing issue

## Architecture
```
/app/
├── backend/
│   ├── server.py (FastAPI with all APIs)
│   └── meal_data.py (Extended meal library)
├── frontend/
│   ├── public/sw.js (Service worker)
│   └── src/App.js (Main app)
└── memory/PRD.md
```

## Key API Endpoints
- Meal planning: generate, save, update-meal, mark-prepped, prep-alerts
- Shopping: generate, save, toggle-purchased
- Inventory: add, update, delete
- AI: recipe (with scaling), motivation, weekly-coaching
- Summary: weekly
- Workouts: CRUD + progress tracking

## 3rd Party Integrations
- **Google Gemini 2.5 Pro** via Emergent LLM Key

## Prioritized Backlog - COMPLETED
- [x] All P0-P2 features
- [x] UX workflow improvements
- [x] Onboarding flow
- [x] Goal progress visualization
- [x] Today's Focus section
- [x] Recipe buttons in Prep Checklist
- [x] Navigation improvements

## Future Enhancements (P3)
- [ ] Exercise progress charts/graphs
- [ ] Progress photo tracking
- [ ] Grocery delivery API integration
