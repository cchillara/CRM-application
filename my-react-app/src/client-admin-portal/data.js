
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


export const totalDeals = [
  {
    id: "D001",
    company: "ABC Manufacturing",
    contact: "Rahul Sharma",
    title: "ERP Implementation",
    value: 1250000,
    stage: "Proposal",
    probability: 70,
    owner: "Ravi Kiran",
    expectedCloseDate: "2026-10-15"
  },
  {
    id: "D002",
    company: "TechNova Solutions",
    contact: "Priya Reddy",
    title: "Cloud Migration",
    value: 850000,
    stage: "Negotiation",
    probability: 80,
    owner: "Arjun Kumar",
    expectedCloseDate: "2026-10-10"
  },
  {
    id: "D003",
    company: "GreenLeaf Industries",
    contact: "Suresh Rao",
    title: "SAP Integration",
    value: 2100000,
    stage: "Qualified",
    probability: 50,
    owner: "Meena Patel",
    expectedCloseDate: "2026-11-05"
  },
  {
    id: "D004",
    company: "GlobalMart Pvt Ltd",
    contact: "Anjali Mehta",
    title: "CRM Implementation",
    value: 650000,
    stage: "Proposal",
    probability: 65,
    owner: "Ravi Kiran",
    expectedCloseDate: "2026-10-25"
  },
  {
    id: "D005",
    company: "Skyline Logistics",
    contact: "Vikram Singh",
    title: "Supply Chain Software",
    value: 1750000,
    stage: "Negotiation",
    probability: 85,
    owner: "Arjun Kumar",
    expectedCloseDate: "2026-10-18"
  },
  {
    id: "D006",
    company: "BrightFuture Education",
    contact: "Neha Verma",
    title: "Learning Management System",
    value: 480000,
    stage: "Qualified",
    probability: 45,
    owner: "Meena Patel",
    expectedCloseDate: "2026-11-20"
  },
  {
    id: "D007",
    company: "HealthCare Plus",
    contact: "Karthik Reddy",
    title: "Healthcare Management System",
    value: 3200000,
    stage: "Proposal",
    probability: 60,
    owner: "Ravi Kiran",
    expectedCloseDate: "2026-11-12"
  },
  {
    id: "D008",
    company: "UrbanBuild Constructions",
    contact: "Amit Shah",
    title: "Project Management Software",
    value: 920000,
    stage: "Won",
    probability: 100,
    owner: "Arjun Kumar",
    expectedCloseDate: "2026-09-30"
  },
  {
    id: "D009",
    company: "FinEdge Services",
    contact: "Sneha Kapoor",
    title: "Financial Analytics Platform",
    value: 1450000,
    stage: "Lost",
    probability: 0,
    owner: "Meena Patel",
    expectedCloseDate: "2026-09-20"
  },
  {
    id: "D010",
    company: "Oceanic Exports",
    contact: "Manoj Kumar",
    title: "Enterprise Software Suite",
    value: 2500000,
    stage: "Negotiation",
    probability: 90,
    owner: "Ravi Kiran",
    expectedCloseDate: "2026-10-30"
  }
];

export const deals = totalDeals;

const totalDealsCount = totalDeals.length;

export const dealsByStage = [
  {
    stage: "Qualified",
    count: totalDeals.filter(d => d.stage === "Qualified").length,
    percentage: Math.round((totalDeals.filter(d => d.stage === "Qualified").length / totalDealsCount) * 100),
    totalValue: totalDeals.filter(d => d.stage === "Qualified").reduce((acc, d) => acc + d.value, 0),
    color: "#10b981",
    deals: totalDeals.filter(d => d.stage === "Qualified")
  },
  {
    stage: "Proposal",
    count: totalDeals.filter(d => d.stage === "Proposal").length,
    percentage: Math.round((totalDeals.filter(d => d.stage === "Proposal").length / totalDealsCount) * 100),
    totalValue: totalDeals.filter(d => d.stage === "Proposal").reduce((acc, d) => acc + d.value, 0),
    color: "#8b5cf6",
    deals: totalDeals.filter(d => d.stage === "Proposal")
  },
  {
    stage: "Negotiation",
    count: totalDeals.filter(d => d.stage === "Negotiation").length,
    percentage: Math.round((totalDeals.filter(d => d.stage === "Negotiation").length / totalDealsCount) * 100),
    totalValue: totalDeals.filter(d => d.stage === "Negotiation").reduce((acc, d) => acc + d.value, 0),
    color: "#f59e0b",
    deals: totalDeals.filter(d => d.stage === "Negotiation")
  },
  {
    stage: "Won",
    count: totalDeals.filter(d => d.stage === "Won").length,
    percentage: Math.round((totalDeals.filter(d => d.stage === "Won").length / totalDealsCount) * 100),
    totalValue: totalDeals.filter(d => d.stage === "Won").reduce((acc, d) => acc + d.value, 0),
    color: "#2563eb",
    deals: totalDeals.filter(d => d.stage === "Won")
  },
  {
    stage: "Lost",
    count: totalDeals.filter(d => d.stage === "Lost").length,
    percentage: Math.round((totalDeals.filter(d => d.stage === "Lost").length / totalDealsCount) * 100),
    totalValue: totalDeals.filter(d => d.stage === "Lost").reduce((acc, d) => acc + d.value, 0),
    color: "#ef4444",
    deals: totalDeals.filter(d => d.stage === "Lost")
  }
];

