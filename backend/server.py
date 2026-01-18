from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import math
from collections import defaultdict
from meal_data import EXTENDED_MEAL_LIBRARY, SHOPPING_CATEGORIES, PREP_DAYS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Get Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# ==================== MODELS ====================

class HabitEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: str  # YYYY-MM-DD format
    completed: bool = False

class MetricEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: str
    weight: float
    waist: float
    neck: float
    body_fat: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Supplement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    time: str
    checked: bool = False

class MealInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    macros: str
    blueprint: str
    category: str  # breakfast, lunch, dinner

class UserSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    protein_target: int = 200
    protein_current: int = 0
    calorie_target: int = 2400  # NEW: Daily calorie target
    calorie_current: int = 0     # NEW: Calories consumed today
    water_liters: float = 0.0
    alcohol_count: int = 0
    selected_meals: Dict[str, Any] = {}

class PlannerEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: str
    activity: str

class AIRequest(BaseModel):
    prompt: str
    context: Optional[str] = None

class RecipeRequest(BaseModel):
    meal_name: str
    meal_blueprint: str
    category: str

# ==================== NEW MEAL PLANNING MODELS ====================

class MealPlanEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: str  # YYYY-MM-DD
    meal_type: str  # breakfast, lunch, dinner
    meal_id: str
    meal_name: str
    is_prepped: bool = False
    prep_date: Optional[str] = None

class ShoppingListItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item: str
    amount: str
    category: str
    purchased: bool = False
    meal_ids: List[str] = []

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item: str
    amount: str
    category: str
    purchased_date: str
    expiry_date: Optional[str] = None

class PrepTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    meal_id: str
    meal_name: str
    batch_size: int
    prep_day: str
    completed: bool = False
    serves_dates: List[str] = []

class PlanWeeksRequest(BaseModel):
    weeks: int  # 1-4 weeks
    start_date: Optional[str] = None

class MealSelectionRequest(BaseModel):
    date: str
    meal_type: str
    meal_id: str

# ==================== MEAL LIBRARY ====================

# Use extended meal library from meal_data.py
MEAL_LIBRARY = {
    category: [
        {k: v for k, v in meal.items() if k in ['id', 'name', 'macros', 'blueprint', 'category']}
        for meal in meals
    ]
    for category, meals in EXTENDED_MEAL_LIBRARY.items()
}

# ==================== SUPPLEMENT DEFAULTS ====================

DEFAULT_SUPPS = [
    {"name": "Creatine Monohydrate", "time": "5g: Morning/Post-Lift", "checked": False},
    {"name": "Vitamin D3 + K2", "time": "2k-5k IU: Morning", "checked": False},
    {"name": "Omega-3 Fish Oil", "time": "2-3g: With Meals", "checked": False},
    {"name": "Magnesium Glycinate", "time": "200-400mg: 1hr Before Bed", "checked": False}
]

# ==================== WORKOUT SCHEDULE ====================

BEAST_SCHEDULE = [
    {"day": "Sunday", "type": "Prep & Rest", "tasks": ["Batch Prep 5x Beast Oats", "Cook 2lbs Turkey Chili", "Weekly Plan Audit", "Family Time"]},
    {"day": "Monday", "type": "Lower A (Quads)", "tasks": ["Hack Squat: 3x8-10", "Walking Lunges: 3x12 per leg", "Leg Extension: 3x15", "Hanging Leg Raise: 3x15"]},
    {"day": "Tuesday", "type": "Upper A (Push)", "tasks": ["Floor Press: 3x6-8", "Chest Supported Row: 3x10", "Seated DB OH Press: 3x10", "Face Pulls: 3x15"]},
    {"day": "Wednesday", "type": "Zone 2 / Recovery", "tasks": ["45-60m Rucking (25lb vest)", "Mobility Flow 15min", "High Protein Focus", "Family Activity"]},
    {"day": "Thursday", "type": "Lower B (Hinge)", "tasks": ["Trap Bar Deadlift: 3x6-8", "Romanian Deadlift: 3x10", "Lying Leg Curl: 3x15", "Cable Crunch: 3x15"]},
    {"day": "Friday", "type": "Upper B (Pull)", "tasks": ["Incline DB Press: 3x10", "Neutral Lat Pulldown: 3x10", "Lateral Raise: 4x20", "Tricep Pushdowns + Bicep Curls: 3x12"]},
    {"day": "Saturday", "type": "Active Recovery", "tasks": ["Family Outing (Park, Hike)", "Light Activity", "Meal Prep Start", "Mobility Work"]}
]

