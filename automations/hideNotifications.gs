/**
 * hideGuildNotifications()
 * 
 * Hides notifications from all guilds enabled in the settings.
 */
function hideGuildNotifications() {
  for (notification of getUser(true).notifications) {
    if (notification.type == "NEW_CHAT_MESSAGE" && ((HIDE_ALL_GUILD_NOTIFICATIONS === true && notification.data.group.id !== user.party._id) || (HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS.includes(notification.data.group.id)))) {

      console.log("Hiding notification from " + notification.data.group.name);

      try {
        fetch("https://habitica.com/api/v3/notifications/" + notification.id + "/read", POST_PARAMS);
      } catch (e) {
        if (!e.stack.includes("Notification not found")) {
          throw e;
        }
      }
    }
  }
}

/**
 * hidePartyNotification()
 * 
 * Deletes temporary trigger, hides party notification, 
 * and emails the user if any errors are thrown.
 */
function hidePartyNotification() {
  try {

    // delete temporary trigger
    for (trigger of ScriptApp.getProjectTriggers()) {
      if (trigger.getHandlerFunction() === "hidePartyNotification") {
        ScriptApp.deleteTrigger(trigger);
      }
    }

    // hide party notification
    for (notification of getUser(true).notifications) {
      if (notification.type == "NEW_CHAT_MESSAGE" && notification.data.group.id === user.party._id) {

        console.log("Hiding notification from " + notification.data.group.name);

        try {
          fetch("https://habitica.com/api/v3/notifications/" + notification.id + "/read", POST_PARAMS);
        } catch (e) {
          if (!e.stack.includes("Notification not found")) {
            throw e;
          }
        }
        break;
      }
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