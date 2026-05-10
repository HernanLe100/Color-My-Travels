# Color My Travels
Keep track of your travels in an easy and visually appealing way.

By Angela Cai, Lucy Chen, and Hernan Le

## Running instructions (local)
Make sure Python and npm versions are up to date (at least Python 3.12.10 and npm 10.9.2)

### Backend:

cd backend

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt

Create a .env file in the backend folder and paste the external DB url and other env vars from Render

Generate cert.pem and key.pem files in the backend folder so that the app can run with HTTPS instead of HTTP:

openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

python app.py

### Frontend:
cd frontend

npm install

npm run dev

If the page is marked as "connection is not private", click on the screen and type "thisisunsafe" to bypass and continue to the site

If unable to login (i.e. console suggests login success but stuck on login page), browse to the login success route. The page should be marked as "not private". Click on the screen and type "thisisunsafe" to bypass. Then return to the main page and attempt login again
