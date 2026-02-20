// ==================== CONFIGURATION ====================
const supabaseUrl = 'https://hncypepxbdysefwimdhs.supabase.co';   // REPLACE WITH YOUR PROJECT URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3lwZXB4YmR5c2Vmd2ltZGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjQyMTEsImV4cCI6MjA4NzE0MDIxMX0.LRW8NvwVpXY6q3w-5XxZ5ZuWLv2HMRCIe8kHKbb5eW4';                     // REPLACE WITH YOUR ANON KEY
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let userProfile = null; // { role, committee_id, committee_name }

// ==================== DOM ELEMENTS ====================
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const menuToggle = document.getElementById('menuToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const authModal = document.getElementById('auth-modal');
const closeModal = document.querySelector('.close-modal');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginFormDiv = document.getElementById('login-form');
const signupFormDiv = document.getElementById('signup-form');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const userEmailDisplay = document.getElementById('user-email-display');
const loginHeaderBtn = document.getElementById('login-btn-header');
const logoutHeaderBtn = document.getElementById('logout-btn-header');
const committeesPlaceholder = document.getElementById('committees-placeholder');
const calendarEl = document.getElementById('calendar');
const dailyVerseText = document.getElementById('dailyVerseText');
const dailyVerseRef = document.getElementById('dailyVerseRef');
const egwDailyQuote = document.getElementById('egwDailyQuote');

// Notepad elements
const newFolderBtn = document.getElementById('newFolderBtn');
const newDocBtn = document.getElementById('newDocBtn');
const deleteDocBtn = document.getElementById('deleteDocBtn');
const folderList = document.getElementById('folderList');
const docList = document.getElementById('docList');
const notepadContent = document.getElementById('notepadContent');
const noteStatus = document.getElementById('noteStatus');

// Settings
const themeSelector = document.getElementById('themeSelector');
const fontSizeSelector = document.getElementById('fontSizeSelector');
const reminderToggle = document.getElementById('reminderToggle');
const reminderStatus = document.getElementById('reminderStatus');

// ==================== SIDEBAR TOGGLE ====================
window.toggleSidebarIfMobile = function() {
    if (window.innerWidth <= 992) {
        sidebar.classList.add('closed');
        mainContent.classList.add('expanded');
        sidebarOverlay.classList.remove('active');
    }
};

function toggleSidebar() {
    sidebar.classList.toggle('closed');
    mainContent.classList.toggle('expanded');
    sidebarOverlay.classList.toggle('active');
    if (!sidebar.classList.contains('closed')) {
        mainContent.style.width = `calc(100% - var(--sidebar-width))`;
    } else {
        mainContent.style.width = '100%';
    }
}
menuToggle.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

function handleResize() {
    if (window.innerWidth <= 992) {
        sidebar.classList.add('closed');
        mainContent.classList.add('expanded');
        sidebarOverlay.classList.remove('active');
        mainContent.style.width = '100%';
    } else {
        sidebar.classList.remove('closed');
        mainContent.classList.remove('expanded');
        mainContent.style.width = `calc(100% - var(--sidebar-width))`;
    }
}
window.addEventListener('resize', handleResize);
handleResize();

// ==================== SIDEBAR NAVIGATION ====================
const sections = document.querySelectorAll('.content-section');
const sidebarLinks = document.querySelectorAll('.sidebar-menu-item');

sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        toggleSidebarIfMobile();
    });
});

// ==================== AUTH MODAL ====================
loginHeaderBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
});
closeModal.addEventListener('click', () => {
    authModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.style.display = 'none';
});

loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginFormDiv.classList.add('active');
    signupFormDiv.classList.remove('active');
});
signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupFormDiv.classList.add('active');
    loginFormDiv.classList.remove('active');
});

// Sign up
signupBtn.addEventListener('click', async () => {
    const email = signupEmail.value;
    const password = signupPassword.value;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) signupError.innerText = error.message;
    else {
        alert('Check your email for confirmation!');
        loginTab.click();
    }
});

