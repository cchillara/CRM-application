
/* I'M  Using this context for temperoary storage to avoid the props drilling so that datas can be updated directly here in the context using the providers 
instead of updating in every file ... when the api calls start this context wont be used as the source of truth for any of the fucntionalities */

import { createContext, useContext, useState } from "react";
import { salesCustomers } from "../../data/salesCustomersData.js";
import { salesLeads } from "../../data/salesLeadsData.js";

const SalesDataContext = createContext(null);

export function getLeadContactName(lead) {
  return [lead.contact?.firstName, lead.contact?.lastName].filter(Boolean).join(" ") || lead.title;
}

export function getLeadLastContact(lead) {
  const latestActivity = [...(lead.activities || [])]
    .sort((first, second) => (second.createdAt || "").localeCompare(first.createdAt || ""))[0];

  if (!latestActivity) {
    return "—";
  }

  return latestActivity.createdAt;
}

export function SalesDataProvider({ children }) {
  const [leads, setLeads] = useState(salesLeads);
  const [customers, setCustomers] = useState(salesCustomers);

  const addLead = (values) => {
    const now = new Date().toISOString();
    const id = `lead-${Date.now()}`;
    const contactId = `contact-${id}`;
    const companyId = values.company.trim() ? `company-${id}` : null;
    const company = companyId ? {
      id: companyId,
      name: values.company.trim(),
      email: null,
      phone: null,
      website: null,
      address: "",
      city: "",
      state: "",
      country: "",
      createdAt: now,
      updatedAt: now,
    } : null;
    const lead = {
      id,
      title: values.title.trim(),
      description: values.description.trim(),
      status: "NEW",
      source: values.source,
      companyId,
      contactId,
      assignedToId: "user-001",
      convertedAt: null,
      convertedById: null,
      customerId: null,
      createdAt: now,
      updatedAt: now,
      assignedTo: { id: "user-001", firstName: "Subham", lastName: "Sharma" },
      contact: {
        id: contactId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        jobTitle: values.jobTitle.trim() || null,
      },
      company,
      tasks: [],
      activities: [],
    };
    setLeads((currentLeads) => [lead, ...currentLeads]);
  };

  const updateLeadStatus = (leadId, status) => {
    setLeads((currentLeads) =>
      currentLeads.map((lead) => lead.id === leadId ? { ...lead, status } : lead)
    );
  };

  const deleteLead = (leadId) => {
    setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== leadId));
  };

  const convertLeadToCustomer = (leadId) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) {
      return false;
    }

    const alreadyConverted = customers.some((customer) => customer.convertedFromLeadId === leadId);
    if (alreadyConverted) {
      setLeads((currentLeads) => currentLeads.filter((item) => item.id !== leadId));
      return false;
    }

    const matchingCustomer = customers.find(
      (customer) => customer.email?.toLowerCase() === lead.contact?.email?.toLowerCase()
    );
    if (matchingCustomer) {
      setCustomers((currentCustomers) => currentCustomers.map((customer) =>
        customer.id === matchingCustomer.id
          ? { ...customer, convertedFromLeadId: leadId, status: "ACTIVE" }
          : customer
      ));
      setLeads((currentLeads) => currentLeads.filter((item) => item.id !== leadId));
      return true;
    }

    const today = new Date();
    const createdAt = today.getFullYear() + "-" +
      String(today.getMonth() + 1).padStart(2, "0") + "-" +
      String(today.getDate()).padStart(2, "0");
    const customer = {
      id: "customer-from-" + lead.id,
      convertedFromLeadId: lead.id,
      name: getLeadContactName(lead),
      company: lead.company?.name || "—",
      email: lead.contact?.email || "—",
      phone: lead.contact?.phone || "—",
      status: "ACTIVE",
      lastContact: getLeadLastContact(lead),
      assignedTo: [lead.assignedTo?.firstName, lead.assignedTo?.lastName].filter(Boolean).join(" ") || "Subham Sharma",
      createdAt,
    };

    setCustomers((currentCustomers) => {
      if (currentCustomers.some((item) =>
        item.convertedFromLeadId === leadId ||
        item.email?.toLowerCase() === lead.contact?.email?.toLowerCase()
      )) {
        return currentCustomers;
      }
      return [...currentCustomers, customer];
    });
    setLeads((currentLeads) => currentLeads.filter((item) => item.id !== leadId));
    return true;
  };

  return (
    <SalesDataContext.Provider value={{ leads, customers, addLead, updateLeadStatus, deleteLead, convertLeadToCustomer }}>
      {children}
    </SalesDataContext.Provider>
  );
}

export function useSalesData() {
  const context = useContext(SalesDataContext);
  if (!context) {
    throw new Error("useSalesData must be used inside SalesDataProvider");
  }
  return context;
}
