import {
  createTheme,
  Button,
  Badge,
  Input,
  Accordion,
  ActionIcon,
  CloseButton,
  Modal,
  Select,
  SegmentedControl,
  rem,
  Text,
  Title,
  type CSSVariablesResolver,
} from "@mantine/core";
import { twMerge } from "tailwind-merge";

export const appTheme = createTheme({
  primaryColor: "capyBlue",
  primaryShade: 6,
  colors: {
    capyBlue: [
      "#eef5ff",
      "#dce9ff",
      "#b6d1ff",
      "#87b2ff",
      "#5793ff",
      "#2975f5",
      "#0960e8",
      "#064fc4",
      "#08429e",
      "#103978",
    ],
  },
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSizes: {
    xs: rem(14),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },
  lineHeights: { xs: "1.5", sm: "1.5", md: "1.6", lg: "1.5", xl: "1.4" },
  headings: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: "600",
    sizes: {
      h1: { fontSize: rem(32), lineHeight: "1.15", fontWeight: "700" },
      h2: { fontSize: rem(28), lineHeight: "1.2" },
      h3: { fontSize: rem(20), lineHeight: "1.3" },
      h4: { fontSize: rem(18), lineHeight: "1.3" },
      h5: { fontSize: rem(16), lineHeight: "1.4" },
      h6: { fontSize: rem(16), lineHeight: "1.4" },
    },
  },
  components: {
    ActionIcon: ActionIcon.extend({
      defaultProps: { size: 44, radius: "xl" },
      classNames: {
        root: "transition duration-150 motion-reduce:transition-none",
      },
    }),
    CloseButton: CloseButton.extend({ defaultProps: { size: 44 } }),
    Modal: Modal.extend({
      defaultProps: { centered: true, radius: "xl" },
      classNames: { title: "font-semibold", close: "min-h-11 min-w-11" },
    }),
    Select: Select.extend({
      defaultProps: { size: "lg", allowDeselect: false },
      classNames: { option: "min-h-12 py-3" },
    }),
    SegmentedControl: SegmentedControl.extend({
      defaultProps: {
        color: "capyBlue",
        fullWidth: true,
        size: "md",
        radius: "lg",
      },
      classNames: { label: "flex min-h-11 items-center justify-center" },
    }),
    Accordion: Accordion.extend({
      styles: (theme) => ({
        control: {
          minHeight: rem(64),
          fontSize: theme.fontSizes.md,
          fontWeight: 500,
        },
        chevron: { color: theme.colors.capyBlue[6] },
      }),
      classNames: {
        item: "overflow-hidden border-capy-line bg-white",
        control:
          "gap-3 transition-colors duration-150 hover:bg-capy-blue/40 motion-reduce:transition-none",
      },
    }),
    InputWrapper: Input.Wrapper.extend({
      styles: (theme) => ({
        label: { fontSize: theme.fontSizes.md, fontWeight: 500 },
        description: { fontSize: theme.fontSizes.sm },
        error: { fontSize: theme.fontSizes.sm },
      }),
    }),
    Badge: Badge.extend({ defaultProps: { size: "lg", fz: "sm", tt: "none" } }),
    Button: Button.extend({
      styles: { root: { minHeight: rem(44) } },
      classNames: (_, { variant }) => ({
        root: twMerge(
          "transition duration-150 ease-out active:shadow-inner motion-safe:active:translate-y-px motion-reduce:transition-none",
          (variant === "outline" || variant === "default") &&
            "hover:bg-capy-blue active:bg-capy-accent/15"
        ),
      }),
    }),
    Text: Text.extend({
      defaultProps: { size: "md" },
      styles: (theme, { variant }) => ({
        root:
          variant === "brand"
            ? {
                fontSize: theme.fontSizes.lg,
                lineHeight: theme.lineHeights.lg,
                fontWeight: 700,
              }
            : variant === "eyebrow"
              ? {
                  fontSize: theme.fontSizes.sm,
                  lineHeight: theme.lineHeights.sm,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }
              : {},
      }),
    }),
    Title: Title.extend({
      classNames: (_, { order }) => ({
        root: twMerge(
          "tracking-tight",
          order === 1 && "md:text-5xl",
          order === 2 && "md:text-4xl"
        ),
      }),
    }),
  },
  defaultRadius: "lg",
  respectReducedMotion: true,
});

export const appCssVariables: CSSVariablesResolver = () => ({
  variables: { "--capy-lilac": "#e6e1fa", "--capy-line": "#dedfe2" },
  light: {
    "--mantine-color-body": "#fafaf8",
    "--mantine-color-text": "#101a2c",
    "--mantine-color-dimmed": "#586271",
  },
  dark: {},
});
