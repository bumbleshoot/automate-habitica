const PARAMS = {
  "headers": {
    "x-api-user": USER_ID, 
    "x-api-key": API_TOKEN,
    "x-client": "35c3fb6f-fb98-4bc3-b57a-ac01137d0847-AutomateHabitica"
  },
  "muteHttpExceptions": true
};
const GET_PARAMS = Object.assign({ "method": "get" }, PARAMS);
const POST_PARAMS = Object.assign({ "method": "post" }, PARAMS);
const DELETE_PARAMS = Object.assign({ "method": "delete" }, PARAMS);

const scriptProperties = PropertiesService.getScriptProperties();

/**
 * onTrigger()
 * 
 * This function is called by a trigger every 10 mins.
 */
function onTrigger() {
  try {

    // process trigger & queue
    processTrigger();
    processQueue();

  } catch (e) {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      DriveApp.getFileById(ScriptApp.getScriptId()).getName() + " failed!",
      e.stack
    );
    throw e;
  }
}

/**
 * doPost(e)
 * 
 * This function is called by webhooks.
 */
let webhook;
function doPost(e) {
  try {

    webhook = true;

    // get relevant data from webhook
    let postData = JSON.parse(e.postData.contents);
    let webhookData = {
      webhookType: postData.type || postData.webhookType
    };
    if (webhookData.webhookType == "scored") {
      if (typeof postData.user._tmp.leveledUp !== "undefined") {
        processWebhook({
          webhookType: "leveledUp",
          statPoints: postData.user.stats.points,
          lvl: postData.user._tmp.leveledUp.newLvl
        });
      }
      Object.assign(webhookData, {
        taskType: postData.task.type,
        isDue: postData.task.isDue,
        gp: postData.user.stats.gp,
        dropType: postData.user._tmp?.drop?.type || null
      });
    } else if (webhookData.webhookType == "leveledUp") {
      Object.assign(webhookData, {
        lvl: postData.finalLvl
      });
    } else if (webhookData.webhookType == "questInvited" || webhookData.webhookType == "questFinished") {
      Object.assign(webhookData, {
        questKey: postData.quest.key
      });
    }

    // process webhook
    processWebhook(webhookData);

    // process queue
    processQueue();

  } catch (e) {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      DriveApp.getFileById(ScriptApp.getScriptId()).getName() + " failed!",
      e.stack
    );
    throw e;
  }
}

/**
 * processTrigger()
 * 
 * Adds functions to the queue that need to run just before 
 * day start, just after day start, just after cron, or 
 * periodically.
 */
