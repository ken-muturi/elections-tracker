import { SupportedLocale, useUX } from "@/context/UXContext";
import { Box } from "@chakra-ui/react";

const LanguageButton = ({
  language,
  label,
}: {
  language: string;
  label?: string;
}) => {
  const { locale, changeLocale } = useUX();
  
  return (
    <Box
      fontSize="xs"
      fontWeight="normal"
      cursor="pointer"
      borderWidth="thin"
      borderColor="whiteAlpha.700"
      onClick={() => {
        changeLocale(language as SupportedLocale);
        // window.location.reload();
      }}
    >
      <Box
        px="5px"
        // bg="whiteAlpha.500"
        bg={locale === language ? "orange.50" : "whiteAlpha.500"}
        _dark={{
          bg: locale === language ? "warchild.red.700" : "whiteAlpha.500"
        }}
        // borderWidth="1px"
        // borderColor="white"
        borderColor={locale === language ? "orange.50" : "whiteAlpha.700"}

        // color={locale === language ? linkHover : linkColor}
        color="whiteAlpha.700"
        _hover={{
          textDecoration: "none",
          color: "orange.50",
          _dark: {
            color: "warchild.red.700"
          }
        }}
      >
        {label || language}
      </Box>
    </Box>
  );
};

export default LanguageButton;
