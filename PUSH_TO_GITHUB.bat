@echo off
echo ============================================
echo  Публикация Srtatifyx Bot на GitHub
echo ============================================
echo.

cd /d "C:\Users\Public\TMTrade_site\tg_bot"

:: Проверяем git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Git не установлен!
    echo Скачайте: https://git-scm.com/download/win
    pause
    exit /b
)

:: Инициализируем если нет
if not exist ".git" (
    git init
    echo Git инициализирован.
)

git add .
git commit -m "Bot update %date% %time%"

echo.
echo ============================================
echo  Теперь запустите команды из инструкции:
echo  1. git remote add origin YOUR_GITHUB_URL
echo  2. git push -u origin main
echo ============================================
pause
