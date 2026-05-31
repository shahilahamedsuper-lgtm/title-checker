import { useState } from 'react';
import { Menu, Moon, Bell, ChevronDown, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface NavbarProps {
  onHamburgerClick: () => void;
}

export default function Navbar({ onHamburgerClick }: NavbarProps) {
  const [notifCount] = useState(3);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between px-5 h-[60px]"
      style={{ background:"linear-gradient(90deg,rgba(5,10,25,.85),rgba(8,5,20,.85))", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(99,102,241,.12)", boxShadow:"0 1px 0 rgba(99,102,241,.08),0 4px 20px rgba(0,0,0,.4)" }}>
      {/* Left: hamburger (mobile only) */}
        <button type="button" onClick={onHamburgerClick} aria-label="Open navigation menu"
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          style={{ color:"#64748b" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#c084fc";(e.currentTarget as HTMLButtonElement).style.boxShadow="0 0 10px rgba(192,132,252,.3)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#64748b";(e.currentTarget as HTMLButtonElement).style.boxShadow="none";}}>
          <Menu className="w-5 h-5" />
        </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button type="button" onClick={toggleTheme} aria-label="Toggle theme"
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          style={{ color:"#64748b" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#c084fc";(e.currentTarget as HTMLButtonElement).style.boxShadow="0 0 12px rgba(192,132,252,.4)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#64748b";(e.currentTarget as HTMLButtonElement).style.boxShadow="none";}}>
          <Moon className="w-[18px] h-[18px]" />
        </button>

        {/* Notifications */}
        <button type="button" aria-label={`${notifCount} notifications`}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          style={{ color:"#64748b" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#60a5fa";(e.currentTarget as HTMLButtonElement).style.boxShadow="0 0 12px rgba(96,165,250,.4)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#64748b";(e.currentTarget as HTMLButtonElement).style.boxShadow="none";}}>
          <Bell className="w-[18px] h-[18px]" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none"
              style={{ background:"linear-gradient(135deg,#8b5cf6,#ec4899)", boxShadow:"0 0 8px rgba(139,92,246,.8),0 0 16px rgba(236,72,153,.4)" }}>
              {notifCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background:"rgba(99,102,241,.2)" }} />

        {/* User profile */}
        <div className="relative">
          <button type="button" aria-label="User profile"
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-200"
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(99,102,241,.08)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background:"linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)", boxShadow:"0 0 12px rgba(99,102,241,.6),0 0 24px rgba(99,102,241,.2)" }}>
              {(user?.name ?? "A")[0].toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-white text-xs font-semibold leading-tight">{user?.name ?? "Admin User"}</p>
              <p className="text-[11px] leading-tight" style={{ color:"#475569" }}>{user?.email ?? "admin@example.com"}</p>
            </div>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5" style={{ color:"#475569" }} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-50"
              style={{ background:"rgba(5,10,25,.97)", border:"1px solid rgba(99,102,241,.25)", boxShadow:"0 0 30px rgba(99,102,241,.2),0 20px 40px rgba(0,0,0,.6)", backdropFilter:"blur(20px)" }}>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-all duration-200"
                style={{ color:"#f87171" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(248,113,113,.08)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
