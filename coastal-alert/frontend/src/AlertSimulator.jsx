import React, { useState, useEffect } from 'react'
import { alertsAPI, systemAPI } from './api'
import { COASTAL_REGIONS } from './constants'

export default function AlertSimulator({ onAlertSent }) {
  const [thresholds, setThresholds] = useState({})
  const [formData, setFormData] = useState({
    metric: 'water_level',
    value: '',
    location: ''
  })
  const [selectedStates, setSelectedStates] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

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

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    
    // Join selected states with pipe separator for backend processing
    const location = selectedStates.length > 0 ? selectedStates.join('|') : ''
    
    try {
      const response = await alertsAPI.trigger({
        metric: formData.metric,
        value: parseFloat(formData.value),
        location: location
      })
      setResult(response)
      if (response.alert && onAlertSent) {
        onAlertSent()
      }
    } catch (error) {
      console.error('Failed to trigger alert:', error)
      setResult({ error: true, message: 'Failed to trigger alert' })
    }
    
    setLoading(false)
  }
  
  function toggleState(state) {
    setSelectedStates(prev => {
      if (prev.includes(state)) {
        return prev.filter(s => s !== state)
      } else {
        return [...prev, state]
      }
    })
  }
  
  function selectAllStates() {
    setSelectedStates(COASTAL_REGIONS.map(r => r.value))
  }
  
  function clearSelection() {
    setSelectedStates([])
  }

  function getSeverityClass(severity) {
    switch(severity) {
      case 'CRITICAL': return 'severity-critical'
      case 'HIGH': return 'severity-high'
      default: return 'severity-normal'
    }
  }

  const currentThreshold = thresholds[formData.metric] || 0

  return (
    <div className="alert-simulator">
      <h2>Alert Simulator</h2>
      <p className="description">
        Simulate sensor readings to test the alert system. Values above the threshold will trigger alerts to all registered contacts.
      </p>

      <form onSubmit={handleSubmit} className="simulator-form">
        <div className="form-group">
          <label>Metric Type</label>
          <select 
            value={formData.metric} 
            onChange={(e) => setFormData({...formData, metric: e.target.value})}
          >
            {Object.keys(thresholds).map(key => (
              <option key={key} value={key}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                {' '}({getUnit(key)})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            Value ({getUnit(formData.metric)})
            <span className="threshold-hint">
              Threshold: {currentThreshold} {getUnit(formData.metric)}
            </span>
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: e.target.value})}
            placeholder={`Enter value (threshold: ${currentThreshold})`}
            required
          />
          {formData.value && (
            <div className="value-indicator">
              {parseFloat(formData.value) > currentThreshold ? (
                <span className="alert-trigger">⚠️ Will trigger alert</span>
              ) : (
                <span className="no-alert">✓ Below threshold</span>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            Target Locations
            <span className="location-hint">Select one or more states to notify</span>
          </label>
          
          <div className="multi-select-controls">
            <button type="button" onClick={selectAllStates} className="btn-secondary btn-small">
              Select All
            </button>
            <button type="button" onClick={clearSelection} className="btn-secondary btn-small">
              Clear All
            </button>
            <span className="selected-count">
              {selectedStates.length} of {COASTAL_REGIONS.length} selected
            </span>
          </div>
          
          <div className="states-checkbox-grid">
            <div className="coast-section">
              <h4>West Coast</h4>
              {COASTAL_REGIONS.filter(r => r.coast === 'West').map(region => (
                <label key={region.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedStates.includes(region.value)}
                    onChange={() => toggleState(region.value)}
                  />
                  <span>{region.label}</span>
                </label>
              ))}
            </div>
            
            <div className="coast-section">
              <h4>East Coast</h4>
              {COASTAL_REGIONS.filter(r => r.coast === 'East').map(region => (
                <label key={region.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedStates.includes(region.value)}
                    onChange={() => toggleState(region.value)}
                  />
                  <span>{region.label}</span>
                </label>
              ))}
            </div>
            
            <div className="coast-section">
              <h4>Island Territories</h4>
              {COASTAL_REGIONS.filter(r => r.coast.includes('Bay') || r.coast.includes('Sea')).map(region => (
                <label key={region.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedStates.includes(region.value)}
                    onChange={() => toggleState(region.value)}
                  />
                  <span>{region.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {selectedStates.length > 0 && (
            <div className="selected-states-display">
              <strong>Selected:</strong> {selectedStates.join(', ')}
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Trigger Alert Test'}
        </button>
      </form>

      {result && (
        <div className={`result-box ${result.error ? 'error' : result.alert ? 'alert' : 'normal'}`}>
          <h3>Simulation Result</h3>
          {result.error ? (
            <p>{result.message}</p>
          ) : (
            <>
              {result.alert ? (
                <>
                  <p className={`severity-badge ${getSeverityClass(result.severity)}`}>
                    {result.severity} ALERT TRIGGERED
                  </p>
                  <p><strong>Target Location:</strong> {result.location}</p>
                  <div className="alert-stats">
                    <p><strong>Contacts Notified:</strong> {result.sent_to} 
                      {result.area_contacts === 0 
                        ? ` (No contacts found in ${result.location})` 
                        : result.location === 'All Regions'
                          ? ` of ${result.total_contacts} total contacts`
                          : ` of ${result.total_contacts} contacts in ${result.location}`
                      }
                    </p>
                    {result.notifications_sent > 0 && (
                      <p><strong>Notifications Sent:</strong> {result.notifications_sent} (SMS + Email combined)</p>
                    )}
                  </div>
                  <pre className="alert-message">{result.message}</pre>
                </>
              ) : (
                <>
                  <p className="status-normal">No Alert - Value within safe limits</p>
                  <p>{result.message}</p>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function getUnit(metric) {
  const units = {
    water_level: 'meters',
    wind_speed: 'km/h',
    rainfall_24h: 'mm',
    wave_height: 'meters',
    storm_surge: 'meters'
  }
  return units[metric] || ''
}