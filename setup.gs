/**
 * Automate Habitica v0.11.1 (beta) by @bumbleshoot
 * 
 * See wiki page for info & setup instructions:
 * https://habitica.fandom.com/wiki/Automate_Habitica
 */

const USER_ID = "";
const API_TOKEN = "";
const WEB_APP_URL = "";

const AUTO_CRON = true; // true or false

const AUTO_ACCEPT_QUEST_INVITES = true;

const NOTIFY_ON_QUEST_END = true;

const AUTO_ALLOCATE_STAT_POINTS = false;
const STAT_TO_ALLOCATE = "int"; // str, int, con, per

const AUTO_CAST_SKILLS = false;

const AUTO_PAUSE_RESUME_DAMAGE = true;
const MAX_PLAYER_DAMAGE = 20;
const MAX_PARTY_DAMAGE = 5;

const AUTO_PURCHASE_ARMOIRES = false;
const RESERVE_GOLD = 50000;

const AUTO_SELL_EGGS = false;
const RESERVE_EGGS = 999;

const AUTO_SELL_HATCHING_POTIONS = false;
const RESERVE_HATCHING_POTIONS = 999;

const AUTO_SELL_FOOD = false;
const RESERVE_FOOD = 999;

const AUTO_HATCH_FEED_PETS = false;
const ONLY_USE_DROP_FOOD = false;

/************************\
 *  PARTY LEADERS ONLY  *
\************************/ 

const AUTO_START_QUESTS = false;
const AUTO_START_QUESTS_AFTER_HOURS_MIN = 4; // eg. if set to 1, quests will auto start in 1-2 hours

const AUTO_UPDATE_QUEST_TRACKER = false;
const QUEST_TRACKER_SPREADSHEET_URL = "";
const QUEST_TRACKER_SPREADSHEET_TAB_NAME = "Sheet1";

/************************\
 *  FOR DEBUGGING ONLY  *
\************************/

const LOG_SCRIPT_OUTPUT = false;
const LOG_SPREADSHEET_URL = "";
const LOG_SPREADSHEET_TAB_NAME = "Sheet1";
const LOG_SPREADSHEET_MAX_ROWS = 2000;

/*************************************\
 *  DO NOT EDIT ANYTHING BELOW HERE  *
\*************************************/ 

