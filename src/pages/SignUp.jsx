import React, { useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/signup', { name, email, password })
      signIn(res.data.token, res.data.user)
      navigate('/')
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to sign up')
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Create your account</h2>
      <form onSubmit={onSubmit} className="card">
        <div className="card-body space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" type="submit">Create account</button>
          <p className="text-sm text-gray-600">Already have an account? <Link className="text-emerald-700" to="/signin">Sign in</Link></p>
        </div>
      </form>
    </div>
  )
}