# ==================== HELPER FUNCTIONS ====================

def calculate_body_fat_navy(waist: float, neck: float, height: float = 75.0) -> float:
    """Calculate body fat % using Navy method. Default height 75 inches (6'3")"""
    bf = (86.010 * math.log10(waist - neck) - 70.041 * math.log10(height) + 36.76)
    return round(max(0, min(100, bf)), 1)

async def get_ai_response(prompt: str, system_message: str) -> str:
    """Get AI response using Emergent LLM Key with Gemini"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI key not configured")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"beast-{datetime.now().timestamp()}",
            system_message=system_message
        ).with_model("gemini", "gemini-2.5-pro")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logging.error(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Beast Transformation Hub API", "status": "online"}

# ========== HABITS ==========

@api_router.get("/habits")
async def get_habits():
    """Get all habit entries"""
    habits_doc = await db.habits.find_one({"_id": "user_habits"})
    if not habits_doc:
        return {"habits": {}}
    habits = habits_doc.get("habits", {})
    return {"habits": habits}

@api_router.post("/habits/toggle")
async def toggle_habit(entry: HabitEntry):
    """Toggle a habit for a specific date"""
    habits_doc = await db.habits.find_one({"_id": "user_habits"})
    habits = habits_doc.get("habits", {}) if habits_doc else {}
    
    habits[entry.date] = entry.completed
    
    await db.habits.update_one(
        {"_id": "user_habits"},
        {"$set": {"habits": habits}},
        upsert=True
    )
    
    return {"success": True, "date": entry.date, "completed": entry.completed}

@api_router.get("/habits/streak")
async def get_streak():
    """Calculate current streak and check 2-day rule"""
    habits_doc = await db.habits.find_one({"_id": "user_habits"})
    habits = habits_doc.get("habits", {}) if habits_doc else {}
    
    today = datetime.now()
    streak = 0
    misses = 0
    rule_broken = False
    
    for i in range(30):  # Check last 30 days
        check_date = today - timedelta(days=i)
        date_key = check_date.strftime("%Y-%m-%d")
        
        if habits.get(date_key, False):
            streak += 1
            misses = 0
        else:
            if check_date.date() < today.date():  # Only count past days
                misses += 1
                if misses >= 2:
                    rule_broken = True
                    break
            streak = 0 if i > 0 else streak
    
    return {
        "streak": streak,
        "rule_broken": rule_broken,
        "consecutive_misses": misses
    }

# ========== METRICS ==========

@api_router.get("/metrics", response_model=List[MetricEntry])
async def get_metrics():
    """Get all metric entries"""
    metrics = await db.metrics.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return metrics

@api_router.post("/metrics", response_model=MetricEntry)
async def add_metric(entry: MetricEntry):
    """Add a new metric entry"""
    entry_dict = entry.model_dump()
    await db.metrics.insert_one(entry_dict)
    return entry

# ========== USER SETTINGS ==========

@api_router.get("/settings")
async def get_settings():
    """Get user settings"""
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    if not settings_doc:
        # Return defaults with meal library
        return {
            "protein_target": 200,
            "protein_current": 0,
            "calorie_target": 2400,
            "calorie_current": 0,
            "water_liters": 0.0,
            "alcohol_count": 0,
            "selected_meals": {
                "breakfast": MEAL_LIBRARY["breakfast"][0],
                "lunch": MEAL_LIBRARY["lunch"][0],
                "dinner": MEAL_LIBRARY["dinner"][0]
            }
        }
    
    settings = {k: v for k, v in settings_doc.items() if k != "_id"}
    # Ensure calorie fields exist
    if "calorie_target" not in settings:
        settings["calorie_target"] = 2400
    if "calorie_current" not in settings:
        settings["calorie_current"] = 0
    return settings

@api_router.post("/settings")
async def update_settings(settings: UserSettings):
    """Update user settings"""
    settings_dict = settings.model_dump()
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": settings_dict},
        upsert=True
    )
    return {"success": True}

@api_router.post("/settings/protein/add")
async def add_protein(amount: int = 25):
    """Add protein (default 25g)"""
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    current = settings_doc.get("protein_current", 0) if settings_doc else 0
    new_amount = min(400, current + amount)
    
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": {"protein_current": new_amount}},
        upsert=True
    )
    return {"protein_current": new_amount}

@api_router.post("/settings/protein/subtract")
async def subtract_protein(amount: int = 25):
    """Subtract protein (default 25g)"""
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    current = settings_doc.get("protein_current", 0) if settings_doc else 0
    new_amount = max(0, current - amount)
    
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": {"protein_current": new_amount}},
        upsert=True
    )
    return {"protein_current": new_amount}

@api_router.post("/settings/water/add")
async def add_water():
    """Add 0.5L water"""
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    current = settings_doc.get("water_liters", 0.0) if settings_doc else 0.0
    new_amount = min(8.0, current + 0.5)
    
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": {"water_liters": new_amount}},
        upsert=True
    )
    return {"water_liters": new_amount}

@api_router.post("/settings/alcohol/add")
async def add_alcohol():
    """Add 1 drink (max 3/week)"""
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    current = settings_doc.get("alcohol_count", 0) if settings_doc else 0
    
    if current >= 3:
        raise HTTPException(status_code=400, detail="Weekly alcohol limit reached (3 drinks max)")
    
    new_amount = current + 1
    
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": {"alcohol_count": new_amount}},
        upsert=True
    )
    return {"alcohol_count": new_amount}

@api_router.post("/settings/reset-weekly")
async def reset_weekly_counters():
    """Reset weekly counters (alcohol, water)"""
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": {"alcohol_count": 0, "water_liters": 0.0, "protein_current": 0, "calorie_current": 0}},
        upsert=True
    )
    return {"success": True}

@api_router.post("/settings/calorie/add")
async def add_calories(amount: int):
    """Add calories consumed"""
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    current = settings_doc.get("calorie_current", 0) if settings_doc else 0
    new_amount = current + amount
    
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": {"calorie_current": new_amount}},
        upsert=True
    )
    return {"calorie_current": new_amount}

@api_router.post("/settings/calorie/set-target")
async def set_calorie_target(target: int):
    """Set daily calorie target"""
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": {"calorie_target": target}},
        upsert=True
    )
    return {"calorie_target": target}

# ========== SUPPLEMENTS ==========

@api_router.get("/supplements")
async def get_supplements():
    """Get supplement list"""
    supps_doc = await db.supplements.find_one({"_id": "user_supplements"})
    if not supps_doc:
        return {"supplements": DEFAULT_SUPPS}
    return {"supplements": supps_doc.get("supplements", DEFAULT_SUPPS)}

@api_router.post("/supplements/toggle")
async def toggle_supplement(index: int):
    """Toggle supplement checked status"""
    supps_doc = await db.supplements.find_one({"_id": "user_supplements"})
    supps = supps_doc.get("supplements", DEFAULT_SUPPS) if supps_doc else DEFAULT_SUPPS.copy()
    
    if 0 <= index < len(supps):
        supps[index]["checked"] = not supps[index].get("checked", False)
    
    await db.supplements.update_one(
        {"_id": "user_supplements"},
        {"$set": {"supplements": supps}},
        upsert=True
    )
    
    return {"supplements": supps}

@api_router.post("/supplements/add")
async def add_supplement(supplement: Supplement):
    """Add a new supplement"""
    supps_doc = await db.supplements.find_one({"_id": "user_supplements"})
    supps = supps_doc.get("supplements", DEFAULT_SUPPS.copy()) if supps_doc else DEFAULT_SUPPS.copy()
    
    supps.append(supplement.model_dump())
    
    await db.supplements.update_one(
        {"_id": "user_supplements"},
        {"$set": {"supplements": supps}},
        upsert=True
    )
    
    return {"supplements": supps}

@api_router.delete("/supplements/{index}")
async def delete_supplement(index: int):
    """Delete a supplement"""
    supps_doc = await db.supplements.find_one({"_id": "user_supplements"})
    supps = supps_doc.get("supplements", DEFAULT_SUPPS.copy()) if supps_doc else DEFAULT_SUPPS.copy()
    
    if 0 <= index < len(supps):
        supps.pop(index)
    
    await db.supplements.update_one(
        {"_id": "user_supplements"},
        {"$set": {"supplements": supps}},
        upsert=True
    )
    
    return {"supplements": supps}

# ========== MEALS ==========

@api_router.get("/meals/library")
async def get_meal_library():
    """Get complete meal library"""
    return MEAL_LIBRARY

@api_router.post("/meals/select")
async def select_meal(meal: MealInfo):
    """Select a meal for a category"""
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    selected_meals = settings_doc.get("selected_meals", {}) if settings_doc else {}
    
    selected_meals[meal.category] = meal.model_dump()
    
    await db.settings.update_one(
        {"_id": "user_settings"},
        {"$set": {"selected_meals": selected_meals}},
        upsert=True
    )
    
    return {"success": True, "selected_meals": selected_meals}

# ========== PLANNER ==========

@api_router.get("/planner")
async def get_planner():
    """Get all planner entries"""
    planner_doc = await db.planner.find_one({"_id": "user_planner"})
    if not planner_doc:
        return {"planner": {}}
    return {"planner": planner_doc.get("planner", {})}

@api_router.post("/planner")
async def update_planner(entry: PlannerEntry):
    """Update planner for a specific date"""
    planner_doc = await db.planner.find_one({"_id": "user_planner"})
    planner = planner_doc.get("planner", {}) if planner_doc else {}
    
    planner[entry.date] = entry.activity
    
    await db.planner.update_one(
        {"_id": "user_planner"},
        {"$set": {"planner": planner}},
        upsert=True
    )
    
    return {"success": True}

@api_router.get("/schedule")
async def get_schedule():
    """Get the Beast workout schedule"""
    return {"schedule": BEAST_SCHEDULE}

@api_router.get("/schedule/today")
async def get_today_schedule():
    """Get today's workout plan"""
    today = datetime.now()
    day_name = today.strftime("%A")
    
    # Check if there's a custom plan first
    planner_doc = await db.planner.find_one({"_id": "user_planner"})
    if planner_doc:
        date_key = today.strftime("%Y-%m-%d")
        planner = planner_doc.get("planner", {})
        if date_key in planner:
            return {
                "day": day_name,
                "type": planner[date_key],
                "tasks": [f"Custom Session: {planner[date_key]}"],
                "custom": True
            }
    
    # Otherwise return default schedule
    for day_plan in BEAST_SCHEDULE:
        if day_plan["day"] == day_name:
            return {**day_plan, "custom": False}
    
    return {"day": day_name, "type": "Rest", "tasks": [], "custom": False}

