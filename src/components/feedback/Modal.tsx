import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { NAV, type NavItem } from "../../utils/navigation";

export type ModalProps = {
  isOpen?: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
};

export function Modal({ onClose, onNavigate }: ModalProps) {
  const [filter, setFilter] = useState("");

  const filteredNav = NAV.filter((item) =>
    item.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-label="Command palette"
      onClick={onClose}
    >
      <div className="command-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-wrap">
          <Search size={16} />
          <input
            autoFocus
            placeholder="Jump to a workspace..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {filteredNav.map((n: NavItem) => (
          <button
            key={n}
            className="command-row"
            onClick={() => onNavigate(n)}
          >
            {n}
            <ChevronRight size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Keep CommandPalette alias
export { Modal as CommandPalette };
