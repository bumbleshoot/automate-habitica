/**
 * Automate Habitica v0.18.6 (beta) by @bumbleshoot
 * 
 * See GitHub page for info & setup instructions:
 * https://github.com/bumbleshoot/automate-habitica
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

const AUTO_PURCHASE_GEMS = false;

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
const NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST = true;

const AUTO_UPDATE_QUEST_TRACKER = false;
const QUEST_TRACKER_SPREADSHEET_URL = "";
const QUEST_TRACKER_SPREADSHEET_TAB_NAME = "Sheet1";

/*************************************\
 *  DO NOT EDIT ANYTHING BELOW HERE  *
\*************************************/ 

function install() {

  // if settings are valid
  if (validateConstants()) {

    // delete triggers & webhooks
    deleteTriggers();
    deleteWebhooks();

    // run enabled automations
    processTrigger();
    processWebhook({
      webhookType: "leveledUp",
      taskType: "daily",
      isDue: true,
      gp: getUser(true).stats.gp,
      dropType: "All",
      statPoints: user.stats.points,
      lvl: user.stats.lvl
    });
    processWebhook({ webhookType: "questInvited" });
    processWebhook({ webhookType: "questStarted" });
    processWebhook({ webhookType: "questFinished" });
    processQueue(true);

    // create trigger & webhooks
    createTrigger();
    createWebhooks();

    console.log("Success!");
  }
}

function uninstall() {

  // delete triggers & webhooks
  deleteTriggers();
  deleteWebhooks();

  console.log("Done!");
}

