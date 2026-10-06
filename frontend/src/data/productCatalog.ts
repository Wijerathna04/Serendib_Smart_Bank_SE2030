export interface ProductItem {
  id: string;
  name: string;
  nameSi?: string;
  category: 'Accounts' | 'Fixed Deposits' | 'Loans' | 'Cards';
  tagline: string;
  description: string;
  rateOrYield?: string;
  features: string[];
  icon: string;
  badge?: string;
  requiresManagerApproval?: boolean;
}

export const ACCOUNTS_CATALOG: ProductItem[] = [
  {
    id: 'prime-investor',
    name: 'Serendib Prime Investor Savings',
    nameSi: 'සෙරෙන්ඩිබ් ප්‍රයිම් ඉන්වෙස්ටර් ඉතිරිකිරීමේ ගිණුම',
    category: 'Accounts',
    tagline: 'High-yield cash reserves with elite rates.',
    description: 'Earn an elite tiered interest rate up to 11.5% p.a. calculated daily and paid monthly. Ideal for maintaining high-liquidity cash reserves while matching fixed-income yields.',
    rateOrYield: 'Up to 11.5% p.a.',
    features: [
      'Tiered interest up to 11.5% p.a.',
      'Daily interest calculation, paid monthly',
      'High liquidity with instant online access',
      'Free monthly e-statements'
    ],
    icon: '◎',
    badge: 'Popular'
  },
  {
    id: 'youth-wave',
    name: 'YouthWave Digital Account',
    nameSi: 'යුත් වේව් ඩිජිටල් ගිණුම',
    category: 'Accounts',
    tagline: 'Paperless zero-balance smart banking for youth (18–26).',
    description: 'A completely paperless zero-balance smart account for youth aged 18–26. Includes a free virtual debit card, instant internet banking, and exclusive cashback discounts at leading local merchant outlets.',
    rateOrYield: '7.0% p.a.',
    features: [
      'Zero minimum balance requirement',
      'Free instant virtual debit card',
      'Exclusive merchant discounts & cashbacks',
      'Paperless instant digital onboarding'
    ],
    icon: '⚡',
    badge: 'Youth 18-26'
  },
  {
    id: 'ranbima-senior',
    name: 'Ranbima Senior Citizens Scheme',
    nameSi: 'රන්බිම ජ්‍යෙෂ්ඨ පුරවැසි ගිණුම',
    category: 'Accounts',
    tagline: 'Secure retirement with premium returns & healthcare perks.',
    description: 'Secure your retirement with an additional 1.5% premium over standard savings rates. Includes priority banking service counters island-wide and free monthly medical check-up vouchers.',
    rateOrYield: '+1.5% Premium Rate',
    features: [
      '+1.5% bonus over standard savings rate',
      'Island-wide priority counter access',
      'Free monthly medical check-up vouchers',
      'Quarterly interest bonus rewards'
    ],
    icon: '🛡️',
    badge: 'Senior 60+'
  },
  {
    id: 'personal-rfc',
    name: 'Serendib Personal RFC (Resident Foreign Currency)',
    nameSi: 'පුද්ගලික විදේශ විනිමය ගිණුම (RFC)',
    category: 'Accounts',
    tagline: 'Multi-currency foreign exchange savings (USD, GBP, EUR, AUD).',
    description: 'Protect your wealth against local currency fluctuations. Hold, save, and transact seamlessly in major international currencies including USD, GBP, EUR, and AUD.',
    rateOrYield: 'Competitive FX Rates',
    features: [
      'Hold USD, GBP, EUR, and AUD',
      'Zero currency conversion penalty on transfers',
      'Seamless inward/outward remittance support',
      'Tax-exempt interest options under CBSL'
    ],
    icon: '🌐',
    badge: 'Foreign Currency'
  },
  {
    id: 'liya-saviya',
    name: 'Liya Saviya Ladies Savings Account',
    nameSi: 'ලියා සවිය කාන්තා ඉතිරිකිරීමේ ගිණුම',
    category: 'Accounts',
    tagline: 'Empowering women with premium rates & micro-loans.',
    description: 'A premier savings scheme designed to empower women. Offers a premium 0.75% bonus interest over standard rates, higher limits on debit card cashbacks, free critical illness insurance coverage, and zero-margin micro-loans for women entrepreneurs.',
    rateOrYield: '+0.75% Bonus Interest',
    features: [
      '+0.75% bonus interest rate',
      'Free critical illness insurance cover up to LKR 1M',
      'Zero-margin micro-loans for entrepreneurs',
      'Higher cashback limits on shopping'
    ],
    icon: '🌸',
    badge: 'Women Special'
  },
  {
    id: 'dynamic-corporate',
    name: 'Serendib Dynamic Corporate Current Account',
    nameSi: 'ඩයිනමික් ආයතනික ජංගම ගිණුම',
    category: 'Accounts',
    tagline: 'Engineered for growing local enterprises with LankaPay/CEFT integration.',
    description: 'Engineered for growing local enterprises. Features a zero-fee checkbook facility, unlimited monthly clearing transactions, free integration with national payment gateways (LankaPay/CEFT), and a complimentary bulk salary processing tool.',
    rateOrYield: 'Corporate Tier',
    features: [
      'Zero-fee personalized checkbooks',
      'Unlimited monthly clearing transactions',
      'Free LankaPay/CEFT gateway integration',
      'Complimentary bulk salary processing tool'
    ],
    icon: '🏛️',
    badge: 'Manager Approval Required',
    requiresManagerApproval: true
  },
  {
    id: 'smartbiz-proprietor',
    name: 'SmartBiz Sole Proprietor Current Account',
    nameSi: 'ස්මාර්ට්බිස් තනි පුද්ගල ව්‍යාපාරික ගිණුම',
    category: 'Accounts',
    tagline: 'Tailored for small business owners, freelancers & TOD overdraft buffer.',
    description: 'Tailored for small business owners and freelancers. A low minimum-balance account bundled with a dedicated POS merchant terminal at subsidized rates, automated tax statement generation, and a temporary overdraft (TOD) buffer facility up to LKR 500,000.',
    rateOrYield: 'TOD Buffer up to 500K',
    features: [
      'Subsidized POS merchant terminal',
      'Temporary Overdraft (TOD) up to LKR 500,000',
      'Automated annual tax statement generator',
      'Low minimum balance requirement'
    ],
    icon: '💼',
    badge: 'Manager Approval Required',
    requiresManagerApproval: true
  }
];

