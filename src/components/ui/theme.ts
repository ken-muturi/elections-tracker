import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
  globalCss: {
    body: {
      bg: "gray.50",
      color: "gray.900",
    },
  },

  theme: {
    breakpoints: {
      sm: "30em",
      md: "48em",
      lg: "62em",
      xl: "80em",
      "2xl": "96em",
    },

    tokens: {
      colors: {
        brand: {
          lime: { value: "#C9D927" },
          olive: { value: "#838D19" },
          neon: { value: "#E0F12D" },
          light: { value: "#F8FAFC" },
          orange: { value: "#FE8E00" },
        },
        primary: {
          50: { value: "#f7fce8" },
          100: { value: "#eff9d1" },
          200: { value: "#e7f6ba" },
          300: { value: "#dff3a3" },
          400: { value: "#d7f08c" },
          500: { value: "#C9D927" },
          600: { value: "#a1ae1f" },
          700: { value: "#798217" },
          800: { value: "#51570f" },
          900: { value: "#292b08" },
        },
        accent: {
          50: { value: "#fff5e5" },
          100: { value: "#ffeacc" },
          200: { value: "#ffdfb3" },
          300: { value: "#ffd499" },
          400: { value: "#ffc980" },
          500: { value: "#FE8E00" },
          600: { value: "#cb7200" },
          700: { value: "#985600" },
          800: { value: "#653a00" },
          900: { value: "#321d00" },
        },
        // Aurora-inspired sidebar palette
        sidebar: {
          bg: { value: "#0f172a" },
          bgHover: { value: "#1e293b" },
          bgActive: { value: "#1e293b" },
          text: { value: "#94a3b8" },
          textHover: { value: "#f1f5f9" },
          textActive: { value: "#ffffff" },
          border: { value: "#1e293b" },
          accent: { value: "#C9D927" },
          section: { value: "#475569" },
        },
        // Canvas backgrounds
        canvas: {
          default: { value: "#f1f5f9" },
          card: { value: "#ffffff" },
          elevated: { value: "#ffffff" },
        },
        // Status colors
        status: {
          success: { value: "#10b981" },
          successBg: { value: "#d1fae5" },
          warning: { value: "#f59e0b" },
          warningBg: { value: "#fef3c7" },
          error: { value: "#ef4444" },
          errorBg: { value: "#fee2e2" },
          info: { value: "#3b82f6" },
          infoBg: { value: "#dbeafe" },
        },
      },
      fonts: {
        heading: {
          value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        },
        body: {
          value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        },
      },
      fontSizes: {
        xs: { value: "0.75rem" },
        sm: { value: "0.875rem" },
        md: { value: "1rem" },
        lg: { value: "1.125rem" },
        xl: { value: "1.25rem" },
        "2xl": { value: "1.5rem" },
        "3xl": { value: "1.875rem" },
        "4xl": { value: "2.25rem" },
        "5xl": { value: "3rem" },
      },
      spacing: {
        xs: { value: "0.5rem" },
        sm: { value: "0.75rem" },
        md: { value: "1rem" },
        lg: { value: "1.5rem" },
        xl: { value: "2rem" },
        "2xl": { value: "3rem" },
      },
      radii: {
        sm: { value: "0.25rem" },
        md: { value: "0.375rem" },
        lg: { value: "0.5rem" },
        xl: { value: "0.75rem" },
        "2xl": { value: "1rem" },
        "3xl": { value: "1.5rem" },
        full: { value: "9999px" },
      },
      shadows: {
        xs: { value: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" },
        sm: { value: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)" },
        md: { value: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)" },
        lg: { value: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)" },
        xl: { value: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" },
        "2xl": { value: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
        card: { value: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)" },
        cardHover: { value: "0 8px 25px -5px rgba(0,0,0,0.12), 0 4px 10px -4px rgba(0,0,0,0.08)" },
        glow: { value: "0 0 20px rgba(201, 217, 39, 0.35)" },
      },
    },

    semanticTokens: {
      colors: {
        primary: {
          value: {
            _light: "{colors.brand.lime}",
            _dark: "{colors.brand.neon}",
          },
        },
        secondary: {
          value: {
            _light: "{colors.brand.olive}",
            _dark: "{colors.brand.olive}",
          },
        },
        accent: {
          value: {
            _light: "{colors.brand.orange}",
            _dark: "{colors.brand.orange}",
          },
        },
        bg: {
          canvas: {
            value: {
              _light: "{colors.canvas.default}",
              _dark: "{colors.gray.900}",
            },
          },
          surface: {
            value: { _light: "{colors.white}", _dark: "{colors.gray.800}" },
          },
        },
        text: {
          primary: {
            value: {
              _light: "{colors.gray.900}",
              _dark: "{colors.brand.light}",
            },
          },
          secondary: {
            value: {
              _light: "{colors.gray.600}",
              _dark: "{colors.gray.400}",
            },
          },
          muted: {
            value: { _light: "{colors.gray.400}", _dark: "{colors.gray.500}" },
          },
          accent: {
            value: {
              _light: "{colors.brand.orange}",
              _dark: "{colors.brand.orange}",
            },
          },
        },
        border: {
          value: { _light: "{colors.gray.200}", _dark: "{colors.gray.700}" },
        },
      },
    },

    textStyles: {
      heading: {
        value: {
          fontFamily: "heading",
          fontWeight: "bold",
          lineHeight: "1.2",
        },
      },
      body: {
        value: {
          fontFamily: "body",
          fontWeight: "normal",
          lineHeight: "1.6",
        },
      },
    },

    layerStyles: {
      card: {
        value: {
          bg: "bg.surface",
          borderRadius: "xl",
          boxShadow: "card",
          p: "6",
          borderWidth: "1px",
          borderColor: "gray.100",
        },
      },
      cardHover: {
        value: {
          bg: "bg.surface",
          borderRadius: "xl",
          boxShadow: "card",
          p: "6",
          borderWidth: "1px",
          borderColor: "gray.100",
          transition: "all 0.2s ease",
          _hover: {
            boxShadow: "cardHover",
            transform: "translateY(-2px)",
            borderColor: "gray.200",
          },
        },
      },
    },

    recipes: {
      heading: {
        base: {
          fontFamily: "heading",
          fontWeight: "bold",
          lineHeight: "1.2",
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
export default system;
