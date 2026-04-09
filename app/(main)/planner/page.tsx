import { fetchRecipesForUser } from "@/app/actions/recipes";
import { fetchMealPlansRange } from "@/app/actions/meal-plans";
import { WeeklyPlanner } from "@/components/planner/weekly-planner";
import { addDaysIso, mondayOfWeekContaining } from "@/lib/dates";

export default async function PlannerPage() {
  const weekStart = mondayOfWeekContaining();
  const weekEnd = addDaysIso(weekStart, 6);
  const [recipes, plans] = await Promise.all([
    fetchRecipesForUser(),
    fetchMealPlansRange(weekStart, weekEnd),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Meal planner</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Drag recipes onto breakfast, lunch, and dinner. Daily totals use per-serving
          macros from each assigned recipe.
        </p>
      </header>
      <WeeklyPlanner
        recipes={recipes}
        initialWeekStart={weekStart}
        initialPlans={plans}
      />
    </div>
  );
}
