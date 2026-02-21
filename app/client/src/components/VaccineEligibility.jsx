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
    <div className="my-10 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b gap-x-6">
        <div>Name</div>
        <div>Status</div>
        <div>Date</div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100">
        {data.map((record, index) => (
          <div
            key={record.id}
            className={`grid grid-cols-[1fr_1fr_1fr] px-6 py-4 items-center text-sm transition duration-150 
            ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            hover:bg-blue-50 gap-x-6`}
          >
             <div className="text-gray-600 truncate">
              {record.name}
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-semibold
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
  )
}

export default VaccineEligibility