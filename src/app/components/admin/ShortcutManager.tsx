import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAdmin } from "../../context/AdminContext";

export default function ShortcutManager() {
  const { setShowAdminLogin, storeProfile } = useAdmin();
  const navigate = useNavigate();
  const typedKeysRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add the key to the typed sequence
      typedKeysRef.current += e.key;

      // Reset after 1 second of inactivity
      timeoutRef.current = setTimeout(() => {
        typedKeysRef.current = "";
      }, 1000);

      // Check if typed sequence matches the shortcut
      if (typedKeysRef.current.includes(storeProfile.adminShortcut)) {
        typedKeysRef.current = "";
        setShowAdminLogin(true);
        navigate("/admin/login");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [setShowAdminLogin, navigate, storeProfile.adminShortcut]);

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
