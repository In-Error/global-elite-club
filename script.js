// === ФУНКЦИИ ДЛЯ РАЗДЕЛА ПОМОЩИ (НОВЫЕ) ===

let helpSections = {};
let currentEditingSectionId = null;
let isHelpAdminMode = false;

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
                    <span>🕐 ${formatDate(section.createdAt)}</span>
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

// Вспомогательная функция для форматирования даты
function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return '';
    }
}

// Триггер загрузки картинки (аналогично "Вашим работам")
function triggerSectionImageUpload(areaElement, sectionId, imageIndex) {
    const fileInput = areaElement.querySelector('.file-input');
    if (fileInput) {
        fileInput.click();
    }
}
[file content end]
