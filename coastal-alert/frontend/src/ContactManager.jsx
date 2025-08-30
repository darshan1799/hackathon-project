import React, { useState, useEffect } from 'react'
import { contactsAPI } from './api'
import { COASTAL_REGIONS, MAJOR_COASTAL_CITIES } from './constants'

export default function ContactManager() {
  const [contacts, setContacts] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    region: ''
  })
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    setLoading(true)
    try {
      const data = await contactsAPI.getAll()
      setContacts(data)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Combine state and city for region
    const region = selectedCity ? `${selectedCity}, ${selectedState}` : selectedState
    const finalFormData = { ...formData, region }
    
    try {
      if (editingId) {
        await contactsAPI.update(editingId, finalFormData)
        setEditingId(null)
      } else {
        await contactsAPI.create(finalFormData)
      }
      setFormData({ name: '', phone: '', email: '', region: '' })
      setSelectedState('')
      setSelectedCity('')
      loadContacts()
    } catch (error) {
      console.error('Failed to save contact:', error)
      alert('Failed to save contact')
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactsAPI.delete(id)
        loadContacts()
      } catch (error) {
        console.error('Failed to delete contact:', error)
      }
    }
  }

  function handleEdit(contact) {
    setFormData({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      region: contact.region || ''
    })
    
    // Parse region to extract state and city
    if (contact.region) {
      const parts = contact.region.split(',').map(p => p.trim())
      if (parts.length === 2) {
        setSelectedCity(parts[0])
        setSelectedState(parts[1])
      } else {
        setSelectedState(contact.region)
        setSelectedCity('')
      }
    }
    
    setEditingId(contact.id)
  }

  function handleCancel() {
    setFormData({ name: '', phone: '', email: '', region: '' })
    setSelectedState('')
    setSelectedCity('')
    setEditingId(null)
  }
  
  function handleStateChange(e) {
    setSelectedState(e.target.value)
    setSelectedCity('') // Reset city when state changes
  }

  return (
    <div className="contact-manager">
      <h2>Contact Management</h2>

      <div className="contact-form-section">
        <h3>{editingId ? 'Edit Contact' : 'Add New Contact'}</h3>
        <form onSubmit={handleSubmit} className="contact-form">
          <input
            type="text"
            placeholder="Name *"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Phone (with country code)"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <div className="location-selectors">
            <select
              value={selectedState}
              onChange={handleStateChange}
              required
              className="state-select"
            >
              <option value="">Select State/UT *</option>
              <optgroup label="West Coast">
                {COASTAL_REGIONS.filter(r => r.coast === 'West').map(region => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
              </optgroup>
              <optgroup label="East Coast">
                {COASTAL_REGIONS.filter(r => r.coast === 'East').map(region => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
              </optgroup>
              <optgroup label="Island Territories">
                {COASTAL_REGIONS.filter(r => r.coast.includes('Bay') || r.coast.includes('Sea')).map(region => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
              </optgroup>
            </select>
            
            {selectedState && MAJOR_COASTAL_CITIES[selectedState] && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="city-select"
              >
                <option value="">Select City (Optional)</option>
                {MAJOR_COASTAL_CITIES[selectedState].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Add Contact'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="contacts-list-section">
        <h3>Registered Contacts ({contacts.length})</h3>
        {loading ? (
          <p>Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <p className="no-data">No contacts registered yet. Add your first contact above.</p>
        ) : (
          <div className="contacts-grid">
            {contacts.map(contact => (
              <div key={contact.id} className="contact-card">
                <h4>{contact.name}</h4>
                <div className="contact-details">
                  {contact.phone && <p>📱 {contact.phone}</p>}
                  {contact.email && <p>📧 {contact.email}</p>}
                  {contact.region && <p>📍 {contact.region}</p>}
                  <p className="contact-date">
                    Added: {new Date(contact.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="contact-actions">
                  <button onClick={() => handleEdit(contact)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}