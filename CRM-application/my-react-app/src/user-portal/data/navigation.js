import {
  Bell, CalendarDays, ChartNoAxesColumnIncreasing, CheckSquare,
  CircleHelp, Handshake, LayoutDashboard, Settings, UserRound, Users
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Leads", icon: Users },
  { label: "My Deals", icon: Handshake },
  { label: "Tasks", icon: CheckSquare },
  { label: "Reports", icon: ChartNoAxesColumnIncreasing },
  { label: "Notifications", icon: Bell },
  { label: "Calendar", icon: CalendarDays },
  { label: "Help", icon: CircleHelp },
  { label: "Settings", icon: Settings }
];

export const pageMeta = {
  Dashboard: ["Your assigned leads, deals, and follow-ups at a glance.", LayoutDashboard],
  "My Leads": ["Manage and follow up on the leads assigned to you.", Users],
  "My Deals": ["Track your opportunities and move deals through the pipeline.", Handshake],
  Tasks: ["Review your follow-ups, reminders, and upcoming work.", CheckSquare],
  Reports: ["See your sales performance and activity at a glance.", ChartNoAxesColumnIncreasing],
  Notifications: ["Updates and reminders for your CRM activity.", Bell],
  Calendar: ["Keep track of your meetings and follow-ups.", CalendarDays],
  Help: ["Find guidance and support for your CRM workspace.", CircleHelp],
  Settings: ["Manage your personal preferences and workspace settings.", Settings],
  Account: ["Manage your profile details and account security.", UserRound]
};
