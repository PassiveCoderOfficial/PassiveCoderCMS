"use client";

import React from "react";
import { EntityManager, type FieldGroup } from "@/components/admin/real-estate/entity-manager";

type Row = Record<string, unknown> & { id: string };

export function ResultsManager({ initial, courses }: { initial: Row[]; courses: { id: string; name: string }[] }) {
  const groups: FieldGroup[] = [
    { title: "Certificate", fields: [
      { key: "certificate_no", label: "Certificate number", type: "text", half: true, help: "Students search by this. Must be unique." },
      { key: "roll", label: "Roll no", type: "text", half: true },
      { key: "result", label: "Result", type: "text", half: true, placeholder: "e.g. Credit, A+, 3.75" },
      { key: "status", label: "Status", type: "select", half: true, options: [["published", "Published (searchable)"], ["draft", "Draft (hidden)"]] },
      { key: "course_id", label: "Course (from your courses list)", type: "select", half: true, options: [["", "— Not linked —"], ...courses.map((c) => [c.id, c.name] as [string, string])] },
      { key: "course_name", label: "Course name (if not in the list)", type: "text", half: true },
      { key: "issue_date", label: "Issue date", type: "text", half: true },
      { key: "duration", label: "Duration", type: "text", half: true, placeholder: "e.g. 02.01.2018 to 30.12.2018" },
    ] },
    { title: "Student", fields: [
      { key: "student_name", label: "Student name", type: "text", half: true },
      { key: "photo_url", label: "Photo", type: "image", half: true },
      { key: "father_name", label: "Father's name", type: "text", half: true },
      { key: "mother_name", label: "Mother's name", type: "text", half: true },
      { key: "dob", label: "Date of birth", type: "text", half: true },
      { key: "gender", label: "Gender", type: "text", half: true },
      { key: "passport_no", label: "Passport number", type: "text", half: true, help: "Masked on the public site when that setting is on." },
      { key: "notes", label: "Notes", type: "textarea", help: "e.g. internship details" },
    ] },
    { title: "Alumni showcase (optional)", fields: [
      { key: "alumni_featured", label: "Feature this student in the Alumni Showcase block", type: "bool" },
      { key: "alumni_position", label: "Current job", type: "text", half: true, placeholder: "e.g. Commis Chef, Hilton London" },
      { key: "alumni_location", label: "Where", type: "text", half: true, placeholder: "e.g. London, UK" },
      { key: "alumni_quote", label: "Quote", type: "textarea" },
    ] },
  ];
  return (
    <EntityManager
      entity="results" apiBase="/api/results" title="Results" singular="Result" initial={initial} groups={groups}
      defaults={{ status: "published" }}
      listTitle={(r) => String(r.student_name ?? "")}
      listSubtitle={(r) => [r.certificate_no, (r.course as { name?: string } | null)?.name ?? r.course_name].filter(Boolean).join(" · ")}
      listImage={(r) => (r.photo_url as string) || null}
      listBadges={(r) => [String(r.result ?? ""), r.alumni_featured ? "Alumni" : "", r.status === "draft" ? "Draft" : ""].filter(Boolean)}
      publicPath={(r) => `/verify/${encodeURIComponent(String(r.certificate_no ?? ""))}`}
      emptyHint={<p className="text-sm mt-2">Add one, or import a CSV in Results Settings.</p>}
    />
  );
}

export function CoursesManager({ initial }: { initial: Row[] }) {
  const groups: FieldGroup[] = [
    { title: "Course", fields: [
      { key: "name", label: "Course name", type: "text" },
      { key: "level", label: "Level / award", type: "text", half: true, placeholder: "e.g. Diploma, NVQ-3" },
      { key: "duration", label: "Duration", type: "text", half: true, placeholder: "e.g. 1 year" },
      { key: "code", label: "Code", type: "text", half: true },
      { key: "page_url", label: "Course page on your site", type: "text", half: true, placeholder: "/food-production-cooking", help: "Results and course cards link here." },
      { key: "image_url", label: "Image", type: "image" },
      { key: "summary", label: "Short description", type: "textarea" },
      { key: "featured", label: "Featured", type: "bool", half: true },
      { key: "slug", label: "Slug", type: "text", half: true, help: "Auto from name if blank" },
    ] },
  ];
  return (
    <EntityManager
      entity="courses" apiBase="/api/results" title="Courses" singular="Course" initial={initial} groups={groups} defaults={{}}
      listTitle={(r) => String(r.name ?? "")}
      listSubtitle={(r) => [r.level, r.duration].filter(Boolean).join(" · ")}
      listImage={(r) => (r.image_url as string) || null}
      publicPath={(r) => String(r.page_url || "/")}
    />
  );
}
