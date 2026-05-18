'use client'

import { useEffect } from 'react'

/**
 * Root-level global error boundary.
 * Replaces the Vercel "Application error: a server-side exception has occurred" page.
 * Must render <html> + <body> since it replaces the root layout.
 * NEVER expose error.message, error.stack, or digest to the UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log digest only — no message/stack sent to client logs
    console.error('[GlobalError] digest:', error.digest ?? 'none')
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f9fafb' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '2rem',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '48px 40px',
            maxWidth: 440, width: '100%', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, margin: '0 auto 20px',
            }}>⚠️</div>
            <span style={{
              display: 'inline-block', padding: '4px 12px', background: '#fef2f2',
              color: '#dc2626', borderRadius: 20, fontSize: 11,
              fontWeight: 700, letterSpacing: '0.05em', marginBottom: 16,
            }}>500 — SERVER ERROR</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 28px' }}>
              An unexpected error occurred on the server. This has been logged automatically.
              Please try again — if the problem persists, contact your administrator.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 22px', background: '#0f172a', color: 'white',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Try again
              </button>
              <button
                onClick={() => { window.location.href = '/' }}
                style={{
                  padding: '10px 22px', background: 'white', color: '#374151',
                  borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
