import { useState } from "react";
import DetailsModal from "../components/DetailsModal";
import Status from "../components/Status";
import { tickets } from "../data";

export default function Support() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <section className="panel page-panel">
        <div className="panel-title"><div><h3>Support Tickets</h3><p>Open organization requests</p></div></div>
        <div className="list">
          {tickets.map((ticket)=><button className="list-row support-row" key={ticket.id} onClick={()=>setSelected(ticket)}><div><strong>{ticket.subject}</strong><span>{ticket.id} · {ticket.organization}</span></div><Status value={ticket.status}/></button>)}
        </div>
      </section>
      <DetailsModal title={selected?.id} rows={selected ? [["Subject",selected.subject],["Organization",selected.organization],["Priority",selected.priority],["Status",selected.status]] : []} onClose={() => setSelected(null)} />
    </>
  );
}
