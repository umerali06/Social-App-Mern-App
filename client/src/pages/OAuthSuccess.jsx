import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("accessToken", token);
      // optionally fetch profile and set in context
      navigate("/");
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  return <div className="p-8 text-center">Logging you in…</div>;
}
