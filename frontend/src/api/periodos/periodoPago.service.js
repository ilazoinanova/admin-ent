import api from "../api";

export const getPaymentPeriods = (params = {}) =>
  api.get("/payment-periods", { params });

export const createPaymentPeriod = (data) =>
  api.post("/payment-periods", data);

export const updatePaymentPeriod = (id, data) =>
  api.put(`/payment-periods/${id}`, data);

export const togglePaymentPeriodActive = (id) =>
  api.post(`/payment-periods/${id}/toggle-active`);

export const deletePaymentPeriod = (id) =>
  api.delete(`/payment-periods/${id}`);

export const getAllPaymentPeriods = (params = {}) =>
  api.get("/payment-periods", { params: { per_page: 999, ...params } });
