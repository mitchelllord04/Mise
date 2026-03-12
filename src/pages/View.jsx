import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/useAuth";
import { getRecipes, deleteRecipe } from "../services/recipes";
import { useNavigate } from "react-router-dom";
import { updateRecipe } from "../services/recipes";

import placeholder from "../assets/placeholder.png";

function View() {
  // Authentication and loading status
  const { user, loading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);

  const menuRef = useRef(null);
  const [deleting, setDeleting] = useState(false);

  // User recipe data
  const [recipes, setRecipes] = useState([]);

  const navigate = useNavigate();

  // Filter states
  const [mealTypeFilter, setMealTypeFilter] = useState("All");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [tagsFilter, setTagsFilter] = useState([]);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);

  // Set filters once they are selected in the modal
  const typeSelect = (e) => setMealTypeFilter(e.target.value);
  const cuisineSelect = (e) => setCuisineFilter(e.target.value);
  const courseSelect = (e) => setCourseFilter(e.target.value);

  const toggleTag = (tag) => {
    setTagsFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const filteredRecipes = recipes
    .filter((r) => mealTypeFilter === "All" || r.mealType === mealTypeFilter)
    .filter((r) => cuisineFilter === "All" || r.cuisine === cuisineFilter)
    .filter((r) => courseFilter === "All" || r.course === courseFilter)
    .filter((r) => {
      if (tagsFilter.length === 0) return true;

      return tagsFilter.every((tag) => (r.tags ?? []).includes(tag));
    })
    .filter((r) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      const name = String(r.recipeName ?? "").toLowerCase();
      return name.includes(term);
    });

  const resetFilters = () => {
    setMealTypeFilter("All");
    setCuisineFilter("All");
    setCourseFilter("All");
    setTagsFilter([]);
  };

  const [showFilters, setShowFilters] = useState(false);

  // Calculate total recipe time in days, hours, and minutes given total minutes
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
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  async function handleDelete(recipeId) {
    if (!user) return;
    if (!window.confirm("Delete this recipe?")) return;

    try {
      setDeleting(true);
      await deleteRecipe(user.uid, recipeId);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setMenuOpen(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete recipe.");
    } finally {
      setDeleting(false);
    }
  }

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
        <h1 className="mb-2 mt-3">My Recipes</h1>
      </div>

      <div className="container mb-3">
        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowFilters(true)}
          >
            <i className="bi bi-funnel me-2"></i>
            Filter
          </button>

          <div className="input-group" style={{ maxWidth: "18rem" }}>
            <input
              type="search"
              value={search}
              className="form-control"
              placeholder="Search recipes..."
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>
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
            {filteredRecipes.map((r) => (
              <div
                key={r.id}
                className="col-12 col-sm-6 col-lg-4 col-xl-3 my-3"
              >
                <article
                  className="recipe-tile-view"
                  onClick={() => navigate(`/details/${r.id}`)}
                >
                  <div className="recipe-tile-view-media">
                    <img
                      src={r.imageUrl ? r.imageUrl : placeholder}
                      className="recipe-tile-view-image"
                      alt="Recipe"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = placeholder;
                      }}
                    />

                    <button
                      className="recipe-tile-view-options"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen((prev) => (prev === r.id ? null : r.id));
                      }}
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>

                    {menuOpen === r.id && (
                      <div
                        ref={menuRef}
                        className="recipe-tile-view-dropdown"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="recipe-tile-view-dropdown-item"
                          onClick={() => navigate(`/edit/${r.id}`)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="recipe-tile-view-dropdown-item"
                          onClick={() => handleDelete(r.id)}
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
                    )}

                    <button
                      className={`recipe-tile-view-favorite ${r.isFavorite ? "active" : ""}`}
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
                  </div>

                  <div className="recipe-tile-view-body">
                    <h3 className="recipe-tile-view-title">{r.recipeName}</h3>

                    <div className="recipe-tile-view-meta">
                      <span className="recipe-tile-view-time">
                        <i className="bi bi-clock me-2"></i>
                        {calculateTotalTime(r)}
                      </span>
                      <span className="recipe-tile-view-time mx-auto">
                        <i className="bi bi-people-fill"></i>
                        {r.servings}
                      </span>
                      <span className="recipe-tile-view-time">
                        <i className="bi bi-lightning-charge"></i>
                        {r.calories ? r.calories : "—"}
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>

          {showFilters && (
            <>
              <div className="modal fade show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Filter by</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowFilters(false)}
                      />
                    </div>

                    <div className="modal-body">
                      <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 col-form-label">Type</label>
                        <div className="col-sm-9">
                          <select
                            className="form-select"
                            value={mealTypeFilter}
                            onChange={typeSelect}
                          >
                            <option value="All">All</option>
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Snack">Snack</option>
                            <option value="Drink">Drink</option>
                          </select>
                        </div>
                      </div>

                      <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 col-form-label">
                          Cuisine
                        </label>
                        <div className="col-sm-9">
                          <select
                            className="form-select"
                            value={cuisineFilter}
                            onChange={cuisineSelect}
                          >
                            <option value="All">All</option>
                            <option value="Southern">Southern</option>
                            <option value="Mexican">Mexican</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Italian">Italian</option>
                            <option value="French">French</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 col-form-label">
                          Course
                        </label>
                        <div className="col-sm-9">
                          <select
                            className="form-select"
                            value={courseFilter}
                            onChange={courseSelect}
                          >
                            <option value="All">All</option>
                            <option value="Main">Main</option>
                            <option value="Side">Side</option>
                            <option value="Appetizer">Appetizer</option>
                            <option value="Salad">Salad</option>
                            <option value="Soup">Soup</option>
                            <option value="Sauce">Sauce</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Tags filter */}
                      <div className="row mb-3">
                        <label className="col-sm-3 col-form-label">Tags</label>

                        <div className="col-sm-9">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value="Low Carb"
                              id="tag-lowcarb"
                              checked={tagsFilter.includes("Low Carb")}
                              onChange={() => toggleTag("Low Carb")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="tag-lowcarb"
                            >
                              Low Carb
                            </label>
                          </div>

                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value="Vegetarian"
                              id="tag-vegetarian"
                              checked={tagsFilter.includes("Vegetarian")}
                              onChange={() => toggleTag("Vegetarian")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="tag-vegetarian"
                            >
                              Vegetarian
                            </label>
                          </div>

                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value="Vegan"
                              id="tag-vegan"
                              checked={tagsFilter.includes("Vegan")}
                              onChange={() => toggleTag("Vegan")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="tag-vegan"
                            >
                              Vegan
                            </label>
                          </div>

                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value="Gluten Free"
                              id="tag-glutenfree"
                              checked={tagsFilter.includes("Gluten Free")}
                              onChange={() => toggleTag("Gluten Free")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="tag-glutenfree"
                            >
                              Gluten Free
                            </label>
                          </div>

                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value="Dairy Free"
                              id="tag-dairyfree"
                              checked={tagsFilter.includes("Dairy Free")}
                              onChange={() => toggleTag("Dairy Free")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="tag-dairyfree"
                            >
                              Dairy Free
                            </label>
                          </div>

                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value="High Protein"
                              id="tag-highprotein"
                              checked={tagsFilter.includes("High Protein")}
                              onChange={() => toggleTag("High Protein")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="tag-highprotein"
                            >
                              High Protein
                            </label>
                          </div>

                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value="Under 30 Minutes"
                              id="tag-under30"
                              checked={tagsFilter.includes("Under 30 Minutes")}
                              onChange={() => toggleTag("Under 30 Minutes")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="tag-under30"
                            >
                              Under 30 Minutes
                            </label>
                          </div>

                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value="Meal Prep"
                              id="tag-mealprep"
                              checked={tagsFilter.includes("Meal Prep")}
                              onChange={() => toggleTag("Meal Prep")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="tag-mealprep"
                            >
                              Meal Prep
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        className="btn btn-outline-danger me-auto"
                        onClick={() => resetFilters()}
                      >
                        Reset
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={() => setShowFilters(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="modal-backdrop fade show"
                onClick={() => setShowFilters(false)}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}

export default View;
