export default function Status({value}){return <span className={`status ${value.toLowerCase().replaceAll(" ","-")}`}>{value}</span>}
