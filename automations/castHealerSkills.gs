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

  // if time limit or lvl < 13, return
  if (webhook || installing) {
    return;
  } else if (getUser(true).stats.lvl < 13) {
    console.log("Player level " + user.stats.lvl + ", cannot cast Protective Aura");
    return;
  }

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
      numAuras = Math.max(Math.ceil((user.stats.mp - maxManaAfterCron) / 30), 0);
      reserveMessage = "Reserving no more than " + maxManaAfterCron + " mana for after cron";
    }
  }

  console.log(reserveMessage);
  console.log("Casting Protective Aura " + numAuras + " time(s)");

  // cast protective aura
  for (let i=0; i<numAuras; i++) {
    fetch("https://habitica.com/api/v3/user/class/cast/protectAura", POST_PARAMS);
    if (interruptLoop()) {
      break;
    }
  }

  // if player is asleep, pause or resume damage
  if (AUTO_PAUSE_RESUME_DAMAGE === true && user.preferences.sleep) {
    scriptProperties.setProperty("pauseResumeDamage", "true");
  }
}

/**
 * healParty()
 * 
 * Casts Blessing enough times to heal all other party members,
 * then casts Healing Light enough times to finish healing the
 * player.
 * 
 * Run this function every 10 mins.
 */
function healParty() {
    
  // if lvl < 11, return
  if (getUser(true).stats.lvl < 11) {
    console.log("Player level " + user.stats.lvl + ", cannot cast healing skills");
    return;
  }

  let con = getTotalStat("con");
  let int = getTotalStat("int");

  // if lvl >= 14 & in a party with other players
  let numBlessings = 0;
  if (user.stats.lvl >= 14 && typeof getMembers() !== "undefined" && members.length > 1) {

    // get lowest party member health (excluding player)
    let lowestMemberHealth = 50;
    for (let member of members) {
      if (member._id !== USER_ID && member.stats.hp < lowestMemberHealth) {
        lowestMemberHealth = member.stats.hp;
      }
    }

    // calculate number of blessings to cast
    let healthPerBlessing = (con + int + 5) * 0.04;
    numBlessings = Math.min(Math.ceil((50 - lowestMemberHealth) / healthPerBlessing), Math.floor(user.stats.mp / 25));

    // cast blessing
    if (numBlessings > 0) {

      console.log("Mana: " + user.stats.mp);
      console.log("Lowest party member health: " + lowestMemberHealth);
      console.log("Casting Blessing " + numBlessings + " time(s)");

      for (let i=0; i<numBlessings; i++) {
        fetch("https://habitica.com/api/v3/user/class/cast/healAll", POST_PARAMS);
        user.stats.mp -= 25;
        user.stats.hp += healthPerBlessing;
      }
      user.stats.hp = Math.min(user.stats.hp, 50);
    }

  // if lvl < 14 or not in a party, nothing to cast
  } else if (user.stats.lvl < 14) {
    console.log("Player level " + user.stats.lvl + ", cannot cast Blessing");
  }

  // calculate number of healing lights to cast
  let numLights = Math.min(Math.max(Math.ceil((50 - user.stats.hp) / ((con + int + 5) * 0.075)), 0), Math.floor(user.stats.mp / 15));

  // cast healing light
  if (numLights > 0) {

    console.log("Mana: " + user.stats.mp);
    console.log("Player health: " + user.stats.hp);
    console.log("Casting Healing Light " + numLights + " time(s)");

    for (let i=0; i<numLights; i++) {
      fetch("https://habitica.com/api/v3/user/class/cast/heal", POST_PARAMS);
    }
  }

  // if sleeping & healed, pause or resume damage
  if (AUTO_PAUSE_RESUME_DAMAGE === true && user.preferences.sleep && (numBlessings > 0 || numLights > 0)) {
    scriptProperties.setProperty("pauseResumeDamage", "true");
  }
}