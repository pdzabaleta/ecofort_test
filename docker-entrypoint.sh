
set -e


echo "Esperando a la base de datos..."
while ! nc -z $DB_HOST 5432; do
  sleep 1
done
echo "¡Base de datos lista!"

cd backend/

echo "Ejecutando migraciones..."
python manage.py migrate

echo "Iniciando servidor de Django..."
python manage.py runserver 0.0.0.0:8000
