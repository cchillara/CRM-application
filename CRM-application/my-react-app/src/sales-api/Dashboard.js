import api from "./client.js";

export const getDashboard = async () => {
  const [analytics, leads, tasks, customers] = await Promise.allSettled([
    api.get("/analytics"),
    api.get("/leads"),
    api.get("/tasks"),
    api.get("/customers"),
  ]);

  return {
    analytics: analytics.status === "fulfilled" ? analytics.value : null,
    leads: leads.status === "fulfilled" ? leads.value : [],
    tasks: tasks.status === "fulfilled" ? tasks.value : [],
    customers: customers.status === "fulfilled" ? customers.value : [],
  };
};

export default {
  getDashboard,
};

