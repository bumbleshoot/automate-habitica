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
  try {
    
    // if lvl >= 12
    if (getUser(true).data.stats.lvl >= 12) {

      log("Mana: " + user.data.stats.mp);

      // calculate number of earthquakes to cast
      let numEarthquakes = 0;
      let numSurges = 0;
      if (saveMana) {
        let int = (user.data.stats.maxMP - 30) / 2;
        let maxManaAfterCron = ((int - user.data.stats.buffs.int + Math.min(Math.ceil(user.data.stats.lvl / 2), 50)) * 2 + 30) * 0.9;
        let chillingFrostMana = user.data.stats.lvl >= 14 && calculatePerfectDayBuff() === 0 ? 40 : 0;
        let finishBossMana = Math.max(Math.ceil((3000 - user.data.party.quest.progress.up) / Math.ceil(int / 10)) * 10, 0);
        let reserve = maxManaAfterCron + chillingFrostMana + finishBossMana;

        log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) + " + chillingFrostMana + " (chillingFrostMana) + " + finishBossMana + " (finishBossMana) = " + reserve + " mana");

        numEarthquakes = Math.max(Math.ceil((user.data.stats.mp - reserve) / 35), 0);
        numSurges = Math.max(Math.ceil((user.data.stats.mp - reserve) / 30), 0);
      } else {
        numEarthquakes = Math.floor(user.data.stats.mp / 35);
        numSurges = Math.floor(user.data.stats.mp / 30);
      }
      
      // if lvl > 12, cast earthquake
      if (user.data.stats.lvl > 12) {

        log("Casting Earthquake " + numEarthquakes + " time(s)");

        for (let i=0; i<numEarthquakes; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/earth", POST_PARAMS);
        }

      // if lvl 12, cast ethereal surge
      } else {

        log("Player level " + user.data.stats.lvl + ", casting Ethereal Surge " + numSurges + " time(s)");

        for (let i=0; i<numSurges; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/mpheal", POST_PARAMS);
        }
      }

    // if lvl < 12, nothing to cast
    } else {
      log("Player level " + user.data.stats.lvl + ", no skills to cast");
    }

  } catch (e) {
    log(e);
    throw e;
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
  try {

    // if lvl >= 11
    if (getUser(true).data.stats.lvl >= 11) {

      let int = getTotalStat("int");
      let mana = user.data.stats.mp;
      let perfectDayBuff = calculatePerfectDayBuff();

      log("Mana: " + mana);

      // if imperfect day & enough mana & streaks not already frozen & lvl >= 14, cast chilling frost
      if (perfectDayBuff === 0 && mana >= 40 && !user.data.stats.buffs.streaks && user.data.stats.lvl >= 14) {

        log("Imperfect day, casting Chilling Frost");

        fetch("https://habitica.com/api/v3/user/class/cast/frost", POST_PARAMS);
        mana -= 40;
      }

      // if party is currently fighting a boss and user has tasks
      if (getParty(true).data.quest.progress.hp !== undefined && getTasks().data.length > 0) {

        log("Boss HP: " + party.data.quest.progress.hp);
        log("Pending damage: " + user.data.party.quest.progress.up);

        // calculate number of burst of flames to cast
        let numBursts = Math.min(Math.max(Math.ceil((party.data.quest.progress.hp - user.data.party.quest.progress.up) / Math.ceil(int / 10)), 0), Math.floor(mana / 10));

        // if casting at least 1 burst of flames
        if (numBursts > 0) {

          // get bluest task
          let bluestTask = {
            id: tasks.data[0]._id,
            value: tasks.data[0].value,
            text: tasks.data[0].text
          };
          for (let i=1; i<tasks.data.length; i++) {
            if (tasks.data[i].value > bluestTask.value) {
              bluestTask.id = tasks.data[i]._id;
              bluestTask.value = tasks.data[i].value;
              bluestTask.text = tasks.data[i].text;
            }
          }

          log("Casting Burst of Flames " + numBursts + " time(s) on bluest task \"" + bluestTask.text + "\"");

          // cast burst of flames on bluest task
          for (let i=0; i<numBursts; i++) {
            fetch("https://habitica.com/api/v3/user/class/cast/fireball?targetId=" + bluestTask.id, POST_PARAMS);
            mana -= 10;
          }

          // if sleeping and on quest, pause or resume damage
          if (AUTO_PAUSE_RESUME_DAMAGE === true && user.data.preferences.sleep && typeof party.data.quest.key !== "undefined") {
            scriptProperties.setProperty("pauseResumeDamage", "true");
          }
        }

      } else {
        log("No boss fight or user has no tasks");
      }

      // if lvl >= 12
      if (user.data.stats.lvl >= 12) {

        // calculate number of ethereal surges to cast
        let maxManaAfterCron = ((int - user.data.stats.buffs.int + perfectDayBuff) * 2 + 30) * 0.9;

        log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) mana");

        let numSurges = Math.max(Math.ceil((mana - maxManaAfterCron) / 30), 0);

        log("Casting Ethereal Surge " + numSurges + " time(s)");

        // cast ethereal surge
        for (let i=0; i<numSurges; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/mpheal", POST_PARAMS);
        }
      }

    // if lvl < 11, nothing to cast
    } else {
      log("Player level " + user.data.stats.lvl + ", no skills to cast");
    }

  } catch (e) {
    log(e);
    throw e;
  }
}