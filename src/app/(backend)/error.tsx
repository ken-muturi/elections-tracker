'use client'

export default function BackendError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Backend layout error:', error)
  
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Something went wrong</h2>
      <pre style={{ 
        background: '#fee2e2', 
        padding: '1rem', 
        borderRadius: '8px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: '1rem 0'
      }}>
        {error.message}
        {error.digest && `\nDigest: ${error.digest}`}
      </pre>
      <button 
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          background: '#0f172a',
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  )
}
