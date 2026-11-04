import { Plus } from "lucide-react";
import "./AddButton.css";

function AddButton({ children, onClick }) {
  return (
    <button className="sales-add-button" type="button" onClick={onClick}>
      <Plus size={17} strokeWidth={2} aria-hidden="true" />
      {children}
    </button>
  );
}

export default AddButton;
