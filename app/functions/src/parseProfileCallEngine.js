import evaluateAllVaccines from './ruleEngine'







// Print only useful fields (and reasons for the chatbot)
console.log(
  results.map(r => ({
    vaccineKey: r.vaccineKey,
    status: r.status,
    dueDate: r.dueDate,
    remainingDoses: r.remainingDoses,
    nextDoseNumber: r.nextDoseNumber,
    matchedClauseId: r.matchedClauseId,
    reasons: r.reasons
  }))
);