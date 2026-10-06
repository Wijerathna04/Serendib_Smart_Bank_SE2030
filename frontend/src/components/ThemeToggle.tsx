import { useLayoutEffect, useState } from 'react';
import { useLanguage } from '../i18n';

export default function ThemeToggle() {
  const {language}=useLanguage();
  const [theme,setTheme]=useState<'dark'|'light'>(()=>{
    try {const saved=localStorage.getItem('serendib-theme');if(saved==='dark'||saved==='light')return saved;}catch{/* Storage is optional. */}
    return window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
  });
  useLayoutEffect(()=>{
    document.documentElement.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0A192F':'#FFFFFF');
    try{localStorage.setItem('serendib-theme',theme);}catch{/* Storage is optional. */}
  },[theme]);
  const labels=theme==='dark'?['Switch to light mode','ආලෝක ප්‍රකාරයට මාරු වන්න','ஒளி பயன்முறைக்கு மாற்றவும்']:['Switch to dark mode','අඳුරු ප්‍රකාරයට මාරු වන්න','இருள் பயன்முறைக்கு மாற்றவும்'];
  const label=labels[language==='si'?1:language==='ta'?2:0];
  return <button className="theme-toggle" type="button" onClick={()=>setTheme(value=>value==='dark'?'light':'dark')} aria-label={label} title={label} aria-pressed={theme==='dark'}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">{theme==='dark'?<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>:<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>}</svg></button>;
}
