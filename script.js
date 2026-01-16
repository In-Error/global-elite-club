// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA1gMGXixXqfgptc0-Nx5fRWCbS2lefXLY",
    authDomain: "global-elite-club-dcd0d.firebaseapp.com",
    projectId: "global-elite-club-dcd0d",
    storageBucket: "global-elite-club-dcd0d.firebasestorage.app",
    messagingSenderId: "372974979606",
    appId: "1:372974979606:web:c29e3a0e724ca07abc4337",
    measurementId: "G-EBEWY8W5Y7"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Данные
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

const students = [
    "Alina", "Artem", "Dania", "Denis", "Lera", "Nastia Che", 
    "Nastia S", "Natasha", "Rita", "Selin", "Vika"
];

// Хранилища данных
let studentWords = {};
let studentWorks = {};
let studentNames = {};
let additionalWorks = {};
let explanationsWorks = {};
let weeklyResults = {};
let overallRating = {};
let currentSelectedStudent = null;
let currentWordIndexes = {};

// Обновление статуса синхронизации
function updateSyncStatus(message, isSuccess = true) {
    const statusElement = document.getElementById('syncStatus');
    statusElement.textContent = message;
    statusElement.style.color = isSuccess ? '#00ff00' : '#ff4444';
    statusElement.style.textShadow = isSuccess ? '0 0 8px rgba(0, 255, 0, 0.7)' : '0 0 8px rgba(255, 68, 68, 0.7)';
}

// Загрузка всех данных
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

        // Загружаем объяснения
        const explanationsSnapshot = await db.collection('explanations').get();
        explanationsWorks = {};
        explanationsSnapshot.forEach(doc => {
            explanationsWorks[doc.id] = doc.data();
        });

        // Загружаем недельные результаты
        const weeklySnapshot = await db.collection('weeklyResults').get();
        weeklyResults = {};
        weeklySnapshot.forEach(doc => {
            weeklyResults[doc.id] = doc.data();
        });
        
        updateSyncStatus('✅ Данные загружены');
        
        // Инициализируем интерфейс
        initializeRatings();
        initializeStudentsGrid();
        calculateOverallRating();
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        updateSyncStatus('❌ Ошибка загрузки', false);
        
        // Fallback на localStorage
        try {
            studentWords = JSON.parse(localStorage.getItem('studentWords')) || {};
            studentWorks = JSON.parse(localStorage.getItem('studentWorks')) || {};
            studentNames = JSON.parse(localStorage.getItem('studentNames')) || {};
            additionalWorks = JSON.parse(localStorage.getItem('additionalWorks')) || {};
            explanationsWorks = JSON.parse(localStorage.getItem('explanationsWorks')) || {};
            weeklyResults = JSON.parse(localStorage.getItem('weeklyResults')) || {};
            
            initializeRatings();
            initializeStudentsGrid();
            calculateOverallRating();
            
        } catch (e) {
            console.error('Ошибка загрузки из localStorage:', e);
        }
    }
}

