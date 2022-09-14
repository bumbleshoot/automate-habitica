/**
 * notifyQuestEnded()
 * 
 * Sends a private message to the player notifying them that
 * the quest has ended.
 * 
 * Run this function on the questFinished webhook.
 */
function notifyQuestEnded() {

  console.log("Notifying quest ended: \"" + scriptProperties.getProperty("QUEST_NAME") + "\"");

  let params = Object.assign(
    POST_PARAMS,
    {
      "contentType": "application/json",
      "payload": JSON.stringify({
        "message": "Quest completed: " + scriptProperties.getProperty("QUEST_NAME"),
        "toUserId": USER_ID
      })
    }
  );
  fetch("https://habitica.com/api/v3/members/send-private-message", params);
}