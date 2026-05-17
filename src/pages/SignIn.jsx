import { SignIn as ClerkSignIn } from '@clerk/react'

export default function SignIn() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC',
    }}>
      <ClerkSignIn fallbackRedirectUrl="/hinckley/tasks" />
    </div>
  )
}
