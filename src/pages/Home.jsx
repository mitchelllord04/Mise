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

  const [randomRecipe, setRandomRecipe] = useState(null);

  const generateRandomRecipe = async () => {
    const recipe = await getRandomRecipe();
    setRandomRecipe(recipe);
    localStorage.setItem("persistentRandomRecipe", JSON.stringify(recipe));
  };

  useEffect(() => {
    async function loadSuggestedRecipes() {
      const today = new Date().toLocaleDateString("en-CA");

      const storedRecipes = localStorage.getItem("recipesOfTheDay_5");
      const storedRecipesDate = localStorage.getItem("recipesOfTheDayDate_5");

      if (storedRecipes && storedRecipesDate === today) {
        setRecipeSuggestions(JSON.parse(storedRecipes));
        return;
      }

      const recipes = await Promise.all([
        getRandomRecipe(),
        getRandomRecipe(),
        getRandomRecipe(),
        getRandomRecipe(),
        getRandomRecipe(),
      ]);

      localStorage.setItem("recipesOfTheDay_5", JSON.stringify(recipes));
      localStorage.setItem("recipesOfTheDayDate_5", today);

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

    async function initializeRandomRecipe() {
      const storedRandomRecipe = localStorage.getItem("persistentRandomRecipe");

      if (storedRandomRecipe) {
        setRandomRecipe(JSON.parse(storedRandomRecipe));
        return;
      }

      const recipe = await getRandomRecipe();
      setRandomRecipe(recipe);
      localStorage.setItem("persistentRandomRecipe", JSON.stringify(recipe));
    }

    loadSuggestedRecipes();
    loadTip();
    initializeRandomRecipe();
  }, []);

  if (recipeSuggestions.length === 0) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center text-center"
        style={{ minHeight: "70vh" }}
      >
        <h1 className="home-page-greeting mb-4 mt-0">
          Welcome, {user?.displayName?.split(" ")[0] || "there"}!
        </h1>

        <i className="bi bi-egg-fried mb-3" style={{ fontSize: "2.5rem" }} />

        <h4 className="mb-2">Nothing cooking right now</h4>

        <p className="text-body-secondary">
          We couldn't fetch today's recipe suggestions. Check back later.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="container pt-4 pb-5">
        <div className="container">
          <div className="home-page-header">
            <p className="home-page-greeting">
              Welcome, {user?.displayName?.split(" ")[0] || "there"}!
            </p>

            <div className="recipes-hero-header">
              <div>
                <h1 className="recipes-hero-title">Recipes of the Day</h1>
                <p className="recipes-hero-subtitle">
                  Fresh ideas to cook tonight
                </p>
              </div>
            </div>
          </div>

          <div className="recipes-showcase">
            {recipeSuggestions.map((recipe, index) => (
              <article
                key={recipe.id}
                className={`showcase-tile ${index === 0 ? "showcase-featured" : ""}`}
                onClick={() => window.open(recipe.sourceUrl, "_blank")}
              >
                <img
                  src={recipe.image || placeholder}
                  alt={recipe.title}
                  className="showcase-image"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = placeholder;
                  }}
                />

                <div className="showcase-overlay">
                  <div className="showcase-content">
                    <div className="showcase-meta">
                      <span className="showcase-time">
                        <i className="bi bi-clock me-2" />
                        {calculateTotalTime(recipe.readyInMinutes)}
                      </span>
                    </div>

                    <h3 className="showcase-title">{recipe.title}</h3>

                    <div className="showcase-actions">
                      <button
                        className="showcase-save"
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
              </article>
            ))}
          </div>
        </div>

        <div className="home-lower-grid">
          <section className="home-tip-panel">
            <div className="home-tip-badge">
              <i className="bi bi-lightbulb-fill"></i>
            </div>

            <div className="home-tip-copy">
              <p className="home-eyebrow">Daily tip</p>
              <h3 className="home-section-title">Cooking Tip of the Day</h3>
              <p className="home-tip-text">{tip}</p>
            </div>
          </section>

          <section className="home-random-panel">
            <div className="home-random-header">
              <div>
                <p className="home-eyebrow">Need inspiration?</p>
                <h3 className="home-section-title">Try something unexpected</h3>
              </div>

              <button
                className="home-random-btn"
                onClick={generateRandomRecipe}
              >
                <i className="bi bi-shuffle me-2"></i>
                Random Recipe
              </button>
            </div>

            {randomRecipe ? (
              <article
                className="home-random-card"
                onClick={() => window.open(randomRecipe.sourceUrl, "_blank")}
              >
                <div className="home-random-media">
                  <img
                    src={randomRecipe.image || placeholder}
                    alt={randomRecipe.title}
                    className="home-random-image"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = placeholder;
                    }}
                  />
                </div>

                <div className="home-random-body">
                  <div className="home-random-meta">
                    <span className="home-random-time">
                      <i className="bi bi-clock me-2"></i>
                      {calculateTotalTime(randomRecipe.readyInMinutes)}
                    </span>
                  </div>

                  <h4 className="home-random-title">{randomRecipe.title}</h4>

                  <button
                    className="home-random-save"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveSuggestedRecipe(randomRecipe);
                    }}
                  >
                    Save
                  </button>
                </div>
              </article>
            ) : (
              <article
                className="home-random-card home-random-empty"
                onClick={() => window.open(randomRecipe.sourceUrl, "_blank")}
              >
                <div className="home-random-empty-content">
                  <i className="bi bi-emoji-frown home-random-empty-icon"></i>

                  <p className="home-random-empty-title">
                    Sorry! Out of recipes for today.
                  </p>

                  <p className="home-random-empty-subtitle">
                    Check back tomorrow for more inspiration.
                  </p>
                </div>
              </article>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default Home;