# ========== AI FEATURES ==========

@api_router.post("/ai/recipe")
async def generate_recipe(req: RecipeRequest):
    """Generate a detailed recipe using AI"""
    system_message = """You are an expert meal prep coach for busy fathers focused on physique transformation. 
    Create detailed, practical recipes that are:
    - High in protein (key macro)
    - Simple to prep in bulk
    - Family-friendly with modular serving options
    - Include specific cooking instructions and prep time
    - List exact measurements and macros per serving"""
    
    prompt = f"""Generate a detailed recipe for: {req.meal_name}

Blueprint: {req.meal_blueprint}
Category: {req.category}

Please provide:
1. **Ingredients** (exact measurements)
2. **Prep Instructions** (step-by-step)
3. **Macros Per Serving** (calories, protein, carbs, fat)
4. **Meal Prep Tips** (how to batch cook and store)
5. **Family Modifications** (how to make it kid-friendly)

Focus on efficiency and high protein content for a 30-year-old father working towards 12% body fat."""
    
    response = await get_ai_response(prompt, system_message)
    return {"recipe": response}

@api_router.post("/ai/motivation")
async def get_motivation(req: AIRequest):
    """Get motivational coaching message"""
    system_message = """You are a stoic, no-nonsense strength coach for a 30-year-old father of two young kids.
    Your style is direct, powerful, and legacy-focused. You speak to the 'beast within' and remind him why he started.
    Keep responses under 100 words. Be impactful, not flowery."""
    
    context = req.context or "I'm tempted to skip today's workout"
    prompt = f"""Context: {context}

Give me a powerful 60-second motivational reminder about:
- Building a legacy for my kids
- The 2-day rule (never skip twice in a row)
- Why 12% body fat matters for longevity
- Being the strong father my kids deserve

Be direct. Be powerful. Make me want to attack the workout."""
    
    response = await get_ai_response(prompt, system_message)
    return {"message": response}

