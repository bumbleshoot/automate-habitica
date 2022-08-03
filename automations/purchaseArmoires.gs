/**
 * purchaseArmoires
 * 
 * Spends all but RESERVE_GOLD of the player's gold on Enchanted
 * Armoires.
 * 
 * Run this function whenever the player gains gold: whenever a
 * task is scored, and whenever a quest is completed:
 * https://habitica.fandom.com/wiki/Gold_Points
 */
function purchaseArmoires() {
  try {

    // calculate number of armoires to buy
    let gold = getUser(true).data.stats.gp;
    let numArmoires = Math.max(Math.floor((gold - RESERVE_GOLD) / 100), 0);

    log("Player gold: " + gold);
    log("Gold reserve: " + RESERVE_GOLD);
    log("Buying " + numArmoires + " armoire(s)");

    // if buying at least one armoire
    if (numArmoires > 0) {

      // buy armoires
      for (let i=0; i<numArmoires; i++) {
        fetch("https://habitica.com/api/v3/user/buy-armoire", POST_PARAMS);
      }

      // sell extra food
      if (AUTO_SELL_FOOD === true) {
        scriptProperties.setProperty("sellExtraFood", "true");
      }
    }

  } catch (e) {
    log(e);
    throw e;
  }
}