function processTrigger() {

  // get times
  let now = new Date();
  let timezoneOffset = now.getTimezoneOffset() * 60 * 1000 - getUser().preferences.timezoneOffset * 60 * 1000;
  let nowAdjusted = new Date(now.getTime() + timezoneOffset);
  let dayStart = user.preferences.dayStart;
  let needsCron = user.needsCron;
  let lastCron = new Date(user.auth.timestamps.loggedin);
  let lastBeforeCron = new Date(scriptProperties.getProperty("LAST_BEFORE_CRON"));
  let lastBeforeCronAdjusted = new Date(lastBeforeCron.getTime() + timezoneOffset);
  let lastAfterCron = new Date(scriptProperties.getProperty("LAST_AFTER_CRON"));

  // if just before day start time
  if (AUTO_CAST_SKILLS === true && nowAdjusted.getHours() == dayStart-1 && 24 <= nowAdjusted.getMinutes() && nowAdjusted.getMinutes() < 54 && (lastBeforeCronAdjusted.toDateString() !== nowAdjusted.toDateString() || lastBeforeCronAdjusted.getHours() !== nowAdjusted.getHours())) {
    scriptProperties.setProperty("beforeCronSkills", "true");
    scriptProperties.setProperty("LAST_BEFORE_CRON", now);

  // if auto cron and player hasn't cronned today
  } else if (AUTO_CRON === true && needsCron === true) {
    scriptProperties.setProperty("runCron", "true");
    if (AUTO_CAST_SKILLS === true || AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("LAST_AFTER_CRON", now);
      scriptProperties.deleteProperty("beforeCronSkills");
      if (AUTO_CAST_SKILLS === true) {
        scriptProperties.setProperty("afterCronSkills", "true");
      }
      if (AUTO_PURCHASE_GEMS === true) {
        scriptProperties.setProperty("purchaseGems", "true");
      }
    }

  // if player has cronned today and after cron hasn't run since cron
  } else if ((AUTO_CAST_SKILLS === true || AUTO_PURCHASE_GEMS === true) && needsCron === false && lastCron.getTime() - lastAfterCron.getTime() > 0) {
    scriptProperties.setProperty("LAST_AFTER_CRON", now);
    scriptProperties.deleteProperty("beforeCronSkills");
    if (AUTO_CAST_SKILLS === true) {
      scriptProperties.setProperty("afterCronSkills", "true");
    }
    if (AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("purchaseGems", "true");
    }

  // in case GAS execution time limit was reached
  } else if (AUTO_CAST_SKILLS === true) {
    scriptProperties.setProperty("useExcessMana", "true");
  }

  if (HIDE_ALL_GUILD_NOTIFICATIONS === true && !installing) {
    if (user.guilds.join() !== scriptProperties.getProperty("playerGuilds")) {
      deleteWebhooks(true);
      createWebhooks(true);
    }
  }
  if (AUTO_CAST_SKILLS === true && getPlayerClass() == "healer") {
    scriptProperties.setProperty("healParty", "true");
  }
  if (AUTO_PAUSE_RESUME_DAMAGE === true) {
    scriptProperties.setProperty("pauseResumeDamage", "true");
  }
  if (AUTO_ACCEPT_QUEST_INVITES === true) {
    scriptProperties.setProperty("acceptQuestInvite", "true");
  }
  if (FORCE_START_QUESTS === true) {
    scriptProperties.setProperty("forceStartQuest", "true");
  }

  // in case GAS execution time limit was reached
  if (AUTO_PURCHASE_ARMOIRES === true) {
    scriptProperties.setProperty("purchaseArmoires", "true");
  }
}

/**
 * processWebhook(webhookData)
 * 
 * Adds functions to the queue depending on the webhook data.
 */