// Login
loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) loginError.innerText = error.message;
    else {
        authModal.style.display = 'none';
        loginEmail.value = '';
        loginPassword.value = '';
    }
});

// Logout
logoutHeaderBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// ==================== AUTH STATE & USER PROFILE ====================
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        currentUser = session.user;
        fetchUserProfile(session.user.id);
    } else {
        setLoggedOutUI();
    }
});

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        fetchUserProfile(session.user.id);
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        userProfile = null;
        setLoggedOutUI();
    }
});

async function fetchUserProfile(userId) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, committee_id, committees(name)')
        .eq('id', userId)
        .single();
    if (error) {
        console.error(error);
        return;
    }
    userProfile = {
        role: profile.role,
        committee_id: profile.committee_id,
        committee_name: profile.committees?.name || 'Unknown'
    };
    setLoggedInUI();
}

function setLoggedInUI() {
    userEmailDisplay.textContent = currentUser.email;
    loginHeaderBtn.style.display = 'none';
    logoutHeaderBtn.style.display = 'inline-block';
    // Load the committees section based on role
    loadCommitteesSection();
}

function setLoggedOutUI() {
    userEmailDisplay.textContent = '';
    loginHeaderBtn.style.display = 'inline-block';
    logoutHeaderBtn.style.display = 'none';
    // Show a placeholder asking to log in
    committeesPlaceholder.innerHTML = '<div class="data-container"><h2>Committees</h2><p>Please log in to access committee data.</p></div>';
}

// ==================== COMMITTEES SECTION (DYNAMIC) ====================
async function loadCommitteesSection() {
    if (!userProfile) return;
    if (userProfile.role === 'admin') {
        renderAdminMasterSheet();
    } else {
        renderLeaderDashboard(userProfile.committee_id, userProfile.committee_name);
    }
}

