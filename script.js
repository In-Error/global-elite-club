<div id="loginForm" style="display: none; max-width: 500px; margin: 50px auto; padding: 30px; background: rgba(0, 0, 0, 0.9); border-radius: 15px; border: 2px solid #00ff00; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
    <h2 style="color: #00ff00; text-align: center; margin-bottom: 30px; font-size: 28px;">Global Elite Club</h2>
    
    <div style="margin-bottom: 20px; text-align: center;">
        <button id="showStudentLogin" style="padding: 12px 25px; margin: 0 10px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            👤 Войти как ученик
        </button>
        <button id="showAdminLogin" style="padding: 12px 25px; margin: 0 10px; background: #ff6600; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            👑 Войти как администратор
        </button>
    </div>
    
    <input type="hidden" id="loginType" value="student">
    
    <!-- Форма для учеников -->
    <div id="studentLogin" style="display: block;">
        <h3 style="color: #00ff00; text-align: center; margin-bottom: 20px;">Вход для учеников</h3>
        
        <div style="margin-bottom: 20px;">
            <label style="color: #00ff00; display: block; margin-bottom: 8px; font-size: 16px;">Ваше имя:</label>
            <select id="studentName" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid #00ff00; color: white; border-radius: 5px; font-size: 16px;">
                <option value="">Выберите ваше имя</option>
                <option value="Alina">Alina</option>
                <option value="Artem">Artem</option>
                <option value="Dania">Dania</option>
                <option value="Denis">Denis</option>
                <option value="Lera">Lera</option>
                <option value="Nastia Che">Nastia Che</option>
                <option value="Nastia S">Nastia S</option>
                <option value="Natasha">Natasha</option>
                <option value="Rita">Rita</option>
                <option value="Selin">Selin</option>
                <option value="Vika">Vika</option>
            </select>
        </div>
        
        <button id="loginBtn" style="width: 100%; padding: 15px; background: #00ff00; color: black; border: none; border-radius: 5px; font-weight: bold; font-size: 18px; cursor: pointer; margin-top: 20px;">
            Войти
        </button>
        
        <p style="color: #aaa; text-align: center; margin-top: 15px; font-size: 14px;">
            Просто выберите ваше имя из списка и нажмите "Войти"
        </p>
    </div>
    
    <!-- Форма для администратора -->
    <div id="adminLogin" style="display: none;">
        <h3 style="color: #ff6600; text-align: center; margin-bottom: 20px;">Вход для администратора</h3>
        
        <div style="margin-bottom: 20px;">
            <label style="color: #ff6600; display: block; margin-bottom: 8px; font-size: 16px;">Логин:</label>
            <input type="text" id="adminUsername" value="SV" readonly
                   style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid #ff6600; color: #ff6600; border-radius: 5px; font-size: 16px; font-weight: bold;">
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="color: #ff6600; display: block; margin-bottom: 8px; font-size: 16px;">Пароль:</label>
            <input type="password" id="adminPassword" placeholder="Введите пароль"
                   style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid #ff6600; color: white; border-radius: 5px; font-size: 16px;">
        </div>
        
        <button id="loginBtn" style="width: 100%; padding: 15px; background: #ff6600; color: white; border: none; border-radius: 5px; font-weight: bold; font-size: 18px; cursor: pointer; margin-top: 20px;">
            Войти как администратор
        </button>
        
        <p style="color: #aaa; text-align: center; margin-top: 15px; font-size: 14px;">
            Используйте пароль администратора
        </p>
    </div>
</div>

<!-- Основной контент (скрыт до входа) -->
<div id="mainContent" style="display: none;">
    <!-- Навигация -->
    <nav class="main-nav" style="background: rgba(0, 0, 0, 0.8); padding: 15px; border-bottom: 2px solid #00ff00; display: flex; align-items: center;">
        <button onclick="showPage('mainPage')" style="margin-right: 15px;">🏠 Главная</button>
        
        <!-- Для учеников - кнопка "Мои работы" -->
        <button id="worksPageBtn" style="margin-right: 15px; display: none;" onclick="showPage('worksPage')">
            📄 Мои работы
        </button>
        
        <!-- Для админа - кнопка "Все работы" -->
        <button id="allWorksBtn" style="margin-right: 15px; display: none;" onclick="showPage('worksPage')">
            📚 Все работы
        </button>
        
        <button onclick="showPage('helpPage')" style="margin-right: 15px;">❓ Как объяснить ошибки</button>
        
        <button id="adminNav" style="margin-right: 15px; display: none;" onclick="showPage('adminPage')">
            ⚙️ Админка
        </button>
        
        <div style="flex-grow: 1;"></div>
        
        <span id="userInfo" style="color: #00ff00; margin-right: 15px; display: none; font-weight: bold;"></span>
        
        <button id="logoutBtn" style="display: none; background: #ff4444; color: white;" onclick="logout()">
            🚪 Выйти
        </button>
    </nav>
    
    <!-- Заголовок для ученика -->
    <h2 id="studentTitle" style="color: #00ff00; text-align: center; margin: 20px 0; display: none;"></h2>
    
    <!-- Остальной контент -->
    <!-- ... существующий HTML ... -->
</div>
