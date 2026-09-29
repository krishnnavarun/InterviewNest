import { Briefcase, FolderGit2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SENIORITY = { student: 'Student', junior: 'Junior', mid: 'Mid-level', senior: 'Senior' };

export function ProfileCard({ profile }) {
  const years = profile.yearsOfExperience;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{profile.name || 'Your profile'}</p>
          <p className="text-sm text-white/60">{profile.headline}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone="brand">{SENIORITY[profile.seniority] ?? profile.seniority}</Badge>
          {years > 0 && <Badge>{years < 1 ? '<1' : Math.round(years)} yr experience</Badge>}
        </div>
      </div>

      {profile.skills.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-white/45 uppercase">
            <Sparkles className="size-3.5" /> Skills detected
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 24).map((skill) => (
              <span key={skill.name} className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-white/80">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {profile.projects.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-white/45 uppercase">
              <FolderGit2 className="size-3.5" /> Projects
            </p>
            <ul className="space-y-2">
              {profile.projects.slice(0, 3).map((project) => (
                <li key={project.name} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/55">{project.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {profile.experience.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-white/45 uppercase">
              <Briefcase className="size-3.5" /> Experience
            </p>
            <ul className="space-y-2">
              {profile.experience.slice(0, 3).map((job) => (
                <li key={`${job.company}-${job.title}`} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-white/55">
                    {job.company}
                    {job.duration ? ` · ${job.duration}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
