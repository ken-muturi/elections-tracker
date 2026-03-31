import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// Define your custom theme configuration
const customConfig = defineConfig({
  // Global styles
  globalCss: {
    body: {
      bg: "gray.50",
      color: "gray.900",
    },
  },

  // Theme configuration
  theme: {
    // Breakpoints for responsive design
    breakpoints: {
      sm: "30em", // 480px
      md: "48em", // 768px
      lg: "62em", // 992px
      xl: "80em", // 1280px
      "2xl": "96em", // 1536px
    },

    // Semantic tokens - these adapt to color mode
    tokens: {
      colors: {
        // Your custom brand colors
        brand: {
          lime: { value: "#C9D927" }, // Primary lime green
          olive: { value: "#838D19" }, // Darker olive green
          neon: { value: "#E0F12D" }, // Bright neon yellow
          light: { value: "#F7F7F7" }, // Light gray/white
          orange: { value: "#FE8E00" }, // Vibrant orange
        },
        // Extended palette with shades
        primary: {
          50: { value: "#f7fce8" },
          100: { value: "#eff9d1" },
          200: { value: "#e7f6ba" },
          300: { value: "#dff3a3" },
          400: { value: "#d7f08c" },
          500: { value: "#C9D927" }, // Main lime
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
          500: { value: "#FE8E00" }, // Main orange
          600: { value: "#cb7200" },
          700: { value: "#985600" },
          800: { value: "#653a00" },
          900: { value: "#321d00" },
        },
      },
      fonts: {
        heading: {
          value: `'Playfair Display','Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        },
        body: {
          value: `'Inter', 'Schibsted_Grotesk',-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
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
        full: { value: "9999px" },
      },
      shadows: {
        sm: { value: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" },
        md: { value: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
        lg: { value: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" },
        xl: { value: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" },
      },
    },

    // Semantic tokens that change based on color mode
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
              _light: "{colors.brand.light}",
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
              _light: "{colors.brand.olive}",
              _dark: "{colors.gray.400}",
            },
          },
          muted: {
            value: { _light: "{colors.gray.500}", _dark: "{colors.gray.500}" },
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

    // Text styles
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

    // Layer styles for common patterns
    layerStyles: {
      card: {
        value: {
          bg: "bg.surface",
          borderRadius: "lg",
          boxShadow: "md",
          p: "6",
        },
      },
      cardHover: {
        value: {
          bg: "bg.surface",
          borderRadius: "lg",
          boxShadow: "md",
          p: "6",
          transition: "all 0.2s",
          _hover: {
            boxShadow: "xl",
            transform: "translateY(-2px)",
          },
        },
      },
    },

    // Component recipes - default styles for components
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

// Create the system by merging with default config
export const system = createSystem(defaultConfig, customConfig);

// Export for use in your app
export default system;
