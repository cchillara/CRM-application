import { Children } from "react";
import "./DataTable.css";

function DataTable({
  headers = [],
  children,
  emptyMessage = "No records to display.",
  tableClassName = "",
}) {
  const hasRows = Children.count(children) > 0;

  return (
    <div className="data-table-scroll">
      <table className={`data-table ${tableClassName}`.trim()}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? children : (
            <tr>
              <td className="data-table-empty" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
