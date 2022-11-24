/**
 * allocateStatPoints()
 * 
 * Allocates all unallocated stat points to STAT_TO_ALLOCATE.
 * 
 * Run this function whenever the player gains stat points: on 
 * the leveledUp webhook, and whenever the player's class changes:
 * https://habitica.fandom.com/wiki/Character_Stats
 */
function allocateStatPoints(unusedStatPoints, lvl) {

  // get user data
  if (typeof unusedStatPoints === "undefined") {
    unusedStatPoints = getUser(true).stats.points;
    lvl = user.stats.lvl;
  }

  // if unused stat points & user at least lvl 10
  if (unusedStatPoints > 0 && lvl >= 10 && !getUser().preferences.disableClasses) {

    console.log("Allocating " + unusedStatPoints + " unused stat points to " + STAT_TO_ALLOCATE);

    // allocate unused stat points to STAT_TO_ALLOCATE
    let params = Object.assign({
      "contentType": "application/json",
      "payload": JSON.stringify({
        "stats": {
          [STAT_TO_ALLOCATE]: unusedStatPoints
        }
      })
    }, POST_PARAMS);
    fetch("https://habitica.com/api/v3/user/allocate-bulk", params);

    // if allocated to str or con and player is asleep, pause or resume damage
    if (AUTO_PAUSE_RESUME_DAMAGE === true && user.preferences.sleep && (STAT_TO_ALLOCATE == "str" || STAT_TO_ALLOCATE == "con")) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }
  }
}