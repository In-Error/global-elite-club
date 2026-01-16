console.log('✅ script.js загружен!');

// Основные функции
function showPage(pageId) {
    console.log('Показываем страницу:', pageId);
    
    // Скрыть все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Показать нужную страницу
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}

function loginAsStudent() {
    const studentName = document.getElementById('studentName').value;
    
    if (!studentName) {
        alert('Выберите ваше имя!');
        return;
    }
    
    console.log('Вход как ученик:', studentName);
    
    // Прячем форму входа
    document.getElementById('loginForm').style.display = 'none';
    
    // Показываем основной контент
    document.getElementById('mainContent').style.display = 'block';
    
    // Показываем имя пользователя
    document.getElementById('userInfo').textContent = studentName;
    document.getElementById('userInfo').style.display = 'inline';
    
    // Показываем кнопку "Мои работы"
    document.getElementById('worksPageBtn').style.display = 'inline-block';
    
    // Показываем заголовок
    document.getElementById('studentTitle').textContent = `Добро пожаловать, ${studentName}!`;
    document.getElementById('studentTitle').style.display = 'block';
    
    // Показываем кнопку выхода
    document.getElementById('logoutBtn').style.display = 'inline-block';
    
    // Сохраняем в localStorage
    localStorage.setItem('currentStudent', studentName);
}

function logout() {
    localStorage.removeItem('currentStudent');
    location.reload();
}

// Когда страница загружена
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен');
    
    // Показать форму входа
    document.getElementById('loginForm').style.display = 'block';
    
    // Проверить, есть ли сохраненный ученик
    const savedStudent = localStorage.getItem('currentStudent');
    if (savedStudent) {
        document.getElementById('studentName').value = savedStudent;
        loginAsStudent();
    }
    
    // Назначить обработчики кнопок
    document.getElementById('loginStudentBtn').addEventListener('click', loginAsStudent);
    
    document.getElementById('showStudentLogin').addEventListener('click', function() {
        document.getElementById('studentLogin').style.display = 'block';
        document.getElementById('adminLogin').style.display = 'none';
    });
    
    document.getElementById('showAdminLogin').addEventListener('click', function() {
        document.getElementById('studentLogin').style.display = 'none';
        document.getElementById('adminLogin').style.display = 'block';
    });
    
    // Вход для админа (пока просто демо)
    document.getElementById('loginAdminBtn').addEventListener('click', function() {
        const password = document.getElementById('adminPassword').value;
        if (password === 'admin123') {
            alert('Вход как администратор успешен!');
            // Здесь будет код для входа админа
        } else {
            alert('Неверный пароль!');
        }
    });
});
