import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Film, User, Lock, AlertCircle, ShieldCheck, ChevronRight, Eye, EyeOff } from 'lucide-react';
import heroImg from '../assets/cinevault_hero.jpg';

/* =============================================================================
   CineVault Login Page
   - Bright / cinematic split-screen layout
   - Left panel: hero image + branding overlay
   - Right panel: User / Admin toggle + login form
   - Animations fire ONLY on explicit user interactions (click events)
   - All auth logic (login, navigate, error handling) is UNCHANGED
============================================================================= */

const cvStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&display=swap');

  .cv-page {
    min-height: 100vh;
    display: flex;
    background: #faf9f7;
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  }

  /* ── Left hero panel ── */
  .cv-hero {
    flex: 1.1;
    position: relative;
    display: none;
    overflow: hidden;
  }
  @media (min-width: 900px) { .cv-hero { display: block; } }

  .cv-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .cv-hero--submitted .cv-hero-img { transform: scale(1.03); }

  .cv-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,rgba(255,248,235,0.25) 0%,rgba(255,237,200,0.15) 40%,rgba(254,215,150,0.30) 100%);
  }

  .cv-hero-brand {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 48px 40px 40px;
    background: linear-gradient(to top,rgba(250,240,220,0.95) 0%,rgba(250,240,220,0.70) 60%,transparent 100%);
  }
  .cv-hero-brand-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.6rem; font-weight: 700;
    color: #1a1208; letter-spacing: -0.02em; line-height: 1; margin: 0 0 6px;
  }
  .cv-hero-brand-title span { color: #c17f3c; }
  .cv-hero-brand-slogan {
    font-size: 0.875rem; font-weight: 500; color: #7c5e3a;
    letter-spacing: 0.12em; text-transform: uppercase; margin: 0;
  }
  .cv-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 16px; padding: 5px 12px; border-radius: 999px;
    background: rgba(193,127,60,0.12); border: 1px solid rgba(193,127,60,0.25);
    color: #9a5f20; font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  /* ── Right form panel ── */
  .cv-form-panel {
    flex: 0 0 420px;
    display: flex; flex-direction: column; justify-content: center;
    padding: 48px 40px;
    background: #ffffff;
    box-shadow: -8px 0 48px rgba(0,0,0,0.06);
    position: relative; overflow: hidden;
  }
  @media (max-width: 899px) {
    .cv-form-panel { flex: unset; width: 100%; padding: 40px 24px; box-shadow: none; }
  }
  @media (max-width: 480px) { .cv-form-panel { padding: 32px 20px; } }

  .cv-panel-slide {
    animation: cvPanelSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  @keyframes cvPanelSlide {
    0%   { transform: translateX(12px); opacity: 0.7; }
    100% { transform: translateX(0);    opacity: 1;   }
  }

  /* ── Mobile-only branding ── */
  .cv-mobile-brand { display: none; text-align: center; margin-bottom: 32px; }
  @media (max-width: 899px) { .cv-mobile-brand { display: block; } }
  .cv-mobile-brand-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 52px; height: 52px; border-radius: 14px;
    background: linear-gradient(135deg,#f5c77e,#e8a346);
    margin-bottom: 12px; box-shadow: 0 4px 16px rgba(193,127,60,0.25);
  }
  .cv-mobile-brand-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.9rem; font-weight: 700; color: #1a1208; margin: 0 0 4px;
  }
  .cv-mobile-brand-title span { color: #c17f3c; }
  .cv-mobile-brand-slogan {
    font-size: 0.75rem; font-weight: 500; color: #9a7550;
    letter-spacing: 0.12em; text-transform: uppercase;
  }

  /* ── Headings ── */
  .cv-heading {
    font-family: 'Inter', sans-serif; font-size: 1.55rem; font-weight: 600;
    color: #111827; margin: 0 0 4px; letter-spacing: -0.02em;
  }
  .cv-subheading { font-size: 0.875rem; color: #6b7280; margin: 0 0 28px; }

  /* ── Tab row ── */
  .cv-tab-row {
    display: flex; gap: 10px; margin-bottom: 28px;
    padding: 5px; background: #f3f4f6; border-radius: 12px;
  }
  .cv-tab {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 9px 12px; border-radius: 9px; border: none; background: transparent;
    color: #6b7280; font-size: 0.875rem; font-weight: 500;
    font-family: 'Inter', sans-serif; cursor: pointer;
    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
    outline: none; letter-spacing: 0.01em;
  }
  .cv-tab:hover:not(.cv-tab--active) { background: rgba(255,255,255,0.7); color: #374151; }
  .cv-tab--active {
    background: #ffffff; color: #1a1208; font-weight: 600;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }
  .cv-tab--active.cv-tab--user  { color: #c17f3c; }
  .cv-tab--active.cv-tab--admin { color: #7c3aed; }
  .cv-tab-icon {
    display: flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
  }
  .cv-tab--active.cv-tab--user  .cv-tab-icon { background: rgba(193,127,60,0.12); color: #c17f3c; }
  .cv-tab--active.cv-tab--admin .cv-tab-icon { background: rgba(124,58,237,0.10); color: #7c3aed; }

  /* ── Role pill ── */
  .cv-role-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 999px;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase; margin-bottom: 20px;
    border: 1.5px solid transparent; transition: all 0.3s ease;
  }
  .cv-role-pill--user  { background: rgba(193,127,60,0.10); color: #9a5f20; border-color: rgba(193,127,60,0.20); }
  .cv-role-pill--admin { background: rgba(124,58,237,0.08); color: #6d28d9; border-color: rgba(124,58,237,0.18); }

  /* ── Form fields ── */
  .cv-field { margin-bottom: 18px; }
  .cv-label {
    display: block; font-size: 0.8rem; font-weight: 600;
    color: #374151; margin-bottom: 7px; letter-spacing: 0.02em;
  }
  .cv-input-wrap { position: relative; }
  .cv-input-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: #9ca3af; display: flex; align-items: center;
    pointer-events: none; transition: color 0.2s ease;
  }
  .cv-input-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    color: #9ca3af; display: flex; align-items: center; cursor: pointer;
    background: none; border: none; padding: 2px; border-radius: 4px;
    transition: color 0.2s ease; outline: none;
  }
  .cv-input-eye:hover { color: #6b7280; }
  .cv-input {
    width: 100%; padding: 11px 14px 11px 38px;
    border: 1.5px solid #e5e7eb; border-radius: 10px;
    background: #f9fafb; color: #111827; font-size: 0.9rem;
    font-family: 'Inter', sans-serif; transition: all 0.2s ease;
    outline: none; box-sizing: border-box;
  }
  .cv-input:focus { border-color: #c17f3c; background: #ffffff; box-shadow: 0 0 0 3px rgba(193,127,60,0.10); }
  .cv-input-wrap:focus-within .cv-input-icon { color: #c17f3c; }
  .cv-input--admin:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.10); }
  .cv-input-wrap:has(.cv-input--admin:focus) .cv-input-icon { color: #7c3aed; }
  .cv-input-with-eye { padding-right: 40px; }

  /* ── Error ── */
  .cv-error {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 14px; background: #fef2f2;
    border: 1.5px solid #fecaca; border-radius: 10px; margin-bottom: 18px;
    animation: cvFadeIn 0.25s ease-out;
  }
  .cv-error-icon { color: #ef4444; flex-shrink: 0; margin-top: 1px; }
  .cv-error-text { font-size: 0.82rem; color: #dc2626; margin: 0; line-height: 1.4; }

  /* ── Submit button ── */
  .cv-btn {
    width: 100%; padding: 13px 24px; border: none; border-radius: 11px;
    font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
    outline: none; letter-spacing: 0.01em;
    position: relative; overflow: hidden; margin-top: 6px;
  }
  .cv-btn--user  { background: linear-gradient(135deg,#e8a346,#c17f3c); color: #fff; box-shadow: 0 4px 18px rgba(193,127,60,0.30); }
  .cv-btn--admin { background: linear-gradient(135deg,#8b5cf6,#7c3aed); color: #fff; box-shadow: 0 4px 18px rgba(124,58,237,0.28); }
  .cv-btn--user:hover:not(:disabled)  { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(193,127,60,0.40); }
  .cv-btn--admin:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(124,58,237,0.38); }
  .cv-btn--user:active:not(:disabled)  { transform: translateY(0); }
  .cv-btn--admin:active:not(:disabled) { transform: translateY(0); }
  .cv-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none !important; }

  /* Submit-pulse: fires ONLY when user clicks Sign In */
  .cv-btn--pulse { animation: cvSubmitPulse 0.5s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes cvSubmitPulse {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.96); }
    70%  { transform: scale(1.02); }
    100% { transform: scale(1); }
  }

  /* ── Spinner ── */
  .cv-spinner {
    width: 20px; height: 20px;
    border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
    border-radius: 50%; animation: cvSpin 0.7s linear infinite;
  }
  @keyframes cvSpin { to { transform: rotate(360deg); } }

  /* ── Divider ── */
  .cv-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0 20px; }
  .cv-divider-line { flex: 1; height: 1px; background: #e5e7eb; }
  .cv-divider-text { font-size: 0.75rem; color: #9ca3af; font-weight: 500; }

  /* ── Register link ── */
  .cv-register-link { text-align: center; font-size: 0.83rem; color: #6b7280; }
  .cv-register-link a { color: #c17f3c; font-weight: 600; text-decoration: none; transition: color 0.2s ease; }
  .cv-register-link a:hover { color: #9a5f20; }

  /* ── Demo pill ── */
  .cv-demo-pill {
    display: flex; align-items: center; gap: 8px;
    margin-top: 20px; padding: 9px 14px;
    background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;
    font-size: 0.78rem; color: #6b7280;
  }
  .cv-demo-pill code {
    font-family: 'Courier New', monospace; background: #e5e7eb;
    padding: 2px 6px; border-radius: 4px; color: #374151; font-size: 0.75rem;
  }

  /* ── Entry animation ── */
  @keyframes cvFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cv-fade-in       { animation: cvFadeIn 0.35s ease-out both; }
  .cv-fade-in-delay { animation: cvFadeIn 0.45s 0.1s ease-out both; }
`;

const Login = () => {
  // ── State ─────────────────────────────────────────────────────────────────
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginType, setLoginType]       = useState('user');
  const [showPassword, setShowPassword] = useState(false);

  // Animation flags — event-driven only, zero timers
  const [panelSlide, setPanelSlide]   = useState(false);
  const [submitPulse, setSubmitPulse] = useState(false);
  const [heroZoom, setHeroZoom]       = useState(false);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { login } = useAuth();
  const navigate  = useNavigate();
  const formRef   = useRef(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleTabSwitch = (type) => {
    if (type === loginType) return;
    setPanelSlide(true);
    setLoginType(type);
    setError('');
    setUsername('');
    setPassword('');
    setTimeout(() => setPanelSlide(false), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setSubmitPulse(true);
    setHeroZoom(true);
    setIsSubmitting(true);
    setError('');
    try {
      const user = await login(username, password);
      navigate(user.role === 'admin' ? '/admin' : '/user');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Invalid username or password'
      );
      setSubmitPulse(false);
      setHeroZoom(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{cvStyles}</style>

      <div className="cv-page">

        {/* ── LEFT: Cinematic Hero Panel ──────────────────────────────── */}
        <div className={`cv-hero${heroZoom ? ' cv-hero--submitted' : ''}`}>
          <img
            src={heroImg}
            alt="CineVault cinematic movie poster collage"
            className="cv-hero-img"
            draggable="false"
          />
          <div className="cv-hero-overlay" />
          <div className="cv-hero-brand">
            <h1 className="cv-hero-brand-title">
              Cine<span>Vault</span>
            </h1>
            <p className="cv-hero-brand-slogan">Discover · Rate · Recommend</p>
            <div className="cv-hero-badge">
              <Film size={11} strokeWidth={2.5} />
              Movie Recommendation &amp; Data Warehouse
            </div>
          </div>
        </div>

        {/* ── RIGHT: Login Form Panel ──────────────────────────────────── */}
        <div className={`cv-form-panel${panelSlide ? ' cv-panel-slide' : ''}`}>

          {/* Mobile branding */}
          <div className="cv-mobile-brand cv-fade-in">
            <div className="cv-mobile-brand-icon">
              <Film size={26} color="#ffffff" strokeWidth={2} />
            </div>
            <div className="cv-mobile-brand-title">Cine<span>Vault</span></div>
            <div className="cv-mobile-brand-slogan">Discover · Rate · Recommend</div>
          </div>

          {/* Heading */}
          <div className="cv-fade-in">
            <h2 className="cv-heading">Welcome back</h2>
            <p className="cv-subheading">Sign in to your CineVault account</p>
          </div>

          {/* User / Admin tabs */}
          <div className="cv-tab-row cv-fade-in" role="tablist" aria-label="Login type">
            <button
              id="cv-tab-user"
              role="tab"
              aria-selected={loginType === 'user'}
              aria-controls="cv-panel-user"
              className={`cv-tab cv-tab--user${loginType === 'user' ? ' cv-tab--active' : ''}`}
              onClick={() => handleTabSwitch('user')}
              type="button"
            >
              <span className="cv-tab-icon"><User size={13} strokeWidth={2.5} /></span>
              User Login
            </button>
            <button
              id="cv-tab-admin"
              role="tab"
              aria-selected={loginType === 'admin'}
              aria-controls="cv-panel-admin"
              className={`cv-tab cv-tab--admin${loginType === 'admin' ? ' cv-tab--active' : ''}`}
              onClick={() => handleTabSwitch('admin')}
              type="button"
            >
              <span className="cv-tab-icon"><ShieldCheck size={13} strokeWidth={2.5} /></span>
              Admin Login
            </button>
          </div>

          {/* Role context pill */}
          <div className={`cv-role-pill cv-role-pill--${loginType}`} aria-live="polite">
            {loginType === 'user'
              ? <><User size={10} strokeWidth={2.5} /> Movie enthusiast access</>
              : <><ShieldCheck size={10} strokeWidth={2.5} /> Administrator access</>
            }
          </div>

          {/* Login form */}
          <form
            id={`cv-panel-${loginType}`}
            role="tabpanel"
            aria-labelledby={`cv-tab-${loginType}`}
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
          >
            {error && (
              <div className="cv-error" role="alert" aria-live="assertive">
                <AlertCircle className="cv-error-icon" size={16} />
                <p className="cv-error-text">{error}</p>
              </div>
            )}

            <div className="cv-field cv-fade-in-delay">
              <label htmlFor="cv-username" className="cv-label">Username</label>
              <div className="cv-input-wrap">
                <input
                  id="cv-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`cv-input${loginType === 'admin' ? ' cv-input--admin' : ''}`}
                  placeholder={loginType === 'admin' ? 'Admin username' : 'Your username'}
                  autoComplete="username"
                  autoFocus
                  aria-label="Username"
                />
                <span className="cv-input-icon" aria-hidden="true">
                  <User size={15} strokeWidth={2} />
                </span>
              </div>
            </div>

            <div className="cv-field cv-fade-in-delay">
              <label htmlFor="cv-password" className="cv-label">Password</label>
              <div className="cv-input-wrap">
                <input
                  id="cv-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`cv-input cv-input-with-eye${loginType === 'admin' ? ' cv-input--admin' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-label="Password"
                />
                <span className="cv-input-icon" aria-hidden="true">
                  <Lock size={15} strokeWidth={2} />
                </span>
                <button
                  type="button"
                  className="cv-input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff size={15} strokeWidth={2} />
                    : <Eye size={15} strokeWidth={2} />
                  }
                </button>
              </div>
            </div>

            <button
              id="cv-signin-btn"
              type="submit"
              disabled={isSubmitting}
              className={`cv-btn cv-btn--${loginType}${submitPulse ? ' cv-btn--pulse' : ''}`}
              aria-label={`Sign in as ${loginType}`}
              onAnimationEnd={() => setSubmitPulse(false)}
            >
              {isSubmitting
                ? <span className="cv-spinner" aria-hidden="true" />
                : <>Sign In <ChevronRight size={17} strokeWidth={2.5} aria-hidden="true" /></>
              }
            </button>
          </form>

          {/* Register link — user only */}
          {loginType === 'user' && (
            <>
              <div className="cv-divider">
                <div className="cv-divider-line" />
                <span className="cv-divider-text">New here?</span>
                <div className="cv-divider-line" />
              </div>
              <p className="cv-register-link">
                Don&apos;t have an account?{' '}
                <Link to="/register">Create one</Link>
              </p>
            </>
          )}

          {/* Demo credentials */}
          <div className="cv-demo-pill" aria-label="Demo credentials">
            <Film size={13} color="#9ca3af" strokeWidth={2} aria-hidden="true" />
            <span>Admin: <code>admin</code> / <code>admin123</code> &bull; User: <code>Atharva</code> / <code>atharva123</code></span>
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;
