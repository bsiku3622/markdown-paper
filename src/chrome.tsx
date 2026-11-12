import type { MouseEvent, ReactNode } from "react";
import { Box, Inline, Link, Stack, Text } from "@studio-baeks/paper-ui";
import type { Ink, TextVariant } from "@studio-baeks/paper-ui/tokens";
import { Glyph } from "./glyphs";
import { useMedia } from "./hooks";

export const plainClick = (go: () => void) => (event: MouseEvent) => {
  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    go();
  }
};

export const Wordmark = ({ small = false }: { small?: boolean }) => (
  <Text as="span" variant={small ? "heading" : "title"} className="wordmark">
    Paperdown
  </Text>
);

type SerifProps = {
  as?: "h1" | "h2" | "h3" | "p" | "span";
  variant?: TextVariant;
  strong?: boolean;
  ink?: Ink;
  lines?: boolean;
  children: ReactNode;
};
export const Serif = ({ as = "span", variant = "body", strong, ink, lines = false, children }: SerifProps) => (
  <Text as={as} variant={variant} strong={strong} ink={ink} className={lines ? "serif clamp" : "serif"}>
    {children}
  </Text>
);

export const Brand = ({ onHome }: { onHome?: () => void }) => {
  const phone = useMedia("(max-width: 767px)");
  return (
    <Link href="/" aria-label="Paperdown 홈" underline="hover" className="plain-link" onClick={onHome ? plainClick(onHome) : undefined}>
      <Inline as="span" gap="sm" align="center">
        {phone ? null : <Glyph name="file-text" size="subheading" />}
        <Wordmark small={phone} />
      </Inline>
    </Link>
  );
};

export const Avatar = ({ name, src, size = "md", ring }: { name: string; src?: string | null; size?: "sm" | "md" | "xl"; ring?: string }) => (
  <span className={`avatar avatar-${size}`} role="img" aria-label={name} title={name} style={ring ? { boxShadow: `0 0 0 2px var(--pui-color-bg-raised), 0 0 0 4px ${ring}` } : undefined}>
    {src ? <img src={src} alt="" referrerPolicy="no-referrer" draggable={false} /> : (Array.from(name.trim())[0]?.toUpperCase() ?? "?")}
  </span>
);

export const Column = ({ children }: { children: ReactNode }) => (
  <Stack align="center" paddingX="lg">
    <Box width="container.content" maxWidth="full">
      {children}
    </Box>
  </Stack>
);
