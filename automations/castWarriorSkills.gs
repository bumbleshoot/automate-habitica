/**
 * castValorousPresence(saveMana)
 * 
 * Casts Valorous Presence over and over until mana is used 
 * up. If saveMana is set to true, reserves any mana that will 
 * remain after cron, plus enough mana to do 3000 damage to 
 * the quest boss with Brutal Smash.
 * 
 * Run this function with saveMana set to true whenever the 
 * player gains mana: after cron, whenever a task is scored, 
 * and whenever stat point(s) are allocated to INT:
 * https://habitica.fandom.com/wiki/Mana_Points#Restoring_Mana
 * 
 * Run this function with saveMana set to false just after 
 * cron.
 */
function castValorousPresence(saveMana) {
  try {
    
    // if lvl >= 12
    if (getUser(true).data.stats.lvl >= 12) {

      log("Mana: " + user.data.stats.mp);

      // calculate number of valorous presences to cast
      let numPresences = 0;
      let numStances = 0;
      if (saveMana) {
        let int = getTotalStat("int");
        let maxManaAfterCron = ((int - user.data.stats.buffs.int + Math.min(Math.ceil(user.data.stats.lvl / 2), 50)) * 2 + 30) * 0.9;
        let str = getTotalStat("str");
        let finishBossMana = Math.max(Math.ceil((3000 - user.data.party.quest.progress.up) / (55 * str / (str + 70))) * 10, 0);
        let reserve = maxManaAfterCron + finishBossMana;

        log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) + " + finishBossMana + " (finishBossMana) = " + reserve + " mana");

        numPresences = Math.max(Math.ceil((user.data.stats.mp - reserve) / 20), 0);
        numStances = Math.max(Math.ceil((user.data.stats.mp - reserve) / 25), 0);
      } else {
        numPresences = Math.floor(user.data.stats.mp / 20);
        numStances = Math.floor(user.data.stats.mp / 25);
      }
      
      // if lvl > 12, cast valorous presence
      if (user.data.stats.lvl > 12) {
        
        log("Casting Valorous Presence " + numPresences + " time(s)");

        for (let i=0; i<numPresences; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/valorousPresence", POST_PARAMS);
        }
      
      // if lvl 12, cast defensive stance
      } else {

        log("Player level " + user.data.stats.lvl + ", casting Defensive Stance " + numStances + " time(s)");

        for (let i=0; i<numStances; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/defensiveStance", POST_PARAMS);
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
 * smashBossAndDumpMana()
 * 
 * Casts Brutal Smash enough times to get pending damage above
 * the quest boss's remaining health. Then, casts Valorous Presence
 * enough times to use up any mana that will be lost at cron.
 * 
 * Run this function just before cron.
 */
function smashBossAndDumpMana() {
  try {

    // if lvl >= 11
    if (getUser(true).data.stats.lvl >= 11) {

      let mana = user.data.stats.mp;

      log("Mana: " + mana);

      // if party is currently fighting a boss and user has tasks
      if (getParty(true).data.quest.progress.hp !== undefined && getTasks().data.length > 0) {

        log("Boss HP: " + party.data.quest.progress.hp);
        log("Pending damage: " + user.data.party.quest.progress.up);

        // calculate number of brutal smashes to cast
        let str = getTotalStat("str");
        let numSmashes = Math.min(Math.max(Math.ceil((party.data.quest.progress.hp - user.data.party.quest.progress.up) / (55 * str / (str + 70))), 0), Math.floor(mana / 10));

        // if casting at least 1 brutal smash
        if (numSmashes >= 1) {

          // get bluest non-challenge task
          let bluestTask = {
            id: tasks.data[0]._id,
            value: tasks.data[0].value,
            text: tasks.data[0].text
          };
          for (let i=1; i<tasks.data.length; i++) {
            if (tasks.data[i].value > bluestTask.value && tasks.data[i].challenge.id == undefined) {
              bluestTask.id = tasks.data[i]._id;
              bluestTask.value = tasks.data[i].value;
              bluestTask.text = tasks.data[i].text;
            }
          }

          log("Casting Brutal Smash " + numSmashes + " time(s) on bluest task \"" + bluestTask.text + "\"");

          // cast brutal smash on bluest task
          for (let i=0; i<numSmashes; i++) {
            fetch("https://habitica.com/api/v3/user/class/cast/smash?targetId=" + bluestTask.id, POST_PARAMS);
            mana -= 10;
          }

          log("Remaining mana: " + mana);

          // if sleeping and on quest, pause or resume damage
          if (AUTO_PAUSE_RESUME_DAMAGE === true && user.data.preferences.sleep && typeof party.data.quest.key !== "undefined") {
            scriptProperties.setProperty("pauseResumeDamage", "true");
          }
        }
      } else {
        log("No boss fight or user has no tasks");
      }

      // check for perfect day
      let perfectDayBuff = calculatePerfectDayBuff();

      // calculate number of valorous presences to cast
      let int = getTotalStat("int");
      let maxManaAfterCron = ((int - user.data.stats.buffs.int + perfectDayBuff) * 2 + 30) * 0.9;

      log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) mana");

      let numPresences = Math.max(Math.ceil((mana - maxManaAfterCron) / 20), 0);
      let numStances = Math.max(Math.ceil((mana - maxManaAfterCron) / 25), 0);

      // if lvl >= 13, cast valorous presences
      if (user.data.stats.lvl >= 13) {

        log("Casting Valorous Presence " + numPresences + " time(s)");

        for (let i=0; i<numPresences; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/valorousPresence", POST_PARAMS);
        }
      
      // if lvl < 13, cast defensive stances
      } else {

        log("Player level " + user.data.stats.lvl + ", casting Defensive Stance " + numStances + " time(s)");

        for (let i=0; i<numStances; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/defensiveStance", POST_PARAMS);
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