export const openDeals = totalDeals.filter(d => d.stage !== "Won" && d.stage !== "Lost");
export const wonDeals = totalDeals.filter(d => d.stage === "Won");
export const lostDeals = totalDeals.filter(d => d.stage === "Lost");


export const totalLeads = [
  {
    id: "L001",
    name: "ABC Technologies",
    contact: "Aarav Mehta",
    email: "aarav@abctech.com",
    phone: "+91 98765 43210",
    tier: "Growth",
    avatarInitials: "AB",
    value: "$38,500",
    numericValue: 38500,
    status: "Active",
    statusType: "active",
    source: "Website",
    assignedTo: "Sarah Jenkins",
    date: "10 mins ago"
  },
  {
    id: "L002",
    name: "NovaStack Labs",
    contact: "Meera Iyer",
    email: "meera@novastack.io",
    phone: "+91 98451 23456",
    tier: "Pro",
    avatarInitials: "NO",
    value: "$24,200",
    numericValue: 24200,
    status: "Active",
    statusType: "active",
    source: "LinkedIn",
    assignedTo: "David Miller",
    date: "45 mins ago"
  },
  {
    id: "L003",
    name: "BlueOrbit Systems",
    contact: "Rahul Nair",
    email: "rahul@blueorbit.com",
    phone: "+91 97123 45678",
    tier: "Starter",
    avatarInitials: "BL",
    value: "$12,800",
    numericValue: 12800,
    status: "Pending",
    statusType: "pending",
    source: "Organic",
    assignedTo: "Elena Rostova",
    date: "2 hours ago"
  },
  {
    id: "L004",
    name: "Vertex Commerce",
    contact: "Sana Khan",
    email: "sana@vertexcom.com",
    phone: "+91 99887 65432",
    tier: "Growth",
    avatarInitials: "VE",
    value: "$46,000",
    numericValue: 46000,
    status: "Active",
    statusType: "active",
    source: "Referral",
    assignedTo: "Marcus Vance",
    date: "4 hours ago"
  },
  {
    id: "L005",
    name: "Apex Dynamics",
    contact: "Vikram Malhotra",
    email: "vikram@apexdyn.com",
    phone: "+91 96543 21098",
    tier: "Enterprise",
    avatarInitials: "AD",
    value: "$78,500",
    numericValue: 78500,
    status: "Qualified",
    statusType: "qualified",
    source: "Website",
    assignedTo: "Sarah Jenkins",
    date: "Yesterday"
  },
  {
    id: "L006",
    name: "CloudPulse Networks",
    contact: "Emily Watson",
    email: "emily@cloudpulse.net",
    phone: "+91 95432 10987",
    tier: "Pro",
    avatarInitials: "CP",
    value: "$19,400",
    numericValue: 19400,
    status: "Pending",
    statusType: "pending",
    source: "Cold Outreach",
    assignedTo: "David Miller",
    date: "Yesterday"
  },
  {
    id: "L007",
    name: "Nexus Infotech",
    contact: "Rohan Gupta",
    email: "rohan@nexusinfo.com",
    phone: "+91 94321 09876",
    tier: "Growth",
    avatarInitials: "NI",
    value: "$31,000",
    numericValue: 31000,
    status: "Qualified",
    statusType: "qualified",
    source: "LinkedIn",
    assignedTo: "Sarah Jenkins",
    date: "2 days ago"
  },
  {
    id: "L008",
    name: "Zenith Software",
    contact: "Pooja Hegde",
    email: "pooja@zenithsw.com",
    phone: "+91 93210 98765",
    tier: "Enterprise",
    avatarInitials: "ZS",
    value: "$55,000",
    numericValue: 55000,
    status: "Contacted",
    statusType: "active",
    source: "Website",
    assignedTo: "Marcus Vance",
    date: "3 days ago"
  },
  {
    id: "L009",
    name: "Quantum Robotics",
    contact: "Aditya Roy",
    email: "aditya@quantumrob.com",
    phone: "+91 92109 87654",
    tier: "Pro",
    avatarInitials: "QR",
    value: "$28,500",
    numericValue: 28500,
    status: "Contacted",
    statusType: "active",
    source: "Referral",
    assignedTo: "Elena Rostova",
    date: "3 days ago"
  },
  {
    id: "L010",
    name: "InnoWave Solutions",
    contact: "Tanvi Deshmukh",
    email: "tanvi@innowave.com",
    phone: "+91 91098 76543",
    tier: "Starter",
    avatarInitials: "IW",
    value: "$9,500",
    numericValue: 9500,
    status: "Unqualified",
    statusType: "pending",
    source: "Cold Outreach",
    assignedTo: "David Miller",
    date: "4 days ago"
  }
];