function processWebhook(webhookData) {

  // log webhook type
  if (!installing) {
    console.log("Webhook type: " + webhookData.webhookType);
  }

  // when a task is scored
  if (webhookData.webhookType == "scored") {
    if (AUTO_PAUSE_RESUME_DAMAGE === true && webhookData.taskType == "daily" && webhookData.isDue === true && getUser().preferences.sleep === true) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }
    if (AUTO_PURCHASE_GEMS === true && webhookData.gp >= 20) {
      scriptProperties.setProperty("purchaseGems", "true");
    }
    if (AUTO_CAST_SKILLS === true) {
      scriptProperties.setProperty("useExcessMana", "true");
    }
    if (AUTO_PURCHASE_ARMOIRES === true && webhookData.gp >= RESERVE_GOLD + 100) {
      scriptProperties.setProperty("purchaseArmoires", webhookData.gp);
    }
    if (AUTO_SELL_EGGS === true && (webhookData.dropType === "Egg" || webhookData.dropType === "All")) {
      scriptProperties.setProperty("sellExtraEggs", "true");
    }
    if (AUTO_SELL_HATCHING_POTIONS === true && (webhookData.dropType === "HatchingPotion" || webhookData.dropType === "All")) {
      scriptProperties.setProperty("sellExtraHatchingPotions", "true");
    }
    if (AUTO_SELL_FOOD === true && (webhookData.dropType === "Food" || webhookData.dropType === "All")) {
      scriptProperties.setProperty("sellExtraFood", "true");
    }
    if (AUTO_HATCH_FEED_PETS === true && ["Egg", "HatchingPotion", "Food", "All"].includes(webhookData.dropType)) {
      scriptProperties.setProperty("hatchFeedPets", "true");
    }

  // when player levels up
  } else if (webhookData.webhookType == "leveledUp") {
    if (AUTO_ALLOCATE_STAT_POINTS === true && (typeof webhookData.statPoints === "undefined" || webhookData.statPoints > 0) && webhookData.lvl >= 10) {
      scriptProperties.setProperty("allocateStatPoints", JSON.stringify(webhookData));
    }
    if (AUTO_PAUSE_RESUME_DAMAGE === true && webhookData.lvl <= 100 && getUser().preferences.sleep === true) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }

  // when player is invited to a quest
  } else if (webhookData.webhookType == "questInvited") {
    if (AUTO_PAUSE_RESUME_DAMAGE === true) {
      scriptProperties.setProperty("pauseResumeDamage", webhookData.questKey || "true");
    }
    if (AUTO_ACCEPT_QUEST_INVITES === true) {
      scriptProperties.setProperty("acceptQuestInvite", "true");
    }
    if (FORCE_START_QUESTS === true) {
      scriptProperties.setProperty("forceStartQuest", "true");
    }

  // when a quest is started
  } else if (webhookData.webhookType == "questStarted") {
    if (FORCE_START_QUESTS === true) {
      scriptProperties.setProperty("forceStartQuest", "true");
    }

  // when a quest is finished
  } else if (webhookData.webhookType == "questFinished") {
    if (AUTO_PAUSE_RESUME_DAMAGE === true && getUser().preferences.sleep === true) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }
    if (AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("purchaseGems", "true");
    }
    if (NOTIFY_ON_QUEST_END === true && typeof webhookData.questKey !== "undefined") {
      scriptProperties.setProperty("notifyQuestEnded", webhookData.questKey);
    }
    if (AUTO_INVITE_QUESTS === true) {
      for (trigger of ScriptApp.getProjectTriggers()) {
        if (trigger.getHandlerFunction() === "inviteRandomQuest") {
          ScriptApp.deleteTrigger(trigger);
        }
      }
      let afterMs = Math.random() * 600000 + 300000;
      ScriptApp.newTrigger("inviteRandomQuest")
        .timeBased()
        .after(afterMs)
        .create();
    }
    if (AUTO_PURCHASE_ARMOIRES === true) {
      scriptProperties.setProperty("purchaseArmoires", "true");
    }
    if (AUTO_SELL_EGGS === true) {
      scriptProperties.setProperty("sellExtraEggs", "true");
    }
    if (AUTO_SELL_HATCHING_POTIONS === true) {
      scriptProperties.setProperty("sellExtraHatchingPotions", "true");
    }
    if (AUTO_SELL_FOOD === true) {
      scriptProperties.setProperty("sellExtraFood", "true");
    }
    if (AUTO_HATCH_FEED_PETS === true) {
      scriptProperties.setProperty("hatchFeedPets", "true");
    }

  // when a chat notification is received
  } else if (webhookData.webhookType == "groupChatReceived") {
    scriptProperties.setProperty("hideNotifications", "true");
  }
}

/**
 * processQueue()
 * 
 * Loops through the queue, running functions in order of priority,
 * until there are no more functions left in the queue. Script lock 
 * ensures only one instance can run the queue at a time. All API 
 * calls are kept within the queue (script lock), to prevent 
 * collisions.
 */
