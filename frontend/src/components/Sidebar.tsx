import { useRef, useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Upload, BarChart2, MessageCircle,
  Clock, Settings, Brain, X, Sparkles, Trash2,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard',         to: '/',             icon: LayoutDashboard, badge: null,  color: '#60a5fa' },
  { label: 'Upload File',        to: '/upload',        icon: Upload,          badge: null,  color: '#22d3ee' },
  { label: 'Analyze Excel',      to: '/analyze-excel', icon: BarChart2,       badge: null,  color: '#34d399' },
  { label: 'Remove Duplicates',  to: '/excel-dedup',   icon: Trash2,          badge: null,  color: '#f472b6' },
  { label: 'Similarity Checker', to: '/similarity',    icon: Sparkles,        badge: 'NEW', color: '#c084fc' },
  { label: 'Chat with AI',       to: '/chat',          icon: MessageCircle,   badge: null,  color: '#a78bfa' },
  { label: 'History',            to: '/history',       icon: Clock,           badge: null,  color: '#94a3b8' },
  { label: 'Settings',           to: '/settings',      icon: Settings,        badge: null,  color: '#94a3b8' },
];

// Floating animation variants for icons
const iconVariants = {
  idle:   { y: 0,  rotate: 0,   scale: 1 },
  hover:  { y: -3, rotate: 5,   scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 15 } },
  active: { y: [0, -4, 0],      scale: 1.1,  transition: { y: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } } },
};

function NavItem({ item, isActive, onClick }: {
  item: typeof navItems[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);

  // Spotlight mouse tracking
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--sx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--sy', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <Link
      ref={ref}
      to={item.to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={onMouseMove}
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors duration-200 group overflow-hidden"
      style={{
        color: isActive ? '#ffffff' : '#94a3b8',
      }}
    >
      {/* Spotlight hover glow — pure CSS, no z-index conflict */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(180px circle at var(--sx,50%) var(--sy,50%), ${item.color}22, transparent 70%)`,
        }}
      />

      {/* Active background */}
      {isActive && (
        <motion.span
          layoutId="activeNavBg"
          aria-hidden="true"
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${item.color}28 0%, ${item.color}12 100%)`,
            border: `1px solid ${item.color}50`,
            boxShadow: `0 0 16px ${item.color}30, inset 0 0 12px ${item.color}08`,
          }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}

      {/* Icon with floating animation */}
      <motion.span
        className="relative shrink-0 flex items-center justify-center w-[18px] h-[18px]"
        variants={iconVariants}
        animate={isActive ? 'active' : hovered ? 'hover' : 'idle'}
        style={{
          color: isActive || hovered ? item.color : '#64748b',
          filter: isActive ? `drop-shadow(0 0 6px ${item.color})` : hovered ? `drop-shadow(0 0 4px ${item.color}80)` : 'none',
        }}
      >
        <item.icon className="w-[18px] h-[18px]" />
      </motion.span>

      {/* Label */}
      <span
        className="relative flex-1 transition-colors duration-200"
        style={{ color: isActive ? '#ffffff' : hovered ? '#e2e8f0' : '#94a3b8' }}
      >
        {item.label}
      </span>

      {/* NEW badge */}
      {item.badge && (
        <span
          className="relative text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
          style={{
            background: 'rgba(168,85,247,0.2)',
            color: '#c084fc',
            border: '1px solid rgba(168,85,247,0.4)',
            boxShadow: '0 0 6px rgba(168,85,247,0.4)',
          }}
        >
          {item.badge}
        </span>
      )}

      {/* Active right-edge bar */}
      {isActive && (
        <motion.span
          layoutId="activeNavBar"
          aria-hidden="true"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
          style={{
            background: `linear-gradient(to bottom, ${item.color}, ${item.color}80)`,
            boxShadow: `0 0 8px ${item.color}, 0 0 16px ${item.color}60`,
          }}
        />
      )}
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
        <motion.div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)',
            boxShadow: '0 0 20px rgba(99,102,241,.6), 0 0 40px rgba(99,102,241,.3)',
          }}
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <Brain className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <p className="text-white font-bold text-sm leading-tight tracking-wide">Semantic</p>
          <p
            className="font-bold text-sm leading-tight"
            style={{ color: '#c084fc', textShadow: '0 0 10px rgba(192,132,252,.5)' }}
          >
            Validator
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto md:hidden text-slate-400 hover:text-white transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            isActive={pathname === item.to}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* AI Assistant card */}
      <div className="px-3 pb-3">
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg,rgba(99,102,241,.10),rgba(168,85,247,.07),rgba(236,72,153,.05))',
            border: '1px solid rgba(99,102,241,.25)',
            boxShadow: '0 0 16px rgba(99,102,241,.12)',
          }}
        >
          {/* Subtle shimmer */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(105deg,transparent 30%,rgba(99,102,241,.06) 50%,transparent 70%)',
              backgroundSize: '200% 100%',
              animation: 'holoShimmer 4s linear infinite',
            }}
          />

          <div className="relative flex items-center gap-2.5 mb-2">
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
                boxShadow: '0 0 14px rgba(139,92,246,.7)',
              }}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            >
              <Brain className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <p className="text-white text-xs font-semibold">AI Assistant</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          <p className="relative text-slate-400 text-xs mb-3 leading-relaxed">
            Ask me anything about your data…
          </p>

          <Link to="/chat" onClick={onClose} className="relative block">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full text-xs py-2 px-3 rounded-xl font-semibold"
              style={{
                background: 'linear-gradient(135deg,rgba(99,102,241,.3),rgba(168,85,247,.2))',
                border: '1px solid rgba(99,102,241,.5)',
                color: '#c4b5fd',
                boxShadow: '0 0 12px rgba(99,102,241,.3)',
              }}
            >
              Start Chat →
            </motion.button>
          </Link>
        </div>

        {/* Version */}
        <div className="mt-3 px-1 flex items-center justify-between text-[11px] text-slate-600">
          <span>v1.0.0</span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: '0 0 6px rgba(52,211,153,.8)' }}
            />
            System Online
          </span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 border-r border-white/[0.06]"
        style={{
          background: 'linear-gradient(180deg,rgba(5,10,25,.97),rgba(8,5,20,.97))',
          backdropFilter: 'blur(24px)',
          boxShadow: '1px 0 0 rgba(99,102,241,.12), 4px 0 24px rgba(0,0,0,.6)',
          zIndex: 20,
        }}
      >
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-[220px] md:hidden border-r border-white/[0.07]"
              style={{
                background: 'rgba(5,10,25,.98)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <SidebarContent onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
