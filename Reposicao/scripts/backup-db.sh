# backup-db.sh - Faz dump/export do banco (modelo simplificado)
cat <<EOF > backup-db.sh
#!/bin/bash

echo "📦 Gerando backup das tabelas de reposição..."
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_reposicao_\$DATE.sql"

sqlplus -s \$DB_USER/\$DB_PASSWORD@\$DB_HOST:\$DB_PORT/\$DB_SERVICE <<SQL
SET ECHO OFF
SET FEEDBACK OFF
SET PAGESIZE 0
SET LINESIZE 1000
SPOOL \$BACKUP_FILE
SELECT DBMS_METADATA.GET_DDL('TABLE', 'J_CARRINHO_TEMP') FROM DUAL;
SELECT DBMS_METADATA.GET_DDL('TABLE', 'J_PRODUTO') FROM DUAL;
SELECT DBMS_METADATA.GET_DDL('TABLE', 'J_ENDERE') FROM DUAL;
SPOOL OFF
EXIT
SQL

echo "✅ Backup salvo em: \$BACKUP_FILE"
EOF

chmod +x backup-db.sh