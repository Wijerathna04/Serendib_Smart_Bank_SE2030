import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageButtons, useLanguage } from '../i18n';
import ThemeToggle from '../components/ThemeToggle';
import ExchangeRates from '../components/ExchangeRates';
import { AiChatbotAssistant } from '../components/AiChatbotAssistant';
import { WhatsAppAgentButton } from '../components/WhatsAppAgentButton';
import { autoScrollTo } from '../utils/scrollHelper';
import {
  ACCOUNTS_CATALOG,
  FIXED_DEPOSITS_CATALOG,
  LOANS_CATALOG,
  CARDS_CATALOG,
  ProductItem
} from '../data/productCatalog';
import './GuestPage.css';

const services = [
  ['Money transfers', '↗', 'Send money with OTP confirmation.', 'Save a beneficiary, choose your source account and confirm transfers between supported accounts using an OTP. Track the outcome in transaction history.'],
  ['Bill payments', '≡', 'Take care of the everyday.', 'Pay supported billers from your account, confirm the payment and keep a record of the transaction in one place. All payments are simulated.'],
  ['Transaction history', '◷', 'A clearer view of your activity.', 'Search and filter past transactions, inspect their status and open individual records for payment details.'],
  ['Help & feedback', '◇', 'We are here to listen.', 'Send a private service request, share feedback or read published customer reviews. Staff can review and respond to your requests.']
];

const typewriterWords: Record<'en' | 'si' | 'ta', string[]> = {
  en: ['ease', 'Ambitions', 'Assets'],
  si: ['පහසුව', 'බලාපොරොත්තු', 'සම්පත්'],
  ta: ['எளிமை', 'இலட்சியங்கள்', 'சொத்துக்கள்']
};

const typewriterPrefix: Record<'en' | 'si' | 'ta', string> = {
  en: 'Your',
  si: 'ඔබේ',
  ta: 'உங்கள்'
};

const typewriterLine2: Record<'en' | 'si' | 'ta', string> = {
  en: 'Our Responsibility.',
  si: 'අපගේ වගකීම.',
  ta: 'எங்கள் பொறுப்பு.'
};

