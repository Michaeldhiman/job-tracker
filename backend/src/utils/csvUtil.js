// Utility for converting job documents into a CSV string.
const headers = [
  "Company",
  "Role",
  "Status",
  "Applied Date",
  "Salary",
  "Tags",
  "Resume URL",
  "Notes",
  "History"
];

// Escape a single value for safe use in a CSV column.
const escapeValue = (value) => {
  const str = value ?? "";
  if (typeof str !== "string") {
    return escapeValue(String(str));
  }

  // Wrap in quotes if the value contains commas, quotes, or newlines.
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

// Convert a single job object into a CSV row string.
const formatRow = (job) => {
  const tags = Array.isArray(job.tags) ? job.tags.join("; ") : "";
  const history = Array.isArray(job.history)
    ? job.history
        .map((entry) => {
          const date = new Date(entry.at);
          const localDate = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
          return `${entry.status} @ ${localDate}`;
        })
        .join(" | ")
    : "";

  const appliedDate = job.appliedDate
    ? new Date(job.appliedDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    : "";

  return [
    job.company,
    job.role || "",
    job.status,
    appliedDate,
    job.salary ?? "",
    tags,
    job.resumeUrl || "",
    job.notes || "",
    history
  ]
    .map(escapeValue)
    .join(",");
};

// Build the full CSV content: header row followed by one row per job.
export const generateCsv = async (jobs) => {
  const rows = jobs.map((job) => formatRow(job.toObject ? job.toObject() : job));
  return [headers.join(","), ...rows].join("\n");
};

