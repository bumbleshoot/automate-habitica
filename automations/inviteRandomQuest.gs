/**
 * inviteRandomQuest()
 * 
 * Chooses a random quest scroll from the player's inventory and 
 * invites their party to the quest. If EXCLUDE_GEM_QUESTS = true, 
 * gem quest scrolls are ignored. If EXCLUDE_HOURGLASS_QUESTS = true,
 * hourglass quest scrolls are ignored.
 * 
 * Run this function 5-15 mins after the party finishes a quest. The 
 * randomized delay allows party members without scripts to run quests 
 * too, and prevents multiple "invite quest" requests from hitting 
 * Habitica's servers at once.
 */
function inviteRandomQuest() {

  // delete temporary trigger
  for (trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === "inviteRandomQuest") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // if not in a party or party is on a quest, return
  if (typeof getParty(true) === "undefined" || typeof party.quest.key !== "undefined") {
    return;
  }

  // for each quest scroll
  let questScrolls = [];
  for ([questKey, numScrolls] of Object.entries(getUser().items.quests)) {

    // if not excluded by settings
    if (!(EXCLUDE_HOURGLASS_QUESTS === true && typeof getContent().quests[questKey].category == "timeTravelers") && !(EXCLUDE_GEM_QUESTS === true && typeof content.quests[questKey].goldValue === "undefined")) {

      // add x number of scrolls to list
      for (let i=0; i<numScrolls; i++) {
        questScrolls.push(questKey);
      }
    }
  }

  // if list contains scrolls
  if (questScrolls.length > 0) {

    let randomQuestScroll = questScrolls[Math.floor(Math.random() * (questScrolls.length - 1))];

    console.log("Inviting party to " + content.quests[randomQuestScroll].text);

    // invite party to a random quest scroll
    fetch("https://habitica.com/api/v3/groups/party/quests/invite/" + randomQuestScroll, POST_PARAMS);
  }
}