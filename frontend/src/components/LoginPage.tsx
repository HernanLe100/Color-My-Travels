import { GoogleLogin } from '@react-oauth/google';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const team = [
  { name: "Angela Cai", linkedin: "https://www.linkedin.com/in/angcai/", github: "https://github.com/ang-cai", photo: "/Angela-Linkedin.png" },
  { name: "Lucy Chen", linkedin: "https://www.linkedin.com/in/lucy-c1/", github: "https://github.com/lucy-c1", photo: "/Lucy-Linkedin.jpeg" },
  { name: "Hernan Le", linkedin: "https://www.linkedin.com/in/hernan-le/", github: "https://github.com/HernanLe100", photo: "/Hernan-Linkedin.jpeg" },
];

function LinkedInIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3 fill-current">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function LoginPage() {
  useEffect(() => {
    if (sessionStorage.getItem("session_expired")) {
      sessionStorage.removeItem("session_expired");
      toast.error("Session expired. Please sign in again.");
    }
    if (sessionStorage.getItem("account_deleted")) {
      sessionStorage.removeItem("account_deleted");
      toast.success("Account deleted successfully.");
    }
  }, []);

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
    <div className="flex flex-col">
      {/* Login section */}
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Left half */}
        <div className="relative flex w-full md:w-1/2 md:flex-none flex-col items-center justify-center gap-6 bg-[#F3E9DC] py-10 md:py-0">
          <div className="absolute bottom-2 left-0 top-2 w-2 rounded-sm bg-[#895737]" aria-hidden />
          <h1 className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-5xl font-serif font-black tracking-tight">
            <span className="flex items-center gap-2 whitespace-nowrap">
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
            </span>
            <span className="text-[#895737] whitespace-nowrap">My Travels</span>
          </h1>
          <img
            src="/map-preview.png"
            alt="Map preview"
            className="w-4/5 rounded-xl shadow-lg object-cover max-h-32 md:max-h-full"
          />
        </div>

        {/* Right half */}
        <div className="flex flex-1 md:w-1/2 md:flex-none flex-col items-center justify-start pt-10 md:justify-center md:pt-0 gap-4 bg-[#FEF9F1] py-10 md:py-0">
          <h2 className="text-2xl font-semibold bg-linear-to-r from-[#3274A3] to-[#2A81CB] bg-clip-text text-transparent">Sign up / Sign in</h2>
          <p className="text-sm text-[#5E3023]">Continue with Google</p>
          <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
        </div>
      </div>

      {/* About section */}
      <div id="about" className="bg-[#FEF9F1] px-8 py-16">
        <div className="max-w-2xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black font-serif text-[#5E3023]">About</h2>
            <p className="text-[#895737] font-serif flex items-center gap-1.5 flex-wrap">
              Keep track of your travels with
              <span className="inline-flex items-center gap-1 font-black">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 82" className="h-[.85em] w-[.52em] shrink-0">
                  <defs>
                    <linearGradient id="aboutPinGradient" x1="0" y1="0" x2="0" y2="82" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#2A81CB" />
                      <stop offset="100%" stopColor="#3274A3" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#aboutPinGradient)" d="M47.88,35.08c-.03.06-.06.13-.09.19l.09-.19h0Z"/>
                  <path fill="url(#aboutPinGradient)" d="M25,50c-9.87,0-18.4-5.72-22.47-14.03h0s22.47,46.03,22.47,46.03l22.11-45.33c-4.19,7.93-12.52,13.33-22.11,13.33Z"/>
                  <path fill="url(#aboutPinGradient)" d="M25,0C11.19,0,0,11.19,0,25c0,3.94.91,7.66,2.53,10.97,4.06,8.31,12.6,14.03,22.47,14.03s17.92-5.4,22.11-13.33c.24-.46.47-.93.68-1.4.03-.06.06-.13.09-.19,1.36-3.08,2.12-6.49,2.12-10.08C50,11.19,38.81,0,25,0ZM25,34.26c-4.78,0-8.65-3.87-8.65-8.65s3.87-8.65,8.65-8.65,8.65,3.87,8.65,8.65-3.87,8.65-8.65,8.65Z"/>
                </svg>
                <span className="bg-linear-to-r from-[#3274A3] to-[#2A81CB] bg-clip-text text-transparent">Color</span>
                <span className="text-[#895737]">My Travels</span>
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold font-serif text-[#5E3023]">Team</h2>
            <div className="grid grid-cols-3 gap-6">
              {team.map((member) => (
                <div key={member.name} className="flex flex-col text-lg items-center gap-3">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-20 h-20 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-neutral-200 shrink-0" />
                  )}
                  <p className="font-semibold font-serif text-[#5E3023] text-sm text-center">{member.name}</p>
                  <div className="flex items-center gap-3">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#2A81CB] hover:underline"
                    >
                      <LinkedInIcon />
                    </a>
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-stone-600 hover:underline"
                    >
                      <GitHubIcon />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
