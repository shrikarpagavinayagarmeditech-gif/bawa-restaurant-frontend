
import React, { useEffect, useMemo, useState } from "react";

import {
    getFoodItems,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
    reorderFoodItems,
} from "../../../controllers/foodItem.controller.js";

import { getCategories } from "../../../controllers/category.controller.js";

import "./food-item.css";

function FoodItems() {
    const [foodItems, setFoodItems] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Manual ordering
    const [orderingCategory, setOrderingCategory] = useState("");
    const [orderedItems, setOrderedItems] = useState([]);
    const [orderChanged, setOrderChanged] = useState(false);

    const [formData, setFormData] = useState({
        categoryId: "",
        name: "",
        rate: "",
        description: "",
        isActive: true,
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    // =========================================
    // LOAD DATA
    // =========================================
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            console.log("🍴 LOADING FOOD ITEMS");

            const [foodResponse, categoryResponse] = await Promise.all([
                getFoodItems(),
                getCategories(),
            ]);

            const foods = foodResponse?.data || [];
            const categoryData = categoryResponse?.data || [];

            console.log("🍴 Food items:", foods);
            console.log("📂 Categories:", categoryData);

            setFoodItems(foods);
            setCategories(categoryData);

            // Refresh ordering list after loading
            if (orderingCategory) {
                setOrderedItems(
                    foods.filter(
                        (food) => food.categoryId === orderingCategory
                    )
                );
                setOrderChanged(false);
            }
        } catch (error) {
            console.error("❌ Failed to load food items:", error);

            alert(
                error.response?.data?.message ||
                "Failed to load food items"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // FILTERED FOOD ITEMS
    // =========================================
    const filteredFoodItems = useMemo(() => {
        return foodItems.filter((food) => {
            const searchText = search.trim().toLowerCase();

            const matchesSearch =
                !searchText ||
                food.name?.toLowerCase().includes(searchText) ||
                food.category?.name?.toLowerCase().includes(searchText) ||
                food.description?.toLowerCase().includes(searchText);

            const matchesCategory =
                categoryFilter === "ALL" ||
                food.categoryId === categoryFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" && food.active === true) ||
                (statusFilter === "INACTIVE" && food.active === false);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [foodItems, search, categoryFilter, statusFilter]);

    // =========================================
    // COUNTS
    // =========================================
    const totalCount = foodItems.length;
    const activeCount = foodItems.filter((food) => food.active === true).length;
    const inactiveCount = foodItems.filter((food) => food.active === false).length;

    // =========================================
    // IMAGE URL
    // =========================================
    const getImageUrl = (image) => {
        if (!image) return null;

        const serverUrl = "https://bawa.quiltoaiapps.com";

        if (/^https?:\/\//i.test(image)) {
            try {
                const url = new URL(image);

                if (
                    url.hostname === "localhost" ||
                    url.hostname === "127.0.0.1"
                ) {
                    return `${serverUrl}${url.pathname}${url.search}`;
                }

                return image;
            } catch {
                return image;
            }
        }

        return `${serverUrl}/${image.replace(/^\/+/, "")}`;
    };

    // =========================================
    // MANUAL ORDERING
    // =========================================
    const handleOrderingCategoryChange = (categoryId) => {
        setOrderingCategory(categoryId);

        const categoryFoods = foodItems.filter(
            (food) => food.categoryId === categoryId
        );

        setOrderedItems(categoryFoods);
        setOrderChanged(false);
    };

    const moveItem = (index, direction) => {
        const newIndex = index + direction;

        if (
            newIndex < 0 ||
            newIndex >= orderedItems.length
        ) {
            return;
        }

        const updatedItems = [...orderedItems];

        const [movingItem] = updatedItems.splice(index, 1);
        updatedItems.splice(newIndex, 0, movingItem);

        setOrderedItems(updatedItems);
        setOrderChanged(true);
    };

    const saveOrder = async () => {
        if (!orderingCategory) {
            alert("Please select a category");
            return;
        }

        if (!orderChanged) {
            alert("No order changes to save");
            return;
        }

        try {
            setSavingOrder(true);

            const itemIds = orderedItems.map((item) => item.id);

            console.log("🔃 Saving manual order:", {
                categoryId: orderingCategory,
                itemIds,
            });

            const response = await reorderFoodItems(
                orderingCategory,
                itemIds
            );

            alert(
                response?.message ||
                "Food item order saved successfully"
            );

            await loadData();

            setOrderedItems(
                foodItems.filter(
                    (food) => food.categoryId === orderingCategory
                )
            );

            setOrderChanged(false);
        } catch (error) {
            console.error("❌ Save order error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to save food item order"
            );
        } finally {
            setSavingOrder(false);
        }
    };

    // =========================================
    // INPUT CHANGE
    // =========================================
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // =========================================
    // IMAGE CHANGE
    // =========================================
    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Only JPG, JPEG, PNG and WEBP images are allowed");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image size must be less than 5 MB");
            event.target.value = "";
            return;
        }

        setSelectedImage(file);

        if (imagePreview?.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }

        setImagePreview(URL.createObjectURL(file));
    };

    // =========================================
    // OPEN ADD MODAL
    // =========================================
    const handleAdd = () => {
        setEditingId(null);

        setFormData({
            categoryId: "",
            name: "",
            rate: "",
            description: "",
            isActive: true,
        });

        setSelectedImage(null);
        setImagePreview("");
        setShowModal(true);
    };

    // =========================================
    // OPEN EDIT MODAL
    // =========================================
    const handleEdit = (food) => {
        setEditingId(food.id);

        setFormData({
            categoryId: food.categoryId || "",
            name: food.name || "",
            rate: food.rate ?? "",
            description: food.description || "",
            isActive: food.active === true,
        });

        setSelectedImage(null);
        setImagePreview(food.image ? getImageUrl(food.image) : "");
        setShowModal(true);
    };

    // =========================================
    // CLOSE MODAL
    // =========================================
    const handleCloseModal = () => {
        if (saving) return;

        if (imagePreview?.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }

        setShowModal(false);
        setEditingId(null);
        setSelectedImage(null);
        setImagePreview("");
    };

    // =========================================
    // VALIDATION
    // =========================================
    const validateForm = () => {
        if (!formData.categoryId) {
            alert("Please select a category");
            return false;
        }

        if (!formData.name.trim()) {
            alert("Please enter food name");
            return false;
        }

        if (
            formData.rate === "" ||
            Number.isNaN(Number(formData.rate)) ||
            Number(formData.rate) < 0
        ) {
            alert("Please enter a valid rate");
            return false;
        }

        if (!editingId && !selectedImage) {
            alert("Please select a food image");
            return false;
        }

        return true;
    };

    // =========================================
    // SAVE FOOD ITEM
    // =========================================
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        try {
            setSaving(true);

            const formDataToSend = new FormData();

            formDataToSend.append("categoryId", formData.categoryId);
            formDataToSend.append("name", formData.name.trim());
            formDataToSend.append("rate", Number(formData.rate));

            if (formData.description.trim()) {
                formDataToSend.append(
                    "description",
                    formData.description.trim()
                );
            }

            if (selectedImage) {
                formDataToSend.append("image", selectedImage);
            }

            if (editingId) {
                formDataToSend.append(
                    "active",
                    String(formData.isActive)
                );
            }

            console.log(
                editingId
                    ? "✏️ UPDATING FOOD ITEM"
                    : "🍴 CREATING FOOD ITEM"
            );

            for (const [key, value] of formDataToSend.entries()) {
                console.log(`📦 ${key}:`, value);
            }

            if (!editingId) {
                const response = await createFoodItem(formDataToSend);

                alert(
                    response?.message ||
                    "Food item created successfully"
                );
            } else {
                const response = await updateFoodItem(
                    editingId,
                    formDataToSend
                );

                alert(
                    response?.message ||
                    "Food item updated successfully"
                );
            }

            if (imagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }

            setShowModal(false);
            setEditingId(null);
            setSelectedImage(null);
            setImagePreview("");

            await loadData();

            if (orderingCategory) {
                const latestResponse = await getFoodItems();
                const latestFoods = latestResponse?.data || [];

                setFoodItems(latestFoods);
                setOrderedItems(
                    latestFoods.filter(
                        (food) => food.categoryId === orderingCategory
                    )
                );
                setOrderChanged(false);
            }
        } catch (error) {
            console.error("❌ Save food item error:", error);
            console.error("❌ Server response:", error.response?.data);

            alert(
                error.response?.data?.message ||
                "Failed to save food item"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================
    // DELETE / DEACTIVATE
    // =========================================
    const handleDelete = async (food) => {
        const confirmed = window.confirm(
            `Are you sure you want to deactivate "${food.name}"?`
        );

        if (!confirmed) return;

        try {
            console.log("🗑️ Deactivating food:", food.id);

            const response = await deleteFoodItem(food.id);

            alert(
                response?.message ||
                "Food item deactivated successfully"
            );

            await loadData();
        } catch (error) {
            console.error("❌ Delete food item error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to deactivate food item"
            );
        }
    };

    // =========================================
    // LOADING
    // =========================================
    if (loading) {
        return (
            <div className="food-items-page">
                <div className="food-loading">
                    <div className="food-spinner"></div>
                    <p>Loading food items...</p>
                </div>
            </div>
        );
    }

    // =========================================
    // UI
    // =========================================
    return (
        <div className="food-items-page">

            {/* PAGE HEADER */}
            <div className="food-page-header">
                <div>
                    <h1>Food Items</h1>
                    <p>
                        Manage restaurant food items,
                        categories and default rates.
                    </p>
                </div>

                <button
                    className="food-add-button"
                    onClick={handleAdd}
                >
                    <span>+</span>
                    Add Food Item
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="food-summary-grid">
                <div className="food-summary-card">
                    <div className="food-summary-icon">🍴</div>
                    <div>
                        <span>Total Food Items</span>
                        <strong>{totalCount}</strong>
                    </div>
                </div>

                <div className="food-summary-card">
                    <div className="food-summary-icon active">✓</div>
                    <div>
                        <span>Active</span>
                        <strong>{activeCount}</strong>
                    </div>
                </div>

                <div className="food-summary-card">
                    <div className="food-summary-icon inactive">−</div>
                    <div>
                        <span>Inactive</span>
                        <strong>{inactiveCount}</strong>
                    </div>
                </div>
            </div>

            {/* MANUAL ORDER SECTION */}
            <div className="food-table-card food-order-card">
                <div className="food-table-header">
                    <div>
                        <h2>Food Item Display Order</h2>
                        <span>
                            Arrange food items separately inside each category.
                        </span>
                    </div>
                </div>

                <div className="food-filter-card">
                    <select
                        value={orderingCategory}
                        onChange={(event) =>
                            handleOrderingCategoryChange(event.target.value)
                        }
                    >
                        <option value="">Select Category to Arrange</option>

                        {categories
                            .filter((category) => category.active === true)
                            .map((category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                            ))}
                    </select>

                    <button
                        type="button"
                        className="food-refresh-button"
                        onClick={() =>
                            orderingCategory &&
                            handleOrderingCategoryChange(orderingCategory)
                        }
                        disabled={!orderingCategory || savingOrder}
                    >
                        ↻ Reset Changes
                    </button>

                    <button
                        type="button"
                        className="food-save-button"
                        onClick={saveOrder}
                        disabled={!orderingCategory || !orderChanged || savingOrder}
                    >
                        {savingOrder ? "Saving Order..." : "Save Order"}
                    </button>
                </div>

                {!orderingCategory ? (
                    <div className="food-empty-state">
                        <div className="food-empty-icon">↕️</div>
                        <h3>Select a category</h3>
                        <p>
                            Choose a category above to arrange its food items.
                        </p>
                    </div>
                ) : orderedItems.length === 0 ? (
                    <div className="food-empty-state">
                        <div className="food-empty-icon">🍽️</div>
                        <h3>No food items in this category</h3>
                    </div>
                ) : (
                    <div className="food-order-list">
                        {orderedItems.map((food, index) => (
                            <div
                                className="food-order-row"
                                key={food.id}
                            >
                                <div className="food-order-number">
                                    {index + 1}
                                </div>

                                {getImageUrl(food.image) ? (
                                    <img
                                        src={getImageUrl(food.image)}
                                        alt={food.name}
                                        className="food-image"
                                        onError={(event) => {
                                            event.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <div className="food-image-placeholder">
                                        🍴
                                    </div>
                                )}

                                <div className="food-order-info">
                                    <strong>{food.name}</strong>
                                    <small>
                                        {food.active ? "Active" : "Inactive"}
                                    </small>
                                </div>

                                <div className="food-order-actions">
                                    <button
                                        type="button"
                                        onClick={() => moveItem(index, -1)}
                                        disabled={index === 0 || savingOrder}
                                        title="Move Up"
                                    >
                                        ↑
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => moveItem(index, 1)}
                                        disabled={
                                            index === orderedItems.length - 1 ||
                                            savingOrder
                                        }
                                        title="Move Down"
                                    >
                                        ↓
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {orderChanged && (
                    <p className="food-order-warning">
                        Order changed. Click Save Order to apply it to Billing.
                    </p>
                )}
            </div>

            {/* FILTER SECTION */}
            <div className="food-filter-card">
                <div className="food-search-box">
                    <span>🔍</span>
                    <input
                        type="text"
                        placeholder="Search food name, category..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                >
                    <option value="ALL">All Categories</option>

                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>

                <button
                    className="food-refresh-button"
                    onClick={loadData}
                >
                    ↻ Refresh
                </button>
            </div>

            {/* FOOD ITEMS TABLE */}
            <div className="food-table-card">
                <div className="food-table-header">
                    <div>
                        <h2>Food Items</h2>
                        <span>
                            {filteredFoodItems.length} item
                            {filteredFoodItems.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                {filteredFoodItems.length === 0 ? (
                    <div className="food-empty-state">
                        <div className="food-empty-icon">🍽️</div>
                        <h3>No food items found</h3>
                        <p>Try changing your search or filters.</p>
                    </div>
                ) : (
                    <div className="food-table-wrapper">
                        <table className="food-table">
                            <thead>
                                <tr>
                                    <th>Food</th>
                                    <th>Category</th>
                                    <th>Default Rate</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredFoodItems.map((food) => {
                                    const imageUrl = getImageUrl(food.image);

                                    return (
                                        <tr key={food.id}>
                                            <td>
                                                <div className="food-name-cell">
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={food.name}
                                                            className="food-image"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="food-image-placeholder">
                                                            🍴
                                                        </div>
                                                    )}

                                                    <div>
                                                        <strong>{food.name}</strong>
                                                        {food.description && (
                                                            <small>{food.description}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="food-category-badge">
                                                    {food.category?.name || "No Category"}
                                                </span>
                                            </td>

                                            <td>
                                                <strong className="food-rate">
                                                    ₹{Number(food.rate || 0).toFixed(2)}
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="food-description">
                                                    {food.description || "—"}
                                                </span>
                                            </td>

                                            <td>
                                                {food.active ? (
                                                    <span className="food-status active">
                                                        ● Active
                                                    </span>
                                                ) : (
                                                    <span className="food-status inactive">
                                                        ● Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="food-actions">
                                                    <button
                                                        className="food-edit-button"
                                                        onClick={() => handleEdit(food)}
                                                    >
                                                        Edit
                                                    </button>

                                                    {food.active && (
                                                        <button
                                                            className="food-delete-button"
                                                            onClick={() => handleDelete(food)}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div
                    className="food-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            handleCloseModal();
                        }
                    }}
                >
                    <div className="food-modal">
                        <div className="food-modal-header">
                            <div>
                                <h2>
                                    {editingId ? "Edit Food Item" : "Add Food Item"}
                                </h2>
                                <p>
                                    {editingId
                                        ? "Update food item details"
                                        : "Create a new food item"}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="food-modal-close"
                                onClick={handleCloseModal}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="food-form">
                            <div className="food-form-group">
                                <label>
                                    Food Image <span>*</span>
                                </label>

                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageChange}
                                />

                                <small>
                                    JPG, JPEG, PNG or WEBP. Maximum 5 MB.
                                    {editingId &&
                                        " Select a new image only if you want to replace the existing image."}
                                </small>

                                {imagePreview && (
                                    <div className="food-image-preview">
                                        <img
                                            src={imagePreview}
                                            alt="Food preview"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="food-form-group">
                                <label>
                                    Category <span>*</span>
                                </label>

                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Category</option>

                                    {categories
                                        .filter((category) => category.active === true)
                                        .map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="food-form-group">
                                <label>
                                    Food Name <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Example: Chicken Biriyani"
                                    required
                                />
                            </div>

                            <div className="food-form-group">
                                <label>
                                    Default Rate <span>*</span>
                                </label>

                                <div className="food-rate-input">
                                    <span>₹</span>

                                    <input
                                        type="number"
                                        name="rate"
                                        value={formData.rate}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="food-form-group">
                                <label>Description</label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enter food description..."
                                    rows="4"
                                />
                            </div>

                            {editingId && (
                                <div className="food-active-toggle">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                        />
                                        <span>Food Item Active</span>
                                    </label>
                                </div>
                            )}

                            <div className="food-form-actions">
                                <button
                                    type="button"
                                    className="food-cancel-button"
                                    onClick={handleCloseModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="food-save-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Food Item"
                                            : "Create Food Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FoodItems;
