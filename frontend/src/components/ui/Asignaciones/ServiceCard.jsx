import { Pencil, Table2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import Switch from "../Switch";
import { LICENSE_LABELS } from "../../../constants/licenseTypes";
import ViewTiersModal from "./ViewTiersModal";
import { useState } from "react";
import { fmtDate } from "../../../utils/date";

const ServiceCard = ({ tenant, service, data, onToggle, onEdit }) => {
  const { t } = useTranslation();
  const active        = !!data;
  const isLicense     = service.name === "Licencias";
  const isTiered      = ["tiered_fixed", "tiered_escalating"].includes(data?.license_modalidad);
  const isDevelopment = service.name === "Desarrollos";
  const isHoursBag    = data?.development_type === "bolsa_horas";

  const [viewTiersData, setViewTiersData] = useState(null);
  const [toggling, setToggling] = useState(false);

  const serviceColors = {
    Licencias:    "blue",
    Integraciones: "green",
    Desarrollos:  "purple",
    Consultorias: "orange",
  };

  const color = serviceColors[service.name] || "gray";

  const activeStyles = {
    blue:   "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20",
    green:  "border-green-500 bg-green-50 dark:border-green-500 dark:bg-green-900/20",
    purple: "border-purple-500 bg-purple-50 dark:border-purple-500 dark:bg-purple-900/20",
    orange: "border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20",
    gray:   "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50",
  };

  const unitLabels = {
    monthly:     t("monthly"),
    hourly:      t("hoursUnit"),
    user:        t("usersUnit"),
    transaction: t("transactionsUnit"),
  };

  const billingLabels = {
    unico:      t("uniqueOption"),
    diario:     t("daily"),
    mensual:    t("monthly"),
    anual:      t("annual"),
    semanal:    t("weekly"),
    trimestral: t("quarterly"),
    semestral:  t("biannual"),
  };

  const modalidadLabel = data?.license_modalidad === "fixed"
    ? t("fixedShort")
    : data?.license_modalidad === "tiered_fixed"
    ? t("tieredFixed")
    : t("tieredEscalating");

  const handleToggleChange = async (value) => {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggle(tenant.id, service.id, value);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className={`border rounded-xl p-4 transition ${
        active
          ? activeStyles[color]
          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
      } hover:shadow-md hover:scale-[1.01] ${toggling ? "opacity-70" : ""}`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-base font-semibold text-${color}-800 dark:text-${color}-300`}>{service.name}</span>
          {active && (
            <button
              onClick={() => onEdit({ tenant_id: tenant.id, service_id: service.id, service_name: service.name, tenant_name: tenant.name, data })}
              disabled={toggling}
              className={`text-${color}-700 dark:text-${color}-400 hover:text-${color}-900 disabled:opacity-50 disabled:cursor-not-allowed transition`}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        <Switch checked={active} onChange={handleToggleChange} disabled={toggling} />
      </div>

      <div className="space-y-2 text-sm">

        {(!isLicense || !isTiered) && (
          <div className="grid grid-cols-[100px_1fr]">
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t("price")}:</span>
            <span className={`text-${color}-700 dark:text-${color}-400 font-semibold`}>
              {active && data?.price ? `$${Number(data.price).toLocaleString("es-CL")}` : "—"}
            </span>
          </div>
        )}

        <div className="grid grid-cols-[100px_1fr]">
          <span className="text-gray-500 dark:text-gray-400 font-medium">{t("currency")}:</span>
          <span className={`text-${color}-700 dark:text-${color}-400`}>{active ? data.currency : "—"}</span>
        </div>

        {(!isLicense || !isTiered) && (
          <div className="grid grid-cols-[100px_1fr]">
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t("unit")}:</span>
            <span className={`text-${color}-700 dark:text-${color}-400`}>
              {active ? (unitLabels[data.unit] || data.unit) : "—"}
            </span>
          </div>
        )}

        {active && data?.license_type && (
          <div className="grid grid-cols-[100px_1fr]">
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t("type")}:</span>
            <span className={`text-${color}-700 dark:text-${color}-400`}>{LICENSE_LABELS[data.license_type] || data.license_type}</span>
          </div>
        )}

        {active && data?.license_modalidad && (
          <div className="grid grid-cols-[100px_1fr] items-center">
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t("modality")}:</span>
            <div className="flex items-center gap-2">
              <span className={`text-${color}-700 dark:text-${color}-400`}>
                {modalidadLabel}
              </span>
              {isLicense && isTiered && (
                <button onClick={() => setViewTiersData(data)} className={`text-${color}-600`}>
                  <Table2Icon size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-[100px_1fr]">
          <span className="text-gray-500 dark:text-gray-400 font-medium">{t("billingCycle")}:</span>
          <span className={`text-${color}-700 dark:text-${color}-400`}>
            {active ? (billingLabels[data.billing_cycle] || "—") : "—"}
          </span>
        </div>

        {isDevelopment && active && (
          <>
            <div className="grid grid-cols-[100px_1fr]">
              <span className="text-gray-500 dark:text-gray-400 font-medium">{t("type")}:</span>
              <span className={`text-${color}-700 dark:text-${color}-400`}>
                {data.development_type === "bolsa_horas" ? t("hoursBag") : t("uniqueOption")}
              </span>
            </div>

            {isHoursBag && (
              <div className="space-y-1">
                <div className="grid grid-cols-[100px_1fr]">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{t("hoursUnit")}:</span>
                  <span className={`text-${color}-700 dark:text-${color}-400 font-semibold`}>
                    {data.hours_used || 0} / {data.hours_total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 h-2 rounded">
                  <div
                    className={`bg-${color}-500 h-2 rounded`}
                    style={{ width: `${data.hours_total ? (data.hours_used / data.hours_total) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(data.start_date)} → {fmtDate(data.end_date)}</div>
              </div>
            )}
          </>
        )}

      </div>

      {viewTiersData && (
        <ViewTiersModal
          open={!!viewTiersData}
          onClose={() => setViewTiersData(null)}
          data={{ ...viewTiersData, tenant_name: tenant.name }}
        />
      )}
    </div>
  );
};

export default ServiceCard;
