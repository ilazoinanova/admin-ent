import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronRight, ChevronLeft, Plus, Trash2, Building2, CalendarDays, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import { getTenants } from "../../../api/tenants/tenant.service";
import { getTenantActiveServices, createInvoice, getLicenseBillingPreview } from "../../../api/invoices/invoice.service";
import { fmtDate } from "../../../utils/date";
import { getStoredMode } from "../../../utils/assignmentMode";
import {
  buildAvailablePeriods, fmtPeriodDate, periodLabel, addDays,
} from "../../../utils/billingPeriod";
import InvoicePreview from "./InvoicePreview";

const inputClass =
  "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

// Resuelve todos los parámetros de billing desde el depto (o compañía como fallback)
const resolveBilling = (dept, company) => {
  if (dept?.use_department_billing) {
    const hasTax = dept.applies_tax && (dept.tax_percent ?? 0) > 0;
    return {
      currency:         dept.currency            || company.currency,
      taxRate:          String(hasTax ? (dept.tax_percent ?? 0) : 0),
      taxName:          hasTax ? (dept.tax_name ?? "IVA") : "",
      billingDayFrom:   dept.billing_day_from    ?? company.billingDayFrom,
      billingDayTo:     dept.billing_day_to      ?? company.billingDayTo,
      paymentTermsDays: dept.payment_terms_days  ?? company.paymentTermsDays,
      lastBilledPeriod: dept.last_billed_period  ?? null,
    };
  }
  return {
    currency:         company.currency,
    taxRate:          String(company.taxPercent),
    taxName:          company.taxPercent > 0 ? (company.taxName ?? "IVA") : "",
    billingDayFrom:   company.billingDayFrom,
    billingDayTo:     company.billingDayTo,
    paymentTermsDays: company.paymentTermsDays,
    lastBilledPeriod: company.lastBilledPeriod,
  };
};

