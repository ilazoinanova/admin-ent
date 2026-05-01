import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronRight, ChevronLeft, Plus, Trash2, Building2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getTenants } from "../../../api/tenants/tenant.service";
import { getTenantActiveServicesForQuote, createQuote } from "../../../api/quotes/quote.service";
import { fmtDate } from "../../../utils/date";
import { getStoredMode } from "../../../utils/assignmentMode";
import QuotePreview from "./QuotePreview";

const inputClass =
  "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60 disabled:cursor-not-allowed";

const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

export default function QuoteCreateModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const STEPS = [t("clientData"), t("serviceSelection"), t("reviewTotals"), t("quotePreviewStep")];

  const [step, setStep]           = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [tenants, setTenants]                   = useState([]);
  const [tenantSearch, setTenantSearch]         = useState("");
  const [showDropdown, setShowDropdown]         = useState(false);
  const [selectedTenantObj, setSelectedTenantObj] = useState(null);
  const justSelected = useRef(false);

  const [form, setForm] = useState({
    tenant_id:    "",
    department_id: null,
    issue_date:   new Date().toISOString().slice(0, 10),
    expiry_date:  "",
    currency:     "CLP",
    notes:        "",
  });

  const [allAssignments,     setAllAssignments]     = useState([]);
  const [invoiceDepartments, setInvoiceDepartments] = useState([]);
  const [hasDeptAssignments, setHasDeptAssignments] = useState(false);
  const [loadingDeptInfo,    setLoadingDeptInfo]    = useState(false);

  const [selectedServices, setSelectedServices] = useState([]);
  const [othersSelected,   setOthersSelected]   = useState(false);
  const [items, setItems] = useState([]);

  /* ── Debounce búsqueda de tenants ── */
  useEffect(() => {
    if (justSelected.current) { justSelected.current = false; return; }
    if (tenantSearch.length < 1) { setTenants([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await getTenants({ search: tenantSearch, page: 1 });
        setTenants(res.data.data ?? []);
        setShowDropdown(true);
      } catch { /* silent */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [tenantSearch]);

  /* ── Carga servicios + moneda del tenant ── */
  useEffect(() => {
    if (!form.tenant_id) return;
    let cancelled = false;
    setLoadingDeptInfo(true);
    (async () => {
      try {
        const res  = await getTenantActiveServicesForQuote(form.tenant_id);
        const data = res.data ?? {};
        if (cancelled) return;
        const assignments = Array.isArray(data.assignments) ? data.assignments : [];
        const departments = data.departments ?? [];
        const apiHasDept  = data.has_department_assignments ?? false;
        const stored      = departments.length > 0 ? getStoredMode(form.tenant_id) : null;
        const hasDept     = stored ? stored.mode === "department" : apiHasDept && departments.length > 0;
        const currency    = data.currency ?? "CLP";

        setAllAssignments(assignments);
        setInvoiceDepartments(departments);
        setHasDeptAssignments(hasDept);

        if (hasDept && departments.length > 0) {
          const preferredId = stored?.deptId ? departments.find((d) => d.id === stored.deptId)?.id : null;
          setForm((prev) => ({ ...prev, department_id: preferredId ?? departments[0].id, currency }));
        } else {
          setForm((prev) => ({ ...prev, currency }));
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoadingDeptInfo(false); }
    })();
    return () => { cancelled = true; };
  }, [form.tenant_id]);

  const handleSelectTenant = (tenant) => {
    justSelected.current = true;
    setForm((prev) => ({ ...prev, tenant_id: tenant.id, department_id: null }));
    setTenantSearch(tenant.name);
    setSelectedTenantObj(tenant);
    setShowDropdown(false);
    setTenants([]);
    setAllAssignments([]); setInvoiceDepartments([]); setHasDeptAssignments(false);
    setSelectedServices([]); setOthersSelected(false);
  };

  const getScopeAssignments = () => {
    if (!hasDeptAssignments) return allAssignments.filter((a) => (a.department_id ?? null) === null);
    return allAssignments.filter((a) => (a.department_id ?? null) === form.department_id);
  };

  /* ── Pasos ── */
  const handleStep1Next = () => {
    if (!form.tenant_id)  return toast.error(t("selectClientError"));
    if (!form.issue_date) return toast.error(t("selectIssueDateError"));
    if (hasDeptAssignments && !form.department_id) return toast.error(t("selectDeptError"));
    setSelectedServices([]); setStep(2);
  };

  const toggleService = (a) =>
    setSelectedServices((prev) =>
      prev.some((s) => s.id === a.id) ? prev.filter((s) => s.id !== a.id) : [...prev, a]
    );

  const handleStep2Next = () => {
    if (selectedServices.length === 0 && !othersSelected) return toast.error(t("selectServiceError"));
    const serviceItems = selectedServices.map((a) => ({
      tenant_service_id: a.id,
      service_id:        a.service_id,
      description:       a.service?.name ?? t("service"),
      quantity:          1,
      unit:              a.unit ?? "",
      unit_price:        Number(a.price ?? a.service?.price ?? 0),
    }));
    const othersItem = othersSelected
      ? [{ tenant_service_id: null, service_id: null, description: "", quantity: 1, unit: "", unit_price: 0 }]
      : [];
    setItems([...serviceItems, ...othersItem]);
    setStep(3);
  };

  const updateItem    = (i, field, value) =>
    setItems((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  const removeItem    = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const addManualItem = () =>
    setItems((prev) => [...prev, { tenant_service_id: null, service_id: null, description: "", quantity: 1, unit: "", unit_price: 0 }]);

  const subtotal = items.reduce((acc, i) => acc + Number(i.quantity) * Number(i.unit_price), 0);
  const fmt      = (n) => Number(n).toLocaleString("es-CL");

  const handleStep3Next = () => {
    if (items.length === 0) return toast.error(t("addItemError"));
    for (const item of items) {
      if (!item.description)          return toast.error(t("descriptionItemError"));
      if (Number(item.quantity) <= 0) return toast.error(t("quantityError"));
    }
    setStep(4);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createQuote({
        ...form,
        department_id: form.department_id ?? null,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
      });
      toast.success(t("quoteCreated"));
      onCreated();
    } catch {
      toast.error(t("quoteCreateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDeptName = form.department_id
    ? invoiceDepartments.find((d) => d.id === form.department_id)?.name
    : null;
  const currentAssignments = getScopeAssignments();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div
        className="bg-white dark:bg-gray-800 w-full rounded-xl shadow-xl flex flex-col border dark:border-gray-700 overflow-hidden transition-all duration-300"
        style={{
          maxWidth:  step === 4 ? "98vw" : step === 3 ? "96vw" : "64rem",
          maxHeight: step === 4 ? "98vh" : "95vh",
          height:    step === 4 ? "98vh" : "auto",
        }}
      >
        {/* Header */}
        <div className="bg-[#0b1b3b] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold">{t("newQuote")}</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("step")} {step} {t("of")} 4 — {STEPS[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition"><X size={18} /></button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b dark:border-gray-700 shrink-0">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition ${
              step === i + 1 ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-400"
              : step > i + 1 ? "border-green-500 text-green-600"
              : "border-transparent text-gray-400 dark:text-gray-500"
            }`}>
              <span className="mr-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold border border-current">
                {step > i + 1 ? "✓" : i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className={step === 4 ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-6 space-y-5"}>

          {/* ── PASO 1 ── */}
          {step === 1 && (
            <>
              <div className="relative">
                <label className={labelClass}>{t("clientRequired")}</label>
                <input
                  placeholder={t("searchClientPh")} value={tenantSearch}
                  onChange={(e) => {
                    setTenantSearch(e.target.value);
                    if (form.tenant_id) {
                      setForm((prev) => ({ ...prev, tenant_id: "", department_id: null }));
                      setAllAssignments([]); setInvoiceDepartments([]); setHasDeptAssignments(false);
                    }
                  }}
                  className={inputClass}
                />
                {showDropdown && tenants.length > 0 && (
                  <div className="absolute z-10 w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md mt-1 shadow max-h-48 overflow-y-auto">
                    {tenants.map((ten) => (
                      <div key={ten.id} onMouseDown={() => handleSelectTenant(ten)}
                        className="px-4 py-2.5 text-sm cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/30 dark:text-gray-200 flex items-center justify-between">
                        <span>{ten.name}</span>
                        <span className="text-gray-400 text-xs">{ten.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                {form.tenant_id && <p className="text-xs text-green-600 mt-1 font-medium">{t("clientSelected")}</p>}
              </div>

              {form.tenant_id && (loadingDeptInfo ? (
                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
              ) : hasDeptAssignments ? (
                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-teal-600 dark:text-teal-400" />
                    <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{t("invoiceDeptTitle")}</p>
                  </div>
                  <p className="text-xs text-teal-600 dark:text-teal-400">{t("invoiceDeptHint")}</p>
                  <select
                    value={form.department_id ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, department_id: Number(e.target.value) || null }))}
                    className="w-full border border-teal-200 dark:border-teal-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="">{t("select")}...</option>
                    {invoiceDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              ) : null)}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>{t("issueDateRequired")}</label>
                  <input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("expiryDate")}</label>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("currency")}</label>
                  {loadingDeptInfo ? (
                    <div className="h-9 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass} disabled={!form.tenant_id}>
                        {["USD", "CLP", "EUR", "MXN"].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {form.tenant_id && (
                        <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                          {form.currency}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("notesOptional")}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputClass} placeholder={t("quoteNotesPh")} />
              </div>
            </>
          )}

          {/* ── PASO 2 ── */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t("activeServicesOf")} <strong>{tenantSearch}</strong>
                  {selectedDeptName && (
                    <span className="ml-2 inline-flex items-center gap-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs px-2 py-0.5 rounded-full font-medium">
                      <Building2 size={11} /> {selectedDeptName}
                    </span>
                  )}
                </p>
                {selectedServices.length > 0 && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{selectedServices.length} {t("servicesSelected")}</p>
                )}
              </div>

              {currentAssignments.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm border border-dashed dark:border-gray-600 rounded-xl">
                  {t("noActiveServicesAssigned")}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {currentAssignments.map((a) => {
                    const isSelected = selectedServices.some((s) => s.id === a.id);
                    return (
                      <div key={a.id} onClick={() => toggleService(a)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                          isSelected ? "border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
                        }`}>
                        <input type="checkbox" readOnly checked={isSelected} className="pointer-events-none accent-teal-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.service?.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {a.license_modalidad === "tiered_fixed" ? t("tieredFixed")
                              : a.license_modalidad === "tiered_escalating" ? t("tieredEscalating")
                              : t("fixedShort")} · {a.currency} · {a.billing_cycle}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">
                          ${Number(a.price ?? 0).toLocaleString("es-CL")}
                        </span>
                      </div>
                    );
                  })}
                  <div onClick={() => setOthersSelected((v) => !v)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                      othersSelected ? "border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-900/20"
                      : "border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    }`}>
                    <input type="checkbox" readOnly checked={othersSelected} className="pointer-events-none accent-teal-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("othersOption")}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("othersOptionHint")}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── PASO 3 ── */}
          {step === 3 && (
            <div className="grid grid-cols-[1fr_420px] gap-8 items-start">
              <div className="flex flex-col gap-3">
                <div className="bg-[#0b1b3b] text-white rounded-xl grid grid-cols-[40px_1fr_90px_150px_140px_44px] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  <span className="text-center text-white/60">#</span>
                  <span>{t("descriptionLabel")}</span>
                  <span className="text-center">{t("quantity")}</span>
                  <span className="text-right">{t("unitPrice")}</span>
                  <span className="text-right">{t("total")}</span>
                  <span />
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[40px_1fr_90px_150px_140px_44px] gap-3 items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 hover:border-teal-300 dark:hover:border-teal-500 transition">
                      <span className="text-xs font-bold text-center text-white bg-[#0b1b3b]/80 w-6 h-6 rounded-full flex items-center justify-center mx-auto shrink-0">{i + 1}</span>
                      <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className={inputClass} placeholder={t("itemDescriptionPh")} disabled={submitting} />
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className={`${inputClass} text-center`} min="0.01" disabled={submitting} />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input type="number" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", e.target.value)} className={`${inputClass} pl-6 text-right`} min="0" disabled={submitting} />
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2 text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">${fmt(Number(item.quantity) * Number(item.unit_price))}</span>
                      </div>
                      <button type="button" onClick={() => removeItem(i)} disabled={submitting} className="text-red-400 hover:text-red-600 disabled:opacity-50 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition mx-auto">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addManualItem} disabled={submitting} className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline disabled:opacity-50 self-start mt-1">
                  <Plus size={14} /> {t("addManualItem")}
                </button>
              </div>

              <div className="flex flex-col gap-4 sticky top-0">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                  <div className="bg-[#0b1b3b] px-4 py-3">
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wide">{t("client")}</p>
                    <p className="text-base font-bold text-white mt-0.5 truncate">{tenantSearch}</p>
                  </div>
                  <div className="px-4 py-3 space-y-2.5 text-sm">
                    {selectedDeptName && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">{t("department")}</span>
                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium text-xs"><Building2 size={11} />{selectedDeptName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">{t("issueDate")}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">{fmtDate(form.issue_date)}</span>
                    </div>
                    {form.expiry_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">{t("expiryDate")}</span>
                        <span className="font-medium text-teal-600 dark:text-teal-400 text-xs">{fmtDate(form.expiry_date)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">{t("currency")}</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs">{form.currency}</span>
                    </div>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{items.length} {items.length === 1 ? t("item") : t("items")}</p>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{item.description || `${t("item")} ${i + 1}`}</span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums shrink-0">${fmt(Number(item.quantity) * Number(item.unit_price))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[#0b1b3b] rounded-xl px-5 py-5">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">{t("total")} {form.currency}</p>
                  <p className="text-3xl font-black text-white tabular-nums">${fmt(subtotal)}</p>
                  {items.length > 0 && (
                    <p className="text-xs text-white/50 mt-2">{items.length} {items.length === 1 ? t("item") : t("items")} · {t("exento")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 4: VISTA PREVIA ── */}
          {step === 4 && (
            <div className="flex flex-col h-full">
              <div className="flex items-start gap-3 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-200 dark:border-teal-700 px-5 py-3 shrink-0">
                <span className="text-teal-500 text-base leading-none mt-0.5">📋</span>
                <p className="text-xs text-teal-700 dark:text-teal-300 leading-relaxed">{t("quotePreviewNote")}</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <QuotePreview form={form} items={items} tenant={selectedTenantObj} deptName={selectedDeptName} />
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
            {step === 1 ? t("cancel") : <><ChevronLeft size={14} />{t("back")}</>}
          </button>
          <button
            onClick={step === 1 ? handleStep1Next : step === 2 ? handleStep2Next : step === 3 ? handleStep3Next : handleSubmit}
            disabled={submitting || (step === 1 && loadingDeptInfo)}
            className="flex items-center gap-1.5 bg-teal-700 text-white text-sm px-5 py-2 rounded-lg hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {submitting ? t("saving") : step === 4 ? t("createQuoteButton") : <>{t("next")}<ChevronRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
