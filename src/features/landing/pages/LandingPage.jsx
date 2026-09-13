import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('in'), i * 40);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root">
      <style>{`
        :root {
          --lime:#C8FF2D;
          --mint:#2CE6A6;
          --cyan:#34D8FF;
          --slate:#0B0F17;
          --charcoal:#111827;
          --gray-600:#4B5563;
          --gray-400:#9CA3AF;
          --gray-200:#E5E7EB;
          --gray-100:#F3F4F6;
          --white:#FFFFFF;
          --gradient: linear-gradient(115deg, var(--lime) 0%, var(--mint) 50%, var(--cyan) 100%);
          --xs:4px; --sm:8px; --md:16px; --lg:24px; --xl:32px; --xxl:48px; --xxxl:64px;
          --r-btn:12px; --r-input:12px; --r-card:16px; --r-modal:20px;
          --shadow-sm: 0 1px 2px rgba(11,15,23,0.06), 0 1px 1px rgba(11,15,23,0.04);
          --shadow-md: 0 8px 24px rgba(11,15,23,0.08);
          --shadow-lg: 0 24px 64px rgba(11,15,23,0.14);
        }

        .landing-root {
          font-family: 'Inter', sans-serif;
          color: var(--charcoal);
          background: var(--white);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        .landing-root h1, .landing-root h2, .landing-root h3, .landing-root h4 {
          font-family: 'Space Grotesk', sans-serif;
          color: var(--slate);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .landing-root .mono-num { font-family: 'Manrope', sans-serif; }
        .landing-root a { text-decoration: none; color: inherit; }
        .landing-root ul { list-style: none; }
        .landing-root img { max-width: 100%; display: block; }
        .landing-root .container { max-width: 1200px; margin: 0 auto; padding: 0 var(--xl); }
        @media (max-width:767px) { .landing-root .container { padding: 0 var(--md); } }

        .landing-root section { position: relative; }
        .landing-root .eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-600);
          margin-bottom: var(--md);
        }
        .landing-root .eyebrow::before {
          content: ''; width: 8px; height: 8px; border-radius: 2px;
          background: var(--gradient);
        }

        /* Buttons */
        .landing-root .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          height: 48px; padding: 0 26px; border-radius: var(--r-btn);
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px;
          cursor: pointer; border: none; transition: transform .25s ease, box-shadow .25s ease, opacity .25s ease;
          white-space: nowrap;
        }
        .landing-root .btn-primary {
          background: var(--gradient); color: var(--slate);
          box-shadow: 0 8px 20px -6px rgba(44,230,166,0.55);
        }
        .landing-root .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -6px rgba(44,230,166,0.65); }
        .landing-root .btn-secondary {
          background: var(--white); color: var(--slate); border: 1.5px solid var(--gray-200);
        }
        .landing-root .btn-secondary:hover { border-color: var(--slate); transform: translateY(-2px); }
        .landing-root .btn-ghost {
          background: transparent; color: var(--gray-600); height: auto; padding: 0;
          font-weight: 600; border-bottom: 1.5px solid transparent;
        }
        .landing-root .btn-ghost:hover { color: var(--slate); border-color: var(--slate); }

        /* Nav */
        .landing-root .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 18px 0; transition: all .3s ease;
          border-bottom: 1px solid transparent;
        }
        .landing-root .nav.scrolled {
          background: rgba(255,255,255,0.82); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--gray-200); padding: 14px 0;
        }
        .landing-root .nav-inner { display: flex; align-items: center; justify-content: space-between; }
        .landing-root .nav-logo { display: flex; align-items: center; gap: 10px; }
        .landing-root .nav-logo img { height: 28px; width: auto; }
        .landing-root .nav-links { display: flex; align-items: center; gap: 36px; }
        .landing-root .nav-links a { font-size: 14.5px; font-weight: 500; color: var(--gray-600); transition: color .2s; }
        .landing-root .nav-links a:hover { color: var(--slate); }
        .landing-root .nav-cta { display: flex; align-items: center; gap: 22px; }
        .landing-root .nav-menu-btn { display: none; background: none; border: none; cursor: pointer; }
        @media (max-width:900px) {
          .landing-root .nav-links { display: none; }
          .landing-root .nav-menu-btn { display: block; }
        }

        /* Hero */
        .landing-root .hero {
          padding: calc(var(--xxxl) * 2.2) 0 var(--xxxl);
          position: relative;
          background:
            radial-gradient(ellipse 60% 50% at 85% 15%, rgba(200,255,45,0.10), transparent),
            radial-gradient(ellipse 55% 45% at 100% 45%, rgba(52,216,255,0.12), transparent);
        }
        .landing-root .hero-grid {
          display: grid; grid-template-columns: 1.05fr 0.95fr; gap: var(--xxl);
          align-items: center;
        }
        @media (max-width:1000px) { .landing-root .hero-grid { grid-template-columns: 1fr; gap: var(--xxxl); } }

        .landing-root .hero h1 {
          font-size: clamp(36px, 4.6vw, 60px); font-weight: 700; margin-bottom: var(--lg);
        }
        .landing-root .hero h1 .accent {
          background: var(--gradient); -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .landing-root .hero p.lede {
          font-size: 19px; line-height: 1.6; color: var(--gray-600); max-width: 520px; margin-bottom: var(--xl);
        }
        .landing-root .hero-ctas { display: flex; align-items: center; gap: 18px; margin-bottom: var(--xxl); flex-wrap: wrap; }
        .landing-root .hero-stats { display: flex; gap: var(--xxl); flex-wrap: wrap; }
        .landing-root .hero-stat b {
          font-family: 'Manrope', sans-serif; font-size: 26px; font-weight: 700; color: var(--slate); display: block;
        }
        .landing-root .hero-stat span { font-size: 13px; color: var(--gray-600); }

        /* Flow Visualization */
        .landing-root .flow-wrap { position: relative; width: 100%; aspect-ratio: 1/1; max-width: 520px; margin: 0 auto; }
        .landing-root .flow-wrap svg { width: 100%; height: 100%; overflow: visible; }
        .landing-root .flow-path { fill: none; stroke-width: 2; stroke: url(#flowGradient); opacity: 0.55; }
        .landing-root .flow-particle { filter: drop-shadow(0 0 6px rgba(52,216,255,0.9)); }
        .landing-root .node-card {
          position: absolute; background: var(--white); border: 1px solid var(--gray-200);
          border-radius: var(--r-card); box-shadow: var(--shadow-md); padding: 14px 16px;
          display: flex; align-items: center; gap: 10px; width: 168px;
        }
        .landing-root .node-dot { width: 34px; height: 34px; border-radius: 9px; flex: none; display: flex; align-items: center; justify-content: center; }
        .landing-root .node-title { font-size: 13px; font-weight: 700; color: var(--slate); font-family: 'Space Grotesk', sans-serif; }
        .landing-root .node-sub { font-size: 11.5px; color: var(--gray-600); }
        .landing-root .node-producer { top: 6%; left: 0; }
        .landing-root .node-buyer { bottom: 8%; right: 0; }
        .landing-root .node-ai { top: 42%; left: 50%; transform: translate(-50%,-50%); width: auto; flex-direction: column; text-align: center; gap: 4px; padding: 16px; }
        .landing-root .node-ai .node-dot { margin: 0 auto; }

        /* Steps */
        .landing-root .steps { padding: var(--xxxl) 0; }
        .landing-root .section-head { max-width: 640px; margin-bottom: var(--xxl); }
        .landing-root .section-head h2 { font-size: clamp(28px,3.2vw,40px); margin-bottom: var(--md); }
        .landing-root .section-head p { font-size: 17px; color: var(--gray-600); line-height: 1.6; }

        .landing-root .step-row { display: grid; grid-template-columns: repeat(3,1fr); gap: var(--lg); }
        @media (max-width:900px) { .landing-root .step-row { grid-template-columns: 1fr; } }
        .landing-root .step-card {
          background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--r-card);
          padding: var(--xl); position: relative; overflow: hidden;
        }
        .landing-root .step-num {
          font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: var(--white);
          background: var(--slate); width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; margin-bottom: var(--lg);
        }
        .landing-root .step-card h3 { font-size: 19px; margin-bottom: 8px; }
        .landing-root .step-card p { font-size: 14.5px; color: var(--gray-600); line-height: 1.55; }

        .landing-root .live-example {
          margin-top: var(--xxl); border-radius: var(--r-modal); border: 1px solid var(--gray-200);
          background: linear-gradient(180deg, var(--gray-100), var(--white));
          padding: var(--xxl); display: grid; grid-template-columns: 1fr 1fr; gap: var(--xxl); align-items: center;
        }
        @media (max-width:850px) { .landing-root .live-example { grid-template-columns: 1fr; padding: var(--xl); } }
        .landing-root .example-tag {
          display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--slate); background: var(--lime); padding: 6px 12px; border-radius: 999px; margin-bottom: var(--md);
        }
        .landing-root .example-flow { display: flex; flex-direction: column; gap: 10px; font-family: 'Manrope', sans-serif; }
        .landing-root .example-line { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 16px; background: var(--white); border: 1px solid var(--gray-200); border-radius: 10px; }
        .landing-root .example-line span:first-child { font-size: 13.5px; color: var(--gray-600); font-family: 'Inter', sans-serif; }
        .landing-root .example-line span:last-child { font-weight: 700; font-size: 15.5px; color: var(--slate); }
        .landing-root .example-line.highlight { border-color: var(--mint); background: rgba(44,230,166,0.06); }

        /* Features */
        .landing-root .features { padding: var(--xxxl) 0; background: var(--gray-100); }
        .landing-root .feature-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: var(--lg); }
        @media (max-width:900px) { .landing-root .feature-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width:600px) { .landing-root .feature-grid { grid-template-columns: 1fr; } }
        .landing-root .feature-card {
          background: var(--white); border-radius: var(--r-card); padding: var(--xl);
          box-shadow: var(--shadow-sm); transition: box-shadow .25s ease, transform .25s ease;
        }
        .landing-root .feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
        .landing-root .feature-icon {
          width: 44px; height: 44px; border-radius: 12px; background: var(--gradient);
          display: flex; align-items: center; justify-content: center; margin-bottom: var(--lg);
        }
        .landing-root .feature-card h3 { font-size: 17px; margin-bottom: 8px; }
        .landing-root .feature-card p { font-size: 14.5px; color: var(--gray-600); line-height: 1.55; }

        /* AI Insights */
        .landing-root .ai-section { padding: var(--xxxl) 0; }
        .landing-root .ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--xxxl); align-items: center; }
        @media (max-width:950px) { .landing-root .ai-grid { grid-template-columns: 1fr; } }
        .landing-root .ai-list { display: flex; flex-direction: column; gap: var(--lg); margin-top: var(--xl); }
        .landing-root .ai-item { display: flex; gap: 14px; }
        .landing-root .ai-item-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gradient); margin-top: 8px; flex: none; }
        .landing-root .ai-item h4 { font-size: 15.5px; margin-bottom: 4px; font-family: 'Inter', sans-serif; font-weight: 600; }
        .landing-root .ai-item p { font-size: 14px; color: var(--gray-600); line-height: 1.5; }

        .landing-root .dash-card {
          background: var(--slate); border-radius: var(--r-modal); padding: var(--xl);
          box-shadow: var(--shadow-lg); color: var(--white);
        }
        .landing-root .dash-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--lg); }
        .landing-root .dash-head span.tag { font-size: 11.5px; color: rgba(255,255,255,0.55); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
        .landing-root .dash-badge {
          font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
          background: rgba(44,230,166,0.16); color: var(--mint);
        }
        .landing-root .dash-metric { margin-bottom: var(--lg); }
        .landing-root .dash-metric b { font-family: 'Manrope', sans-serif; font-size: 34px; font-weight: 700; display: block; }
        .landing-root .dash-metric span { font-size: 13px; color: rgba(255,255,255,0.55); }
        .landing-root .dash-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; margin-bottom: var(--lg); }
        .landing-root .dash-bar { flex: 1; border-radius: 4px 4px 0 0; background: linear-gradient(180deg, var(--cyan), rgba(52,216,255,0.15)); }
        .landing-root .dash-insight {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 14px 16px; font-size: 13.5px; line-height: 1.5; color: rgba(255,255,255,0.85);
        }
        .landing-root .dash-insight b { color: var(--lime); }

        /* Audience */
        .landing-root .audience { padding: var(--xxxl) 0; background: var(--gray-100); }
        .landing-root .audience-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: var(--md); }
        @media (max-width:950px) { .landing-root .audience-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width:560px) { .landing-root .audience-grid { grid-template-columns: 1fr; } }
        .landing-root .audience-card {
          background: var(--white); border-radius: var(--r-card); padding: var(--lg); border: 1px solid var(--gray-200);
        }
        .landing-root .audience-card h4 { font-size: 15.5px; font-family: 'Inter', sans-serif; font-weight: 600; margin-bottom: 6px; }
        .landing-root .audience-card p { font-size: 13.5px; color: var(--gray-600); line-height: 1.5; }

        /* CTA Banner */
        .landing-root .cta-banner {
          margin: var(--xxxl) auto; max-width: 1200px; padding: var(--xxxl);
          border-radius: 28px; background: var(--slate); position: relative; overflow: hidden;
          text-align: center;
        }
        .landing-root .cta-banner::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 80% at 20% 0%, rgba(200,255,45,0.18), transparent),
                     radial-gradient(ellipse 60% 80% at 80% 100%, rgba(52,216,255,0.18), transparent);
        }
        .landing-root .cta-banner > * { position: relative; }
        .landing-root .cta-banner h2 { color: var(--white); font-size: clamp(26px,3.4vw,38px); margin-bottom: var(--md); }
        .landing-root .cta-banner p { color: rgba(255,255,255,0.6); font-size: 16px; max-width: 460px; margin: 0 auto var(--xl); }
        .landing-root .cta-banner .hero-ctas { justify-content: center; }
        .landing-root .cta-banner .btn-secondary { background: transparent; color: var(--white); border-color: rgba(255,255,255,0.25); }
        .landing-root .cta-banner .btn-secondary:hover { border-color: var(--white); }

        /* Footer */
        .landing-root footer { padding: var(--xxl) 0 var(--xl); border-top: 1px solid var(--gray-200); }
        .landing-root .footer-top {
          display: flex; justify-content: space-between; gap: var(--xxl); flex-wrap: wrap; margin-bottom: var(--xxl);
        }
        .landing-root .footer-brand img { height: 26px; margin-bottom: var(--md); }
        .landing-root .footer-brand p { font-size: 13.5px; color: var(--gray-600); max-width: 260px; line-height: 1.6; }
        .landing-root .footer-cols { display: flex; gap: var(--xxl); flex-wrap: wrap; }
        .landing-root .footer-col h5 { font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-400); margin-bottom: 14px; font-family: 'Inter', sans-serif; font-weight: 600; }
        .landing-root .footer-col a { display: block; font-size: 14px; color: var(--gray-600); margin-bottom: 10px; transition: color .2s; }
        .landing-root .footer-col a:hover { color: var(--slate); }
        .landing-root .footer-bottom {
          display: flex; justify-content: space-between; align-items: center; padding-top: var(--lg);
          border-top: 1px solid var(--gray-200); font-size: 13px; color: var(--gray-400); flex-wrap: wrap; gap: 10px;
        }

        /* Reveal Animation */
        .landing-root .reveal { opacity: 0; transform: translateY(18px); transition: opacity .7s ease, transform .7s ease; }
        .landing-root .reveal.in { opacity: 1; transform: translateY(0); }

        @media (prefers-reduced-motion: reduce) {
          .landing-root .reveal { opacity: 1; transform: none; transition: none; }
          .landing-root * { animation: none !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <div className="container nav-inner">
          <a href="#top" className="nav-logo">
            <img src="/yuga-logo.png" alt="YUGA" />
          </a>
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#ai-insights">AI insights</a>
            <a href="#audience">Who it&apos;s for</a>
          </div>
          <div className="nav-cta">
            <Link to={ROUTES.LOGIN} className="btn-ghost">
              Log in
            </Link>
            <Link to={ROUTES.SIGNUP} className="btn btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow reveal">AI-powered renewable energy marketplace</div>
            <h1 className="reveal">
              Every rooftop is a power plant.<br />
              Let it <span className="accent">trade</span> like one.
            </h1>
            <p className="lede reveal">
              YUGA connects solar producers with buyers through a secure, transparent marketplace — so the surplus clean energy generated by your solar panels seamlessly reaches buyers who need it, automatically valued and tracked in real time.
            </p>
            <div className="hero-ctas reveal">
              <Link to={ROUTES.SIGNUP} className="btn btn-primary">
                Get started
              </Link>
              <a href="#how-it-works" className="btn btn-secondary">
                See how it works
              </a>
            </div>
            <div className="hero-stats reveal">
              <div className="hero-stat">
                <b className="mono-num">3</b>
                <span>Producer, Buyer &amp; Organization roles</span>
              </div>
              <div className="hero-stat">
                <b className="mono-num">24/7</b>
                <span>Live marketplace &amp; monitoring</span>
              </div>
              <div className="hero-stat">
                <b className="mono-num">AI</b>
                <span>Forecasting &amp; anomaly detection</span>
              </div>
            </div>
          </div>

          <div className="flow-wrap reveal">
            <svg viewBox="0 0 400 400">
              <defs>
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C8FF2D" />
                  <stop offset="50%" stopColor="#2CE6A6" />
                  <stop offset="100%" stopColor="#34D8FF" />
                </linearGradient>
              </defs>
              <path id="pathA" className="flow-path" d="M 60,60 C 140,60 140,190 200,200" />
              <path id="pathB" className="flow-path" d="M 200,200 C 260,210 260,330 340,340" />
              <circle r="4.5" fill="#2CE6A6" className="flow-particle">
                <animateMotion dur="3.2s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#pathA" />
                </animateMotion>
              </circle>
              <circle r="4.5" fill="#34D8FF" className="flow-particle">
                <animateMotion dur="3.2s" begin="1.1s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#pathA" />
                </animateMotion>
              </circle>
              <circle r="4.5" fill="#34D8FF" className="flow-particle">
                <animateMotion dur="2.8s" begin="0.3s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#pathB" />
                </animateMotion>
              </circle>
              <circle r="4.5" fill="#C8FF2D" className="flow-particle">
                <animateMotion dur="2.8s" begin="1.6s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#pathB" />
                </animateMotion>
              </circle>
            </svg>

            <div className="node-card node-producer">
              <div className="node-dot" style={{ background: 'linear-gradient(135deg,#C8FF2D,#2CE6A6)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#0B0F17" />
                </svg>
              </div>
              <div>
                <div className="node-title">Producer</div>
                <div className="node-sub">4,000 kWh available</div>
              </div>
            </div>

            <div className="node-card node-ai">
              <div className="node-dot" style={{ background: 'var(--slate)', width: '40px', height: '40px', borderRadius: '11px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="url(#flowGradient)" strokeWidth="1.8" />
                  <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" stroke="url(#flowGradient)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="node-title">AI matching</div>
              <div className="node-sub">Verifies &amp; prices energy</div>
            </div>

            <div className="node-card node-buyer">
              <div className="node-dot" style={{ background: 'linear-gradient(135deg,#2CE6A6,#34D8FF)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 8h16M4 8l1.5 9a2 2 0 0 0 2 1.7h9a2 2 0 0 0 2-1.7L20 8M4 8 3 4M9 12v3M15 12v3" stroke="#0B0F17" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="node-title">Buyer</div>
                <div className="node-sub">Nearby business</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="steps" id="how-it-works">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow">Marketplace overview</div>
            <h2>From surplus generation to a completed trade</h2>
            <p>Three roles, one transparent flow. YUGA sits between the meter and the market, so producers and buyers never have to find each other manually.</p>
          </div>

          <div className="step-row">
            <div className="step-card reveal">
              <div className="step-num">01</div>
              <h3>Generate &amp; measure</h3>
              <p>A producer&apos;s solar, wind, or battery system generates energy. YUGA tracks generation, own consumption, and what&apos;s left over.</p>
            </div>
            <div className="step-card reveal">
              <div className="step-num">02</div>
              <h3>List &amp; discover</h3>
              <p>Surplus energy appears in the marketplace with its source, quantity, location, and verification status — visible to nearby buyers in real time.</p>
            </div>
            <div className="step-card reveal">
              <div className="step-num">03</div>
              <h3>Trade &amp; track</h3>
              <p>A buyer initiates a transaction. YUGA records it, updates both dashboards, and feeds the data back into its AI insights.</p>
            </div>
          </div>

          <div className="live-example reveal">
            <div>
              <span className="example-tag">Real example</span>
              <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>A college with solar panels, a business next door</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '14.5px', lineHeight: 1.6 }}>
                The college generates more than it uses. Instead of that energy going to waste, it&apos;s listed on YUGA — where a nearby business looking for verified renewable energy can find it and trade directly.
              </p>
            </div>
            <div className="example-flow">
              <div className="example-line">
                <span>Generated</span>
                <span className="mono-num">1,000 kWh</span>
              </div>
              <div className="example-line">
                <span>Consumed on-site</span>
                <span className="mono-num">700 kWh</span>
              </div>
              <div className="example-line highlight">
                <span>Available to trade</span>
                <span className="mono-num">300 kWh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow">Why YUGA</div>
            <h2>Built for trust, priced by intelligence</h2>
            <p>YUGA isn&apos;t a bill viewer or a solar installer&apos;s app. It&apos;s a full marketplace layer with AI woven through every transaction.</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#0B0F17" />
                </svg>
              </div>
              <h3>AI-powered recommendations</h3>
              <p>Smart suggestions on when to sell, when to buy, and what a fair price looks like — based on real generation and demand data.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="7" cy="7" r="3" stroke="#0B0F17" strokeWidth="1.8" />
                  <circle cx="17" cy="17" r="3" stroke="#0B0F17" strokeWidth="1.8" />
                  <path d="M9.5 8.5 14.5 15.5" stroke="#0B0F17" strokeWidth="1.8" />
                </svg>
              </div>
              <h3>Peer-to-peer trading</h3>
              <p>Producers and buyers transact directly on the platform — no unnecessary middlemen between the panel and the plug.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 18 9 11 14 15 20 6" stroke="#0B0F17" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Real-time market analytics</h3>
              <p>Live pricing, generation trends, and demand signals surface directly on producer and buyer dashboards.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" stroke="#0B0F17" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Secure &amp; transparent transactions</h3>
              <p>Every trade is authenticated, logged, and auditable — from password hashing to a full transaction trail.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#0B0F17" strokeWidth="1.8" />
                  <path d="M8 12h8M12 8v8" stroke="#0B0F17" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Community-focused ecosystem</h3>
              <p>Built for households, colleges, businesses, and solar farms to trade within the communities they belong to.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="#0B0F17" strokeWidth="1.8" />
                  <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="#0B0F17" strokeWidth="1.8" />
                  <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="#0B0F17" strokeWidth="1.8" />
                  <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="#0B0F17" strokeWidth="1.8" />
                </svg>
              </div>
              <h3>Scalable smart grid integration</h3>
              <p>Designed to grow into smart meters, IoT devices, and automated generation data as your setup gets smarter.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI INSIGHTS */}
      <section className="ai-section" id="ai-insights">
        <div className="container ai-grid">
          <div>
            <div className="eyebrow reveal">AI insights</div>
            <h2 className="reveal">More than a number. Context you can act on.</h2>
            <p className="reveal" style={{ color: 'var(--gray-600)', fontSize: '16px', lineHeight: 1.6, maxWidth: '460px' }}>
              Instead of just showing what happened, YUGA explains what it means — and what to do next.
            </p>

            <div className="ai-list">
              <div className="ai-item reveal">
                <div className="ai-item-dot" />
                <div>
                  <h4>Generation forecasting</h4>
                  <p>Anticipate how much energy you&apos;ll likely generate, so you can plan what to list ahead of time.</p>
                </div>
              </div>
              <div className="ai-item reveal">
                <div className="ai-item-dot" />
                <div>
                  <h4>Consumption patterns</h4>
                  <p>Understand how usage shifts week to week, by role, by location, by season.</p>
                </div>
              </div>
              <div className="ai-item reveal">
                <div className="ai-item-dot" />
                <div>
                  <h4>Anomaly detection</h4>
                  <p>Get flagged the moment generation or consumption looks unusual — before it becomes a problem.</p>
                </div>
              </div>
              <div className="ai-item reveal">
                <div className="ai-item-dot" />
                <div>
                  <h4>Demand forecasting</h4>
                  <p>See where buyer demand is heading, so producers can price and plan with confidence.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-card reveal">
            <div className="dash-head">
              <span className="tag">Consumption · This week</span>
              <span className="dash-badge">Live</span>
            </div>
            <div className="dash-metric">
              <b className="mono-num">
                842 <span style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>kWh</span>
              </b>
              <span>Total energy consumed</span>
            </div>
            <div className="dash-chart">
              <div className="dash-bar" style={{ height: '40%' }} />
              <div className="dash-bar" style={{ height: '55%' }} />
              <div className="dash-bar" style={{ height: '48%' }} />
              <div className="dash-bar" style={{ height: '70%' }} />
              <div className="dash-bar" style={{ height: '62%' }} />
              <div className="dash-bar" style={{ height: '88%' }} />
              <div className="dash-bar" style={{ height: '76%' }} />
            </div>
            <div className="dash-insight">
              Your consumption increased by <b>18%</b> this week compared to your average usage — mostly on Thursday and Friday evenings.
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="audience" id="audience">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow">Who YUGA is for</div>
            <h2>One marketplace, every kind of participant</h2>
          </div>
          <div className="audience-grid">
            <div className="audience-card reveal">
              <h4>Residential producers</h4>
              <p>Homeowners with rooftop solar and smart-home users looking to trade surplus energy.</p>
            </div>
            <div className="audience-card reveal">
              <h4>Commercial buyers</h4>
              <p>Offices, factories, institutions, and shopping complexes sourcing renewable energy.</p>
            </div>
            <div className="audience-card reveal">
              <h4>Renewable producers</h4>
              <p>Solar farms, wind farms, and independent power producers ready to scale trading.</p>
            </div>
            <div className="audience-card reveal">
              <h4>Utilities &amp; agencies</h4>
              <p>Smart grid operators and distribution companies overseeing a transparent local market.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started">
        <div className="cta-banner reveal">
          <h2>A new era of energy starts with your rooftop.</h2>
          <p>Join YUGA to list your surplus energy or find verified renewable power near you.</p>
          <div className="hero-ctas">
            <Link to={ROUTES.SIGNUP} className="btn btn-primary">
              Create your account
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <img src="/yuga-logo.png" alt="YUGA" />
              <p>AI-powered renewable energy trading marketplace. A new era of energy.</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h5>Platform</h5>
                <a href="#how-it-works">How it works</a>
                <a href="#features">Features</a>
                <a href="#ai-insights">AI insights</a>
              </div>
              <div className="footer-col">
                <h5>Roles</h5>
                <a href="#audience">Producers</a>
                <a href="#audience">Buyers</a>
                <a href="#audience">Organizations</a>
              </div>
              <div className="footer-col">
                <h5>Company</h5>
                <a href="#">About</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 YUGA. All rights reserved.</span>
            <span>A New Era of Energy.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
