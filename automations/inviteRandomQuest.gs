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
  try {

    // delete temporary trigger
    for (let trigger of ScriptApp.getProjectTriggers()) {
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
    for (let [questKey, numScrolls] of Object.entries(getUser().items.quests)) {
      if (numScrolls > 0) {

        // if not excluded by settings
        let category = getContent().quests[questKey].category;
        if ((AUTO_INVITE_HOURGLASS_QUESTS === true && category === "timeTravelers") || (category != "timeTravelers" && ((AUTO_INVITE_GOLD_QUESTS === true && typeof content.quests[questKey].goldValue !== "undefined") || (AUTO_INVITE_UNLOCKABLE_QUESTS === true && category === "unlockable") || (AUTO_INVITE_PET_QUESTS === true && ["pet", "hatchingPotion"].includes(category))))) {

          // add x number of scrolls to list
          for (let i=0; i<numScrolls; i++) {
            questScrolls.push(questKey);
          }
        }
      }
    }

    // if list contains scrolls
    if (questScrolls.length > 0) {

      let randomQuestScroll = questScrolls[Math.floor(Math.random() * (questScrolls.length - 1))];

      console.log("Inviting party to " + content.quests[randomQuestScroll].text);

      // invite party to a random quest scroll
      fetch("https://habitica.com/api/v3/groups/party/quests/invite/" + randomQuestScroll, POST_PARAMS);

      scriptProperties.deleteProperty("QUEST_SCROLL_PM_SENT");
    }
    
    // send player a PM if they are out of usable quest scrolls
    if (PM_WHEN_OUT_OF_QUEST_SCROLLS === true && questScrolls.length <= 1 && scriptProperties.getProperty("QUEST_SCROLL_PM_SENT") === null) {

      console.log("No more usable quest scrolls, sending PM to player");

      let params = Object.assign({
        "contentType": "application/json",
        "payload": JSON.stringify({
          "message": "You have no more usable quest scrolls!",
          "toUserId": USER_ID
        })
      }, POST_PARAMS);
      fetch("https://habitica.com/api/v3/members/send-private-message", params);

      scriptProperties.setProperty("QUEST_SCROLL_PM_SENT", "true");
    }

  } catch (e) {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      DriveApp.getFileById(ScriptApp.getScriptId()).getName() + " failed!",
      e.stack
    );
    throw e;
  }
}