export const FIXED_DEPOSITS_CATALOG: ProductItem[] = [
  {
    id: 'maturity-maximizer',
    name: 'Maturity Maximizer (1-Year Term)',
    nameSi: '1-වසරක ස්ථාවර තැන්පතුව (Maturity Maximizer)',
    category: 'Fixed Deposits',
    tagline: 'Lock in 13.0% per annum return paid upon maturity.',
    description: 'Lock in a secure 13.0% per annum return paid directly upon maturity. The ultimate low-risk wealth generation tool for short-term financial milestones.',
    rateOrYield: '13.0% p.a.',
    features: [
      '13.0% fixed annual return',
      '12-month tenure commitment',
      'Full maturity payout guaranteed',
      'Automatic renewal option'
    ],
    icon: '◈',
    badge: '1-Year Term'
  },
  {
    id: 'monthly-income-generator',
    name: 'Monthly Income Generator',
    nameSi: 'මාසික ආදායම් උත්පාදක ස්ථාවර තැන්පතුව',
    category: 'Fixed Deposits',
    tagline: 'Guaranteed interest disbursed on the 1st of every month.',
    description: 'Perfect for monthly budgeting. Deposit your capital for a 2 to 5-year tenure and receive guaranteed interest disbursements directly to your savings account on the 1st of every month.',
    rateOrYield: 'Monthly Payout',
    features: [
      '2 to 5 years tenure options',
      'Disbursement on the 1st of every month',
      'Direct link to your savings account',
      'Ideal for fixed monthly budgeting'
    ],
    icon: '🗓️',
    badge: '2-5 Years'
  },
  {
    id: 'ranaviru-upahara',
    name: 'Ranaviru Upahara Special FD',
    nameSi: 'රණවිරු උපහාර විශේෂ ස්ථාවර තැන්පතුව',
    category: 'Fixed Deposits',
    tagline: 'Dedicated high-yield investment for active & retired tri-forces.',
    description: 'A dedicated high-yield investment window tailored specifically for active and retired tri-forces personnel, offering customized flexible milestone tenures and zero premature withdrawal penalties.',
    rateOrYield: '13.5% p.a.',
    features: [
      'Special 13.5% p.a. return rate',
      'Zero premature withdrawal penalties',
      'Flexible milestone tenures',
      'Dedicated hero counter service'
    ],
    icon: '🎖️',
    badge: 'Tri-Forces Special'
  },
  {
    id: 'flexi-term-short',
    name: 'Flexi-Term Short Deposit',
    nameSi: 'කෙටිකාලීන මයික්‍රෝ ස්ථාවර තැන්පතුව',
    category: 'Fixed Deposits',
    tagline: 'Micro-tenures (30, 60, 90 days) with automated rollover.',
    description: 'Don\'t lock your capital down for years. Enjoy highly competitive yield rates on micro-tenures ranging from 30, 60, to 90 days with automated rollover options.',
    rateOrYield: 'Micro-Tenure Yields',
    features: [
      '30, 60, or 90 days tenures',
      'Automated rollover instructions',
      'High liquidity for short terms',
      'Low entry threshold'
    ],
    icon: '⏳',
    badge: '30-90 Days'
  }
];

