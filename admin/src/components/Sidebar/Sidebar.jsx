import React from 'react'
import './Sidebar.css'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <aside className='admin-sidebar'>
      <div className="sidebar-top">
        <div className="sidebar-section-header">
          <span className="section-kicker">Management</span>
          <span className="section-pill">4 Tools</span>
        </div>

        <nav className="sidebar-options">
          {/* Add Items */}
          <NavLink
            to='/add'
            className={({ isActive }) => `sidebar-option add-opt ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="sidebar-text-wrap">
              <p className="sidebar-title">Add Items</p>
              <span className="sidebar-subtitle">Create new food dishes</span>
            </div>
            <div className="sidebar-active-indicator" />
          </NavLink>

          {/* List Items */}
          <NavLink
            to='/list'
            className={({ isActive }) => `sidebar-option list-opt ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
            <div className="sidebar-text-wrap">
              <p className="sidebar-title">List Items</p>
              <span className="sidebar-subtitle">Manage menu catalog</span>
            </div>
            <div className="sidebar-active-indicator" />
          </NavLink>

          {/* Orders */}
          <NavLink
            to='/orders'
            className={({ isActive }) => `sidebar-option orders-opt ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="sidebar-text-wrap">
              <p className="sidebar-title">Orders</p>
              <span className="sidebar-subtitle">Live orders & status</span>
            </div>
            <div className="sidebar-active-indicator" />
          </NavLink>

          {/* Customers */}
          <NavLink
            to='/customers'
            className={({ isActive }) => `sidebar-option customers-opt ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="sidebar-text-wrap">
              <p className="sidebar-title">Customers</p>
              <span className="sidebar-subtitle">User accounts & history</span>
            </div>
            <div className="sidebar-active-indicator" />
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-bottom">
        {/* Server & version badge */}
        <div className="sidebar-status-card">
          <div className="status-row">
            <span className="status-indicator">
              <span className="status-pulse-ring" />
              <span className="status-dot" />
            </span>
            <span className="status-text">Server Online</span>
          </div>
          <span className="version-tag">Admin v2.4</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
