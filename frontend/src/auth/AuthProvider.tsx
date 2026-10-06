import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, send, setToken } from '../api/client';
import type { Profile, Role } from '../types/api';

interface Auth { user: Profile | null; role: Role | null; notice: string; login: (username:string,password:string)=>Promise<void>; logout: ()=>Promise<void>; refresh: ()=>Promise<void> }
const Context = createContext<Auth | null>(null);
export function AuthProvider({children}: {children:ReactNode}) {
  const [user,setUser] = useState<Profile|null>(null);
  const [notice,setNotice] = useState('');
  const [initializing, setInitializing] = useState(true);

  const clear = () => { setToken(null); setUser(null); };

  async function refresh(): Promise<void> {
    const fetchedUser = await api<Profile>('/auth/me');
    setUser(fetchedUser);
  }

  async function login(username:string,password:string) {
    const result = await send<{token:string}>('/auth/login',{username,password});
    setToken(result.token);
    try { await refresh(); setNotice(''); } catch (e) {clear();throw e;}
  }

  async function logout() { try {await send('/auth/logout');} finally {clear();} }

  // Session restoration on page refresh
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('serendib_bank_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          await refresh();
        } catch {
          clear();
        }
      }
      if (active) setInitializing(false);
    };
    restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const expired = () => {clear();setNotice('Your session ended. Please sign in again.');};
    window.addEventListener('bank-session-expired',expired);
    return () => window.removeEventListener('bank-session-expired',expired);
  },[]);
  useEffect(() => {
    if (!user) return;
    let lastSignal = 0;
    let lastActivity = Date.now();
    const activity = () => {
      lastActivity = Date.now();
      if (Date.now()-lastSignal > 30_000) {lastSignal=Date.now();send('/auth/activity').catch(()=>{});}
    };
    const events = ['pointerdown','keydown','touchstart'];
    events.forEach(event=>window.addEventListener(event,activity,{passive:true}));
    const timer = window.setInterval(()=> {if(Date.now()-lastActivity>=600_000) {clear();setNotice('Signed out after 10 minutes of inactivity.');}},5000);
    return () => {events.forEach(event=>window.removeEventListener(event,activity));window.clearInterval(timer);};
  }, [user?.userId]);

  if (initializing) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#38bdf8', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>SERENDIB SMART BANK</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Restoring workspace session...</p>
        </div>
      </div>
    );
  }

  const normalizedRole = user?.role ? (user.role.replace(/^ROLE_/, '').toUpperCase() as Role) : null;

  return <Context.Provider value={{user,role:normalizedRole,notice,login,logout,refresh}}>{children}</Context.Provider>;
}
export function useAuth() {const value=useContext(Context);if(!value) throw new Error('AuthProvider is required');return value;}
