'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('❌ خطأ: ' + error.message)
      setLoading(false)
      return
    }

    setMessage('✅ تم تسجيل الدخول بنجاح! جاري التوجيه...')

    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1000)
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px 35px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* الشعار */}
        {/* الشعار في مربع أبيض */}
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
          boxSizing: 'border-box'
        }}>
          <img
            src="/logo.png"
            alt="شعار اضواء الريف"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>

        {/* عنوان النظام */}
        <h1 style={{
          textAlign: 'center',
          marginBottom: '8px',
          color: '#059669',
          fontSize: '26px',
          fontWeight: 'bold'
        }}>
           اضواء الريف
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px',
          fontSize: '15px'
        }}>
          تسجيل الدخول
        </p>

        <form onSubmit={handleLogin}>
          {/* البريد الإلكتروني */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: 'bold',
              fontSize: '15px'
            }}>
              البريد الإلكتروني
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
                outline: 'none'
              }}
              placeholder="example@email.com"
            />
          </div>

          {/* كلمة المرور */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: 'bold',
              fontSize: '15px'
            }}>
              كلمة المرور
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
                outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>

          {/* زر الدخول */}
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
              transition: 'background 0.3s'
            }}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
          </button>
        </form>

        {message && (
          <p style={{
            textAlign: 'center',
            marginTop: '20px',
            padding: '12px',
            borderRadius: '8px',
            background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
            color: message.includes('✅') ? '#065f46' : '#991b1b',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {message}
          </p>
        )}

        {/* تذييل الصفحة */}
        <p style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '12px',
          marginTop: '25px',
          marginBottom: 0
        }}>
          © 2026 اضواء الريف - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}