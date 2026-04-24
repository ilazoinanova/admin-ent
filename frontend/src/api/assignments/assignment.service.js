import api from "../api";

export const getAssignments = () =>
  api.get("/assignments");

export const toggleAssignment = (data) =>
  api.post("/assignments/toggle", data);

export const updateAssignment = (data) =>
  api.post("/assignments/update", data);