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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Данные студентов
const students = [
    "Alina", "Artem", "Dania", "Denis", "Lera", "Nastia Che",
    "Nastia S", "Natasha", "Rita", "Selin", "Vika"
];

// Хранилища
let studentWords = {};
let studentWorks = {};
let studentNames = {};
let additionalWorks = {};
let explanationsWorks = {};
let currentSelectedStudent = null;
let additionalExplanations = {};

// === НОВАЯ ЛОГИКА ПОДСЧЁТА ОЧКОВ ===

function getPointsByPlace(place) {
    if (place >= 1 && place <= 11) return 12 - place;
    return 0;
}

function calculateStudentStats() {
    const stats = {};

    students.forEach(name => {
        stats[name] = {
            name: name,
            totalPoints: 0,
            places: [],
            participations: 0,
            weeksParticipated: new Set()
        };
    });

    // Обработка rating1
    for (let i = 1; i <= 11; i++) {
        const key = `rating1_${i}`;
        const name = (studentNames[key] || '').trim();
        if (name && stats[name]) {
            stats[name].totalPoints += getPointsByPlace(i);
            stats[name].places.push(i);
            stats[name].participations++;
            stats[name].weeksParticipated.add('rating1');
        }
    }

    // Обработка rating2
    for (let i = 1; i <= 11; i++) {
        const key = `rating2_${i}`;
        const name = (studentNames[key] || '').trim();
        if (name && stats[name]) {
            stats[name].totalPoints += getPointsByPlace(i);
            stats[name].places.push(i);
            stats[name].participations++;
            stats[name].weeksParticipated.add('rating2');
        }
    }

    Object.values(stats).forEach(s => {
        if (s.places.length > 0) {
            s.avgPlace = (s.places.reduce((a,b)=>a+b,0) / s.places.length).toFixed(2);
        } else {
            s.avgPlace = '—';
        }
        s.weeksCount = s.weeksParticipated.size;
    });

    return Object.values(stats);
}

function sortStudents(studentsData) {
    return studentsData.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (a.avgPlace === '—') return 1;
        if (b.avgPlace === '—') return -1;
        return parseFloat(a.avgPlace) - parseFloat(b.avgPlace);
    });
}

// === ФУНКЦИЯ ПОЛУЧЕНИЯ КОЛИЧЕСТВА ВЫПОЛНЕННЫХ ЗАДАНИЙ ===

function getCompletedTasks(studentName) {
    let count = 0;
    // Основные работы
    for (let i = 1; i <= 3; i++) {
        const workKey = `${studentName}_work${i}`;
        if (studentWorks[workKey] && studentWorks[workKey].image) {
            count++;
        }
    }
    // Проверки
    for (let i = 1; i <= 3; i++) {
        const checkKey = `${studentName}_check${i}`;
        if (studentWorks[checkKey] && studentWorks[checkKey].image) {
            count++;
        }
    }
    // Дополнительные работы
    const additionalWorkList = additionalWorks[studentName] || [];
    count += additionalWorkList.filter(w => w.type === 'work').length;
    count += additionalWorkList.filter(w => w.type === 'check').length;

    return count;
}

// === ФУНКЦИЯ СОЗДАНИЯ КАРТОЧКИ УЧАСТНИКА ===

function createParticipantCard(studentName, isTop3 = false, place = null) {
    const completedTasks = getCompletedTasks(studentName);
    const card = document.createElement('div');
    card.className = `participant-card ${isTop3 ? 'top-three' : ''}`;
    
    // Определяем количество звёзд
    let starsCount = 1;
    if (place === 1) starsCount = 5;
    else if (place === 2) starsCount = 4;
    else if (place === 3) starsCount = 3;
    
    let starsHtml = '';
    for (let i = 0; i < starsCount; i++) {
        starsHtml += '<div class="star">⭐</div>';
    }
    
    card.innerHTML = `
        <div class="stars-container">
            ${starsHtml}
        </div>
        <div class="avatar-container">
            <img class="avatar" 
                 src="https://raw.githubusercontent.com/In-Error/global-elite-club/main/avatars${studentName}.png" 
                 alt="${studentName}"
                 onerror="this.src='https://via.placeholder.com/100?text=${studentName.charAt(0)}'">
        </div>
        <div class="name">${studentName}</div>
        <div class="tasks">Выполнено заданий: <span>${completedTasks}</span></div>
    `;
    card.onclick = () => {
        alert(`Вы выбрали участника: ${studentName}\nВыполнено заданий: ${completedTasks}`);
    };
    return card;
}

