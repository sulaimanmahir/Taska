@echo off
cd /d "%~dp0backend"
start "Taska Backend" cmd /k "php artisan serve --host=127.0.0.1 --port=8000"
