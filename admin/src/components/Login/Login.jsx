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

        toast.success(
          currState === 'Login'
            ? 'Welcome back to Admin Portal'
            : 'Admin account created successfully'
        )

        if (onLoginSuccess) {
          onLoginSuccess({ token, role, email, name })
        }
      } else {
        toast.error(response.data.message || 'Authentication failed')
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Unable to connect to the server. Please check that backend is running.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='admin-auth-page'>
      <div className='admin-auth-card'>
        <div className='admin-auth-header'>
          <div className='admin-auth-brand'>
            <img src={assets.logo} alt='Tomato Logo' className='admin-auth-logo' />
            <span className='admin-auth-badge'>Admin Portal</span>
          </div>
          <h2 className='admin-auth-title'>
            {currState === 'Login' ? 'Administrator Login' : 'Register Admin'}
          </h2>
          <p className='admin-auth-subtitle'>
            {currState === 'Login'
              ? 'Enter your credentials to access the management dashboard'
              : 'Create a new administrator account with full control'}
          </p>
        </div>

        <div className='admin-auth-security-notice'>
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <rect x='3' y='11' width='18' height='11' rx='2' ry='2'></rect>
            <path d='M7 11V7a5 5 0 0 1 10 0v4'></path>
          </svg>
          <span>Restricted Portal: Admin credentials required</span>
        </div>

        <form onSubmit={handleSubmit} className='admin-auth-form'>
          {currState === 'Sign Up' && (
            <div className='admin-form-group'>
              <label htmlFor='admin-name'>Admin Full Name</label>
              <input
                id='admin-name'
                name='name'
                type='text'
                value={data.name}
                onChange={onChangeHandler}
                placeholder='e.g. Ayush Admin'
                required
                autoComplete='name'
              />
            </div>
          )}

          <div className='admin-form-group'>
            <label htmlFor='admin-email'>Admin Email</label>
            <input
              id='admin-email'
              name='email'
              type='email'
              value={data.email}
              onChange={onChangeHandler}
              placeholder='admin@example.com'
              required
              autoComplete='email'
            />
          </div>

          <div className='admin-form-group'>
            <label htmlFor='admin-password'>Password</label>
            <input
              id='admin-password'
              name='password'
              type='password'
              value={data.password}
              onChange={onChangeHandler}
              placeholder='Enter password (min 8 chars)'
              required
              minLength={8}
              autoComplete={currState === 'Login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type='submit'
            className='admin-auth-submit-btn'
            disabled={loading}
          >
            {loading ? (
              <span className='admin-spinner'>Authenticating...</span>
            ) : currState === 'Login' ? (
              'Sign In as Admin'
            ) : (
              'Create Admin Account'
            )}
          </button>
        </form>

        <div className='admin-auth-footer'>
          {currState === 'Login' ? (
            <p>
              Need a new Admin account?{' '}
              <button
                type='button'
                className='admin-auth-switch-btn'
                onClick={() => setCurrState('Sign Up')}
              >
                Sign up as Admin
              </button>
            </p>
          ) : (
            <p>
              Already have an Admin account?{' '}
              <button
                type='button'
                className='admin-auth-switch-btn'
                onClick={() => setCurrState('Login')}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
