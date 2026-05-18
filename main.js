document.addEventListener("DOMContentLoaded", () => {
  console.log("Just Play Dynamic Mainframe Initialized.");

  // Hook into the live game data profiles
  const reactionSaveKey = "justPlay_pureReaction_save";
  const reactionDisplayNode = document.getElementById("hubReactionAttempts");

  if (reactionDisplayNode) {
    try {
      const rawData = localStorage.getItem(reactionSaveKey);
      if (rawData) {
        const parsedState = JSON.parse(rawData);
        // Dynamically inject total real runs onto home menu
        if (parsedState && typeof parsedState.totalAttempts === "number") {
          reactionDisplayNode.textContent = parsedState.totalAttempts;
        }
      }
    } catch (error) {
      console.error("Error synchronizing ecosystem statistics:", error);
    }
  }
});
