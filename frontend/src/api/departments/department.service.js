import api from "../api";

export const getDepartments = (tenantId) =>
  api.get(`/tenants/${tenantId}/departments`);

export const createDepartment = (tenantId, data) =>
  api.post(`/tenants/${tenantId}/departments`, data);

export const updateDepartment = (tenantId, id, data) =>
  api.put(`/tenants/${tenantId}/departments/${id}`, data);

export const deleteDepartment = (tenantId, id) =>
  api.delete(`/tenants/${tenantId}/departments/${id}`);
