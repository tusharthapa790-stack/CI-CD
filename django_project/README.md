# Django Nexus Project - Ready for VSCode

This is a complete, fully-scaffolded, standard **Python Django** project designed for your learning blueprint. You can download this directory by exporting the workspace (using ZIP or GitHub export in Google AI Studio) and open it directly in VSCode.

## Folder Directory Structure
- `myproject/`: Project core configurations (`settings.py`, `urls.py`, `wsgi.py`)
- `blog/`: Modular django app containing:
  - `models.py`: Blog categories, authored Posts, comments schemas
  - `views.py`: List and detail presentation templates
  - `admin.py`: Administration registrations with search controls
  - `templates/`: Full Tailwind CSS-styled HTML frontends
- `manage.py`: Django administrator command utility
- `requirements.txt`: Python packages to install

## VSCode Quick Start Guide

Follow these simple steps in VSCode to execute your server locally:

### 1. Open Folder in VSCode
Open VSCode, click **File > Open Folder**, and select the `django_project` directory.

### 2. Set Up Python Virtual Environment
Open the built-in terminal (`Ctrl + \`` or **Terminal > New Terminal**) and execute:
```bash
# Create the environment
python -m venv venv

# Activate the environment
# On macOS / Linux:
source venv/bin/activate
# On Windows (cmd):
venv\Scripts\activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
```

### 3. Install Django Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create Database and Run Migrations
Django will auto-scaffold a local SQLite database file `db.sqlite3` in your workspace:
```bash
python manage.py makemigrations blog
python manage.py migrate
```

### 5. Create an Administrative Superuser
Create your admin profile so you can add blog posts, tags, and comments in the portal:
```bash
python manage.py createsuperuser
```
Follow the prompt instructions (username, email, password).

### 6. Run the Dev Server
Launch the server:
```bash
python manage.py runserver
```
Open your browser and visit:
- **Main Blog Feed**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Django Admin Console**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) (log in with your superuser credentials!)
