import { useEffect, useMemo, useState } from "react";
import Status from "../components/Status";
import { usePlatform } from "../context/PlatformContext";

export default function Support() {
  const { data, apiError, replyTicket, restoreSampleTickets } = usePlatform();
  const [selectedId, setSelectedId] = useState(data.tickets[0]?.id || "");
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const selected = useMemo(() => data.tickets.find((ticket) => ticket.id === selectedId), [data.tickets, selectedId]);

  useEffect(() => {
    if (!selected && data.tickets[0]) setSelectedId(data.tickets[0].id);
  }, [data.tickets, selected]);

  async function sendReply(event) {
    event.preventDefault();
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    setTicketError("");
    try {
      await replyTicket(selected.id, reply);
    } catch (error) {
      setTicketError(error.message || "Could not save reply");
      setSending(false);
      return;
    }
    setReply("");
    setSent(true);
    window.setTimeout(() => setSent(false), 2500);
    setSending(false);
  }

  async function loadSamples() {
    setTicketError("");
    try { await restoreSampleTickets(); }
    catch (error) { setTicketError(error.message || "Could not load sample queries"); }
  }

  return (
    <section className="support-page">
      <section className="support-layout">
        {(ticketError || apiError) && <div className="inline-error" role="alert">{ticketError || apiError}</div>}
        <div className="panel support-list-panel">
          <div className="panel-title">
              <div><h3>Organization Queries</h3><p>{data.tickets.length} queries</p></div>
          </div>
          {data.tickets.length ? (
            <div className="ticket-list">
              {data.tickets.map((ticket) => {
                const org = data.organizations.find((item) => item.id === ticket.orgId);
                return (
                  <button className={`ticket-item ${selectedId === ticket.id ? "selected" : ""}`} key={ticket.id} onClick={() => { setSelectedId(ticket.id); setSent(false); }}>
                  <div><strong>{ticket.subject}</strong><span>{org?.name || ticket.organizationName || ticket.orgId || "Platform"} · {ticket.id}</span></div>
                    <Status value={ticket.status} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="support-empty"><p>No support queries yet.</p><button className="secondary-button" onClick={loadSamples}>Load sample queries</button></div>
          )}
        </div>

        <div className="panel support-detail-panel">
          {selected ? (
            <>
              <div className="ticket-heading"><div><h2>{selected.subject}</h2><p>{selected.id} · {selected.category} · {selected.createdAt}</p></div><Status value={selected.status} /></div>
              <div className="query-box"><span>Organization query · {selected.priority} priority</span><p>{selected.message}</p></div>
              <div className="reply-history">
                <h3>Replies <span className="record-count">{selected.replies.length}</span></h3>
                {selected.replies.length === 0 ? <p className="empty-text">No reply yet. Send a response below.</p> : selected.replies.map((item) => (
                  <div className="reply-item" key={item.id}><div><strong>{item.by}</strong><span>{item.createdAt}</span></div><p>{item.message}</p></div>
                ))}
              </div>
              <form className="reply-form" onSubmit={sendReply}>
                <label>Reply to this query<textarea required rows="4" placeholder="Write a helpful response..." value={reply} onChange={(event) => setReply(event.target.value)} /></label>
                {ticketError && <div className="inline-error" role="alert">{ticketError}</div>}
                <div>{sent && <span role="status">Reply saved.</span>}<button className="primary-button" disabled={!reply.trim() || sending}>{sending ? "Sending…" : "Send Reply"}</button></div>
              </form>
            </>
          ) : <div className="support-empty"><h3>Select a query</h3><p>Choose a sample query to review its details and reply.</p></div>}
        </div>
      </section>
      <p className="form-note support-storage-note">Replies and support queries are stored by the CRM backend.</p>
    </section>
  );
}
