import React from 'react'
import "./StatCard.css"
import { ArrowUpRight } from 'lucide-react'

function StatCard({ label, value, change, trend }) {
    return (
        <div className="sales-stat-card">
            <div className="sales-stat-card-top">
                <span>{label}</span>

                <div className="sales-stat-card-icon">
                    <ArrowUpRight size={17} strokeWidth={1.8} />
                </div>
            </div>

            <div className="sales-stat-card-value">
                {value}
            </div>

            <div className={`sales-stat-card-change ${trend}`}>
                <ArrowUpRight size={14} strokeWidth={2} />
                <span>{change}</span>
                <span className="sales-stat-card-period">from last month</span>
            </div>
        </div>
    )
}

export default StatCard
