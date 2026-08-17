import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiCall } from '@/services/api';

const CATEGORIES = [
  { value: 'course issue', label: 'Course Issue', desc: 'Course access, content, materials' },
  { value: 'assessment issue', label: 'Assessment Issue', desc: 'Assessment access and evaluation' },
  { value: 'account', label: 'Account', desc: 'Login, access, permissions' },
  { value: 'other', label: 'Other', desc: 'General inquiries' },
];

const ContactAdminModal = ({ isOpen, onClose, selectedInstitution }) => {
  const [formData, setFormData] = useState({
    contactName: '',
    contactEmail: '',
    category: '',
    title: '',
    description: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const e = {};
    if (!formData.contactName.trim()) e.contactName = 'Name is required';
    if (!formData.contactEmail.trim()) e.contactEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) e.contactEmail = 'Invalid email';
    if (!formData.title.trim() || formData.title.length < 5) e.title = 'Title must be at least 5 characters';
    if (!formData.description.trim() || formData.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!formData.category) e.category = 'Please select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      await apiCall('/tickets', { method: 'POST', body: fd });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ contactName: '', contactEmail: '', category: '', title: '', description: '', priority: 'medium' });
        onClose();
      }, 2000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // All hooks and functions are defined above — safe to return null here
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: '1px solid rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Contact Administrator</h2>
            {selectedInstitution && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#64748b', fontSize: '13px' }}>
                <Building2 size={14} />
                <span>{selectedInstitution.name}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle size={48} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
              <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Request Submitted!</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>We'll get back to you at {formData.contactEmail} shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {submitError && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', color: '#dc2626', fontSize: '14px' }}>
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              {/* Name + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="contactName"
                    type="text"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Your Full Name"
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${errors.contactName ? '#ef4444' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                  />
                  {errors.contactName && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.contactName}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${errors.contactEmail ? '#ef4444' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                  />
                  {errors.contactEmail && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.contactEmail}</p>}
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => { setFormData(p => ({ ...p, category: cat.value })); if (errors.category) setErrors(p => ({ ...p, category: null })); }}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${formData.category === cat.value ? '#1a3884' : '#e2e8f0'}`,
                        background: formData.category === cat.value ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: formData.category === cat.value ? '#1a3884' : '#0f172a' }}>{cat.label}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{cat.desc}</span>
                    </button>
                  ))}
                </div>
                {errors.category && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.category}</p>}
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Brief summary of your issue"
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${errors.title ? '#ef4444' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                />
                {errors.title && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${errors.description ? '#ef4444' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'none', color: '#0f172a', fontFamily: 'inherit' }}
                />
                {errors.description && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.description}</p>}
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #f1f5f9', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#64748b' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#1a3884', color: 'white', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? <Loader2 size={16} /> : <Send size={16} />}
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ContactAdminModal;
