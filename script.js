// === КОНФИГУРАЦИЯ FIREBASE ===
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

// Данные студентов
const students = [
    "Alina", "Artem", "Dania", "Denis", "Lera", "Nastia Che",
    "Nastia S", "Natasha", "Rita", "Selin", "Vika"
];

// Хранилища данных
let studentData = {};
let currentSelectedStudent = null;

// Обновление статуса синхронизации
function updateSyncStatus(message, isSuccess = true) {
    const statusElement = document.getElementById('syncStatus');
    statusElement.textContent = message;
    statusElement.style.color = isSuccess ? '#00ff00' : '#ff4444';
    statusElement.style.textShadow = isSuccess ? '0 0 8px rgba(0, 255, 0, 0.7)' : '0 0 8px rgba(255, 68, 68, 0.7)';
    if (!isSuccess) {
        statusElement.classList.add('error');
    } else {
        statusElement.classList.remove('error');
    }
}

// Загрузка всех данных
async function loadAllData() {
    try {
        updateSyncStatus('🔄 Загрузка данных...');
        
        // Создаем базовую структуру данных для каждого студента
        students.forEach(student => {
            studentData[student] = {
                name: student,
                speedPoints: 0,
                errorPoints: 0,
                totalPoints: 0,
                speedPlaces: [],
                errorPlaces: [],
                totalParticipations: 0,
                completedTasks: 0
            };
        });
        
        // Загружаем сохраненные рейтинги
        const ratingsSnapshot = await db.collection('ratings').get();
        
        if (ratingsSnapshot.empty) {
            console.log('Нет сохраненных данных о рейтингах');
        } else {
            ratingsSnapshot.forEach(doc => {
                const data = doc.data();
                // Обрабатываем данные рейтингов
            });
        }
        
        updateSyncStatus('✅ Данные загружены');
        
        // Инициализируем интерфейс с данными по умолчанию
        initializeInterface();
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        updateSyncStatus('⚠️ Используем локальные данные', false);
        
        // Используем данные по умолчанию
        students.forEach(student => {
            studentData[student] = {
                name: student,
                speedPoints: 0,
                errorPoints: 0,
                totalPoints: 0,
                speedPlaces: [],
                errorPlaces: [],
                totalParticipations: 0,
                completedTasks: Math.floor(Math.random() * 10) // Для примера
            };
        });
        
        initializeInterface();
    }
}

// Инициализация интерфейса
function initializeInterface() {
    // Инициализируем админку
    initializeAdminPanel();
    
    // Обновляем отображение рейтингов
    updateRatingsDisplay();
}

// Инициализация админ-панели
function initializeAdminPanel() {
    const speedInputs = document.getElementById('speedInputs');
    const errorsInputs = document.getElementById('errorsInputs');
    
    speedInputs.innerHTML = '';
    errorsInputs.innerHTML = '';
    
    // Создаем выпадающие списки для рейтинга скорости
    for (let i = 1; i <= 11; i++) {
        const speedDiv = document.createElement('div');
        speedDiv.className = 'position-input';
        speedDiv.innerHTML = `
            <span class="position-number">${i}</span>
            <select class="student-select" id="speed_${i}">
                <option value="">-- Выберите --</option>
                ${students.map(student => `<option value="${student}">${student}</option>`).join('')}
            </select>
        `;
        speedInputs.appendChild(speedDiv);
    }
    
    // Создаем выпадающие списки для рейтинга ошибок
    for (let i = 1; i <= 11; i++) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'position-input';
        errorDiv.innerHTML = `
            <span class="position-number">${i}</span>
            <select class="student-select" id="error_${i}">
                <option value="">-- Выберите --</option>
                ${students.map(student => `<option value="${student}">${student}</option>`).join('')}
            </select>
        `;
        errorsInputs.appendChild(errorDiv);
    }
}

// Обновление отображения рейтингов
function updateRatingsDisplay() {
    // Сортируем студентов по общему количеству очков
    const sortedStudents = Object.values(studentData).sort((a, b) => {
        return b.totalPoints - a.totalPoints;
    });
    
    // Обновляем ТОП-3
    updateTop3Display(sortedStudents);
    
    // Обновляем сетку всех участников
    updateAllParticipantsGrid(sortedStudents);
}

