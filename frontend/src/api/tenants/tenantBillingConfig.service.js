import api from "../api";

export const getBillingConfig = (tenantId) =>
  api.get(`/tenants/${tenantId}/billing-config`);

export const saveBillingConfig = (tenantId, data) =>
  api.put(`/tenants/${tenantId}/billing-config`, data);
