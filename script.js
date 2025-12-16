// Shared State
let employees = JSON.parse(localStorage.getItem('employees')) || [];
let currentThanks = [];
let currentPenalties = [];
let calculatedData = null;
let editingId = null;

// Page Detection
const isMainPage = document.getElementById('employeeForm') !== null;
const isReportPage = document.getElementById('reportTable') !== null && document.getElementById('employeeForm') === null;
const isDetailsPage = document.getElementById('salaryUpdateForm') !== null;

// --- MAIN PAGE LOGIC ---
if (isMainPage) {
    // DOM Elements
    const employeeForm = document.getElementById('employeeForm');
    const thanksList = document.getElementById('thanksList');
    const penaltyList = document.getElementById('penaltyList');
    const calculateBtn = document.getElementById('calculateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const resultsSection = document.getElementById('resultsSection');
    const displayTotalSalary = document.getElementById('displayTotalSalary');
    const displayNewDueDate = document.getElementById('displayNewDueDate');
    const employeesTableBody = document.querySelector('#employeesTable tbody');

    // Initial Render
    // Initial Render moved to end of block


    // 1. Manage Thanks Letters
    // 1. Manage Thanks Letters
    document.getElementById('addThanksBtn').addEventListener('click', () => {
        const typeSelect = document.getElementById('thanksType');
        const typeValue = parseInt(typeSelect.value);
        const typeText = typeSelect.options[typeSelect.selectedIndex].text;
        const number = document.getElementById('thanksNumber').value;
        const date = document.getElementById('thanksDate').value;

        if (!number || !date) { alert('الرجاء إدخال رقم وتاريخ الكتاب'); return; }
        const thanks = { id: Date.now(), number, date, typeValue, typeText };
        currentThanks.push(thanks);
        renderThanks();
        document.getElementById('thanksNumber').value = '';
        document.getElementById('thanksDate').value = '';
    });

    function renderThanks() {
        thanksList.innerHTML = '';
        currentThanks.forEach(item => {
            const typeText = item.typeText || 'كتاب شكر';
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${typeText} - رقم: ${item.number} بتاريخ: ${item.date}</span>
                <button type="button" class="btn danger" onclick="removeThanks(${item.id})">حذف</button>
            `;
            thanksList.appendChild(li);
        });
    }

    window.removeThanks = function (id) {
        currentThanks = currentThanks.filter(t => t.id !== id);
        renderThanks();
        resetCalculation();
    };

    // 2. Manage Penalties
    document.getElementById('addPenaltyBtn').addEventListener('click', () => {
        const typeSelect = document.getElementById('penaltyType');
        const type = typeSelect.value;
        const typeText = typeSelect.options[typeSelect.selectedIndex].text;
        const number = document.getElementById('penaltyNumber').value;
        const date = document.getElementById('penaltyDate').value;

        if (!number || !date) { alert('الرجاء إدخال رقم وتاريخ العقوبة'); return; }

        const penalty = { id: Date.now(), type, typeText, number, date };
        currentPenalties.push(penalty);
        renderPenalties();
        document.getElementById('penaltyNumber').value = '';
        document.getElementById('penaltyDate').value = '';
    });

    function renderPenalties() {
        penaltyList.innerHTML = '';
        currentPenalties.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.typeText} - رقم: ${item.number}</span>
                <button type="button" class="btn danger" onclick="removePenalty(${item.id})">حذف</button>
            `;
            penaltyList.appendChild(li);
        });
    }

    window.removePenalty = function (id) {
        currentPenalties = currentPenalties.filter(p => p.id !== id);
        renderPenalties();
        resetCalculation();
    };

    // 3. Calculation Logic
    function calculate() {
        const baseSalary = parseFloat(document.getElementById('baseSalary').value);
        const bonusAmount = parseFloat(document.getElementById('bonusAmount').value);
        const lastDueDateStr = document.getElementById('lastDueDate').value;

        if (isNaN(baseSalary) || isNaN(bonusAmount) || !lastDueDateStr) {
            alert('الرجاء تعبئة الراتب الاسمي ومقدار العلاوة وتاريخ الاستحقاق السابق');
            return null;
        }

        const totalSalary = baseSalary + bonusAmount;
        let dueDate = new Date(lastDueDateStr);
        dueDate.setFullYear(dueDate.getFullYear() + 1); // +1 Year Base

        let thanksMonths = 0;
        currentThanks.forEach(t => {
            thanksMonths += (t.typeValue || 1); // Default to 1 if missing
        });
        dueDate.setMonth(dueDate.getMonth() - thanksMonths);

        let penaltyMonths = 0;
        currentPenalties.forEach(p => {
            if (p.type === 'attention') penaltyMonths += 3;
            else if (p.type === 'warning') penaltyMonths += 6;
            else if (p.type === 'reprimand') penaltyMonths += 12;
        });
        dueDate.setMonth(dueDate.getMonth() + penaltyMonths);

        return {
            totalSalary,
            newDueDate: formatDate(dueDate),
            calculatedAt: new Date()
        };
    }

    calculateBtn.addEventListener('click', () => {
        const result = calculate();
        if (result) {
            calculatedData = result;
            displayTotalSalary.textContent = result.totalSalary.toLocaleString();
            displayNewDueDate.textContent = result.newDueDate;
            resultsSection.classList.remove('hidden');
            saveBtn.disabled = false;
        }
    });

    function resetCalculation() {
        resultsSection.classList.add('hidden');
        saveBtn.disabled = true;
        calculatedData = null;
    }

    // Save Employee
    employeeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!calculatedData) { alert('الرجاء حساب الاستحقاق أولاً'); return; }

        const employee = {
            id: editingId ? editingId : Date.now(),
            name: document.getElementById('employeeName').value,
            school: document.getElementById('schoolName').value,
            jobTitle: document.getElementById('jobTitle').value,
            // Additional Details
            certificate: document.getElementById('certificate').value,
            grade: document.getElementById('grade').value,
            stage: document.getElementById('stage').value,

            baseSalary: document.getElementById('baseSalary').value,
            bonusAmount: document.getElementById('bonusAmount').value,
            lastDueDate: document.getElementById('lastDueDate').value,
            thanks: [...currentThanks],
            penalties: [...currentPenalties],
            totalSalary: calculatedData.totalSalary,
            newDueDate: calculatedData.newDueDate
        };

        if (editingId) {
            // Update existing
            const index = employees.findIndex(e => e.id === editingId);
            if (index !== -1) employees[index] = employee;
            alert('تم تعديل بيانات الموظف بنجاح');
        } else {
            // Add new
            employees.push(employee);
            alert('تم حفظ بيانات الموظف بنجاح');
        }

        saveData();
        renderEmployeesTable();

        resetForm();
    });

    function resetForm() {
        employeeForm.reset();
        currentThanks = [];
        currentPenalties = [];
        renderThanks();
        renderPenalties();
        resetCalculation();
        editingId = null;
        saveBtn.textContent = 'حفظ البيانات';
        saveBtn.classList.remove('info');
        saveBtn.classList.add('success');
    }

    // Search Logic
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', renderEmployeesTable);
    }

    // Render Table
    function renderEmployeesTable() {
        employeesTableBody.innerHTML = '';
        const term = searchInput ? searchInput.value.toLowerCase() : '';

        const filteredEmployees = employees.filter(emp => {
            if (!emp) return false;
            const name = (emp.name || '').toLowerCase();
            const school = (emp.school || '').toLowerCase();
            return name.includes(term) || school.includes(term);
        });

        if (filteredEmployees.length === 0) {
            employeesTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">لا يوجد نتائج</td></tr>';
            return;
        }

        filteredEmployees.forEach((emp, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${emp.name}</td>
                <td>${emp.school}</td>
                <td>${emp.jobTitle}</td>
                <td>${emp.baseSalary}</td>
                <td><strong>${emp.totalSalary}</strong></td>
                <td>${emp.newDueDate}</td>
                <td>
                    <button class="btn info" style="padding: 5px 10px;" onclick="editEmployee(${emp.id})">تعديل</button>
                    <button class="btn secondary" style="padding: 5px 10px;" onclick="window.location.href='employee_details.html?id=${emp.id}'">السجل</button>
                    <button class="btn danger" style="padding: 5px 10px;" onclick="deleteEmployee(${emp.id})">حذف</button>
                </td>
            `;
            employeesTableBody.appendChild(tr);
        });
    }

    window.deleteEmployee = function (id) {
        if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
            employees = employees.filter(e => e.id !== id);
            saveData();
            renderEmployeesTable();
            if (editingId === id) resetForm();
        }
    };

    window.editEmployee = function (id) {
        const emp = employees.find(e => e.id === id);
        if (!emp) return;

        // Populate Form
        document.getElementById('employeeName').value = emp.name;
        document.getElementById('schoolName').value = emp.school;
        document.getElementById('jobTitle').value = emp.jobTitle;
        // Additional Details
        document.getElementById('certificate').value = emp.certificate || '';
        document.getElementById('grade').value = emp.grade || '';
        document.getElementById('stage').value = emp.stage || '';

        document.getElementById('baseSalary').value = emp.baseSalary;
        document.getElementById('bonusAmount').value = emp.bonusAmount;
        document.getElementById('lastDueDate').value = emp.lastDueDate;

        // Populate Objects
        currentThanks = [...emp.thanks];
        currentPenalties = [...emp.penalties];
        renderThanks();
        renderPenalties();

        // Set State
        editingId = id;
        saveBtn.textContent = 'تعديل البيانات';
        saveBtn.classList.remove('success');
        saveBtn.classList.add('info');

        // Scroll to form
        document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });

        // Trigger calculation to enable save button
        calculateBtn.click();
    };

    // --- EXCEL INTEGRATION ---
    // Export
    document.getElementById('exportExcelBtn').addEventListener('click', () => {
        if (employees.length === 0) { alert('لا يوجد بيانات للتصدير'); return; }

        const data = employees.map(emp => ({
            'الاسم': emp.name,
            'المدرسة': emp.school,
            'العنوان الوظيفي': emp.jobTitle,
            'الشهادة': emp.certificate || '',
            'الدرجة': emp.grade || '',
            'المرحلة': emp.stage || '',
            'الراتب الاسمي': emp.baseSalary,
            'مقدار العلاوة': emp.bonusAmount,
            'الراتب المستحق': emp.totalSalary,
            'تاريخ الاستحقاق الجديد': emp.newDueDate
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employees");
        XLSX.writeFile(wb, "Employees_List.xlsx");
    });

    // Import
    document.getElementById('importExcelInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (jsonData.length === 0) { alert('الملف فارغ'); return; }

            let importedCount = 0;
            jsonData.forEach(row => {
                const name = row['الاسم'] || row['Name'] || row['name'];
                const school = row['المدرسة'] || row['School'] || row['school'];
                const jobTitle = row['العنوان الوظيفي'] || row['Job'] || row['jobTitle'];
                const certificate = row['الشهادة'] || row['Certificate'] || '';
                const grade = row['الدرجة'] || '';
                const stage = row['المرحلة'] || '';
                const baseSalary = row['الراتب الاسمي'] || row['Salary'] || 0;

                if (name) {
                    const newEmp = {
                        id: Date.now() + Math.random(),
                        name: name,
                        school: school || '',
                        jobTitle: jobTitle || '',
                        certificate: certificate,
                        grade: grade,
                        stage: stage,
                        baseSalary: baseSalary || 0,
                        bonusAmount: 0,
                        lastDueDate: formatDate(new Date()),
                        thanks: [],
                        penalties: [],
                        totalSalary: baseSalary || 0,
                        newDueDate: '-'
                    };
                    employees.push(newEmp);
                    importedCount++;
                }
            });

            saveData();
            renderEmployeesTable();
            alert(`تم استيراد ${importedCount} موظف بنجاح`);
            e.target.value = ''; // Reset input
        };
        reader.readAsArrayBuffer(file);
    });

    // Initial Render
    renderEmployeesTable();
}

// --- REPORT PAGE LOGIC ---
if (isReportPage) {
    const reportTableBody = document.querySelector('#reportTable tbody');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');

    // Initialize ToDate with Today's Date
    const today = new Date().toISOString().split('T')[0];
    toDateInput.value = today;

    // Initial Filter
    filterReport();

    // Event Listeners
    fromDateInput.addEventListener('change', filterReport);
    toDateInput.addEventListener('change', filterReport);

    function filterReport() {
        const fromDateStr = fromDateInput.value;
        const toDateStr = toDateInput.value;

        // Create Date objects (set time to midnight for comparison)
        const fromDate = fromDateStr ? new Date(fromDateStr) : null;
        const toDate = toDateStr ? new Date(toDateStr) : null;

        const eligibleEmployees = employees.filter(emp => {
            const due = new Date(emp.newDueDate);
            if (fromDate && due < fromDate) return false;
            if (toDate && due > toDate) return false;
            return true;
        });

        renderReport(eligibleEmployees);
    }

    function renderReport(list) {
        reportTableBody.innerHTML = '';
        if (list.length === 0) {
            reportTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا يوجد موظفين مستحقين ضمن هذه الفترة</td></tr>';
            return;
        }
        list.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${emp.name}</td>
                <td>${emp.school}</td>
                <td>${emp.totalSalary}</td>
                <td style="direction:ltr; text-align:right;">${emp.newDueDate}</td>
            `;
            reportTableBody.appendChild(tr);
        });
    }
}

