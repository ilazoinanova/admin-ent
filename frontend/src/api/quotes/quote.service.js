import api from "../api";

export const getQuotes = (params) =>
  api.get("/quotes", { params });

export const getQuote = (id) =>
  api.get(`/quotes/${id}`);

export const createQuote = (data) =>
  api.post("/quotes", data);

export const updateQuote = (id, data) =>
  api.put(`/quotes/${id}`, data);

export const deleteQuote = (id) =>
  api.delete(`/quotes/${id}`);

export const getTenantActiveServicesForQuote = (tenantId) =>
  api.get(`/quotes-tenant-services/${tenantId}`);
