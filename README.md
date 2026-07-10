# filhaal — Personal Editorial Magazine

React + FastAPI + MongoDB.

## Prerequisites
- Node.js 18+ and Yarn (`npm install -g yarn`)
- Python 3.10+
- MongoDB running locally (mongodb://localhost:27017)

## 1. Backend
```
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
# backend/.env is already included
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## 2. Frontend
```
cd frontend
yarn install
# create frontend/.env with:  REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

## 3. Use it
- Site: http://localhost:3000
- Admin: http://localhost:3000/admin/login  (password = ADMIN_PASSWORD in backend/.env)
- 4 sample posts seed automatically on first run.

## Note on storage
The original build (from Emergent) used Emergent's proprietary object storage
service for uploaded images. That service only works inside the Emergent
platform, so this version stores uploaded files locally on disk instead
(`backend/uploads/`). Everything else is unchanged.
