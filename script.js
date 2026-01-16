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

const rating1Titles = [
    "Гепард Скорости", "Турбо-сокол", "Быстрая лиса", "Енот-шустрик", 
    "Шустрый зайчик", "Шустрая белочка", "Неутомимый Муравей", 
    "Ёжик-быстроножик", "Трудяга-бобр", "Проворная выдра", "Смелая черепашка"
];

const rating2Titles = [
    "Орел точности", "Пантера-точность", "Мудрая сова", "Лиса-точность", 
    "Дельфин смысла", "Умный котик", "Аккуратная косуля", 
    "Внимательный медвежонок", "Пингвин ясности", "Аккуратный кролик", "Потенциальная звезда"
];

// Хранилища данных
let studentWords = {};
let studentWorks = {};
let studentNames = {};
let additionalWorks = {};
let totalPoints = {};
let currentSelectedStudent = null;
let currentWordIndexes = {};

// Функция обновления статуса синхронизации
function updateSyncStatus(message, isSuccess = true) {
    const statusElement = document.getElementById('syncStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = isSuccess ? '#00ff00' : '#ff4444';
        statusElement.style.textShadow = isSuccess ? '0 0 5px rgba(0, 255, 0, 0.7)' : '0 0 5px rgba(255, 68, 68, 0.7)';
    }
}

// === ЗАГРУЗКА ДАННЫХ ===
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
    }
    
    // Обновляем интерфейс
    initializeRatings();
    initializeWeekRating();
    initializeTotalRating();
    initializeStudentsGrid();
}

// === ФУНКЦИИ ДЛЯ РЕЙТИНГА ЗА ВСЕ ВРЕМЯ ===
function initializeTotalRating() {
    const totalRatingList = document.getElementById('totalRatingList');
    if (!totalRatingList) return;
    
    totalRatingList.innerHTML = '';
    
    // Создаем массив учеников с очками за все время
    const studentsWithTotalPoints = students.map(student => ({
        name: student,
        points: totalPoints[student] || 0,
        avatar: `avatars${student}.png`
    }));
    
    // Сортируем по убыванию очков
    studentsWithTotalPoints.sort((a, b) => b.points - a.points);
    
    // Отображаем
    studentsWithTotalPoints.forEach((studentData, index) => {
        const isTopThree = index < 3;
        const item = document.createElement('div');
        item.className = `total-rating-item ${isTopThree ? 'top-three' : ''}`;
        
        item.innerHTML = `
            <img src="${studentData.avatar}" alt="${studentData.name}" class="total-rating-avatar ${isTopThree ? 'top-three' : ''}">
            <div class="total-rating-info">
                <div class="total-rating-name">${studentData.name}</div>
                <div class="total-rating-points">Место: ${index + 1}</div>
            </div>
            <div class="total-rating-score">${studentData.points}</div>
        `;
        
        totalRatingList.appendChild(item);
    });
}

