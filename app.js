/* ==========================================================================
   LOURDE MATHA EMPLOYMENT HUB - APPLICATION CORE LOGIC (SPA)
   Israel Work Overseas Recruitment System
   ========================================================================== */

const CONFIG = {
    ADMIN_USER: 'augnal',
    ADMIN_PASS: 'augnal@2006',
    STORAGE_USERS: 'lm_hub_applicants_v2',
    STORAGE_SESSION: 'lm_hub_session_v2',
    CATEGORIES: [
        { id: 'CLEANING', name: 'CLEANING', icon: 'fa-broom', desc: 'Commercial & residential maintenance & cleaning staff for facilities across Israel.' },
        { id: 'GENERAL WORKER', name: 'GENERAL WORKER', icon: 'fa-person-digging', desc: 'Construction, logistics & general site assistance opportunities.' },
        { id: 'ELECTRICIAN', name: 'ELECTRICIAN', icon: 'fa-bolt', desc: 'Certified electrical technicians for wiring, power systems & industrial sites.' },
        { id: 'PLUMBER', name: 'PLUMBER', icon: 'fa-faucet-drip', desc: 'Sanitary installation, piping specialists & plumbing infrastructure engineers.' },
        { id: 'WELDERS', name: 'WELDERS', icon: 'fa-fire-burner', desc: 'MIG/TIG/ARC certified welding specialists for structural steel projects.' },
        { id: 'FORKLIFT OPERATORS', name: 'FORKLIFT OPERATORS', icon: 'fa-truck-ramp-box', desc: 'Warehouse material handlers & licensed forklift operators.' },
        { id: 'HEAVY DRIVERS', name: 'HEAVY DRIVERS', icon: 'fa-truck-front', desc: 'Commercial heavy vehicle, trailer & transport drivers with valid licenses.' },
        { id: 'HEAVY MECHANICS', name: 'HEAVY MECHANICS', icon: 'fa-gears', desc: 'Maintenance & overhaul specialists for diesel engines & heavy machinery.' },
        { id: 'HEAVY MACHINE OPERATORS', name: 'HEAVY MACHINE OPERATORS', icon: 'fa-tractor', desc: 'Excavator, crane, bulldozer & heavy equipment operators.' }
    ]
};

class App {
    constructor() {
        this.currentUser = null;
        this.applicants = [];
        this.selectedApplicantForAdmin = null;
        this.fileUploads = {
            cv: null,
            passport: null
        };
        
        this.init();
    }

    init() {
        this.loadStorage();
        this.setupEventListeners();
        this.renderCategoryCards();
        this.checkSession();
        this.handleHashChange();
    }

    // Storage Helpers
    loadStorage() {
        const storedUsers = localStorage.getItem(CONFIG.STORAGE_USERS);
        if (storedUsers) {
            try {
                this.applicants = JSON.parse(storedUsers);
            } catch (e) {
                this.applicants = [];
            }
        } else {
            // Seed default sample applications so Admin portal is ready immediately
            this.seedSampleData(false);
        }
    }

    saveApplicantsToStorage() {
        localStorage.setItem(CONFIG.STORAGE_USERS, JSON.stringify(this.applicants));
    }

    checkSession() {
        const sessionData = sessionStorage.getItem(CONFIG.STORAGE_SESSION);
        if (sessionData) {
            try {
                this.currentUser = JSON.parse(sessionData);
                this.updateNavForSession();
            } catch (e) {
                this.currentUser = null;
            }
        }
    }

    setSession(user) {
        this.currentUser = user;
        sessionStorage.setItem(CONFIG.STORAGE_SESSION, JSON.stringify(user));
        this.updateNavForSession();
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem(CONFIG.STORAGE_SESSION);
        this.updateNavForSession();
        this.showToast('Logged out successfully', 'fa-circle-info');
        window.location.hash = '#home';
    }

    updateNavForSession() {
        const authNavGroup = document.getElementById('authNavButtons');
        const userNavGroup = document.getElementById('userNavGroup');
        const navUserName = document.getElementById('navUserName');

        if (this.currentUser) {
            authNavGroup.classList.add('hidden');
            userNavGroup.classList.remove('hidden');
            if (this.currentUser.role === 'admin') {
                navUserName.innerHTML = `<span style="color:var(--accent-gold); font-weight:700;"><i class="fa-solid fa-shield-halved"></i> AGENCY ADMIN</span>`;
            } else {
                navUserName.innerText = this.currentUser.fullName || 'Applicant';
            }
        } else {
            authNavGroup.classList.remove('hidden');
            userNavGroup.classList.add('hidden');
        }
    }

