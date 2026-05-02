import { GoogleLogin } from '@react-oauth/google';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function LoginPage() {
  const handleSuccess = async (credentialResponse: any) => {
    const res = await fetch(`${BACKEND_URL}/login_success`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });
    const data = await res.json();
    localStorage.setItem("token", data.token);
    window.location.href = "/";
  };

  const handleError = () => {
    console.log("Login Failed");
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Left half */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center gap-6 bg-[#F3E9DC] py-10 md:py-0">
        <div
          className="absolute bottom-2 left-0 top-2 w-2 rounded-sm bg-[#895737]"
          aria-hidden
        />
        <h1 className="flex items-center gap-2 text-5xl font-serif font-black tracking-tight">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 82" className="h-[.7em] w-[.43em] shrink-0">
            <defs>
              <linearGradient id="pinGradient" x1="0" y1="0" x2="0" y2="82" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2A81CB" />
                <stop offset="100%" stopColor="#3274A3" />
              </linearGradient>
            </defs>
            <path fill="url(#pinGradient)" d="M47.88,35.08c-.03.06-.06.13-.09.19l.09-.19h0Z"/>
            <path fill="url(#pinGradient)" d="M25,50c-9.87,0-18.4-5.72-22.47-14.03h0s22.47,46.03,22.47,46.03l22.11-45.33c-4.19,7.93-12.52,13.33-22.11,13.33Z"/>
            <path fill="url(#pinGradient)" d="M25,0C11.19,0,0,11.19,0,25c0,3.94.91,7.66,2.53,10.97,4.06,8.31,12.6,14.03,22.47,14.03s17.92-5.4,22.11-13.33c.24-.46.47-.93.68-1.4.03-.06.06-.13.09-.19,1.36-3.08,2.12-6.49,2.12-10.08C50,11.19,38.81,0,25,0ZM25,34.26c-4.78,0-8.65-3.87-8.65-8.65s3.87-8.65,8.65-8.65,8.65,3.87,8.65,8.65-3.87,8.65-8.65,8.65Z"/>
          </svg>
          <span className="bg-linear-to-r from-[#3274A3] to-[#2A81CB] bg-clip-text text-transparent">Color</span>
          <span className="text-[#895737]">My Travels</span>
        </h1>
        <img
          src="/map-preview.png"
          alt="Map preview"
          className="w-4/5 rounded-xl shadow-lg object-cover max-h-32 md:max-h-full"
        />
      </div>

      {/* Right half */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center gap-4 bg-[#FEF9F1] py-10 md:py-0">
        <h2 className="text-2xl font-semibold bg-linear-to-r from-[#3274A3] to-[#2A81CB] bg-clip-text text-transparent">Sign up / Sign in</h2>
        <p className="text-sm text-[#5E3023]">Continue with Google</p>
        <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
      </div>
    </div>
  );
}

export default LoginPage;