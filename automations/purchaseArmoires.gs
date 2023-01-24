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
function purchaseArmoires(gold) {

  // if time limit, return
  if (webhook || installing) {
    return;
  }

  // calculate number of armoires to buy
  if (typeof gold === "undefined") {
    gold = getUser(true).stats.gp;
  }
  let numArmoires = Math.max(Math.floor((gold - RESERVE_GOLD) / 100), 0);

  console.log("Player gold: " + gold);
  console.log("Gold reserve: " + RESERVE_GOLD);
  console.log("Buying " + numArmoires + " armoire(s)");

  // if buying at least one armoire
  if (numArmoires > 0) {

    // buy armoires
    for (let i=0; i<numArmoires; i++) {
      fetch("https://habitica.com/api/v3/user/buy-armoire", POST_PARAMS);
      if (interruptLoop()) {
        break;
      }
    }

    // sell extra food
    if (AUTO_SELL_FOOD === true) {
      scriptProperties.setProperty("sellExtraFood", "true");
    }
  }
}