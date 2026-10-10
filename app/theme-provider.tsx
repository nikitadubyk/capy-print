"use client";

import { MantineProvider } from "@mantine/core";
import { appCssVariables, appTheme } from "@/config/theme";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider
    theme={appTheme}
    cssVariablesResolver={appCssVariables}
    defaultColorScheme="light"
    forceColorScheme="light"
  >
    {children}
  </MantineProvider>
);
