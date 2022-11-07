/**
 * forceStartQuest()
 * 
 * Forces pending quests to start after AUTO_START_QUESTS_AFTER_HOURS_MIN
 * hours, regardless of how many party members have joined. Only works if 
 * the player ran the quest, or the player is the party leader.
 * 
 * Run this function on the questInvited webhook, on the questStarted 
 * webhook, and every 10 mins.
 */
function forceStartQuest() {

  // if pending quest
  if (typeof getParty(true).quest.key !== "undefined" && !party.quest.active) {

    // if key matches
    if (scriptProperties.getProperty("PENDING_QUEST_KEY") === party.quest.key) {

      console.log("Quest \"" + getContent().quests[party.quest.key].text + "\" already discovered " + scriptProperties.getProperty("INVITATION_DISCOVERED"));

      // if AUTO_START_QUESTS_AFTER_HOURS_MIN hours have passed
      if ((new Date().getTime() - new Date(scriptProperties.getProperty("INVITATION_DISCOVERED")).getTime()) / 3600000 >= AUTO_START_QUESTS_AFTER_HOURS_MIN) {

        console.log(AUTO_START_QUESTS_AFTER_HOURS_MIN + " hours have passed, force starting quest");

        // force start quest
        try {
          fetch("https://habitica.com/api/v3/groups/party/quests/force-start", POST_PARAMS);
        } catch (e) {
          if (!e.stack.includes("Only the quest leader or group leader can force start the quest")) {
            throw e;
          }
        }

        if (NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST === true) {

          // get list of members who failed to join the quest
          let membersMissingQuest = [];
          for ([id, joined] of Object.entries(party.quest.members)) {
            if (!joined) {
              for (member of getMembers()) {
                if (member._id === id) {
                  membersMissingQuest.push(member.auth.local.username);
                  break;
                }
              }
            }
          }

          // send list to player in a private message
          if (membersMissingQuest.length > 0) {
            let params = Object.assign(
              POST_PARAMS,
              {
                "contentType": "application/json",
                "payload": JSON.stringify({
                  "message": "The following party members failed to join the quest " + getContent().quests[party.quest.key].text + ": " + membersMissingQuest.join(", "),
                  "toUserId": USER_ID
                })
              }
            );
            fetch("https://habitica.com/api/v3/members/send-private-message", params);
          }
        }

        console.log("Deleting quest info");

        // delete variables
        scriptProperties.deleteProperty("PENDING_QUEST_KEY");
        scriptProperties.deleteProperty("INVITATION_DISCOVERED");
      
      } else {
        console.log(AUTO_START_QUESTS_AFTER_HOURS_MIN + " hours have not passed, waiting");
      }
    
    // if new pending quest, set variables
    } else {

      console.log("New quest \"" + getContent().quests[party.quest.key].text + "\", saving quest info");

      scriptProperties.setProperty("PENDING_QUEST_KEY", party.quest.key);
      scriptProperties.setProperty("INVITATION_DISCOVERED", new Date().toString());
    }
  
  // if no pending quest, delete variables
  } else {

    console.log("No pending quest, deleting quest info");

    scriptProperties.deleteProperty("PENDING_QUEST_KEY");
    scriptProperties.deleteProperty("INVITATION_DISCOVERED");
  }
}