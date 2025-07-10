# deploy.bat - Versão para Windows
cat <<EOF > deploy.bat
@echo off
IF EXIST .env (
    echo Carregando variaveis do .env...
    for /f "tokens=* delims=" %%a in (.env) do set %%a
)

cd backend\api

IF NOT EXIST venv (
    echo Criando ambiente virtual...
    python -m venv venv
)

call venv\Scripts\activate.bat

python -c "import flask" 2>NUL
IF ERRORLEVEL 1 (
    echo Instalando dependencias...
    pip install -r requirements.txt
)

set FLASK_APP=app.py
set FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
EOF

# Makefile para Linux/macOS
cat <<EOF > ../Makefile
.PHONY: setup deploy backup

setup:
	@echo "🔧 Executando setup do banco..."
	@cd scripts && ./setup.sh

deploy:
	@echo "🚀 Iniciando deploy do backend..."
	@cd scripts && ./deploy.sh

backup:
	@echo "💾 Gerando backup do banco..."
	@cd scripts && ./backup-db.sh
EOF