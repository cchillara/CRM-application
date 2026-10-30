import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import "../styles/SidePanel.css"

export default function SidePanel({
  isOpen, 
  onClose,
  title,
  kicker,
  badges,
  tabs,
  activeTab,
  onTabChange,
  ariaLabelledBy = 'slideover-panel-title',
  className = '',
  width,
  headerActions,
  children
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="crm-slideover-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className={`crm-slideover-panel ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        style={width ? { width } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="crm-slideover-header">
          <div className="crm-slideover-title-group">
            {kicker && <span className="crm-slideover-kicker">{kicker}</span>}
            {title && (
              <h2 id={ariaLabelledBy} className="crm-slideover-title">
                {title}
              </h2>
            )}
            {badges && <div className="crm-slideover-badges">{badges}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {headerActions}
            <button
              type="button"
              className="crm-slideover-close-btn"
              aria-label="Close panel"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

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
                  className={`crm-slideover-tab-btn ${isActive ? 'active' : ''}`}
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

        <div className="crm-slideover-body">
          {children}
        </div>
      </aside>
    </div>
  );
}



// SidePanel.Section = SidePanelSection;
// SidePanel.DetailGrid = SidePanelDetailGrid;
// SidePanel.DetailItem = SidePanelDetailItem;
