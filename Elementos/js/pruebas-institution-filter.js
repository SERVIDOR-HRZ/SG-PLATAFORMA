// Institution Filter for Pruebas
// This file adds institution filtering functionality to the student selector

document.addEventListener('DOMContentLoaded', function () {
    // Wait for main script to load students
    setTimeout(initInstitutionFilter, 1000);
});

let institutionsMap = {};
let currentInstitutionFilter = '';
let isEditMode = false;

function initInstitutionFilter() {
    // Check if allStudents is available
    if (typeof allStudents === 'undefined' || allStudents.length === 0) {
        setTimeout(initInstitutionFilter, 500);
        return;
    }

    // Build institutions map
    buildInstitutionsMap();

    // Setup filter for create modal
    setupInstitutionFilter('institutionFilter', 'institutionQuickSelect', 'studentsList', 'studentsCounter', 'selectAllStudents', 'searchStudents');

    // Setup filter for edit modal
    setupInstitutionFilter('editInstitutionFilter', 'editInstitutionQuickSelect', 'editStudentsList', 'editStudentsCounter', 'editSelectAllStudents', 'editSearchStudents');
}

function buildInstitutionsMap() {
    institutionsMap = {};

    allStudents.forEach(student => {
        const institution = student.institucion || 'Sin Institución';
        if (!institutionsMap[institution]) {
            institutionsMap[institution] = [];
        }
        institutionsMap[institution].push(student);
    });

    console.log('Instituciones encontradas:', Object.keys(institutionsMap));
}

function setupInstitutionFilter(selectId, quickSelectId, studentsListId, counterId, selectAllId, searchId) {
    const select = document.getElementById(selectId);
    const quickSelect = document.getElementById(quickSelectId);

    if (!select || !quickSelect) return;

    // Populate select options
    select.innerHTML = '<option value="">Todas las instituciones</option>';

    // Sort institutions alphabetically
    const sortedInstitutions = Object.keys(institutionsMap).sort();

    sortedInstitutions.forEach(institution => {
        const count = institutionsMap[institution].length;
        const option = document.createElement('option');
        option.value = institution;
        option.textContent = `${institution} (${count})`;
        select.appendChild(option);
    });

    // Populate quick select buttons
    quickSelect.innerHTML = '';

    // Add "All" button
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'institution-btn active';
    allBtn.dataset.institution = '';
    allBtn.innerHTML = `<i class="bi bi-people-fill"></i> Todas <span class="count">${allStudents.length}</span>`;
    quickSelect.appendChild(allBtn);

    // Add institution buttons (limit to top 5 by count)
    const topInstitutions = sortedInstitutions
        .map(inst => ({ name: inst, count: institutionsMap[inst].length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    topInstitutions.forEach(inst => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'institution-btn';
        btn.dataset.institution = inst.name;
        btn.innerHTML = `<i class="bi bi-building"></i> ${truncateText(inst.name, 20)} <span class="count">${inst.count}</span>`;
        quickSelect.appendChild(btn);
    });

    // Event listeners for quick select buttons
    quickSelect.querySelectorAll('.institution-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Update active state
            quickSelect.querySelectorAll('.institution-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update select
            select.value = this.dataset.institution;

            // Filter students
            filterStudentsByInstitution(this.dataset.institution, studentsListId, counterId, selectAllId);
        });
    });

    // Event listener for select dropdown
    select.addEventListener('change', function () {
        // Update quick select buttons
        quickSelect.querySelectorAll('.institution-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.institution === this.value);
        });

        // Filter students
        filterStudentsByInstitution(this.value, studentsListId, counterId, selectAllId);
    });
}

function filterStudentsByInstitution(institution, studentsListId, counterId, selectAllId) {
    currentInstitutionFilter = institution;
    const studentsList = document.getElementById(studentsListId);
    const studentCheckboxes = studentsList.querySelectorAll('.student-checkbox');

    let visibleCount = 0;

    studentCheckboxes.forEach(checkbox => {
        const studentId = checkbox.querySelector('.student-check').value;
        const student = allStudents.find(s => s.id === studentId);

        if (!student) {
            checkbox.style.display = 'none';
            return;
        }

        const studentInstitution = student.institucion || 'Sin Institución';
        const matches = !institution || studentInstitution === institution;

        checkbox.style.display = matches ? 'flex' : 'none';
        if (matches) visibleCount++;
    });

    // Update counter
    updateFilteredCounter(studentsListId, counterId, selectAllId);
}


