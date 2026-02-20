// ==================== SUPABASE INIT ====================
const supabaseUrl = 'https://hncypepxbdysefwimdhs.supabase.co';   // REPLACE
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3lwZXB4YmR5c2Vmd2ltZGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjQyMTEsImV4cCI6MjA4NzE0MDIxMX0.LRW8NvwVpXY6q3w-5XxZ5ZuWLv2HMRCIe8kHKbb5eW4';                     // REPLACE
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let userProfile = null;
let committees = [];          // will hold all committees from DB
let selectedCommittee = null;  // for admin/leader view

// ==================== DOM ELEMENTS ====================
const authContainer = document.getElementById('auth-container');
const mainApp = document.getElementById('main-app');
const dynamicContent = document.getElementById('dynamic-content');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const userRoleSpan = document.getElementById('user-role');
const sidebarItems = document.querySelectorAll('.sidebar-menu-item');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// ==================== AUTH UI ====================
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
});

signupBtn.addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) showError('signup-error', error.message);
    else {
        alert('Check your email for confirmation!');
        loginTab.click();
    }
});

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showError('login-error', error.message);
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

function showError(elementId, message) {
    document.getElementById(elementId).innerText = message;
}

// ==================== SIDEBAR TOGGLE ====================
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('closed');
    document.getElementById('mainContent').classList.toggle('expanded');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.add('closed');
    document.getElementById('mainContent').classList.add('expanded');
    sidebarOverlay.classList.remove('active');
});

function closeSidebarOnMobile() {
    if (window.innerWidth <= 992) {
        sidebar.classList.add('closed');
        document.getElementById('mainContent').classList.add('expanded');
        sidebarOverlay.classList.remove('active');
    }
}

// ==================== AUTH STATE & INIT ====================
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        currentUser = session.user;
        authContainer.style.display = 'none';
        mainApp.style.display = 'block';
        loadUserProfile();
    } else {
        authContainer.style.display = 'block';
        mainApp.style.display = 'none';
    }
});

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        authContainer.style.display = 'none';
        mainApp.style.display = 'block';
        loadUserProfile();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        userProfile = null;
        authContainer.style.display = 'block';
        mainApp.style.display = 'none';
        dynamicContent.innerHTML = '';
    }
});

async function loadUserProfile() {
    // Fetch profile with committee info
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, committee_id, committees(name)')
        .eq('id', currentUser.id)
        .single();
    if (error) {
        console.error(error);
        return;
    }
    userProfile = profile;
    userRoleSpan.innerText = profile.role === 'admin' ? 'Admin' : `Leader - ${profile.committees.name}`;

    // Load committees list
    await loadCommittees();

    // Default section: if admin, show master sheet; if leader, show their committee
    if (profile.role === 'admin') {
        showSection('master');
    } else {
        selectedCommittee = profile.committee_id;
        showSection('committee-view');
    }
}

async function loadCommittees() {
    const { data, error } = await supabase.from('committees').select('*').order('id');
    if (error) console.error(error);
    else committees = data;
}

// ==================== SECTION RENDERING ====================
sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        showSection(section);
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        closeSidebarOnMobile();
    });
});

function showSection(section) {
    if (!userProfile) return;
    let html = '';

    if (section === 'committees') {
        html = renderCommitteesPanel();
    } else if (section === 'calendar') {
        html = renderCalendar();
    } else if (section === 'daily') {
        html = renderDailyBread();
    } else if (section === 'egw') {
        html = renderEGW();
    } else if (section === 'notepad') {
        html = renderNotepad();
    } else if (section === 'master') {
        if (userProfile.role !== 'admin') {
            alert('Only admin can access the master sheet.');
            return;
        }
        html = renderMasterSheet();
    } else if (section === 'committee-view') {
        html = renderCommitteeView(selectedCommittee);
    } else if (section === 'settings') {
        html = renderSettings();
    }

    dynamicContent.innerHTML = html;

    // Additional initialisations for specific sections
    if (section === 'calendar') initCalendar();
    if (section === 'notepad') initNotepad();
    if (section === 'master') loadMasterSheet();
    if (section === 'committee-view' && selectedCommittee) {
        loadCommitteeEntries(selectedCommittee);
        document.getElementById('entry-form')?.addEventListener('submit', handleNewEntry);
    }
}

