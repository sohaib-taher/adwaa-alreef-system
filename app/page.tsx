'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const APP_NAME = '\u0627\u0636\u0648\u0627\u0621 \u0627\u0644\u0631\u064A\u0641'
const SUBTITLE = '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644'
const LABEL_EMAIL = '\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A'
const LABEL_PASSWORD = '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631'
const BTN_LOGIN = '\u062F\u062E\u0648\u0644'
const LOADING_TEXT = '\u062C\u0627\u0631\u064A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644...'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then((res) => {
      if (res.data.session) {
        window.location.href = '/dashboard'
      } else {
        setChecking(false)
      }
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#10b981',
        color: 'white',
        fontSize: '18px',
        fontFamily: 'Arial',
      }}>
        ...
      </div>
    )
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      fontFamily: 'Arial',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        padding: '40px 35px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '420px',
      }}>
        <div style={{
          width: '180px',
          height: '180px',
          margin: '0 auto 20px',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '15px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>
          <img
            src="/logo.png"
            alt="logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <h1 style={{
          textAlign: 'center',
          marginBottom: '8px',
          color: '#059669',
          fontSize: '26px',
          fontWeight: 'bold',
        }}>
          {APP_NAME}
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px',
          fontSize: '15px',
        }}>
          {SUBTITLE}
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: 'bold',
              fontSize: '15px',
            }}>
              {LABEL_EMAIL}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                color: '#111827',
                background: '#ffffff',
                outline: 'none',
              }}
              placeholder="example@email.com"
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: 'bold',
              fontSize: '15px',
            }}>
              {LABEL_PASSWORD}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                color: '#111827',
                background: '#ffffff',
                outline: 'none',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#9ca3af' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '17px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? LOADING_TEXT : BTN_LOGIN}
          </button>
        </form>

        {message && (
          <p style={{
            textAlign: 'center',
            marginTop: '20px',
            padding: '12px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}