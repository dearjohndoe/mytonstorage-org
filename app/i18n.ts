import "react-i18next";
import mainTranslationsEN from "../public/locales/en/main.json";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof mainTranslationsEN;
    };
  }
}
