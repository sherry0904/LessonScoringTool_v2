/**
 * @file script.js
 * @description 班級經營動力站的核心邏輯，包含狀態管理、畫面渲染、事件處理等。
 * @author 方方老師 & Gemini
 */

document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    // --- 1. STATE & CONSTANTS (狀態與常數管理) ---
    // ===================================================================================
    /** @description 存放應用程式中所有主要的畫面(Screen)DOM元素 */
    const screens = { 
        dashboard: document.getElementById('class-dashboard-screen'), 
        classView: document.getElementById('class-view-screen') 
    };
    /** @description 存放所有彈出視窗(Modal)的DOM元素 */
    const modals = { 
        class: document.getElementById('add-edit-class-modal'), 
        homework: document.getElementById('add-homework-modal'), 
        studentExport: document.getElementById('export-student-modal'), 
        taskBoard: document.getElementById('task-board-modal'), 
        student: document.getElementById('student-modal'), 
        podium: document.getElementById('podium-modal') 
    };
    /** @description 存放所有側邊工具(Widget)的DOM元素 */
    const toolWidgets = { 
        timer: document.getElementById('timer-widget'), 
        picker: document.getElementById('picker-widget') 
    };

    /** @description 作業狀態的順序，用於切換狀態 */
    const STATUS_ORDER = ['pending', 'submitted', 'needs_correction', 'completed'];
    /** @description 作業狀態對應的中文文字 */
    const STATUS_TEXT = { pending: '未繳交', submitted: '已繳交', needs_correction: '待訂正', completed: '已完成' };
    /** @description LocalStorage 使用的鍵值 */
    const LOCAL_STORAGE_KEY = 'classPowerhouse_v10_refactored';

    /** @description 應用程式核心資料狀態，所有班級、學生、作業等資料都存放在此 */
    let appData = { classes: [] };
    /** @description 當前操作中的班級ID */
    let currentClassId = null;
    /** @description 當前操作中的作業ID */
    let currentHomeworkId = null;
    /** @description 當前拖曳中的學生ID (用於分組功能) */
    let draggedStudentId = null;
    /** @description 計時器的間隔ID */
    let timerInterval = null;
    /** @description 計時器剩餘秒數 */
    let timeLeftInSeconds = 0;
    /** @description 計時器是否正在運行 */
    let isTimerRunning = false;

    // ===================================================================================
    // --- 2. CORE FUNCTIONS (核心功能函式) ---
    // ===================================================================================

    /**
     * 將目前的 appData 狀態儲存到瀏覽器的 LocalStorage
     */
    function saveData() { 
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData)); 
    }

    /**
     * 從 LocalStorage 載入先前儲存的資料，若無資料則初始化為空
     */
    function loadData() { 
        appData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { classes: [] }; 
    }

    /**
     * 切換顯示的 App 畫面 (總覽/班級內部)
     * @param {string} screenName - 欲顯示的畫面名稱 ('dashboard' 或 'classView')
     */
    function switchScreen(screenName) { 
        Object.values(screens).forEach(s => s.classList.remove('active')); 
        screens[screenName].classList.add('active'); 
    }

    /**
     * 在班級內部畫面中，切換不同的功能分頁 (個人計分/作業訂正等)
     * @param {string} tabName - 欲顯示的分頁名稱
     */
    function switchTab(tabName) { 
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName)); 
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${tabName}-tab`)); 
    }

    /**
     * 顯示指定的彈出視窗
     * @param {string} modalName - 欲顯示的彈窗名稱
     */
    function showModal(modalName) { modals[modalName].classList.add('visible'); }

    /**
     * 關閉指定的彈出視窗
     * @param {string} modalName - 欲關閉的彈窗名稱
     */
    function closeModal(modalName) { modals[modalName].classList.remove('visible'); }

    /**
     * 切換顯示或隱藏側邊工具 (計時器/抽籤)
     * @param {string} toolName - 欲切換的工具名稱
     */
    function toggleToolWidget(toolName) {
        Object.entries(toolWidgets).forEach(([name, widget]) => {
            if (name === toolName) { 
                widget.classList.toggle('active'); 
            } else { 
                widget.classList.remove('active'); // 確保一次只開一個
            }
        });
    }

    /**
     * 根據 currentClassId 取得當前操作的班級物件
     * @returns {object | undefined} 當前班級的資料物件
     */
    function getCurrentClass() { return appData.classes.find(c => c.id === currentClassId); }
    
    // ===================================================================================
    // --- 3. RENDER FUNCTIONS (畫面渲染函式) ---
    // ===================================================================================

    /**
     * 渲染主總覽畫面，顯示所有班級卡片
     * 優化建議: 班級卡片可以使用 <template> 模板生成，避免 innerHTML 拼接。
     */
    function renderDashboard() {
        const grid = document.getElementById('class-dashboard-grid'); 
        grid.innerHTML = ''; // 清空現有內容
        appData.classes.forEach(cls => { 
            const card = document.createElement('div'); 
            card.className = 'card class-card'; 
            card.dataset.id = cls.id; 
            card.innerHTML = `<h3>${cls.name}</h3><p>${cls.students.length} 位學生</p>`; 
            grid.appendChild(card); 
        });
        // 新增「新增班級」的按鈕
        const addCard = document.createElement('button'); 
        addCard.id = 'add-class-card'; 
        addCard.className = 'card'; 
        addCard.textContent = '+'; 
        grid.appendChild(addCard);
    }

    /**
     * 渲染指定班級的內部主畫面
     */
    function renderClassView() {
        const cls = getCurrentClass(); 
        if (!cls) { 
            switchScreen('dashboard'); // 如果找不到班級，返回總覽
            return; 
        }
        document.getElementById('class-view-title').textContent = cls.name;
        // 依次渲染各個功能分頁
        renderScoringTab(cls); 
        renderHomeworkTab(cls); 
        renderGroupingTab(cls); 
        renderGradesTab(cls);
        // 預設顯示第一個分頁
        switchTab('scoring'); 
        switchScreen('classView');
    }

    /**
     * 渲染「個人計分」分頁的內容
     * @param {object} cls - 當前班級的資料物件
     * 優化建議: 學生卡片可以使用 <template> 模板生成。
     */
    function renderScoringTab(cls) {
        const container = document.getElementById('scoring-tab'); 
        container.innerHTML = `<div class="tab-actions"><button id="add-student-btn" class="btn btn-primary">新增學生</button></div><div id="student-grid" class="dashboard-grid"></div>`;
        const grid = container.querySelector('#student-grid');
        // 根據座號排序並生成每個學生的計分卡
        cls.students.sort((a,b) => a.id - b.id).forEach(s => { 
            const card = document.createElement('div'); 
            card.className = 'card student-card'; 
            card.dataset.studentId = s.id;
            card.innerHTML = `<div class="student-card-header"><span class="student-name">${s.id}. ${s.name}</span><button class="class-action-btn edit-student-btn" data-student-id="${s.id}">✏️</button></div><div class="student-score">${s.score}</div><div class="score-controls"><button class="btn btn-danger score-btn" data-amount="-1">-</button><button class="btn btn-success score-btn" data-amount="1">+</button></div>`; 
            grid.appendChild(card); 
        });
    }

    /**
     * 渲染「作業訂正」分頁的入口 (作業列表)
     * @param {object} cls - 當前班級的資料物件
     */
    function renderHomeworkTab(cls) { 
        currentHomeworkId = null; // 重置當前作業ID
        renderHomeworkList(cls); 
    }

    /**
     * 渲染作業列表
     * @param {object} cls - 當前班級的資料物件
     * 優化建議: 作業卡片可以使用 <template> 模板生成。
     */
    function renderHomeworkList(cls) {
        const container = document.getElementById('homework-tab');
        container.innerHTML = `<div class="tab-actions"><button id="show-task-board-btn" class="btn btn-warning">互動任務板</button><button id="show-export-student-modal-btn" class="btn btn-glass">匯出學生報告</button><button id="add-homework-btn" class="btn btn-primary">新增作業</button></div><div id="homework-grid" class="dashboard-grid"></div>`;
        const grid = container.querySelector('#homework-grid');
        if (!cls.homeworks || cls.homeworks.length === 0) { 
            grid.innerHTML = `<p class="card full-width-message">這個班級還沒有作業喔！</p>`; 
            return; 
        }
        // 生成每項作業的卡片，並統計各狀態人數
        cls.homeworks.forEach(hw => {
            const statuses = hw.studentStatus.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {});
            const statusHTML = `
                <div class="status-summary">
                    <div class="status-box"><span class="status-color-pending">⚫️</span><span>未繳交</span><span class="count">${statuses.pending || 0}</span></div>
                    <div class="status-box"><span class="status-color-submitted">🔵</span><span>已繳交</span><span class="count">${statuses.submitted || 0}</span></div>
                    <div class="status-box"><span class="status-color-needs_correction">🟠</span><span>待訂正</span><span class="count">${statuses.needs_correction || 0}</span></div>
                    <div class="status-box"><span class="status-color-completed">🟢</span><span>已完成</span><span class="count">${statuses.completed || 0}</span></div>
                </div>`;
            const card = document.createElement('div'); 
            card.className = 'card homework-card'; 
            card.dataset.id = hw.id; 
            card.innerHTML = `<h3>${hw.title}</h3>${statusHTML}`; 
            grid.appendChild(card);
        });
    }

    /**
     * 渲染單項作業的學生繳交狀態追蹤畫面
     */
    function renderHomeworkTracking() {
        const cls = getCurrentClass();
        const homework = cls.homeworks.find(hw => hw.id === currentHomeworkId); 
        if (!homework) { 
            renderHomeworkList(cls); // 如果找不到作業，返回作業列表
            return; 
        }
        const container = document.getElementById('homework-tab');
        container.innerHTML = `<div class="tab-actions"><button id="back-to-homework-list-btn" class="btn btn-glass">返回作業列表</button><button id="delete-homework-btn" class="btn btn-danger">刪除作業</button></div><div class="card"><h2>${homework.title}</h2><div id="student-checklist-grid" class="dashboard-grid"></div></div>`;
        const grid = container.querySelector('#student-checklist-grid');
        // 生成每位學生的狀態按鈕
        homework.studentStatus.sort((a,b) => a.id - b.id).forEach(s_status => { 
            const s_info = cls.students.find(s => s.id === s_status.id); 
            const item = document.createElement('div'); 
            item.className = 
`student-status-item s-${s_status.status}`;
            item.dataset.id = s_status.id; 
            item.innerHTML = `<div>${s_info.name}</div><div class="status">${STATUS_TEXT[s_status.status]}</div>`; 
            grid.appendChild(item); 
        });
    }

    /**
     * 渲染「分組模式」分頁
     * @param {object} cls - 當前班級的資料物件
     */
    function renderGroupingTab(cls) {
        const container = document.getElementById('grouping-tab'); 
        let groupActionBtns = '';
        if (!cls.groupingActive) {
            groupActionBtns = `<button id="start-grouping-btn" class="btn btn-success">開始此次課堂分組</button>`;
        } else {
            groupActionBtns = `<button id="end-grouping-btn" class="btn btn-danger">結束此次課堂分組</button>`;
        }
        container.innerHTML = `<div class="tab-actions"><div class="group-count-control"><label>組數</label><input type="number" id="group-count-input" value="${cls.groupCount || 4}" ${cls.groupingActive ? 'disabled' : ''}></div><button id="show-podium-btn" class="btn btn-warning">顯示積分儀表板</button><button id="random-group-btn" class="btn btn-primary" ${cls.groupingActive ? 'disabled' : ''}>一鍵隨機分組</button>${groupActionBtns}</div><div class="group-container"><div class="card group-column" id="unassigned-students-column"><h3>未分組</h3><div class="group-members" id="unassigned-students"></div></div><div class="groups-area" id="groups-area"></div></div>`;
        const unassigned = container.querySelector('#unassigned-students');
        const groupsArea = container.querySelector('#groups-area');
        groupsArea.innerHTML = '';
        
        // 建立學生姓名標籤 (chip) 的工廠函式
        const createChip = s => { 
            const c = document.createElement('div'); 
            c.className = 'student-chip'; 
            c.textContent = `${s.id}. ${s.name}`; 
            c.dataset.studentId = s.id; 
            c.draggable = !cls.groupingActive; 
            return c; 
        };

        // 將未分組的學生放入「未分組」欄位
        cls.students.forEach(s => { 
            if (s.group === null || s.group > (cls.groupCount || 4)) unassigned.appendChild(createChip(s)); 
        });

        // 建立各個小組的欄位
        for (let i = 1; i <= (cls.groupCount || 4); i++) {
            const groupData = cls.groups.find(g => g.id === i);
            // 若 groupData 不存在則初始化
            if (!groupData) {
                cls.groups[i-1] = { id: i, score: 0 };
            }
            const score = (groupData && typeof groupData.score === 'number') ? groupData.score : 0;
            const col = document.createElement('div'); 
            col.className = 'card group-column'; 
            col.dataset.groupId = i;
            let scoreControls = '';
            if (cls.groupingActive) {
                scoreControls = `
                    <button class="btn btn-danger score-btn group-score-btn" data-amount="-1">-</button>
                    <button class="btn btn-success score-btn group-score-btn" data-amount="1">+</button>
                `;
            }
                col.innerHTML = `<div class="group-header">
                                          <h3>第 ${i} 組 <span class="badge bg-warning text-dark group-score-badge" data-group-id="${i}">🏆 ${score}</span></h3>
                                          <div class="score-controls">${scoreControls}</div>
                                      </div>
                                      <div class="group-members"></div>`;
            // 將已分組的學生放入對應小組
            cls.students.filter(s => s.group === i).forEach(s => col.querySelector('.group-members').appendChild(createChip(s)));
            groupsArea.appendChild(col);
        }
    }

    /**
     * 渲染小組積分儀表板 (頒獎台)
     */
    function renderPodiumModal() {
        const cls = getCurrentClass();
        const podiumContainer = document.getElementById('podium-modal').querySelector('#group-ranking-podium'); 
        podiumContainer.innerHTML = '';
        if (!cls.groups || cls.groups.length === 0) { 
            podiumContainer.innerHTML = `<p class="full-width-message">尚未設定小組或無小組分數紀錄</p>`; 
            showModal('podium'); 
            return; 
        }
        // 根據小組分數排序
        const sortedGroups = [...cls.groups].sort((a, b) => b.score - a.score);
        const podiumClasses = ['podium-1st', 'podium-2nd', 'podium-3rd']; 
        const podiumIcons = ['🥇', '🥈', '🥉'];
        // 取前三名顯示
        sortedGroups.slice(0, 3).forEach((group, index) => {
            const stand = document.createElement('div'); 
            stand.className = `podium-stand ${podiumClasses[index]}`;
            stand.innerHTML = `<h3>${podiumIcons[index]} 第 ${group.id} 組</h3><div class="score">${group.score}</div>`;
            podiumContainer.appendChild(stand);
        });
        showModal('podium');
    }

    /**
     * 渲染「成績結算」分頁
     * @param {object} cls - 當前班級的資料物件
     */
    function renderGradesTab(cls) {
        const container = document.getElementById('grades-tab'); 
        container.innerHTML = `<div class="tab-actions"><button id="calculate-grades-btn" class="btn btn-success">結算平時分數</button><button id="export-grades-btn" class="btn btn-primary">匯出Excel</button><button id="reset-scores-btn" class="btn btn-danger">分數重置</button></div><div id="grades-table-container"><table id="grades-table"><thead><tr><th>座號/姓名</th><th>累積淨分</th><th>平時分數</th></tr></thead><tbody></tbody></table></div>`;
        const tbody = container.querySelector('tbody'); 
        tbody.innerHTML = '';
        // 產生學生成績表格
        cls.students.sort((a,b) => a.id - b.id).forEach(s => tbody.innerHTML += `<tr><td>${s.id}. ${s.name}</td><td>${s.score}</td><td>${s.grade || '-'}</td></tr>`);
    }

    /**
     * 渲染「互動任務板」彈出視窗，顯示所有未完成的作業項目
     */
    function renderTaskBoard() {
        const cls = getCurrentClass(); 
        const grid = document.getElementById('task-board-grid'); 
        grid.innerHTML = '';
        let anyFound = false; // 檢查是否有任何待辦事項
        cls.homeworks.forEach(hw => {
            const studentsWithTasks = hw.studentStatus.filter(s => ['pending', 'needs_correction'].includes(s.status));
            if (studentsWithTasks.length > 0) {
                anyFound = true;
                const item = document.createElement('div'); 
                item.className = 'card task-board-item';
                item.innerHTML = `<h3>${hw.title}</h3>`;
                const studentContainer = document.createElement('div'); 
                studentContainer.className = 'task-board-students';
                studentsWithTasks.sort((a,b) => a.id - b.id).forEach(s_status => {
                    const s_info = cls.students.find(s => s.id === s_status.id);
                    const btn = document.createElement('button');
                    btn.className = `btn student-task-btn s-${s_status.status}`;
                    btn.textContent = s_info.id;
                    btn.dataset.studentId = s_info.id; 
                    btn.dataset.homeworkId = hw.id;
                    studentContainer.appendChild(btn);
                });
                item.appendChild(studentContainer); 
                grid.appendChild(item); 
            }
        });
        if(!anyFound) grid.innerHTML = `<p class="card full-width-message">🎉 太棒了！目前沒有任何待辦任務！</p>`;
        showModal('taskBoard');
    }
    
    // ===================================================================================
    // --- 4. BUSINESS LOGIC (主要商業邏輯函式) ---
    // ===================================================================================

    /**
     * 顯示「新增/編輯班級」彈出視窗
     * @param {string | null} classId - 若為編輯模式，則傳入班級ID；新增則為 null
     */
    function showAddEditClassModal(classId = null) {
        const modal = modals.class; 
        modal.dataset.editingId = classId || '';
        const title = modal.querySelector('#class-modal-title');
        const nameInput = modal.querySelector('#class-name-input');
        const listInput = modal.querySelector('#student-list-input');
        const deleteBtn = modal.querySelector('#delete-class-btn');
        
        if (classId) { // 編輯模式
            const cls = appData.classes.find(c => c.id === classId); 
            title.textContent = "編輯班級"; 
            nameInput.value = cls.name; 
            listInput.value = cls.students.map(s => `${s.id} ${s.name}`).join('\n'); 
            deleteBtn.classList.remove('hidden');
        } else { // 新增模式
            title.textContent = "新增班級"; 
            nameInput.value = ''; 
            listInput.value = ''; 
            deleteBtn.classList.add('hidden');
        }
        showModal('class');
    }

    /**
     * 儲存班級（新增或更新）
     */
    function saveClass() {
        const modal = modals.class;
        const name = modal.querySelector('#class-name-input').value.trim();
        const list = modal.querySelector('#student-list-input').value.trim();
        const editingId = modal.dataset.editingId;
        if (!name || !list) return alert('班級名稱和學生名單不能為空！');
        
        // 解析學生名單輸入，可以是純數字（代表人數），也可以是「座號 姓名」的列表
        let newStudents = (!list.includes('\n') && !isNaN(parseInt(list))) 
            ? Array.from({length: parseInt(list)}, (_, i) => ({ id: String(i + 1), name: `${i + 1}號` })) 
            : list.split('\n').map(l => { 
                const p = l.trim().split(/\s+/); 
                return p[0] ? { id: p[0], name: p.slice(1).join(' ') || `${p[0]}號` } : null; 
            }).filter(Boolean);

        if (editingId) { // 更新現有班級
            const cls = appData.classes.find(c => c.id === editingId); 
            cls.name = name;
            // 合併新舊學生名單，保留舊生的分數等資料
            cls.students = newStudents.map(ns => { 
                const es = cls.students.find(s => s.id === ns.id); 
                return { ...(es || { score: 0, group: null, grade: null }), ...ns }; 
            });
        } else { // 建立新班級
            const students = newStudents.map(s => ({...s, score: 0, group: null, grade: null })); 
            const groupCount = 4; // 預設組數
            const groups = Array.from({length: groupCount}, (_, i) => ({id: i+1, score: 0}));
            appData.classes.push({ id: `C${Date.now()}`, name, students, homeworks: [], groupCount, groups }); 
        }
        saveData(); 
        renderDashboard(); 
        closeModal('class');
    }

    /**
     * 顯示「新增/編輯學生」彈出視窗
     * @param {string | null} studentId - 若為編輯模式，則傳入學生ID；新增則為 null
     */
    function showStudentModal(studentId = null) {
        const modal = modals.student; 
        modal.dataset.editingId = studentId || '';
        const title = document.getElementById('student-modal-title');
        const idInput = document.getElementById('student-id-input');
        const nameInput = document.getElementById('student-name-input');
        const deleteBtn = document.getElementById('delete-student-btn');
        if(studentId){ // 編輯模式
            title.textContent = "編輯學生"; 
            const student = getCurrentClass().students.find(s=>s.id === studentId); 
            idInput.value = student.id; 
            idInput.disabled = true; // 編輯模式下座號不可更改
            nameInput.value = student.name; 
            deleteBtn.classList.remove('hidden');
        } else { // 新增模式
            title.textContent = "新增學生"; 
            idInput.value = ''; 
            idInput.disabled = false; 
            nameInput.value = ''; 
            deleteBtn.classList.add('hidden');
        }
        showModal('student');
    }

    /**
     * 儲存學生（新增或更新）
     */
    function saveStudent() {
        const modal = modals.student;
        const studentId = modal.dataset.editingId;
        const id = document.getElementById('student-id-input').value.trim();
        const name = document.getElementById('student-name-input').value.trim();
        if(!id || !name) return alert('座號和姓名不能為空！');
        const cls = getCurrentClass();
        if(studentId){ // 更新現有學生
            const student = cls.students.find(s=>s.id === studentId); 
            student.name = name;
        } else { // 新增學生
            if(cls.students.some(s=>s.id === id)) return alert('座號重複！');
            cls.students.push({id, name, score:0, group:null, grade:null});
            // 同步將新生加入到所有現有作業的狀態列表中
            cls.homeworks.forEach(hw => hw.studentStatus.push({id, status:'pending'}));
        }
        saveData(); 
        renderScoringTab(cls); 
        closeModal('student');
    }

    /**
     * 刪除指定學生
     */
    function deleteStudent() {
        const studentId = modals.student.dataset.editingId;
        if(!studentId || !confirm('確定要永久刪除此學生嗎？所有相關紀錄將被清除。')) return;
        const cls = getCurrentClass();
        // 從學生名單中移除
        cls.students = cls.students.filter(s => s.id !== studentId);
        // 從所有作業的狀態列表中移除
        cls.homeworks.forEach(hw => { 
            hw.studentStatus = hw.studentStatus.filter(ss => ss.id !== studentId); 
        });
        saveData(); 
        renderScoringTab(cls); 
        closeModal('student');
    }

    /**
     * 顯示分數增減的視覺回饋
     * @param {HTMLElement} card - 要顯示回饋的DOM元素 (學生卡片或小組卡片)
     * @param {number} amount - 分數變動量 (正數或負數)
     */
    function showScoreFeedback(card, amount) {
        const feedback = document.createElement('div'); 
        feedback.className = 'ios-feedback';
        const icon = document.createElement('div'); 
        icon.className = 'ios-feedback-icon';
        icon.textContent = amount > 0 ? '＋' : '－';
        icon.classList.add(amount > 0 ? 'feedback-icon-plus' : 'feedback-icon-minus');
        feedback.appendChild(icon); 
        card.appendChild(feedback); 
        // 動畫結束後移除回饋元素
        setTimeout(() => feedback.remove(), 600);
    }

    /**
     * 更新單一學生的分數
     * @param {string} studentId - 學生ID
     * @param {number} amount - 分數變動量
     */
    function updateScore(studentId, amount) {
        const student = getCurrentClass().students.find(s => s.id === studentId);
        if(student) { 
            student.score += amount;
            saveData();
            // 直接更新畫面上的分數，避免重新渲染整個分頁
            const cardElement = document.querySelector(`.student-card[data-student-id="${studentId}"]`);
            if (cardElement) {
                cardElement.querySelector('.student-score').textContent = student.score;
            }
        }
    }

    /**
     * 更新整個小組的個人分數
     * @param {string} groupId - 小組ID
     * @param {number} amount - 分數變動量
     */
    function updateGroupPersonalScore(groupId, amount) {
        const cls = getCurrentClass();
        cls.students.filter(s => s.group == groupId).forEach(s => { s.score += amount; });
        saveData(); 
        renderScoringTab(cls); // 因為多位學生分數變動，直接重渲染計分頁
    }

    /**
     * 更新小組的競賽分數，並即時更新UI
     * @param {string} groupId - 小組ID
     * @param {number} amount - 分數變動量
     */
    function updateGroupCompetitionScore(groupId, amount) {
        const cls = getCurrentClass();
        const group = cls.groups.find(g => g.id == groupId);
        if(group){
            group.score += amount;
            saveData();
            // 即時更新畫面上的分數徽章，不需重刷整個Tab
            const badge = document.querySelector(`.group-score-badge[data-group-id="${groupId}"]`);
            if (badge) {
                badge.innerHTML = `🏆 ${group.score}`;
            }
        }
    }

    /**
     * 根據全班學生的累積淨分，計算對應的平時分數 (T-Score 變形)
     */
    function calculateGrades() {
        const cls = getCurrentClass(); 
        const scores = cls.students.map(s => s.score); 
        const min = Math.min(...scores), max = Math.max(...scores), range = max - min;
        // 分數轉換公式：以最低分為80，最高分為100的區間進行線性轉換
        cls.students.forEach(s => { 
            s.grade = Math.round((range === 0) ? 90 : 80 + ((s.score - min) / range) * 20); 
        });
        saveData(); 
        renderGradesTab(cls);
    }

    /**
     * 重置全班所有學生的個人分數和成績
     */
    function resetScores() { 
        if (confirm('確定重置所有分數？此操作無法復原。')) { 
            getCurrentClass().students.forEach(s => { s.score = 0; s.grade = null; }); 
            saveData(); 
            renderClassView(); 
        }
    }

    /**
     * 處理檔案匯入，讀取 JSON 檔並取代現有資料
     * @param {Event} e - 檔案輸入框的 change 事件
     */
    function loadAllData(e) { 
        const file = e.target.files[0]; 
        if(!file) return; 
        const reader = new FileReader(); 
        reader.onload = (ev) => { 
            try { 
                const data = JSON.parse(ev.target.result); 
                if(Array.isArray(data.classes)) { 
                    if(confirm("確定載入備份檔案？這將會覆蓋所有現有資料！")) { 
                        appData = data; 
                        saveData(); 
                        renderDashboard(); 
                        alert("資料載入成功！"); 
                    } 
                } else alert("檔案格式錯誤，請確認是否為本工具匯出的 .json 檔案。"); 
            } catch { 
                alert("讀取檔案失敗，檔案可能已損毀。"); 
            } 
        };
        reader.readAsText(file); 
        e.target.value = ''; // 清空 input，確保下次選同檔案仍觸發 change 事件
    }

    /**
     * 執行隨機抽籤動畫
     */
    function drawStudent() {
        const pickerWheel = document.getElementById('picker-widget').querySelector('.picker-wheel');
        const btn = document.getElementById('draw-student-btn');
        const cls = getCurrentClass();
        if (!cls || cls.students.length === 0) {
            pickerWheel.innerHTML = `<div class="picker-name">沒有學生</div>`; 
            return;
        }
        btn.disabled = true;
        const students = [...cls.students];
        let list = [];
        // 為了讓滾動動畫看起來更長，複製多組學生名單
        for (let i = 0; i < 5; i++) { 
            list = list.concat(students.sort(() => Math.random() - 0.5)); 
        }
        const winner = students[Math.floor(Math.random() * students.length)];
        list.splice(list.length - 5, 0, winner); // 將中獎者插入到靠近結尾處

        pickerWheel.innerHTML = list.map(s => `<div class="picker-name">${s.name}</div>`).join('');
        pickerWheel.style.transition = 'none'; // 先取消過渡效果，瞬間跳到開頭
        pickerWheel.style.transform = 'translateY(0)';
        
        // 使用 setTimeout 確保瀏覽器有時間渲染初始狀態，然後再開始動畫
        setTimeout(() => {
            pickerWheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            const winnerIndex = list.lastIndexOf(winner);
            const nameHeight = pickerWheel.firstChild.offsetHeight;
            // 計算滾動位置，讓中獎者停在中間
            const position = (winnerIndex * nameHeight) - (pickerWheel.parentElement.offsetHeight / 2) + (nameHeight / 2);
            pickerWheel.style.transform = `translateY(-${position}px)`;
            
            // 動畫結束後才解鎖按鈕
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = "再抽一位";
            }, 4000);
        }, 100);
    }

    /**
     * 重 একাধিক timer
     */
    function resetTimer() { 
        clearInterval(timerInterval); 
        isTimerRunning = false; 
        timeLeftInSeconds = 0; 
        updateTimerDisplay(); 
        const btn = document.getElementById('start-pause-timer-btn'); 
        btn.textContent = '開始'; 
        btn.classList.remove('btn-warning'); 
        btn.classList.add('btn-primary'); 
    }

    /**
     * 更新計時器顯示的畫面
     */
    function updateTimerDisplay() { 
        const mins = Math.floor(timeLeftInSeconds/60).toString().padStart(2,'0'); 
        const secs = (timeLeftInSeconds%60).toString().padStart(2,'0'); 
        document.getElementById('timer-display').textContent = `${mins}:${secs}`; 
    }

    /**
     * 開始或暫停計時器
     */
    function startPauseTimer() { 
        if (timeLeftInSeconds <= 0) return;
        const btn = document.getElementById('start-pause-timer-btn'); 
        isTimerRunning = !isTimerRunning; 
        if(isTimerRunning){ // 開始計時
            btn.textContent='暫停'; 
            btn.classList.replace('btn-primary','btn-warning'); 
            timerInterval = setInterval(() => { 
                timeLeftInSeconds--; 
                updateTimerDisplay(); 
                if(timeLeftInSeconds<=0){ // 時間到
                    clearInterval(timerInterval); 
                    document.getElementById('timer-alarm').play();
                    alert('時間到！'); 
                    resetTimer();
                }
            }, 1000); 
        } else { // 暫停計時
            clearInterval(timerInterval); 
            btn.textContent='繼續'; 
            btn.classList.replace('btn-warning','btn-primary'); 
        } 
    }

    // ===================================================================================
    // --- 5. EVENT LISTENERS (事件監聽) ---
    // ===================================================================================

    /**
     * 主要的點擊事件監聽器 (使用事件委派)
     * 所有點擊事件都由這個監聽器處理，再根據點擊的目標分派到對應的函式
     */
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        // 輔助函式，尋找最近的符合選擇器的父元素
        const closest = (selector) => target.closest(selector);
        // --- 按鈕 ID 快速對應區 ---
        const buttonId = target.id || (closest('.btn') && closest('.btn').id);
        if(buttonId) {
            const actions = {
                'start-grouping-btn': () => {
                    const cls = getCurrentClass();
                    cls.groupingActive = true;
                    saveData();
                    renderGroupingTab(cls);
                },
                'end-grouping-btn': () => {
                    const cls = getCurrentClass();
                    cls.groupingActive = false;
                    // 小組分數歸零
                    cls.groups.forEach(g => g.score = 0);
                    saveData();
                    renderGroupingTab(cls);
                    renderScoringTab(cls);
                },
                'add-class-card': () => showAddEditClassModal(),
                'back-to-dashboard-btn': () => switchScreen('dashboard'),
                'add-homework-btn': () => showModal('homework'),
                'show-task-board-btn': renderTaskBoard,
                'back-to-homework-list-btn': () => renderHomeworkList(getCurrentClass()),
                'delete-homework-btn': () => { 
                    if (confirm('確定刪除作業？')) { 
                        const cls = getCurrentClass(); 
                        cls.homeworks = cls.homeworks.filter(hw => hw.id !== currentHomeworkId); 
                        saveData(); 
                        renderHomeworkList(cls); 
                    } 
                },
                'random-group-btn': () => { 
                    const cls = getCurrentClass(); 
                    const shuffled = [...cls.students].sort(() => 0.5 - Math.random()); 
                    shuffled.forEach((s, i) => s.group = (i % cls.groupCount) + 1); 
                    saveData(); 
                    renderGroupingTab(cls); 
                },
                'calculate-grades-btn': calculateGrades,
                'reset-scores-btn': resetScores,
                'export-grades-btn': () => { 
                    let tsv = "姓名\t淨分\t平時分數\n"; 
                    getCurrentClass().students.forEach(s => { tsv += `${s.name}\t${s.score}\t${s.grade || '-'}\n`; }); 
                    navigator.clipboard.writeText(tsv).then(() => alert('成績已複製到剪貼簿！')); 
                },
                'save-class-btn': saveClass,
                'delete-class-btn': () => { 
                    const id = modals.class.dataset.editingId; 
                    if (confirm('確定刪除班級？此操作無法復原。')) { 
                        appData.classes = appData.classes.filter(c => c.id !== id); 
                        saveData(); 
                        renderDashboard(); 
                        closeModal('class'); 
                    } 
                },
                'cancel-class-modal-btn': () => closeModal('class'),
                'confirm-add-homework-btn': () => { 
                    const title = document.getElementById('homework-title-input').value.trim(); 
                    if (!title) return; 
                    const cls = getCurrentClass(); 
                    cls.homeworks.unshift({
                        id: `H${Date.now()}`, 
                        title, 
                        date: new Date().toLocaleDateString('zh-TW'), 
                        studentStatus: cls.students.map(s => ({ id: s.id, status: 'pending' })) 
                    }); 
                    saveData(); 
                    renderHomeworkList(cls); 
                    closeModal('homework'); 
                },
                'cancel-add-homework-btn': () => closeModal('homework'),
                'export-data-btn': () => { 
                    const a = document.createElement('a'); 
                    a.href = URL.createObjectURL(new Blob([JSON.stringify(appData)], {type:'application/json'}));
                    a.download = `班級動力站_備份_${new Date().toISOString().slice(0,10)}.json`; 
                    a.click(); 
                    URL.revokeObjectURL(a.href); 
                },
                'load-data-btn': () => document.getElementById('file-input').click(),
                'show-export-student-modal-btn': () => { 
                    const cls = getCurrentClass(); 
                    const dd = document.getElementById('student-select-dropdown'); 
                    dd.innerHTML = '<option value="">-- 請選擇學生 --</option>'; 
                    cls.students.sort((a,b)=>a.id-b.id).forEach(s => dd.innerHTML += `<option value="${s.id}">${s.id}. ${s.name}</option>`); 
                    document.getElementById('single-student-export-content').value = ''; 
                    showModal('studentExport'); 
                },
                'copy-single-student-export-btn': () => {
                    navigator.clipboard.writeText(document.getElementById('single-student-export-content').value).then(() => alert('已複製到剪貼簿！'));
                },
                'close-export-student-modal-btn': () => closeModal('studentExport'),
                'open-timer-tool-btn': () => toggleToolWidget('timer'),
                'open-picker-tool-btn': () => toggleToolWidget('picker'),
                'start-pause-timer-btn': startPauseTimer,
                'reset-timer-btn': resetTimer,
                'draw-student-btn': drawStudent,
                'add-student-btn': () => showStudentModal(),
                'save-student-btn': saveStudent,
                'cancel-student-btn': () => closeModal('student'),
                'delete-student-btn': deleteStudent,
                'close-task-board-btn': () => { 
                    closeModal('taskBoard'); 
                    renderHomeworkList(getCurrentClass()); 
                },
                'show-podium-btn': renderPodiumModal,
                'close-podium-btn': () => closeModal('podium'),
            };
            if(actions[buttonId]) { 
                actions[buttonId](); 
                return; // 執行完畢後返回，避免觸發後續的 class 判斷
            }
        }
        
        // --- 其他 class-based 的事件委派 ---
        if (closest('.class-card')) { 
            currentClassId = closest('.class-card').dataset.id; 
            renderClassView(); 
        }
        else if (closest('.nav-tab')) { 
            switchTab(closest('.nav-tab').dataset.tab);
        }
        else if (closest('.group-score-btn')) {
            // 分組進行中才可用
            const groupCard = closest('.group-column');
            const groupId = groupCard.dataset.groupId;
            const amount = parseInt(closest('.group-score-btn').dataset.amount);
            const cls = getCurrentClass();
            if (cls.groupingActive) {
                // 小組分數
                const group = cls.groups.find(g => g.id == groupId);
                if (group) group.score += amount;
                // 組內所有學生分數
                cls.students.filter(s => s.group == groupId).forEach(s => s.score += amount);
                saveData();
                renderGroupingTab(cls);
                renderScoringTab(cls); // 同步更新個人分數頁
            }
            showScoreFeedback(groupCard, amount);
        }
        else if (closest('.score-btn')) {
            // 個人分數加減（非分組模式）
            const amount = parseInt(closest('.score-btn').dataset.amount);
            const studentCard = closest('.student-card');
            if (studentCard) {
                updateScore(studentCard.dataset.studentId, amount);
                showScoreFeedback(studentCard, amount);
            }
        }
        else if (closest('.edit-student-btn')) { 
            e.stopPropagation(); // 防止觸發父層 .student-card 的點擊事件
            showStudentModal(closest('.student-card').dataset.studentId); 
        }
        else if (closest('.homework-card')) { 
            currentHomeworkId = closest('.homework-card').dataset.id; 
            renderHomeworkTracking(); 
        }
        else if (closest('.student-status-item')) { 
            const hw = getCurrentClass().homeworks.find(h => h.id === currentHomeworkId); 
            const s = hw.studentStatus.find(s => s.id === closest('.student-status-item').dataset.id); 
            if(s){ // 循環切換作業狀態
                s.status = STATUS_ORDER[(STATUS_ORDER.indexOf(s.status)+1)%4]; 
                saveData(); 
                renderHomeworkTracking(); 
            }
        }
        else if (closest('.timer-presets .btn')) { 
            timeLeftInSeconds = parseInt(closest('.btn').dataset.minutes) * 60;
            updateTimerDisplay(); 
        }
        else if (target.id === 'timer-display') { 
            const time = prompt('請輸入時間 (分:秒)，例如 5:30', '5:00'); 
            if(time && time.includes(':')) { 
                const parts = time.split(':'); 
                timeLeftInSeconds = (parseInt(parts[0])*60) + parseInt(parts[1]); 
                updateTimerDisplay(); 
            } 
        }
        else if (closest('.student-task-btn')) {
            const { studentId, homeworkId } = closest('.student-task-btn').dataset;
            const cls = getCurrentClass(); 
            const student = cls.students.find(s => s.id === studentId);
            const homework = cls.homeworks.find(hw => hw.id === homeworkId); 
            const status = homework.studentStatus.find(s => s.id === studentId);
            if(confirm(`${student.name}，確定要完成「${homework.title}」嗎？`)){
                status.status = status.status === 'pending' ? 'submitted' : 'completed';
                saveData(); 
                renderTaskBoard();
            }
        }
        else if(!closest('.side-tools-container') && !closest('.tool-widget')) { 
            // 點擊側邊工具以外的區域，關閉所有工具
            Object.values(toolWidgets).forEach(w => w.classList.remove('active')); 
        }
    });
    
    /**
     * 監聽檔案上傳 input 的變動
     */
    document.getElementById('file-input').addEventListener('change', (e) => loadAllData(e));
    
    /**
     * 監聽「匯出個別學生報告」彈窗中的學生下拉選單
     */
    document.getElementById('student-select-dropdown').addEventListener('change', () => { 
        const id = document.getElementById('student-select-dropdown').value; 
        const ta = document.getElementById('single-student-export-content'); 
        if(!id) { 
            ta.value=''; 
            return; 
        } 
        const cls = getCurrentClass();
        const si = cls.students.find(s=>s.id===id); 
        let tasks = []; 
        cls.homeworks.forEach(hw => { 
            const ss = hw.studentStatus.find(s=>s.id===id); 
            if(['pending', 'needs_correction'].includes(ss.status)) { 
                tasks.push(`- ${hw.title} (${STATUS_TEXT[ss.status]})`); 
            } 
        }); 
        ta.value = `--- ${si.name} 的未完成項目 ---