function updateFilteredCounter(studentsListId, counterId, selectAllId) {
    const studentsList = document.getElementById(studentsListId);
    const counter = document.getElementById(counterId);
    const selectAllCheckbox = document.getElementById(selectAllId);

    const visibleCheckboxes = studentsList.querySelectorAll('.student-checkbox[style*="flex"], .student-checkbox:not([style*="display"])');
    const visibleChecked = studentsList.querySelectorAll('.student-checkbox[style*="flex"] .student-check:checked, .student-checkbox:not([style*="display"]) .student-check:checked');
    const totalSelected = studentsList.querySelectorAll('.student-check:checked').length;

    let visibleCount = 0;
    let checkedCount = 0;

    studentsList.querySelectorAll('.student-checkbox').forEach(cb => {
        if (cb.style.display !== 'none') {
            visibleCount++;
            if (cb.querySelector('.student-check').checked) {
                checkedCount++;
            }
        }
    });

    counter.innerHTML = `<i class="bi bi-people-fill"></i> ${totalSelected} seleccionados (${visibleCount} visibles)`;

    // Update select all checkbox state
    if (checkedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (checkedCount === visibleCount && visibleCount > 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Override the original populateStudentsSelector to include institution data
const originalPopulateStudentsSelector = typeof populateStudentsSelector === 'function' ? populateStudentsSelector : null;

function enhancedPopulateStudentsSelector(prefix = '') {
    const studentsListId = prefix ? `${prefix}StudentsList` : 'studentsList';
    const studentsList = document.getElementById(studentsListId);
    const counterId = prefix ? `${prefix}StudentsCounter` : 'studentsCounter';
    const studentsCounter = document.getElementById(counterId);

    if (!studentsList) return;

    studentsList.innerHTML = '';

    if (allStudents.length === 0) {
        studentsList.innerHTML = `
            <div class="students-list-empty">
                <i class="bi bi-people"></i>
                <p>No hay estudiantes registrados</p>
            </div>
        `;
        studentsCounter.innerHTML = '<i class="bi bi-people-fill"></i> 0 estudiantes disponibles';
        return;
    }

    // Sort students by institution then by name
    const sortedStudents = [...allStudents].sort((a, b) => {
        const instA = a.institucion || 'ZZZ';
        const instB = b.institucion || 'ZZZ';
        if (instA !== instB) return instA.localeCompare(instB);
        return (a.nombre || '').localeCompare(b.nombre || '');
    });

    sortedStudents.forEach(student => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'student-checkbox';
        checkboxDiv.dataset.institution = student.institucion || 'Sin Institución';

        const possibleIdFields = ['numeroIdentidad', 'numeroDocumento', 'cedula', 'documento', 'id'];
        let studentId = 'N/A';

        for (const field of possibleIdFields) {
            if (student[field] && student[field] !== 'N/A') {
                studentId = student[field];
                break;
            }
        }

        const studentEmail = student.usuario || student.email || student.emailRecuperacion || 'Sin email';
        const initials = (student.nombre || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const institution = student.institucion || 'Sin Institución';

        checkboxDiv.innerHTML = `
            <input type="checkbox" id="${prefix}student_${student.id}" value="${student.id}" class="student-check">
            <div class="student-checkbox-content">
                <div class="student-avatar">${initials}</div>
                <div class="student-info">
                    <label for="${prefix}student_${student.id}">
                        <span class="student-name">${student.nombre || 'Sin nombre'}</span>
                        <div class="student-meta">
                            <span><i class="bi bi-building"></i> ${truncateText(institution, 25)}</span>
                            <span><i class="bi bi-card-text"></i> ${studentId}</span>
                        </div>
                    </label>
                </div>
            </div>
        `;
        studentsList.appendChild(checkboxDiv);
    });

    // Add event listeners
    studentsList.querySelectorAll('.student-check').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const selectAllId = prefix ? `${prefix}SelectAllStudents` : 'selectAllStudents';
            updateFilteredCounter(studentsListId, counterId, selectAllId);
            this.closest('.student-checkbox').classList.toggle('selected', this.checked);
        });
    });

    const selectAllId = prefix ? `${prefix}SelectAllStudents` : 'selectAllStudents';
    updateFilteredCounter(studentsListId, counterId, selectAllId);

    // Rebuild institutions map and filters
    buildInstitutionsMap();

    if (prefix === 'edit') {
        setupInstitutionFilter('editInstitutionFilter', 'editInstitutionQuickSelect', 'editStudentsList', 'editStudentsCounter', 'editSelectAllStudents', 'editSearchStudents');
    } else {
        setupInstitutionFilter('institutionFilter', 'institutionQuickSelect', 'studentsList', 'studentsCounter', 'selectAllStudents', 'searchStudents');
    }
}

// Hook into modal open events
document.addEventListener('DOMContentLoaded', function () {
    // Override create modal open
    const createTestBtn = document.getElementById('createTestBtn');
    if (createTestBtn) {
        createTestBtn.addEventListener('click', function () {
            setTimeout(() => {
                enhancedPopulateStudentsSelector('');
            }, 100);
        }, true);
    }
});
