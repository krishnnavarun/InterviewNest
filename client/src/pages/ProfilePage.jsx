import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AtSign,
  Check,
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

const EMPTY_PROFILE = { headline: '', location: '', bio: '', links: { github: '', linkedin: '', leetcode: '', portfolio: '' } };

function Field({ label, value, onChange, placeholder, icon: Icon, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink-900">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-brand-600" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-ink-900/12 bg-white pl-10 pr-3 text-sm text-ink-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
        />
      </span>
    </label>
  );
}

function LinkField({ label, value, onChange, placeholder, icon: Icon }) {
  return <Field label={label} value={value} onChange={onChange} placeholder={placeholder} icon={Icon} type="url" />;
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
      await updateProfile({ name: draft.name, profile: draft.profile ? draft.profile : {
        headline: draft.headline,
        location: draft.location,
        bio: draft.bio,
        links: draft.links,
      } });
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
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-gradient-to-br from-ink-950 via-[#271936] to-brand-950 p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-bold ring-1 ring-white/20">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-brand-200">Your InterviewNest profile</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{user?.name}</h1>
              <p className="mt-1 text-sm text-white/65">{user?.email}</p>
            </div>
          </div>
          {!editing ? (
            <Button variant="light" onClick={() => setEditing(true)}><Pencil className="size-4" /> Edit profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEditing}><X className="size-4" /> Cancel</Button>
              <Button variant="light" loading={saving} onClick={saveProfile}><Save className="size-4" /> Save changes</Button>
            </div>
          )}
        </div>
      </section>

      <form onSubmit={saveProfile} className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-2xl border border-ink-900/10 bg-white p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink-950">Personal information</h2>
              <p className="mt-1 text-sm text-ink-700/65">Make your profile feel like you. This context can personalize your coaching.</p>
            </div>
            <UserRound className="size-5 text-brand-600" />
          </div>
          {editing ? (
            <div className="mt-6 space-y-4">
              <Field label="Full name" value={draft.name} onChange={(value) => setProfile('name', value)} placeholder="Your name" icon={UserRound} />
              <Field label="Professional headline" value={draft.headline} onChange={(value) => setProfile('headline', value)} placeholder="e.g. Frontend engineer who loves thoughtful UX" icon={Pencil} />
              <Field label="Location" value={draft.location} onChange={(value) => setProfile('location', value)} placeholder="e.g. Bengaluru, India" icon={MapPin} />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink-900">About you</span>
                <textarea value={draft.bio} onChange={(event) => setProfile('bio', event.target.value)} placeholder="Share a little about your goals..." rows={4} className="w-full resize-none rounded-xl border border-ink-900/12 bg-white p-3 text-sm text-ink-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15" />
              </label>
              <button type="submit" className="sr-only">Save profile</button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-700/50">Headline</p><p className="mt-1 text-base font-semibold text-ink-950">{user?.profile?.headline || 'Add a professional headline'}</p></div>
              <div className="flex items-center gap-2 text-sm text-ink-700"><MapPin className="size-4 text-brand-600" />{user?.profile?.location || 'Location not added'}</div>
              <p className="text-sm leading-6 text-ink-700/75">{user?.profile?.bio || 'Add a short introduction to help InterviewNest tailor your practice.'}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-ink-900/10 bg-white p-6 sm:p-7">
          <h2 className="text-lg font-bold text-ink-950">Professional links</h2>
          <p className="mt-1 text-sm text-ink-700/65">Connect the profiles you want to reference during preparation.</p>
          {editing ? (
            <div className="mt-6 space-y-4">
              <LinkField label="GitHub" value={draft.links.github} onChange={(value) => setLink('github', value)} placeholder="https://github.com/you" icon={GitHubIcon} />
              <LinkField label="LinkedIn" value={draft.links.linkedin} onChange={(value) => setLink('linkedin', value)} placeholder="https://linkedin.com/in/you" icon={LinkedInIcon} />
              <LinkField label="LeetCode" value={draft.links.leetcode} onChange={(value) => setLink('leetcode', value)} placeholder="https://leetcode.com/u/you" icon={AtSign} />
              <LinkField label="Portfolio" value={draft.links.portfolio} onChange={(value) => setLink('portfolio', value)} placeholder="https://yourportfolio.com" icon={Globe2} />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {[['GitHub', GitHubIcon, user?.profile?.links?.github], ['LinkedIn', LinkedInIcon, user?.profile?.links?.linkedin], ['LeetCode', AtSign, user?.profile?.links?.leetcode], ['Portfolio', Globe2, user?.profile?.links?.portfolio]].map(([label, Icon, href]) => (
                href ? <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-ink-900/10 px-3.5 py-3 text-sm font-medium text-ink-800 transition hover:border-brand-400 hover:text-brand-700"><Icon className="size-4 text-brand-600" />{label}<span className="ml-auto text-xs text-ink-700/45">Open ↗</span></a>
                  : <div key={label} className="flex items-center gap-3 rounded-xl border border-dashed border-ink-900/15 px-3.5 py-3 text-sm text-ink-700/55"><Icon className="size-4" />{label}<span className="ml-auto text-xs">Not connected</span></div>
              ))}
            </div>
          )}
        </section>
      </form>

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-bold text-ink-950">Resume used for interviews</h2>
            <p className="mt-1 text-sm text-ink-700/65">Your saved resume powers role suggestions, interview questions, and coaching feedback.</p>
          </div>
          <Button variant="ink" loading={uploading} onClick={() => fileInput.current?.click()}><Upload className="size-4" /> {resume ? 'Replace resume' : 'Upload resume'}</Button>
          <input ref={fileInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
        </div>
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
          {loadingResume ? <div className="flex items-center gap-2 text-sm text-ink-700"><Spinner className="size-4" /> Loading resume details...</div> : resume ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid size-12 place-items-center rounded-xl bg-white text-brand-700"><FileText className="size-5" /></div>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink-950">{resume.fileName}</p><p className="mt-1 text-xs text-ink-700/60">Updated {new Date(resume.updatedAt).toLocaleDateString()} · {resume.characters.toLocaleString()} characters</p></div>
              <Badge tone="green"><Check className="size-3" /> Ready for interviews</Badge>
            </div>
          ) : <div className="flex items-center gap-3 text-sm text-ink-700"><FileText className="size-5 text-brand-600" /> Upload a resume to unlock tailored interviews.</div>}
        </div>
        {profile && <p className="mt-4 text-xs text-ink-700/55">Detected profile: {profile.title || profile.summary || 'Resume profile ready'}</p>}
      </section>
    </div>
  );
}
