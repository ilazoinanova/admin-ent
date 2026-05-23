import { useState } from "react";
import { useTranslation } from "react-i18next";

const Spinner = () => (
  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function ConfirmDeleteModal({ period, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl shadow-lg overflow-hidden border dark:border-gray-700">
        <div className="bg-[#0b1b3b] text-white px-5 py-3">
          <h2 className="text-sm font-semibold">{t("pp.deleteTitle")}</h2>
        </div>
        <div className="p-5 text-sm text-gray-600 dark:text-gray-300">
          <p>{t("pp.deleteConfirm")}</p>
          <p className="mt-2 font-mono font-bold text-gray-800 dark:text-gray-200">{period.label}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-sm border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md flex items-center gap-1.5 disabled:opacity-70 transition"
          >
            {loading && <Spinner />}
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
