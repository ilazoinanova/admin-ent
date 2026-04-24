import { useEffect } from "react";

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg animate-fadeIn`}
      >
        {message}
      </div>
    </div>
  );
};

export default Toast;