import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getRandomRecipe } from "../services/spoonacular";
import { useNavigate } from "react-router-dom";
import { addRecipe } from "../services/recipes";

import placeholder from "../assets/placeholder.png";
import cookingTips from "../data/cooking_tips.json";

function Home() {
  const { user } = useAuth();

  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [tip, setTip] = useState("");

  const navigate = useNavigate();

  const calculateTotalTime = (total) => {
    const days = Math.floor(total / 1440);
    const hours = Math.floor((total % 1440) / 60);
    const minutes = total % 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}hr`);
    if (minutes) parts.push(`${minutes}min`);

    return parts.join(" ");
  };

  const formatQuantity = (value) => {
    const n = Number(value);

    if (!Number.isFinite(n)) return String(value ?? "");

    const whole = Math.floor(n);
    const frac = n - whole;

    const fractions = [
      { value: 0.125, label: "1/8" },
      { value: 0.25, label: "1/4" },
      { value: 1 / 3, label: "1/3" },
      { value: 0.375, label: "3/8" },
      { value: 0.5, label: "1/2" },
      { value: 0.625, label: "5/8" },
      { value: 2 / 3, label: "2/3" },
      { value: 0.75, label: "3/4" },
      { value: 0.875, label: "7/8" },
    ];

    const tolerance = 0.02;

    const match = fractions.find((f) => Math.abs(frac - f.value) < tolerance);

    if (match) {
      if (whole === 0) return match.label;
      return `${whole} ${match.label}`;
    }

    if (Math.abs(frac) < tolerance) return String(whole);

    return Number(n.toFixed(2)).toString();
  };

  const mapSpoonacularRecipe = (spoon) => {
    const mealTypeFromDishTypes = (dishTypes = []) => {
      const lower = dishTypes.map((d) => d.toLowerCase());

      if (
        lower.includes("breakfast") ||
        lower.includes("morning meal") ||
        lower.includes("brunch")
      ) {
        return "Breakfast";
      }

      if (lower.includes("lunch")) return "Lunch";
      if (lower.includes("dinner")) return "Dinner";
      if (lower.includes("dessert")) return "Dessert";
      if (lower.includes("snack")) return "Snack";
      if (lower.includes("drink") || lower.includes("beverage")) return "Drink";

      return "Dinner";
    };

    const courseFromDishTypes = (dishTypes = []) => {
      const lower = dishTypes.map((d) => d.toLowerCase());

      if (lower.includes("main course")) return "Main";
      if (lower.includes("side dish")) return "Side";
      if (lower.includes("appetizer")) return "Appetizer";
      if (lower.includes("salad")) return "Salad";
      if (lower.includes("soup")) return "Soup";
      if (lower.includes("sauce")) return "Sauce";

      return "Main";
    };

    const buildTags = (spoon) => {
      const tags = [];

      if (spoon.vegetarian) tags.push("Vegetarian");
      if (spoon.vegan) tags.push("Vegan");
      if (spoon.glutenFree) tags.push("Gluten Free");
      if (spoon.dairyFree) tags.push("Dairy Free");
      if ((spoon.readyInMinutes ?? 0) <= 30) tags.push("Under 30 Minutes");

      const proteinNutrient = spoon.nutrition?.nutrients?.find(
        (n) => n.name === "Protein",
      );
      if (proteinNutrient && Number(proteinNutrient.amount) >= 20) {
        tags.push("High Protein");
      }

      return tags;
    };

    const ingredients = (spoon.extendedIngredients ?? []).map((ing) => ({
      name: ing.nameClean || ing.name || "",
      quantity: ing.amount != null ? formatQuantity(ing.amount) : "",
      units: ing.unit || "",
    }));

    const instructions =
      spoon.analyzedInstructions?.flatMap((section) =>
        (section.steps ?? []).map((step) => step.step),
      ) ?? [];

    return {
      recipeName: spoon.title || "",
      authorName: spoon.sourceName || spoon.creditsText || "",
      mealType: mealTypeFromDishTypes(spoon.dishTypes),
      cuisine: spoon.cuisines?.[0] || "Other",
      course: courseFromDishTypes(spoon.dishTypes),
      tags: buildTags(spoon),
      prepTime:
        spoon.preparationMinutes != null
          ? String(spoon.preparationMinutes)
          : "",
      cookTime:
        spoon.cookingMinutes != null
          ? String(spoon.cookingMinutes)
          : spoon.readyInMinutes != null
            ? String(spoon.readyInMinutes)
            : "",
      servings: spoon.servings != null ? Number(spoon.servings) : "",
      calories: "",
      ingredients,
      instructions,
      isFavorite: false,
      imageUrl: spoon.image || "",
      sourceUrl: spoon.sourceUrl || "",
      spoonacularId: spoon.id,
    };
  };

  const handleSaveSuggestedRecipe = async (spoonRecipe) => {
    if (!user) return;

    try {
      const mappedRecipe = mapSpoonacularRecipe(spoonRecipe);

      const recipeId = await addRecipe(user.uid, {
        ...mappedRecipe,
        prepTime: mappedRecipe.prepTime ? Number(mappedRecipe.prepTime) : null,
        cookTime: mappedRecipe.cookTime ? Number(mappedRecipe.cookTime) : null,
        servings: mappedRecipe.servings ? Number(mappedRecipe.servings) : null,
        calories: mappedRecipe.calories ? Number(mappedRecipe.calories) : null,
        imageUrl: mappedRecipe.imageUrl || null,
      });

      alert("Recipe successfully saved!");
      navigate(`/details/${recipeId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save recipe.");
    }
  };

  useEffect(() => {
    async function loadSuggestedRecipes() {
      const today = new Date().toLocaleDateString("en-CA");

      const storedRecipes = localStorage.getItem("recipesOfTheDay");
      const storedRecipesDate = localStorage.getItem("recipesOfTheDayDate");

      if (storedRecipes && storedRecipesDate === today) {
        setRecipeSuggestions(JSON.parse(storedRecipes));
        return;
      }

      const recipes = await Promise.all([
        getRandomRecipe(),
        getRandomRecipe(),
        getRandomRecipe(),
      ]);

      localStorage.setItem("recipesOfTheDay", JSON.stringify(recipes));
      localStorage.setItem("recipesOfTheDayDate", today);

      setRecipeSuggestions(recipes);
    }

    function loadTip() {
      const today = new Date().toLocaleDateString("en-CA");

      const storedTip = localStorage.getItem("tipOfTheDay");
      const storedTipDate = localStorage.getItem("tipOfTheDayDate");

      if (storedTip && storedTipDate === today) {
        setTip(storedTip);
        return;
      }

      const newTip =
        cookingTips[Math.floor(Math.random() * cookingTips.length)];
      localStorage.setItem("tipOfTheDay", newTip);
      localStorage.setItem("tipOfTheDayDate", today);
      setTip(newTip);
    }

    loadSuggestedRecipes();
    loadTip();
  }, []);

  if (recipeSuggestions.length === 0) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "70vh" }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="mb-2">
            Welcome, {user?.displayName?.split(" ")[0] || "there"}!
          </h1>
        </div>

        <div className="mb-5">
          <h2 className="mb-4 text-center text-md-start">Recipes of the Day</h2>

          <div className="row g-4 justify-content-center">
            {recipeSuggestions.map((recipe) => (
              <div
                key={recipe.id}
                className="col-12 col-sm-6 col-md-4 d-flex justify-content-center"
              >
                <div
                  className="card h-100 recipe-card"
                  onClick={() => window.open(recipe.sourceUrl, "_blank")}
                  style={{ width: "18rem" }}
                >
                  <img
                    src={recipe.image || placeholder}
                    className="card-img-top"
                    alt="Recipe"
                    style={{ height: "200px", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = placeholder;
                    }}
                  />

                  <div className="card-body text-center d-flex flex-column">
                    <p className="card-text mb-3" style={{ minHeight: "1rem" }}>
                      {recipe.title}
                    </p>

                    <p className="card-text mt-auto mb-0 text-body-secondary">
                      <i className="bi bi-clock me-2" />
                      {calculateTotalTime(recipe.readyInMinutes)}
                    </p>

                    <button
                      className="btn btn-outline-primary mt-3 mx-auto"
                      style={{ maxWidth: "8rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveSuggestedRecipe(recipe);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card">
              <div className="card-body">
                <h5 className="mb-3">Cooking Tip of the Day</h5>
                <p className="mb-0">{tip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
