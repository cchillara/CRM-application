import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./DetailPopup.css";

export default function DetailPopup({
  isOpen,
  onClose,
  title,
  tier,
  phone,
  subtitle,
  badges,
  tabs,
  activeTab,
  onTabChange,
  footerActions,
  children,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="crm-slideover-backdrop" onClick={onClose} role="presentation">
      <aside
        className="crm-slideover-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="crm-slideover-header">
          <div className="crm-slideover-title-group">
            {title && <h2 className="crm-slideover-title">{title}</h2>}
            <div className="crm-slideover-badges">
              {tier && <span className="crm-tier-tag">{tier} Tier</span>}
              {phone && <span className="crm-phone-subtitle"> . Ph No : {phone}</span>}
              {subtitle && !phone && <span className="crm-phone-subtitle"> . {subtitle}</span>}
              {badges}
            </div>
          </div>
          <button
            type="button"
            className="crm-slideover-close-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        {Array.isArray(tabs) && tabs.length > 0 && (
          <div className="crm-slideover-tab-bar" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`crm-slideover-tab-btn ${isActive ? "active" : ""}`}
                  onClick={() => onTabChange?.(tab.id)}
                >
                  {Icon && <Icon size={15} />}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge !== null && (
                    <span className="crm-slideover-tab-badge">{tab.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="crm-slideover-body">
          {children}
        </div>

        {/* Footer Actions */}
        {footerActions && (
          <div className="crm-popup-actions">
            {footerActions}
          </div>
        )}
      </aside>
    </div>
  );
}

