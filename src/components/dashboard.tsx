"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createAuthClient } from "better-auth/react";
import {
  LayoutDashboard,
  UserRound,
  FolderHeart,
  NotebookPen,
  Images,
  Mail,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  Eye,
  Save,
  Send,
  ArrowLeft,
} from "lucide-react";
import type { Portfolio, Entry } from "@/lib/schema";
import { Flower } from "./flower";
const VisualEditor = dynamic(
  () => import("./visual-editor").then((m) => m.VisualEditor),
  { ssr: false, loading: () => <p>Loading editor…</p> },
);
type Doc = {
  id: string;
  kind: string;
  draft: Portfolio | Entry;
  published: Portfolio | Entry | null;
  version: number;
  updatedAt: string;
};
type Media = {
  id: string;
  name: string;
  alt: string;
  type: string;
  size: number;
};
type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  job: { status: string; lastError: string | null; attempts: number } | null;
};
async function api(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers:
      body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error +
        (result.issues
          ? "\n" +
            result.issues
              .map(
                (i: { path: string[]; message: string }) =>
                  `${i.path.join(" → ")}: ${i.message}`,
              )
              .join("\n")
          : ""),
    );
  return result;
}
const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "portfolio", label: "My profile", icon: UserRound },
  { id: "project", label: "Projects", icon: FolderHeart },
  { id: "post", label: "Journal", icon: NotebookPen },
  { id: "media", label: "Media library", icon: Images },
  { id: "inbox", label: "Inbox", icon: Mail },
];
export function Dashboard({ initial, user }: { initial: Doc[]; user: string }) {
  const [docs, setDocs] = useState(initial),
    [section, setSection] = useState("overview"),
    [active, setActive] = useState<string | null>(null),
    [media, setMedia] = useState<Media[]>([]),
    [inbox, setInbox] = useState<Message[]>([]),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [dirty, setDirty] = useState(false);
  const [uploadAlt, setUploadAlt] = useState("");
  const uploadInput = useRef<HTMLInputElement>(null);
  const unread = inbox.filter((m) => m.status === "unread").length;
  const current = docs.find((d) => d.id === active);
  useEffect(() => {
    Promise.all([api("/api/admin/media"), api("/api/admin/inbox")])
      .then(([m, i]) => {
        setMedia(m);
        setInbox(i);
      })
      .catch((e) => {
        setError(true);
        setNotice(e.message);
      });
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    setError(false);
    try {
      await fn();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Something went wrong.");
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  function go(id: string) {
    if (dirty && !confirm("Leave without saving your changes?")) return;
    setDirty(false);
    setSection(id);
    setActive(
      id === "portfolio"
        ? docs.find((d) => d.kind === "portfolio")?.id || null
        : null,
    );
    setNotice("");
  }
  async function mutate(doc: Doc, action: string, data?: unknown) {
    const result = await api(`/api/admin/documents/${doc.id}`, "PATCH", {
      version: doc.version,
      action,
      data,
    });
    setDocs((prev) =>
      result
        ? prev.map((d) => (d.id === doc.id ? result : d))
        : prev.filter((d) => d.id !== doc.id),
    );
    setDirty(false);
    if (!result) setActive(null);
    setNotice(
      action === "save"
        ? "Draft saved. Your public site has not changed."
        : action === "publish"
          ? "Published. Your changes are now live."
          : action === "unpublish"
            ? "Removed from the public site. Your draft is safe."
            : "Entry deleted.",
    );
  }
  async function upload(file: File, alt: string) {
    const form = new FormData();
    form.set("file", file);
    form.set("alt", alt);
    const result = await api("/api/admin/media", "POST", form);
    setMedia((prev) => [result, ...prev]);
    return result as Media;
  }
  async function inboxAction(id: string, action: string) {
    await api(`/api/admin/inbox/${id}`, "PATCH", { action });
    setInbox(await api("/api/admin/inbox"));
    setNotice("Inbox updated.");
  }
  return (
    <div className="studio">
      <aside className="studio-sidebar">
        <Link href="/" className="wordmark">
          little studio<span>✳</span>
        </Link>
        <span className="studio-caption">YOUR CORNER OF THE INTERNET</span>
        <nav className="studio-nav" aria-label="Studio navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={section === n.id ? "active" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={17} />
              {n.label}
              {n.id === "inbox" && unread > 0 && (
                <span className="status-badge">{unread}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="studio-sidebar-bottom">
          <Link href="/" target="_blank">
            Visit portfolio
          </Link>
          <span>
            Made with sunshine.
            <br />
            Built by <a href="https://macm.lk">MACM.lk</a>
          </span>
          <button
            onClick={async () => {
              await createAuthClient().signOut();
              window.location.assign("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="studio-main">
        <header className="studio-topbar">
          <span>Your space to grow.</span>
          <button
            className="mobile-signout"
            onClick={async () => {
              if (dirty && !confirm("Sign out without saving your changes?"))
                return;
              await createAuthClient().signOut();
              window.location.assign("/login");
            }}
          >
            Sign out
          </button>
          <span>
            <span className="studio-avatar">{user.slice(0, 1)}</span>
            {user}
          </span>
        </header>
        <main className="studio-body" id="main">
          {notice && (
            <div
              role="status"
              className={`status-message ${error ? "error" : ""}`}
            >
              {notice}
              {error && notice.includes("Someone else") && (
                <button
                  className="button small"
                  onClick={() =>
                    run(async () => {
                      if (
                        confirm(
                          "Reload the latest saved content? Your unsaved edits will be discarded.",
                        )
                      ) {
                        setDocs(await api("/api/admin/documents"));
                        setDirty(false);
                        setNotice("Latest version loaded.");
                      }
                    })
                  }
                >
                  Reload latest version
                </button>
              )}
            </div>
          )}
          {current ? (
            <DocumentEditor
              key={`${current.id}-${current.version}`}
              doc={current}
              media={media}
              busy={busy}
              onDirty={() => setDirty(true)}
              onBack={() => go(section)}
              onAction={(action, data) =>
                run(() => mutate(current, action, data))
              }
              upload={upload}
            />
          ) : (
            <>
              {section === "overview" && (
                <>
                  <div className="studio-title">
                    <div>
                      <span className="eyebrow">A FRESH PAGE, EVERY DAY</span>
                      <h1>Hello, {user.split(" ")[0]} ☀</h1>
                      <p>Here’s what’s happening in your little corner.</p>
                    </div>
                    <Link href="/" target="_blank" className="button small">
                      View portfolio
                    </Link>
                  </div>
                  <div className="studio-card welcome-card">
                    <Flower className="welcome-flower" />
                    <h2>
                      Make a little room
                      <br />
                      <span className="serif">for your next chapter.</span>
                    </h2>
                    <p>
                      Your work, your stories, your way. Start with your
                      profile, add the things you’re proud of, and publish when
                      it feels right.
                    </p>
                    <button
                      className="button dark small"
                      onClick={() => go("portfolio")}
                    >
                      Edit my profile
                    </button>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span>Published projects</span>
                      <strong>
                        {
                          docs.filter(
                            (d) => d.kind === "project" && d.published,
                          ).length
                        }
                      </strong>
                    </div>
                    <div className="stat-card">
                      <span>Journal entries</span>
                      <strong>
                        {docs.filter((d) => d.kind === "post").length}
                      </strong>
                    </div>
                    <div className="stat-card">
                      <span>Unread hellos</span>
                      <strong>{unread}</strong>
                    </div>
                  </div>
                  <div className="studio-card">
                    <h2>A few little reminders</h2>
                    <p>
                      Drafts are only visible to you. Save your work, open a
                      preview, then publish when you’re happy. Each project and
                      journal entry is published separately.
                    </p>
                    <p>
                      Replace the sample name and content, upload your favorite
                      photo and résumé, and add your own links. SMTP and storage
                      settings are managed through the server configuration.
                    </p>
                  </div>
                </>
              )}
              {["project", "post"].includes(section) && (
                <>
                  <div className="studio-title">
                    <div>
                      <span className="eyebrow">
                        {section === "project"
                          ? "MADE WITH INTENTION"
                          : "FROM YOUR NOTEBOOK"}
                      </span>
                      <h1>
                        {section === "project"
                          ? "Your projects."
                          : "Your journal."}
                      </h1>
                      <p>Save the story. Share it when it’s ready.</p>
                    </div>
                    <button
                      className="button dark small"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const d = await api("/api/admin/documents", "POST", {
                            kind: section,
                          });
                          setDocs((prev) => [...prev, d]);
                          setActive(d.id);
                        })
                      }
                    >
                      <Plus size={15} />
                      New {section === "project" ? "project" : "entry"}
                    </button>
                  </div>
                  <div className="studio-list">
                    {docs
                      .filter((d) => d.kind === section)
                      .map((d) => (
                        <div key={d.id} className="studio-list-item">
                          <FileText size={22} />
                          <div className="list-text">
                            <h3>{(d.draft as Entry).title}</h3>
                            <p>
                              /{section === "project" ? "projects" : "blog"}/
                              {(d.draft as Entry).slug}
                            </p>
                          </div>
                          <span
                            className={`status-badge ${d.published ? "" : "draft"}`}
                          >
                            {d.published ? "Published" : "Draft"}
                          </span>
                          <button
                            className="button small"
                            onClick={() => setActive(d.id)}
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                  </div>
                  {!docs.some((d) => d.kind === section) && (
                    <p className="empty-state">
                      Your next story starts right here. Create your first
                      entry.
                    </p>
                  )}
                </>
              )}
              {section === "media" && (
                <>
                  <div className="studio-title">
                    <div>
                      <h1>The media shelf.</h1>
                      <p>A home for your photos, project images, and résumé.</p>
                    </div>
                  </div>
                  <div className="studio-card">
                    <h2>Add something lovely</h2>
                    <p>
                      JPEG, PNG, WebP, or PDF · Up to 10 MB. Images are resized
                      and optimized automatically.
                    </p>
                    <div className="field-pair">
                      <label>
                        Image description
                        <input
                          value={uploadAlt}
                          onChange={(e) => setUploadAlt(e.target.value)}
                          placeholder="Describe the image for screen readers"
                        />
                      </label>
                      <label>
                        Choose a file
                        <input
                          ref={uploadInput}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          disabled={busy}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              run(async () => {
                                await upload(file, uploadAlt);
                                setNotice("File uploaded.");
                                setUploadAlt("");
                                if (uploadInput.current)
                                  uploadInput.current.value = "";
                              });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="media-grid">
                    {media.map((m) => (
                      <div className="media-tile" key={m.id}>
                        {m.type.startsWith("image/") ? (
                          <img
                            src={`/api/media/${m.id}`}
                            alt={m.alt}
                            loading="lazy"
                          />
                        ) : (
                          <a
                            className="media-file"
                            href={`/api/media/${m.id}`}
                            target="_blank"
                          >
                            PDF
                          </a>
                        )}
                        <div>
                          <p>{m.name}</p>
                          <p>{Math.round(m.size / 1024)} KB</p>
                          <button
                            className="button small danger"
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  "Delete this file permanently? Referenced files cannot be deleted.",
                                )
                              )
                                run(async () => {
                                  await api(
                                    `/api/admin/media/${m.id}`,
                                    "DELETE",
                                  );
                                  setMedia((prev) =>
                                    prev.filter((x) => x.id !== m.id),
                                  );
                                  setNotice("File deleted.");
                                });
                            }}
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {section === "inbox" && (
                <>
                  <div className="studio-title">
                    <div>
                      <h1>A few little hellos.</h1>
                      <p>
                        Latest 200 requests · {unread} unread · Messages stay
                        here even if an email alert fails.
                      </p>
                    </div>
                    <button
                      className="button small"
                      onClick={() =>
                        run(async () => {
                          setInbox(await api("/api/admin/inbox"));
                        })
                      }
                    >
                      Refresh
                    </button>
                  </div>
                  {inbox.map((m) => (
                    <div key={m.id} className="studio-card">
                      <div className="inbox-header">
                        <div>
                          <h3>{m.subject}</h3>
                          <p>
                            {m.name} ·{" "}
                            <a className="text-link" href={`mailto:${m.email}`}>
                              {m.email}
                            </a>
                          </p>
                        </div>
                        <div>
                          <span
                            className={`status-badge ${m.status === "unread" ? "draft" : ""}`}
                          >
                            {m.status}
                          </span>
                          <p>{new Date(m.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="inbox-message">{m.message}</p>
                      <p>
                        Email alert: <strong>{m.job?.status || "none"}</strong>
                        {m.job?.lastError && ` · ${m.job.lastError}`}
                      </p>
                      <div className="studio-actions">
                        <button
                          className="button small"
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              inboxAction(
                                m.id,
                                m.status === "unread" ? "read" : "unread",
                              ),
                            )
                          }
                        >
                          Mark {m.status === "unread" ? "read" : "unread"}
                        </button>
                        <button
                          className="button small"
                          disabled={busy}
                          onClick={() =>
                            run(() => inboxAction(m.id, "archived"))
                          }
                        >
                          Archive
                        </button>
                        {m.job?.status === "failed" && (
                          <button
                            className="button small"
                            disabled={busy}
                            onClick={() =>
                              run(() => inboxAction(m.id, "retry"))
                            }
                          >
                            Retry email
                          </button>
                        )}
                        <button
                          className="button small danger"
                          disabled={busy}
                          onClick={() => {
                            if (confirm("Permanently delete this request?"))
                              run(() => inboxAction(m.id, "delete"));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {!inbox.length && (
                    <p className="empty-state">
                      Quiet for now. New messages will appear here.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  multiline = false,
  full = false,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  multiline?: boolean;
  full?: boolean;
  type?: string;
}) {
  return (
    <label className={full ? "full" : ""}>
      {label}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function AssetPicker({
  label,
  value,
  onChange,
  media,
  pdf = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  media: Media[];
  pdf?: boolean;
}) {
  const current = media.find((m) => m.id === value);
  return (
    <div className="upload-box">
      <label>
        {label}
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">None selected</option>
          {media
            .filter((m) =>
              pdf ? m.type === "application/pdf" : m.type.startsWith("image/"),
            )
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </label>
      {current &&
        (pdf ? (
          <a
            href={`/api/media/${current.id}`}
            target="_blank"
            className="text-link"
          >
            View PDF
          </a>
        ) : (
          <img src={`/api/media/${current.id}`} alt={current.alt} />
        ))}
      <p>
        Add new files through the media library. Save your draft before leaving.
      </p>
    </div>
  );
}
function DocumentEditor({
  doc,
  media,
  busy,
  onDirty,
  onAction,
  onBack,
}: {
  doc: Doc;
  media: Media[];
  busy: boolean;
  onDirty: () => void;
  onAction: (a: string, d?: unknown) => void;
  onBack: () => void;
  upload: (f: File, a: string) => Promise<Media>;
}) {
  const [data, setData] = useState<Portfolio | Entry>(doc.draft),
    [tab, setTab] = useState("basics"),
    [changed, setChanged] = useState(false);
  const isProfile = doc.kind === "portfolio";
  const p = data as Portfolio,
    e = data as Entry;
  function set(key: string, value: unknown) {
    setData((prev) => ({ ...prev, [key]: value }));
    setChanged(true);
    onDirty();
  }
  const tabs = isProfile
    ? [
        { id: "basics", name: "Profile & availability" },
        { id: "about", name: "About & journey" },
        { id: "contact", name: "Contact & socials" },
        { id: "seo", name: "Search settings" },
      ]
    : [
        { id: "basics", name: "Story & details" },
        { id: "media", name: "Images & gallery" },
        { id: "seo", name: "Search settings" },
      ];
  return (
    <>
      <div className="studio-title">
        <div>
          {!isProfile && (
            <button className="text-link" onClick={onBack}>
              <ArrowLeft size={13} />
              All {doc.kind === "project" ? "projects" : "entries"}
            </button>
          )}
          <h1>{isProfile ? "A little about you." : e.title}</h1>
          <p>
            <span className={`status-badge ${doc.published ? "" : "draft"}`}>
              {doc.published ? "Live version exists" : "Not yet published"}
            </span>{" "}
            {changed ? "Unsaved changes" : "Saved draft"} · Version{" "}
            {doc.version}
          </p>
        </div>
        <div className="studio-actions">
          <Link
            href={`/admin/preview/${doc.id}`}
            target="_blank"
            className="button small"
          >
            <Eye size={14} />
            Preview saved draft
          </Link>
          <button
            className="button small"
            disabled={busy}
            onClick={() => onAction("save", data)}
          >
            <Save size={14} />
            Save draft
          </button>
          <button
            className="button yellow small"
            disabled={busy || changed}
            title={
              changed
                ? "Save your draft before publishing"
                : "Publish saved draft"
            }
            onClick={() => onAction("publish")}
          >
            <Send size={14} />
            {isProfile ? "Publish portfolio" : "Publish"}
          </button>
        </div>
      </div>
      <div className="studio-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? "active" : ""}
          >
            {t.name}
          </button>
        ))}
      </div>
      {isProfile && tab === "basics" && (
        <>
          <div className="studio-card">
            <h2>Your first hello</h2>
            <p>The essentials people see when they land on your page.</p>
            <div className="editor-grid">
              <Field
                label="Name"
                value={p.name}
                onChange={(v) => set("name", v)}
              />
              <Field
                label="Position / headline"
                value={p.position}
                onChange={(v) => set("position", v)}
              />
              <Field
                label="Introduction"
                value={p.intro}
                onChange={(v) => set("intro", v)}
                multiline
                full
              />
              <Field
                label="Location"
                value={p.location}
                onChange={(v) => set("location", v)}
              />
              <Field
                label="Availability message"
                value={p.availability}
                onChange={(v) => set("availability", v)}
              />
              <label className="check-label full">
                <input
                  type="checkbox"
                  checked={p.available}
                  onChange={(v) => set("available", v.target.checked)}
                />
                Show an active availability indicator
              </label>
            </div>
          </div>
          <div className="studio-card">
            <h2>Put a face to the story</h2>
            <p>Your favorite photo and your latest résumé.</p>
            <div className="editor-grid">
              <AssetPicker
                label="Portrait"
                value={p.portrait}
                onChange={(v) => set("portrait", v)}
                media={media}
              />
              <AssetPicker
                label="Résumé PDF"
                value={p.resume}
                onChange={(v) => set("resume", v)}
                media={media}
                pdf
              />
            </div>
          </div>
        </>
      )}
      {isProfile && tab === "about" && (
        <>
          <div className="studio-card">
            <h2>Your story</h2>
            <p>A few words about who you are and what matters to you.</p>
            <VisualEditor
              label="About you"
              value={p.about}
              onChange={(value) => set("about", value)}
              maxLength={5000}
            />
          </div>
          {(["experience", "education", "skills"] as const).map((key) => (
            <div className="studio-card" key={key}>
              <h2>{key[0].toUpperCase() + key.slice(1)}</h2>
              <p>
                Reorder entries with the arrows, or hide them until you’re
                ready.
              </p>
              <Repeater
                rows={p[key] as unknown as Record<string, unknown>[]}
                onChange={(v) => set(key, v)}
                fields={
                  key === "skills"
                    ? ["title"]
                    : ["title", "subtitle", "date", "description"]
                }
              />
            </div>
          ))}
        </>
      )}
      {isProfile && tab === "contact" && (
        <>
          <div className="studio-card">
            <h2>Let’s stay connected</h2>
            <p>
              These contact details are public. Notification recipients are
              configured separately on the server.
            </p>
            <div className="editor-grid">
              <Field
                label="Public email address"
                type="email"
                value={p.email}
                onChange={(v) => set("email", v)}
              />
              <Field
                label="Phone number (optional)"
                value={p.phone}
                onChange={(v) => set("phone", v)}
              />
            </div>
          </div>
          <div className="studio-card">
            <h2>Find you elsewhere</h2>
            <p>
              Add any social platform or professional profile using a complete
              URL.
            </p>
            <Repeater
              rows={p.socials}
              onChange={(v) => set("socials", v)}
              fields={["label", "url"]}
            />
          </div>
        </>
      )}
      {!isProfile && tab === "basics" && (
        <>
          <div className="studio-card">
            <h2>The story starts here</h2>
            <p>
              Format your story directly with headings, emphasis, lists, quotes,
              links, and code. Add images in the gallery.
            </p>
            <div className="editor-grid">
              <Field
                label="Title"
                value={e.title}
                onChange={(v) => set("title", v)}
              />
              <Field
                label="URL slug"
                value={e.slug}
                onChange={(v) => set("slug", v)}
              />
              <Field
                label="Short introduction"
                value={e.excerpt}
                onChange={(v) => set("excerpt", v)}
                multiline
                full
              />
              <Field
                label="Category"
                value={e.category}
                onChange={(v) => set("category", v)}
              />
              <Field
                label="Display date / year"
                value={e.date}
                onChange={(v) => set("date", v)}
              />
              {doc.kind === "project" && (
                <>
                  <Field
                    label="Your contribution / role"
                    value={e.role}
                    onChange={(v) => set("role", v)}
                  />
                  <Field
                    label="Skills & tools"
                    value={e.skills}
                    onChange={(v) => set("skills", v)}
                  />
                  <Field
                    label="External project URL"
                    value={e.url}
                    onChange={(v) => set("url", v)}
                  />
                  <Field
                    label="Order (smaller numbers appear first)"
                    type="number"
                    value={e.order}
                    onChange={(v) => set("order", Number(v))}
                  />
                  <label className="check-label full">
                    <input
                      type="checkbox"
                      checked={e.featured}
                      onChange={(v) => set("featured", v.target.checked)}
                    />
                    Feature on homepage
                  </label>
                </>
              )}
            </div>
            <VisualEditor
              label="Full story"
              value={e.body}
              onChange={(value) => set("body", value)}
              maxLength={50000}
            />
          </div>
        </>
      )}
      {!isProfile && tab === "media" && (
        <div className="studio-card">
          <h2>A few pictures tell the story</h2>
          <p>Choose a cover and arrange the images you’d like to include.</p>
          <AssetPicker
            label="Cover image"
            value={e.cover}
            onChange={(v) => set("cover", v)}
            media={media}
          />
          <h3 style={{ marginTop: 30 }}>Gallery</h3>
          {e.gallery.map((id, i) => (
            <div className="repeat-row" key={i}>
              <AssetPicker
                label={`Image ${i + 1}`}
                value={id}
                onChange={(v) =>
                  set(
                    "gallery",
                    e.gallery.map((old, j) => (j === i ? v : old)),
                  )
                }
                media={media}
              />
              <div className="repeat-tools">
                <button
                  className="icon-button"
                  aria-label="Move image up"
                  disabled={i === 0}
                  onClick={() => {
                    const a = [...e.gallery];
                    [a[i - 1], a[i]] = [a[i], a[i - 1]];
                    set("gallery", a);
                  }}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Remove gallery image"
                  onClick={() =>
                    set(
                      "gallery",
                      e.gallery.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <button
            className="button small"
            onClick={() => set("gallery", [...e.gallery, ""])}
          >
            <Plus size={14} />
            Add gallery image
          </button>
        </div>
      )}
      {tab === "seo" && (
        <div className="studio-card">
          <h2>A good first impression</h2>
          <p>
            Help search engines understand this page. Leave blank to use the
            name/title and introduction.
          </p>
          <div className="editor-grid">
            <Field
              label="Search title"
              value={data.seoTitle}
              onChange={(v) => set("seoTitle", v)}
              full
            />
            <Field
              label="Search description"
              value={data.seoDescription}
              onChange={(v) => set("seoDescription", v)}
              multiline
              full
            />
          </div>
        </div>
      )}
      <div className="studio-actions">
        {doc.published && (
          <button
            className="button small"
            disabled={busy || changed}
            onClick={() => {
              if (
                confirm(
                  "Remove this content from the public site? The saved draft will remain.",
                )
              )
                onAction("unpublish");
            }}
          >
            Unpublish
          </button>
        )}
        {!isProfile && (
          <button
            className="button small danger"
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "Permanently delete this entry and its published version?",
                )
              )
                onAction("delete");
            }}
          >
            <Trash2 size={14} />
            Delete entry
          </button>
        )}
      </div>
    </>
  );
}
function Repeater({
  rows,
  fields,
  onChange,
}: {
  rows: Record<string, unknown>[];
  fields: string[];
  onChange: (v: Record<string, unknown>[]) => void;
}) {
  return (
    <>
      {rows.map((row, i) => (
        <div key={i} className="repeat-row">
          <div className="editor-grid">
            {fields.map((f) => (
              <Field
                key={f}
                label={
                  f === "subtitle"
                    ? "Organization / institution"
                    : f === "label"
                      ? "Platform name"
                      : f === "url"
                        ? "Profile URL"
                        : f[0].toUpperCase() + f.slice(1)
                }
                value={String(row[f] || "")}
                multiline={f === "description"}
                full={f === "description"}
                onChange={(v) =>
                  onChange(rows.map((r, j) => (j === i ? { ...r, [f]: v } : r)))
                }
              />
            ))}
          </div>
          <div className="repeat-tools">
            <label className="check-label">
              <input
                type="checkbox"
                checked={Boolean(row.hidden)}
                onChange={(e) =>
                  onChange(
                    rows.map((r, j) =>
                      j === i ? { ...r, hidden: e.target.checked } : r,
                    ),
                  )
                }
              />
              Hidden
            </label>
            <button
              className="icon-button"
              aria-label="Move up"
              disabled={i === 0}
              onClick={() => {
                const a = [...rows];
                [a[i - 1], a[i]] = [a[i], a[i - 1]];
                onChange(a);
              }}
            >
              <ArrowUp size={14} />
            </button>
            <button
              className="icon-button"
              aria-label="Move down"
              disabled={i === rows.length - 1}
              onClick={() => {
                const a = [...rows];
                [a[i + 1], a[i]] = [a[i], a[i + 1]];
                onChange(a);
              }}
            >
              <ArrowDown size={14} />
            </button>
            <button
              className="icon-button"
              aria-label="Remove entry"
              onClick={() => onChange(rows.filter((_, j) => i !== j))}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        className="button small"
        onClick={() =>
          onChange([
            ...rows,
            {
              ...Object.fromEntries(fields.map((f) => [f, ""])),
              hidden: false,
            },
          ])
        }
      >
        <Plus size={14} />
        Add entry
      </button>
    </>
  );
}
