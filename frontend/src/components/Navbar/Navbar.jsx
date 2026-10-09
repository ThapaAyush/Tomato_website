import React, { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

import './Navbar.css';

import { assets } from '../../assets/assets';

import { Link, useNavigate, useLocation } from 'react-router-dom';

import { StoreContext } from '../../context/StoreContext';

const Navbar = ({ setShowLogin }) => {

  const [menu, setMenu] = useState("home");
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const { getTotalCartAmount, token, setToken, food_list, addToCart, url, role, setRole } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  const currentUserName = localStorage.getItem("userName") || (role === "Admin" ? "Ayush Thapa" : "Ayush Thapa");
  const currentUserEmail = localStorage.getItem("userEmail") || "ayush108ayush108@gmail.com";
  const userInitial = (currentUserName.trim().charAt(0) || "A").toUpperCase();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync active menu state with current route, hash, and scroll position
  useEffect(() => {
    if (!isHomePage) {
      setMenu("");
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;
      const exploreMenuEl = document.getElementById('explore-menu');
      const appDownloadEl = document.getElementById('add-download');
      const footerEl = document.getElementById('footer');

      if (footerEl && window.innerHeight + window.scrollY >= document.body.offsetHeight - 60) {
        setMenu("contact-us");
      } else if (appDownloadEl && scrollPosition >= appDownloadEl.offsetTop) {
        setMenu("mobile-app");
      } else if (exploreMenuEl && scrollPosition >= exploreMenuEl.offsetTop) {
        setMenu("menu");
      } else {
        setMenu("home");
      }
    };

    if (location.hash === '#explore-menu') {
      setMenu("menu");
    } else if (location.hash === '#add-download') {
      setMenu("mobile-app");
    } else if (location.hash === '#footer') {
      setMenu("contact-us");
    } else {
      handleScroll();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, location.hash]);

  const handleNavClick = (sectionId, menuName) => {
    setMenu(menuName);

    if (sectionId === 'home') {
      if (!isHomePage) {
        navigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      return;
    }

    if (!isHomePage) {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', `/#${sectionId}`);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setToken("");
    if (setRole) setRole("Customer");
    setIsProfileOpen(false);
    navigate("/");
  }

  const handleSearch = async (value) => {
    const query = value.trim();
    setSearchText(value);

    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`${url}/api/food/search`, { params: { q: query } });
      setSearchResults(response.data?.data || []);
    } catch (_error) {
      const filtered = food_list.filter((item) =>
        `${item.name} ${item.description} ${item.category}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
  }

  return (
    <div className='navbar'>

      <Link to='/' onClick={() => handleNavClick('home', 'home')}>
        <img src={assets.logo} className="logo" alt="" />
      </Link>

      <ul className='navbar-menu'>

        <a
          href='/'
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home', 'home');
          }}
          className={menu === "home" ? "active" : ""}
        >
          home
        </a>

        <a
          href='#explore-menu'
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('explore-menu', 'menu');
          }}
          className={menu === "menu" ? "active" : ""}
        >
          menu
        </a>

        <a
          href='#add-download'
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('add-download', 'mobile-app');
          }}
          className={menu === "mobile-app" ? "active" : ""}
        >
          mobile-app
        </a>

        <a
          href='#footer'
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('footer', 'contact-us');
          }}
          className={menu === "contact-us" ? "active" : ""}
        >
          contact us
        </a>
      </ul>

      <div className="navbar-right">

        <button type='button' className='search-trigger' onClick={() => setShowSearch(true)}>
          <img src={assets.search_icon} alt="Search" />
        </button>

        <div className="navbar-search-icon">
          <Link to='/cart' title="Cart">
            <img src={assets.basket_icon} alt="Cart" />
          </Link>
          {getTotalCartAmount() > 0 && <div className="dot"></div>}
        </div>

        {!token ? (

          <button onClick={() => setShowLogin(true)}>
            sign in
          </button>

        ) : (

          <div 
            className={`navbar-profile ${isProfileOpen ? 'open' : ''}`}
            ref={profileRef}
          >

            <div 
              className='navbar-profile-trigger'
              onClick={() => setIsProfileOpen(prev => !prev)}
              role="button"
              tabIndex={0}
              title="Click to toggle profile menu"
            >
              <img src={assets.profile_icon} className='navbar-profile-avatar' alt="Account" />
              <span className='navbar-profile-badge-dot'></span>
            </div>

            <div 
              className={`nav-profile-dropdown ${isProfileOpen ? 'show' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className='nav-profile-user-info'>
                <div className='nav-user-header-row'>
                  <p className='nav-user-name'>{currentUserName}</p>
                  <span className='nav-user-role'>{role ? role.toUpperCase() : 'CUSTOMER'}</span>
                </div>
                <p className='nav-user-email' title={currentUserEmail}>{currentUserEmail}</p>
              </div>

              <hr className='nav-dropdown-divider' />

              <ul className='nav-profile-list'>
                <li onClick={() => { setIsProfileOpen(false); navigate('/orders'); }}>
                  <img src={assets.bag_icon} alt="Orders" className='nav-dropdown-icon' />
                  <span>Orders</span>
                </li>

                <hr className='nav-dropdown-divider' />

                <li onClick={() => {
                  setIsProfileOpen(false);
                  window.location.href = import.meta.env.VITE_ADMIN_URL || "http://localhost:5174";
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='nav-dropdown-icon'>
                    <rect width="7" height="9" x="3" y="3" rx="1.5" />
                    <rect width="7" height="5" x="14" y="3" rx="1.5" />
                    <rect width="7" height="9" x="14" y="12" rx="1.5" />
                    <rect width="7" height="5" x="3" y="16" rx="1.5" />
                  </svg>
                  <span>Admin Panel</span>
                </li>

                <hr className='nav-dropdown-divider' />

                <li onClick={() => { setIsProfileOpen(false); logout(); }}>
                  <img src={assets.logout_icon} alt="Logout" className='nav-dropdown-icon' />
                  <span>Logout</span>
                </li>
              </ul>
            </div>

          </div>

        )}

      </div>

      {showSearch && (
        <div className='search-overlay' onClick={() => setShowSearch(false)}>
          <div className='search-panel' onClick={(event) => event.stopPropagation()}>
            <div className='search-header'>
              <input
                type='text'
                value={searchText}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder='Search dishes, category or ingredients'
                autoFocus
              />
              <button type='button' onClick={() => setShowSearch(false)}>Close</button>
            </div>

            <div className='search-results'>
              {searchResults.length === 0 ? (
                <p className='no-result'>No item found.</p>
              ) : (
                searchResults.map((item) => {
                  const imageUrl = item.image?.startsWith('/') ? item.image : `${url}/images/${item.image}`;

                  return (
                    <div key={item._id} className='search-item'>
                      <img src={imageUrl} alt={item.name} />
                      <div className='search-item-info'>
                        <h4>{item.name}</h4>
                        <p>{item.description}</p>
                        <div className='search-item-footer'>
                          <span>₹{item.price}</span>
                          <button type='button' onClick={() => addToCart(item._id)}>Add</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Navbar;