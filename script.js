// === КОНФИГУРАЦИЯ FIREBASE ===
const firebaseConfig = {
    apiKey: "AIzaSyA1gMGXixXqfgptc0-Nx5fRWCbS2lefXLY",
    authDomain: "global-elite-club-dcd0d.firebaseapp.com",
    projectId: "global-elite-club-dcd0d",
    storageBucket: "global-elite-club-dcd0d.firebasestorage.app",
    messagingSenderId: "372974979606",
    appId: "1:372974979606:web:b3128f5165621e5fbc4337",
    measurementId: "G-3MTEVE62XT"
};

// Инициализируем Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Константы
const students = [
    "Alina", "Artem", "Dania", "Denis", "Lera", "Nastia Che", 
    "Nastia S", "Natasha", "Rita", "Selin", "Vika"
];

// Хранилища данных
let studentWords = {};
let studentWorks = {};
let studentNames = {};
let additionalWorks = {};
let totalPoints = {};
let currentSelectedStudent = null;
let currentWordIndexes = {};
let helpSections = {};
let currentEditingSectionId = null;
let isHelpAdminMode = false;
let currentSelectedWeek = null;

// ==================== ОБЩИЕ ФУНКЦИИ ====================

// Функция обновления статуса синхронизации
function updateSyncStatus(message, isSuccess = true) {
    const statusElement = document.getElementById('syncStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = isSuccess ? '#00ff00' : '#ff4444';
        statusElement.style.textShadow = isSuccess ? '0 0 5px rgba(0, 255, 0, 0.7)' : '0 0 5px rgba(255, 68, 68, 0.7)';
    }
}

// Получение номера недели
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Получение ID текущей недели
function getCurrentWeekId() {
    const today = new Date();
    const year = today.getFullYear();
    const week = getWeekNumber(today);
    return `${year}-W${week.toString().padStart(2, '0')}`;
}

// Форматирование даты
function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
        return '';
    }
}

// ==================== ЗАГРУЗКА ВСЕХ ДАННЫХ ====================

async function loadAllData() {
    try {
        updateSyncStatus('🔄 Загрузка данных...');
        
        // Загружаем слова
        const wordsSnapshot = await db.collection('words').get();
        studentWords = {};
        wordsSnapshot.forEach(doc => {
            studentWords[doc.id] = doc.data().words || [];
        });
        
        // Загружаем работы
        const worksSnapshot = await db.collection('works').get();
        studentWorks = {};
        worksSnapshot.forEach(doc => {
            studentWorks[doc.id] = doc.data();
        });

        // Загружаем имена для рейтингов
        const namesSnapshot = await db.collection('ratingNames').get();
        studentNames = {};
        namesSnapshot.forEach(doc => {
            studentNames[doc.id] = doc.data().name;
        });

        // Загружаем дополнительные работы
        const additionalSnapshot = await db.collection('additionalWorks').get();
        additionalWorks = {};
        additionalSnapshot.forEach(doc => {
            additionalWorks[doc.id] = doc.data().works || [];
        });
        
        // Загружаем очки за все время
        const totalPointsSnapshot = await db.collection('totalPoints').get();
        totalPoints = {};
        totalPointsSnapshot.forEach(doc => {
            totalPoints[doc.id] = doc.data().points || 0;
        });
        
        // Загружаем разделы помощи
        await loadHelpSections();
        
        updateSyncStatus('✅ Данные загружены');
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        updateSyncStatus('❌ Ошибка загрузки', false);
        
        // Fallback на localStorage
        studentWords = JSON.parse(localStorage.getItem('studentWords')) || {};
        studentWorks = JSON.parse(localStorage.getItem('studentWorks')) || {};
        studentNames = JSON.parse(localStorage.getItem('studentNames')) || {};
        additionalWorks = JSON.parse(localStorage.getItem('additionalWorks')) || {};
        totalPoints = JSON.parse(localStorage.getItem('totalPoints')) || {};
        helpSections = JSON.parse(localStorage.getItem('helpSections')) || {};
    }
    
    // Обновляем интерфейс
    initializeWeekRating();
    initializeTotalRating();
    initializeStudentsGrid();
}

// ==================== РЕЙТИНГ ЗА НЕДЕЛЮ ====================

async function initializeWeekRating(weekId = null) {
    const weekRatingContainer = document.getElementById('weekRatingContainer');
    if (!weekRatingContainer) return;
    
    if (!weekId) {
        weekId = currentSelectedWeek || getCurrentWeekId();
    }
    
    currentSelectedWeek = weekId;
    
    const weekDates = getWeekDates(weekId);
    const weekPeriod = `${weekDates.start} - ${weekDates.end}`;
    
    try {
        const doc = await db.collection('weekRankings').doc(weekId).get();
        
        let html = `
            <div class="rating-header">
                <div class="rating-title week">🏆 Рейтинг за неделю</div>
                <div class="rating-period">Неделя: ${weekPeriod}</div>
            </div>
        `;
        
        if (!doc.exists) {
            html += '<div class="no-data">Нет данных за эту неделю</div>';
        } else {
            const data = doc.data();
            const weekPoints = data.weekPoints || {};
            
            const studentsWithWeekPoints = students.map(student => ({
                name: student,
                points: weekPoints[student] || 0,
                avatar: `avatars/${student}.png`
            }));
            
            studentsWithWeekPoints.sort((a, b) => b.points - a.points);
            const studentsWithPoints = studentsWithWeekPoints.filter(s => s.points > 0);
            
            if (studentsWithPoints.length === 0) {
                html += '<div class="no-data">Нет данных за эту неделю</div>';
            } else {
                studentsWithPoints.forEach((studentData, index) => {
                    const isTopThree = index < 3;
                    const itemClass = `rating-item week ${isTopThree ? 'top-three' : ''}`;
                    const avatarClass = `rating-avatar week ${isTopThree ? 'top-three' : ''}`;
                    
                    html += `
                        <div class="${itemClass}">
                            <img src="${studentData.avatar}" alt="${studentData.name}" class="${avatarClass}" 
                                 onerror="this.src='avatars/default.png'">
                            <div class="rating-info">
                                <div class="rating-name">${studentData.name}</div>
                                <div class="rating-position">Место: ${index + 1}</div>
                            </div>
                            <div class="rating-score week">${studentData.points}</div>
                        </div>
                    `;
                });
            }
        }
        
        weekRatingContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка загрузки рейтинга недели:', error);
        weekRatingContainer.innerHTML = `
            <div class="rating-header">
                <div class="rating-title week">🏆 Рейтинг за неделю</div>
                <div class="rating-period">Ошибка загрузки</div>
            </div>
            <div class="no-data" style="color: #ff4444;">Ошибка загрузки данных</div>
        `;
    }
}

