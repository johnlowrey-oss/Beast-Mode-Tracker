import { useEffect, useState, useMemo } from "react";
import "./App.css";
import axios from "axios";
import { Calendar, Activity, Dumbbell, Utensils, Pill, Zap, BarChart2, Plus, Minus, Check, Circle, X, Settings, RefreshCw, Timer, ShoppingCart, Info } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState({});
  const [metrics, setMetrics] = useState([]);
  const [settings, setSettings] = useState({
    protein_target: 200,
    protein_current: 0,
    water_liters: 0.0,
    alcohol_count: 0,
    selected_meals: {}
  });
  const [supplements, setSupplements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [todayPlan, setTodayPlan] = useState(null);
  const [planner, setPlanner] = useState({});
  const [mealLibrary, setMealLibrary] = useState({ breakfast: [], lunch: [], dinner: [] });
  
  // UI State
  const [activeModal, setActiveModal] = useState(null); // 'settings', 'metrics', 'planner', 'workouts', 'med', 'shopping', 'meal-select'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [habitsRes, metricsRes, settingsRes, suppsRes, scheduleRes, todayRes, plannerRes, mealsRes] = await Promise.all([
        axios.get(`${API}/habits`),
        axios.get(`${API}/metrics`),
        axios.get(`${API}/settings`),
        axios.get(`${API}/supplements`),
        axios.get(`${API}/schedule`),
        axios.get(`${API}/schedule/today`),
        axios.get(`${API}/planner`),
        axios.get(`${API}/meals/library`)
      ]);

      setHabits(habitsRes.data.habits || {});
      setMetrics(metricsRes.data || []);
      setSettings(settingsRes.data);
      setSupplements(suppsRes.data.supplements || []);
      setSchedule(scheduleRes.data.schedule || []);
      setTodayPlan(todayRes.data);
      setPlanner(plannerRes.data.planner || {});
      setMealLibrary(mealsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

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

  // Water action
  const addWater = async () => {
    try {
      const res = await axios.post(`${API}/settings/water/add`);
      setSettings({ ...settings, water_liters: res.data.water_liters });
    } catch (error) {
      console.error("Error adding water:", error);
    }
  };

  // Alcohol action
  const addAlcohol = async () => {
    try {
      const res = await axios.post(`${API}/settings/alcohol/add`);
      setSettings({ ...settings, alcohol_count: res.data.alcohol_count });
    } catch (error) {
      alert(error.response?.data?.detail || "Error adding alcohol");
    }
  };

  // Toggle supplement
  const toggleSupplement = async (index) => {
    try {
      const res = await axios.post(`${API}/supplements/toggle?index=${index}`);
      setSupplements(res.data.supplements);
    } catch (error) {
      console.error("Error toggling supplement:", error);
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

  // Generate last 7 days for habit grid
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

  // Latest metrics
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

  // Log new metrics
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
              <p className="text-[10px] text-slate-400 uppercase font-black">Goal: 12%</p>
              <div className="w-full bg-slate-600 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${bfProgress}%` }}></div>
              </div>
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

        {/* Meals */}
        <section className="bg-slate-800 rounded-2xl border border-slate-700 p-6" data-testid="meals-section">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Utensils className="text-orange-500" /> Nutrition Hub</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['breakfast', 'lunch', 'dinner'].map((category) => {
              const meal = settings.selected_meals[category] || {};
              return (
                <div key={category} className="bg-slate-700/30 p-4 rounded-2xl border border-slate-600/50" data-testid={`meal-${category}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-[10px] font-black uppercase text-blue-400">{category}</h4>
                    <span className="text-[9px] font-bold text-slate-400">{meal.macros}</span>
                  </div>
                  <p className="text-xs font-bold mb-1 uppercase tracking-tighter h-8 line-clamp-2">{meal.name}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => generateRecipe(category)} className="flex-1 text-[10px] bg-blue-600/10 text-blue-400 py-2 rounded-lg font-black uppercase border border-blue-500/20 hover:bg-blue-600/20 transition" data-testid={`draft-recipe-${category}`}>
                      Draft ✨
                    </button>
                    <button onClick={() => { setSelectedCategory(category); setActiveModal('meal-select'); }} className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition" data-testid={`change-meal-${category}`}>
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Focus ✨</span>
        </button>
        <button onClick={() => setActiveModal('shopping')} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-purple-400 hover:scale-105 transition" data-testid="shopping-button">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Shop</span>
        </button>
        <button onClick={() => { setSelectedCategory('breakfast'); setActiveModal('meal-select'); }} className="h-14 px-4 rounded-2xl font-black text-[10px] shadow-lg active:scale-95 transition tracking-widest uppercase flex-1 max-w-[100px] mx-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white" data-testid="build-button">
          Build ✨
        </button>
        <button onClick={() => setActiveModal('planner')} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-emerald-400 hover:scale-105 transition" data-testid="planner-button">
          <Calendar className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Plan</span>
        </button>
        <button onClick={() => setActiveModal('metrics')} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-blue-400 hover:scale-105 transition" data-testid="metrics-nav-button">
          <BarChart2 className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Metrics</span>
        </button>
        <button onClick={() => setActiveModal('med')} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-orange-400 hover:scale-105 transition" data-testid="med-button">
          <Timer className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">MED</span>
        </button>
      </nav>

      {/* Modals */}
      <Modal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="System Config">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Protein Target (g/day)</label>
            <input type="number" value={settings.protein_target} readOnly className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-sm" />
          </div>
          <p className="text-[9px] text-slate-400 text-center font-black uppercase tracking-widest">Storage: MongoDB Active</p>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'metrics'} onClose={() => setActiveModal(null)} title="Analytics">
        <MetricsModal metrics={metrics} settings={settings} onLog={logMetrics} />
      </Modal>

      <Modal isOpen={activeModal === 'workouts'} onClose={() => setActiveModal(null)} title="Tall Lifter Cues">
        <WorkoutCues />
      </Modal>

      <Modal isOpen={activeModal === 'med'} onClose={() => setActiveModal(null)} title="MED Routine">
        <MEDRoutine />
      </Modal>

      <Modal isOpen={activeModal === 'shopping'} onClose={() => setActiveModal(null)} title="Supply List">
        <div className="p-20 text-center text-slate-400 uppercase font-black tracking-widest text-xs">
          Features expanding soon...
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'meal-select'} onClose={() => setActiveModal(null)} title={`Select ${selectedCategory}`}>
        <MealSelector category={selectedCategory} library={mealLibrary} settings={settings} onSelect={async (meal) => {
          try {
            await axios.post(`${API}/meals/select`, meal);
            await loadAllData();
            setActiveModal(null);
          } catch (error) {
            console.error("Error selecting meal:", error);
          }
        }} />
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
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl p-6 my-10 border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
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
              <p className="text-[10px] uppercase font-bold text-slate-400">BF%</p>
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

// MED Routine Component
function MEDRoutine() {
  const exercises = [
    { name: "Goblet Squat", sets: "3x15" },
    { name: "Pushups", sets: "3xMAX" },
    { name: "DB Row", sets: "3x15" }
  ];

  return (
    <ul className="space-y-3">
      {exercises.map((ex, idx) => (
        <li key={idx} className="flex justify-between p-3 bg-slate-700 rounded-xl border border-slate-600">
          <span>{ex.name}</span>
          <span className="font-black text-blue-400">{ex.sets}</span>
        </li>
      ))}
    </ul>
  );
}

// Formatted AI Response Component
function FormattedAIResponse({ content }) {
  if (!content) return null;

  // Split content by lines and format
  const formatContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentSection = [];
    let listItems = [];
    let inList = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // Skip empty lines but add spacing
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

      // Main headers (### or **TITLE**)
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

      // Subheaders (numbered like "1. **Ingredients**")
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

      // List items (starts with - or • or number.)
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

      // Bold text inline
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

      // Regular text
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

    // Add remaining content
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

// Meal Selector Component
function MealSelector({ category, library, settings, onSelect }) {
  const meals = library[category] || [];

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <button
          key={meal.id}
          onClick={() => onSelect(meal)}
          className="w-full p-4 bg-slate-700/50 rounded-xl border border-slate-600 hover:border-blue-500 transition text-left"
          data-testid={`meal-option-${meal.id}`}
        >
          <div className="flex justify-between items-start mb-2">
            <p className="font-bold text-sm uppercase tracking-tighter">{meal.name}</p>
            <span className="text-[9px] font-bold text-slate-400">{meal.macros}</span>
          </div>
          <p className="text-[10px] text-slate-400">{meal.blueprint}</p>
        </button>
      ))}
    </div>
  );
}

export default App;
