import { useState } from "react";
import DetailsModal from "../components/DetailsModal";

const plans = [
  { name: "Starter", price: "₹1,499", orgs: 41, users: "15 users" },
  { name: "Growth", price: "₹3,999", orgs: 52, users: "50 users" },
  { name: "Pro", price: "₹8,999", orgs: 35, users: "200 users" }
];

export default function Subscriptions() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <section className="stats-grid subscription-stats">
        <button className="stat-card" onClick={() => setSelected({title:"Monthly Revenue",rows:[["MRR","₹18.5L"],["Growth","+15.2%"]]})}><span>Monthly Revenue</span><strong>₹18.5L</strong><small>+15.2% this month</small></button>
        <button className="stat-card" onClick={() => setSelected({title:"Paid Organizations",rows:[["Paid","112"],["Conversion","87.5%"]]})}><span>Paid Organizations</span><strong>112</strong><small>87.5% conversion</small></button>
        <button className="stat-card" onClick={() => setSelected({title:"Failed Payments",rows:[["Failed","3"],["Status","Requires follow-up"]]})}><span>Failed Payments</span><strong>3</strong><small>Requires follow-up</small></button>
      </section>
      <section className="panel plans-panel">
        <div className="panel-title"><div><h3>Plans</h3><p>Current platform plans</p></div></div>
        <div className="plans-grid">
          {plans.map((plan)=><button className="plan" key={plan.name} onClick={()=>setSelected({title:`${plan.name} Plan`,rows:[["Price",`${plan.price}/month`],["Organizations",String(plan.orgs)],["User limit",plan.users]]})}><strong>{plan.name}</strong><span>{plan.price}/month</span><small>{plan.orgs} organizations</small></button>)}
        </div>
      </section>
      <DetailsModal title={selected?.title} rows={selected?.rows || []} onClose={() => setSelected(null)} />
    </>
  );
}