// Получение дат недели
function getWeekDates(weekId) {
    const [year, weekStr] = weekId.split('-W');
    const week = parseInt(weekStr);
    
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    
    const startDate = new Date(year, 0, daysOffset);
    const endDate = new Date(year, 0, daysOffset + 6);
    
    const formatDate = (date) => {
        return date.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    };
    
    return {
        start: formatDate(startDate),
        end: formatDate(endDate)
    };
}

// ==================== РЕЙТИНГ ЗА ВСЕ ВРЕМЯ ====================

async function initializeTotalRating() {
    const totalRatingContainer = document.getElementById('totalRatingContainer');
    if (!totalRatingContainer) return;
    
    try {
        const totalPointsSnapshot = await db.collection('totalPoints').get();
        const pointsMap = {};
        
        totalPointsSnapshot.forEach(doc => {
            pointsMap[doc.id] = doc.data().points || 0;
        });
        
        const studentsWithTotalPoints = students.map(student => ({
            name: student,
            points: pointsMap[student] || 0,
            avatar: `avatars/${student}.png`
        }));
        
        studentsWithTotalPoints.sort((a, b) => b.points - a.points);
        
        let html = `
            <div class="rating-header">
                <div class="rating-title total">⭐ Рейтинг за все время</div>
                <div class="rating-period">Сумма очков за все недели</div>
            </div>
        `;
        
        if (studentsWithTotalPoints.every(s => s.points === 0)) {
            html += '<div class="no-data">Нет данных за все время</div>';
        } else {
            studentsWithTotalPoints.forEach((studentData, index) => {
                if (studentData.points === 0) return;
                
                const isTopThree = index < 3;
                const itemClass = `rating-item total ${isTopThree ? 'top-three' : ''}`;
                const avatarClass = `rating-avatar total ${isTopThree ? 'top-three' : ''}`;
                
                html += `
                    <div class="${itemClass}">
                        <img src="${studentData.avatar}" alt="${studentData.name}" class="${avatarClass}"
                             onerror="this.src='avatars/default.png'">
                        <div class="rating-info">
                            <div class="rating-name">${studentData.name}</div>
                            <div class="rating-position">Место: ${index + 1}</div>
                        </div>
                        <div class="rating-score total">${studentData.points}</div>
                    </div>
                `;
            });
        }
        
        totalRatingContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка загрузки общего рейтинга:', error);
        totalRatingContainer.innerHTML = `
            <div class="rating-header">
                <div class="rating-title total">⭐ Рейтинг за все время</div>
                <div class="rating-period">Сумма очков за все недели</div>
            </div>
            <div class="no-data" style="color: #ff4444;">Ошибка загрузки данных</div>
        `;
    }
}

// ==================== АДМИНКА (РЕЙТИНГИ) ====================

function initializeAdminPage() {
    const weekInput = getCurrentWeekId();
    const weekSelector = document.getElementById('weekSelector');
    if (weekSelector) {
        weekSelector.value = weekInput;
    }
    
    generateRankingInputs();
    loadWeekRankings(weekInput);
}

function generateRankingInputs() {
    const speedContainer = document.getElementById('speedRankings');
    const accuracyContainer = document.getElementById('accuracyRankings');
    
    if (!speedContainer || !accuracyContainer) return;
    
    speedContainer.innerHTML = '';
    accuracyContainer.innerHTML = '';
    
    for (let i = 1; i <= 11; i++) {
        const points = 12 - i;
        
        // Позиция для скорости
        const speedGroup = document.createElement('div');
        speedGroup.className = 'ranking-input-group';
        speedGroup.innerHTML = `
            <div class="ranking-position">${i}</div>
            <select class="ranking-select" id="speed_${i}" onchange="calculateTotals()">
                <option value="">Выберите ученика</option>
                ${students.map(student => `<option value="${student}">${student}</option>`).join('')}
            </select>
            <div class="ranking-points">${points}</div>
        `;
        speedContainer.appendChild(speedGroup);
        
        // Позиция для точности
        const accuracyGroup = document.createElement('div');
        accuracyGroup.className = 'ranking-input-group';
        accuracyGroup.innerHTML = `
            <div class="ranking-position">${i}</div>
            <select class="ranking-select" id="accuracy_${i}" onchange="calculateTotals()">
                <option value="">Выберите ученика</option>
                ${students.map(student => `<option value="${student}">${student}</option>`).join('')}
            </select>
            <div class="ranking-points">${points}</div>
        `;
        accuracyContainer.appendChild(accuracyGroup);
    }
}

function calculateTotals() {
    let speedTotal = 0;
    let accuracyTotal = 0;
    
    for (let i = 1; i <= 11; i++) {
        const speedSelect = document.getElementById(`speed_${i}`);
        if (speedSelect && speedSelect.value) {
            speedTotal += (12 - i);
        }
        
        const accuracySelect = document.getElementById(`accuracy_${i}`);
        if (accuracySelect && accuracySelect.value) {
            accuracyTotal += (12 - i);
        }
    }
    
    const speedTotalEl = document.getElementById('speedTotal');
    const accuracyTotalEl = document.getElementById('accuracyTotal');
    const weekTotalEl = document.getElementById('weekTotal');
    
    if (speedTotalEl) speedTotalEl.textContent = speedTotal;
    if (accuracyTotalEl) accuracyTotalEl.textContent = accuracyTotal;
    if (weekTotalEl) weekTotalEl.textContent = speedTotal + accuracyTotal;
}

