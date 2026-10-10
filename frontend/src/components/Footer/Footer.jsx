import React, { useState, useContext } from 'react';
import './Footer.css';
import { assets } from '../../assets/assets';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const Footer = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, openSignUpModal } = useContext(StoreContext) || {};

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/' || location.pathname === '/home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMenuClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/' || location.pathname === '/home') {
      const el = document.getElementById('explore-menu');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#explore-menu');
      setTimeout(() => {
        const el = document.getElementById('explore-menu');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 120);
    }
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!token) {
      if (openSignUpModal) {
        openSignUpModal("Please sign up to access your cart");
      }
      return;
    }
    navigate('/cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrdersClick = (e) => {
    e.preventDefault();
    if (!token) {
      if (openSignUpModal) {
        openSignUpModal("Please sign up to view your orders");
      }
      return;
    }
    navigate('/orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <Link to="/" onClick={handleHomeClick} title="Tomato Home">
            <img src={assets.logo} alt="Tomato Logo" className="footer-logo" />
          </Link>
          <p>
            Delivering hot, delicious food right to your doorstep. Fresh ingredients, top restaurant partners, and speedy delivery.
          </p>
          <div className="footer-social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={assets.facebook_icon} alt="Facebook" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <img src={assets.twitter_icon} alt="Twitter" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <img src={assets.linkedin_icon} alt="LinkedIn" />
            </a>
          </div>
        </div>

        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>
              <a href="/" onClick={handleHomeClick}>Home</a>
            </li>
            <li>
              <a href="#explore-menu" onClick={handleMenuClick}>Menu</a>
            </li>
            <li>
              <a href="/cart" onClick={handleCartClick}>Cart</a>
            </li>
            <li>
              <a href="/orders" onClick={handleOrdersClick}>My Orders</a>
            </li>
            <li>
              <button type="button" className="footer-link-btn" onClick={() => setShowPrivacy(true)}>
                Privacy Policy
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>
              <a href="tel:+12124567890">+1-212-456-7890</a>
            </li>
            <li>
              <a href="mailto:contact@tomato.com">contact@tomato.com</a>
            </li>
          </ul>
        </div>
      </div>

      <hr />
      <p className="footer-copyright">Copyright 2026 © Tomato.com - All Rights Reserved.</p>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="footer-privacy-overlay" onClick={() => setShowPrivacy(false)}>
          <div className="footer-privacy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="footer-privacy-header">
              <h3>Privacy Policy</h3>
              <button 
                type="button" 
                className="footer-privacy-close" 
                onClick={() => setShowPrivacy(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="footer-privacy-body">
              <p><strong>Your Privacy is Guaranteed:</strong> At Tomato, we care deeply about protecting your information and privacy.</p>
              <ul>
                <li><strong>Order Fulfillment:</strong> We only collect names, delivery addresses, and phone numbers strictly needed to deliver your food.</li>
                <li><strong>Safe & Secure Payments:</strong> All online transactions are processed securely through Razorpay PCI-DSS certified checkout. We never store credit/debit card numbers.</li>
                <li><strong>No Spam or Third-Party Sharing:</strong> We do not sell or share customer contact information with external marketing companies.</li>
              </ul>
            </div>
            <div className="footer-privacy-footer">
              <button 
                type="button" 
                className="footer-privacy-ack-btn" 
                onClick={() => setShowPrivacy(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
