import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getRandomRecipe } from "../services/spoonacular";

import placeholder from "../assets/placeholder.png";
import cookingTips from "../data/cooking_tips.json";

function Home() {
  const { user } = useAuth();

  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [tip, setTip] = useState("");

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
                    <p className="card-text mb-3" style={{ minHeight: "48px" }}>
                      {recipe.title}
                    </p>

                    <p className="card-text mt-auto mb-0 text-body-secondary">
                      <i className="bi bi-clock me-2" />
                      {calculateTotalTime(recipe.readyInMinutes)}
                    </p>
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
