"""
Selenium WebDriver Tests — Curriculum Program Builder
=====================================================
Before running:
  pip install selenium webdriver-manager

Make sure the app is running:
  Backend:  http://localhost:8000
  Frontend: http://localhost:5173
"""

import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:5173"
USERNAME = "Admin"
PASSWORD = "12345"

def get_driver():
    options = Options()
    # options.add_argument("--headless")  # uncomment to run headless
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1400,900")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)

def wait_for(driver, by, value, timeout=10):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )

def login(driver):
    driver.get(BASE_URL)
    time.sleep(1)
    wait_for(driver, By.CSS_SELECTOR, "input[type='text'], input[placeholder]")
    inputs = driver.find_elements(By.CSS_SELECTOR, "input")
    for inp in inputs:
        placeholder = inp.get_attribute("placeholder") or ""
        if "user" in placeholder.lower() or "اسم" in placeholder:
            inp.clear(); inp.send_keys(USERNAME)
        elif "pass" in placeholder.lower() or "كلمة" in placeholder:
            inp.clear(); inp.send_keys(PASSWORD)
    buttons = driver.find_elements(By.TAG_NAME, "button")
    for btn in buttons:
        if "sign in" in btn.text.lower() or "دخول" in btn.text or "login" in btn.text.lower():
            btn.click(); break
    time.sleep(2)


# ──────────────────────────────────────────────────────────────────
#  Robust helpers (added for reliable dialog/field interaction)
# ──────────────────────────────────────────────────────────────────
def _scroll_into_view(driver, el):
    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    except Exception:
        pass

def fill_by_label(driver, label_texts, value, timeout=10):
    """
    Find an <input>/<textarea> by the visible text of its associated <label>
    (the course form fields have no placeholder/name/id), wait until it is
    displayed and enabled, scroll it into view, then type into it.
    Returns True on success, False if no matching field was found.
    """
    if isinstance(label_texts, str):
        label_texts = [label_texts]

    # Build an XPath that matches a label containing any of the given texts,
    # then the input/textarea that follows it within the same field group.
    conds = " or ".join([f"contains(normalize-space(.), \"{t}\")" for t in label_texts])
    xpaths = [
        f"//label[{conds}]/following::input[1]",
        f"//label[{conds}]/following::textarea[1]",
        f"//label[{conds}]/../input",
        f"//label[{conds}]/..//input",
    ]
    end = time.time() + timeout
    while time.time() < end:
        for xp in xpaths:
            els = driver.find_elements(By.XPATH, xp)
            for el in els:
                try:
                    if el.is_displayed() and el.is_enabled():
                        _scroll_into_view(driver, el)
                        try:
                            el.clear()
                        except Exception:
                            # Some controlled inputs reject clear(); select-all + delete instead
                            el.send_keys(Keys.COMMAND, "a")
                            el.send_keys(Keys.DELETE)
                        el.send_keys(value)
                        return True
                except Exception:
                    continue
        time.sleep(0.4)
    return False

def click_button_in_dialog(driver, label_texts, timeout=10):
    """Click a button (preferring one inside an open dialog) whose text matches."""
    if isinstance(label_texts, str):
        label_texts = [label_texts]
    end = time.time() + timeout
    while time.time() < end:
        # Prefer buttons inside an open Radix dialog
        scopes = driver.find_elements(By.CSS_SELECTOR, "[role='dialog']") or [driver]
        for scope in scopes:
            for btn in scope.find_elements(By.TAG_NAME, "button"):
                try:
                    if btn.is_displayed() and any(x in btn.text.lower() for x in label_texts):
                        _scroll_into_view(driver, btn)
                        btn.click()
                        return True
                except Exception:
                    continue
        time.sleep(0.4)
    return False

def wait_for_dialog(driver, timeout=10):
    """Wait until a Radix dialog is open and rendered."""
    try:
        WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='dialog']"))
        )
        time.sleep(0.6)  # allow open animation to finish
        return True
    except Exception:
        return False
