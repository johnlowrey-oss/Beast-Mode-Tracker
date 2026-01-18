// Modal Components for Beast Transformation Hub

import { Check, Circle, AlertTriangle, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

// Metrics Modal Component
export function MetricsModal({ metrics, settings, onLog }) {
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
export function WorkoutCues() {
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
export function MealPlannerModal({ mealPlan, extendedLibrary, selectedWeeks, setSelectedWeeks, onGenerate, aiLoading }) {
  return (
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
              <h3 className="text-lg font-bold text-emerald-400">{selectedWeeks}-Week Plan Active</h3>
              <p className="text-xs text-slate-400">{mealPlan.length} meals planned</p>
            </div>
            <button
              onClick={onGenerate}
              className="bg-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-600 transition"
            >
              Regenerate
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {Array.from({ length: selectedWeeks * 7 }, (_, dayIndex) => {
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
                        <div key={idx} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            {meal.is_prepped ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : mealData?.requires_advance_prep ? (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600" />
                            )}
                            <div>
                              <p className="text-xs font-bold capitalize">{meal.meal_type}</p>
                              <p className="text-[10px] text-slate-400">{meal.meal_name}</p>
                            </div>
                          </div>
                          {meal.is_prepped && (
                            <span className="text-[8px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-black">READY</span>
                          )}
                        </div>
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
  );
}

// Shopping List Modal
export function ShoppingListModal({ items, onToggle, onGenerate }) {
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
export function PrepChecklistModal({ tasks, onComplete }) {
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
export function InventoryModal({ inventory }) {
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
export function FormattedAIResponse({ content }) {
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
