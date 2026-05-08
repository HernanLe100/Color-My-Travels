# Color My Travels
Keep track of your travels in an easy and visually appealing way

## Running instructions (local)
Make sure Python and npm versions are up to date (at least Python 3.12.10 and npm 10.9.2)

### Backend:

cd backend

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt

Create a .env file in the backend folder and paste the external db url and other env vars from Render

Generate cert.pem and key.pem files in the backend folder so that the app can run with HTTPS instead of HTTP:

openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem

python app.py

### Frontend:
cd frontend

npm install

npm run dev

If the page is marked as "connection is not private", click on the screen and type "thisisunsafe" to bypass and continue to the site

## Links (access with school account):

Project Doc: 

https://docs.google.com/document/d/16ShLO9OTArLnLi0FqE_LU-3Zx6yAtV5z0aKY8603iFg/edit?usp=sharing

Figma:

https://www.figma.com/design/dGGF2s2835KV4OGlk3n1xq/COS-333---Travel-Log-Map?node-id=0-1&t=zz26FJORBEvfGBkG-1
