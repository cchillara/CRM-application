import React from "react";


//  Dashboard(active users, products purchased, current subscriptions, tickets),
//  Organization(Users & Roles,Address, Contact Information, Industry),
//  Products & services (Name, Status, Start date, Due date),
//  Support Tickets(active tickets, view All tickets, create ticket, ticket status, track request), 
//  Billing (Invoices, Agreements, Total Amount, Paid Amount, AMount for each product, reports),
//  Notifications
//  Log out

export const CLIENT_COMPANY_DETAILS = () => {
    return {
        name: "XYZ Technologies",
        id: "XYZ12345",
        service: "Enterprise level &  SAP",
        users: [
            { name: "Ravi kiran", role: "Manager", email: "ravi@xyz.com" },
            { name: "Shreya Ghoshal", role: "Employee", email: "shreya@xyz.com" },
            { name: "Arjun Sarkar", role: "Support User", email: "arjun@xyz.com" },
            { name: "Mithi Agarwal", role: "Finance User", email: "mithi@xyz.com" },
        ],
        address: "QW-FX, XYZ Colony, UL Nagar, Uttarakhand, India, 12345",
        PrimaryContact: "Rahul Sharma, IT Manager, rahul@xyz.com, +91 98765 43210",
        CompanyContact: "contact@xyz.com, +91 22 555 8976",
        website: "www.xyztcehnologies.com",
    };

}

export const CLIENT_COMPANY_CONTRACTS = () => {

    return [
        {
            contractId: "CTR - 2026-211200",
            customer: "XYZ Technologies",
            contractType: "Agent Integration",
            startDate: "13-04-2026",
            endDate: "25-12-2026",
            status: "Active",
            progress: "54%",
            contractValue: 12300,
            billingCycle: "Annaual",
            accountManager: "Draco Malfoy",
        },
        {
            contractId: "CTR - 2025-00123",
            customer: "XYZ Technologies",
            contractType: "Software Update",
            startDate: "03-03-2065",
            endDate: "24-04-2027",
            status: "Active",
            progress: "72%",
            contractValue: 45000,
            billingCycle: "Annaual",
            accountManager: "Rahul Kumar",
        },
        {
            contractId: "CTR - 2024-87610",
            customer: "XYZ Technologies",
            contractType: "Software Maintenance",
            startDate: "07-03-2024",
            endDate: "26-11-2025",
            status: "Completed",
            progress: "100%",
            contractValue: 21260,
            billingCycle: "Annaual",
            accountManager: "Hermonie Granger",
        },
        {
            contractId: "CTR - 2025-00123",
            customer: "XYZ Technologies",
            contractType: "Gaming Application Review",
            startDate: "07-03-2020",
            endDate: "26-03-2021",
            status: "Completed",
            progress: "100%",
            contractValue: 48000,
            billingCycle: "Annaual",
            accountManager: "Ravi Kumar",
        },
        {
            contractId: "CTR - 2025-456",
            customer: "XYZ Technologies",
            contractType: "Application Building",
            startDate: "03-10-2025",
            endDate: "12-10-2026",
            status: "In-Review",
            progress: "85%",
            contractValue: 32100,
            billingCycle: "Annaual",
            accountManager: "Ginne Weasley",
        },
    ]


}


export const CLIENT_COMPANY_FINANCE = () => {
    return {
        biilingMail: "xyz@xyz.com",
        billingPerson: "Riya Sharma",
        billingCycle: "Annual",
        contact: "+91 457861252",
        currency: "$",
        GSTIN: "29XXXXXXXXXX1Z5",
        country: "India",
        state: "Uttarakhand",
        pincode: "12345",

    }
}

export const CLIENT_COMPANY_TICKETS = () => {

    return [
        {
            name: "Elements Not Accessible",
            TNO: "#TICK3245",
            CreatedDate: "23-08-2024",
            Status: "Pending",
        },
        {
            name: "Server issue ",
            TNO: "#TICK8765",
            CreatedDate: "23-08-2024",
            Status: "Pending",
        },
        {
            name: "ChatBot No-response",
            TNO: "#TICK2112",
            CreatedDate: "23-08-2024",
            Status: "Pending",
        },
        {
            name: "Unable to push leads",
            TNO: "#TICK7320",
            CreatedDate: "23-08-2024",
            Status: "Pending",
        }
    ];

}