// Инициализация рейтингов
function initializeRatings() {
    const rating1List = document.getElementById('rating1List');
    const rating2List = document.getElementById('rating2List');

    rating1List.innerHTML = '';
    rating2List.innerHTML = '';

    // Рейтинг 1
    rating1Titles.forEach((title, index) => {
        const isTopThree = index < 3;
        const studentItem = createRatingItem(index + 1, title, 'rating1', isTopThree);
        rating1List.appendChild(studentItem);
    });

    // Рейтинг 2
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
            <div class="student-name">
                <span>${place} место</span>
                <span class="place-badge">${12 - place} очков</span>
            </div>
            <div class="student-title">${title}</div>
        </div>
    `;
    
    return item;
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
        updateSyncStatus('❌ Ошибка сохранения', false);
        
        // Fallback
        studentNames[key] = name;
        localStorage.setItem('studentNames', JSON.stringify(studentNames));
    }
}

// Сохранение недельных результатов
async function saveWeeklyResults(ratingType) {
    const weekNumber = prompt('Введите номер недели (например: 1, 2, 3...):');
    if (!weekNumber || isNaN(weekNumber) || weekNumber < 1) {
        alert('Пожалуйста, введите корректный номер недели');
        return;
    }

    const ratingList = document.getElementById(`${ratingType}List`);
    if (!ratingList) return;

    const inputs = ratingList.querySelectorAll('.name-input');
    const results = [];

    inputs.forEach(input => {
        if (input.value.trim()) {
            results.push(input.value.trim());
        }
    });

    if (results.length === 0) {
        alert('Нет данных для сохранения. Заполните имена в рейтинге.');
        return;
    }

    if (results.length !== 11) {
        const confirmSave = confirm(`В рейтинге заполнено ${results.length} из 11 мест. Продолжить сохранение?`);
        if (!confirmSave) return;
    }

    try {
        const docId = `week${weekNumber}_${ratingType}`;
        await db.collection('weeklyResults').doc(docId).set({
            week: parseInt(weekNumber),
            ratingType: ratingType,
            results: results,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        weeklyResults[docId] = { 
            week: parseInt(weekNumber), 
            ratingType: ratingType, 
            results: results 
        };
        
        updateSyncStatus(`✅ Результаты недели ${weekNumber} сохранены`);
        calculateOverallRating();
        alert(`Результаты недели ${weekNumber} успешно сохранены!`);
        
    } catch (error) {
        console.error('Ошибка сохранения недельных результатов:', error);
        updateSyncStatus('❌ Ошибка сохранения', false);
        alert('Ошибка при сохранении. Попробуйте еще раз.');
    }
}

// Расчет общего рейтинга
function calculateOverallRating() {
    // Система подсчета: 1 место = 11 очков, 2 = 10, ..., 11 = 1 очко
    const ratingPoints = {
        1: 11, 2: 10, 3: 9, 4: 8, 5: 7, 6: 6, 7: 5, 8: 4, 9: 3, 10: 2, 11: 1
    };

    const allResults = {};
    
    students.forEach(student => {
        allResults[student] = { 
            points: 0, 
            places: [], 
            weeks: new Set() 
        };
    });

    Object.values(weeklyResults).forEach(weekData => {
        if (weekData.results && weekData.results.length > 0) {
            weekData.results.forEach((studentName, index) => {
                const place = index + 1;
                if (allResults[studentName]) {
                    allResults[studentName].points += ratingPoints[place] || 0;
                    allResults[studentName].places.push(place);
                    allResults[studentName].weeks.add(weekData.week);
                }
            });
        }
    });

    const sortedResults = Object.entries(allResults)
        .map(([name, data]) => ({
            name,
            points: data.points,
            places: data.places,
            weeksCount: data.weeks.size,
            avgPlace: data.places.length > 0 
                ? (data.places.reduce((a, b) => a + b, 0) / data.places.length).toFixed(1)
                : '-'
        }))
        .sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            return parseFloat(a.avgPlace) - parseFloat(b.avgPlace);
        });

    overallRating = sortedResults;
    displayOverallRating();
}

// Отображение общего рейтинга
function displayOverallRating() {
    const overallList = document.getElementById('overallRatingList');
    
    if (overallRating.length === 0) {
        overallList.innerHTML = `
            <div style="text-align: center; color: #aaa; padding: 30px;">
                📊 Нет данных для общего рейтинга<br>
                <small>Сохраните результаты хотя бы одной недели</small>
            </div>
        `;
        return;
    }

    overallList.innerHTML = '';

    overallRating.forEach((student, index) => {
        const isTopThree = index < 3;
        const item = document.createElement('div');
        item.className = `student-item ${isTopThree ? 'top-three' : ''}`;
        
        let medalClass = 'medal-other';
        let medalIcon = `${index + 1} 🏅`;
        
        if (index === 0) {
            medalClass = 'medal-gold';
            medalIcon = '🥇 1';
        } else if (index === 1) {
            medalClass = 'medal-silver';
            medalIcon = '🥈 2';
        } else if (index === 2) {
            medalClass = 'medal-bronze';
            medalIcon = '🥉 3';
        }

        item.innerHTML = `
            <div class="medal-container ${medalClass}">
                ${medalIcon}
            </div>
            <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="stats-container">
                    <span class="stat-item stat-points">${student.points} очков</span>
                    <span class="stat-item stat-avg">Ср.место: ${student.avgPlace}</span>
                    <span class="stat-item stat-weeks">Недель: ${student.weeksCount}</span>
                    <span class="stat-item stat-participations">Участий: ${student.places.length}</span>
                </div>
            </div>
        `;
        
        overallList.appendChild(item);
    });
}

// Показ истории недель
function showWeeklyHistory() {
    if (Object.keys(weeklyResults).length === 0) {
        alert('История недель пуста. Сохраните результаты хотя бы одной недели.');
        return;
    }

    const weeks = {};
    
    Object.values(weeklyResults).forEach(weekData => {
        if (!weeks[weekData.week]) {
            weeks[weekData.week] = { rating1: [], rating2: [] };
        }
        if (weekData.ratingType === 'rating1') {
            weeks[weekData.week].rating1 = weekData.results;
        } else {
            weeks[weekData.week].rating2 = weekData.results;
        }
    });

    const sortedWeeks = Object.keys(weeks).sort((a, b) => b - a);
    let historyText = '📅 ИСТОРИЯ НЕДЕЛЬНЫХ РЕЗУЛЬТАТОВ\n\n';

    sortedWeeks.forEach(week => {
        historyText += `━━━━━━ Неделя ${week} ━━━━━━\n`;
        
        if (weeks[week].rating1.length > 0) {
            historyText += '\n🏆 Рейтинг 1:\n';
            weeks[week].rating1.forEach((student, idx) => {
                const points = 11 - idx;
                historyText += `  ${idx + 1}. ${student} (${points} очков)\n`;
            });
        }
        
        if (weeks[week].rating2.length > 0) {
            historyText += '\n⭐ Рейтинг 2:\n';
            weeks[week].rating2.forEach((student, idx) => {
                const points = 11 - idx;
                historyText += `  ${idx + 1}. ${student} (${points} очков)\n`;
            });
        }
        
        historyText += '\n';
    });

    alert(historyText);
}

// Инициализация сетки учеников
function initializeStudentsGrid() {
    const studentsGrid = document.getElementById('studentsGrid');
    studentsGrid.innerHTML = '';
    
    students.forEach(student => {
        const avatarUrl = `https://raw.githubusercontent.com/nellipterova/Rating/main/avatars${student}.png`;
        const card = document.createElement('div');
        card.className = `student-card ${currentSelectedStudent === student ? 'active' : ''}`;
        card.innerHTML = `
            <img src="${avatarUrl}" 
                 alt="${student}" 
                 style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 10px; border: 2px solid #ffd700;"
                 onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<div class=\"student-card-name\">${student}</div>'">
            <div class="student-card-name">${student}</div>
        `;
        card.onclick = () => openStudentWorks(student);
        studentsGrid.appendChild(card);
    });
}

