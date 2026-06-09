import { useState, useEffect, useRef } from 'react'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { CheckCircle, AlertCircle, Trash2, Edit, X, Globe, Plus, Download, Upload, FileSpreadsheet, Eye, Save, Menu, BookOpen, Calendar, Search, Settings, Move, AlertTriangle } from 'lucide-react'
import ExcelButtons from '@/components/ExcelButtons.jsx'
import universityLogo from './assets/university-logo.png'
import './App.css'
import { api } from './services/api'

// Translation object
const translations = {
  en: {
    title: "Curriculum Program Builder",
    university: "UMM AL-QURA UNIVERSITY",
    downloadTemplate: "Download Template",
    importExcel: "Import Excel",
    exportExcel: "Export to Excel",
    maxCreditsLabel: "Max Credits Per Semester",
    addCourse: "Add Course",
    editCourse: "Edit Course",
    courseDetails: "Course Details",
    semester: "Semester",
    addSemester: "Add Semester",
    courseNameAr: "Course Name (Arabic)",
    courseNameEn: "Course Name (English)", 
    courseCode: "Course Code",
    creditHours: "Credit Hours",
    courseType: "Course Type",
    studyMode: "Study Mode",
    lectureHours: "Lecture Hours",
    labHours: "Lab Hours",
    trainingHours: "Training Hours",
    prerequisite: "Prerequisite",
    requiresPrerequisite: "Requires",
    prerequisiteMustBeBefore: "Prerequisite must be in a previous semester:",
    close: "Close",
    department: "Department",
    actions: "Actions",
    totalCredits: "Total Credit Hours",
    clearTable: "Clear Table",
    addCourseBtn: "Add Course",
    saveChanges: "Save Changes",
    cancelEdit: "Cancel Edit",
    success: "Success",
    error: "An error occurred",
    courseAdded: "Course added successfully",
    courseUpdated: "Course updated successfully",
    confirmClear: "Are you sure you want to clear the table?",
    clear: "Clear",
    cancel: "Cancel",
    ok: "OK",
    edit: "Edit",
    save: "Save",
    view: "View",
    required: "Required",
    elective: "Elective",
    inPerson: "In-Person",
    online: "Online",
    hybrid: "Hybrid",
    selectPrereq: "Select Prerequisite",
    none: "None",
    creditsExceeded: "Credit hours exceed the maximum limit for this semester",
    maxCreditSurpassed: "Max Credit Surpassed",
    creditTooLow: "Credit Too Low",
    fieldRequired: "This field is required",
    invalidCredits: "Please enter valid credit hours",
    courseDescription: "Course Description",
    learningObjectives: "Learning Objectives",
    assessmentMethods: "Assessment Methods",
    instructor: "Instructor",
    courseMaterials: "Course Materials",
    gradingCriteria: "Grading Criteria",
    courseSchedule: "Course Schedule",
    officeHours: "Office Hours",
    courseNotes: "Additional Notes",
    templateDownloaded: "Template downloaded successfully",
    dataImported: "Data imported successfully",
    dataExported: "Data exported successfully",
    importError: "Error importing file. Please check the format.",
    selectFile: "Please select an Excel file to import",
    createPlan: "Create Plan",
    courses: "Courses",
    plans: "Plans",
    planName: "Plan Name",
    savePlan: "Save Plan",
    planSaved: "Plan saved successfully",
    enterPlanName: "Enter plan name",
    addFromExisting: "Add from Existing Courses",
    selectCourse: "Select Course",
    viewPlan: "View Plan",
    editPlan: "Edit Plan",
    planDetails: "Plan Details",
    addExistingCourse: "Add Existing Course",
    searchCourses: "Search courses...",
    searchPlans: "Search plans...",
    searchCoursesArabic: "Search in Arabic or English...",
    courseCodeExists: "Course code already exists",
    courseNameExists: "Course name already exists",
    planNameExists: "Plan name already exists",
    duplicateCourse: "Course already exists in the plan",
    invalidCourseCode: "Please enter a valid course code",
    prerequisiteNotFound: "Prerequisite validation failed",
    prerequisiteInSameTerm: "Prerequisites must be from previous terms",
    missingPrerequisites: "This course has missing prerequisites",
    numSemesters: "Number of Semesters",
    planConfig: "Plan Configuration",
    startCreating: "Start Creating",
    arabicOnly: "Arabic text only",
    englishOnly: "English text only",
    positiveOnly: "Positive numbers only",
    invalidNumber: "Please enter a valid number",
    invalidCodeFormat: "Invalid code format (letters, numbers and - only)",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this item?",
    courseDeleted: "Course deleted successfully",
    planDeleted: "Plan deleted successfully",
    saveAsNew: "Save as New",
    saveAsNewPlan: "Save as New Plan",
    saveAsNewCourse: "Save as New Course",
    enterNewName: "Enter New Name",
    enterNewCode: "Enter New Course Code",
    confirm: "Confirm",
    alignment: "Alignment",
    comparison: "Comparison",
    selectPlanA: "Select Plan A (Right)",
    selectPlanB: "Select Plan B (Left)",
    selectDifferentPlans: "Please select two different plans",
    totalCreditsLabel: "Total Credits",
    semesterCount: "Semesters",
    avgCredits: "Avg Credits/Sem",
    alignCourseHint: "Click a course on the right, then on the left to pair them",
    confirmPair: "Confirm Pairing",
    cancelSelection: "Cancel Selection",
    clearAllAlignments: "Clear All Alignments",
    exportAlignment: "Export to Excel",
    pairCreated: "Course pair created",
    pairRemoved: "Pair removed",
    equivalentLabel: "Equivalent",
    similarLabel: "Similar",
    replacedByLabel: "Replaced By",
    noAlignments: "No alignments yet — pair courses above",
    matchPercentage: "Match Rate",
    creditsDiff: "Credits Difference",
    exactMatch: "Exact Match",
    manualMatch: "Manual Alignment",
    noMatch: "No Match",
    comparisonHint: "Select two plans to see a full visual comparison",
    loadingAlignment: "Loading alignments...",
    planA: "Plan A",
    planB: "Plan B",
    totalCourses: "Total Courses",
    unmatchedCourses: "Unmatched Courses",
    exactMatches: "Exact Matches",
    manualMatches: "Manual Alignments",
    alignmentSaved: "Alignment Saved Successfully",
    cannotAlignSameCourse: "Cannot align a course with itself",
    alignmentFailed: "Alignment failed",
    connectionError: "Connection error with server",
    savedAlignments: "Saved Alignments",
    alignWithAI: "Align with AI",
    aiAligning: "AI is working...",
    aiAlignSuccess: "AI suggested {count} alignments",
    aiAlignError: "AI alignment failed",
    aiAlignNoKey: "Gemini API key is not configured on the server",
    addPrerequisite: "Add Prerequisite",
    logout: "Logout",
    toggleLanguage: "Arabic",
    noCoursesAdded: "No courses added"
  },
  ar: {
    title: "برنامج الخطة الدراسية",
    university: "جامعة أم القرى",
    downloadTemplate: "تحميل القالب",
    importExcel: "استيراد ملف Excel",
    exportExcel: "تصدير إلى Excel",
    maxCreditsLabel: "الحد الأقصى للساعات في الترم",
    addCourse: "إضافة مقرر",
    editCourse: "تعديل المقرر",
    courseDetails: "تفاصيل المقرر",
    semester: "الترم",
    addSemester: "إضافة ترم",
    courseNameAr: "اسم المقرر (عربي)",
    courseNameEn: "اسم المقرر (إنجليزي)",
    courseCode: "رمز المقرر",
    creditHours: "الساعات المعتمدة",
    courseType: "نوع المقرر",
    studyMode: "طريقة الدراسة",
    lectureHours: "ساعات المحاضرة",
    lecture: "محاضرة",
    lab: "معمل",
    training: "تدريب",
    labHours: "ساعات المعمل",
    trainingHours: "ساعات التدريب",
    prerequisite: "المتطلب السابق",
    requiresPrerequisite: "يتطلب",
    prerequisiteMustBeBefore: "يجب أن يكون المتطلب في ترم سابق:",
    close: "إغلاق",
    department: "القسم",
    actions: "الإجراءات",
    totalCredits: "إجمالي الساعات المعتمدة",
    clearTable: "مسح الجدول",
    addCourseBtn: "إضافة مقرر",
    saveChanges: "حفظ التغييرات",
    cancelEdit: "إلغاء التعديل",
    success: "نجح",
    error: "حدث خطأ",
    courseAdded: "تم إضافة المقرر بنجاح",
    courseUpdated: "تم تحديث المقرر بنجاح",
    confirmClear: "هل أنت متأكد من رغبتك في مسح الجدول؟",
    clear: "مسح",
    cancel: "إلغاء",
    ok: "موافق",
    edit: "تعديل",
    save: "حفظ",
    view: "عرض",
    required: "إجباري",
    elective: "اختياري",
    inPerson: "حضوري",
    online: "عن بعد",
    hybrid: "مدمج",
    selectPrereq: "اختر المتطلب السابق",
    none: "لا يوجد",
    creditsExceeded: "الساعات المعتمدة تتجاوز الحد الأقصى المسموح للترم",
    maxCreditSurpassed: "تم تجاوز الحد الأقصى للساعات",
    creditTooLow: "عدد الساعات منخفض جداً",
    fieldRequired: "هذا الحقل مطلوب",
    invalidCredits: "يرجى إدخال ساعات معتمدة صحيحة",
    courseDescription: "وصف المقرر",
    learningObjectives: "أهداف التعلم",
    assessmentMethods: "طرق التقييم",
    instructor: "المدرس",
    courseMaterials: "مواد المقرر",
    gradingCriteria: "معايير التقدير",
    courseSchedule: "جدول المقرر",
    officeHours: "ساعات المكتب",
    courseNotes: "ملاحظات إضافية",
    templateDownloaded: "تم تحميل النموذج بنجاح",
    dataImported: "تم استيراد البيانات بنجاح",
    dataExported: "تم تصدير البيانات بنجاح",
    importError: "خطأ في استيراد الملف. يرجى التحقق من التنسيق.",
    selectFile: "يرجى اختيار ملف إكسل للاستيراد",
    createPlan: "إنشاء خطة",
    courses: "المقررات",
    plans: "الخطط",
    planName: "اسم الخطة",
    savePlan: "حفظ الخطة",
    planSaved: "تم حفظ الخطة بنجاح",
    enterPlanName: "أدخل اسم الخطة",
    addFromExisting: "إضافة من المقررات الموجودة",
    selectCourse: "اختر مقرر",
    viewPlan: "عرض الخطة",
    editPlan: "تعديل الخطة",
    planDetails: "تفاصيل الخطة",
    addExistingCourse: "إضافة مقرر موجود",
    searchCourses: "البحث في المقررات...",
    searchPlans: "البحث في الخطط...",
    searchCoursesArabic: "البحث بالعربية أو الإنجليزية...",
    courseCodeExists: "رمز المقرر موجود مسبقاً",
    courseNameExists: "اسم المقرر موجود مسبقاً",
    planNameExists: "اسم الخطة موجود مسبقاً",
    duplicateCourse: "المقرر موجود مسبقاً في الخطة",
    invalidCourseCode: "يرجى إدخال رمز مقرر صحيح",
    prerequisiteNotFound: "فشل في التحقق من المتطلبات السابقة",
    prerequisiteInSameTerm: "المتطلبات السابقة يجب أن تكون من ترم سابق",
    missingPrerequisites: "هذا المقرر له متطلبات سابقة مفقودة",
    numSemesters: "عدد الأترام",
    planConfig: "إعدادات الخطة",
    startCreating: "ابدأ الإنشاء",
    arabicOnly: "نص عربي فقط",
    englishOnly: "نص إنجليزي فقط",
    positiveOnly: "أرقام موجبة فقط",
    invalidNumber: "الرجاء إدخال رقم صحيح",
    invalidCodeFormat: "صيغة الرمز غير صحيحة (حروف وأرقام و - فقط)",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد من رغبتك في حذف هذا العنصر؟",
    courseDeleted: "تم حذف المقرر بنجاح",
    planDeleted: "تم حذف الخطة بنجاح",
    saveAsNew: "حفظ كجديد",
    saveAsNewPlan: "حفظ كخطة جديدة",
    saveAsNewCourse: "حفظ كمقرر جديد",
    enterNewName: "أدخل الاسم الجديد",
    enterNewCode: "أدخل رمز المقرر الجديد",
    confirm: "تأكيد",
    alignment: "المواءمة",
    comparison: "المقارنة",
    selectPlanA: "اختر الخطة (أ) – اليمين",
    selectPlanB: "اختر الخطة (ب) – اليسار",
    selectDifferentPlans: "يرجى اختيار خطتين مختلفتين",
    totalCreditsLabel: "إجمالي الساعات",
    semesterCount: "عدد الأترام",
    avgCredits: "متوسط ساعات الترم",
    alignCourseHint: "اضغط على مقرر من اليمين ثم مقرر من اليسار لربطهما",
    confirmPair: "تأكيد الربط",
    cancelSelection: "إلغاء الاختيار",
    clearAllAlignments: "مسح جميع الروابط",
    exportAlignment: "تصدير إلى Excel",
    pairCreated: "تم إنشاء الربط",
    pairRemoved: "تم حذف الربط",
    equivalentLabel: "مكافئ",
    similarLabel: "مشابه",
    replacedByLabel: "يحل محله",
    noAlignments: "لا توجد روابط بعد — قم بربط المقررات أعلاه",
    matchPercentage: "نسبة التطابق",
    creditsDiff: "الفارق في الساعات",
    exactMatch: "تطابق تام",
    manualMatch: "مواءمة يدوية",
    noMatch: "بلا مطابقة",
    comparisonHint: "اختر خطتين لعرض المقارنة البصرية الشاملة",
    loadingAlignment: "جارٍ تحميل الروابط...",
    planA: "الخطة (أ)",
    planB: "الخطة (ب)",
    totalCourses: "إجمالي المقررات",
    unmatchedCourses: "المقررات غير المطابقة",
    exactMatches: "التطابقات التامة",
    manualMatches: "المواءمات اليدوية",
    alignmentSaved: "تم حفظ المواءمة بنجاح",
    cannotAlignSameCourse: "لا يمكن ربط المقرر بنفسه",
    alignmentFailed: "فشل الربط",
    connectionError: "خطأ في الاتصال بالخادم",
    savedAlignments: "الروابط المحفوظة",
    alignWithAI: "مواءمة بالذكاء الاصطناعي",
    aiAligning: "الذكاء الاصطناعي يعمل...",
    aiAlignSuccess: "اقترح الذكاء الاصطناعي {count} مواءمة",
    aiAlignError: "فشلت المواءمة التلقائية",
    aiAlignNoKey: "مفتاح Gemini API غير مُعيَّن على الخادم",
    addPrerequisite: "إضافة متطلب",
    logout: "تسجيل الخروج",
    toggleLanguage: "English",
    noCoursesAdded: "لم يتم إضافة مقررات"
  }
}

