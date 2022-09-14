/**
 * notifyQuestEnded()
 * 
 * Sends a private message to the player notifying them that
 * the quest has ended.
 * 
 * Run this function on the questFinished webhook.
 */
function notifyQuestEnded(questKey) {

  console.log("Notifying quest ended: \"" + getContent().quests[questKey].text + "\"");

  let params = Object.assign(
    POST_PARAMS,
    {
      "contentType": "application/json",
      "payload": JSON.stringify({
        "message": "Quest completed: " + content.quests[questKey].text,
        "toUserId": USER_ID
      })
    }
  );
  fetch("https://habitica.com/api/v3/members/send-private-message", params);
}