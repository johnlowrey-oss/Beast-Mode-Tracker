import { useEffect, useState, useMemo, useCallback } from "react";
import "./App.css";
import axios from "axios";
import { Calendar, Activity, Dumbbell, Utensils, Pill, Zap, BarChart2, Plus, Minus, Check, Circle, X, Settings, RefreshCw, Timer, ShoppingCart, Info, ChefHat, ClipboardList, Package, AlertCircle, CheckCircle2, AlertTriangle, ChevronRight, Calendar as CalendarIcon, Bell, BellOff } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Notification utilities
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'unsupported';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
};

const showLocalNotification = (title, body, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: options.tag || 'beast-hub',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  }
  return null;
};

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
  const [prepAlerts, setPrepAlerts] = useState({ alerts: [], has_urgent: false });
  
  // Weekly Summary & Workout State
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  
  // UI State
  const [activeModal, setActiveModal] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [selectedWeeks, setSelectedWeeks] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Load initial data
  useEffect(() => {
    loadAllData();
    // Initialize notifications
    initializeNotifications();
  }, []);
  
  // Check if onboarding needed after data loads
  useEffect(() => {
    if (!loading && mealPlan.length === 0 && !localStorage.getItem('beastHubOnboarded')) {
      setShowOnboarding(true);
    }
  }, [loading, mealPlan]);
  
  // Initialize notifications on load
  const initializeNotifications = async () => {
    await registerServiceWorker();
    const permission = Notification.permission || 'default';
    setNotificationPermission(permission);
    setNotificationsEnabled(permission === 'granted' && localStorage.getItem('beastHubNotifications') === 'true');
  };
  
  // Toggle notifications
  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      // Disable notifications
      setNotificationsEnabled(false);
      localStorage.setItem('beastHubNotifications', 'false');
    } else {
      // Request permission and enable
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('beastHubNotifications', 'true');
        // Show confirmation notification
        showLocalNotification('Beast Hub Notifications Enabled', 'You\'ll receive prep reminders when meals need attention!');
      }
    }
  };
  
  // Check for prep alerts and show notifications
  const checkPrepNotifications = useCallback(() => {
    if (!notificationsEnabled || !prepAlerts.has_urgent) return;
    
    const lastNotified = localStorage.getItem('lastPrepNotification');
    const now = new Date().toDateString();
    
    // Only notify once per day
    if (lastNotified !== now && prepAlerts.alerts.length > 0) {
      const urgentAlerts = prepAlerts.alerts.filter(a => a.urgency === 'NOW');
      if (urgentAlerts.length > 0) {
        showLocalNotification(
          'Prep Reminder',
          `${urgentAlerts.length} meal(s) need prep today! Don't forget: ${urgentAlerts[0].meal_name}`,
          { tag: 'prep-urgent' }
        );
        localStorage.setItem('lastPrepNotification', now);
      }
    }
  }, [notificationsEnabled, prepAlerts]);
  
  // Check notifications when prep alerts change
  useEffect(() => {
    checkPrepNotifications();
  }, [prepAlerts, checkPrepNotifications]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const [
        habitsRes, metricsRes, settingsRes, suppsRes, scheduleRes, todayRes, 
        plannerRes, mealsRes, extendedMealsRes, mealPlanRes, shoppingRes, prepRes, 
        inventoryRes, prepAlertsRes, summaryRes, workoutsRes, todayWorkoutRes
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
        axios.get(`${API}/inventory`),
        axios.get(`${API}/meal-plan/prep-alerts`),
        axios.get(`${API}/summary/weekly`),
        axios.get(`${API}/workouts?limit=10`),
        axios.get(`${API}/workouts/${today}`)
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
      setPrepAlerts(prepAlertsRes.data || { alerts: [], has_urgent: false });
      setWeeklySummary(summaryRes.data);
      setWorkouts(workoutsRes.data.workouts || []);
      setTodayWorkout(todayWorkoutRes.data.workout);
      
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
      
      // Get prep tasks and alerts
      const prepRes = await axios.get(`${API}/meal-plan/prep-tasks`);
      setPrepTasks(prepRes.data.prep_tasks);
      const alertsRes = await axios.get(`${API}/meal-plan/prep-alerts`);
      setPrepAlerts(alertsRes.data || { alerts: [], has_urgent: false });
      
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
      const response = await axios.post(`${API}/meal-plan/mark-prepped?meal_id=${mealId}`, dates);
      // Reload meal plan and prep tasks
      const planRes = await axios.get(`${API}/meal-plan`);
      setMealPlan(planRes.data.meal_plan);
      const prepRes = await axios.get(`${API}/meal-plan/prep-tasks`);
      setPrepTasks(prepRes.data.prep_tasks);
      // Reload inventory since ingredients were deducted
      const invRes = await axios.get(`${API}/inventory`);
      setInventory(invRes.data.inventory);
      // Reload prep alerts
      const alertsRes = await axios.get(`${API}/meal-plan/prep-alerts`);
      setPrepAlerts(alertsRes.data || { alerts: [], has_urgent: false });
      loadTodaySuggestions();
      
      // Show feedback about deducted ingredients
      if (response.data.ingredients_deducted?.length > 0) {
        console.log('Ingredients used:', response.data.ingredients_deducted);
      }
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
  const generateRecipe = async (category, servings = 'individual', mealId = null) => {
    const meal = settings.selected_meals[category];
    if (!meal) return;

    setAiLoading(true);
    setActiveModal('ai-response');
    setAiResponse({ 
      title: `Generating ${meal.name}...`, 
      content: "AI is cooking up something amazing...",
      servings: servings
    });

    try {
      const res = await axios.post(`${API}/ai/recipe`, {
        meal_name: meal.name,
        meal_blueprint: meal.blueprint,
        category: category,
        servings: servings,
        meal_id: mealId || meal.id
      });
      setAiResponse({ 
        title: meal.name, 
        content: res.data.recipe,
        servings: res.data.servings,
        serving_count: res.data.serving_count
      });
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
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleNotifications} 
              className={`p-2 rounded-full transition ${notificationsEnabled ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30' : 'hover:bg-slate-700 text-slate-400'}`}
              title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              data-testid="notifications-toggle"
            >
              {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <button onClick={() => setActiveModal('settings')} className="p-2 hover:bg-slate-700 rounded-full transition" data-testid="settings-button">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-md w-full p-6 shadow-2xl">
            {onboardingStep === 0 && (
              <div className="text-center space-y-4">
                <div className="text-5xl">💪</div>
                <h2 className="text-2xl font-black text-blue-400">Welcome to Beast Hub!</h2>
                <p className="text-slate-300">Your personal transformation command center. Let's get you set up in 3 quick steps.</p>
                <button 
                  onClick={() => setOnboardingStep(1)}
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 py-3 rounded-xl font-bold uppercase"
                >
                  Let's Go →
                </button>
              </div>
            )}
            {onboardingStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-400">
                  <span className="bg-emerald-600/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
                  <h3 className="font-bold">Set Your Calorie Target</h3>
                </div>
                <p className="text-sm text-slate-400">This helps us suggest meals that fit your goals.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 1800, label: 'Aggressive Cut' },
                    { value: 2100, label: 'Moderate Cut' },
                    { value: 2400, label: 'Maintenance' },
                    { value: 2700, label: 'Lean Bulk' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={async () => {
                        await axios.post(`${API}/settings/calories`, { calorie_target: opt.value });
                        setSettings(prev => ({ ...prev, calorie_target: opt.value }));
                        setOnboardingStep(2);
                      }}
                      className="p-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition text-left"
                    >
                      <p className="font-bold text-emerald-400">{opt.value} cal</p>
                      <p className="text-xs text-slate-400">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {onboardingStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-blue-400">
                  <span className="bg-blue-600/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
                  <h3 className="font-bold">Generate Your Meal Plan</h3>
                </div>
                <p className="text-sm text-slate-400">We'll create a personalized meal plan with shopping list.</p>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4].map(w => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeeks(w)}
                      className={`flex-1 py-2 rounded-lg font-bold transition ${selectedWeeks === w ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      {w}W
                    </button>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    await generateMealPlan();
                    setOnboardingStep(3);
                  }}
                  disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 py-3 rounded-xl font-bold uppercase disabled:opacity-50"
                >
                  {aiLoading ? 'Generating...' : `Generate ${selectedWeeks}-Week Plan`}
                </button>
              </div>
            )}
            {onboardingStep === 3 && (
              <div className="text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <h2 className="text-2xl font-black text-emerald-400">You're All Set!</h2>
                <p className="text-slate-300">Your meal plan and shopping list are ready. Here's your daily flow:</p>
                <div className="text-left space-y-2 bg-slate-700/50 rounded-xl p-4">
                  <p className="text-sm"><span className="text-blue-400 font-bold">Daily:</span> Check habits, log meals & workouts</p>
                  <p className="text-sm"><span className="text-emerald-400 font-bold">Shop Day:</span> Use shopping list → Stock tab</p>
                  <p className="text-sm"><span className="text-amber-400 font-bold">Prep Day:</span> Batch cook from Prep tab</p>
                </div>
                <button 
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem('beastHubOnboarded', 'true');
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 py-3 rounded-xl font-bold uppercase"
                >
                  Start Tracking →
                </button>
              </div>
            )}
            {onboardingStep < 3 && (
              <button 
                onClick={() => {
                  setShowOnboarding(false);
                  localStorage.setItem('beastHubOnboarded', 'true');
                }}
                className="w-full mt-4 text-xs text-slate-500 hover:text-slate-400"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Goal Progress Bar */}
        {metrics.length > 0 && (
          <section className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/20 p-4" data-testid="goal-progress">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Goal: 12% Body Fat
              </h2>
              <span className="text-xs text-slate-400">
                {metrics[0]?.body_fat ? `Current: ${metrics[0].body_fat.toFixed(1)}%` : 'Log metrics to track'}
              </span>
            </div>
            <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
              {metrics[0]?.body_fat && (
                <>
                  {/* Progress bar showing how close to 12% goal */}
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, ((25 - metrics[0].body_fat) / (25 - 12)) * 100))}%` }}
                  />
                  {/* Goal marker at 12% */}
                  <div className="absolute right-0 top-0 h-full w-1 bg-emerald-400" title="12% Goal" />
                </>
              )}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-slate-500">
              <span>25%</span>
              <span className="text-emerald-400 font-bold">12% Goal →</span>
            </div>
          </section>
        )}

        {/* TODAY'S FOCUS - Primary Action Card */}
        <section className="bg-slate-800 rounded-2xl border border-slate-700 p-5 shadow-xl" data-testid="todays-focus">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" /> Today's Focus
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Habit Toggle - Prominent */}
            <button 
              onClick={async () => {
                const today = new Date().toISOString().split('T')[0];
                await axios.post(`${API}/habits/${today}`, { completed: !habits[today] });
                setHabits(prev => ({ ...prev, [today]: !prev[today] }));
              }}
              className={`col-span-1 p-4 rounded-xl border-2 transition-all ${
                habits[new Date().toISOString().split('T')[0]] 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                  : 'bg-slate-700/50 border-slate-600 hover:border-blue-500'
              }`}
              data-testid="today-habit-toggle"
            >
              <div className="flex flex-col items-center gap-2">
                {habits[new Date().toISOString().split('T')[0]] ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <Circle className="w-8 h-8" />
                )}
                <span className="text-xs font-bold uppercase">Daily Habit</span>
              </div>
            </button>
            
            {/* Workout Status */}
            <button 
              onClick={() => setActiveModal('workout')}
              className={`col-span-1 p-4 rounded-xl border-2 transition-all ${
                todayWorkout 
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                  : 'bg-slate-700/50 border-slate-600 hover:border-blue-500'
              }`}
              data-testid="today-workout-toggle"
            >
              <div className="flex flex-col items-center gap-2">
                {todayWorkout ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <Dumbbell className="w-8 h-8" />
                )}
                <span className="text-xs font-bold uppercase">
                  {todayWorkout ? 'Logged' : (todayPlan?.training || 'Workout')}
                </span>
              </div>
            </button>
            
            {/* Meals Status */}
            <div className="col-span-1 p-4 rounded-xl bg-slate-700/50 border-2 border-slate-600">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  {todaySuggestions && ['breakfast', 'lunch', 'dinner'].map((meal, i) => {
                    const status = todaySuggestions[meal]?.status;
                    const isReady = status === 'ready_to_eat' || status === 'can_make_now';
                    return (
                      <div 
                        key={meal}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-400'
                        }`}
                      >
                        {isReady ? '✓' : i + 1}
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs font-bold uppercase text-slate-400">Meals</span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setActiveModal('meal-planner')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <Utensils className="w-3 h-3" /> Meals
            </button>
            <button 
              onClick={() => setActiveModal('shopping-list')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <ShoppingCart className="w-3 h-3" /> Shop
            </button>
            <button 
              onClick={() => setActiveModal('prep-checklist')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <ChefHat className="w-3 h-3" /> Prep
            </button>
          </div>
        </section>

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
                          {suggestion.status !== 'ready_to_eat' && (
                            <div className="flex gap-1 mt-2">
                              <button
                                onClick={() => {
                                  // Set the meal as selected for recipe generation
                                  const mealData = extendedMealLibrary[mealType]?.find(m => m.id === suggestion.planned.meal_id);
                                  if (mealData) {
                                    setSettings(prev => ({
                                      ...prev,
                                      selected_meals: {
                                        ...prev.selected_meals,
                                        [mealType]: mealData
                                      }
                                    }));
                                    generateRecipe(mealType, 'individual', suggestion.planned.meal_id);
                                  }
                                }}
                                className="text-[8px] px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-bold hover:bg-blue-500/30 transition"
                              >
                                Recipe (1)
                              </button>
                              <button
                                onClick={() => {
                                  const mealData = extendedMealLibrary[mealType]?.find(m => m.id === suggestion.planned.meal_id);
                                  if (mealData) {
                                    setSettings(prev => ({
                                      ...prev,
                                      selected_meals: {
                                        ...prev.selected_meals,
                                        [mealType]: mealData
                                      }
                                    }));
                                    generateRecipe(mealType, 'family', suggestion.planned.meal_id);
                                  }
                                }}
                                className="text-[8px] px-2 py-1 bg-purple-500/20 text-purple-400 rounded font-bold hover:bg-purple-500/30 transition"
                              >
                                Family
                              </button>
                            </div>
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

        {/* Prep Alerts Section - Urgent Prep Reminders */}
        {prepAlerts.alerts.length > 0 && (
          <section 
            className="bg-slate-800 rounded-2xl border border-amber-500/30 p-6 shadow-xl" 
            data-testid="prep-alerts-section"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400">
                  {prepAlerts.has_urgent ? 'Prep Reminders' : 'Upcoming Prep'}
                </span>
                {prepAlerts.has_urgent && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                    {prepAlerts.alerts.filter(a => a.urgency === 'NOW').length} today
                  </span>
                )}
              </h2>
              <button 
                onClick={() => setActiveModal('prep-checklist')} 
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                View All Prep Tasks
              </button>
            </div>
            
            <div className="space-y-3">
              {prepAlerts.alerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    alert.urgency === 'NOW' 
                      ? 'bg-amber-500/5 border-amber-500/30' 
                      : 'bg-slate-700/30 border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      alert.urgency === 'NOW' ? 'bg-amber-500/10' : 'bg-slate-700'
                    }`}>
                      <ChefHat className={`w-5 h-5 ${
                        alert.urgency === 'NOW' ? 'text-amber-400' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{alert.meal_name}</p>
                      <p className="text-xs text-slate-400">
                        For <span className="capitalize">{alert.meal_type}</span> on {new Date(alert.meal_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {alert.prep_time_minutes > 0 && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            ~{alert.prep_time_minutes < 60 ? `${alert.prep_time_minutes}min` : `${Math.round(alert.prep_time_minutes/60)}hr`} prep
                          </span>
                        )}
                        {alert.batch_prep_friendly && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            Batch x{alert.batch_size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      alert.urgency === 'NOW' 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {alert.urgency === 'NOW' ? 'Today' : 'Tomorrow'}
                    </span>
                    <button 
                      onClick={() => markPrepComplete(alert.meal_id, [alert.meal_date])}
                      className="block mt-2 text-[10px] text-emerald-400 font-bold hover:underline"
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              ))}
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

        {/* Weekly Summary Section */}
        {weeklySummary && (
          <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-xl" data-testid="weekly-summary">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Weekly Summary
              </h2>
              <button 
                onClick={async () => {
                  setAiLoading(true);
                  setActiveModal('ai-response');
                  setAiResponse({ title: 'Weekly Coaching', content: 'Analyzing your week...' });
                  try {
                    const res = await axios.post(`${API}/ai/weekly-coaching`);
                    setAiResponse({ title: 'Weekly Coaching', content: res.data.coaching });
                  } catch (error) {
                    setAiResponse({ title: 'Error', content: 'Failed to get coaching feedback.' });
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> Get AI Coaching
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Habits */}
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase text-slate-400">Habits</span>
                </div>
                <p className="text-2xl font-black text-emerald-400">{weeklySummary.habits.rate}%</p>
                <p className="text-[10px] text-slate-500">{weeklySummary.habits.completed}/7 days</p>
              </div>
              
              {/* Meal Prep */}
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase text-slate-400">Prep</span>
                </div>
                <p className="text-2xl font-black text-orange-400">{weeklySummary.meals.prep_rate}%</p>
                <p className="text-[10px] text-slate-500">{weeklySummary.meals.prepped}/{weeklySummary.meals.planned} meals</p>
              </div>
              
              {/* Workouts */}
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase text-slate-400">Workouts</span>
                </div>
                <p className="text-2xl font-black text-blue-400">{weeklySummary.workouts.completed}</p>
                <p className="text-[10px] text-slate-500">{weeklySummary.workouts.total_minutes} min total</p>
              </div>
              
              {/* Body Progress */}
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase text-slate-400">Body</span>
                </div>
                {weeklySummary.body_progress.weight_change !== null ? (
                  <>
                    <p className={`text-2xl font-black ${weeklySummary.body_progress.weight_change <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {weeklySummary.body_progress.weight_change > 0 ? '+' : ''}{weeklySummary.body_progress.weight_change} lbs
                    </p>
                    <p className="text-[10px] text-slate-500">
                      BF: {weeklySummary.body_progress.bf_change !== null ? `${weeklySummary.body_progress.bf_change > 0 ? '+' : ''}${weeklySummary.body_progress.bf_change}%` : 'N/A'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-black text-slate-500">--</p>
                    <p className="text-[10px] text-slate-500">Log metrics to track</p>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Workout Tracker Section */}
        <section className="bg-slate-800 rounded-2xl border border-slate-700 p-6" data-testid="workout-tracker">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-400" />
              Today's Workout
            </h2>
            <button 
              onClick={() => setActiveModal('workout')}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1 transition"
              data-testid="log-workout-btn"
            >
              <Plus className="w-3 h-3" /> Log Workout
            </button>
          </div>
          
          {todayWorkout ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-blue-400">{todayWorkout.workout_type}</p>
                  <p className="text-xs text-slate-400">{todayWorkout.duration_minutes} minutes • {todayWorkout.exercises?.length || 0} exercises</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              
              {todayWorkout.exercises?.length > 0 && (
                <div className="space-y-1">
                  {todayWorkout.exercises.slice(0, 3).map((ex, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg text-sm">
                      <span className="font-medium">{ex.exercise}</span>
                      <span className="text-slate-400 text-xs">{ex.sets}x{ex.reps} @ {ex.weight}lbs</span>
                    </div>
                  ))}
                  {todayWorkout.exercises.length > 3 && (
                    <p className="text-xs text-slate-500 text-center">+{todayWorkout.exercises.length - 3} more exercises</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No workout logged today</p>
              <p className="text-[10px] text-slate-500">
                {todayPlan?.training ? `Scheduled: ${todayPlan.training}` : 'Rest day or schedule not set'}
              </p>
            </div>
          )}
        </section>
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
          onGoToShopping={() => setActiveModal('shopping-list')}
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
          extendedLibrary={extendedMealLibrary}
          onGetRecipe={(mealId, mealType) => {
            const mealData = extendedMealLibrary[mealType]?.find(m => m.id === mealId);
            if (mealData) {
              setSettings(prev => ({
                ...prev,
                selected_meals: { ...prev.selected_meals, [mealType]: mealData }
              }));
              generateRecipe(mealType, 'individual', mealId);
            }
          }}
        />
      </Modal>

      <Modal isOpen={activeModal === 'inventory'} onClose={() => setActiveModal(null)} title="Ingredient Stock">
        <InventoryModal inventory={inventory} setInventory={setInventory} />
      </Modal>

      <Modal isOpen={activeModal === 'workout'} onClose={() => setActiveModal(null)} title="Log Workout">
        <WorkoutModal 
          todayWorkout={todayWorkout} 
          setTodayWorkout={setTodayWorkout}
          todayPlan={todayPlan}
          onClose={() => setActiveModal(null)}
          reloadData={loadAllData}
        />
      </Modal>

      <Modal isOpen={activeModal === 'ai-response'} onClose={() => setActiveModal(null)} title={aiResponse?.title || 'AI Response'}>
        <div className="max-w-none">
          {aiLoading ? (
            <div className="animate-pulse text-blue-400 text-center py-10 text-lg font-bold">Generating...</div>
          ) : (
            <>
              {aiResponse?.servings && (
                <div className={`mb-4 p-3 rounded-xl border ${
                  aiResponse.servings === 'family' 
                    ? 'bg-purple-500/10 border-purple-500/30' 
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <p className={`text-xs font-bold uppercase ${
                    aiResponse.servings === 'family' ? 'text-purple-400' : 'text-blue-400'
                  }`}>
                    {aiResponse.servings === 'family' 
                      ? `👨‍👩‍👧‍👦 Family Size (${aiResponse.serving_count} servings)` 
                      : `🏋️ Individual (${aiResponse.serving_count} serving)`
                    }
                  </p>
                </div>
              )}
              <FormattedAIResponse content={aiResponse?.content} />
            </>
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
function MealPlannerModal({ mealPlan, setMealPlan, extendedLibrary, selectedWeeks, setSelectedWeeks, onGenerate, aiLoading, onGoToShopping }) {
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
            
            {/* Next Step: Shopping List */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <button
                onClick={onGoToShopping}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-3 rounded-xl font-bold uppercase tracking-wider text-white hover:scale-[1.02] transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" /> Next: View Shopping List →
              </button>
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
  
  const copyToClipboard = () => {
    const listText = categories.map(cat => {
      const catItems = items.filter(i => i.category === cat && !i.purchased);
      if (catItems.length === 0) return '';
      return `📦 ${cat}\n${catItems.map(i => `  • ${i.item} (${i.amount})`).join('\n')}`;
    }).filter(Boolean).join('\n\n');
    
    const header = `🛒 Beast Hub Shopping List\n${new Date().toLocaleDateString()}\n${'─'.repeat(25)}\n\n`;
    const footer = `\n\n✅ ${items.filter(i => i.purchased).length}/${items.length} items purchased`;
    
    navigator.clipboard.writeText(header + listText + footer);
    alert('Shopping list copied to clipboard!');
  };

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
            <div className="flex gap-2">
              <button 
                onClick={copyToClipboard}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg font-bold text-emerald-400 transition flex items-center gap-1"
                data-testid="copy-list-btn"
              >
                <ClipboardList className="w-3 h-3" /> Copy List
              </button>
              <button onClick={onGenerate} className="text-xs text-blue-400 font-bold hover:underline">
                Regenerate
              </button>
            </div>
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
function PrepChecklistModal({ tasks, onComplete, extendedLibrary, onGetRecipe }) {
  // Find meal type by checking all categories
  const findMealType = (mealId) => {
    for (const [type, meals] of Object.entries(extendedLibrary || {})) {
      if (meals.find(m => m.id === mealId)) return type;
    }
    return 'dinner'; // default
  };

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
                  <div className="flex flex-col gap-2">
                    {!task.completed && (
                      <>
                        <button
                          onClick={() => onGetRecipe(task.meal_id, findMealType(task.meal_id))}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1"
                        >
                          <ChefHat className="w-3 h-3" /> Recipe
                        </button>
                        <button
                          onClick={() => onComplete(task.meal_id, task.serves_dates)}
                          className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition"
                        >
                          Mark Done
                        </button>
                      </>
                    )}
                  </div>
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
function InventoryModal({ inventory, setInventory }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ item: '', amount: '', category: 'Produce' });
  const [editAmount, setEditAmount] = useState('');

  const categories = [...new Set(inventory.map(item => item.category))];
  const allCategories = ['Protein', 'Produce', 'Dairy', 'Pantry', 'Frozen'];

  const handleAddItem = async () => {
    if (!newItem.item.trim() || !newItem.amount.trim()) return;
    
    try {
      const res = await axios.post(`${BACKEND_URL}/api/inventory/add`, newItem);
      setInventory(res.data.inventory);
      setNewItem({ item: '', amount: '', category: 'Produce' });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding item:", error);
      alert(`Failed to add item: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleUpdateItem = async (itemName) => {
    if (!editAmount.trim()) return;
    
    try {
      const res = await axios.post(`${BACKEND_URL}/api/inventory/update`, {
        item: itemName,
        amount: editAmount
      });
      setInventory(res.data.inventory);
      setEditingItem(null);
      setEditAmount('');
    } catch (error) {
      console.error("Error updating item:", error);
      alert(`Failed to update item: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDeleteItem = async (itemName) => {
    if (!confirm(`Remove "${itemName}" from inventory?`)) return;
    
    try {
      const res = await axios.delete(`${BACKEND_URL}/api/inventory/${encodeURIComponent(itemName)}`);
      setInventory(res.data.inventory);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(`Failed to delete item: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Item Button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">
          {inventory.length > 0 ? `${inventory.length} ingredients in stock` : 'No ingredients tracked yet'}
        </p>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition"
          data-testid="add-inventory-btn"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 space-y-3">
          <h4 className="text-xs font-black uppercase text-emerald-400">Add New Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Item name"
              value={newItem.item}
              onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              data-testid="new-item-name"
            />
            <input
              type="text"
              placeholder="Amount (e.g., 2 lbs)"
              value={newItem.amount}
              onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              data-testid="new-item-amount"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              data-testid="new-item-category"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddItem}
              className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-xs font-bold uppercase transition"
              data-testid="confirm-add-item"
            >
              Add to Stock
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewItem({ item: '', amount: '', category: 'Produce' }); }}
              className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg text-xs font-bold uppercase transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {inventory.length === 0 && !showAddForm ? (
        <div className="text-center py-10">
          <p className="text-slate-400">No ingredients tracked yet</p>
          <p className="text-xs text-slate-500 mt-2">Items are auto-added when you check them off the shopping list, or add them manually above</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
            <p className="text-xs text-blue-300">
              💡 <strong>Tip:</strong> Ingredients are automatically removed when you mark a meal as prepped
            </p>
          </div>

          {(categories.length > 0 ? categories : []).map((category) => {
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
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50 hover:border-slate-500 transition"
                    >
                      <div className="flex-grow">
                        <p className="text-sm font-bold">{item.item}</p>
                        {editingItem === item.item ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder={item.amount}
                              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs w-24 focus:border-blue-500 focus:outline-none"
                              autoFocus
                              data-testid={`edit-amount-${item.item}`}
                            />
                            <button
                              onClick={() => handleUpdateItem(item.item)}
                              className="text-emerald-400 hover:text-emerald-300 text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingItem(null); setEditAmount(''); }}
                              className="text-slate-400 hover:text-slate-300 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400">{item.amount}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 uppercase">Purchased</p>
                          <p className="text-xs text-slate-400">{item.purchased_date}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingItem(item.item); setEditAmount(item.amount); }}
                            className="p-1.5 hover:bg-slate-600 rounded transition text-blue-400 hover:text-blue-300"
                            title="Edit quantity"
                            data-testid={`edit-btn-${item.item}`}
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.item)}
                            className="p-1.5 hover:bg-red-500/20 rounded transition text-red-400 hover:text-red-300"
                            title="Remove from inventory"
                            data-testid={`delete-btn-${item.item}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
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

// Workout Logger Modal
function WorkoutModal({ todayWorkout, setTodayWorkout, todayPlan, onClose, reloadData }) {
  const today = new Date().toISOString().split('T')[0];
  const [workoutType, setWorkoutType] = useState(todayWorkout?.workout_type || todayPlan?.training || 'Custom');
  const [duration, setDuration] = useState(todayWorkout?.duration_minutes || 45);
  const [exercises, setExercises] = useState(todayWorkout?.exercises || []);
  const [newExercise, setNewExercise] = useState({ exercise: '', sets: 3, reps: 10, weight: 0 });
  const [saving, setSaving] = useState(false);

  const workoutTypes = [
    "Lower A (Squat Focus)",
    "Upper A (Bench Focus)", 
    "Lower B (Deadlift Focus)",
    "Upper B (OHP Focus)",
    "Full Body",
    "Cardio/HIIT",
    "Active Recovery",
    "Custom"
  ];

  const commonExercises = {
    "Lower A (Squat Focus)": ["Back Squat", "Leg Press", "Romanian Deadlift", "Leg Curl", "Calf Raises"],
    "Upper A (Bench Focus)": ["Bench Press", "Incline DB Press", "Cable Flyes", "Tricep Pushdowns", "Lateral Raises"],
    "Lower B (Deadlift Focus)": ["Deadlift", "Front Squat", "Hip Thrust", "Leg Extension", "Nordic Curls"],
    "Upper B (OHP Focus)": ["Overhead Press", "Pull-ups", "Barbell Row", "Face Pulls", "Bicep Curls"],
    "Full Body": ["Squat", "Bench Press", "Deadlift", "Pull-ups", "Shoulder Press"],
    "Cardio/HIIT": ["Sprints", "Rowing", "Bike Intervals", "Jump Rope", "Burpees"],
    "Active Recovery": ["Walking", "Light Stretching", "Yoga", "Swimming", "Mobility Work"]
  };

  const addExercise = () => {
    if (!newExercise.exercise.trim()) return;
    setExercises([...exercises, { ...newExercise }]);
    setNewExercise({ exercise: '', sets: 3, reps: 10, weight: exercises.length > 0 ? exercises[exercises.length-1].weight : 0 });
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const saveWorkout = async () => {
    setSaving(true);
    try {
      await axios.post(`${BACKEND_URL}/api/workouts`, {
        date: today,
        workout_type: workoutType,
        exercises: exercises,
        duration_minutes: duration,
        notes: ""
      });
      await reloadData();
      onClose();
    } catch (error) {
      console.error("Error saving workout:", error);
      alert(`Failed to save workout: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const suggestedExercises = commonExercises[workoutType] || commonExercises["Custom"] || [];

  return (
    <div className="space-y-6">
      {/* Workout Type */}
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Workout Type</label>
        <select
          value={workoutType}
          onChange={(e) => setWorkoutType(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white font-bold"
          data-testid="workout-type-select"
        >
          {workoutTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Duration (minutes)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-xl font-bold text-center"
          min="0"
          max="300"
          data-testid="workout-duration"
        />
      </div>

      {/* Exercise Log */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Exercises ({exercises.length})</label>
          {suggestedExercises.length > 0 && (
            <span className="text-[9px] text-slate-500">Tap suggestions below</span>
          )}
        </div>

        {/* Suggested Exercises */}
        <div className="flex flex-wrap gap-1 mb-3">
          {suggestedExercises.map((ex) => (
            <button
              key={ex}
              onClick={() => setNewExercise({ ...newExercise, exercise: ex })}
              className={`text-[10px] px-2 py-1 rounded transition ${
                newExercise.exercise === ex 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Add Exercise Form */}
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600 space-y-2">
          <input
            type="text"
            placeholder="Exercise name"
            value={newExercise.exercise}
            onChange={(e) => setNewExercise({ ...newExercise, exercise: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            data-testid="exercise-name-input"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] text-slate-500 uppercase">Sets</label>
              <input
                type="number"
                value={newExercise.sets}
                onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-center"
                min="1"
                max="20"
                data-testid="exercise-sets-input"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase">Reps</label>
              <input
                type="number"
                value={newExercise.reps}
                onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-center"
                min="1"
                max="100"
                data-testid="exercise-reps-input"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase">Weight</label>
              <input
                type="number"
                value={newExercise.weight}
                onChange={(e) => setNewExercise({ ...newExercise, weight: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-center"
                min="0"
                step="2.5"
                data-testid="exercise-weight-input"
              />
            </div>
          </div>
          <button
            onClick={addExercise}
            disabled={!newExercise.exercise.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed py-2 rounded-lg text-xs font-bold uppercase transition"
            data-testid="add-exercise-btn"
          >
            + Add Exercise
          </button>
        </div>

        {/* Logged Exercises */}
        {exercises.length > 0 && (
          <div className="mt-3 space-y-1">
            {exercises.map((ex, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{ex.exercise}</p>
                  <p className="text-[10px] text-slate-400">{ex.sets}x{ex.reps} @ {ex.weight} lbs</p>
                </div>
                <button
                  onClick={() => removeExercise(idx)}
                  className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={saveWorkout}
        disabled={saving}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-lg hover:scale-105 transition disabled:opacity-50"
        data-testid="save-workout-btn"
      >
        {saving ? 'Saving...' : `Save Workout (${exercises.length} exercises)`}
      </button>

      {/* Tip */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>💪 Log your key compound lifts to track progress</p>
        <p>📈 Weight × Sets × Reps = Volume (track this for gains)</p>
      </div>
    </div>
  );
}
