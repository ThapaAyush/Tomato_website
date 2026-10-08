import React, { useContext, useState } from 'react';
import axios from 'axios';

import './Navbar.css';

import { assets } from '../../assets/assets';

import { Link, useNavigate } from 'react-router-dom';

import { StoreContext } from '../../context/StoreContext';

const Navbar = ({ setShowLogin }) => {

  const [menu, setMenu] = useState("home");
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const { getTotalCartAmount, token, setToken, food_list, addToCart, url, role, setRole } = useContext(StoreContext);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    if (setRole) setRole("Customer");
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

      <Link to='/'>
        <img src={assets.logo} className="logo" alt="" />
      </Link>

      <ul className='navbar-menu'>

        <Link
          to='/'
          onClick={() => setMenu("home")}
          className={menu === "home" ? "active" : ""}
        >
          home
        </Link>

        <a
          href='#explore-menu'
          onClick={() => setMenu("menu")}
          className={menu === "menu" ? "active" : ""}
        >
          menu
        </a>

        <a
          href='#add-download'
          onClick={() => setMenu("mobile-app")}
          className={menu === "mobile-app" ? "active" : ""}
        >
          mobile-app
        </a>

        <a
          href='#footer'
          onClick={() => setMenu("contact-us")}
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

          <Link to='/cart'>
            <img src={assets.basket_icon} alt="" />
          </Link>

          <div className={getTotalCartAmount() === 0 ? "" : "dot"}>
          </div>

        </div>

        {!token ? (

          <button onClick={() => setShowLogin(true)}>
            sign in
          </button>

        ) : (

          <div className='navbar-profile'>

            <img src={assets.profile_icon} className='navbar-profile-avatar' alt="Account" />

            <div className='nav-profile-dropdown'>
              <div className='nav-profile-header'>
                <span className='nav-profile-role-badge'>
                  Customer
                </span>
              </div>

              <ul className='nav-profile-list'>
                <li onClick={() => navigate('/orders')} className='nav-profile-item'>
                  <div className='nav-profile-icon-wrap orders-icon'>
                    <img src={assets.bag_icon} alt="" />
                  </div>
                  <div className='nav-profile-item-text'>
                    <p className='nav-profile-item-title'>Orders</p>
                    <span className='nav-profile-item-sub'>Track current orders</span>
                  </div>
                </li>

                <div className='nav-profile-divider' />

                <li onClick={logout} className='nav-profile-item logout-item'>
                  <div className='nav-profile-icon-wrap logout-icon'>
                    <img src={assets.logout_icon} alt="" />
                  </div>
                  <div className='nav-profile-item-text'>
                    <p className='nav-profile-item-title'>Logout</p>
                    <span className='nav-profile-item-sub'>Sign out securely</span>
                  </div>
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