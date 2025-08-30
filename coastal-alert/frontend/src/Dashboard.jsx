import React, { useEffect, useState } from 'react'
import { systemAPI } from './api'

export default function Dashboard({ stats, onRefresh }) {
  const [thresholds, setThresholds] = useState(null)

  useEffect(() => {
    loadThresholds()
  }, [])

  async function loadThresholds() {
    try {
      const data = await systemAPI.getThresholds()
      setThresholds(data)
    } catch (error) {
      console.error('Failed to load thresholds:', error)
    }
  }

  return (
    <div className="dashboard" style={{ display:'flex' , flexDirection:'column' }}>
      <h2>System Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Contacts</h3>
          <div className="stat-value">{stats?.total_contacts || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Alerts</h3>
          <div className="stat-value">{stats?.total_alerts || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Alerts Sent</h3>
          <div className="stat-value">{stats?.alerts_sent || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Alert Rate</h3>
          <div className="stat-value">
            {stats?.total_alerts > 0 
              ? `${((stats.alerts_sent / stats.total_alerts) * 100).toFixed(1)}%`
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="thresholds-section">
        <h3>Current Alert Thresholds</h3>
        {thresholds && (
          <table className="thresholds-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Threshold</th>
                <th>Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(thresholds).map(([key, value]) => (
                <tr key={key}>
                  <td>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                  <td>{value}</td>
                  <td>{getUnit(key)}</td>
                  <td><span className="status-badge status-ok">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="btn-primary" style={{ marginTop: '20px'}} onClick={onRefresh}>Refresh Stats</button>
    </div>
  )
}

function getUnit(metric) {
  const units = {
    water_level: 'meters',
    wind_speed: 'km/h',
    rainfall_24h: 'mm/24h',
    wave_height: 'meters',
    storm_surge: 'meters'
  }
  return units[metric] || ''
}