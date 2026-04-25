const KEY = "tenant_assignment_modes";

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); }
  catch { return {}; }
};

export const getStoredMode = (tenantId) =>
  load()[String(tenantId)] ?? null;

export const saveMode = (tenantId, mode, deptId = null) => {
  const all = load();
  all[String(tenantId)] = { mode, deptId: deptId ?? null };
  localStorage.setItem(KEY, JSON.stringify(all));
};
