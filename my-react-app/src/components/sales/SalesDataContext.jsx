
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
    <SalesDataContext.Provider value={{ leads, customers, updateLeadStatus, deleteLead, convertLeadToCustomer }}>
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