// ==================== RENDER FUNCTIONS ====================
function renderCommitteesPanel() {
    const buttons = committees.map(c => {
        const isOwn = userProfile.role === 'leader' && c.id === userProfile.committee_id;
        const disabled = userProfile.role === 'leader' && !isOwn ? 'disabled' : '';
        return `
            <button class="committee-btn ${disabled}" data-id="${c.id}" ${disabled ? 'disabled' : ''}>
                <i class="fas fa-shield-haltered"></i>
                <span style="flex:1;">${c.name}</span>
                ${!isOwn && userProfile.role === 'leader' ? '<span class="lock-icon"><i class="fas fa-lock"></i></span>' : ''}
            </button>
        `;
    }).join('');

    return `
        <div class="grid-layout">
            <div class="committee-panel">
                <span class="section-badge"><i class="fas fa-hashtag"></i> PCM COMMITTEES</span>
                <div class="button-grid" id="committee-buttons">
                    ${buttons}
                </div>
            </div>
            <div class="right-column">
                <div class="card">
                    <h3>Quick Info</h3>
                    <p>Select a committee to view or enter records.</p>
                </div>
            </div>
        </div>
    `;
}

function renderCalendar() {
    return `
        <div class="card">
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 18px;">
                <i class="fas fa-calendar-alt" style="font-size: 1.8rem; color: #386a4e;"></i>
                <span style="font-weight: 650; color: #1a4437; font-size: 1.2rem;">Zambia · Prayer Calendar</span>
            </div>
            <div class="calendar-container">
                <div id="calendar"></div>
            </div>
        </div>
    `;
}

function renderDailyBread() {
    const verses = getKJVDaily();
    return `
        <div class="card daily-box">
            <div class="verse-title"><i class="fas fa-bible"></i> Daily Bread — King James Version</div>
            <div class="verse-text">"${verses.text}"</div>
            <div class="verse-ref">— ${verses.ref}</div>
        </div>
    `;
}

function renderEGW() {
    const quote = getEGWDaily();
    return `
        <div class="card daily-box">
            <div class="egw-title"><i class="fas fa-feather-alt"></i> Ellen G. White · Leadership</div>
            <div class="egw-quote">"${quote}"</div>
        </div>
    `;
}

