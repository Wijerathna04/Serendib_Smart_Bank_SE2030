import React from 'react';
import { Detail } from './ui';
import { money, date } from '../api/client';
import { Text } from '../i18n';

export interface ApplicationDetailsProps {
  title?: string;
  data?: string | Record<string, any> | null;
  kind: 'account' | 'fd' | 'loan';
  loanType?: string | null;
}

const LABEL_MAP: Record<string, string> = {
  fullName: 'Full name',
  nic: 'NIC number',
  nicNumber: 'NIC number',
  dob: 'Date of birth',
  dateOfBirth: 'Date of birth',
  nationality: 'Nationality',
  gender: 'Gender',
  permanentAddress: 'Permanent address',
  currentAddress: 'Current address',
  mobile: 'Mobile number',
  mobileNumber: 'Mobile number',
  email: 'Email address',
  emailAddress: 'Email address',
  occupation: 'Occupation',
  occupationType: 'Occupation',
  employer: 'Employer name',
  employerName: 'Employer name',
  income: 'Monthly average income',
  monthlyAverageIncome: 'Monthly average income',
  sourceOfFunds: 'Source of funds',
  fatca: 'FATCA compliance',
  fatcaCompliance: 'FATCA compliance',
  pep: 'PEP declaration',
  pepDeclaration: 'PEP declaration',
  payoutFrequency: 'Interest payout frequency',
  interestPayoutFrequency: 'Interest payout frequency',
  maturityInstruction: 'Maturity instruction',
  salary: 'Basic monthly salary',
  allowances: 'Fixed monthly allowances',
  crib: 'Existing monthly loan deductions (CRIB)',
  employmentStatus: 'Employment status',
  serviceYears: 'Service period (years)',
  vehicleCondition: 'Vehicle condition',
  manufactureYear: 'Year of manufacture',
  valuation: 'Vehicle valuation amount',
  chassis: 'Chassis number',
  engine: 'Engine number',
};

const MONEY_KEYS = new Set(['salary', 'allowances', 'crib', 'income', 'monthlyAverageIncome', 'valuation']);
const DATE_KEYS = new Set(['dob', 'dateOfBirth']);
const VEHICLE_KEYS = new Set(['vehicleCondition', 'manufactureYear', 'valuation', 'chassis', 'engine']);
const OPTIONAL_NUMERIC_KEYS = new Set(['serviceYears', 'manufactureYear', 'valuation', 'crib']);

function humanizeKey(key: string): string {
  if (LABEL_MAP[key]) return LABEL_MAP[key];
  const result = key.replace(/([A-Z])/g, ' $1').trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function formatValue(key: string, val: any): React.ReactNode {
  if (typeof val === 'boolean') {
    return val ? 'Yes' : 'No';
  }
  if (val === 'true') return 'Yes';
  if (val === 'false') return 'No';

  if (MONEY_KEYS.has(key)) {
    const num = Number(val);
    if (!isNaN(num)) {
      return money(num.toFixed(2));
    }
    return money(String(val));
  }

  if (DATE_KEYS.has(key)) {
    return date(String(val));
  }

  return String(val);
}

function isValueEmpty(key: string, val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  if (typeof val === 'number') {
    if (val === 0 && OPTIONAL_NUMERIC_KEYS.has(key)) return true;
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && num === 0 && OPTIONAL_NUMERIC_KEYS.has(key)) return true;
  }
  return false;
}

export function ApplicationDetails({ title, data, kind, loanType }: ApplicationDetailsProps) {
  if (!data) return null;

  let parsed: Record<string, any> | null = null;
  let rawText: string = '';

  if (typeof data === 'object') {
    parsed = data;
  } else if (typeof data === 'string') {
    rawText = data;
    try {
      const result = JSON.parse(data);
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        parsed = result;
      }
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    return (
      <div className="application-details-container">
        {title && <h3 className="application-details-title"><Text value={title} /></h3>}
        <pre className="app-details-fallback">{rawText || String(data)}</pre>
      </div>
    );
  }

  const entries = Object.entries(parsed).filter(([k, v]) => !isValueEmpty(k, v));
  if (entries.length === 0) return null;

  if (kind === 'loan') {
    const isVehicleLoanType = Boolean(
      loanType &&
      (loanType.toLowerCase().includes('vehicle') || loanType.toLowerCase().includes('leasing'))
    );

    const hasVehicleData = entries.some(([k, v]) => {
      if (!VEHICLE_KEYS.has(k)) return false;
      if (typeof v === 'string') return v.trim() !== '';
      if (typeof v === 'number') return v > 0;
      return Boolean(v);
    });

    const showVehicleSection = isVehicleLoanType || hasVehicleData;

    const mainEntries = entries.filter(([k]) => !VEHICLE_KEYS.has(k));
    const vehicleEntries = entries.filter(([k]) => VEHICLE_KEYS.has(k));

    const mainTitle = title || 'Scrutiny details';

    return (
      <div className="application-details-container">
        {mainEntries.length > 0 && (
          <div className="app-details-section">
            <h3 className="application-details-title"><Text value={mainTitle} /></h3>
            <div className="details-grid">
              {mainEntries.map(([key, val]) => (
                <Detail key={key} label={humanizeKey(key)}>
                  {formatValue(key, val)}
                </Detail>
              ))}
            </div>
          </div>
        )}

        {showVehicleSection && vehicleEntries.length > 0 && (
          <div className="app-details-section" style={{ marginTop: '1.25rem' }}>
            <h3 className="application-details-title"><Text value="Vehicle details" /></h3>
            <div className="details-grid">
              {vehicleEntries.map(([key, val]) => (
                <Detail key={key} label={humanizeKey(key)}>
                  {formatValue(key, val)}
                </Detail>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const sectionTitle = title || (kind === 'account' ? 'Application details' : 'Deposit details');

  return (
    <div className="application-details-container">
      <h3 className="application-details-title"><Text value={sectionTitle} /></h3>
      <div className="details-grid">
        {entries.map(([key, val]) => (
          <Detail key={key} label={humanizeKey(key)}>
            {formatValue(key, val)}
          </Detail>
        ))}
      </div>
    </div>
  );
}
