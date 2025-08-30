import React, { useState, useEffect } from 'react'
import { alertsAPI } from './api'

export default function AlertHistory() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    loadLogs()
  }, [limit])

  async function loadLogs() {
    setLoading(true)
    try {
      const data = await alertsAPI.getLogs(limit)
      setLogs(data)
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
    setLoading(false)
  }

  function getSeverityFromValue(metric, value, threshold) {
    if (value > threshold * 1.5) return 'CRITICAL'
    if (value > threshold) return 'HIGH'
    return 'NORMAL'
  }

  function getSeverityClass(severity) {
    switch(severity) {
      case 'CRITICAL': return 'severity-critical'
      case 'HIGH': return 'severity-high'
      default: return 'severity-normal'
    }
  }

  return (
    <div className="alert-history">
      <h2>Alert History</h2>
      
      <div className="history-controls">
        <label>
          Show last: 
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
        <button onClick={loadLogs} className="btn-secondary">Refresh</button>
      </div>

      {loading ? (
        <p>Loading alert history...</p>
      ) : logs.length === 0 ? (
        <p className="no-data">No alerts have been triggered yet.</p>
      ) : (
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Metric</th>
                <th>Value</th>
                <th>Threshold</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const severity = getSeverityFromValue(log.metric, log.value, log.threshold)
                return (
                  <tr key={log.id} className={log.sent ? 'alert-sent' : ''}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>{log.metric.replace(/_/g, ' ')}</td>
                    <td className={log.value > log.threshold ? 'value-high' : ''}>
                      {log.value.toFixed(2)}
                    </td>
                    <td>{log.threshold.toFixed(2)}</td>
                    <td>
                      <span className={`severity-badge ${getSeverityClass(severity)}`}>
                        {severity}
                      </span>
                    </td>
                    <td>
                      {log.sent ? (
                        <span className="status-badge status-sent">Sent</span>
                      ) : (
                        <span className="status-badge status-normal">Normal</span>
                      )}
                    </td>
                    <td className="message-cell">
                      {log.message || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="history-stats">
        <p>Total records shown: {logs.length}</p>
        <p>Alerts triggered: {logs.filter(l => l.sent).length}</p>
      </div>
    </div>
  )
}