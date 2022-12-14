/**
 * purchaseGems()
 * 
 * Buys gems with gold. Number of gems purchased = number 
 * of gems still available for purchase this month, or number 
 * of gems the player can afford, whichever is less.
 * 
 * Run this function just after cron, and whenever the player
 * gains gold: whenever a task is scored, and whenever a quest 
 * is completed: https://habitica.fandom.com/wiki/Gold_Points
 */
function purchaseGems() {

  // calculate number of gems to buy
  let plan = getUser(true).purchased.plan;
  let gemsToBuy = Math.min(25 + plan.consecutive.gemCapExtra - plan.gemsBought, Math.floor(user.stats.gp / 20));

  // buy gems
  if (gemsToBuy > 0) {

    console.log("Buying " + gemsToBuy + " gems");

    let params = Object.assign({
      "contentType": "application/json",
      "payload": JSON.stringify({
        "quantity": gemsToBuy
      })
    }, POST_PARAMS);
    fetch("https://habitica.com/api/v3/user/purchase/gems/gem", params);
  }
}