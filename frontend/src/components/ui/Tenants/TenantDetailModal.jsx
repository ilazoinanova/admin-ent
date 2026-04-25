import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Power, Building2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../../api/departments/department.service";
import DepartmentModal from "./DepartmentModal";
import ConfirmModal from "../ConfirmModal";
import BillingConfigTab from "./BillingConfigTab";

// ─── Pestaña: Información del tenant ────────────────────────────────────────

const InfoTab = ({ tenant, onSubmit, onClose, isCreate }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "", code: "", domain: "", email: "", phone: "", country: "", city: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      name:    tenant?.name    || "",
      code:    tenant?.code    || "",
      domain:  tenant?.domain  || "",
      email:   tenant?.email   || "",
      phone:   tenant?.phone   || "",
      country: tenant?.country || "",
      city:    tenant?.city    || "",
    });
  }, [tenant]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  const fieldClass =
    "w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";

  const fields = [
    { name: "name",    label: t("name"),    required: true },
    { name: "code",    label: t("code"),    required: true },
    { name: "domain",  label: t("domain") },
    { name: "email",   label: t("email") },
    { name: "phone",   label: t("phone") },
    { name: "country", label: t("country") },
    { name: "city",    label: t("city") },
  ];

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ name, label, required }) => (
          <div key={name} className={name === "name" ? "col-span-2" : ""}>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {label}{required && " *"}
            </label>
            <input
              name={name}
              value={form[name]}
              onChange={handleChange}
              className={fieldClass}
              required={required}
              disabled={loading}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 transition"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 text-sm bg-[#0b1b3b] text-white rounded-md hover:bg-[#162d5e] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
};

// ─── Pestaña: Departamentos ──────────────────────────────────────────────────

const DepartmentsTab = ({ tenantId, onClose }) => {
  const { t } = useTranslation();
  const [departments, setDepartments]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept]   = useState(null);
  const [confirmOpen, setConfirmOpen]     = useState(false);
  const [toToggle, setToToggle]           = useState(null);

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

  const handleCreate = () => { setSelectedDept(null); setDeptModalOpen(true); };
  const handleEdit   = (dept) => { setSelectedDept(dept); setDeptModalOpen(true); };

  const handleDeptSubmit = async (data) => {
    try {
      if (selectedDept) {
        await updateDepartment(tenantId, selectedDept.id, data);
        toast.success(t("deptUpdated"));
      } else {
        await createDepartment(tenantId, data);
        toast.success(t("deptCreated"));
      }
      setDeptModalOpen(false);
      load();
    } catch {
      toast.error(t("deptSaveError"));
    }
  };

  const handleToggleClick = (dept) => { setToToggle(dept); setConfirmOpen(true); };

  const handleConfirmToggle = async () => {
    try {
      await updateDepartment(tenantId, toToggle.id, {
        status: toToggle.status === 1 ? 0 : 1,
      });
      toast.success(toToggle.status === 1 ? t("deptDeactivated") : t("deptActivated"));
      setConfirmOpen(false);
      load();
    } catch {
      toast.error(t("changeStatusError"));
    }
  };

  return (
    <div className="p-5 flex flex-col h-full">

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("deptSubtitle")}</p>
        <button
          onClick={handleCreate}
          className="bg-[#0b1b3b] text-white px-3 py-1.5 rounded-md text-xs hover:bg-[#162d5e] transition"
        >
          {t("newButton")}
        </button>
      </div>

      <div className="border dark:border-gray-700 rounded-lg overflow-hidden flex flex-col flex-1">
        <div className="grid grid-cols-[2fr_1.2fr_2fr_0.8fr_5rem] gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide shrink-0">
          <span>{t("name")}</span>
          <span>{t("code")}</span>
          <span>{t("descriptionLabel")}</span>
          <span>{t("status")}</span>
          <span>{t("actions")}</span>
        </div>

        <div className="overflow-y-auto max-h-[260px]">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1.2fr_2fr_0.8fr_5rem] gap-2 px-3 py-3 border-t dark:border-gray-700 items-center">
                {[...Array(5)].map((_, j) => (
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
                className="grid grid-cols-[2fr_1.2fr_2fr_0.8fr_5rem] gap-2 px-3 py-3 border-t dark:border-gray-700 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{dept.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{dept.code}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{dept.description || "-"}</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium w-fit ${
                  dept.status === 1
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {dept.status === 1 ? t("active") : t("inactive")}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleEdit(dept)} className="text-blue-500 hover:text-blue-700 transition">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleToggleClick(dept)}
                    className={`transition ${dept.status === 1 ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}`}
                  >
                    <Power size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer con botón cerrar */}
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

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        title={toToggle?.status === 1 ? t("deactivateDept") : t("activateDept")}
        description={
          toToggle
            ? t(toToggle.status === 1 ? "deactivateDeptConfirm" : "activateDeptConfirm", { name: toToggle.name })
            : ""
        }
        confirmText={toToggle?.status === 1 ? t("deactivate") : t("activate")}
        type={toToggle?.status === 1 ? "danger" : "success"}
      />
    </div>
  );
};

// ─── Modal principal con tabs ────────────────────────────────────────────────

const TABS = ["info", "departments", "billing"];

const TenantDetailModal = ({ open, onClose, onSubmit, tenant }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("info");

  const isCreate = !tenant?.id;

  useEffect(() => {
    if (open) setActiveTab("info");
  }, [open]);

  if (!open) return null;

  const tabLabel = (tab) => ({
    info:        t("companyInfo"),
    departments: t("departments"),
    billing:     t("billingConfig"),
  }[tab]);

  const isTabDisabled = (tab) => isCreate && tab !== "info";

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-7xl rounded-xl shadow-lg overflow-hidden border dark:border-gray-700 max-h-[90vh] min-h-[480px] flex flex-col">

        {/* Header */}
        <div className="bg-[#0b1b3b] text-white px-5 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold">
            {isCreate ? t("createCompany") : tenant.name}
          </h2>
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
              onClick={() => !isTabDisabled(tab) && setActiveTab(tab)}
              disabled={isTabDisabled(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px flex items-center gap-1.5 ${
                isTabDisabled(tab)
                  ? "border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : activeTab === tab
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {isTabDisabled(tab) && <Lock size={11} className="opacity-60" />}
              {tabLabel(tab)}
            </button>
          ))}
          {isCreate && (
            <span className="ml-3 self-center text-xs text-gray-400 dark:text-gray-500 italic">
              {t("createCompanyTabHint")}
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "info" && (
            <InfoTab tenant={tenant} onSubmit={onSubmit} onClose={onClose} isCreate={isCreate} />
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
