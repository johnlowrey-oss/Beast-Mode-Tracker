import { useEffect, useState, useMemo } from "react";
import "./App.css";
import axios from "axios";
import { Calendar, Activity, Dumbbell, Utensils, Pill, Zap, BarChart2, Plus, Minus, Check, Circle, X, Settings, RefreshCw, Timer, ShoppingCart, Info, ChefHat, ClipboardList, Package, AlertCircle, CheckCircle2, AlertTriangle, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState({});
  const [metrics, setMetrics] = useState([]);
  const [settings, setSettings] = useState({
    protein_target: 200,
    protein_current: 0,
    calorie_target: 2400,
    calorie_current: 0,
    water_liters: 0.0,
    alcohol_count: 0,
    selected_meals: {}
  });
  const [supplements, setSupplements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [todayPlan, setTodayPlan] = useState(null);
  const [planner, setPlanner] = useState({});
  const [mealLibrary, setMealLibrary] = useState({ breakfast: [], lunch: [], dinner: [] });
  const [extendedMealLibrary, setExtendedMealLibrary] = useState({ breakfast: [], lunch: [], dinner: [] });
  
  // NEW MEAL PLANNING STATE
  const [mealPlan, setMealPlan] = useState([]);
  const [planWeeks, setPlanWeeks] = useState(0);
  const [shoppingList, setShoppingList] = useState([]);
  const [prepTasks, setPrepTasks] = useState([]);
  const [todaySuggestions, setTodaySuggestions] = useState(null);
  const [inventory, setInventory] = useState([]);
  
  // UI State
  const [activeModal, setActiveModal] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [selectedWeeks, setSelectedWeeks] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        habitsRes, metricsRes, settingsRes, suppsRes, scheduleRes, todayRes, 
        plannerRes, mealsRes, extendedMealsRes, mealPlanRes, shoppingRes, prepRes, inventoryRes
      ] = await Promise.all([
        axios.get(`${API}/habits`),
        axios.get(`${API}/metrics`),
        axios.get(`${API}/settings`),
        axios.get(`${API}/supplements`),
        axios.get(`${API}/schedule`),
        axios.get(`${API}/schedule/today`),
        axios.get(`${API}/planner`),
        axios.get(`${API}/meals/library`),
        axios.get(`${API}/meals/library/extended`),
        axios.get(`${API}/meal-plan`),
        axios.get(`${API}/shopping-list`),
        axios.get(`${API}/meal-plan/prep-tasks`),
        axios.get(`${API}/inventory`)
      ]);

      setHabits(habitsRes.data.habits || {});
      setMetrics(metricsRes.data || []);
      setSettings(settingsRes.data);
      setSupplements(suppsRes.data.supplements || []);
      setSchedule(scheduleRes.data.schedule || []);
      setTodayPlan(todayRes.data);
      setPlanner(plannerRes.data.planner || {});
      setMealLibrary(mealsRes.data);
      setExtendedMealLibrary(extendedMealsRes.data);
      setMealPlan(mealPlanRes.data.meal_plan || []);
      setPlanWeeks(mealPlanRes.data.weeks || 0);
      setShoppingList(shoppingRes.data.items || []);
      setPrepTasks(prepRes.data.prep_tasks || []);
      setInventory(inventoryRes.data.inventory || []);
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  // Load today's suggestions
  const loadTodaySuggestions = async () => {
    try {
      const res = await axios.get(`${API}/meal-plan/suggestions-today`);
      setTodaySuggestions(res.data);
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  };

  useEffect(() => {
    if (!loading && mealPlan.length > 0) {
      loadTodaySuggestions();
    }
  }, [loading, mealPlan]);

  // Toggle habit
  const toggleHabit = async (dateKey) => {
    const newValue = !habits[dateKey];
    try {
      await axios.post(`${API}/habits/toggle`, { date: dateKey, completed: newValue });
      setHabits({ ...habits, [dateKey]: newValue });
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  // Protein actions
  const addProtein = async () => {
    try {
      const res = await axios.post(`${API}/settings/protein/add`);
      setSettings({ ...settings, protein_current: res.data.protein_current });
    } catch (error) {
      console.error("Error adding protein:", error);
    }
  };

  const subProtein = async () => {
    try {
      const res = await axios.post(`${API}/settings/protein/subtract`);
      setSettings({ ...settings, protein_current: res.data.protein_current });
    } catch (error) {
      console.error("Error subtracting protein:", error);
    }
  };

  const addWater = async () => {
    try {
      const res = await axios.post(`${API}/settings/water/add`);
      setSettings({ ...settings, water_liters: res.data.water_liters });
    } catch (error) {
      console.error("Error adding water:", error);
    }
  };

  const addAlcohol = async () => {
    try {
      const res = await axios.post(`${API}/settings/alcohol/add`);
      setSettings({ ...settings, alcohol_count: res.data.alcohol_count });
    } catch (error) {
      alert(error.response?.data?.detail || "Error adding alcohol");
    }
  };

  const setCalorieTarget = async (target) => {
    try {
      const res = await axios.post(`${API}/settings/calorie/set-target?target=${target}`);
      setSettings({ ...settings, calorie_target: res.data.calorie_target });
    } catch (error) {
      console.error("Error setting calorie target:", error);
    }
  };

  const addCalories = async (amount) => {
    try {
      const res = await axios.post(`${API}/settings/calorie/add?amount=${amount}`);
      setSettings({ ...settings, calorie_current: res.data.calorie_current });
    } catch (error) {
      console.error("Error adding calories:", error);
    }
  };

  const toggleSupplement = async (index) => {
    try {
      const res = await axios.post(`${API}/supplements/toggle?index=${index}`);
      setSupplements(res.data.supplements);
    } catch (error) {
      console.error("Error toggling supplement:", error);
    }
  };

  // MEAL PLANNING FUNCTIONS
  const generateMealPlan = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/meal-plan/generate`, { weeks: selectedWeeks });
      const generatedPlan = res.data.meal_plan;
      const weeks = res.data.weeks;
      
      // Save the generated plan to database (send as array with weeks as query param)
      await axios.post(`${API}/meal-plan/save?weeks=${weeks}`, generatedPlan);
      
      setMealPlan(generatedPlan);
      setPlanWeeks(weeks);
      
      // Auto-generate shopping list
      const shopRes = await axios.get(`${API}/shopping-list/generate`);
      setShoppingList(shopRes.data.shopping_list);
      await axios.post(`${API}/shopping-list/save`, shopRes.data.shopping_list);
      
      // Get prep tasks
      const prepRes = await axios.get(`${API}/meal-plan/prep-tasks`);
      setPrepTasks(prepRes.data.prep_tasks);
      
      setAiLoading(false);
      alert(`✅ Generated ${selectedWeeks}-week meal plan with shopping list!`);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      setAiLoading(false);
      alert(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const toggleShoppingItem = async (index) => {
    try {
      const res = await axios.post(`${API}/shopping-list/toggle-purchased?item_index=${index}`);
      setShoppingList(res.data.items);
      // Reload inventory
      const invRes = await axios.get(`${API}/inventory`);
      setInventory(invRes.data.inventory);
    } catch (error) {
      console.error("Error toggling shopping item:", error);
    }
  };

  const markPrepComplete = async (mealId, dates) => {
    try {
      await axios.post(`${API}/meal-plan/mark-prepped?meal_id=${mealId}`, dates);
      // Reload meal plan and prep tasks
      const planRes = await axios.get(`${API}/meal-plan`);
      setMealPlan(planRes.data.meal_plan);
      const prepRes = await axios.get(`${API}/meal-plan/prep-tasks`);
      setPrepTasks(prepRes.data.prep_tasks);
      loadTodaySuggestions();
    } catch (error) {
      console.error("Error marking prep complete:", error);
    }
  };

  // Calculate streak and 2-day rule
  const { streak, ruleBroken, consecutiveMisses } = useMemo(() => {
    const today = new Date();
    let streakCount = 0;
    let missCount = 0;
    let broken = false;

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];

      if (habits[dateKey]) {
        streakCount = i === 0 ? streakCount + 1 : streakCount;
        missCount = 0;
      } else {
        if (checkDate < today) {
          missCount++;
          if (missCount >= 2) {
            broken = true;
            break;
          }
        }
        if (i > 0) streakCount = 0;
      }
    }

    return { streak: streakCount, ruleBroken: broken, consecutiveMisses: missCount };
  }, [habits]);

  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        date: d,
        dateKey: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short' })[0],
        isPast: d.toDateString() !== today.toDateString() && d < today
      });
    }
    return days;
  }, []);

  const latestMetric = metrics[0] || { weight: 0, body_fat: 0 };
  const bfProgress = Math.max(0, Math.min(100, ((25 - latestMetric.body_fat) / (25 - 12)) * 100));

  // AI Functions
  const generateRecipe = async (category) => {
    const meal = settings.selected_meals[category];
    if (!meal) return;

    setAiLoading(true);
    setActiveModal('ai-response');
    setAiResponse({ title: `Generating ${meal.name}...`, content: "AI is cooking up something amazing..." });

    try {
      const res = await axios.post(`${API}/ai/recipe`, {
        meal_name: meal.name,
        meal_blueprint: meal.blueprint,
        category: category
      });
      setAiResponse({ title: meal.name, content: res.data.recipe });
    } catch (error) {
      setAiResponse({ title: "Error", content: "Failed to generate recipe. Please try again." });
    } finally {
      setAiLoading(false);
    }
  };

  const getMotivation = async () => {
    setAiLoading(true);
    setActiveModal('ai-response');
    setAiResponse({ title: "Engaging Mindset...", content: "Getting you focused..." });

    try {
      const res = await axios.post(`${API}/ai/motivation`, {
        prompt: "I need motivation to stay consistent",
        context: "Working father with 2 kids, working towards 12% body fat"
      });
      setAiResponse({ title: "Focus ✨", content: res.data.message });
    } catch (error) {
      setAiResponse({ title: "Error", content: "Failed to get motivation. Please try again." });
    } finally {
      setAiLoading(false);
    }
  };

  const runAudit = async () => {
    setAiLoading(true);
    setActiveModal('ai-response');
    setAiResponse({ title: "Analyzing Data...", content: "Running performance audit..." });

    try {
      const res = await axios.post(`${API}/ai/audit`);
      setAiResponse({ title: "Performance Audit ✨", content: res.data.audit });
    } catch (error) {
      setAiResponse({ title: "Error", content: "Failed to run audit. Please try again." });
    } finally {
      setAiLoading(false);
    }
  };

  const logMetrics = async (weight, waist, neck) => {
    try {
      const bf = (86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(75) + 36.76).toFixed(1);
      const today = new Date();
      const entry = {
        date: today.toLocaleDateString(),
        weight: parseFloat(weight),
        waist: parseFloat(waist),
        neck: parseFloat(neck),
        body_fat: parseFloat(bf),
        timestamp: new Date().toISOString()
      };
      
      await axios.post(`${API}/metrics`, entry);
      await loadAllData();
      setActiveModal(null);
    } catch (error) {
      console.error("Error logging metrics:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-blue-400 text-xl font-bold animate-pulse">Loading Beast Hub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 px-4 py-4 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-blue-400 font-black text-lg uppercase tracking-widest">BEAST HUB</h1>
              <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-tighter">
                Year 1: Foundation
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setActiveModal('settings')} className="p-2 hover:bg-slate-700 rounded-full transition" data-testid="settings-button">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Today's Smart Suggestions - NEW! */}
        {todaySuggestions && mealPlan.length > 0 && (
          <section className="card bg-gradient-to-r from-blue-900/30 to-emerald-900/30 border border-blue-500/30 rounded-2xl p-6 shadow-xl" data-testid="smart-suggestions">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-blue-400">
                <ChefHat className="w-4 h-4" /> Today's Meal Status
              </h2>
              <button onClick={() => setActiveModal('meal-planner')} className="text-xs text-emerald-400 font-bold hover:underline">
                View Full Plan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                const suggestion = todaySuggestions[mealType];
                const statusConfig = {
                  'ready_to_eat': { icon: CheckCircle2, color: 'emerald', label: 'READY' },
                  'can_make_now': { icon: Check, color: 'blue', label: 'CAN MAKE' },
                  'need_ingredients': { icon: AlertCircle, color: 'red', label: 'NEED ITEMS' },
                  'not_prepped': { icon: Circle, color: 'slate', label: 'NOT PLANNED' }
                };
                const config = statusConfig[suggestion?.status] || statusConfig['not_prepped'];
                const Icon = config.icon;

                return (
                  <div key={mealType} className={`bg-slate-800/50 p-3 rounded-xl border border-${config.color}-500/20`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">{mealType}</p>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full bg-${config.color}-500/20 text-${config.color}-400 font-black`}>
                        {config.label}
                      </span>
                    </div>
                    {suggestion?.planned && (
                      <div className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 mt-0.5 text-${config.color}-400`} />
                        <div>
                          <p className="text-xs font-bold">{suggestion.planned.meal_name}</p>
                          {suggestion.status === 'ready_to_eat' && (
                            <p className="text-[9px] text-emerald-400 mt-1">✓ Grab from fridge!</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Momentum Section */}
        <section className={`bg-slate-800 rounded-2xl border p-6 shadow-xl ${ruleBroken ? 'border-red-500 animate-pulse' : 'border-slate-700'}`} data-testid="momentum-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-400">
              <Activity className="w-4 h-4 text-blue-500" /> Momentum
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={runAudit} className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full font-bold hover:bg-blue-600/30 transition" data-testid="audit-button">
                Audit ✨
              </button>
              <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full" data-testid="streak-counter">
                {streak} Day Streak
              </span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((day) => {
              const checked = habits[day.dateKey];
              const isPast = day.isPast;
              let className = checked ? "bg-blue-500 text-white border-blue-400" : (isPast ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-slate-700 text-slate-400 border-slate-600");
              
              return (
                <button
                  key={day.dateKey}
                  onClick={() => toggleHabit(day.dateKey)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all border ${className}`}
                  data-testid={`habit-day-${day.dateKey}`}
                >
                  <span className="text-[10px] font-black">{day.label}</span>
                  {checked ? <Check className="w-4 h-4 mt-1" /> : (isPast ? <X className="w-4 h-4 mt-1" /> : <Circle className="w-4 h-4 mt-1" />)}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] mt-3 text-center text-slate-500 italic uppercase tracking-wider">
            {ruleBroken ? "⚠️ 2-DAY RULE BROKEN" : "Protect the 2-Day Rule"}
          </p>
        </section>

        {/* Metrics Dashboard */}
        <section className="bg-slate-800 rounded-2xl border border-blue-500/20 p-6" data-testid="metrics-section">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Body Analytics</h2>
            <button onClick={() => setActiveModal('metrics')} className="text-xs text-blue-400 font-bold hover:underline" data-testid="full-logs-button">
              Full Logs
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600/30">
              <p className="text-[10px] text-slate-400 uppercase font-black">Weight</p>
              <p className="text-xl font-bold" data-testid="latest-weight">{latestMetric.weight || '--'} lbs</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600/30">
              <p className="text-[10px] text-blue-400 uppercase font-black">Body Fat</p>
              <p className="text-xl font-bold text-blue-400" data-testid="latest-bf">{latestMetric.body_fat || '--'} %</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600/30">
              <p className="text-[10px] text-slate-400 uppercase font-black">Daily Protein</p>
              <p className="text-xl font-bold" data-testid="protein-total">{settings.protein_current}g / {settings.protein_target}g</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600/30">
              <p className="text-[10px] text-emerald-400 uppercase font-black">Daily Calories</p>
              <p className="text-xl font-bold text-emerald-400" data-testid="calorie-total">{settings.calorie_current} / {settings.calorie_target}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase font-black text-slate-500">Protein Progress</p>
                <p className="text-[9px] text-slate-400 font-bold">{Math.round((settings.protein_current / settings.protein_target) * 100)}%</p>
              </div>
              <div className="w-full bg-slate-600 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (settings.protein_current / settings.protein_target) * 100)}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase font-black text-slate-500">Calorie Progress</p>
                <p className="text-[9px] text-slate-400 font-bold">{Math.round((settings.calorie_current / settings.calorie_target) * 100)}%</p>
              </div>
              <div className="w-full bg-slate-600 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (settings.calorie_current / settings.calorie_target) * 100)}%` }}></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600/30">
              <p className="text-[10px] text-slate-400 uppercase font-black">Goal: 12%</p>
              <div className="w-full bg-slate-600 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${bfProgress}%` }}></div>
              </div>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600/30">
              <p className="text-[10px] text-slate-400 uppercase font-black text-center">Set Calorie Target</p>
              <button onClick={() => setActiveModal('calorie-settings')} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg text-[10px] font-black uppercase">
                {settings.calorie_target} cal
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex flex-1 gap-1">
              <button onClick={addProtein} className="flex-grow bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-[10px] font-black uppercase border border-slate-600 tracking-widest" data-testid="add-protein-button">
                + 25g
              </button>
              <button onClick={subProtein} className="px-4 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-[10px] font-black uppercase border border-slate-600 text-slate-300" data-testid="sub-protein-button">
                -
              </button>
            </div>
            <button onClick={() => setActiveModal('metrics')} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg tracking-widest" data-testid="log-metrics-button">
              Log Metrics / Edit
            </button>
          </div>
        </section>

        {/* Blueprint and Protocol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-slate-800 rounded-2xl border border-slate-700 p-6" data-testid="blueprint-section">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Dumbbell className="text-blue-500" /> Today's Blueprint</h2>
              <span className="text-[10px] bg-slate-700 px-2 py-1 rounded uppercase font-bold text-slate-300" data-testid="day-badge">
                {todayPlan?.type || 'Loading...'}
              </span>
            </div>
            <div className="space-y-3 mb-4">
              {(todayPlan?.tasks || []).map((task, idx) => (
                <div key={idx} className="bg-slate-700/50 p-2 rounded-lg border border-slate-600/50 flex gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[11px] font-bold uppercase tracking-tighter">{task}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveModal('workouts')} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2" data-testid="tall-lifter-cues-button">
              <Info className="w-3 h-3" /> Tall Lifter Cues
            </button>
          </section>

          <section className="bg-slate-800 rounded-2xl border border-slate-700 p-6" data-testid="protocol-section">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Pill className="text-emerald-500" /> Protocol</h2>
            </div>
            <div className="space-y-2">
              {supplements.map((supp, idx) => (
                <div key={idx} onClick={() => toggleSupplement(idx)} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 border border-slate-600/50 cursor-pointer hover:bg-slate-700 transition" data-testid={`supplement-${idx}`}>
                  <div className="flex items-center gap-3">
                    {supp.checked ? <Check className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-500" />}
                    <div>
                      <p className={`text-xs font-bold ${supp.checked ? 'line-through text-slate-500' : ''}`}>{supp.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{supp.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <section className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex justify-between items-center" data-testid="alcohol-section">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <span className="text-2xl">🍺</span>
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase">Weekly Alcohol</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black">Limit: 3</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-black text-red-400" data-testid="alcohol-count">{settings.alcohol_count}/3</p>
              <button onClick={addAlcohol} className="bg-slate-700 p-2 rounded-lg hover:bg-slate-600 transition" data-testid="add-alcohol-button">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          <section className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex justify-between items-center" data-testid="water-section">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <span className="text-2xl">💧</span>
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase">Hydration</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black">Target: 4L</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-black text-blue-400" data-testid="water-count">{settings.water_liters.toFixed(1)}L</p>
              <button onClick={addWater} className="bg-slate-700 p-2 rounded-lg hover:bg-slate-600 transition" data-testid="add-water-button">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 h-20 bg-slate-800/95 backdrop-blur-sm rounded-3xl border border-slate-700 flex items-center justify-between px-2 shadow-2xl z-40" data-testid="bottom-nav">
        <button onClick={getMotivation} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-yellow-500 hover:scale-105 transition" data-testid="motivation-button">
          <Zap className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Focus</span>
        </button>
        <button onClick={() => setActiveModal('shopping-list')} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-purple-400 hover:scale-105 transition" data-testid="shopping-button">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Shop</span>
        </button>
        <button onClick={() => setActiveModal('meal-planner')} className="accent-gradient h-14 px-4 rounded-2xl font-black text-[10px] shadow-lg active:scale-95 transition tracking-widest uppercase flex-1 max-w-[100px] mx-1 text-white beast-glow">
          Plan Meals
        </button>
        <button onClick={() => setActiveModal('prep-checklist')} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-emerald-400 hover:scale-105 transition" data-testid="prep-button">
          <ClipboardList className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Prep</span>
        </button>
        <button onClick={() => setActiveModal('metrics')} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-blue-400 hover:scale-105 transition" data-testid="metrics-nav-button">
          <BarChart2 className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Metrics</span>
        </button>
        <button onClick={() => setActiveModal('inventory')} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-orange-400 hover:scale-105 transition" data-testid="inventory-button">
          <Package className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Stock</span>
        </button>
      </nav>

      {/* MODALS */}
      <Modal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="System Config">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Protein Target (g/day)</label>
            <input type="number" value={settings.protein_target} readOnly className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-sm" />
          </div>
          <p className="text-[9px] text-slate-400 text-center font-black uppercase tracking-widest">Storage: MongoDB Active</p>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'calorie-settings'} onClose={() => setActiveModal(null)} title="Calorie Target">
        <CalorieSettingsModal 
          currentTarget={settings.calorie_target}
          onSave={(target) => {
            setCalorieTarget(target);
            setActiveModal(null);
          }}
        />
      </Modal>

      <Modal isOpen={activeModal === 'metrics'} onClose={() => setActiveModal(null)} title="Analytics">
        <MetricsModal metrics={metrics} settings={settings} onLog={logMetrics} />
      </Modal>

      <Modal isOpen={activeModal === 'workouts'} onClose={() => setActiveModal(null)} title="Tall Lifter Cues">
        <WorkoutCues />
      </Modal>

      <Modal isOpen={activeModal === 'meal-planner'} onClose={() => setActiveModal(null)} title="Meal Planner">
        <MealPlannerModal 
          mealPlan={mealPlan}
          setMealPlan={setMealPlan}
          extendedLibrary={extendedMealLibrary}
          selectedWeeks={selectedWeeks}
          setSelectedWeeks={setSelectedWeeks}
          onGenerate={generateMealPlan}
          aiLoading={aiLoading}
        />
      </Modal>

      <Modal isOpen={activeModal === 'shopping-list'} onClose={() => setActiveModal(null)} title="Shopping List">
        <ShoppingListModal 
          items={shoppingList}
          onToggle={toggleShoppingItem}
          onGenerate={async () => {
            const res = await axios.get(`${API}/shopping-list/generate`);
            setShoppingList(res.data.shopping_list);
            await axios.post(`${API}/shopping-list/save`, res.data.shopping_list);
          }}
        />
      </Modal>

      <Modal isOpen={activeModal === 'prep-checklist'} onClose={() => setActiveModal(null)} title="Prep Day Checklist">
        <PrepChecklistModal 
          tasks={prepTasks}
          onComplete={markPrepComplete}
        />
      </Modal>

      <Modal isOpen={activeModal === 'inventory'} onClose={() => setActiveModal(null)} title="Ingredient Stock">
        <InventoryModal inventory={inventory} />
      </Modal>

      <Modal isOpen={activeModal === 'ai-response'} onClose={() => setActiveModal(null)} title={aiResponse?.title || 'AI Response'}>
        <div className="max-w-none">
          {aiLoading ? (
            <div className="animate-pulse text-blue-400 text-center py-10 text-lg font-bold">Generating...</div>
          ) : (
            <FormattedAIResponse content={aiResponse?.content} />
          )}
        </div>
      </Modal>
    </div>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl w-full max-w-3xl p-6 my-10 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
          <h2 className="text-xl font-black text-blue-400 uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="text-slate-400 p-2 hover:bg-slate-700 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}

// Continue in next message with modal components...
export default App;

// ========== MODAL COMPONENTS ==========

// Metrics Modal Component
function MetricsModal({ metrics, settings, onLog }) {
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');

  const handleSubmit = () => {
    if (weight && waist && neck) {
      onLog(weight, waist, neck);
      setWeight('');
      setWaist('');
      setNeck('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600">
        <h4 className="text-xs font-black uppercase text-blue-400 mb-4 tracking-widest">New Log</h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[9px] uppercase text-slate-400 mb-1 block">Weight (lbs)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="lbs" className="bg-slate-800 border border-slate-600 p-3 rounded text-sm text-white w-full" data-testid="input-weight" />
          </div>
          <div>
            <label className="text-[9px] uppercase text-slate-400 mb-1 block">Waist (in)</label>
            <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="in" className="bg-slate-800 border border-slate-600 p-3 rounded text-sm text-white w-full" data-testid="input-waist" />
          </div>
          <div>
            <label className="text-[9px] uppercase text-slate-400 mb-1 block">Neck (in)</label>
            <input type="number" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder="in" className="bg-slate-800 border border-slate-600 p-3 rounded text-sm text-white w-full" data-testid="input-neck" />
          </div>
        </div>
        <button onClick={handleSubmit} className="w-full bg-blue-600 py-3 rounded-xl font-bold uppercase text-xs tracking-widest text-white shadow-lg hover:bg-blue-700 transition" data-testid="save-metrics-button">
          Save Stats
        </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex justify-between bg-slate-700/50 p-3 rounded-xl border border-slate-600/50">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">{m.date}</p>
              <p className="text-sm font-bold">{m.weight} lbs</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-500">BF%</p>
              <p className="text-sm text-blue-400 font-black">{m.body_fat}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Workout Cues Component
function WorkoutCues() {
  const cues = [
    { exercise: "FLOOR PRESS", cue: "Stop elbows at floor to protect shoulder joints while hitting overload. Allows heavy loading safely." },
    { exercise: "HACK SQUAT", cue: "Feet low on platform. Upright torso. Control 3-sec eccentric. Grows quads without back fatigue." },
    { exercise: "TRAP BAR DEADLIFT", cue: "Neutral grip and centered load make this safer for tall lifters than conventional deadlifts." },
    { exercise: "HANGING LEG RAISES", cue: "The 8-pack builder. Don't swing. Curl pelvis towards ribs. Tall torso = massive tension." }
  ];

  return (
    <div className="space-y-4">
      {cues.map((cue, idx) => (
        <div key={idx} className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
          <h4 className="font-black text-blue-400 uppercase text-xs mb-1">{cue.exercise}</h4>
          <p className="text-xs text-slate-300">{cue.cue}</p>
        </div>
      ))}
    </div>
  );
}

// Meal Planner Modal
function MealPlannerModal({ mealPlan, setMealPlan, extendedLibrary, selectedWeeks, setSelectedWeeks, onGenerate, aiLoading }) {
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);

  const handleSwapMeal = (date, mealType, currentMealId, e) => {
    e.stopPropagation();
    setSwapTarget({ date, mealType, currentMealId });
    setSwapModalOpen(true);
  };

  const confirmSwap = async (newMealId) => {
    if (!swapTarget) return;
    
    try {
      console.log('Swapping meal:', swapTarget.date, swapTarget.mealType, 'from', swapTarget.currentMealId, 'to', newMealId);
      
      const response = await axios.post(`${BACKEND_URL}/api/meal-plan/update-meal`, {
        date: swapTarget.date,
        meal_type: swapTarget.mealType,
        meal_id: newMealId
      });
      
      console.log('Swap response:', response.data);
      
      // Find the new meal data from extendedLibrary
      const newMealData = extendedLibrary[swapTarget.mealType]?.find(m => m.id === newMealId);
      
      // Directly update the mealPlan state for instant UI feedback
      if (newMealData) {
        setMealPlan(currentPlan =>
          currentPlan.map(entry =>
            (entry.date === swapTarget.date && entry.meal_type === swapTarget.mealType)
              ? { 
                  ...entry, 
                  meal_id: newMealId, 
                  meal_name: newMealData.name, 
                  calories: newMealData.calories, 
                  protein: newMealData.protein,
                  is_prepped: false
                }
              : entry
          )
        );
      }
      
      // Close modal after successful swap
      setSwapModalOpen(false);
      setSwapTarget(null);
      
    } catch (error) {
      console.error("Error swapping meal:", error);
      alert(`❌ Failed to swap meal: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {mealPlan.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-bold text-blue-400 mb-4">Generate Your Meal Plan</h3>
            <p className="text-sm text-slate-400 mb-6">Plan 1-4 weeks of meals with automatic shopping list generation</p>
            
            <div className="max-w-md mx-auto mb-6">
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Plan Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((weeks) => (
                  <button
                    key={weeks}
                    onClick={() => setSelectedWeeks(weeks)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition ${
                      selectedWeeks === weeks
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {weeks}w
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onGenerate}
              disabled={aiLoading}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-lg hover:scale-105 transition disabled:opacity-50"
            >
              {aiLoading ? 'Generating...' : `Generate ${selectedWeeks}-Week Plan ✨`}
            </button>

            <div className="mt-8 text-xs text-slate-500 space-y-1">
              <p>✓ Auto-rotates high-protein meals</p>
              <p>✓ Identifies batch prep requirements</p>
              <p>✓ Generates complete shopping list</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-emerald-400">{Math.ceil(mealPlan.length / 3)}-Day Plan Active</h3>
                <p className="text-xs text-slate-400">{mealPlan.length} meals planned</p>
              </div>
              <button
                onClick={onGenerate}
                className="bg-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-600 transition"
              >
                Regenerate
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-300">
                💡 <strong>Tip:</strong> Click any meal to shuffle and pick a different option!
              </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {Array.from({ length: Math.ceil(mealPlan.length / 3) }, (_, dayIndex) => {
                const dayMeals = mealPlan.filter((m, idx) => Math.floor(idx / 3) === dayIndex);
                if (dayMeals.length === 0) return null;

                const date = new Date(dayMeals[0].date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={dayIndex} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="w-4 h-4 text-blue-400" />
                      <h4 className="font-black text-sm uppercase text-blue-400">{dayName}</h4>
                      <span className="text-xs text-slate-500">{dateStr}</span>
                    </div>
                    <div className="space-y-2">
                      {dayMeals.map((meal, idx) => {
                        const mealData = Object.values(extendedLibrary).flat().find(m => m.id === meal.meal_id);
                        return (
                          <button
                            key={idx}
                            onClick={(e) => handleSwapMeal(meal.date, meal.meal_type, meal.meal_id, e)}
                            className="w-full flex items-center justify-between bg-slate-800/50 p-3 rounded-lg hover:bg-slate-700 transition border border-slate-700 hover:border-blue-500 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              {meal.is_prepped ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : mealData?.requires_advance_prep ? (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600" />
                              )}
                              <div className="text-left">
                                <p className="text-xs font-bold capitalize text-slate-300">{meal.meal_type}</p>
                                <p className="text-[11px] text-slate-100 font-bold">{meal.meal_name}</p>
                                <p className="text-[9px] text-slate-400">{mealData?.calories} cal | {mealData?.protein}g P</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {meal.is_prepped && (
                                <span className="text-[8px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-black">READY</span>
                              )}
                              <RefreshCw className="w-4 h-4 text-blue-400" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}
      </div>

      {/* Meal Swap Modal - Rendered as Portal */}
      {swapModalOpen && swapTarget && (
        <div className="fixed inset-0 bg-black/95 z-[80] flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setSwapModalOpen(false); }}>
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl p-6 border border-slate-700 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-black text-blue-400 uppercase">Choose {swapTarget.mealType}</h3>
                <p className="text-xs text-slate-400 mt-1">Click to swap your meal</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setSwapModalOpen(false); }} className="text-slate-400 p-2 hover:bg-slate-700 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2">
              {extendedLibrary[swapTarget.mealType]?.map((meal) => (
                <button
                  key={meal.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmSwap(meal.id);
                    setSwapModalOpen(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition border-2 ${
                    meal.id === swapTarget.currentMealId
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-700/50 border-slate-600 hover:border-blue-500 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-sm">{meal.name}</p>
                    {meal.id === swapTarget.currentMealId && (
                      <span className="text-[8px] px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-black">CURRENT</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{meal.blueprint}</p>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded font-bold">{meal.calories} cal</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-bold">{meal.protein}g P</span>
                    {meal.requires_advance_prep && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded font-bold">⚠️ PREP</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Shopping List Modal
function ShoppingListModal({ items, onToggle, onGenerate }) {
  const categories = [...new Set(items.map(item => item.category))];

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-400 mb-4">No shopping list yet</p>
          <button
            onClick={onGenerate}
            className="bg-blue-600 px-6 py-3 rounded-xl font-bold uppercase text-sm hover:bg-blue-700 transition"
          >
            Generate from Meal Plan
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-400">{items.filter(i => i.purchased).length} / {items.length} purchased</p>
            </div>
            <button onClick={onGenerate} className="text-xs text-blue-400 font-bold hover:underline">
              Regenerate
            </button>
          </div>

          {categories.map((category) => {
            const categoryItems = items.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-400 rounded"></div>
                  {category}
                </h4>
                <div className="space-y-1">
                  {categoryItems.map((item, idx) => {
                    const globalIdx = items.indexOf(item);
                    return (
                      <button
                        key={idx}
                        onClick={() => onToggle(globalIdx)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                          item.purchased
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.purchased ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500" />
                          )}
                          <div className="text-left">
                            <p className={`text-sm font-bold ${item.purchased ? 'line-through text-slate-500' : ''}`}>
                              {item.item}
                            </p>
                            <p className="text-[10px] text-slate-400">{item.amount}</p>
                          </div>
                        </div>
                        {item.purchased && (
                          <span className="text-[8px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-black">
                            ✓ GOT IT
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// Prep Checklist Modal
function PrepChecklistModal({ tasks, onComplete }) {
  return (
    <div className="space-y-6">
      {tasks.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-400">No prep tasks yet. Create a meal plan first!</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              <strong>{tasks.filter(t => !t.completed).length}</strong> items need batch prep this week
            </p>
          </div>

          <div className="space-y-4">
            {tasks.map((task, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  task.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-700/50 border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {task.completed ? (
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-bold text-sm ${task.completed ? 'line-through text-slate-500' : ''}`}>
                        {task.meal_name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Batch: {task.batch_size}x | Lasts: {task.shelf_life_days} days
                      </p>
                      <p className="text-[10px] text-blue-400 mt-1">
                        Serves {task.serves_dates.length} days
                      </p>
                    </div>
                  </div>
                  {!task.completed && (
                    <button
                      onClick={() => onComplete(task.meal_id, task.serves_dates)}
                      className="bg-emerald-600 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-emerald-700 transition"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
                {task.completed && (
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">
                    ✓ Ready to eat!
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Inventory Modal
function InventoryModal({ inventory }) {
  const categories = [...new Set(inventory.map(item => item.category))];

  return (
    <div className="space-y-6">
      {inventory.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-400">No ingredients tracked yet</p>
          <p className="text-xs text-slate-500 mt-2">Items are auto-added when you check them off the shopping list</p>
        </div>
      ) : (
        <>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-sm text-emerald-300">
              <strong>{inventory.length}</strong> ingredients in stock
            </p>
          </div>

          {categories.map((category) => {
            const categoryItems = inventory.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-orange-400 rounded"></div>
                  {category}
                </h4>
                <div className="space-y-1">
                  {categoryItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50"
                    >
                      <div>
                        <p className="text-sm font-bold">{item.item}</p>
                        <p className="text-[10px] text-slate-400">{item.amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase">Purchased</p>
                        <p className="text-xs text-slate-400">{item.purchased_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// Formatted AI Response Component  
function FormattedAIResponse({ content }) {
  if (!content) return null;

  const formatContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentSection = [];
    let listItems = [];
    let inList = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        if (currentSection.length > 0) {
          elements.push(<p key={`p-${idx}`} className="mb-4 text-slate-300 leading-relaxed">{currentSection.join(' ')}</p>);
          currentSection = [];
        }
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`ul-${idx}`} className="mb-4 space-y-2 list-disc list-inside text-slate-300">
              {listItems.map((item, i) => <li key={i} className="ml-2">{item}</li>)}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        return;
      }

      if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60)) {
        if (currentSection.length > 0) {
          elements.push(<p key={`p-${idx}`} className="mb-4 text-slate-300 leading-relaxed">{currentSection.join(' ')}</p>);
          currentSection = [];
        }
        const headerText = trimmed.replace(/^###\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '');
        elements.push(
          <h3 key={`h3-${idx}`} className="text-lg font-black text-blue-400 uppercase tracking-wide mt-6 mb-3 border-b border-blue-500/30 pb-2">
            {headerText}
          </h3>
        );
        return;
      }

      if (/^\d+\.\s*\*\*/.test(trimmed)) {
        if (currentSection.length > 0) {
          elements.push(<p key={`p-${idx}`} className="mb-4 text-slate-300 leading-relaxed">{currentSection.join(' ')}</p>);
          currentSection = [];
        }
        const subHeaderText = trimmed.replace(/^\d+\.\s*\*\*/, '').replace(/\*\*.*$/, '');
        elements.push(
          <h4 key={`h4-${idx}`} className="text-base font-bold text-emerald-400 uppercase tracking-wider mt-5 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-400 rounded"></span>
            {subHeaderText}
          </h4>
        );
        return;
      }

      if (/^[-•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        if (currentSection.length > 0) {
          elements.push(<p key={`p-${idx}`} className="mb-4 text-slate-300 leading-relaxed">{currentSection.join(' ')}</p>);
          currentSection = [];
        }
        inList = true;
        const itemText = trimmed.replace(/^[-•]\s/, '').replace(/^\d+\.\s/, '');
        listItems.push(itemText);
        return;
      }

      if (trimmed.includes('**')) {
        if (currentSection.length > 0) {
          elements.push(<p key={`p-${idx}`} className="mb-4 text-slate-300 leading-relaxed">{currentSection.join(' ')}</p>);
          currentSection = [];
        }
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        elements.push(
          <p key={`p-${idx}`} className="mb-3 text-slate-300 leading-relaxed">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
        return;
      }

      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`ul-${idx}`} className="mb-4 space-y-2 list-disc list-inside text-slate-300">
            {listItems.map((item, i) => <li key={i} className="ml-2">{item}</li>)}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      currentSection.push(trimmed);
    });

    if (currentSection.length > 0) {
      elements.push(<p key="final-p" className="mb-4 text-slate-300 leading-relaxed">{currentSection.join(' ')}</p>);
    }
    if (listItems.length > 0) {
      elements.push(
        <ul key="final-ul" className="mb-4 space-y-2 list-disc list-inside text-slate-300">
          {listItems.map((item, i) => <li key={i} className="ml-2">{item}</li>)}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className="text-left space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      {formatContent(content)}
    </div>
  );
}

// Calorie Settings Modal
function CalorieSettingsModal({ currentTarget, onSave }) {
  const [target, setTarget] = useState(currentTarget);

  const presets = [
    { label: "Aggressive Cut", value: 1800, desc: "Fast fat loss (-2 lbs/week)" },
    { label: "Moderate Cut", value: 2100, desc: "Steady loss (-1 lb/week)" },
    { label: "Maintenance", value: 2400, desc: "Hold weight, recomp" },
    { label: "Lean Bulk", value: 2700, desc: "Slow muscle gain" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-300 mb-2">
          Your calorie target determines which meals are suggested to hit your daily goal.
        </p>
        <p className="text-xs text-slate-400">
          For 12% body fat goal: Start with maintenance, then adjust based on progress.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Presets</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setTarget(preset.value)}
              className={`p-4 rounded-xl text-left transition ${
                target === preset.value
                  ? 'bg-emerald-600 border-2 border-emerald-400'
                  : 'bg-slate-700 border-2 border-slate-600 hover:border-slate-500'
              }`}
            >
              <p className="font-bold text-sm mb-1">{preset.label}</p>
              <p className="text-2xl font-black text-emerald-400">{preset.value} cal</p>
              <p className="text-[10px] text-slate-400 mt-1">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Custom Target</label>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(parseInt(e.target.value) || 2400)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-4 text-white text-2xl font-bold text-center"
          step="100"
        />
      </div>

      <button
        onClick={() => onSave(target)}
        className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-lg hover:scale-105 transition"
      >
        Save Target: {target} Calories
      </button>

      <div className="text-xs text-slate-500 space-y-1">
        <p>💡 Meal plan will auto-suggest meals to hit this target</p>
        <p>📊 Track progress in Body Analytics dashboard</p>
        <p>🎯 Adjust weekly based on scale and mirror feedback</p>
      </div>
    </div>
  );
}
