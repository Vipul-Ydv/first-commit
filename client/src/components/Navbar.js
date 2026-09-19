import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiMenu, HiX, HiUser, HiLogout, 
   HiPlus, HiUsers 
} from 'react-icons/hi';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HackMatch</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/teams" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <HiUsers className="inline mr-1" /> Find a Team
                </Link>
                <Link 
                  to="/teams/new" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <HiPlus className="inline mr-1" /> Create a Team
                </Link>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <Link to="/profile" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <HiUser className="text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                    {user.isVerified && (
                      <span className="badge badge-verified text-xs">✓ Verified</span>
                    )}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <HiLogout className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-2">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/teams" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find a Team
                </Link>
                <Link 
                  to="/teams/new" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create a Team
                </Link>
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-red-500 rounded-lg hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-4 py-2 bg-primary-600 text-white rounded-lg text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
