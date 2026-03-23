import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { InvitePage } from './components/auth/InvitePage'
import { OnboardingPage } from './components/auth/OnboardingPage'
import { LoginPage } from './components/auth/LoginPage'
import { ChatView } from './components/chat/ChatView'
import { CircleList } from './components/circles/CircleList'
import { CircleView } from './components/circles/CircleView'
import { SettingsPage } from './components/settings/SettingsPage'
import { IncomingCall } from './components/calls/IncomingCall'
import { CallView } from './components/calls/CallView'

function Home() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>
      Select a chat to start messaging
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="chat/:roomId" element={<ChatView />} />
          <Route path="circles" element={<CircleList />} />
          <Route path="circles/:id" element={<CircleView />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <IncomingCall />
      <CallView />
    </>
  )
}