@api_router.post("/ai/audit")
async def performance_audit():
    """Generate performance audit based on recent metrics"""
    system_message = """You are a brutally honest bio-coach auditing physique progress toward 12% body fat.
    Analyze data objectively. Give hard truths. Provide actionable adjustments.
    Focus on: protein intake, training consistency, body fat trends, and lifestyle factors."""
    
    # Get recent metrics
    metrics = await db.metrics.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    habits_doc = await db.habits.find_one({"_id": "user_habits"})
    
    settings = settings_doc if settings_doc else {}
    habits = habits_doc.get("habits", {}) if habits_doc else {}
    
    # Calculate consistency
    today = datetime.now()
    last_7_days = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    workouts_completed = sum(1 for d in last_7_days if habits.get(d, False))
    
    data_summary = f"""
**Current Status:**
- Latest Body Fat: {metrics[0]['body_fat']}% (Goal: 12%)
- Latest Weight: {metrics[0]['weight']} lbs
- Daily Protein Target: {settings.get('protein_target', 200)}g
- Workouts Last 7 Days: {workouts_completed}/4 expected
- Metrics Tracked: {len(metrics)} entries

**Recent Trend:**
{chr(10).join([f"- {m['date']}: {m['weight']}lbs, {m['body_fat']}% BF" for m in metrics[:5]])}
"""
    
    prompt = f"""{data_summary}

Audit this data against the 12% body fat goal. Provide:
1. **Progress Assessment** (honest evaluation)
2. **Gap Analysis** (what's working, what's not)
3. **Adjustments Needed** (nutrition, training, recovery)
4. **Next 30-Day Focus** (1-2 key priorities)

Be direct. Give actionable feedback for a working father."""
    
    response = await get_ai_response(prompt, system_message)
    return {"audit": response}

