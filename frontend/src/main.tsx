import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'


const BACKEND_URL = "http://127.0.0.1:5001" //import.meta.env.BACKEND_URL

let queryParams = new URLSearchParams(window.location.search);
console.log(queryParams)
let nonce = queryParams.get('nonce');

function getTokens() {
   function handleResponse(this: XMLHttpRequest): void {
      if (this.status !== 200) {
         alert(this.status + ': ' + this.statusText);
         return;
      }
      let tokens = JSON.parse(this.response);
      sessionStorage.setItem('username', tokens[0]);
      sessionStorage.setItem('accesstoken', tokens[1]);
      sessionStorage.setItem('refreshtoken', tokens[2]);
      window.location.replace(window.location.pathname);
   }

   function handleError(this: XMLHttpRequest):void {
      alert(this.status + ': ' + this.statusText);
      return;
   }

   let url = BACKEND_URL + '/api/get_tokens?nonce=' + nonce;
   let req = new XMLHttpRequest();
   req.onload = handleResponse;
   req.onerror = handleError;
   req.open('GET', url);
   req.setRequestHeader('Accept', 'application/json');
   req.setRequestHeader('Content-type', 'application/json');
   req.send();
}

if (nonce !== null)
   getTokens();
else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
