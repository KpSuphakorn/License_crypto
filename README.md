# License_crypto
Hellodawdawdaw

cd backend <br>
python -m venv venv <br>
.\venv\Scripts\activate <br>
pip install fastapi uvicorn pymongo python-dotenv pydantic <br>
pip install python-jose[cryptography]<br>
uvicorn app.main:app --reload --host localhost --port 5000 