@api_router.post("/ai/suggest-recipes")
async def suggest_recipes(category: str):
    """Get AI suggestions for new meal options"""
    system_message = """You are a nutrition coach specializing in high-protein meal prep for busy fathers.
    Suggest simple, delicious, family-friendly meals that hit macro targets."""
    
    macro_targets = {
        "breakfast": "450 cal, 35-40g protein",
        "lunch": "550 cal, 50-55g protein",
        "dinner": "700 cal, 60g protein"
    }
    
    target = macro_targets.get(category, "500 cal, 40g protein")
    
    prompt = f"""Suggest 3 new {category} meal ideas that meet these criteria:
- Target macros: {target}
- Simple ingredients (available at any grocery store)
- Can be batch prepped on Sunday
- Family-friendly (modular so kids can have their version)
- Cooking time under 30 minutes or slow cooker option

For each meal, provide:
1. Meal Name
2. Key Ingredients (5-7 items)
3. Prep Method (one sentence)
4. Why it works (protein quality, ease of prep)

Keep it practical for a working father with 2 kids under 2."""
    
    response = await get_ai_response(prompt, system_message)
    return {"suggestions": response}

# ========== MEAL PLANNING SYSTEM ==========

@api_router.get("/meals/library/extended")
async def get_extended_meal_library():
    """Get complete meal library with all metadata"""
    return EXTENDED_MEAL_LIBRARY

@api_router.post("/meal-plan/generate")
async def generate_meal_plan(req: PlanWeeksRequest):
    """Generate AI-suggested meal plan for 1-4 weeks optimized for caloric target"""
    weeks = max(1, min(4, req.weeks))
    start_date = datetime.fromisoformat(req.start_date) if req.start_date else datetime.now()
    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get user's calorie target
    settings_doc = await db.settings.find_one({"_id": "user_settings"})
    calorie_target = settings_doc.get("calorie_target", 2400) if settings_doc else 2400
    
    total_days = weeks * 7
    meal_plan = []
    
    # Get meal options
    all_breakfasts = EXTENDED_MEAL_LIBRARY["breakfast"]
    all_lunches = EXTENDED_MEAL_LIBRARY["lunch"]
    all_dinners = EXTENDED_MEAL_LIBRARY["dinner"]
    
    for day_offset in range(total_days):
        current_date = start_date + timedelta(days=day_offset)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Smart meal selection to hit calorie target
        # Target: breakfast ~450, lunch ~550, dinner ~700 for 2400 total (typical maintenance)
        # Adjust ratios based on user's target
        ratio = calorie_target / 2400
        
        # Select meals that best match the target
        breakfast = all_breakfasts[day_offset % len(all_breakfasts)]
        lunch = all_lunches[day_offset % len(all_lunches)]
        dinner = all_dinners[day_offset % len(all_dinners)]
        
        # Calculate daily total
        daily_calories = breakfast.get("calories", 0) + lunch.get("calories", 0) + dinner.get("calories", 0)
        
        meal_plan.extend([
            {
                "date": date_str, 
                "meal_type": "breakfast", 
                "meal_id": breakfast["id"], 
                "meal_name": breakfast["name"], 
                "is_prepped": False,
                "calories": breakfast.get("calories", 0),
                "protein": breakfast.get("protein", 0)
            },
            {
                "date": date_str, 
                "meal_type": "lunch", 
                "meal_id": lunch["id"], 
                "meal_name": lunch["name"], 
                "is_prepped": False,
                "calories": lunch.get("calories", 0),
                "protein": lunch.get("protein", 0)
            },
            {
                "date": date_str, 
                "meal_type": "dinner", 
                "meal_id": dinner["id"], 
                "meal_name": dinner["name"], 
                "is_prepped": False,
                "calories": dinner.get("calories", 0),
                "protein": dinner.get("protein", 0)
            }
        ])
    
    return {
        "meal_plan": meal_plan, 
        "weeks": weeks, 
        "start_date": start_date.strftime("%Y-%m-%d"),
        "daily_calorie_target": calorie_target
    }

