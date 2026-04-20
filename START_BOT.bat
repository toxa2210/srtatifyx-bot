@echo off
cd /d "%~dp0"
echo === Srtatifyx Telegram Bot ===

:: Создаём venv если нет
if not exist "venv\Scripts\python.exe" (
    echo Создаём виртуальное окружение...
    python -m venv venv
)

:: Устанавливаем зависимости
echo Устанавливаем зависимости...
venv\Scripts\pip install -r requirements.txt --quiet

:: Запускаем бота
echo Запускаем бота...
echo Для остановки нажмите Ctrl+C
echo.
venv\Scripts\python bot.py
pause