export const LOANS_CATALOG: ProductItem[] = [
  {
    id: 'fd-backed-loan',
    name: 'FD Backed Loan (Secured by Fixed Deposit)',
    nameSi: 'ස්ථාවර තැන්පතු ඇපයට තබා ගන්නා ණය පහසුකම',
    category: 'Loans',
    tagline: 'Receive up to 50% of your Fixed Deposit principal (over LKR 1M) at 7.50% interest.',
    description: 'Instant credit facility secured by your active Fixed Deposit worth over LKR 1,000,000. Receive up to 50% of your FD value at an attractive low interest rate of 7.50% while your FD is safely frozen as collateral until full payoff.',
    rateOrYield: '7.50% p.a. (50% FD Value)',
    features: [
      'Borrow up to 50% of Fixed Deposit principal (>= LKR 1M)',
      'Low annual interest rate of 7.50%',
      'Fixed Deposit safely frozen until loan is paid off with interest',
      'Instant disbursement directly to your account'
    ],
    icon: '🔒',
    badge: 'FD Secured (50% Cap)'
  },
  {
    id: 'home-premium',
    name: 'Serendib Home Premium Loan',
    nameSi: 'සෙරෙන්ඩිබ් නිවාස ණය පහසුකම',
    category: 'Loans',
    tagline: 'Build your dream home with tenures up to 25 years from 10.25%.',
    description: 'Build or purchase your dream home with extended repayment tenures up to 25 years. Features transparent floating or fixed interest rates starting from just 10.25%.',
    rateOrYield: 'From 10.25% p.a.',
    features: [
      'Repayment tenures up to 25 years',
      'Starting interest rates from 10.25%',
      'Transparent floating or fixed rate options',
      'Home construction & land purchase eligible'
    ],
    icon: '⌂',
    badge: 'Manager Approval Required',
    requiresManagerApproval: true
  },
  {
    id: 'nena-haras-education',
    name: 'Nena Haras Higher Education Loan',
    nameSi: 'නෙණ හාරස් උසස් අධ්‍යාපන ණය පහසුකම',
    category: 'Loans',
    tagline: 'Full tuition coverage with principal deferred until graduation.',
    description: 'Empower your academic journey at local private universities or international campuses. Offers full tuition coverage with a customized grace period that defers principal repayments until graduation.',
    rateOrYield: 'Grace Period Included',
    features: [
      'Full tuition & campus fee coverage',
      'Principal deferred until graduation',
      'Local & international university eligibility',
      'Low interest rates during study tenure'
    ],
    icon: '🎓',
    badge: 'Manager Approval Required',
    requiresManagerApproval: true
  },
  {
    id: 'speeddraft-credit-line',
    name: 'SpeedDraft Personal Credit Line',
    nameSi: 'ස්පීඩ් ඩ්‍රාෆ්ට් පුද්ගලික ණය පහසුකම',
    category: 'Loans',
    tagline: 'Instant financial backing up to LKR 3M within 24 hours.',
    description: 'Get instant financial backing up to LKR 3 Million within 24 hours. Minimal documentation required with flexible settlement options tailored around your monthly salary cycle.',
    rateOrYield: 'Up to LKR 3 Million',
    features: [
      'Up to LKR 3,000,000 credit limit',
      'Approval & availability within 24 hours',
      'Minimal paperwork required',
      'Flexible monthly salary-linked settlements'
    ],
    icon: '⚡',
    badge: 'Manager Approval Required',
    requiresManagerApproval: true
  },
  {
    id: 'greendrive-leasing',
    name: 'GreenDrive Hybrid & EV Leasing',
    nameSi: 'ග්‍රීන් ඩ්‍රයිව් විදුලි හා හයිබ්‍රිඩ් වාහන ලීසිං',
    category: 'Loans',
    tagline: 'Specialized low rates & 1-hour approval for EV & hybrid vehicles.',
    description: 'Drive towards a sustainable future with custom vehicle leases featuring specialized lower interest rates, flexible down-payment brackets, and quick 1-hour approval times.',
    rateOrYield: 'Special Lower Rates',
    features: [
      'Specialized lower interest rates for EVs/Hybrids',
      'Flexible down-payment brackets',
      'Fast 1-hour approval workflow',
      'Comprehensive insurance package integration'
    ],
    icon: '🚗',
    badge: 'Manager Approval Required',
    requiresManagerApproval: true
  }
];

