#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE messenger_auth;
    CREATE DATABASE messenger_user;
    CREATE DATABASE messenger_chat;
    
    GRANT ALL PRIVILEGES ON DATABASE messenger_auth TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE messenger_user TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE messenger_chat TO $POSTGRES_USER;
EOSQL

echo "✅ Multiple databases created successfully"
