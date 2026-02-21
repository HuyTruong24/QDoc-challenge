import React from "react";
import { useAuth } from "../hooks/useAuth";
import { VACCINES } from "../../../contracts/constants";

const STATUS = {
  UPCOMING: "Upcoming",
  DUE: "Due",
  OVERDUE: "Overdue",
  COMPLETED: "Completed",
  NOT_ELIGIBLE: "Not Eligible",
};

function coerceArray(result) {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object") return Object.values(result);
  return [];
}

// ✅ classify using engine status + dueDate windows
function getUiStatus(engineStatus, dueDateStr) {
  const raw = String(engineStatus || "").toUpperCase();

  if (raw === "NOT_ELIGIBLE") return STATUS.NOT_ELIGIBLE;
  if (raw === "COMPLETED") return STATUS.COMPLETED;
  if (raw === "OVERDUE") return STATUS.OVERDUE;

  // If no date, treat as not eligible-ish
  if (!dueDateStr) return STATUS.NOT_ELIGIBLE;

  const dueDate = new Date(dueDateStr);
  if (Number.isNaN(dueDate.getTime())) return STATUS.NOT_ELIGIBLE;

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / msPerDay);

  if (daysUntil <= 0) return STATUS.DUE;        // due now / today
  if (daysUntil <= 7) return STATUS.DUE;        // due within 7 days
  if (daysUntil <= 30) return STATUS.UPCOMING;  // upcoming within 30 days

  return STATUS.UPCOMING; // beyond 30 days: still upcoming (you can change later)
}

function VaccineEligibility() {
  const { userRuleEngineResult } = useAuth();

  const records = React.useMemo(() => {
    const items = coerceArray(userRuleEngineResult?.result);

    return items
      .map((item, idx) => {
        const vaccineKey = String(item?.vaccineKey ?? "").trim();
        const displayName =
          VACCINES[vaccineKey] || item?.displayName || vaccineKey || "Unknown vaccine";

        const dueDate = item?.dueDate ?? null;

        return {
          id: vaccineKey || idx,
          name: displayName,
          status: getUiStatus(item?.status, dueDate),
          date: dueDate,
        };
      })
      .filter((r) => r.name);
  }, [userRuleEngineResult]);

  return (
    <div style={styles.page}>
      <div style={styles.bgLayer} aria-hidden="true">
        <div style={{ ...styles.blob, ...styles.blob1 }} />
        <div style={{ ...styles.blob, ...styles.blob2 }} />
        <div style={{ ...styles.blob, ...styles.blob3 }} />
        <div style={styles.noise} />
      </div>
      <div style={styles.inner}>
        <div style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.logo}>P</div>
            <div>
              <div style={styles.topTitle}>Vaccination Eligibility</div>
              <div style={styles.topSub}>View your vaccination records and eligibility status</div>
            </div>
          </div>
        </div>

        <div className="mx-40 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-50 px-6 py-4 text-sm font-extrabold text-black uppercase tracking-wide border-b gap-x-3 place-items-center">
            <div>Name</div>
            <div>Status</div>
            <div>Date</div>
          </div>

          {/* Body */}
          <div className="divide-y divide-gray-100">
            {records.map((record, index) => (
              <div
                key={record.id}
                className={`grid grid-cols-[1fr_1fr_1fr] px-2 py-4 items-center text-sm transition duration-150 
              ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              hover:bg-blue-50 gap-x-3 place-items-center`}
              >
                <div className="text-gray-600 px-2 whitespace-normal break-words text-center">
                  {record.name}
                </div>

                <div className={`w-20 text-center py-1 rounded-full text-xs font-semibold
                  ${record.status === STATUS.OVERDUE && "bg-red-100 text-red-600"}
                  ${record.status === STATUS.DUE && "bg-yellow-100 text-yellow-600"}
                  ${record.status === STATUS.COMPLETED && "bg-green-100 text-green-600"}
                  ${record.status === STATUS.UPCOMING && "bg-blue-100 text-blue-600"}
                  ${record.status === STATUS.NOT_ELIGIBLE && "bg-gray-100 text-gray-500"}
              `}>
                  {record.status}
                </div>

                <div className="text-gray-500">
                  {record.date ? new Date(record.date).toLocaleDateString() : "N/A"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>

  )
}
const styles = {
  page: {
    minHeight: "100vh",
    background: "rgb(246, 247, 251)",
    padding: 18,
    position: "relative",
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  bgLayer: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 },
  blob: { position: "absolute", filter: "blur(46px)", opacity: 0.9, transform: "translateZ(0)" },
  blob1: { width: 520, height: 520, left: -140, top: 60, borderRadius: 999, background: "rgba(59,130,246,0.22)" },
  blob2: { width: 560, height: 560, right: -200, top: 120, borderRadius: 999, background: "rgba(16,185,129,0.18)" },
  blob3: { width: 620, height: 620, left: "35%", bottom: -260, borderRadius: 999, background: "rgba(168,85,247,0.16)" },
  noise: {
    position: "absolute",
    inset: 0,
    opacity: 0.04,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
    mixBlendMode: "multiply",
  },

  topbar: {
    maxWidth: 1200,
    margin: "0 auto 14px",
    padding: "14px 14px",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
  },

  logo: {
    height: 38,
    width: 38,
    borderRadius: 14,
    background: "#0f172a",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.1,
  },

  topSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  // Content sits above the bg layer
  inner: {
    position: "relative",
    zIndex: 1,
    padding: 18,
  },
}
export default VaccineEligibility