import { useAuth } from '../auth/AuthProvider';

export function WhatsAppAgentButton() {
  const { role } = useAuth();

  // Hide only for internal staff/manager/admin roles
  if (role === 'EMPLOYEE' || role === 'MANAGER' || role === 'ADMIN') return null;

  return (
    <a
      href="https://wa.me/94784761258?text=Hello%20Serendib%20Smart%20Bank%20Agent%2C%20I%20would%20like%20to%20chat%20regarding%20my%20account."
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-floating-btn"
      title="Chat with us on WhatsApp"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="whatsapp-icon-badge">
        <img
          src="/images/logos/whatsapp.jpeg"
          alt="WhatsApp Logo"
          style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }}
        />
      </span>
      <span className="whatsapp-label-text">Chat with us</span>
    </a>
  );
}

