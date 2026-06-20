import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  getDepartments,
  updateDepartment,
} from "../../../api/departments/department.service";
import DepartmentModal from "./DepartmentModal";
import BillingConfigTab from "./BillingConfigTab";

// ─── Pestaña: Información del tenant ────────────────────────────────────────

const InfoTab = ({ tenant, onClose }) => {
  const { t } = useTranslation();

  const fields = [
    { name: "name",    label: t("name") },
    { name: "code",    label: t("code") },
    { name: "domain",  label: t("domain") },
    { name: "email",   label: t("email") },
    { name: "phone",   label: t("phone") },
    { name: "country", label: t("country") },
    { name: "city",    label: t("city") },
  ];

  return (
    <div className="p-5 space-y-3">
      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md px-3 py-2">
        {t("tenantReadOnlyHint") || "Los datos de la empresa se gestionan desde EasyNextTime."}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ name, label }) => (
          <div key={name} className={name === "name" ? "col-span-2" : ""}>
            <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
            <div className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm min-h-[38px]">
              {tenant?.[name] || <span className="text-gray-400">—</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
};

// ─── Pestaña: Departamentos ──────────────────────────────────────────────────

const DepartmentsTab = ({ tenantId, onClose }) => {
  const { t } = useTranslation();
  const [departments, setDepartments]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDepartments(tenantId);
      setDepartments(res.data);
    } catch {
      toast.error(t("deptLoadError"));
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  useEffect(() => { load(); }, [load]);

  const handleEditBilling = (dept) => { setSelectedDept(dept); setDeptModalOpen(true); };

  const handleDeptSubmit = async (data) => {
    try {
      await updateDepartment(tenantId, selectedDept.id, data);
      toast.success(t("deptUpdated"));
      setDeptModalOpen(false);
      load();
    } catch {
      toast.error(t("deptSaveError"));
    }
  };

  return (
    <div className="p-5 flex flex-col h-full">

      <div className="mb-3">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md px-3 py-2">
          {t("deptReadOnlyHint") || "Los departamentos se gestionan desde EasyNextTime. Usa el lápiz para configurar la facturación por departamento."}
        </p>
      </div>

      <div className="border dark:border-gray-700 rounded-lg overflow-hidden flex flex-col flex-1">
        <div className="grid grid-cols-[2fr_2.5fr_0.8fr_6rem] gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide shrink-0">
          <span>{t("name")}</span>
          <span>{t("descriptionLabel")}</span>
          <span>{t("status")}</span>
          <span>{t("billing")}</span>
        </div>

        <div className="overflow-y-auto max-h-[260px]">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_2.5fr_0.8fr_6rem] gap-2 px-3 py-3 border-t dark:border-gray-700 items-center">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ))
          ) : departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
              <Building2 size={28} className="mb-2 opacity-40" />
              <p className="text-sm">{t("noDepts")}</p>
            </div>
          ) : (
            departments.map((dept) => (
              <div
                key={dept.id}
                className="grid grid-cols-[2fr_2.5fr_0.8fr_6rem] gap-2 px-3 py-3 border-t dark:border-gray-700 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{dept.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{dept.description || "-"}</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium w-fit ${
                  dept.status === 1
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {dept.status === 1 ? t("active") : t("inactive")}
                </span>
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => handleEditBilling(dept)}
                    title={t("billingConfig")}
                    className="text-blue-500 hover:text-blue-700 transition"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {t("close")}
        </button>
      </div>

      <DepartmentModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        onSubmit={handleDeptSubmit}
        initialData={selectedDept}
      />
    </div>
  );
};

// ─── Modal principal con tabs ────────────────────────────────────────────────

const TABS = ["info", "departments", "billing"];

const TenantDetailModal = ({ open, onClose, tenant }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (open) setActiveTab("info");
  }, [open]);

  if (!open || !tenant) return null;

  const tabLabel = (tab) => ({
    info:        t("companyInfo"),
    departments: t("departments"),
    billing:     t("billingConfig"),
  }[tab]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-7xl rounded-xl shadow-lg overflow-hidden border dark:border-gray-700 max-h-[90vh] min-h-[480px] flex flex-col">

        {/* Header */}
        <div className="bg-[#0b1b3b] text-white px-5 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold">{tenant.name}</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-lg leading-none transition"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "info" && (
            <InfoTab tenant={tenant} onClose={onClose} />
          )}
          {activeTab === "departments" && (
            <DepartmentsTab tenantId={tenant.id} onClose={onClose} />
          )}
          {activeTab === "billing" && (
            <BillingConfigTab tenantId={tenant.id} onClose={onClose} />
          )}
        </div>

      </div>
    </div>
  );
};

export default TenantDetailModal;
