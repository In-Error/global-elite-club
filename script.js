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
let weekRankings = {};
let firstWeekDate = null;
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

        // Загружаем имена для рейтингов (если еще используются)
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
        
        // Загружаем рейтинги недель
        const weekRankingsSnapshot = await db.collection('weekRankings').get();
        weekRankings = {};
        let earliestDate = null;
        
        weekRankingsSnapshot.forEach(doc => {
            weekRankings[doc.id] = doc.data();
            
            // Находим самую раннюю дату
            const weekDate = getDateFromWeekId(doc.id);
            if (!earliestDate || weekDate < earliestDate) {
                earliestDate = weekDate;
            }
        });
        
        firstWeekDate = earliestDate;
        
        // Рассчитываем суммарные очки за все время
        calculateTotalPoints();
        
        updateSyncStatus('✅ Данные загружены');
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        updateSyncStatus('❌ Ошибка загрузки', false);
        
        // Fallback на localStorage
        studentWords = JSON.parse(localStorage.getItem('studentWords')) || {};
        studentWorks = JSON.parse(localStorage.getItem('studentWorks')) || {};
        studentNames = JSON.parse(localStorage.getItem('studentNames')) || {};
        additionalWorks = JSON.parse(localStorage.getItem('additionalWorks')) || {};
        weekRankings = JSON.parse(localStorage.getItem('weekRankings')) || {};
        
        calculateTotalPoints();
    }
    
    // Обновляем интерфейс
    initializeWeekRating();
    initializeTotalRating();
    initializeStudentsGrid();
}

// Рассчитываем суммарные очки за все время
function calculateTotalPoints() {
    totalPoints = {};
    
    // Суммируем очки из всех недель
    Object.values(weekRankings).forEach(weekData => {
        const weekPoints = weekData.weekPoints || {};
        Object.entries(weekPoints).forEach(([student, points]) => {
            totalPoints[student] = (totalPoints[student] || 0) + points;
        });
    });
}

// Конвертируем weekId в дату
function getDateFromWeekId(weekId) {
    const match = weekId.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return new Date();
    
    const year = parseInt(match[1]);
    const week = parseInt(match[2]);
    
    // Создаем дату первого дня недели
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    const date = new Date(year, 0, daysOffset);
    
    return date;
}

// Форматируем дату
function formatDate(date) {
    if (!date) return '...';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// === ФУНКЦИИ ДЛЯ РЕЙТИНГА ЗА ВСЕ ВРЕМЯ ===
function initializeTotalRating() {
    const totalRatingList = document.getElementById('totalRatingList');
    const totalDateRange = document.getElementById('startDate');
    
    if (!totalRatingList) return;
    
    // Обновляем диапазон дат
    if (firstWeekDate) {
        totalDateRange.textContent = formatDate(firstWeekDate);
    } else {
        totalDateRange.textContent = "начала учёта";
    }
    
    totalRatingList.innerHTML = '';
    
    // Создаем массив учеников с очками за все время
    const studentsWithTotalPoints = students.map(student => ({
        name: student,
        points: totalPoints[student] || 0,
        avatar: `avatars${student}.png`,
        weeksCount: countWeeksParticipated(student)
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
            <div class="total-rating-info-details">
                <div class="total-rating-name">${studentData.name}</div>
                <div class="total-rating-weeks">Участвовал(а) в ${studentData.weeksCount} неделях</div>
            </div>
            <div class="total-rating-score">
                ${studentData.points}
                <div class="total-rating-score-details">очков</div>
            </div>
        `;
        
        totalRatingList.appendChild(item);
    });
}

// Считаем количество недель участия
function countWeeksParticipated(student) {
    let count = 0;
    Object.values(weekRankings).forEach(weekData => {
        const weekPoints = weekData.weekPoints || {};
        if (weekPoints[student] && weekPoints[student] > 0) {
            count++;
        }
    });
    return count;
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
    
    // Если weekId не указан, используем текущую неделю
    if (!weekId) {
        const today = new Date();
        const year = today.getFullYear();
        const week = getWeekNumber(today);
        weekId = `${year}-W${week.toString().padStart(2, '0')}`;
        
        // Устанавливаем значение в селекторе
        const weekSelector = document.getElementById('weekSelectorMain');
        if (weekSelector) {
            weekSelector.value = weekId;
        }
    }
    
    weekRatingList.innerHTML = '';
    
    const weekData = weekRankings[weekId];
    
    if (!weekData) {
        weekRatingList.innerHTML = `
            <div style="text-align: center; color: #aaa; padding: 20px; background: #2a2a2a; border-radius: 8px;">
                <div style="margin-bottom: 10px;">📅 Неделя ${weekId}</div>
                <div>Нет данных за эту неделю</div>
            </div>
        `;
        return;
    }
    
    const weekPoints = weekData.weekPoints || {};
    
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
        
        // Обновляем локальные данные
        weekRankings[weekId] = {
            speed: speedRankings,
            accuracy: accuracyRankings,
            weekPoints: weekPoints
        };
        
        // Обновляем суммарные очки
        calculateTotalPoints();
        
        // Обновляем отображение
        initializeWeekRating(weekId);
        initializeTotalRating();
        
        updateSyncStatus('✅ Результаты недели сохранены');
        alert(`Результаты недели ${weekId} успешно сохранены!`);
        
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

// === ИНИЦИАЛИЗАЦИЯ СЕТКИ УЧЕНИКОВ ===
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

// === ОСТАЛЬНЫЕ ФУНКЦИИ (для страницы работ) ===

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

// Закрытие работ ученика
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

// Показать страницу
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

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
    document.getElementById('workDate').valueAsDate = new Date();
    
    // Слушатель для выбора недели на главной странице
    const weekSelectorMain = document.getElementById('weekSelectorMain');
    if (weekSelectorMain) {
        weekSelectorMain.addEventListener('change', function() {
            const weekId = this.value;
            initializeWeekRating(weekId);
        });
    }
});
