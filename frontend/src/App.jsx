import React, { useContext, useEffect } from 'react'

import Navbar from './components/Navbar/Navbar'

import { Route, Routes } from 'react-router-dom'

import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Orders from './pages/Orders/Orders'
import Footer from './components/Footer/Footer'
import LoginPopup from './components/LoginPopup/LoginPopup'
import AiAssistant from './components/AiAssistant/AiAssistant'
import { StoreContext } from './context/StoreContext'

const App = () => {
  const { showLogin, setShowLogin } = useContext(StoreContext);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "true" || params.get("signin") === "true") {
        setShowLogin(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error(e);
    }
  }, [setShowLogin]);

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}

      {/* Fixed Navbar Header */}
      <header className='navbar-sticky-header'>
        <div className='navbar-inner-wrapper'>
          <Navbar setShowLogin={setShowLogin} />
        </div>
      </header>
      <div className='navbar-spacer' aria-hidden="true"></div>

      <div className='app'>

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/home' element={<Home />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder setShowLogin={setShowLogin} />} />
          <Route path='/orders' element={<Orders setShowLogin={setShowLogin} />} />
        </Routes>

      </div>
      <Footer />
      <AiAssistant setShowLogin={setShowLogin} />
    </>
  )
}

export default App
