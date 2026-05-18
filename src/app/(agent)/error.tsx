'use client'

import { useEffect } from 'react'

export default function AgentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AgentError]', error.digest ?? 'no-digest')
  }, [error])

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, background: '#fef2f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 20,
      }}>⚠️</div>
      <span style={{
        display: 'inline-block', padding: '4px 12px', background: '#fef2f2',
        color: '#dc2626', borderRadius: 20, fontSize: 11,
        fontWeight: 700, marginBottom: 16,
      }}>500 — SERVER ERROR</span>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 360, margin: '0 0 24px' }}>
        A server error occurred. Please try again — if the problem persists, contact your administrator.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: '10px 20px', background: '#0f172a', color: 'white',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
          }}
        >
          Try again
        </button>
        <button
          onClick={() => { window.location.href = '/dashboard' }}
          style={{
            padding: '10px 20px', background: 'white', color: '#374151',
            borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
