import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import type { Ingredient, MenuRecipe, MenuSearchResponse } from "../types/menu";

type CookMode = "HOME_COMFORT" | "RESTAURANT_STYLE" | "BUDGET_SAVER" | "HEALTHY_LIGHT" | "FIESTA_PARTY";

const COOK_MODE_OPTIONS: Array<{
    id: CookMode;
    title: string;
    subtitle: string;
    icon: string;
}> = [
    { id: "HOME_COMFORT", title: "Home Comfort", subtitle: "Simple and family-friendly.", icon: "bi-house-heart" },
    { id: "RESTAURANT_STYLE", title: "Restaurant Style", subtitle: "More refined flavor and plating.", icon: "bi-stars" },
    { id: "BUDGET_SAVER", title: "Budget Saver", subtitle: "Lower-cost ingredients and prep.", icon: "bi-piggy-bank" },
    { id: "HEALTHY_LIGHT", title: "Healthy Light", subtitle: "Balanced and lighter cooking style.", icon: "bi-heart-pulse" },
    { id: "FIESTA_PARTY", title: "Fiesta Party", subtitle: "Bold and shareable for groups.", icon: "bi-balloon" },
];

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

const normalizeSearchQuery = (value: string) => value.trim().toLowerCase();

const Dashboard = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [cookMode, setCookMode] = useState<CookMode>("HOME_COMFORT");
    const [requestedServings, setRequestedServings] = useState(4);
    const [currentServings, setCurrentServings] = useState(4);
    const [searchResult, setSearchResult] = useState<MenuSearchResponse | null>(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [lastSearchParams, setLastSearchParams] = useState<{
        query: string;
        servings: number;
        cookMode: CookMode;
    } | null>(null);

    const normalizedQuery = normalizeSearchQuery(query);
    const isDuplicateSearch = !!lastSearchParams
        && normalizedQuery.length > 0
        && lastSearchParams.query === normalizedQuery
        && lastSearchParams.servings === requestedServings
        && lastSearchParams.cookMode === cookMode;

    useEffect(() => {
        const runHealthCheck = async () => {
            try {
                const response = await api.get("/menu/health");

                if (!response.data.available) {
                    navigate("/sorry", {
                        replace: true,
                        state: {
                            message: response.data.message,
                            retryAfterMinutes: response.data.retryAfterMinutes,
                        },
                    });
                }
            } catch {
                navigate("/sorry", {
                    replace: true,
                    state: {
                        message: "The application is currently not available. Please try again in the next 1 hour.",
                        retryAfterMinutes: 60,
                    },
                });
            }
        };

        runHealthCheck();
    }, [navigate]);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isDuplicateSearch) {
            setError("");
            setSuccess("You are already viewing this result. Change query, persons, or cook mode before searching again.");
            return;
        }

        try {
            setSearching(true);
            setError("");
            setSuccess("");

            const response = await api.post("/menu/search", {
                query,
                servings: requestedServings,
                cookMode,
            });

            const result = response.data as MenuSearchResponse;
            setSearchResult(result);
            setCurrentServings(result.menu.servings);
            setLastSearchParams({
                query: normalizedQuery,
                servings: requestedServings,
                cookMode,
            });

            const isSuccessfulResult = (result.source || "").toLowerCase() === "gemini";

            if (isSuccessfulResult) {
                try {
                    await api.post("/menu/history", {
                        searchQuery: query,
                        menu: result.menu,
                    });

                    setSuccess("Menu generated and saved to history automatically.");
                } catch {
                    setSuccess("Menu generated successfully.");
                }
            } else {
                setSuccess("Menu generated from fallback response. It was not saved to history.");
            }
        } catch (err: any) {
            if (err?.response?.status === 503) {
                navigate("/sorry", {
                    replace: true,
                    state: {
                        message: err?.response?.data?.message,
                        retryAfterMinutes: err?.response?.data?.retryAfterMinutes,
                    },
                });
                return;
            }

            setError(err?.response?.data?.message || "Unable to search for a menu right now");
        } finally {
            setSearching(false);
        }
    };

    const scaledMenu: MenuRecipe | null = searchResult ? {
        ...searchResult.menu,
        servings: currentServings,
        ingredients: scaleIngredients(
            searchResult.menu.ingredients,
            searchResult.menu.servings,
            currentServings
        ),
            nutritionFacts: {
                calories: roundQuantity((searchResult.menu.nutritionFacts.calories * currentServings) / Math.max(searchResult.menu.servings, 1)),
                proteinGrams: roundQuantity((searchResult.menu.nutritionFacts.proteinGrams * currentServings) / Math.max(searchResult.menu.servings, 1)),
                carbohydratesGrams: roundQuantity((searchResult.menu.nutritionFacts.carbohydratesGrams * currentServings) / Math.max(searchResult.menu.servings, 1)),
                fatGrams: roundQuantity((searchResult.menu.nutritionFacts.fatGrams * currentServings) / Math.max(searchResult.menu.servings, 1)),
            },
            costEstimation: {
                ...searchResult.menu.costEstimation,
                estimatedTotal: roundQuantity((searchResult.menu.costEstimation.estimatedTotal * currentServings) / Math.max(searchResult.menu.servings, 1)),
            },
    } : null;

    const handleFacebookShare = () => {
        if (!scaledMenu) {
            return;
        }

        const shareUrl = `${window.location.origin}/`;
        const quote = `${scaledMenu.menuName} for ${scaledMenu.servings} persons. ${scaledMenu.description}`;
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(quote)}`;

        window.open(facebookShareUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <>
            <div className="content-header k-page-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-lg-8">
                            <h1 className="m-0">Menu Search</h1>
                            <p className="k-page-subtitle mb-0">
                                Find a dish, generate ingredients, and scale it for your household.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <div className="row g-3 mb-3">
                        <div className="col-lg-8">
                            <div className="card h-100 k-feature-card k-search-card">
                                <div className="card-header k-card-header">
                                    <h3 className="card-title">Search a Dish or Menu</h3>
                                </div>

                                <div className="card-body">
                                    <div className="k-hero-intro mb-4">
                                        <span className="k-chip">Home Cooking</span>
                                        <span className="k-chip">Smart Portions</span>
                                        <span className="k-chip">Menu JSON</span>
                                    </div>

                                    <form onSubmit={handleSearch}>
                                        <div className="row g-3 align-items-end">
                                            <div className="col-md-8">
                                                <label className="form-label">What do you want to cook?</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Example: chicken adobo, sinigang, budget-friendly dinner"
                                                    value={query}
                                                    onChange={(e) => setQuery(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-2">
                                                <label className="form-label">Persons</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min={1}
                                                    value={requestedServings}
                                                    onChange={(e) => setRequestedServings(Math.max(1, Number(e.target.value) || 1))}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-2 d-grid">
                                                <button type="submit" className="btn btn-primary" disabled={searching || isDuplicateSearch}>
                                                    {searching ? "Searching..." : "Search"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="form-label mb-2">Cook Mode</label>
                                            <div className="k-cook-mode-scroll-hint">
                                                <div className="k-cook-mode-grid" role="radiogroup" aria-label="Cook Mode">
                                                    {COOK_MODE_OPTIONS.map((option) => (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            className={`k-cook-mode-option ${cookMode === option.id ? "is-active" : ""}`}
                                                            onClick={() => setCookMode(option.id)}
                                                            aria-pressed={cookMode === option.id}
                                                        >
                                                            <span className="k-cook-mode-icon"><i className={`bi ${option.icon}`}></i></span>
                                                            <span className="k-cook-mode-text">
                                                                <strong>{option.title}</strong>
                                                                <small>{option.subtitle}</small>
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="small-box h-100 mb-0 k-stat-card">
                                <div className="inner">
                                    <h3>{scaledMenu?.servings || requestedServings}</h3>
                                    <p>People to serve comfortably</p>
                                </div>
                                <div className="small-box-icon">
                                    <i className="bi bi-egg-fried"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    {searchResult && scaledMenu && (
                        <div className="row g-3">
                            <div className="col-lg-7">
                                <div className="card h-100 k-feature-card">
                                    <div className="card-header d-flex justify-content-between align-items-center k-card-header">
                                        <h3 className="card-title mb-0">Generated Menu</h3>
                                    </div>

                                    <div className="card-body">
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

                                        <div className="row g-3 align-items-end mb-3">
                                            <div className="col-sm-4">
                                                <label className="form-label">Scale for Persons</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min={1}
                                                    value={currentServings}
                                                    onChange={(e) => setCurrentServings(Math.max(1, Number(e.target.value) || 1))}
                                                />
                                            </div>

                                            <div className="col-sm-8 text-sm-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={handleFacebookShare}
                                                >
                                                    <i className="bi bi-facebook me-2"></i>
                                                    Share on Facebook
                                                </button>
                                            </div>
                                        </div>

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
                                        <ol className="ps-3 mb-0">
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
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-5">
                                <div className="card h-100 k-feature-card k-json-card">
                                    <div className="card-header k-card-header">
                                        <h3 className="card-title">Menu JSON</h3>
                                    </div>

                                    <div className="card-body">
                                        <p className="small text-muted">{searchResult.message}</p>
                                        <pre className="bg-body-tertiary border rounded p-3 small mb-0" style={{ whiteSpace: "pre-wrap" }}>
                                            {JSON.stringify(scaledMenu, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default Dashboard;