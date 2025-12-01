@echo off
echo ========================================
echo   SUBIENDO CAMBIOS A GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Agregando archivos...
git add .

echo [2/3] Creando commit...
git commit -m "Actualizacion de la pagina web"

echo [3/3] Subiendo a GitHub...
git push origin main

echo.
echo ========================================
echo   CAMBIOS SUBIDOS EXITOSAMENTE!
echo   Espera 1-2 minutos para ver los cambios en:
echo   https://braian26valdez.github.io/burga-al-corte-web/
echo ========================================
echo.
pause
