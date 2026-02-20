const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


const MOCK_CLINIC_ID = "clinic_demo_1";

const dashboardData = {
  [MOCK_CLINIC_ID]: {
    counts: { overdue: 12, dueSoon7: 9, dueSoon30: 22 },
    byVaccine: [
      { vaccineKey: "HPV", overdue: 5, dueSoon7: 1, dueSoon30: 4 },
      { vaccineKey: "TDAP", overdue: 3, dueSoon7: 2, dueSoon30: 6 },
      { vaccineKey: "FLU", overdue: 2, dueSoon7: 3, dueSoon30: 7 },
      { vaccineKey: "MMR", overdue: 2, dueSoon7: 3, dueSoon30: 5 }
    ],
    worklist: [
      {
        profileId: "p1",
        name: "Sam",
        overdueVaccines: ["HPV"],
        updatedAt: new Date(Date.now() - 3600_000).toISOString()
      },
      {
        profileId: "p2",
        name: "Ava",
        overdueVaccines: ["TDAP", "FLU"],
        updatedAt: new Date(Date.now() - 7200_000).toISOString()
      },
      {
        profileId: "p3",
        name: "Noah",
        overdueVaccines: ["MMR"],
        updatedAt: new Date(Date.now() - 5400_000).toISOString()
      }
    ]
  }
};

const clinics = [
  {
    id: "c1",
    name: "Downtown Clinic",
    address: "123 Main St",
    geo: { lat: 49.8951, lng: -97.1384 },
    vaccinesSupported: ["HPV", "TDAP", "FLU", "MMR"],
    distanceKm: 2.1,
    phone: "(204) 111-2222",
    hours: "Mon-Fri 9am-5pm"
  },
  {
    id: "c2",
    name: "North Health Center",
    address: "77 North Ave",
    geo: { lat: 49.9201, lng: -97.1202 },
    vaccinesSupported: ["TDAP", "FLU"],
    distanceKm: 4.7,
    phone: "(204) 222-3333",
    hours: "Mon-Sat 10am-6pm"
  },
  {
    id: "c3",
    name: "Community Walk-in",
    address: "51 River Rd",
    geo: { lat: 49.8842, lng: -97.1601 },
    vaccinesSupported: ["HPV", "MMR"],
    distanceKm: 3.4,
    phone: "(204) 333-4444",
    hours: "Tue-Sun 11am-7pm"
  }
];



export const api = {
  /**
   * Dashboard stats + worklist
   * @param {string} clinicId
   */
  async getClinicDashboard(clinicId) {
    await sleep(250);
    const data = dashboardData[clinicId] || dashboardData[MOCK_CLINIC_ID];
    return structuredCloneSafe(data);
  },

  /**
   * Record a vaccine dose (from clinic dashboard)
   * @param {{profileId:string, vaccineKey:string, doseNo?:number, dateAdministered?:string}} payload
   */
  async recordDose(payload) {
    await sleep(250);
    
    const clinic = dashboardData[MOCK_CLINIC_ID];
    const wl = clinic.worklist;
    const idx = wl.findIndex((w) => w.profileId === payload.profileId);
    if (idx !== -1) {
      wl[idx].overdueVaccines = wl[idx].overdueVaccines.filter(
        (v) => v !== payload.vaccineKey
      );
      if (wl[idx].overdueVaccines.length === 0) wl.splice(idx, 1);

      clinic.counts.overdue = Math.max(0, clinic.counts.overdue - 1);
      const b = clinic.byVaccine.find((x) => x.vaccineKey === payload.vaccineKey);
      if (b) b.overdue = Math.max(0, b.overdue - 1);
    }

    return {
      ok: true,
      recordId: "mock_" + Math.random().toString(16).slice(2),
      saved: {
        ...payload,
        doseNo: payload.doseNo ?? 1,
        dateAdministered: payload.dateAdministered ?? new Date().toISOString()
      }
    };
  },

  /**
   * Find nearby clinics for map
   * @param {number} lat
   * @param {number} lng
   * @param {string=} vaccineKey
   */
  async getNearbyClinics(lat, lng, vaccineKey) {
    await sleep(250);

    const filtered = vaccineKey
      ? clinics.filter((c) => c.vaccinesSupported.includes(vaccineKey))
      : clinics;

    return { clinics: structuredCloneSafe(filtered).slice(0, 20) };
  },

  /**
   * Gemini-like chatbot mock
   * @param {string} profileId
   * @param {string} message
   */
  async chat(profileId, message) {
    await sleep(350);

    const lower = String(message || "").toLowerCase();
    let reply =
      `For profile ${profileId}, I can help explain vaccines and next steps. `;

    if (lower.includes("why") && lower.includes("hpv")) {
      reply +=
        "HPV is recommended to prevent infections that can lead to certain cancers. If it's marked due/overdue, it's usually based on age and previous doses.";
    } else if (lower.includes("tdap")) {
      reply +=
        "Tdap is commonly due on a schedule (including boosters). If you're overdue, booking soon can help you stay protected.";
    } else if (lower.includes("where") || lower.includes("clinic")) {
      reply +=
        "You can use the map to find nearby clinics that offer the vaccine you need. Select a vaccine filter to narrow results.";
    } else {
      reply +=
        "Tell me which vaccine you're asking about (e.g., HPV, Tdap, Flu) and I’ll explain the reason and what to do next.";
    }

    return {
      reply,
      disclaimer:
        "Demo response only. This is not medical advice—please consult a healthcare professional."
    };
  },

  getDefaultClinicId() {
    return MOCK_CLINIC_ID;
  }
};

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}