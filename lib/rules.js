// lib/rules.js

export const PRIORITIES = ["P0", "P1", "P2", "P3"];
export const CATEGORIES = ["billing", "bug", "account_access", "feature_request", "other"];
export const PLANS = ["free", "pro", "enterprise"];
export const STATUSES = ["open", "in_progress", "resolved", "closed"];

export const AGENTS = [
    { id: "agent-1", name: "Priya" },
    { id: "agent-2", name: "Rahul" },
    { id: "agent-3", name: "Meera" },
];

// Which status can move to which. "closed" is terminal: nothing moves out of it.
export const TRANSITIONS = {
    open: ["in_progress"],
    in_progress: ["resolved"],
    resolved: ["open"],
    closed: [],
};

export function canMove(from, to) {
    return (TRANSITIONS[from] || []).includes(to);
}

export function isValidAgent(id) {
    return AGENTS.some((a) => a.id === id);
}

// Enterprise tickets must stay P0 or P1.
export function violatesEnterpriseRule(plan, priority) {
    return plan === "enterprise" && (priority === "P2" || priority === "P3");
}

// Hours allowed per priority (used later for deadlines).
export const DEADLINE_HOURS = { P0: 1, P1: 4, P2: 24, P3: 72 };