@api_router.get("/meal-plan")
async def get_meal_plan():
    """Get saved meal plan"""
    plan_doc = await db.meal_plan.find_one({"_id": "user_meal_plan"})
    if not plan_doc:
        return {"meal_plan": [], "weeks": 0}
    return {"meal_plan": plan_doc.get("meals", []), "weeks": plan_doc.get("weeks", 0)}

@api_router.post("/meal-plan/save")
async def save_meal_plan(meal_plan: List[MealPlanEntry], weeks: int):
    """Save meal plan"""
    await db.meal_plan.update_one(
        {"_id": "user_meal_plan"},
        {"$set": {"meals": [m.model_dump() for m in meal_plan], "weeks": weeks}},
        upsert=True
    )
    return {"success": True}

@api_router.post("/meal-plan/update-meal")
async def update_meal_in_plan(req: MealSelectionRequest):
    """Update a specific meal in the plan"""
    plan_doc = await db.meal_plan.find_one({"_id": "user_meal_plan"})
    if not plan_doc:
        raise HTTPException(status_code=404, detail="No meal plan found")
    
    meals = plan_doc.get("meals", [])
    
    # Find and update the meal
    updated = False
    for meal in meals:
        if meal["date"] == req.date and meal["meal_type"] == req.meal_type:
            # Find meal details from extended library
            meal_data = None
            for category_meals in EXTENDED_MEAL_LIBRARY.values():
                for m in category_meals:
                    if m["id"] == req.meal_id:
                        meal_data = m
                        break
            
            if meal_data:
                meal["meal_id"] = req.meal_id
                meal["meal_name"] = meal_data["name"]
                meal["calories"] = meal_data.get("calories", 0)
                meal["protein"] = meal_data.get("protein", 0)
                meal["is_prepped"] = False
                updated = True
                break
    
    if updated:
        await db.meal_plan.update_one(
            {"_id": "user_meal_plan"},
            {"$set": {"meals": meals}}
        )
        return {"success": True, "updated_meal": req.meal_id}
    else:
        raise HTTPException(status_code=404, detail="Meal not found in plan")

@api_router.get("/meal-plan/prep-tasks")
async def get_prep_tasks():
    """Get all meals that need batch prep"""
    plan_doc = await db.meal_plan.find_one({"_id": "user_meal_plan"})
    if not plan_doc:
        return {"prep_tasks": []}
    
    meals = plan_doc.get("meals", [])
    prep_tasks = {}
    
    # Group meals by ID that need prep
    for meal_entry in meals:
        meal_id = meal_entry["meal_id"]
        
        # Find meal in extended library
        meal_data = None
        for category_meals in EXTENDED_MEAL_LIBRARY.values():
            for m in category_meals:
                if m["id"] == meal_id:
                    meal_data = m
                    break
        
        if meal_data and meal_data.get("batch_prep_friendly"):
            if meal_id not in prep_tasks:
                prep_tasks[meal_id] = {
                    "meal_id": meal_id,
                    "meal_name": meal_data["name"],
                    "batch_size": meal_data.get("batch_size", 1),
                    "prep_day": meal_data.get("prep_day_recommended", "Sunday"),
                    "prep_time_minutes": meal_data.get("prep_time_minutes", 0),
                    "shelf_life_days": meal_data.get("shelf_life_days", 3),
                    "serves_dates": [],
                    "completed": meal_entry.get("is_prepped", False)
                }
            prep_tasks[meal_id]["serves_dates"].append(meal_entry["date"])
    
    return {"prep_tasks": list(prep_tasks.values())}

