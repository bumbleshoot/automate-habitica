/**
 * hideNotifications()
 * 
 * Hides notifications from all party/guilds enabled 
 * in the settings.
 */
function hideNotifications() {
  if (HIDE_PARTY_NOTIFICATIONS === true && HIDE_ALL_GUILD_NOTIFICATIONS === true) {

    console.log("Hiding all notifications");

    for (notification of getUser(true).notifications) {
      if (notification.type == "NEW_CHAT_MESSAGE") {
        try {
          fetch("https://habitica.com/api/v3/notifications/" + notification.id + "/read", POST_PARAMS);
        } catch (e) {
          if (!e.stack.includes("Notification not found")) {
            throw e;
          }
        }
      }
    }
  } else {
    for (notification of getUser(true).notifications) {
      if (notification.type == "NEW_CHAT_MESSAGE" && ((HIDE_PARTY_NOTIFICATIONS === true && notification.data.group.id === user.party._id) || HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS.includes(notification.data.group.id))) {

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
}

/**
 * hideNotificationsHandler()
 * 
 * Deletes temporary trigger, hides party notifications, 
 * and emails the user if any errors are thrown.
 */
function hideNotificationsHandler() {
  try {

    // delete temporary trigger
    for (trigger of ScriptApp.getProjectTriggers()) {
      if (trigger.getHandlerFunction() === "hideNotificationsHandler") {
        ScriptApp.deleteTrigger(trigger);
      }
    }

    while (true) {

      // hide notifications
      hideNotifications();

      // check for new trigger
      for (trigger of ScriptApp.getProjectTriggers()) {
        if (trigger.getHandlerFunction() === "hideNotificationsHandler") {
          ScriptApp.deleteTrigger(trigger);
          continue;
        }
      }
      break;
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