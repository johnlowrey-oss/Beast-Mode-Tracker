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

## What's Been Implemented

### December 2025 - January 2026
- **Full-Stack Migration:** Converted HTML to React + FastAPI + MongoDB
- **AI Integration:** Gemini 2.5 Pro for recipes, motivation, and weekly coaching (via Emergent LLM Key)
- **Backend APIs:**
  - Habits tracking with streak calculation
  - Body metrics logging with Navy body fat formula
  - Supplement tracking
  - Protein, water, alcohol counters
  - Calorie target setting and tracking
  - Complete meal planning system (generate, save, update/swap)
  - Shopping list generation and tracking
  - Inventory management with full CRUD (add, edit, delete)
  - Prep task management for batch cooking
  - Prep alerts API - Returns urgency (NOW/TOMORROW) for upcoming prep
  - Today's smart suggestions based on prep status
  - Recipe scaling API - Returns individual or family portions
  - **Weekly Summary API** - Returns comprehensive weekly stats
  - **AI Weekly Coaching** - Generates personalized feedback based on stats
  - **Workout CRUD** - Full workout tracking with exercises
  - **Exercise Progress API** - Track progress for specific exercises
- **Frontend:**
  - Dashboard with all tracking widgets
  - Momentum section with 2-day rule tracking
  - Body Analytics with progress bars
  - Meal Planner modal with swap functionality
  - Shopping List modal with **Copy to Clipboard** feature
  - Prep Checklist modal
  - Inventory modal with manual editing
  - AI Response formatting for recipes
  - Calorie settings modal
  - Prep Alerts section - Urgent prep reminders on dashboard
  - Notification toggle - Enable/disable browser notifications
  - Recipe scaling buttons - Individual vs Family portion buttons
  - **Weekly Summary section** - 4 stat cards (Habits, Prep, Workouts, Body)
  - **Get AI Coaching button** - Personalized weekly feedback
  - **Workout Tracker section** - Today's workout display
  - **Log Workout modal** - Full workout logging with exercise suggestions

### Bug Fixes
- [FIXED] Meal swap UI not updating (Dec 2025)
- [FIXED] Shopping list toggle inventory bug (Dec 2025)
- [FIXED] Settings endpoint missing defaults (Dec 2025)

### New Features (Jan 2026)
- Manual inventory editing: Add items, edit quantities, delete items
- Ingredients auto-deducted from inventory when marking prep complete
- P1: Prep Day Reminders - Dashboard alerts for meals needing prep
- P2: Push Notifications - Browser notification support with service worker
- P2: Recipe Scaling - Individual vs Family serving size toggle
- **Weekly Summary Report** - Comprehensive weekly stats display
- **AI Weekly Coaching** - Get personalized AI feedback on your week
- **Workout Tracking** - Log workouts with exercises, sets, reps, weight
- **Exercise Progress Tracking** - Track progress on specific exercises
- **Shopping List Export** - Copy list to clipboard for easy sharing

## Architecture
```
/app/
├── backend/
│   ├── .env (MONGO_URL, DB_NAME, EMERGENT_LLM_KEY)
│   ├── meal_data.py (Extended meal library with metadata)
│   ├── server.py (FastAPI with all APIs)
│   └── tests/
│       ├── test_inventory_features.py
│       ├── test_prep_alerts_and_recipe_scaling.py
│       └── test_weekly_summary_and_workouts.py
├── frontend/
│   ├── .env (REACT_APP_BACKEND_URL)
│   ├── public/
│   │   └── sw.js (Service worker for notifications)
│   └── src/
│       ├── App.js (Main app with all components)
│       └── App.css
└── memory/
    └── PRD.md
```

## Key API Endpoints
- `POST /api/meal-plan/generate` - Generate meal plan
- `POST /api/meal-plan/save` - Save meal plan
- `POST /api/meal-plan/update-meal` - Swap a meal in the plan
- `POST /api/meal-plan/mark-prepped` - Mark meal prepped (deducts ingredients)
- `GET /api/meal-plan/prep-alerts` - Get urgent prep reminders
- `GET /api/shopping-list/generate` - Generate shopping list
- `POST /api/shopping-list/toggle-purchased` - Toggle item (adds/removes from inventory)
- `POST /api/inventory/add` - Manually add item
- `POST /api/inventory/update` - Update item quantity
- `DELETE /api/inventory/{item_name}` - Remove item
- `POST /api/ai/recipe` - Generate recipe (with servings: individual/family)
- `POST /api/ai/motivation` - Get motivational message
- `GET /api/summary/weekly` - Get weekly summary stats
- `POST /api/ai/weekly-coaching` - Get AI coaching feedback
- `GET /api/workouts` - Get recent workouts
- `POST /api/workouts` - Log a workout
- `GET /api/workouts/progress/{exercise}` - Get exercise progress

## Database Collections
- `habits` - Daily habit tracking
- `metrics` - Body measurements
- `settings` - User settings and counters
- `supplements` - Supplement list
- `meal_plan` - Saved meal plan
- `shopping_list` - Shopping list items
- `inventory` - Purchased ingredients
- `workouts` - Workout log entries

## 3rd Party Integrations
- **Google Gemini 2.5 Pro** via `emergentintegrations` library using Emergent LLM Key

## Prioritized Backlog

### P0-P2 - COMPLETED
- [x] Meal swap UI update bug
- [x] Shopping list toggle inventory bug
- [x] Manual inventory editing
- [x] Prep Day Reminders
- [x] Push Notifications
- [x] Recipe scaling UI
- [x] Weekly Summary Report
- [x] Workout Tracking
- [x] Shopping list copy to clipboard

### P3 (Low Priority/Future)
- [ ] Integration with grocery delivery APIs (Target, etc.)
- [ ] Progress photo tracking
- [ ] Exercise progress graphs/charts

## Refactoring Needed
- [ ] Break down App.js (2200+ lines) into smaller components
