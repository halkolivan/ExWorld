import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col m-3 max-w-[1200px] h-full">
      <h1>{t("PrivacyPolicyTitle")}</h1>
      <p className="mt-5">{t("PrivacyPolicyUpdated")}</p>
      <p>{t("PrivacyPolicyIntro")}</p>
      <p>{t("PrivacyPolicyStorage")}</p>
      <p>
        {t("PrivacyPolicyOAuth")}{" "}
        <code className="text-sm">
          https://www.googleapis.com/auth/drive.file
        </code>
        {t("PrivacyPolicyOAuthEnd")}
      </p>
      <p>{t("PrivacyPolicyRevoke")}</p>
      <p>
        {t("PrivacyPolicyContact")}{" "}
        <a href="mailto:gemdtera@gmail.com">gemdtera@gmail.com</a>
      </p>
      <p className="mt-[20px]">{t("PrivacyPolicyDataUsage")}</p>
      <p>{t("PrivacyPolicyEmail")}</p>
    </div>
  );
}
