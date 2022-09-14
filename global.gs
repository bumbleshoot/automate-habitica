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

let scriptProperties = PropertiesService.getScriptProperties();

/**
 * onTrigger()
 * 
 * This function is called by a trigger every 10 mins.
 */
function onTrigger() {
  try {

    // add to queue & process queue
    scriptProperties.setProperty("processTrigger", "true");
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
function doPost(e) {
  try {

    // add to queue
    let postData = JSON.parse(e.postData.contents);
    scriptProperties.setProperty("processWebhook", postData.type || postData.webhookType);

    // create temporary trigger to process queue
    let triggerNeeded = true;
    for (trigger of ScriptApp.getProjectTriggers()) {
      if (trigger.getHandlerFunction() === "processQueue") {
        triggerNeeded = false;
        break;
      }
    }
    if (triggerNeeded) {
      ScriptApp.newTrigger("processQueue")
        .timeBased()
        .after(1)
        .create();
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
  let dayStart = getUser().data.preferences.dayStart;
  let needsCron = user.data.needsCron;
  let lastCron = new Date(user.data.auth.timestamps.loggedin);
  let lastBeforeCron = new Date(scriptProperties.getProperty("LAST_BEFORE_CRON"));
  let lastAfterCron = new Date(scriptProperties.getProperty("LAST_AFTER_CRON"));

  // if just before day start time
  if (now.getHours() == dayStart-1 && 39 <= now.getMinutes() && now.getMinutes() < 54 && (lastBeforeCron.toDateString() !== now.toDateString() || lastBeforeCron.getHours() !== now.getHours())) {
    scriptProperties.setProperty("beforeCron", "true");
    scriptProperties.setProperty("LAST_BEFORE_CRON", now);

  // if auto cron and player hasn't cronned today
  } else if (AUTO_CRON === true && needsCron === true) {
    scriptProperties.setProperty("runCron", "true");
    if (AUTO_CAST_SKILLS === true || AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("afterCron", "true");
      scriptProperties.setProperty("LAST_AFTER_CRON", now);
    }

  // if player has cronned today and after cron hasn't run since cron
  } else if ((AUTO_CAST_SKILLS === true || AUTO_PURCHASE_GEMS === true) && needsCron === false && lastCron.getTime() - lastAfterCron.getTime() > 0) {
    scriptProperties.setProperty("afterCron", "true");
    scriptProperties.setProperty("LAST_AFTER_CRON", now);
  
  // in case GAS execution time limit was reached
  } else if (AUTO_CAST_SKILLS === true) {
    scriptProperties.setProperty("useExcessMana", "true");
  }

  if (AUTO_ACCEPT_QUEST_INVITES === true) {
    scriptProperties.setProperty("acceptQuestInvite", "true");
  }
  if (AUTO_START_QUESTS === true) {
    scriptProperties.setProperty("forceStartQuest", "true");
  }
  if (AUTO_CAST_SKILLS === true && getPlayerClass() == "healer") {
    scriptProperties.setProperty("healParty", "true");
  }
  if (AUTO_PAUSE_RESUME_DAMAGE === true) {
    scriptProperties.setProperty("pauseResumeDamage", "true");
  }

  // in case GAS execution time limit was reached
  if (AUTO_PURCHASE_ARMOIRES === true) {
    scriptProperties.setProperty("purchaseArmoires", "true");
  }
}

/**
 * processWebhook(webhookType)
 * 
 * Logs webhook type and adds functions to the queue depending
 * on webhook type.
 */
function processWebhook(webhookType) {

  // log webhook type
  console.log("Webhook type: " + webhookType);

  // when a task is scored
  if (webhookType == "scored") {
    if (AUTO_CAST_SKILLS === true) {
      scriptProperties.setProperty("useExcessMana", "true");
    }
    if (AUTO_PAUSE_RESUME_DAMAGE === true && getUser(true).data.preferences.sleep) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }
    if (AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("purchaseGems", "true");
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

  // when player levels up
  } else if (webhookType == "leveledUp") {
    processWebhook("scored"); // scored webhook doesn't fire if scoring a task causes level up (submitted bug report for this 2021-12-05)
    if (AUTO_ALLOCATE_STAT_POINTS === true) {
      scriptProperties.setProperty("allocateStatPoints", "true");
    }
    let lvl = getUser(true).data.stats.lvl;
    if (AUTO_PAUSE_RESUME_DAMAGE === true && user.data.preferences.sleep && lvl <= 100 && lvl % 2 == 0) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }

  // when player is invited to a quest
  } else if (webhookType == "questInvited") {
    if (AUTO_ACCEPT_QUEST_INVITES === true || AUTO_START_QUESTS === true || NOTIFY_ON_QUEST_END === true) {
      scriptProperties.setProperty("saveQuestName", "true");
    }
    if (AUTO_ACCEPT_QUEST_INVITES === true) {
      scriptProperties.setProperty("acceptQuestInvite", "true");
    }
    if (AUTO_START_QUESTS === true) {
      scriptProperties.setProperty("forceStartQuest", "true");
    }
    if (AUTO_PAUSE_RESUME_DAMAGE === true) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }

  // when a quest is started
  } else if (webhookType == "questStarted") {
    if (AUTO_START_QUESTS === true) {
      scriptProperties.setProperty("forceStartQuest", "true");
    }

  // when a quest is finished
  } else if (webhookType == "questFinished") {
    if (NOTIFY_ON_QUEST_END === true) {
      scriptProperties.setProperty("notifyQuestEnded", "true");
    }
    if (AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("purchaseGems", "true");
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
    if (AUTO_UPDATE_QUEST_TRACKER === true) {
      scriptProperties.setProperty("updateQuestTracker", "true");
    }
  }
}

/**
 * processQueue()
 * 
 * Loops through the queue, running functions in order of priority,
 * until there are no more functions left in the queue. Script lock 
 * ensures only one instance can run the queue at a time. All API 
 * calls & logging are kept within the queue (script lock), to 
 * prevent collisions.
 */
function processQueue() {
  try {

    // delete temporary triggers
    for (trigger of ScriptApp.getProjectTriggers()) {
      if (trigger.getHandlerFunction() === "processQueue") {
        ScriptApp.deleteTrigger(trigger);
      }
    }

    // prevent multiple instances from running at once
    let lock = LockService.getScriptLock();
    if (lock.tryLock(0)) {

      while (true) {
        if (scriptProperties.getProperty("allocateStatPoints") !== null) {
          allocateStatPoints();
          scriptProperties.deleteProperty("allocateStatPoints");
          continue;
        }
        if (scriptProperties.getProperty("healParty") !== null) {
          healParty();
          scriptProperties.deleteProperty("healParty");
          continue;
        }
        if (scriptProperties.getProperty("pauseResumeDamage") !== null) {
          pauseResumeDamage();
          scriptProperties.deleteProperty("pauseResumeDamage");
          continue;
        }
        if (scriptProperties.getProperty("processTrigger") !== null) {
          processTrigger();
          scriptProperties.deleteProperty("processTrigger");
          continue;
        }
        if (scriptProperties.getProperty("beforeCron") !== null) {
          beforeCron();
          scriptProperties.deleteProperty("beforeCron");
          continue;
        }
        let webhookType = scriptProperties.getProperty("processWebhook");
        if (webhookType !== null) {
          processWebhook(webhookType);
          scriptProperties.deleteProperty("processWebhook");
          continue;
        }
        if (scriptProperties.getProperty("saveQuestName") !== null) {
          saveQuestName();
          scriptProperties.deleteProperty("saveQuestName");
          continue;
        }
        if (scriptProperties.getProperty("acceptQuestInvite") !== null) {
          acceptQuestInvite();
          scriptProperties.deleteProperty("acceptQuestInvite");
          continue;
        }
        if (scriptProperties.getProperty("runCron") !== null) {
          runCron();
          scriptProperties.deleteProperty("runCron");
          continue;
        }
        if (scriptProperties.getProperty("afterCron") !== null) {
          afterCron();
          scriptProperties.deleteProperty("afterCron");
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
        if (scriptProperties.getProperty("notifyQuestEnded") !== null) {
          notifyQuestEnded();
          scriptProperties.deleteProperty("notifyQuestEnded");
          continue;
        }
        if (scriptProperties.getProperty("useExcessMana") !== null) {
          useExcessMana();
          scriptProperties.deleteProperty("useExcessMana");
          continue;
        }
        if (scriptProperties.getProperty("purchaseArmoires") !== null) {
          purchaseArmoires();
          scriptProperties.deleteProperty("purchaseArmoires");
          continue;
        }
        if (scriptProperties.getProperty("updateQuestTracker") !== null) {
          updateQuestTracker();
          scriptProperties.deleteProperty("updateQuestTracker");
          continue;
        }
        if (scriptProperties.getProperty("sellExtraFood") !== null) {
          sellExtraFood();
          scriptProperties.deleteProperty("sellExtraFood");
          continue;
        }
        if (scriptProperties.getProperty("sellExtraHatchingPotions") !== null) {
          sellExtraHatchingPotions();
          scriptProperties.deleteProperty("sellExtraHatchingPotions");
          continue;
        }
        if (scriptProperties.getProperty("sellExtraEggs") !== null) {
          sellExtraEggs();
          scriptProperties.deleteProperty("sellExtraEggs");
          continue;
        }
        if (scriptProperties.getProperty("hatchFeedPets") !== null) {
          hatchFeedPets();
          scriptProperties.deleteProperty("hatchFeedPets");
          continue;
        }
        break;
      }

      lock.releaseLock();
    }
  
  } catch (e) {
    if (!e.stack.includes("There are too many LockService operations against the same script")) {
      throw e;
    }
  }
}

/**
 * beforeCron()
 * 
 * Attack the boss and use up mana that will be lost at cron.
 * Run this function just before the player's day start time, 
 * at least 6 mins before day start (max Google Apps Script 
 * run time).
 */
function beforeCron() {
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
 * afterCron()
 * 
 * Cast buffs until all mana is used up. Run this function 
 * just after the player's cron.
 */
function afterCron() {
  if (AUTO_CAST_SKILLS === true) {
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
  if (AUTO_PURCHASE_GEMS === true) {
    scriptProperties.setProperty("purchaseGems", "true");
  }
}

/**
 * saveQuestName()
 * 
 * Saves the name of the party's current quest in a script 
 * property.
 */
function saveQuestName() {
  let quest = getParty(true).data.quest.key;
  if (typeof quest !== "undefined") {
    scriptProperties.setProperty("QUEST_NAME", getContent().data.quests[quest].text);
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
    let response = UrlFetchApp.fetch(url, params);

    // store rate limiting data
    scriptProperties.setProperties({
      "X-RateLimit-Reset": response.getHeaders()["x-ratelimit-reset"],
      "X-RateLimit-Remaining": response.getHeaders()["x-ratelimit-remaining"]
    });

    // if success, return response
    if (response.getResponseCode() < 300) {
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
  playerClass = getUser().data.stats.class;
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
    return (getUser(true).data.stats.maxMP - 30) / 2;
  }

  // calculate stat from level, buffs, allocated
  let levelStat = Math.min(Math.floor(getUser(true).data.stats.lvl / 2), 50);
  let equipmentStat = 0;
  let buffsStat = user.data.stats.buffs[stat];
  let allocatedStat = user.data.stats[stat];

  // calculate stat from equipment
  for (equipped of Object.values(user.data.items.gear.equipped)) {
    let equipment = getContent().data.gear.flat[equipped];
    if (equipment != undefined) { 
      equipmentStat += equipment[stat];
      if (equipment.klass == user.data.stats.class || ((equipment.klass == "special") && (equipment.specialClass == user.data.stats.class))) {
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
  for (task of getTasks().data) {
    if (task.type == "daily" && task.isDue && !task.completed) {
      return 0;
    }
  }
  return Math.min(Math.ceil(getUser().data.stats.lvl / 2), 50);
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
    user = JSON.parse(fetch("https://habitica.com/api/v3/user", GET_PARAMS));
  }
  return user;
}

/**
 * getTasks(updated)
 * 
 * Fetches task data from the Habitica API if it hasn't already 
 * been fetched during this execution, or if updated is set to 
 * true.
 */
let tasks;
function getTasks(updated) {
  if (updated || typeof tasks === "undefined") {
    tasks = JSON.parse(fetch("https://habitica.com/api/v3/tasks/user", GET_PARAMS));
  }
  return tasks;
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
    party = JSON.parse(fetch("https://habitica.com/api/v3/groups/party", GET_PARAMS));
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
    members = JSON.parse(fetch("https://habitica.com/api/v3/groups/party/members?includeAllPublicFields=true", GET_PARAMS));
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
    content = JSON.parse(fetch("https://habitica.com/api/v3/content", GET_PARAMS));
  }
  return content;
}