// Функции для страницы работ
function openStudentWorks(student) {
    currentSelectedStudent = student;
    initializeStudentsGrid();
    initializeStudentWorks(student);
    
    const section = document.getElementById('studentWorksSection');
    section.classList.add('active');
    document.getElementById('selectedStudentName').innerHTML = `<span>📄 ${student} - Работы</span>`;
    
    section.scrollIntoView({ behavior: 'smooth' });
}

function closeStudentWorks() {
    currentSelectedStudent = null;
    const section = document.getElementById('studentWorksSection');
    section.classList.remove('active');
    initializeStudentsGrid();
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
    
    if (pageId === 'worksPage') {
        closeStudentWorks();
    }
}

// Инициализация работ ученика
function initializeStudentWorks(student) {
    const worksList = document.getElementById('worksList');
    worksList.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">Загрузка работ...</div>';
    
    setTimeout(() => {
        // Получаем данные о работах ученика
        const studentData = studentWorks[student] || {};
        const words = studentWords[student] || [];
        const additional = additionalWorks[student] || [];
        const explanations = explanationsWorks[student] || {};
        
        let html = '<div style="display: flex; flex-direction: column; gap: 20px;">';
        
        // Основные работы
        if (studentData.works && studentData.works.length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            html += '<h3 style="color: #0066ff; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">Основные работы:</h3>';
            html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
            
            studentData.works.forEach((work, index) => {
                html += `
                    <div style="background: rgba(0, 102, 255, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #0066ff;">
                        <div style="font-weight: bold; color: #fff; margin-bottom: 5px;">Работа ${index + 1}</div>
                        ${work.type ? `<div style="color: #aaa; font-size: 0.9em; margin-bottom: 5px;">${work.type}</div>` : ''}
                        ${work.date ? `<div style="color: #aaa; font-size: 0.9em;">Дата: ${work.date}</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        // Дополнительные работы
        if (additional.length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            html += '<h3 style="color: #00ff00; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">Дополнительные работы:</h3>';
            html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
            
            additional.forEach((work, index) => {
                html += `
                    <div style="background: rgba(0, 255, 0, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #00ff00;">
                        <div style="font-weight: bold; color: #fff; margin-bottom: 5px;">Доп. работа ${index + 1}</div>
                        ${work.type ? `<div style="color: #aaa; font-size: 0.9em; margin-bottom: 5px;">${work.type}</div>` : ''}
                        ${work.date ? `<div style="color: #aaa; font-size: 0.9em;">Дата: ${work.date}</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        // Объяснения
        if (explanations.works && explanations.works.length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            html += '<h3 style="color: #ffd700; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">Объяснения:</h3>';
            html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
            
            explanations.works.forEach((work, index) => {
                html += `
                    <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #ffd700;">
                        <div style="font-weight: bold; color: #fff; margin-bottom: 5px;">Объяснение ${index + 1}</div>
                        ${work.type ? `<div style="color: #aaa; font-size: 0.9em; margin-bottom: 5px;">${work.type}</div>` : ''}
                        ${work.date ? `<div style="color: #aaa; font-size: 0.9em;">Дата: ${work.date}</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        // Слова
        if (words.length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            html += '<h3 style="color: #9d4edd; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">Выученные слова:</h3>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
            
            words.forEach(word => {
                html += `<span style="background: rgba(157, 78, 221, 0.2); color: #9d4edd; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; border: 1px solid rgba(157, 78, 221, 0.3);">${word}</span>`;
            });
            
            html += '</div></div>';
        }
        
        html += '</div>';
        
        if (html.includes('Основные работы:') || html.includes('Дополнительные работы:') || html.includes('Объяснения:') || html.includes('Выученные слова:')) {
            worksList.innerHTML = html;
        } else {
            worksList.innerHTML = '<div style="text-align: center; padding: 40px; color: #aaa;">Работы пока не добавлены</div>';
        }
    }, 300);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
});
