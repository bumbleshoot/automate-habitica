/**
 * castProtectiveAura(beforeCron)
 * 
 * Casts Protective Aura over and over until excess mana is 
 * used up. Reserves enough mana to fully heal the whole party
 * every hour for the next 16 hours. If beforeCron is set to 
 * true, ensures enough mana is used up that none will be 
 * lost at cron.
 * 
 * Run this function with beforeCron set to false whenever the 
 * player gains mana: after cron, whenever a task is scored, 
 * and whenever stat point(s) are allocated to INT:
 * https://habitica.fandom.com/wiki/Mana_Points#Restoring_Mana
 * 
 * Run this function with beforeCron set to true just before 
 * cron.
 */
function castProtectiveAura(beforeCron) {

  // do not run if approaching API call limit
  if (minimizeAPICalls) {
    return;
  }

  // if lvl >= 13
  if (getUser(true).stats.lvl >= 13) {

    console.log("Mana: " + user.stats.mp);

    // calculate number of protective auras to cast
    let int = getTotalStat("int");
    let con = getTotalStat("con");
    let healPartyMana = (Math.ceil(50 / ((con + int + 5) * 0.04)) * 25) * 16;
    let reserveMessage = "Reserving " + healPartyMana + " mana for healing the party";
    let numAuras = Math.max(Math.floor((user.stats.mp - healPartyMana) / 30), 0);
    if (beforeCron) {
      let maxManaAfterCron = ((int - user.stats.buffs.int + Math.min(Math.ceil(user.stats.lvl / 2), 50)) * 2 + 30) * 0.9;
      if (maxManaAfterCron < healPartyMana) {
        numAuras = Math.ceil((user.stats.mp - maxManaAfterCron) / 30);
        reserveMessage = "Reserving no more than " + maxManaAfterCron + " mana for after cron";
      }
    }

    console.log(reserveMessage);
    console.log("Casting Protective Aura " + numAuras + " time(s)");

    // cast protective aura
    for (let i=0; i<numAuras; i++) {
      fetch("https://habitica.com/api/v3/user/class/cast/protectAura", POST_PARAMS);
    }

  // if lvl < 13, nothing to cast
  } else {
    console.log("Player level " + user.stats.lvl + ", cannot cast Protective Aura");
  }
}

/**
 * healParty()
 * 
 * Casts Blessing enough times to heal all other party members,
 * then casts Healing Light enough times to finish healing the
 * user.
 * 
 * Run this function every 10 mins.
 */
function healParty() {
    
  // if lvl >= 11
  if (getUser(true).stats.lvl >= 11) {

    let con = getTotalStat("con");
    let int = getTotalStat("int");
    let mana = user.stats.mp;
    let playerDamage = 50 - user.stats.hp;

    console.log("Mana: " + mana);

    // if lvl >= 14
    let numBlessings = 0;
    if (user.stats.lvl >= 14) {

      // get lowest party member health (excluding player)
      let lowestMemberHealth = 50;
      for (member of getMembers()) {
        if (member._id !== USER_ID && member.stats.hp < lowestMemberHealth) {
          lowestMemberHealth = member.stats.hp;
        }
      }

      console.log("Lowest party member health: " + lowestMemberHealth);

      // calculate number of blessings to cast
      let healthPerBlessing = (con + int + 5) * 0.04;
      numBlessings = Math.min(Math.ceil((50 - lowestMemberHealth) / healthPerBlessing), Math.floor(mana / 25));

      console.log("Casting Blessing " + numBlessings + " time(s)");
      
      // cast blessing
      for (let i=0; i<numBlessings; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/healAll", POST_PARAMS);
        mana -= 25;
        playerDamage -= healthPerBlessing;
      }
      playerDamage = Math.max(playerDamage, 0);

      console.log("Mana remaining: " + mana);

    // if lvl < 14, nothing to cast
    } else {
      console.log("Player level " + user.stats.lvl + ", cannot cast Blessing");
    }

    // calculate number of healing lights to cast
    let numLights = Math.min(Math.max(Math.ceil((playerDamage) / ((con + int + 5) * 0.075)), 0), Math.floor(mana / 15));

    console.log("Player damage: " + playerDamage);
    console.log("Casting Healing Light " + numLights + " time(s)");

    // cast healing light
    for (let i=0; i<numLights; i++) {
      fetch("https://habitica.com/api/v3/user/class/cast/heal", POST_PARAMS);
    }

    // if sleeping & healed, pause or resume damage
    if (AUTO_PAUSE_RESUME_DAMAGE === true && user.preferences.sleep && (numBlessings > 0 || numLights > 0)) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }

  // if lvl < 11, nothing to cast
  } else {
    console.log("Player level " + user.stats.lvl + ", cannot cast healing spells");
  }
}