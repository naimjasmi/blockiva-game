export function getPlayerSessionId() {
    if (typeof window === "undefined") {
      return null;
    }
  
    let sessionId = localStorage.getItem("blockade_player_session");
  
    if (!sessionId) {
      sessionId = crypto.randomUUID();
  
      localStorage.setItem(
        "blockade_player_session",
        sessionId
      );
    }
  
    return sessionId;
  }