export const leads = totalLeads;
export const recentLeads = totalLeads.slice(0, 6);
const totalLeadsCount = totalLeads.length;

export const leadsByStatus = [
  {
    label: 'Qualified',
    count: totalLeads.filter(l => l.status === 'Qualified').length,
    percentage: Math.round((totalLeads.filter(l => l.status === 'Qualified').length / totalLeadsCount) * 100),
    color: '#10b981',
    bgLight: '#ecfdf5',
    leads: totalLeads.filter(l => l.status === 'Qualified')
  },
  {
    label: 'Contacted',
    count: totalLeads.filter(l => l.status === 'Contacted').length,
    percentage: Math.round((totalLeads.filter(l => l.status === 'Contacted').length / totalLeadsCount) * 100),
    color: '#2563eb',
    bgLight: '#eff6ff',
    leads: totalLeads.filter(l => l.status === 'Contacted')
  },
  {
    label: 'Active',
    count: totalLeads.filter(l => l.status === 'Active').length,
    percentage: Math.round((totalLeads.filter(l => l.status === 'Active').length / totalLeadsCount) * 100),
    color: '#06b6d4',
    bgLight: '#ecfeff',
    leads: totalLeads.filter(l => l.status === 'Active')
  },
  {
    label: 'Pending',
    count: totalLeads.filter(l => l.status === 'Pending').length,
    percentage: Math.round((totalLeads.filter(l => l.status === 'Pending').length / totalLeadsCount) * 100),
    color: '#f59e0b',
    bgLight: '#fffbeb',
    leads: totalLeads.filter(l => l.status === 'Pending')
  },
  {
    label: 'Unqualified',
    count: totalLeads.filter(l => l.status === 'Unqualified').length,
    percentage: Math.round((totalLeads.filter(l => l.status === 'Unqualified').length / totalLeadsCount) * 100),
    color: '#94a3b8',
    bgLight: '#f1f5f9',
    leads: totalLeads.filter(l => l.status === 'Unqualified')
  }
];


export const qualifiedLeads = totalLeads.filter(l => l.status === 'Qualified');
export const activeLeads = totalLeads.filter(l => l.status === 'Active');
export const pendingLeads = totalLeads.filter(l => l.status === 'Pending');
export const contactedLeads = totalLeads.filter(l => l.status === 'Contacted');
export const unqualifiedLeads = totalLeads.filter(l => l.status === 'Unqualified');


export const getLeadsByStatus = (status) => {
  if (!status || status === 'All') return totalLeads;
  return totalLeads.filter(l => l.status.toLowerCase() === status.toLowerCase());
};


export const getDealsByStage = (stage) => {
  if (!stage || stage === 'All') return totalDeals;
  return totalDeals.filter(d => d.stage.toLowerCase() === stage.toLowerCase());
};


export const calculateDealsRevenue = (stageFilter = null) => {
  const targetDeals = stageFilter
    ? totalDeals.filter(d => d.stage.toLowerCase() === stageFilter.toLowerCase())
    : totalDeals;
  return targetDeals.reduce((sum, d) => sum + (d.value || 0), 0);
};


export const quickActions = [
  { id: 'new-lead', label: 'Add New Lead', icon: 'UserPlus' },
  { id: 'create-deal', label: 'Create Deal', icon: 'Handshake' },
  { id: 'add-task', label: 'Assign Task', icon: 'CheckSquare' },
  { id: 'export-report', label: 'Export Data', icon: 'Download' }
];

export const initialTasks = [
  { id: 'TSK-101', title: 'Follow up with ABC Technologies', client: 'ABC Technologies', assignedTo: 'Sarah Jenkins', due: 'Today, 5:00 PM', priority: 'High', completed: false },
  { id: 'TSK-102', title: 'Prepare proposal for Cloud Migration', client: 'TechNova Solutions', assignedTo: 'Arjun Kumar', due: 'Tomorrow', priority: 'Medium', completed: false },
  { id: 'TSK-103', title: 'Schedule product demo for Skyline Logistics', client: 'Skyline Logistics', assignedTo: 'Vikram Singh', due: 'Oct 10, 2026', priority: 'High', completed: true },
  { id: 'TSK-104', title: 'Send contract renewal to Vertex Commerce', client: 'Vertex Commerce', assignedTo: 'Marcus Vance', due: 'Oct 12, 2026', priority: 'Low', completed: false },
  { id: 'TSK-105', title: 'Security review checklist with NovaStack', client: 'NovaStack Labs', assignedTo: 'David Miller', due: 'Oct 14, 2026', priority: 'Medium', completed: false },
  { id: 'TSK-106', title: 'Quarterly billing alignment call', client: 'GreenLeaf Industries', assignedTo: 'Meena Patel', due: 'Oct 15, 2026', priority: 'High', completed: false },
];
export const tasksList = initialTasks;
export const tasks = initialTasks;

