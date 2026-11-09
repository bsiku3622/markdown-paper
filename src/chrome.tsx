import type { MouseEvent, ReactNode } from "react";
import { Badge, Box, Inline, Stack, Surface, Text } from "@studio-baeks/paper-ui";
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
    <Surface as="a" href="/" aria-label="Paperdown 홈" radius="sm" hoverable className="plain-link" onClick={onHome ? plainClick(onHome) : undefined}>
      <Inline gap="sm" align="center">
        {phone ? null : <Glyph name="file-text" size="subheading" />}
        <Wordmark small={phone} />
      </Inline>
    </Surface>
  );
};

export const Avatar = ({ name }: { name: string }) => (
  <Badge size="lg" shape="rounded" variant="hairline" role="img" aria-label={name}>
    {Array.from(name.trim())[0]?.toUpperCase() ?? "?"}
  </Badge>
);

export const Column = ({ children }: { children: ReactNode }) => (
  <Stack align="center" paddingX="lg">
    <Box width="container.content" maxWidth="full">
      {children}
    </Box>
  </Stack>
);
