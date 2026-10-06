export interface BillCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface SriLankanBiller {
  id: string;
  name: string;
  category: string;
  logoSvg: string;
  logoUrl?: string;
  refLabel: string;
  refPlaceholder: string;
  sampleRef: string;
  popular?: boolean;
}

export const BILL_CATEGORIES: BillCategory[] = [
  { id: 'TELECOMMUNICATION', name: 'Telco', icon: '📱', description: 'Mobile, Landline & Broadband' },
  { id: 'ELECTRICITY', name: 'Electricity', icon: '⚡', description: 'Power & Energy Utilities' },
  { id: 'WATER', name: 'Water', icon: '💧', description: 'National Water Supply' },
  { id: 'INSURANCE', name: 'Insurance', icon: '🛡️', description: 'Life, Vehicle & Health Insurance' },
  { id: 'TELEVISION', name: 'Television', icon: '📺', description: 'Satellite & Cable TV' },
  { id: 'FINANCE', name: 'Finance', icon: '🏦', description: 'Leasing, Loans & Investments' },
  { id: 'GOVT_BILLS', name: 'Govt. Bills', icon: '🏛️', description: 'Taxes, Customs & Revenue License' },
  { id: 'EDUCATION', name: 'Education', icon: '🎓', description: 'Universities, Colleges & Institutes' },
  { id: 'TRAVEL', name: 'Travel', icon: '✈️', description: 'Airlines, Rides & Expressway Toll' },
  { id: 'HOSPITALS', name: 'Hospitals', icon: '🏥', description: 'Private Hospitals & Healthcare' },
  { id: 'FUEL_SUPPLIERS', name: 'Fuel Suppliers', icon: '⛽', description: 'Petroleum & Energy Station Pass' },
];

