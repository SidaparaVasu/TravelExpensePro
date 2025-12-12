*** 🚀 1) Test Travel Request Submitted → to Approver ***

```
NotificationCenter.notify(
    event_name="travel.submitted",
    reference={"type": "TravelRequest", "id": 999},
    payload={
        "employee_id": 5,
        "approver_id": 9,
        "request_id": "TR-TEST-001",
        "employee_name": "Ravi Kumar",
        "approver_name": "John Manager",
        "purpose": "Client Meeting",
        "urgency": "high"
    }
)
```

*** 🚀 2) Test Travel Approved → to Employee ***

```
NotificationCenter.notify(
    "travel.approved",
    {"type": "TravelRequest", "id": 999},
    {
        "employee_id": 5,
        "approver_id": 9,
        "employee_name": "Ravi Kumar",
        "approver_name": "John Manager",
        "purpose": "Client Meeting",
        "request_id": "TR-TEST-001"
    }
)
```

*** 🚀 3) Test Travel Rejected → to Employee ***

```
NotificationCenter.notify(
    "travel.rejected",
    {"type": "TravelRequest", "id": 999},
    {
        "employee_id": 5,
        "approver_id": 9,
        "employee_name": "Ravi Kumar",
        "approver_name": "John Manager",
        "notes": "Insufficient justification",
        "request_id": "TR-TEST-001"
    }
)
```

*** 🚀 4) Test Booking Confirmed → to Employee ***

```
NotificationCenter.notify(
    "travel.booking.confirmed",
    {"type": "TravelRequest", "id": 999},
    {
        "employee_id": 5,
        "booking_agent_id": 12,
        "employee_name": "Ravi Kumar",
        "booking_agent_name": "Amit (Travel Desk)",
        "ticket_number": "PNR-123456",
        "request_id": "TR-TEST-001"
    }
)
```

*** 🚀 5) Test Booking Cancelled ***

```
NotificationCenter.notify(
    "travel.booking.cancelled",
    {"type": "TravelRequest", "id": 999},
    {
        "employee_id": 5,
        "employee_name": "Ravi Kumar",
        "cancel_reason": "Flight unavailable",
        "request_id": "TR-TEST-001"
    }
)
```

*** 🚀 6) Test Settlement Reminder (This event creates a NotificationEvent for reminders.) ***

```
NotificationCenter.notify(
    "travel.settlement.reminder",
    {"type": "TravelRequest", "id": 999},
    {
        "employee_id": 5,
        "employee_name": "Ravi Kumar",
        "settlement_due_date": "2025-01-30",
        "request_id": "TR-TEST-001"
    }
)
```
* Expected:
    - Immediate email sent
    - A NotificationEvent entry created
    - Reminder worker will pick it up based on intervals

*** 🚀 7) Test Settlement Expired ***

```
NotificationCenter.notify(
    "travel.settlement.expired",
    {"type": "TravelRequest", "id": 999},
    {
        "employee_id": 5,
        "employee_name": "Ravi Kumar",
        "request_id": "TR-TEST-001"
    }
)
```