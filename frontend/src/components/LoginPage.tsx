import { GoogleLogin } from '@react-oauth/google';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function LoginPage() {
  const handleSuccess = async (credentialResponse: any) => {
    console.log("Google credential:", credentialResponse);

    const res = await fetch(`${BACKEND_URL}/login_success`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential: credentialResponse.credential,
      }),
    });

    const data = await res.json();
    console.log("Backend response:", data);

    // store token in local storage
    localStorage.setItem("token", data.token);
    window.location.href = "/";
  };

  const handleError = () => {
    console.log("Login Failed");
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="p-6 shadow-lg rounded-xl">
        <h1 className="text-xl mb-4">Login</h1>

        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
}

export default LoginPage;