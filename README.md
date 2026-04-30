# LEKTOR жобасы

Бұл репозиторийде LEKTOR жобасының `frontend` және `backend` бастапқы кодтары сақталған.

## Жоба құрылымы

- `frontend/` - статикалық интерфейс файлдары (`index.html`, `css/`, `js/`, `assets/`)
- `backend/` - Django backend коды
- `backend/.env.example` - орта айнымалыларының үлгі файлы
- `backend/requirements.txt` - Python кітапханалары

## GitHub-та әдейі сақталмайтын файлдар

Төмендегі файлдар локалды немесе құпия болғандықтан репозиторийге жүктелмейді:

- `backend/.env`
- `backend/venv/`
- `backend/db.sqlite3`
- `backend/credentials.json`
- `backend/token.json`
- Google service account `.json` файлдары
- логтар мен уақытша файлдар

## Локалды іске қосу

### 1. Репозиторийді жүктеп алу

```powershell
git clone <repository-url>
cd lektor-project
```

### 2. Backend үшін `.env` файлын жасау

```powershell
copy backend\.env.example backend\.env
```

Содан кейін `backend/.env` файлын ашып, керек мәндерді толтыру қажет.

### 3. Virtual environment жасап, кітапханаларды орнату

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Таза база жасау

```powershell
python manage.py migrate
```

Осы команда локалды жаңа таза `db.sqlite3` базасын жасайды.

### 5. Backend-ті іске қосу

```powershell
python manage.py runserver
```

Backend мекенжайы:

`http://127.0.0.1:8000/`

### 6. Frontend-ті іске қосу

`frontend/index.html` файлын Live Server немесе кез келген локалды статикалық сервер арқылы ашу керек.

Ұсынылатын frontend мекенжайы:

`http://127.0.0.1:5500/`

## Ескерту

- Жоба `migrate` командасынан кейін таза базамен ашыла алады.
- Google OAuth, Gemini, Vertex AI және Azure Speech функциялары жұмыс істеуі үшін `backend/.env` ішінде дұрыс кілттер болуы керек.
- Егер бұл кілттер толтырылмаса, сол интеграцияларға байланысты функциялар жұмыс істемеуі мүмкін.
