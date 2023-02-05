/**
 * hideAllNotifications()
 * 
 * Hides notifications from all guilds enabled in the settings.
 */
function hideAllNotifications(noLogging) {

  // for each notification
  let message = "Hiding notifications from ";
  let notificationIds = [];
  for (let notification of getUser(true).notifications) {

    // if chat message & user wants to hide
    if (notification.type == "NEW_CHAT_MESSAGE" && ((HIDE_PARTY_NOTIFICATIONS === true && notification.data.group.id === user.party._id) || (HIDE_ALL_GUILD_NOTIFICATIONS === true && notification.data.group.id !== user.party._id) || (HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS.includes(notification.data.group.id)))) {

      // add to list
      message += notification.data.group.name + ", ";
      notificationIds.push(notification.id);
    }
  }

  // if list has notifications, hide them
  if (notificationIds.length > 0) {
    try {

      if (!noLogging) {
        console.log(message.slice(0, -2));
      }

      let params = Object.assign({
        "contentType": "application/json",
        "payload": JSON.stringify({
          "notificationIds": notificationIds
        })
      }, POST_PARAMS);
      fetch("https://habitica.com/api/v3/notifications/read", params);
    } catch (e) {
      if (e.stack.includes("Notification not found")) {
        if (notificationIds.length > 1) {
          hideAllNotifications(true);
        }
      } else {
        throw e;
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
    for (let trigger of ScriptApp.getProjectTriggers()) {
      if (trigger.getHandlerFunction() === "hidePartyNotification") {
        ScriptApp.deleteTrigger(trigger);
      }
    }

    // hide party notification
    for (let notification of getUser(true).notifications) {
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
    console.error(e.stack);
    throw e;
  }
}