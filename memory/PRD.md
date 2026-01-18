# Beast Transformation Hub - Product Requirements Document

## Original Problem Statement
Transform a single HTML file into a full-stack "Beast Transformation Hub" application. This personal app is designed to help the user track, organize, plan, and get motivation for his fitness goals.

## User Persona
Working father with 2 kids, working towards 12% body fat goal.

## Core Requirements
1. **Full Stack Application:** React frontend + FastAPI backend + MongoDB
2. **Core Tracking:** Habits, body metrics (weight, body fat), supplement intake, protein, and water consumption
3. **AI-Powered Features:** Motivational quotes and recipe generation using Gemini via Emergent LLM Key
4. **Advanced Meal Planning:**
   - Plan meals 1-4 weeks in advance
   - System suggests meals but allows manual overrides (shuffle/swap)
   - Generate shopping list from meal plan
   - Inventory system to track purchased ingredients
   - Smart meal suggestions based on available inventory
   - Flag meals requiring advance preparation
   - Recipe scaling for family vs. individual portions
5. **Caloric Intake Management:** Set daily targets, suggest meals to meet targets

## What's Been Implemented

### December 2025
- **Full-Stack Migration:** Converted HTML to React + FastAPI + MongoDB
- **AI Integration:** Gemini 2.5 Pro for recipes and motivation (via Emergent LLM Key)
- **Backend APIs:**
  - Habits tracking with streak calculation
  - Body metrics logging with Navy body fat formula
  - Supplement tracking
  - Protein, water, alcohol counters
  - Calorie target setting and tracking
  - Complete meal planning system (generate, save, update/swap)
  - Shopping list generation and tracking
  - Inventory management (auto-add when purchased)
  - Prep task management for batch cooking
  - Today's smart suggestions based on prep status
- **Frontend:**
  - Dashboard with all tracking widgets
  - Momentum section with 2-day rule tracking
  - Body Analytics with progress bars
  - Meal Planner modal with swap functionality (FIXED)
  - Shopping List modal
  - Prep Checklist modal
  - Inventory modal
  - AI Response formatting for recipes
  - Calorie settings modal

### Bug Fixes
- [FIXED] Meal swap UI not updating (Dec 2025) - Root cause: `setMealPlan` wasn't passed to MealPlannerModal component

## Architecture
```
/app/
├── backend/
│   ├── .env (MONGO_URL, DB_NAME, EMERGENT_LLM_KEY)
│   ├── meal_data.py (Extended meal library with metadata)
│   └── server.py (FastAPI with all APIs)
├── frontend/
│   ├── .env (REACT_APP_BACKEND_URL)
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
- `GET /api/shopping-list/generate` - Generate shopping list
- `POST /api/ai/recipe` - Generate recipe using AI
- `POST /api/ai/motivation` - Get motivational message

## Database Collections
- `habits` - Daily habit tracking
- `metrics` - Body measurements
- `settings` - User settings and counters
- `supplements` - Supplement list
- `meal_plan` - Saved meal plan
- `shopping_list` - Shopping list items
- `inventory` - Purchased ingredients

## 3rd Party Integrations
- **Google Gemini 2.5 Pro** via `emergentintegrations` library using Emergent LLM Key

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Meal swap UI update bug

### P1 (High Priority)
- [ ] Shopping List Generation UI improvements
- [ ] Prep Day Reminders - Highlight meals needing advance prep

### P2 (Medium Priority)
- [ ] Inventory Management System - Manual add/remove items
- [ ] Smart Meal Suggestions based on inventory
- [ ] Push Notifications for prep reminders
- [ ] Recipe scaling UI for family portions

### P3 (Low Priority/Future)
- [ ] Integration with grocery delivery APIs (Target, etc.)
- [ ] Workout tracking integration
- [ ] Progress photo tracking
- [ ] Social sharing of progress

## Refactoring Needed
- [ ] Break down App.js (1400+ lines) into smaller components:
  - MealPlannerModal.js
  - ShoppingListModal.js
  - DashboardWidgets.js
  - etc.
