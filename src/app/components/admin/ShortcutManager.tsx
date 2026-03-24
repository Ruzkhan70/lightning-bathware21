import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAdmin } from "../../context/AdminContext";

export default function ShortcutManager() {
  const { setShowAdminLogin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setShowAdminLogin(true);
        navigate("/admin/login");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setShowAdminLogin, navigate]);

  useEffect(() => {
    const path = window.location.pathname;
    const secretPath = "/__admin__";

    if (path === secretPath) {
      window.history.replaceState({}, "", "/");
      setShowAdminLogin(true);
      navigate("/admin/login");
    }
  }, [setShowAdminLogin, navigate]);

  return null;
}
