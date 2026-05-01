import { GoogleLogin } from '@react-oauth/google';
import { apiFetch, setCsrfToken } from "@/lib/api";

function LoginPage() {
  const handleSuccess = async (credentialResponse: any) => {
    const res = await apiFetch("/login_success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setCsrfToken(data.csrf_token ?? null);
    window.location.href = "/";
  };

  const handleError = () => {
    console.log("Login Failed");
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Left half */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center gap-6 bg-stone-100 py-10 md:py-0">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-800">
          Color My Travels
        </h1>
        <img
          src="/map-preview.png"
          alt="Map preview"
          className="w-4/5 rounded-xl shadow-lg object-cover max-h-32 md:max-h-full"
        />
      </div>

      {/* Right half */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center gap-4 bg-white py-10 md:py-0">
        <h2 className="text-2xl font-medium text-stone-800">Sign up / Sign in</h2>
        <p className="text-sm text-stone-500">Continue with Google</p>
        <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
      </div>
    </div>
  );
}

export default LoginPage;