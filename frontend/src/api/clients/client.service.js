import api from "../api";

// GET SOLO ACTIVOS
export const getClients = async () => {
  const res = await api.get("/clientes");
  return res.data;
};

// CREATE
export const createClient = async (data) => {
  const res = await api.post("/clientes", {
    ...data,
    active: true,
  });
  return res.data;
};

// UPDATE
export const updateClient = async (id, data) => {
  const res = await api.put(`/clientes/${id}`, data);
  return res.data;
};

// SOFT DELETE (DESACTIVAR)
export const deactivateClient = async (client) => {
  const res = await api.put(`/clientes/${client.id}`, {
    ...client,
    active: false,
  });
  return res.data;
};

// REACTIVAR
export const activateClient = async (client) => {
  const res = await api.put(`/clientes/${client.id}`, {
    ...client,
    active: true,
  });
  return res.data;
};