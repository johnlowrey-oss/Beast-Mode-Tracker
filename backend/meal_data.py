# Extended Meal Library with Metadata for Smart Planning

EXTENDED_MEAL_LIBRARY = {
    "breakfast": [
        {
            "id": "b1",
            "name": "Beast Oats (High-Protein Overnight)",
            "macros": "450 Cal | 35g P",
            "calories": 450,
            "protein": 35,
            "carbs": 65,
            "fat": 8,
            "blueprint": "1/2 cup Rolled Oats, 1 scoop Whey Protein (Vanilla), 1 tbsp Chia Seeds, 3/4 cup Almond Milk, 1/2 cup Frozen Berries",
            "category": "breakfast",
            "prep_time_minutes": 5,
            "requires_advance_prep": True,
            "advance_prep_days": 1,  # Needs overnight
            "batch_prep_friendly": True,
            "batch_size": 5,
            "shelf_life_days": 5,
            "prep_day_recommended": "Sunday",
            "dad_servings": 1,
            "family_servings": 4,
            "ingredients": [
                {"item": "Rolled Oats", "amount": "1/2 cup", "category": "Pantry"},
                {"item": "Whey Protein (Vanilla)", "amount": "1 scoop", "category": "Pantry"},
                {"item": "Chia Seeds", "amount": "1 tbsp", "category": "Pantry"},
                {"item": "Unsweetened Almond Milk", "amount": "3/4 cup", "category": "Dairy"},
                {"item": "Frozen Mixed Berries", "amount": "1/2 cup", "category": "Frozen"}
            ]
        },
        {
            "id": "b2",
            "name": "Steak & Egg Scramble",
            "macros": "550 Cal | 45g P",
            "calories": 550,
            "protein": 45,
            "carbs": 15,
            "fat": 35,
            "blueprint": "4oz Lean Sirloin, 2 Eggs, 1/2 cup Egg Whites, Spinach, Bell Peppers",
            "category": "breakfast",
            "prep_time_minutes": 15,
            "requires_advance_prep": False,
            "advance_prep_days": 0,
            "batch_prep_friendly": False,
            "batch_size": 1,
            "shelf_life_days": 1,
            "prep_day_recommended": None,
            "dad_servings": 1,
            "family_servings": 3,
            "ingredients": [
                {"item": "Lean Sirloin Steak", "amount": "4oz", "category": "Protein"},
                {"item": "Eggs", "amount": "2", "category": "Dairy"},
                {"item": "Egg Whites", "amount": "1/2 cup", "category": "Dairy"},
                {"item": "Fresh Spinach", "amount": "1 cup", "category": "Produce"},
                {"item": "Bell Peppers", "amount": "1/2 cup", "category": "Produce"}
            ]
        },
        {
            "id": "b3",
            "name": "Greek Yogurt Power Bowl",
            "macros": "480 Cal | 42g P",
            "calories": 480,
            "protein": 42,
            "carbs": 58,
            "fat": 12,
            "blueprint": "2 cups Non-fat Greek Yogurt, 1/4 cup Granola, 1 tbsp Honey, 1/2 cup Mixed Berries, 1 tbsp Almond Butter",
            "category": "breakfast",
            "prep_time_minutes": 3,
            "requires_advance_prep": False,
            "advance_prep_days": 0,
            "batch_prep_friendly": False,
            "batch_size": 1,
            "shelf_life_days": 1,
            "prep_day_recommended": None,
            "dad_servings": 1,
            "family_servings": 2,
            "ingredients": [
                {"item": "Non-fat Greek Yogurt", "amount": "2 cups", "category": "Dairy"},
                {"item": "Granola", "amount": "1/4 cup", "category": "Pantry"},
                {"item": "Honey", "amount": "1 tbsp", "category": "Pantry"},
                {"item": "Mixed Berries", "amount": "1/2 cup", "category": "Produce"},
                {"item": "Almond Butter", "amount": "1 tbsp", "category": "Pantry"}
            ]
        }
    ],
    "lunch": [
        {
            "id": "l1",
            "name": "Adult Lunchable (Chicken Edition)",
            "macros": "550 Cal | 50g P",
            "calories": 550,
            "protein": 50,
            "carbs": 35,
            "fat": 22,
            "blueprint": "8oz Grilled Chicken Breast, 1 bag Steamfresh Veggies, 1/2 Avocado, Light Vinaigrette",
            "category": "lunch",
            "prep_time_minutes": 10,
            "requires_advance_prep": True,
            "advance_prep_days": 1,
            "batch_prep_friendly": True,
            "batch_size": 5,
            "shelf_life_days": 4,
            "prep_day_recommended": "Sunday",
            "dad_servings": 1,
            "family_servings": 3,
            "ingredients": [
                {"item": "Chicken Breast", "amount": "8oz", "category": "Protein"},
                {"item": "Steamfresh Veggies", "amount": "1 bag", "category": "Frozen"},
                {"item": "Avocado", "amount": "1/2", "category": "Produce"},
                {"item": "Light Vinaigrette", "amount": "2 tbsp", "category": "Pantry"}
            ]
        },
        {
            "id": "l2",
            "name": "Tuna Greek Salad",
            "macros": "520 Cal | 55g P",
            "calories": 520,
            "protein": 55,
            "carbs": 28,
            "fat": 18,
            "blueprint": "2 cans Tuna (in water), 1/2 cup Greek Yogurt, Celery, Greens, Olives, Cucumber, Feta",
            "category": "lunch",
            "prep_time_minutes": 8,
            "requires_advance_prep": False,
            "advance_prep_days": 0,
            "batch_prep_friendly": True,
            "batch_size": 3,
            "shelf_life_days": 2,
            "prep_day_recommended": None,
            "dad_servings": 1,
            "family_servings": 2,
            "ingredients": [
                {"item": "Tuna (in water)", "amount": "2 cans", "category": "Pantry"},
                {"item": "Greek Yogurt", "amount": "1/2 cup", "category": "Dairy"},
                {"item": "Celery", "amount": "2 stalks", "category": "Produce"},
                {"item": "Mixed Greens", "amount": "2 cups", "category": "Produce"},
                {"item": "Olives", "amount": "1/4 cup", "category": "Pantry"},
                {"item": "Cucumber", "amount": "1/2", "category": "Produce"},
                {"item": "Feta Cheese", "amount": "2 tbsp", "category": "Dairy"}
            ]
        },
        {
            "id": "l3",
            "name": "Turkey & Hummus Wrap",
            "macros": "540 Cal | 48g P",
            "calories": 540,
            "protein": 48,
            "carbs": 52,
            "fat": 16,
            "blueprint": "8oz Sliced Turkey Breast, 3 tbsp Hummus, Whole Wheat Wrap, Lettuce, Tomato, Cucumber",
            "category": "lunch",
            "prep_time_minutes": 5,
            "requires_advance_prep": False,
            "advance_prep_days": 0,
            "batch_prep_friendly": True,
            "batch_size": 3,
            "shelf_life_days": 2,
            "prep_day_recommended": None,
            "dad_servings": 1,
            "family_servings": 4,
            "ingredients": [
                {"item": "Sliced Turkey Breast", "amount": "8oz", "category": "Protein"},
                {"item": "Hummus", "amount": "3 tbsp", "category": "Pantry"},
                {"item": "Whole Wheat Wrap", "amount": "1", "category": "Pantry"},
                {"item": "Lettuce", "amount": "1 cup", "category": "Produce"},
                {"item": "Tomato", "amount": "1", "category": "Produce"},
                {"item": "Cucumber", "amount": "1/4", "category": "Produce"}
            ]
        }
    ],
    "dinner": [
        {
            "id": "d1",
            "name": "Modular Turkey Chili (Hidden Veggie)",
            "macros": "700 Cal | 60g P",
            "calories": 700,
            "protein": 60,
            "carbs": 68,
            "fat": 18,
            "blueprint": "2lbs 99% Lean Ground Turkey, 2 cans Kidney Beans, 1 can Fire Roasted Tomatoes, 1 Onion, 2 Bell Peppers, 1 Zucchini (grated), Chili Seasoning",
            "category": "dinner",
            "prep_time_minutes": 45,
            "requires_advance_prep": True,
            "advance_prep_days": 1,
            "batch_prep_friendly": True,
            "batch_size": 6,
            "shelf_life_days": 5,
            "prep_day_recommended": "Sunday",
            "dad_servings": 1,
            "family_servings": 6,
            "ingredients": [
                {"item": "99% Lean Ground Turkey", "amount": "2lbs", "category": "Protein"},
                {"item": "Kidney Beans", "amount": "2 cans", "category": "Pantry"},
                {"item": "Fire Roasted Tomatoes", "amount": "1 can", "category": "Pantry"},
                {"item": "Onion", "amount": "1", "category": "Produce"},
                {"item": "Bell Peppers", "amount": "2", "category": "Produce"},
                {"item": "Zucchini", "amount": "1", "category": "Produce"},
                {"item": "Chili Seasoning", "amount": "1 packet", "category": "Pantry"}
            ]
        },
        {
            "id": "d2",
            "name": "Slow Cooker Salsa Chicken",
            "macros": "650 Cal | 58g P",
            "blueprint": "3lbs Chicken Thighs, 1 jar Salsa, Taco Seasoning, Black Beans. Cook on low 6-8 hours, shred with forks",
            "category": "dinner",
            "prep_time_minutes": 480,  # 8 hours slow cook
            "requires_advance_prep": True,
            "advance_prep_days": 1,
            "batch_prep_friendly": True,
            "batch_size": 6,
            "shelf_life_days": 4,
            "prep_day_recommended": "Sunday",
            "dad_servings": 1,
            "family_servings": 6,
            "ingredients": [
                {"item": "Chicken Thighs (Boneless Skinless)", "amount": "3lbs", "category": "Protein"},
                {"item": "Salsa (Mild or Medium)", "amount": "1 jar", "category": "Pantry"},
                {"item": "Taco Seasoning", "amount": "1 packet", "category": "Pantry"},
                {"item": "Black Beans", "amount": "1 can", "category": "Pantry"}
            ]
        },
        {
            "id": "d3",
            "name": "Sheet Pan Roasted Meat & Veg",
            "macros": "680 Cal | 56g P",
            "blueprint": "Chicken Sausage sliced + Broccoli + Sweet Potatoes cubed + Bell Peppers. Toss in olive oil, salt, pepper, garlic powder. Roast 400°F for 25-30 mins",
            "category": "dinner",
            "prep_time_minutes": 35,
            "requires_advance_prep": False,
            "advance_prep_days": 0,
            "batch_prep_friendly": True,
            "batch_size": 4,
            "shelf_life_days": 3,
            "prep_day_recommended": None,
            "dad_servings": 1,
            "family_servings": 4,
            "ingredients": [
                {"item": "Chicken Sausage", "amount": "1 package", "category": "Protein"},
                {"item": "Broccoli Florets", "amount": "2 cups", "category": "Produce"},
                {"item": "Sweet Potatoes", "amount": "2 medium", "category": "Produce"},
                {"item": "Bell Peppers", "amount": "2", "category": "Produce"},
                {"item": "Olive Oil", "amount": "2 tbsp", "category": "Pantry"},
                {"item": "Garlic Powder", "amount": "1 tsp", "category": "Pantry"}
            ]
        }
    ]
}

# Shopping list categories for organization
SHOPPING_CATEGORIES = ["Protein", "Produce", "Dairy", "Pantry", "Frozen"]

# Prep day defaults
PREP_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