export const teamMembers = [
  { id: 'TM-01', name: 'Sarah Jenkins', role: 'Sales Lead', email: 'sarah.j@crmclient.com', dealsClosed: 5, revenueWon: '₹42.5L', status: 'Active' },
  { id: 'TM-02', name: 'David Miller', role: 'Account Executive', email: 'david.m@crmclient.com', dealsClosed: 9, revenueWon: '₹28.0L', status: 'Active' },
  { id: 'TM-03', name: 'Elena Rostova', role: 'Customer Success', email: 'elena.r@crmclient.com', dealsClosed: 2, revenueWon: '₹34.2L', status: 'Active' },
  { id: 'TM-04', name: 'Marcus Vance', role: 'Senior Sales Rep', email: 'marcus.v@crmclient.com', dealsClosed: 7, revenueWon: '₹61.0L', status: 'Active' },
  { id: 'TM-05', name: 'Ravi Kiran', role: 'Regional Sales VP', email: 'ravi.k@crmclient.com', dealsClosed: 4, revenueWon: '₹75.4L', status: 'Active' },
  { id: 'TM-06', name: 'Meena Patel', role: 'Enterprise Strategist', email: 'meena.p@crmclient.com', dealsClosed: 6, revenueWon: '₹53.8L', status: 'Active' },
];

export const productsList = [
  { id: 'PRD-001', name: 'CRM Enterprise Suite', category: 'Software & SaaS', price: '₹85,000 / mo', billing: 'Annual Billing', inventory: 'Enterprise Edition · Unlimited Seats', status: 'Active' },
  { id: 'PRD-002', name: 'Cloud Pipeline Automation', category: 'Cloud Services', price: '₹45,000 / mo', billing: 'Monthly Billing', inventory: 'Standard Tier · Up to 50 Pipelines', status: 'Active' },
  { id: 'PRD-003', name: 'AI Lead Scoring Engine', category: 'AI & Intelligence', price: '₹60,000 / mo', billing: 'Quarterly Billing', inventory: 'Add-on · Real-time Analytics', status: 'Active' },
  { id: 'PRD-004', name: 'ERP Sync Integration Connector', category: 'Integration', price: '₹35,000 / mo', billing: 'Annual Billing', inventory: 'Connector Module · Multi-platform', status: 'Active' },
  { id: 'PRD-005', name: 'Omnichannel Helpdesk & Tickets', category: 'Customer Support', price: '₹50,000 / mo', billing: 'Annual Billing', inventory: 'Support Suite · 24/7 SLA', status: 'Active' },
  { id: 'PRD-006', name: 'Custom Workflow Consulting', category: 'Professional Services', price: '₹1,20,000', billing: 'One-Time', inventory: 'Implementation Package · 40 hrs', status: 'Active' },
];
export const products = productsList;

export const employeesList = [
  { id: 'EMP-001', name: 'Ravi Kiran', email: 'ravi.k@crmclient.com', department: 'Sales & Accounts', role: 'Regional Manager', phone: '+91 98111 22233', status: 'Full-time' },
  { id: 'EMP-002', name: 'Arjun Kumar', email: 'arjun.k@crmclient.com', department: 'Solutions & Deals', role: 'Senior Account Manager', phone: '+91 98222 33344', status: 'Full-time' },
  { id: 'EMP-003', name: 'Meena Patel', email: 'meena.p@crmclient.com', department: 'Enterprise Sales', role: 'Business Development', phone: '+91 98333 44455', status: 'Full-time' },
  { id: 'EMP-004', name: 'Kavita Menon', email: 'kavita.m@crmclient.com', department: 'Customer Success', role: 'Operations Lead', phone: '+91 98444 55566', status: 'Full-time' },
  { id: 'EMP-005', name: 'Vikram Malhotra', email: 'vikram.m@crmclient.com', department: 'Technical Support', role: 'Solutions Architect', phone: '+91 98555 66677', status: 'Full-time' },
  { id: 'EMP-006', name: 'Ananya Rao', email: 'ananya.r@crmclient.com', department: 'Product Marketing', role: 'Growth Specialist', phone: '+91 98666 77788', status: 'Contract' },
];
export const employees = employeesList;