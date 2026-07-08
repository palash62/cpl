export type Breakpoint = "desktop" | "tablet" | "mobile";

export type TypographyProps = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  letterSpacing?: string;
  lineHeight?: string;
};

export type LayoutProps = {
  blockAlign?: "left" | "center" | "right";
  width?: string;
  height?: string;
  margin?: string;
  padding?: string;
  gap?: string;
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  display?: string;
  maxWidth?: string;
  gridTemplateColumns?: string;
  flexWrap?: string;
  textAlign?: string;
  aspectRatio?: string;
  minHeight?: string;
  [key: string]: string | undefined;
};

export type StyleProps = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundVideo?: string;
  backdropFilter?: string;
  filter?: string;
  border?: string;
  borderTop?: string;
  borderRadius?: string;
  boxShadow?: string;
  opacity?: number;
  [key: string]: string | number | undefined;
};

export type AnimationProps = {
  type?: "none" | "fade" | "slide" | "zoom";
  delay?: string;
  duration?: string;
};

export type ResponsiveOverrides = Partial<{
  typography: TypographyProps;
  layout: LayoutProps;
  style: StyleProps;
  visible: boolean;
}>;

export type BlockProps = {
  name?: string;
  visible?: boolean;
  typography?: TypographyProps;
  layout?: LayoutProps;
  style?: StyleProps;
  animation?: AnimationProps;
  responsive?: Partial<Record<Breakpoint, ResponsiveOverrides>>;
  [key: string]: unknown;
};
