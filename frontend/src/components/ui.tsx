import { Text } from '../i18n';
import { useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import type { Page } from '../types/api';
export function useApi<T>(path: string, revision = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(path));

  useEffect(() => {
    if (!path) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    api<T>(path)
      .then(d => { if (active) setData(d); })
      .catch(e => { if (active) setError(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, revision]);

  return { data, error, loading };
}
export function ErrorMessage({error}: {error:unknown}) {
  if(!error)return null;
  const message=error instanceof Error?error.message:'Something went wrong';
  return <div className="alert error" role="alert"><strong>{message}</strong>{error instanceof ApiError && Object.entries(error.fields).map(([key,value])=><div key={key}>{key}: {value}</div>)}</div>;
}
export function StatusBadge({status}: {status:string}) {return <span className={`status ${status.toLowerCase()}`}><Text value={status.replaceAll('_',' ')}/></span>;}
export function Heading({title,subtitle,actions,icon}: {title:string;subtitle?:string;actions?:ReactNode;icon?:string}) {
  return (
    <div className="page-heading">
      <div className="page-heading-content">
        {icon && (
          <img
            src={icon}
            alt=""
            className="page-heading-icon"
          />
        )}
        <div>
          <span className="eyebrow">SERENDIB SMART BANK</span>
          <h1>{title&&<Text value={title}/>}</h1>
          {subtitle&&<p>{subtitle&&<Text value={subtitle}/>}</p>}
        </div>
      </div>
      {actions}
      {icon && (
        <img
          src={icon}
          alt=""
          className="page-watermark-icon"
        />
      )}
    </div>
  );
}
export function Panel({title,children,className,style}: {title?:string;children:ReactNode;className?:string;style?:React.CSSProperties}) {return <section className={`panel ${className||''}`.trim()} style={style}>{title&&<h2>{title&&<Text value={title}/>}</h2>}{children}</section>;}
export function Loading() {return <div className="empty" role="status"><Text value={"Loading your banking information…"}/></div>;}
export function Empty({children}: {children:ReactNode}) {return <div className="empty">{children}</div>;}
export function Pagination({data,onPage}: {data:Page<unknown>;onPage:(page:number)=>void}) {return <div className="pagination"><span>{data.totalElements} records · Page {data.page+1} of {Math.max(1,data.totalPages)}</span><button className="secondary" disabled={data.page===0} onClick={()=>onPage(data.page-1)}><Text value="Previous"/></button><button className="secondary" disabled={data.page+1>=data.totalPages} onClick={()=>onPage(data.page+1)}><Text value="Next"/></button></div>;}
export function Field({label,children}: {label:string;children:ReactNode}) {return <label className="field"><span>{label&&<Text value={label}/>}</span>{children}</label>;}
export function Detail({label,children}: {label:string;children:ReactNode}) {return <div className="detail"><span>{label&&<Text value={label}/>}</span><strong>{children}</strong></div>;}
export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input-wrapper">
      <input {...props} type={show ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow(prev => !prev)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}
