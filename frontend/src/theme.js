import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  styles: {
    global: {
      "html, body": {
        bg: "transparent",
        color: "whiteAlpha.900",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      "#root": {
        bg: "transparent",
      },
    },
  },
  components: {
    // Override all Chakra components to be transparent by default
    Box: {
      baseStyle: {
        bg: "transparent",
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: "blue.500",
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "#1C1C1E",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          shadow: "0 20px 60px rgba(0,0,0,0.7)",
          py: "2",
        },
        item: {
          bg: "transparent",
          color: "whiteAlpha.800",
          borderRadius: "8px",
          mx: "1",
          fontSize: "13px",
          _hover: { bg: "rgba(255,255,255,0.06)" },
          _focus: { bg: "rgba(255,255,255,0.06)" },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "#1C1C1E",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          color: "white",
        },
        header: {
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          color: "white",
          fontSize: "16px",
          fontWeight: "600",
        },
        closeButton: {
          color: "whiteAlpha.600",
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: "#141416",
          color: "white",
        },
        header: {
          borderColor: "rgba(255,255,255,0.06)",
          color: "white",
        },
      },
    },
    Tooltip: {
      baseStyle: {
        bg: "gray.700",
        color: "white",
        borderRadius: "8px",
        fontSize: "12px",
      },
    },
  },
});

export default theme;
