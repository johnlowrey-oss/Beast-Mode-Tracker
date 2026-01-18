# 🦁 Beast Transformation Hub

**Your personal physique transformation command center** - Built for working fathers pursuing elite physical performance and longevity.

## 🎯 Overview

Beast Transformation Hub is a comprehensive fitness tracking application designed specifically for busy fathers working towards their physique goals. Based on science-backed periodization principles and optimized for your 4-year transformation journey to 12% body fat.

### Key Features

#### 💪 Momentum Tracking
- **7-Day Habit Grid** with visual streak counter
- **2-Day Rule Enforcement** - Never miss twice in a row (visual warnings when rule is broken)
- Instant habit toggle for daily workout completion
- Streak calculation with consecutive miss tracking

#### 📊 Body Analytics Dashboard
- Real-time body fat percentage tracking (Navy Method calculation)
- Weight progression monitoring
- Daily protein intake tracking (200g target)
- Progress bar towards 12% body fat goal
- Quick add/subtract protein buttons (+25g increments)

#### 🏋️ Today's Blueprint
- Dynamic workout scheduling based on Upper/Lower split
- Sunday: Prep & Rest
- Monday: Lower A (Quads) - Hack Squat, Walking Lunges, Leg Extension, Hanging Leg Raises
- Tuesday: Upper A (Push) - Floor Press, Chest Supported Row, Seated OH Press, Face Pulls
- Wednesday: Zone 2 / Recovery
- Thursday: Lower B (Hinge) - Trap Bar Deadlift, Romanian Deadlift, Lying Leg Curl, Cable Crunch
- Friday: Upper B (Pull) - Incline DB Press, Neutral Lat Pulldown, Lateral Raise, Arm Isolation
- Saturday: Active Recovery
- **Tall Lifter Specific Cues** for optimal biomechanics

#### 💊 Supplement Protocol
- Creatine Monohydrate (5g daily)
- Vitamin D3 + K2 (2k-5k IU)
- Omega-3 Fish Oil (2-3g EPA/DHA)
- Magnesium Glycinate (200-400mg before bed)
- Interactive checklist with timing recommendations

#### 🍳 Nutrition Hub
- **Meal Library** with 9+ high-protein recipes
  - Breakfast: Beast Oats, Steak & Egg Scramble, Greek Yogurt Bowl
  - Lunch: Adult Lunchable, Tuna Greek Salad, Turkey Wrap
  - Dinner: Turkey Chili, Salsa Chicken, Sheet Pan Roasted Meat & Veg
- **AI Recipe Generator** ✨ - Get detailed cooking instructions for any meal
- **Meal Selector** - Rotate through options with one click
- Macro information for each meal

#### 🤖 AI-Powered Features (Gemini 2.5 Pro)
- **Focus ✨** - Legacy-focused motivational coaching when you need it
- **Performance Audit ✨** - Data-driven analysis of your progress vs. 12% goal
- **Recipe Generator ✨** - Detailed meal prep instructions with family modifications
- **Smart Suggestions** - New meal recommendations based on macro targets

#### 📈 Metrics Logging
- Body fat calculator using Navy Method (waist + neck measurements)
- Historical tracking with date labels
- Visual timeline of weight and body fat progression
- Quick manual protein adjustments

#### 🗓️ Monthly Planner
- Custom workout scheduling
- Override default workout plan for specific dates
- Visual calendar with planned sessions

#### 📊 Statistics Tracking
- **Weekly Alcohol Counter** (3 drink limit for optimal hormone profile)
- **Hydration Tracker** (4L daily target)
- One-tap increment buttons
- Visual warnings when approaching limits

#### ⚡ Minimum Effective Dose (MED) Workout
For busy days when time is limited:
- Goblet Squats: 3x15
- Pushups: 3xMAX
- Dumbbell Rows: 3x15
- **20-minute total** - maintains neural drive and muscle tissue

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **MongoDB** - NoSQL database for flexible data storage
- **Motor** - Async MongoDB driver
- **emergentintegrations** - Unified LLM integration library
- **Google Gemini 2.5 Pro** - AI recipe generation, motivation, audits

### Frontend
- **React 19** - Modern UI library
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Clean, consistent icons
- **Axios** - HTTP client for API calls

### Infrastructure
- **MongoDB** running on localhost:27017
- **Backend API** on port 8001 with `/api` prefix
- **Frontend** on port 3000
- **Supervisor** for process management
- **Hot reload** enabled for both frontend and backend

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and Yarn
- Python 3.11+
- MongoDB instance

### Environment Setup

Backend `.env` file (`/app/backend/.env`):
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=sk-emergent-d45DaCc0fFeE35152E
```

Frontend `.env` file (`/app/frontend/.env`):
```bash
REACT_APP_BACKEND_URL=https://physique-hub.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### Running the Application

1. **Start all services:**
```bash
sudo supervisorctl restart all
```

2. **Check service status:**
```bash
sudo supervisorctl status
```

3. **View logs:**
```bash
# Backend logs
tail -f /var/log/supervisor/backend.*.log

# Frontend logs
tail -f /var/log/supervisor/frontend.*.log
```

## 📡 API Documentation

### Base URL
`https://physique-hub.preview.emergentagent.com/api`

### Endpoints

#### Habits
- `GET /habits` - Get all habit entries
- `POST /habits/toggle` - Toggle habit for a date
- `GET /habits/streak` - Get current streak and 2-day rule status

#### Metrics
- `GET /metrics` - Get all metric entries (sorted by timestamp)
- `POST /metrics` - Log new body metrics (weight, waist, neck)

