import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Normalize FastAPI/Pydantic 422 validation errors (array of {loc,msg,...})
    // into a plain string, so setError(err.response.data.detail) in any form
    // never tries to render an object as a React child (React error #31).
    const d = err.response?.data?.detail;
    if (Array.isArray(d)) {
      const msg = d
        .map((e) => {
          const field = Array.isArray(e?.loc) ? e.loc.slice(-1).join(".") : "";
          return field ? `${field}: ${e.msg}` : (e.msg || JSON.stringify(e));
        })
        .join("; ");
      err.response.data.detail = msg || "Validation error";
    } else if (d && typeof d === "object") {
      err.response.data.detail = d.msg || JSON.stringify(d);
    }
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;
