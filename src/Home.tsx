import { useState } from "react";
import { Box, Button, Field, Grid, IconButton, Inline, Link, Select, Stack, Surface, Text } from "@studio-baeks/paper-ui";
import type { NoteSummary, User } from "./cloud";
import type { DocumentData } from "./document";
import { documentPath } from "./routes";
import { Glyph } from "./glyphs";
import { useMedia } from "./hooks";
import { Avatar, Brand, Column, Serif, plainClick } from "./chrome";

type Props = {
  user: User | null;
  notes: NoteSummary[];
  guest: DocumentData;
  working: boolean;
  open: (note: NoteSummary) => void;
  create: () => void;
  guestOpen: () => void;
  login: () => void;
  logout: () => void;
  remove: (note: NoteSummary) => void;
};

const Card = ({ note, working, open, remove }: { note: NoteSummary; working: boolean; open: () => void; remove: () => void }) => {
  const title = note.title || "제목 없는 문서";
  return (
    <Surface as="article" fill="raised" border radius="md" overflow="hidden">
      <Stack>
        <Surface as="a" href={documentPath(note.id)} aria-label={`${title} 열기`} padding="lg" hoverable className="plain-link" onClick={plainClick(() => !working && open())}>
          <Surface fill="canvas" border radius="sm" padding="lg" height="md" overflow="hidden">
            <Stack gap="md">
              <Glyph name="file-text" size="subheading" ink="secondary" />
              <Serif variant="lead" lines>{title}</Serif>
            </Stack>
          </Surface>
        </Surface>
        <Surface border="top" paddingX="lg" paddingY="md">
          <Inline justify="between" align="center" gap="sm">
            <Stack minWidth={0}>
              <Text as="h3" variant="body" strong truncate>{title}</Text>
              <Text as="p" variant="caption" ink="secondary">
                {new Date(note.updatedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 수정
              </Text>
            </Stack>
            <IconButton size="xs" variant="ghost" aria-label={`${note.title || "문서"} 삭제`} disabled={working} onClick={remove}>
              <Glyph name="trash-2" ink="tertiary" />
            </IconButton>
          </Inline>
        </Surface>
      </Stack>
    </Surface>
  );
};

export function Home({ user, notes, guest, working, open, create, guestOpen, login, logout, remove }: Props) {
  const wide = useMedia("(min-width: 768px)");
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("recent");
  const filtered = notes
    .filter((n) => n.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title, "ko") : b.updatedAt - a.updatedAt));
  return (
    <Grid rows="auto minmax(0, 1fr) auto" minHeight="viewport">
      <Surface as="header" fill="raised" border="bottom">
        <Column>
          <Inline justify="between" align="center" gap="md" paddingY="xl">
            <Brand />
            {user ? (
              <Inline gap="sm" align="center">
                <Avatar name={user.username} />
                <Text as="span">{user.username}</Text>
                <IconButton variant="ghost" size="sm" aria-label="로그아웃" disabled={working} onClick={logout}>
                  <Glyph name="log-out" />
                </IconButton>
              </Inline>
            ) : (
              <Button variant="hairline" size="sm" onClick={login}>로그인 / 회원가입</Button>
            )}
          </Inline>
        </Column>
      </Surface>
      <Box as="main" id="main">
        <Column>
          <Box paddingY="3xl">
            <Box paddingY="lg">
              <Stack gap="3xl">
                <Inline justify="between" align="center" gap="xl" wrap>
                  <Stack gap="xs" minWidth={0}>
                    <Serif as="h1" variant="display" strong>생각을 담아두는 곳.</Serif>
                    <Text as="p" ink="secondary">
                      {user ? "한 장의 메모부터 긴 문서까지, 쓰던 자리에서 이어가세요." : "종이 위에 쓰듯 편집하고, 원하는 모습으로 남기세요."}
                    </Text>
                  </Stack>
                  <Button disabled={working} onClick={user ? create : guestOpen}>
                    <Glyph name="plus" />
                    {user ? "새 문서" : "편집기 열기"}
                  </Button>
                </Inline>
                <Stack gap="xl">
                  <Inline justify="between" align="center" gap="lg" wrap>
                    <Inline gap="md" align="baseline">
                      <Text as="h2" variant="subheading">{user ? "내 문서" : "이 기기의 문서"}</Text>
                      <Text as="span" ink="tertiary" numeric>{user ? notes.length : 1}</Text>
                    </Inline>
                    {user ? (
                      <Inline gap="sm" align="center">
                        <Box width="lg">
                          <Field aria-label="문서 검색" placeholder="문서 찾기" leading={<Glyph name="search" />} value={search} onChange={(e) => setSearch(e.target.value)} />
                        </Box>
                        <Select aria-label="문서 정렬" value={sort} onChange={(e) => setSort(e.target.value)}>
                          <Select.Option value="recent">최근 수정순</Select.Option>
                          <Select.Option value="title">이름순</Select.Option>
                        </Select>
                      </Inline>
                    ) : null}
                  </Inline>
                  {user ? (
                    filtered.length ? (
                      <Grid columns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }} gap="xl">
                        {filtered.map((note) => (
                          <Card key={note.id} note={note} working={working} open={() => open(note)} remove={() => remove(note)} />
                        ))}
                      </Grid>
                    ) : (
                      <Surface border radius="md" padding="2xl">
                        <Stack align="center" gap="md">
                          <Glyph name="file-text" size="subheading" ink="secondary" />
                          <Text as="h3" variant="subheading">{search ? "찾는 문서가 없습니다" : "첫 문서를 만들어보세요"}</Text>
                          <Text as="p" ink="secondary">{search ? "다른 이름으로 검색해보세요." : "문서 이름과 내용은 쓰는 동안 자동으로 저장됩니다."}</Text>
                          {search ? null : (
                            <Button variant="hairline" disabled={working} onClick={create}>
                              <Glyph name="plus" />
                              새 문서 만들기
                            </Button>
                          )}
                        </Stack>
                      </Surface>
                    )
                  ) : (
                    <Grid columns={{ base: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)" }} gap="xl" align="stretch">
                      <Surface as="a" href={documentPath("local")} fill="raised" border radius="md" padding="2xl" hoverable className="plain-link" onClick={plainClick(guestOpen)}>
                        <Stack justify="center" height="full">
                          <Inline gap="xl" align="center" justify="between">
                            <Inline gap="xl" align="center" minWidth={0}>
                              <Glyph name="file-text" size="subheading" ink="secondary" />
                              <Stack gap="xs" minWidth={0}>
                                <Serif as="h3" variant="heading" strong={false}>{guest.title || "제목 없는 문서"}</Serif>
                                <Text as="p" variant="caption" ink="secondary">이 브라우저에 저장된 문서 이어쓰기</Text>
                              </Stack>
                            </Inline>
                            <Glyph name="arrow-up-right" size="subheading" />
                          </Inline>
                        </Stack>
                      </Surface>
                      <Surface border={wide ? "start" : "top"} paddingX={wide ? "2xl" : undefined} paddingY="xl">
                        <Stack gap="md" align="start">
                          <Text as="h3" variant="subheading">문서를 한곳에 모아두세요.</Text>
                          <Text as="p" ink="secondary">계정에 여러 문서를 저장하고 다른 기기에서도 이어 쓸 수 있습니다.</Text>
                          <Button variant="hairline" size="sm" onClick={login}>로그인 / 회원가입</Button>
                        </Stack>
                      </Surface>
                    </Grid>
                  )}
                </Stack>
                {user ? (
                  <Inline>
                    <Link href={documentPath("local")} underline="hover" onClick={plainClick(guestOpen)}>이 기기에 저장된 문서 열기</Link>
                  </Inline>
                ) : null}
              </Stack>
            </Box>
          </Box>
        </Column>
      </Box>
      <Surface as="footer" border="top">
        <Column>
          <Inline justify="between" align="center" gap="lg" paddingY="lg">
            <Text as="span" variant="label" strong={false} ink="tertiary">Paperdown</Text>
            <Box as="span" hideBelow="sm">
              <Text as="span" variant="label" strong={false} ink="tertiary">글에 집중하고, 종이로 남기세요.</Text>
            </Box>
          </Inline>
        </Column>
      </Surface>
    </Grid>
  );
}
