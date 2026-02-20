Base URL:

/api


1. Health Check

GET /health


2. Evaluate Eligibility

Request : 

{
  "profileId": "abc123"
}

Response : 

{
  "profileId": "abc123",
  "results": [
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
  ]
}


3️⃣ Create Reminder

POST /reminders/create

Request : 

{
  "profileId": "abc123",
  "vaccineKey": "HPV",
  "dueDate": "2026-06-01"
}


Response : 

{
  "success": true
}

4️⃣ Chat with Gemini

POST /chat

Request : 

{
  "profileId": "abc123",
  "vaccineKey": "HPV",
  "question": "Why do I need HPV vaccine?"
}


Response : 

{
  "answer": "Based on your age and vaccination history, HPV vaccination is recommended..."
}

5️⃣ Get Nearby Clinics

Request : 

GET /clinics/nearby?lat=49.89&lng=-97.13

Response : 


{
  "clinics": [
    {
      "name": "Downtown Health Clinic",
      "address": "123 Main St",
      "distanceKm": 2.1
    }
  ]
}



