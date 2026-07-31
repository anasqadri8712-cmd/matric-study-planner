import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { validateName } from "@/lib/validation";
import { fileToAvatarDataUrl } from "@/lib/image";

export const Route = createFileRoute("/_authenticated/edit-profile")({
  head: () => ({
    meta: [
      { title: "Edit Profile | AI Study Planner" },
      { name: "description", content: "Update your name, username, phone number, class, board and profile photo." },
      { property: "og:title", content: "Edit Profile" },
      { property: "og:description", content: "Update your student details and profile photo." },
    ],
  }),
  component: EditProfilePage,
});

function EditProfilePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { data: profile } = useProfile(user?.id);
  const update = useUpdateProfile(user?.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [studentClass, setStudentClass] = useState("Class 9");
  const [board, setBoard] = useState("Punjab Board");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setUsername(profile.username ?? "");
    setPhone(profile.phone ?? "");
    setStudentClass(profile.student_class);
    setBoard(profile.board);
    setAvatar(profile.avatar_url ?? "");
  }, [profile]);

  async function pickPhoto(file?: File) {
    if (!file) return;
    try {
      setAvatar(await fileToAvatarDataUrl(file));
      toast.success("Photo selected. Press save to keep it.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that image.");
    }
  }

  async function save() {
    const nameError = validateName(fullName);
    if (nameError) return toast.error(nameError);
    if (username && !/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
      return toast.error("Username must be 3-20 letters, numbers, dots or underscores.");
    }
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      return toast.error("Please enter a valid phone number.");
    }
    await update.mutateAsync({
      full_name: fullName.trim(),
      username: username.trim(),
      phone: phone.trim(),
      student_class: studentClass,
      board,
      avatar_url: avatar,
    });
    toast.success("Profile updated.");
    navigate({ to: "/profile" });
  }

  return (
    <AppShell>
      <PageHeader title="Edit profile" subtitle="Your email stays linked to your account" />

      <div className="surface-card animate-rise flex flex-col items-center gap-3 p-5">
        {avatar ? (
          <img src={avatar} alt="Profile preview" className="size-24 rounded-3xl object-cover" />
        ) : (
          <span className="gradient-primary flex size-24 items-center justify-center rounded-3xl text-primary-foreground">
            <UserRound className="size-10" />
          </span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="press h-11 rounded-xl">
          <Camera className="mr-1 size-4" /> Choose from gallery
        </Button>
        {avatar ? (
          <button onClick={() => setAvatar("")} className="text-xs text-muted-foreground underline">
            Remove photo
          </button>
        ) : null}
      </div>

      <div className="animate-rise mt-5 space-y-5">
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-xl" />
        </div>

        <div className="space-y-2">
          <Label>Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ali_matric"
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} readOnly disabled className="h-12 rounded-xl" />
          <p className="text-xs text-muted-foreground">Email is your account identity and cannot be changed here.</p>
        </div>

        <div className="space-y-2">
          <Label>Phone number</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="03xx xxxxxxx"
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Class</Label>
          <div className="grid grid-cols-2 gap-2">
            {["Class 9", "Class 10"].map((c) => (
              <Pick key={c} active={studentClass === c} onClick={() => setStudentClass(c)}>
                {c}
              </Pick>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Board</Label>
          <div className="grid grid-cols-2 gap-2">
            {["Punjab Board", "Sindh Board", "KPK Board", "Federal Board"].map((b) => (
              <Pick key={b} active={board === b} onClick={() => setBoard(b)}>
                {b}
              </Pick>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={update.isPending} className="press h-13 w-full rounded-2xl">
          <Save className="mr-1 size-4" />
          {update.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </AppShell>
  );
}

function Pick({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press rounded-xl border py-3 text-sm font-medium",
        active ? "border-primary bg-primary/12 text-primary" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