async function updateTotalPoints(pointsToAdd) {
    // pointsToAdd = { student: points }
    for (const [student, points] of Object.entries(pointsToAdd)) {
        const currentPoints = totalPoints[student] || 0;
        totalPoints[student] = currentPoints + points;
        
        // Сохраняем в Firebase
        try {
            await db.collection('totalPoints').doc(student).set({
                points: totalPoints[student],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Ошибка обновления очков:', error);
            localStorage.setItem('totalPoints', JSON.stringify(totalPoints));
        }
    }
    
    // Обновляем отображение
    initializeTotalRating();
}

// === ФУНКЦИИ ДЛЯ РЕЙТИНГА ЗА НЕДЕЛЮ ===
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

async function initializeWeekRating(weekId = null) {
    const weekRatingList = document.getElementById('weekRatingList');
    if (!weekRatingList) return;
    
    weekRatingList.innerHTML = '';
    
    // Если weekId не указан, используем текущую неделю
    if (!weekId) {
        const today = new Date();
        const year = today.getFullYear();
        const week = getWeekNumber(today);
        weekId = `${year}-W${week.toString().padStart(2, '0')}`;
    }
    
    try {
        const doc = await db.collection('weekRankings').doc(weekId).get();
        if (!doc.exists) {
            weekRatingList.innerHTML = '<div style="text-align: center; color: #aaa; padding: 20px;">Нет данных за эту неделю</div>';
            return;
        }
    
        const data = doc.data();
        const weekPoints = data.weekPoints || {};
        
        // Создаем массив учеников с очками за неделю
        const studentsWithWeekPoints = students.map(student => ({
            name: student,
            points: weekPoints[student] || 0,
            avatar: `avatars${student}.png`
        }));
        
        // Сортируем по убыванию очков
        studentsWithWeekPoints.sort((a, b) => b.points - a.points);
        
        // Отображаем
        studentsWithWeekPoints.forEach((studentData, index) => {
            if (studentData.points === 0) return; // Пропускаем тех, у кого 0 очков
            
            const isTopThree = index < 3;
            const item = document.createElement('div');
            item.className = `week-rating-item ${isTopThree ? 'top-three' : ''}`;
            
            item.innerHTML = `
                <img src="${studentData.avatar}" alt="${studentData.name}" class="week-rating-avatar ${isTopThree ? 'top-three' : ''}">
                <div class="week-rating-info">
                    <div class="week-rating-name">${studentData.name}</div>
                    <div class="week-rating-points">Место: ${index + 1}</div>
                </div>
                <div class="week-rating-score">${studentData.points}</div>
            `;
            
            weekRatingList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки рейтинга недели:', error);
        weekRatingList.innerHTML = '<div style="text-align: center; color: #ff4444; padding: 20px;">Ошибка загрузки данных</div>';
    }
}

// === ФУНКЦИИ ДЛЯ АДМИНКИ ===
function initializeAdminPage() {
    // Устанавливаем текущую неделю по умолчанию
    const today = new Date();
    const year = today.getFullYear();
    const week = getWeekNumber(today);
    const weekInput = `${year}-W${week.toString().padStart(2, '0')}`;
    const weekSelector = document.getElementById('weekSelector');
    weekSelector.value = weekInput;
    
    // Инициализируем поля для ввода
    generateRankingInputs();
    
    // Загружаем данные если они есть
    loadWeekRankings(weekInput);
}

function generateRankingInputs() {
    const speedContainer = document.getElementById('speedRankings');
    const accuracyContainer = document.getElementById('accuracyRankings');
    
    speedContainer.innerHTML = '';
    accuracyContainer.innerHTML = '';
    
    // Создаем 11 позиций для каждого рейтинга
    for (let i = 1; i <= 11; i++) {
        const points = 12 - i; // 11, 10, ..., 1
        
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
    
    // Считаем очки за скорость
    for (let i = 1; i <= 11; i++) {
        const select = document.getElementById(`speed_${i}`);
        if (select.value) {
            speedTotal += (12 - i);
        }
    }
    
    // Считаем очки за точность
    for (let i = 1; i <= 11; i++) {
        const select = document.getElementById(`accuracy_${i}`);
        if (select.value) {
            accuracyTotal += (12 - i);
        }
    }
    
    // Обновляем отображение
    document.getElementById('speedTotal').textContent = speedTotal;
    document.getElementById('accuracyTotal').textContent = accuracyTotal;
    document.getElementById('weekTotal').textContent = speedTotal + accuracyTotal;
}

async function loadWeekRankings(weekId) {
    try {
        const doc = await db.collection('weekRankings').doc(weekId).get();
        if (doc.exists) {
            const data = doc.data();
            
            // Заполняем поля скорости
            for (const [position, student] of Object.entries(data.speed || {})) {
                const select = document.getElementById(`speed_${position}`);
                if (select) select.value = student;
            }
            
            // Заполняем поля точности
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

async function saveWeekRankings() {
    const weekId = document.getElementById('weekSelector').value;
    if (!weekId) {
        alert('Выберите неделю!');
        return;
    }
    
    const speedRankings = {};
    const accuracyRankings = {};
    const weekPoints = {};
    
    // Собираем данные по скорости
    for (let i = 1; i <= 11; i++) {
        const select = document.getElementById(`speed_${i}`);
        if (select.value) {
            speedRankings[i] = select.value;
            
            // Добавляем очки ученику
            const points = 12 - i;
            weekPoints[select.value] = (weekPoints[select.value] || 0) + points;
        }
    }
    
    // Собираем данные по точности
    for (let i = 1; i <= 11; i++) {
        const select = document.getElementById(`accuracy_${i}`);
        if (select.value) {
            accuracyRankings[i] = select.value;
            
            // Добавляем очки ученику
            const points = 12 - i;
            weekPoints[select.value] = (weekPoints[select.value] || 0) + points;
        }
    }
    
    // Проверяем, что выбраны все позиции
    if (Object.keys(speedRankings).length !== 11 || Object.keys(accuracyRankings).length !== 11) {
        if (!confirm('Не все позиции заполнены. Сохранить частичные данные?')) {
            return;
        }
    }
    
    try {
        // Сохраняем рейтинги недели
        await db.collection('weekRankings').doc(weekId).set({
            speed: speedRankings,
            accuracy: accuracyRankings,
            weekPoints: weekPoints,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Обновляем очки за все время
        await updateTotalPoints(weekPoints);
        
        updateSyncStatus('✅ Результаты недели сохранены');
        alert(`Результаты недели ${weekId} успешно сохранены!`);
        
        // Обновляем отображение рейтинга недели
        initializeWeekRating(weekId);
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        updateSyncStatus('❌ Ошибка сохранения', false);
        alert('Ошибка сохранения: ' + error.message);
    }
}

function clearWeekRankings() {
    if (confirm('Очистить все выбранные значения?')) {
        for (let i = 1; i <= 11; i++) {
            document.getElementById(`speed_${i}`).value = '';
            document.getElementById(`accuracy_${i}`).value = '';
        }
        calculateTotals();
    }
}

// === ОРИГИНАЛЬНЫЕ ФУНКЦИИ ===

// Функция сжатия изображений
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

// Сохранение слов
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

// Добавление нового слова
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

// Удаление текущего слова
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

// Сохранение имени в рейтинге
async function saveRatingName(ratingType, position, name) {
    const key = `${ratingType}_${position}`;
    try {
        await db.collection('ratingNames').doc(key).set({
            name: name,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        studentNames[key] = name;
        updateSyncStatus('✅ Имя сохранено');
    } catch (error) {
        console.error('Ошибка сохранения имени:', error);
        studentNames[key] = name;
        localStorage.setItem('studentNames', JSON.stringify(studentNames));
    }
}

// Инициализация рейтингов
function initializeRatings() {
    const rating1List = document.getElementById('rating1List');
    const rating2List = document.getElementById('rating2List');

    if (!rating1List || !rating2List) return;

    rating1List.innerHTML = '';
    rating2List.innerHTML = '';

    rating1Titles.forEach((title, index) => {
        const isTopThree = index < 3;
        const studentItem = createRatingItem(index + 1, title, 'rating1', isTopThree);
        rating1List.appendChild(studentItem);
    });

    rating2Titles.forEach((title, index) => {
        const isTopThree = index < 3;
        const studentItem = createRatingItem(index + 1, title, 'rating2', isTopThree);
        rating2List.appendChild(studentItem);
    });
}

// Создание элемента рейтинга
function createRatingItem(place, title, ratingType, isTopThree = false) {
    const item = document.createElement('div');
    item.className = `student-item ${isTopThree ? 'top-three' : ''}`;
    
    const nameKey = `${ratingType}_${place}`;
    const savedName = studentNames[nameKey] || '';
    
    item.innerHTML = `
        <div class="name-input-container">
            <input 
                type="text" 
                class="name-input" 
                placeholder="Введите имя" 
                value="${savedName}"
                maxlength="15"
                oninput="saveRatingName('${ratingType}', ${place}, this.value)"
            >
        </div>
        <div class="student-info">
            <div class="student-name">${place} место</div>
            <div class="student-title">${title}</div>
        </div>
    `;
    
    return item;
}

// Инициализация сетки учеников
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

// Открытие работ ученика
function openStudentWorks(student) {
    currentSelectedStudent = student;
    initializeStudentsGrid();
    initializeStudentWorks(student);
    
    const section = document.getElementById('studentWorksSection');
    section.classList.add('active');
    document.getElementById('selectedStudentName').textContent = student;
    
    section.scrollIntoView({ behavior: 'smooth' });
}

// Инициализация работ ученика
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
            <!-- НОВАЯ КАТЕГОРИЯ: Ваши объяснения -->
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

// Функция для создания секции слов
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

// Обработка ввода слова
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

// Навигация по словам
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

// Переключение дополнительных работ
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

// Сохранение работы
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

// Загрузка работы с сжатием
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

// Создание области работы
function createWorkArea(student, workType) {
    const workKey = `${student}_${workType}`;
    const workData = studentWorks[workKey];
    
    if (workData && workData.image) {
        const compressionInfo = workData.compressionInfo ? `<div class="compression-info">${workData.compressionInfo}</div>` : '';
        
        return `
            <div class="upload-area has-work">
                <img src="${workData.image}" class="work-preview" alt="${workType}" onclick="openFullscreen('${workData.image}')">
                <div class="work-number">${getWorkTitle(workType)}</div>
                ${compressionInfo}
                <div class="upload-time">${formatDateTime(workData.timestamp)}</div>
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

// Получение заголовка работы
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

// Добавление дополнительной работы
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

// Сохранение дополнительных работ
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

// Создание дополнительных работ
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

// Удаление работы
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

// Вспомогательные функции
function triggerWorkUpload(areaElement, student, workType) {
    const fileInput = areaElement.querySelector('.file-input');
    fileInput.click();
}

function formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `Загружено: ${day}.${month}.${year} ${hours}:${minutes}`;
}

function openFullscreen(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('fullscreenImage');
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

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
    
    if (pageId === 'worksPage') {
        closeStudentWorks();
    } else if (pageId === 'adminPage') {
        initializeAdminPage();
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
    document.getElementById('workDate').valueAsDate = new Date();
    
    // Инициализируем слушатель для выбора недели
    document.getElementById('weekSelector').addEventListener('change', function() {
        const weekId = this.value;
        loadWeekRankings(weekId);
        initializeWeekRating(weekId);
    });
});
