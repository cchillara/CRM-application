import api from "./client.js";

export const getCalendarEvents = async (params) => {
  let url = "/calendar/events";
  if (params?.start && params?.end) {
    url += `?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}`;
  }
  return await api.get(url);
};

export const getCalendarEventById = async (id) => {
  return await api.get(`/calendar/events/${id}`);
};

export const createCalendarEvent = async (eventData) => {
  return await api.post("/calendar/events", eventData);
};

export const updateCalendarEvent = async (id, eventData) => {
  return await api.patch(`/calendar/events/${id}`, eventData);
};

export const deleteCalendarEvent = async (id) => {
  return await api.delete(`/calendar/events/${id}`);
};

export default {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};

