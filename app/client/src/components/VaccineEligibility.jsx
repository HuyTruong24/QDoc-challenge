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
    <div className="my-10 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b gap-x-6">
        <div>Name</div>
        <div>Status</div>
        <div>Date</div>
      </div>

      <div className="divide-y divide-gray-100">
        {records.map((record, index) => (
          <div
            key={record.id}
            className={`grid grid-cols-[1fr_1fr_1fr] px-6 py-4 items-center text-sm transition duration-150 
            ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            hover:bg-blue-50 gap-x-6`}
          >
            <div className="text-gray-600 truncate">{record.name}</div>

            <div
              className={`w-full px-4 py-2 rounded-full text-sm font-semibold
                ${record.status === STATUS.OVERDUE && "bg-red-100 text-red-600"}
                ${record.status === STATUS.DUE && "bg-yellow-100 text-yellow-600"}
                ${record.status === STATUS.UPCOMING && "bg-blue-100 text-blue-600"}
                ${record.status === STATUS.COMPLETED && "bg-green-100 text-green-600"}
                ${record.status === STATUS.NOT_ELIGIBLE && "bg-gray-100 text-gray-500"}
              `}
            >
              {record.status}
            </div>

            <div className="text-gray-500">
              {record.date ? new Date(record.date).toLocaleDateString() : "N/A"}
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="px-6 py-6 text-sm text-gray-500">
            No eligibility results yet. Save your profile to generate them.
          </div>
        )}
      </div>
    </div>
  );
}

export default VaccineEligibility;