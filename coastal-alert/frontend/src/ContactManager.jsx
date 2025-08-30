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
  const [errors, setErrors] = useState({})

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

  function validateForm() {
    const newErrors = {}
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    // At least one contact method required
    if (!formData.phone && !formData.email) {
      newErrors.contact = 'At least one contact method (phone or email) is required'
    }
    
    // Phone format validation
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number with country code'
    }
    
    // Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Region validation
    if (!selectedState) {
      newErrors.region = 'Please select a state/UT'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
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
      setErrors({})
      loadContacts()
    } catch (error) {
      console.error('Failed to save contact:', error)
      
      // Handle duplicate error messages from backend
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (detail.includes('email')) {
          setErrors({ email: detail })
        } else if (detail.includes('phone')) {
          setErrors({ phone: detail })
        } else {
          setErrors({ general: detail })
        }
      } else {
        setErrors({ general: 'Failed to save contact. Please try again.' })
      }
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
    setErrors({})
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
          {errors.general && (
            <div className="error-alert">
              {errors.general}
            </div>
          )}
          {errors.contact && (
            <div className="error-alert">
              {errors.contact}
            </div>
          )}
          
          <div className="form-field">
            <input
              type="text"
              placeholder="Name *"
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value})
                if (errors.name) setErrors({...errors, name: ''})
              }}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>
          
          <div className="form-field">
            <input
              type="tel"
              placeholder="Phone (e.g., +1234567890)"
              value={formData.phone}
              onChange={(e) => {
                setFormData({...formData, phone: e.target.value})
                if (errors.phone) setErrors({...errors, phone: ''})
                if (errors.contact) setErrors({...errors, contact: ''})
              }}
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
          
          <div className="form-field">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value})
                if (errors.email) setErrors({...errors, email: ''})
                if (errors.contact) setErrors({...errors, contact: ''})
              }}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <div className="location-selectors">
            <select
              value={selectedState}
              onChange={(e) => {
                handleStateChange(e)
                if (errors.region) setErrors({...errors, region: ''})
              }}
              className={`state-select ${errors.region ? 'error' : ''}`}
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
            {errors.region && <span className="error-text">{errors.region}</span>}
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