// --- DETAILS PAGE LOGIC ---
if (isDetailsPage) {
    const params = new URLSearchParams(window.location.search);
    const empId = parseInt(params.get('id'));
    const emp = employees.find(e => e.id === empId);

    if (!emp) {
        alert('الموظف غير موجود');
        window.location.href = 'index.html';
    } else {
        // Init Display
        document.getElementById('detailName').textContent = emp.name;
        document.getElementById('detailSchool').textContent = emp.school;
        document.getElementById('detailSalary').textContent = parseFloat(emp.baseSalary).toLocaleString();

        document.getElementById('detailCertificate').textContent = emp.certificate || '-';
        document.getElementById('detailGrade').textContent = emp.grade || '-';
        document.getElementById('detailStage').textContent = emp.stage || '-';

        // Init Inputs
        document.getElementById('newGrade').value = emp.grade || '';
        document.getElementById('newStage').value = emp.stage || '';

        // Initialize Date Input with Today
        document.getElementById('updateDate').value = new Date().toISOString().split('T')[0];

        renderHistory();

        // Handle Salary Update
        document.getElementById('salaryUpdateForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const type = document.getElementById('updateType').value;
            const newSalary = parseFloat(document.getElementById('newSalary').value);
            const newGrade = document.getElementById('newGrade').value;
            const newStage = document.getElementById('newStage').value;
            const date = document.getElementById('updateDate').value;

            if (!newSalary || !date) return;

            const oldSalary = parseFloat(emp.baseSalary);
            const thanksList = emp.thanks || [];

            // Create History Record
            const historyRecord = {
                id: Date.now(),
                date: date,
                type: type, // 'allowance' or 'promotion'
                oldSalary: oldSalary,
                newSalary: newSalary,
                grade: newGrade,
                stage: newStage,
                thanksCount: thanksList.length,
                thanksDates: thanksList.map(t => t.date).join(', ')
            };

            // Update Employee Object
            if (!emp.history) emp.history = [];
            emp.history.push(historyRecord);
            emp.baseSalary = newSalary;
            emp.grade = newGrade;
            emp.stage = newStage;

            // Save Global State
            const index = employees.findIndex(e => e.id === empId);
            employees[index] = emp;
            saveData();

            // Refresh UI
            document.getElementById('detailSalary').textContent = newSalary.toLocaleString();
            document.getElementById('detailGrade').textContent = newGrade;
            document.getElementById('detailStage').textContent = newStage;
            document.getElementById('newSalary').value = '';
            renderHistory();
            alert('تم تحديث الراتب بنجاح');
        });
    }

    function renderHistory() {
        const historyTableBody = document.querySelector('#historyTable tbody');
        historyTableBody.innerHTML = '';

        const history = emp.history || [];
        // Sort by date desc
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;">لا يوجد سجل سابق</td></tr>';
            return;
        }

        history.forEach((record, index) => {
            const typeLabel = record.type === 'allowance' ? 'علاوة' : 'ترفيع';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${record.date}</td>
                <td>${typeLabel}</td>
                <td>${record.grade || '-'}</td>
                <td>${record.stage || '-'}</td>
                <td>${record.thanksCount || 0}</td>
                <td>${record.thanksDates || '-'}</td>
                <td>${record.oldSalary.toLocaleString()}</td>
                <td><strong>${record.newSalary.toLocaleString()}</strong></td>
                <td>
                    <button class="btn danger" style="padding: 2px 8px; font-size: 12px;" onclick="deleteHistoryRecord(${record.id})">حذف</button>
                </td>
            `;
            historyTableBody.appendChild(tr);
        });
    }

    window.deleteHistoryRecord = function (recordId) {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            emp.history = emp.history.filter(r => r.id !== recordId);
            const index = employees.findIndex(e => e.id === empId);
            employees[index] = emp;
            saveData();
            renderHistory();
        }
    };
}

// Global Helpers
function saveData() {
    localStorage.setItem('employees', JSON.stringify(employees));
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}
