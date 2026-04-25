import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getBillingConfig, saveBillingConfig } from "../../../api/tenants/tenantBillingConfig.service";

const CURRENCIES = ["USD", "EUR", "CLP", "COP", "MXN", "ARS", "PEN", "BRL", "GBP"];

const DEFAULTS = {
  applies_tax:        false,
  tax_name:           "IVA",
  tax_percent:        0,
  billing_cycle:      "monthly",
  billing_day_from:   1,
  billing_day_to:     28,
  currency:           "USD",
  payment_terms_days: 30,
  billing_email:      "",
  billing_contact:    "",
  notes:              "",
};

const fieldClass =
  "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60";

const labelClass = "block text-xs text-gray-500 dark:text-gray-400 mb-1";

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
      <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      {title}
      <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
    </h3>
    {children}
  </div>
);

const calcRange = (from, to) => {
  if (!from || !to) return 0;
  return from <= to ? to - from : 31 - from + to;
};

const BillingConfigTab = ({ tenantId, onClose }) => {
  const { t } = useTranslation();
  const [form, setForm]       = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBillingConfig(tenantId);
      if (res.data) {
        setForm({
          applies_tax:        res.data.applies_tax        ?? false,
          tax_name:           res.data.tax_name           ?? "IVA",
          tax_percent:        res.data.tax_percent        ?? 0,
          billing_cycle:      res.data.billing_cycle      ?? "monthly",
          billing_day_from:   res.data.billing_day_from   ?? 1,
          billing_day_to:     res.data.billing_day_to     ?? 28,
          currency:           res.data.currency           ?? "USD",
          payment_terms_days: res.data.payment_terms_days ?? 30,
          billing_email:      res.data.billing_email      ?? "",
          billing_contact:    res.data.billing_contact    ?? "",
          notes:              res.data.notes              ?? "",
        });
      }
    } catch {
      toast.error(t("billingConfigLoadError"));
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  useEffect(() => { load(); }, [load]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const range = calcRange(form.billing_day_from, form.billing_day_to);
  const rangeError = range > 30;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rangeError) return toast.error(t("billingRangeError"));
    setSaving(true);
    try {
      await saveBillingConfig(tenantId, form);
      toast.success(t("billingConfigSaved"));
    } catch {
      toast.error(t("billingConfigSaveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto max-h-[calc(90vh-9rem)]">

      {/* ── Impuestos ── */}
      <Section title={t("taxSettings")}>
        <div className="grid grid-cols-2 gap-3">

          <div className="col-span-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("appliesTax")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("appliesTaxHint")}</p>
            </div>
            <button
              type="button"
              onClick={() => set("applies_tax", !form.applies_tax)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
                form.applies_tax ? "bg-[#0b1b3b]" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
                form.applies_tax ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>

          {form.applies_tax && (
            <>
              <div>
                <label className={labelClass}>{t("taxName")}</label>
                <input
                  value={form.tax_name}
                  onChange={(e) => set("tax_name", e.target.value)}
                  placeholder="IVA"
                  className={fieldClass}
                  maxLength={50}
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
                />
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ── Ciclo de facturación ── */}
      <Section title={t("billingCycleSection")}>
        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className={labelClass}>{t("billingCycle")}</label>
            <select
              value={form.billing_cycle}
              onChange={(e) => set("billing_cycle", e.target.value)}
              className={fieldClass}
            >
              <option value="monthly">{t("monthly")}</option>
              <option value="quarterly">{t("quarterly")}</option>
              <option value="biannual">{t("biannual")}</option>
              <option value="annual">{t("annual")}</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>{t("paymentTermsDays")} <span className="text-gray-400 font-normal">{t("paymentTermsHint")}</span></label>
            <input
              type="number"
              value={form.payment_terms_days}
              onChange={(e) => set("payment_terms_days", parseInt(e.target.value) || 1)}
              min={1} max={365}
              className={fieldClass}
            />
          </div>

          {/* Rango de corte — ocupa 2 columnas */}
          <div className="col-span-2">
            <label className={labelClass}>{t("billingRange")}</label>
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${rangeError ? "border-red-400 bg-red-50 dark:bg-red-900/10" : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40"}`}>
              <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{t("del")}</span>
              <input
                type="number"
                value={form.billing_day_from}
                onChange={(e) => set("billing_day_from", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1} max={31}
                className="w-16 text-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{t("al")}</span>
              <input
                type="number"
                value={form.billing_day_to}
                onChange={(e) => set("billing_day_to", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1} max={31}
                className="w-16 text-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0">
                {form.billing_day_from > form.billing_day_to
                  ? t("billingRangeCross")
                  : ""}
              </span>
              <span className={`ml-auto text-xs font-medium shrink-0 ${rangeError ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                {t("billingRangeDays", { n: range })}
              </span>
            </div>
            {rangeError && (
              <p className="text-xs text-red-500 mt-1">{t("billingRangeError")}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("billingRangeHint")}</p>
          </div>

          <div>
            <label className={labelClass}>{t("currency")}</label>
            <select
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              className={fieldClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>
      </Section>

      {/* ── Contacto de facturación ── */}
      <Section title={t("billingContactSection")}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t("billingContact")}</label>
            <input
              value={form.billing_contact}
              onChange={(e) => set("billing_contact", e.target.value)}
              placeholder={t("billingContactPh")}
              className={fieldClass}
              maxLength={255}
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
            />
          </div>
        </div>
      </Section>

      {/* ── Notas ── */}
      <Section title={t("notes")}>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder={t("billingNotesPh")}
          className={`${fieldClass} resize-none`}
        />
      </Section>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={saving || rangeError}
          className="px-4 py-1.5 text-sm bg-[#0b1b3b] text-white rounded-md hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>

    </form>
  );
};

export default BillingConfigTab;
