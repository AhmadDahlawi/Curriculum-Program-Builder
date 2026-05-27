import { useState, useEffect } from 'react'
import App from './App'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

const loadingTranslations = {
  en: 'Loading...',
  ar: 'جاري التحميل...'
}

export default function AppRouter() {
  const { user, token, loading, login } = useAuth()
  const [language, setLanguage] = useState('ar')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingTranslations[language]}</p>
        </div>
      </div>
    )
  }

  if (!user || !token) {
    return (
      <Login 
        onLoginSuccess={login}
        language={language}
      />
    )
  }

  return (
    <App 
      language={language}
      setLanguage={setLanguage}
      user={user}
      token={token}
    />
  )
}
