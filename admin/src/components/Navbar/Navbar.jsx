import { useState, useEffect, useRef } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'

const Navbar = () => {
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

  const adminEmail = localStorage.getItem("userEmail") || "admin@tomato.com";
  const adminName = localStorage.getItem("userName") || "Administrator";

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
          title="Click to open menu"
        >
          <img className='profile' src={assets.profile_image} alt="Admin Profile" />
          <span className='online-dot'></span>
        </div>

        {showMenu && (
          <div className='admin-profile-dropdown'>
            <div className='admin-dropdown-header'>
              <div className='admin-header-info'>
                <p className='admin-header-name'>{adminName}</p>
                <p className='admin-header-email'>{adminEmail}</p>
              </div>
              <span className='admin-role-badge'>Super Admin</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar
