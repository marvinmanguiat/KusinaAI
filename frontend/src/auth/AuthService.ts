class AuthService {
    private TOKEN_KEY = "access_token";

    login(token: string) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
      return this.getToken() !== null;

      //return true; // For testing purposes, always return true
    }
}

export default new AuthService();