` + (tasks.length ? tasks.join('\n') : "🎉 恭喜！沒有未完成項目！"); 
    });

    /**
     * 監聽「分組模式」中的組數 input 變動
     */
    document.addEventListener('change', (e) => { 
        if(e.target.id === 'group-count-input') { 
            const cls = getCurrentClass(); 
            cls.groupCount = parseInt(e.target.value); 
            // 重建小組資料結構
            cls.groups = Array.from({length: cls.groupCount}, (_, i) => ({id: i+1, score: 0})); 
            saveData(); 
            renderGroupingTab(cls); 
        }
    });

    // --- Drag and Drop Listeners (拖曳功能監聽) ---
    document.addEventListener('dragstart', (e) => { 
        const cls = getCurrentClass();
        if (cls && cls.groupingActive) return; // 禁用拖曳
        if(e.target.matches('.student-chip')) { 
            draggedStudentId = e.target.dataset.studentId; 
        } 
    });

    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('dragover', (e) => {
        const cls = getCurrentClass();
        if (cls && cls.groupingActive) return;
        e.preventDefault();
    });

    document.addEventListener('drop', (e) => { 
        const cls = getCurrentClass();
        if (cls && cls.groupingActive) return; // 禁用拖曳
        const col = e.target.closest('.group-column, #unassigned-students-column'); 
        if(col) { 
            const gId = col.id==='unassigned-students-column' ? null : parseInt(col.dataset.groupId); 
            const s = getCurrentClass().students.find(st=>st.id===draggedStudentId); 
            if(s) { 
                s.group=gId; // 更新學生資料中的組別
                saveData(); 
                renderGroupingTab(getCurrentClass()); // 重新渲染分組畫面
            }
        }
    });
    
    // ===================================================================================
    // --- INIT (應用程式初始化) ---
    // ===================================================================================
    loadData(); 
    renderDashboard(); 
    switchScreen('dashboard');
});