@api_router.post("/meal-plan/mark-prepped")
async def mark_meal_prepped(meal_id: str, dates: List[str]):
    """Mark a batch-prepped meal as ready for specific dates"""
    plan_doc = await db.meal_plan.find_one({"_id": "user_meal_plan"})
    if not plan_doc:
        raise HTTPException(status_code=404, detail="No meal plan found")
    
    meals = plan_doc.get("meals", [])
    prep_date = datetime.now().strftime("%Y-%m-%d")
    
    # Update all matching meals
    for meal in meals:
        if meal["meal_id"] == meal_id and meal["date"] in dates:
            meal["is_prepped"] = True
            meal["prep_date"] = prep_date
    
    await db.meal_plan.update_one(
        {"_id": "user_meal_plan"},
        {"$set": {"meals": meals}}
    )
    
    return {"success": True}

@api_router.get("/shopping-list/generate")
async def generate_shopping_list():
    """Generate shopping list from meal plan"""
    plan_doc = await db.meal_plan.find_one({"_id": "user_meal_plan"})
    if not plan_doc:
        return {"shopping_list": []}
    
    meals = plan_doc.get("meals", [])
    
    # Aggregate ingredients
    ingredient_totals = defaultdict(lambda: {"amount": [], "category": "", "meal_ids": set()})
    
    for meal_entry in meals:
        # Find meal in extended library
        meal_data = None
        for category_meals in EXTENDED_MEAL_LIBRARY.values():
            for m in category_meals:
                if m["id"] == meal_entry["meal_id"]:
                    meal_data = m
                    break
        
        if meal_data:
            for ingredient in meal_data.get("ingredients", []):
                item_name = ingredient["item"]
                ingredient_totals[item_name]["amount"].append(ingredient["amount"])
                ingredient_totals[item_name]["category"] = ingredient["category"]
                ingredient_totals[item_name]["meal_ids"].add(meal_entry["meal_id"])
    
    # Convert to list format
    shopping_list = []
    for item, data in ingredient_totals.items():
        shopping_list.append({
            "item": item,
            "amount": ", ".join(set(data["amount"])),  # Combine amounts
            "category": data["category"],
            "purchased": False,
            "meal_ids": list(data["meal_ids"])
        })
    
    # Sort by category
    category_order = {cat: i for i, cat in enumerate(SHOPPING_CATEGORIES)}
    shopping_list.sort(key=lambda x: category_order.get(x["category"], 99))
    
    return {"shopping_list": shopping_list}

@api_router.post("/shopping-list/save")
async def save_shopping_list(items: List[ShoppingListItem]):
    """Save shopping list"""
    await db.shopping_list.update_one(
        {"_id": "user_shopping_list"},
        {"$set": {"items": [item.model_dump() for item in items]}},
        upsert=True
    )
    return {"success": True}

@api_router.get("/shopping-list")
async def get_shopping_list():
    """Get saved shopping list"""
    list_doc = await db.shopping_list.find_one({"_id": "user_shopping_list"})
    if not list_doc:
        return {"items": []}
    return {"items": list_doc.get("items", [])}

@api_router.post("/shopping-list/toggle-purchased")
async def toggle_purchased(item_index: int):
    """Toggle purchased status of shopping list item"""
    list_doc = await db.shopping_list.find_one({"_id": "user_shopping_list"})
    if not list_doc:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    
    items = list_doc.get("items", [])
    if 0 <= item_index < len(items):
        was_purchased = items[item_index].get("purchased", False)
        items[item_index]["purchased"] = not was_purchased
        
        item_name = items[item_index]["item"]
        
        if items[item_index]["purchased"]:
            # Add to inventory when checking off
            inventory_item = {
                "item": item_name,
                "amount": items[item_index]["amount"],
                "category": items[item_index]["category"],
                "purchased_date": datetime.now().strftime("%Y-%m-%d"),
                "expiry_date": None
            }
            await db.inventory.insert_one(inventory_item)
        else:
            # Remove from inventory when unchecking (bug fix)
            await db.inventory.delete_one({"item": item_name})
    
    await db.shopping_list.update_one(
        {"_id": "user_shopping_list"},
        {"$set": {"items": items}}
    )
    
    return {"success": True, "items": items}

