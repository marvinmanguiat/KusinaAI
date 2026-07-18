import { Link, Outlet } from "react-router-dom";
import kusinaLogo from "../assets/kusina-logo.svg";

export default function AuthLayout() {
    return (
        <div className="auth-shell">
            <div className="auth-panel d-none d-lg-flex">
                <img src={kusinaLogo} alt="Kusina AI" className="k-auth-logo" />
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
                <div>
                    <Link to="/about-us" className="btn btn-light btn-sm rounded-pill px-3">
                        Learn More About Us
                    </Link>
                </div>
            </div>

            <div className="auth-card-wrap">
                <Outlet />
            </div>
        </div>
    );
}