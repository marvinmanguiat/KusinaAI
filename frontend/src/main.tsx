import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

// CSS
import "admin-lte/dist/css/adminlte.min.css"
// Plus Bootstrap and dependency CSS
import "bootstrap-icons/font/bootstrap-icons.css"
import "overlayscrollbars/styles/overlayscrollbars.css"

// fonts
import "@fortawesome/fontawesome-free/css/all.min.css"
import "bootstrap-icons/font/bootstrap-icons.css";

// JS
import "bootstrap"
import "admin-lte"
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);