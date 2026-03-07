import { useState } from "react";
import { addRecipe, updateRecipe } from "../services/recipes";
import { useAuth } from "../context/useAuth";
import DurationPicker from "../components/DurationPicker";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

function Add() {
  const { user, loading } = useAuth();

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
  });

  const [ingredientFormOpen, setIngredientFormOpen] = useState(false);
  const [ingredient, setIngredient] = useState({
    name: "",
    quantity: "",
    units: "",
  });

  const canAddIngredient =
    ingredient.name.trim().length > 0 &&
    ingredient.quantity.toString().trim().length > 0;

  const [instructionFormOpen, setInstructionFormOpen] = useState(false);
  const [instruction, setInstruction] = useState("");

  const [tagsOpen, setTagsOpen] = useState(false);

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

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [prepOpen, setPrepOpen] = useState(false);
  const [cookOpen, setCookOpen] = useState(false);

  if (loading) {
    return (
      <>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="text-center">
            <div className="spinner-border" role="status" />
            <p className="mt-3 text-body-secondary">Loading…</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) return <h2>Not logged in</h2>;

  const toggleTag = (tag) => {
    setForm((prev) => {
      const has = prev.tags.includes(tag);
      return {
        ...prev,
        tags: has ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const changeInstruction = (e) => {
    setInstruction(e);
  };

  const handleAddIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient],
    }));

    setIngredientFormOpen(false);
    setIngredient({ name: "", quantity: "", units: "" });
  };

  const handleAddInstruction = () => {
    setForm((prev) => ({
      ...prev,
      instructions: [...prev.instructions, instruction],
    }));

    setInstructionFormOpen(false);
    setInstruction("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipeName.trim()) return;

    if (form.ingredients.length === 0) {
      alert("Please add at least one ingredient.");
      return;
    }

    if (form.instructions.length === 0) {
      alert("Please add at least one instruction.");
      return;
    }

    setIsSaving(true);
    setUploadProgress(0);

    try {
      const recipeId = await addRecipe(user.uid, {
        ...form,
        imageUrl: null,
        prepTime: form.prepTime ? Number(form.prepTime) : null,
        cookTime: form.cookTime ? Number(form.cookTime) : null,
        servings: form.servings ? Number(form.servings) : null,
        calories: form.calories ? Number(form.calories) : null,
      });

      if (imageFile) {
        const imageRef = ref(
          storage,
          `users/${user.uid}/recipes/${recipeId}/${imageFile.name}`,
        );

        setUploadProgress(1);
        const uploadTask = uploadBytesResumable(imageRef, imageFile);

        const imageUrl = await new Promise((resolve, reject) => {
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

        await updateRecipe(user.uid, recipeId, { imageUrl });
      }

      setForm({
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
      });

      setIngredientFormOpen(false);
      setInstructionFormOpen(false);
      setTagsOpen(false);
      setIngredient({ name: "", quantity: "", units: "" });
      setInstruction("");
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      setFileInputKey((k) => k + 1);

      alert("Recipe successfully saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const toTotalMinutes = (value, units) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return units === "Hr" ? Math.round(n * 60) : Math.round(n);
  };

  const splitMinutes = (total) => {
    const t = Math.max(0, Math.round(Number(total) || 0));
    const days = Math.floor(t / 1440);
    const hours = Math.floor((t % 1440) / 60);
    const minutes = t % 60;
    return { days, hours, minutes };
  };

  const prepParts = splitMinutes(form.prepTime);
  const cookParts = splitMinutes(form.cookTime);

  const formatMinutes = (total) => {
    const t = Math.max(0, Math.round(Number(total) || 0));

    const days = Math.floor(t / 1440);
    const hours = Math.floor((t % 1440) / 60);
    const minutes = t % 60;

    const parts = [];

    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}hr`);
    if (minutes) parts.push(`${minutes}min`);

    if (parts.length === 0) return "";

    return parts.join(" ");
  };

  const formatIngredient = (ingredient) => {
    const quantity = String(ingredient.quantity ?? "").trim();
    const unit = String(ingredient.units ?? "").trim();
    const name = String(ingredient.name ?? "").trim();

    const hiddenUnits = ["", "each"];
    const shownUnit = hiddenUnits.includes(unit) ? "" : unit;

    return [quantity, shownUnit, name].filter(Boolean).join(" ");
  };

  return (
    <>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="m-0">Add Recipe</h1>
          <button
            type="submit"
            form="add-recipe-form"
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>

        {isSaving && (
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

        <form id="add-recipe-form" onSubmit={handleSubmit}>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Identity</h5>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={form.recipeName}
                    onChange={setField("recipeName")}
                    placeholder="Recipe name"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Author</label>
                  <input
                    className="form-control"
                    value={form.authorName}
                    onChange={setField("authorName")}
                    placeholder="Author name"
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Meal Type</label>
                  <select
                    className="form-select"
                    value={form.mealType}
                    onChange={setField("mealType")}
                    required
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Dessert</option>
                    <option>Snack</option>
                    <option>Drink</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Cuisine</label>
                  <select
                    className="form-select"
                    value={form.cuisine}
                    onChange={setField("cuisine")}
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
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Course</label>
                  <select
                    className="form-select"
                    value={form.course}
                    onChange={setField("course")}
                  >
                    <option>Main</option>
                    <option>Side</option>
                    <option>Appetizer</option>
                    <option>Salad</option>
                    <option>Soup</option>
                    <option>Sauce</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Tags</label>

                  <div className="tags-field form-control d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex flex-wrap gap-2">
                      {form.tags.length === 0 ? (
                        <span className="text-body-secondary">
                          No tags selected
                        </span>
                      ) : (
                        form.tags.map((tag) => (
                          <span
                            key={tag}
                            className="badge rounded-pill text-bg-secondary"
                          >
                            {tag}
                            <button
                              type="button"
                              className="btn btn-sm p-0 ms-2"
                              onClick={() => toggleTag(tag)}
                              style={{ lineHeight: 1 }}
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    <button
                      className="add-btn2"
                      type="button"
                      onClick={() => setTagsOpen(true)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="mb-3">
                  <label className="form-label">Recipe Image</label>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (!file) {
                        setImageFile(null);
                        if (imagePreview) URL.revokeObjectURL(imagePreview);
                        setImagePreview("");
                        return;
                      }

                      setImageFile(file);
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setImagePreview(URL.createObjectURL(file));
                    }}
                  />

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-3 rounded"
                      style={{ width: "200px", objectFit: "cover" }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Logistics</h5>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Prep time</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Prep time"
                      value={formatMinutes(form.prepTime)}
                      onClick={() => setPrepOpen(true)}
                      disabled={isSaving}
                      readOnly
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Cook time</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cook time"
                      value={formatMinutes(form.cookTime)}
                      onClick={() => setCookOpen(true)}
                      disabled={isSaving}
                      readOnly
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Servings</label>
                  <div className="input-group">
                    <input
                      className="form-control"
                      value={form.servings}
                      type="number"
                      onChange={setField("servings")}
                      placeholder="Servings"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Calories</label>
                  <div className="input-group">
                    <input
                      className="form-control"
                      value={form.calories}
                      type="number"
                      onChange={setField("calories")}
                      placeholder="Calories"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Ingredients</h5>
            </div>

            {form.ingredients.length === 0 ? (
              <p className="mx-auto mb-4"> No ingredients yet</p>
            ) : (
              <div className="mb-3">
                {form.ingredients.map((ingredient, index) => (
                  <div
                    className="border rounded-3 p-3 mb-2 d-flex align-items-center ingredient-card"
                    style={{ maxWidth: "50rem", margin: "0 auto" }}
                  >
                    <div className="flex-grow-1 text-center">
                      {formatIngredient(ingredient)}
                    </div>

                    <button
                      className="delete-btn ms-2 d-flex align-items-center justify-content-center"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm((prev) => ({
                          ...prev,
                          ingredients: prev.ingredients.filter(
                            (_, i) => i !== index,
                          ),
                        }));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="d-flex justify-content-center">
              <button
                className="add-btn mb-4"
                type="button"
                onClick={() => setIngredientFormOpen(true)}
              />
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Instructions</h5>
            </div>

            {form.instructions.length === 0 ? (
              <p className="mx-auto mb-4"> No instructions yet</p>
            ) : (
              <div className="mb-3">
                {form.instructions.map((instruction, index) => (
                  <div
                    className="border rounded-3 p-3 mb-2 d-flex align-items-center ingredient-card"
                    style={{ maxWidth: "50rem", margin: "0 auto" }}
                  >
                    <div className="ms-2 d-flex align-items-center justify-content-center">
                      {index + 1}.
                    </div>

                    <div className="flex-grow-1 text-center">{instruction}</div>

                    <button
                      className="delete-btn ms-2 d-flex align-items-center justify-content-center"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm((prev) => ({
                          ...prev,
                          instructions: prev.instructions.filter(
                            (_, i) => i !== index,
                          ),
                        }));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="d-flex justify-content-center">
              <button
                className="add-btn mb-4"
                type="button"
                onClick={() => setInstructionFormOpen(true)}
              />
            </div>
          </div>

          <button
            type="submit"
            form="add-recipe-form"
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>

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
                      <label className="mb-2"> Name </label>
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
                        required
                      />

                      <label className="mb-2"> Quantity </label>
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
                          className="form-select border-start-0"
                          style={{
                            maxWidth: "12rem",
                            backgroundColor: "transparent",
                          }}
                          value={ingredient.units}
                          onChange={(e) =>
                            setIngredient((prev) => ({
                              ...prev,
                              units: e.target.value,
                            }))
                          }
                        >
                          <option value="" disabled selected>
                            Select unit
                          </option>
                          <option value="">No unit</option>

                          <option disabled>Volume</option>
                          <option value="tsp">tsp</option>
                          <option value="tbsp">tbsp</option>
                          <option value="cup">cup</option>
                          <option value="fl oz">fl oz</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>

                          <option disabled>Weight</option>
                          <option value="oz">oz</option>
                          <option value="lb">lb</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>

                          <option disabled>Count</option>
                          <option value="each">each</option>
                          <option value="clove">clove</option>
                          <option value="slice">slice</option>
                          <option value="piece">piece</option>
                          <option value="stick">stick</option>
                          <option value="can">can</option>
                          <option value="jar">jar</option>
                          <option value="package">package</option>

                          <option disabled>Other</option>
                          <option value="bunch">bunch</option>
                          <option value="head">head</option>
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
                        onClick={() => handleAddIngredient()}
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
                      <label className="mb-2"> Instruction </label>
                      <input
                        className="form-control mb-3"
                        placeholder="e.g. Boil the noodles"
                        value={instruction}
                        onChange={(e) => changeInstruction(e.target.value)}
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
                        onClick={() => handleAddInstruction()}
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

          {prepOpen && (
            <DurationPicker
              open={prepOpen}
              initialDays={prepParts.days}
              initialHours={prepParts.hours}
              initialMinutes={prepParts.minutes}
              onCancel={() => setPrepOpen(false)}
              onConfirm={(v) => {
                const total =
                  typeof v === "number"
                    ? v
                    : Number(v?.totalMinutes) ||
                      Math.max(0, Number(v?.days || 0)) * 1440 +
                        Math.max(0, Number(v?.hours || 0)) * 60 +
                        Math.max(0, Number(v?.minutes || 0));

                setForm((prev) => ({ ...prev, prepTime: String(total) }));
                setPrepOpen(false);
              }}
            />
          )}

          {cookOpen && (
            <DurationPicker
              open={cookOpen}
              initialDays={cookParts.days}
              initialHours={cookParts.hours}
              initialMinutes={cookParts.minutes}
              onCancel={() => setCookOpen(false)}
              onConfirm={(v) => {
                const total =
                  typeof v === "number"
                    ? v
                    : Number(v?.totalMinutes) ||
                      Math.max(0, Number(v?.days || 0)) * 1440 +
                        Math.max(0, Number(v?.hours || 0)) * 60 +
                        Math.max(0, Number(v?.minutes || 0));

                setForm((prev) => ({ ...prev, cookTime: String(total) }));
                setCookOpen(false);
              }}
            />
          )}
        </form>
      </div>
    </>
  );
}

export default Add;
