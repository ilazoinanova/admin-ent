import { useTranslation } from "react-i18next";

const ViewTiersModal = ({ open, onClose, data }) => {
  const { t } = useTranslation();

  if (!open || !data) return null;

  const tiers = data?.tiers || [];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-lg overflow-hidden border dark:border-gray-700">

        <div className="bg-[#0b1b3b] text-white px-5 py-3 space-y-1">
          <h2 className="text-sm font-semibold">{t("userTiersByLicense")}</h2>
          <p className="text-xs opacity-80">{t("company")}: {data?.tenant_name || "—"}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("service")}: Licencias
          </div>

          <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 px-3 py-2">
              <span>{t("from")}</span>
              <span>{t("to")}</span>
              <span>{t("price")} ({data.currency})</span>
            </div>

            {tiers.length === 0 && (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">{t("noTiersConfigured")}</div>
            )}

            {tiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-3 px-3 py-2 border-t dark:border-gray-600 text-sm dark:text-gray-200">
                <span>{tier.min_users}</span>
                <span>{tier.max_users}</span>
                <span>${Number(tier.price_per_user).toLocaleString("es-CL")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 border dark:border-gray-600 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            {t("close")}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ViewTiersModal;
