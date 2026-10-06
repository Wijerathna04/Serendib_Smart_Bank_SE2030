import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  actionPath?: string;
  actionLabel?: string;
  timestamp: string;
}

const KNOWLEDGE_BASE: { keywords: string[]; text: string; actionPath?: string; actionLabel?: string }[] = [
  {
    keywords: ['transfer', 'send money', 'other account', 'beneficiary', 'remittance', 'pay someone'],
    text: "You can send money by navigating to the **Transfers** section. Transfers are organized into three clear options: **Own Accounts**, **Other Accounts** (with bank selection, beneficiary name, and 20-char remarks limit), and **Saved Beneficiaries**. Own account transfers execute instantly without OTPs!",
    actionPath: '/app/transfers',
    actionLabel: 'Go to Transfers'
  },
  {
    keywords: ['card', 'debit', 'credit', 'apply card', 'credit card', 'credit limit', 'visa', 'mastercard'],
    text: "To apply for or manage cards, visit the **Cards** section. You can apply for a **Debit Card** or a **Platinum Credit Card** using our dual interactive bank card tiles. For Credit Cards, bank staff will review your request and assign an approved credit limit.",
    actionPath: '/app/cards',
    actionLabel: 'Go to Cards'
  },
  {
    keywords: ['fixed deposit', 'fd', 'deposit', 'interest rate', 'maturity', 'invest'],
    text: "You can open and track high-yield fixed deposits under **Fixed Deposits**. Choose investment terms from 1 to 60 months, calculate maturity returns in real time, and confirm your deposit with a secure OTP.",
    actionPath: '/app/fixed-deposits',
    actionLabel: 'Go to Fixed Deposits'
  },
  {
    keywords: ['bill', 'bill payment', 'utility', 'electricity', 'water', 'telecom', 'recharge', 'favourite biller'],
    text: "Pay utility, telecom, and insurance bills under **Bill Payments**. You can select from popular Sri Lankan billers or add providers to your **Favourite Billers** for one-click payments.",
    actionPath: '/app/bill-payments',
    actionLabel: 'Go to Bill Payments'
  },
  {
    keywords: ['account', 'primary account', 'balance', 'checking', 'savings', 'default account'],
    text: "View all your savings and current accounts under **Accounts**. Your first opened account under your NIC is set as your **Primary Account** by default. You can change your primary account anytime by clicking 'Set as Primary'.",
    actionPath: '/app/accounts',
    actionLabel: 'Go to Accounts'
  },
  {
    keywords: ['loan', 'personal loan', 'borrow', 'education loan', 'housing loan'],
    text: "Apply for personal, housing, or vehicle loans under **Loans**. View loan terms, interest rates, and track your application review status.",
    actionPath: '/app/loans',
    actionLabel: 'Go to Loans'
  },
  {
    keywords: ['hotline', 'contact', 'phone', 'address', 'headquarters', 'email', 'support', 'help', 'about'],
    text: "Serendib Smart Bank Support:\n📞 **24/7 Hotline: 1991**\n☎️ Direct: +94 11 712 3456 / +94 11 789 0123\n✉️ Email: info@serendibbank.lk (wijerathna.dev.2004@gmail.com)\n📍 HQ: Serendib Smart Bank Towers, No. 452, Baseline Road, Colombo 09.",
    actionPath: '/app/feedback',
    actionLabel: 'Contact Support'
  },
  {
    keywords: ['balance inquiry', 'my balance', 'my account number', 'my pin', 'my money', 'confidential'],
    text: "🔒 **Privacy Protection**: For your security, I am strictly programmed as an application browsing guide. I do **not** access your private account balances, PINs, or personal banking data. You can view your balances directly in your workspace Overview!",
    actionPath: '/app',
    actionLabel: 'Go to Overview'
  },
  {
    keywords: ['customer directory', 'staff', 'manager', 'disable customer', 'delete customer', 'search customer'],
    text: "Bank staff, managers, and admins can search customer profiles in the **Customer Directory** (`/app/employee/customers`) using NIC, Username, CIF Number, or Full Name. Employees can toggle customer status, while customer deletion requires Branch Manager approval.",
    actionPath: '/app/employee/customers',
    actionLabel: 'Go to Customer Directory'
  }
];

