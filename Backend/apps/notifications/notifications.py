def notify_travel_desk(application, message):
    # TODO: integrate real notifications module
    print(f"[Notify Travel Desk] App #{application.id}: {message}")


def notify_booking_agent(agent_user, booking, message):
    # TODO: integrate real notifications module
    print(f"[Notify Booking Agent] User #{agent_user.id}, Booking #{booking.id}: {message}")


def notify_applicant(application, message):
    # TODO: integrate real notifications module
    print(f"[Notify Applicant] App #{application.id}: {message}")
