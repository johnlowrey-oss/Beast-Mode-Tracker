"""
Test suite for Weekly Summary and Workout Tracking features
- GET /api/summary/weekly - Weekly summary stats
- POST /api/ai/weekly-coaching - AI coaching feedback
- GET /api/workouts - Get recent workouts
- GET /api/workouts/{date} - Get workout by date
- POST /api/workouts - Log a workout
- POST /api/workouts/{date}/exercise - Add exercise to workout
- DELETE /api/workouts/{date} - Delete workout
- GET /api/workouts/progress/{exercise} - Get exercise progress
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWeeklySummary:
    """Tests for Weekly Summary API endpoint"""
    
    def test_get_weekly_summary_returns_200(self):
        """Test that weekly summary endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/summary/weekly")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_weekly_summary_has_required_fields(self):
        """Test that weekly summary contains all required fields"""
        response = requests.get(f"{BASE_URL}/api/summary/weekly")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check top-level fields
        assert "week_start" in data, "Missing week_start field"
        assert "week_end" in data, "Missing week_end field"
        assert "habits" in data, "Missing habits field"
        assert "meals" in data, "Missing meals field"
        assert "nutrition" in data, "Missing nutrition field"
        assert "workouts" in data, "Missing workouts field"
        assert "body_progress" in data, "Missing body_progress field"
    
    def test_weekly_summary_habits_structure(self):
        """Test habits section has correct structure"""
        response = requests.get(f"{BASE_URL}/api/summary/weekly")
        data = response.json()
        
        habits = data["habits"]
        assert "completed" in habits, "Missing habits.completed"
        assert "total" in habits, "Missing habits.total"
        assert "streak" in habits, "Missing habits.streak"
        assert "rate" in habits, "Missing habits.rate"
        
        # Validate types
        assert isinstance(habits["completed"], int)
        assert isinstance(habits["total"], int)
        assert habits["total"] == 7, "Total should be 7 days"
        assert isinstance(habits["rate"], int)
        assert 0 <= habits["rate"] <= 100, "Rate should be 0-100"
    
    def test_weekly_summary_meals_structure(self):
        """Test meals section has correct structure"""
        response = requests.get(f"{BASE_URL}/api/summary/weekly")
        data = response.json()
        
        meals = data["meals"]
        assert "planned" in meals, "Missing meals.planned"
        assert "prepped" in meals, "Missing meals.prepped"
        assert "prep_rate" in meals, "Missing meals.prep_rate"
        
        assert isinstance(meals["planned"], int)
        assert isinstance(meals["prepped"], int)
        assert isinstance(meals["prep_rate"], int)
    
    def test_weekly_summary_workouts_structure(self):
        """Test workouts section has correct structure"""
        response = requests.get(f"{BASE_URL}/api/summary/weekly")
        data = response.json()
        
        workouts = data["workouts"]
        assert "completed" in workouts, "Missing workouts.completed"
        assert "total_minutes" in workouts, "Missing workouts.total_minutes"
        assert "sessions" in workouts, "Missing workouts.sessions"
        
        assert isinstance(workouts["completed"], int)
        assert isinstance(workouts["total_minutes"], int)
        assert isinstance(workouts["sessions"], list)
    
    def test_weekly_summary_body_progress_structure(self):
        """Test body_progress section has correct structure"""
        response = requests.get(f"{BASE_URL}/api/summary/weekly")
        data = response.json()
        
        body = data["body_progress"]
        assert "current_weight" in body, "Missing body_progress.current_weight"
        assert "current_bf" in body, "Missing body_progress.current_bf"
        assert "weight_change" in body, "Missing body_progress.weight_change"
        assert "bf_change" in body, "Missing body_progress.bf_change"