function validateConstants() {

  let valid = true;

  if (typeof USER_ID !== "string" || USER_ID == "") {
    console.log("ERROR: USER_ID must equal your Habitica User ID.\n\neg. const USER_ID = \"abcd1234-ef56-gh78-ij90-abcdef123456\";\n\nYour Habitica User ID can be found at https://habitica.com/user/settings/api");
    valid = false;
  }

  if (typeof API_TOKEN !== "string" || API_TOKEN == "") {
    console.log("ERROR: API_TOKEN must equal your Habitica API Token.\n\neg. const API_TOKEN = \"abcd1234-ef56-gh78-ij90-abcdef123456\";\n\nYour Habitica API Token can be found at https://habitica.com/user/settings/api");
    valid = false;
  }

  if (valid) {
    try {
      getUser(true);
    } catch (e) {
      if (e.stack.includes("There is no account that uses those credentials")) {
        console.log("ERROR: Your USER_ID and/or API_TOKEN is incorrect. Both of these can be found at https://habitica.com/user/settings/api");
        valid = false;
      }
    }
  }

  if (typeof WEB_APP_URL !== "string" || WEB_APP_URL == "") {
    console.log("ERROR: WEB_APP_URL must equal the web app url of this project's deployment.\n\neg. const WEB_APP_URL = \"https://script.google.com/macros/s/abc123def456ghi789jkl012abc345de/exec\";");
    valid = false;
  }

  if (AUTO_CRON !== true && AUTO_CRON !== false) {
    console.log("ERROR: AUTO_CRON must equal either true or false.\n\neg. const AUTO_CRON = true;\n    const AUTO_CRON = false;");
    valid = false;
  }

  if (AUTO_ACCEPT_QUEST_INVITES !== true && AUTO_ACCEPT_QUEST_INVITES !== false) {
    console.log("ERROR: AUTO_ACCEPT_QUEST_INVITES must equal either true or false.\n\neg. const AUTO_ACCEPT_QUEST_INVITES = true;\n    const AUTO_ACCEPT_QUEST_INVITES = false;");
    valid = false;
  }

  if (NOTIFY_ON_QUEST_END !== true && NOTIFY_ON_QUEST_END !== false) {
    console.log("ERROR: NOTIFY_ON_QUEST_END must equal either true or false.\n\neg. const NOTIFY_ON_QUEST_END = true;\n    const NOTIFY_ON_QUEST_END = false;");
    valid = false;
  }

  if (AUTO_ALLOCATE_STAT_POINTS !== true && AUTO_ALLOCATE_STAT_POINTS !== false) {
    console.log("ERROR: AUTO_ALLOCATE_STAT_POINTS must equal either true or false.\n\neg. const AUTO_ALLOCATE_STAT_POINTS = true;\n    const AUTO_ALLOCATE_STAT_POINTS = false;");
    valid = false;
  }

  if (AUTO_ALLOCATE_STAT_POINTS === true) {
    if (!["str", "int", "con", "per"].includes(STAT_TO_ALLOCATE)) {
      console.log("ERROR: STAT_TO_ALLOCATE must be one of either \"str\", \"int\", \"con\", or \"per\".\n\neg. const STAT_TO_ALLOCATE = \"int\";\n    const STAT_TO_ALLOCATE = \"per\";")
      valid = false;
    }
  }

  if (AUTO_CAST_SKILLS !== true && AUTO_CAST_SKILLS !== false) {
    console.log("ERROR: AUTO_CAST_SKILLS must equal either true or false.\n\neg. const AUTO_CAST_SKILLS = true;\n    const AUTO_CAST_SKILLS = false;");
    valid = false;
  }

  if (AUTO_PAUSE_RESUME_DAMAGE !== true && AUTO_PAUSE_RESUME_DAMAGE !== false) {
    console.log("ERROR: AUTO_PAUSE_RESUME_DAMAGE must equal either true or false.\n\neg. const AUTO_PAUSE_RESUME_DAMAGE = true;\n    const AUTO_PAUSE_RESUME_DAMAGE = false;");
    valid = false;
  }

  if (AUTO_PAUSE_RESUME_DAMAGE === true) {
    if (typeof MAX_PLAYER_DAMAGE !== "number" || MAX_PLAYER_DAMAGE < 0 || MAX_PLAYER_DAMAGE >= 50) {
      console.log("ERROR: MAX_PLAYER_DAMAGE must be a positive number less than 50.\n\neg. const MAX_PLAYER_DAMAGE = 0;\n    const MAX_PLAYER_DAMAGE = 22.5;");
      valid = false;
    }

    if (typeof MAX_PARTY_DAMAGE !== "number" || MAX_PARTY_DAMAGE < 0 || MAX_PARTY_DAMAGE >= 50) {
      console.log("ERROR: MAX_PARTY_DAMAGE must be a positive number less than 50.\n\neg. const MAX_PARTY_DAMAGE = 0;\n    const MAX_PARTY_DAMAGE = 22.5;");
      valid = false;
    }
  }

  if (AUTO_PURCHASE_GEMS !== true && AUTO_PURCHASE_GEMS !== false) {
    console.log("ERROR: AUTO_PURCHASE_GEMS must equal either true or false.\n\neg. const AUTO_PURCHASE_GEMS = true;\n    const AUTO_PURCHASE_GEMS = false;");
    valid = false;
  }

  if (AUTO_PURCHASE_GEMS === true) {
    if (getUser().purchased.plan.consecutive.count === 0) {
      console.log("ERROR: Only subscribers can purchase gems with gold. Since you are not a subscriber, you should set AUTO_PURCHASE_GEMS to false.\n\neg. const AUTO_PURCHASE_GEMS = false;");
      valid = false;
    }
  }

  if (AUTO_PURCHASE_ARMOIRES !== true && AUTO_PURCHASE_ARMOIRES !== false) {
    console.log("ERROR: AUTO_PURCHASE_ARMOIRES must equal either true or false.\n\neg. const AUTO_PURCHASE_ARMOIRES = true;\n    const AUTO_PURCHASE_ARMOIRES = false;");
    valid = false;
  }

  if (AUTO_PURCHASE_ARMOIRES === true) {
    if (typeof RESERVE_GOLD !== "number" || RESERVE_GOLD < 0) {
      console.log("ERROR: RESERVE_GOLD must be a number greater than or equal to 0.\n\neg. const RESERVE_GOLD = 0;\n    const RESERVE_GOLD = 10000;\n    const RESERVE_GOLD = 235.25;");
      valid = false;
    }
  }

  if (AUTO_SELL_EGGS !== true && AUTO_SELL_EGGS !== false) {
    console.log("ERROR: AUTO_SELL_EGGS must equal either true or false.\n\neg. const AUTO_SELL_EGGS = true;\n    const AUTO_SELL_EGGS = false;");
    valid = false;
  }

  if (AUTO_SELL_EGGS === true) {
    if (typeof RESERVE_EGGS !== "number" || !Number.isInteger(RESERVE_EGGS) || RESERVE_EGGS < 0) {
      console.log("ERROR: RESERVE_EGGS must be a whole number greater than or equal to 0.\n\neg. const RESERVE_EGGS = 0;\n    const RESERVE_EGGS = 50;\n    const RESERVE_EGGS = 99;");
      valid = false;
    }
  }

  if (AUTO_SELL_HATCHING_POTIONS !== true && AUTO_SELL_HATCHING_POTIONS !== false) {
    console.log("ERROR: AUTO_SELL_HATCHING_POTIONS must equal either true or false.\n\neg. const AUTO_SELL_HATCHING_POTIONS = true;\n    const AUTO_SELL_HATCHING_POTIONS = false;");
    valid = false;
  }

  if (AUTO_SELL_HATCHING_POTIONS === true) {
    if (typeof RESERVE_HATCHING_POTIONS !== "number" || !Number.isInteger(RESERVE_HATCHING_POTIONS) || RESERVE_HATCHING_POTIONS < 0) {
      console.log("ERROR: RESERVE_HATCHING_POTIONS must be a whole number greater than or equal to 0.\n\neg. const RESERVE_HATCHING_POTIONS = 0;\n    const RESERVE_HATCHING_POTIONS = 50;\n    const RESERVE_HATCHING_POTIONS = 999;");
      valid = false;
    }
  }

  if (AUTO_SELL_FOOD !== true && AUTO_SELL_FOOD !== false) {
    console.log("ERROR: AUTO_SELL_FOOD must equal either true or false.\n\neg. const AUTO_SELL_FOOD = true;\n    const AUTO_SELL_FOOD = false;");
    valid = false;
  }

  if (AUTO_SELL_FOOD === true) {
    if (typeof RESERVE_FOOD !== "number" || !Number.isInteger(RESERVE_FOOD) || RESERVE_FOOD < 0) {
      console.log("ERROR: RESERVE_FOOD must be a whole number greater than or equal to 0.\n\neg. const RESERVE_FOOD = 0;\n    const RESERVE_FOOD = 50;\n    const RESERVE_FOOD = 999;");
      valid = false;
    }
  }

  if (AUTO_HATCH_FEED_PETS !== true && AUTO_HATCH_FEED_PETS !== false) {
    console.log("ERROR: AUTO_HATCH_FEED_PETS must equal either true or false.\n\neg. const AUTO_HATCH_FEED_PETS = true;\n    const AUTO_HATCH_FEED_PETS = false;");
    valid = false;
  }

  if (ONLY_USE_DROP_FOOD !== true && ONLY_USE_DROP_FOOD !== false) {
    console.log("ERROR: ONLY_USE_DROP_FOOD must equal either true or false.\n\neg. const ONLY_USE_DROP_FOOD = true;\n    const ONLY_USE_DROP_FOOD = false;");
    valid = false;
  }

  if (AUTO_START_QUESTS !== true && AUTO_START_QUESTS !== false) {
    console.log("ERROR: AUTO_START_QUESTS must equal either true or false.\n\neg. const AUTO_START_QUESTS = true;\n    const AUTO_START_QUESTS = false;");
    valid = false;
  }

  if (AUTO_START_QUESTS === true) {

    if (getParty().leader.id !== USER_ID) {
      console.log("ERROR: AUTO_START_QUESTS can only be run by the party leader.");
      valid = false;
    }

    if (typeof AUTO_START_QUESTS_AFTER_HOURS_MIN !== "number" || !Number.isInteger(AUTO_START_QUESTS_AFTER_HOURS_MIN) || AUTO_START_QUESTS_AFTER_HOURS_MIN < 1) {
      console.log("ERROR: AUTO_START_QUESTS_AFTER_HOURS_MIN must be a whole number greater than 0.\n\neg. const AUTO_START_QUESTS_AFTER_HOURS_MIN = 1;\n    const AUTO_START_QUESTS_AFTER_HOURS_MIN = 8;");
      valid = false;
    }

    if (NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST !== true && NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST !== false) {
      console.log("ERROR: NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST must equal either true or false.\n\neg. const NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST = true;\n    const NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST = false;");
      valid = false;
    }
  }

  if (AUTO_UPDATE_QUEST_TRACKER !== true && AUTO_UPDATE_QUEST_TRACKER !== false) {
    console.log("ERROR: AUTO_UPDATE_QUEST_TRACKER must equal either true or false.\n\neg. const AUTO_UPDATE_QUEST_TRACKER = true;\n    const AUTO_UPDATE_QUEST_TRACKER = false;");
    valid = false;
  }

  if (AUTO_UPDATE_QUEST_TRACKER === true) {

    if (getParty().leader.id !== USER_ID) {
      console.log("WARNING: AUTO_UPDATE_QUEST_TRACKER should only be run by one party member (preferably the party leader).");
    }

    if (typeof QUEST_TRACKER_SPREADSHEET_URL !== "string" || !QUEST_TRACKER_SPREADSHEET_URL.startsWith("https://docs.google.com/spreadsheets/d/") || QUEST_TRACKER_SPREADSHEET_URL.match(/[^\/]{44}/) === null) {
      console.log("ERROR: QUEST_TRACKER_SPREADSHEET_URL must equal the URL of the Google Sheet that contains the Quest Tracker tab. You can copy this URL from your address bar while viewing the spreadsheet in a web browser.\n\neg. const QUEST_TRACKER_SPREADSHEET_URL = \"https://docs.google.com/spreadsheets/d/1YbiVoNxP6q08KFPY01ARa3bNv8MDhBtRx41fBqPWN2o\";");
      valid = false;
    } else {
      try {
        var questTrackerSpreadsheet = SpreadsheetApp.openById(QUEST_TRACKER_SPREADSHEET_URL.match(/[^\/]{44}/)[0]);
      } catch (e) {
        if (e.stack.includes("Unexpected error while getting the method or property openById on object SpreadsheetApp")) {
          console.log("ERROR: QUEST_TRACKER_SPREADSHEET_URL not found: " + QUEST_TRACKER_SPREADSHEET_URL);
          valid = false;
        } else {
          throw e;
        }
      }
    }

    if (typeof QUEST_TRACKER_SPREADSHEET_TAB_NAME !== "string" || QUEST_TRACKER_SPREADSHEET_TAB_NAME == "") {
      console.log("ERROR: QUEST_TRACKER_SPREADSHEET_TAB_NAME must equal the name of the Quest Tracker tab.\n\neg. const QUEST_TRACKER_SPREADSHEET_TAB_NAME = \"Quest Tracker\";");
      valid = false;
    } else if (typeof questTrackerSpreadsheet !== "undefined" && questTrackerSpreadsheet.getSheetByName(QUEST_TRACKER_SPREADSHEET_TAB_NAME) === null) {
      console.log("ERROR: QUEST_TRACKER_SPREADSHEET_TAB_NAME \"" + QUEST_TRACKER_SPREADSHEET_TAB_NAME + "\" doesn't exist.");
      valid = false;
    }
  }

  if (!valid) {
    console.log("Please fix the above errors, create a new version of the existing deployment (or create a new deployment if you haven't created one already), then run the install function again.");
  }

  return valid;
}

