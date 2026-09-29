// Domain constants shared by the planner, the interviewer agent and scoring.

export const ROLES = [
  { id: 'frontend-developer', title: 'Frontend Developer', focus: 'JavaScript, React, browser rendering, CSS layout, accessibility, web performance' },
  { id: 'backend-developer', title: 'Backend Developer', focus: 'Node.js, REST API design, databases, authentication, caching, scalability' },
  { id: 'full-stack-developer', title: 'Full Stack Developer', focus: 'end-to-end web apps: React, Node.js, APIs, databases, deployment' },
  { id: 'react-developer', title: 'React Developer', focus: 'React hooks, rendering behaviour, state management, performance, component design' },
  { id: 'python-developer', title: 'Python Developer', focus: 'Python language features, data structures, web frameworks, testing, automation' },
  { id: 'java-developer', title: 'Java Developer', focus: 'Java, OOP, collections, concurrency, Spring Boot, JVM basics' },
  { id: 'data-analyst', title: 'Data Analyst', focus: 'SQL, Python/pandas, statistics, data cleaning, visualisation, business metrics' },
  { id: 'devops-engineer', title: 'DevOps Engineer', focus: 'CI/CD, Docker, Kubernetes, cloud infrastructure, monitoring, Linux' },
];

export const ROLE_IDS = ROLES.map((role) => role.id);
export const getRole = (roleId) => ROLES.find((role) => role.id === roleId);

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'Starter',
    topicCount: 4,
    maxFollowUps: 1,
    turnBudget: 9,
    codingLevel: 'easy (a warm-up problem, e.g. array/string manipulation)',
    guidance: 'friendly warm-up level; fundamentals only; suitable for students and freshers',
  },
  medium: {
    id: 'medium',
    label: 'Standard',
    topicCount: 5,
    maxFollowUps: 2,
    turnBudget: 13,
    codingLevel: 'medium (typical first-round problem using hash maps, two pointers, sorting or recursion)',
    guidance: 'typical first-round technical interview for a junior-to-mid engineer',
  },
  hard: {
    id: 'hard',
    label: 'Advanced',
    topicCount: 6,
    maxFollowUps: 2,
    turnBudget: 16,
    codingLevel: 'medium-hard (requires an efficient algorithm, e.g. sliding window, graphs, dynamic programming)',
    guidance: 'demanding on-site level: expect depth, trade-offs, scale and edge cases',
  },
};

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES);

// Every rubric criterion is tagged with exactly one dimension. The report
// aggregates scores per dimension, so these are the "skills" we track over time.
export const DIMENSIONS = {
  communication: { label: 'Communication', weight: 0.2 },
  technical_depth: { label: 'Technical Depth', weight: 0.25 },
  problem_solving: { label: 'Problem Solving', weight: 0.2 },
  coding: { label: 'Coding', weight: 0.2 },
  ownership: { label: 'Ownership & Impact', weight: 0.15 },
};

export const DIMENSION_IDS = Object.keys(DIMENSIONS);

export const TOPIC_KINDS = ['intro', 'behavioral', 'project_deep_dive', 'technical', 'system_design', 'coding'];

export const TURN_ACTIONS = ['follow_up', 'probe_deeper', 'give_hint', 'next_topic', 'wrap_up'];

export const CODE_LANGUAGES = ['javascript', 'python'];
