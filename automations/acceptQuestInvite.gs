/**
 * acceptQuestInvite()
 * 
 * Accepts a pending quest invite if there is one.
 * 
 * Run this function on the questInvited webhook. Also run this
 * function every 10 mins in case the webhook fails.
 */
function acceptQuestInvite() {
  try {

    // if pending quest & unaccepted invite
    if (getParty(true).data.quest.key != undefined && !party.data.quest.active && party.data.quest.members[USER_ID] === null) {

      log("Accepting invite to pending quest \"" + scriptProperties.getProperty("QUEST_NAME") + "\"");
    
      // accept quest invite
      fetch("https://habitica.com/api/v3/groups/party/quests/accept", POST_PARAMS);

    } else {
      log("No quest invite to accept");
    }

  } catch (e) {
    log(e);
    throw e;
  }
}