import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// When the email verification link returns the user to "/?pwsetup=1", route
// them to the password-creation page. main.jsx has already stripped the token
// hash and stashed the tokens for SetPassword to apply.
export default function PortalRedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('pwsetup') === '1') {
      // Clear the query param so a reload doesn't re-trigger the redirect.
      window.history.replaceState(null, '', window.location.pathname)
      navigate('/portal/set-password', { replace: true })
    }
  }, []) // eslint-disable-line

  return null
}
