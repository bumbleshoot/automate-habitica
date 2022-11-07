/**
 * castEarthquake(saveMana)
 * 
 * Casts Earthquake over and over until mana is used up. If 
 * saveMana is set to true, reserves any mana that will remain 
 * after cron, plus enough mana to freeze any incomplete 
 * dailies' streaks with Chilling Frost, plus enough mana to 
 * do 3000 damage to the quest boss with Burst of Flames.
 * 
 * Run this function with saveMana set to true whenever the 
 * player gains mana: after cron, whenever a task is scored, 
 * and whenever stat point(s) are allocated to INT:
 * https://habitica.fandom.com/wiki/Mana_Points#Restoring_Mana
 * 
 * Run this function with saveMana set to false just after 
 * cron.
 */
function castEarthquake(saveMana) {
    
  // if lvl >= 12
  if (getUser(true).stats.lvl >= 12) {

    console.log("Mana: " + user.stats.mp);

    // calculate number of earthquakes to cast
    let numEarthquakes = 0;
    let numSurges = 0;
    if (saveMana) {
      let int = getTotalStat("int");
      let maxManaAfterCron = ((int - user.stats.buffs.int + Math.min(Math.ceil(user.stats.lvl / 2), 50)) * 2 + 30) * 0.9;
      let chillingFrostMana = user.stats.lvl >= 14 && calculatePerfectDayBuff() === 0 ? 40 : 0;
      let finishBossMana = Math.max(Math.ceil((3000 - user.party.quest.progress.up) / Math.ceil(int / 10)) * 10, 0);
      let reserve = maxManaAfterCron + chillingFrostMana + finishBossMana;

      console.log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) + " + chillingFrostMana + " (chillingFrostMana) + " + finishBossMana + " (finishBossMana) = " + reserve + " mana");

      numEarthquakes = Math.max(Math.ceil((user.stats.mp - reserve) / 35), 0);
      numSurges = Math.max(Math.ceil((user.stats.mp - reserve) / 30), 0);
    } else {
      numEarthquakes = Math.floor(user.stats.mp / 35);
      numSurges = Math.floor(user.stats.mp / 30);
    }
    
    // if lvl > 12, cast earthquake
    if (user.stats.lvl > 12) {

      console.log("Casting Earthquake " + numEarthquakes + " time(s)");

      for (let i=0; i<numEarthquakes; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/earth", POST_PARAMS);
      }

    // if lvl 12, cast ethereal surge
    } else {

      console.log("Player level 12, casting Ethereal Surge " + numSurges + " time(s)");

      for (let i=0; i<numSurges; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/mpheal", POST_PARAMS);
      }
    }

  // if lvl < 12, nothing to cast
  } else {
    console.log("Player level " + user.stats.lvl + ", no skills to cast");
  }
}

/**
 * burnBossAndDumpMana()
 * 
 * Casts Chilling Frost if the player has any incomplete dailies. 
 * Then, casts Burst of Flames enough times to get pending damage 
 * above the quest boss's remaining health. Then, casts Ethereal 
 * Surge enough times to use up any mana that will be lost at cron.
 * 
 * Run this function just before cron.
 */
function burnBossAndDumpMana() {

  // if lvl >= 11
  if (getUser(true).stats.lvl >= 11) {

    let int = getTotalStat("int");
    let mana = user.stats.mp;
    let perfectDayBuff = calculatePerfectDayBuff();

    console.log("Mana: " + mana);

    // if imperfect day & enough mana & streaks not already frozen & lvl >= 14, cast chilling frost
    if (perfectDayBuff === 0 && mana >= 40 && !user.stats.buffs.streaks && user.stats.lvl >= 14) {

      console.log("Imperfect day, casting Chilling Frost");

      fetch("https://habitica.com/api/v3/user/class/cast/frost", POST_PARAMS);
      mana -= 40;
    }

    // get boss hp
    let bossHP = 3000;
    if (AUTO_CRON === true) {
      bossHP = getParty(true).quest.progress.hp;
    }

    // if boss hp and user has non-challenge tasks
    if (typeof bossHP !== "undefined" && getTasks().length > 0) {

      console.log("Boss HP: " + bossHP);
      console.log("Pending damage: " + user.party.quest.progress.up);

      // calculate number of burst of flames to cast
      let numBursts = Math.min(Math.max(Math.ceil((bossHP - user.party.quest.progress.up) / Math.ceil(int / 10)), 0), Math.floor(mana / 10));

      // if casting at least 1 burst of flames
      if (numBursts > 0) {

        // get bluest non-challenge task
        let bluestTask = {
          id: tasks[0]._id,
          value: tasks[0].value,
          text: tasks[0].text
        };
        for (let i=1; i<tasks.length; i++) {
          if (tasks[i].value > bluestTask.value) {
            bluestTask.id = tasks[i]._id;
            bluestTask.value = tasks[i].value;
            bluestTask.text = tasks[i].text;
          }
        }

        console.log("Casting Burst of Flames " + numBursts + " time(s) on bluest task \"" + bluestTask.text + "\"");

        // cast burst of flames on bluest task
        for (let i=0; i<numBursts; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/fireball?targetId=" + bluestTask.id, POST_PARAMS);
          mana -= 10;
        }

        // if sleeping and on quest, pause or resume damage
        if (AUTO_PAUSE_RESUME_DAMAGE === true && user.preferences.sleep && typeof user.party.quest.key !== "undefined") {
          scriptProperties.setProperty("pauseResumeDamage", "true");
        }
      }

    } else {
      console.log("No boss fight or user has no non-challenge tasks");
    }

    // if lvl >= 12
    if (user.stats.lvl >= 12) {

      // calculate number of ethereal surges to cast
      let maxManaAfterCron = ((int - user.stats.buffs.int + perfectDayBuff) * 2 + 30) * 0.9;

      console.log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) mana");

      let numSurges = Math.max(Math.ceil((mana - maxManaAfterCron) / 30), 0);

      console.log("Casting Ethereal Surge " + numSurges + " time(s)");

      // cast ethereal surge
      for (let i=0; i<numSurges; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/mpheal", POST_PARAMS);
      }
    }

  // if lvl < 11, nothing to cast
  } else {
    console.log("Player level " + user.stats.lvl + ", no skills to cast");
  }
}