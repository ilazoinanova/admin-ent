import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronRight, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getTenants } from "../../../api/tenants/tenant.service";
import { getTenantActiveServices, createInvoice } from "../../../api/invoices/invoice.service";
import { fmtDate } from "../../../utils/date";

const inputClass =
  "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

export default function InvoiceCreateModal({ onClose, onCreated }) {
  const { t } = useTranslation();

  const STEPS = [t("clientData"), t("serviceSelection"), t("reviewTotals")];

  const [step, setStep]             = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [tenants, setTenants]           = useState([]);
  const [tenantSearch, setTenantSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({
    tenant_id:  "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date:   "",
    tax_rate:   "19",
    currency:   "CLP",
    notes:      "",
  });

  const [assignments, setAssignments]           = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loadingServices, setLoadingServices]   = useState(false);

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (tenantSearch.length < 1) { setTenants([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await getTenants({ search: tenantSearch, page: 1 });
        setTenants(res.data.data ?? []);
        setShowDropdown(true);
      } catch { /* silent */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [tenantSearch]);

  const selectedTenant = form.tenant_id
    ? tenants.find((ten) => String(ten.id) === String(form.tenant_id)) ?? { id: form.tenant_id, name: tenantSearch }
    : null;

  const handleSelectTenant = (tenant) => {
    setForm({ ...form, tenant_id: tenant.id });
    setTenantSearch(tenant.name);
    setShowDropdown(false);
    setTenants([]);
  };

  const handleStep1Next = async () => {
    if (!form.tenant_id)  return toast.error(t("selectClientError"));
    if (!form.issue_date) return toast.error(t("selectIssueDateError"));

    setLoadingServices(true);
    try {
      const res = await getTenantActiveServices(form.tenant_id);
      const data = res.data ?? [];
      setAssignments(data);
      setSelectedServices([]);

      const clientCurrency = data[0]?.currency;
      if (clientCurrency) {
        setForm((prev) => ({ ...prev, currency: clientCurrency }));
      }
    } catch {
      toast.error(t("loadServicesError"));
    } finally {
      setLoadingServices(false);
    }
    setStep(2);
  };

  const toggleService = (assignment) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === assignment.id)
        ? prev.filter((s) => s.id !== assignment.id)
        : [...prev, assignment]
    );
  };

  const handleStep2Next = () => {
    if (selectedServices.length === 0) return toast.error(t("selectServiceError"));

    setItems(
      selectedServices.map((a) => ({
        tenant_service_id: a.id,
        service_id:        a.service_id,
        description:       a.service?.name ?? t("service"),
        quantity:          1,
        unit:              a.unit ?? "",
        unit_price:        Number(a.price ?? a.service?.price ?? 0),
      }))
    );
    setStep(3);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const addManualItem = () =>
    setItems((prev) => [
      ...prev,
      { tenant_service_id: null, service_id: null, description: "", quantity: 1, unit: "", unit_price: 0 },
    ]);

  const subtotal = items.reduce((acc, i) => acc + Number(i.quantity) * Number(i.unit_price), 0);
  const tax      = subtotal * (Number(form.tax_rate) / 100);
  const total    = subtotal + tax;
  const fmt = (n) => Number(n).toLocaleString("es-CL");

  const handleSubmit = async () => {
    if (items.length === 0) return toast.error(t("addItemError"));
    for (const item of items) {
      if (!item.description)          return toast.error(t("descriptionItemError"));
      if (Number(item.quantity) <= 0) return toast.error(t("quantityError"));
    }

    setSubmitting(true);
    try {
      await createInvoice({
        ...form,
        items: items.map((i) => ({
          ...i,
          quantity:   Number(i.quantity),
          unit_price: Number(i.unit_price),
        })),
      });
      toast.success(t("invoiceCreated"));
      onCreated();
    } catch {
      toast.error(t("invoiceCreateError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-xl shadow-lg flex flex-col max-h-[90vh] border dark:border-gray-700">

        {/* Header */}
        <div className="bg-[#0b1b3b] text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold">{t("newInvoice")}</h2>
            <p className="text-xs text-white/60 mt-0.5">
              {t("step")} {step} {t("of")} 3 — {STEPS[step - 1]}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b dark:border-gray-700 shrink-0">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition ${
                step === i + 1
                  ? "border-[#0b1b3b] text-[#0b1b3b] dark:border-blue-400 dark:text-blue-400"
                  : step > i + 1
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-400 dark:text-gray-500"
              }`}
            >
              <span className="mr-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold border border-current">
                {step > i + 1 ? "✓" : i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── PASO 1: Cliente y datos ── */}
          {step === 1 && (
            <>
              {/* Búsqueda de cliente — full width */}
              <div className="relative">
                <label className={labelClass}>{t("clientRequired")}</label>
                <input
                  placeholder={t("searchClientPh")}
                  value={tenantSearch}
                  onChange={(e) => {
                    setTenantSearch(e.target.value);
                    if (form.tenant_id) setForm({ ...form, tenant_id: "" });
                  }}
                  className={inputClass}
                />
                {showDropdown && tenants.length > 0 && (
                  <div className="absolute z-10 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md mt-1 shadow max-h-48 overflow-y-auto">
                    {tenants.map((ten) => (
                      <div
                        key={ten.id}
                        onMouseDown={() => handleSelectTenant(ten)}
                        className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-gray-200 flex items-center justify-between"
                      >
                        <span>{ten.name}</span>
                        <span className="text-gray-400 text-xs">{ten.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                {form.tenant_id && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{t("clientSelected")}</p>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("issueDateRequired")}</label>
                  <input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("dueDateField")}</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputClass} />
                </div>
              </div>

              {/* Notas — full width */}
              <div>
                <label className={labelClass}>{t("notesOptional")}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className={inputClass}
                  placeholder={t("invoiceNotesPh")}
                />
              </div>
            </>
          )}

          {/* ── PASO 2: Selección de servicios ── */}
          {step === 2 && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("activeServicesOf")} <strong>{selectedTenant?.name ?? tenantSearch}</strong>.{" "}
                {t("selectServicesHint")}
              </p>

              {loadingServices ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm border border-dashed dark:border-gray-600 rounded-lg">
                  {t("noActiveServicesAssigned")}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {assignments.map((a) => {
                    const isSelected = selectedServices.some((s) => s.id === a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => toggleService(a)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-lg border cursor-pointer transition ${
                          isSelected
                            ? "border-[#0b1b3b] bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400"
                        }`}
                      >
                        <input type="checkbox" readOnly checked={isSelected} className="pointer-events-none accent-[#0b1b3b] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{a.service?.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {a.license_modalidad === "tiered_fixed" || a.license_modalidad === "tiered_escalating"
                              ? a.license_modalidad === "tiered_fixed" ? t("tieredFixed") : t("tieredEscalating")
                              : t("fixedShort")} · {a.currency} · {a.billing_cycle}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">
                          ${Number(a.price ?? 0).toLocaleString("es-CL")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedServices.length > 0 && (
                <p className="text-xs text-blue-600 font-semibold">
                  {selectedServices.length} {t("servicesSelected")}
                </p>
              )}
            </>
          )}

          {/* ── PASO 3: Revisión y totales ── */}
          {step === 3 && (
            <div className="grid grid-cols-[1fr_280px] gap-6">

              {/* Tabla de ítems */}
              <div>
                <div className="grid grid-cols-[1fr_90px_130px_110px_36px] gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-1 mb-2">
                  <span>{t("descriptionLabel")}</span>
                  <span>{t("quantity")}</span>
                  <span>{t("unitPrice")}</span>
                  <span className="text-right">{t("total")}</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_90px_130px_110px_36px] gap-2 items-center">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                        className={inputClass}
                        placeholder={t("itemDescriptionPh")}
                        disabled={submitting}
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        className={inputClass}
                        min="0.01"
                        disabled={submitting}
                      />
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(i, "unit_price", e.target.value)}
                        className={inputClass}
                        min="0"
                        disabled={submitting}
                      />
                      <span className="text-sm text-right font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                        ${fmt(Number(item.quantity) * Number(item.unit_price))}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        disabled={submitting}
                        className="text-red-400 hover:text-red-600 disabled:opacity-50 flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addManualItem}
                  disabled={submitting}
                  className="flex items-center gap-1 text-sm text-blue-600 mt-3 font-medium hover:underline disabled:opacity-50"
                >
                  <Plus size={14} /> {t("addManualItem")}
                </button>
              </div>

              {/* Panel de totales */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border dark:border-gray-600 space-y-3 self-start sticky top-0">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("reviewTotals")}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t("subtotal")}</span>
                    <span className="font-medium tabular-nums">${fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>IVA ({form.tax_rate}%)</span>
                    <span className="font-medium tabular-nums">${fmt(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 text-base border-t dark:border-gray-600 pt-2 mt-1">
                    <span>{t("total")} {form.currency}</span>
                    <span className="tabular-nums">${fmt(total)}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-gray-400 dark:text-gray-500 space-y-1 border-t dark:border-gray-600">
                  <div className="flex justify-between">
                    <span>{t("client")}</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300 truncate max-w-[130px]">{tenantSearch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("issueDate")}</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300">{fmtDate(form.issue_date)}</span>
                  </div>
                  {form.due_date && (
                    <div className="flex justify-between">
                      <span>{t("dueDate")}</span>
                      <span className="font-medium text-gray-600 dark:text-gray-300">{fmtDate(form.due_date)}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-700 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-gray-800/80 rounded-b-xl">
          <button
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            disabled={submitting}
            className="flex items-center gap-1.5 text-sm border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {step === 1 ? t("cancel") : <><ChevronLeft size={14} /> {t("back")}</>}
          </button>

          <button
            onClick={step === 1 ? handleStep1Next : step === 2 ? handleStep2Next : handleSubmit}
            disabled={submitting || loadingServices}
            className="flex items-center gap-1.5 bg-[#0b1b3b] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {submitting
              ? t("saving")
              : step === 3
              ? t("createInvoiceButton")
              : <>{t("next")} <ChevronRight size={14} /></>}
          </button>
        </div>

      </div>
    </div>
  );
}