export default function InvoiceCreateModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const STEPS = [t("clientData"), t("serviceSelection"), t("reviewTotals"), t("invoicePreviewStep")];

  const [step, setStep]             = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Búsqueda de cliente
  const [tenants, setTenants]                   = useState([]);
  const [tenantSearch, setTenantSearch]         = useState("");
  const [showDropdown, setShowDropdown]         = useState(false);
  const [selectedTenantObj, setSelectedTenantObj] = useState(null);
  const justSelected = useRef(false);

  const [form, setForm] = useState({
    tenant_id:      "",
    department_id:  null,
    billing_period: "",
    period_from:    "",
    period_to:      "",
    issue_date:     new Date().toISOString().slice(0, 10),
    due_date:       "",
    tax_rate:       "0",
    tax_name:       "",
    currency:       "CLP",
    notes:          "",
  });

  // Asignaciones y departamentos del tenant
  const [allAssignments,     setAllAssignments]     = useState([]);
  const [invoiceDepartments, setInvoiceDepartments] = useState([]);
  const [hasDeptAssignments, setHasDeptAssignments] = useState(false);
  const [loadingDeptInfo,    setLoadingDeptInfo]    = useState(false);

  // Billing de la compañía (fallback)
  const [companyBilling, setCompanyBilling] = useState({
    currency:         "CLP",
    taxPercent:       0,
    taxName:          "",
    billingDayFrom:   1,
    billingDayTo:     28,
    paymentTermsDays: 30,
    lastBilledPeriod: null,
  });

  // Billing activo (resuelto del depto o compañía)
  const [activeBilling, setActiveBilling] = useState({
    currency:         "CLP",
    taxRate:          "0",
    taxName:          "",
    billingDayFrom:   1,
    billingDayTo:     28,
    paymentTermsDays: 30,
    lastBilledPeriod: null,
  });

  // Lista de períodos disponibles (recalculada cuando cambia activeBilling)
  const availablePeriods = buildAvailablePeriods(
    activeBilling.lastBilledPeriod,
    activeBilling.billingDayFrom,
    activeBilling.billingDayTo,
  );

  const [selectedServices, setSelectedServices] = useState([]);
  const [othersSelected,   setOthersSelected]   = useState(false);
  const [loadingServices,  setLoadingServices]  = useState(false);
  const [loadingPreview,   setLoadingPreview]   = useState(false);
  const [items, setItems] = useState([]);

  // Servicio que factura por conteo de licencias activas en el período
  const isLicenseService = (a) => a.unit === "user" && !!a.license_modalidad;

  // ── Debounce búsqueda de tenants ──────────────────────────────────────────
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

  // ── Carga automática cuando se selecciona tenant ───────────────────────────
  useEffect(() => {
    if (!form.tenant_id) return;
    let cancelled = false;
    setLoadingDeptInfo(true);
    (async () => {
      try {
        const res  = await getTenantActiveServices(form.tenant_id);
        const data = res.data ?? {};
        if (cancelled) return;

        const assignments = Array.isArray(data.assignments) ? data.assignments : [];
        const departments = data.departments ?? [];
        const apiHasDept  = data.has_department_assignments ?? false;
        const stored      = departments.length > 0 ? getStoredMode(form.tenant_id) : null;
        const hasDept     = stored ? stored.mode === "department" : apiHasDept && departments.length > 0;

        setAllAssignments(assignments);
        setInvoiceDepartments(departments);
        setHasDeptAssignments(hasDept);

        // Guardar billing completo de la compañía
        const cb = {
          currency:         data.currency          ?? "CLP",
          taxPercent:       data.tax_percent        ?? 0,
          taxName:          data.tax_name           ?? "",
          billingDayFrom:   data.billing_day_from   ?? 1,
          billingDayTo:     data.billing_day_to     ?? 28,
          paymentTermsDays: data.payment_terms_days ?? 30,
          lastBilledPeriod: data.last_billed_period ?? null,
        };
        setCompanyBilling(cb);

        if (hasDept && departments.length > 0) {
          const preferredId    = stored?.deptId ? departments.find((d) => d.id === stored.deptId)?.id : null;
          const selectedDeptId = preferredId ?? departments[0].id;
          const selectedDept   = departments.find((d) => d.id === selectedDeptId);
          const ab             = resolveBilling(selectedDept, cb);
          setActiveBilling(ab);
          applyBillingToForm(ab, selectedDeptId);
        } else {
          const ab = resolveBilling(null, cb);
          setActiveBilling(ab);
          applyBillingToForm(ab, null);
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoadingDeptInfo(false); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tenant_id]);

  // Aplica billing resuelto al formulario y auto-selecciona el primer período sugerido
  const applyBillingToForm = (ab, deptId) => {
    const periods = buildAvailablePeriods(ab.lastBilledPeriod, ab.billingDayFrom, ab.billingDayTo);
    const first   = periods[0];
    setForm((prev) => ({
      ...prev,
      department_id:  deptId,
      currency:       ab.currency,
      tax_rate:       ab.taxRate,
      tax_name:       ab.taxName,
      billing_period: first?.value ?? "",
      period_from:    first?.from  ?? "",
      period_to:      first?.to    ?? "",
      issue_date:     first?.to    ?? prev.issue_date,
      due_date:       first ? addDays(first.to, ab.paymentTermsDays) : "",
    }));
  };

  const handleSelectTenant = (tenant) => {
    justSelected.current = true;
    setForm((prev) => ({ ...prev, tenant_id: tenant.id, department_id: null, billing_period: "", period_from: "", period_to: "" }));
    setTenantSearch(tenant.name);
    setSelectedTenantObj(tenant);
    setShowDropdown(false);
    setTenants([]);
    setAllAssignments([]); setInvoiceDepartments([]); setHasDeptAssignments(false);
    setSelectedServices([]); setOthersSelected(false);
  };

  const handleDepartmentChange = (deptId) => {
    const dept = invoiceDepartments.find((d) => d.id === deptId);
    const ab   = resolveBilling(dept ?? null, companyBilling);
    setActiveBilling(ab);
    applyBillingToForm(ab, deptId);
  };

  const handlePeriodChange = (periodValue) => {
    const period = availablePeriods.find((p) => p.value === periodValue);
    if (!period) return;
    setForm((prev) => ({
      ...prev,
      billing_period: period.value,
      period_from:    period.from,
      period_to:      period.to,
      issue_date:     period.to,
      due_date:       addDays(period.to, activeBilling.paymentTermsDays),
    }));
  };

  const getScopeAssignments = () => {
    if (!hasDeptAssignments) return allAssignments.filter((a) => (a.department_id ?? null) === null);
    return allAssignments.filter((a) => (a.department_id ?? null) === form.department_id);
  };

  // ── Pasos ────────────────────────────────────────────────────────────────
  const handleStep1Next = () => {
    if (!form.tenant_id)      return toast.error(t("selectClientError"));
    if (!form.billing_period) return toast.error(t("selectPeriodError"));
    if (!form.issue_date)     return toast.error(t("selectIssueDateError"));
    if (hasDeptAssignments && !form.department_id) return toast.error(t("selectDeptError"));
    setSelectedServices([]); setStep(2);
  };

  const toggleService = (assignment) =>
    setSelectedServices((prev) =>
      prev.some((s) => s.id === assignment.id)
        ? prev.filter((s) => s.id !== assignment.id)
        : [...prev, assignment]
    );

  const handleStep2Next = async () => {
    if (selectedServices.length === 0 && !othersSelected) return toast.error(t("selectServiceError"));

    const licenseServices = selectedServices.filter(isLicenseService);
    const regularServices  = selectedServices.filter((a) => !isLicenseService(a));

    let previewMap = {};

    if (licenseServices.length > 0 && form.period_from && form.period_to) {
      setLoadingPreview(true);
      try {
        const res = await getLicenseBillingPreview({
          tenant_id:     form.tenant_id,
          department_id: form.department_id ?? undefined,
          period_from:   form.period_from,
          period_to:     form.period_to,
        });
        const results = res.data?.results ?? [];
        previewMap = Object.fromEntries(results.map((r) => [r.assignment_id, r]));
      } catch {
        toast.error(t("licensePreviewError"));
        setLoadingPreview(false);
        return;
      } finally {
        setLoadingPreview(false);
      }
    }

    // Ítems generados desde el cálculo automático de licencias — siempre un ítem por servicio
    const licenseItems = licenseServices.map((a) => {
      const preview     = previewMap[a.id];
      const serviceName = a.service?.name ?? t("service");
      const count       = preview?.active_licenses_count ?? 0;
      const total       = preview?.total_price ?? 0;
      const unitPrice   = count > 0 ? Math.round((total / count) * 100) / 100 : 0;

      return {
        tenant_service_id: a.id,
        service_id:        a.service_id,
        description:       `${serviceName} · ${count} ${t("licensedUsers")}`,
        quantity:          count,
        unit:              "user",
        unit_price:        unitPrice,
        _auto:             true,
      };
    });

    // Ítems de servicios sin modalidad de licencia (precio manual)
    const regularItems = regularServices.map((a) => ({
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

    setItems([...licenseItems, ...regularItems, ...othersItem]);
    setStep(3);
  };

  const updateItem    = (i, field, value) =>
    setItems((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  const removeItem    = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const addManualItem = () =>
    setItems((prev) => [...prev, { tenant_service_id: null, service_id: null, description: "", quantity: 1, unit: "", unit_price: 0 }]);

  const subtotal = items.reduce((acc, i) => acc + Number(i.quantity) * Number(i.unit_price), 0);
  const tax      = subtotal * (Number(form.tax_rate) / 100);
  const total    = subtotal + tax;
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
      // eslint-disable-next-line no-unused-vars
      await createInvoice({
        ...form,
        department_id: form.department_id ?? null,
        items: items.map(({ _auto, ...i }) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
      });
      toast.success(t("invoiceCreated"));
      onCreated();
    } catch {
      toast.error(t("invoiceCreateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTenant   = form.tenant_id ? { name: tenantSearch } : null;
  const selectedDeptName = form.department_id
    ? invoiceDepartments.find((d) => d.id === form.department_id)?.name
    : null;
  const currentAssignments = getScopeAssignments();
  const selectedPeriod     = availablePeriods.find((p) => p.value === form.billing_period);

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
            <h2 className="text-base font-semibold">{t("newInvoice")}</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("step")} {step} {t("of")} 4 — {STEPS[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition"><X size={18} /></button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b dark:border-gray-700 shrink-0">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition ${
              step === i + 1 ? "border-[#0b1b3b] text-[#0b1b3b] dark:border-blue-400 dark:text-blue-400"
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
              {/* Búsqueda de cliente */}
              <div className="relative">
                <label className={labelClass}>{t("clientRequired")}</label>
                <input
                  placeholder={t("searchClientPh")}
                  value={tenantSearch}
                  onChange={(e) => {
                    setTenantSearch(e.target.value);
                    if (form.tenant_id) {
                      setForm((prev) => ({ ...prev, tenant_id: "", department_id: null, billing_period: "", period_from: "", period_to: "" }));
                      setAllAssignments([]); setInvoiceDepartments([]); setHasDeptAssignments(false);
                    }
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

              {/* Selector de departamento */}
              {form.tenant_id && (loadingDeptInfo ? (
                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
              ) : hasDeptAssignments ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t("invoiceDeptTitle")}</p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t("invoiceDeptHint")}</p>
                  <select
                    value={form.department_id ?? ""}
                    onChange={(e) => handleDepartmentChange(Number(e.target.value) || null)}
                    className="w-full border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">{t("select")}...</option>
                    {invoiceDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}{dept.use_department_billing ? " ★" : ""}
                      </option>
                    ))}
                  </select>
                  {form.department_id && invoiceDepartments.find((d) => d.id === form.department_id)?.use_department_billing ? (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {(() => {
                        const dept = invoiceDepartments.find((d) => d.id === form.department_id);
                        return `★ ${t("deptBillingActive")}: ${dept.currency} · ${t(dept.billing_cycle)}${dept.applies_tax ? ` · ${dept.tax_name ?? "IVA"} ${dept.tax_percent}%` : ""}`;
                      })()}
                    </p>
                  ) : form.department_id ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t("deptBillingInherited")}</p>
                  ) : null}
                </div>
              ) : null)}

              {/* ── Selector de período ── */}
              {form.tenant_id && !loadingDeptInfo && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{t("billingPeriod")}</p>
                    {activeBilling.lastBilledPeriod && (
                      <span className="ml-auto text-xs text-indigo-500 dark:text-indigo-400">
                        {t("lastBilledPeriod")}: {periodLabel(activeBilling.lastBilledPeriod)}
                      </span>
                    )}
                  </div>
                  <select
                    value={form.billing_period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="w-full border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">{t("select")}...</option>
                    {availablePeriods.map((p) => (
                      <option key={p.value} value={p.value}>{p.display}</option>
                    ))}
                  </select>
                  {selectedPeriod && (
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-indigo-100 dark:border-indigo-800">
                      <CalendarDays size={13} className="text-indigo-400 shrink-0" />
                      <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        {selectedPeriod.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        {fmtPeriodDate(selectedPeriod.from)} → {fmtPeriodDate(selectedPeriod.to)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Fechas + Moneda */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>{t("issueDateRequired")}</label>
                  <input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("dueDateField")}</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("currency")}</label>
                  {loadingDeptInfo ? (
                    <div className="h-9 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className={inputClass}
                        disabled={!form.tenant_id}
                      >
                        {["USD", "CLP", "EUR", "MXN"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {form.tenant_id && (
                        <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-[#0b1b3b]/10 dark:bg-blue-900/30 text-[#0b1b3b] dark:text-blue-300">
                          {form.currency}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Impuesto aplicado */}
              {form.tenant_id && !loadingDeptInfo && (
                <div className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                  Number(form.tax_rate) > 0
                    ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700"
                    : "bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600"
                }`}>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("taxSettings")}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {Number(form.tax_rate) > 0 ? t("appliesTaxHint") : t("taxExempt")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {Number(form.tax_rate) > 0 && (
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                        {form.tax_name || "IVA"}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={form.tax_rate}
                        onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                        min={0} max={100} step={0.01}
                        className="w-20 text-right border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className={labelClass}>{t("notesOptional")}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputClass} placeholder={t("invoiceNotesPh")} />
              </div>
            </>
          )}

          {/* ── PASO 2 ── */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t("activeServicesOf")} <strong>{selectedTenant?.name ?? tenantSearch}</strong>
                  {selectedDeptName && (
                    <span className="ml-2 inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">
                      <Building2 size={11} /> {selectedDeptName}
                    </span>
                  )}
                </p>
                {selectedServices.length > 0 && (
                  <p className="text-xs text-blue-600 font-semibold">{selectedServices.length} {t("servicesSelected")}</p>
                )}
              </div>

              {loadingServices ? (
                <div className="flex flex-col gap-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}
                </div>
              ) : currentAssignments.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm border border-dashed dark:border-gray-600 rounded-xl">
                  {t("noActiveServicesAssigned")}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {currentAssignments.map((a) => {
                    const isSelected = selectedServices.some((s) => s.id === a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => toggleService(a)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                          isSelected ? "border-[#0b1b3b] bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
                        }`}
                      >
                        <input type="checkbox" readOnly checked={isSelected} className="pointer-events-none accent-[#0b1b3b] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.service?.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {a.license_modalidad === "tiered_fixed" ? t("tieredFixed")
                              : a.license_modalidad === "tiered_escalating" ? t("tieredEscalating")
                              : t("fixedShort")} · {a.currency} · {a.billing_cycle}
                          </p>
                        </div>
                        {isLicenseService(a) ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                            <Zap size={10} />{t("autoCalculated")}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">
                            ${Number(a.price ?? 0).toLocaleString("es-CL")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div
                    onClick={() => setOthersSelected((v) => !v)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                      othersSelected
                        ? "border-[#0b1b3b] bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                        : "border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <input type="checkbox" readOnly checked={othersSelected} className="pointer-events-none accent-[#0b1b3b] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("othersOption")}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("othersOptionHint")}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── PASO 4: VISTA PREVIA ── */}
          {step === 4 && (
            <div className="flex flex-col h-full">
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 px-5 py-3 shrink-0">
                <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{t("previewNote")}</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <InvoicePreview
                  form={form}
                  items={items}
                  tenant={selectedTenantObj}
                  deptName={selectedDeptName}
                />
              </div>
            </div>
          )}

          {/* ── PASO 3 ── */}
          {step === 3 && (
            <div className="grid grid-cols-[1fr_420px] gap-8 items-start">

              {/* ── Tabla de ítems ── */}
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
                    <div
                      key={i}
                      className="grid grid-cols-[40px_1fr_90px_150px_140px_44px] gap-3 items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 hover:border-blue-300 dark:hover:border-blue-500 transition"
                    >
                      <span className="text-xs font-bold text-center text-white bg-[#0b1b3b]/80 dark:bg-[#0b1b3b] w-6 h-6 rounded-full flex items-center justify-center mx-auto shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex flex-col gap-1 min-w-0">
                        {item._auto && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            <Zap size={9} />{t("autoCalculated")}
                          </span>
                        )}
                        <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className={inputClass} placeholder={t("itemDescriptionPh")} disabled={submitting} />
                      </div>
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className={`${inputClass} text-center`} min="0.01" disabled={submitting} />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input type="number" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", e.target.value)} className={`${inputClass} pl-6 text-right`} min="0" disabled={submitting} />
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2 text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                          ${fmt(Number(item.quantity) * Number(item.unit_price))}
                        </span>
                      </div>
                      <button type="button" onClick={() => removeItem(i)} disabled={submitting} className="text-red-400 hover:text-red-600 disabled:opacity-50 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition mx-auto">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addManualItem} disabled={submitting} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline disabled:opacity-50 self-start mt-1">
                  <Plus size={14} /> {t("addManualItem")}
                </button>
              </div>

              {/* ── Panel lateral de resumen ── */}
              <div className="flex flex-col gap-4 sticky top-0">

                {/* Datos generales */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                  <div className="bg-[#0b1b3b] px-4 py-3">
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wide">{t("client")}</p>
                    <p className="text-base font-bold text-white mt-0.5 truncate">{tenantSearch}</p>
                  </div>
                  <div className="px-4 py-3 space-y-2.5 text-sm">
                    {selectedDeptName && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">{t("department")}</span>
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-xs">
                          <Building2 size={11} />{selectedDeptName}
                        </span>
                      </div>
                    )}
                    {selectedPeriod && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">{t("billingPeriod")}</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs">{selectedPeriod.label}</span>
                      </div>
                    )}
                    {selectedPeriod && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">{t("periodRange")}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                          {fmtPeriodDate(selectedPeriod.from)} → {fmtPeriodDate(selectedPeriod.to)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">{t("issueDate")}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">{fmtDate(form.issue_date)}</span>
                    </div>
                    {form.due_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">{t("dueDate")}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">{fmtDate(form.due_date)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">{t("currency")}</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs">{form.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de ítems resumida */}
                {items.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {items.length} {items.length === 1 ? t("item") : t("items")}
                      </p>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">
                            {item.description || `${t("item")} ${i + 1}`}
                          </span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums shrink-0">
                            ${fmt(Number(item.quantity) * Number(item.unit_price))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totales */}
                <div className="bg-[#0b1b3b] rounded-xl px-5 py-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 uppercase tracking-wide">{t("subtotal")}</span>
                    <span className="text-sm font-semibold text-white/80 tabular-nums">${fmt(subtotal)}</span>
                  </div>
                  {Number(form.tax_rate) > 0 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-300/80">{form.tax_name || "IVA"} ({form.tax_rate}%)</span>
                      <span className="text-sm font-semibold text-amber-300 tabular-nums">+${fmt(tax)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">{t("exento")}</span>
                      <span className="text-xs text-white/40">—</span>
                    </div>
                  )}
                  <div className="border-t border-white/20 pt-2">
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">{t("total")} {form.currency}</p>
                    <p className="text-3xl font-black text-white tabular-nums">${fmt(total)}</p>
                    {items.length > 0 && (
                      <p className="text-xs text-white/40 mt-1.5">
                        {items.length} {items.length === 1 ? t("item") : t("items")}
                      </p>
                    )}
                  </div>
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
            {step === 1 ? t("cancel") : <><ChevronLeft size={14} />{t("back")}</>}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={
                step === 1 ? handleStep1Next
                : step === 2 ? handleStep2Next
                : step === 3 ? handleStep3Next
                : handleSubmit
              }
              disabled={submitting || loadingServices || loadingPreview || (step === 1 && loadingDeptInfo)}
              className="flex items-center gap-1.5 bg-[#0b1b3b] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {submitting
                ? t("saving")
                : step === 4
                ? t("createInvoiceButton")
                : <>{t("next")}<ChevronRight size={14} /></>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