async function loadWeekRankings(weekId) {
    try {
        const doc = await db.collection('weekRankings').doc(weekId).get();
        if (doc.exists) {
            const data = doc.data();
            
            for (const [position, student] of Object.entries(data.speed || {})) {
                const select = document.getElementById(`speed_${position}`);
                if (select) select.value = student;
            }
            
            for (const [position, student] of Object.entries(data.accuracy || {})) {
                const select = document.getElementById(`accuracy_${position}`);
                if (select) select.value = student;
            }
            
            calculateTotals();
        }
    } catch (error) {
        console.error('Ошибка загрузки рейтингов недели:', error);
    }
}

async function updateTotalPoints(weekPoints) {
    const batch = db.batch();
    
    for (const [student, points] of Object.entries(weekPoints)) {
        const studentRef = db.collection('totalPoints').doc(student);
        const doc = await studentRef.get();
        
        if (doc.exists) {
            const currentPoints = doc.data().points || 0;
            batch.update(studentRef, { points: currentPoints + points });
        } else {
            batch.set(studentRef, { points: points });
        }
    }
    
    await batch.commit();
}

async function saveWeekRankings() {
    const weekSelector = document.getElementById('weekSelector');
    if (!weekSelector) return;
    
    const weekId = weekSelector.value;
    if (!weekId) {
        alert('Выберите неделю!');
        return;
    }
    
    const speedRankings = {};
    const accuracyRankings = {};
    const weekPoints = {};
    
    for (let i = 1; i <= 11; i++) {
        const speedSelect = document.getElementById(`speed_${i}`);
        if (speedSelect && speedSelect.value) {
            speedRankings[i] = speedSelect.value;
            const points = 12 - i;
            weekPoints[speedSelect.value] = (weekPoints[speedSelect.value] || 0) + points;
        }
        
        const accuracySelect = document.getElementById(`accuracy_${i}`);
        if (accuracySelect && accuracySelect.value) {
            accuracyRankings[i] = accuracySelect.value;
            const points = 12 - i;
            weekPoints[accuracySelect.value] = (weekPoints[accuracySelect.value] || 0) + points;
        }
    }
    
    if (Object.keys(speedRankings).length !== 11 || Object.keys(accuracyRankings).length !== 11) {
        if (!confirm('Не все позиции заполнены. Сохранить частичные данные?')) {
            return;
        }
    }
    
    try {
        await db.collection('weekRankings').doc(weekId).set({
            speed: speedRankings,
            accuracy: accuracyRankings,
            weekPoints: weekPoints,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await updateTotalPoints(weekPoints);
        
        updateSyncStatus('✅ Результаты недели сохранены');
        alert(`Результаты недели ${weekId} успешно сохранены!`);
        
        initializeWeekRating(weekId);
        initializeTotalRating();
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        updateSyncStatus('❌ Ошибка сохранения', false);
        alert('Ошибка сохранения: ' + error.message);
    }
}

function clearWeekRankings() {
    if (confirm('Очистить все выбранные значения?')) {
        for (let i = 1; i <= 11; i++) {
            const speedSelect = document.getElementById(`speed_${i}`);
            const accuracySelect = document.getElementById(`accuracy_${i}`);
            
            if (speedSelect) speedSelect.value = '';
            if (accuracySelect) accuracySelect.value = '';
        }
        calculateTotals();
    }
}

// ==================== СЛОВА ====================

async function saveWords(studentName, wordsArray) {
    try {
        await db.collection('words').doc(studentName).set({
            words: wordsArray,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        studentWords[studentName] = wordsArray;
        updateSyncStatus('✅ Слова сохранены');
    } catch (error) {
        console.error('Ошибка сохранения слов:', error);
        studentWords[studentName] = wordsArray;
        localStorage.setItem('studentWords', JSON.stringify(studentWords));
    }
}

async function addNewWord(studentName, word) {
    const words = studentWords[studentName] || [];
    if (word.trim() && !words.includes(word.trim())) {
        words.push(word.trim());
        await saveWords(studentName, words);
        if (currentSelectedStudent === studentName) {
            initializeStudentWorks(studentName);
        }
        initializeStudentsGrid();
    }
}

async function removeCurrentWord(studentName) {
    const words = studentWords[studentName] || [];
    if (words.length > 0) {
        const currentIndex = currentWordIndexes[studentName] || 0;
        if (currentIndex >= 0 && currentIndex < words.length) {
            if (confirm(`Удалить слово "${words[currentIndex]}"?`)) {
                words.splice(currentIndex, 1);
                await saveWords(studentName, words);
                if (currentSelectedStudent === studentName) {
                    initializeStudentWorks(studentName);
                }
                initializeStudentsGrid();
            }
        }
    }
}

// ==================== РАБОТЫ ====================

function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            try {
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                const base64Size = Math.round((compressedBase64.length * 3) / 4);
                
                resolve({
                    data: compressedBase64,
                    originalSize: file.size,
                    compressedSize: base64Size,
                    width: width,
                    height: height
                });
            } catch (error) {
                reject(new Error('Ошибка сжатия изображения'));
            }
        };
        
        img.onerror = function() {
            reject(new Error('Ошибка загрузки изображения'));
        };
        
        img.src = URL.createObjectURL(file);
    });
}