// === ФУНКЦИЯ ОБНОВЛЕНИЯ РЕЙТИНГА ===

function updateRatings() {
    const stats = calculateStudentStats();
    const sorted = sortStudents(stats);

    const top3Container = document.getElementById('top3Container');
    const allParticipantsGrid = document.getElementById('allParticipantsGrid');

    top3Container.innerHTML = '';
    allParticipantsGrid.innerHTML = '';

    // Заполняем ТОП-3
    for (let i = 0; i < Math.min(3, sorted.length); i++) {
        const student = sorted[i];
        const place = i + 1;
        const card = createParticipantCard(student.name, true, place);
        top3Container.appendChild(card);
    }

    // Заполняем сетку всех участников
    sorted.forEach(student => {
        const card = createParticipantCard(student.name);
        allParticipantsGrid.appendChild(card);
    });
}

// === ОСТАЛЬНАЯ ЛОГИКА ===

function updateSyncStatus(message, isSuccess = true) {
    const statusElement = document.getElementById('syncStatus');
    statusElement.textContent = message;
    statusElement.style.color = isSuccess ? '#00ff00' : '#ff4444';
    statusElement.style.textShadow = isSuccess ? '0 0 5px rgba(0, 255, 0, 0.7)' : '0 0 5px rgba(255, 68, 68, 0.7)';
}

async function loadAllData() {
    try {
        updateSyncStatus('🔄 Загрузка данных...');
        const wordsSnapshot = await db.collection('words').get();
        studentWords = {};
        wordsSnapshot.forEach(doc => {
            studentWords[doc.id] = doc.data().words || [];
        });
        const worksSnapshot = await db.collection('works').get();
        studentWorks = {};
        worksSnapshot.forEach(doc => {
            studentWorks[doc.id] = doc.data();
        });
        const namesSnapshot = await db.collection('ratingNames').get();
        studentNames = {};
        namesSnapshot.forEach(doc => {
            studentNames[doc.id] = doc.data().name;
        });
        const additionalSnapshot = await db.collection('additionalWorks').get();
        additionalWorks = {};
        additionalSnapshot.forEach(doc => {
            additionalWorks[doc.id] = doc.data().works || [];
        });
        const explanationsSnapshot = await db.collection('explanations').get();
        explanationsWorks = {};
        explanationsSnapshot.forEach(doc => {
            explanationsWorks[doc.id] = doc.data();
        });
        await loadAdditionalExplanations();
        updateSyncStatus('✅ Данные загружены');
        updateRatings();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        updateSyncStatus('❌ Ошибка загрузки', false);
        studentWords = JSON.parse(localStorage.getItem('studentWords')) || {};
        studentWorks = JSON.parse(localStorage.getItem('studentWorks')) || {};
        studentNames = JSON.parse(localStorage.getItem('studentNames')) || {};
        additionalWorks = JSON.parse(localStorage.getItem('additionalWorks')) || {};
        explanationsWorks = JSON.parse(localStorage.getItem('explanationsWorks')) || {};
        updateRatings();
    }
}

function initializeStudentsGrid() {
    const studentsGrid = document.getElementById('studentsGrid');
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
    section.classList.add('active');
    document.getElementById('selectedStudentName').textContent = student;
    section.scrollIntoView({ behavior: 'smooth' });
}

function closeStudentWorks() {
    currentSelectedStudent = null;
    const section = document.getElementById('studentWorksSection');
    section.classList.remove('active');
    initializeStudentsGrid();
    document.getElementById('selectedStudentName').textContent = "📄 Ваши Работы";
}

function initializeStudentWorks(student) {
    const worksList = document.getElementById('worksList');
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
                        ${createExplanationArea(student, 'explain1')}
                    </div>
                </div>
                <button class="add-work-btn" onclick="toggleAdditionalExplanations('${student}')">+</button>
                <div class="additional-works" id="additionalExplanations_${student}">
                    ${createAdditionalExplanations(student)}
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
                setTimeout(() => input.focus(), 0);
            });
        }
        event.preventDefault();
    }
}

let currentWordIndexes = {};
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
        const prevButton = displayElement.parentElement.querySelector('.nav-arrow:first-child');
        const nextButton = displayElement.parentElement.querySelector('.nav-arrow:last-child');
        if (words.length <= 1) {
            prevButton.disabled = true;
            nextButton.disabled = true;
        } else {
            prevButton.disabled = false;
            nextButton.disabled = false;
        }
        const counterElement = displayElement.closest('.words-container').querySelector('.words-counter');
        if (counterElement) {
            counterElement.textContent = `${words.length} words`;
        }
    }
}