function deleteTriggers() {
  let triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {

    console.log("Deleting triggers");

    for (trigger of triggers) {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

function createTrigger() {
  
  // create trigger if needed for enabled automations
  if (AUTO_CRON === true || AUTO_CAST_SKILLS === true || AUTO_ACCEPT_QUEST_INVITES === true || AUTO_START_QUESTS === true || AUTO_PAUSE_RESUME_DAMAGE === true || AUTO_PURCHASE_GEMS === true || AUTO_PURCHASE_ARMOIRES === true) {

    console.log("Creating trigger");

    ScriptApp.newTrigger("onTrigger")
      .timeBased()
      .everyMinutes(10)
      .create();
  }
}

function deleteWebhooks() {
  let webhooks = JSON.parse(fetch("https://habitica.com/api/v3/user/webhook", GET_PARAMS)).data;
  if (webhooks.length > 0) {

    console.log("Deleting webhooks");

    for (webhook of webhooks) {
      if (webhook.url == WEB_APP_URL) {
        fetch("https://habitica.com/api/v3/user/webhook/" + webhook.id, DELETE_PARAMS);
      }
    }
  }
}

function createWebhooks() {

  // task scored
  let webhooks = [];
  if (AUTO_CAST_SKILLS === true || AUTO_PAUSE_RESUME_DAMAGE === true || AUTO_PURCHASE_GEMS === true || AUTO_PURCHASE_ARMOIRES === true || AUTO_SELL_EGGS === true || AUTO_SELL_HATCHING_POTIONS === true || AUTO_SELL_FOOD === true || AUTO_HATCH_FEED_PETS === true) {
    webhooks.push({
      "type": "taskActivity",
      "options": {
        "scored": true
      }
    });
  }

  // level up
  if (AUTO_ALLOCATE_STAT_POINTS === true || AUTO_PAUSE_RESUME_DAMAGE === true) { // scored webhook doesn't fire if scoring a task causes level up (submitted bug report for this 2021-12-05)
    webhooks.push({
      "type": "userActivity",
      "options": {
        "leveledUp": true
      }
    });
  }

  let questActivityOptions = {};

  // quest invited
  if (AUTO_ACCEPT_QUEST_INVITES === true || AUTO_START_QUESTS === true || NOTIFY_ON_QUEST_END === true || AUTO_PAUSE_RESUME_DAMAGE === true) {
    Object.assign(questActivityOptions, {
      "questInvited": true
    });
  }

  // quest started
  if (AUTO_START_QUESTS === true) {
    Object.assign(questActivityOptions, {
      "questStarted": true
    });
  }

  // quest finished
  if (NOTIFY_ON_QUEST_END === true || AUTO_PURCHASE_GEMS === true || AUTO_PURCHASE_ARMOIRES === true || AUTO_SELL_EGGS === true || AUTO_SELL_HATCHING_POTIONS === true || AUTO_SELL_FOOD === true || AUTO_HATCH_FEED_PETS === true || AUTO_UPDATE_QUEST_TRACKER === true) {
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

  // create webhooks
  if (webhooks.length > 0) {
    
    console.log("Creating webhooks");

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
}