export function AiChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "👋 Hi! I'm your Serendib Navigation AI Assistant. I can help you find features, navigate pages, and explore online banking functions. How can I help you browse today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  function handleSend(textToSend?: string) {
    const queryText = (textToSend || input).trim();
    if (!queryText) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = queryText.toLowerCase();
      let matched = KNOWLEDGE_BASE.find((k) => k.keywords.some((kw) => lower.includes(kw)));

      let botResponseText = "";
      let botActionPath: string | undefined = undefined;
      let botActionLabel: string | undefined = undefined;

      if (matched) {
        botResponseText = matched.text;
        botActionPath = matched.actionPath;
        botActionLabel = matched.actionLabel;
      } else {
        botResponseText = "I can guide you anywhere in the Serendib Smart Bank application! You can ask about Transfers, Cards, Fixed Deposits, Bill Payments, Accounts, Customer Directory, or 24/7 Hotline support.";
        botActionPath = '/app';
        botActionLabel = 'Explore Workspace';
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: botResponseText,
        actionPath: botActionPath,
        actionLabel: botActionLabel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  }

  return (
    <>
      {/* ACTIVATION ICON - FIXED AT BOTTOM RIGHT OF SCREEN */}
      <div
        className="ai-bot-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        title="Open Serendib AI Navigation Guide"
      >
        <span className="ai-bot-pulse-ring" />
        <div className="ai-bot-icon-badge">
          {isOpen ? '✕' : '🤖'}
        </div>
        <span className="ai-bot-label-text">{isOpen ? 'Close' : 'AI Assist'}</span>
      </div>

      {/* FLOATING CHATBOT WINDOW */}
      {isOpen && (
        <div className="ai-chatbot-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-brand">
              <div className="ai-chat-avatar">🤖</div>
              <div>
                <h4>Serendib AI Navigator</h4>
                <small>Application Browsing &amp; FAQ Assistant</small>
              </div>
            </div>
            <button className="ai-chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Close AI Chat">
              ✕
            </button>
          </div>

          {/* Privacy Security Banner */}
          <div className="ai-privacy-shield">
            <span>🔒 <strong>Privacy Shield Active</strong>: Navigation &amp; FAQ helper only. No access to private bank accounts or balances.</span>
          </div>

          {/* Message Feed */}
          <div className="ai-chat-messages">
            {messages.map((m) => (
              <div key={m.id} className={`ai-chat-bubble-wrap ${m.sender}`}>
                <div className={`ai-chat-bubble ${m.sender}`}>
                  <p>{m.text}</p>

                  {m.actionPath && (
                    <button
                      className="ai-chat-nav-btn"
                      onClick={() => {
                        navigate(m.actionPath!);
                        if (window.innerWidth < 768) setIsOpen(false);
                      }}
                    >
                      {m.actionLabel || 'Go to page'}
                    </button>
                  )}

                  <span className="ai-chat-time">{m.timestamp}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="ai-chat-bubble-wrap bot">
                <div className="ai-chat-bubble bot typing">
                  <span>AI Navigator is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="ai-chat-chips">
            <button onClick={() => handleSend('How do I send money?')}>💸 Send Money</button>
            <button onClick={() => handleSend('Where can I apply for a credit card?')}>💳 Apply Credit Card</button>
            <button onClick={() => handleSend('How do I open a Fixed Deposit?')}>📈 Fixed Deposits</button>
            <button onClick={() => handleSend('How do I select my primary account?')}>⭐ Primary Account</button>
            <button onClick={() => handleSend('What is the hotline number?')}>📞 Hotline 1991</button>
          </div>

          {/* Input Box */}
          <form
            className="ai-chat-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask how to navigate or find a feature..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()} title="Send Message">
              ▲
            </button>
          </form>
        </div>
      )}
    </>
  );
}