class TestAIWeeklyCoaching:
    """Tests for AI Weekly Coaching endpoint"""
    
    def test_weekly_coaching_returns_200(self):
        """Test that weekly coaching endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/ai/weekly-coaching")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_weekly_coaching_has_coaching_field(self):
        """Test that response contains coaching feedback"""
        response = requests.post(f"{BASE_URL}/api/ai/weekly-coaching")
        assert response.status_code == 200
        
        data = response.json()
        assert "coaching" in data, "Missing coaching field"
        assert isinstance(data["coaching"], str)
        assert len(data["coaching"]) > 0, "Coaching should not be empty"
    
    def test_weekly_coaching_includes_summary(self):
        """Test that response includes summary data"""
        response = requests.post(f"{BASE_URL}/api/ai/weekly-coaching")
        assert response.status_code == 200
        
        data = response.json()
        assert "summary" in data, "Missing summary field"
        assert "habits" in data["summary"], "Summary should include habits"


class TestWorkoutCRUD:
    """Tests for Workout CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.today = datetime.now().strftime("%Y-%m-%d")
        self.test_date = (datetime.now() - timedelta(days=100)).strftime("%Y-%m-%d")  # Use past date for test isolation
    
    def test_get_workouts_returns_200(self):
        """Test that get workouts endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/workouts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_get_workouts_has_workouts_array(self):
        """Test that response contains workouts array"""
        response = requests.get(f"{BASE_URL}/api/workouts")
        data = response.json()
        
        assert "workouts" in data, "Missing workouts field"
        assert isinstance(data["workouts"], list)
    
    def test_get_workouts_with_limit(self):
        """Test that limit parameter works"""
        response = requests.get(f"{BASE_URL}/api/workouts?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["workouts"]) <= 5
    
    def test_get_workout_by_date_not_found(self):
        """Test getting workout for date with no workout"""
        response = requests.get(f"{BASE_URL}/api/workouts/1900-01-01")
        assert response.status_code == 200
        
        data = response.json()
        assert data["workout"] is None
    
    def test_create_workout_and_verify(self):
        """Test creating a workout and verifying it persists"""
        workout_data = {
            "date": self.test_date,
            "workout_type": "TEST_Lower A (Squat Focus)",
            "exercises": [
                {"exercise": "TEST_Back Squat", "sets": 3, "reps": 8, "weight": 225.0},
                {"exercise": "TEST_Leg Press", "sets": 3, "reps": 12, "weight": 400.0}
            ],
            "duration_minutes": 60,
            "notes": "Test workout"
        }
        
        # Create workout
        create_response = requests.post(f"{BASE_URL}/api/workouts", json=workout_data)
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        create_data = create_response.json()
        assert create_data["success"] == True
        assert "workout" in create_data
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/workouts/{self.test_date}")
        assert get_response.status_code == 200
        
        get_data = get_response.json()
        assert get_data["workout"] is not None
        assert get_data["workout"]["workout_type"] == "TEST_Lower A (Squat Focus)"
        assert len(get_data["workout"]["exercises"]) == 2
        assert get_data["workout"]["duration_minutes"] == 60
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/workouts/{self.test_date}")
    
    def test_update_workout_upsert(self):
        """Test that posting to same date updates the workout"""
        test_date = (datetime.now() - timedelta(days=101)).strftime("%Y-%m-%d")
        
        # First workout
        workout1 = {
            "date": test_date,
            "workout_type": "TEST_Upper A",
            "exercises": [{"exercise": "TEST_Bench Press", "sets": 3, "reps": 8, "weight": 185.0}],
            "duration_minutes": 45
        }
        requests.post(f"{BASE_URL}/api/workouts", json=workout1)
        
        # Update with new data
        workout2 = {
            "date": test_date,
            "workout_type": "TEST_Upper A Updated",
            "exercises": [
                {"exercise": "TEST_Bench Press", "sets": 4, "reps": 6, "weight": 205.0},
                {"exercise": "TEST_Incline Press", "sets": 3, "reps": 10, "weight": 135.0}
            ],
            "duration_minutes": 55
        }
        update_response = requests.post(f"{BASE_URL}/api/workouts", json=workout2)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/workouts/{test_date}")
        data = get_response.json()
        
        assert data["workout"]["workout_type"] == "TEST_Upper A Updated"
        assert len(data["workout"]["exercises"]) == 2
        assert data["workout"]["duration_minutes"] == 55
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/workouts/{test_date}")
    
    def test_add_exercise_to_existing_workout(self):
        """Test adding an exercise to an existing workout"""
        test_date = (datetime.now() - timedelta(days=102)).strftime("%Y-%m-%d")
        
        # Create initial workout
        workout = {
            "date": test_date,
            "workout_type": "TEST_Full Body",
            "exercises": [{"exercise": "TEST_Squat", "sets": 3, "reps": 8, "weight": 200.0}],
            "duration_minutes": 30
        }
        requests.post(f"{BASE_URL}/api/workouts", json=workout)
        
        # Add exercise
        new_exercise = {"exercise": "TEST_Deadlift", "sets": 3, "reps": 5, "weight": 315.0}
        add_response = requests.post(f"{BASE_URL}/api/workouts/{test_date}/exercise", json=new_exercise)
        assert add_response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/workouts/{test_date}")
        data = get_response.json()
        
        assert len(data["workout"]["exercises"]) == 2
        exercise_names = [e["exercise"] for e in data["workout"]["exercises"]]
        assert "TEST_Deadlift" in exercise_names
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/workouts/{test_date}")
    
    def test_add_exercise_creates_workout_if_not_exists(self):
        """Test that adding exercise to non-existent date creates workout"""
        test_date = (datetime.now() - timedelta(days=103)).strftime("%Y-%m-%d")
        
        # Ensure no workout exists
        requests.delete(f"{BASE_URL}/api/workouts/{test_date}")
        
        # Add exercise to non-existent workout
        new_exercise = {"exercise": "TEST_Pull-ups", "sets": 3, "reps": 10, "weight": 0}
        add_response = requests.post(f"{BASE_URL}/api/workouts/{test_date}/exercise", json=new_exercise)
        assert add_response.status_code == 200
        
        # Verify workout was created
        get_response = requests.get(f"{BASE_URL}/api/workouts/{test_date}")
        data = get_response.json()
        
        assert data["workout"] is not None
        assert data["workout"]["workout_type"] == "Custom"
        assert len(data["workout"]["exercises"]) == 1
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/workouts/{test_date}")
    
    def test_delete_workout(self):
        """Test deleting a workout"""
        test_date = (datetime.now() - timedelta(days=104)).strftime("%Y-%m-%d")
        
        # Create workout
        workout = {
            "date": test_date,
            "workout_type": "TEST_Delete Me",
            "exercises": [],
            "duration_minutes": 10
        }
        requests.post(f"{BASE_URL}/api/workouts", json=workout)
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/workouts/{test_date}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/workouts/{test_date}")
        data = get_response.json()
        assert data["workout"] is None
    
    def test_delete_nonexistent_workout_returns_404(self):
        """Test deleting non-existent workout returns 404"""
        response = requests.delete(f"{BASE_URL}/api/workouts/1900-01-01")
        assert response.status_code == 404


class TestExerciseProgress:
    """Tests for exercise progress tracking"""
    
    @pytest.fixture(autouse=True)
    def setup_and_cleanup(self):
        """Setup test workouts for progress tracking"""
        self.test_dates = [
            (datetime.now() - timedelta(days=110)).strftime("%Y-%m-%d"),
            (datetime.now() - timedelta(days=111)).strftime("%Y-%m-%d"),
            (datetime.now() - timedelta(days=112)).strftime("%Y-%m-%d")
        ]
        
        # Create test workouts with same exercise
        for i, date in enumerate(self.test_dates):
            workout = {
                "date": date,
                "workout_type": "TEST_Progress Test",
                "exercises": [
                    {"exercise": "TEST_Progress_Squat", "sets": 3, "reps": 8, "weight": 200 + (i * 10)}
                ],
                "duration_minutes": 45
            }
            requests.post(f"{BASE_URL}/api/workouts", json=workout)
        
        yield
        
        # Cleanup
        for date in self.test_dates:
            requests.delete(f"{BASE_URL}/api/workouts/{date}")
    
    def test_get_exercise_progress(self):
        """Test getting progress for a specific exercise"""
        response = requests.get(f"{BASE_URL}/api/workouts/progress/TEST_Progress_Squat")
        assert response.status_code == 200
        
        data = response.json()
        assert "exercise" in data
        assert "progress" in data
        assert isinstance(data["progress"], list)
    
    def test_exercise_progress_contains_volume(self):
        """Test that progress entries contain volume calculation"""
        response = requests.get(f"{BASE_URL}/api/workouts/progress/TEST_Progress_Squat")
        data = response.json()
        
        if len(data["progress"]) > 0:
            entry = data["progress"][0]
            assert "volume" in entry
            assert "weight" in entry
            assert "sets" in entry
            assert "reps" in entry
            # Volume = sets * reps * weight
            expected_volume = entry["sets"] * entry["reps"] * entry["weight"]
            assert entry["volume"] == expected_volume


class TestWorkoutValidation:
    """Tests for workout data validation"""
    
    def test_workout_requires_date(self):
        """Test that workout requires date field"""
        workout = {
            "workout_type": "Test",
            "exercises": [],
            "duration_minutes": 30
        }
        response = requests.post(f"{BASE_URL}/api/workouts", json=workout)
        assert response.status_code == 422  # Validation error
    
    def test_workout_requires_workout_type(self):
        """Test that workout requires workout_type field"""
        workout = {
            "date": "2025-01-01",
            "exercises": [],
            "duration_minutes": 30
        }
        response = requests.post(f"{BASE_URL}/api/workouts", json=workout)
        assert response.status_code == 422  # Validation error


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