// Обновление ТОП-3
function updateTop3Display(sortedStudents) {
    const top3Container = document.getElementById('top3Container');
    top3Container.innerHTML = '';
    
    // Показываем только первых трех
    for (let i = 0; i < Math.min(3, sortedStudents.length); i++) {
        const student = sortedStudents[i];
        const card = createParticipantCard(student, true, i + 1);
        top3Container.appendChild(card);
    }
}

// Обновление сетки всех участников
function updateAllParticipantsGrid(sortedStudents) {
    const allParticipantsGrid = document.getElementById('allParticipantsGrid');
    allParticipantsGrid.innerHTML = '';
    
    sortedStudents.forEach((student, index) => {
        const card = createParticipantCard(student, false, index + 1);
        allParticipantsGrid.appendChild(card);
    });
}

// Создание карточки участника
function createParticipantCard(student, isTop3 = false, place = null) {
    const card = document.createElement('div');
    card.className = `participant-card ${isTop3 ? 'top-three' : ''}`;
    
    // Определяем количество звезд для ТОП-3
    let starsHtml = '';
    if (isTop3 && place <= 3) {
        const starCount = 5 - (place - 1) * 1;
        for (let i = 0; i < starCount; i++) {
            starsHtml += '<div class="star">⭐</div>';
        }
    }
    
    card.innerHTML = `
        ${isTop3 ? `<div class="stars-container">${starsHtml}</div>` : ''}
        <div class="avatar-container">
            <img class="avatar" 
                 src="avatars/${student.name}.png" 
                 alt="${student.name}"
                 onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${student.name}&background=0066ff&color=fff&size=100'">
        </div>
        <div class="name">${student.name}</div>
        <div class="points">Очков: <span>${student.totalPoints}</span></div>
        <div class="tasks">Заданий: <span>${student.completedTasks}</span></div>
    `;
    
    // При клике на карточку показываем информацию
    card.onclick = () => {
        alert(`🎯 ${student.name}\n\n🏆 Общих очков: ${student.totalPoints}\n⚡ Очков скорости: ${student.speedPoints}\n✅ Очков ошибок: ${student.errorPoints}\n📊 Участий: ${student.totalParticipations}\n✅ Выполнено заданий: ${student.completedTasks}`);
    };
    
    return card;
}

