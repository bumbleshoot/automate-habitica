/**
 * acceptQuestInvite()
 * 
 * Accepts a pending quest invite if there is one.
 * 
 * Run this function on the questInvited webhook. Also run this
 * function every 10 mins in case the webhook fails.
 */
function acceptQuestInvite() {

  // if pending quest & unaccepted invite
  if (typeof getParty(true).quest.key !== "undefined" && !party.quest.active && party.quest.members[USER_ID] === null) {

    console.log("Accepting invite to pending quest \"" + getContent().quests[party.quest.key].text + "\"");

    // accept quest invite
    fetch("https://habitica.com/api/v3/groups/party/quests/accept", POST_PARAMS);

  } else {
    console.log("No quest invite to accept");
  }
}