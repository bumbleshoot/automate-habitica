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

  // do not run if approaching API call limit
  if (minimizeAPICalls) {
    return;
  }

  // if lvl >= 12
  if (getUser(true).stats.lvl >= 12) {

    console.log("Mana: " + user.stats.mp);

    // calculate number of valorous presences to cast
    let numPresences = 0;
    let numStances = 0;
    if (saveMana) {
      let int = getTotalStat("int");
      let maxManaAfterCron = ((int - user.stats.buffs.int + Math.min(Math.ceil(user.stats.lvl / 2), 50)) * 2 + 30) * 0.9;
      let str = getTotalStat("str");
      let finishBossMana = Math.max(Math.ceil((3000 - user.party.quest.progress.up) / (55 * str / (str + 70))) * 10, 0);
      let reserve = maxManaAfterCron + finishBossMana;

      console.log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) + " + finishBossMana + " (finishBossMana) = " + reserve + " mana");

      numPresences = Math.max(Math.ceil((user.stats.mp - reserve) / 20), 0);
      numStances = Math.max(Math.ceil((user.stats.mp - reserve) / 25), 0);
    } else {
      numPresences = Math.floor(user.stats.mp / 20);
      numStances = Math.floor(user.stats.mp / 25);
    }

    // if lvl > 12, cast valorous presence
    if (user.stats.lvl > 12) {

      console.log("Casting Valorous Presence " + numPresences + " time(s)");

      for (let i=0; i<numPresences; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/valorousPresence", POST_PARAMS);
      }

    // if lvl 12, cast defensive stance
    } else {

      console.log("Player level 12, casting Defensive Stance " + numStances + " time(s)");

      for (let i=0; i<numStances; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/defensiveStance", POST_PARAMS);
      }
    }

  // if lvl < 12, nothing to cast
  } else {
    console.log("Player level " + user.stats.lvl + ", cannot cast buffs");
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

  // if lvl < 11, nothing to cast
  if (getUser(true).stats.lvl < 11) {
    console.log("Player level " + user.stats.lvl + ", no skills to cast");
    return;
  }

  console.log("Mana: " + user.stats.mp);

  // if in a party
  if (typeof user.party._id !== "undefined") {

    // get boss hp
    let bossHP = 3000;
    if (AUTO_CRON === true) {
      bossHP = getParty(true).quest.progress.hp;
    }

    // if boss hp and user has non-challenge tasks
    if (typeof bossHP !== "undefined" && getTasks().length > 0) {

      console.log("Boss HP: " + bossHP);
      console.log("Pending damage: " + user.party.quest.progress.up);

      // calculate number of brutal smashes to cast
      let str = getTotalStat("str");
      let numSmashes = Math.min(Math.max(Math.ceil((bossHP - user.party.quest.progress.up) / (55 * str / (str + 70))), 0), Math.floor(user.stats.mp / 10));

      // if casting at least 1 brutal smash
      if (numSmashes > 0) {

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

        console.log("Casting Brutal Smash " + numSmashes + " time(s) on bluest task \"" + bluestTask.text + "\"");

        // cast brutal smash on bluest task
        for (let i=0; i<numSmashes; i++) {
          fetch("https://habitica.com/api/v3/user/class/cast/smash?targetId=" + bluestTask.id, POST_PARAMS);
          user.stats.mp -= 10;
        }

        console.log("Mana remaining: " + user.stats.mp);
      }

    // if no boss or no non-challenge tasks
    } else {
      console.log("No boss fight or user has no non-challenge tasks");
    }

    // if not in a party
  } else {
    console.log("Player not in a party, cannot cast Brutal Smash");
  }

  // if not approaching API call limit & lvl >= 12
  if (!minimizeAPICalls && user.stats.lvl >= 12) {

    // check for perfect day
    let perfectDayBuff = calculatePerfectDayBuff();

    // calculate number of valorous presences to cast
    let int = getTotalStat("int");
    let maxManaAfterCron = ((int - user.stats.buffs.int + perfectDayBuff) * 2 + 30) * 0.9;

    console.log("Reserving no more than " + maxManaAfterCron + " (maxManaAfterCron) mana");

    let numPresences = Math.max(Math.ceil((user.stats.mp - maxManaAfterCron) / 20), 0);
    let numStances = Math.max(Math.ceil((user.stats.mp - maxManaAfterCron) / 25), 0);

    // if lvl >= 13, cast valorous presences
    if (user.stats.lvl >= 13) {

      console.log("Casting Valorous Presence " + numPresences + " time(s)");

      for (let i=0; i<numPresences; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/valorousPresence", POST_PARAMS);
      }
    
    // if lvl 12, cast defensive stances
    } else {

      console.log("Player level " + user.stats.lvl + ", casting Defensive Stance " + numStances + " time(s)");

      for (let i=0; i<numStances; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/defensiveStance", POST_PARAMS);
      }
    }

  // if lvl < 12
  } else if (user.stats.lvl < 12) {
    console.log("Player level " + user.stats.lvl + ", cannot cast buffs");
  }
}