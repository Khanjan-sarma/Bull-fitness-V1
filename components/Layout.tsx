import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  Dumbbell, LayoutDashboard, Users, LogOut, 
  CalendarOff, Menu, X, Landmark, Settings 
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/members', label: 'Members', icon: Users },
  { path: '/finance', label: 'Finance', icon: Landmark },
  { path: '/off-days', label: 'Off Days', icon: CalendarOff },
];

interface NavLinkProps {
  item: NavItem;
  isMobile?: boolean;
  pathname: string;
  onCloseMobile?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ item, isMobile = false, pathname, onCloseMobile }) => {
  const Icon = item.icon;
  const isActive = pathname.startsWith(item.path);
  
  const baseClass = isMobile 
    ? "flex items-center px-4 py-3 text-base font-medium transition-all "
    : "flex items-center px-6 py-4 text-sm font-semibold transition-all relative group ";
  
  const activeClass = isActive 
    ? "text-white bg-white/10" 
    : "text-white/70 hover:text-white hover:bg-white/5";

  return (
    <Link
      to={item.path}
      onClick={() => isMobile && onCloseMobile?.()}
      className={`${baseClass} ${activeClass}`}
    >
      {isActive && !isMobile && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-bullYellow rounded-r-full shadow-[0_0_15px_rgba(252,163,17,0.5)]" />
      )}
      <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-bullYellow' : ''}`} />
      {item.label}
    </Link>
  );
};

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-bullGray">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bull-gradient-sidebar fixed inset-y-0 z-50 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Logo Section - Single Line branding */}
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-bullYellow rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg transform -rotate-3">
              <Dumbbell className="h-6 w-6 text-bullRed" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-black text-lg tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                BULL FITNESS CORE
              </h1>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="mt-4 flex-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                item={item} 
                pathname={location.pathname} 
              />
            ))}
          </nav>

          {/* Footer Branding */}
          <div className="p-6 mt-auto border-t border-white/10">
            <div className="flex items-center justify-between">
              <Link to="/settings" className="text-white/50 hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
              </Link>
              <button 
                onClick={handleLogout}
                className="text-white/50 hover:text-bullYellow transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
            <p className="text-[10px] text-white/30 mt-4 uppercase tracking-[0.2em] font-semibold">
              Powered by Humica AI
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72">
        {/* Top bar - Mobile / Tablet */}
        <header className="bg-white border-b border-gray-200 h-20 sticky top-0 z-40 lg:hidden flex items-center shadow-sm">
          <div className="flex items-center justify-between px-6 w-full">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-bullRed rounded-lg flex-shrink-0">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <h1 className="font-black text-sm sm:text-lg text-bullDark tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                BULL FITNESS CORE
              </h1>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-3 rounded-xl text-bullDark hover:bg-gray-100 transition-colors border border-gray-100 flex-shrink-0"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div 
            className="fixed inset-0 bg-bullDark/80 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <nav className="fixed inset-y-0 left-0 w-72 bull-gradient-sidebar shadow-2xl flex flex-col animate-fade-in-left">
            <div className="p-8 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 overflow-hidden">
                <Dumbbell className="h-6 w-6 text-bullYellow flex-shrink-0" />
                <span className="text-white font-black tracking-tighter uppercase text-sm whitespace-nowrap">BULL FITNESS CORE</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 mt-4">
              {navItems.map((item) => (
                <NavLink 
                  key={item.path} 
                  item={item} 
                  isMobile 
                  pathname={location.pathname}
                  onCloseMobile={() => setMobileMenuOpen(false)} 
                />
              ))}
            </div>
            <div className="p-8 border-t border-white/10">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 text-white/70 font-medium hover:text-bullYellow transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
              <p className="text-[10px] text-white/30 mt-6 uppercase tracking-[0.2em] font-semibold">
                Powered by Humica AI
              </p>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};