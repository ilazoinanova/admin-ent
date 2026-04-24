import api from "../api";

export const getPayables = (params) =>
  api.get("/payables", { params });

export const createPayable = (data) =>
  api.post("/payables", data);

export const updatePayable = (id, data) =>
  api.put(`/payables/${id}`, data);

export const deletePayable = (id) =>
  api.delete(`/payables/${id}`);

export const getPayablePayments = (payableId) =>
  api.get(`/payables/${payableId}/payments`);

export const createPayablePayment = (payableId, data) =>
  api.post(`/payables/${payableId}/payments`, data);

export const updatePayablePayment = (id, data) =>
  api.put(`/payable-payments/${id}`, data);