function renderNotepad() {
    return `
        <div class="card">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <i class="fas fa-pen-to-square" style="font-size: 1.6rem; color: #386a4e;"></i>
                <span style="font-weight: 650; color: #1c4939; font-size: 1.15rem;">Advanced Notepad · Folders & docs</span>
            </div>
            <div class="notepad-advanced">
                <div class="notepad-toolbar">
                    <button id="newFolderBtn" class="notepad-btn"><i class="fas fa-folder-plus"></i> New folder</button>
                    <button id="newDocBtn" class="notepad-btn"><i class="fas fa-file-circle-plus"></i> New document</button>
                    <button id="deleteDocBtn" class="notepad-btn"><i class="fas fa-trash-can"></i> Delete</button>
                </div>
                <div class="folder-structure">
                    <div class="folder-list">
                        <div class="folder-header"><i class="fas fa-folders"></i> My folders</div>
                        <div id="folderList"></div>
                    </div>
                    <div class="doc-list">
                        <div class="doc-header"><i class="fas fa-files"></i> Documents</div>
                        <div id="docList"></div>
                    </div>
                </div>
                <div class="notepad-editor">
                    <textarea id="notepadContent" class="notepad-textarea" placeholder="Write your notes here..."></textarea>
                    <div class="notepad-status">
                        <span id="noteStatus">📄 Ready</span>
                        <span><i class="fas fa-cloud"></i> offline storage</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderMasterSheet() {
    return `
        <h2>Master Sheet – All Entries</h2>
        <table id="master-table">
            <thead>
                <tr>
                    <th>Timestamp</th><th>Strategic Theme</th><th>Initiatives</th><th>KPI</th><th>Quarter</th>
                    <th>Committee</th><th>Timing</th><th>Budget</th><th>Variance</th><th>Comments</th>
                </tr>
            </thead>
            <tbody id="master-body"></tbody>
        </table>
    `;
}

function renderCommitteeView(committeeId) {
    const committee = committees.find(c => c.id === committeeId);
    if (!committee) return '<p>Committee not found.</p>';
    return `
        <h2>${committee.name}</h2>
        <form id="entry-form" class="entry-form">
            <input type="text" name="strategic_theme" placeholder="Strategic Theme" required />
            <input type="text" name="initiatives" placeholder="Initiatives" required />
            <input type="text" name="kpi_measures" placeholder="KPI (Measures)" required />
            <input type="text" name="quarter" placeholder="Quarter (e.g. Q1 2025)" required />
            <input type="text" name="timing" placeholder="Timing (e.g. Weekly)" />
            <input type="number" name="budget" placeholder="Budget" step="0.01" />
            <input type="number" name="variance" placeholder="Variance" step="0.01" />
            <textarea name="comments" placeholder="Comments"></textarea>
            <button type="submit">Add Entry</button>
        </form>
        <h3>Previous Entries</h3>
        <table id="committee-entries-table">
            <thead>
                <tr>
                    <th>Timestamp</th><th>Strategic Theme</th><th>Initiatives</th><th>KPI</th><th>Quarter</th>
                    <th>Timing</th><th>Budget</th><th>Variance</th><th>Comments</th><th>Actions</th>
                </tr>
            </thead>
            <tbody id="committee-entries-body"></tbody>
        </table>
    `;
}

function renderSettings() {
    return `
        <div class="settings-panel">
            <h3><i class="fas fa-gear"></i> Customise your portal</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <label><i class="fas fa-palette"></i> Theme accent</label>
                    <div class="theme-selector" id="themeSelector">
                        <div class="theme-btn active" data-theme="emerald" onclick="setTheme('emerald')"></div>
                        <div class="theme-btn" data-theme="forest" onclick="setTheme('forest')"></div>
                        <div class="theme-btn" data-theme="autumn" onclick="setTheme('autumn')"></div>
                        <div class="theme-btn" data-theme="twilight" onclick="setTheme('twilight')"></div>
                    </div>
                </div>
                <div class="setting-item">
                    <label><i class="fas fa-text-height"></i> Text size</label>
                    <div class="font-size-selector" id="fontSizeSelector">
                        <span class="font-btn" data-size="small" onclick="setFontSize('small')">A</span>
                        <span class="font-btn active" data-size="medium" onclick="setFontSize('medium')">A</span>
                        <span class="font-btn" data-size="large" onclick="setFontSize('large')">A</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label><i class="fas fa-bell"></i> Devotion reminder</label>
                    <div class="reminder-toggle" onclick="toggleReminder()">
                        <i class="fas fa-toggle-on" style="font-size: 2.8rem; color: #1e6e4a;" id="reminderToggle"></i>
                        <span id="reminderStatus" style="font-weight: 500;">Reminder ON</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==================== DATA FUNCTIONS ====================
async function loadMasterSheet() {
    const { data, error } = await supabase
        .from('committee_entries')
        .select(`
            created_at,
            strategic_theme,
            initiatives,
            kpi_measures,
            quarter,
            committees(name),
            timing,
            budget,
            variance,
            comments
        `)
        .order('created_at', { ascending: false });
    if (error) console.error(error);
    else {
        const tbody = document.getElementById('master-body');
        if (tbody) {
            tbody.innerHTML = data.map(e => `
                <tr>
                    <td>${new Date(e.created_at).toLocaleString()}</td>
                    <td>${e.strategic_theme || ''}</td>
                    <td>${e.initiatives || ''}</td>
                    <td>${e.kpi_measures || ''}</td>
                    <td>${e.quarter || ''}</td>
                    <td>${e.committees?.name || ''}</td>
                    <td>${e.timing || ''}</td>
                    <td>${e.budget || ''}</td>
                    <td>${e.variance || ''}</td>
                    <td>${e.comments || ''}</td>
                </tr>
            `).join('');
        }
    }
}

async function loadCommitteeEntries(committeeId) {
    const { data, error } = await supabase
        .from('committee_entries')
        .select('*')
        .eq('responsible_committee', committeeId)
        .order('created_at', { ascending: false });
    if (error) console.error(error);
    else {
        const tbody = document.getElementById('committee-entries-body');
        if (tbody) {
            tbody.innerHTML = data.map(e => `
                <tr>
                    <td>${new Date(e.created_at).toLocaleString()}</td>
                    <td>${e.strategic_theme}</td>
                    <td>${e.initiatives}</td>
                    <td>${e.kpi_measures}</td>
                    <td>${e.quarter}</td>
                    <td>${e.timing}</td>
                    <td>${e.budget}</td>
                    <td>${e.variance}</td>
                    <td>${e.comments}</td>
                    <td>
                        <button onclick="editEntry(${e.id})">Edit</button>
                        <button onclick="deleteEntry(${e.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

async function handleNewEntry(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const newEntry = {
        strategic_theme: formData.get('strategic_theme'),
        initiatives: formData.get('initiatives'),
        kpi_measures: formData.get('kpi_measures'),
        quarter: formData.get('quarter'),
        timing: formData.get('timing'),
        budget: formData.get('budget') ? parseFloat(formData.get('budget')) : null,
        variance: formData.get('variance') ? parseFloat(formData.get('variance')) : null,
        comments: formData.get('comments'),
        responsible_committee: selectedCommittee,
        created_by: currentUser.id
    };
    const { error } = await supabase.from('committee_entries').insert([newEntry]);
    if (error) alert('Error: ' + error.message);
    else {
        form.reset();
        loadCommitteeEntries(selectedCommittee);
    }
}

window.editEntry = async function(id) {
    const newTheme = prompt('New Strategic Theme:');
    if (newTheme) {
        const { error } = await supabase
            .from('committee_entries')
            .update({ strategic_theme: newTheme })
            .eq('id', id);
        if (error) alert(error.message);
        else loadCommitteeEntries(selectedCommittee);
    }
};

window.deleteEntry = async function(id) {
    if (confirm('Delete this entry?')) {
        const { error } = await supabase
            .from('committee_entries')
            .delete()
            .eq('id', id);
        if (error) alert(error.message);
        else loadCommitteeEntries(selectedCommittee);
    }
};

// ==================== STATIC DATA FOR DEVOTIONS ====================
const kjvVerses = [
    { text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", ref: "Proverbs 3:5" },
    { text: "And ye shall know the truth, and the truth shall make you free.", ref: "John 8:32" },
    // ... (add all 62 verses from the original HTML)
];
const egwLeadership = [
    "The Lord does not use men who are content to remain on low ground. He wants workers who will constantly improve.",
    // ... (add all 33 quotes)
];

function getKJVDaily() {
    const day = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
    return kjvVerses[day % kjvVerses.length];
}
function getEGWDaily() {
    const day = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
    return egwLeadership[day % egwLeadership.length];
}

// ==================== CALENDAR ====================
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: { left: 'prev', center: 'title', right: 'next' },
            height: 260,
            events: [
                { title: '🙏 Prayer', start: new Date(new Date().setDate(2)) },
                { title: '🙌 Leadership Summit', start: new Date(new Date().setDate(15)) },
                { title: '🕊️ Outreach', start: new Date(new Date().setDate(23)) }
            ]
        });
        calendar.render();
    }
}

// ==================== NOTEPAD (localStorage) ====================
function initNotepad() {
    let folders = JSON.parse(localStorage.getItem('unza_notepad_folders')) || [
        { id: 'f1', name: 'Prayer notes' },
        { id: 'f2', name: 'Committee meetings' }
    ];
    let docs = JSON.parse(localStorage.getItem('unza_notepad_docs')) || [
        { id: 'd1', folderId: 'f1', name: 'Morning prayer', content: 'Pray for unity and wisdom.' },
        { id: 'd2', folderId: 'f2', name: 'Leadership retreat', content: 'Plan for 2025 retreat.' }
    ];

    let activeFolder = folders[0]?.id || null;
    let activeDoc = null;

    function saveAll() {
        localStorage.setItem('unza_notepad_folders', JSON.stringify(folders));
        localStorage.setItem('unza_notepad_docs', JSON.stringify(docs));
    }

    function renderFolders() {
        const folderList = document.getElementById('folderList');
        if (!folderList) return;
        folderList.innerHTML = '';
        folders.forEach(f => {
            const div = document.createElement('div');
            div.className = `folder-item ${activeFolder === f.id ? 'active' : ''}`;
            div.innerHTML = `<i class="fas fa-folder"></i> ${f.name}`;
            div.onclick = () => {
                activeFolder = f.id;
                const folderDocs = docs.filter(d => d.folderId === activeFolder);
                activeDoc = folderDocs.length > 0 ? folderDocs[0].id : null;
                renderFolders();
                renderDocs();
                loadDocContent();
            };
            folderList.appendChild(div);
        });
    }

    function renderDocs() {
        const docList = document.getElementById('docList');
        if (!docList) return;
        docList.innerHTML = '';
        const folderDocs = docs.filter(d => d.folderId === activeFolder);
        if (folderDocs.length === 0) {
            docList.innerHTML = '<div style="padding: 10px; color: #587a5e;">📄 No documents</div>';
            return;
        }
        folderDocs.forEach(d => {
            const div = document.createElement('div');
            div.className = `doc-item ${activeDoc === d.id ? 'active' : ''}`;
            div.innerHTML = `<i class="fas fa-file-alt"></i> ${d.name}`;
            div.onclick = () => {
                activeDoc = d.id;
                renderDocs();
                loadDocContent();
            };
            docList.appendChild(div);
        });
    }

    function loadDocContent() {
        const textarea = document.getElementById('notepadContent');
        const status = document.getElementById('noteStatus');
        if (activeDoc) {
            const doc = docs.find(d => d.id === activeDoc);
            if (doc) {
                textarea.value = doc.content || '';
                status.innerText = `📄 Editing: ${doc.name}`;
            }
        } else {
            textarea.value = '';
            status.innerText = '📄 Select or create document';
        }
    }

    function saveCurrentDoc() {
        if (activeDoc) {
            const doc = docs.find(d => d.id === activeDoc);
            if (doc) {
                doc.content = document.getElementById('notepadContent').value;
                saveAll();
            }
        }
    }

    document.getElementById('newFolderBtn')?.addEventListener('click', () => {
        let name = prompt('Enter folder name:');
        if (name) {
            const newId = 'f' + Date.now() + Math.random();
            folders.push({ id: newId, name });
            saveAll();
            renderFolders();
        }
    });

    document.getElementById('newDocBtn')?.addEventListener('click', () => {
        if (!activeFolder) { alert('Select a folder first.'); return; }
        let name = prompt('Enter document name:');
        if (name) {
            const newId = 'd' + Date.now() + Math.random();
            docs.push({ id: newId, folderId: activeFolder, name, content: '' });
            saveAll();
            activeDoc = newId;
            renderDocs();
            loadDocContent();
        }
    });

    document.getElementById('deleteDocBtn')?.addEventListener('click', () => {
        if (activeDoc && confirm('Delete current document?')) {
            docs = docs.filter(d => d.id !== activeDoc);
            saveAll();
            const folderDocs = docs.filter(d => d.folderId === activeFolder);
            activeDoc = folderDocs.length > 0 ? folderDocs[0].id : null;
            renderDocs();
            loadDocContent();
        }
    });

    document.getElementById('notepadContent')?.addEventListener('input', saveCurrentDoc);

    // Initial render
    if (folders.length) {
        activeFolder = folders[0].id;
        const folderDocs = docs.filter(d => d.folderId === activeFolder);
        activeDoc = folderDocs.length ? folderDocs[0].id : null;
    }
    renderFolders();
    renderDocs();
    loadDocContent();
}

// ==================== SETTINGS FUNCTIONS ====================
window.setTheme = function(theme) {
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.theme-btn[data-theme="${theme}"]`).classList.add('active');
    let root = document.documentElement;
    if (theme === 'emerald') { root.style.setProperty('--primary-deep', '#0a2e24'); root.style.setProperty('--primary-soft', '#1e4a3a'); }
    if (theme === 'forest') { root.style.setProperty('--primary-deep', '#1d4732'); root.style.setProperty('--primary-soft', '#2f6b4a'); }
    if (theme === 'autumn') { root.style.setProperty('--primary-deep', '#5d3e3a'); root.style.setProperty('--primary-soft', '#7a5a4b'); }
    if (theme === 'twilight') { root.style.setProperty('--primary-deep', '#2e3e4f'); root.style.setProperty('--primary-soft', '#4a5e6b'); }
    sidebar.style.background = root.style.getPropertyValue('--primary-deep') || '#0a2e24';
};

window.setFontSize = function(size) {
    document.querySelectorAll('.font-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.font-btn[data-size="${size}"]`).classList.add('active');
    let root = document.documentElement;
    if (size === 'small') root.style.setProperty('--text-base', '1.2rem');
    if (size === 'medium') root.style.setProperty('--text-base', '1.4rem');
    if (size === 'large') root.style.setProperty('--text-base', '1.8rem');
};

window.toggleReminder = function() {
    let toggle = document.getElementById('reminderToggle');
    let status = document.getElementById('reminderStatus');
    if (toggle.classList.contains('fa-toggle-on')) {
        toggle.classList.remove('fa-toggle-on');
        toggle.classList.add('fa-toggle-off');
        status.innerText = 'Reminder OFF';
    } else {
        toggle.classList.remove('fa-toggle-off');
        toggle.classList.add('fa-toggle-on');
        status.innerText = 'Reminder ON';
    }
};

// ==================== COMMITTEE BUTTON HANDLER ====================
document.addEventListener('click', (e) => {
    if (e.target.closest('.committee-btn') && !e.target.closest('.committee-btn.disabled')) {
        const btn = e.target.closest('.committee-btn');
        const committeeId = parseInt(btn.dataset.id);
        if (userProfile.role === 'admin') {
            selectedCommittee = committeeId;
            showSection('committee-view');
        } else if (userProfile.role === 'leader' && committeeId === userProfile.committee_id) {
            selectedCommittee = committeeId;
            showSection('committee-view');
        }
    }
});
