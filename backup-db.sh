#!/bin/bash

# Database backup script
echo "====================================="
echo "Database Backup Utility"
echo "====================================="

# Check environment
read -p "Environment (dev/prod): " env

if [ "$env" == "prod" ]; then
    compose_file="docker-compose.prod.yml"
    container="prod_mysql"
else
    compose_file="docker-compose.yml"
    container="dev_mysql"
fi

# Load environment variables
if [ "$env" == "prod" ]; then
    source backend/.env.prod
else
    source backend/.env.dev
fi

# Create backups directory
mkdir -p backups

# Generate timestamp
timestamp=$(date +%Y%m%d_%H%M%S)
backup_file="backups/${env}_backup_${timestamp}.sql"

# Create backup
echo "📦 Creating backup..."
docker-compose -f $compose_file exec -T mysql mysqldump \
    -u ${DB_USER} \
    -p${DB_PASSWORD} \
    ${DB_NAME} > ${backup_file}

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: ${backup_file}"
    
    # Compress backup
    gzip ${backup_file}
    echo "✅ Backup compressed: ${backup_file}.gz"
    
    # Show backup size
    size=$(du -h "${backup_file}.gz" | cut -f1)
    echo "📊 Backup size: ${size}"
    
    # Clean old backups (keep last 10)
    echo "🧹 Cleaning old backups..."
    ls -t backups/${env}_backup_*.sql.gz | tail -n +11 | xargs -r rm
    echo "✅ Kept last 10 backups"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "====================================="