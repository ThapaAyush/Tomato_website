import React, { useContext, useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import axios from "axios"
const LoginPopup = ({ setShowLogin }) => {

  const { url, setToken, setRole, loginState, setLoginState, authNotice, setAuthNotice } = useContext(StoreContext)

  const [currState, setCurrState] = useState(loginState || "Login")
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  })

  useEffect(() => {
    if (loginState) {
      setCurrState(loginState);
    }
  }, [loginState]);

  const closePopup = () => {
    if (setShowLogin) setShowLogin(false);
    if (setAuthNotice) setAuthNotice("");
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  const onlogin = async (event) => {
    event.preventDefault()
    let newUrl = url;
    if (currState === "Login") {
      newUrl += "/api/user/login"
    } else {
      newUrl += "/api/user/register"
    }

    try {
      const response = await axios.post(newUrl, { ...data, role: "Customer" });

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        if (setRole) setRole("Customer");
        localStorage.setItem("role", "Customer");
        if (response.data.email || data.email) {
          localStorage.setItem("userEmail", response.data.email || data.email);
        }
        if (response.data.name || data.name) {
          localStorage.setItem("userName", response.data.name || data.name);
        }
        closePopup();
      } else {
        alert(response.data.message)
      }
    } catch (error) {
      alert(error.response?.data?.message ?? "Unable to connect to the server. Please try again.")
    }
  }

  return (
    <div className='login-popup' onClick={closePopup}>
      <form onSubmit={onlogin} action='' className='login-popup-container' onClick={(e) => e.stopPropagation()}>
        <div className='login-popup-title'>
          <h2>{currState}</h2>
          <img onClick={closePopup} src={assets.cross_icon} alt='Close' />
        </div>

        {authNotice && (
          <div className='login-popup-notice'>
            <span className='notice-icon'>🔒</span>
            <span className='notice-text'>{authNotice}</span>
          </div>
        )}

        <div className="login-popup-inputs">
          {currState === "Login" ? <></> : (
            <input
              name='name'
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder='Your name'
              required
            />
          )}

          <input
            name='email'
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder='Your email'
            required
          />
          <input
            name='password'
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder='Password'
            required
          />
        </div>
        <button type='submit'>
          {currState === "Sign Up" ? "Create account" : "Login"}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, i agree to the terms of use & privacy policy</p>
        </div>
        {currState === "Login"
          ? <p>Create a new account? <span onClick={() => { setCurrState("Sign Up"); if (setLoginState) setLoginState("Sign Up"); }}>Click here</span></p>
          : <p>Already have an account?<span onClick={() => { setCurrState("Login"); if (setLoginState) setLoginState("Login"); }}>Login here</span></p>}
      </form>
    </div>
  )
}

export default LoginPopup
