Vaccine Rule JSON Format - Each vaccine has one rule object:

{
  "vaccineKey": "HPV",
  "minimumAgeYears": 9,
  "maximumAgeYears": 45,
  "dosesRequired": 2,
  "doseIntervalDays": 180,
  "riskOverrides": [
    {
      "riskTag": "IMMUNOCOMPROMISED",
      "dosesRequired": 3
    }
  ],
  "explanationTemplate": "HPV vaccine is recommended between ages 9 and 45. Based on your age and dose history, you require {remainingDoses} more dose(s)."
}



Eligibility Engine Must Return

{
  "vaccineKey": "HPV",
  "status": "DUE_SOON",
  "dueDate": "2026-06-01",
  "remainingDoses": 1,
  "reasons": [
    "You are within the recommended age range.",
    "You have completed 1 out of 2 required doses."
  ]
}


Status Rules
	•	ELIGIBLE → meets criteria and can receive now
	•	DUE_SOON → within 30 days of due
	•	OVERDUE → past due date
	•	NOT_ELIGIBLE → age or conditions not met

