# deploy.sh - Inicializa o backend Flask com venv e dependências
cat <<EOF > deploy.sh
#!/bin/bash

LOG="deploy_\$(date +%Y%m%d_%H%M%S).log"

if [ -f .env ]; then
    echo "🔁 Carregando variáveis do .env..." | tee -a "\$LOG"
    export \$(grep -v '^#' .env | xargs)
else
    echo "⚠️ Arquivo .env não encontrado." | tee -a "\$LOG"
fi

cd backend/api || exit

if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..." | tee -a "\$LOG"
    python3 -m venv venv
fi

source venv/bin/activate

if ! python -c "import flask" &> /dev/null; then
    echo "📦 Instalando dependências com pip..." | tee -a "\$LOG"
    pip install -r requirements.txt
fi

echo "🚀 Iniciando servidor Flask..." | tee -a "\$LOG"
export FLASK_APP=app.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000 | tee -a "\$LOG"
EOF

chmod +x deploy.sh