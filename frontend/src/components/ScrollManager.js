import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    const key = `scroll:${location.pathname}${location.search}`;

    // Restore scroll if saved
    const saved = sessionStorage.getItem(key);
    if (saved !== null) {
      window.scrollTo(0, parseInt(saved, 10));
    } else {
      window.scrollTo(0, 0); // first visit, go top
    }

    const handleSave = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    // Save before unload + when navigating away
    window.addEventListener("beforeunload", handleSave);
    return () => {
      handleSave();
      window.removeEventListener("beforeunload", handleSave);
    };
  }, [location]);

  return null;
}
