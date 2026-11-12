import { useState, type FormEvent, type ReactNode } from "react";
import { Box, Button, Divider, Field, Floating, IconButton, Inline, Select, Stack, Surface, Text } from "@studio-baeks/paper-ui";
import { Glyph } from "./glyphs";
import { Avatar } from "./chrome";
import { api, type Member, type Note, type PublicUser, type User } from "./cloud";
import { userColor } from "./live";

const ROLE = { owner: "주인", editor: "편집 가능", viewer: "보기만" } as const;

// Only people the server lists on the note are shown, even if presence data claims otherwise.
export function Presence({ people, online }: { people: PublicUser[]; online: string[] }) {
  const here = people.filter((p) => online.includes(p.id));
  if (!here.length) return null;
  return (
    <Inline gap="xs" align="center" aria-label={`지금 함께 보는 사람 ${here.length}명`} role="group">
      {here.slice(0, 4).map((p) => (
        <Avatar key={p.id} name={`${p.nickname} (지금 보는 중)`} src={p.avatar} size="sm" ring={userColor(p.id)} />
      ))}
      {here.length > 4 ? <Text as="span" variant="label" strong={false} ink="tertiary">+{here.length - 4}</Text> : null}
    </Inline>
  );
}

function Person({ person, online, children }: { person: PublicUser; online: boolean; children?: ReactNode }) {
  return (
    <Inline justify="between" align="center" gap="md">
      <Inline gap="sm" align="center" minWidth={0}>
        <Avatar name={person.nickname} src={person.avatar} ring={online ? userColor(person.id) : undefined} />
        <Stack minWidth={0}>
          <Text as="span" variant="label" truncate>{person.nickname}</Text>
          <Text as="span" variant="label" strong={false} ink="tertiary" truncate>@{person.username}{online ? " · 보는 중" : ""}</Text>
        </Stack>
      </Inline>
      {children}
    </Inline>
  );
}

export function SharePanel({ note, me, online, setMembers, leave }: { note: Note; me: User; online: string[]; setMembers: (members: Member[]) => void; leave: () => void }) {
  const owner = note.role === "owner",
    members = note.members || [],
    [username, setUsername] = useState(""),
    [role, setRole] = useState<Member["role"]>("editor"),
    [error, setError] = useState(""),
    [working, setWorking] = useState(false);
  async function change(run: () => Promise<{ members: Member[] }>) {
    setWorking(true);
    setError("");
    try {
      setMembers((await run()).members);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "공유 설정을 바꾸지 못했습니다.");
      return false;
    } finally {
      setWorking(false);
    }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim()) return;
    if (await change(() => api(`/notes/${note.id}/members`, "POST", { username, role }))) setUsername("");
  }
  const ownerProfile = note.owner || me;
  return (
    <Floating>
      <Button as={Floating.Trigger} variant="hairline" size="xs" aria-label="공유">
        <Glyph name="users" />
        <Box as="span" hideBelow="md">공유</Box>
        {members.length ? <Text as="span" variant="label" strong={false} ink="tertiary" numeric>{members.length + 1}</Text> : null}
      </Button>
      <Floating.Content as={Surface} fill="raised" radius="md" padding="lg" width="xl" maxWidth="full" placement="bottom end" aria-label="공유">
        <Stack gap="lg">
          <Inline justify="between" align="center">
            <Text as="h2" variant="subheading">함께 쓰기</Text>
            <IconButton as={Floating.Close} size="xs" variant="ghost" aria-label="공유 닫기">
              <Glyph name="x" />
            </IconButton>
          </Inline>
          {owner ? (
            <Stack as="form" gap="sm" onSubmit={invite}>
              <Text as="p" variant="label" strong={false} ink="secondary">Paperdown 아이디로 초대하면 이 노트가 상대의 문서 목록에 나타납니다.</Text>
              <Inline gap="sm" align="center">
                <Box width="full" minWidth={0}>
                  <Field size="sm" aria-label="초대할 아이디" placeholder="아이디" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
                </Box>
                <Select size="sm" aria-label="초대 권한" value={role} onChange={(e) => setRole(e.target.value as Member["role"])}>
                  <Select.Option value="editor">편집 가능</Select.Option>
                  <Select.Option value="viewer">보기만</Select.Option>
                </Select>
                <Button type="submit" size="sm" disabled={working || !username.trim()}>
                  <Glyph name="user-plus" />
                  초대
                </Button>
              </Inline>
            </Stack>
          ) : (
            <Text as="p" variant="label" strong={false} ink="secondary">
              {note.role === "viewer" ? "보기 권한으로 공유받았습니다. 바뀌는 내용은 바로 반영됩니다." : "편집 권한으로 공유받았습니다. 함께 쓰는 내용은 바로 저장됩니다."}
            </Text>
          )}
          {error ? <Text as="p" variant="caption" ink="error" role="alert">{error}</Text> : null}
          <Divider />
          <Stack gap="md" as="ul" className="plain-list" aria-label="이 노트를 쓰는 사람">
            <Box as="li">
              <Person person={ownerProfile} online={ownerProfile.id !== me.id && online.includes(ownerProfile.id)}>
                <Text as="span" variant="label" strong={false} ink="tertiary">{ROLE.owner}{ownerProfile.id === me.id ? " · 나" : ""}</Text>
              </Person>
            </Box>
            {members.map((m) => (
              <Box as="li" key={m.id}>
                <Person person={m} online={m.id !== me.id && online.includes(m.id)}>
                  {owner ? (
                    <Inline gap="xs" align="center">
                      <Select size="xs" variant="ghost" aria-label={`${m.nickname} 권한`} value={m.role} disabled={working} onChange={(e) => void change(() => api(`/notes/${note.id}/members/${m.id}`, "PUT", { role: e.target.value }))}>
                        <Select.Option value="editor">편집 가능</Select.Option>
                        <Select.Option value="viewer">보기만</Select.Option>
                      </Select>
                      <IconButton size="xs" variant="ghost" aria-label={`${m.nickname} 공유 해제`} title="공유 해제" disabled={working} onClick={() => void change(() => api(`/notes/${note.id}/members/${m.id}`, "DELETE"))}>
                        <Glyph name="x" ink="tertiary" />
                      </IconButton>
                    </Inline>
                  ) : (
                    <Text as="span" variant="label" strong={false} ink="tertiary">{ROLE[m.role]}{m.id === me.id ? " · 나" : ""}</Text>
                  )}
                </Person>
              </Box>
            ))}
          </Stack>
          {owner ? null : (
            <>
              <Divider />
              <Button variant="ghost" size="sm" fullWidth onClick={leave}>
                <Glyph name="log-out" />
                이 노트에서 나가기
              </Button>
            </>
          )}
        </Stack>
      </Floating.Content>
    </Floating>
  );
}