async function renderAdminMasterSheet() {
    const { data: entries, error } = await supabase
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
            comments,
            id
        `)
        .order('created_at', { ascending: false });

    if (error) {
        committeesPlaceholder.innerHTML = `<div class="data-container">Error loading data: ${error.message}</div>`;
        return;
    }

    let html = `
        <div class="data-container">
            <h2>Master Sheet – All Entries</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Strategic Theme</th>
                            <th>Initiatives</th>
                            <th>KPI (Measures)</th>
                            <th>Quarter</th>
                            <th>Committee</th>
                            <th>Timing</th>
                            <th>Budget</th>
                            <th>Variance</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    entries.forEach(e => {
        html += `
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
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    committeesPlaceholder.innerHTML = html;
}

async function renderLeaderDashboard(committeeId, committeeName) {
    const { data: entries, error } = await supabase
        .from('committee_entries')
        .select('*')
        .eq('responsible_committee', committeeId)
        .order('created_at', { ascending: false });

    if (error) {
        committeesPlaceholder.innerHTML = `<div class="data-container">Error loading data: ${error.message}</div>`;
        return;
    }

    let html = `
        <div class="data-container">
            <h2>My Committee: ${committeeName}</h2>
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
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Strategic Theme</th>
                            <th>Initiatives</th>
                            <th>KPI</th>
                            <th>Quarter</th>
                            <th>Timing</th>
                            <th>Budget</th>
                            <th>Variance</th>
                            <th>Comments</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    entries.forEach(e => {
        html += `
            <tr>
                <td>${new Date(e.created_at).toLocaleString()}</td>
                <td>${e.strategic_theme}</td>
                <td>${e.initiatives}</td>
                <td>${e.kpi_measures}</td>
                <td>${e.quarter}</td>
                <td>${e.timing || ''}</td>
                <td>${e.budget || ''}</td>
                <td>${e.variance || ''}</td>
                <td>${e.comments || ''}</td>
                <td>
                    <button class="action-btn" onclick="editEntry(${e.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" onclick="deleteEntry(${e.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    committeesPlaceholder.innerHTML = html;

    // Attach submit event to the new form
    document.getElementById('entry-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newEntry = {
            strategic_theme: formData.get('strategic_theme'),
            initiatives: formData.get('initiatives'),
            kpi_measures: formData.get('kpi_measures'),
            quarter: formData.get('quarter'),
            timing: formData.get('timing'),
            budget: formData.get('budget') ? parseFloat(formData.get('budget')) : null,
            variance: formData.get('variance') ? parseFloat(formData.get('variance')) : null,
            comments: formData.get('comments'),
            created_by: currentUser.id,
            responsible_committee: committeeId
        };
        const { error } = await supabase.from('committee_entries').insert([newEntry]);
        if (error) {
            alert('Error: ' + error.message);
        } else {
            // Refresh the view
            renderLeaderDashboard(committeeId, committeeName);
        }
    });
}

// Edit and delete functions (global so they can be called from inline onclick)
window.editEntry = async function(id) {
    const newTheme = prompt('Enter new Strategic Theme:');
    if (newTheme) {
        const { error } = await supabase
            .from('committee_entries')
            .update({ strategic_theme: newTheme })
            .eq('id', id);
        if (!error) location.reload(); // simple refresh
    }
};

window.deleteEntry = async function(id) {
    if (confirm('Delete this entry?')) {
        const { error } = await supabase
            .from('committee_entries')
            .delete()
            .eq('id', id);
        if (!error) location.reload();
    }
};

// ==================== CALENDAR ====================
document.addEventListener('DOMContentLoaded', function() {
    if (calendarEl) {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: { left: 'prev', center: 'title', right: 'next' },
            height: 260,
            contentHeight: 240,
            aspectRatio: 1.6,
            displayEventTime: false,
            fixedWeekCount: false,
            showNonCurrentDates: false,
            locale: 'en',
            events: [
                { title: '🙏 Prayer', start: new Date(new Date().setDate(2)) },
                { title: '🙌 Leadership Summit', start: new Date(new Date().setDate(15)) },
                { title: '🕊️ Outreach', start: new Date(new Date().setDate(23)) }
            ]
        });
        calendar.render();
    }
});

// ==================== DAILY BREAD (KJV + EGW) ====================
const kjvVerses = [
    { text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", ref: "Proverbs 3:5" },
    { text: "And ye shall know the truth, and the truth shall make you free.", ref: "John 8:32" },
    { text: "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.", ref: "Psalm 37:5" },
    { text: "He that speaketh truth sheweth forth righteousness: but a false witness deceit.", ref: "Proverbs 12:17" },
    { text: "Behold, God is my salvation; I will trust, and not be afraid.", ref: "Isaiah 12:2" },
    { text: "The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.", ref: "Nahum 1:7" },
    { text: "Lying lips are abomination to the LORD: but they that deal truly are his delight.", ref: "Proverbs 12:22" },
    { text: "Blessed is that man that maketh the LORD his trust.", ref: "Psalm 40:4" },
    { text: "He that walketh uprightly, and worketh righteousness, and speaketh the truth in his heart.", ref: "Psalm 15:2" },
    { text: "Trust ye in the LORD for ever: for in the LORD JEHOVAH is everlasting strength.", ref: "Isaiah 26:4" },
    { text: "The lip of truth shall be established for ever: but a lying tongue is but for a moment.", ref: "Proverbs 12:19" },
    { text: "O LORD of hosts, blessed is the man that trusteth in thee.", ref: "Psalm 84:12" },
    { text: "Buy the truth, and sell it not; also wisdom, and instruction, and understanding.", ref: "Proverbs 23:23" },
    { text: "It is better to trust in the LORD than to put confidence in man.", ref: "Psalm 118:8" },
    { text: "These are the things that ye shall do; Speak ye every man the truth to his neighbour.", ref: "Zechariah 8:16" },
    { text: "What time I am afraid, I will trust in thee.", ref: "Psalm 56:3" },
    { text: "A faithful witness will not lie: but a false witness will utter lies.", ref: "Proverbs 14:5" },
    { text: "God is not a man, that he should lie; neither the son of man, that he should repent.", ref: "Numbers 23:19" },
    { text: "They that know thy name will put their trust in thee: for thou, LORD, hast not forsaken them that seek thee.", ref: "Psalm 9:10" },
    { text: "Wherefore putting away lying, speak every man truth with his neighbour.", ref: "Ephesians 4:25" },
    { text: "The fear of man bringeth a snare: but whoso putteth his trust in the LORD shall be safe.", ref: "Proverbs 29:25" },
    { text: "Grace and truth came by Jesus Christ.", ref: "John 1:17" },
    { text: "Be of good courage, and he shall strengthen your heart, all ye that hope in the LORD.", ref: "Psalm 31:24" },
    { text: "I have chosen the way of truth: thy judgments have I laid before me.", ref: "Psalm 119:30" },
    { text: "The LORD redeemeth the soul of his servants: and none of them that trust in him shall be desolate.", ref: "Psalm 34:22" },
    { text: "Open ye the gates, that the righteous nation which keepeth the truth may enter in.", ref: "Isaiah 26:2" },
    { text: "And they that know thy name will put their trust in thee.", ref: "Psalm 9:10" },
    { text: "For the word of the LORD is right; and all his works are done in truth.", ref: "Psalm 33:4" },
    { text: "I have stuck unto thy testimonies: O LORD, put me not to shame.", ref: "Psalm 119:31" },
    { text: "Lead me in thy truth, and teach me; for thou art the God of my salvation; on thee do I wait all the day.", ref: "Psalm 25:5" },
    { text: "For thy lovingkindness is before mine eyes: and I have walked in thy truth.", ref: "Psalm 26:3" },
    { text: "He shall call upon me, and I will answer him: I will be with him in trouble; I will deliver him, and honour him.", ref: "Psalm 91:15" },
    { text: "The LORD is my shepherd; I shall not want.", ref: "Psalm 23:1" },
    { text: "I can do all things through Christ which strengtheneth me.", ref: "Philippians 4:13" },
    { text: "Jesus wept.", ref: "John 11:35" },
    { text: "The heavens declare the glory of God; and the firmament sheweth his handywork.", ref: "Psalm 19:1" },
    { text: "For God so loved the world, that he gave his only begotten Son.", ref: "John 3:16" },
    { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
    { text: "The Lord is nigh unto them that are of a broken heart.", ref: "Psalm 34:18" },
    { text: "Wait on the LORD: be of good courage, and he shall strengthen thine heart.", ref: "Psalm 27:14" },
    { text: "Create in me a clean heart, O God; and renew a right spirit within me.", ref: "Psalm 51:10" },
    { text: "The Lord is my light and my salvation; whom shall I fear?", ref: "Psalm 27:1" },
    { text: "But seek ye first the kingdom of God, and his righteousness.", ref: "Matthew 6:33" },
    { text: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit.", ref: "John 15:5" },
    { text: "Casting all your care upon him; for he careth for you.", ref: "1 Peter 5:7" },
    { text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil.", ref: "Jeremiah 29:11" },
    { text: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.", ref: "Proverbs 18:10" },
    { text: "He giveth power to the faint; and to them that have no might he increaseth strength.", ref: "Isaiah 40:29" },
    { text: "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight.", ref: "Psalm 19:14" },
    { text: "I will praise thee; for I am fearfully and wonderfully made.", ref: "Psalm 139:14" },
    { text: "The Lord is not slack concerning his promise, as some men count slackness.", ref: "2 Peter 3:9" },
    { text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", ref: "2 Timothy 1:7" },
    { text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.", ref: "Ephesians 2:8" },
    { text: "Believe on the Lord Jesus Christ, and thou shalt be saved.", ref: "Acts 16:31" },
    { text: "The effectual fervent prayer of a righteous man availeth much.", ref: "James 5:16" },
    { text: "He healeth the broken in heart, and bindeth up their wounds.", ref: "Psalm 147:3" },
    { text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.", ref: "Isaiah 41:10" },
    { text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.", ref: "Galatians 6:9" },
    { text: "Call unto me, and I will answer thee, and shew thee great and mighty things.", ref: "Jeremiah 33:3" },
    { text: "In all thy ways acknowledge him, and he shall direct thy paths.", ref: "Proverbs 3:6" },
    { text: "For I am persuaded, that neither death, nor life, ... shall be able to separate us from the love of God.", ref: "Romans 8:38-39" },
    { text: "The LORD is my rock, and my fortress, and my deliverer; my God, my strength, in whom I will trust.", ref: "Psalm 18:2" }
];

const egwLeadership = [
    "The Lord does not use men who are content to remain on low ground. He wants workers who will constantly improve.",
    "True leadership is the art of serving others while guiding them toward God’s purpose.",
    "He who is imbued with the Spirit of Christ will not be self-confident, but will trust in God as a child trusts in his parents.",
    "The greatest leader is the one who is willing to be the least, after Christ’s example.",
    "No man can be a safe leader unless he is led by the Lord.",
    "Those who are placed as leaders are to be wise, not self-sufficient, but full of the Holy Spirit.",
    "In His wisdom, God brings men into different positions to develop character.",
    "The Lord selects His leaders, not from the proud and ambitious, but from the humble and faithful.",
    "A true leader will not seek to control but to uplift, not to dominate but to inspire.",
    "God calls for men who will stand firm as pillars, grounded in His Word.",
    "The highest kind of leadership is found in obedience and submission to God.",
    "Self-confidence leads to rashness; God-confidence leads to wise, steady leadership.",
    "Moses was trained in the desert so he could lead with meekness.",
    "A leader’s power lies not in position but in connection with the Source of all power.",
    "When leaders humble themselves, God can use them mightily.",
    "Daniel’s leadership was effective because he was faithful in small things.",
    "True reform starts with leaders who are not afraid to stand for truth.",
    "Paul led not by commanding, but by pouring out his life for the flock.",
    "Nehemiah combined prayer with action—this is sacred leadership.",
    "Peter was restored, then entrusted with leadership because he loved.",
    "God measures leaders by their capacity to love and serve.",
    "Those who lead must be men of prayer, or their leadership will be hollow.",
    "A leader cannot lead others where they have not been themselves.",
    "Patience in leadership is stronger than force.",
    "Christ washed feet—that is the seal of godly authority.",
    "The greatest leaders are those who point away from themselves to the Lamb of God.",
    "Selfish ambition ruins leadership; humility builds it for eternity.",
    "Wisdom from above is the first qualification for leadership.",
    "He who rules his own spirit is greater than he who rules a kingdom.",
    "Counsel together in humility, and God will guide your decisions.",
    "God is looking for leaders who will lean wholly on His arm.",
    "You may be assured that if you will walk humbly with God, He will qualify you for every duty.",
    "The standard of leadership in God’s kingdom is service."
];

const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
dailyVerseText.innerText = `“${kjvVerses[dayOfYear % kjvVerses.length].text}”`;
dailyVerseRef.innerText = `— ${kjvVerses[dayOfYear % kjvVerses.length].ref}`;
egwDailyQuote.innerText = `“${egwLeadership[dayOfYear % egwLeadership.length]}”`;

// ==================== NOTEPAD (localStorage) ====================
let folders = [
    { id: 'f1', name: 'Prayer notes' },
    { id: 'f2', name: 'Committee meetings' }
];
let docs = [
    { id: 'd1', folderId: 'f1', name: 'Morning prayer', content: 'Pray for unity and wisdom.' },
    { id: 'd2', folderId: 'f2', name: 'Leadership retreat', content: 'Plan for 2025 retreat.' },
    { id: 'd3', folderId: 'f1', name: 'Thanksgiving', content: 'Give thanks for provision.' }
];

let activeFolder = 'f1';
let activeDoc = 'd1';

const stored = localStorage.getItem('unza_notepad_folders');
if (stored) { try { folders = JSON.parse(stored); } catch(e) {} }
const storedDocs = localStorage.getItem('unza_notepad_docs');
if (storedDocs) { try { docs = JSON.parse(storedDocs); } catch(e) {} }

function saveNotepad() {
    localStorage.setItem('unza_notepad_folders', JSON.stringify(folders));
    localStorage.setItem('unza_notepad_docs', JSON.stringify(docs));
}

function renderFolders() {
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
            loadActiveDoc();
        };
        folderList.appendChild(div);
    });
}

function renderDocs() {
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
            loadActiveDoc();
        };
        docList.appendChild(div);
    });
}

function loadActiveDoc() {
    if (!notepadContent) return;
    if (activeDoc) {
        const doc = docs.find(d => d.id === activeDoc);
        if (doc) {
            notepadContent.value = doc.content || '';
            noteStatus.innerHTML = `📄 Editing: ${doc.name}`;
        }
    } else {
        notepadContent.value = '';
        noteStatus.innerHTML = '📄 Select or create document';
    }
}

function saveCurrentDoc() {
    if (activeDoc) {
        const doc = docs.find(d => d.id === activeDoc);
        if (doc) {
            doc.content = notepadContent.value;
            saveNotepad();
        }
    }
}

newFolderBtn?.addEventListener('click', () => {
    let name = prompt('Enter folder name:');
    if (name) {
        const newId = 'f' + Date.now() + Math.random();
        folders.push({ id: newId, name: name });
        saveNotepad();
        renderFolders();
    }
});

newDocBtn?.addEventListener('click', () => {
    if (!activeFolder) {
        alert('Please select a folder first.');
        return;
    }
    let name = prompt('Enter document name:');
    if (name) {
        const newId = 'd' + Date.now() + Math.random();
        docs.push({ id: newId, folderId: activeFolder, name: name, content: '' });
        saveNotepad();
        activeDoc = newId;
        renderDocs();
        loadActiveDoc();
    }
});

deleteDocBtn?.addEventListener('click', () => {
    if (activeDoc) {
        if (confirm('Delete current document?')) {
            docs = docs.filter(d => d.id !== activeDoc);
            saveNotepad();
            const folderDocs = docs.filter(d => d.folderId === activeFolder);
            activeDoc = folderDocs.length > 0 ? folderDocs[0].id : null;
            renderDocs();
            loadActiveDoc();
        }
    }
});

notepadContent?.addEventListener('input', saveCurrentDoc);

// Initialise notepad
if (folders.length > 0) {
    activeFolder = folders[0].id;
    const folderDocs = docs.filter(d => d.folderId === activeFolder);
    activeDoc = folderDocs.length > 0 ? folderDocs[0].id : null;
}
renderFolders();
renderDocs();
loadActiveDoc();

// ==================== SETTINGS ====================
window.setTheme = function(theme) {
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.theme-btn[data-theme="${theme}"]`).classList.add('active');
    let root = document.documentElement;
    if (theme === 'emerald') { root.style.setProperty('--primary-deep', '#0a2e24'); root.style.setProperty('--primary-soft', '#1e4a3a'); }
    if (theme === 'forest') { root.style.setProperty('--primary-deep', '#1d4732'); root.style.setProperty('--primary-soft', '#2f6b4a'); }
    if (theme === 'autumn') { root.style.setProperty('--primary-deep', '#5d3e3a'); root.style.setProperty('--primary-soft', '#7a5a4b'); }
    if (theme === 'twilight') { root.style.setProperty('--primary-deep', '#2e3e4f'); root.style.setProperty('--primary-soft', '#4a5e6b'); }
    document.getElementById('sidebar').style.background = root.style.getPropertyValue('--primary-deep') || '#0a2e24';
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
    if (reminderToggle.classList.contains('fa-toggle-on')) {
        reminderToggle.classList.remove('fa-toggle-on');
        reminderToggle.classList.add('fa-toggle-off');
        reminderStatus.innerText = 'Reminder OFF';
    } else {
        reminderToggle.classList.remove('fa-toggle-off');
        reminderToggle.classList.add('fa-toggle-on');
        reminderStatus.innerText = 'Reminder ON';
    }
};