async function saveWork(student, workType, imageBase64, compressionInfo = '') {
    const workKey = `${student}_${workType}`;
    try {
        await db.collection('works').doc(workKey).set({
            image: imageBase64,
            student: student,
            workType: workType,
            compressionInfo: compressionInfo,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        studentWorks[workKey] = {
            image: imageBase64,
            compressionInfo: compressionInfo,
            timestamp: new Date().toISOString()
        };
        updateSyncStatus('✅ Работа сохранена');
    } catch (error) {
        console.error('Ошибка сохранения работы:', error);
        studentWorks[workKey] = {
            image: imageBase64,
            compressionInfo: compressionInfo,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('studentWorks', JSON.stringify(studentWorks));
    }
}

async function handleWorkUpload(input, student, workType) {
    const file = input.files[0];
    if (file && file.type.startsWith('image/')) {
        try {
            updateSyncStatus('🔄 Проверка изображения...');
            
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Файл слишком большой. Максимум 10MB');
            }
            
            updateSyncStatus('🔄 Сжатие изображения...');
            
            let compressionResult = await compressImage(file, 1200, 0.8);
            
            if (compressionResult.compressedSize > 900000) {
                updateSyncStatus('🔄 Дополнительное сжатие...');
                compressionResult = await compressImage(file, 800, 0.6);
            }
            
            if (compressionResult.compressedSize > 950000) {
                throw new Error('Изображение слишком детализированное после сжатия. Попробуйте другое изображение');
            }
            
            const compressionInfo = `Сжато: ${(compressionResult.originalSize/1024/1024).toFixed(1)}MB → ${(compressionResult.compressedSize/1024/1024).toFixed(1)}MB (${compressionResult.width}×${compressionResult.height})`;
            
            await saveWork(student, workType, compressionResult.data, compressionInfo);
            if (currentSelectedStudent === student) {
                initializeStudentWorks(student);
            }
            updateSyncStatus('✅ Изображение загружено!');
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            updateSyncStatus('❌ Ошибка: ' + error.message, false);
            alert('Ошибка загрузки: ' + error.message);
        }
    } else {
        alert('Пожалуйста, выберите файл изображения (JPEG, PNG)');
    }
}

async function deleteWork(student, workType) {
    const workKey = `${student}_${workType}`;
    if (confirm('Вы уверены, что хотите удалить эту работу?')) {
        try {
            await db.collection('works').doc(workKey).delete();
            delete studentWorks[workKey];
            if (currentSelectedStudent === student) {
                initializeStudentWorks(student);
            }
            updateSyncStatus('✅ Работа удалена');
            
        } catch (error) {
            console.error('Ошибка удаления:', error);
            delete studentWorks[workKey];
            localStorage.setItem('studentWorks', JSON.stringify(studentWorks));
            if (currentSelectedStudent === student) {
                initializeStudentWorks(student);
            }
            updateSyncStatus('✅ Работа удалена (локально)');
        }
    }
}

// ==================== ИНТЕРФЕЙС УЧЕНИКОВ ====================

function initializeStudentsGrid() {
    const studentsGrid = document.getElementById('studentsGrid');
    if (!studentsGrid) return;
    
    studentsGrid.innerHTML = '';
    
    students.forEach(student => {
        const words = studentWords[student] || [];
        const card = document.createElement('div');
        card.className = `student-card ${currentSelectedStudent === student ? 'active' : ''}`;
        card.innerHTML = `
            <div class="student-card-name">${student}</div>
            <div class="student-card-words">${words.length} words</div>
        `;
        card.onclick = () => openStudentWorks(student);
        studentsGrid.appendChild(card);
    });
}

function openStudentWorks(student) {
    currentSelectedStudent = student;
    initializeStudentsGrid();
    initializeStudentWorks(student);
    
    const section = document.getElementById('studentWorksSection');
    if (section) {
        section.classList.add('active');
        const selectedStudentName = document.getElementById('selectedStudentName');
        if (selectedStudentName) {
            selectedStudentName.textContent = student;
        }
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function initializeStudentWorks(student) {
    const worksList = document.getElementById('worksList');
    if (!worksList) return;
    
    worksList.innerHTML = '';
    
    const workItem = document.createElement('div');
    workItem.className = 'work-item';
    
    workItem.innerHTML = `
        <div class="words-container">
            ${createWordsSection(student)}
        </div>
        <div class="works-container">
            <div class="works-category">
                <div class="category-title">Основные работы</div>
                <div class="works-row">
                    <div class="upload-areas">
                        ${createWorkArea(student, 'work1')}
                        ${createWorkArea(student, 'work2')}
                        ${createWorkArea(student, 'work3')}
                    </div>
                </div>
                <button class="add-work-btn" onclick="toggleAdditionalWorks('${student}', 'work')">+</button>
                <div class="additional-works" id="additionalWorks_${student}_work">
                    ${createAdditionalWorks(student, 'work')}
                </div>
            </div>
            <div class="works-category">
                <div class="category-title">Проверки</div>
                <div class="works-row">
                    <div class="upload-areas">
                        ${createWorkArea(student, 'check1')}
                        ${createWorkArea(student, 'check2')}
                        ${createWorkArea(student, 'check3')}
                    </div>
                </div>
                <button class="add-work-btn" onclick="toggleAdditionalWorks('${student}', 'check')">+</button>
                <div class="additional-works" id="additionalWorks_${student}_check">
                    ${createAdditionalWorks(student, 'check')}
                </div>
            </div>
            <div class="works-category">
                <div class="category-title">Ваши объяснения</div>
                <div class="works-row">
                    <div class="upload-areas">
                        ${createWorkArea(student, 'explain1')}
                        ${createWorkArea(student, 'explain2')}
                        ${createWorkArea(student, 'explain3')}
                    </div>
                </div>
                <button class="add-work-btn" onclick="toggleAdditionalWorks('${student}', 'explain')">+</button>
                <div class="additional-works" id="additionalWorks_${student}_explain">
                    ${createAdditionalWorks(student, 'explain')}
                </div>
            </div>
        </div>
    `;
    
    worksList.appendChild(workItem);
}

function createWordsSection(student) {
    const words = studentWords[student] || [];
    const hasWords = words.length > 0;
    const currentIndex = currentWordIndexes[student] || 0;
    
    return `
        <div class="words-counter">
            ${words.length} words
        </div>
        <div class="words-display-container">
            <div class="word-navigation">
                <button class="nav-arrow" onclick="navigateWord('${student}', -1)" ${words.length <= 1 ? 'disabled' : ''}>◀</button>
                <div class="current-word-display">
                    ${hasWords ? 
                        `<div class="word-text">${words[currentIndex]}</div>
                         <button class="delete-word-btn" onclick="removeCurrentWord('${student}')" title="Удалить слово">🗑️ Удалить</button>
                         <div class="word-counter">${currentIndex + 1}</div>` 
                        : '<div class="no-words">No words added</div>'
                    }
                </div>
                <button class="nav-arrow" onclick="navigateWord('${student}', 1)" ${words.length <= 1 ? 'disabled' : ''}>▶</button>
            </div>
        </div>
        <div class="word-input-container">
            <input 
                type="text" 
                class="word-input" 
                id="wordInput_${student}"
                placeholder="Add word"
                onkeypress="handleWordInput(event, '${student}')"
            >
        </div>
    `;
}

function handleWordInput(event, student) {
    if (event.key === 'Enter') {
        const input = event.target;
        const word = input.value.trim();
        if (word) {
            addNewWord(student, word).then(() => {
                input.value = '';
                setTimeout(() => {
                    input.focus();
                }, 0);
            });
        }
        event.preventDefault();
    }
}

function navigateWord(student, direction) {
    const words = studentWords[student] || [];
    if (words.length === 0) return;
    
    if (!currentWordIndexes.hasOwnProperty(student)) {
        currentWordIndexes[student] = 0;
    }
    
    let newIndex = currentWordIndexes[student] + direction;
    
    if (newIndex < 0) newIndex = words.length - 1;
    if (newIndex >= words.length) newIndex = 0;
    
    currentWordIndexes[student] = newIndex;
    
    const displayElement = document.querySelector(`[onkeypress="handleWordInput(event, '${student}')"]`)
        ?.closest('.words-container')
        ?.querySelector('.current-word-display');
        
    if (displayElement) {
        displayElement.innerHTML = `
            <div class="word-text">${words[newIndex]}</div>
            <button class="delete-word-btn" onclick="removeCurrentWord('${student}')" title="Удалить слово">🗑️ Удалить</button>
            <div class="word-counter">${newIndex + 1}</div>
        `;
    }
}

function createWorkArea(student, workType) {
    const workKey = `${student}_${workType}`;
    const workData = studentWorks[workKey];
    
    if (workData && workData.image) {
        const compressionInfo = workData.compressionInfo ? `<div class="compression-info">${workData.compressionInfo}</div>` : '';
        const timestamp = workData.timestamp ? formatDate(workData.timestamp) : '';
        
        return `
            <div class="upload-area has-work">
                <img src="${workData.image}" class="work-preview" alt="${workType}" onclick="openFullscreen('${workData.image}')">
                <div class="work-number">${getWorkTitle(workType)}</div>
                ${compressionInfo}
                <div class="upload-time">${timestamp}</div>
                <button class="delete-btn" onclick="deleteWork('${student}', '${workType}')">🗑️ Удалить</button>
                <input type="file" class="file-input" accept="image/*" onchange="handleWorkUpload(this, '${student}', '${workType}')">
            </div>
        `;
    } else {
        return `
            <div class="upload-area" onclick="triggerWorkUpload(this, '${student}', '${workType}')">
                <div class="work-number">${getWorkTitle(workType)}</div>
                <div class="upload-text">Нажмите для загрузки</div>
                <div class="compression-info">Поддерживаются файлы до 10MB</div>
                <input type="file" class="file-input" accept="image/*" onchange="handleWorkUpload(this, '${student}', '${workType}')">
            </div>
        `;
    }
}

function getWorkTitle(workType) {
    if (workType.startsWith('work') && workType.length > 4) {
        const num = workType.substring(4);
        return `Работа ${num}`;
    }
    if (workType.startsWith('check') && workType.length > 5) {
        const num = workType.substring(5);
        return `Проверка ${num}`;
    }
    if (workType.startsWith('explain') && workType.length > 7) {
        const num = workType.substring(7);
        return `Объяснение ${num}`;
    }
    
    const titles = {
        'work1': 'Работа 1', 'work2': 'Работа 2', 'work3': 'Работа 3',
        'check1': 'Проверка 1', 'check2': 'Проверка 2', 'check3': 'Проверка 3',
        'explain1': 'Объяснение 1', 'explain2': 'Объяснение 2', 'explain3': 'Объяснение 3'
    };
    return titles[workType] || workType;
}

function triggerWorkUpload(areaElement, student, workType) {
    const fileInput = areaElement.querySelector('.file-input');
    if (fileInput) {
        fileInput.click();
    }
}

// ==================== ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ ====================

async function saveAdditionalWorks(studentName, worksArray) {
    try {
        await db.collection('additionalWorks').doc(studentName).set({
            works: worksArray,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        additionalWorks[studentName] = worksArray;
        updateSyncStatus('✅ Доп. работы сохранены');
    } catch (error) {
        console.error('Ошибка сохранения доп. работ:', error);
        additionalWorks[studentName] = worksArray;
        localStorage.setItem('additionalWorks', JSON.stringify(additionalWorks));
    }
}

function toggleAdditionalWorks(student, workType) {
    const element = document.getElementById(`additionalWorks_${student}_${workType}`);
    if (element) {
        element.classList.toggle('active');
        
        const works = additionalWorks[student] || [];
        const hasWorksOfType = works.filter(w => w.type === workType).length > 0;
        
        if (!hasWorksOfType && element.classList.contains('active')) {
            addAdditionalWork(student, workType);
        }
    }
}

async function addAdditionalWork(studentName, workType) {
    const works = additionalWorks[studentName] || [];
    const newWorkNumber = works.filter(w => w.type === workType).length + 4;
    works.push({
        type: workType,
        number: newWorkNumber,
        name: `${getWorkTypeName(workType)} ${newWorkNumber}`
    });
    await saveAdditionalWorks(studentName, works);
    if (currentSelectedStudent === studentName) {
        initializeStudentWorks(studentName);
    }
}

function getWorkTypeName(workType) {
    switch(workType) {
        case 'work': return 'Работа';
        case 'check': return 'Проверка';
        case 'explain': return 'Объяснение';
        default: return workType;
    }
}

function createAdditionalWorks(student, workType) {
    const works = additionalWorks[student] || [];
    const filteredWorks = works.filter(w => w.type === workType);
    
    if (filteredWorks.length === 0) {
        return '<div style="text-align: center; color: #aaa; padding: 10px;">Нет дополнительных работ</div>';
    }
    
    return `
        <div class="works-row">
            <div class="upload-areas">
                ${filteredWorks.map(work => createWorkArea(student, `${workType}${work.number}`)).join('')}
            </div>
        </div>
    `;
}

// ==================== НОВЫЙ РАЗДЕЛ ПОМОЩИ ====================

// Загрузка разделов помощи
async function loadHelpSections() {
    try {
        const snapshot = await db.collection('helpSections').get();
        helpSections = {};
        
        snapshot.forEach(doc => {
            helpSections[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });
        
        updateHelpUI();
        
    } catch (error) {
        console.error('Ошибка загрузки разделов:', error);
        helpSections = JSON.parse(localStorage.getItem('helpSections')) || {};
    }
}

// Обновление интерфейса помощи
function updateHelpUI() {
    updateHelpSectionsGrid(); // Для учеников
    updateHelpAdminList();    // Для админа
}

// Обновление сетки разделов для учеников
function updateHelpSectionsGrid() {
    const sectionsGrid = document.getElementById('sectionsGrid');
    if (!sectionsGrid) return;
    
    sectionsGrid.innerHTML = '';
    
    Object.values(helpSections).forEach(section => {
        const sectionCard = document.createElement('div');
        sectionCard.className = 'section-card';
        sectionCard.innerHTML = `
            <div class="section-card-icon">📚</div>
            <div class="section-card-title">${section.title || 'Без названия'}</div>
            <div class="section-card-count">${(section.images || []).length} изображений</div>
        `;
        sectionCard.onclick = () => openSectionFullscreen(section.id);
        sectionsGrid.appendChild(sectionCard);
    });
    
    if (Object.keys(helpSections).length === 0) {
        sectionsGrid.innerHTML = `
            <div class="no-sections">
                <div style="font-size: 3em; margin-bottom: 10px;">📚</div>
                <div style="color: #aaa; font-size: 1.1em;">База знаний пока пуста</div>
                <div style="color: #666; font-size: 0.9em; margin-top: 5px;">
                    ${checkAdminAuth() ? 'Нажмите кнопку "Режим редактирования" чтобы добавить раздел' : 'Разделы будут добавлены позже'}
                </div>
            </div>
        `;
    }
}

// Обновление списка разделов для админа
function updateHelpAdminList() {
    const sectionsListAdmin = document.getElementById('sectionsListAdmin');
    if (!sectionsListAdmin || !isHelpAdminMode) return;
    
    sectionsListAdmin.innerHTML = '';
    
    Object.values(helpSections).forEach(section => {
        const sectionItem = document.createElement('div');
        sectionItem.className = `section-admin-item ${currentEditingSectionId === section.id ? 'active' : ''}`;
        sectionItem.innerHTML = `
            <div class="section-admin-info">
                <div class="section-admin-title">${section.title || 'Без названия'}</div>
                <div class="section-admin-stats">
                    <span>📷 ${(section.images || []).length}</span>
                    <span>🕐 ${formatSimpleDate(section.createdAt)}</span>
                </div>
            </div>
            <div class="section-admin-actions">
                <button class="edit-section-btn" onclick="editHelpSection('${section.id}')">
                    ${currentEditingSectionId === section.id ? '✏️ Редактирую' : '✏️ Редактировать'}
                </button>
            </div>
        `;
        sectionsListAdmin.appendChild(sectionItem);
    });
}

// Форматирование даты (просто дата)
function formatSimpleDate(timestamp) {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ru-RU');
    } catch (error) {
        return '';
    }
}

// Переключение режима помощи
function toggleHelpMode() {
    if (!checkAdminAuth()) {
        showPasswordPage();
        return;
    }
    
    isHelpAdminMode = !isHelpAdminMode;
    
    const helpAdminMode = document.getElementById('helpAdminMode');
    const helpStudentMode = document.getElementById('helpStudentMode');
    const helpModeToggle = document.getElementById('helpModeToggle');
    
    if (helpAdminMode && helpStudentMode && helpModeToggle) {
        if (isHelpAdminMode) {
            helpAdminMode.style.display = 'block';
            helpStudentMode.style.display = 'none';
            helpModeToggle.textContent = '👀 Режим просмотра';
            helpModeToggle.style.background = '#00ff00';
            helpModeToggle.style.color = '#000';
        } else {
            helpAdminMode.style.display = 'none';
            helpStudentMode.style.display = 'block';
            helpModeToggle.textContent = '🔧 Режим редактирования';
            helpModeToggle.style.background = '';
            helpModeToggle.style.color = '';
        }
        
        updateHelpUI();
    }
}

// Создание нового раздела помощи
async function createNewHelpSection() {
    if (!checkAdminAuth()) {
        showPasswordPage();
        return;
    }
    
    const nameInput = document.getElementById('newSectionName');
    if (!nameInput) return;
    
    const sectionName = nameInput.value.trim();
    
    if (!sectionName) {
        alert('Введите название раздела!');
        return;
    }
    
    try {
        const sectionId = 'section_' + Date.now();
        const newSection = {
            title: sectionName,
            images: [], // Массив для хранения картинок
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('helpSections').doc(sectionId).set(newSection);
        helpSections[sectionId] = { id: sectionId, ...newSection };
        
        nameInput.value = '';
        updateHelpUI();
        
        // Автоматически открываем для редактирования
        editHelpSection(sectionId);
        
        updateSyncStatus('✅ Раздел создан');
        
    } catch (error) {
        console.error('Ошибка создания раздела:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Редактирование раздела помощи
async function editHelpSection(sectionId) {
    if (!checkAdminAuth()) {
        showPasswordPage();
        return;
    }
    
    const section = helpSections[sectionId];
    if (!section) return;
    
    currentEditingSectionId = sectionId;
    updateHelpUI();
    
    const editor = document.getElementById('selectedSectionEditor');
    const editorTitle = document.getElementById('editingSectionTitle');
    const worksContainer = document.getElementById('sectionWorksContainer');
    
    if (editor && editorTitle && worksContainer) {
        editor.style.display = 'block';
        editorTitle.textContent = `Редактирование: ${section.title}`;
        
        // Загружаем картинки для редактирования
        worksContainer.innerHTML = createSectionWorksHTML(section);
        
        // Прокручиваем к редактору
        editor.scrollIntoView({ behavior: 'smooth' });
    }
}

// Создание HTML для картинок раздела
function createSectionWorksHTML(section) {
    const images = section.images || [];
    
    let html = `
        <div class="works-category">
            <div class="category-title">Картинки раздела (${images.length})</div>
            <div class="works-row">
                <div class="upload-areas">
    `;
    
    // Добавляем существующие картинки
    images.forEach((imageData, index) => {
        html += createSectionImageArea(section.id, index, imageData);
    });
    
    // Добавляем пустые слоты для новых картинок
    for (let i = images.length; i < images.length + 3; i++) {
        html += createSectionImageArea(section.id, i, null);
    }
    
    html += `
                </div>
            </div>
            <button class="add-work-btn" onclick="addSectionImageSlot('${section.id}')">+ Добавить еще</button>
        </div>
    `;
    
    return html;
}

// Создание области для картинки раздела
function createSectionImageArea(sectionId, imageIndex, imageData) {
    if (imageData && imageData.image) {
        return `
            <div class="upload-area has-work">
                <img src="${imageData.image}" class="work-preview" 
                     alt="Изображение ${imageIndex + 1}" 
                     onclick="openFullscreen('${imageData.image}')">
                <div class="work-number">Изображение ${imageIndex + 1}</div>
                <div class="upload-time">${imageData.timestamp ? formatDate(imageData.timestamp) : ''}</div>
                <button class="delete-btn" onclick="deleteSectionImage('${sectionId}', ${imageIndex})">
                    🗑️ Удалить
                </button>
                <input type="file" class="file-input" accept="image/*" 
                       onchange="handleSectionImageUpload(this, '${sectionId}', ${imageIndex})">
            </div>
        `;
    } else {
        return `
            <div class="upload-area" onclick="triggerSectionImageUpload(this, '${sectionId}', ${imageIndex})">
                <div class="work-number">Изображение ${imageIndex + 1}</div>
                <div class="upload-text">Нажмите для загрузки</div>
                <div class="compression-info">Поддерживаются файлы до 10MB</div>
                <input type="file" class="file-input" accept="image/*" 
                       onchange="handleSectionImageUpload(this, '${sectionId}', ${imageIndex})">
            </div>
        `;
    }
}

// Добавление нового слота для картинки
function addSectionImageSlot(sectionId) {
    const section = helpSections[sectionId];
    if (!section) return;
    
    if (!section.images) section.images = [];
    
    updateSectionEditor(sectionId);
}

// Обновление редактора раздела
function updateSectionEditor(sectionId) {
    if (currentEditingSectionId === sectionId) {
        const section = helpSections[sectionId];
        const worksContainer = document.getElementById('sectionWorksContainer');
        
        if (worksContainer && section) {
            worksContainer.innerHTML = createSectionWorksHTML(section);
        }
    }
}

// Загрузка картинки для раздела
async function handleSectionImageUpload(input, sectionId, imageIndex) {
    const file = input.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения (JPEG, PNG)');
        return;
    }
    
    try {
        updateSyncStatus('🔄 Загрузка изображения...');
        
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('Файл слишком большой. Максимум 10MB');
        }
        
        updateSyncStatus('🔄 Сжатие изображения...');
        const compressionResult = await compressImage(file, 1200, 0.8);
        
        const section = helpSections[sectionId];
        if (!section) return;
        
        if (!section.images) section.images = [];
        
        // Добавляем или обновляем картинку
        section.images[imageIndex] = {
            image: compressionResult.data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            compressionInfo: `Сжато: ${(compressionResult.originalSize/1024/1024).toFixed(1)}MB → ${(compressionResult.compressedSize/1024/1024).toFixed(1)}MB`
        };
        
        updateSectionEditor(sectionId);
        updateSyncStatus('✅ Изображение загружено');
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        updateSyncStatus('❌ Ошибка: ' + error.message, false);
        alert('Ошибка загрузки: ' + error.message);
    }
}

// Триггер загрузки картинки
function triggerSectionImageUpload(areaElement, sectionId, imageIndex) {
    const fileInput = areaElement.querySelector('.file-input');
    if (fileInput) {
        fileInput.click();
    }
}

// Удаление картинки из раздела
function deleteSectionImage(sectionId, imageIndex) {
    if (!confirm('Удалить это изображение?')) return;
    
    const section = helpSections[sectionId];
    if (!section || !section.images) return;
    
    section.images.splice(imageIndex, 1);
    updateSectionEditor(sectionId);
    updateSyncStatus('✅ Изображение удалено');
}

// Сохранение изменений в разделе
async function saveSectionImages() {
    if (!currentEditingSectionId) return;
    
    const section = helpSections[currentEditingSectionId];
    if (!section) return;
    
    try {
        // Удаляем пустые слоты
        if (section.images) {
            section.images = section.images.filter(img => img && img.image);
        }
        
        await db.collection('helpSections').doc(currentEditingSectionId).update({
            images: section.images || [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        updateHelpUI();
        updateSyncStatus('✅ Раздел сохранен');
        alert('Изменения сохранены!');
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Удаление раздела
async function deleteCurrentSection() {
    if (!currentEditingSectionId) return;
    
    if (!confirm('Удалить этот раздел со всеми изображениями?')) return;
    
    try {
        await db.collection('helpSections').doc(currentEditingSectionId).delete();
        delete helpSections[currentEditingSectionId];
        
        closeSectionEditor();
        updateHelpUI();
        updateSyncStatus('✅ Раздел удален');
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Закрытие редактора раздела
function closeSectionEditor() {
    currentEditingSectionId = null;
    const editor = document.getElementById('selectedSectionEditor');
    if (editor) {
        editor.style.display = 'none';
    }
    updateHelpUI();
}

// Открытие раздела в полноэкранном режиме (для учеников)
function openSectionFullscreen(sectionId) {
    const section = helpSections[sectionId];
    if (!section) return;
    
    const fullscreen = document.getElementById('sectionFullscreen');
    const title = document.getElementById('fullscreenSectionTitle');
    const imagesContainer = document.getElementById('fullscreenImages');
    
    if (fullscreen && title && imagesContainer) {
        fullscreen.style.display = 'block';
        title.textContent = section.title;
        
        // Отображаем картинки
        imagesContainer.innerHTML = '';
        (section.images || []).forEach((imageData, index) => {
            if (imageData && imageData.image) {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'fullscreen-image-item';
                imgDiv.innerHTML = `
                    <img src="${imageData.image}" 
                         alt="Изображение ${index + 1}" 
                         onclick="openFullscreen('${imageData.image}')"
                         class="fullscreen-image">
                    <div class="image-number">${index + 1}</div>
                `;
                imagesContainer.appendChild(imgDiv);
            }
        });
        
        // Если нет картинок
        if ((section.images || []).length === 0) {
            imagesContainer.innerHTML = `
                <div class="no-images">
                    <div style="font-size: 2em; margin-bottom: 10px;">🖼️</div>
                    <div style="color: #aaa;">В этом разделе пока нет изображений</div>
                </div>
            `;
        }
        
        // Прокручиваем к началу
        fullscreen.scrollIntoView({ behavior: 'smooth' });
    }
}

// Закрытие полноэкранного режима
function closeFullscreenSection() {
    const fullscreen = document.getElementById('sectionFullscreen');
    if (fullscreen) {
        fullscreen.style.display = 'none';
    }
}

// ==================== ОБЩИЕ ФУНКЦИИ ИНТЕРФЕЙСА ====================

function openFullscreen(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('fullscreenImage');
    
    if (modal && modalImg) {
        modal.style.display = 'block';
        modalImg.src = imageSrc;
        
        modal.onclick = function(event) {
            if (event.target === modal) {
                closeModal();
            }
        };
        
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Проверка пароля админа
function showPasswordPage() {
    const passwordPage = document.getElementById('passwordPage');
    if (passwordPage) {
        showPage('passwordPage');
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        const errorElement = document.getElementById('passwordError');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
}

function checkAdminPassword() {
    const passwordInput = document.getElementById('adminPassword');
    const errorElement = document.getElementById('passwordError');
    
    if (!passwordInput || !errorElement) return;
    
    const enteredPassword = passwordInput.value.trim();
    const correctPassword = 'Adher357';
    
    if (enteredPassword === correctPassword) {
        errorElement.style.display = 'none';
        localStorage.setItem('adminAuthenticated', 'true');
        
        // Если мы были на странице помощи, возвращаемся туда
        if (window.location.hash === '#helpPage') {
            showPage('helpPage');
        } else {
            showPage('adminPage');
        }
    } else {
        errorElement.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        
        passwordInput.style.borderColor = '#ff0000';
        passwordInput.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
        
        setTimeout(() => {
            passwordInput.style.borderColor = '#ff4444';
            passwordInput.style.boxShadow = 'none';
        }, 1000);
    }
}

function checkAdminAuth() {
    return localStorage.getItem('adminAuthenticated') === 'true';
}

// Переключение страниц
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    window.scrollTo(0, 0);
    
    // Сохраняем текущую страницу в hash для возврата
    if (pageId !== 'passwordPage') {
        window.location.hash = pageId;
    }
    
    if (pageId === 'worksPage') {
        closeStudentWorks();
    } else if (pageId === 'adminPage') {
        if (!checkAdminAuth()) {
            showPasswordPage();
            return;
        }
        initializeAdminPage();
    } else if (pageId === 'helpPage') {
        loadHelpSections();
        // Если пользователь не авторизован, скрываем кнопку редактирования
        if (!checkAdminAuth()) {
            const toggleBtn = document.getElementById('helpModeToggle');
            if (toggleBtn) {
                toggleBtn.style.display = 'none';
            }
            isHelpAdminMode = false;
        } else {
            const toggleBtn = document.getElementById('helpModeToggle');
            if (toggleBtn) {
                toggleBtn.style.display = 'inline-block';
            }
        }
        updateHelpUI();
    }
}

function closeStudentWorks() {
    currentSelectedStudent = null;
    const section = document.getElementById('studentWorksSection');
    if (section) {
        section.classList.remove('active');
    }
    initializeStudentsGrid();
    const selectedStudentName = document.getElementById('selectedStudentName');
    if (selectedStudentName) {
        selectedStudentName.textContent = "📄 Ваши Работы";
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', async function() {
    // Создаем глобальные функции
    window.showPage = showPage;
    window.openFullscreen = openFullscreen;
    window.closeModal = closeModal;
    window.handleWordInput = handleWordInput;
    window.navigateWord = navigateWord;
    window.removeCurrentWord = removeCurrentWord;
    window.handleWorkUpload = handleWorkUpload;
    window.triggerWorkUpload = triggerWorkUpload;
    window.deleteWork = deleteWork;
    window.toggleAdditionalWorks = toggleAdditionalWorks;
    window.calculateTotals = calculateTotals;
    window.saveWeekRankings = saveWeekRankings;
    window.clearWeekRankings = clearWeekRankings;
    window.toggleHelpMode = toggleHelpMode;
    window.createNewHelpSection = createNewHelpSection;
    window.editHelpSection = editHelpSection;
    window.deleteCurrentSection = deleteCurrentSection;
    window.saveSectionImages = saveSectionImages;
    window.closeSectionEditor = closeSectionEditor;
    window.addSectionImageSlot = addSectionImageSlot;
    window.handleSectionImageUpload = handleSectionImageUpload;
    window.triggerSectionImageUpload = triggerSectionImageUpload;
    window.deleteSectionImage = deleteSectionImage;
    window.openSectionFullscreen = openSectionFullscreen;
    window.closeFullscreenSection = closeFullscreenSection;
    window.checkAdminPassword = checkAdminPassword;
    window.showPasswordPage = showPasswordPage;
    
    await loadAllData();
    
    const savedWeek = localStorage.getItem('lastSelectedWeek');
    if (savedWeek) {
        currentSelectedWeek = savedWeek;
    }
    
    initializeWeekRating(currentSelectedWeek);
    
    const weekSelector = document.getElementById('weekSelector');
    if (weekSelector) {
        if (currentSelectedWeek) {
            weekSelector.value = currentSelectedWeek;
        }
        
        weekSelector.addEventListener('change', function() {
            const weekId = this.value;
            currentSelectedWeek = weekId;
            localStorage.setItem('lastSelectedWeek', weekId);
            
            loadWeekRankings(weekId);
            initializeWeekRating(weekId);
        });
    }
    
    // Проверяем hash при загрузке для возврата на нужную страницу
    if (window.location.hash) {
        const pageId = window.location.hash.substring(1);
        if (pageId && document.getElementById(pageId)) {
            showPage(pageId);
        } else {
            showPage('mainPage');
        }
    } else {
        showPage('mainPage');
    }
});
[file content end]
