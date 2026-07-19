import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="auth-shell">
            <div className="auth-panel d-none d-lg-flex">
                <span className="auth-kicker">Kusina AI</span>

                <h1>Cook from cravings, not guesswork.</h1>

                <p>
                    Search a dish, get structured ingredients, scale it for the whole household,
                    and keep your favorite menu ideas ready in history.
                </p>

                <div className="auth-panel-tags">
                    <span>Dish Discovery</span>
                    <span>Ingredient Scaling</span>
                    <span>Menu History</span>
                </div>

                <div className="d-flex flex-column gap-2">
                    <Link
                        to="/about-us"
                        className="btn btn-light btn-sm rounded-pill px-3"
                    >
                        Learn More About Us
                    </Link>

                    <a
                        href="/assets/kusina-ai.apk"
                        className="btn btn-success btn-sm rounded-pill px-3"
                        download
                    >
                        <i className="fab fa-android me-2"></i>
                        Download Android APK
                    </a>
                </div>
            </div>

            <div className="auth-card-wrap">
                <Outlet />
            </div>
        </div>
    );
}