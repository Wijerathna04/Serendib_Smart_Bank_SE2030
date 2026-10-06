import React from 'react';
import type { Account, Loan, Profile } from '../types/api';
import { useAuth } from '../auth/AuthProvider';
import { ApplicationDetails } from './ApplicationDetails';

interface ApplicationPdfModalProps {
  account?: Account | null;
  loan?: Loan | null;
  customerProfile?: Profile | null;
  onClose: () => void;
}

export function ApplicationPdfModal({ account, loan, customerProfile, onClose }: ApplicationPdfModalProps) {
  const { role } = useAuth();
  if (!account && !loan) return null;

  const isLoan = !!loan;
  const facilityType = isLoan ? 'LOAN / LEASING CREDIT FACILITY' : 'BANK ACCOUNT PROVISIONING';
  
  const numberLabel = isLoan
    ? (loan.loanType.toUpperCase().includes('LEASING') ? 'Leasing Number' : 'Loan Number')
    : 'Account Number';

  const facilityNumber = isLoan
    ? (loan.loanNumber || `7000000${loan.loanId}`)
    : account?.accountNumber || '1000000';

  const cifNumber = isLoan
    ? loan.cifNumber || '0000000'
    : account?.cifNumber || '0000000';

  const applicantName = isLoan
    ? loan.customer || customerProfile?.username || 'Valued Customer'
    : account?.customerName || customerProfile?.username || 'Valued Customer';

  const applicantNic = isLoan
    ? loan.customerNic || customerProfile?.nic || 'N/A'
    : account?.customerNic || customerProfile?.nic || 'N/A';

  const officerId = isLoan
    ? loan.approvedByOfficerId || 'EMP-001 (Bank Officer)'
    : account?.approvedByOfficerId || 'EMP-001 (Bank Officer)';

  const managerId = isLoan
    ? loan.approvedByManagerId
    : account?.approvedByManagerId;

  const status = isLoan ? loan.status : account?.status;
  const applyDate = isLoan ? loan.applyDate : account?.openDate || new Date().toISOString().split('T')[0];

  function handlePrint() {
    window.print();
  }

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-application-doc, #printable-application-doc * {
            visibility: visible;
          }
          #printable-application-doc {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        padding: '2rem'
      }}>
        {/* Printable Area */}
        <div id="printable-application-doc" style={{ fontFamily: 'sans-serif' }}>
          
          {/* Bank Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0284c7', paddingBottom: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, color: '#0369a1', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
                SERENDIB SMART BANK
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                Licensed Commercial Bank | Head Office: Colombo 01, Sri Lanka
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                background: '#e0f2fe',
                color: '#0369a1',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                textTransform: 'uppercase'
              }}>
                {status || 'ACTIVE / APPROVED'}
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Date: {applyDate}</p>
            </div>
          </div>

          {/* TOP SECTION: CIF & FACILITY NUMBER (SEPARATE PROMINENT DISPLAY) */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: '10px',
            padding: '1.25rem',
            margin: '1.5rem 0',
            display: 'flex',
            justifyContent: role !== 'CUSTOMER' ? 'space-between' : 'center',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            {role !== 'CUSTOMER' && (
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '2rem', flex: 1 }}>
                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#94a3b8', display: 'block', fontWeight: 600 }}>
                  CUSTOMER IDENTIFICATION NUMBER (CIF)
                </span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                  {cifNumber}
                </span>
              </div>
            )}
            <div style={{ paddingLeft: role !== 'CUSTOMER' ? '2rem' : '0', flex: 1.2, textAlign: role !== 'CUSTOMER' ? 'right' : 'center' }}>
              <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#94a3b8', display: 'block', fontWeight: 600 }}>
                ASSIGNED {numberLabel.toUpperCase()}
              </span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                {facilityNumber}
              </span>
            </div>
          </div>

          <h3 style={{ textTransform: 'uppercase', fontSize: '1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>
            {facilityType} - APPLICATION SUMMARY
          </h3>

          {/* Applicant & Facility Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '0.9rem' }}>Applicant Information</h4>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Full Name:</strong> {applicantName}</p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>NIC Number:</strong> {applicantNic}</p>
              {customerProfile?.dateOfBirth && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Date of Birth:</strong> {customerProfile.dateOfBirth}</p>
              )}
              {customerProfile?.email && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Email:</strong> {customerProfile.email}</p>
              )}
              {customerProfile?.phone && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Phone:</strong> {customerProfile.phone}</p>
              )}
              {customerProfile?.address && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Address:</strong> {customerProfile.address}</p>
              )}
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '0.9rem' }}>Facility Details</h4>
              {isLoan ? (
                <>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Loan/Leasing Product:</strong> {loan.loanType}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Approved Amount:</strong> LKR {loan.amount}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Interest Rate:</strong> {loan.interestRate}% p.a.</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Application Date:</strong> {loan.applyDate}</p>
                  {loan.information && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Remarks:</strong> {loan.information}</p>
                  )}
                </>
              ) : (
                <>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Account Type:</strong> {account?.accountType}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Current Balance:</strong> LKR {account?.balance}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Opening Date:</strong> {account?.openDate || applyDate}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Status:</strong> {account?.status}</p>
                </>
              )}
            </div>
          </div>

          {isLoan && loan.scrutinyData && (
            <ApplicationDetails data={loan.scrutinyData} kind="loan" loanType={loan.loanType} />
          )}

          {!isLoan && account?.kycData && (
            <ApplicationDetails data={account.kycData} kind="account" />
          )}

          {/* BOTTOM SECTION: OFFICER AND MANAGER APPROVAL IDENTIFICATION */}
          <div style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '2px dashed #cbd5e1',
            display: 'grid',
            gridTemplateColumns: managerId ? '1fr 1fr' : '1fr',
            gap: '2rem'
          }}>
            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>
                APPROVED OFFICER IDENTIFICATION
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'block', marginTop: '0.25rem' }}>
                Officer ID: {officerId}
              </span>
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Authorized Bank Officer Verification & Signature
              </div>
            </div>

            {managerId && (
              <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>
                  BRANCH MANAGER APPROVAL IDENTIFICATION
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'block', marginTop: '0.25rem' }}>
                  Manager ID: {managerId}
                </span>
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  Branch Manager Approval & Authorization Signature
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            Serendib Smart Bank System Generated Electronic Document | Valid with official seal or digital signature | Confidential
          </div>

        </div>

        {/* Action Controls (Hidden when printing) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <button
            onClick={handlePrint}
            style={{
              background: '#0284c7',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🖨️ Print Application / Save as PDF
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#64748b',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
