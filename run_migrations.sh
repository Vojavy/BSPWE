#!/bin/bash
cd /var/www/backend
php bin/console doctrine:migrations:migrate -n
