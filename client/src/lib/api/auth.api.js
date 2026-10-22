import { api, unwrap } from "./axios"

const noRefresh = { skipAuthRefresh: true }

export const authApi = {
  registrationStatus: () => api.get("/auth/registration-status", noRefresh).then(unwrap),
  previewInvitation: (token) => api.get(`/auth/invitations/${encodeURIComponent(token)}`, noRefresh).then(unwrap),
  register: (body) => api.post("/auth/register", body, noRefresh).then(unwrap),
  login: (body) => api.post("/auth/login", body, noRefresh).then(unwrap),
  logout: () => api.post("/auth/logout", null, noRefresh).then(unwrap),
  me: () => api.get("/auth/me").then(unwrap),
  changePassword: (body) => api.post("/auth/change-password", body).then(unwrap),
  updateProfile: (body) => api.patch("/users/me", body).then(unwrap),
}
