import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f4f6f9"
            }}
        >
            <div
                style={{
                    width: 420
                }}
            >
                <Outlet />
            </div>
        </div>
    );
}