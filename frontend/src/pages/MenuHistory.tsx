import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Ingredient, MenuHistoryEntry, MenuRecipe } from "../types/menu";

const HISTORY_PAGE_SIZE = 6;

const roundQuantity = (value: number) => Math.round(value * 100) / 100;
const formatCurrency = (currency: string, amount: number) => {
    const resolvedCurrency = currency && currency.trim() ? currency : "PHP";
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: resolvedCurrency,
        maximumFractionDigits: 2,
    }).format(amount);
};

const buildFallbackImageUrl = (label: string) => {
    const text = encodeURIComponent(`${label || "Dish"} preview`);
    return `https://placehold.co/1200x800/FDF5EA/5F3A27/png?text=${text}`;
};

const scaleIngredients = (ingredients: Ingredient[], baseServings: number, servings: number) => (
    ingredients.map((ingredient) => ({
        ...ingredient,
        quantity: roundQuantity((ingredient.quantity * servings) / Math.max(baseServings, 1)),
    }))
);

const MenuHistory = () => {
    const [history, setHistory] = useState<MenuHistoryEntry[]>([]);
    const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
    const [servings, setServings] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/menu/history");
                const items = response.data as MenuHistoryEntry[];
                setHistory(items);

                if (items.length > 0) {
                    setSelectedEntryId(items[0].id);
                    setServings(items[0].menu.servings);
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || "Unable to load menu history");
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, []);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredHistory = history.filter((entry) => {
        if (!normalizedSearch) {
            return true;
        }

        return (
            entry.menu.menuName.toLowerCase().includes(normalizedSearch)
            || entry.searchQuery.toLowerCase().includes(normalizedSearch)
            || entry.menu.description.toLowerCase().includes(normalizedSearch)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart = (safePage - 1) * HISTORY_PAGE_SIZE;
    const pagedHistory = filteredHistory.slice(pageStart, pageStart + HISTORY_PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        if (currentPage !== safePage) {
            setCurrentPage(safePage);
        }
    }, [currentPage, safePage]);

    useEffect(() => {
        if (filteredHistory.length === 0) {
            setSelectedEntryId(null);
            return;
        }

        const selectedExists = selectedEntryId != null && filteredHistory.some((entry) => entry.id === selectedEntryId);
        if (!selectedExists) {
            setSelectedEntryId(filteredHistory[0].id);
        }
    }, [filteredHistory, selectedEntryId]);

    const selectedEntry = filteredHistory.find((entry) => entry.id === selectedEntryId) || null;
    const selectedMenu = selectedEntry?.menu || null;

    useEffect(() => {
        if (selectedMenu) {
            setServings(selectedMenu.servings);
        }
    }, [selectedEntryId]);

    const scaledMenu: MenuRecipe | null = selectedMenu ? {
        ...selectedMenu,
        servings,
        ingredients: scaleIngredients(selectedMenu.ingredients, selectedMenu.servings, servings),
            nutritionFacts: {
                calories: roundQuantity((selectedMenu.nutritionFacts.calories * servings) / Math.max(selectedMenu.servings, 1)),
                proteinGrams: roundQuantity((selectedMenu.nutritionFacts.proteinGrams * servings) / Math.max(selectedMenu.servings, 1)),
                carbohydratesGrams: roundQuantity((selectedMenu.nutritionFacts.carbohydratesGrams * servings) / Math.max(selectedMenu.servings, 1)),
                fatGrams: roundQuantity((selectedMenu.nutritionFacts.fatGrams * servings) / Math.max(selectedMenu.servings, 1)),
            },
            costEstimation: {
                ...selectedMenu.costEstimation,
                estimatedTotal: roundQuantity((selectedMenu.costEstimation.estimatedTotal * servings) / Math.max(selectedMenu.servings, 1)),
            },
    } : null;

    return (
        <>
            <div className="content-header k-page-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-lg-8">
                            <h1 className="m-0">Menu History</h1>
                            <p className="k-page-subtitle mb-0">
                                Revisit saved dishes, inspect the JSON, and rescale ingredients any time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="row g-3">
                        <div className="col-lg-5">
                            <div className="card h-100 k-feature-card">
                                <div className="card-header k-card-header">
                                    <h3 className="card-title">Saved Menus</h3>
                                </div>

                                <div className="card-body p-0">
                                    <div className="p-3 border-bottom">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search menu history..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {loading ? (
                                        <div className="alert alert-info m-3">Loading history...</div>
                                    ) : filteredHistory.length === 0 ? (
                                        <div className="alert alert-secondary m-3 mb-0">No saved menu history yet.</div>
                                    ) : (
                                        <>
                                            <div className="list-group list-group-flush k-history-list">
                                                {pagedHistory.map((entry) => (
                                                    <button
                                                        key={entry.id}
                                                        type="button"
                                                        className={`list-group-item list-group-item-action ${selectedEntryId === entry.id ? "active" : ""}`}
                                                        onClick={() => setSelectedEntryId(entry.id)}
                                                    >
                                                        <div className="fw-semibold">{entry.menu.menuName}</div>
                                                        <div className="small">Search: {entry.searchQuery}</div>
                                                        <div className="small">Saved: {new Date(entry.createdAt).toLocaleString()}</div>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                                                <small className="text-muted">
                                                    Page {safePage} of {totalPages}
                                                </small>

                                                <div className="btn-group btn-group-sm" role="group" aria-label="History pagination">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                                        disabled={safePage === 1}
                                                    >
                                                        Prev
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                                        disabled={safePage === totalPages}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-7">
                            <div className="card h-100 k-feature-card">
                                <div className="card-header d-flex justify-content-between align-items-center k-card-header">
                                    <h3 className="card-title mb-0">Saved Menu Details</h3>

                                    {scaledMenu && (
                                        <div className="d-flex align-items-center gap-2">
                                            <label className="form-label mb-0">Persons</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ width: 100 }}
                                                min={1}
                                                value={servings}
                                                onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="card-body">
                                    {!scaledMenu ? (
                                        <div className="alert alert-secondary mb-0">Select a saved menu to view it.</div>
                                    ) : (
                                        <>
                                            <h2 className="h4">{scaledMenu.menuName}</h2>
                                            <p className="text-muted">{scaledMenu.description}</p>

                                            {scaledMenu.imageUrl && (
                                                <div className="mb-3">
                                                    <img
                                                        src={scaledMenu.imageUrl}
                                                        alt={scaledMenu.menuName}
                                                        className="img-fluid rounded k-menu-image"
                                                        loading="lazy"
                                                        onError={(event) => {
                                                            const image = event.currentTarget;
                                                            const fallbackUrl = buildFallbackImageUrl(scaledMenu.menuName);
                                                            if (image.src !== fallbackUrl) {
                                                                image.src = fallbackUrl;
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <h3 className="h6 mt-4">Ingredients</h3>
                                            <div className="table-responsive">
                                                <table className="table table-bordered align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th>Ingredient</th>
                                                            <th>Quantity</th>
                                                            <th>Unit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {scaledMenu.ingredients.map((ingredient, index) => (
                                                            <tr key={`${ingredient.name}-${index}`}>
                                                                <td>{ingredient.name}</td>
                                                                <td>{roundQuantity(ingredient.quantity)}</td>
                                                                <td>{ingredient.unit}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <h3 className="h6 mt-4">Instructions</h3>
                                            <ol className="ps-3">
                                                {scaledMenu.instructions.map((step, index) => (
                                                    <li key={`${index}-${step}`}>{step}</li>
                                                ))}
                                            </ol>

                                            <div className="row g-3 mt-3">
                                                <div className="col-md-6">
                                                    <h3 className="h6">Nutrition Facts</h3>
                                                    <ul className="list-group list-group-flush border rounded">
                                                        <li className="list-group-item d-flex justify-content-between">
                                                            <span>Calories</span>
                                                            <strong>{roundQuantity(scaledMenu.nutritionFacts.calories)} kcal</strong>
                                                        </li>
                                                        <li className="list-group-item d-flex justify-content-between">
                                                            <span>Protein</span>
                                                            <strong>{roundQuantity(scaledMenu.nutritionFacts.proteinGrams)} g</strong>
                                                        </li>
                                                        <li className="list-group-item d-flex justify-content-between">
                                                            <span>Carbohydrates</span>
                                                            <strong>{roundQuantity(scaledMenu.nutritionFacts.carbohydratesGrams)} g</strong>
                                                        </li>
                                                        <li className="list-group-item d-flex justify-content-between">
                                                            <span>Fat</span>
                                                            <strong>{roundQuantity(scaledMenu.nutritionFacts.fatGrams)} g</strong>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div className="col-md-6">
                                                    <h3 className="h6">Cost Estimation</h3>
                                                    <div className="border rounded p-3 h-100">
                                                        <p className="mb-2">
                                                            <strong>Estimated Total:</strong> {formatCurrency(scaledMenu.costEstimation.currency, scaledMenu.costEstimation.estimatedTotal)}
                                                        </p>
                                                        <p className="small text-muted mb-0">{scaledMenu.costEstimation.notes}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 className="h6 mt-4">JSON</h3>
                                            <pre className="bg-body-tertiary border rounded p-3 small mb-0 k-json-preview" style={{ whiteSpace: "pre-wrap" }}>
                                                {JSON.stringify(scaledMenu, null, 2)}
                                            </pre>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default MenuHistory;