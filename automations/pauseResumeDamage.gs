/**
 * pauseResumeDamage()
 * 
 * Calculates pending damage to player & party based on player's
 * incomplete dailies & the current boss. Checks player into the
 * inn if pending damage to player or party exceed MAX_PLAYER_DAMAGE
 * or MAX_PARTY_DAMAGE or player's hp, checks player out of inn 
 * otherwise.
 * 
 * Run this function whenever the player is invited to a quest, and 
 * periodically throughout the day.
 * 
 * If the player is sleeping, run this function whenever they cast 
 * stealth, whenever a task is scored, whenever they level up 
 * to an even number level <= 100, whenever stat points are 
 * allocated to STR or CON, and whenever the player is healed.
 * 
 * If the player is sleeping and on a quest, run this function 
 * whenever they cast brutal smash or burst of flames.
 */
function pauseResumeDamage() {
  try {

    // for each task
    let damageToPlayer = 0;
    let damageToParty = 0;
    let stealth = getUser(true).data.stats.buffs.stealth;
    let quest = user.data.party.quest.key;
    let boss;
    if (quest !== null) {
      boss = getContent().data.quests[quest].boss;
    }
    for (task of getTasks().data) {

      // if due & incomplete
      if (task.isDue && !task.completed) {

        // if stealth remaining, skip task
        if (stealth > 0) {
          stealth--;
          continue;
        }

        // calculate task value
        let taskValue = Math.min(Math.max(task.value, -47.27), 21.27);

        // calculate task damage value
        let delta = Math.abs(Math.pow(0.9747, taskValue));
        if (task.checklist.length > 0) {
          let subtasksDone = 0;
          for (subtask of task.checklist) {
            if (subtask.completed) {
              subtasksDone++;
            }
          }
          delta *= (1 - subtasksDone / task.checklist.length);
        }

        // if party is fighting a boss, calculate damage to party
        if (typeof boss !== "undefined") {
          let bossDelta = delta;
          if (task.priority < 1) {
              bossDelta *= task.priority;
          }
          damageToParty += bossDelta * boss.str;
        }

        // calculate damage to player
        damageToPlayer += Math.round(delta * task.priority * 2 * Math.max(0.1, 1 - (getTotalStat("con") / 250)) * 10) / 10;
      }
    }

    // add up & round damage values
    let damageTotal = Math.ceil((damageToPlayer + damageToParty) * 10) / 10;
    damageToPlayer = Math.ceil(damageToPlayer  * 10) / 10;
    damageToParty = Math.ceil(damageToParty * 10) / 10;

    log("Pending damage to player: " + damageTotal);
    log("Pending damage to party: " + damageToParty);

    // if fighting a boss
    let hp = user.data.stats.hp;
    if (typeof boss !== "undefined") {

      // if enough pending damage to defeat boss
      if (user.data.party.quest.progress.up >= boss.hp) {

        // if damage to player greater than threshold or hp, sleep, otherwise wake up
        if (damageToPlayer > MAX_PLAYER_DAMAGE || damageToPlayer >= hp) {
          sleep();
        } else {
          wakeUp();
        }
      
      // if not enough pending damage to defeat boss
      } else {

        // get lowest party member health
        let lowestHealth = 50;
        for (member of getMembers(true).data) {
          if (member.stats.hp < lowestHealth) {
            lowestHealth = member.stats.hp;
          }
        }

        // if damage to party greater than threshold or lowest hp, or total damage greater than threshold or hp, sleep, otherwise wake up
        if (damageToParty > MAX_PARTY_DAMAGE || damageToParty >= lowestHealth || damageTotal > MAX_PLAYER_DAMAGE || damageTotal >= hp) {
          sleep();
        } else {
          wakeUp();
        }
      }

    // if not fighting a boss
    } else {

      // if player damage greater than threshold or hp, sleep, otherwise wake up
      if (damageToPlayer > Math.min(MAX_PLAYER_DAMAGE, hp)) {
        sleep();
      } else {
        wakeUp();
      }
    }

    function sleep() {
      if (!user.data.preferences.sleep) {

        log("Going to sleep");

        fetch("https://habitica.com/api/v3/user/sleep", POST_PARAMS);
        user.data.preferences.sleep = false;
      } else {

        log("Staying asleep");

      }
    }

    function wakeUp() {
      if (user.data.preferences.sleep) {

        log("Waking up");

        fetch("https://habitica.com/api/v3/user/sleep", POST_PARAMS);
        user.data.preferences.sleep = true;
      } else {

        log("Staying awake");

      }
    }

  } catch (e) {
    log(e);
    throw e;
  }
}