@api_router.get("/inventory")
async def get_inventory():
    """Get current food inventory"""
    inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return {"inventory": inventory}

# ========== INVENTORY MANAGEMENT ==========

class InventoryAddRequest(BaseModel):
    item: str
    amount: str
    category: str

class InventoryUpdateRequest(BaseModel):
    item: str
    amount: str

@api_router.post("/inventory/add")
async def add_inventory_item(req: InventoryAddRequest):
    """Manually add an item to inventory"""
    inventory_item = {
        "item": req.item,
        "amount": req.amount,
        "category": req.category,
        "purchased_date": datetime.now().strftime("%Y-%m-%d"),
        "expiry_date": None
    }
    await db.inventory.insert_one(inventory_item)
    inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return {"success": True, "inventory": inventory}

@api_router.post("/inventory/update")
async def update_inventory_item(req: InventoryUpdateRequest):
    """Update quantity of an inventory item"""
    result = await db.inventory.update_one(
        {"item": req.item},
        {"$set": {"amount": req.amount}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in inventory")
    inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return {"success": True, "inventory": inventory}

@api_router.delete("/inventory/{item_name}")
async def delete_inventory_item(item_name: str):
    """Remove an item from inventory"""
    result = await db.inventory.delete_one({"item": item_name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in inventory")
    inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return {"success": True, "inventory": inventory}

@api_router.get("/meal-plan/suggestions-today")
async def get_today_suggestions():
    """Get smart meal suggestions for today based on what's prepped and available"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Get today's planned meals
    plan_doc = await db.meal_plan.find_one({"_id": "user_meal_plan"})
    today_meals = {"breakfast": None, "lunch": None, "dinner": None}
    
    if plan_doc:
        meals = plan_doc.get("meals", [])
        for meal in meals:
            if meal["date"] == today:
                today_meals[meal["meal_type"]] = meal
    
    # Get inventory
    inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    available_items = {item["item"] for item in inventory}
    
    # Build suggestions
    suggestions = {
        "breakfast": {"planned": today_meals["breakfast"], "alternatives": [], "status": "not_prepped"},
        "lunch": {"planned": today_meals["lunch"], "alternatives": [], "status": "not_prepped"},
        "dinner": {"planned": today_meals["dinner"], "alternatives": [], "status": "not_prepped"}
    }
    
    for meal_type in ["breakfast", "lunch", "dinner"]:
        planned = today_meals[meal_type]
        
        if planned:
            # Check if prepped
            if planned.get("is_prepped"):
                suggestions[meal_type]["status"] = "ready_to_eat"
            else:
                # Find meal data
                meal_data = None
                for category_meals in EXTENDED_MEAL_LIBRARY.values():
                    for m in category_meals:
                        if m["id"] == planned["meal_id"]:
                            meal_data = m
                            break
                
                if meal_data:
                    # Check if can make from inventory
                    meal_ingredients = {ing["item"] for ing in meal_data.get("ingredients", [])}
                    if meal_ingredients.issubset(available_items):
                        suggestions[meal_type]["status"] = "can_make_now"
                    else:
                        suggestions[meal_type]["status"] = "need_ingredients"
            
            # Find alternatives that can be made
            for category_meals in EXTENDED_MEAL_LIBRARY[meal_type]:
                if category_meals["id"] != planned["meal_id"]:
                    meal_ingredients = {ing["item"] for ing in category_meals.get("ingredients", [])}
                    if meal_ingredients.issubset(available_items):
                        suggestions[meal_type]["alternatives"].append({
                            "id": category_meals["id"],
                            "name": category_meals["name"],
                            "macros": category_meals["macros"]
                        })
    
    return suggestions

@api_router.get("/meal-plan/daily-totals")
async def get_daily_totals(date: str):
    """Get calorie and protein totals for a specific date"""
    plan_doc = await db.meal_plan.find_one({"_id": "user_meal_plan"})
    if not plan_doc:
        return {"calories": 0, "protein": 0, "meals": []}
    
    meals = plan_doc.get("meals", [])
    daily_meals = [m for m in meals if m["date"] == date]
    
    total_calories = sum(m.get("calories", 0) for m in daily_meals)
    total_protein = sum(m.get("protein", 0) for m in daily_meals)
    
    return {
        "date": date,
        "calories": total_calories,
        "protein": total_protein,
        "meals": daily_meals
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
