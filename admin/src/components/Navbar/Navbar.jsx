import { useState, useEffect, useRef } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'

const Navbar = ({ onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adminEmail = localStorage.getItem("userEmail") || "ayush108ayush108@gmail.com";
  const adminName = localStorage.getItem("userName") || "Ayush Thapa";

  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "https://food-frontend-plum.vercel.app";

  const handleLogout = () => {
    setShowMenu(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("passwordHashKey");
      window.location.href = `${frontendUrl}/?login=true`;
    }
  };

  return (
    <div className='navbar'>
      <div className='navbar-brand'>
        <img className='logo' src={assets.logo} alt="Tomato Admin" />
        <span className='admin-pill'>Admin Panel</span>
      </div>

      <div className='navbar-profile-wrapper' ref={profileRef}>
        <div
          className={`navbar-avatar-btn ${showMenu ? 'active' : ''}`}
          onClick={() => setShowMenu(prev => !prev)}
          title="Click to toggle admin menu"
          role="button"
          tabIndex={0}
        >
          <img className='profile' src={assets.profile_image} alt="Admin Profile" />
          <span className='online-dot'></span>
        </div>

        {showMenu && (
          <div className='admin-profile-dropdown'>
            <div className='admin-dropdown-user'>
              <img className='admin-dropdown-avatar' src={assets.profile_image} alt={adminName} />
              <div className='admin-dropdown-user-info'>
                <div className='admin-dropdown-name-row'>
                  <p className='admin-dropdown-name'>{adminName}</p>
                  <span className='admin-dropdown-badge'>Super Admin</span>
                </div>
                <p className='admin-dropdown-email' title={adminEmail}>{adminEmail}</p>
              </div>
            </div>

            <hr className='admin-dropdown-divider' />

            <div className='admin-dropdown-menu'>
              <a
                href={frontendUrl}
                className='admin-dropdown-item'
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={assets.logo} alt="Tomato" className='admin-item-logo' />
                <span>Customer Website ↗</span>
              </a>

              <div className='admin-dropdown-item logout' onClick={handleLogout}>
                <img src={assets.logout_icon} alt="Logout" className='admin-item-icon' />
                <span>Logout</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar
