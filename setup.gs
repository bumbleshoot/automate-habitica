/**
 * Automate Habitica v0.29.25 (beta) by @bumbleshoot
 *
 * See GitHub page for info & setup instructions:
 * https://github.com/bumbleshoot/automate-habitica
 */

const USER_ID = "";
const API_TOKEN = "";
const WEB_APP_URL = "";

const AUTO_CRON = false; // true or false

const AUTO_ACCEPT_QUEST_INVITES = true;

const FORCE_START_QUESTS = false; // party leaders only
const FORCE_START_QUESTS_AFTER_HOURS = 1; // eg. if set to 1, quests will force start after 1h
const NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST = true;

const AUTO_INVITE_GOLD_QUESTS = false;
const AUTO_INVITE_UNLOCKABLE_QUESTS = false;
const AUTO_INVITE_PET_QUESTS = false;
const AUTO_INVITE_HOURGLASS_QUESTS = false;
const PM_WHEN_OUT_OF_QUEST_SCROLLS = true;

const NOTIFY_ON_QUEST_END = true;

const AUTO_CAST_SKILLS = false;

const AUTO_PAUSE_RESUME_DAMAGE = true;
const MAX_PLAYER_DAMAGE = 20;
const MAX_PARTY_DAMAGE = 5;

const AUTO_ALLOCATE_STAT_POINTS = false;
const STAT_TO_ALLOCATE = "int"; // str, int, con, per

const AUTO_PURCHASE_GEMS = false; // subscribers only

const AUTO_PURCHASE_ARMOIRES = false;
const RESERVE_GOLD = 50000;

const AUTO_SELL_EGGS = false;
const RESERVE_EGGS = 999;

const AUTO_SELL_HATCHING_POTIONS = false;
const RESERVE_HATCHING_POTIONS = 999;

const AUTO_SELL_FOOD = false;
const RESERVE_FOOD = 999;

const AUTO_HATCH_FEED_PETS = false;
const ONLY_USE_DROP_FOOD = true;

const HIDE_PARTY_NOTIFICATIONS = false;
const HIDE_ALL_GUILD_NOTIFICATIONS = false;
const HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS = [ // only used if HIDE_ALL_GUILD_NOTIFICATIONS is false
  "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // enter a guild ID between the quotes to hide notifications from that guild
  "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" // repeat for as many guilds as you want
]

/*************************************\
 *  DO NOT EDIT ANYTHING BELOW HERE  *
\*************************************/

let installing;
function install() {

  installing = true;

  // if settings are valid
  if (validateConstants()) {

    // delete triggers & webhooks
    deleteTriggers();
    deleteWebhooks();

    // empty queue
    for (let property of Object.keys(scriptProperties.getProperties())) {
      if (property.match(/^[a-z]/) !== null) {
        scriptProperties.deleteProperty(property);
      }
    }

    // queue enabled automations
    processTrigger();
    processWebhook({
      webhookType: "scored",
      taskType: "daily",
      isDue: true,
      gp: getUser(true).stats.gp,
      dropType: "All"
    });
    processWebhook({
      webhookType: "leveledUp",
      statPoints: user.stats.points,
      lvl: user.stats.lvl
    });
    processWebhook({
      webhookType: "questInvited",
      questKey: user.party.quest.key
    });
    processWebhook({ webhookType: "questStarted" });
    processWebhook({ webhookType: "questFinished" });
    if (HIDE_PARTY_NOTIFICATIONS === true && typeof user.party?._id !== "undefined") {
      hidePartyNotification();
    }
    processWebhook({ webhookType: "groupChatReceived" });

    // process queue
    processQueue();

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
      } else {
        throw e;
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

  if (FORCE_START_QUESTS !== true && FORCE_START_QUESTS !== false) {
    console.log("ERROR: FORCE_START_QUESTS must equal either true or false.\n\neg. const FORCE_START_QUESTS = true;\n    const FORCE_START_QUESTS = false;");
    valid = false;
  }

  if (FORCE_START_QUESTS === true) {

    if (typeof getParty() === "undefined" || party.leader.id !== USER_ID) {
      console.log("ERROR: FORCE_START_QUESTS can only be run by party leaders.");
      valid = false;
    }

    if (typeof FORCE_START_QUESTS_AFTER_HOURS !== "number" || !Number.isInteger(FORCE_START_QUESTS_AFTER_HOURS) || FORCE_START_QUESTS_AFTER_HOURS < 1) {
      console.log("ERROR: FORCE_START_QUESTS_AFTER_HOURS must be a whole number greater than 0.\n\neg. const FORCE_START_QUESTS_AFTER_HOURS = 1;\n    const FORCE_START_QUESTS_AFTER_HOURS = 8;");
      valid = false;
    }

    if (NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST !== true && NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST !== false) {
      console.log("ERROR: NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST must equal either true or false.\n\neg. const NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST = true;\n    const NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST = false;");
    }
  }

  if (AUTO_INVITE_GOLD_QUESTS !== true && AUTO_INVITE_GOLD_QUESTS !== false) {
    console.log("ERROR: AUTO_INVITE_GOLD_QUESTS must equal either true or false.\n\neg. const AUTO_INVITE_GOLD_QUESTS = true;\n    const AUTO_INVITE_GOLD_QUESTS = false;");
    valid = false;
  }

  if (AUTO_INVITE_UNLOCKABLE_QUESTS !== true && AUTO_INVITE_UNLOCKABLE_QUESTS !== false) {
    console.log("ERROR: AUTO_INVITE_UNLOCKABLE_QUESTS must equal either true or false.\n\neg. const AUTO_INVITE_UNLOCKABLE_QUESTS = true;\n    const AUTO_INVITE_UNLOCKABLE_QUESTS = false;");
    valid = false;
  }

  if (AUTO_INVITE_PET_QUESTS !== true && AUTO_INVITE_PET_QUESTS !== false) {
    console.log("ERROR: AUTO_INVITE_PET_QUESTS must equal either true or false.\n\neg. const AUTO_INVITE_PET_QUESTS = true;\n    const AUTO_INVITE_PET_QUESTS = false;");
    valid = false;
  }

  if (AUTO_INVITE_HOURGLASS_QUESTS !== true && AUTO_INVITE_HOURGLASS_QUESTS !== false) {
    console.log("ERROR: AUTO_INVITE_HOURGLASS_QUESTS must equal either true or false.\n\neg. const AUTO_INVITE_HOURGLASS_QUESTS = true;\n    const AUTO_INVITE_HOURGLASS_QUESTS = false;");
    valid = false;
  }

  if (AUTO_INVITE_GOLD_QUESTS === true || AUTO_INVITE_UNLOCKABLE_QUESTS === true || AUTO_INVITE_PET_QUESTS === true || AUTO_INVITE_HOURGLASS_QUESTS === true) {
    if (PM_WHEN_OUT_OF_QUEST_SCROLLS !== true && PM_WHEN_OUT_OF_QUEST_SCROLLS !== false) {
      console.log("ERROR: PM_WHEN_OUT_OF_QUEST_SCROLLS must equal either true or false.\n\neg. const PM_WHEN_OUT_OF_QUEST_SCROLLS = true;\n    const PM_WHEN_OUT_OF_QUEST_SCROLLS = false;");
      valid = false;
    }
  }

  if (NOTIFY_ON_QUEST_END !== true && NOTIFY_ON_QUEST_END !== false) {
    console.log("ERROR: NOTIFY_ON_QUEST_END must equal either true or false.\n\neg. const NOTIFY_ON_QUEST_END = true;\n    const NOTIFY_ON_QUEST_END = false;");
    valid = false;
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
    if (typeof MAX_PLAYER_DAMAGE !== "number" || MAX_PLAYER_DAMAGE < 0 || MAX_PLAYER_DAMAGE > 50) {
      console.log("ERROR: MAX_PLAYER_DAMAGE must be a number between 0 and 50.\n\neg. const MAX_PLAYER_DAMAGE = 0;\n    const MAX_PLAYER_DAMAGE = 22.5;\n    const MAX_PLAYER_DAMAGE = 50;");
      valid = false;
    }

    if (typeof MAX_PARTY_DAMAGE !== "number" || MAX_PARTY_DAMAGE < 0 || MAX_PARTY_DAMAGE > 50) {
      console.log("ERROR: MAX_PARTY_DAMAGE must be a number between 0 and 50.\n\neg. const MAX_PARTY_DAMAGE = 0;\n    const MAX_PARTY_DAMAGE = 22.5;\n    const MAX_PARTY_DAMAGE = 50;");
      valid = false;
    }
  }

  if (AUTO_ALLOCATE_STAT_POINTS !== true && AUTO_ALLOCATE_STAT_POINTS !== false) {
    console.log("ERROR: AUTO_ALLOCATE_STAT_POINTS must equal either true or false.\n\neg. const AUTO_ALLOCATE_STAT_POINTS = true;\n    const AUTO_ALLOCATE_STAT_POINTS = false;");
    valid = false;
  }

  if (AUTO_ALLOCATE_STAT_POINTS === true) {
    if (!["str", "int", "con", "per"].includes(STAT_TO_ALLOCATE)) {
      console.log("ERROR: STAT_TO_ALLOCATE must be one of either \"str\", \"int\", \"con\", or \"per\".\n\neg. const STAT_TO_ALLOCATE = \"int\";\n    const STAT_TO_ALLOCATE = \"per\";");
      valid = false;
    }
  }

  if (AUTO_PURCHASE_GEMS !== true && AUTO_PURCHASE_GEMS !== false) {
    console.log("ERROR: AUTO_PURCHASE_GEMS must equal either true or false.\n\neg. const AUTO_PURCHASE_GEMS = true;\n    const AUTO_PURCHASE_GEMS = false;");
    valid = false;
  }

  if (AUTO_PURCHASE_GEMS === true) {
    if (typeof getUser().purchased.plan.dateTerminated === "undefined" || (user.purchased.plan.dateTerminated && new Date(user.purchased.plan.dateTerminated).getTime() <= new Date().getTime())) {
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

  if (AUTO_HATCH_FEED_PETS === true) {
    if (ONLY_USE_DROP_FOOD !== true && ONLY_USE_DROP_FOOD !== false) {
      console.log("ERROR: ONLY_USE_DROP_FOOD must equal either true or false.\n\neg. const ONLY_USE_DROP_FOOD = true;\n    const ONLY_USE_DROP_FOOD = false;");
      valid = false;
    }
  }

  if (HIDE_PARTY_NOTIFICATIONS !== true && HIDE_PARTY_NOTIFICATIONS !== false) {
    console.log("ERROR: HIDE_PARTY_NOTIFICATIONS must equal either true or false.\n\neg. const HIDE_PARTY_NOTIFICATIONS = true;\n    const HIDE_PARTY_NOTIFICATIONS = false;");
    valid = false;
  }

  if (HIDE_ALL_GUILD_NOTIFICATIONS !== true && HIDE_ALL_GUILD_NOTIFICATIONS !== false) {
    console.log("ERROR: HIDE_ALL_GUILD_NOTIFICATIONS must equal either true or false.\n\neg. const HIDE_ALL_GUILD_NOTIFICATIONS = true;\n    const HIDE_ALL_GUILD_NOTIFICATIONS = false;");
    valid = false;
  }

  if (HIDE_ALL_GUILD_NOTIFICATIONS === false) {
    if (!Array.isArray(HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS)) {
      console.log("ERROR: HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS must equal an array (list) of guild IDs.\n\neg. const HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS = [\n      \"f2db2a7f-13c5-454d-b3ee-ea1f5089e601\",\n      \"5481ccf3-5d2d-48a9-a871-70a7380cee5a\",\n      \"694b15e1-19b0-4ea8-ac71-ce9f27031330\"\n    ]");
      valid = false;

    } else {
      let inGuilds = true;
      for (let guildId of HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS) {
        if (typeof guildId !== "string" || (guildId !== "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" && guildId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) === null)) {
          console.log("ERROR: HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS must equal an array (list) of guild IDs.\n\neg. const HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS = [\n      \"f2db2a7f-13c5-454d-b3ee-ea1f5089e601\",\n      \"5481ccf3-5d2d-48a9-a871-70a7380cee5a\",\n      \"694b15e1-19b0-4ea8-ac71-ce9f27031330\"\n    ]");
          valid = false;
          break;
        }

        if (inGuilds && guildId !== "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" && !getUser().guilds.includes(guildId)) {
          inGuilds = false;
          valid = false;
        }
      }
      if (!inGuilds) {
        console.log("ERROR: You must be a member of each guild in the HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS list.");
      }
    }
  }

  if (!valid) {
    console.log("Please fix the above errors, create a new version of the deployment, and run the install function again. If you aren't sure how to do this, see \"Changing the Settings\" in the documentation for this script.");
  }

  return valid;
}

function deleteTriggers() {
  let triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {

    console.log("Deleting triggers");

    for (let trigger of triggers) {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

function createTrigger() {

  // create trigger if needed for enabled automations
  if (AUTO_CRON === true || AUTO_ACCEPT_QUEST_INVITES === true || FORCE_START_QUESTS === true || AUTO_CAST_SKILLS === true || AUTO_PAUSE_RESUME_DAMAGE === true || AUTO_PURCHASE_GEMS === true || AUTO_PURCHASE_ARMOIRES === true) {

    console.log("Creating trigger");

    ScriptApp.newTrigger("onTrigger")
      .timeBased()
      .everyMinutes(10)
      .create();
  }
}

function deleteWebhooks(groupChatReceived) {
  let webhooks = JSON.parse(fetch("https://habitica.com/api/v3/user/webhook", GET_PARAMS)).data;
  if (webhooks.length > 0) {

    if (!groupChatReceived) {
      console.log("Deleting webhooks");
    } else {
      console.log("Deleting groupChatReceived webhooks");
    }

    for (let webhook of webhooks) {
      if (webhook.url == WEB_APP_URL && (!groupChatReceived || webhook.type == "groupChatReceived")) {
        fetch("https://habitica.com/api/v3/user/webhook/" + webhook.id, DELETE_PARAMS);
      }
    }
  }
}

function createWebhooks(groupChatReceived) {

  let webhooks = [];

  if (!groupChatReceived) {

    // task scored
    if (AUTO_CAST_SKILLS === true || AUTO_PAUSE_RESUME_DAMAGE === true || AUTO_ALLOCATE_STAT_POINTS === true || AUTO_PURCHASE_GEMS === true || AUTO_PURCHASE_ARMOIRES === true || AUTO_SELL_EGGS === true || AUTO_SELL_HATCHING_POTIONS === true || AUTO_SELL_FOOD === true || AUTO_HATCH_FEED_PETS === true) {
      webhooks.push({
        "type": "taskActivity",
        "options": {
          "scored": true
        }
      });
    }

    // level up
    if (AUTO_PAUSE_RESUME_DAMAGE === true || AUTO_ALLOCATE_STAT_POINTS === true) {
      webhooks.push({
        "type": "userActivity",
        "options": {
          "leveledUp": true
        }
      });
    }

    let questActivityOptions = {};

    // quest invited
    if (AUTO_ACCEPT_QUEST_INVITES === true || FORCE_START_QUESTS === true || NOTIFY_ON_QUEST_END === true || AUTO_PAUSE_RESUME_DAMAGE === true) {
      Object.assign(questActivityOptions, {
        "questInvited": true
      });
    }

    // quest started
    if (FORCE_START_QUESTS === true) {
      Object.assign(questActivityOptions, {
        "questStarted": true
      });
    }

    // quest finished
    if (AUTO_INVITE_GOLD_QUESTS === true || AUTO_INVITE_UNLOCKABLE_QUESTS === true || AUTO_INVITE_PET_QUESTS === true || AUTO_INVITE_HOURGLASS_QUESTS === true || NOTIFY_ON_QUEST_END === true || AUTO_PURCHASE_GEMS === true || AUTO_PURCHASE_ARMOIRES === true || AUTO_SELL_EGGS === true || AUTO_SELL_HATCHING_POTIONS === true || AUTO_SELL_FOOD === true || AUTO_HATCH_FEED_PETS === true) {
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
  }

  // group chat received
  if (HIDE_PARTY_NOTIFICATIONS === true && getUser().party._id) {
    scriptProperties.setProperty("HIDE_NOTIFICATIONS_PARTY", user.party._id);
    webhooks.push({
      "type": "groupChatReceived",
      "options": {
        "groupId": user.party._id
      }
    });
  }
  if (HIDE_ALL_GUILD_NOTIFICATIONS === true) {
    scriptProperties.setProperty("HIDE_NOTIFICATIONS_GUILDS", getUser().guilds.join());
    for (let guild of user.guilds) {
      webhooks.push({
        "type": "groupChatReceived",
        "options": {
          "groupId": guild
        }
      });
    }
  } else {
    for (let guild of HIDE_NOTIFICATIONS_FROM_SPECIFIC_GUILDS) {
      if (guild !== "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx") {
        webhooks.push({
          "type": "groupChatReceived",
          "options": {
            "groupId": guild
          }
        });
      }
    }
  }

  // create webhooks
  if (webhooks.length > 0) {

    if (!groupChatReceived) {
      console.log("Creating webhooks");
    } else {
      console.log("Creating groupChatReceived webhooks");
    }

    for (let webhook of webhooks) {
      webhook = Object.assign({
        "url": WEB_APP_URL,
        "label": DriveApp.getFileById(ScriptApp.getScriptId()).getName()
      }, webhook);
      webhook = Object.assign({
        "contentType": "application/json",
        "payload": JSON.stringify(webhook)
      }, POST_PARAMS);
      fetch("https://habitica.com/api/v3/user/webhook", webhook);
    }
  }
}