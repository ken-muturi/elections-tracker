import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import { type GetServerSidePropsContext } from "next";
import { PartialTranslation, type DataObject, type Text } from "@/types";
import { getCookie, setCookie, hasCookie } from "cookies-next";

type IO = "IDLE" | "SAVING" | "SAVED" | "ERROR";
type ViewMode = "list" | "table" | "map";
type MenuDirection = "horizontal" | "vertical";

const supportedLocales = ["en", "ar", "fr", "es", "ny"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const getLocale = (locale?: string): SupportedLocale => {
  if (hasCookie("language")) {
    const cookieLocale = getCookie("language") as string;
    if (supportedLocales.includes(cookieLocale as SupportedLocale)) {
      return cookieLocale as SupportedLocale;
    }
  }

  if (locale) {
    const localeMatch = supportedLocales.find((l) => locale.startsWith(l));
    if (localeMatch) return localeMatch;
  }
  return "en";
};

type UXContextType = {
  locale: string;
  supportedLocales: SupportedLocale[];
  changeLocale: (newLocale: SupportedLocale) => void;
  translate: (
    text: Text | PartialTranslation | PartialTranslation[] | undefined
  ) => string;
  toggleSidebar: (open?: boolean) => void;
  showSidebar: boolean;
  ioState: IO;
  setIOState: (ioState: IO) => void;
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  menuDirection: MenuDirection;
  setMenuDirection: (menuDirection: MenuDirection) => void;
};

const UXContextDefaultValues: UXContextType = {
  locale: "en",
  supportedLocales: [...supportedLocales],
  changeLocale: () => null,
  translate: () => "",
  menuDirection: "horizontal",
  setMenuDirection: () => null,
  showSidebar: true,
  toggleSidebar: () => null,
  ioState: "IDLE",
  setIOState: () => null,
  viewMode: "table",
  setViewMode: () => null,
};

const UXContext = createContext<UXContextType>(UXContextDefaultValues);

export function useUX() {
  const context = useContext(UXContext);
  if (!context) {
    throw new Error("useUX must be used within a UXProvider");
  }
  return context;
}

export function UXProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: { locale: string };
}) {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(
    getLocale(initialData?.locale)
  );

  const changeLocale = useCallback((newLocale: SupportedLocale) => {
    if (supportedLocales.includes(newLocale)) {
      setCookie("language", newLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      setCurrentLocale(newLocale);
    }
  }, []);

  const [showSidebar, setShowSidebar] = useState(true);
  const [ioState, setIOState] = useState<IO>("IDLE");
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [menuDirection, setMenuDirection] =
    useState<MenuDirection>("horizontal");
  const toggleSidebar = (open?: boolean) => {
    setShowSidebar(open ?? !showSidebar);
  };

  const translate = useCallback(
    (
      text: Text | PartialTranslation | PartialTranslation[] | undefined
    ): string => {
      if (!text) {
        return "";
      }

      if (Array.isArray(text)) {
        return (
          text.find((t) => t.body.language === currentLocale)?.body.text ?? ""
        );
      }

      if ((text as Text).text) {
        return (text as Text).text;
      }

      if ((text as DataObject<Text>).body.text) {
        return (text as DataObject<Text>).body.text;
      }

      // TODO: Return English text as fallback
      return "";
    },
    [currentLocale]
  );

  return (
    <UXContext.Provider
      value={{
        menuDirection,
        setMenuDirection,
        locale: currentLocale,
        changeLocale,
        translate,
        supportedLocales: [...supportedLocales],
        toggleSidebar,
        showSidebar,
        ioState,
        setIOState,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </UXContext.Provider>
  );
}

export const getInitialUXProps = (
  context: GetServerSidePropsContext
): { locale: string } => {
  // Get locale from cookie first
  if (hasCookie("language", { req: context.req })) {
    const cookieLocale = getCookie("language", { req: context.req }) as string;
    if (supportedLocales.includes(cookieLocale as SupportedLocale)) {
      return { locale: cookieLocale };
    }
  }

  // Fallback to accept-language header
  const acceptLanguage = context.req.headers["accept-language"]?.substr(0, 2);
  const locale = getLocale(acceptLanguage);

  return { locale };
};
