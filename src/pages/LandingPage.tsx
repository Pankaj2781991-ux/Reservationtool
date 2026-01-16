import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

export function LandingPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { allTenants, createTenant } = useTenant();
    const { signInAdmin, signInCustomer, signUpCustomer } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [authTab, setAuthTab] = useState<'admin' | 'customer'>('admin');
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [formData, setFormData] = useState({
        ownerName: '',
        businessName: '',
        email: '',
        phone: '',
        serviceType: '',
        description: '',
        ownerPassword: '',
    });
    const [adminLogin, setAdminLogin] = useState({
        email: '',
        password: '',
    });
    const [customerLogin, setCustomerLogin] = useState({
        tenantSlug: '',
        email: '',
        password: '',
    });
    const [customerSignup, setCustomerSignup] = useState({
        tenantSlug: '',
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const signin = searchParams.get('signin');
        const tenant = searchParams.get('tenant') || '';
        if (signin === 'admin' || signin === 'user') {
            setShowAuth(true);
            setAuthTab(signin === 'admin' ? 'admin' : 'customer');
            setAuthMode('signin');
        }
        if (tenant) {
            setCustomerLogin((prev) => ({ ...prev, tenantSlug: tenant }));
            setCustomerSignup((prev) => ({ ...prev, tenantSlug: tenant }));
        }
    }, [searchParams]);

    const serviceTypes = [
        'Hair Salon',
        'Medical Clinic',
        'Fitness Center',
        'Spa & Wellness',
        'Restaurant',
        'Consulting',
        'Photography',
        'Auto Service',
        'Other',
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.ownerName || !formData.businessName || !formData.email || !formData.serviceType || !formData.ownerPassword) {
            setError('Please fill in all required fields.');
            return;
        }

        const emailExists = allTenants.some(
            (tenant) => tenant.email.toLowerCase() === formData.email.toLowerCase()
        );
        if (emailExists) {
            setError('A tenant with this email already exists. Please sign in.');
            return;
        }

        const newTenant = createTenant(formData);
        const signInResult = signInAdmin(formData.email, formData.ownerPassword);
        if (!signInResult.ok) {
            navigate(`/tenant/${newTenant.slug}/admin`);
            return;
        }
        navigate(`/tenant/${signInResult.tenantSlug}/admin`);
    };

    const handleAdminSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        if (!adminLogin.email || !adminLogin.password) {
            setAuthError('Please enter your admin email and password.');
            return;
        }

        const result = signInAdmin(adminLogin.email, adminLogin.password);
        if (!result.ok || !result.tenantSlug) {
            setAuthError(result.error || 'Unable to sign in.');
            return;
        }

        setShowAuth(false);
        setSearchParams({});
        navigate(`/tenant/${result.tenantSlug}/admin`);
    };

    const handleCustomerSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        if (!customerLogin.tenantSlug || !customerLogin.email || !customerLogin.password) {
            setAuthError('Please enter your tenant, email, and password.');
            return;
        }

        const result = signInCustomer(customerLogin.tenantSlug, customerLogin.email, customerLogin.password);
        if (!result.ok) {
            setAuthError(result.error || 'Unable to sign in.');
            return;
        }

        setShowAuth(false);
        setSearchParams({});
        navigate(`/tenant/${customerLogin.tenantSlug}`);
    };

    const handleCustomerSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        if (!customerSignup.tenantSlug || !customerSignup.name || !customerSignup.email || !customerSignup.password) {
            setAuthError('Please fill in all required fields.');
            return;
        }

        const result = signUpCustomer(customerSignup);
        if (!result.ok) {
            setAuthError(result.error || 'Unable to create account.');
            return;
        }

        setShowAuth(false);
        setSearchParams({});
        navigate(`/tenant/${customerSignup.tenantSlug}`);
    };

    const features = [
        {
            icon: '📅',
            title: 'Easy Scheduling',
            description: 'Let customers book appointments 24/7 with an intuitive calendar interface.',
        },
        {
            icon: '🏢',
            title: 'Multi-Tenant',
            description: 'Each business gets their own branded portal with custom subdomain.',
        },
        {
            icon: '🔔',
            title: 'Smart Notifications',
            description: 'Automated reminders reduce no-shows and keep everyone informed.',
        },
        {
            icon: '📊',
            title: 'Analytics Dashboard',
            description: 'Track bookings, revenue, and customer trends in real-time.',
        },
    ];

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <header className="landing-header">
                <div className="header-container">
                    <div className="logo">
                        <span className="logo-icon">📅</span>
                        <span className="logo-text">ReserveHub</span>
                    </div>
                    <nav className="landing-nav">
                        <a href="#features">Features</a>
                        <a href="#demo">Demo</a>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowAuth(true);
                                setAuthTab('admin');
                                setAuthMode('signin');
                                setAuthError('');
                            }}
                        >
                            Sign In
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            Get Started
                        </button>
                    </nav>
                </div>
            </header>

            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Reservation Management
                        <span className="gradient-text"> Made Simple</span>
                    </h1>
                    <p className="hero-subtitle">
                        Create your business's online booking portal in minutes. Let customers schedule appointments while you focus on what matters most.
                    </p>
                    <div className="hero-cta">
                        <button className="btn btn-primary btn-large" onClick={() => setShowForm(true)}>
                            Create Your Portal
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                        <a href="#demo" className="btn btn-secondary btn-large">
                            View Demo
                        </a>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-card">
                        <div className="card-header">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <div className="card-content">
                            <div className="mini-calendar">
                                <div className="mini-day active">9</div>
                                <div className="mini-day">10</div>
                                <div className="mini-day selected">11</div>
                                <div className="mini-day">12</div>
                                <div className="mini-day">13</div>
                            </div>
                            <div className="mini-slots">
                                <div className="mini-slot">9:00 AM - Available</div>
                                <div className="mini-slot booked">10:00 AM - Booked</div>
                                <div className="mini-slot">11:00 AM - Available</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-container">
                    <h2 className="section-title">Everything You Need</h2>
                    <p className="section-subtitle">
                        Powerful features to manage your reservations efficiently
                    </p>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <span className="feature-icon">{feature.icon}</span>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Demo Section */}
            <section id="demo" className="demo-section">
                <div className="section-container">
                    <h2 className="section-title">Try Our Demo Tenants</h2>
                    <p className="section-subtitle">
                        Explore how ReserveHub works with these sample businesses
                    </p>
                    <div className="demo-grid">
                        {allTenants.map((tenant) => (
                            <div key={tenant.id} className="demo-card">
                                <div className="demo-card-header" style={{ backgroundColor: tenant.settings.primaryColor }}>
                                    <span className="demo-icon">
                                        {tenant.serviceType === 'Hair Salon' && '💇'}
                                        {tenant.serviceType === 'Medical Clinic' && '🏥'}
                                        {tenant.serviceType === 'Fitness Center' && '💪'}
                                        {!['Hair Salon', 'Medical Clinic', 'Fitness Center'].includes(tenant.serviceType) && '📅'}
                                    </span>
                                </div>
                                <div className="demo-card-body">
                                    <h3 className="demo-name">{tenant.businessName}</h3>
                                    <p className="demo-type">{tenant.serviceType}</p>
                                    <div className="demo-actions">
                                        <button
                                            className="btn btn-primary btn-small"
                                            onClick={() => navigate(`/tenant/${tenant.slug}`)}
                                        >
                                            User Panel
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-small"
                                            onClick={() => navigate(`/tenant/${tenant.slug}/admin`)}
                                        >
                                            Admin Panel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Registration Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="registration-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowForm(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="modal-title">Create Your Business Portal</h2>
                        <p className="modal-subtitle">Get started in less than a minute</p>

                        {error && <div className="form-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="registration-form">
                            <div className="form-group">
                                <label htmlFor="ownerName">Your Name *</label>
                                <input
                                    type="text"
                                    id="ownerName"
                                    value={formData.ownerName}
                                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                    placeholder="e.g., Alex Smith"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="businessName">Business Name *</label>
                                <input
                                    type="text"
                                    id="businessName"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    placeholder="e.g., Acme Hair Studio"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="you@business.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 555-0123"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Admin Password *</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={formData.ownerPassword}
                                    onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                                    placeholder="Create a secure password"
                                    required
                                />
                                <span className="form-hint">Use this to sign in to your admin portal.</span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="serviceType">Service Type *</label>
                                <select
                                    id="serviceType"
                                    value={formData.serviceType}
                                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                    required
                                >
                                    <option value="">Select your industry</option>
                                    {serviceTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell customers about your business..."
                                    rows={3}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-full">
                                Create My Portal
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showAuth && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        setShowAuth(false);
                        setAuthError('');
                        setSearchParams({});
                    }}
                >
                    <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="modal-close"
                            onClick={() => {
                                setShowAuth(false);
                                setAuthError('');
                                setSearchParams({});
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="modal-title">Sign In</h2>
                        <p className="modal-subtitle">Access your tenant or customer portal</p>

                        <div className="auth-tabs">
                            <button
                                className={`auth-tab ${authTab === 'admin' ? 'active' : ''}`}
                                onClick={() => {
                                    setAuthTab('admin');
                                    setAuthMode('signin');
                                    setAuthError('');
                                }}
                            >
                                Admin
                            </button>
                            <button
                                className={`auth-tab ${authTab === 'customer' ? 'active' : ''}`}
                                onClick={() => {
                                    setAuthTab('customer');
                                    setAuthMode('signin');
                                    setAuthError('');
                                }}
                            >
                                Customer
                            </button>
                        </div>

                        {authError && <div className="form-error">{authError}</div>}

                        {authTab === 'admin' && (
                            <form onSubmit={handleAdminSignIn} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="adminEmail">Admin Email</label>
                                    <input
                                        type="email"
                                        id="adminEmail"
                                        value={adminLogin.email}
                                        onChange={(e) => setAdminLogin({ ...adminLogin, email: e.target.value })}
                                        placeholder="owner@business.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="adminPassword">Password</label>
                                    <input
                                        type="password"
                                        id="adminPassword"
                                        value={adminLogin.password}
                                        onChange={(e) => setAdminLogin({ ...adminLogin, password: e.target.value })}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full">
                                    Sign In to Admin
                                </button>
                            </form>
                        )}

                        {authTab === 'customer' && authMode === 'signin' && (
                            <form onSubmit={handleCustomerSignIn} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="tenantSlug">Tenant Slug</label>
                                    <input
                                        type="text"
                                        id="tenantSlug"
                                        value={customerLogin.tenantSlug}
                                        onChange={(e) => setCustomerLogin({ ...customerLogin, tenantSlug: e.target.value })}
                                        placeholder="e.g., demo-salon"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customerEmail">Email</label>
                                    <input
                                        type="email"
                                        id="customerEmail"
                                        value={customerLogin.email}
                                        onChange={(e) => setCustomerLogin({ ...customerLogin, email: e.target.value })}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customerPassword">Password</label>
                                    <input
                                        type="password"
                                        id="customerPassword"
                                        value={customerLogin.password}
                                        onChange={(e) => setCustomerLogin({ ...customerLogin, password: e.target.value })}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full">
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-full"
                                    onClick={() => {
                                        setAuthMode('signup');
                                        setAuthError('');
                                    }}
                                >
                                    Create a Customer Account
                                </button>
                            </form>
                        )}

                        {authTab === 'customer' && authMode === 'signup' && (
                            <form onSubmit={handleCustomerSignUp} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="signupTenant">Tenant Slug</label>
                                    <input
                                        type="text"
                                        id="signupTenant"
                                        value={customerSignup.tenantSlug}
                                        onChange={(e) => setCustomerSignup({ ...customerSignup, tenantSlug: e.target.value })}
                                        placeholder="e.g., demo-salon"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupName">Full Name</label>
                                    <input
                                        type="text"
                                        id="signupName"
                                        value={customerSignup.name}
                                        onChange={(e) => setCustomerSignup({ ...customerSignup, name: e.target.value })}
                                        placeholder="Jane Doe"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupEmail">Email</label>
                                    <input
                                        type="email"
                                        id="signupEmail"
                                        value={customerSignup.email}
                                        onChange={(e) => setCustomerSignup({ ...customerSignup, email: e.target.value })}
                                        placeholder="jane@example.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupPhone">Phone</label>
                                    <input
                                        type="tel"
                                        id="signupPhone"
                                        value={customerSignup.phone}
                                        onChange={(e) => setCustomerSignup({ ...customerSignup, phone: e.target.value })}
                                        placeholder="+1 555-0123"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupPassword">Password</label>
                                    <input
                                        type="password"
                                        id="signupPassword"
                                        value={customerSignup.password}
                                        onChange={(e) => setCustomerSignup({ ...customerSignup, password: e.target.value })}
                                        placeholder="Create a password"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full">
                                    Create Account
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-full"
                                    onClick={() => {
                                        setAuthMode('signin');
                                        setAuthError('');
                                    }}
                                >
                                    Back to Sign In
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-container">
                    <div className="footer-brand">
                        <span className="logo-icon">📅</span>
                        <span className="logo-text">ReserveHub</span>
                    </div>
                    <p className="footer-text">
                        © 2024 ReserveHub. Built for modern businesses.
                    </p>
                </div>
            </footer>
        </div>
    );
}
