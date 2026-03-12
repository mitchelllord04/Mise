import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getRecipe, deleteRecipe, updateRecipe } from "../services/recipes";
import { useEffect, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import placeholder from "../assets/placeholder.png";

function EditRecipe() {
  const { user, loading } = useAuth();
  const { recipeId } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    recipeName: "",
    authorName: "",
    mealType: "Breakfast",
    cuisine: "Southern",
    course: "Main",
    tags: [],
    prepTime: "",
    cookTime: "",
    servings: "",
    calories: "",
    ingredients: [],
    instructions: [],
    isFavorite: false,
    imageUrl: "",
  });

  const [ingredientFormOpen, setIngredientFormOpen] = useState(false);
  const [ingredient, setIngredient] = useState({
    name: "",
    quantity: "",
    units: "",
  });

  const [instructionFormOpen, setInstructionFormOpen] = useState(false);
  const [instruction, setInstruction] = useState("");

  const [tagsOpen, setTagsOpen] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const navigate = useNavigate();

  const TAG_OPTIONS = [
    "Low Carb",
    "Vegetarian",
    "Vegan",
    "Gluten Free",
    "Dairy Free",
    "High Protein",
    "Under 30 Minutes",
    "Meal Prep",
  ];

  const toggleTag = (tag) => {
    setForm((prev) => {
      const has = prev.tags.includes(tag);
      return {
        ...prev,
        tags: has ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const calculateTotalTime = (data) => {
    const total = Number(data.prepTime || 0) + Number(data.cookTime || 0);

    const days = Math.floor(total / 1440);
    const hours = Math.floor((total % 1440) / 60);
    const minutes = total % 60;

    const parts = [];

    if (days) parts.push(`${days} d`);
    if (hours) parts.push(`${hours} hr`);
    if (minutes) parts.push(`${minutes} min`);

    return parts.length ? parts.join(" ") : "0 min";
  };

  const formatTime = (total) => {
    const value = Number(total || 0);

    const days = Math.floor(value / 1440);
    const hours = Math.floor((value % 1440) / 60);
    const minutes = value % 60;

    const parts = [];

    if (days) parts.push(`${days} d`);
    if (hours) parts.push(`${hours} hr`);
    if (minutes) parts.push(`${minutes} min`);

    return parts.length ? parts.join(" ") : "0 min";
  };

  const formatIngredient = (ingredient) => {
    const quantity = String(ingredient.quantity ?? "").trim();
    const unit = String(ingredient.units ?? "").trim();
    const name = String(ingredient.name ?? "").trim();

    if (unit === "to taste") {
      return [name, unit].filter(Boolean).join(" ");
    }

    const hiddenUnits = ["", "each"];
    const shownUnit = hiddenUnits.includes(unit) ? "" : unit;

    return [quantity, shownUnit, name].filter(Boolean).join(" ");
  };

  const canAddIngredient =
    ingredient.name.trim().length > 0 &&
    (ingredient.units === "to taste"
      ? true
      : ingredient.quantity.toString().trim().length > 0);

  const preventScrollChange = (e) => e.target.blur();

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

      if (!data) {
        setRecipe(null);
      } else {
        setRecipe(data);
        setForm({
          recipeName: data.recipeName || "",
          authorName: data.authorName || "",
          mealType: data.mealType || "Breakfast",
          cuisine: data.cuisine || "Southern",
          course: data.course || "Main",
          tags: Array.isArray(data.tags) ? data.tags : [],
          prepTime: data.prepTime || "",
          cookTime: data.cookTime || "",
          servings: data.servings || "",
          calories: data.calories || "",
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
          instructions: Array.isArray(data.instructions)
            ? data.instructions
            : [],
          isFavorite: data.isFavorite || false,
          imageUrl: data.imageUrl || "",
        });
        setImagePreview(data.imageUrl || "");
      }

      const elapsed = Date.now() - start;
      const remaining = 600 - elapsed;

      if (remaining > 0) {
        timeoutId = setTimeout(() => setPageLoading(false), remaining);
      } else {
        setPageLoading(false);
      }
    }

    loadRecipe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, user, recipeId]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleAddIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient],
    }));

    setIngredientFormOpen(false);
    setIngredient({ name: "", quantity: "", units: "" });
  };

  const handleAddInstruction = () => {
    if (!instruction.trim()) return;

    setForm((prev) => ({
      ...prev,
      instructions: [...prev.instructions, instruction],
    }));

    setInstructionFormOpen(false);
    setInstruction("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview(form.imageUrl || "");
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(previewUrl);
  };

  async function handleSave() {
    if (!user) return;

    try {
      setSaving(true);
      setUploadProgress(0);

      let imageUrl = form.imageUrl || "";

      if (imageFile) {
        const imageRef = ref(
          storage,
          `users/${user.uid}/recipes/${recipeId}/${imageFile.name}`,
        );

        setUploadProgress(1);
        const uploadTask = uploadBytesResumable(imageRef, imageFile);

        imageUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snap) => {
              setUploadProgress(
                Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
              );
            },
            reject,
            async () => {
              resolve(await getDownloadURL(uploadTask.snapshot.ref));
            },
          );
        });
      }

      await updateRecipe(user.uid, recipeId, {
        ...form,
        imageUrl: imageUrl || null,
        prepTime: form.prepTime === "" ? "" : Number(form.prepTime),
        cookTime: form.cookTime === "" ? "" : Number(form.cookTime),
        servings: form.servings === "" ? "" : Number(form.servings),
        calories: form.calories === "" ? "" : Number(form.calories),
      });

      navigate(`/details/${recipeId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    if (!window.confirm(`Delete ${form.recipeName || "this recipe"}?`)) return;

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
          style={{ maxWidth: "31.25rem", width: "100%" }}
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
      {saving && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Saving recipe…</h5>
                </div>
                <div className="modal-body">
                  {imageFile ? (
                    <>
                      <div className="progress">
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${uploadProgress}%` }}
                          aria-valuenow={uploadProgress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          {uploadProgress}%
                        </div>
                      </div>
                      <div className="mt-2 text-body-secondary">
                        Uploading image…
                      </div>
                    </>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <div className="spinner-border" role="status" />
                      <div>Saving…</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}

      <div className="container py-4">
        <div className="mb-4 p-4 rounded-4 border bg-light">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div className="flex-grow-1">
              <h1 className="mb-2">
                <input
                  className="form-control form-control-lg fw-bold"
                  value={form.recipeName}
                  onChange={(e) =>
                    setForm({ ...form, recipeName: e.target.value })
                  }
                  placeholder="Recipe name"
                />
              </h1>

              <div className="text-body-secondary mb-3">
                By{" "}
                <span className="fw-semibold">
                  <input
                    className="form-control d-inline-block ms-1"
                    style={{ maxWidth: "15.625rem" }}
                    value={form.authorName}
                    onChange={(e) =>
                      setForm({ ...form, authorName: e.target.value })
                    }
                    placeholder="Author name"
                  />
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge rounded-pill text-bg-secondary"
                  >
                    {tag}
                    <button
                      type="button"
                      className="btn btn-sm p-0 ms-2 text-white border-0"
                      onClick={() => toggleTag(tag)}
                      style={{ lineHeight: 1, background: "transparent" }}
                    >
                      ✕
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setTagsOpen(true)}
                >
                  Edit Tags
                </button>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/details/${recipeId}`)}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
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
          <div className="col-12 col-lg-8 order-2 order-lg-1">
            <div className="card rounded-4 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">Ingredients</h4>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIngredientFormOpen(true)}
                  >
                    Add Ingredient
                  </button>
                </div>

                {form.ingredients.length === 0 ? (
                  <p className="text-body-secondary mb-0">No ingredients yet</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {form.ingredients.map((ingredient, index) => (
                      <div
                        key={`${ingredient.name}-${index}`}
                        className="list-group-item d-flex align-items-center justify-content-between rounded-3 border p-3"
                      >
                        <span>{formatIngredient(ingredient)}</span>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              ingredients: prev.ingredients.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card rounded-4 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">Instructions</h4>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setInstructionFormOpen(true)}
                  >
                    Add Step
                  </button>
                </div>

                {form.instructions.length === 0 ? (
                  <p className="text-body-secondary mb-0">
                    No instructions yet
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {form.instructions.map((step, index) => (
                      <div
                        key={index}
                        className="list-group-item d-flex align-items-center justify-content-between rounded-3 border p-3 gap-3"
                      >
                        <div className="d-flex gap-3 align-items-start">
                          <span className="fw-semibold">{index + 1}.</span>
                          <span>{step}</span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              instructions: prev.instructions.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4 order-1 order-lg-2">
            <div className="position-sticky" style={{ top: "1rem" }}>
              <div className="card rounded-4 shadow-sm">
                <div className="card-body">
                  <img
                    src={imagePreview || form.imageUrl || placeholder}
                    className="card-img-top mb-3"
                    alt="Recipe"
                    style={{
                      height: "12.5rem",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = placeholder;
                    }}
                  />

                  <div className="mb-3">
                    <label className="form-label">Recipe Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handleImageChange}
                    />
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
                    <span className="text-body-secondary">
                      <i className="bi bi-egg-fried me-2" />
                      Course
                    </span>
                    <select
                      className="form-select text-end"
                      style={{ maxWidth: "11.25rem" }}
                      value={form.course}
                      onChange={(e) =>
                        setForm({ ...form, course: e.target.value })
                      }
                    >
                      <option>Main</option>
                      <option>Side</option>
                      <option>Appetizer</option>
                      <option>Salad</option>
                      <option>Soup</option>
                      <option>Sauce</option>
                      <option>Dessert</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
                    <span className="text-body-secondary">
                      <i className="bi bi-fork-knife me-2" />
                      Type
                    </span>
                    <select
                      className="form-select text-end"
                      style={{ maxWidth: "11.25rem" }}
                      value={form.mealType}
                      onChange={(e) =>
                        setForm({ ...form, mealType: e.target.value })
                      }
                    >
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                      <option>Snack</option>
                      <option>Drink</option>
                    </select>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
                    <span className="text-body-secondary">
                      <i className="bi bi-globe-americas me-2" />
                      Cuisine
                    </span>
                    <select
                      className="form-select text-end"
                      style={{ maxWidth: "11.25rem" }}
                      value={form.cuisine}
                      onChange={(e) =>
                        setForm({ ...form, cuisine: e.target.value })
                      }
                    >
                      <option>Southern</option>
                      <option>Mexican</option>
                      <option>Chinese</option>
                      <option>Japanese</option>
                      <option>Italian</option>
                      <option>French</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
                    <span className="text-body-secondary">
                      <i className="bi bi-people-fill me-2" />
                      Serves
                    </span>
                    <input
                      type="number"
                      className="form-control text-end"
                      style={{ maxWidth: "11.25rem" }}
                      value={form.servings}
                      onChange={(e) =>
                        setForm({ ...form, servings: e.target.value })
                      }
                      onWheel={preventScrollChange}
                    />
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
                    <span className="text-body-secondary">
                      <i className="bi bi-lightning-fill me-2" />
                      Calories
                    </span>
                    <input
                      type="number"
                      className="form-control text-end"
                      style={{ maxWidth: "11.25rem" }}
                      value={form.calories}
                      onChange={(e) =>
                        setForm({ ...form, calories: e.target.value })
                      }
                      onWheel={preventScrollChange}
                    />
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
                    <span className="text-body-secondary">
                      <i className="bi bi-basket me-2" />
                      Prep time
                    </span>
                    <input
                      type="number"
                      className="form-control text-end"
                      style={{ maxWidth: "11.25rem" }}
                      value={form.prepTime}
                      onChange={(e) =>
                        setForm({ ...form, prepTime: e.target.value })
                      }
                      onWheel={preventScrollChange}
                    />
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
                    <span className="text-body-secondary">
                      <i className="bi bi-fire me-2" />
                      Cook time
                    </span>
                    <input
                      type="number"
                      className="form-control text-end"
                      style={{ maxWidth: "11.25rem" }}
                      value={form.cookTime}
                      onChange={(e) =>
                        setForm({ ...form, cookTime: e.target.value })
                      }
                      onWheel={preventScrollChange}
                    />
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-body-secondary">
                      <i className="bi bi-clock me-2" />
                      Total time
                    </span>
                    <span className="fw-semibold">
                      {calculateTotalTime(form)}
                    </span>
                  </div>

                  <div className="text-end text-body-secondary small">
                    Prep: {formatTime(form.prepTime)} · Cook:{" "}
                    {formatTime(form.cookTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {ingredientFormOpen && (
          <>
            <div
              className="modal fade show"
              style={{ display: "block" }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add Ingredient</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setIngredientFormOpen(false)}
                    />
                  </div>

                  <div className="modal-body">
                    <label className="mb-2">Name</label>
                    <input
                      className="form-control mb-3"
                      placeholder="e.g. Flour"
                      value={ingredient.name}
                      onChange={(e) =>
                        setIngredient((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />

                    <label className="mb-2">Quantity</label>
                    <div className="input-group">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="form-control"
                        placeholder="e.g. 2, 1/2, 1 1/2"
                        value={ingredient.quantity}
                        onChange={(e) =>
                          setIngredient((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                      />

                      <select
                        className="form-select"
                        style={{ maxWidth: "12rem" }}
                        value={ingredient.units}
                        onChange={(e) =>
                          setIngredient((prev) => ({
                            ...prev,
                            units: e.target.value,
                          }))
                        }
                      >
                        <option value="">No unit</option>
                        <option value="tsp">tsp</option>
                        <option value="tbsp">tbsp</option>
                        <option value="cup">cup</option>
                        <option value="fl oz">fl oz</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="oz">oz</option>
                        <option value="lb">lb</option>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="each">each</option>
                        <option value="clove">clove</option>
                        <option value="slice">slice</option>
                        <option value="piece">piece</option>
                        <option value="stick">stick</option>
                        <option value="can">can</option>
                        <option value="jar">jar</option>
                        <option value="package">package</option>
                        <option value="bunch">bunch</option>
                        <option value="head">head</option>
                        <option value="handful">handful</option>
                        <option value="pinch">pinch</option>
                        <option value="dash">dash</option>
                        <option value="to taste">to taste</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIngredientFormOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!canAddIngredient}
                      onClick={handleAddIngredient}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="modal-backdrop fade show"
              onClick={() => setIngredientFormOpen(false)}
            />
          </>
        )}

        {instructionFormOpen && (
          <>
            <div
              className="modal fade show"
              style={{ display: "block" }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add Instruction</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setInstructionFormOpen(false)}
                    />
                  </div>

                  <div className="modal-body">
                    <label className="mb-2">Instruction</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Boil the noodles"
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setInstructionFormOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddInstruction}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="modal-backdrop fade show"
              onClick={() => setInstructionFormOpen(false)}
            />
          </>
        )}

        {tagsOpen && (
          <>
            <div
              className="modal fade show"
              style={{ display: "block" }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Select Tags</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setTagsOpen(false)}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="d-grid gap-2">
                      {TAG_OPTIONS.map((tag) => (
                        <label
                          key={tag}
                          className="d-flex align-items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={form.tags.includes(tag)}
                            onChange={() => toggleTag(tag)}
                          />
                          <span>{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setTagsOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="modal-backdrop fade show"
              onClick={() => setTagsOpen(false)}
            />
          </>
        )}
      </div>
    </>
  );
}

export default EditRecipe;
