import api from "../api";

export const getPayables = (params) =>
  api.get("/payables", { params });

export const createPayable = (data) =>
  api.post("/payables", data);

export const updatePayable = (id, data) =>
  api.put(`/payables/${id}`, data);

export const deletePayable = (id) =>
  api.delete(`/payables/${id}`);

export const getAllPayments = (params) =>
  api.get("/payable-payments", { params });

export const getPayablePayments = (payableId) =>
  api.get(`/payables/${payableId}/payments`);

export const createPayablePayment = (payableId, data) => {
  if (data instanceof FormData) {
    return api.post(`/payables/${payableId}/payments`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post(`/payables/${payableId}/payments`, data);
};

export const updatePayablePayment = (id, data) => {
  if (data instanceof FormData) {
    // Laravel requiere _method=PUT para multipart
    data.append("_method", "PUT");
    return api.post(`/payable-payments/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.put(`/payable-payments/${id}`, data);
};

export const getPaymentComprobante = (id, download = false) =>
  api.get(`/payable-payments/${id}/comprobante`, {
    responseType: "blob",
    params: download ? { download: 1 } : {},
  });
