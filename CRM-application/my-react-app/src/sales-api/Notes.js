import api from "./client.js";

export const getNotes = async () => {
  return await api.get("/notes");
};

export const createNote = async (noteData) => {
  return await api.post("/notes", noteData);
};

export const updateNote = async (id, noteData) => {
  return await api.patch(`/notes/${id}`, noteData);
};

export const deleteNote = async (id) => {
  return await api.delete(`/notes/${id}`);
};

export default {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};