// Фильтрация участников
function filterParticipants() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    const allCards = document.querySelectorAll('.participant-card');
    
    if (!searchQuery) {
        // Показать все карточки
        allCards.forEach(card => {
            card.style.display = 'flex';
        });
        return;
    }
    
    // Фильтруем карточки
    allCards.forEach(card => {
        const studentName = card.querySelector('.name').textContent.toLowerCase();
        if (studentName.includes(searchQuery)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Сохранение результатов недели
async function saveWeeklyResults() {
    const weekNumber = document.getElementById('weekNumber').value;
    
    if (!weekNumber || weekNumber < 1) {
        alert('Пожалуйста, введите корректный номер недели');
        return;
    }
    
    // Собираем данные рейтинга скорости
    const speedResults = [];
    for (let i = 1; i <= 11; i++) {
        const select = document.getElementById(`speed_${i}`);
        if (select.value) {
            speedResults.push(select.value);
        }
    }
    
    // Собираем данные рейтинга ошибок
    const errorResults = [];
    for (let i = 1; i <= 11; i++) {
        const select = document.getElementById(`error_${i}`);
        if (select.value) {
            errorResults.push(select.value);
        }
    }
    
    if (speedResults.length === 0 && errorResults.length === 0) {
        alert('Нет данных для сохранения. Заполните хотя бы один рейтинг.');
        return;
    }
    
    try {
        updateSyncStatus('🔄 Сохранение...');
        
        // Сохраняем данные в Firebase
        await db.collection('weeklyResults').doc(`week_${weekNumber}`).set({
            week: parseInt(weekNumber),
            speed: speedResults,
            errors: errorResults,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Обновляем очки студентов
        updateStudentPoints(speedResults, errorResults);
        
        updateSyncStatus('✅ Результаты сохранены');
        alert(`✅ Результаты недели ${weekNumber} успешно сохранены!`);
        
        // Обновляем отображение
        updateRatingsDisplay();
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        updateSyncStatus('❌ Ошибка сохранения', false);
        alert('Ошибка при сохранении. Попробуйте еще раз.');
    }
}

// Обновление очков студентов
function updateStudentPoints(speedResults, errorResults) {
    // Сбрасываем очки
    Object.keys(studentData).forEach(studentName => {
        studentData[studentName].speedPoints = 0;
        studentData[studentName].errorPoints = 0;
        studentData[studentName].totalPoints = 0;
        studentData[studentName].speedPlaces = [];
        studentData[studentName].errorPlaces = [];
        studentData[studentName].totalParticipations = 0;
    });
    
    // Начисляем очки за скорость (1 место = 11 очков, 2 = 10, ..., 11 = 1)
    speedResults.forEach((studentName, index) => {
        if (studentData[studentName]) {
            const points = 11 - index;
            studentData[studentName].speedPoints += points;
            studentData[studentName].totalPoints += points;
            studentData[studentName].speedPlaces.push(index + 1);
            studentData[studentName].totalParticipations++;
        }
    });
    
    // Начисляем очки за ошибки
    errorResults.forEach((studentName, index) => {
        if (studentData[studentName]) {
            const points = 11 - index;
            studentData[studentName].errorPoints += points;
            studentData[studentName].totalPoints += points;
            studentData[studentName].errorPlaces.push(index + 1);
            studentData[studentName].totalParticipations++;
        }
    });
}

// Переключение страниц
function showPage(pageId) {
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Показываем выбранную страницу
    document.getElementById(pageId).classList.add('active');
    
    // Если это страница работ, инициализируем сетку студентов
    if (pageId === 'worksPage') {
        initializeStudentsGrid();
    }
    
    // Прокручиваем наверх
    window.scrollTo(0, 0);
}

// Инициализация сетки студентов на странице работ
function initializeStudentsGrid() {
    const studentsGrid = document.getElementById('studentsGrid');
    studentsGrid.innerHTML = '';
    
    students.forEach(student => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <div class="student-card-name">${student}</div>
            <div class="student-card-words">Заданий: ${studentData[student]?.completedTasks || 0}</div>
        `;
        card.onclick = () => openStudentWorks(student);
        studentsGrid.appendChild(card);
    });
}

// Открытие работ студента
function openStudentWorks(student) {
    currentSelectedStudent = student;
    
    // Подсвечиваем выбранную карточку
    document.querySelectorAll('.student-card').forEach(card => {
        card.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Показываем секцию работ
    const section = document.getElementById('studentWorksSection');
    section.classList.add('active');
    document.getElementById('selectedStudentName').textContent = student;
    
    // Прокручиваем к секции
    section.scrollIntoView({ behavior: 'smooth' });
    
    // Инициализируем работы (здесь можно добавить реальные данные)
    initializeStudentWorks(student);
}

// Закрытие работ студента
function closeStudentWorks() {
    currentSelectedStudent = null;
    const section = document.getElementById('studentWorksSection');
    section.classList.remove('active');
    
    // Снимаем подсветку со всех карточек
    document.querySelectorAll('.student-card').forEach(card => {
        card.classList.remove('active');
    });
}

// Инициализация работ студента (заглушка)
function initializeStudentWorks(student) {
    const worksList = document.getElementById('worksList');
    worksList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #aaa;">
            <h3 style="color: #fff; margin-bottom: 20px;">Работы ${student}</h3>
            <p>Здесь будут отображаться загруженные работы студента</p>
            <p style="margin-top: 20px; font-size: 0.9em;">
                ⚠️ Функционал загрузки работ будет добавлен позже
            </p>
        </div>
    `;
}

// Модальное окно
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Приложение запускается...');
    loadAllData();
});