function processQueue() {
  try {

    // prevent multiple instances from running at once
    let lock = LockService.getScriptLock();
    if (lock.tryLock(0) || (installing && lock.tryLock(360000))) {

      while (true) {
        if (scriptProperties.getProperty("hideNotifications") !== null) {
          hideNotifications();
          scriptProperties.deleteProperty("hideNotifications");
          continue;
        }
        let webhookData = scriptProperties.getProperty("allocateStatPoints");
        if (webhookData !== null) {
          webhookData = JSON.parse(webhookData);
          allocateStatPoints(webhookData.points, webhookData.lvl);
          scriptProperties.deleteProperty("allocateStatPoints");
          continue;
        }
        if (scriptProperties.getProperty("healParty") !== null) {
          healParty();
          scriptProperties.deleteProperty("healParty");
          continue;
        }
        let questKey = scriptProperties.getProperty("pauseResumeDamage");
        if (questKey !== null) {
          if (questKey === "true") {
            pauseResumeDamage();
          } else {
            pauseResumeDamage(questKey);
          }
          scriptProperties.deleteProperty("pauseResumeDamage");
          continue;
        }
        if (scriptProperties.getProperty("acceptQuestInvite") !== null) {
          acceptQuestInvite();
          scriptProperties.deleteProperty("acceptQuestInvite");
          continue;
        }
        if (scriptProperties.getProperty("beforeCronSkills") !== null && !webhook) {
          beforeCronSkills();
          scriptProperties.deleteProperty("beforeCronSkills");
          continue;
        }
        if (scriptProperties.getProperty("runCron") !== null) {
          runCron();
          scriptProperties.deleteProperty("runCron");
          continue;
        }
        if (scriptProperties.getProperty("afterCronSkills") !== null && !webhook) {
          afterCronSkills();
          scriptProperties.deleteProperty("afterCronSkills");
          continue;
        }
        if (scriptProperties.getProperty("purchaseGems") !== null) {
          purchaseGems();
          scriptProperties.deleteProperty("purchaseGems");
          continue;
        }
        if (scriptProperties.getProperty("forceStartQuest") !== null) {
          forceStartQuest();
          scriptProperties.deleteProperty("forceStartQuest");
          continue;
        }
        questKey = scriptProperties.getProperty("notifyQuestEnded");
        if (questKey !== null) {
          notifyQuestEnded(questKey);
          scriptProperties.deleteProperty("notifyQuestEnded");
          continue;
        }
        if (scriptProperties.getProperty("useExcessMana") !== null && !webhook && !installing) {
          useExcessMana();
          scriptProperties.deleteProperty("useExcessMana");
          continue;
        }
        let gold = scriptProperties.getProperty("purchaseArmoires");
        if (gold !== null && !webhook && !installing) {
          if (gold === "true") {
            purchaseArmoires();
          } else {
            purchaseArmoires(Number(gold));
          }
          scriptProperties.deleteProperty("purchaseArmoires");
          continue;
        }
        if (scriptProperties.getProperty("sellExtraFood") !== null && !webhook) {
          sellExtraFood();
          scriptProperties.deleteProperty("sellExtraFood");
          continue;
        }
        if (scriptProperties.getProperty("sellExtraHatchingPotions") !== null && !webhook) {
          sellExtraHatchingPotions();
          scriptProperties.deleteProperty("sellExtraHatchingPotions");
          continue;
        }
        if (scriptProperties.getProperty("sellExtraEggs") !== null && !webhook) {
          sellExtraEggs();
          scriptProperties.deleteProperty("sellExtraEggs");
          continue;
        }
        if (scriptProperties.getProperty("hatchFeedPets") !== null && !webhook && !installing) {
          hatchFeedPets();
          scriptProperties.deleteProperty("hatchFeedPets");
          continue;
        }
        break;
      }

      lock.releaseLock();
    }
  
  } catch (e) {
    if (!e.stack.includes("There are too many LockService operations against the same script") && !e.stack.includes("We're sorry, a server error occurred. Please wait a bit and try again.")) {
      MailApp.sendEmail(
        Session.getEffectiveUser().getEmail(),
        DriveApp.getFileById(ScriptApp.getScriptId()).getName() + " failed!",
        e.stack
      );
      throw e;
    }
  }
}

/**
 * beforeCronSkills()
 * 
 * Attack the boss and use up mana that will be lost at cron.
 * Run this function just before the player's day start time, 
 * at least 6 mins before day start (max Google Apps Script 
 * run time).
 */
function beforeCronSkills() {
  let playerClass = getPlayerClass();
  if (playerClass == "warrior") {
    smashBossAndDumpMana();
  } else if (playerClass == "mage") {
    burnBossAndDumpMana();
  } else if (playerClass == "healer") {
    castProtectiveAura(true);
  } else if (playerClass == "rogue") {
    castStealthAndDumpMana();
  }
}

/**
 * afterCronSkills()
 * 
 * Cast buffs until all mana is used up. Run this function 
 * just after the player's cron.
 */
function afterCronSkills() {
  let playerClass = getPlayerClass();
  if (playerClass == "warrior") {
    castValorousPresence(false);
  } else if (playerClass == "mage") {
    castEarthquake(false);
  } else if (playerClass == "healer") {
    castProtectiveAura(false);
  } else if (playerClass == "rogue") {
    castToolsOfTheTrade(false);
  }
}

/**
 * useExcessMana()
 * 
 * Use excess mana to cast buffs. Reserves all mana that 
 * will remain after cron, plus enough mana to do 3000 
 * damage to the quest boss.
 */
function useExcessMana() {
  let playerClass = getPlayerClass();
  if (playerClass == "warrior") {
    castValorousPresence(true);
  } else if (playerClass == "mage") {
    castEarthquake(true);
  } else if (playerClass == "healer") {
    castProtectiveAura(false);
  } else if (playerClass == "rogue") {
    castToolsOfTheTrade(true);
  }
}

