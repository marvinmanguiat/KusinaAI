import { Link, useLocation } from "react-router-dom";

interface UnavailableState {
    message?: string;
    retryAfterMinutes?: number;
}

const ServiceUnavailable = () => {
    const location = useLocation();
    const state = (location.state || {}) as UnavailableState;

    const retryAfterMinutes = state.retryAfterMinutes || 60;
    const message = state.message
        || "The application is currently not available. Please try again in the next 1 hour.";

    return (
        <>
            <div className="content-header k-page-header">
                <div className="container-fluid">
                    <h1 className="m-0">Sorry</h1>
                    <p className="k-page-subtitle mb-0">Kusina AI is temporarily unavailable.</p>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card k-feature-card">
                        <div className="card-body p-4">
                            <div className="alert alert-warning mb-4">
                                <strong>{message}</strong>
                            </div>

                            <p className="mb-2">
                                Google Gemini quota/rate limit was exceeded.
                            </p>
                            <p className="mb-4">
                                Please try again after approximately <strong>{retryAfterMinutes}</strong> minute(s).
                            </p>

                            <div className="d-flex gap-2 flex-wrap">
                                <Link to="/dashboard" className="btn btn-primary">
                                    Try Again Later
                                </Link>

                                <Link to="/menu-history" className="btn btn-outline-primary">
                                    Open Menu History
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ServiceUnavailable;