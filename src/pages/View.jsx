import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getRecipes } from "../services/recipes";
import { useNavigate } from "react-router-dom";
import { updateRecipe } from "../services/recipes";

import placeholder from "../assets/placeholder.png";

function View() {
  const { user, loading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const navigate = useNavigate();

  const calculateTotalTime = (recipe) => {
    const total = Number(recipe.prepTime || 0) + Number(recipe.cookTime || 0);

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
    async function load() {
      if (!user) return;

      setPageLoading(true);

      const start = Date.now();
      const data = await getRecipes(user.uid);
      setRecipes(data);

      const elapsed = Date.now() - start;
      const minDelay = 800;
      const remaining = minDelay - elapsed;

      if (remaining > 0) setTimeout(() => setPageLoading(false), remaining);
      else setPageLoading(false);
    }

    load();
  }, [user]);

  if (loading || pageLoading) {
    return (
      <>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="text-center">
            <div className="spinner-border" role="status" />
            <p className="mt-3 text-body-secondary">Loading recipes…</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) return <h2>Not logged in</h2>;

  const toggleFavorite = async (recipe) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipe.id ? { ...r, isFavorite: !r.isFavorite } : r,
      ),
    );

    await updateRecipe(user.uid, recipe.id, {
      isFavorite: !recipe.isFavorite,
    });
  };

  return (
    <>
      <div className="container py-4">
        <h1 className="mb-5">My Recipes</h1>
      </div>

      {recipes.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center text-center py-5">
          <div>
            <h4 className="mb-2">No recipes yet</h4>
            <p className="text-body-secondary m-0">Add one to get started!</p>
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="row justify-content-center">
            {recipes.map((r) => (
              <div
                key={r.id}
                className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center"
              >
                <div
                  className="card mb-4 recipe-card"
                  style={{ width: "18rem" }}
                  onClick={() => navigate(`/details/${r.id}`)}
                >
                  <img
                    src={r.imageUrl ? r.imageUrl : placeholder}
                    className="card-img-top"
                    alt="Recipe"
                    style={{
                      height: "200px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = placeholder;
                    }}
                  />

                  <button
                    className={`favorite-btn ${r.isFavorite ? "active" : ""}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(r);
                    }}
                  >
                    <i
                      className={`bi ${r.isFavorite ? "bi-heart-fill" : "bi-heart"}`}
                    ></i>
                  </button>
                  <div className="card-body text-center d-flex flex-column">
                    <p className="card-text mt-auto">{r.recipeName}</p>
                    <p className="card-text">
                      <i className="bi bi-clock mx-2" />
                      {calculateTotalTime(r)}{" "}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default View;
