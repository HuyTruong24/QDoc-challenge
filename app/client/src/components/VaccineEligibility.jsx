import React from 'react'

const STATUS = {
    UPCOMING: "Upcoming",
    DUE: "Due",
    OVERDUE: "Overdue",
    COMPLETED: "Completed",
    NOT_ELIGIBLE: "Not Eligible",
}
const data =[
    {
        id: 1,
        name: "COVID-19 Vaccine",
        status: STATUS.DUE,
        date: "2024-07-01"
    },
    {
        id: 2,
        name: "Influenza Vaccine",
        status: STATUS.UPCOMING,
        date: "2024-10-01"
    },
    {
        id: 3,
        name: "Hepatitis B Vaccine",           
        status: STATUS.OVERDUE,
        date: "2024-05-01"
    },
    {
        id: 4,
        name: "Tetanus Vaccine",
        status: STATUS.COMPLETED,
        date: "2024-01-15"
    },
    {
        id: 5,
        name: "HPV Vaccine",
        status: STATUS.NOT_ELIGIBLE,
        date: null
    }, 
    {
        id: 6,
        name: "Pneumococcal Vaccine",
        status: STATUS.DUE,
        date: "2024-08-15"
    }
]
function VaccineEligibility() {
    const [recrods, setRecords] = React.useState(data)
  return (
     <div style={styles.page}>
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
        <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b gap-x-3 place-items-center">
          <div>Name</div>
          <div>Status</div>
          <div>Date</div>
        </div>

        {/* Body */}
        <div className="divide-y divide-gray-100">
          {data.map((record, index) => (
            <div
              key={record.id}
              className={`grid grid-cols-[1fr_1fr_1fr] px-2 py-4 items-center text-sm transition duration-150 
              ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              hover:bg-blue-50 gap-x-3 place-items-center`}
            >
              <div className="text-gray-600 truncate">
                {record.name}
              </div>

              <div className={`w-20 text-center py-1 rounded-full text-xs font-semibold
                  ${record.status === STATUS.OVERDUE && "bg-red-100 text-red-600"}
                  ${record.status === STATUS.DUE && "bg-yellow-100 text-yellow-600"}
                  ${record.status === STATUS.COMPLETED && "bg-green-100 text-green-600"}
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
   
  )
}
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 18,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
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
}
export default VaccineEligibility