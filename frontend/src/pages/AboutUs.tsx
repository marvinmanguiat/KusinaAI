import AuthService from "../auth/AuthService";

const AboutUs = () => {
    const currentUser = AuthService.getCurrentUser();
    const authorName = currentUser?.fullName || "Marvin";
    const authorEmail = "marvin.manguiat.u@gmail.com";
    const authorTelephone = "0437734772";

    return (
        <>
            <div className="content-header k-page-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-lg-10">
                            <h1 className="m-0">About Us</h1>
                            <p className="k-page-subtitle mb-0">
                                Kusina AI helps households discover dishes, generate structured recipes,
                                and scale ingredients based on the number of people to serve.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="row g-3">
                        <div className="col-xl-6">
                            <div className="card k-feature-card k-about-hero h-100">
                                <div className="card-body d-flex flex-column">
                                    <span className="k-about-kicker">Household Menu Assistant</span>
                                    <h3 className="card-title mt-2">Cook with confidence every day</h3>

                                    <p className="mb-3">
                                        Kusina AI is designed for real homes and real schedules. From cravings to a
                                        ready-to-cook recipe, it helps you make faster decisions with practical,
                                        scaled ingredients and clear preparation steps.
                                    </p>

                                    <div className="k-about-highlights mb-3">
                                        <span>Smart Dish Discovery</span>
                                        <span>Scalable Ingredients</span>
                                        <span>Nutrition + Cost Insight</span>
                                        <span>Saved Menu History</span>
                                    </div>

                                    <p className="small k-about-muted mb-0">
                                        Built for households that want less guesswork and more delicious meals.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-6">
                            <div className="row g-3">
                                <div className="col-12">
                                    <div className="card k-feature-card k-about-panel">
                                        <div className="card-header k-card-header">
                                            <h3 className="card-title">What Kusina AI Does</h3>
                                        </div>

                                        <div className="card-body">
                                            <ul className="mb-0 k-about-list">
                                                <li>Search for a specific menu or dish using Google Gemini.</li>
                                                <li>Return recipe output in JSON format for consistency and portability.</li>
                                                <li>Show menu name, ingredients, and step-by-step instructions.</li>
                                                <li>Scale ingredient quantities based on the number of persons.</li>
                                                <li>Save successful searches in Menu History for quick reuse.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="card k-feature-card k-about-panel h-100">
                                        <div className="card-header k-card-header">
                                            <h3 className="card-title">About the Author</h3>
                                        </div>

                                        <div className="card-body">
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div
                                                    className="rounded-circle d-flex justify-content-center align-items-center"
                                                    style={{ width: 56, height: 56, background: "rgba(217,106,49,0.18)", color: "#a94922", fontWeight: 700 }}
                                                >
                                                    {authorName
                                                        .split(" ")
                                                        .map((word) => word[0])
                                                        .join("")
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <h4 className="h6 mb-1">{authorName}</h4>
                                                    <p className="k-about-muted mb-1">Official Email: {authorEmail}</p>
                                                    <p className="k-about-muted mb-0">Telephone: {authorTelephone}</p>
                                                </div>
                                            </div>

                                            <p className="mb-0">
                                                Built and maintained by <strong>{authorName}</strong>. The goal is to make
                                                everyday meal planning easier for families by combining AI-powered menu
                                                discovery with practical household scaling and saved history.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default AboutUs;