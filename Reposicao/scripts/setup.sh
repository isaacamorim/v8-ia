#!/bin/bash

# setup.sh - Roda as migrações e insere os dados iniciais do projeto de reposição
LOG_FILE="setup_\$(date +%Y%m%d_%H%M%S).log"
echo "🔧 Iniciando configuração do banco de dados..." | tee -a "$LOG_FILE"

# Exige que as variáveis estejam definidas no ambiente ou .env (exportadas)
if [[ -z "$DB_USER" || -z "$DB_PASSWORD" || -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_SERVICE" ]]; then
    echo "❌ Variáveis de ambiente do banco não definidas." | tee -a "$LOG_FILE"
    echo "Certifique-se de ter exportado: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_SERVICE" | tee -a "$LOG_FILE"
    exit 1
fi

# Rodar scripts de migração
sqlplus $DB_USER/$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_SERVICE @database/migrations/001-initial-schema.sql | tee -a "$LOG_FILE"
sqlplus $DB_USER/$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_SERVICE @database/migrations/002-add-reposicao-fields.sql | tee -a "$LOG_FILE"

# Inserir dados iniciais
sqlplus $DB_USER/$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_SERVICE @database/seeds/initial-products.sql | tee -a "$LOG_FILE"

echo "✅ Setup do banco concluído." | tee -a "$LOG_FILE"