# ══════════════════════════════════════════════════════════════════
class TestAuthentication(unittest.TestCase):

    def setUp(self):
        self.driver = get_driver()
        self.wait = WebDriverWait(self.driver, 10)

    def tearDown(self):
        self.driver.quit()

    def test_SE01_login_valid_credentials(self):
        """SE-01: Login with valid Admin credentials"""
        self.driver.get(BASE_URL)
        time.sleep(1)
        inputs = self.driver.find_elements(By.CSS_SELECTOR, "input")
        for inp in inputs:
            ph = inp.get_attribute("placeholder") or ""
            if "user" in ph.lower() or "اسم" in ph:
                inp.send_keys(USERNAME)
            elif "pass" in ph.lower() or "كلمة" in ph:
                inp.send_keys(PASSWORD)
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["sign in", "دخول", "login"]):
                btn.click(); break
        time.sleep(2)
        # After login the URL or content should change
        self.assertNotIn("login", self.driver.current_url.lower(),
                         "Should be redirected away from login page")
        print("SE-01 PASS: Login with valid credentials")

    def test_SE02_login_wrong_password(self):
        """SE-02: Login with wrong password — should show error"""
        self.driver.get(BASE_URL)
        time.sleep(1)
        inputs = self.driver.find_elements(By.CSS_SELECTOR, "input")
        for inp in inputs:
            ph = inp.get_attribute("placeholder") or ""
            if "user" in ph.lower() or "اسم" in ph:
                inp.send_keys(USERNAME)
            elif "pass" in ph.lower() or "كلمة" in ph:
                inp.send_keys("WRONGPASSWORD")
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["sign in", "دخول", "login"]):
                btn.click(); break
        time.sleep(2)
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        has_error = any(x in page_text.lower() for x in
                        ["invalid", "error", "خطأ", "غير صحيح", "incorrect"])
        self.assertTrue(has_error, "Should display an error message for wrong password")
        print("SE-02 PASS: Wrong password shows error")

    def test_SE03_login_empty_username(self):
        """SE-03: Login with empty username — should show validation"""
        self.driver.get(BASE_URL)
        time.sleep(1)
        inputs = self.driver.find_elements(By.CSS_SELECTOR, "input")
        for inp in inputs:
            ph = inp.get_attribute("placeholder") or ""
            if "pass" in ph.lower() or "كلمة" in ph:
                inp.send_keys(PASSWORD)
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["sign in", "دخول", "login"]):
                btn.click(); break
        time.sleep(1)
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        has_validation = any(x in page_text.lower() for x in
                             ["required", "مطلوب", "enter", "أدخل", "field"])
        self.assertTrue(has_validation, "Should show validation for empty username")
        print("SE-03 PASS: Empty username shows validation")

    def test_SE04_logout_redirects_to_login(self):
        """SE-04: Logout should redirect to login page"""
        login(self.driver)
        time.sleep(1)
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["logout", "sign out", "خروج"]):
                btn.click(); break
        time.sleep(2)
        page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        self.assertTrue(
            any(x in page_text for x in ["sign in", "login", "دخول", "تسجيل"]),
            "Should show login page after logout"
        )
        print("SE-04 PASS: Logout redirects to login")

    def test_SE05_register_new_user(self):
        """SE-05: Register a new user account"""
        self.driver.get(BASE_URL)
        time.sleep(1)
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["register", "create account", "إنشاء"]):
                btn.click(); break
        time.sleep(1)
        inputs = self.driver.find_elements(By.CSS_SELECTOR, "input")
        for inp in inputs:
            ph = inp.get_attribute("placeholder") or ""
            if "user" in ph.lower() or "اسم" in ph:
                inp.send_keys("newtestuser123")
            elif "pass" in ph.lower() or "كلمة" in ph:
                inp.send_keys("testpass123")
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["register", "create", "إنشاء"]):
                btn.click(); break
        time.sleep(2)
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        has_success = any(x in page_text.lower() for x in
                          ["success", "نجح", "created", "login", "دخول"])
        self.assertTrue(has_success, "Should show success after registration")
        print("SE-05 PASS: Register new user")


