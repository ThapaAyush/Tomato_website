import React, { useState } from 'react'
import './Login.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = ({ url, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
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

    const cleanEmail = (data.email || '').trim().toLowerCase()

    if (cleanEmail !== 'ayush108ayush108@gmail.com' || data.password !== '123qweasd') {
      toast.error('Invalid email or password for Admin Panel')
      setLoading(false)
      return
    }

    const endpoint = '/api/user/login'
    const payload = {
      ...data,
      email: cleanEmail,
      role: 'Admin'
    }

    try {
      const response = await axios.post(`${url}${endpoint}`, payload)

      if (response.data.success) {
        const token = response.data.token
        const role = response.data.role || 'Admin'
        const email = response.data.email || data.email
        const name = response.data.name || 'Administrator'

        localStorage.setItem('token', token)
        localStorage.setItem('role', role)
        localStorage.setItem('userEmail', email)
        localStorage.setItem('userName', name)
        if (response.data.passwordHashKey) {
          localStorage.setItem('passwordHashKey', response.data.passwordHashKey)
        }

        toast.success('Logged in successfully')

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
          <h2>Admin Login</h2>
        </div>

        <div className='login-inputs'>
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
          {loading ? 'Please wait...' : 'Login'}
        </button>

        <div className='login-footer'>
          <a href={frontendUrl} className='login-back-link'>• Back to Website</a>
        </div>
      </form>
    </div>
  )
}

export default Login
