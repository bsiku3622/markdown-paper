import { useEffect, useRef, useState, type FormEvent } from "react";
import { Box, Button, Divider, Field, Floating, FormField, IconButton, Inline, Stack, Surface, Text } from "@studio-baeks/paper-ui";
import { Glyph } from "./glyphs";
import { Avatar } from "./chrome";
import { useMedia } from "./hooks";
import { api, uploadAvatar, type User } from "./cloud";
import { GoogleButton } from "./google";

// Avatars are cropped to a centred square and downscaled before upload.
async function squareAvatar(file: File) {
  const url = URL.createObjectURL(file),
    img = new window.Image();
  img.src = url;
  try {
    await img.decode();
    const side = Math.min(img.naturalWidth, img.naturalHeight),
      size = Math.min(256, side),
      canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d")!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("사진을 처리하지 못했습니다."))), "image/webp", 0.9));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function Profile({ user, open, setOpen, setUser, google }: { user: User; open: boolean; setOpen: (open: boolean) => void; setUser: (user: User) => void; google: string | null }) {
  const phone = useMedia("(max-width: 767px)"),
    picker = useRef<HTMLInputElement>(null),
    [nickname, setNickname] = useState(user.nickname),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [working, setWorking] = useState(false);
  useEffect(() => {
    if (!open) return;
    setNickname(user.nickname);
    setError("");
    setNotice("");
  }, [open]);
  async function run(task: () => Promise<User>, done: string) {
    setWorking(true);
    setError("");
    setNotice("");
    try {
      setUser(await task());
      setNotice(done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로필을 바꾸지 못했습니다.");
    } finally {
      setWorking(false);
    }
  }
  function saveNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => (await api<{ user: User }>("/me", "PUT", { nickname })).user, "닉네임을 바꿨습니다.");
  }
  function changeAvatar(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 15_000_000) {
      setError("15MB 이하의 PNG, JPEG, WebP, GIF 사진을 선택해주세요.");
      return;
    }
    void run(async () => uploadAvatar(await squareAvatar(file)), "사진을 바꿨습니다.");
  }
  return (
    <Floating open={open} onOpenChange={(o) => !working && setOpen(o)}>
      <Floating.Content as={Surface} fill="raised" radius="md" padding="2xl" width={phone ? "xl" : "measure.xs"} maxWidth="full" presentation="modal" aria-label="프로필">
        <Stack gap="xl">
          <Inline justify="between" align="center" gap="md">
            <Text as="h2" variant="subheading">프로필</Text>
            <IconButton as={Floating.Close} size="xs" variant="ghost" aria-label="프로필 닫기">
              <Glyph name="x" />
            </IconButton>
          </Inline>
          <Inline gap="lg" align="center">
            <Avatar name={user.nickname} src={user.avatar} size="xl" />
            <Stack gap="sm" align="start">
              <Text as="p" variant="caption" ink="secondary">함께 쓰는 사람에게 이 사진과 닉네임이 보입니다.</Text>
              <Inline gap="sm" wrap>
                <Button variant="hairline" size="xs" disabled={working} onClick={() => picker.current?.click()}>
                  <Glyph name="image-plus" />
                  사진 바꾸기
                </Button>
                {user.avatar ? (
                  <Button variant="ghost" size="xs" disabled={working} onClick={() => void run(async () => (await api<{ user: User }>("/me/avatar", "DELETE")).user, "사진을 지웠습니다.")}>
                    사진 지우기
                  </Button>
                ) : null}
              </Inline>
            </Stack>
          </Inline>
          <Stack as="form" gap="md" onSubmit={saveNickname}>
            <FormField label="닉네임" description={`아이디 @${user.username} · 아이디는 바꿀 수 없습니다.`}>
              <Field size="md" maxLength={30} required value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </FormField>
            <Inline justify="end">
              <Button type="submit" size="sm" disabled={working || !nickname.trim() || nickname.trim() === user.nickname}>닉네임 저장</Button>
            </Inline>
          </Stack>
          {google || user.google ? (
            <>
              <Divider />
              <Stack gap="md">
                <Inline justify="between" align="center" gap="md">
                  <Stack gap="xs">
                    <Text as="span" variant="label">Google 계정</Text>
                    <Text as="span" variant="label" strong={false} ink="tertiary">
                      {user.google ? (user.hasPassword ? "연결됨 · Google로도 로그인할 수 있습니다." : "연결됨 · 이 계정은 Google로 로그인합니다.") : "연결하면 비밀번호 없이 로그인할 수 있습니다."}
                    </Text>
                  </Stack>
                  {user.google && user.hasPassword ? (
                    <Button variant="ghost" size="xs" disabled={working} onClick={() => void run(async () => (await api<{ user: User }>("/me/google", "DELETE")).user, "Google 연결을 해제했습니다.")}>
                      연결 해제
                    </Button>
                  ) : null}
                </Inline>
                {!user.google && google ? (
                  <Box>
                    <GoogleButton client={google} onCredential={(credential) => void run(async () => (await api<{ user: User }>("/me/google", "POST", { credential })).user, "Google 계정을 연결했습니다.")} />
                  </Box>
                ) : null}
              </Stack>
            </>
          ) : null}
          {error ? <Text as="p" variant="caption" ink="error" role="alert">{error}</Text> : null}
          {notice ? <Text as="p" variant="caption" ink="secondary" role="status">{notice}</Text> : null}
        </Stack>
        <input
          ref={picker}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(e) => {
            changeAvatar(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </Floating.Content>
    </Floating>
  );
}
