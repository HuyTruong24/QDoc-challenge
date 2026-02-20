import React from 'react'

function Dashboard() {
  return (
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        
        <h2 className="text-2xl font-semibold mb-6">
          Patient Profile Input
        </h2>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">

          {/* Demographics */}
          <section>
            <h3 className="font-semibold text-lg mb-4">Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                className="border rounded px-4 py-2 w-full"
              />
              <input
                type="text"
                placeholder="Gender"
                className="border rounded px-4 py-2 w-full"
              />
            </div>
          </section>

          {/* Date of Birth */}
          <section>
            <h3 className="font-semibold text-lg mb-4">Date of Birth</h3>
            <input
              type="date"
              className="border rounded px-4 py-2 w-full md:w-1/2"
            />
          </section>

          {/* Chronic Conditions */}
          <section>
            <h3 className="font-semibold text-lg mb-4">Chronic Conditions</h3>
            <textarea
              placeholder="e.g. asthma, diabetes, heart disease"
              className="border rounded px-4 py-2 w-full"
              rows={3}
            />
          </section>

          {/* Vaccination History */}
          <section>
            <h3 className="font-semibold text-lg mb-4">
              Vaccination History
            </h3>
            <textarea
              placeholder="List known vaccines and dates if available"
              className="border rounded px-4 py-2 w-full"
              rows={4}
            />
          </section>

          {/* Submit */}
          <div className="pt-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Save Profile
            </button>
          </div>

        </div>
      </main>
  )
}

export default Dashboard