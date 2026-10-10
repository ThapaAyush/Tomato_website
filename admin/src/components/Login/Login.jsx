import React, { useState } from 'react'
import './Login.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = ({ url, onLoginSuccess }) => {
  const [currState, setCurrState] = useState('Login')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    const endpoint = currState === 'Login' ? '/api/user/login' : '/api/user/register'
    const payload = {
      ...data,
      role: 'Admin'
    }

    try {
      const response = await axios.post(`${url}${endpoint}`, payload)

      if (response.data.success) {
        const token = response.data.token
        const role = response.data.role || 'Admin'
        const email = response.data.email || data.email
        const name = response.data.name || data.name || 'Administrator'

        localStorage.setItem('token', token)
        localStorage.setItem('role', role)
        localStorage.setItem('userEmail', email)
        localStorage.setItem('userName', name)
        if (response.data.passwordHashKey) {
          localStorage.setItem('passwordHashKey', response.data.passwordHashKey)
        }

        toast.success(currState === 'Login' ? 'Logged in successfully' : 'Admin account created')

        if (onLoginSuccess) {
          onLoginSuccess({ token, role, email, name })
        }
      } else {
        toast.error(response.data.message || 'Authentication failed')
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Unable to connect to server.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "https://food-frontend-plum.vercel.app";

  return (
    <div className='login-page'>
      <form onSubmit={handleSubmit} className='login-box'>
        <div className='login-header'>
          <img src={assets.logo} alt="Tomato Logo" className='login-logo' />
          <h2>Admin {currState}</h2>
        </div>

        <div className='login-inputs'>
          {currState === 'Sign Up' && (
            <input
              name='name'
              type='text'
              value={data.name}
              onChange={onChangeHandler}
              placeholder='Your name'
              required
            />
          )}

          <input
            name='email'
            type='email'
            value={data.email}
            onChange={onChangeHandler}
            placeholder='Your email'
            required
          />

          <input
            name='password'
            type='password'
            value={data.password}
            onChange={onChangeHandler}
            placeholder='Password'
            required
            minLength={6}
          />
        </div>

        <button type='submit' disabled={loading}>
          {loading ? 'Please wait...' : currState === 'Login' ? 'Login' : 'Sign Up'}
        </button>

        <div className='login-footer'>
          {currState === 'Login' ? (
            <p>
              Don't have an admin account?{' '}
              <span onClick={() => setCurrState('Sign Up')}>Sign up</span>
            </p>
          ) : (
            <p>
              Already have an admin account?{' '}
              <span onClick={() => setCurrState('Login')}>Login here</span>
            </p>
          )}
          <a href={frontendUrl} className='login-back-link'>← Back to Website</a>
        </div>
      </form>
    </div>
  )
}

export default Login
