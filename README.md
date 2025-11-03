# Cat Explorer (Prueba Técnica)

Aplicación web simple para explorar razas de gatos y guardar favoritos.

## Tecnologías

-   **Frontend:** React, TypeScript, TailwindCSS
    
-   **Backend:** Django, Django Rest Framework
    
-   **Base de Datos:** SQLite3 (por defecto)
    

## Cómo Ejecutar el Proyecto

Necesitarás **dos terminales** abiertas.

### Terminal 1: Backend (Django)

1.  **Activar Entorno Virtual:**
    
    ```
    # macOS/Linux
    source venv/bin/activate
    # Windows
    # venv\Scripts\activate
    
    ```
    
2.  **(IMPORTANTE) Configurar API Key:**
    
    -   Abre `backend/backend/settings.py`.
        
    -   Busca `CAT_API_KEY = ...` y pega tu clave.
        
3.  **Crear la Base de Datos (solo la primera vez):**
    
    ```
    python backend/manage.py migrate
    
    ```
    
4.  **Iniciar el Servidor Backend:**
    
    ```
    python backend/manage.py runserver
    
    ```
    
    _(Déjalo corriendo en `http://127.0.0.1:8000`)_
    

### Terminal 2: Frontend (React)

1.  **Navegar a la carpeta:**
    
    ```
    cd frontend
    
    ```
    
2.  **Instalar dependencias (solo la primera vez):**
    
    ```
    pnpm install
    
    ```
    
3.  **Iniciar el Servidor Frontend:**
    
    ```
    pnpm start
    
    ```
    
    _(Se abrirá en `http://localhost:3000`)_
    

## Flujo de Prueba

1.  Abre `http://localhost:3000`.
    
2.  Haz clic en "Regístrate" y crea un usuario.
    
3.  Serás redirigido al "Dashboard".
    
4.  Añade un gato a favoritos usando el botón de corazón.
    
5.  Ve a la pestaña "Mis Favoritos" para ver el gato guardado.
    
6.  Haz clic en "Log Out" para salir.