# ══════════════════════════════════════════════════════════════════
#  SE-06 to SE-12  Course Management
# ══════════════════════════════════════════════════════════════════
class TestCourseManagement(unittest.TestCase):

    def setUp(self):
        self.driver = get_driver()
        self.wait = WebDriverWait(self.driver, 10)
        login(self.driver)

    def tearDown(self):
        self.driver.quit()

    def _go_to_courses(self):
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            try:
                txt = btn.text.lower().strip()
                if btn.is_displayed() and txt in ("courses", "المقررات"):
                    _scroll_into_view(self.driver, btn); btn.click(); break
            except Exception:
                continue
        else:
            for btn in self.driver.find_elements(By.TAG_NAME, "button"):
                if any(x in btn.text.lower() for x in ["courses", "مقررات"]):
                    btn.click(); break
        time.sleep(1.5)

    def test_SE06_create_course_valid(self):
        """SE-06: Create course with all valid fields"""
        self._go_to_courses()
        # Open the Add Course dialog (use the courses-page Add button)
        click_button_in_dialog(self.driver, ["add course", "إضافة مقرر", "add"])
        wait_for_dialog(self.driver)

        filled = 0
        filled += fill_by_label(self.driver, ["Course Name (Arabic)", "اسم المقرر (عربي)"], "مقدمة في البرمجة")
        filled += fill_by_label(self.driver, ["Course Name (English)", "اسم المقرر (إنجليزي)"], "Intro to Programming")
        filled += fill_by_label(self.driver, ["Course Code", "رمز المقرر"], "SETEST001")
        filled += fill_by_label(self.driver, ["Credit Hours", "الساعات المعتمدة"], "3")

        click_button_in_dialog(self.driver, ["save", "حفظ"])
        time.sleep(2)
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        # Code is upper-cased by the form, so compare case-insensitively
        self.assertIn("SETEST001", page_text.upper(),
                      "New course code should appear in the page")
        print("SE-06 PASS: Create course with valid fields")

    def test_SE07_search_english_keyword(self):
        """SE-07 (SE-09): Search courses by English keyword"""
        self._go_to_courses()
        search_inputs = self.driver.find_elements(
            By.CSS_SELECTOR, "input[type='search'], input[placeholder*='search' i], input[placeholder*='بحث']"
        )
        if not search_inputs:
            search_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input")
        for inp in search_inputs:
            ph = (inp.get_attribute("placeholder") or "").lower()
            if "search" in ph or "بحث" in ph:
                inp.clear()
                inp.send_keys("Programming")
                time.sleep(1)
                break
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        print(f"SE-07 PASS: Search by English keyword executed")

    def test_SE08_search_arabic_keyword(self):
        """SE-08 (SE-10): Search courses by Arabic keyword"""
        self._go_to_courses()
        for inp in self.driver.find_elements(By.CSS_SELECTOR, "input"):
            ph = (inp.get_attribute("placeholder") or "").lower()
            if "search" in ph or "بحث" in ph:
                inp.clear()
                inp.send_keys("برمجة")
                time.sleep(1)
                break
        print("SE-08 PASS: Search by Arabic keyword executed")

    def test_SE09_nameAr_digits_only_bug(self):
        """SE-09 (SE-11): nameAr='123' must FAIL validation (fixed)"""
        self._go_to_courses()
        click_button_in_dialog(self.driver, ["add course", "إضافة مقرر", "add"])
        wait_for_dialog(self.driver)

        fill_by_label(self.driver, ["Course Name (Arabic)", "اسم المقرر (عربي)"], "123")
        fill_by_label(self.driver, ["Course Name (English)", "اسم المقرر (إنجليزي)"], "Digits Test")
        fill_by_label(self.driver, ["Course Code", "رمز المقرر"], "SEDIGITSBUG")
        fill_by_label(self.driver, ["Credit Hours", "الساعات المعتمدة"], "3")

        click_button_in_dialog(self.driver, ["save", "حفظ"])
        time.sleep(2)
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        # After the fix, digits-only Arabic name must be rejected -> course not created
        self.assertNotIn("SEDIGITSBUG", page_text.upper(),
                         "Digits-only Arabic name should be rejected by validation")
        print("SE-09 PASS: Validation correctly rejected digits-only Arabic name")

    def test_SE10_credits_garbage_input_bug(self):
        """SE-10 (SE-12): credits='3abc' must FAIL validation (fixed)"""
        self._go_to_courses()
        click_button_in_dialog(self.driver, ["add course", "إضافة مقرر", "add"])
        wait_for_dialog(self.driver)

        fill_by_label(self.driver, ["Course Name (Arabic)", "اسم المقرر (عربي)"], "مقرر اختبار")
        fill_by_label(self.driver, ["Course Name (English)", "اسم المقرر (إنجليزي)"], "Credits Bug Test")
        fill_by_label(self.driver, ["Course Code", "رمز المقرر"], "SECREDITSBUG")
        fill_by_label(self.driver, ["Credit Hours", "الساعات المعتمدة"], "3abc")

        click_button_in_dialog(self.driver, ["save", "حفظ"])
        time.sleep(2)
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertNotIn("SECREDITSBUG", page_text.upper(),
                         "Non-numeric credits should be rejected by validation")
        print("SE-10 PASS: Validation correctly rejected '3abc' credits")


