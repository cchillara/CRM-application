export const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'leads', label: 'Leads', icon: 'Users' },
  { id: 'deals', label: 'Deals', icon: 'Handshake' },
  { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
  { id: 'team', label: 'Team', icon: 'UserCheck' },
  { id: 'products', label: 'Products', icon: 'Package' },
  { id: 'employee', label: 'Employee', icon: 'UserCog' },
  { id: 'settings', label: 'Settings', icon: 'Settings' }
];

export const Default_Profile = {
  name: "Client Admin",
  email: "admin@crmclient.com",
  phone: "+91 98000 00000",
  designation: "Client Administrator",
  role: "ORGANIZATION_ADMIN",
  orgName: "SHNOOR CRM"
};

export const Default_settings = {
  platformName: "SHNOOR CRM",
  supportEmail: "support@shnoor.com",
  allowSignup: true,
  emailAlerts: true,
  maintenanceMode: false
};

export const totalLeads = [
  { id: 'L001', name: 'ABC Technologies', contact: 'Rahul Sharma', email: 'rahul@abc.com', phone: '+91 98111 22233', tier: 'Enterprise', value: '$120,000', numericValue: 120000, status: 'Active', statusType: 'active', source: 'Referral', assignedTo: 'Sarah Jenkins', date: '10-01-2026' },
  { id: 'L002', name: 'TechNova Solutions', contact: 'Priya Reddy', email: 'priya@technova.com', phone: '+91 98222 33344', tier: 'Pro', value: '$85,000', numericValue: 85000, status: 'Qualified', statusType: 'qualified', source: 'Website', assignedTo: 'Arjun Kumar', date: '10-05-2026' },
  { id: 'L003', name: 'GreenLeaf Industries', contact: 'Suresh Rao', email: 'suresh@greenleaf.com', phone: '+91 98333 44455', tier: 'Growth', value: '$45,000', numericValue: 45000, status: 'Contacted', statusType: 'contacted', source: 'Cold Call', assignedTo: 'Meena Patel', date: '10-08-2026' },
];

export const recentLeads = totalLeads;

export const leadsByStatus = [
  { label: 'Active', count: 1, percentage: 33, color: '#10b981' },
  { label: 'Qualified', count: 1, percentage: 33, color: '#3b82f6' },
  { label: 'Contacted', count: 1, percentage: 34, color: '#f59e0b' },
];

export const totalDeals = [
  { id: 'D001', company: 'ABC Manufacturing', contact: 'Rahul Sharma', title: 'ERP Implementation', value: 1250000, stage: 'Proposal', probability: 70, owner: 'Ravi Kiran', expectedCloseDate: '2026-10-15' },
  { id: 'D002', company: 'TechNova Solutions', contact: 'Priya Reddy', title: 'Cloud Migration', value: 850000, stage: 'Negotiation', probability: 80, owner: 'Arjun Kumar', expectedCloseDate: '2026-10-10' },
  { id: 'D008', company: 'UrbanBuild Constructions', contact: 'Amit Shah', title: 'Project Management Software', value: 920000, stage: 'Won', probability: 100, owner: 'Arjun Kumar', expectedCloseDate: '2026-09-30' },
];

export const deals = totalDeals;

export const initialTasks = [
  { id: 'TSK-101', title: 'Follow up with ABC Technologies', client: 'ABC Technologies', assignedTo: 'Sarah Jenkins', due: '11-26-2026', priority: 'High', completed: false },
  { id: 'TSK-102', title: 'Prepare proposal for Cloud Migration', client: 'TechNova Solutions', assignedTo: 'Arjun Kumar', due: '10-21-2026', priority: 'Medium', completed: false },
  { id: 'TSK-103', title: 'Schedule product demo for Skyline Logistics', client: 'Skyline Logistics', assignedTo: 'Vikram Singh', due: '10-14-2026', priority: 'High', completed: true },
];

export const tasksList = initialTasks;
export const tasks = initialTasks;

export const teamMembers = [
  { id: 'TM-01', name: 'Sarah Jenkins', role: 'Sales Lead', email: 'sarah.j@crmclient.com', dealsClosed: 5, revenueWon: '₹42.5L', status: 'Active' },
  { id: 'TM-02', name: 'David Miller', role: 'Account Executive', email: 'david.m@crmclient.com', dealsClosed: 9, revenueWon: '₹28.0L', status: 'Active' },
  { id: 'TM-03', name: 'Elena Rostova', role: 'Customer Success', email: 'elena.r@crmclient.com', dealsClosed: 2, revenueWon: '₹34.2L', status: 'Active' },
];

export const productsList = [
  { id: 'PRD-001', name: 'CRM Enterprise Suite', category: 'Software & SaaS', price: '₹85,000', billing: 'Annual Billing', inventory: 'Enterprise Edition · Unlimited Seats', organizationName: 'ABC tech', status: 'Active' },
  { id: 'PRD-002', name: 'Cloud Pipeline Automation', category: 'Cloud Services', price: '₹45,000', billing: 'Monthly Billing', inventory: 'Standard Tier · Up to 50 Pipelines', organizationName: 'Business Next', status: 'Active' },
];

export const products = productsList;

export const employeesList = [
  { id: 'EMP-001', name: 'Ravi Kiran', email: 'ravi.k@crmclient.com', department: 'Sales & Accounts', role: 'Regional Manager', phone: '+91 98111 22233', status: 'Full-time' },
  { id: 'EMP-002', name: 'Arjun Kumar', email: 'arjun.k@crmclient.com', department: 'Solutions & Deals', role: 'Senior Account Manager', phone: '+91 98222 33344', status: 'Full-time' },
];

export const employees = employeesList;
