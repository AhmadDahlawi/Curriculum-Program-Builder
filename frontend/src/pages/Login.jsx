import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import universityLogo from '@/assets/university-logo.png'
import { api } from '@/services/api'
import '../App.css'

const translations = {
  en: {
    title: "Study Plan Program",
    university: "UMM AL-QURA UNIVERSITY",
    login: "Login",
    register: "Register",
    username: "Username",
    password: "Password",
    email: "Email (Optional)",
    enterUsername: "Enter your username",
    enterPassword: "Enter your password",
    enterEmail: "Enter your email",
    loginButton: "Sign In",
    registerButton: "Create Account",
    toggleForm: "Don't have an account? Register",
    toggleFormRegister: "Already have an account? Login",
    success: "Success",
    error: "Error",
    loginSuccess: "Login successful!",
    registerSuccess: "Registration successful! Please login.",
    invalidCredentials: "Invalid username or password",
    usernameTaken: "Username already exists",
    emailTaken: "Email already exists",
    fieldRequired: "This field is required",
    passwordTooShort: "Password must be at least 5 characters",
    usernameTooShort: "Username must be at least 3 characters",
    loading: "Loading...",
    showPassword: "Show password",
    hidePassword: "Hide password",
    invalidEmail: "Invalid email format",
    demoText: "Demo: username:",
    demoPassword: "password:",
    logoAlt: "University Logo"
  },
  ar: {
    title: "برنامج الخطة الدراسية",
    university: "جامعة أم القرى",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    email: "البريد الإلكتروني (اختياري)",
    enterUsername: "أدخل اسم المستخدم",
    enterPassword: "أدخل كلمة المرور",
    enterEmail: "أدخل بريدك الإلكتروني",
    loginButton: "دخول",
    registerButton: "إنشاء حساب",
    toggleForm: "ليس لديك حساب؟ سجل الآن",
    toggleFormRegister: "لديك حساب بالفعل؟ دخول",
    success: "نجح",
    error: "خطأ",
    loginSuccess: "تم تسجيل الدخول بنجاح!",
    registerSuccess: "تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.",
    invalidCredentials: "اسم المستخدم أو كلمة المرور غير صحيحة",
    usernameTaken: "اسم المستخدم موجود بالفعل",
    emailTaken: "البريد الإلكتروني موجود بالفعل",
    fieldRequired: "هذا الحقل مطلوب",
    passwordTooShort: "كلمة المرور يجب أن تكون 5 أحرف على الأقل",
    usernameTooShort: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
    loading: "جاري التحميل...",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    invalidEmail: "صيغة البريد الإلكتروني غير صحيحة",
    demoText: "مثال: اسم المستخدم:",
    demoPassword: "كلمة المرور:",
    logoAlt: "شعار الجامعة"
  }
}

export default function Login({ onLoginSuccess, language = 'ar' }) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('error')
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  })

  const t = translations[language]
  const isRTL = language === 'ar'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setMessage(t.fieldRequired)
      setMessageType('error')
      return false
    }

    if (formData.username.trim().length < 3) {
      setMessage(t.usernameTooShort)
      setMessageType('error')
      return false
    }

    if (!formData.password.trim()) {
      setMessage(t.fieldRequired)
      setMessageType('error')
      return false
    }

    if (formData.password.trim().length < 5) {
      setMessage(t.passwordTooShort)
      setMessageType('error')
      return false
    }

    if (!isLogin && formData.email && !formData.email.includes('@')) {
      setMessage(t.invalidEmail)
      setMessageType('error')
      return false
    }

    return true
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await api.login(formData.username, formData.password)
      
      // Store token and user info
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setMessage(t.loginSuccess)
      setMessageType('success')
      
      // Call the callback after a short delay
      setTimeout(() => {
        onLoginSuccess(response.user, response.access_token)
      }, 500)
    } catch (error) {
      const errorMsg = error.detail || error.message
      if (errorMsg.includes('Invalid username or password')) {
        setMessage(t.invalidCredentials)
      } else {
        setMessage(errorMsg)
      }
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setMessage(null)

    try {
      await api.register(formData.username, formData.password, formData.email)
      
      setMessage(t.registerSuccess)
      setMessageType('success')
      
      // Clear form and switch to login
      setTimeout(() => {
        setFormData({ username: '', password: '', email: '' })
        setIsLogin(true)
        setMessage(null)
      }, 1500)
    } catch (error) {
      const errorMsg = error.detail || error.message
      if (errorMsg.includes('Username already exists')) {
        setMessage(t.usernameTaken)
      } else if (errorMsg.includes('Email already exists')) {
        setMessage(t.emailTaken)
      } else {
        setMessage(errorMsg)
      }
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-50 p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-lg p-2 shadow-md">
              <img src={universityLogo} alt={t.logoAlt} className="h-16 w-16" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.title}</h1>
          <p className="text-sm text-gray-600">{t.university}</p>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className={`mb-6 ${messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {messageType === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Login/Register Card */}
        <Card className="shadow-xl border-cyan-100">
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-t-lg">
            <CardTitle className="text-center">
              {isLogin ? t.login : t.register}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t.username}
                </label>
                <Input
                  type="text"
                  name="username"
                  placeholder={t.enterUsername}
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  className="border-gray-300 focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t.password}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder={t.enterPassword}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="border-gray-300 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    title={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Email Field (Register Only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t.email}
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder={t.enterEmail}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="border-gray-300 focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold py-2 h-auto shadow-md transition-all active:scale-[0.98]"
              >
                {loading ? t.loading : (isLogin ? t.loginButton : t.registerButton)}
              </Button>
            </form>

            {/* Toggle Form Link */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setMessage(null)
                  setFormData({ username: '', password: '', email: '' })
                }}
                className="text-cyan-700 hover:text-cyan-800 font-medium text-sm hover:underline"
              >
                {isLogin ? t.toggleForm : t.toggleFormRegister}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-6 text-center text-xs text-gray-500">
          {isLogin && (
            <p className="bg-white/50 inline-block px-3 py-1 rounded-full border border-cyan-100">
              {t.demoText} <span className="font-semibold text-cyan-800">Admin</span>, {t.demoPassword} <span className="font-semibold text-cyan-800">12345</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
