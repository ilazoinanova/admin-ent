import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const CURRENCIES = ["USD", "EUR", "CLP", "COP", "MXN", "ARS", "PEN", "BRL", "GBP"];

const BILLING_DEFAULTS = {
  use_department_billing: false,
  applies_tax:            false,
  tax_name:               "IVA",
  tax_percent:            0,
  billing_cycle:          "monthly",
  billing_day_from:       1,
  billing_day_to:         28,
  currency:               "USD",
  payment_terms_days:     30,
  billing_email:          "",
  billing_contact:        "",
  billing_notes:          "",
};

const EMPTY_FORM = { name: "", code: "", description: "", ...BILLING_DEFAULTS };

const calcRange = (from, to) => {
  if (!from || !to) return 0;
  return from <= to ? to - from : 31 - from + to;
};

const DepartmentModal = ({ open, onClose, onSubmit, initialData }) => {
  const { t } = useTranslation();
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name:                    initialData.name                    || "",
        code:                    initialData.code                    || "",
        description:             initialData.description             || "",
        use_department_billing:  initialData.use_department_billing  ?? false,
        applies_tax:             initialData.applies_tax             ?? false,
        tax_name:                initialData.tax_name                ?? "IVA",
        tax_percent:             initialData.tax_percent             ?? 0,
        billing_cycle:           initialData.billing_cycle           ?? "monthly",
        billing_day_from:        initialData.billing_day_from        ?? 1,
        billing_day_to:          initialData.billing_day_to          ?? 28,
        currency:                initialData.currency                ?? "USD",
        payment_terms_days:      initialData.payment_terms_days      ?? 30,
        billing_email:           initialData.billing_email           ?? "",
        billing_contact:         initialData.billing_contact         ?? "",
        billing_notes:           initialData.billing_notes           ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [initialData, open]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const range      = calcRange(form.billing_day_from, form.billing_day_to);
  const rangeError = form.use_department_billing && range > 30;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rangeError) return;
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  if (!open) return null;

  const fieldClass =
    "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass = "text-xs text-gray-500 dark:text-gray-400";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className={`bg-white dark:bg-gray-800 w-full ${form.use_department_billing ? "max-w-3xl" : "max-w-lg"} rounded-xl shadow-lg overflow-hidden border dark:border-gray-700 transition-all duration-200`}>

        <div className="bg-[#0b1b3b] text-white px-5 py-3">
          <h2 className="text-sm font-semibold">
            {initialData ? t("editDepartment") : t("newDepartment")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[85vh]">
          <div className="p-5 space-y-3">

            {/* ── Campos básicos ── */}
            <div>
              <label className={labelClass}>{t("name")} *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={fieldClass}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className={labelClass}>{t("code")} *</label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                className={fieldClass}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className={labelClass}>{t("descriptionLabel")}</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className={`${fieldClass} resize-none`}
                disabled={loading}
              />
            </div>

            {/* ── Toggle: Facturación propia ── */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 rounded-lg px-4 py-3 mt-2">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("useDeptBilling")}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("useDeptBillingHint")}</p>
              </div>
              <button
                type="button"
                onClick={() => set("use_department_billing", !form.use_department_billing)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                  form.use_department_billing ? "bg-[#0b1b3b]" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
                  form.use_department_billing ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {/* ── Sección de facturación (visible solo si use_department_billing) ── */}
            {form.use_department_billing && (
              <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-4 bg-blue-50/40 dark:bg-blue-900/10">

                {/* Título sección */}
                <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="flex-1 border-t border-blue-200 dark:border-blue-700" />
                  {t("deptBillingSection")}
                  <span className="flex-1 border-t border-blue-200 dark:border-blue-700" />
                </h3>

                {/* ── Impuestos ── */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("taxSettings")}</p>

                  <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("appliesTax")}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t("appliesTaxHint")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set("applies_tax", !form.applies_tax)}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                        form.applies_tax ? "bg-[#0b1b3b]" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
                        form.applies_tax ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>

                  {form.applies_tax && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>{t("taxName")}</label>
                        <input
                          value={form.tax_name}
                          onChange={(e) => set("tax_name", e.target.value)}
                          placeholder="IVA"
                          className={fieldClass}
                          maxLength={50}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t("taxPercent")}</label>
                        <input
                          type="number"
                          value={form.tax_percent}
                          onChange={(e) => set("tax_percent", parseFloat(e.target.value) || 0)}
                          min={0} max={100} step={0.01}
                          className={fieldClass}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Ciclo de facturación ── */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("billingCycleSection")}</p>

                  {/* Fila 1: Ciclo de facturación + Moneda */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{t("billingCycle")}</label>
                      <select
                        value={form.billing_cycle}
                        onChange={(e) => set("billing_cycle", e.target.value)}
                        className={fieldClass}
                        disabled={loading}
                      >
                        <option value="monthly">{t("monthly")}</option>
                        <option value="quarterly">{t("quarterly")}</option>
                        <option value="biannual">{t("biannual")}</option>
                        <option value="annual">{t("annual")}</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>{t("currency")}</label>
                      <select
                        value={form.currency}
                        onChange={(e) => set("currency", e.target.value)}
                        className={fieldClass}
                        disabled={loading}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fila 2: Plazo de pago + Rango de corte */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{t("paymentTermsDays")} <span className="text-gray-400 font-normal">{t("paymentTermsHint")}</span></label>
                      <input
                        type="number"
                        value={form.payment_terms_days}
                        onChange={(e) => set("payment_terms_days", parseInt(e.target.value) || 1)}
                        min={1} max={365}
                        className={fieldClass}
                        disabled={loading}
                      />
                    </div>

                    {/* Rango de corte */}
                    <div>
                      <label className={`${labelClass} flex items-center gap-1`}>
                        {t("billingRange")}
                        <span className="relative group/tip">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-default" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                          </svg>
                          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 rounded-md bg-gray-800 dark:bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50 text-center leading-snug">
                            {t("billingRangeHint")}
                          </span>
                        </span>
                      </label>
                      <div className={`grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 px-3 py-2 rounded-lg border ${rangeError ? "border-red-400 bg-red-50 dark:bg-red-900/10" : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"}`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t("del")}</span>
                        <input
                          type="number"
                          value={form.billing_day_from}
                          onChange={(e) => set("billing_day_from", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                          min={1} max={31}
                          className="w-full text-center border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-100 px-2 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                          disabled={loading}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t("al")}</span>
                        <input
                          type="number"
                          value={form.billing_day_to}
                          onChange={(e) => set("billing_day_to", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                          min={1} max={31}
                          className="w-full text-center border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-100 px-2 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                          disabled={loading}
                        />
                        <span className={`text-xs font-medium shrink-0 ${rangeError ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                          {range}d
                        </span>
                      </div>
                      {rangeError && (
                        <p className="text-xs text-red-500 mt-1">{t("billingRangeError")}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Contacto de facturación ── */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("billingContactSection")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{t("billingContact")}</label>
                      <input
                        value={form.billing_contact}
                        onChange={(e) => set("billing_contact", e.target.value)}
                        placeholder={t("billingContactPh")}
                        className={fieldClass}
                        maxLength={255}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("billingContactEmail")}</label>
                      <input
                        type="email"
                        value={form.billing_email}
                        onChange={(e) => set("billing_email", e.target.value)}
                        placeholder="facturacion@empresa.com"
                        className={fieldClass}
                        maxLength={255}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Notas ── */}
                <div>
                  <label className={labelClass}>{t("notes")}</label>
                  <textarea
                    value={form.billing_notes}
                    onChange={(e) => set("billing_notes", e.target.value)}
                    rows={2}
                    placeholder={t("billingNotesPh")}
                    className={`${fieldClass} resize-none`}
                    disabled={loading}
                  />
                </div>

              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-5 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-sm border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading || rangeError}
              className="px-3 py-1.5 text-sm bg-[#0b1b3b] text-white rounded-md hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? t("saving") : t("save")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;
