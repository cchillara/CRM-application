const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);
const day = (offset) => {
  const date = new Date(startOfToday);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const demoLeads = [
  { id: "demo-lead-1", name: "Acme Corporation", company: "Acme Corporation", contactName: "Olivia Chen", email: "olivia@acme.example", source: "Website", status: "Qualified", value: 24500, updatedAt: "Today", description: "Interested in streamlining sales follow-ups. A discovery call is scheduled to confirm their requirements." },
  { id: "demo-lead-2", name: "Northwind Traders", company: "Northwind Traders", contactName: "James Wilson", email: "james@northwind.example", source: "Referral", status: "Contacted", value: 18200, updatedAt: "Yesterday", description: "Referred by an existing customer and evaluating a CRM rollout. Follow up about team size and onboarding." },
  { id: "demo-lead-3", name: "Globex Solutions", company: "Globex Solutions", contactName: "Priya Shah", email: "priya@globex.example", source: "LinkedIn", status: "New", value: 12800, updatedAt: "This week", description: "New prospect from LinkedIn. Introduce the CRM workflow tools and learn about their current sales process." },
  { id: "demo-lead-4", name: "Stark Consulting", company: "Stark Consulting", contactName: "Noah Kim", email: "noah@stark.example", source: "Event", status: "Proposal", value: 31000, updatedAt: "This week", description: "Discussed pipeline reporting at a recent event. Proposal is underway; follow up on approval steps." },
];

export const demoDeals = [
  { id: "demo-deal-1", name: "Acme annual renewal", company: "Acme Corporation", stage: "Negotiation", value: 24500, closeDate: day(8), probability: 80, description: "Annual subscription renewal with expanded team access. Confirm seats and renewal terms." },
  { id: "demo-deal-2", name: "Northwind CRM rollout", company: "Northwind Traders", stage: "Proposal", value: 18200, closeDate: day(14), probability: 60, description: "Phased CRM rollout with onboarding and pipeline setup. Waiting for feedback on scope." },
  { id: "demo-deal-3", name: "Globex implementation", company: "Globex Solutions", stage: "Qualified", value: 12800, closeDate: day(21), probability: 40, description: "Potential CRM implementation. Confirm integration requirements and stakeholders." },
  { id: "demo-deal-4", name: "Stark advisory package", company: "Stark Consulting", stage: "Won", value: 31000, closeDate: day(-4), probability: 100, description: "Won advisory package covering pipeline reporting and sales process improvements." },
];

export const demoTasks = [
  { id: "demo-task-1", title: "Send revised proposal to Acme", due: day(0), time: "11:30", priority: "HIGH", status: "TODO", completed: false },
  { id: "demo-task-2", title: "Follow up with James Wilson", due: day(1), time: "14:00", priority: "MEDIUM", status: "TODO", completed: false },
  { id: "demo-task-3", title: "Prepare discovery call notes", due: day(2), time: "09:00", priority: "LOW", status: "TODO", completed: false },
  { id: "demo-task-4", title: "Review Globex requirements", due: day(-1), time: "10:00", priority: "MEDIUM", status: "COMPLETED", completed: true },
];

export const demoNotifications = [
  { id: "demo-notice-1", title: "Lead qualified", detail: "Acme Corporation moved to Qualified", time: "24 min ago", read: false, iconName: "lead", tone: "green" },
  { id: "demo-notice-2", title: "Deal updated", detail: "Northwind CRM rollout · $18,200", time: "1 hr ago", read: false, iconName: "deal", tone: "blue" },
  { id: "demo-notice-3", title: "Task due today", detail: "Send the revised proposal to Acme", time: "Today", read: true, iconName: "task", tone: "orange" },
  { id: "demo-notice-4", title: "Meeting scheduled", detail: "Discovery call with Globex Solutions", time: "Yesterday", read: true, iconName: "calendar", tone: "purple" },
];
