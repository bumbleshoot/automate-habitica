/**
 * hideNotifications()
 * 
 * Hides notifications from all party/guilds enabled 
 * in the settings.
 */
function hideNotifications() {
  if (HIDE_PARTY_NOTIFICATIONS === true && HIDE_ALL_GUILD_NOTIFICATIONS === true) {

    console.log("Hiding all notifications");

    for (notification of getUser().notifications) {
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
    for (notification of getUser().notifications) {
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