#### Settings
- `GET /settings` - Get user settings
- `POST /settings` - Update user settings
- `POST /settings/protein/add` - Add 25g protein
- `POST /settings/protein/subtract` - Subtract 25g protein
- `POST /settings/water/add` - Add 0.5L water
- `POST /settings/alcohol/add` - Add 1 drink (max 3/week)
- `POST /settings/reset-weekly` - Reset weekly counters

#### Supplements
- `GET /supplements` - Get supplement list
- `POST /supplements/toggle?index={idx}` - Toggle supplement checked status
- `POST /supplements/add` - Add new supplement
- `DELETE /supplements/{index}` - Delete supplement

#### Meals
- `GET /meals/library` - Get complete meal library
- `POST /meals/select` - Select a meal for a category

#### Schedule
- `GET /schedule` - Get Beast workout schedule
- `GET /schedule/today` - Get today's workout plan

#### Planner
- `GET /planner` - Get all planner entries
- `POST /planner` - Update planner for a specific date

#### AI Features
- `POST /ai/recipe` - Generate detailed recipe
  ```json
  {
    "meal_name": "Beast Oats",
    "meal_blueprint": "ingredients...",
    "category": "breakfast"
  }
  ```
- `POST /ai/motivation` - Get motivational coaching
  ```json
  {
    "prompt": "I need motivation",
    "context": "Working father staying consistent"
  }
  ```
- `POST /ai/audit` - Run performance audit (analyzes recent metrics)
- `POST /ai/suggest-recipes?category={category}` - Get AI meal suggestions

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6) - Actions, progress
- **Success**: Emerald (#10b981) - Completed habits, supplements
- **Warning**: Yellow (#eab308) - Motivation, focus
- **Danger**: Red (#ef4444) - Missed days, 2-day rule broken
- **Background**: Slate 900 (#0f172a)
- **Cards**: Slate 800 (#1e293b)

### Typography
- **Headers**: Oswald (Bold, Uppercase, Wide Tracking)
- **Body**: Inter (Clean, Modern)
- **Data**: Monospace for numbers

### Key Interactions
- **Habit Toggle**: Click any day in the 7-day grid
- **Quick Actions**: +25g protein, +0.5L water, +1 drink
- **AI Generation**: Click "Draft ✨" on any meal card
- **Navigation**: Bottom nav with 6 primary actions

## 📚 Science-Based Framework

### Nutrition Targets
- **Protein**: 200g daily (1.6-2.2g/kg body weight)
- **Carbs**: Peri-workout focused (0.3-0.4g/lb)
- **Fats**: Hormonal health (0.3-0.4g/lb)
- **Alcohol**: Max 3 drinks/week (never post-workout or before bed)
- **Hydration**: 4L daily

### Training Split (Year 1: Foundation)
- **Upper/Lower 4x/week** - Optimal frequency for busy fathers
- **Progressive Overload**: Double progression model
- **Exercise Selection**: Tall lifter optimized (Floor Press, Hack Squat, Trap Bar DL)
- **Recovery**: 3 rest/recovery days per week

### Body Composition
- **Current**: Starting phase
- **Goal**: 12% body fat (8-pack visible)
- **Method**: Navy body fat calculation (waist - neck measurement)
- **Timeline**: 4-year periodization (Foundation → Hypertrophy → Strength → Refinement)

### Habit Psychology
- **2-Day Rule**: Never skip twice in a row (one skip = rest, two skips = quitting)
- **MED Workout**: 20-minute fallback for chaotic days
- **B-Minus Philosophy**: Consistency > perfection

## 🔐 Data Storage

All data is stored in MongoDB with the following collections:

- `habits` - Daily workout completion (keyed by date)
- `metrics` - Body measurements and calculated body fat %
- `settings` - User preferences, protein/water/alcohol counters, selected meals
- `supplements` - Supplement checklist
- `planner` - Custom workout scheduling

### Data Persistence
- Single user mode (no authentication required)
- All data persists across sessions
- Weekly counters can be manually reset

## 🎯 Roadmap Integration

The app displays your current phase: **Year 1: Foundation**

**4-Year Periodization:**
1. **Year 1**: Foundation & Recomposition (15% BF target)
2. **Year 2**: Hypertrophy & Volume Accumulation
3. **Year 3**: Strength & Density
4. **Year 4**: Refinement & Advanced Aesthetics (12% BF, 8-pack)

## 🤝 Contributing

This is a personal transformation tool optimized for your specific goals. Future enhancements:
- Weekly reset automation (Sunday night)
- Progress photos integration
- Workout logging with weight tracking
- Advanced analytics and trends
- Family meal scaling calculator

## 📝 Notes

### AI Features
- Powered by **Gemini 2.5 Pro** via Emergent Universal Key
- Recipe generation includes family modifications
- Motivation is legacy-focused and stoic
- Performance audits analyze recent data trends

### Workout Cues (Tall Lifter Specific)
- **Floor Press**: Protects shoulders, allows heavy loading
- **Hack Squat**: Stabilizes spine, targets quads
- **Trap Bar Deadlift**: Safer mechanics than conventional
- **Hanging Leg Raises**: Longer torso = more tension on abs

### Meal Prep System
- **Sunday**: Batch prep 5x Beast Oats, Cook Turkey Chili
- **Modular Dinners**: Dad version + Family version
- **Automation**: Breakfast and lunch fully prepped
- **High Protein Focus**: Every meal hits 35g+ protein

## 🏆 Success Metrics

Track your transformation through:
- ✅ Consecutive workout streak
- 📉 Body fat % trending toward 12%
- 💪 Daily protein consistently hitting 200g
- 🎯 Zero 2-day rule violations
- 📊 Weekly metrics logged consistently

---

**Built with** ❤️ **for fathers who refuse to settle for "dad bod"**

*"The 2-Day Rule stands: Never miss twice. One day is rest. Two is the birth of a weak habit you will pass down."*