export const CARDS_CATALOG: ProductItem[] = [
  {
    id: 'infinite-visa',
    name: 'Serendib Infinite Visa Credit Card',
    nameSi: 'සෙරෙන්ඩිබ් ඉන්ෆිනිට් වීසා ණය පත',
    category: 'Cards',
    tagline: '1,200+ airport lounges, travel insurance & 24/7 concierge.',
    description: 'Crafted for the elite global traveler. Enjoy complimentary access to 1,200+ airport lounges worldwide, comprehensive international travel insurance, and dedicated 24/7 concierge assistance.',
    rateOrYield: 'Elite Travel Status',
    features: [
      '1,200+ global airport lounge visits',
      'Free USD 500,000 international travel insurance',
      '24/7 dedicated personal concierge',
      'Global emergency card replacement'
    ],
    icon: '▱',
    badge: 'Visa Infinite'
  },
  {
    id: 'signature-lifestyle',
    name: 'Signature Lifestyle Mastercard',
    nameSi: 'සිග්නේචර් ලයිෆ්ස්ටයිල් මාස්ටර් කාඩ් පත',
    category: 'Cards',
    tagline: 'Up to 20% seasonal discounts at dining, supermarkets & resorts.',
    description: 'Elevate your daily living with up to 20% seasonal discounts at premium Sri Lankan dining establishments, supermarkets, and luxury resort getaways.',
    rateOrYield: '20% Seasonal Promos',
    features: [
      'Up to 20% off at premier dining outlets',
      'Supermarket weekend cashback offers',
      'Exclusive resort & hotel package deals',
      'Interest-free installment schemes'
    ],
    icon: '💳',
    badge: 'Mastercard Signature'
  },
  {
    id: 'smartcash-fuel-utility',
    name: 'SmartCash Fuel & Utility Debit Card',
    nameSi: 'ස්මාර්ට් කැෂ් ඉන්ධන හා උපයෝගිතා හර පත',
    category: 'Cards',
    tagline: 'Instant 2% cashback on fuel & utility bill payments.',
    description: 'Save as you spend. Receive an instant 2% cashback on all fuel station payments and utility bill settlements executed via the Serendib Smart Banking app.',
    rateOrYield: '2% Instant Cashback',
    features: [
      '2% instant cashback on all fuel stations',
      '2% cashback on CEB, NWSDB & telecom bills',
      'Instant in-app cashback notifications',
      'Zero annual maintenance fees'
    ],
    icon: '⛽',
    badge: '2% Cashback Debit'
  },
  {
    id: 'freedom-virtual-prepaid',
    name: 'Freedom Virtual Prepaid Card',
    nameSi: 'ෆ්‍රීඩම් වර්චුවල් පූර්ව ගෙවුම් කාඩ් පත',
    category: 'Cards',
    tagline: 'Single-use or reloadable virtual cards for safe online shopping.',
    description: 'Take complete control over your online security. Generate instant single-use or reloadable virtual cards directly in your app for safe global e-commerce and streaming subscription management.',
    rateOrYield: 'Zero Security Risk',
    features: [
      'Instant single-use virtual card generation',
      'Customizable spending limits',
      'Ideal for Netflix, Amazon, Spotify & global e-commerce',
      'Instant freeze and delete options'
    ],
    icon: '🔒',
    badge: 'Virtual Security'
  }
];