/**
 * fetch(url, params)
 * 
 * Wrapper for Google Apps Script's UrlFetchApp.fetch(url, params):
 * https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app#fetchurl,-params
 * 
 * Retries failed API calls up to 2 times & handles Habitica's rate 
 * limiting.
 */
function fetch(url, params) {

  // try up to 3 times
  for (let i=0; i<3; i++) {

    // if rate limit reached
    let rateLimitRemaining = scriptProperties.getProperty("X-RateLimit-Remaining");
    let rateLimitReset = scriptProperties.getProperty("X-RateLimit-Reset");
    if (rateLimitRemaining != null && Number(rateLimitRemaining) < 1) {

      // wait until rate limit reset
      let waitUntil = new Date(rateLimitReset);
      waitUntil.setSeconds(waitUntil.getSeconds() + 1);
      let now = new Date();
      Utilities.sleep(Math.max(waitUntil.getTime() - now.getTime(), 0));
    }

    // call API
    let response;
    let addressUnavailable = 0;
    while (true) {
      try {
        response = UrlFetchApp.fetch(url, params);
        break;

      // if address unavailable, wait 5 seconds & try again
      } catch (e) {
        if (addressUnavailable < 12 && e.stack.includes("Address unavailable")) {
          addressUnavailable++;
          Utilities.sleep(5000);
        } else {
          throw e;
        }
      }
    }

    // store rate limiting data
    scriptProperties.setProperties({
      "X-RateLimit-Reset": response.getHeaders()["x-ratelimit-reset"],
      "X-RateLimit-Remaining": response.getHeaders()["x-ratelimit-remaining"]
    });

    // if success, return response
    if (response.getResponseCode() < 300 || (response.getResponseCode() === 404 && (url === "https://habitica.com/api/v3/groups/party" || url.startsWith("https://habitica.com/api/v3/groups/party/members")))) {
      return response;

    // if 3xx or 4xx or failed 3 times, throw exception
    } else if (response.getResponseCode() < 500 || i >= 2) {
      throw new Error("Request failed for https://habitica.com returned code " + response.getResponseCode() + ". Truncated server response: " + response.getContentText());
    }
  }
}

/**
 * getPlayerClass()
 * 
 * Returns the player's current class. If the player's class has 
 * changed since the last time getPlayerClass() was called, saves 
 * the new class and allocates stat points.
 */
let playerClass;
function getPlayerClass() {

  // return player class if already checked during this instance
  if (typeof playerClass !== "undefined") {
    return playerClass;
  }

  // get saved player class
  let savedPlayerClass = scriptProperties.getProperty("PLAYER_CLASS");

  // get current player class
  playerClass = getUser().stats.class;
  if (playerClass == "wizard") {
    playerClass = "mage";
  }

  // if player class has changed
  if (playerClass != savedPlayerClass) {

    if (savedPlayerClass !== null) {
      console.log("Player class changed to " + playerClass + ", saving new class");
    }

    // save current player class
    scriptProperties.setProperty("PLAYER_CLASS", playerClass);

    // allocate stat points
    if (AUTO_ALLOCATE_STAT_POINTS === true) {
      allocateStatPoints();
    }
  }

  // return current player class
  return playerClass;
}

/**
 * getTotalStat(stat)
 * 
 * Returns the total value of a stat, including level, buffs, allocated,
 * & equipment. Pass the name of the stat you want calculated to the 
 * function: "int", "con", "per", or "str".
 */
function getTotalStat(stat) {

  // INT is easy to calculate with a simple formula
  if (stat == "int") {
    return (getUser(true).stats.maxMP - 30) / 2;
  }

  // get player class
  let playerClass = getPlayerClass();
  if (playerClass == "mage") {
    playerClass = "wizard";
  }

  // calculate stat from level, buffs, allocated
  let levelStat = Math.min(Math.floor(getUser(true).stats.lvl / 2), 50);
  let equipmentStat = 0;
  let buffsStat = user.stats.buffs[stat];
  let allocatedStat = user.stats[stat];

  // calculate stat from equipment
  for (equipped of Object.values(user.items.gear.equipped)) {
    let equipment = getContent().gear.flat[equipped];
    if (typeof equipment !== "undefined") {
      equipmentStat += equipment[stat];
      if (equipment.klass == playerClass || ((equipment.klass == "special") && (equipment.specialClass == playerClass))) {
        equipmentStat += equipment[stat] / 2;
      }
    }
  }

  // add all stat together and return
  return levelStat + equipmentStat + allocatedStat + buffsStat;
}

