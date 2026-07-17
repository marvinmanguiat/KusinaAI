import { useEffect, useState } from "react";
import api from "../api/axios";
import AuthService, { type AuthUser } from "../auth/AuthService";

const MAX_AVATAR_DIMENSION = 256;
const AVATAR_OUTPUT_QUALITY = 0.82;

const Profile = () => {
    const [profile, setProfile] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [error, setError] = useState("");
    const [fullName, setFullName] = useState("");
    const [mobilePhone, setMobilePhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const response = await api.get("/auth/me");
                const user = response.data as AuthUser;
                setProfile(user);
                setFullName(user.fullName || "");
                setMobilePhone(user.mobilePhone || "");
                setAvatarUrl(user.avatarUrl || "");
                AuthService.updateCurrentUser(user);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Unable to load profile");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please upload a valid image file");
            return;
        }

        setError("");
        setProfileMessage("");

        const reader = new FileReader();
        reader.onload = async () => {
            if (typeof reader.result === "string") {
                try {
                    const optimizedAvatar = await resizeImage(reader.result);
                    setAvatarUrl(optimizedAvatar);
                } catch {
                    setError("Unable to process the selected image");
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setSavingProfile(true);
            setError("");
            setProfileMessage("");

            const response = await api.put("/auth/me", {
                fullName,
                mobilePhone,
                avatarUrl,
            });

            const updatedProfile = response.data as AuthUser;
            setProfile(updatedProfile);
            AuthService.updateCurrentUser(updatedProfile);
            setProfileMessage("Profile updated successfully");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Unable to update profile");
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match");
            return;
        }

        try {
            setSavingPassword(true);
            setError("");
            setPasswordMessage("");

            await api.post("/auth/me/change-password", {
                currentPassword,
                newPassword,
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMessage("Password updated successfully");
            if (profile) {
                const updated = { ...profile, passwordChangeRequired: false };
                setProfile(updated);
                AuthService.updateCurrentUser(updated);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Unable to update password");
        } finally {
            setSavingPassword(false);
        }
    };

    const avatarPreview = avatarUrl || profile?.avatarUrl || "https://placehold.co/120x120?text=Avatar";

    if (loading) {
        return <div className="alert alert-info">Loading profile...</div>;
    }

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Profile</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    {error && <div className="alert alert-danger">{error}</div>}

                    {profile?.passwordChangeRequired && (
                        <div className="alert alert-warning">
                            You signed in with a temporary password. Change it now to secure your account.
                        </div>
                    )}

                    <div className="row">
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-body text-center">
                                    <img
                                        src={avatarPreview}
                                        alt="Profile avatar"
                                        className="rounded-circle border mb-3"
                                        width={120}
                                        height={120}
                                        style={{ objectFit: "cover" }}
                                    />

                                    <h3 className="card-title d-block mb-1">{profile?.fullName}</h3>
                                    <p className="text-muted mb-2">{profile?.email}</p>
                                    <span className="badge text-bg-success">{profile?.status || "Active"}</span>

                                    <div className="mt-3 text-start">
                                        <label className="form-label">Upload Avatar</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                        />
                                    </div>

                                    <div className="mt-3 text-start">
                                        <label className="form-label">Avatar URL</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-8">
                            <div className="card mb-3">
                                <div className="card-header">
                                    <h3 className="card-title">Personal Information</h3>
                                </div>

                                <div className="card-body">
                                    {profileMessage && <div className="alert alert-success">{profileMessage}</div>}

                                    <form onSubmit={handleProfileSave}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Full Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={profile?.email || ""}
                                                    disabled
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Mobile Phone</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    value={mobilePhone}
                                                    onChange={(e) => setMobilePhone(e.target.value)}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Role</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={profile?.roles || "ROLE_USER"}
                                                    disabled
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                                                {savingProfile ? "Saving profile..." : "Save profile"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Change Password</h3>
                                </div>

                                <div className="card-body">
                                    {passwordMessage && <div className="alert alert-success">{passwordMessage}</div>}

                                    <form onSubmit={handlePasswordSave}>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label">Current Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label">New Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    minLength={8}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    minLength={8}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <button type="submit" className="btn btn-outline-primary" disabled={savingPassword}>
                                                {savingPassword ? "Updating password..." : "Change password"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Profile;

async function resizeImage(source: string): Promise<string> {
    const image = await loadImage(source);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Canvas is not supported");
    }

    const scale = Math.min(MAX_AVATAR_DIMENSION / image.width, MAX_AVATAR_DIMENSION / image.height, 1);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", AVATAR_OUTPUT_QUALITY);
}

function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Image load failed"));
        image.src = source;
    });
}