function toggleAdditionalWorks(student, workType) {
    const element = document.getElementById(`additionalWorks_${student}_${workType}`);
    element.classList.toggle('active');
    const works = additionalWorks[student] || [];
    const hasWorksOfType = works.filter(w => w.type === workType).length > 0;
    if (!hasWorksOfType && element.classList.contains('active')) {
        addAdditionalWork(student, workType);
    }
}

function toggleAdditionalExplanations(student) {
    const element = document.getElementById(`additionalExplanations_${student}`);
    element.classList.toggle('active');
    const explanations = additionalExplanations[student] || [];
    if (explanations.length === 0 && element.classList.contains('active')) {
        addAdditionalExplanation(student);
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

function createAdditionalExplanations(student) {
    const explanations = additionalExplanations[student] || [];
    if (explanations.length === 0) {
        return '<div style="text-align: center; color: #aaa; padding: 10px;">Нет дополнительных объяснений</div>';
    }
    return `
        <div class="works-row">
            <div class="upload-areas">
                ${explanations.map(expl => createExplanationArea(student, `explain${expl.number}`)).join('')}
            </div>
        </div>
    `;
}

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
                <button class="delete-btn" onclick="deleteWork('${student}', '${workType}', false)">🗑️ Удалить</button>
                <input type="file" class="file-input" accept="image/*" onchange="handleWorkUpload(this, '${student}', '${workType}', false)">
            </div>
        `;
    } else {
        return `
            <div class="upload-area" onclick="triggerWorkUpload(this, '${student}', '${workType}', false)">
                <div class="work-number">${getWorkTitle(workType)}</div>
                <div class="upload-text">Нажмите для загрузки</div>
                <div class="compression-info">Поддерживаются файлы до 10MB</div>
                <input type="file" class="file-input" accept="image/*" onchange="handleWorkUpload(this, '${student}', '${workType}', false)">
            </div>
        `;
    }
}

function createExplanationArea(student, workType) {
    const workKey = `${student}_${workType}`;
    const workData = explanationsWorks[workKey];
    if (workData && workData.image) {
        const compressionInfo = workData.compressionInfo ? `<div class="compression-info">${workData.compressionInfo}</div>` : '';
        return `
            <div class="upload-area has-work">
                <img src="${workData.image}" class="work-preview" alt="${workType}" onclick="openFullscreen('${workData.image}')">
                <div class="work-number">${getExplanationTitle(workType)}</div>
                ${compressionInfo}
                <div class="upload-time">${formatDateTime(workData.timestamp)}</div>
                <button class="delete-btn" onclick="deleteWork('${student}', '${workType}', true)">🗑️ Удалить</button>
                <input type="file" class="file-input" accept="image/*" onchange="handleWorkUpload(this, '${student}', '${workType}', true)">
            </div>
        `;
    } else {
        return `
            <div class="upload-area" onclick="triggerExplanationUpload(this, '${student}', '${workType}')">
                <div class="work-number">${getExplanationTitle(workType)}</div>
                <div class="upload-text">Нажмите для загрузки</div>
                <div class="compression-info">Поддерживаются файлы до 10MB</div>
                <input type="file" class="file-input" accept="image/*" onchange="handleWorkUpload(this, '${student}', '${workType}', true)">
            </div>
        `;
    }
}

function triggerWorkUpload(areaElement, student, workType, isExplanation = false) {
    const fileInput = areaElement.querySelector('.file-input');
    fileInput.click();
}

function triggerExplanationUpload(areaElement, student, workType) {
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

function getWorkTitle(workType) {
    if (workType.startsWith('work') && workType.length > 4) {
        const num = workType.substring(4);
        return `Работа ${num}`;
    }
    if (workType.startsWith('check') && workType.length > 5) {
        const num = workType.substring(5);
        return `Проверка ${num}`;
    }
    const titles = {
        'work1': 'Работа 1', 'work2': 'Работа 2', 'work3': 'Работа 3',
        'check1': 'Проверка 1', 'check2': 'Проверка 2', 'check3': 'Проверка 3'
    };
    return titles[workType] || workType;
}

function getExplanationTitle(workType) {
    if (workType.startsWith('explain') && workType.length > 7) {
        const num = workType.substring(7);
        return `Объяснение ${num}`;
    }
    return 'Объяснение 1';
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
    }
}

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
        updateSyncStatus('❌ Ошибка сохранения', false);
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
        updateSyncStatus('❌ Ошибка сохранения', false);
        additionalWorks[studentName] = worksArray;
        localStorage.setItem('additionalWorks', JSON.stringify(additionalWorks));
    }
}

async function addAdditionalWork(studentName, workType) {
    const works = additionalWorks[studentName] || [];
    const newWorkNumber = works.length + 4;
    works.push({
        type: workType,
        number: newWorkNumber,
        name: `${workType === 'work' ? 'Работа' : 'Проверка'} ${newWorkNumber}`
    });
    await saveAdditionalWorks(studentName, works);
    if (currentSelectedStudent === studentName) {
        initializeStudentWorks(studentName);
    }
}

async function saveExplanation(student, workType, imageBase64, compressionInfo = '') {
    const workKey = `${student}_${workType}`;
    try {
        await db.collection('explanations').doc(workKey).set({
            image: imageBase64,
            student: student,
            workType: workType,
            compressionInfo: compressionInfo,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        explanationsWorks[workKey] = {
            image: imageBase64,
            compressionInfo: compressionInfo,
            timestamp: new Date().toISOString()
        };
        updateSyncStatus('✅ Объяснение сохранено');
    } catch (error) {
        console.error('Ошибка сохранения объяснения:', error);
        updateSyncStatus('❌ Ошибка сохранения', false);
        explanationsWorks[workKey] = {
            image: imageBase64,
            compressionInfo: compressionInfo,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('explanationsWorks', JSON.stringify(explanationsWorks));
    }
}

async function handleWorkUpload(input, student, workType, isExplanation = false) {
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
            if (isExplanation) {
                await saveExplanation(student, workType, compressionResult.data, compressionInfo);
            } else {
                await saveWork(student, workType, compressionResult.data, compressionInfo);
            }
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
                console.log(`Сжатие: ${(file.size/1024/1024).toFixed(1)}MB → ${(base64Size/1024/1024).toFixed(1)}MB (${Math.round((base64Size/file.size)*100)}%)`);
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
        updateSyncStatus('❌ Ошибка сохранения', false);
        studentWorks[workKey] = {
            image: imageBase64,
            compressionInfo: compressionInfo,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('studentWorks', JSON.stringify(studentWorks));
    }
}

async function deleteWork(student, workType, isExplanation = false) {
    const workKey = `${student}_${workType}`;
    if (confirm('Вы уверены, что хотите удалить эту работу?')) {
        try {
            if (isExplanation) {
                await db.collection('explanations').doc(workKey).delete();
                delete explanationsWorks[workKey];
            } else {
                await db.collection('works').doc(workKey).delete();
                delete studentWorks[workKey];
            }
            if (currentSelectedStudent === student) {
                initializeStudentWorks(student);
            }
            updateSyncStatus('✅ Работа удалена');
        } catch (error) {
            console.error('Ошибка удаления:', error);
            if (isExplanation) {
                delete explanationsWorks[workKey];
                localStorage.setItem('explanationsWorks', JSON.stringify(explanationsWorks));
            } else {
                delete studentWorks[workKey];
                localStorage.setItem('studentWorks', JSON.stringify(studentWorks));
            }
            if (currentSelectedStudent === student) {
                initializeStudentWorks(student);
            }
            updateSyncStatus('✅ Работа удалена (локально)');
        }
    }
}

async function saveRatingName(ratingType, position, name) {
    const key = `${ratingType}_${position}`;
    try {
        await db.collection('ratingNames').doc(key).set({
            name: name,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        studentNames[key] = name;
        updateSyncStatus('✅ Имя сохранено');
        updateRatings();
    } catch (error) {
        console.error('Ошибка сохранения имени:', error);
        updateSyncStatus('❌ Ошибка сохранения', false);
        studentNames[key] = name;
        localStorage.setItem('studentNames', JSON.stringify(studentNames));
        updateRatings();
    }
}

async function loadAdditionalExplanations() {
    try {
        const snapshot = await db.collection('additionalExplanations').get();
        additionalExplanations = {};
        snapshot.forEach(doc => {
            additionalExplanations[doc.id] = doc.data().explanations || [];
        });
    } catch (error) {
        console.error('Ошибка загрузки доп. объяснений:', error);
        additionalExplanations = JSON.parse(localStorage.getItem('additionalExplanations')) || {};
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
    initializeStudentsGrid();
    document.getElementById('workDate').valueAsDate = new Date();
});