export const SRI_LANKAN_BILLERS: SriLankanBiller[] = [
  // TELECOMMUNICATION
  {
    id: 'dialog_telecom',
    name: 'Dialog Axiata',
    category: 'TELECOMMUNICATION',
    refLabel: 'Mobile / Account Number',
    refPlaceholder: 'e.g. 0771234567 or 10048291',
    sampleRef: '0771234567',
    popular: true,
    logoUrl: '/images/logos/Dialog_Axiata_logo.svg.webp',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#D90429"/>
      <path d="M50 20L63 42L85 36L70 54L82 74L60 66L50 86L40 66L18 74L30 54L15 36L37 42L50 20Z" fill="#FFB703"/>
      <path d="M50 20L63 42L50 48Z" fill="#FB8500"/>
      <path d="M85 36L70 54L58 46Z" fill="#E63946"/>
      <path d="M82 74L60 66L56 52Z" fill="#023E8A"/>
      <path d="M18 74L30 54L42 52Z" fill="#0077B6"/>
      <text x="50" y="93" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">Dialog</text>
    </svg>`
  },
  {
    id: 'slt_mobitel',
    name: 'SLT Mobitel',
    category: 'TELECOMMUNICATION',
    refLabel: 'Mobile / Telephone No.',
    refPlaceholder: 'e.g. 0712345678 or 0112345678',
    sampleRef: '0712345678',
    popular: true,
    logoUrl: '/images/logos/SLTMobitel_Logo.svg.webp',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0284C7"/>
      <path d="M22 68C32 28 68 28 78 68" stroke="#10B981" stroke-width="12" stroke-linecap="round"/>
      <path d="M32 58C40 36 60 36 68 58" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="7" fill="#F59E0B"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">SLT MOBITEL</text>
    </svg>`
  },
  {
    id: 'slt_fibre',
    name: 'Sri Lanka Telecom (Fibre)',
    category: 'TELECOMMUNICATION',
    refLabel: 'SLT Account / Landline No.',
    refPlaceholder: 'e.g. 0112876543',
    sampleRef: '0112876543',
    logoUrl: '/images/logos/SLTMobitel_Logo.svg.webp',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0B132B"/>
      <circle cx="50" cy="42" r="24" stroke="#38BDF8" stroke-width="5" stroke-dasharray="6 3"/>
      <circle cx="50" cy="42" r="14" fill="#0284C7"/>
      <path d="M50 18V66M26 42H74" stroke="#67E8F9" stroke-width="3.5" stroke-linecap="round"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="11" fill="#38BDF8" text-anchor="middle">SLT FIBRE</text>
    </svg>`
  },
  {
    id: 'airtel_sl',
    name: 'Airtel Sri Lanka',
    category: 'TELECOMMUNICATION',
    refLabel: 'Airtel Mobile Number',
    refPlaceholder: 'e.g. 0751234567',
    sampleRef: '0751234567',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#E11D48"/>
      <path d="M28 66C28 32 72 32 72 66C72 48 50 48 50 66" fill="#FFFFFF"/>
      <circle cx="50" cy="62" r="5" fill="#E11D48"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle">airtel</text>
    </svg>`
  },
  {
    id: 'hutch_sl',
    name: 'Hutch Sri Lanka',
    category: 'TELECOMMUNICATION',
    refLabel: 'Hutch Mobile Number',
    refPlaceholder: 'e.g. 0781234567',
    sampleRef: '0781234567',
    logoUrl: '/images/logos/hutch_main_logo_clean.webp',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#FF5722"/>
      <rect x="20" y="24" width="60" height="42" rx="10" fill="#1E293B"/>
      <text x="50" y="53" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#FF5722" text-anchor="middle">hutch</text>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">HUTCH</text>
    </svg>`
  },

  // ELECTRICITY
  {
    id: 'ceb_electricity',
    name: 'CEB - Ceylon Electricity Board',
    category: 'ELECTRICITY',
    refLabel: '10-Digit CEB Account Number',
    refPlaceholder: 'e.g. 5420194812',
    sampleRef: '5420194812',
    popular: true,
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#1E3A8A"/>
      <path d="M50 14L22 36V64L50 86L78 64V36L50 14Z" stroke="#FACC15" stroke-width="4" fill="#172554"/>
      <path d="M56 22L28 54H48L40 78L72 46H52L56 22Z" fill="#FACC15"/>
      <text x="50" y="94" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">CEB</text>
    </svg>`
  },
  {
    id: 'leco_electricity',
    name: 'LECO - Lanka Electricity Co.',
    category: 'ELECTRICITY',
    refLabel: 'LECO Account Number',
    refPlaceholder: 'e.g. 0481920148',
    sampleRef: '0481920148',
    logoUrl: '/images/logos/leco_logo.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#047857"/>
      <circle cx="50" cy="42" r="24" stroke="#FBBF24" stroke-width="6" stroke-dasharray="8 4"/>
      <path d="M40 32L62 42L40 52" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">LECO</text>
    </svg>`
  },

  // WATER
  {
    id: 'nwsdb_water',
    name: 'NWSDB - Water Supply Board',
    category: 'WATER',
    refLabel: '12-Digit Water Account No.',
    refPlaceholder: 'e.g. 12/04/891/014/19',
    sampleRef: '12/04/891/014/19',
    popular: true,
    logoUrl: '/images/logos/Water-Board-Logo.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0284C7"/>
      <path d="M50 16C50 16 22 48 22 64C22 79.4 34.5 90 50 90C65.5 90 78 79.4 78 64C78 48 50 16 50 16Z" fill="#E0F2FE"/>
      <path d="M50 28C50 28 32 52 32 64C32 73.9 40 81 50 81C60 81 68 73.9 68 64C68 52 50 28 50 28Z" fill="#38BDF8"/>
      <path d="M35 62C40 68 60 68 65 62" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
      <text x="50" y="93" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="10" fill="#0369A1" text-anchor="middle">NWSDB</text>
    </svg>`
  },

  // INSURANCE
  {
    id: 'ceylinco_life',
    name: 'Ceylinco Life Insurance',
    category: 'INSURANCE',
    refLabel: 'Policy Number',
    refPlaceholder: 'e.g. CEY-POL-849102',
    sampleRef: 'CEY-POL-849102',
    logoUrl: '/images/logos/ceylife-logo.svg',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#1E1B4B"/>
      <path d="M50 16L82 30V54C82 72 50 86 50 86C50 86 18 72 18 54V30L50 16Z" fill="#DC2626"/>
      <circle cx="50" cy="48" r="16" fill="#F59E0B"/>
      <path d="M50 36L53 43L60 44L55 49L56 56L50 52L44 56L45 49L40 44L47 43L50 36Z" fill="#FFFFFF"/>
      <text x="50" y="93" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">CEYLINCO LIFE</text>
    </svg>`
  },
  {
    id: 'slic_insurance',
    name: 'Sri Lanka Insurance (SLIC)',
    category: 'INSURANCE',
    refLabel: 'Policy / Proposal No.',
    refPlaceholder: 'e.g. SLIC-9481920',
    sampleRef: 'SLIC-9481920',
    logoUrl: '/images/logos/Sri_Lanka_Insurance_new_logo.jpg',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#1D4ED8"/>
      <path d="M25 25H75V44C75 62 50 78 50 78C50 78 25 62 25 44V25Z" fill="#FACC15"/>
      <path d="M50 33L54 41L63 42L56 48L58 57L50 52L42 57L44 48L37 42L46 41L50 33Z" fill="#1D4ED8"/>
      <text x="50" y="92" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">SLIC</text>
    </svg>`
  },
  {
    id: 'aia_insurance',
    name: 'AIA Insurance Sri Lanka',
    category: 'INSURANCE',
    refLabel: 'AIA Policy Number',
    refPlaceholder: 'e.g. AIA-7482910',
    sampleRef: 'AIA-7482910',
    logoUrl: '/images/logos/AiA.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#991B1B"/>
      <path d="M50 18L78 68H62L50 46L38 68H22L50 18Z" fill="#FFFFFF"/>
      <path d="M50 32L62 54H38L50 32Z" fill="#991B1B"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">AIA</text>
    </svg>`
  },
  {
    id: 'union_assurance',
    name: 'Union Assurance',
    category: 'INSURANCE',
    refLabel: 'Policy / NIC Number',
    refPlaceholder: 'e.g. UA-8491029',
    sampleRef: 'UA-8491029',
    logoUrl: '/images/logos/union-assuarance-logo.svg',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0D9488"/>
      <circle cx="50" cy="44" r="22" fill="#FFFFFF"/>
      <path d="M50 26L55 38L67 40L58 48L60 60L50 54L40 60L42 48L33 40L45 38L50 26Z" fill="#0D9488"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">UNION ASSURANCE</text>
    </svg>`
  },

  // TELEVISION
  {
    id: 'dialog_tv',
    name: 'Dialog Television',
    category: 'TELEVISION',
    refLabel: 'Connection / Account No.',
    refPlaceholder: 'e.g. 74829104',
    sampleRef: '74829104',
    popular: true,
    logoUrl: '/images/logos/Dialog_Axiata_logo.svg.webp',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#BE123C"/>
      <rect x="18" y="22" width="64" height="46" rx="10" fill="#1E293B" stroke="#FFFFFF" stroke-width="4"/>
      <path d="M35 78L50 68L65 78" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
      <path d="M42 35L62 45L42 55V35Z" fill="#F59E0B"/>
      <text x="50" y="93" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">Dialog TV</text>
    </svg>`
  },
  {
    id: 'slt_peo_tv',
    name: 'SLT PEO TV',
    category: 'TELEVISION',
    refLabel: 'PEO TV Account Number',
    refPlaceholder: 'e.g. 0112948192',
    sampleRef: '0112948192',
    logoUrl: '/images/logos/SLTMobitel_Logo.svg.webp',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#4C1D95"/>
      <circle cx="50" cy="45" r="24" fill="#06B6D4"/>
      <path d="M42 30L66 45L42 60V30Z" fill="#FFFFFF"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">PEO TV</text>
    </svg>`
  },

  // FINANCE
  {
    id: 'lolc_finance',
    name: 'LOLC Finance',
    category: 'FINANCE',
    refLabel: 'Leasing / Facility No.',
    refPlaceholder: 'e.g. LOLC-LEASE-9481',
    sampleRef: 'LOLC-LEASE-9481',
    logoUrl: '/images/logos/LOLC.svg',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#1E40AF"/>
      <rect x="18" y="24" width="64" height="40" rx="8" fill="#FACC15"/>
      <text x="50" y="52" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#1E40AF" text-anchor="middle">LOLC</text>
      <text x="50" y="90" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">FINANCE</text>
    </svg>`
  },
  {
    id: 'lb_finance',
    name: 'LB Finance',
    category: 'FINANCE',
    refLabel: 'Account / Contract No.',
    refPlaceholder: 'e.g. LBF-8491029',
    sampleRef: 'LBF-8491029',
    logoUrl: '/images/logos/LB finance.svg',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#18181B"/>
      <circle cx="50" cy="42" r="24" stroke="#EAB308" stroke-width="6"/>
      <text x="50" y="50" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="18" fill="#EAB308" text-anchor="middle">LB</text>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">FINANCE</text>
    </svg>`
  },

  // GOVT BILLS
  {
    id: 'ird_tax',
    name: 'Inland Revenue Dept (IRD)',
    category: 'GOVT_BILLS',
    refLabel: 'TIN / Payment Slip Ref.',
    refPlaceholder: 'e.g. TIN-948102948',
    sampleRef: 'TIN-948102948',
    popular: true,
    logoUrl: '/images/logos/Inland revenue.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#065F46"/>
      <path d="M50 18L80 34V66L50 82L20 66V34L50 18Z" stroke="#F59E0B" stroke-width="5" fill="#047857"/>
      <text x="50" y="53" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">IRD</text>
      <text x="50" y="92" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="9" fill="#A7F3D0" text-anchor="middle">INLAND REVENUE</text>
    </svg>`
  },
  {
    id: 'dmt_revenue_license',
    name: 'Dept of Motor Traffic',
    category: 'GOVT_BILLS',
    refLabel: 'Vehicle Registration No.',
    refPlaceholder: 'e.g. CAB-4912 or WP-BF-9102',
    sampleRef: 'CAB-4912',
    logoUrl: '/images/logos/DMT.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#1E293B"/>
      <circle cx="50" cy="44" r="24" stroke="#94A3B8" stroke-width="6"/>
      <circle cx="50" cy="44" r="9" fill="#38BDF8"/>
      <path d="M50 20V35M50 53V68M26 44H41M59 44H74" stroke="#94A3B8" stroke-width="4"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">MOTOR TRAFFIC</text>
    </svg>`
  },

  // EDUCATION
  {
    id: 'sliit_education',
    name: 'SLIIT - Campus Fees',
    category: 'EDUCATION',
    refLabel: 'Student Registration ID',
    refPlaceholder: 'e.g. IT25103677 or BM204819',
    sampleRef: 'IT25103677',
    popular: true,
    logoUrl: '/images/logos/sliit.svg',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0F172A"/>
      <path d="M50 18L86 36L50 54L14 36L50 18Z" fill="#F59E0B"/>
      <path d="M26 44V64C26 64 36 74 50 74C64 74 74 64 74 64V44" stroke="#38BDF8" stroke-width="5"/>
      <text x="50" y="93" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">SLIIT</text>
    </svg>`
  },
  {
    id: 'nsbm_university',
    name: 'NSBM Green University',
    category: 'EDUCATION',
    refLabel: 'Student Index Number',
    refPlaceholder: 'e.g. NSBM-1004819',
    sampleRef: 'NSBM-1004819',
    logoUrl: '/images/logos/logo_nsbm.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#14532D"/>
      <path d="M50 18C34 34 30 54 50 74C70 54 66 34 50 18Z" fill="#4ADE80"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle">NSBM</text>
    </svg>`
  },

  // TRAVEL
  {
    id: 'srilankan_airlines',
    name: 'SriLankan Airlines',
    category: 'TRAVEL',
    refLabel: 'Booking PNR / Ticket Ref.',
    refPlaceholder: 'e.g. UL-PNR-849201',
    sampleRef: 'UL-PNR-849201',
    logoUrl: '/images/logos/sri lankan airlines.jpeg',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0F766E"/>
      <path d="M18 64C38 20 82 26 82 26C82 26 56 58 18 64Z" fill="#EC4899"/>
      <path d="M22 68L80 34" stroke="#F59E0B" stroke-width="5"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">SriLankan</text>
    </svg>`
  },
  {
    id: 'pickme_sl',
    name: 'PickMe Sri Lanka',
    category: 'TRAVEL',
    refLabel: 'Driver / Wallet Topup ID',
    refPlaceholder: 'e.g. PM-0771234567',
    sampleRef: 'PM-0771234567',
    logoUrl: '/images/logos/PickMe_SriLanka_Logo.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#FACC15"/>
      <circle cx="50" cy="44" r="22" fill="#000000"/>
      <path d="M50 32V56M50 32H62C67 32 67 44 62 44H50" stroke="#FACC15" stroke-width="6" stroke-linecap="round"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="12" fill="#000000" text-anchor="middle">PickMe</text>
    </svg>`
  },
  {
    id: 'expressway_ecard',
    name: 'Expressway E-Card',
    category: 'TRAVEL',
    refLabel: 'E-Card Touch & Pass No.',
    refPlaceholder: 'e.g. ECARD-8491029',
    sampleRef: 'ECARD-8491029',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#15803D"/>
      <rect x="18" y="26" width="64" height="40" rx="8" fill="#FACC15"/>
      <path d="M28 36H72M28 46H52" stroke="#15803D" stroke-width="4.5" stroke-linecap="round"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">EXPRESSWAY</text>
    </svg>`
  },

  // HOSPITALS
  {
    id: 'asiri_health',
    name: 'Asiri Health Hospitals',
    category: 'HOSPITALS',
    refLabel: 'Patient UHID / Bill No.',
    refPlaceholder: 'e.g. AS-UHID-94810',
    sampleRef: 'AS-UHID-94810',
    popular: true,
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#991B1B"/>
      <path d="M40 22H60V40H78V60H60V78H40V60H22V40H40V22Z" fill="#FFFFFF"/>
      <text x="50" y="93" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">ASIRI</text>
    </svg>`
  },
  {
    id: 'nawaloka_hospital',
    name: 'Nawaloka Hospitals',
    category: 'HOSPITALS',
    refLabel: 'Patient Registration No.',
    refPlaceholder: 'e.g. NH-849102',
    sampleRef: 'NH-849102',
    logoUrl: '/images/logos/nawaloka-logo-new.1e9fb3a76c0e87a97f68.webp',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0891B2"/>
      <circle cx="50" cy="44" r="24" fill="#FFFFFF"/>
      <path d="M43 31H57V43H69V57H57V69H43V57H31V43H43V31Z" fill="#0891B2"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">NAWALOKA</text>
    </svg>`
  },
  {
    id: 'lanka_hospitals',
    name: 'Lanka Hospitals',
    category: 'HOSPITALS',
    refLabel: 'Lanka Hospital Ref No.',
    refPlaceholder: 'e.g. LH-9481029',
    sampleRef: 'LH-9481029',
    logoUrl: '/images/logos/lanka hospitals.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#1E3A8A"/>
      <path d="M50 18L78 34V66L50 82L22 66V34L50 18Z" fill="#DC2626"/>
      <text x="50" y="54" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">LH</text>
      <text x="50" y="92" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="9" fill="#93C5FD" text-anchor="middle">LANKA HOSP</text>
    </svg>`
  },

  // FUEL SUPPLIERS
  {
    id: 'ceypetco_fuel',
    name: 'CEYPETCO - Petroleum',
    category: 'FUEL_SUPPLIERS',
    refLabel: 'Fuel Pass / Fleet Card No.',
    refPlaceholder: 'e.g. CEY-PASS-84910',
    sampleRef: 'CEY-PASS-84910',
    popular: true,
    logoUrl: '/images/logos/Ceylon_Petroleum_Corporation_logo.png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#B91C1C"/>
      <path d="M50 16C50 16 28 44 28 60C28 72.2 37.8 82 50 82C62.2 82 72 72.2 72 60C72 44 50 16 50 16Z" fill="#FACC15"/>
      <path d="M50 30C50 30 36 50 36 60C36 67.7 42.3 74 50 74C57.7 74 64 67.7 64 60C64 50 50 30 50 30Z" fill="#B91C1C"/>
      <text x="50" y="93" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">CEYPETCO</text>
    </svg>`
  },
  {
    id: 'lioc_fuel',
    name: 'Lanka IOC',
    category: 'FUEL_SUPPLIERS',
    refLabel: 'LIOC Fuel Card Number',
    refPlaceholder: 'e.g. LIOC-9481920',
    sampleRef: 'LIOC-9481920',
    logoUrl: '/images/logos/Lanka-IOC-Logo-refined.svg',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#EA580C"/>
      <circle cx="50" cy="44" r="24" fill="#1E3A8A"/>
      <circle cx="50" cy="44" r="14" fill="#FFFFFF"/>
      <text x="50" y="50" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="12" fill="#EA580C" text-anchor="middle">IOC</text>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">LANKA IOC</text>
    </svg>`
  },
  {
    id: 'sinopec_fuel',
    name: 'Sinopec Energy Sri Lanka',
    category: 'FUEL_SUPPLIERS',
    refLabel: 'Sinopec Card / Account No.',
    refPlaceholder: 'e.g. SINO-8491029',
    sampleRef: 'SINO-8491029',
    logoUrl: '/images/logos/download (1).png',
    logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#991B1B"/>
      <circle cx="50" cy="42" r="22" stroke="#FFFFFF" stroke-width="4"/>
      <path d="M50 24L54 36L66 38L57 46L60 58L50 51L40 58L43 46L34 38L46 36L50 24Z" fill="#FFFFFF"/>
      <text x="50" y="91" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">SINOPEC</text>
    </svg>`
  }
];
