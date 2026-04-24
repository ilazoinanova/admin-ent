import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { updateAssignment } from "../../../api/assignments/assignment.service";
import toast from "react-hot-toast";
import { LICENSE_TYPES } from "../../../constants/licenseTypes";

const Spinner = () => (
  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const AssignmentModal = ({ open, onClose, data, reload }) => {
  const { t } = useTranslation();
  const isLicense     = data?.service_name === "Licencias";
  const isDevelopment = data?.service_name === "Desarrollos";

  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [form, setForm] = useState({
    price: "",
    currency: "CLP",
    unit: "user",
    license_type: "",
    license_modalidad: "",
    billing_cycle: "mensual",
    development_type: "",
    hours_total: "",
    start_date: "",
    end_date: "",
  });

  const inputClass   = "w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass   = "text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block";
  const sectionClass = "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-3";
  const gridTemplate = "grid grid-cols-[110px_120px_1fr_32px] gap-2";

  useEffect(() => {
    if (data?.data) {
      setForm({
        price:             data.data.price             || "",
        currency:          data.data.currency          || "CLP",
        unit:              data.data.unit              || "user",
        license_type:      data.data.license_type      || "",
        license_modalidad: data.data.license_modalidad || "",
        billing_cycle:     data.data.billing_cycle     || "mensual",
        development_type:  data.data.development_type  || "",
        hours_total:       data.data.hours_total       || "",
        start_date:        data.data.start_date        || "",
        end_date:          data.data.end_date          || "",
      });

      if (data.data.tiers) {
        setTiers(data.data.tiers.map(tier => ({
          min:   tier.min_users,
          max:   tier.max_users,
          price: tier.price_per_user,
        })));
      } else {
        setTiers([]);
      }
    }
  }, [data]);

  if (!open) return null;

  const isTieredModalidad = (modalidad) => ["tiered_fixed", "tiered_escalating"].includes(modalidad);

  const validateTiers = () => {
    if (tiers.length === 0) return false;
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (!tier.max || tier.max <= tier.min) return false;
      if (i > 0 && tier.min !== Number(tiers[i - 1].max) + 1) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLicense && isTieredModalidad(form.license_modalidad) && !validateTiers()) {
      toast.error(t("tierError"));
      return;
    }

    setLoading(true);
    try {
      await updateAssignment({
        tenant_id:  data.tenant_id,
        service_id: data.service_id,
        ...form,
        tiers: isLicense && isTieredModalidad(form.license_modalidad) ? tiers : [],
      });
      toast.success(t("settingsSaved"));
      reload();
      onClose();
    } catch {
      toast.error(t("serviceError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-lg border dark:border-gray-700 flex flex-col max-h-[90vh]">

        <div className="bg-[#0b1b3b] text-white px-6 py-3 rounded-t-xl flex-shrink-0">
          <h2 className="text-sm font-semibold">{t("editAssignment")}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Contexto */}
          <div className={sectionClass}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("company")}</label>
                <input value={data?.tenant_name || ""} disabled className={inputClass + " bg-gray-100 dark:bg-gray-600 opacity-70"} />
              </div>
              <div>
                <label className={labelClass}>{t("service")}</label>
                <input value={data?.service_name || ""} disabled className={inputClass + " bg-gray-100 dark:bg-gray-600 opacity-70"} />
              </div>
            </div>
          </div>

          {/* Config general */}
          <div className={sectionClass}>
            <div className="grid grid-cols-2 gap-4">

              {isLicense && (
                <>
                  <div>
                    <label className={labelClass}>{t("licenseType")}</label>
                    <select
                      value={form.license_type}
                      onChange={(e) => setForm({ ...form, license_type: e.target.value })}
                      className={inputClass}
                      disabled={loading}
                    >
                      <option value="">{t("select")}</option>
                      {LICENSE_TYPES.map((lt) => (
                        <option key={lt.value} value={lt.value}>{lt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>{t("modality")}</label>
                    <select
                      value={form.license_modalidad}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({ ...form, license_modalidad: value, price: value === "fixed" ? form.price : "" });
                        if (value === "fixed") setTiers([]);
                      }}
                      className={inputClass}
                      disabled={loading}
                    >
                      <option value="">{t("select")}</option>
                      <option value="fixed">{t("fixedOption")}</option>
                      <option value="tiered_fixed">{t("tieredFixed")}</option>
                      <option value="tiered_escalating">{t("tieredEscalating")}</option>
                    </select>
                  </div>
                </>
              )}

            </div>

            {isLicense && form.license_modalidad === "fixed" && (
              <div>
                <label className={labelClass}>{t("pricePerUser")}</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={inputClass}
                  disabled={loading}
                />
              </div>
            )}

            {!isLicense && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("price")}</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputClass}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("unit")}</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className={inputClass}
                    disabled={loading}
                  >
                    <option value="user">{t("usersUnit")}</option>
                    <option value="hourly">{t("hoursUnit")}</option>
                    <option value="transaction">{t("transactionsUnit")}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Desarrollos */}
          {isDevelopment && (
            <div className={sectionClass}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("developmentType")}</label>
                  <select
                    value={form.development_type}
                    onChange={(e) => setForm({ ...form, development_type: e.target.value })}
                    className={inputClass}
                    disabled={loading}
                  >
                    <option value="">{t("select")}</option>
                    <option value="unico">{t("uniqueOption")}</option>
                    <option value="bolsa_horas">{t("hoursBag")}</option>
                  </select>
                </div>

                {form.development_type === "bolsa_horas" && (
                  <div>
                    <label className={labelClass}>{t("assignedHours")}</label>
                    <input
                      type="number"
                      value={form.hours_total}
                      onChange={(e) => setForm({ ...form, hours_total: e.target.value })}
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              {form.development_type === "bolsa_horas" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t("startDate")}</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("endDate")}</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tramos */}
          {isLicense && isTieredModalidad(form.license_modalidad) && (
            <div className={sectionClass}>
              <label className={labelClass}>{t("userTiers")}</label>

              <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
                <div className={`${gridTemplate} bg-gray-100 dark:bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300`}>
                  <span>{t("from")}</span>
                  <span>{t("to")}</span>
                  <span>{t("price")} ({form.currency})</span>
                  <span />
                </div>

                {tiers.map((tier, index) => (
                  <div key={index} className={`${gridTemplate} px-3 py-2 border-t dark:border-gray-600 items-center`}>
                    <input value={tier.min} disabled className={inputClass + " bg-gray-100 dark:bg-gray-600 opacity-70"} />

                    <input
                      type="number"
                      value={tier.max}
                      onChange={(e) => {
                        const updated = [...tiers];
                        updated[index].max = e.target.value;
                        if (tiers[index + 1]) updated[index + 1].min = Number(e.target.value) + 1;
                        setTiers(updated);
                      }}
                      className={inputClass}
                      disabled={loading}
                    />

                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => {
                        const updated = [...tiers];
                        updated[index].price = e.target.value;
                        setTiers(updated);
                      }}
                      className={inputClass}
                      disabled={loading}
                    />

                    {index === tiers.length - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = tiers.filter((_, i) => i !== index);
                          updated.forEach((t, i) => {
                            if (i === 0) t.min = 1;
                            else t.min = Number(updated[i - 1].max) + 1;
                          });
                          setTiers(updated);
                        }}
                        disabled={loading}
                        className="text-red-500 text-xs flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const last = tiers[tiers.length - 1];
                  setTiers([...tiers, { min: last ? Number(last.max) + 1 : 1, max: "", price: "" }]);
                }}
                disabled={loading}
                className="text-sm text-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("addTier")}
              </button>
            </div>
          )}

          {/* Final */}
          <div className={sectionClass}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("currency")}</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className={inputClass}
                  disabled={loading}
                >
                  <option value="CLP">CLP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("billingCycle")}</label>
                <select
                  value={form.billing_cycle}
                  onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                  className={inputClass}
                  disabled={loading}
                >
                  <option value="unico">{t("uniqueOption")}</option>
                  <option value="diario">{t("daily")}</option>
                  <option value="semanal">{t("weekly")}</option>
                  <option value="mensual">{t("monthly")}</option>
                  <option value="trimestral">{t("quarterly")}</option>
                  <option value="semestral">{t("biannual")}</option>
                  <option value="anual">{t("annual")}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0b1b3b] text-white rounded-lg hover:bg-[#162d5e] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
            >
              {loading && <Spinner />}
              {loading ? t("saving") : t("save")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AssignmentModal;