    // Router
    handleHashChange() {
        const hash = window.location.hash || '#home';
        
        // Hide all views
        document.querySelectorAll('.page-view').forEach(view => {
            view.classList.remove('active');
        });

        // Close mobile nav
        document.getElementById('navLinks').classList.remove('active');

        if (hash.startsWith('#admin')) {
            if (!this.currentUser || this.currentUser.role !== 'admin') {
                this.showToast('Admin login required', 'fa-lock');
                this.showModal('loginModal');
                this.switchLoginTab('admin');
                window.location.hash = '#home';
                document.getElementById('view-home').classList.add('active');
                return;
            }
            document.getElementById('view-admin-dashboard').classList.add('active');
            this.renderAdminTable();
        } else if (hash.startsWith('#dashboard')) {
            if (!this.currentUser || this.currentUser.role !== 'applicant') {
                this.showToast('Please login as applicant to access your file', 'fa-lock');
                this.showModal('loginModal');
                window.location.hash = '#home';
                document.getElementById('view-home').classList.add('active');
                return;
            }
            document.getElementById('view-applicant-dashboard').classList.add('active');
            this.loadApplicantDashboard();
        } else {
            document.getElementById('view-home').classList.add('active');
            if (hash === '#categories') {
                this.scrollToSection('categories');
            } else if (hash === '#contact') {
                this.scrollToSection('contact');
            }
        }
    }

