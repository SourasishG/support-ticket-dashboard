// lib/normalize.js
// Job: take ONE messy ticket and return a CLEAN ticket.
// Every time we fix something, we write a note in the "flags" list.

import { PRIORITIES, CATEGORIES, PLANS, STATUSES, isValidAgent } from "./rules";

// ---------- Helper 1: check a value against a list of allowed values ----------
// If the value is allowed, keep it. If not, use the fallback and add a flag.
function pickAllowed(value, allowedList, fallback, flagName, flags) {
    if (allowedList.includes(value)) {
        return value;
    }
    flags.push(flagName + ":" + value);
    return fallback;
}

// ---------- Helper 2: does a date text include a timezone? ----------
// "2026-09-20T09:15:00Z"       -> yes (Z)
// "2026-09-21T08:45:00+05:30"  -> yes (+05:30)
// "2026-09-20 11:30:00"        -> no
function hasTimezone(text) {
    return text.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(text);
}

// ---------- Helper 3: clean the created_at date ----------
function fixDate(rawDate, nowMs, flags) {
    const now = new Date(nowMs).toISOString();

    // No date at all
    if (!rawDate) {
        flags.push("invalid_created_at");
        return now;
    }

    let text = String(rawDate).trim();

    // No timezone: assume UTC and leave a note
    if (!hasTimezone(text)) {
        flags.push("created_at_no_timezone");
        text = text.replace(" ", "T") + "Z";
    }

    const date = new Date(text);

    // Not a real date, like "hello"
    if (isNaN(date.getTime())) {
        flags.push("invalid_created_at");
        return now;
    }

    // A date in the future (more than 1 minute ahead) is impossible for a new ticket
    if (date.getTime() > nowMs + 60000) {
        flags.push("created_at_in_future");
        return now;
    }

    return date.toISOString();
}

// ---------- Helper 4: only allow safe attachment links ----------
function fixAttachment(rawUrl, flags) {
    if (!rawUrl) return null;

    try {
        const url = new URL(rawUrl);
        if (url.protocol === "http:" || url.protocol === "https:") {
            return url.href; // safe
        }
        flags.push("unsafe_attachment_removed"); // e.g. javascript:...
        return null;
    } catch {
        flags.push("invalid_attachment_removed"); // not a URL at all
        return null;
    }
}

// ---------- The main function ----------
// nowMs is optional. Tests can pass a fixed time so results never change.
export function normalize(raw, nowMs = Date.now()) {
    const flags = [];

    // 1. Simple fields: must be one of the allowed values
    const category = pickAllowed(raw.category, CATEGORIES, "other", "unknown_category", flags);
    const plan = pickAllowed(raw.customer_plan, PLANS, "free", "unknown_plan", flags);
    let priority = pickAllowed(raw.priority, PRIORITIES, "P3", "invalid_priority", flags);
    let status = pickAllowed(raw.status, STATUSES, "open", "unknown_status", flags);

    // Unknown AI decision -> a human should check it (safe choice)
    const triage_decision = pickAllowed(
        raw.triage_decision,
        ["auto_accept", "manual_review"],
        "manual_review",
        "unknown_triage_decision",
        flags
    );

    // 2. Enterprise customers must be P0 or P1
    if (plan === "enterprise" && (priority === "P2" || priority === "P3")) {
        flags.push("enterprise_priority_raised");
        priority = "P1";
    }

    // 3. The assigned agent must be one of our real agents
    let assigned_to = raw.assigned_to || null;
    if (assigned_to !== null && !isValidAgent(assigned_to)) {
        flags.push("invalid_agent:" + assigned_to);
        assigned_to = null;
        if (status === "in_progress") {
            status = "open"; // nobody owns it, so it can't be "in progress"
        }
    }

    // 4. Text fields: must be strings (null becomes empty text)
    const subject = typeof raw.subject === "string" ? raw.subject : "";
    const body = typeof raw.body === "string" ? raw.body : "";
    if (subject.trim() === "" && body.trim() === "") {
        flags.push("empty_ticket");
    }

    // 5. ai_priority is only kept when it differs from the final priority
    let ai_priority = raw.ai_priority || null;
    if (ai_priority === priority) {
        ai_priority = null;
    }

    // 6. Build and return the clean ticket
    return {
        external_id: raw.external_id,
        customer_id: raw.customer_id || null,
        customer_plan: plan,
        subject: subject,
        body: body,
        attachment_url: fixAttachment(raw.attachment_url, flags),
        created_at: fixDate(raw.created_at, nowMs, flags),
        status: status,
        assigned_to: assigned_to,
        category: category,
        priority: priority,
        ai_priority: ai_priority,
        summary: typeof raw.summary === "string" ? raw.summary : null,
        triage_decision: triage_decision,
        review_reason: raw.review_reason || null,
        reviewed: false,   // becomes true when an agent accepts or changes the AI result
        triage_note: null, // the agent's reason when they change category or priority
        data_flags: flags,
    };
}