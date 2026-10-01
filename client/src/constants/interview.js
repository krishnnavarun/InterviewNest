import { Atom, BarChart3, Cloud, Coffee, Layers, Monitor, Server, Terminal } from 'lucide-react';

// Must match server/src/config/interview.constants.js
export const ROLES = [
  { id: 'frontend-developer', title: 'Frontend Developer', icon: Monitor, blurb: 'JavaScript, React, CSS, performance' },
  { id: 'backend-developer', title: 'Backend Developer', icon: Server, blurb: 'APIs, databases, auth, scaling' },
  { id: 'full-stack-developer', title: 'Full Stack Developer', icon: Layers, blurb: 'End-to-end web applications' },
  { id: 'react-developer', title: 'React Developer', icon: Atom, blurb: 'Hooks, rendering, state management' },
  { id: 'python-developer', title: 'Python Developer', icon: Terminal, blurb: 'Python, frameworks, testing' },
  { id: 'java-developer', title: 'Java Developer', icon: Coffee, blurb: 'Java, OOP, Spring Boot' },
  { id: 'data-analyst', title: 'Data Analyst', icon: BarChart3, blurb: 'SQL, pandas, statistics' },
  { id: 'devops-engineer', title: 'DevOps Engineer', icon: Cloud, blurb: 'CI/CD, Docker, cloud' },
];

export const DIFFICULTIES = [
  { id: 'easy', label: 'Starter', topics: 4, minutes: '10-15', description: 'Warm-up: fundamentals and a simple coding task' },
  { id: 'medium', label: 'Standard', topics: 5, minutes: '15-25', description: 'A typical first technical round' },
  { id: 'hard', label: 'Advanced', topics: 6, minutes: '25-35', description: 'Depth, trade-offs, system design' },
];

export const DIMENSIONS = {
  communication: 'Communication',
  technical_depth: 'Technical Depth',
  problem_solving: 'Problem Solving',
  coding: 'Coding',
  ownership: 'Ownership & Impact',
};

export const TOPIC_KIND_LABELS = {
  intro: 'Introduction',
  behavioral: 'Behavioral',
  project_deep_dive: 'Project deep dive',
  technical: 'Technical',
  system_design: 'System design',
  coding: 'Coding',
};

export const HIRING_SIGNALS = {
  strong_hire: { label: 'Strong hire', tone: 'green' },
  hire: { label: 'Hire', tone: 'green' },
  lean_hire: { label: 'Lean hire', tone: 'amber' },
  lean_no_hire: { label: 'Lean no hire', tone: 'amber' },
  no_hire: { label: 'Not yet', tone: 'red' },
  incomplete: { label: 'Too short to judge', tone: 'neutral' },
};

export const ACTION_LABELS = {
  greeting: 'Opened the interview',
  follow_up: 'Followed up on a gap',
  probe_deeper: 'Probed deeper',
  give_hint: 'Gave a hint',
  next_topic: 'Moved to the next topic',
  wrap_up: 'Wrapped up',
  code_review: 'Asked about your code',
};

export const getRole = (id) => ROLES.find((role) => role.id === id);
