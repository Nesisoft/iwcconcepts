import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #e5e7eb', borderTopColor: '#6c3fc5',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function CustomerRoute({ children }) {
  const { user, loading } = useCustomerAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/portal/login" state={{ from: location }} replace />
  return children
}
