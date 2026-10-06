import { useState } from 'react';
import { useLanguage } from '../i18n';
import { Heading, Panel, Field, useApi, ErrorMessage, Loading, Empty, Pagination } from '../components/ui';
import type { Page } from '../types/api';
const views:Record<string,{label:string;columns:[string,string][]}>={
  accounts:{label:'Accounts',columns:[['accountId','ID'],['accountNumber','Account'],['accountType','Type'],['balance','Balance (LKR)'],['status','Status']]},
  transactions:{label:'Transactions',columns:[['transactionId','ID'],['fromAccountId','From account'],['toAccountId','To account'],['amount','Amount (LKR)'],['transactionType','Type'],['status','Status'],['description','Description']]},
  'fixed-deposits':{label:'Fixed deposits',columns:[['fixedDepositId','ID'],['accountNumber','Account'],['principalAmount','Principal (LKR)'],['interestRate','Rate (%)'],['termMonths','Months'],['maturityDate','Maturity'],['status','Status']]},
  'bill-payments':{label:'Bill payments',columns:[['paymentId','ID'],['accountId','Account'],['billType','Type'],['referenceNumber','Reference'],['amount','Amount (LKR)'],['status','Status']]},
  beneficiaries:{label:'Beneficiaries',columns:[['beneficiaryId','ID'],['name','Name'],['accountNumber','Account'],['bankName','Bank'],['relationship','Relationship'],['active','Active']]},
};
export default function AdminOperationsPage(){
  const [kind,setKind]=useState('accounts'),[page,setPage]=useState(0);const {t}=useLanguage();
  const result=useApi<Page<Record<string,string|number|boolean|null>>>(`/api/admin/operations/${kind}?page=${page}`);
  return <><Heading title="Bank operations" subtitle="Bank-wide oversight of accounts, payments and deposits."/><Field label="Operation"><select value={kind} onChange={e=>{setKind(e.target.value);setPage(0);}}>{Object.entries(views).map(([key,view])=><option value={key} key={key}>{t(view.label)}</option>)}</select></Field><ErrorMessage error={result.error}/>{result.loading?<Loading/>:result.data&&<Panel title={views[kind].label}>{result.data.content.length?<div className="table-wrap"><table><thead><tr>{views[kind].columns.map(([key,label])=><th key={key}>{t(label)}</th>)}</tr></thead><tbody>{result.data.content.map((row,i)=><tr key={i}>{views[kind].columns.map(([key])=><td key={key}>{row[key]===null?'—':String(row[key]??'—')}</td>)}</tr>)}</tbody></table></div>:<Empty>{t('No records found.')}</Empty>}<Pagination data={result.data} onPage={setPage}/></Panel>}<p className="fine-print">{t('Financial authorizations remain with the account owner. Staff operations are available from the navigation.')}</p></>;
}