    scrollToSection(sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Categories Rendering
    renderCategoryCards() {
        const grid = document.getElementById('categoriesGrid');
        grid.innerHTML = CONFIG.CATEGORIES.map(cat => `
            <div class="category-card">
                <div class="category-icon">
                    <i class="fa-solid ${cat.icon}"></i>
                </div>
                <h3>${cat.name}</h3>
                <p>${cat.desc}</p>
                <div class="category-footer">
                    <span class="badge-vacancies"><i class="fa-solid fa-user-check"></i> Actively Recruiting</span>
                    <button class="btn btn-sm btn-outline" onclick="app.applyForCategory('${cat.id}')">
                        Apply <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    applyForCategory(catId) {
        if (this.currentUser && this.currentUser.role === 'applicant') {
            window.location.hash = '#dashboard';
            setTimeout(() => {
                const select = document.getElementById('appJobCategory');
                if (select) select.value = catId;
            }, 100);
        } else {
            this.showModal('registerModal');
            setTimeout(() => {
                const select = document.getElementById('regCategory');
                if (select) select.value = catId;
            }, 100);
        }
    }

    // Modal Manager
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    switchLoginTab(type) {
        const tabApp = document.getElementById('tabApplicant');
        const tabAdm = document.getElementById('tabAdmin');
        const loginType = document.getElementById('loginType');
        const userLabel = document.getElementById('loginUserLabel');
        const userInput = document.getElementById('loginUsername');

        if (type === 'admin') {
            tabAdm.classList.add('active');
            tabApp.classList.remove('active');
            loginType.value = 'admin';
            userLabel.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Admin Username`;
            userInput.placeholder = "Enter admin username (admin)";
            userInput.value = "admin";
        } else {
            tabApp.classList.add('active');
            tabAdm.classList.remove('active');
            loginType.value = 'applicant';
            userLabel.innerHTML = `<i class="fa-solid fa-user"></i> Applicant Name or Phone`;
            userInput.placeholder = "Enter your registered name or phone";
            userInput.value = "";
        }
    }

    // Authentication Logic
    handleLoginSubmit(e) {
        e.preventDefault();
        const type = document.getElementById('loginType').value;
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const alertBox = document.getElementById('loginAlert');

        alertBox.classList.add('hidden');

        if (type === 'admin') {
            if (username === CONFIG.ADMIN_USER && password === CONFIG.ADMIN_PASS) {
                const adminSession = {
                    id: 'ADMIN',
                    role: 'admin',
                    fullName: 'Agency Administrator'
                };
                this.setSession(adminSession);
                this.hideModal('loginModal');
                this.showToast('Welcome, Agency Administrator!', 'fa-shield-halved');
                window.location.hash = '#admin';
            } else {
                alertBox.innerText = "Invalid admin username or password.";
                alertBox.classList.remove('hidden');
            }
        } else {
            // Applicant Login
            const applicant = this.applicants.find(a => 
                (a.fullName.toLowerCase() === username.toLowerCase() || a.phone === username) && 
                a.password === password
            );

            if (applicant) {
                const session = {
                    id: applicant.id,
                    role: 'applicant',
                    fullName: applicant.fullName,
                    phone: applicant.phone
                };
                this.setSession(session);
                this.hideModal('loginModal');
                this.showToast(`Logged in successfully! Welcome ${applicant.fullName}`, 'fa-circle-check');
                window.location.hash = '#dashboard';
            } else {
                alertBox.innerText = "Incorrect applicant name/phone or password. Please check or register a new profile.";
                alertBox.classList.remove('hidden');
            }
        }
    }

    handleRegisterSubmit(e) {
        e.preventDefault();
        const fullName = document.getElementById('regFullName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const category = document.getElementById('regCategory').value;
        const passport = document.getElementById('regPassport').value.trim().toUpperCase();
        const password = document.getElementById('regPassword').value.trim();
        const alertBox = document.getElementById('registerAlert');

        alertBox.classList.add('hidden');

        // Check if phone or passport already exists
        const existing = this.applicants.find(a => a.phone === phone || a.passportNumber === passport);
        if (existing) {
            alertBox.innerText = "An applicant profile with this mobile number or passport already exists. Please login instead.";
            alertBox.classList.remove('hidden');
            return;
        }

        const newApplicant = {
            id: 'LM-' + Math.floor(100000 + Math.random() * 900000),
            fullName: fullName,
            phone: phone,
            jobCategory: category,
            passportNumber: passport,
            password: password,
            status: 'Draft',
            adminNotes: 'File created. Awaiting applicant CV upload.',
            createdAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            updatedAt: new Date().toLocaleString(),
            files: {
                cv: null,
                passport: null
            }
        };

        this.applicants.push(newApplicant);
        this.saveApplicantsToStorage();

        // Auto login applicant
        const session = {
            id: newApplicant.id,
            role: 'applicant',
            fullName: newApplicant.fullName,
            phone: newApplicant.phone
        };
        this.setSession(session);

        this.hideModal('registerModal');
        this.showToast('Profile created! Please upload your CV and click Apply.', 'fa-circle-check');
        window.location.hash = '#dashboard';
    }

    // Applicant Dashboard Logic
    loadApplicantDashboard() {
        if (!this.currentUser || this.currentUser.role !== 'applicant') return;

        const applicant = this.applicants.find(a => a.id === this.currentUser.id);
        if (!applicant) return;

        // Populate header
        document.getElementById('applicantWelcome').innerText = `Welcome, ${applicant.fullName}`;
        
        // Populate Form Fields
        document.getElementById('appFullName').value = applicant.fullName || '';
        document.getElementById('appPhone').value = applicant.phone || '';
        document.getElementById('appJobCategory').value = applicant.jobCategory || '';
        document.getElementById('appPassportNum').value = applicant.passportNumber || '';

        // Status Badge
        const statusBadge = document.getElementById('applicantStatusBadge');
        statusBadge.className = `status-pill status-${applicant.status.toLowerCase()}`;
        statusBadge.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${applicant.status}`;

        // Summary Sidebar
        document.getElementById('sumName').innerText = applicant.fullName;
        document.getElementById('sumCategory').innerText = applicant.jobCategory || 'Not Selected';
        document.getElementById('sumPassport').innerText = applicant.passportNumber || 'Not Provided';
        document.getElementById('sumUpdated').innerText = applicant.updatedAt || applicant.createdAt;

        // CV File Status
        const sumCV = document.getElementById('sumCV');
        const cvStatus = document.getElementById('cvFileStatus');
        if (applicant.files && applicant.files.cv) {
            sumCV.innerHTML = `<span class="badge-green"><i class="fa-solid fa-check"></i> ${applicant.files.cv.fileName}</span>`;
            cvStatus.innerHTML = `<span><i class="fa-solid fa-file-pdf"></i> Attached: <strong>${applicant.files.cv.fileName}</strong></span> <button type="button" class="btn btn-sm btn-ghost" onclick="app.removeFile('cv')">Remove</button>`;
            cvStatus.classList.remove('hidden');
        } else {
            sumCV.innerHTML = `<span class="badge-red"><i class="fa-solid fa-xmark"></i> Missing</span>`;
            cvStatus.classList.add('hidden');
        }

        // Passport File Status
        const sumPass = document.getElementById('sumPassDoc');
        const passStatus = document.getElementById('passportFileStatus');
        if (applicant.files && applicant.files.passport) {
            sumPass.innerHTML = `<span class="badge-green"><i class="fa-solid fa-check"></i> ${applicant.files.passport.fileName}</span>`;
            passStatus.innerHTML = `<span><i class="fa-solid fa-passport"></i> Attached: <strong>${applicant.files.passport.fileName}</strong></span> <button type="button" class="btn btn-sm btn-ghost" onclick="app.removeFile('passport')">Remove</button>`;
            passStatus.classList.remove('hidden');
        } else {
            sumPass.innerHTML = `<span class="badge-red"><i class="fa-solid fa-xmark"></i> Missing</span>`;
            passStatus.classList.add('hidden');
        }

        // Admin Notes Box
        const noteBox = document.getElementById('applicantAdminNotes');
        const noteText = document.getElementById('adminNoteText');
        if (applicant.adminNotes) {
            noteText.innerText = applicant.adminNotes;
            noteBox.classList.remove('hidden');
        } else {
            noteBox.classList.add('hidden');
        }

        // Download links for logged-in user
        const actionsDiv = document.getElementById('applicantFileActions');
        let downloadButtonsHtml = '';
        if (applicant.files && applicant.files.cv) {
            downloadButtonsHtml += `<button class="btn btn-sm btn-outline btn-block" onclick="app.downloadFile('${applicant.id}', 'cv')"><i class="fa-solid fa-download"></i> View / Download My CV</button>`;
        }
        if (applicant.files && applicant.files.passport) {
            downloadButtonsHtml += `<button class="btn btn-sm btn-secondary btn-block" onclick="app.downloadFile('${applicant.id}', 'passport')"><i class="fa-solid fa-download"></i> View / Download Passport Scan</button>`;
        }
        actionsDiv.innerHTML = downloadButtonsHtml;
    }

    // File Upload Handling
    handleFileUpload(input, type) {
        const file = input.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            this.showToast('File size exceeds 5MB limit', 'fa-circle-exclamation');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            const fileObj = {
                fileName: file.name,
                fileType: file.type,
                fileSize: (file.size / 1024).toFixed(1) + ' KB',
                base64: base64Data
            };

            this.fileUploads[type] = fileObj;

            // Save immediately to current user's profile
            const index = this.applicants.findIndex(a => a.id === this.currentUser.id);
            if (index !== -1) {
                if (!this.applicants[index].files) this.applicants[index].files = {};
                this.applicants[index].files[type] = fileObj;
                this.applicants[index].updatedAt = new Date().toLocaleString();
                this.saveApplicantsToStorage();
                this.loadApplicantDashboard();
                this.showToast(`${type.toUpperCase()} file uploaded successfully!`, 'fa-circle-check');
            }
        };
        reader.readAsDataURL(file);
    }

    removeFile(type) {
        const index = this.applicants.findIndex(a => a.id === this.currentUser.id);
        if (index !== -1 && this.applicants[index].files) {
            this.applicants[index].files[type] = null;
            this.applicants[index].updatedAt = new Date().toLocaleString();
            this.saveApplicantsToStorage();
            this.loadApplicantDashboard();
            this.showToast(`File removed.`, 'fa-circle-info');
        }
    }

    handleApplicantSubmit(e) {
        e.preventDefault();
        if (!this.currentUser) return;

        const index = this.applicants.findIndex(a => a.id === this.currentUser.id);
        if (index === -1) return;

        const app = this.applicants[index];
        app.fullName = document.getElementById('appFullName').value.trim();
        app.phone = document.getElementById('appPhone').value.trim();
        app.jobCategory = document.getElementById('appJobCategory').value;
        app.passportNumber = document.getElementById('appPassportNum').value.trim().toUpperCase();
        
        // Ensure CV uploaded before marking as Submitted
        if (!app.files || !app.files.cv) {
            this.showToast('Please upload your CV before clicking Apply & Save!', 'fa-triangle-exclamation');
            return;
        }

        app.status = 'Submitted';
        app.updatedAt = new Date().toLocaleString();

        this.saveApplicantsToStorage();
        this.loadApplicantDashboard();
        this.showToast('Application File Submitted Successfully to Agency Admin!', 'fa-paper-plane');
    }

    // Admin Dashboard Logic
    renderAdminTable() {
        if (!this.currentUser || this.currentUser.role !== 'admin') return;

        const tbody = document.getElementById('adminTableBody');
        const searchVal = document.getElementById('adminSearchInput').value.toLowerCase().trim();
        const catFilter = document.getElementById('adminCategoryFilter').value;
        const statusFilter = document.getElementById('adminStatusFilter').value;
        const noDataMsg = document.getElementById('noDataMessage');

        // Filter applicants
        let filtered = this.applicants.filter(app => {
            const matchesSearch = app.fullName.toLowerCase().includes(searchVal) ||
                                  app.passportNumber.toLowerCase().includes(searchVal) ||
                                  app.phone.includes(searchVal) ||
                                  app.id.toLowerCase().includes(searchVal);
            
            const matchesCat = (catFilter === 'ALL') || (app.jobCategory === catFilter);
            const matchesStatus = (statusFilter === 'ALL') || (app.status === statusFilter);

            return matchesSearch && matchesCat && matchesStatus;
        });

        // Update Stats
        document.getElementById('statTotalApps').innerText = this.applicants.length;
        document.getElementById('statPendingApps').innerText = this.applicants.filter(a => a.status === 'Submitted' || a.status === 'Draft').length;
        document.getElementById('statApprovedApps').innerText = this.applicants.filter(a => a.status === 'Approved' || a.status === 'Shortlisted').length;

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            noDataMsg.classList.remove('hidden');
            return;
        }

        noDataMsg.classList.add('hidden');

        tbody.innerHTML = filtered.map(app => {
            const hasCV = app.files && app.files.cv;
            const hasPass = app.files && app.files.passport;

            return `
                <tr>
                    <td><strong>${app.id}</strong></td>
                    <td>
                        <strong>${app.fullName}</strong>
                    </td>
                    <td><span class="badge badge-teal">${app.jobCategory || 'Unassigned'}</span></td>
                    <td><code class="text-gold">${app.passportNumber || '-'}</code></td>
                    <td>${app.phone}</td>
                    <td>
                        ${hasCV ? '<span class="badge badge-teal"><i class="fa-solid fa-file-pdf"></i> CV</span> ' : ''}
                        ${hasPass ? '<span class="badge badge-gold"><i class="fa-solid fa-passport"></i> Passport Scan</span>' : ''}
                        ${!hasCV && !hasPass ? '<span class="text-muted">None</span>' : ''}
                    </td>
                    <td>
                        <span class="status-pill status-${app.status.toLowerCase()}">
                            ${app.status}
                        </span>
                    </td>
                    <td><small class="text-muted">${app.createdAt}</small></td>
                    <td>
                        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
                            <button class="btn btn-sm btn-primary" onclick="app.openAdminViewModal('${app.id}')">
                                <i class="fa-solid fa-eye"></i> View File
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.quickDeleteApplicant('${app.id}', '${app.fullName}')" title="Delete this applicant file">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openAdminViewModal(applicantId) {
        const applicant = this.applicants.find(a => a.id === applicantId);
        if (!applicant) return;

        this.selectedApplicantForAdmin = applicant;

        document.getElementById('modalApplicantName').innerText = applicant.fullName;
        document.getElementById('modalApplicantId').innerText = `File ID: ${applicant.id}`;
        document.getElementById('modalDetailName').innerText = applicant.fullName;
        document.getElementById('modalDetailCategory').innerText = applicant.jobCategory || 'Not Selected';
        document.getElementById('modalDetailPassport').innerText = applicant.passportNumber || 'N/A';
        document.getElementById('modalDetailPhone').innerText = applicant.phone;
        document.getElementById('modalDetailDate').innerText = applicant.createdAt;

        // File download + delete buttons in modal
        const cvBtn = document.getElementById('modalDownloadCVBtn');
        const cvDelBtn = document.getElementById('modalDeleteCVBtn');
        const cvText = document.getElementById('modalCVName');
        if (applicant.files && applicant.files.cv) {
            cvText.innerHTML = `<strong class="text-teal">${applicant.files.cv.fileName}</strong> (${applicant.files.cv.fileSize})`;
            cvBtn.disabled = false;
            cvBtn.onclick = () => this.downloadFile(applicant.id, 'cv');
            cvDelBtn.disabled = false;
            cvDelBtn.onclick = () => this.adminDeleteDocument(applicant.id, 'cv');
        } else {
            cvText.innerText = "No CV uploaded";
            cvBtn.disabled = true;
            cvDelBtn.disabled = true;
        }

        const passBtn = document.getElementById('modalDownloadPassportBtn');
        const passDelBtn = document.getElementById('modalDeletePassportBtn');
        const passText = document.getElementById('modalPassportName');
        if (applicant.files && applicant.files.passport) {
            passText.innerHTML = `<strong class="text-gold">${applicant.files.passport.fileName}</strong> (${applicant.files.passport.fileSize})`;
            passBtn.disabled = false;
            passBtn.onclick = () => this.downloadFile(applicant.id, 'passport');
            passDelBtn.disabled = false;
            passDelBtn.onclick = () => this.adminDeleteDocument(applicant.id, 'passport');
        } else {
            passText.innerText = "No scan uploaded";
            passBtn.disabled = true;
            passDelBtn.disabled = true;
        }

        document.getElementById('adminUpdateStatus').value = applicant.status || 'Submitted';
        document.getElementById('adminNotesInput').value = applicant.adminNotes || '';

        this.showModal('adminViewFileModal');
    }

    saveAdminDecision() {
        if (!this.selectedApplicantForAdmin) return;

        const index = this.applicants.findIndex(a => a.id === this.selectedApplicantForAdmin.id);
        if (index !== -1) {
            this.applicants[index].status = document.getElementById('adminUpdateStatus').value;
            this.applicants[index].adminNotes = document.getElementById('adminNotesInput').value;
            this.applicants[index].updatedAt = new Date().toLocaleString();

            this.saveApplicantsToStorage();
            this.renderAdminTable();
            this.hideModal('adminViewFileModal');
            this.showToast('Applicant file status updated!', 'fa-floppy-disk');
        }
    }

    // Delete entire applicant record from inside the View File modal
    deleteApplicantFile() {
        if (!this.selectedApplicantForAdmin) return;
        if (confirm(`⚠️ Delete entire file for "${this.selectedApplicantForAdmin.fullName}" (${this.selectedApplicantForAdmin.id})?\n\nThis will permanently remove the applicant profile, CV, and all uploaded documents. This action CANNOT be undone.`)) {
            this.applicants = this.applicants.filter(a => a.id !== this.selectedApplicantForAdmin.id);
            this.selectedApplicantForAdmin = null;
            this.saveApplicantsToStorage();
            this.renderAdminTable();
            this.hideModal('adminViewFileModal');
            this.showToast('Applicant file permanently deleted.', 'fa-trash');
        }
    }

    // Quick-delete directly from the table row (no modal needed)
    quickDeleteApplicant(applicantId, applicantName) {
        if (confirm(`⚠️ Delete file for "${applicantName}"?\n\nThis will permanently remove their profile, CV, and all uploaded documents. This cannot be undone.`)) {
            this.applicants = this.applicants.filter(a => a.id !== applicantId);
            this.saveApplicantsToStorage();
            this.renderAdminTable();
            this.showToast(`File for "${applicantName}" deleted.`, 'fa-trash');
        }
    }

    // Admin can also delete just a specific uploaded document (CV or passport)
    adminDeleteDocument(applicantId, type) {
        const index = this.applicants.findIndex(a => a.id === applicantId);
        if (index === -1) return;
        const label = type === 'cv' ? 'CV / Resume' : 'Passport Scan';
        if (confirm(`Remove the ${label} uploaded by ${this.applicants[index].fullName}?`)) {
            this.applicants[index].files[type] = null;
            this.applicants[index].updatedAt = new Date().toLocaleString();
            this.saveApplicantsToStorage();
            // Refresh the modal view
            this.openAdminViewModal(applicantId);
            this.showToast(`${label} removed from applicant file.`, 'fa-file-circle-minus');
        }
    }

    // Utility File Downloader
    downloadFile(applicantId, type) {
        const applicant = this.applicants.find(a => a.id === applicantId);
        if (!applicant || !applicant.files || !applicant.files[type]) {
            this.showToast('File not found', 'fa-circle-exclamation');
            return;
        }

        const fileObj = applicant.files[type];
        const link = document.createElement('a');
        link.href = fileObj.base64;
        link.download = `${applicant.fullName.replace(/\s+/g, '_')}_${type.toUpperCase()}_${fileObj.fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportDataJSON() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.applicants, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Lourde_Matha_Israel_Applicants_Backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        this.showToast('Applicant database backup downloaded as JSON!', 'fa-download');
    }

    // Pre-populate sample applications for demo/testing
    seedSampleData(notify = true) {
        const sampleCVBase64 = "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdID4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwDYAwMDAwIGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTI1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0IC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjE3NwolJUVPRg==";

        this.applicants = [
            {
                id: 'LM-102941',
                fullName: 'Rahul Sharma',
                phone: '+91 98470 11223',
                jobCategory: 'HEAVY DRIVERS',
                passportNumber: 'Z8749102',
                password: 'user123',
                status: 'Submitted',
                adminNotes: 'Valid Heavy Truck driving license verified. Ready for interview.',
                createdAt: '1 Aug 2026',
                updatedAt: '1 Aug 2026, 14:20:00',
                files: {
                    cv: { fileName: 'Rahul_Sharma_CV_HeavyDriver.pdf', fileSize: '142 KB', base64: sampleCVBase64 },
                    passport: { fileName: 'Rahul_Passport_Scan.pdf', fileSize: '210 KB', base64: sampleCVBase64 }
                }
            },
            {
                id: 'LM-208492',
                fullName: 'Mathew Thomas',
                phone: '+91 94471 88990',
                jobCategory: 'ELECTRICIAN',
                passportNumber: 'K4920194',
                password: 'user123',
                status: 'Shortlisted',
                adminNotes: 'Industrial Electrician certification attached. Contacted for trade test.',
                createdAt: '31 Jul 2026',
                updatedAt: '1 Aug 2026, 10:15:00',
                files: {
                    cv: { fileName: 'Mathew_Electrician_Resume.pdf', fileSize: '188 KB', base64: sampleCVBase64 },
                    passport: null
                }
            },
            {
                id: 'LM-391024',
                fullName: 'Joseph Varghese',
                phone: '+91 97451 22334',
                jobCategory: 'WELDERS',
                passportNumber: 'M9104821',
                password: 'user123',
                status: 'Approved',
                adminNotes: 'Selected by Israel delegation. Medical test completed.',
                createdAt: '29 Jul 2026',
                updatedAt: '1 Aug 2026, 11:30:00',
                files: {
                    cv: { fileName: 'Joseph_Varghese_Welder_CV.pdf', fileSize: '165 KB', base64: sampleCVBase64 },
                    passport: { fileName: 'Joseph_Passport.pdf', fileSize: '320 KB', base64: sampleCVBase64 }
                }
            },
            {
                id: 'LM-481920',
                fullName: 'Anil Kumar',
                phone: '+91 98950 55667',
                jobCategory: 'HEAVY MACHINE OPERATORS',
                passportNumber: 'P3049182',
                password: 'user123',
                status: 'Submitted',
                adminNotes: 'Excavator operator experience 5 years.',
                createdAt: '2 Aug 2026',
                updatedAt: '2 Aug 2026, 09:00:00',
                files: {
                    cv: { fileName: 'Anil_Machine_Operator_CV.pdf', fileSize: '195 KB', base64: sampleCVBase64 },
                    passport: null
                }
            }
        ];

        this.saveApplicantsToStorage();
        if (notify) {
            this.showToast('Sample applicant files added!', 'fa-wand-magic-sparkles');
            this.renderAdminTable();
        }
    }

    setupEventListeners() {
        // Mobile Navigation Toggle
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }

        // Hash Navigation
        window.addEventListener('hashchange', () => this.handleHashChange());
    }

    showToast(message, iconClass = 'fa-circle-check') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');

        icon.className = `fa-solid ${iconClass}`;
        msg.innerText = message;

        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 4000);
    }
}

// Global App Instance
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
