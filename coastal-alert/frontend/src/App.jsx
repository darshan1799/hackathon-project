import React, { useState, useEffect } from 'react'
import { contactsAPI, alertsAPI, systemAPI } from './api'
import Dashboard from './Dashboard'
import ContactManager from './ContactManager'
import AlertSimulator from './AlertSimulator'
import AlertHistory from './AlertHistory'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    checkHealth()
    loadStats()
  }, [])

  async function checkHealth() {
    try {
      const data = await systemAPI.health()
      setHealth(data)
    } catch (error) {
      console.error('API health check failed:', error)
      setHealth({ status: 'error', message: 'Cannot connect to backend' })
    }
  }

  async function loadStats() {
    try {
      const data = await systemAPI.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Coastal Threat Alert System</h1>
        <div className="system-status">
          {health && (
            <span className={`status-badge ${health.status === 'ok' ? 'status-ok' : 'status-error'}`}>
              System: {health.status === 'ok' ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
      </header>

      <nav className="nav-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'contacts' ? 'active' : ''} 
          onClick={() => setActiveTab('contacts')}
        >
          Contacts
        </button>
        <button 
          className={activeTab === 'simulator' ? 'active' : ''} 
          onClick={() => setActiveTab('simulator')}
        >
          Alert Simulator
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          Alert History
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard stats={stats} onRefresh={loadStats} />}
        {activeTab === 'contacts' && <ContactManager />}
        {activeTab === 'simulator' && <AlertSimulator onAlertSent={loadStats} />}
        {activeTab === 'history' && <AlertHistory />}
      </main>

      <footer className="footer">
        <p>Coastal Threat Alert System v1.0.0 | Real-time monitoring and alert system</p>
      </footer>
    </div>
  )
}