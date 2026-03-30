async def notify_expert_team(session_id: str, crisis_level, user_role: str, trigger_text: str):
    print(f"*** EXPERT NOTIFIED: {crisis_level} in {session_id} by {user_role} - {trigger_text}")
    return True