export default function GuestPage() {
  const { t, language } = useLanguage();
  const currentLang = (language === 'si' || language === 'ta') ? language : 'en';

  const [activeCategory, setActiveCategory] = useState<'Accounts' | 'Fixed Deposits' | 'Loans' | 'Cards'>('Accounts');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedService, setSelectedService] = useState<string[] | null>(null);
  const productDialogRef = useRef<HTMLDialogElement>(null);
  const serviceDialogRef = useRef<HTMLDialogElement>(null);

  // Typewriter effect state
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeletingWord, setIsDeletingWord] = useState(false);

  useEffect(() => {
    const wordList = typewriterWords[currentLang];
    const targetWord = wordList[typewriterIndex % wordList.length];

    let timer: number;

    if (isDeletingWord) {
      timer = window.setTimeout(() => {
        setTypedText(prev => prev.slice(0, -1));
      }, 50);
    } else {
      timer = window.setTimeout(() => {
        setTypedText(prev => targetWord.slice(0, prev.length + 1));
      }, 100);
    }

    if (!isDeletingWord && typedText === targetWord) {
      timer = window.setTimeout(() => {
        setIsDeletingWord(true);
      }, 1800);
    } else if (isDeletingWord && typedText === '') {
      setIsDeletingWord(false);
      setTypewriterIndex(prev => (prev + 1) % wordList.length);
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeletingWord, typewriterIndex, currentLang]);

  function openProductDetail(item: ProductItem) {
    setSelectedProduct(item);
    productDialogRef.current?.showModal();
  }

  function openServiceDetail(service: string[]) {
    setSelectedService(service);
    serviceDialogRef.current?.showModal();
  }

  function handleCategoryClick(cat: 'Accounts' | 'Fixed Deposits' | 'Loans' | 'Cards') {
    setActiveCategory(cat);
    autoScrollTo('#products-grid', 90, 500);
  }

  const currentProducts = activeCategory === 'Accounts'
    ? ACCOUNTS_CATALOG
    : activeCategory === 'Fixed Deposits'
      ? FIXED_DEPOSITS_CATALOG
      : activeCategory === 'Loans'
        ? LOANS_CATALOG
        : CARDS_CATALOG;

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="guest-page">
      {/* HEADER COMPONENT */}
      <header className={`guest-header guest-glass ${isScrolled ? 'scrolled-ribbon' : 'initial-ribbon'}`}>
        <Link className="brand guest-brand" to="/">
          <img className="brand-mark" src="/images/logo.jpeg" alt="Serendib Smart Bank Logo" />
          <span>serendib<small>SMART BANK</small></span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#about" onClick={(e) => { e.preventDefault(); autoScrollTo('#about', 85, 550); }}>{t('About Us')}</a>
          <a href="#products" onClick={(e) => { e.preventDefault(); autoScrollTo('#products', 85, 550); }}>{t('Products')}</a>
          <a href="#services" onClick={(e) => { e.preventDefault(); autoScrollTo('#services', 85, 550); }}>{t('Services')}</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); autoScrollTo('#contact', 85, 550); }}>{t('Contact Us')}</a>
          <a href="#questions" onClick={(e) => { e.preventDefault(); autoScrollTo('#questions', 85, 550); }}>{t('FAQs')}</a>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <LanguageButtons />
          <Link className="guest-button guest-login" to="/login">{t('Log in')}</Link>
        </div>
      </header>

      <main id="guest-content">
        {/* HERO SECTION */}
        <section className="guest-hero">
          <div className="guest-hero-copy">
            <span className="guest-pill"><span />{t('Banking, with you in mind.')}</span>
            <h1>
              <span>{typewriterPrefix[currentLang]} <em>{typedText}</em><span className="typewriter-cursor">|</span></span>
              <br />
              <em>{typewriterLine2[currentLang]}</em>
            </h1>
            <p>{t('A simpler way to manage today and plan for tomorrow with CBSL regulated financial security.')}</p>
            <div className="guest-actions">
              <Link className="guest-button" to="/register">{t('Get started')}</Link>
              <a className="guest-text-link" href="#products" onClick={(e) => { e.preventDefault(); autoScrollTo('#products', 85, 550); }}>{t('Explore our products')}</a>
            </div>
          </div>

          <div className="guest-art" aria-hidden="true">
            <div className="guest-orb guest-orb-one" />
            <div className="guest-orb guest-orb-two" />
            <div className="guest-art-ring" />
            <div className="guest-float guest-float-top guest-glass">
              <span className="guest-icon">↗</span>
              <div><small>serendib</small><strong>{t('Make room for your future goals.')}</strong></div>
            </div>
            <div className="guest-display-card">
              <div className="guest-card-brand">serendib <span>SMART BANK</span></div>
              <div className="guest-chip" />
              <div className="guest-card-message">{t('Your everyday.')}<br />{t('Your bank.')}</div>
              <div className="guest-card-bottom">
                <span>DEMONSTRATION CARD</span>
                <span className="guest-card-circles"><i /><i /></span>
              </div>
            </div>
            <div className="guest-float guest-float-bottom guest-glass">
              <span className="guest-icon">◎</span>
              <strong>{t('Everyday balances, all in one place.')}</strong>
            </div>
          </div>
        </section>

        <ExchangeRates />

        {/* ABOUT US SECTION */}
        <section className="guest-section" id="about" style={{ scrollMarginTop: '80px' }}>
          <div className="guest-section-heading">
            <div>
              <span className="guest-eyebrow">About Serendib Smart Bank</span>
              <h2>Pioneering Digital Banking &amp; Financial Excellence</h2>
            </div>
            <p style={{ maxWidth: '420px' }}>
              Founded with a commitment to integrity, financial empowerment, and technological innovation, Serendib Smart Bank delivers seamless retail, corporate, and investment banking solutions across Sri Lanka.
            </p>
          </div>

          <div style={{
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            margin: '2rem 0',
            border: '1px solid var(--gold-border)',
            boxShadow: 'var(--shadow-card)',
            minHeight: '260px',
            display: 'flex',
            alignItems: 'flex-end',
            background: `linear-gradient(180deg, rgba(10,11,16,0.2) 0%, rgba(10,11,16,0.95) 100%), url('/images/human_banking_client.jpg') center/cover no-repeat`
          }}>
            <div style={{ padding: '2rem', maxWidth: '640px' }}>
              <span className="guest-eyebrow" style={{ color: 'var(--color-gold-light)' }}>EXECUTIVE PRIVATE BANKING</span>
              <h3 style={{ color: '#fff', fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.25rem 0 0.5rem 0' }}>Bespoke Wealth Consultation</h3>
              <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.95rem', margin: 0 }}>
                Experience tailored wealth advisory, dedicated relationship managers, and instant digital account command built for discerning clients.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="guest-glass" style={{ padding: '1.75rem', borderRadius: '20px', overflow: 'hidden' }}>
              <img src="/images/accounting_desk_banner.jpeg" alt="Heritage Governance" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border)' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Our Heritage &amp; Governance</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                Regulated under Central Bank of Sri Lanka guidelines, we adhere to strict risk management, two-tier branch manager verification, and robust multi-factor authentication.
              </p>
            </div>

            <div className="guest-glass" style={{ padding: '1.75rem', borderRadius: '20px', overflow: 'hidden' }}>
              <img src="/images/human_digital_banking.jpg" alt="Digital Banking" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border)' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Digital Banking Built for You</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                From instant own-account fund transfers and automated bill payments to customized high-yield fixed deposits and loan scrutiny, we empower customers with 24/7 digital access.
              </p>
            </div>

            <div className="guest-glass" style={{ padding: '1.75rem', borderRadius: '20px', overflow: 'hidden' }}>
              <img src="/images/financial_chart_banner.jpeg" alt="Security Excellence" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border)' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Security &amp; Privacy Excellence</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                We protect your financial assets using end-to-end encryption, OTP verification for third-party transactions, and strict role-based access controls protecting customer records.
              </p>
            </div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section className="guest-section" id="products" style={{ scrollMarginTop: '80px' }}>
          <div className="guest-section-heading">
            <div>
              <span className="guest-eyebrow">{t('Product Catalog')}</span>
              <h2>{t('Tailored accounts, term deposits & credit facilities')}</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['Accounts', 'Fixed Deposits', 'Loans', 'Cards'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`secondary ${activeCategory === cat ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    background: activeCategory === cat ? 'var(--primary-sovereign-cta)' : undefined,
                    color: activeCategory === cat ? '#0A0B10 !important' : undefined
                  }}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div id="products-grid" className="guest-products">
            {currentProducts.map(item => (
              <div
                className="guest-product guest-glass"
                key={item.id}
                data-icon={item.icon}
                onClick={() => openProductDetail(item)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') openProductDetail(item); }}
              >
                <span className="guest-icon guest-product-icon-top">{item.icon}</span>
                <span className="guest-product-tag">{item.category}</span>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="guest-product-detail">
                  <span>{item.rateOrYield || 'Details'}</span>
                  <span>View Details</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section className="guest-section" id="services" style={{ scrollMarginTop: '80px' }}>
          <div className="guest-services guest-glass">
            <div className="guest-service-intro">
              <span className="guest-eyebrow">Digital Capabilities</span>
              <h2>Services designed for speed and clarity</h2>
              <p>Execute everyday transfers, manage billers, and track transactions with real-time verification.</p>
              <a className="guest-text-link" href="#products" onClick={(e) => { e.preventDefault(); autoScrollTo('#products', 85, 550); }}>
                Explore products
              </a>
            </div>

            <div className="guest-service-grid">
              {services.map(srv => (
                <div
                  key={srv[0]}
                  className="guest-capability-card"
                  data-icon={srv[1]}
                  onClick={() => openServiceDetail(srv)}
                >
                  <div className="guest-capability-header">
                    <span className="guest-icon guest-capability-icon">{srv[1]}</span>
                    <span className="guest-capability-badge">ONLINE BANKING</span>
                  </div>
                  <h3>{t(srv[0])}</h3>
                  <p>{t(srv[2])}</p>
                  <div className="guest-capability-footer">
                    <span>Explore capability</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQS SECTION */}
        <section className="guest-section" id="questions" style={{ scrollMarginTop: '80px' }}>
          <div className="guest-faq">
            <div>
              <span className="guest-eyebrow">Frequently Asked Questions</span>
              <h2>Everything you need to know about Serendib Smart Bank</h2>
              <p>Find quick answers to common questions regarding account opening, OTP verification, and loan scrutiny.</p>
              <a className="guest-text-link" href="#contact" onClick={(e) => { e.preventDefault(); autoScrollTo('#contact', 85, 550); }}>
                Need more help? Contact support
              </a>
            </div>

            <div className="guest-faq-list">
              <details>
                <summary>How do I open an online banking account?</summary>
                <p>You can register online using your NIC, mobile number, and email. If you already hold an account at a Serendib Smart Bank branch, you can activate instant online access in under two minutes.</p>
              </details>
              <details>
                <summary>Why is OTP verification required for third-party fund transfers?</summary>
                <p>Under CBSL security regulations, third-party transfers and bill payments require a One-Time Password sent to your registered contact channel to guarantee complete security.</p>
              </details>
              <details>
                <summary>What are the approval requirements for Fixed Deposits over 1,000,000 LKR?</summary>
                <p>Placements exceeding 1 Million LKR are submitted for Branch Manager review. Once approved, funding is automatically transferred from your selected source account.</p>
              </details>
              <details>
                <summary>Can I apply for collateralized loans backed by my Fixed Deposit?</summary>
                <p>Yes. Active Fixed Deposits can be pledged as collateral for instant loans up to 90% of the principal amount with preferential interest rates.</p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="guest-section" id="contact" style={{ scrollMarginTop: '80px' }}>
          <div className="guest-cta guest-glass">
            <div>
              <h2>Ready to experience modern digital banking?</h2>
              <p>Join thousands of Sri Lankan personal and business customers managing their financial future with Serendib Smart Bank.</p>
            </div>
            <Link className="guest-button" to="/register">Create Account Now ↗</Link>
          </div>
        </section>
      </main>

      {/* FOOTER COMPONENT */}
      <footer className="guest-footer" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.75rem', marginBottom: '1.5rem' }}>
          <div>
            <strong style={{ fontSize: '1.1rem', color: 'var(--color-gold-primary)', display: 'block', marginBottom: '0.4rem', fontFamily: 'Playfair Display' }}>
              Serendib Smart Bank
            </strong>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
              Licensed Commercial Bank regulated by the Central Bank of Sri Lanka. Empowering individuals and enterprises across Sri Lanka.
            </p>
          </div>

          <div>
            <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>24/7 Hotline &amp; Support</strong>
            <div style={{ color: 'var(--color-gold-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>
              📞 Hotline: <a href="tel:1991" style={{ color: 'var(--color-gold-primary)', textDecoration: 'underline' }}>1991</a>
            </div>
            <div>
              ✉️ Email: <a href="mailto:wijerathna.dev.2004@gmail.com" style={{ color: 'var(--color-gold-primary)', textDecoration: 'underline', fontWeight: 600 }}>info@serendibbank.lk</a>
            </div>
          </div>

          <div>
            <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>Contact Numbers</strong>
            <div>☎️ <a href="tel:+94117123456" style={{ color: 'inherit', textDecoration: 'underline' }}>+94 11 712 3456</a></div>
            <div>☎️ <a href="tel:+94117890123" style={{ color: 'inherit', textDecoration: 'underline' }}>+94 11 789 0123</a></div>
          </div>

          <div>
            <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>Headquarters Address</strong>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
              Serendib Smart Bank Towers,<br />
              No. 452, Baseline Road,<br />
              Colombo 09, Sri Lanka
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.85rem' }}>
          <span>Serendib Smart Bank SE2030 · Group 2026-Y2-S1-MLB-B5G1-02</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#about" onClick={(e) => { e.preventDefault(); autoScrollTo('#about', 85, 550); }}>About</a>
            <a href="#products" onClick={(e) => { e.preventDefault(); autoScrollTo('#products', 85, 550); }}>Products</a>
            <Link to="/reviews">{t('Customer reviews')}</Link>
          </div>
        </div>
      </footer>

      {/* Product Detail Dialog */}
      <dialog
        ref={productDialogRef}
        className="product-dialog"
        aria-labelledby="product-title"
        onClick={(e) => {
          if (e.target === productDialogRef.current) productDialogRef.current.close();
        }}
      >
        {selectedProduct && (
          <>
            <button className="dialog-close secondary" autoFocus onClick={() => productDialogRef.current?.close()} aria-label={t('Close')}>
              ×
            </button>
            <span className="guest-icon" aria-hidden="true" style={{ fontSize: '2.5rem' }}>{selectedProduct.icon}</span>
            <h2 id="product-title" style={{ fontFamily: 'Playfair Display', margin: '0.5rem 0' }}>{selectedProduct.name}</h2>
            {selectedProduct.nameSi && <p style={{ fontStyle: 'italic', opacity: 0.8 }}>{selectedProduct.nameSi}</p>}
            {selectedProduct.rateOrYield && (
              <div style={{ background: 'rgba(201,162,39,0.15)', color: 'var(--color-gold-primary)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 'bold', display: 'inline-block', margin: '0.5rem 0 1rem' }}>
                {selectedProduct.rateOrYield}
              </div>
            )}
            <p style={{ fontSize: '1rem', lineHeight: 1.5 }}>{selectedProduct.description}</p>

            <h4 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontFamily: 'Playfair Display' }}>Key Features &amp; Benefits:</h4>
            <ul style={{ paddingLeft: '1.2rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {selectedProduct.features.map((feat, idx) => (
                <li key={idx}>{feat}</li>
              ))}
            </ul>

            {selectedProduct.requiresManagerApproval && (
              <div className="callout" style={{ background: 'rgba(245,158,11,0.15)', borderLeft: '4px solid #f59e0b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                <strong>Branch Manager Approval Required:</strong> Under bank governance, applications for this product are verified by staff and approved by the Branch Manager.
              </div>
            )}

            <div className="actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="button secondary" onClick={() => productDialogRef.current?.close()}>Close</button>
              <Link className="button" to="/login">Open / Apply Now</Link>
            </div>
          </>
        )}
      </dialog>

      {/* Service Detail Dialog */}
      <dialog
        ref={serviceDialogRef}
        className="product-dialog"
        aria-labelledby="service-title"
        onClick={(e) => {
          if (e.target === serviceDialogRef.current) serviceDialogRef.current.close();
        }}
      >
        {selectedService && (
          <>
            <button className="dialog-close secondary" autoFocus onClick={() => serviceDialogRef.current?.close()} aria-label={t('Close')}>
              ×
            </button>
            <span className="guest-icon" aria-hidden="true">{selectedService[1]}</span>
            <h2 id="service-title" style={{ fontFamily: 'Playfair Display' }}>{t(selectedService[0])}</h2>
            <h3>{t(selectedService[2])}</h3>
            <p>{t(selectedService[3])}</p>
            <Link className="button" to="/login">{t('Continue to sign in')}</Link>
          </>
        )}
      </dialog>

      <WhatsAppAgentButton />
      <AiChatbotAssistant />
    </div>
  );
}
