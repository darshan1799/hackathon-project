import React, { useState, useEffect } from 'react'
import { contactsAPI, alertsAPI, systemAPI, authAPI } from './api'
import Dashboard from './Dashboard'
import ContactManager from './ContactManager'
import AlertSimulator from './AlertSimulator'
import AlertHistory from './AlertHistory'
import Login from './Login'
import ModelTesting from './components/ModelTesting'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
      checkHealth()
      loadStats()
    }
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

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    checkHealth()
    loadStats()
  }


  const handleLogout = async () => {
    await authAPI.logout()
    setUser(null)
    setIsAuthenticated(false)
    setActiveTab('dashboard')
  }

  // If not authenticated, show admin login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Coastal Threat Alert System</h1>
        <div className="system-status">
          <div className="user-info">
            <span className="user-name">👤 Admin: {user?.name}</span>
            <span className="admin-badge">Admin</span>
          </div>
          {health && (
            <span className={`status-badge ${health.status === 'ok' ? 'status-ok' : 'status-error'}`}>
              System: {health.status === 'ok' ? 'Online' : 'Offline'}
            </span>
          )}
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
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
        <button 
          className={activeTab === 'testing' ? 'active' : ''} 
          onClick={() => setActiveTab('testing')}
        >
          Model Testing
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard stats={stats} onRefresh={loadStats} />}
        {activeTab === 'contacts' && <ContactManager />}
        {activeTab === 'simulator' && <AlertSimulator onAlertSent={loadStats} />}
        {activeTab === 'history' && <AlertHistory />}
        {activeTab === 'testing' && <ModelTesting />}
      </main>

      <footer className="footer">
        <p>Coastal Threat Alert System v1.0.0 | Real-time monitoring and alert system</p>
      </footer>
    </div>
  )
}