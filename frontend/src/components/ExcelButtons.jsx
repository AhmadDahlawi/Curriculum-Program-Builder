import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { AlertCircle, CheckCircle, Download, Upload, FileDown } from 'lucide-react'

export default function ExcelButtons({ plans = [], onPlanImported, language = 'ar' }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('error')
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [showPlanSelector, setShowPlanSelector] = useState(false)
  
  // Create a reference to the hidden file input
  const fileInputRef = useRef(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const translations = {
    en: {
      downloadTemplate: "Download Template",
      importPlan: "Import Plan",
      exportPlan: "Export Plan",
      selectPlan: "Select Plan to Export",
      selectPlanPlaceholder: "Choose a plan...",
      export: "Export",
      cancel: "Cancel",
      success: "Success",
      error: "Error",
      templateDownloaded: "Template downloaded successfully!",
      planImported: "Plan imported successfully!",
      planExported: "Plan exported successfully!",
      selectFile: "Select Excel file",
      noPlanSelected: "Please select a plan to export",
      noPlans: "No plans available to export",
      uploading: "Uploading..."
    },
    ar: {
      downloadTemplate: "تحميل القالب",
      importPlan: "استيراد خطة",
      exportPlan: "تصدير خطة",
      selectPlan: "اختر خطة للتصدير",
      selectPlanPlaceholder: "اختر خطة...",
      export: "تصدير",
      cancel: "إلغاء",
      success: "نجح",
      error: "خطأ",
      templateDownloaded: "تم تحميل القالب بنجاح!",
      planImported: "تم استيراد الخطة بنجاح!",
      planExported: "تم تصدير الخطة بنجاح!",
      selectFile: "اختر ملف Excel",
      noPlanSelected: "يرجى اختيار خطة للتصدير",
      noPlans: "لا توجد خطط متاحة للتصدير",
      uploading: "جاري الرفع..."
    }
  }

  const t = translations[language]
  const isRTL = language === 'ar'

  const handleDownloadTemplate = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/plans/excel/template`)
      if (!response.ok) throw new Error('Failed to download template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'study_plan_template.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setMessage(t.templateDownloaded)
      setMessageType('success')
    } catch (error) {
      console.error("Download Error:", error)
      setMessage(error.message || 'Error downloading template')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const triggerFileInput = () => {
    // Manually click the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImportPlan = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Immediate feedback that file was picked
    console.log("File selected:", file.name)
    setLoading(true)
    setMessage(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/plans/excel/import`, {
        method: 'POST',
        headers: { 
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to import plan')
      }

      setMessage(t.planImported)
      setMessageType('success')
      if (onPlanImported) onPlanImported(data.plan)
    } catch (error) {
      console.error("Import Error:", error)
      setMessage(error.message || 'Error importing plan')
      setMessageType('error')
    } finally {
      setLoading(false)
      // Reset input so the same file can be picked again
      if (event.target) event.target.value = ''
    }
  }

  const handleExportPlan = async () => {
    if (!selectedPlanId) return
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${selectedPlanId}/excel/export`)
      if (!response.ok) throw new Error('Failed to export plan')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'plan.xlsx'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setMessage(t.planExported)
      setMessageType('success')
      setShowPlanSelector(false)
      setSelectedPlanId(null)
    } catch (error) {
      console.error("Export Error:", error)
      setMessage(error.message || 'Error exporting plan')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {message && (
        <Alert className={`${messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-2">
            {messageType === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
            <AlertDescription className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>{message}</AlertDescription>
          </div>
        </Alert>
      )}
      
      <div className="flex flex-wrap gap-3">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef}
          accept=".xlsx,.xls" 
          onChange={handleImportPlan} 
          className="hidden" 
        />

        <Button 
          onClick={handleDownloadTemplate} 
          disabled={loading} 
          className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4 mr-2" /> {t.downloadTemplate}
        </Button>
        
        <Button 
          onClick={triggerFileInput}
          disabled={loading} 
          className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]"
        >
          <Upload className="w-4 h-4 mr-2" /> {loading ? t.uploading : t.importPlan}
        </Button>

        <Button 
          onClick={() => setShowPlanSelector(!showPlanSelector)} 
          disabled={loading || plans.length === 0} 
          className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]"
        >
          <FileDown className="w-4 h-4 mr-2" /> {t.exportPlan}
        </Button>
      </div>
      
      {showPlanSelector && (
        <div className="bg-white border border-cyan-200 rounded-lg p-4 shadow-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectPlan}</label>
          <select value={selectedPlanId || ''} onChange={(e) => setSelectedPlanId(parseInt(e.target.value) || null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-cyan-500 focus-visible:border-cyan-500 mb-3">
            <option value="">{t.selectPlanPlaceholder}</option>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select>
          <div className="flex gap-2">
            <Button onClick={handleExportPlan} disabled={loading || !selectedPlanId} className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]">{t.export}</Button>
            <Button onClick={() => { setShowPlanSelector(false); setSelectedPlanId(null); }} variant="outline" className="flex-1">{t.cancel}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
