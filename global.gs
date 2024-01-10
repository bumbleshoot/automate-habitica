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
const PUT_PARAMS = Object.assign({ "method": "put" }, PARAMS);
const DELETE_PARAMS = Object.assign({ "method": "delete" }, PARAMS);

const scriptProperties = PropertiesService.getScriptProperties();

const scriptStart = new Date().getTime();

/**
 * onTrigger()
 * 
 * This function is called by a trigger every 10 mins.
 */
function onTrigger() {
  try {

    // re-enable disabled webhooks
    reenableWebhooks();

    // process trigger & queue
    processTrigger();
    processQueue();

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
    } else if (webhookData.webhookType == "groupChatReceived") {
      Object.assign(webhookData, {
        groupId: postData.group.id
      });
    }

    // process webhook
    processWebhook(webhookData);

    // process queue
    processQueue();

  } catch (e) {
    if (!e.stack.includes("Address unavailable")) {
      MailApp.sendEmail(
        Session.getEffectiveUser().getEmail(),
        DriveApp.getFileById(ScriptApp.getScriptId()).getName() + " failed!",
        e.stack
      );
      console.error(e.stack);
      throw e;
    }
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
  let properties = scriptProperties.getProperties();
  let timezoneOffset = now.getTimezoneOffset() * 60 * 1000 - getUser().preferences.timezoneOffset * 60 * 1000;
  let nowAdjusted = new Date(now.getTime() + timezoneOffset);
  let dayStart = user.preferences.dayStart;
  let dayStartAdjusted = dayStart === 0 ? 24 : dayStart;
  let needsCron = user.needsCron;
  let lastCron = new Date(user.auth.timestamps.loggedin);
  let lastAfterCron = new Date(properties["LAST_AFTER_CRON"] || null);

  // if auto cron and just before day start OR no auto cron and just before hour start and needs cron
  if (AUTO_CAST_SKILLS === true && ((nowAdjusted.getHours() == dayStartAdjusted-1 && 39 <= nowAdjusted.getMinutes() && nowAdjusted.getMinutes() < 54) || (AUTO_CRON === false && needsCron === true))) {
    scriptProperties.setProperty("beforeCronSkills", "true");

  // if auto cron and player hasn't cronned today
  } else if (AUTO_CRON === true && needsCron === true) {
    scriptProperties.setProperty("runCron", "true");
    if (AUTO_CAST_SKILLS === true) {
      scriptProperties.deleteProperty("beforeCronSkills");
      scriptProperties.setProperty("afterCronSkills", "true");
    }
    if (AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("purchaseGems", "true");
    }

  // if player has cronned today and after cron hasn't run since cron
  } else if ((AUTO_CAST_SKILLS === true || AUTO_PURCHASE_GEMS === true) && needsCron === false && lastCron.getTime() - lastAfterCron.getTime() > 0) {
    if (AUTO_CAST_SKILLS === true) {
      scriptProperties.deleteProperty("beforeCronSkills");
      scriptProperties.setProperty("afterCronSkills", "true");
    }
    if (AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("purchaseGems", "true");
    }
    scriptProperties.setProperty("LAST_AFTER_CRON", now);

  // in case GAS execution time limit was reached
  } else if (AUTO_CAST_SKILLS === true) {
    scriptProperties.setProperty("useExcessMana", "true");
  }

  if (!installing && ((HIDE_PARTY_NOTIFICATIONS === true && user.party._id !== properties["HIDE_NOTIFICATIONS_PARTY"]) || (HIDE_ALL_GUILD_NOTIFICATIONS === true && user.guilds.join() !== properties["HIDE_NOTIFICATIONS_GUILDS"]))) {
    deleteWebhooks(true);
    createWebhooks(true);
  }
  if (AUTO_CAST_SKILLS === true && user.stats.class == "healer") {
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
  if (!installing && !reenabling) {
    console.log("Webhook type: " + webhookData.webhookType);
  }

  // when a task is scored
  if (webhookData.webhookType == "scored") {
    if (AUTO_PAUSE_RESUME_DAMAGE === true && (typeof webhookData.taskType === "undefined" || (webhookData.taskType == "daily" && webhookData.isDue === true))) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }
    if (AUTO_PURCHASE_GEMS === true && (typeof webhookData.gp === "undefined" || webhookData.gp >= 20)) {
      scriptProperties.setProperty("purchaseGems", "true");
    }
    if (AUTO_CAST_SKILLS === true) {
      scriptProperties.setProperty("useExcessMana", "true");
    }
    if (AUTO_PURCHASE_ARMOIRES === true && (typeof webhookData.gp === "undefined" || webhookData.gp >= RESERVE_GOLD + 100)) {
      scriptProperties.setProperty("purchaseArmoires", webhookData.gp || "true");
    }
    if (AUTO_SELL_EGGS === true && (typeof webhookData.dropType === "undefined" || (webhookData.dropType === "Egg" || webhookData.dropType === "All"))) {
      scriptProperties.setProperty("sellExtraEggs", "true");
    }
    if (AUTO_SELL_HATCHING_POTIONS === true && (typeof webhookData.dropType === "undefined" || (webhookData.dropType === "HatchingPotion" || webhookData.dropType === "All"))) {
      scriptProperties.setProperty("sellExtraHatchingPotions", "true");
    }
    if (AUTO_SELL_FOOD === true && (typeof webhookData.dropType === "undefined" || (webhookData.dropType === "Food" || webhookData.dropType === "All"))) {
      scriptProperties.setProperty("sellExtraFood", "true");
    }
    if (AUTO_HATCH_FEED_PETS === true && (webhookData.dropType === "undefined" || ["Egg", "HatchingPotion", "Food", "All"].includes(webhookData.dropType))) {
      scriptProperties.setProperty("hatchFeedPets", "true");
    }

  // when player levels up
  } else if (webhookData.webhookType == "leveledUp") {
    if (AUTO_ALLOCATE_STAT_POINTS === true && (typeof webhookData.lvl === "undefined" || (typeof webhookData.statPoints === "undefined" || webhookData.statPoints > 0) && webhookData.lvl >= 10)) {
      scriptProperties.setProperty("allocateStatPoints", JSON.stringify(webhookData));
    }
    if (AUTO_PAUSE_RESUME_DAMAGE === true && (typeof webhookData.lvl === "undefined" || webhookData.lvl <= 100)) {
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
    scriptProperties.setProperty("forceStartQuest", "true");

  // when a quest is finished
  } else if (webhookData.webhookType == "questFinished") {
    if (AUTO_PAUSE_RESUME_DAMAGE === true) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }
    if (AUTO_PURCHASE_GEMS === true) {
      scriptProperties.setProperty("purchaseGems", "true");
    }
    if (NOTIFY_ON_QUEST_END === true && typeof webhookData.questKey !== "undefined") {
      scriptProperties.setProperty("notifyQuestEnded", webhookData.questKey);
    }
    if (AUTO_INVITE_GOLD_QUESTS === true || AUTO_INVITE_UNLOCKABLE_QUESTS === true || AUTO_INVITE_PET_QUESTS === true || AUTO_INVITE_HOURGLASS_QUESTS === true) {
      for (let trigger of ScriptApp.getProjectTriggers()) {
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
    if (webhookData.groupId === scriptProperties.getProperty("PARTY_ID")) {
      if (HIDE_PARTY_NOTIFICATIONS === true) {
        let triggerNeeded = true;
        for (let trigger of ScriptApp.getProjectTriggers()) {
          if (trigger.getHandlerFunction() === "hidePartyNotification") {
            triggerNeeded = false;
            break;
          }
        }
        if (triggerNeeded) {
          ScriptApp.newTrigger("hidePartyNotification")
            .timeBased()
            .after(1)
            .create();
        }
      }
    } else {
      scriptProperties.setProperty("hideAllNotifications", "true");
    }
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
        let properties = scriptProperties.getProperties();
        if (properties.hasOwnProperty("hideAllNotifications")) {
          scriptProperties.setProperty("hideAllNotifications", "pending");
          hideAllNotifications();
          if (scriptProperties.getProperty("hideAllNotifications") === "pending") {
            scriptProperties.deleteProperty("hideAllNotifications");
          } else {
            continue;
          }
        }
        let webhookData = properties["allocateStatPoints"];
        if (typeof webhookData !== "undefined") {
          allocateStatPoints(webhookData.points, webhookData.lvl);
          scriptProperties.deleteProperty("allocateStatPoints");
          continue;
        }
        let questKey = properties["pauseResumeDamage"];
        if (typeof questKey !== "undefined") {
          if (questKey === "true") {
            pauseResumeDamage();
          } else {
            pauseResumeDamage(questKey);
          }
          scriptProperties.deleteProperty("pauseResumeDamage");
          continue;
        }
        if (properties.hasOwnProperty("acceptQuestInvite")) {
          acceptQuestInvite();
          scriptProperties.deleteProperty("acceptQuestInvite");
          continue;
        }
        questKey = properties["notifyQuestEnded"];
        if (typeof questKey !== "undefined") {
          notifyQuestEnded(questKey);
          scriptProperties.deleteProperty("notifyQuestEnded");
          continue;
        }
        if (properties.hasOwnProperty("healParty")) {
          healParty();
          scriptProperties.deleteProperty("healParty");
          continue;
        }
        if (properties.hasOwnProperty("runCron")) {
          runCron();
          scriptProperties.deleteProperty("runCron");
          continue;
        }
        if (properties.hasOwnProperty("beforeCronSkills") && !webhook) {
          beforeCronSkills();
          scriptProperties.deleteProperty("beforeCronSkills");
          continue;
        }
        if (properties.hasOwnProperty("afterCronSkills") && !webhook) {
          afterCronSkills();
          scriptProperties.deleteProperty("afterCronSkills");
          continue;
        }
        if (properties.hasOwnProperty("purchaseGems")) {
          purchaseGems();
          scriptProperties.deleteProperty("purchaseGems");
          continue;
        }
        if (properties.hasOwnProperty("forceStartQuest")) {
          forceStartQuest();
          scriptProperties.deleteProperty("forceStartQuest");
          continue;
        }
        if (properties.hasOwnProperty("useExcessMana") && !webhook && !installing) {
          useExcessMana();
          scriptProperties.deleteProperty("useExcessMana");
          continue;
        }
        if (properties.hasOwnProperty("sellExtraFood") && !webhook) {
          sellExtraFood();
          scriptProperties.deleteProperty("sellExtraFood");
          continue;
        }
        if (properties.hasOwnProperty("sellExtraHatchingPotions") && !webhook) {
          sellExtraHatchingPotions();
          scriptProperties.deleteProperty("sellExtraHatchingPotions");
          continue;
        }
        if (properties.hasOwnProperty("sellExtraEggs") && !webhook) {
          sellExtraEggs();
          scriptProperties.deleteProperty("sellExtraEggs");
          continue;
        }
        if (properties.hasOwnProperty("hatchFeedPets") && !webhook && !installing) {
          hatchFeedPets();
          scriptProperties.deleteProperty("hatchFeedPets");
          continue;
        }
        let gold = properties["purchaseArmoires"];
        if (typeof gold !== "undefined" && !webhook && !installing) {
          if (gold === "true") {
            purchaseArmoires();
          } else {
            purchaseArmoires(Number(gold));
          }
          scriptProperties.deleteProperty("purchaseArmoires");
          continue;
        }
        break;
      }

      lock.releaseLock();
    }
  
  } catch (e) {
    if (!e.stack.includes("There are too many LockService operations against the same script") && !e.stack.includes("We're sorry, a server error occurred. Please wait a bit and try again.")) {
      throw e;
    }
  }
}

