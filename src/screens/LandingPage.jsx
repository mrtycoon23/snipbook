import { useState } from "react";

/* ─────────────────────────────────────────────
   SnipBook Landing Page — June 2026 redesign
   Usage:
     <LandingPage
        onLogin={() => ...}        // Login button click
        onGetStarted={(email) => ...} // CTA clicks (email optional)
     />
   NOTE: salon-hero.jpg must be in /public folder
───────────────────────────────────────────── */

const CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --purple:      #4318c9;
      --purple-mid:  #5b3fc4;
      --purple-dark: #2d1b69;
      --purple-soft: #ece8f9;
      --purple-bg:   #f4f2ff;
      --text:        #14121f;
      --muted:       #5b5870;
      --lighter:     #9b97ad;
      --green:       #22c55e;
      --green-soft:  #e8f9ef;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fbfbfd;
      color: var(--text);
      overflow-x: hidden;
    }

    .wrap { max-width: 980px; margin: 0 auto; padding: 0 30px; }

    /* ══════════ NAVBAR ══════════ */
    .nav-outer {
      background: #fff;
      border-bottom: 1px solid #f1f0f5;
      position: sticky; top: 0; z-index: 200;
    }
    .nav {
      max-width: 980px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 30px;
    }
    .logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
    .logo-mark {
      width: 38px; height: 38px;
      background: var(--purple); border-radius: 11px;
      display: grid; place-items: center;
      font-size: 17px; color: #fff;
    }
    .logo-name { font-size: 19px; font-weight: 800; letter-spacing: -.3px; color: var(--text); }
    .nav-right { display: flex; align-items: center; gap: 8px; }
    .btn-login { font-size: 14.5px; font-weight: 600; color: #45415c; background: none; border: none; padding: 9px 14px; cursor: pointer; }
    .btn-cta {
      font-size: 14.5px; font-weight: 700; color: #fff;
      background: var(--purple); border: none;
      padding: 10px 20px; border-radius: 9px;
      cursor: pointer; transition: opacity .15s;
    }
    .btn-cta:hover { opacity: .92; }

    /* ══════════ HERO ══════════ */
    .hero {
      display: flex; align-items: flex-start;
      position: relative;
      padding: 40px 0 34px;
      min-height: 560px;
    }
    .hero-left { flex: 0 0 42%; padding-top: 30px; position: relative; z-index: 3; }

    .badge {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 7px 15px;
      background: var(--purple-soft);
      border-radius: 20px;
      font-size: 12.5px; font-weight: 700; color: var(--purple);
      margin-bottom: 22px;
    }
    .badge::before { content: ''; width: 6px; height: 6px; background: var(--purple); border-radius: 50%; }

    h1 {
      font-size: 36px; font-weight: 800;
      line-height: 1.22; letter-spacing: -.5px;
      margin-bottom: 18px;
    }
    h1 .hi { color: var(--purple); }

    .tagline { font-size: 14.5px; color: var(--muted); line-height: 1.95; margin-bottom: 26px; }

    .btn-hero {
      display: inline-block;
      background: var(--purple); color: #fff;
      font-size: 15px; font-weight: 700;
      padding: 15px 34px; border-radius: 12px;
      border: none; cursor: pointer;
      margin-bottom: 26px;
      box-shadow: 0 6px 18px rgba(67,24,201,.28);
      transition: transform .15s, box-shadow .15s;
    }
    .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(67,24,201,.34); }

    .social-proof { display: flex; align-items: center; gap: 12px; }
    .avatars { display: flex; }
    .av {
      width: 34px; height: 34px; border-radius: 50%;
      border: 2.5px solid #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 10.5px; font-weight: 700; color: #fff;
      flex-shrink: 0; margin-left: -10px;
    }
    .av:first-child { margin-left: 0; }
    .proof-text { font-size: 13px; color: var(--muted); font-weight: 600; line-height: 1.55; max-width: 180px; }

    .hero-right { flex: 0 0 58%; position: relative; min-height: 545px; }

    .hero-photo {
      position: absolute; top: 0; left: -10px;
      width: 72%; height: 535px;
      background-image: url('/salon-hero.jpg');
      background-size: cover;
      background-position: center top;
    }
    .hero-photo::after {
      content: '';
      position: absolute; inset: 0;
      background:
        linear-gradient(to right, #fbfbfd 0%, rgba(251,251,253,.55) 5%, transparent 18%),
        linear-gradient(to left, #fbfbfd 0%, rgba(251,251,253,.4) 4%, transparent 14%),
        linear-gradient(to bottom, transparent 80%, #fbfbfd 100%),
        linear-gradient(to top, transparent 93%, #fbfbfd 100%);
    }

    /* ══════════ REALISTIC iPHONE ══════════ */
    .phone-wrap {
      position: absolute; top: 70px; right: -8px;
      z-index: 5; width: 208px;
      filter: drop-shadow(0 14px 22px rgba(0,0,0,.18)) drop-shadow(0 34px 60px rgba(0,0,0,.22));
    }
    .phone-frame {
      position: relative;
      background: linear-gradient(145deg, #5a5a60 0%, #3a3a40 18%, #6b6b72 38%, #2e2e34 60%, #56565c 82%, #3a3a40 100%);
      border-radius: 44px; padding: 3px;
    }
    .sbtn { position: absolute; background: linear-gradient(to right, #4a4a50, #2c2c32); border-radius: 1px; }
    .sbtn.action { left: -1px; top: 88px; width: 1.5px; height: 20px; }
    .sbtn.vol-up { left: -1px; top: 122px; width: 1.5px; height: 32px; }
    .sbtn.vol-dn { left: -1px; top: 162px; width: 1.5px; height: 32px; }
    .sbtn.power  { right: -1px; top: 136px; width: 1.5px; height: 46px; }
    .phone-bezel { background: #050507; border-radius: 41px; padding: 9px; }
    .phone-screen { position: relative; background: #f6f5fa; border-radius: 33px; overflow: hidden; }
    .phone-screen::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(118deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,.05) 26%, transparent 42%);
      pointer-events: none; z-index: 50; border-radius: 33px;
    }
    .dyn-island {
      position: absolute; top: 9px; left: 50%; transform: translateX(-50%);
      width: 64px; height: 18px; background: #050507; border-radius: 12px; z-index: 40;
    }
    .dyn-island::after {
      content: '';
      position: absolute; right: 7px; top: 50%; transform: translateY(-50%);
      width: 7px; height: 7px;
      background: radial-gradient(circle at 35% 35%, #1d2c4a, #060a14 65%);
      border-radius: 50%;
    }
    .status-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 11px 20px 4px;
      font-size: 9.5px; font-weight: 700;
    }
    .status-right { display: flex; gap: 3px; align-items: center; font-size: 8px; }

    /* ── Real WhatsApp look ── */
    .chat-head {
      background: #f7f6f4; padding: 7px 10px;
      display: flex; align-items: center; gap: 7px;
      border-bottom: 1px solid #e4e2dd;
    }
    .chat-back { font-size: 13px; color: #007aff; font-weight: 600; }
    .chat-dp {
      width: 26px; height: 26px;
      background: #cfe5f5; border-radius: 50%;
      display: grid; place-items: center;
      font-size: 12px; flex-shrink: 0;
    }
    .chat-bot-name { font-size: 11.5px; font-weight: 700; color: #111; }
    .chat-status { font-size: 8.5px; color: #8696a0; font-weight: 500; }

    /* WhatsApp beige bg with subtle doodle dots */
    .chat-body {
      padding: 11px 9px 11px;
      display: flex; flex-direction: column; gap: 10px;
      justify-content: space-between;
      min-height: 272px;
      background:
        radial-gradient(circle at 22% 16%, rgba(190,170,140,.10) 0 5px, transparent 6px),
        radial-gradient(circle at 74% 34%, rgba(190,170,140,.10) 0 4px, transparent 5px),
        radial-gradient(circle at 38% 58%, rgba(190,170,140,.10) 0 5px, transparent 6px),
        radial-gradient(circle at 82% 76%, rgba(190,170,140,.10) 0 4px, transparent 5px),
        radial-gradient(circle at 14% 86%, rgba(190,170,140,.10) 0 5px, transparent 6px),
        #efeae2;
    }

    .bub {
      position: relative;
      max-width: 85%;
      padding: 7px 10px 5px;
      font-size: 11.5px;
      line-height: 1.45;
      color: #111b21;
      border-radius: 9px;
      box-shadow: 0 1px 1px rgba(0,0,0,.08);
    }
    .bub-out { background: #d9fdd3; align-self: flex-end; border-top-right-radius: 0; }
    .bub-in  { background: #ffffff; align-self: flex-start; border-top-left-radius: 0; }

    /* Bubble tails */
    .bub-out::after {
      content: '';
      position: absolute; top: 0; right: -5px;
      border: 5px solid transparent;
      border-top-color: #d9fdd3;
      border-right: none;
    }
    .bub-in::after {
      content: '';
      position: absolute; top: 0; left: -5px;
      border: 5px solid transparent;
      border-top-color: #ffffff;
      border-left: none;
    }

    .bub-meta {
      display: inline-flex; align-items: center; gap: 2px;
      float: right;
      margin: 4px -2px -1px 6px;
      font-size: 7.5px; color: #8696a0;
    }
    .ticks { color: #53bdeb; font-size: 8px; letter-spacing: -1.5px; }

    /* Booking confirmed — incoming white card, WA style */
    .bub-confirm {
      position: relative;
      background: #ffffff;
      align-self: flex-start;
      max-width: 88%;
      padding: 8px 11px 5px;
      border-radius: 9px; border-top-left-radius: 0;
      box-shadow: 0 1px 1px rgba(0,0,0,.08);
      font-size: 11.5px; color: #111b21;
    }
    .bub-confirm::after {
      content: '';
      position: absolute; top: 0; left: -5px;
      border: 5px solid transparent;
      border-top-color: #ffffff;
      border-left: none;
    }
    .conf-title { font-size: 11.5px; font-weight: 700; display: block; }
    .conf-date { font-size: 11px; display: block; margin-top: 2px; }

    /* WhatsApp input bar */
    .wa-input-bar {
      display: flex; align-items: center; gap: 5px;
      background: #f7f6f4;
      padding: 5px 8px 4px;
      border-top: 1px solid #e4e2dd;
    }
    .wa-plus { font-size: 13px; color: #007aff; font-weight: 400; }
    .wa-field {
      flex: 1;
      background: #fff;
      border: 1px solid #e0ded8;
      border-radius: 12px;
      padding: 6px 9px;
      font-size: 9px; color: #b3b1ab;
      display: flex; justify-content: flex-end;
    }
    .wa-cam, .wa-mic { font-size: 11px; }

    .home-indicator { width: 72px; height: 4px; background: #1c1c20; border-radius: 3px; margin: 5px auto 5px; }

    /* ══════════ FEATURES CARD ══════════ */
    .features-card {
      background: #fff; border-radius: 22px;
      padding: 32px 14px;
      display: grid; grid-template-columns: repeat(5, 1fr);
      box-shadow: 0 2px 8px rgba(20,18,31,.04), 0 12px 32px rgba(20,18,31,.06);
      position: relative; z-index: 4;
      margin-bottom: 56px;
    }
    .feat { text-align: center; padding: 0 8px; }
    .feat-icon {
      width: 54px; height: 54px;
      background: var(--purple-soft); border-radius: 50%;
      display: grid; place-items: center;
      font-size: 22px; margin: 0 auto 14px;
    }
    .feat-title { font-size: 13.5px; font-weight: 800; margin-bottom: 6px; line-height: 1.3; }
    .feat-desc { font-size: 11.5px; color: var(--lighter); line-height: 1.55; font-weight: 500; }

    /* ══════════ FLOW SECTION ══════════ */
    .flow-section { text-align: center; padding-bottom: 60px; }
    .badge-green {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 7px 16px;
      background: var(--green-soft);
      border: 1px solid #c8efd9;
      border-radius: 20px;
      font-size: 12.5px; font-weight: 700; color: #16a34a;
      margin-bottom: 18px;
    }
    .badge-green::before { content: ''; width: 6px; height: 6px; background: var(--green); border-radius: 50%; }

    h2 { font-size: 32px; font-weight: 800; letter-spacing: -.4px; margin-bottom: 10px; }
    .sub { font-size: 15px; color: var(--lighter); margin-bottom: 40px; }

    .flow-steps {
      display: flex; justify-content: center; align-items: flex-start;
      gap: 6px; margin-bottom: 44px;
    }
    .flow-step { text-align: center; width: 104px; }
    .flow-icon {
      width: 64px; height: 64px; border-radius: 50%;
      display: grid; place-items: center;
      font-size: 26px; margin: 0 auto 13px;
    }
    .fi-green  { background: var(--green-soft); }
    .fi-purple { background: var(--purple-soft); }
    .fi-blue   { background: #e3edfd; }
    .fi-yellow { background: #fdf3d4; }
    .flow-lbl { font-size: 13px; font-weight: 800; line-height: 1.4; }
    .flow-arrow { font-size: 15px; color: #cdcade; padding-top: 24px; }

    .stats-bar {
      background: var(--purple-bg);
      border-radius: 22px;
      display: grid; grid-template-columns: repeat(4, 1fr);
      padding: 36px 16px;
    }
    .stat { text-align: center; }
    .stat-num { font-size: 30px; font-weight: 800; color: var(--purple-dark); display: block; }
    .stat-lbl { font-size: 13px; color: var(--lighter); font-weight: 600; display: block; margin-top: 7px; }

    /* ══════════ CTA SECTION ══════════ */
    .cta-outer { background: var(--purple-bg); padding: 64px 0 70px; }
    .cta-section { text-align: center; }

    .demo-line {
      display: flex; justify-content: center; align-items: center;
      gap: 14px; margin-bottom: 30px; flex-wrap: wrap;
    }
    .demo-in {
      background: #fff;
      border: 1px solid #e7e4f2;
      padding: 13px 22px;
      border-radius: 26px;
      font-size: 14px; font-weight: 700;
    }
    .demo-arrow { color: #b9b5cc; font-size: 16px; }
    .demo-out {
      background: var(--green); color: #fff;
      padding: 13px 22px;
      border-radius: 26px;
      font-size: 14px; font-weight: 800;
      box-shadow: 0 6px 16px rgba(34,197,94,.3);
    }

    .cta-section h2 { font-size: 34px; }
    .cta-section .sub { margin-bottom: 30px; }

    .email-row {
      display: flex; justify-content: center;
      max-width: 470px; margin: 0 auto 20px;
      background: #fff;
      border: 1px solid #e7e4f2;
      border-radius: 12px;
      padding: 5px;
      box-shadow: 0 4px 16px rgba(20,18,31,.06);
    }
    .email-input {
      flex: 1; border: none; outline: none;
      padding: 12px 16px;
      font-size: 14.5px;
      font-family: inherit;
      background: transparent;
      color: var(--text);
    }
    .email-input::placeholder { color: #b3afc4; }
    .email-btn {
      background: var(--purple); color: #fff;
      font-size: 14.5px; font-weight: 700;
      padding: 12px 22px;
      border-radius: 9px; border: none; cursor: pointer;
      white-space: nowrap;
      transition: opacity .15s;
    }
    .email-btn:hover { opacity: .92; }

    .checks { display: flex; justify-content: center; gap: 26px; flex-wrap: wrap; }
    .check { font-size: 12.5px; color: var(--muted); font-weight: 600; }
    .check::before { content: '● '; color: var(--green); font-size: 9px; }

    /* ══════════ FOOTER ══════════ */
    .footer-outer { background: #fff; border-top: 1px solid #f1f0f5; }
    .footer {
      max-width: 980px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 30px;
    }
    .footer .logo-mark { width: 32px; height: 32px; font-size: 14px; border-radius: 9px; }
    .footer .logo-name { font-size: 16px; }
    .copyright { font-size: 12.5px; color: var(--lighter); font-weight: 500; }
    .footer-login {
      font-size: 13px; font-weight: 700;
      color: var(--purple); text-decoration: underline;
    }

    /* ══════════ RESPONSIVE ══════════ */
    @media (max-width: 820px) {
      .flow-steps { flex-wrap: wrap; gap: 18px; }
      .flow-arrow { display: none; }
    }
    @media (max-width: 720px) {
      h1 { font-size: 28px; }
      h2 { font-size: 26px; }
      .hero { flex-direction: column; min-height: unset; }
      .hero-left { flex: 1; width: 100%; }
      .hero-right { flex: 1; width: 100%; min-height: 500px; margin-top: 10px; }
      .hero-photo { width: 78%; height: 470px; left: -16px; }
      .phone-wrap { right: 0; top: 60px; width: 190px; }
      .features-card { grid-template-columns: 1fr 1fr; gap: 26px 0; }
      .stats-bar { grid-template-columns: 1fr 1fr; gap: 26px 0; }
      .email-row { flex-direction: column; gap: 8px; padding: 8px; }
      .email-btn { width: 100%; }
      .footer { flex-direction: column; gap: 12px; text-align: center; }
    }
  `;

export default function LandingPage({ onStart, onLogin }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  // Same behavior as old Landing: email diya → success banner, warna onboarding
  const handleEmailSubmit = () => {
    if (email.trim()) setDone(true);
    else if (onStart) onStart();
  };
  const handleGetStarted = () => {
    if (onStart) onStart();
  };

  return (
    <div style={{minHeight:"100vh",overflowY:"auto",overflowX:"hidden"}}>
      <style>{CSS}</style>

      {/* ══ NAVBAR ══ */}
      <div className="nav-outer">
        <nav className="nav">
          <a href="#" className="logo" onClick={(e) => e.preventDefault()}>
            <div className="logo-mark">✂</div>
            <span className="logo-name">SnipBook</span>
          </a>
          <div className="nav-right">
            <button className="btn-login" onClick={onLogin}>Login</button>
            <button className="btn-cta" onClick={handleGetStarted}>Get Started →</button>
          </div>
        </nav>
      </div>

      <div className="wrap">

        {/* ══ HERO ══ */}
        <section className="hero">
          <div className="hero-left">
            <div className="badge">Early Access — Beta</div>
            <h1>Apne Salon Ki Bookings <span className="hi">WhatsApp Pe Auto-Pilot Karo</span></h1>
            <p className="tagline">Client WhatsApp karta hai.<br/>SnipBook booking confirm karta hai.<br/>Aap bas customers serve karo.</p>
            <button className="btn-hero" onClick={handleGetStarted}>Start Free – 3 Min Setup</button>
            <div className="social-proof">
              <div className="avatars">
                <div className="av" style={{background:"#b08968"}}>RS</div>
                <div className="av" style={{background:"#7f5539"}}>PM</div>
                <div className="av" style={{background:"#9c6644"}}>AK</div>
                <div className="av" style={{background:"#6366f1"}}>VK</div>
              </div>
              <span className="proof-text">Trusted by salon owners across India</span>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-photo"></div>

            {/* Realistic iPhone */}
            <div className="phone-wrap">
              <div className="phone-frame">
                <div className="sbtn action"></div>
                <div className="sbtn vol-up"></div>
                <div className="sbtn vol-dn"></div>
                <div className="sbtn power"></div>
                <div className="phone-bezel">
                  <div className="phone-screen">
                    <div className="dyn-island"></div>
                    <div className="status-bar">
                      <span>9:41</span>
                      <span className="status-right">▮▮▮ 🛜 🔋</span>
                    </div>
                    <div className="chat-head">
                      <span className="chat-back">‹</span>
                      <div className="chat-dp">👤</div>
                      <div>
                        <div className="chat-bot-name">SnipBook Bot</div>
                        <div className="chat-status">online</div>
                      </div>
                    </div>
                    <div className="chat-body">
                      <div className="bub bub-out">Haircut booking karni hai<span className="bub-meta">10:21 <span className="ticks">✓✓</span></span></div>
                      <div className="bub bub-in">Namaste! Kaun si service? 💇<span className="bub-meta">10:21</span></div>
                      <div className="bub bub-out">Haircut<span className="bub-meta">10:22 <span className="ticks">✓✓</span></span></div>
                      <div className="bub bub-in">Kal 11:00 AM chalega?<span className="bub-meta">10:22</span></div>
                      <div className="bub bub-out">Haan, confirm karo<span className="bub-meta">10:22 <span className="ticks">✓✓</span></span></div>
                      <div className="bub-confirm">
                        <span className="conf-title">✅ Booking Confirmed!</span>
                        <span className="conf-date">📅 4 June, 11:00 AM</span>
                        <span className="bub-meta">10:23</span>
                      </div>
                    </div>
                    <div className="wa-input-bar">
                      <span className="wa-plus">＋</span>
                      <div className="wa-field">🏷</div>
                      <span className="wa-cam">📷</span>
                      <span className="wa-mic">🎙</span>
                    </div>
                    <div className="home-indicator"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <div className="features-card" id="features">
          <div className="feat">
            <div className="feat-icon">💬</div>
            <div className="feat-title">WhatsApp First</div>
            <div className="feat-desc">Clients book via WhatsApp</div>
          </div>
          <div className="feat">
            <div className="feat-icon">📵</div>
            <div className="feat-title">Zero Missed Calls</div>
            <div className="feat-desc">Never miss a booking again</div>
          </div>
          <div className="feat">
            <div className="feat-icon">📲</div>
            <div className="feat-title">No App Download</div>
            <div className="feat-desc">Works inside WhatsApp itself</div>
          </div>
          <div className="feat">
            <div className="feat-icon">🕐</div>
            <div className="feat-title">24/7 Booking</div>
            <div className="feat-desc">Bot works round the clock</div>
          </div>
          <div className="feat">
            <div className="feat-icon">⚡</div>
            <div className="feat-title">3 Minute Setup</div>
            <div className="feat-desc">Get started in just 3 minutes</div>
          </div>
        </div>

        {/* ══ FLOW SECTION ══ */}
        <section className="flow-section" id="how">
          <div className="badge-green">Early Access — Beta</div>
          <h2>Your Salon Runs Itself.</h2>
          <p className="sub">From WhatsApp message to confirmed booking in seconds.</p>

          <div className="flow-steps">
            <div className="flow-step">
              <div className="flow-icon fi-green">💬</div>
              <div className="flow-lbl">Customer WhatsApp</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon fi-purple">🤖</div>
              <div className="flow-lbl">AI Replies Instantly</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon fi-blue">📅</div>
              <div className="flow-lbl">Booking Created</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon fi-yellow">🔔</div>
              <div className="flow-lbl">Calendar Updated</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon fi-green">📈</div>
              <div className="flow-lbl">Revenue Updated</div>
            </div>
          </div>

          <div className="stats-bar">
            <div className="stat"><span className="stat-num">3 min</span><span className="stat-lbl">Setup time</span></div>
            <div className="stat"><span className="stat-num">24/7</span><span className="stat-lbl">Bot always active</span></div>
            <div className="stat"><span className="stat-num">Zero</span><span className="stat-lbl">Missed bookings</span></div>
            <div className="stat"><span className="stat-num">100%</span><span className="stat-lbl">WhatsApp native</span></div>
          </div>
        </section>

      </div>

      {/* ══ CTA SECTION ══ */}
      <div className="cta-outer" id="pricing">
        <div className="wrap">
          <section className="cta-section">
            <div className="demo-line">
              <span className="demo-in">Kal 3 baje haircut chahiye</span>
              <span className="demo-arrow">→</span>
              <span className="demo-out">✅ Booked! Tomorrow 3 PM</span>
            </div>

            <h2>Try <span style={{color:"var(--purple)"}}>SnipBook Free</span></h2>
            <p className="sub">No credit card required. 3 minute setup. Cancel anytime.</p>

            {!done ? (
              <div className="email-row">
                <input
                  type="email"
                  className="email-input"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEmailSubmit(); }}
                />
                <button className="email-btn" onClick={handleEmailSubmit}>Get Started →</button>
              </div>
            ) : (
              <div style={{background:"#ece8f9",border:"2px solid #c4b8f0",borderRadius:12,padding:12,maxWidth:470,margin:"0 auto 20px",fontWeight:800,color:"#4318c9",fontSize:14}}>🎉 We'll be in touch soon!</div>
            )}

            <div className="checks">
              <span className="check">No credit card</span>
              <span className="check">3 min setup</span>
              <span className="check">Cancel anytime</span>
            </div>
          </section>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div className="footer-outer">
        <footer className="footer">
          <a href="#" className="logo" onClick={(e) => e.preventDefault()}>
            <div className="logo-mark">✂</div>
            <span className="logo-name">SnipBook</span>
          </a>
          <span className="copyright">© 2026 SnipBook · Made for Indian Salons</span>
          <a href="#" className="footer-login" onClick={(e) => { e.preventDefault(); if (onLogin) onLogin(); }}>Login →</a>
        </footer>
      </div>

    </div>
  );
}
