"""
Test suite for Beast Transformation Hub - P1 and P2 Features
Tests:
P1: Prep Day Reminders
  - Prep alerts endpoint returns alerts with urgency (NOW/TOMORROW)
  - Prep alerts show meal details (name, type, date, prep_time)
  - Mark Done functionality works

P2: Recipe Scaling
  - Recipe endpoint accepts servings parameter (individual/family)
  - Individual servings returns correct serving_count
  - Family servings returns correct serving_count
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://beast-hub.preview.emergentagent.com').rstrip('/')


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestPrepAlertsP1:
    """P1: Test Prep Day Reminders - Prep Alerts API"""
    
    def test_prep_alerts_endpoint_returns_200(self, api_client):
        """Test GET /api/meal-plan/prep-alerts returns 200"""
        response = api_client.get(f"{BASE_URL}/api/meal-plan/prep-alerts")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "alerts" in data, "Response should contain 'alerts' key"
        assert "has_urgent" in data, "Response should contain 'has_urgent' key"
        print(f"✓ GET /api/meal-plan/prep-alerts returns 200 with {len(data['alerts'])} alerts")
    
    def test_prep_alerts_structure(self, api_client):
        """Test prep alerts have correct structure with urgency field"""
        response = api_client.get(f"{BASE_URL}/api/meal-plan/prep-alerts")
        assert response.status_code == 200
        
        data = response.json()
        alerts = data["alerts"]
        
        if len(alerts) == 0:
            pytest.skip("No prep alerts available - need meal plan with upcoming meals")
        
        # Check first alert has required fields
        alert = alerts[0]
        required_fields = ["meal_id", "meal_name", "meal_type", "meal_date", "prep_by", "urgency"]
        for field in required_fields:
            assert field in alert, f"Alert missing required field: {field}"
        
        # Check urgency is valid value
        assert alert["urgency"] in ["NOW", "TOMORROW", "UPCOMING"], f"Invalid urgency: {alert['urgency']}"
        
        print(f"✓ Prep alert structure is correct with urgency: {alert['urgency']}")
    
    def test_prep_alerts_urgency_values(self, api_client):
        """Test that urgency values are NOW or TOMORROW (not UPCOMING)"""
        response = api_client.get(f"{BASE_URL}/api/meal-plan/prep-alerts")
        assert response.status_code == 200
        
        data = response.json()
        alerts = data["alerts"]
        
        if len(alerts) == 0:
            pytest.skip("No prep alerts available")
        
        # All returned alerts should be NOW or TOMORROW (UPCOMING is filtered out)
        for alert in alerts:
            assert alert["urgency"] in ["NOW", "TOMORROW"], f"Unexpected urgency: {alert['urgency']}"
        
        print(f"✓ All {len(alerts)} alerts have valid urgency (NOW/TOMORROW)")
    
    def test_prep_alerts_has_urgent_flag(self, api_client):
        """Test has_urgent flag is true when any alert has urgency=NOW"""
        response = api_client.get(f"{BASE_URL}/api/meal-plan/prep-alerts")
        assert response.status_code == 200
        
        data = response.json()
        alerts = data["alerts"]
        has_urgent = data["has_urgent"]
        
        # Check if has_urgent matches presence of NOW alerts
        has_now_alert = any(a["urgency"] == "NOW" for a in alerts)
        assert has_urgent == has_now_alert, f"has_urgent={has_urgent} but NOW alerts exist={has_now_alert}"
        
        print(f"✓ has_urgent flag correctly set to {has_urgent}")
    
    def test_prep_alerts_additional_fields(self, api_client):
        """Test prep alerts include prep_time_minutes and batch info"""
        response = api_client.get(f"{BASE_URL}/api/meal-plan/prep-alerts")
        assert response.status_code == 200
        
        data = response.json()
        alerts = data["alerts"]
        
        if len(alerts) == 0:
            pytest.skip("No prep alerts available")
        
        alert = alerts[0]
        
        # Check optional but expected fields
        assert "prep_time_minutes" in alert, "Alert should have prep_time_minutes"
        assert "batch_prep_friendly" in alert, "Alert should have batch_prep_friendly"
        
        if alert["batch_prep_friendly"]:
            assert "batch_size" in alert, "Batch-friendly alert should have batch_size"
        
        print(f"✓ Alert has prep_time_minutes={alert['prep_time_minutes']}, batch_prep_friendly={alert['batch_prep_friendly']}")


class TestMarkPrepDoneP1:
    """P1: Test Mark Done functionality for prep alerts"""
    
    def test_mark_prepped_endpoint(self, api_client):
        """Test POST /api/meal-plan/mark-prepped works"""
        # First get prep alerts to find a meal to mark
        alerts_response = api_client.get(f"{BASE_URL}/api/meal-plan/prep-alerts")
        assert alerts_response.status_code == 200
        
        alerts = alerts_response.json()["alerts"]
        
        if len(alerts) == 0:
            pytest.skip("No prep alerts to mark as done")
        
        alert = alerts[0]
        meal_id = alert["meal_id"]
        meal_date = alert["meal_date"]
        
        # Mark as prepped
        response = api_client.post(
            f"{BASE_URL}/api/meal-plan/mark-prepped?meal_id={meal_id}",
            json=[meal_date]
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        
        print(f"✓ Successfully marked meal {meal_id} as prepped for {meal_date}")


class TestRecipeScalingP2:
    """P2: Test Recipe Scaling - Individual vs Family portions"""
    
    def test_recipe_individual_servings(self, api_client):
        """Test recipe with individual servings returns serving_count=1"""
        payload = {
            "meal_name": "Beast Oats",
            "meal_blueprint": "Oats + Protein",
            "category": "breakfast",
            "servings": "individual"
        }
        
        response = api_client.post(f"{BASE_URL}/api/ai/recipe", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "recipe" in data, "Response should contain 'recipe'"
        assert "servings" in data, "Response should contain 'servings'"
        assert "serving_count" in data, "Response should contain 'serving_count'"
        
        assert data["servings"] == "individual", f"Expected servings='individual', got '{data['servings']}'"
        assert data["serving_count"] == 1, f"Expected serving_count=1, got {data['serving_count']}"
        
        print(f"✓ Individual recipe returns servings='individual', serving_count=1")
    
    def test_recipe_family_servings(self, api_client):
        """Test recipe with family servings returns serving_count=4"""
        payload = {
            "meal_name": "Beast Oats",
            "meal_blueprint": "Oats + Protein",
            "category": "breakfast",
            "servings": "family"
        }
        
        response = api_client.post(f"{BASE_URL}/api/ai/recipe", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "recipe" in data, "Response should contain 'recipe'"
        assert "servings" in data, "Response should contain 'servings'"
        assert "serving_count" in data, "Response should contain 'serving_count'"
        
        assert data["servings"] == "family", f"Expected servings='family', got '{data['servings']}'"
        # Family servings should be > 1 (typically 4)
        assert data["serving_count"] > 1, f"Expected serving_count > 1 for family, got {data['serving_count']}"
        
        print(f"✓ Family recipe returns servings='family', serving_count={data['serving_count']}")
    
    def test_recipe_default_servings(self, api_client):
        """Test recipe without servings parameter defaults to individual"""
        payload = {
            "meal_name": "Turkey Chili",
            "meal_blueprint": "Ground Turkey + Beans",
            "category": "dinner"
            # No servings parameter - should default to individual
        }
        
        response = api_client.post(f"{BASE_URL}/api/ai/recipe", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Default should be individual
        assert data["servings"] == "individual", f"Expected default servings='individual', got '{data['servings']}'"
        
        print(f"✓ Recipe without servings parameter defaults to 'individual'")
    
    def test_recipe_with_meal_id(self, api_client):
        """Test recipe with meal_id uses meal-specific serving sizes"""
        # Get extended library to find a meal with specific serving sizes
        library_response = api_client.get(f"{BASE_URL}/api/meals/library/extended")
        assert library_response.status_code == 200
        
        library = library_response.json()
        
        # Find a meal with dad_servings and family_servings
        test_meal = None
        for category, meals in library.items():
            for meal in meals:
                if "dad_servings" in meal and "family_servings" in meal:
                    test_meal = meal
                    break
            if test_meal:
                break
        
        if test_meal is None:
            pytest.skip("No meal with serving size info found")
        
        # Test individual with meal_id
        payload = {
            "meal_name": test_meal["name"],
            "meal_blueprint": test_meal.get("blueprint", ""),
            "category": test_meal["category"],
            "servings": "individual",
            "meal_id": test_meal["id"]
        }
        
        response = api_client.post(f"{BASE_URL}/api/ai/recipe", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        expected_dad_servings = test_meal.get("dad_servings", 1)
        
        assert data["serving_count"] == expected_dad_servings, \
            f"Expected serving_count={expected_dad_servings} for meal {test_meal['id']}, got {data['serving_count']}"
        
        print(f"✓ Recipe with meal_id uses meal-specific serving size: {data['serving_count']}")


class TestMealLibraryServingInfo:
    """Test that meal library contains serving size information"""
    
    def test_extended_library_has_serving_info(self, api_client):
        """Test extended meal library includes dad_servings and family_servings"""
        response = api_client.get(f"{BASE_URL}/api/meals/library/extended")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        library = response.json()
        
        # Check at least some meals have serving info
        meals_with_serving_info = 0
        total_meals = 0
        
        for category, meals in library.items():
            for meal in meals:
                total_meals += 1
                if "dad_servings" in meal or "family_servings" in meal:
                    meals_with_serving_info += 1
        
        print(f"✓ {meals_with_serving_info}/{total_meals} meals have serving size info")
        
        # At least some meals should have this info
        assert meals_with_serving_info > 0, "No meals have serving size information"


class TestTodaySuggestionsRecipeButtons:
    """Test today's suggestions include recipe button functionality"""
    
    def test_today_suggestions_endpoint(self, api_client):
        """Test GET /api/meal-plan/suggestions-today returns suggestions"""
        response = api_client.get(f"{BASE_URL}/api/meal-plan/suggestions-today")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should have breakfast, lunch, dinner suggestions
        for meal_type in ["breakfast", "lunch", "dinner"]:
            assert meal_type in data, f"Missing {meal_type} in suggestions"
            suggestion = data[meal_type]
            assert "planned" in suggestion, f"Missing 'planned' in {meal_type} suggestion"
            assert "status" in suggestion, f"Missing 'status' in {meal_type} suggestion"
        
        print(f"✓ Today's suggestions endpoint returns all meal types")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
