import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Privacy from "./pages/Privacy";

import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";

import PublicRoute from "./auth/PublicRoute";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import MenuHistory from "./pages/MenuHistory";
import ServiceUnavailable from "./pages/ServiceUnavailable";
import AboutUs from "./pages/AboutUs";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import OAuthCallback from "./pages/OAuthCallback";

function App() {
    return (
       <>
        <BrowserRouter>
            <Routes>

                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Public About page */}
  {/* Completely Public Pages */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />


                {/* Public Routes */}
                <Route element={<PublicRoute />}>
                    <Route element={<AuthLayout />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                       
                    </Route>
                </Route>


                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/about" element={<AboutUs />} />
                        <Route path="/sorry" element={<ServiceUnavailable />} />
                        <Route path="/menu-history" element={<MenuHistory />} />
                        <Route path="/profile" element={<Profile/>} />
                    </Route>
                </Route>

                <Route element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/users" element={<Users />} />
                    </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<h1>404 - Page Not Found</h1>} />

            </Routes>
        </BrowserRouter>
        </>
    );
}

export default App;