import { describe, it, expect } from "vitest";
import { normalize } from "../lib/normalize";
import { stripHtml, isSafeUrl, isRtlText } from "../lib/sanitize";
import { canMove, violatesEnterpriseRule } from "../lib/rules";

describe("Ticket Normalization (normalize.js)", () => {
  it("correctly normalizes standard tickets (T-2001)", () => {
    const raw = {
      external_id: "T-2001",
      customer_id: "C-12",
      customer_plan: "enterprise",
      subject: "SSO login down",
      body: "Nobody can log in.",
      created_at: "2026-09-20T09:15:00Z",
      status: "open",
      category: "account_access",
      priority: "P0",
      triage_decision: "auto_accept",
    };
    const norm = normalize(raw);
    expect(norm.external_id).toBe("T-2001");
    expect(norm.priority).toBe("P0");
    expect(norm.customer_plan).toBe("enterprise");
    expect(norm.data_flags).toEqual([]);
  });

  it("handles invalid priorities, categories, and plans gracefully (T-2004)", () => {
    const raw = {
      external_id: "T-2004",
      customer_id: "C-58",
      customer_plan: "platinum", // invalid plan
      subject: "Invoice question",
      body: "Resend invoice",
      created_at: "2026-09-20T11:00:00Z",
      status: "open",
      category: "urgent_billing", // invalid category
      priority: "P5", // invalid priority
      triage_decision: "manual_review",
    };
    const norm = normalize(raw);
    expect(norm.customer_plan).toBe("free");
    expect(norm.category).toBe("other");
    expect(norm.priority).toBe("P3");
    expect(norm.data_flags.some((f) => f.includes("unknown_plan"))).toBe(true);
    expect(norm.data_flags.some((f) => f.includes("unknown_category"))).toBe(true);
    expect(norm.data_flags.some((f) => f.includes("invalid_priority"))).toBe(true);
  });

  it("enforces enterprise priority rule (P1 minimum for Enterprise) (T-2007)", () => {
    const raw = {
      external_id: "T-2007",
      customer_id: "C-12",
      customer_plan: "enterprise",
      subject: "Password issue",
      body: "Password broken",
      created_at: "2026-09-20T11:30:00Z",
      status: "open",
      category: "account_access",
      priority: "P3",
      triage_decision: "auto_accept",
    };
    const norm = normalize(raw);
    expect(norm.priority).toBe("P1");
    expect(norm.data_flags).toContain("enterprise_priority_raised");
  });

  it("flags unsafe javascript attachment URLs (T-2003)", () => {
    const raw = {
      external_id: "T-2003",
      customer_id: "C-40",
      customer_plan: "free",
      subject: "Screenshot",
      body: "Error screenshot",
      attachment_url: "javascript:alert(document.cookie)",
      created_at: "2026-09-20T10:40:00Z",
      status: "open",
      category: "bug",
      priority: "P3",
    };
    const norm = normalize(raw);
    expect(norm.data_flags).toContain("unsafe_attachment_removed");
    expect(norm.attachment_url).toBeNull();
  });

  it("flags future creation dates (T-2008)", () => {
    const raw = {
      external_id: "T-2008",
      customer_id: "C-70",
      customer_plan: "free",
      subject: "Dark mode please",
      body: "Dark theme",
      created_at: "2027-01-01T00:00:00Z", // future date
      status: "open",
      category: "feature_request",
      priority: "P3",
    };
    const norm = normalize(raw);
    expect(norm.data_flags).toContain("created_at_in_future");
  });
});

describe("Sanitization & Security (stripHtml & isSafeUrl)", () => {
  it("strips script tags and HTML elements cleanly", () => {
    const html = "<img src=x onerror=\"alert('hacked')\"> <b>Refund</b> needed";
    expect(stripHtml(html)).toBe("Refund needed");
  });

  it("identifies safe vs unsafe URLs", () => {
    expect(isSafeUrl("https://example.com/file.pdf")).toBe(true);
    expect(isSafeUrl("http://example.com/image.png")).toBe(true);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("detects RTL text correctly (Arabic/Hebrew)", () => {
    expect(isRtlText("😡 لا أستطيع تسجيل الدخول")).toBe(true);
    expect(isRtlText("Hello World")).toBe(false);
  });
});

describe("Business Rules & Transitions (canMove & violatesEnterpriseRule)", () => {
  it("enforces status state machine transitions", () => {
    expect(canMove("open", "in_progress")).toBe(true);
    expect(canMove("in_progress", "resolved")).toBe(true);
    expect(canMove("resolved", "open")).toBe(true);

    // Invalid jumps
    expect(canMove("open", "closed")).toBe(false);
    expect(canMove("closed", "open")).toBe(false);
  });

  it("enforces enterprise priority restriction", () => {
    expect(violatesEnterpriseRule("enterprise", "P2")).toBe(true);
    expect(violatesEnterpriseRule("enterprise", "P3")).toBe(true);
    expect(violatesEnterpriseRule("enterprise", "P1")).toBe(false);
    expect(violatesEnterpriseRule("pro", "P3")).toBe(false);
  });
});
