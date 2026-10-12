
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

function formatNoteActivity(activity, relatedTo) {
  const description = activity.description || "";
  const [firstLine, ...body] = description.split("\n");
  const hasTitle = body.length > 0;

  return {
    ...activity,
    title: hasTitle ? firstLine : "Note",
    content: hasTitle ? body.join("\n") : description,
    relatedTo,
  };
}

export function SalesDataProvider({ children }) {
  const [leads, setLeads] = useState(salesLeads);
  const [customers, setCustomers] = useState(salesCustomers);
  const [unlinkedNotes, setUnlinkedNotes] = useState([]);

  const notes = [
    ...leads.flatMap((lead) => (lead.activities || [])
      .filter((activity) => activity.type === "NOTE")
      .map((activity) => formatNoteActivity(activity, {
        type: "Lead",
        id: lead.id,
        name: getLeadContactName(lead),
      }))),
    ...customers.flatMap((customer) => (customer.activities || [])
      .filter((activity) => activity.type === "NOTE")
      .map((activity) => formatNoteActivity(activity, {
        type: "Customer",
        id: customer.id,
        name: customer.name,
      }))),
    ...unlinkedNotes.map((activity) => formatNoteActivity(activity, null)),
  ];

  const addNote = (values) => {
    const now = new Date().toISOString();
    const activity = {
      id: `note-${Date.now()}`,
      type: "NOTE",
      description: `${values.title.trim()}\n${values.content.trim()}`,
      createdAt: now,
      updatedAt: now,
    };

    if (values.relatedType === "Lead") {
      setLeads((currentLeads) => currentLeads.map((lead) => lead.id === values.relatedId
        ? { ...lead, activities: [...(lead.activities || []), activity] }
        : lead));
    } else if (values.relatedType === "Customer") {
      setCustomers((currentCustomers) => currentCustomers.map((customer) => customer.id === values.relatedId
        ? { ...customer, activities: [...(customer.activities || []), activity] }
        : customer));
    } else {
      setUnlinkedNotes((currentNotes) => [activity, ...currentNotes]);
    }
  };

  const updateNote = (note, values) => {
    const activity = {
      id: note.id,
      type: "NOTE",
      description: `${values.title.trim()}\n${values.content.trim()}`,
      createdAt: note.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const oldRelated = note.relatedTo;

    setLeads((currentLeads) => currentLeads.map((lead) => {
      const isSource = oldRelated?.type === "Lead" && lead.id === oldRelated.id;
      const isTarget = values.relatedType === "Lead" && lead.id === values.relatedId;
      if (!isSource && !isTarget) return lead;
      const activities = (lead.activities || []).filter((item) => item.id !== note.id);
      if (isTarget) activities.push(activity);
      return { ...lead, activities };
    }));

    setCustomers((currentCustomers) => currentCustomers.map((customer) => {
      const isSource = oldRelated?.type === "Customer" && customer.id === oldRelated.id;
      const isTarget = values.relatedType === "Customer" && customer.id === values.relatedId;
      if (!isSource && !isTarget) return customer;
      const activities = (customer.activities || []).filter((item) => item.id !== note.id);
      if (isTarget) activities.push(activity);
      return { ...customer, activities };
    }));

    setUnlinkedNotes((currentNotes) => {
      const remaining = currentNotes.filter((item) => item.id !== note.id);
      return values.relatedType ? remaining : [activity, ...remaining];
    });
  };

  const deleteNote = (note) => {
    if (note.relatedTo?.type === "Lead") {
      setLeads((currentLeads) => currentLeads.map((lead) => lead.id === note.relatedTo.id
        ? { ...lead, activities: (lead.activities || []).filter((activity) => activity.id !== note.id) }
        : lead));
    } else if (note.relatedTo?.type === "Customer") {
      setCustomers((currentCustomers) => currentCustomers.map((customer) => customer.id === note.relatedTo.id
        ? { ...customer, activities: (customer.activities || []).filter((activity) => activity.id !== note.id) }
        : customer));
    } else {
      setUnlinkedNotes((currentNotes) => currentNotes.filter((activity) => activity.id !== note.id));
    }
  };

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

  const addCustomer = (values) => {
    const today = new Date();
    const createdAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const customer = {
      id: `customer-${Date.now()}`,
      name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      status: values.status,
      lastContact: "No contact yet",
      assignedTo: "Subham Sharma",
      createdAt,
    };
    setCustomers((currentCustomers) => [customer, ...currentCustomers]);
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
    <SalesDataContext.Provider value={{ leads, customers, notes, addNote, updateNote, deleteNote, addLead, addCustomer, updateLeadStatus, deleteLead, convertLeadToCustomer }}>
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
