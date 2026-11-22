import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AtSign,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  MapPin,
  Pencil,
  Save,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { resumeApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { GitHubIcon, LinkedInIcon } from '@/components/auth/AuthLayout';

function LeetCodeIcon({ className = 'size-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .666-1.765l3.854-4.126 5.406-5.788c.54-.54.54-1.414.003-1.955A1.37 1.37 0 0 0 13.483 0zm-2.88 5.9c-.376 0-.75.143-1.036.43l-3.5 3.5a1.466 1.466 0 1 0 2.073 2.073l3.5-3.5a1.465 1.465 0 0 0-1.037-2.503zm6.657 5.612a1.374 1.374 0 0 0-.962.438l-4.277 4.193a1.466 1.466 0 1 0 2.052 2.093l4.277-4.193a1.378 1.378 0 0 0-.003-1.955 1.37 1.37 0 0 0-1.087-.576z" />
    </svg>
  );
}

const EMPTY_PROFILE = { headline: '', location: '', bio: '', links: { github: '', linkedin: '', leetcode: '', portfolio: '' } };

const formatSocialUrl = (key, val) => {
  if (!val) return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (key === 'github' && !trimmed.includes('/')) return `https://github.com/${trimmed}`;
  if (key === 'leetcode' && !trimmed.includes('/')) return `https://leetcode.com/u/${trimmed}`;
  if (key === 'linkedin' && !trimmed.includes('/')) return `https://linkedin.com/in/${trimmed}`;
  return `https://${trimmed}`;
};

function Field({ label, value, onChange, placeholder, icon: Icon, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold tracking-wide uppercase text-zinc-500">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-zinc-400" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
        />
      </span>
    </label>
  );
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileInput = useRef(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [draft, setDraft] = useState({ name: '', ...EMPTY_PROFILE, links: { ...EMPTY_PROFILE.links } });

  useEffect(() => {
    setDraft({
      name: user?.name ?? '',
      ...(user?.profile ?? EMPTY_PROFILE),
      links: { ...EMPTY_PROFILE.links, ...(user?.profile?.links ?? {}) },
    });
  }, [user]);

  useEffect(() => {
    resumeApi.get().then(setResume).catch((error) => toast.error(errorMessage(error))).finally(() => setLoadingResume(false));
  }, []);

  const setProfile = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const setLink = (key, value) => setDraft((current) => ({ ...current, links: { ...current.links, [key]: value } }));

  const cancelEditing = () => {
    setDraft({
      name: user?.name ?? '',
      ...(user?.profile ?? EMPTY_PROFILE),
      links: { ...EMPTY_PROFILE.links, ...(user?.profile?.links ?? {}) },
    });
    setEditing(false);
  };

  const saveProfile = async (event) => {
    event?.preventDefault();
    setSaving(true);
    try {
      // Auto-format links with appropriate https:// URLs
      const formattedLinks = {
        github: formatSocialUrl('github', draft.links.github),
        linkedin: formatSocialUrl('linkedin', draft.links.linkedin),
        leetcode: formatSocialUrl('leetcode', draft.links.leetcode),
        portfolio: formatSocialUrl('portfolio', draft.links.portfolio),
      };

      await updateProfile({
        name: draft.name,
        profile: {
          headline: draft.headline,
          location: draft.location,
          bio: draft.bio,
          links: formattedLinks,
        },
      });
      toast.success('Profile updated');
      setEditing(false);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return toast.error('Please choose a PDF resume.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Please upload a PDF under 5 MB.');
    setUploading(true);
    try {
      setResume(await resumeApi.upload(file));
      toast.success('Resume analysed and saved');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const profile = resume?.profile;

  const socialLinksConfig = [
    { key: 'github', label: 'GitHub', icon: GitHubIcon, placeholder: 'github.com/username or username', value: draft.links.github, live: user?.profile?.links?.github },
    { key: 'leetcode', label: 'LeetCode', icon: LeetCodeIcon, placeholder: 'leetcode.com/u/username or username', value: draft.links.leetcode, live: user?.profile?.links?.leetcode },
    { key: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon, placeholder: 'linkedin.com/in/username or username', value: draft.links.linkedin, live: user?.profile?.links?.linkedin },
    { key: 'portfolio', label: 'Portfolio', icon: Globe2, placeholder: 'https://yourportfolio.com', value: draft.links.portfolio, live: user?.profile?.links?.portfolio },
  ];

  return (
    <div className="space-y-6">
      {/* Top Profile Header */}
      <section className="rounded-[28px] border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-zinc-950 text-2xl font-bold text-white shadow-md">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Candidate
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{user?.name}</h1>
              <p className="mt-0.5 text-xs text-zinc-500">{user?.email}</p>
            </div>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
            >
              <Pencil className="size-3.5" /> Edit profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                <X className="size-3.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
              >
                <Save className="size-3.5" /> {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Profile Grid */}
      <form onSubmit={saveProfile} className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        {/* Personal Details */}
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-950">Personal information</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Context here personalizes mock interview topics and coach feedback.</p>
            </div>
            <UserRound className="size-4 text-zinc-400" />
          </div>

          {editing ? (
            <div className="mt-6 space-y-4">
              <Field label="Full name" value={draft.name} onChange={(value) => setProfile('name', value)} placeholder="Your name" icon={UserRound} />
              <Field label="Professional headline" value={draft.headline} onChange={(value) => setProfile('headline', value)} placeholder="e.g. Fullstack Engineer focused on distributed systems" icon={Pencil} />
              <Field label="Location" value={draft.location} onChange={(value) => setProfile('location', value)} placeholder="e.g. San Francisco, CA / Remote" icon={MapPin} />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold tracking-wide uppercase text-zinc-500">About you</span>
                <textarea
                  value={draft.bio}
                  onChange={(event) => setProfile('bio', event.target.value)}
                  placeholder="Share a little about your background and preparation goals..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </label>
              <button type="submit" className="sr-only">Save profile</button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Headline</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">{user?.profile?.headline || 'Add a professional headline'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Location</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-zinc-700">
                  <MapPin className="size-3.5 text-zinc-400" />
                  <span>{user?.profile?.location || 'Location not added'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bio</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  {user?.profile?.bio || 'Add a short introduction to help Natalie tailor your interview follow-ups.'}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Professional & Coding Links */}
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-950">Professional connections</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Connect your profiles to ground coding rounds and project questions.</p>
            </div>
            <Globe2 className="size-4 text-zinc-400" />
          </div>

          {editing ? (
            <div className="mt-6 space-y-3.5">
              {socialLinksConfig.map(({ key, label, icon: Icon, placeholder, value }) => (
                <div key={key}>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                      <Icon className="size-3.5 text-zinc-500" />
                      <span>{label}</span>
                    </span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setLink(key, e.target.value)}
                      placeholder={placeholder}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 placeholder:text-zinc-400"
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {socialLinksConfig.map(({ key, label, icon: Icon, live }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 transition hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-800 shadow-xs">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900">{label}</p>
                      <p className="truncate text-[11px] text-zinc-500 max-w-[180px] sm:max-w-xs">
                        {live || 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {live ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="size-3" /> Connected
                      </span>
                      <a
                        href={live}
                        target="_blank"
                        rel="noreferrer"
                        className="grid size-7 place-items-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors"
                        title={`Open ${label}`}
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 transition"
                    >
                      + Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </form>

      {/* Resume Section */}
      <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-base font-bold text-zinc-950">Resume used for interviews</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Your resume powers role suggestions, question depth, and rubric citations.</p>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Upload className="size-3.5" /> {uploading ? 'Analyzing...' : resume ? 'Replace resume' : 'Upload resume'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => upload(event.target.files?.[0])}
          />
        </div>

        <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4">
          {loadingResume ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Spinner className="size-3.5" /> Loading resume details...
            </div>
          ) : resume ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white border border-zinc-200 text-zinc-900 shadow-xs">
                  <FileText className="size-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-xs sm:text-sm text-zinc-950">{resume.fileName}</p>
                  <p className="text-[11px] text-zinc-500">
                    Updated {new Date(resume.updatedAt).toLocaleDateString()} · {resume.characters.toLocaleString()} characters extracted
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Check className="size-3" /> Ready for interviews
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs text-zinc-600">
              <FileText className="size-4 text-zinc-400" />
              Upload a PDF resume to unlock personalized interviews with real question depth.
            </div>
          )}
        </div>
        {profile && (
          <p className="mt-3 text-[11px] text-zinc-500">
            Detected profile: <span className="font-medium text-zinc-700">{profile.title || profile.summary || 'Resume profile active'}</span>
          </p>
        )}
      </section>
    </div>
  );
}
