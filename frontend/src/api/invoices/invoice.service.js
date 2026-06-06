import api from "../api";

export const getInvoices = (params) =>
  api.get("/invoices", { params });

export const getInvoice = (id) =>
  api.get(`/invoices/${id}`);

export const createInvoice = (data) =>
  api.post("/invoices", data);

export const updateInvoice = (id, data) =>
  api.put(`/invoices/${id}`, data);

export const deleteInvoice = (id) =>
  api.delete(`/invoices/${id}`);

export const getTenantActiveServices = (tenantId) =>
  api.get(`/invoices-tenant-services/${tenantId}`);

export const getLicenseBillingPreview = (params) =>
  api.get("/billing/license-preview", { params });

export const getIntegrationBillingPreview = (params) =>
  api.get("/billing/integration-preview", { params });

export const getIntegrationDocuments = (params) =>
  api.get("/billing/integration-documents", { params });

export const getTenantsWithInvoices = () =>
  api.get("/invoices/tenants-with-invoices");

export const getInvoiceBillingPeriods = (tenantId = null) =>
  api.get("/invoices/billing-periods", { params: tenantId ? { tenant_id: tenantId } : {} });

export const sendInvoiceToClient = (id, formData) =>
  api.post(`/invoices/${id}/send-to-client`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const uploadFiscalPdf = (id, file) => {
  const form = new FormData();
  form.append("fiscal_pdf", file);
  return api.post(`/invoices/${id}/upload-fiscal`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
