/**
 * allocateStatPoints()
 * 
 * Allocates all unallocated stat points to STAT_TO_ALLOCATE.
 * 
 * Run this function whenever the player gains stat points: on 
 * the leveledUp webhook, and whenever the player's class changes:
 * https://habitica.fandom.com/wiki/Character_Stats
 */
function allocateStatPoints() {

  // get unused stat points
  let unusedStatPoints = getUser(true).stats.points;

  // if unused stat points & user at least lvl 10
  if (unusedStatPoints > 0 && user.stats.lvl >= 10) {

    console.log("Allocating " + unusedStatPoints + " unused stat points to " + STAT_TO_ALLOCATE);

    // allocate unused stat points to STAT_TO_ALLOCATE
    let params = Object.assign(
      POST_PARAMS,
      {
        "contentType": "application/json",
        "payload": JSON.stringify({
          "stats": {
            [STAT_TO_ALLOCATE]: unusedStatPoints
          }
        })
      }
    );
    fetch("https://habitica.com/api/v3/user/allocate-bulk", params);

    // if allocated to str or con and player is asleep, pause or resume damage
    if (AUTO_PAUSE_RESUME_DAMAGE === true && user.preferences.sleep && (STAT_TO_ALLOCATE == "str" || STAT_TO_ALLOCATE == "con")) {
      scriptProperties.setProperty("pauseResumeDamage", "true");
    }
  }
}