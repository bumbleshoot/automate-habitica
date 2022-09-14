/**
 * castToolsOfTheTrade(saveMana)
 * 
 * Casts Tools of the Trade over and over until mana is used 
 * up. If saveMana is set to true, reserves any mana that will 
 * remain after cron, plus enough mana to dodge any incomplete 
 * dailies with Stealth.
 * 
 * Run this function with saveMana set to true whenever the 
 * player gains mana: after cron, whenever a task is scored, 
 * and whenever stat point(s) are allocated to INT:
 * https://habitica.fandom.com/wiki/Mana_Points#Restoring_Mana
 * 
 * Run this function with saveMana set to false just after 
 * cron.
 */
function castToolsOfTheTrade(saveMana) {

  // if lvl >= 11
  if (getUser(true).data.stats.lvl >= 11) {

    let numTools = 0;
    let numPickpockets = 0;
    let numBackstabs = 0;

    console.log("Mana: " + user.data.stats.mp);

    // if saving mana
    if (saveMana) {

      // calculate number of stealths needed
      let stealthMana = numStealthsNeeded() * 45;

      // calculate mana reserve
      let int = getTotalStat("int");
      let maxManaAfterCron = ((int - user.data.stats.buffs.int + Math.min(Math.ceil(user.data.stats.lvl / 2), 50)) * 2 + 30) * 0.9;
      let reserve = maxManaAfterCron + stealthMana;

      console.log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) + " + stealthMana + " (stealthMana) = " + reserve + " mana");

      // calculate number of casts
      numTools = Math.max(Math.ceil((user.data.stats.mp - reserve) / 25), 0);
      numBackstabs = Math.max(Math.ceil((user.data.stats.mp - reserve) / 15), 0);
      numPickpockets = Math.max(Math.ceil((user.data.stats.mp - reserve) / 10), 0);
    } else {
      numTools = Math.floor(user.data.stats.mp / 25);
      numBackstabs = Math.floor(user.data.stats.mp / 15);
      numPickpockets = Math.floor(user.data.stats.mp / 10);
    }
    
    // if lvl >= 13, cast tools of the trade
    if (user.data.stats.lvl >= 13) {

      console.log("Casting Tools of the Trade " + numTools + " time(s)");

      for (let i=0; i<numTools; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/toolsOfTrade", POST_PARAMS);
      }
    
    // if lvl == 12, cast backstab
    } else if (user.data.stats.lvl == 12) {

      console.log("Player level " + user.data.stats.lvl + ", casting Backstab " + numBackstabs + " time(s)");

      for (let i=0; i<numBackstabs; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/backStab", POST_PARAMS);
      }

    // if lvl < 12, cast pickpocket
    } else {

      console.log("Player level " + user.data.stats.lvl + ", casting Pickpocket " + numPickpockets + " time(s)");

      for (let i=0; i<numPickpockets; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/pickPocket", POST_PARAMS);
      }
    }
  
  // if lvl < 11, nothing to cast
  } else {
    console.log("Player level " + user.data.stats.lvl + ", no skills to cast");
    return 0;
  }
}

/**
 * castStealthAndDumpMana()
 * 
 * Casts Stealth enough times to dodge any incomplete dailies. 
 * Then, casts Tools of the Trade enough times to use up any 
 * mana that will be lost at cron.
 * 
 * Run this function just before cron.
 */
function castStealthAndDumpMana() {

  // get number of stealth casts
  let numStealths = Math.min(numStealthsNeeded(), Math.floor(getUser(true).data.stats.mp / 45));

  console.log("Casting Stealth " + numStealths + " time(s)");

  // cast stealths
  for (let i=0; i<numStealths; i++) {
    fetch("https://habitica.com/api/v3/user/class/cast/stealth", POST_PARAMS);
  }

  // if sleeping & cast stealth, pause or resume damage
  if (AUTO_PAUSE_RESUME_DAMAGE === true && user.data.preferences.sleep && numStealths > 0) {
    scriptProperties.setProperty("pauseResumeDamage", "true");
  }

  // cast tools of the trades
  castToolsOfTheTrade(true);
}

/**
 * numStealthsNeeded()
 * 
 * Calculates & returns how many more times the player needs to 
 * cast Stealth in order to avoid damage from all their 
 * incomplete dailies.
 */
function numStealthsNeeded() {

  // if lvl >= 14
  if (getUser(true).data.stats.lvl >= 14) {

    // count damaging dailies
    let stealth = user.data.stats.buffs.stealth;
    let numDailies = 0;
    let numDamagingDailies = 0;
    for (task of getTasks().data) {
      if (task.type == "daily") {
        numDailies++;
        if (task.isDue && !task.completed) {
          if (stealth > 0) {
            stealth--;
            continue;
          }
          numDamagingDailies++;
        }
      }
    }

    console.log("Damaging dailies: " + numDamagingDailies);

    // calculate num dailies dodged per cast
    let totalPer = getTotalStat("per");
    let numDodged = Math.ceil(0.64 * numDailies * totalPer / (totalPer + 55));

    // return num stealths needed
    return Math.ceil(numDamagingDailies / numDodged);

  // if lvl < 14, return 0
  } else {
    console.log("Player lvl " + user.data.stats.lvl + ", cannot cast Stealth");
    return 0;
  }
}