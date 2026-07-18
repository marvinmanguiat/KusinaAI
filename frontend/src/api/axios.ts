import axios from "axios";
import AuthService from "../auth/AuthService";

const api = axios.create({
    baseURL: "https://kusinaai-production.up.railway.app/api",
});

api.interceptors.request.use(config => {

    const token = AuthService.getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;