function App({ language: initialLanguage = 'ar', setLanguage: setParentLanguage, user, token }) {
  const [language, setLanguage] = useState(initialLanguage)
  const [courses, setCourses] = useState([]) // Courses in current plan
  const [savedCourses, setSavedCourses] = useState([]) // Global courses database
  const [savedPlans, setSavedPlans] = useState([])
  const [formData, setFormData] = useState({
    semester: "1",
    nameAr: '',
    nameEn: '',
    code: '',
    credits: '',
    type: 'Required',
    mode: 'In-Person',
    lectureHours: '0',
    labHours: '0',
    trainingHours: '0',
    prerequisiteCodes: [],
    department: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showCourseDetails, setShowCourseDetails] = useState(false)
  const [showPlanDetails, setShowPlanDetails] = useState(false)
  const [showAddExistingCourse, setShowAddExistingCourse] = useState(false)
  const [showPlanConfigDialog, setShowPlanConfigDialog] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showCreatePlanForm, setShowCreatePlanForm] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [maxCreditsPerSemester, setMaxCreditsPerSemester] = useState(18)
  const [numSemesters, setNumSemesters] = useState(8)
  const [planName, setPlanName] = useState('')
  const [currentPage, setCurrentPage] = useState('createPlan')
  const [courseSearchTerm, setCourseSearchTerm] = useState('')
  const [planSearchTerm, setPlanSearchTerm] = useState('')
  const [existingCourseSearchTerm, setExistingCourseSearchTerm] = useState('')
  const [selectedExistingCourseSemester, setSelectedExistingCourseSemester] = useState("1")
  const [activeSemesterForAdd, setActiveSemesterForAdd] = useState("1")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'course'|'plan', item }
  const [activeId, setActiveId] = useState(null)
  const [showSaveAsNewPrompt, setShowSaveAsNewPrompt] = useState(false)
  const [saveAsNewType, setSaveAsNewType] = useState(null) // 'plan' | 'course'
  const [saveAsNewValue, setSaveAsNewValue] = useState('')

  // Persistent state for Alignment Page
  const [alnPlanAId, setAlnPlanAId] = useState('')
  const [alnPlanBId, setAlnPlanBId] = useState('')
  const [alnAlignments, setAlnAlignments] = useState([])
  const [alnSelectedA, setAlnSelectedA] = useState(null)
  const [alnSelectedB, setAlnSelectedB] = useState(null)
  const [alnRelationType, setAlnRelationType] = useState('equivalent')
  const [alnLoading, setAlnLoading] = useState(false)
  const [alnAiLoading, setAlnAiLoading] = useState(false)
  const [alnStatusMsg, setAlnStatusMsg] = useState('')
  const [alnShowWarning, setAlnShowWarning] = useState(false)
  const [alnWarningMsg, setAlnWarningMsg] = useState('')

  const t = translations[language]
  const isRTL = language === 'ar'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.reload()
  }

  // Fetch initial data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, plansData] = await Promise.all([
          api.getCourses(),
          api.getPlans()
        ]);
        setSavedCourses(coursesData);
        setSavedPlans(plansData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  // Validation Helpers
  // Arabic name must contain at least one real Arabic letter; whitespace/digits-only is invalid (UT-41, UT-42)
  const isArabic = (text) => {
    if (!text || !/[\u0600-\u06FF]/.test(text)) return false;
    return /^[\u0600-\u06FF\s0-9]+$/.test(text);
  };
  const isEnglish = (text) => {
    if (!text || !/[A-Za-z]/.test(text)) return false;
    return /^[A-Za-z\s0-9]+$/.test(text);
  };

  const validateCourseData = (data) => {
    const errors = {};
    if (!data.nameAr || !isArabic(data.nameAr)) errors.nameAr = t.arabicOnly;
    if (!data.nameEn || !isEnglish(data.nameEn)) errors.nameEn = t.englishOnly;
    // Course code must be a safe alphanumeric code (letters, digits, hyphen) — rejects XSS/symbols (UT-44)
    if (!data.code || data.code.trim() === '') {
      errors.code = t.fieldRequired;
    } else if (!/^[A-Za-z0-9\- ]+$/.test(data.code.trim())) {
      errors.code = t.invalidCodeFormat;
    }
    // Credits must be a clean positive integer — rejects values like '3abc' (UT-43)
    if (data.credits === undefined || data.credits === null || String(data.credits).trim() === '') {
      errors.credits = t.positiveOnly;
    } else if (!/^\d+$/.test(String(data.credits).trim()) || parseInt(data.credits, 10) <= 0) {
      errors.credits = t.invalidNumber;
    }
    
    // Check for duplicate course codes
    if (!editingCourse) {
      if (savedCourses.some(c => c.code.toUpperCase() === data.code.toUpperCase())) {
        errors.code = t.courseCodeExists;
      }
    } else if (editingCourse && editingCourse.code !== data.code) {
      if (savedCourses.some(c => c.code.toUpperCase() === data.code.toUpperCase())) {
        errors.code = t.courseCodeExists;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Course Management ---

  const addOrUpdateCourse = async (courseData, isGlobalOnly = false, forceCreate = false) => {
    const isValid = validateCourseData(courseData);
    if (!isValid) {
      setErrorMessage(t.error);
      setShowErrorModal(true);
      return;
    }

    try {
      let savedCourse;
      
      if (editingCourse && !forceCreate) {
        // Update existing course
        savedCourse = await api.updateCourse(editingCourse.id, courseData);
        setSavedCourses(prev => prev.map(c => c.id === savedCourse.id ? savedCourse : c));
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...savedCourse, semester: courseData.semester } : c));
        setErrorMessage(t.courseUpdated);
      } else {
        // Create new course
        savedCourse = await api.createCourse(courseData);
        setSavedCourses(prev => [...prev, savedCourse]);
        if (!isGlobalOnly) {
          setCourses(prev => [...prev, { ...savedCourse, semester: courseData.semester }]);
        }
        setErrorMessage(t.courseAdded);
      }
      
      setShowSuccessModal(true);
      resetForm();
      setShowCourseDetails(false);
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorModal(true);
    }
  };

  // --- Delete Handlers ---

  const handleDeleteCourse = (course) => {
    setDeleteTarget({ type: 'course', item: course });
    setShowDeleteConfirm(true);
  };

  const handleDeletePlan = (plan) => {
    setDeleteTarget({ type: 'plan', item: plan });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'course') {
        await api.deleteCourse(deleteTarget.item.id);
        setSavedCourses(prev => prev.filter(c => c.id !== deleteTarget.item.id));
        setCourses(prev => prev.filter(c => c.id !== deleteTarget.item.id));
        setErrorMessage(t.courseDeleted);
      } else {
        await api.deletePlan(deleteTarget.item.id);
        setSavedPlans(prev => prev.filter(p => p.id !== deleteTarget.item.id));
        setErrorMessage(t.planDeleted);
      }
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err.message || 'Delete failed');
      setShowErrorModal(true);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const resetForm = () => {
    setFormData({
      semester: activeSemesterForAdd,
      nameAr: '',
      nameEn: '',
      code: '',
      credits: '',
      type: 'Required',
      mode: 'In-Person',
      lectureHours: '0',
      labHours: '0',
      trainingHours: '0',
      prerequisiteCodes: [],
      department: ''
    });
    setFormErrors({});
    setEditingCourse(null);
    setSelectedCourse(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  // --- Drag & Drop Handlers ---

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const activeCourseId = active.id;
    const overId = over.id;

    // Determine target semester
    let targetSemester;
    if (typeof overId === 'string' && overId.startsWith('semester-')) {
      targetSemester = overId.replace('semester-', '');
    } else {
      const overCourse = courses.find(c => c.id === overId);
      if (overCourse) targetSemester = overCourse.semester;
    }

    if (!targetSemester) return;

    const courseToMove = courses.find(c => c.id === activeCourseId);
    if (!courseToMove || courseToMove.semester === targetSemester) return;

    // Validate prerequisites when moving (Still prevent if invalid)
    if (courseToMove.prerequisiteCodes && courseToMove.prerequisiteCodes.length > 0) {
      const wrongSemesterPrereqs = [];

      for (const prereqCode of courseToMove.prerequisiteCodes) {
        if (prereqCode === 'none' || !prereqCode) continue;
        
        const prereqInPlan = courses.find(c => c.code === prereqCode);
        if (prereqInPlan && parseInt(prereqInPlan.semester) >= parseInt(targetSemester)) {
          wrongSemesterPrereqs.push(`${prereqCode} (${t.semester} ${prereqInPlan.semester})`);
        }
      }

      if (wrongSemesterPrereqs.length > 0) {
        setErrorMessage(`${courseToMove.nameAr || courseToMove.nameEn} ${t.prerequisiteMustBeBefore}: ${wrongSemesterPrereqs.join(', ')}`);
        setShowErrorModal(true);
        return;
      }
    }

    // Reverse-dependency check: ensure moving this course does not break any course that depends on it (TC-52)
    const brokenDependents = [];
    for (const dependent of courses) {
      if (dependent.id === activeCourseId) continue;
      if (dependent.prerequisiteCodes && dependent.prerequisiteCodes.includes(courseToMove.code)) {
        if (parseInt(targetSemester) >= parseInt(dependent.semester)) {
          brokenDependents.push(`${dependent.code} (${t.semester} ${dependent.semester})`);
        }
      }
    }
    if (brokenDependents.length > 0) {
      setErrorMessage(`${courseToMove.nameAr || courseToMove.nameEn} ${t.prerequisiteMustBeBefore}: ${brokenDependents.join(', ')}`);
      setShowErrorModal(true);
      return;
    }

    // Apply the move
    setCourses(prev => prev.map(c => c.id === activeCourseId ? { ...c, semester: targetSemester } : c));
  };

  // --- UI Components ---

  const DraggableCourse = ({ course }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: course.id });

    const style = {
      transform: CSS.Translate.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${isDragging ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="font-bold text-sm text-gray-800">{language === 'ar' ? course.nameAr : course.nameEn}</div>
          <Move className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{course.code}</span>
          <span className="text-cyan-600 font-semibold">{course.credits} {language === 'ar' ? 'ساعة' : 'Hrs'}</span>
        </div>
      </div>
    );
  };

  const SemesterCard = ({ semester }) => {
    const semesterCourses = courses.filter(c => c.semester === semester.toString());
    const totalCredits = semesterCourses.reduce((sum, c) => sum + c.credits, 0);
    const isOverLimit = totalCredits > maxCreditsPerSemester;
    const isTooLow = totalCredits > 0 && totalCredits < (maxCreditsPerSemester / 2);

    const { setNodeRef } = useSortable({
      id: `semester-${semester}`,
    });

    return (
      <Card className={`border-cyan-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${isOverLimit ? 'border-red-500 ring-1 ring-red-100' : (isTooLow ? 'border-amber-400 ring-1 ring-amber-50' : '')}`}>
        <CardHeader className={`py-3 flex flex-row items-center justify-between ${isOverLimit ? 'bg-red-50' : (isTooLow ? 'bg-amber-50' : 'bg-cyan-50')}`}>
          <CardTitle className="text-lg text-cyan-800">
            {t.semester} {semester}
          </CardTitle>
          <div className="flex flex-col items-end">
            <div className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : (isTooLow ? 'text-amber-600' : 'text-cyan-600')}`}>
              {totalCredits} / {maxCreditsPerSemester} {t.creditHours}
            </div>
          </div>
        </CardHeader>
        <CardContent ref={setNodeRef} className="p-4 space-y-3 flex-grow min-h-[120px]">
          {/* Warning Labels */}
          {isOverLimit && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold animate-pulse mb-2">
              <AlertCircle className="w-3 h-3" />
              {t.maxCreditSurpassed}
            </div>
          )}
          {isTooLow && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold mb-2">
              <AlertTriangle className="w-3 h-3" />
              {t.creditTooLow}
            </div>
          )}

          <SortableContext items={semesterCourses.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {semesterCourses.length > 0 ? (
              semesterCourses.map(course => (
                <div key={course.id} className="flex items-center justify-between group">
                  <div className="flex-1">
                    <DraggableCourse course={course} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => {
                      setEditingCourse(course);
                      setFormData({ ...course, credits: course.credits.toString(), lectureHours: course.lectureHours.toString(), labHours: course.labHours.toString(), trainingHours: course.trainingHours.toString() });
                      setShowCourseDetails(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setCourses(prev => prev.filter(c => c.id !== course.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400 text-xs italic">{t.noCoursesAdded}</div>
            )}
          </SortableContext>
        </CardContent>
        <div className="p-4 pt-0 mt-auto">
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full text-xs h-9 border-dashed border-cyan-300 text-cyan-600 hover:bg-cyan-50 justify-start"
              onClick={() => {
                setActiveSemesterForAdd(semester.toString());
                resetForm();
                setFormData(prev => ({ ...prev, semester: semester.toString() }));
                setShowCourseDetails(true);
              }}
            >
              <Plus className="h-3 w-3 mr-2" /> {t.addCourse}
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-xs h-9 border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 justify-start"
              onClick={() => {
                setSelectedExistingCourseSemester(semester.toString());
                setShowAddExistingCourse(true);
              }}
            >
              <Search className="h-3 w-3 mr-2" /> {t.addExistingCourse}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const addExistingCourseToPlan = (course, targetSemester) => {
    if (courses.some(c => c.code === course.code)) {
      setErrorMessage(t.duplicateCourse);
      setShowErrorModal(true);
      return;
    }

    // Check prerequisites
    if (course.prerequisiteCodes && course.prerequisiteCodes.length > 0) {
      const missingPrereqs = [];
      const wrongSemesterPrereqs = [];

      for (const prereqCode of course.prerequisiteCodes) {
        if (prereqCode === 'none' || !prereqCode) continue;
        
        const prereqInPlan = courses.find(c => c.code === prereqCode);
        if (!prereqInPlan) {
          const prereqCourse = savedCourses.find(c => c.code === prereqCode);
          if (prereqCourse) {
            missingPrereqs.push(prereqCourse.nameAr || prereqCourse.nameEn);
          }
        } else if (parseInt(prereqInPlan.semester) >= parseInt(targetSemester)) {
          wrongSemesterPrereqs.push(`${prereqCode} (${t.semester} ${prereqInPlan.semester})`);
        }
      }

      if (missingPrereqs.length > 0) {
        setErrorMessage(`${course.nameAr || course.nameEn} ${t.requiresPrerequisite}: ${missingPrereqs.join(', ')}`);
        setShowErrorModal(true);
        return;
      }

      if (wrongSemesterPrereqs.length > 0) {
        setErrorMessage(`${course.nameAr || course.nameEn} ${t.prerequisiteMustBeBefore}: ${wrongSemesterPrereqs.join(', ')}`);
        setShowErrorModal(true);
        return;
      }
    }

    // Allow exceeding limits but UI will flag it
    setCourses(prev => [...prev, { ...course, semester: targetSemester }]);
    setShowAddExistingCourse(false);
    setErrorMessage(t.courseAdded);
    setShowSuccessModal(true);
  };

  // --- Plan Management ---

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      setErrorMessage(t.enterPlanName);
      setShowErrorModal(true);
      return;
    }

    // Check for duplicate plan names (only if creating new plan, not editing)
    if (!selectedPlan && savedPlans.some(p => p.id !== (selectedPlan?.id) && p.name.toLowerCase() === planName.trim().toLowerCase())) {
      setErrorMessage(t.planNameExists);
      setShowErrorModal(true);
      return;
    }

    handleSavePlanWithOption(false);
  };

  const handleSavePlanWithOption = async (forceCreate = false, overrideName = null) => {
    const finalName = (overrideName || planName).trim();
    if (!finalName) {
      setErrorMessage(t.enterPlanName);
      setShowErrorModal(true);
      return;
    }

    // Check for duplicate plan names (only if creating new plan, not editing)
    if ((!selectedPlan || forceCreate) && savedPlans.some(p => p.name.toLowerCase() === finalName.toLowerCase())) {
      setErrorMessage(t.planNameExists);
      setShowErrorModal(true);
      return;
    }

    try {
      const planData = {
        name: finalName,
        maxCreditsPerSemester: parseInt(maxCreditsPerSemester),
        courses: courses.map(c => ({
          courseId: c.id,
          semester: c.semester.toString()
        }))
      };

      let savedPlan;
      if (selectedPlan && !forceCreate) {
        // Update existing plan
        savedPlan = await api.updatePlan(selectedPlan.id, planData);
        setSavedPlans(prev => prev.map(p => p.id === selectedPlan.id ? savedPlan : p));
      } else {
        // Create new plan
        savedPlan = await api.createPlan(planData);
        setSavedPlans(prev => [...prev, savedPlan]);
      }
      
      setErrorMessage(t.planSaved);
      setShowSuccessModal(true);
      setShowCreatePlanForm(false);
      setCourses([]);
      setPlanName('');
      setSelectedPlan(null);
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorModal(true);
    }
  };

  const CreatePlanPage = () => (
    <div className="space-y-6">
      {!showCreatePlanForm ? (
        <Card className="p-12 text-center border-2 border-dashed border-cyan-200 bg-cyan-50/30">
          <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Plus className="h-10 w-10 text-cyan-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.createPlan}</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">ابدأ بتنظيم مسيرتك الأكاديمية من خلال إنشاء خطة دراسية متكاملة بنظام الأترام.</p>
          <Button 
            onClick={() => setShowPlanConfigDialog(true)}
            className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-200 transition-all hover:scale-105 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.createPlan}
          </Button>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            {/* Plan Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-cyan-100 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{planName}</h2>
                  <p className="text-sm text-gray-500">{numSemesters} {t.numSemesters} • {maxCreditsPerSemester} {t.maxCreditsLabel}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPlanConfigDialog(true)}>
                  <Settings className="w-4 h-4 mr-2" /> {t.planConfig}
                </Button>
                {selectedPlan && (
                  <Button variant="outline" className="border-cyan-600 text-cyan-600 hover:bg-cyan-50" onClick={() => { setSaveAsNewType('plan'); setSaveAsNewValue(''); setShowSaveAsNewPrompt(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> {t.saveAsNewPlan}
                  </Button>
                )}
                <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={handleSavePlan}>
                  <Save className="w-4 h-4 mr-2" /> {t.savePlan}
                </Button>
              </div>
            </div>

            {/* Semester Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: numSemesters }, (_, i) => i + 1).map(sem => (
                <SemesterCard key={sem} semester={sem} />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="p-3 bg-white border-2 border-cyan-500 rounded-lg shadow-xl w-64 opacity-90 scale-105">
                <div className="font-bold text-sm">
                  {language === 'ar' ? courses.find(c => c.id === activeId)?.nameAr : courses.find(c => c.id === activeId)?.nameEn}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );

  const CoursesPage = () => {
    const filteredCourses = savedCourses.filter(c => 
      c.nameAr.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(courseSearchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t.courses}</h2>
          <Button onClick={() => { resetForm(); setShowCourseDetails(true); }} className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]">
            <Plus className="w-4 h-4 mr-2" /> {t.addCourse}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t.searchCoursesArabic}
            value={courseSearchTerm}
            onChange={(e) => setCourseSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ar' ? course.nameAr : course.nameEn}</CardTitle>
                <p className="text-sm text-gray-500">{course.code}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">{t.creditHours}: {course.credits}</div>
                  <div className="text-sm text-gray-600">{t.department}: {course.department}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setSelectedCourse(course); setEditingCourse(null); setFormData({ semester: '', nameAr: '', nameEn: '', code: '', credits: '', type: 'Required', mode: 'In-Person', lectureHours: '0', labHours: '0', trainingHours: '0', prerequisiteCodes: [], department: '' }); setShowCourseDetails(true); }}>
                    <Eye className="w-4 h-4 mr-2" /> {t.view}
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={() => { setEditingCourse(course); setFormData({ ...course, credits: course.credits.toString(), lectureHours: course.lectureHours.toString(), labHours: course.labHours.toString(), trainingHours: course.trainingHours.toString() }); setShowCourseDetails(true); }}>
                    <Edit className="w-4 h-4 mr-2" /> {t.edit}
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={() => handleDeleteCourse(course)}>
                    <Trash2 className="w-4 h-4 mr-2" /> {t.delete}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const PlansPage = () => {
    const filteredPlans = savedPlans.filter(p => p.name.toLowerCase().includes(planSearchTerm.toLowerCase()));

    const handlePlanImported = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/plans`);
        const data = await response.json();
        setSavedPlans(data);
      } catch (error) {
        console.error('Error refreshing plans:', error);
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{t.plans}</h2>
        
        <ExcelButtons 
          plans={savedPlans} 
          onPlanImported={handlePlanImported}
          language={language}
        />
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t.searchPlans}
            value={planSearchTerm}
            onChange={(e) => setPlanSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-gray-500">Courses: {plan.courses.length} • Total Credits: {plan.totalCredits}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setSelectedPlan(plan); setShowPlanDetails(true); }}>
                    <Eye className="w-4 h-4 mr-2" /> {t.view}
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={() => { setSelectedPlan(plan); setCourses(plan.courses || []); setPlanName(plan.name); setMaxCreditsPerSemester(plan.maxCreditsPerSemester || 18); const planSems = (plan.courses || []).map(c => parseInt(c.semester)).filter(n => !isNaN(n)); setNumSemesters(planSems.length > 0 ? Math.max(...planSems) : 8); setShowCreatePlanForm(true); setCurrentPage('createPlan'); }}>
                    <Edit className="w-4 h-4 mr-2" /> {t.edit}
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={() => handleDeletePlan(plan)}>
                    <Trash2 className="w-4 h-4 mr-2" /> {t.delete}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE: Plan Alignment Tool
  // ═══════════════════════════════════════════════════════════════════════
  const AlignmentPage = () => {
    const planAId = alnPlanAId;
    const planBId = alnPlanBId;
    const alignments = alnAlignments;
    const selectedA = alnSelectedA;
    const selectedB = alnSelectedB;
    const relationType = alnRelationType;
    const loadingAlignments = alnLoading;
    const aiLoading = alnAiLoading;
    const statusMsg = alnStatusMsg;
    const showWarning = alnShowWarning;
    const warningMsg = alnWarningMsg;

    const setPlanAId = setAlnPlanAId;
    const setPlanBId = setAlnPlanBId;
    const setAlignments = setAlnAlignments;
    const setSelectedA = setAlnSelectedA;
    const setSelectedB = setAlnSelectedB;
    const setRelationType = setAlnRelationType;
    const setLoadingAlignments = setAlnLoading;
    const setAiLoading = setAlnAiLoading;
    const setStatusMsg = setAlnStatusMsg;
    const setShowWarning = setAlnShowWarning;
    const setWarningMsg = setAlnWarningMsg;

    const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

    const planA = savedPlans.find(p => p.id === parseInt(planAId))
    const planB = savedPlans.find(p => p.id === parseInt(planBId))

    const semsByPlan = (plan) => {
      if (!plan) return {}
      const map = {}
      ;(plan.courses || []).forEach(c => {
        const s = c.semester || '1'
        if (!map[s]) map[s] = []
        map[s].push(c)
      })
      return map
    }

    const semsA = semsByPlan(planA)
    const semsB = semsByPlan(planB)

    const fetchAlignments = async (aId, bId) => {
      if (!aId || !bId) return
      setLoadingAlignments(true)
      try {
        const res = await fetch(`${BASE}/alignments?plan_a_id=${aId}&plan_b_id=${bId}`)
        const data = await res.json()
        setAlignments(Array.isArray(data) ? data : [])
      } catch { setAlignments([]) }
      finally { setLoadingAlignments(false) }
    }

    const handlePlanAChange = (id) => { setPlanAId(id); setAlignments([]); fetchAlignments(id, planBId); setSelectedA(null); setSelectedB(null) }
    const handlePlanBChange = (id) => { setPlanBId(id); setAlignments([]); fetchAlignments(planAId, id); setSelectedA(null); setSelectedB(null) }

    const isAlignedA = (courseId) => alignments.some(a => {
      if (parseInt(planAId) <= parseInt(planBId)) return a.courseAId === courseId
      return a.courseBId === courseId
    })
    const isAlignedB = (courseId) => alignments.some(a => {
      if (parseInt(planAId) <= parseInt(planBId)) return a.courseBId === courseId
      return a.courseAId === courseId
    })
    const partnerOfA = (courseId) => {
      const aln = alignments.find(a => parseInt(planAId) <= parseInt(planBId) ? a.courseAId === courseId : a.courseBId === courseId)
      if (!aln) return null
      const partnerId = parseInt(planAId) <= parseInt(planBId) ? aln.courseBId : aln.courseAId
      return (planB?.courses || []).find(c => c.id === partnerId)
    }

    const handleConfirmPair = async (e) => {
      if (e) e.preventDefault();
      if (!selectedA || !selectedB) return
      if (selectedA.id === selectedB.id) {
        setWarningMsg(t.cannotAlignSameCourse);
        setShowWarning(true);
        return;
      }
      try {
        const res = await fetch(`${BASE}/alignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planAId: parseInt(planAId), planBId: parseInt(planBId), courseAId: selectedA.id, courseBId: selectedB.id, relationType })
        })
        if (!res.ok) {
          const err = await res.json();
          setWarningMsg(err.detail || t.alignmentFailed);
          setShowWarning(true);
          return;
        }
        setStatusMsg(t.pairCreated)
        setSelectedA(null); setSelectedB(null)
        fetchAlignments(planAId, planBId)
        setTimeout(() => setStatusMsg(''), 2500)
      } catch (err) {
        setWarningMsg(t.connectionError);
        setShowWarning(true);
      }
    }

    const handleRemovePair = async (e, alnId) => {
      if (e) e.preventDefault();
      await fetch(`${BASE}/alignments/${alnId}`, { method: 'DELETE' })
      setStatusMsg(t.pairRemoved)
      fetchAlignments(planAId, planBId)
      setTimeout(() => setStatusMsg(''), 2500)
    }

    const handleClearAll = async (e) => {
      if (e) e.preventDefault();
      if (!planAId || !planBId) return
      await fetch(`${BASE}/alignments?plan_a_id=${planAId}&plan_b_id=${planBId}`, { method: 'DELETE' })
      setAlignments([])
    }

    const handleExport = (e) => {
      if (e) e.preventDefault();
      if (!planAId || !planBId) return
      window.open(`${BASE}/alignments/export/excel?plan_a_id=${planAId}&plan_b_id=${planBId}`, '_blank')
    }

    const handleAlignWithAI = async (e) => {
      if (e) e.preventDefault();
      if (!planAId || !planBId) return
      setAiLoading(true)
      setStatusMsg('')
      try {
        const res = await fetch(`${BASE}/alignments/ai-suggest?plan_a_id=${planAId}&plan_b_id=${planBId}`, {
          method: 'POST',
        })
        if (!res.ok) {
          const err = await res.json()
          const msg = err.detail || t.aiAlignError
          if (msg.includes('GEMINI_API_KEY')) {
            setWarningMsg(t.aiAlignNoKey)
          } else {
            setWarningMsg(msg)
          }
          setShowWarning(true)
          return
        }
        const data = await res.json()
        const count = data.count ?? 0
	        setErrorMessage(t.aiAlignSuccess.replace('{count}', count))
	        setShowSuccessModal(true)
	        fetchAlignments(planAId, planBId)
      } catch {
        setWarningMsg(t.connectionError)
        setShowWarning(true)
      } finally {
        setAiLoading(false)
      }
    }

    const avgCredits = (plan) => {
      if (!plan) return 0
      const sems = semsByPlan(plan)
      const keys = Object.keys(sems)
      if (!keys.length) return 0
      return Math.round(plan.totalCredits / keys.length)
    }

    const SummaryBar = ({ plan, label }) => plan ? (
      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-lg p-3 mb-3">
        <p className="font-bold text-cyan-800 truncate">{plan.name}</p>
        <div className="flex gap-4 text-xs text-gray-600 mt-1 flex-wrap">
          <span>{t.totalCreditsLabel}: <strong>{plan.totalCredits}</strong></span>
          <span>{t.semesterCount}: <strong>{Object.keys(semsByPlan(plan)).length}</strong></span>
          <span>{t.avgCredits}: <strong>{avgCredits(plan)}</strong></span>
        </div>
      </div>
    ) : (
      <div className="bg-gray-100 rounded-lg p-3 mb-3 text-gray-400 text-sm">{label}</div>
    )

    const CourseCard = ({ course, side, onSelect, isSelected, isAligned, partnerName }) => {
      const base = "rounded-lg border p-2 cursor-pointer transition-all text-sm select-none"
      let cls = base
      if (isSelected) cls += " ring-2 ring-cyan-500 bg-cyan-50 border-cyan-400"
      else if (isAligned) cls += " bg-amber-100 border-amber-400"
      else cls += " bg-white border-gray-200 hover:border-cyan-300 hover:bg-cyan-50"
      return (
        <div className={cls} onClick={() => !isAligned && onSelect(course)}>
          <div className="flex justify-between items-start gap-1">
            <span className="font-semibold text-gray-700 text-xs">{course.code}</span>
            <span className="text-xs bg-gray-100 rounded px-1 text-gray-500">{course.credits}س</span>
          </div>
          <p className="text-gray-800 text-xs mt-0.5 truncate">{language === 'ar' ? course.nameAr : course.nameEn}</p>
          {isAligned && partnerName && <p className="text-green-700 text-xs mt-0.5">↔ {partnerName}</p>}
          {isSelected && <p className="text-cyan-600 text-xs mt-0.5 font-medium">✓ {side === 'A' ? t.selectPlanA : t.selectPlanB}</p>}
        </div>
      )
    }

    const bothSelected = planAId && planBId && planAId !== planBId

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-gray-900">{t.alignment}</h2>
          <div className="flex gap-2 flex-wrap">
            {bothSelected && <Button size="sm" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={(e) => handleClearAll(e)}>{t.clearAllAlignments}</Button>}
            {bothSelected && <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={(e) => handleExport(e)}><Download className="w-4 h-4 mr-1" />{t.exportAlignment}</Button>}
            {bothSelected && (
              <Button
                size="sm"
                disabled={aiLoading}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleAlignWithAI}
              >
                {aiLoading ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {t.aiAligning}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                    {t.alignWithAI}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {statusMsg && <div className="bg-cyan-50 border border-cyan-300 text-cyan-800 px-4 py-2 rounded-lg text-sm">{statusMsg}</div>}

        {/* Plan Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t.planA}</label>
            <Select value={planAId} onValueChange={handlePlanAChange}>
              <SelectTrigger><SelectValue placeholder={t.selectPlanA} /></SelectTrigger>
              <SelectContent>{savedPlans.filter(p => p.id !== parseInt(planBId)).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t.planB}</label>
            <Select value={planBId} onValueChange={handlePlanBChange}>
              <SelectTrigger><SelectValue placeholder={t.selectPlanB} /></SelectTrigger>
              <SelectContent>{savedPlans.filter(p => p.id !== parseInt(planAId)).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {!bothSelected && <div className="text-center py-12 text-gray-400">{t.selectDifferentPlans}</div>}

        {bothSelected && (
          <>
            {/* Pair confirmation toolbar */}
            {(selectedA || selectedB) && (
              <div className="flex items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-lg p-3 flex-wrap">
                <span className="text-sm text-cyan-800">
                  {selectedA ? `✓ ${selectedA.code}` : `— (${language === 'ar' ? 'أ' : 'A'})`} &nbsp;↔&nbsp; {selectedB ? `✓ ${selectedB.code}` : `— (${language === 'ar' ? 'ب' : 'B'})`}
                </span>
                <Select value={relationType} onValueChange={setRelationType}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equivalent">{t.equivalentLabel}</SelectItem>
                    <SelectItem value="similar">{t.similarLabel}</SelectItem>
                    <SelectItem value="replaced_by">{t.replacedByLabel}</SelectItem>
                  </SelectContent>
                </Select>
                {selectedA && selectedB && <Button type="button" size="sm" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={handleConfirmPair}>{t.confirmPair}</Button>}
                <Button type="button" size="sm" variant="outline" onClick={() => { setSelectedA(null); setSelectedB(null) }}>{t.cancelSelection}</Button>
              </div>
            )}
            {!selectedA && !selectedB && <p className="text-xs text-gray-500 italic">{t.alignCourseHint}</p>}

            {/* Split screen */}
            <div className="grid grid-cols-2 gap-4">
              {/* Plan A – Right */}
              <div>
                <SummaryBar plan={planA} label={t.selectPlanA} />
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {Object.keys(semsA).sort((a,b) => parseInt(a)-parseInt(b)).map(sem => (
                    <div key={sem}>
                      <p className="text-xs font-bold text-gray-500 mb-1">{t.semester} {sem}</p>
                      <div className="space-y-1">
                        {semsA[sem].map(course => (
                          <CourseCard key={course.id} course={course} side="A"
                            onSelect={setSelectedA}
                            isSelected={selectedA?.id === course.id}
                            isAligned={isAlignedA(course.id)}
                            partnerName={partnerOfA(course.id)?.nameAr}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Plan B – Left */}
              <div>
                <SummaryBar plan={planB} label={t.selectPlanB} />
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {Object.keys(semsB).sort((a,b) => parseInt(a)-parseInt(b)).map(sem => (
                    <div key={sem}>
                      <p className="text-xs font-bold text-gray-500 mb-1">{t.semester} {sem}</p>
                      <div className="space-y-1">
                        {semsB[sem].map(course => (
                          <CourseCard key={course.id} course={course} side="B"
                            onSelect={setSelectedB}
                            isSelected={selectedB?.id === course.id}
                            isAligned={isAlignedB(course.id)}
                            partnerName={null}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alignments list */}
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">{t.savedAlignments} ({alignments.length})</h3>
              {loadingAlignments && <p className="text-gray-400 text-sm">{t.loadingAlignment}</p>}
              {!loadingAlignments && alignments.length === 0 && <p className="text-gray-400 text-sm italic">{t.noAlignments}</p>}
              <div className="space-y-2">
                {alignments.map(aln => {
                  const lo = Math.min(parseInt(planAId), parseInt(planBId))
                  const cAId = parseInt(planAId) <= parseInt(planBId) ? aln.courseAId : aln.courseBId
                  const cBId = parseInt(planAId) <= parseInt(planBId) ? aln.courseBId : aln.courseAId
                  const ca = (planA?.courses||[]).find(c => c.id === cAId)
                  const cb = (planB?.courses||[]).find(c => c.id === cBId)
                  const relLabel = { equivalent: t.equivalentLabel, similar: t.similarLabel, replaced_by: t.replacedByLabel }[aln.relationType] || aln.relationType
                  return (
                    <div key={aln.id} className="flex items-center justify-between bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium text-gray-700">{ca?.code || cAId}</span>
                      <span className="text-cyan-700 text-xs px-2">{relLabel} ↔</span>
                      <span className="font-medium text-gray-700">{cb?.code || cBId}</span>
                      <button type="button" onClick={(e) => handleRemovePair(e, aln.id)} className="text-red-400 hover:text-red-600 ml-3 text-xs">✕</button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Warning Modal */}
        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="bg-amber-100 p-3 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t.error}</h3>
              <p className="text-gray-600 mb-6">{warningMsg}</p>
              <Button onClick={() => setShowWarning(false)} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {t.ok}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE: Curriculum Comparison Dashboard
  // ═══════════════════════════════════════════════════════════════════════
  const ComparisonPage = () => {
    const [planAId, setPlanAId] = useState('')
    const [planBId, setPlanBId] = useState('')
    const [alignments, setAlignments] = useState([])
    const [filter, setFilter] = useState('all') // all, matched, manual, different
    const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

    const planA = savedPlans.find(p => p.id === parseInt(planAId))
    const planB = savedPlans.find(p => p.id === parseInt(planBId))

    const fetchAlignments = async (aId, bId) => {
      if (!aId || !bId) return
      try {
        const res = await fetch(`${BASE}/alignments?plan_a_id=${aId}&plan_b_id=${bId}`)
        if (!res.ok) {
          setAlignments([]);
          return;
        }
        const data = await res.json();
        setAlignments(Array.isArray(data) ? data : []);
      } catch { setAlignments([]) }
    }

    const handlePlanAChange = (id) => { setPlanAId(id); fetchAlignments(id, planBId) }
    const handlePlanBChange = (id) => { setPlanBId(id); fetchAlignments(planAId, id) }

    const semsByPlan = (plan) => {
      if (!plan) return {}
      const map = {}
      ;(plan.courses || []).forEach(c => { const s = c.semester || '1'; if (!map[s]) map[s] = []; map[s].push(c) })
      return map
    }

    const semsA = semsByPlan(planA)
    const semsB = semsByPlan(planB)

    // Build lookup: which courses are exact matches, which are manually aligned
    const exactMatchCodes = new Set()
    const allCodesA = new Set((planA?.courses||[]).map(c => c.code))
    const allCodesB = new Set((planB?.courses||[]).map(c => c.code))
    allCodesA.forEach(code => { if (allCodesB.has(code)) exactMatchCodes.add(code) })

    // Manual alignments lookup
    const manualAlignedA = new Set()
    const manualAlignedB = new Set()
    alignments.forEach(aln => {
      const cAId = parseInt(planAId) <= parseInt(planBId) ? aln.courseAId : aln.courseBId
      const cBId = parseInt(planAId) <= parseInt(planBId) ? aln.courseBId : aln.courseAId
      manualAlignedA.add(cAId)
      manualAlignedB.add(cBId)
    })

    const courseColor = (course, side) => {
      if (exactMatchCodes.has(course.code)) return 'bg-cyan-100 border-cyan-400 text-cyan-800'
      const aligned = side === 'A' ? manualAlignedA.has(course.id) : manualAlignedB.has(course.id)
      if (aligned) return 'bg-amber-100 border-amber-400 text-amber-800'
      return 'bg-gray-50 border-gray-200 text-gray-600'
    }

    const totalA = planA?.totalCredits || 0
    const totalB = planB?.totalCredits || 0
    const semA = Object.keys(semsA).length
    const semB = Object.keys(semsB).length
    const avgA = semA ? Math.round(totalA / semA) : 0
    const avgB = semB ? Math.round(totalB / semB) : 0
    const totalCoursesA = planA?.courses?.length || 0
    const totalCoursesB = planB?.courses?.length || 0
    const matchedCount = exactMatchCodes.size + alignments.length
    const matchPct = totalCoursesA ? Math.round(matchedCount / totalCoursesA * 100) : 0
    
    // New statistics
    const exactMatchCount = exactMatchCodes.size
    const manualMatchCount = alignments.length
    // Unmatched = Total - (Courses that are either exact match OR manual match)
    const matchedIdsA = new Set([...(planA?.courses||[]).filter(c => exactMatchCodes.has(c.code)).map(c => c.id), ...manualAlignedA])
    const matchedIdsB = new Set([...(planB?.courses||[]).filter(c => exactMatchCodes.has(c.code)).map(c => c.id), ...manualAlignedB])
    const unmatchedA = Math.max(0, totalCoursesA - matchedIdsA.size)
    const unmatchedB = Math.max(0, totalCoursesB - matchedIdsB.size)

    const bothSelected = planAId && planBId && planAId !== planBId

    const StatCard = ({ label, valA, valB, highlight }) => (
      <div className={`rounded-xl border p-4 text-center ${highlight ? 'bg-cyan-50 border-cyan-300' : 'bg-white border-gray-200'}`}>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-800">{valA} <span className="text-gray-400 text-sm">↔</span> {valB}</p>
      </div>
    )

    const CourseChip = ({ course, side }) => {
      const isExact = exactMatchCodes.has(course.code)
      const isManual = side === 'A' ? manualAlignedA.has(course.id) : manualAlignedB.has(course.id)
      
      // Filter logic
      if (filter === 'matched' && !isExact) return null
      if (filter === 'manual' && !isManual) return null
      if (filter === 'different' && (isExact || isManual)) return null

      const cls = courseColor(course, side)
      return (
        <div className={`rounded-lg border px-2 py-1.5 text-xs ${cls}`}>
          <div className="flex justify-between">
            <span className="font-semibold">{course.code}</span>
            <span>{course.credits}س</span>
          </div>
          <p className="truncate mt-0.5">{language === 'ar' ? course.nameAr : course.nameEn}</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">{t.comparison}</h2>

        {/* Plan Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t.planA}</label>
            <Select value={planAId} onValueChange={handlePlanAChange}>
              <SelectTrigger><SelectValue placeholder={t.selectPlanA} /></SelectTrigger>
              <SelectContent>{savedPlans.filter(p => p.id !== parseInt(planBId)).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t.planB}</label>
            <Select value={planBId} onValueChange={handlePlanBChange}>
              <SelectTrigger><SelectValue placeholder={t.selectPlanB} /></SelectTrigger>
              <SelectContent>{savedPlans.filter(p => p.id !== parseInt(planAId)).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {!bothSelected && <div className="text-center py-16 text-gray-400">{t.comparisonHint}</div>}

        {bothSelected && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label={t.totalCreditsLabel} valA={totalA} valB={totalB} />
              <StatCard label={t.semesterCount} valA={semA} valB={semB} />
              <StatCard label={t.avgCredits} valA={avgA} valB={avgB} />
              <div className="rounded-xl border bg-cyan-50 border-cyan-300 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{t.matchPercentage}</p>
                <p className="text-2xl font-bold text-cyan-700">{matchPct}%</p>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label={t.totalCourses} valA={totalCoursesA} valB={totalCoursesB} />
              <StatCard label={t.exactMatches} valA={exactMatchCount} valB={exactMatchCount} />
              <StatCard label={t.manualMatches} valA={manualMatchCount} valB={manualMatchCount} />
              <StatCard label={t.unmatchedCourses} valA={unmatchedA} valB={unmatchedB} />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('all')}
                className="h-8 text-xs"
              >
                {language === 'ar' ? 'الكل' : 'All'}
              </Button>
              <Button 
                variant={filter === 'matched' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('matched')}
                className={`h-8 text-xs font-semibold transition-all ${filter === 'matched' ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-md' : 'text-cyan-700 border-cyan-300 hover:bg-cyan-50'}`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1 ml-1"></span>
                {language === 'ar' ? 'مطابق' : 'Matched'}
              </Button>
              <Button 
                variant={filter === 'manual' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('manual')}
                className={`h-8 text-xs font-semibold transition-all ${filter === 'manual' ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-md' : 'text-amber-700 border-amber-300 hover:bg-amber-50'}`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1 ml-1"></span>
                {language === 'ar' ? 'مواءمة يدوية' : 'Manually Aligned'}
              </Button>
              <Button 
                variant={filter === 'different' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('different')}
                className={`h-8 text-xs font-semibold transition-all ${filter === 'different' ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-md' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                <span className="w-2 h-2 rounded-full bg-gray-400 mr-1 ml-1"></span>
                {language === 'ar' ? 'مختلف' : 'Different'}
              </Button>
            </div>

            {/* Legend */}
            <div className="flex gap-4 flex-wrap text-xs text-gray-500 italic">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-300 inline-block"></span>{t.exactMatch}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-300 inline-block"></span>{t.manualMatch}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-200 inline-block"></span>{t.noMatch}</span>
            </div>

            {/* Split-screen plan view */}
            <div className="grid grid-cols-2 gap-4">
              {/* Plan A */}
              <div>
                <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg px-3 py-2 mb-3 font-bold text-sm">{planA?.name}</div>
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {Object.keys(semsA).sort((a,b)=>parseInt(a)-parseInt(b)).map(sem => (
                    <div key={sem}>
                      <p className="text-xs font-bold text-gray-500 mb-1">{t.semester} {sem}</p>
                      <div className="space-y-1">{semsA[sem].map(c => <CourseChip key={c.id} course={c} side="A" />)}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Plan B */}
              <div>
                <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg px-3 py-2 mb-3 font-bold text-sm">{planB?.name}</div>
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {Object.keys(semsB).sort((a,b)=>parseInt(a)-parseInt(b)).map(sem => (
                    <div key={sem}>
                      <p className="text-xs font-bold text-gray-500 mb-1">{t.semester} {sem}</p>
                      <div className="space-y-1">{semsB[sem].map(c => <CourseChip key={c.id} course={c} side="B" />)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg p-1 shadow-md">
                <img src={universityLogo} alt="Logo" className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t.title}</h1>
                <p className="text-cyan-100 text-xs">{t.university}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex gap-6">
                {['createPlan', 'courses', 'plans', 'alignment', 'comparison'].map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`text-sm font-medium ${currentPage === p ? 'underline' : ''}`}>{t[p]}</button>
                ))}
              </nav>
              <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-white hover:bg-white/10">{language === 'en' ? t.toggleLanguage : t.toggleLanguage}</Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-red-600/30 font-bold">{t.logout}</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {currentPage === 'createPlan' && <CreatePlanPage />}
        {currentPage === 'courses' && <CoursesPage />}
        {currentPage === 'plans' && <PlansPage />}
        {currentPage === 'alignment' && <AlignmentPage />}
        {currentPage === 'comparison' && <ComparisonPage />}
      </main>

      {/* Plan Config Dialog */}
      <Dialog open={showPlanConfigDialog} onOpenChange={setShowPlanConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.planConfig}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.planName}</label>
              <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.numSemesters}</label>
                <Input type="number" value={numSemesters} onChange={(e) => setNumSemesters(parseInt(e.target.value) || 8)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.maxCreditsLabel}</label>
                <Input type="number" value={maxCreditsPerSemester} onChange={(e) => setMaxCreditsPerSemester(parseInt(e.target.value) || 18)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowPlanConfigDialog(false); setShowCreatePlanForm(true); }} className="w-full bg-cyan-600 text-white">{t.startCreating}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Details Dialog (Add/Edit/View) */}
      <Dialog open={showCourseDetails} onOpenChange={(open) => { if (!open) { setEditingCourse(null); setSelectedCourse(null); resetForm(); } setShowCourseDetails(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCourse && !editingCourse ? t.courseDetails : (editingCourse ? t.editCourse : t.addCourse)}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <label className={formErrors.nameAr ? 'text-red-500 font-bold' : ''}>{t.courseNameAr}</label>
              <Input 
                value={selectedCourse && !editingCourse ? selectedCourse.nameAr : formData.nameAr} 
                onChange={(e) => !selectedCourse || editingCourse ? handleInputChange('nameAr', e.target.value) : null} 
                disabled={selectedCourse && !editingCourse} 
                dir="rtl" 
                className={formErrors.nameAr ? 'border-red-500 border-2 ring-red-100 ring-2' : ''}
              />
              {formErrors.nameAr && <span className="text-[10px] text-red-500">{formErrors.nameAr}</span>}
            </div>
            <div className="grid gap-2">
              <label className={formErrors.nameEn ? 'text-red-500 font-bold' : ''}>{t.courseNameEn}</label>
              <Input 
                value={selectedCourse && !editingCourse ? selectedCourse.nameEn : formData.nameEn} 
                onChange={(e) => !selectedCourse || editingCourse ? handleInputChange('nameEn', e.target.value) : null} 
                disabled={selectedCourse && !editingCourse} 
                className={formErrors.nameEn ? 'border-red-500 border-2 ring-red-100 ring-2' : ''}
              />
              {formErrors.nameEn && <span className="text-[10px] text-red-500">{formErrors.nameEn}</span>}
            </div>
            <div className="grid gap-2">
              <label className={formErrors.code ? 'text-red-500 font-bold' : ''}>{t.courseCode}</label>
              <Input 
                value={selectedCourse && !editingCourse ? selectedCourse.code : formData.code} 
                onChange={(e) => !selectedCourse || editingCourse ? handleInputChange('code', e.target.value.toUpperCase()) : null} 
                disabled={selectedCourse && !editingCourse} 
                className={formErrors.code ? 'border-red-500 border-2 ring-red-100 ring-2' : ''}
              />
              {formErrors.code && <span className="text-[10px] text-red-500">{formErrors.code}</span>}
            </div>
            <div className="grid gap-2">
              <label className={formErrors.credits ? 'text-red-500 font-bold' : ''}>{t.creditHours}</label>
              <Input 
                type="text"
                inputMode="numeric"
                value={selectedCourse && !editingCourse ? selectedCourse.credits : formData.credits} 
                onChange={(e) => !selectedCourse || editingCourse ? handleInputChange('credits', e.target.value) : null} 
                disabled={selectedCourse && !editingCourse} 
                className={formErrors.credits ? 'border-red-500 border-2 ring-red-100 ring-2' : ''}
              />
              {formErrors.credits && <span className="text-[10px] text-red-500">{formErrors.credits}</span>}
            </div>
            <div className="grid gap-2">
              <label>{t.courseType}</label>
              <Select value={selectedCourse && !editingCourse ? selectedCourse.type : formData.type} onValueChange={(v) => !selectedCourse || editingCourse ? handleInputChange('type', v) : null} disabled={selectedCourse && !editingCourse}>
                <SelectTrigger disabled={selectedCourse && !editingCourse}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Required">{t.required}</SelectItem>
                  <SelectItem value="Elective">{t.elective}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>{t.studyMode}</label>
              <Select value={selectedCourse && !editingCourse ? selectedCourse.mode : formData.mode} onValueChange={(v) => !selectedCourse || editingCourse ? handleInputChange('mode', v) : null} disabled={selectedCourse && !editingCourse}>
                <SelectTrigger disabled={selectedCourse && !editingCourse}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="In-Person">{t.inPerson}</SelectItem>
                  <SelectItem value="Online">{t.online}</SelectItem>
                  <SelectItem value="Hybrid">{t.hybrid}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>{t.department}</label>
              <Input value={selectedCourse && !editingCourse ? selectedCourse.department : formData.department} onChange={(e) => !selectedCourse || editingCourse ? handleInputChange('department', e.target.value) : null} disabled={selectedCourse && !editingCourse} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">{t.creditHours} {language === 'ar' ? 'التفاصيل' : 'Details'}</label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">{language === 'ar' ? 'محاضرة' : 'Lecture'}</label>
                  <Input type="number" value={selectedCourse && !editingCourse ? (selectedCourse.lectureHours || 0) : formData.lectureHours} onChange={(e) => !selectedCourse || editingCourse ? handleInputChange('lectureHours', e.target.value) : null} disabled={selectedCourse && !editingCourse} className="text-center" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">{language === 'ar' ? 'معمل' : 'Lab'}</label>
                  <Input type="number" value={selectedCourse && !editingCourse ? (selectedCourse.labHours || 0) : formData.labHours} onChange={(e) => !selectedCourse || editingCourse ? handleInputChange('labHours', e.target.value) : null} disabled={selectedCourse && !editingCourse} className="text-center" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">{language === 'ar' ? 'تدريب' : 'Training'}</label>
                  <Input type="number" value={selectedCourse && !editingCourse ? (selectedCourse.trainingHours || 0) : formData.trainingHours} onChange={(e) => !selectedCourse || editingCourse ? handleInputChange('trainingHours', e.target.value) : null} disabled={selectedCourse && !editingCourse} className="text-center" />
                </div>
              </div>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label>{t.prerequisite}</label>
              <div className="space-y-2">
                {(selectedCourse && !editingCourse ? (selectedCourse.prerequisiteCodes || []) : formData.prerequisiteCodes).map((code, index) => (
                  <div key={index} className="flex gap-2">
                    <Select value={code} onValueChange={(val) => {
                      if (!selectedCourse || editingCourse) {
                        const newCodes = [...formData.prerequisiteCodes];
                        newCodes[index] = val;
                        handleInputChange('prerequisiteCodes', newCodes);
                      }
                    }} disabled={selectedCourse && !editingCourse}>
                      <SelectTrigger className="flex-1" disabled={selectedCourse && !editingCourse}><SelectValue placeholder={t.selectPrereq} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t.none}</SelectItem>
                        {savedCourses.filter(c => c.code !== (selectedCourse && !editingCourse ? selectedCourse.code : formData.code)).map(c => (
                          <SelectItem key={c.id} value={c.code}>{c.code} - {language === 'ar' ? c.nameAr : c.nameEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(!selectedCourse || editingCourse) && <Button size="icon" variant="ghost" onClick={() => {
                      handleInputChange('prerequisiteCodes', formData.prerequisiteCodes.filter((_, i) => i !== index));
                    }}><X className="h-4 w-4" /></Button>}
                  </div>
                ))}
                {(!selectedCourse || editingCourse) && <Button variant="outline" size="sm" className="w-full" onClick={() => {
                  handleInputChange('prerequisiteCodes', [...formData.prerequisiteCodes, '']);
                }}><Plus className="h-3 w-3 mr-2" /> {t.addPrerequisite || (language === 'ar' ? 'إضافة متطلب' : 'Add Prerequisite')}</Button>}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            {selectedCourse && !editingCourse ? (
              <Button variant="outline" onClick={() => { setShowCourseDetails(false); setSelectedCourse(null); resetForm(); }}>{t.cancel}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setShowCourseDetails(false); setEditingCourse(null); setSelectedCourse(null); resetForm(); }}>{t.cancel}</Button>
                {editingCourse && (
                  <Button variant="outline" className="border-cyan-600 text-cyan-600 hover:bg-cyan-50" onClick={() => { setSaveAsNewType('course'); setSaveAsNewValue(''); setShowSaveAsNewPrompt(true); }}>{t.saveAsNewCourse}</Button>
                )}
                <Button onClick={() => addOrUpdateCourse(formData)} className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]">{t.save}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Details Dialog */}
      <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
        <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          {selectedPlan && (
            <div className="flex flex-col h-full bg-gray-50/50">
              <div className="p-6 bg-white border-b sticky top-0 z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPlan.courses.length} {t.courses} • {selectedPlan.totalCredits} {t.totalCredits}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setShowPlanDetails(false); setSelectedPlan(null); }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-6 overflow-x-auto">
                <div className="flex gap-6 min-w-max pb-4">
                  {Array.from({ length: Math.max(...(selectedPlan.courses || []).map(c => parseInt(c.semester))) || 8 }, (_, i) => i + 1).map(sem => {
                    const semesterCourses = (selectedPlan.courses || []).filter(c => c.semester === sem.toString());
                    const totalCredits = semesterCourses.reduce((sum, c) => sum + c.credits, 0);
                    const maxCredits = selectedPlan.maxCreditsPerSemester || 18;
                    const isOverLimit = totalCredits > maxCredits;
                    const isTooLow = totalCredits > 0 && totalCredits < (maxCredits / 2);
                    
                    return (
                      <div key={sem} className="w-72 flex-shrink-0 flex flex-col gap-4">
                        <div className={`p-4 rounded-xl border-2 transition-all ${isOverLimit ? 'bg-red-50 border-red-200' : (isTooLow ? 'bg-amber-50 border-amber-200' : 'bg-white border-cyan-100 shadow-sm')}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-bold ${isOverLimit ? 'text-red-700' : (isTooLow ? 'text-amber-700' : 'text-cyan-800')}`}>
                              {t.semester} {sem}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isOverLimit ? 'bg-red-100 text-red-700' : (isTooLow ? 'bg-amber-100 text-amber-700' : 'bg-cyan-50 text-cyan-700')}`}>
                              {totalCredits} / {maxCredits}
                            </span>
                          </div>
                          
                          <div className="space-y-3 mt-4">
                            {semesterCourses.length > 0 ? (
                              semesterCourses.map(course => (
                                <div key={course.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-cyan-200 transition-colors group">
                                  <div className="font-bold text-sm text-gray-800 leading-tight mb-1 group-hover:text-cyan-700">
                                    {language === 'ar' ? course.nameAr : course.nameEn}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-500 border border-gray-100">
                                      {course.code}
                                    </span>
                                    <span className="text-[10px] font-bold text-cyan-600">
                                      {course.credits} {t.creditHours}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs italic">
                                {t.none}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 bg-white border-t mt-auto flex justify-end sticky bottom-0 z-10">
                <Button onClick={() => { setShowPlanDetails(false); setSelectedPlan(null); }} className="bg-cyan-600 text-white px-8">
                  {t.close}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Existing Course Dialog */}
      <Dialog open={showAddExistingCourse} onOpenChange={setShowAddExistingCourse}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.addExistingCourse}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t.searchCourses}
                value={existingCourseSearchTerm}
                onChange={(e) => setExistingCourseSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {savedCourses
                .filter(c => !courses.some(pc => pc.code === c.code) && (c.code.toLowerCase().includes(existingCourseSearchTerm.toLowerCase()) || c.nameAr.includes(existingCourseSearchTerm) || c.nameEn.toLowerCase().includes(existingCourseSearchTerm.toLowerCase())))
                .map(course => (
                  <div key={course.id} className="p-3 hover:bg-gray-50 border-b last:border-0 flex items-center justify-between cursor-pointer" onClick={() => addExistingCourseToPlan(course, selectedExistingCourseSemester)}>
                    <div>
                      <div className="font-medium text-sm">{language === 'ar' ? course.nameAr : course.nameEn}</div>
                      <div className="text-xs text-gray-500">{course.code} • {course.credits} {t.creditHours}</div>
                    </div>
                    <Plus className="h-4 w-4 text-cyan-600" />
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t.delete}</h3>
            <p className="text-gray-500">{t.confirmDelete}</p>
            <div className="flex gap-3 mt-6 w-full">
              <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}>{t.cancel}</Button>
              <Button className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]" onClick={confirmDelete}>{t.delete}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t.success}</h3>
            <p className="text-gray-500">{errorMessage || t.courseAdded}</p>
            <Button onClick={() => setShowSuccessModal(false)} className="mt-6 w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold shadow-md transition-all active:scale-[0.98]">
              {t.ok}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t.error}</h3>
            <p className="text-gray-500">{errorMessage}</p>
            <Button onClick={() => setShowErrorModal(false)} className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white">
              {t.ok}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save As New Prompt Modal */}
      <Dialog open={showSaveAsNewPrompt} onOpenChange={setShowSaveAsNewPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{saveAsNewType === 'plan' ? t.saveAsNewPlan : t.saveAsNewCourse}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{saveAsNewType === 'plan' ? t.enterNewName : t.enterNewCode}</label>
              <Input 
                value={saveAsNewValue} 
                onChange={(e) => setSaveAsNewValue(saveAsNewType === 'course' ? e.target.value.toUpperCase() : e.target.value)}
                placeholder={saveAsNewType === 'plan' ? t.planName : t.courseCode}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveAsNewPrompt(false)}>{t.cancel}</Button>
            <Button 
              className="bg-cyan-600 text-white" 
              onClick={() => {
                if (!saveAsNewValue.trim()) return;
                if (saveAsNewType === 'plan') {
                  const oldName = planName;
                  setPlanName(saveAsNewValue.trim());
                  // We need to use a timeout or a direct call to ensure state is updated or passed
                  handleSavePlanWithOption(true, saveAsNewValue.trim());
                } else {
                  const newFormData = { ...formData, code: saveAsNewValue.trim().toUpperCase() };
                  addOrUpdateCourse(newFormData, false, true);
                }
                setShowSaveAsNewPrompt(false);
              }}
            >
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default App;
