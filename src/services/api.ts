import axios from 'axios';
import { keycloak} from "./keycloak.ts";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    if (keycloak.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response.status === 401) {
            try {
                await keycloak.updateToken(30);
                // error.config.headers.Authorization = `Bearer ${keycloak.token}`;
            } catch (e) {
                keycloak.login();
            }
        }
        return Promise.reject(error);
    }
)

export default api;