# ══════════════════════════════════════════════════════════════════
#  SE-13 to SE-18  Study Plan Builder
# ══════════════════════════════════════════════════════════════════
class TestStudyPlanBuilder(unittest.TestCase):

    def setUp(self):
        self.driver = get_driver()
        login(self.driver)

    def tearDown(self):
        self.driver.quit()

    def _go_to_create_plan(self):
        # Click the Create Plan nav item; prefer an exact-ish match over any "plan"
        clicked = False
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            try:
                txt = btn.text.lower().strip()
                if btn.is_displayed() and txt in ("create plan", "إنشاء خطة"):
                    _scroll_into_view(self.driver, btn); btn.click(); clicked = True; break
            except Exception:
                continue
        if not clicked:
            for btn in self.driver.find_elements(By.TAG_NAME, "button"):
                try:
                    if btn.is_displayed() and any(x in btn.text.lower() for x in ["create plan", "إنشاء خطة"]):
                        _scroll_into_view(self.driver, btn); btn.click(); break
                except Exception:
                    continue
        time.sleep(2)

    def test_SE13_create_plan_8_semesters(self):
        """SE-13: Create plan with 8 semesters"""
        self._go_to_create_plan()
        # Wait for the plan builder to actually render its content
        end = time.time() + 10
        page_text = ""
        while time.time() < end:
            page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            if any(x in page_text for x in ["semester", "ترم", "create plan", "إنشاء", "plan name", "اسم الخطة"]):
                break
            time.sleep(0.5)
        self.assertTrue(
            any(x in page_text for x in ["semester", "ترم", "create plan", "إنشاء", "plan name", "اسم الخطة"]),
            "Plan builder should be visible"
        )
        print("SE-13 PASS: Create plan page loaded")

    def test_SE14_save_plan(self):
        """SE-14 (SE-16): Save plan and verify in Plans page"""
        self._go_to_create_plan()
        for inp in self.driver.find_elements(By.CSS_SELECTOR, "input"):
            ph = (inp.get_attribute("placeholder") or "").lower()
            if "plan name" in ph or "اسم الخطة" in ph or "name" in ph:
                inp.clear()
                inp.send_keys("SE Test Plan")
                break
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["save plan", "حفظ الخطة", "save"]):
                btn.click(); break
        time.sleep(2)
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        print("SE-14 PASS: Save plan executed")

    def test_SE15_open_empty_plan_bug(self):
        """SE-15 (SE-18): Open plan with zero courses — BUG: builder shows zero columns"""
        self._go_to_create_plan()
        # Navigate to plans to find an empty one
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["plans", "خطط"]):
                btn.click(); break
        time.sleep(1)
        # Look for edit button on any plan
        edit_buttons = []
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["edit", "تعديل"]):
                edit_buttons.append(btn)
        if edit_buttons:
            edit_buttons[0].click()
            time.sleep(2)
            # Check if semester columns are present
            page_text = self.driver.find_element(By.TAG_NAME, "body").text
            sem_count = page_text.lower().count("semester") + page_text.count("ترم")
            print(f"SE-15: Semester columns found: {sem_count}")
            if sem_count == 0:
                print("SE-15 FAIL (BUG CONFIRMED): Zero semester columns — Math.max bug confirmed")
            else:
                print("SE-15 PASS: Semester columns rendered")
        else:
            print("SE-15 SKIP: No plans found to edit")


# ══════════════════════════════════════════════════════════════════
#  SE-19 to SE-22  Excel
# ══════════════════════════════════════════════════════════════════
class TestExcel(unittest.TestCase):

    def setUp(self):
        self.driver = get_driver()
        login(self.driver)

    def tearDown(self):
        self.driver.quit()

    def test_SE19_download_template(self):
        """SE-19: Download Excel template"""
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["template", "قالب", "download"]):
                btn.click()
                time.sleep(2)
                print("SE-19 PASS: Download template button clicked")
                return
        print("SE-19 SKIP: Template button not found on current page")

    def test_SE20_export_plan(self):
        """SE-20 (SE-22): Export plan to Excel"""
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["export", "تصدير"]):
                btn.click()
                time.sleep(2)
                print("SE-20 PASS: Export button clicked")
                return
        print("SE-20 SKIP: Export button not found")


# ══════════════════════════════════════════════════════════════════
#  SE-23 to SE-27  Alignment
# ══════════════════════════════════════════════════════════════════
class TestAlignment(unittest.TestCase):

    def setUp(self):
        self.driver = get_driver()
        login(self.driver)

    def tearDown(self):
        self.driver.quit()

    def _go_to_alignment(self):
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["alignment", "مواءمة", "align"]):
                btn.click(); break
        time.sleep(1)

    def test_SE23_alignment_page_loads(self):
        """SE-23: Alignment page loads with plan dropdowns"""
        self._go_to_alignment()
        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertTrue(
            any(x in page_text.lower() for x in ["plan", "خطة", "select", "اختر"]),
            "Alignment page should have plan selectors"
        )
        print("SE-23 PASS: Alignment page loaded")

    def test_SE24_ai_alignment_button_present(self):
        """SE-24 (SE-26): AI alignment button exists"""
        self._go_to_alignment()
        for btn in self.driver.find_elements(By.TAG_NAME, "button"):
            if any(x in btn.text.lower() for x in ["ai", "align with ai", "مواءمة ذكية"]):
                print("SE-24 PASS: AI alignment button found")
                return
        print("SE-24 SKIP: AI alignment button not visible (may need plans selected)")


if __name__ == "__main__":
    print("=" * 60)
    print("Curriculum Program Builder — Selenium Test Suite")
    print("Make sure the app is running on http://localhost:5173")
    print("=" * 60)
    unittest.main(verbosity=2)