function install() {
  try {

    // if settings are valid
    if (validateConstants()) {

      // create trigger & webhooks
      createTrigger();
      createWebhooks();

      // run enabled automations
      processTrigger();
      if (AUTO_ACCEPT_QUEST_INVITES === true || AUTO_START_QUESTS === true || NOTIFY_ON_QUEST_END === true) {
        scriptProperties.setProperty("saveQuestName", "true");
      }
      if (AUTO_ALLOCATE_STAT_POINTS === true) {
        scriptProperties.setProperty("allocateStatPoints", "true");
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
      processQueue();

      log("Success!");
    }

  } catch (e) {
    log(e);
    throw e;
  }
}

function uninstall() {
  try {

    // delete trigger & webhooks
    deleteTriggers();
    deleteWebhooks();

    log("Done!");

  } catch (e) {
    log(e);
    throw e;
  }
}

function validateConstants() {
  try {

    let valid = true;

    if (typeof USER_ID !== "string" || USER_ID == "") {
      log("ERROR: USER_ID must equal your Habitica User ID.\n\neg. const USER_ID = \"abcd1234-ef56-gh78-ij90-abcdef123456\";\n\nYour Habitica User ID can be found at https://habitica.com/user/settings/api");
      valid = false;
    }

    if (typeof API_TOKEN !== "string" || API_TOKEN == "") {
      log("ERROR: API_TOKEN must equal your Habitica API Token.\n\neg. const API_TOKEN = \"abcd1234-ef56-gh78-ij90-abcdef123456\";\n\nYour Habitica API Token can be found at https://habitica.com/user/settings/api");
      valid = false;
    }

    if (valid) {
      try {
        getUser(true);
      } catch (e) {
        if (e.stack.includes("There is no account that uses those credentials")) {
          log("ERROR: Your USER_ID and/or API_TOKEN is incorrect. Both of these can be found at https://habitica.com/user/settings/api");
          valid = false;
        }
      }
    }

    if (typeof WEB_APP_URL !== "string" || WEB_APP_URL == "") {
      log("ERROR: WEB_APP_URL must equal the web app url of this project's deployment.\n\neg. const WEB_APP_URL = \"https://script.google.com/macros/s/abc123def456ghi789jkl012abc345de/exec\";");
      valid = false;
    }

    if (AUTO_CRON !== true && AUTO_CRON !== false) {
      log("ERROR: AUTO_CRON must equal either true or false.\n\neg. const AUTO_CRON = true;\n    const AUTO_CRON = false;");
      valid = false;
    }

    if (AUTO_ACCEPT_QUEST_INVITES !== true && AUTO_ACCEPT_QUEST_INVITES !== false) {
      log("ERROR: AUTO_ACCEPT_QUEST_INVITES must equal either true or false.\n\neg. const AUTO_ACCEPT_QUEST_INVITES = true;\n    const AUTO_ACCEPT_QUEST_INVITES = false;");
      valid = false;
    }

    if (NOTIFY_ON_QUEST_END !== true && NOTIFY_ON_QUEST_END !== false) {
      log("ERROR: NOTIFY_ON_QUEST_END must equal either true or false.\n\neg. const NOTIFY_ON_QUEST_END = true;\n    const NOTIFY_ON_QUEST_END = false;");
      valid = false;
    }

    if (AUTO_ALLOCATE_STAT_POINTS !== true && AUTO_ALLOCATE_STAT_POINTS !== false) {
      log("ERROR: AUTO_ALLOCATE_STAT_POINTS must equal either true or false.\n\neg. const AUTO_ALLOCATE_STAT_POINTS = true;\n    const AUTO_ALLOCATE_STAT_POINTS = false;");
      valid = false;
    }

    if (AUTO_ALLOCATE_STAT_POINTS === true) {
      if (!["str", "int", "con", "per"].includes(STAT_TO_ALLOCATE)) {
        log("ERROR: STAT_TO_ALLOCATE must be one of either \"str\", \"int\", \"con\", or \"per\".\n\neg. const STAT_TO_ALLOCATE = \"int\";\n    const STAT_TO_ALLOCATE = \"per\";")
        valid = false;
      }
    }

    if (AUTO_CAST_SKILLS !== true && AUTO_CAST_SKILLS !== false) {
      log("ERROR: AUTO_CAST_SKILLS must equal either true or false.\n\neg. const AUTO_CAST_SKILLS = true;\n    const AUTO_CAST_SKILLS = false;");
      valid = false;
    }

    if (AUTO_PAUSE_RESUME_DAMAGE !== true && AUTO_PAUSE_RESUME_DAMAGE !== false) {
      log("ERROR: AUTO_PAUSE_RESUME_DAMAGE must equal either true or false.\n\neg. const AUTO_PAUSE_RESUME_DAMAGE = true;\n    const AUTO_PAUSE_RESUME_DAMAGE = false;");
      valid = false;
    }

    if (AUTO_PAUSE_RESUME_DAMAGE === true) {
      if (typeof MAX_PLAYER_DAMAGE !== "number" || MAX_PLAYER_DAMAGE < 0 || MAX_PLAYER_DAMAGE >= 50) {
        log("ERROR: MAX_PLAYER_DAMAGE must be a positive number less than 50.\n\neg. const MAX_PLAYER_DAMAGE = 0;\n    const MAX_PLAYER_DAMAGE = 22.5;");
        valid = false;
      }

      if (typeof MAX_PARTY_DAMAGE !== "number" || MAX_PARTY_DAMAGE < 0 || MAX_PARTY_DAMAGE >= 50) {
        log("ERROR: MAX_PARTY_DAMAGE must be a positive number less than 50.\n\neg. const MAX_PARTY_DAMAGE = 0;\n    const MAX_PARTY_DAMAGE = 22.5;");
        valid = false;
      }
    }

    if (AUTO_PURCHASE_ARMOIRES !== true && AUTO_PURCHASE_ARMOIRES !== false) {
      log("ERROR: AUTO_PURCHASE_ARMOIRES must equal either true or false.\n\neg. const AUTO_PURCHASE_ARMOIRES = true;\n    const AUTO_PURCHASE_ARMOIRES = false;");
      valid = false;
    }

    if (AUTO_PURCHASE_ARMOIRES === true) {
      if (typeof RESERVE_GOLD !== "number" || RESERVE_GOLD < 0) {
        log("ERROR: RESERVE_GOLD must be a number greater than or equal to 0.\n\neg. const RESERVE_GOLD = 0;\n    const RESERVE_GOLD = 10000;\n    const RESERVE_GOLD = 235.25;");
        valid = false;
      }
    }

    if (AUTO_SELL_EGGS !== true && AUTO_SELL_EGGS !== false) {
      log("ERROR: AUTO_SELL_EGGS must equal either true or false.\n\neg. const AUTO_SELL_EGGS = true;\n    const AUTO_SELL_EGGS = false;");
      valid = false;
    }

    if (AUTO_SELL_EGGS === true) {
      if (typeof RESERVE_EGGS !== "number" || !Number.isInteger(RESERVE_EGGS) || RESERVE_EGGS < 0) {
        log("ERROR: RESERVE_EGGS must be a whole number greater than or equal to 0.\n\neg. const RESERVE_EGGS = 0;\n    const RESERVE_EGGS = 50;\n    const RESERVE_EGGS = 99;");
        valid = false;
      }
    }

    if (AUTO_SELL_HATCHING_POTIONS !== true && AUTO_SELL_HATCHING_POTIONS !== false) {
      log("ERROR: AUTO_SELL_HATCHING_POTIONS must equal either true or false.\n\neg. const AUTO_SELL_HATCHING_POTIONS = true;\n    const AUTO_SELL_HATCHING_POTIONS = false;");
      valid = false;
    }

    if (AUTO_SELL_HATCHING_POTIONS === true) {
      if (typeof RESERVE_HATCHING_POTIONS !== "number" || !Number.isInteger(RESERVE_HATCHING_POTIONS) || RESERVE_HATCHING_POTIONS < 0) {
        log("ERROR: RESERVE_HATCHING_POTIONS must be a whole number greater than or equal to 0.\n\neg. const RESERVE_HATCHING_POTIONS = 0;\n    const RESERVE_HATCHING_POTIONS = 50;\n    const RESERVE_HATCHING_POTIONS = 999;");
        valid = false;
      }
    }

    if (AUTO_SELL_FOOD !== true && AUTO_SELL_FOOD !== false) {
      log("ERROR: AUTO_SELL_FOOD must equal either true or false.\n\neg. const AUTO_SELL_FOOD = true;\n    const AUTO_SELL_FOOD = false;");
      valid = false;
    }

    if (AUTO_SELL_FOOD === true) {
      if (typeof RESERVE_FOOD !== "number" || !Number.isInteger(RESERVE_FOOD) || RESERVE_FOOD < 0) {
        log("ERROR: RESERVE_FOOD must be a whole number greater than or equal to 0.\n\neg. const RESERVE_FOOD = 0;\n    const RESERVE_FOOD = 50;\n    const RESERVE_FOOD = 999;");
        valid = false;
      }
    }

    if (AUTO_HATCH_FEED_PETS !== true && AUTO_HATCH_FEED_PETS !== false) {
      log("ERROR: AUTO_HATCH_FEED_PETS must equal either true or false.\n\neg. const AUTO_HATCH_FEED_PETS = true;\n    const AUTO_HATCH_FEED_PETS = false;");
      valid = false;
    }

    if (ONLY_USE_DROP_FOOD !== true && ONLY_USE_DROP_FOOD !== false) {
      log("ERROR: ONLY_USE_DROP_FOOD must equal either true or false.\n\neg. const ONLY_USE_DROP_FOOD = true;\n    const ONLY_USE_DROP_FOOD = false;");
      valid = false;
    }

    if (AUTO_START_QUESTS !== true && AUTO_START_QUESTS !== false) {
      log("ERROR: AUTO_START_QUESTS must equal either true or false.\n\neg. const AUTO_START_QUESTS = true;\n    const AUTO_START_QUESTS = false;");
      valid = false;
    }

    if (AUTO_START_QUESTS === true) {

      if (getParty().data.leader.id !== USER_ID) {
        log("ERROR: AUTO_START_QUESTS can only be run by the party leader.");
        valid = false;
      }

      if (typeof AUTO_START_QUESTS_AFTER_HOURS_MIN !== "number" || !Number.isInteger(AUTO_START_QUESTS_AFTER_HOURS_MIN) || AUTO_START_QUESTS_AFTER_HOURS_MIN < 1) {
        log("ERROR: AUTO_START_QUESTS_AFTER_HOURS_MIN must be a whole number greater than 0.\n\neg. const AUTO_START_QUESTS_AFTER_HOURS_MIN = 1;\n    const AUTO_START_QUESTS_AFTER_HOURS_MIN = 8;");
        valid = false;
      }
    }

    if (AUTO_UPDATE_QUEST_TRACKER !== true && AUTO_UPDATE_QUEST_TRACKER !== false) {
      log("ERROR: AUTO_UPDATE_QUEST_TRACKER must equal either true or false.\n\neg. const AUTO_UPDATE_QUEST_TRACKER = true;\n    const AUTO_UPDATE_QUEST_TRACKER = false;");
      valid = false;
    }

    if (AUTO_UPDATE_QUEST_TRACKER === true) {

      if (getParty().data.leader.id !== USER_ID) {
        log("WARNING: AUTO_UPDATE_QUEST_TRACKER should only be run by one party member (preferably the party leader).");
      }

      if (typeof QUEST_TRACKER_SPREADSHEET_URL !== "string" || !QUEST_TRACKER_SPREADSHEET_URL.startsWith("https://docs.google.com/spreadsheets/d/") || QUEST_TRACKER_SPREADSHEET_URL.match(/[^\/]{44}/) === null) {
        log("ERROR: QUEST_TRACKER_SPREADSHEET_URL must equal the URL of the Google Sheet that contains the Quest Tracker tab. You can copy this URL from your address bar while viewing the spreadsheet in a web browser.\n\neg. const QUEST_TRACKER_SPREADSHEET_URL = \"https://docs.google.com/spreadsheets/d/1YbiVoNxP6q08KFPY01ARa3bNv8MDhBtRx41fBqPWN2o\";");
        valid = false;
      } else {
        try {
          var questTrackerSpreadsheet = SpreadsheetApp.openById(QUEST_TRACKER_SPREADSHEET_URL.match(/[^\/]{44}/)[0]);
        } catch (e) {
          if (e.stack.includes("Unexpected error while getting the method or property openById on object SpreadsheetApp")) {
            log("ERROR: QUEST_TRACKER_SPREADSHEET_URL not found: " + QUEST_TRACKER_SPREADSHEET_URL);
            valid = false;
          } else {
            throw e;
          }
        }
      }

      if (typeof QUEST_TRACKER_SPREADSHEET_TAB_NAME !== "string" || QUEST_TRACKER_SPREADSHEET_TAB_NAME == "") {
        log("ERROR: QUEST_TRACKER_SPREADSHEET_TAB_NAME must equal the name of the Quest Tracker tab.\n\neg. const QUEST_TRACKER_SPREADSHEET_TAB_NAME = \"Quest Tracker\";");
        valid = false;
      } else if (typeof questTrackerSpreadsheet !== "undefined" && questTrackerSpreadsheet.getSheetByName(QUEST_TRACKER_SPREADSHEET_TAB_NAME) === null) {
        log("ERROR: QUEST_TRACKER_SPREADSHEET_TAB_NAME \"" + QUEST_TRACKER_SPREADSHEET_TAB_NAME + "\" doesn't exist.");
        valid = false;
      }
    }

    if (typeof LOG_SCRIPT_OUTPUT !== "undefined" && (LOG_SCRIPT_OUTPUT !== true && LOG_SCRIPT_OUTPUT !== false)) {
      log("ERROR: LOG_SCRIPT_OUTPUT must equal either true or false.\n\neg. const LOG_SCRIPT_OUTPUT = true;\n    const LOG_SCRIPT_OUTPUT = false;");
      valid = false;
    }

    if (typeof LOG_SCRIPT_OUTPUT !== "undefined" && LOG_SCRIPT_OUTPUT === true) {

      if (typeof LOG_SPREADSHEET_URL !== "string" || !LOG_SPREADSHEET_URL.startsWith("https://docs.google.com/spreadsheets/d/") || LOG_SPREADSHEET_URL.match(/[^\/]{44}/) === null) {
        log("ERROR: LOG_SPREADSHEET_URL must equal the URL of the Google Sheet you want to log script output to. You can copy this URL from your address bar while viewing the spreadsheet in a web browser.\n\neg. const LOG_SPREADSHEET_URL = \"https://docs.google.com/spreadsheets/d/1YbiVoNxP6q08KFPY01ARa3bNv8MDhBtRx41fBqPWN2o\";");
        valid = false;
      } else {
        try {
          var logSpreadsheet = SpreadsheetApp.openById(LOG_SPREADSHEET_URL.match(/[^\/]{44}/)[0]);
        } catch (e) {
          if (e.stack.includes("Unexpected error while getting the method or property openById on object SpreadsheetApp")) {
            log("ERROR: LOG_SPREADSHEET_URL not found: " + LOG_SPREADSHEET_URL);
            valid = false;
          } else {
            throw e;
          }
        }
      }

      if (typeof LOG_SPREADSHEET_TAB_NAME !== "string" || LOG_SPREADSHEET_TAB_NAME == "") {
        log("ERROR: LOG_SPREADSHEET_TAB_NAME must equal the name of the tab in the log spreadsheet that you want to log script output to.\n\neg. const LOG_SPREADSHEET_TAB_NAME = \"Script Output\";");
        valid = false;
      } else if (typeof logSpreadsheet !== "undefined" && logSpreadsheet.getSheetByName(LOG_SPREADSHEET_TAB_NAME) === null) {
        log("ERROR: LOG_SPREADSHEET_TAB_NAME \"" + LOG_SPREADSHEET_TAB_NAME + "\" doesn't exist.");
        valid = false;
      }

      if (typeof LOG_SPREADSHEET_MAX_ROWS !== "number" || !Number.isInteger(LOG_SPREADSHEET_MAX_ROWS) || LOG_SPREADSHEET_MAX_ROWS < 1) {
        log("ERROR: LOG_SPREADSHEET_MAX_ROWS must be a whole number greater than 0.\n\neg. const LOG_SPREADSHEET_MAX_ROWS = 100;\n    const LOG_SPREADSHEET_MAX_ROWS = 1000;");
        valid = false;
      }
    }

    if (!valid) {
      log("Please fix the above errors, create a new version of the existing deployment (or create a new deployment if you haven't created one already), then run the install function again.");
    }

    return valid;

  } catch (e) {
    log(e);
    throw e;
  }
}

function deleteTriggers() {
  try {

    let triggers = ScriptApp.getProjectTriggers();
    if (triggers.length > 0) {

      log("Deleting triggers");

      triggers.forEach(trigger => {
        ScriptApp.deleteTrigger(trigger);
      });
    }

  } catch (e) {
    log(e);
    throw e;
  }
}

function createTrigger() {
  try {

    // delete existing trigger for this script
    deleteTriggers();
    
    // create trigger if needed for enabled automations
    if (AUTO_CRON === true || AUTO_CAST_SKILLS === true || AUTO_ACCEPT_QUEST_INVITES === true || AUTO_START_QUESTS === true || AUTO_PAUSE_RESUME_DAMAGE === true || AUTO_PURCHASE_ARMOIRES === true) {

      log("Creating trigger");

      ScriptApp.newTrigger("onTrigger")
        .timeBased()
        .everyMinutes(10)
        .create();
    }

  } catch (e) {
    log(e);
    throw e;
  }
}

function deleteWebhooks() {
  try {

    let logged = false;
    JSON.parse(fetch("https://habitica.com/api/v3/user/webhook", GET_PARAMS)).data.forEach(webhook => {
      if (webhook.url == WEB_APP_URL) {
        if (!logged) {
          log("Deleting webhooks");
          logged = true;
        }
        fetch("https://habitica.com/api/v3/user/webhook/" + webhook.id, DELETE_PARAMS);
      }
    });

  } catch (e) {
    log(e);
    throw e;
  }
}

function createWebhooks() {
  try {

    // delete existing webhooks for this script
    deleteWebhooks();

    // create webhooks for enabled automations
    let webhooks = [];
    if (AUTO_CAST_SKILLS === true || AUTO_PAUSE_RESUME_DAMAGE === true || AUTO_PURCHASE_ARMOIRES === true || AUTO_SELL_EGGS === true || AUTO_SELL_HATCHING_POTIONS === true || AUTO_SELL_FOOD === true || AUTO_HATCH_FEED_PETS === true) {
      webhooks.push({
        "type": "taskActivity",
        "options": {
          "scored": true
        }
      });
    }
    if (AUTO_ALLOCATE_STAT_POINTS === true || AUTO_PAUSE_RESUME_DAMAGE === true) { // scored webhook doesn't fire if scoring a task causes level up (submitted bug report for this 2021-12-05)
      webhooks.push({
        "type": "userActivity",
        "options": {
          "leveledUp": true
        }
      });
    }
    let questActivityOptions = {};
    if (AUTO_ACCEPT_QUEST_INVITES === true || AUTO_START_QUESTS === true || NOTIFY_ON_QUEST_END === true || AUTO_PAUSE_RESUME_DAMAGE === true) {
      Object.assign(questActivityOptions, {
        "questInvited": true
      });
    }
    if (AUTO_START_QUESTS === true) {
      Object.assign(questActivityOptions, {
        "questStarted": true
      });
    }
    if (NOTIFY_ON_QUEST_END === true || AUTO_PURCHASE_ARMOIRES === true || AUTO_SELL_EGGS === true || AUTO_SELL_HATCHING_POTIONS === true || AUTO_SELL_FOOD === true || AUTO_HATCH_FEED_PETS === true || AUTO_UPDATE_QUEST_TRACKER === true) {
      Object.assign(questActivityOptions, {
        "questFinished": true
      });
    }
    if (Object.keys(questActivityOptions).length > 0) {
      webhooks.push({
        "type": "questActivity",
        "options": questActivityOptions
      });
    }
    if (webhooks.length > 0) {
      
      log("Creating webhooks");

      for (webhook of webhooks) {
        webhook = Object.assign({
          "url": WEB_APP_URL,
          "label": DriveApp.getFileById(ScriptApp.getScriptId()).getName()
        }, webhook);
        webhook = Object.assign(
          POST_PARAMS,
          {
            "contentType": "application/json",
            "payload": JSON.stringify(webhook)
          }
        );
        fetch("https://habitica.com/api/v3/user/webhook", webhook);
      }
    }

  } catch (e) {
    log(e);
    throw e;
  }
}