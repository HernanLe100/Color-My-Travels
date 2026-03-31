import { GoogleLogin } from '@react-oauth/google';
/*
import { useGoogleLogin } from '@react-oauth/google';

const googleLogin = useGoogleLogin({
    flow: 'auth-code', // Required for redirect mode to work correctly with a backend exchange
    ux_mode: 'redirect',
    redirect_uri: 'https://localhost:5173/', // **Your specified return URL**
    onSuccess: async ({ code }) => {
        // This callback won't be triggered in the frontend when using ux_mode="redirect" 
        // because the page unmounts during the redirect.
        // The code will be in the URL parameters of the redirect page.
    },
    onError: (error) => {
        console.log(error);
    },
});*/

import { useNavigate } from 'react-router-dom';

export default function LoginPage(){

    const nav = useNavigate();

    return (
    <GoogleLogin
        onSuccess={credentialResponse => {
          fetch("https://127.0.0.1:5001/ten", {
            method: "POST", 
            headers: {"Content-Type": "application/json", },
            body: JSON.stringify(credentialResponse), // The data body must be a stringified JSON object
          }).then(res => res.json()).then(data => console.log(data));

          console.log(credentialResponse);
          console.log(JSON.stringify(credentialResponse));
          nav("/"); 
          
        }}

        onError={() => {
          console.log('Login Failed');
        }} 

        //ux_mode="redirect"
        
    />
    );

}