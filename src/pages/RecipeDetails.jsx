import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getRecipe, deleteRecipe } from "../services/recipes";
import { useEffect, useState } from "react";

function RecipeDetails() {
  const { user, loading } = useAuth();
  const { recipeId } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
    let timeoutId;

    async function loadRecipe() {
      if (loading) return;

      if (!user || !recipeId) {
        setPageLoading(false);
        setRecipe(null);
        return;
      }

      setPageLoading(true);

      const start = Date.now();
      const data = await getRecipe(user.uid, recipeId);
      setRecipe(data ?? null);

      const elapsed = Date.now() - start;
      const remaining = 600 - elapsed;

      if (remaining > 0)
        timeoutId = setTimeout(() => setPageLoading(false), remaining);
      else setPageLoading(false);
    }

    loadRecipe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, user, recipeId]);

  async function handleDelete() {
    if (!user) return;
    if (!window.confirm(`Delete ${recipe?.recipeName ?? "this recipe"}?`))
      return;

    try {
      setDeleting(true);
      await deleteRecipe(user.uid, recipeId);
      navigate("/view");
    } catch (err) {
      console.error(err);
      alert("Failed to delete recipe.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading || pageLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border" role="status" />
          <p className="mt-3 text-body-secondary">Loading data…</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "70vh" }}
      >
        <div
          className="text-center p-4 shadow rounded-4 bg-light"
          style={{ maxWidth: "500px", width: "100%" }}
        >
          <h2 className="mb-3">Something went wrong</h2>
          <p className="text-muted mb-4">Please try again.</p>
          <button
            className="btn btn-dark px-4"
            onClick={() => navigate("/view")}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container py-4">
        <div className="mb-4 p-4 rounded-4 border bg-light">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <h1 className="mb-1">{recipe.recipeName}</h1>
              <div className="text-body-secondary">
                By <span className="fw-semibold">{recipe.authorName}</span>
              </div>

              <div className="mt-3 d-flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge rounded-pill text-bg-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-dark"
                onClick={() => navigate("/view")}
              >
                Back
              </button>
              <button className="btn btn-dark">Edit</button>
              <button
                className="btn btn-outline-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="d-inline-flex align-items-center gap-2">
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    />
                    Deleting…
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card rounded-4 shadow-sm mb-4">
              <div className="card-body">
                <h4 className="mb-3">Ingredients</h4>
                <ul className="list-group list-group-flush">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={`${ing.name}-${i}`} className="list-group-item">
                      {ing.quantity} {ing.units ? `${ing.units} ` : ""}
                      {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card rounded-4 shadow-sm">
              <div className="card-body">
                <h4 className="mb-3">Instructions</h4>
                <ol className="list-group list-group-numbered">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="list-group-item">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="position-sticky" style={{ top: "1rem" }}>
              <div className="card rounded-4 shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Details</h5>

                  <div className="d-flex justify-content-between">
                    <span className="text-body-secondary">Course</span>
                    <span className="fw-semibold">{recipe.course}</span>
                  </div>

                  <div className="d-flex justify-content-between">
                    <span className="text-body-secondary">Type</span>
                    <span className="fw-semibold">{recipe.mealType}</span>
                  </div>

                  <div className="d-flex justify-content-between">
                    <span className="text-body-secondary">Cuisine</span>
                    <span className="fw-semibold">{recipe.cuisine}</span>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between">
                    <span className="text-body-secondary">
                      <i className="bi bi-clock me-2" />
                      Total time
                    </span>
                    <span className="fw-semibold">
                      {calculateTotalTime(recipe)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RecipeDetails;
