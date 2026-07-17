import { useEffect, useState } from "react";
import api from "../api/axios";

const USERS_PAGE_SIZE = 8;

type UserStatus = "Active" | "Inactive" | "Pending";

interface UserRecord {
    id: number;
    name: string;
    email: string;
    mobilePhone: string | null;
    role: string;
    status: UserStatus;
    avatarUrl: string | null;
}

const createAvatar = (initials: string, backgroundColor: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${backgroundColor}" /><text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#ffffff">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const statusBadgeClass: Record<UserStatus, string> = {
    Active: "text-bg-success",
    Inactive: "text-bg-secondary",
    Pending: "text-bg-warning",
};

const Users = () => {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pendingUserId, setPendingUserId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/users");
                setUsers(response.data as UserRecord[]);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Unable to load users");
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, []);

    const totalPages = Math.max(1, Math.ceil(users.length / USERS_PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart = (safePage - 1) * USERS_PAGE_SIZE;
    const pagedUsers = users.slice(pageStart, pageStart + USERS_PAGE_SIZE);

    useEffect(() => {
        if (currentPage !== safePage) {
            setCurrentPage(safePage);
        }
    }, [currentPage, safePage]);

    const toggleUserStatus = async (user: UserRecord) => {
        const nextStatus = user.status === "Active" ? "Inactive" : "Active";

        try {
            setPendingUserId(user.id);
            setError("");

            const response = await api.patch(`/users/${user.id}/status`, {
                status: nextStatus,
            });

            const updatedUser = response.data as UserRecord;

            setUsers((currentUsers) => currentUsers.map((item) => (
                item.id === updatedUser.id ? updatedUser : item
            )));
        } catch (err: any) {
            setError(err?.response?.data?.message || "Unable to update user status");
        } finally {
            setPendingUserId(null);
        }
    };

    const promoteToAdmin = async (user: UserRecord) => {
        try {
            setPendingUserId(user.id);
            setError("");

            const response = await api.post(`/users/${user.id}/promote-admin`);
            const updatedUser = response.data as UserRecord;

            setUsers((currentUsers) => currentUsers.map((item) => (
                item.id === updatedUser.id ? updatedUser : item
            )));
        } catch (err: any) {
            setError(err?.response?.data?.message || "Unable to promote user to admin");
        } finally {
            setPendingUserId(null);
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">

                    <div className="row mb-2">

                        <div className="col-sm-6">
                            <h1>Users</h1>
                        </div>

                        <div className="col-sm-6 text-end"></div>

                    </div>

                </div>
            </div>

            <section className="content">

                <div className="container-fluid">

                    <div className="card">

                        <div className="card-header">
                            <h3 className="card-title">
                                User List
                            </h3>
                        </div>

                        <div className="card-body">
                            {error && <div className="alert alert-danger">{error}</div>}

                            {loading ? (
                                <div className="alert alert-info mb-0">Loading users...</div>
                            ) : (

                            <table className="table table-bordered table-hover">

                                <thead>

                                    <tr>
                                        <th>Profile</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Mobile Phone</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th style={{ width: 260 }}>
                                            Action
                                        </th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {pagedUsers.map(user => (

                                        <tr key={user.id}>

                                            <td>
                                                <img
                                                    src={user.avatarUrl || createAvatar(user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), "#6c757d")}
                                                    alt={`${user.name} profile`}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-circle border"
                                                />
                                            </td>

                                            <td>{user.name}</td>

                                            <td>{user.email}</td>

                                            <td>{user.mobilePhone || "-"}</td>

                                            <td>{user.role}</td>

                                            <td>
                                                <span className={`badge ${statusBadgeClass[user.status]}`}>
                                                    {user.status}
                                                </span>
                                            </td>

                                            <td>

                                                <button className="btn btn-sm btn-warning me-2">
                                                    <i className="bi bi-pencil"></i>
                                                </button>

                                                <button
                                                    className={`btn btn-sm ${user.status === "Active" ? "btn-danger" : "btn-success"}`}
                                                    onClick={() => toggleUserStatus(user)}
                                                    disabled={pendingUserId === user.id}
                                                >
                                                    {pendingUserId === user.id
                                                        ? "Updating..."
                                                        : user.status === "Active"
                                                            ? "Disable"
                                                            : "Enable"}
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-primary ms-2"
                                                    onClick={() => promoteToAdmin(user)}
                                                    disabled={pendingUserId === user.id || user.role === "Administrator"}
                                                >
                                                    {pendingUserId === user.id
                                                        ? "Updating..."
                                                        : user.role === "Administrator"
                                                            ? "Admin"
                                                            : "Make Admin"}
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>
                            )}

                            {!loading && users.length > 0 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <small className="text-muted">
                                        Page {safePage} of {totalPages}
                                    </small>

                                    <div className="btn-group btn-group-sm" role="group" aria-label="Users pagination">
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
                            )}

                        </div>

                    </div>

                </div>

            </section>
        </>
    );
};

export default Users;