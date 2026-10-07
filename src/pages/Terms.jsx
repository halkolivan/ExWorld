import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col m-3 max-w-[1200px] h-full">
      <h1>{t("TermsTitle")}</h1>
      <p className="mt-5">{t("TermsUpdated")}</p>
      <p>{t("TermsIntro")}</p>
      <p>{t("TermsData")}</p>
      <p>{t("TermsChanges")}</p>
      <p>
        {t("TermsContact")}{" "}
        <a href="mailto:gemdtera@gmail.com">gemdtera@gmail.com</a>
      </p>
    </div>
  );
}
