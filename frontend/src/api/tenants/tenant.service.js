import api from "../api";

export const getTenants = (params) =>
  api.get("/tenants", { params });

export const getTenant = (id) =>
  api.get(`/tenants/${id}`);

export const createTenant = (data) =>
  api.post("/tenants", data);

export const updateTenant = (id, data) =>
  api.put(`/tenants/${id}`, data);

export const deleteTenant = (id) =>
  api.delete(`/tenants/${id}`);