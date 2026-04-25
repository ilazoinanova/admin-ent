import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getAssignments, toggleAssignment } from "../../api/assignments/assignment.service";
import AssignmentModal from "../../components/ui/Asignaciones/AssignmentModal";
import ServiceCard from "../../components/ui/Asignaciones/ServiceCard";
import { Building2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { getStoredMode, saveMode } from "../../utils/assignmentMode";

// ─── Skeletons ───────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
    <div className="flex justify-between items-center">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    </div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ))}
  </div>
);

const SkeletonBlock = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5 space-y-4">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="flex gap-4">
        <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  </div>
);

// ─── Switch de modo ───────────────────────────────────────────────────────────

const ModeSwitch = ({ mode, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 text-xs font-medium">
      <button
        onClick={() => onChange("general")}
        className={`px-3 py-1.5 transition ${
          mode === "general"
            ? "bg-[#0b1b3b] text-white"
            : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        {t("modeGeneral")}
      </button>
      <div className="w-px h-full bg-gray-300 dark:bg-gray-600" />
      <button
        onClick={() => onChange("department")}
        className={`px-3 py-1.5 flex items-center gap-1.5 transition ${
          mode === "department"
            ? "bg-[#0b1b3b] text-white"
            : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        <Building2 size={11} />{t("modeDepartment")}
      </button>
    </div>
  );
};

// ─── Tab de departamento ──────────────────────────────────────────────────────

const DeptTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition font-medium ${
      active
        ? "bg-[#0b1b3b] text-white border-[#0b1b3b]"
        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`}
  >
    <Building2 size={11} />{label}
  </button>
);

// ─── Card agregar servicio ────────────────────────────────────────────────────

const AddServiceCard = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 transition min-h-[140px] w-full group"
    >
      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition">
        <Plus size={18} className="text-gray-400 group-hover:text-blue-500 transition" />
      </div>
      <span className="text-sm text-gray-400 dark:text-gray-500 group-hover:text-blue-500 font-medium transition">
        {t("addService")}
      </span>
    </button>
  );
};

// ─── Picker de servicios ─────────────────────────────────────────────────────

const serviceColors = {
  Licencias:     { bg: "bg-blue-50 dark:bg-blue-900/20",     border: "border-blue-200 dark:border-blue-700",     text: "text-blue-700 dark:text-blue-300"     },
  Integraciones: { bg: "bg-green-50 dark:bg-green-900/20",   border: "border-green-200 dark:border-green-700",   text: "text-green-700 dark:text-green-300"   },
  Desarrollos:   { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-700", text: "text-purple-700 dark:text-purple-300" },
  Consultorias:  { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-700", text: "text-orange-700 dark:text-orange-300" },
};

const AddServicePicker = ({ open, onClose, picker, availableServices, onAdd, adding }) => {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[80vh] rounded-xl shadow-lg overflow-hidden border dark:border-gray-700 flex flex-col">

        {/* Header */}
        <div className="bg-[#0b1b3b] text-white px-5 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold">{t("assignServiceTitle")}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition"><X size={16} /></button>
        </div>

        {/* Contexto — compañía y departamento */}
        <div className="px-5 pt-4 pb-3 flex flex-wrap gap-3 border-b dark:border-gray-700 shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("company")}</span>
            <span className="inline-flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-3 py-1.5 rounded-lg">
              {picker?.tenantName}
            </span>
          </div>
          {picker?.deptName && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("department")}</span>
              <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium px-3 py-1.5 rounded-lg">
                <Building2 size={12} />{picker.deptName}
              </span>
            </div>
          )}
        </div>

        {/* Lista de servicios */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {availableServices.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">
              {t("allServicesAssigned")}
            </p>
          ) : (
            availableServices.map((s) => {
              const colors = serviceColors[s.name] ?? {
                bg: "bg-gray-50 dark:bg-gray-700",
                border: "border-gray-200 dark:border-gray-600",
                text: "text-gray-700 dark:text-gray-200",
              };
              return (
                <button
                  key={s.id}
                  onClick={() => onAdd(s)}
                  disabled={adding}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border ${colors.bg} ${colors.border} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition text-left`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${colors.text}`}>{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.description}</p>
                    )}
                  </div>
                  <Plus size={16} className={colors.text} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full text-sm border dark:border-gray-600 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition"
          >
            {t("cancel")}
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── Página principal ────────────────────────────────────────────────────────

const AssignmentsPage = () => {
  const { t } = useTranslation();

  const [tenants,        setTenants]        = useState([]);
  const [services,       setServices]       = useState([]);
  const [assignments,    setAssignments]    = useState([]);
  const [departments,    setDepartments]    = useState([]);
  const [billingConfigs, setBillingConfigs] = useState({});
  const [search,         setSearch]         = useState("");
  const [selected,    setSelected]    = useState(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [adding,      setAdding]      = useState(false);

  const [modes,  setModes]  = useState({});
  const [scopes, setScopes] = useState({});
  const [picker, setPicker] = useState(null);

  const initialized = useRef(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAssignments();
      setTenants(res.data.tenants);
      setServices(res.data.services);
      setAssignments(res.data.assignments);
      setDepartments(res.data.departments ?? []);
      setBillingConfigs(res.data.billing_configs ?? {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Inicializar modo y scope por tenant (localStorage → auto-detección)
  useEffect(() => {
    if (initialized.current || tenants.length === 0) return;
    initialized.current = true;

    const initModes  = {};
    const initScopes = {};

    tenants.forEach((ten) => {
      const tenantDepts = departments.filter((d) => d.tenant_id === ten.id);

      // Sin departamentos → siempre general
      if (tenantDepts.length === 0) {
        initModes[ten.id] = "general";
        return;
      }

      const stored = getStoredMode(ten.id);

      if (stored) {
        initModes[ten.id] = stored.mode;
        if (stored.mode === "department") {
          initScopes[ten.id] = stored.deptId
            ? (tenantDepts.find((d) => d.id === stored.deptId)?.id ?? tenantDepts[0].id)
            : tenantDepts[0].id;
        }
      } else {
        const hasDept = assignments.some((a) => a.tenant_id === ten.id && (a.department_id ?? null) !== null && a.status === 1);
        if (hasDept) {
          initModes[ten.id] = "department";
          const firstActiveDept = tenantDepts.find((d) =>
            assignments.some((a) => a.tenant_id === ten.id && a.department_id === d.id && a.status === 1)
          );
          initScopes[ten.id] = firstActiveDept?.id ?? tenantDepts[0].id;
        } else {
          initModes[ten.id] = "general";
        }
      }
    });

    setModes(initModes);
    setScopes(initScopes);
  }, [tenants, assignments, departments]);

  const getTenantDepts = (tenantId) => departments.filter((d) => d.tenant_id === tenantId);
  const getMode        = (tenantId) => modes[tenantId] ?? "general";

  const handleModeChange = (tenantId, newMode, depts) => {
    const deptId = newMode === "department"
      ? (scopes[tenantId] ?? depts[0]?.id ?? null)
      : null;
    setModes((prev) => ({ ...prev, [tenantId]: newMode }));
    if (newMode === "department" && deptId) {
      setScopes((prev) => ({ ...prev, [tenantId]: deptId }));
    }
    saveMode(tenantId, newMode, deptId);
  };

  const setScope = (tenantId, deptId) => {
    setScopes((prev) => ({ ...prev, [tenantId]: deptId }));
    saveMode(tenantId, "department", deptId);
  };

  const getEffectiveDeptId = (tenantId, depts) => {
    if (getMode(tenantId) === "general") return null;
    return scopes[tenantId] ?? (depts[0]?.id ?? null);
  };

  const getActiveAssignment = (tenantId, serviceId, deptId) =>
    assignments.find(
      (a) => a.tenant_id === tenantId && a.service_id === serviceId && (a.department_id ?? null) === deptId && a.status === 1
    );

  const getActiveCount = (tenantId, deptId) =>
    assignments.filter((a) => a.tenant_id === tenantId && (a.department_id ?? null) === deptId && a.status === 1).length;

  const getAvailableServices = (tenantId, deptId) =>
    services.filter((s) => !getActiveAssignment(tenantId, s.id, deptId));

  const handleToggle = async (tenantId, serviceId, checked, deptId) => {
    await toggleAssignment({ tenant_id: tenantId, service_id: serviceId, department_id: deptId, status: checked ? 1 : 0 });
    loadData();
  };

  const handleAddService = async (service) => {
    if (!picker) return;
    setAdding(true);
    try {
      await toggleAssignment({ tenant_id: picker.tenantId, service_id: service.id, department_id: picker.deptId, status: 1 });
      setPicker(null);
      loadData();
    } finally {
      setAdding(false);
    }
  };

  const filteredTenants = tenants.filter((ten) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const tenantMatch = [ten.name, ten.code, ten.email, ten.domain, ten.country, ten.city].some((f) => f?.toLowerCase().includes(q));
    if (tenantMatch) return true;
    const deptMatch = getTenantDepts(ten.id).some((d) => [d.name, d.code].some((f) => f?.toLowerCase().includes(q)));
    if (deptMatch) return true;
    return services.some((s) => [s.name, s.code, s.description].some((f) => f?.toLowerCase().includes(q)));
  });

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("assignments")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("assignmentsSubtitle")}</p>
        </div>
        <input
          type="text"
          placeholder={t("searchCompany")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 px-3 py-2 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div className="space-y-6">
        {loading ? (
          [...Array(2)].map((_, i) => <SkeletonBlock key={i} />)
        ) : (
          filteredTenants.map((ten) => {
            const depts           = getTenantDepts(ten.id);
            const mode            = getMode(ten.id);
            const effectiveDeptId = getEffectiveDeptId(ten.id, depts);
            const activeCount     = getActiveCount(ten.id, effectiveDeptId);
            const currentDeptName = effectiveDeptId ? depts.find((d) => d.id === effectiveDeptId)?.name : null;
            const activeServices  = services.filter((s) => getActiveAssignment(ten.id, s.id, effectiveDeptId));
            const availableServices = getAvailableServices(ten.id, effectiveDeptId);

            return (
              <div key={ten.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5 space-y-4">

                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{ten.name}</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {mode === "department" && currentDeptName
                        ? `${t("department")}: ${currentDeptName}`
                        : t("scopeCompany")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {depts.length > 0 && (
                      <ModeSwitch
                        mode={mode}
                        onChange={(m) => handleModeChange(ten.id, m, depts)}
                      />
                    )}
                    <div className="flex gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-gray-400 dark:text-gray-500 text-xs">{t("activeCount")}</p>
                        <p className="font-semibold text-blue-600">{activeCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 dark:text-gray-500 text-xs">{t("services")}</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{services.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {mode === "department" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {depts.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t("noDeptsForAssignment")}</p>
                    ) : (
                      depts.map((dept) => (
                        <DeptTab
                          key={dept.id}
                          label={dept.name}
                          active={(scopes[ten.id] ?? depts[0]?.id) === dept.id}
                          onClick={() => setScope(ten.id, dept.id)}
                        />
                      ))
                    )}
                  </div>
                )}

                {(mode === "general" || (mode === "department" && depts.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {activeServices.map((s) => (
                      <ServiceCard
                        key={s.id}
                        tenant={ten}
                        service={s}
                        data={getActiveAssignment(ten.id, s.id, effectiveDeptId)}
                        departmentId={effectiveDeptId}
                        billingConfig={billingConfigs[ten.id] ?? null}
                        onToggle={handleToggle}
                        onEdit={(payload) => {
                          setSelected({
                            ...payload,
                            department_name: currentDeptName,
                            billing_config:  billingConfigs[ten.id] ?? null,
                          });
                          setModalOpen(true);
                        }}
                      />
                    ))}

                    {availableServices.length > 0 && (
                      <AddServiceCard
                        onClick={() => setPicker({
                          tenantId:   ten.id,
                          deptId:     effectiveDeptId,
                          tenantName: ten.name,
                          deptName:   currentDeptName,
                        })}
                      />
                    )}

                    {activeServices.length === 0 && availableServices.length === 0 && (
                      <div className="col-span-4 text-center text-gray-400 dark:text-gray-500 text-sm py-6">
                        {t("allServicesAssigned")}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      <AssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selected}
        reload={loadData}
      />

      <AddServicePicker
        open={!!picker}
        onClose={() => setPicker(null)}
        picker={picker}
        availableServices={picker ? getAvailableServices(picker.tenantId, picker.deptId) : []}
        onAdd={handleAddService}
        adding={adding}
      />
    </div>
  );
};

export default AssignmentsPage;
