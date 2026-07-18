export interface AuthUser {
    id?: number;
    username: string;
    email: string;
    fullName: string;
    displayName: string;
    mobilePhone?: string | null;
    avatarUrl?: string | null;
    roles?: string;
    status?: string;
    passwordChangeRequired?: boolean;
}

class AuthService {
    private TOKEN_KEY = "access_token";
    private USER_KEY = "auth_user";

    login(token: string, user?: Partial<AuthUser> | string) {
        localStorage.setItem(this.TOKEN_KEY, token);

        const normalizedUser = this.normalizeUser(user, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
    }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getCurrentUser(): AuthUser | null {
        const storedUser = localStorage.getItem(this.USER_KEY);

        if (storedUser) {
            try {
                return JSON.parse(storedUser) as AuthUser;
            } catch {
                localStorage.removeItem(this.USER_KEY);
            }
        }

        const token = this.getToken();

        if (!token) {
            return null;
        }

        const username = this.extractUsernameFromToken(token);

        if (!username) {
            return null;
        }

        const user = {
            username,
            email: username,
            fullName: this.formatDisplayName(username),
            displayName: this.formatDisplayName(username),
        };

        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        return user;
    }

    updateCurrentUser(user: Partial<AuthUser>) {
        const currentUser = this.getCurrentUser();
        const token = this.getToken();

        if (!token) {
            return;
        }

        const mergedUser = this.normalizeUser({
            ...currentUser,
            ...user,
        }, token);

        localStorage.setItem(this.USER_KEY, JSON.stringify(mergedUser));
    }

    isAuthenticated(): boolean {
      return this.getToken() !== null;

      //return true; // For testing purposes, always return true
    }

    hasRole(role: string): boolean {
        const roles = this.getCurrentUser()?.roles;

        if (!roles) {
            return false;
        }

        return roles.split(",").map((value) => value.trim()).includes(role);
    }

    private extractUsernameFromToken(token: string): string | null {
        const parts = token.split(".");

        if (parts.length < 2) {
            return null;
        }

        try {
            const payload = JSON.parse(this.decodeBase64Url(parts[1]));
            return typeof payload.sub === "string" ? payload.sub : null;
        } catch {
            return null;
        }
    }

    private decodeBase64Url(value: string): string {
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
        return atob(padded);
    }

    private formatDisplayName(value: string): string {
        const source = value.includes("@") ? value.split("@")[0] : value;
        const words = source
            .split(/[._-]+/)
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

        if (words.length === 0) {
            return "User";
        }

        return words.join(" ");
    }

    private normalizeUser(user: Partial<AuthUser> | string | undefined, token: string): AuthUser {
        const tokenUsername = this.extractUsernameFromToken(token) || "user@example.com";

        if (typeof user === "string") {
            const username = user.trim() || tokenUsername;

            return {
                username,
                email: username,
                fullName: this.formatDisplayName(username),
                displayName: this.formatDisplayName(username),
            };
        }

        const email = user?.email?.trim() || user?.username?.trim() || tokenUsername;
        const fullName = user?.fullName?.trim() || user?.displayName?.trim() || this.formatDisplayName(email);

        return {
            id: user?.id,
            username: user?.username?.trim() || email,
            email,
            fullName,
            displayName: fullName,
            mobilePhone: user?.mobilePhone ?? null,
            avatarUrl: user?.avatarUrl ?? null,
            roles: user?.roles,
            status: user?.status,
            passwordChangeRequired: user?.passwordChangeRequired,
        };
    }
}

export default new AuthService();