"""
Test suite for Beast Transformation Hub - Inventory System Improvements
Tests:
1. BUG FIX: Unchecking shopping list item removes from inventory
2. NEW: Manual inventory add
3. NEW: Manual inventory edit
4. NEW: Manual inventory delete
5. FEATURE: Ingredients deducted when marking prep complete
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


class TestInventoryManualCRUD:
    """Test manual inventory CRUD operations"""
    
    def test_add_inventory_item(self, api_client):
        """Test POST /api/inventory/add - manually add item to inventory"""
        # Add a test item
        payload = {
            "item": "TEST_Chicken Breast",
            "amount": "2 lbs",
            "category": "Protein"
        }
        response = api_client.post(f"{BASE_URL}/api/inventory/add", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert "inventory" in data
        
        # Verify item is in inventory
        inventory = data["inventory"]
        test_item = next((item for item in inventory if item["item"] == "TEST_Chicken Breast"), None)
        assert test_item is not None, "Added item not found in inventory"
        assert test_item["amount"] == "2 lbs"
        assert test_item["category"] == "Protein"
        print(f"✓ Successfully added TEST_Chicken Breast to inventory")
    
    def test_update_inventory_item(self, api_client):
        """Test POST /api/inventory/update - update item quantity"""
        # First ensure item exists
        add_payload = {
            "item": "TEST_Update_Item",
            "amount": "1 lb",
            "category": "Protein"
        }
        api_client.post(f"{BASE_URL}/api/inventory/add", json=add_payload)
        
        # Update the item
        update_payload = {
            "item": "TEST_Update_Item",
            "amount": "3 lbs"
        }
        response = api_client.post(f"{BASE_URL}/api/inventory/update", json=update_payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        
        # Verify update
        inventory = data["inventory"]
        updated_item = next((item for item in inventory if item["item"] == "TEST_Update_Item"), None)
        assert updated_item is not None, "Updated item not found"
        assert updated_item["amount"] == "3 lbs", f"Expected '3 lbs', got '{updated_item['amount']}'"
        print(f"✓ Successfully updated TEST_Update_Item amount to 3 lbs")
    
    def test_update_nonexistent_item_returns_404(self, api_client):
        """Test updating non-existent item returns 404"""
        update_payload = {
            "item": "NONEXISTENT_ITEM_12345",
            "amount": "5 lbs"
        }
        response = api_client.post(f"{BASE_URL}/api/inventory/update", json=update_payload)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly returns 404 for non-existent item update")
    
    def test_delete_inventory_item(self, api_client):
        """Test DELETE /api/inventory/{item_name} - remove item from inventory"""
        # First add an item to delete
        add_payload = {
            "item": "TEST_Delete_Item",
            "amount": "1 lb",
            "category": "Produce"
        }
        api_client.post(f"{BASE_URL}/api/inventory/add", json=add_payload)
        
        # Delete the item
        response = api_client.delete(f"{BASE_URL}/api/inventory/TEST_Delete_Item")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        
        # Verify item is removed
        inventory = data["inventory"]
        deleted_item = next((item for item in inventory if item["item"] == "TEST_Delete_Item"), None)
        assert deleted_item is None, "Deleted item still found in inventory"
        print(f"✓ Successfully deleted TEST_Delete_Item from inventory")
    
    def test_delete_nonexistent_item_returns_404(self, api_client):
        """Test deleting non-existent item returns 404"""
        response = api_client.delete(f"{BASE_URL}/api/inventory/NONEXISTENT_ITEM_67890")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly returns 404 for non-existent item delete")


class TestShoppingListToggleBugFix:
    """Test BUG FIX: Unchecking shopping list item removes from inventory"""
    
    def test_toggle_purchased_adds_to_inventory(self, api_client):
        """Test that checking a shopping list item adds it to inventory"""
        # First, we need a shopping list with items
        # Generate a meal plan to get shopping list
        plan_response = api_client.post(f"{BASE_URL}/api/meal-plan/generate", json={"weeks": 1})
        assert plan_response.status_code == 200, f"Failed to generate meal plan: {plan_response.text}"
        
        # Save the meal plan
        meal_plan = plan_response.json()["meal_plan"]
        weeks = plan_response.json()["weeks"]
        save_response = api_client.post(f"{BASE_URL}/api/meal-plan/save?weeks={weeks}", json=meal_plan)
        assert save_response.status_code == 200
        
        # Generate shopping list
        shop_response = api_client.get(f"{BASE_URL}/api/shopping-list/generate")
        assert shop_response.status_code == 200
        shopping_list = shop_response.json()["shopping_list"]
        
        if len(shopping_list) == 0:
            pytest.skip("No shopping list items generated")
        
        # Save shopping list
        save_shop_response = api_client.post(f"{BASE_URL}/api/shopping-list/save", json=shopping_list)
        assert save_shop_response.status_code == 200
        
        # Find an item that is NOT purchased and NOT in inventory
        test_idx = None
        for idx, item in enumerate(shopping_list):
            if not item.get("purchased", False):
                # Check if item is in inventory
                inv = api_client.get(f"{BASE_URL}/api/inventory").json()["inventory"]
                if not any(i["item"] == item["item"] for i in inv):
                    test_idx = idx
                    break
        
        if test_idx is None:
            pytest.skip("No suitable unpurchased item found")
        
        item_name = shopping_list[test_idx]["item"]
        
        # Get inventory count before toggle
        inv_before = api_client.get(f"{BASE_URL}/api/inventory").json()["inventory"]
        count_before = len([i for i in inv_before if i["item"] == item_name])
        
        # Toggle item to purchased (check it)
        toggle_response = api_client.post(f"{BASE_URL}/api/shopping-list/toggle-purchased?item_index={test_idx}")
        assert toggle_response.status_code == 200
        
        # Get inventory after toggle
        inv_after = api_client.get(f"{BASE_URL}/api/inventory").json()["inventory"]
        count_after = len([i for i in inv_after if i["item"] == item_name])
        
        # The item count should increase by 1
        assert count_after == count_before + 1, f"Item '{item_name}' count should increase by 1 when checked"
        print(f"✓ Checking shopping item '{item_name}' correctly adds to inventory (count: {count_before} -> {count_after})")
    
    def test_toggle_unpurchased_removes_from_inventory(self, api_client):
        """Test BUG FIX: Unchecking a shopping list item removes it from inventory"""
        # Get current shopping list
        shop_response = api_client.get(f"{BASE_URL}/api/shopping-list")
        shopping_list = shop_response.json()["items"]
        
        if len(shopping_list) == 0:
            pytest.skip("No shopping list items available")
        
        # Find a purchased item
        purchased_idx = None
        for idx, item in enumerate(shopping_list):
            if item.get("purchased", False):
                purchased_idx = idx
                break
        
        if purchased_idx is None:
            # Toggle first item to purchased first
            toggle_response = api_client.post(f"{BASE_URL}/api/shopping-list/toggle-purchased?item_index=0")
            assert toggle_response.status_code == 200
            purchased_idx = 0
            shopping_list = toggle_response.json()["items"]
        
        item_name = shopping_list[purchased_idx]["item"]
        
        # Get inventory count before unchecking
        inv_before = api_client.get(f"{BASE_URL}/api/inventory").json()["inventory"]
        count_before = len([i for i in inv_before if i["item"] == item_name])
        
        # Now toggle to unpurchased (uncheck)
        toggle_response = api_client.post(f"{BASE_URL}/api/shopping-list/toggle-purchased?item_index={purchased_idx}")
        assert toggle_response.status_code == 200
        
        # Verify item count DECREASED by 1 (BUG FIX)
        inv_after = api_client.get(f"{BASE_URL}/api/inventory").json()["inventory"]
        count_after = len([i for i in inv_after if i["item"] == item_name])
        
        assert count_after == count_before - 1, f"BUG: Item '{item_name}' count should decrease by 1 when unchecked (was {count_before}, now {count_after})"
        print(f"✓ BUG FIX VERIFIED: Unchecking shopping item '{item_name}' correctly removes from inventory (count: {count_before} -> {count_after})")


class TestMarkPrepDeductsIngredients:
    """Test FEATURE: Ingredients deducted when marking prep complete"""
    
    def test_mark_prepped_deducts_ingredients(self, api_client):
        """Test that marking a meal as prepped deducts ingredients from inventory"""
        # Generate a fresh meal plan
        plan_response = api_client.post(f"{BASE_URL}/api/meal-plan/generate", json={"weeks": 1})
        assert plan_response.status_code == 200
        
        meal_plan = plan_response.json()["meal_plan"]
        weeks = plan_response.json()["weeks"]
        
        # Save meal plan
        save_response = api_client.post(f"{BASE_URL}/api/meal-plan/save?weeks={weeks}", json=meal_plan)
        assert save_response.status_code == 200
        
        # Get prep tasks
        prep_response = api_client.get(f"{BASE_URL}/api/meal-plan/prep-tasks")
        assert prep_response.status_code == 200
        prep_tasks = prep_response.json()["prep_tasks"]
        
        if len(prep_tasks) == 0:
            pytest.skip("No prep tasks available")
        
        # Get first prep task
        task = prep_tasks[0]
        meal_id = task["meal_id"]
        dates = task["serves_dates"]
        
        # Add some test ingredients to inventory that match the meal
        # First, let's get the extended meal library to find ingredients
        library_response = api_client.get(f"{BASE_URL}/api/meals/library/extended")
        assert library_response.status_code == 200
        library = library_response.json()
        
        # Find the meal in library
        meal_data = None
        for category_meals in library.values():
            for meal in category_meals:
                if meal["id"] == meal_id:
                    meal_data = meal
                    break
            if meal_data:
                break
        
        if meal_data is None or "ingredients" not in meal_data:
            pytest.skip(f"Meal {meal_id} not found or has no ingredients")
        
        # Add ingredients to inventory
        ingredients_added = []
        for ingredient in meal_data.get("ingredients", [])[:3]:  # Add first 3 ingredients
            add_response = api_client.post(f"{BASE_URL}/api/inventory/add", json={
                "item": ingredient["item"],
                "amount": ingredient["amount"],
                "category": ingredient["category"]
            })
            if add_response.status_code == 200:
                ingredients_added.append(ingredient["item"])
        
        if len(ingredients_added) == 0:
            pytest.skip("Could not add any ingredients to inventory")
        
        # Get inventory before marking prep
        inv_before = api_client.get(f"{BASE_URL}/api/inventory").json()["inventory"]
        items_before = [item["item"] for item in inv_before]
        
        # Mark meal as prepped
        mark_response = api_client.post(f"{BASE_URL}/api/meal-plan/mark-prepped?meal_id={meal_id}", json=dates)
        assert mark_response.status_code == 200
        
        response_data = mark_response.json()
        assert response_data["success"] == True
        
        # Check if ingredients were deducted
        ingredients_deducted = response_data.get("ingredients_deducted", [])
        print(f"Ingredients deducted: {ingredients_deducted}")
        
        # Get inventory after marking prep
        inv_after = api_client.get(f"{BASE_URL}/api/inventory").json()["inventory"]
        items_after = [item["item"] for item in inv_after]
        
        # Verify at least some ingredients were removed
        removed_count = 0
        for ingredient in ingredients_added:
            if ingredient in items_before and ingredient not in items_after:
                removed_count += 1
                print(f"✓ Ingredient '{ingredient}' was deducted from inventory")
        
        assert removed_count > 0 or len(ingredients_deducted) > 0, "No ingredients were deducted when marking prep complete"
        print(f"✓ FEATURE VERIFIED: {removed_count} ingredients deducted when marking prep complete")


class TestInventoryEndpoints:
    """Test basic inventory endpoint functionality"""
    
    def test_get_inventory(self, api_client):
        """Test GET /api/inventory returns inventory list"""
        response = api_client.get(f"{BASE_URL}/api/inventory")
        
        assert response.status_code == 200
        data = response.json()
        assert "inventory" in data
        assert isinstance(data["inventory"], list)
        print(f"✓ GET /api/inventory returns {len(data['inventory'])} items")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_items(self, api_client):
        """Remove all TEST_ prefixed items from inventory"""
        inventory = api_client.get(f"{BASE_URL}/api/inventory").json()["inventory"]
        
        cleaned = 0
        for item in inventory:
            if item["item"].startswith("TEST_"):
                response = api_client.delete(f"{BASE_URL}/api/inventory/{item['item']}")
                if response.status_code == 200:
                    cleaned += 1
        
        print(f"✓ Cleaned up {cleaned} test items from inventory")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