/**
 * function calculatePerfectDayBuff()
 * 
 * Calculates & returns the player's perfect day buff:
 * https://habitica.fandom.com/wiki/Perfect_Day
 */
function calculatePerfectDayBuff() {
  for (daily of getDailies()) {
    if (daily.isDue && !daily.completed) {
      return 0;
    }
  }
  return Math.min(Math.ceil(getUser().stats.lvl / 2), 50);
}

/**
 * getUser(updated)
 * 
 * Fetches user data from the Habitica API if it hasn't already 
 * been fetched during this execution, or if updated is set to 
 * true.
 */
let user;
function getUser(updated) {
  if (updated || typeof user === "undefined") {
    for (let i=0; i<3; i++) {
      user = fetch("https://habitica.com/api/v3/user", GET_PARAMS);
      try {
        user = JSON.parse(user).data;
        break;
      } catch (e) {
        if (i < 2 && e.stack.includes("Unterminated string in JSON")) {
          continue;
        } else {
          throw e;
        }
      }
    }
  }
  return user;
}

/**
 * getTasks()
 * 
 * Fetches task data from the Habitica API if it hasn't 
 * already been fetched during this execution. Removes 
 * challenge tasks and rewards from the task list, and 
 * stores daily data in a separate object.
 */
let tasks;
function getTasks() {
  if (typeof tasks === "undefined") {
    tasks = JSON.parse(fetch("https://habitica.com/api/v3/tasks/user", GET_PARAMS)).data;
    dailies = [];
    for (let i=0; i<tasks.length; i++) {
      if (tasks[i].type == "reward") {
        tasks.splice(i, 1);
        i--;
      } else {
        if (tasks[i].type == "daily") {
          dailies.push(tasks[i]);
        }
        if (typeof tasks[i].challenge.id !== "undefined") {
          tasks.splice(i, 1);
          i--;
        }
      }
    }
  }
  return tasks;
}

/**
* getDailies()
*
* Fetches daily data from the Habitica API if it hasn't 
* already been fetched during this execution.
*/
let dailies;
function getDailies() {
  if (typeof dailies === "undefined") {
    getTasks();
  }
  return dailies;
}

/**
 * getParty(updated)
 * 
 * Fetches party data from the Habitica API if it hasn't already 
 * been fetched during this execution, or if updated is set to 
 * true.
 */
let party;
function getParty(updated) {
  if (updated || typeof party === "undefined") {
    party = JSON.parse(fetch("https://habitica.com/api/v3/groups/party", GET_PARAMS)).data;
  }
  return party;
}

/**
 * getMembers(updated)
 * 
 * Fetches party member data from the Habitica API if it hasn't 
 * already been fetched during this execution, or if updated is 
 * set to true.
 */
let members;
function getMembers(updated) {
  if (updated || typeof members === "undefined") {
    for (let i=0; i<3; i++) {
      members = fetch("https://habitica.com/api/v3/groups/party/members?includeAllPublicFields=true", GET_PARAMS);
      try {
        members = JSON.parse(members).data;
        break;
      } catch (e) {
        if (i < 2 && e.stack.includes("Unterminated string in JSON")) {
          continue;
        } else {
          throw e;
        }
      }
    }
  }
  return members;
}

/**
 * getContent(updated)
 * 
 * Fetches content data from the Habitica API if it hasn't already 
 * been fetched during this execution, or if updated is set to 
 * true.
 */
let content;
function getContent(updated) {
  if (updated || typeof content === "undefined") {
    for (let i=0; i<3; i++) {
      content = fetch("https://habitica.com/api/v3/content", GET_PARAMS);
      try {
        content = JSON.parse(content).data;
        break;
      } catch (e) {
        if (i < 2 && e.stack.includes("Unterminated string in JSON")) {
          continue;
        } else {
          throw e;
        }
      }
    }
  }
  return content;
}