/**
 * interruptLoop()
 * 
 * Call this function after each iteration of an indefinite 
 * loop to check for urgent functions that should interrupt 
 * the loop. Returns true if the loop should stop early to 
 * avoid timing out or exceeding the URL Fetch limit.
 */
function interruptLoop() {
  while (true) {
    let properties = scriptProperties.getProperties();
    if (properties.hasOwnProperty("hideAllNotifications")) {
      scriptProperties.setProperty("hideAllNotifications", "pending");
      hideAllNotifications();
      if (scriptProperties.getProperty("hideAllNotifications") === "pending") {
        scriptProperties.deleteProperty("hideAllNotifications");
      } else {
        continue;
      }
    }
    let questKey = properties["pauseResumeDamage"];
    if (typeof questKey !== "undefined") {
      if (questKey === "true") {
        pauseResumeDamage();
      } else {
        pauseResumeDamage(questKey);
      }
      scriptProperties.deleteProperty("pauseResumeDamage");
    }
    if (properties.hasOwnProperty("acceptQuestInvite")) {
      acceptQuestInvite();
      scriptProperties.deleteProperty("acceptQuestInvite");
    }
    questKey = properties["notifyQuestEnded"];
    if (typeof questKey !== "undefined") {
      notifyQuestEnded(questKey);
      scriptProperties.deleteProperty("notifyQuestEnded");
    }
    break;
  }
  if (new Date().getTime() - scriptStart > 270000) {
    return true;
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
function beforeCronSkills(retry) {
  try {

    let playerClass = getUser().stats.class;
    if (playerClass == "warrior") {
      smashBossAndDumpMana();
    } else if (playerClass == "wizard") {
      burnBossAndDumpMana();
    } else if (playerClass == "healer") {
      castProtectiveAura(true);
    } else if (playerClass == "rogue") {
      castStealthAndDumpMana();
    }

  } catch (e) {
    if (!retry && e.stack.match(/Skill \\"[A-Za-z]+\\" not found/) !== null) {
      getUser(true);
      beforeCronSkills(true);
    } else {
      throw e;
    }
  }
}

/**
 * afterCronSkills()
 * 
 * Cast buffs until all mana is used up. Run this function 
 * just after the player's cron.
 */
function afterCronSkills(retry) {
  try {

    let playerClass = getUser().stats.class;
    if (playerClass == "warrior") {
      castValorousPresence(false);
    } else if (playerClass == "wizard") {
      castEarthquake(false);
    } else if (playerClass == "healer") {
      castProtectiveAura(false);
    } else if (playerClass == "rogue") {
      castToolsOfTheTrade(false);
    }

  } catch (e) {
    if (!retry && e.stack.match(/Skill \\"[A-Za-z]+\\" not found/) !== null) {
      getUser(true);
      afterCronSkills(true);
    } else {
      throw e;
    }
  }
}

/**
 * useExcessMana()
 * 
 * Use excess mana to cast buffs. Reserves all mana that 
 * will remain after cron, plus enough mana to do 3000 
 * damage to the quest boss.
 */
function useExcessMana(retry) {
  try {

    let playerClass = getUser().stats.class;
    if (playerClass == "warrior") {
      castValorousPresence(true);
    } else if (playerClass == "wizard") {
      castEarthquake(true);
    } else if (playerClass == "healer") {
      castProtectiveAura(false);
    } else if (playerClass == "rogue") {
      castToolsOfTheTrade(true);
    }

  } catch (e) {
    if (!retry && e.stack.match(/Skill \\"[A-Za-z]+\\" not found/) !== null) {
      getUser(true);
      useExcessMana(true);
    } else {
      throw e;
    }
  }
}

/**
 * fetch(url, params)
 * 
 * Wrapper for Google Apps Script's UrlFetchApp.fetch(url, params):
 * https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app#fetchurl,-params
 * 
 * Retries failed API calls up to 2 times, retries for up to 1 min if 
 * Habitica's servers are down, & handles Habitica's rate limiting.
 */
let rateLimitRemaining;
let rateLimitReset;
let apiResponseTime;
function fetch(url, params) {

  // try up to 3 times
  for (let i=0; i<3; i++) {

    // get rate limiting data
    let properties = scriptProperties.getProperties();
    let spaceOutAPICalls = true;
    if (properties.hasOwnProperty("hideAllNotifications") || properties.hasOwnProperty("acceptQuestInvite") || properties.hasOwnProperty("notifyQuestEnded")) {
      spaceOutAPICalls = false;
    }
    if (typeof rateLimitRemaining !== "undefined" && (spaceOutAPICalls || Number(rateLimitRemaining < 1))) {

      // space out API calls
      let waitUntil = new Date(rateLimitReset);
      waitUntil.setSeconds(waitUntil.getSeconds() + 1);
      Utilities.sleep(Math.max(Math.max(waitUntil.getTime() - new Date().getTime(), 0) / (Number(rateLimitRemaining) + 1) - apiResponseTime, 0));
    }

    // call API
    let response;
    while (true) {
      try {
        let beforeCalling = new Date();
        response = UrlFetchApp.fetch(url, params);
        apiResponseTime = new Date().getTime() - beforeCalling.getTime();
        break;

      // if address unavailable, wait 5 seconds & try again
      } catch (e) {
        if (!webhook && e.stack.includes("Address unavailable")) {
          Utilities.sleep(5000);
        } else {
          throw e;
        }
      }
    }

    // store rate limiting data
    rateLimitRemaining = response.getHeaders()["x-ratelimit-remaining"];
    rateLimitReset = response.getHeaders()["x-ratelimit-reset"];

    // if success, return response
    if (response.getResponseCode() < 300 || (response.getResponseCode() === 404 && (url === "https://habitica.com/api/v3/groups/party" || url.startsWith("https://habitica.com/api/v3/groups/party/members")))) {
      return response;

    // if rate limited due to running multiple scripts, try again
    } else if (response.getResponseCode() === 429) {
      i--;

    // if 3xx or 4xx or failed 3 times, throw exception
    } else if (response.getResponseCode() < 500 || i >= 2) {
      throw new Error("Request failed for https://habitica.com returned code " + response.getResponseCode() + ". Truncated server response: " + response.getContentText());
    }
  }
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

  // calculate stat from level, buffs, allocated
  let levelStat = Math.min(Math.floor(getUser(true).stats.lvl / 2), 50);
  let equipmentStat = 0;
  let buffsStat = user.stats.buffs[stat];
  let allocatedStat = user.stats[stat];

  // calculate stat from equipment
  for (let equipped of Object.values(user.items.gear.equipped)) {
    let equipment = getContent().gear.flat[equipped];
    if (typeof equipment !== "undefined") {
      equipmentStat += equipment[stat];
      if (equipment.klass == user.stats.class || ((equipment.klass == "special") && (equipment.specialClass == user.stats.class))) {
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
  for (let daily of getDailies()) {
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
        if (typeof user.party?._id !== "undefined") {
          scriptProperties.setProperty("PARTY_ID", user.party._id);
        }
        break;
      } catch (e) {
        if (i < 2 && (e.stack.includes("Unterminated string in JSON") || e.stack.includes("Expected ',' or '}' after property value in JSON at position") || e.stack.includes("Expected double-quoted property name in JSON at position"))) {
          continue;
        } else {
          throw e;
        }
      }
    }
    let savedPlayerClass = scriptProperties.getProperty("PLAYER_CLASS");
    playerClass = user.stats.class;
    if (playerClass == "wizard") {
      playerClass = "mage";
    }
    if (playerClass != savedPlayerClass) {
      if (savedPlayerClass !== null) {
        console.log("Player class changed to " + playerClass + ", saving new class");
      }
      scriptProperties.setProperty("PLAYER_CLASS", playerClass);
      if (AUTO_ALLOCATE_STAT_POINTS === true) {
        allocateStatPoints();
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
 * challenge tasks, group tasks, and rewards from the 
 * task list, and stores daily data in a separate object.
 */
let tasks;
function getTasks() {
  if (typeof tasks === "undefined") {
    for (let i=0; i<3; i++) {
      tasks = fetch("https://habitica.com/api/v3/tasks/user", GET_PARAMS);
      try {
        tasks = JSON.parse(tasks).data;
        break;
      } catch (e) {
        if (i < 2 && (e.stack.includes("Unterminated string in JSON") || e.stack.includes("Expected ',' or '}' after property value in JSON at position") || e.stack.includes("Expected double-quoted property name in JSON at position"))) {
          continue;
        } else {
          throw e;
        }
      }
    }
    dailies = [];
    for (let i=0; i<tasks.length; i++) {
      if (tasks[i].type == "reward") {
        tasks.splice(i, 1);
        i--;
      } else {
        if (tasks[i].type == "daily") {
          dailies.push(tasks[i]);
        }
        if (typeof tasks[i].challenge.id !== "undefined" || typeof tasks[i].group.id !== "undefined") {
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
        if (i < 2 && (e.stack.includes("Unterminated string in JSON") || e.stack.includes("Expected ',' or '}' after property value in JSON at position") || e.stack.includes("Expected double-quoted property name in JSON at position"))) {
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
        if (i < 2 && (e.stack.includes("Unterminated string in JSON") || e.stack.includes("Expected ',' or '}' after property value in JSON at position") || e.stack.includes("Expected double-quoted property name in JSON at position"))) {
          continue;
        } else {
          throw e;
        }
      }
    }
  }
  return content;
}

/**
 * reenableWebhooks()
 * 
 * Checks the script's webhooks and re-enables any that have 
 * been disabled. Temporary, until Google updates Google Apps 
 * Script to allow sending API responses manually.
 */
let reenabling;
function reenableWebhooks() {

  // for each Automate Habitica webhook
  for (let webhook of JSON.parse(fetch("https://habitica.com/api/v3/user/webhook", GET_PARAMS)).data) {
    if (webhook.url === WEB_APP_URL) {

      // if disabled
      if (!webhook.enabled) {
        reenabling = true;

        console.log(webhook.type + " webhook disabled, re-enabling...");

        // re-enable webhook
        let params = Object.assign({
          "contentType": "application/json",
          "payload": JSON.stringify({
            "enabled": true
          })
        }, PUT_PARAMS);
        fetch("https://habitica.com/api/v3/user/webhook/" + webhook.id, params);

        // add webhook tasks to the queue
        let enabledTypes = [];
        if (webhook.hasOwnProperty("options")) {
          for ([option, enabled] of Object.entries(webhook.options)) {
            if (enabled === true) {
              enabledTypes.push(option);
            }
          }
        }
        if (enabledTypes.length === 0) {
          enabledTypes.push(webhook.type);
        }
        if (enabledTypes.includes("scored") && !enabledTypes.includes("leveledUp")) {
          enabledTypes.push("leveledUp");
        }
        for (type of enabledTypes) {

          console.log("Adding " + type + " webhook tasks to the queue...");

          processWebhook({ webhookType: type });
        }
        reenabling = false;
      }
    }
  }
}