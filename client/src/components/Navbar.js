import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMenu, HiX, HiUser, HiLogout, HiPlus, HiViewGrid } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); setOpen(false); navigate('/'); };
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bg-white border-b border-hm-border sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link to="/" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-7 h-7 bg-hm-green rounded-md flex items-center justify-center
                            group-hover:bg-hm-green-dark transition-colors">
              <span className="text-white font-black text-sm leading-none">H</span>
            </div>
            <span className="text-base font-black text-hm-text tracking-tight">HackMatch</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <>
                <NavItem to="/dashboard" label="Dashboard" active={isActive('/dashboard')} />
                <NavItem to="/teams" label="Find a Team"
                  active={isActive('/teams') && !isActive('/teams/new')} />
                <NavItem to="/teams/new" label="Create Team" active={isActive('/teams/new')}
                  icon={<HiPlus className="h-3.5 w-3.5" />} />

                {/* Divider + user */}
                <div className="flex items-center gap-3 pl-4 ml-1 border-l border-hm-border">
                  <Link to="/profile" onClick={() => setOpen(false)}
                        className="flex items-center gap-2 group">
                    <div className="w-7 h-7 rounded-full bg-hm-green-light flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-hm-green leading-none">
                        {(user.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-hm-muted group-hover:text-hm-text">
                      {user.name}
                    </span>
                  </Link>
                  <button onClick={handleLogout} title="Sign out"
                          className="text-hm-subtle hover:text-red-500 p-1">
                    <HiLogout className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login"
                      className="text-sm font-semibold text-hm-muted hover:text-hm-text">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button className="md:hidden p-1.5 rounded-md text-hm-muted hover:text-hm-text
                             hover:bg-hm-base" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-hm-border bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-hm-border">
                  <div className="w-9 h-9 rounded-full bg-hm-green-light flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-hm-green">
                      {(user.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-hm-text truncate">{user.name}</p>
                    <p className="text-xs text-hm-muted truncate">{user.email}</p>
                  </div>
                </div>
                <MobileLink to="/dashboard" label="Dashboard"
                  icon={<HiViewGrid className="h-4 w-4" />}
                  active={isActive('/dashboard')} onClose={() => setOpen(false)} />
                <MobileLink to="/teams" label="Find a Team"
                  icon={<HiUser className="h-4 w-4" />}
                  active={isActive('/teams') && !isActive('/teams/new')} onClose={() => setOpen(false)} />
                <MobileLink to="/teams/new" label="Create Team"
                  icon={<HiPlus className="h-4 w-4" />}
                  active={isActive('/teams/new')} onClose={() => setOpen(false)} />
                <MobileLink to="/profile" label="Profile"
                  icon={<HiUser className="h-4 w-4" />}
                  active={isActive('/profile')} onClose={() => setOpen(false)} />
                <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                                   text-sm font-semibold text-red-600 hover:bg-red-50 mt-1">
                  <HiLogout className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login" label="Sign in" active={isActive('/login')} onClose={() => setOpen(false)} />
                <div className="pt-1">
                  <Link to="/register" onClick={() => setOpen(false)}
                        className="btn-primary w-full justify-center">
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavItem({ to, label, active, icon }) {
  return (
    <Link to={to}
          className={`flex items-center gap-1.5 text-sm font-semibold px-1 py-0.5
                      border-b-2 transition-colors ${
            active
              ? 'text-hm-green border-hm-green'
              : 'text-hm-muted border-transparent hover:text-hm-text'
          }`}>
      {icon}
      {label}
    </Link>
  );
}

function MobileLink({ to, label, icon, active, onClose }) {
  return (
    <Link to={to} onClick={onClose}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                      text-sm font-semibold transition-colors ${
            active
              ? 'bg-hm-green-light text-hm-green'
              : 'text-hm-text hover:bg-hm-base'
          }`}>
      {icon && <span className={active ? 'text-hm-green' : 'text-hm-subtle'}>{icon}</span>}
      {label}
    </Link>
  );
}
