/**
 * sellExtraEggs()
 * 
 * Sells all the player's extra eggs, reserving RESERVE_EGGS
 * of each egg, then purchases enchanted armoires with any 
 * excess gold. Run this function whenever the player might
 * receive eggs: after scoring a task or completing a quest:
 * https://habitica.fandom.com/wiki/Eggs
 */
function sellExtraEggs() {

  let logged = false;

  // for each egg in the player's inventory
  for ([egg, amount] of Object.entries(getUser(true).data.items.eggs)) {

    // if player has more than RESERVE_EGGS
    if (amount > RESERVE_EGGS) {

      if (!logged) {
        console.log("Selling extra eggs");
        logged = true;
      }

      // sell extra eggs
      fetch("https://habitica.com/api/v3/user/sell/eggs/" + egg + "?amount=" + (amount - RESERVE_EGGS), POST_PARAMS);

      // if done selling extra items, purchase armoires
      if (AUTO_PURCHASE_ARMOIRES === true && scriptProperties.getProperty("sellExtraHatchingPotions") === null && scriptProperties.getProperty("sellExtraFood") === null) {
        scriptProperties.setProperty("purchaseArmoires", "true");
      }
    }
  }
}

/**
 * sellExtraHatchingPotions()
 * 
 * Sells all the player's extra hatching potions, reserving 
 * RESERVE_HATCHING_POTIONS of each hatching potion, then 
 * purchases enchanted armoires with any excess gold. Run this 
 * function whenever the player might receive hatching potions: 
 * after scoring a task or completing a quest:
 * https://habitica.fandom.com/wiki/Hatching_Potions
 */
function sellExtraHatchingPotions() {

  let logged = false;

  // for each hatching potion in the player's inventory
  for ([potion, amount] of Object.entries(getUser(true).data.items.hatchingPotions)) {

    // if player has more than RESERVE_HATCHING_POTIONS
    if (amount > RESERVE_HATCHING_POTIONS) {

      if (!logged) {
        console.log("Selling extra hatching potions");
        logged = true;
      }

      // sell extra hatching potions
      fetch("https://habitica.com/api/v3/user/sell/hatchingPotions/" + potion + "?amount=" + (amount - RESERVE_HATCHING_POTIONS), POST_PARAMS);

      // if done selling extra items, purchase armoires
      if (AUTO_PURCHASE_ARMOIRES === true && scriptProperties.getProperty("sellExtraEggs") === null && scriptProperties.getProperty("sellExtraFood") === null) {
        scriptProperties.setProperty("purchaseArmoires", "true");
      }
    }
  }
}

/**
 * sellExtraFood()
 * 
 * Sells all the player's extra food, reserving RESERVE_FOOD
 * of each food, then purchases enchanted armoires with any 
 * excess gold. Run this function whenever the player might
 * receive food: after scoring a task, purchasing armoires,
 * or completing a quest:
 * https://habitica.fandom.com/wiki/Food#How_To_Obtain_A_Food_Item
 */
function sellExtraFood() {

  let logged = false;

  // for each food in the player's inventory
  for ([food, amount] of Object.entries(getUser(true).data.items.food)) {

    // if player has more than RESERVE_FOOD
    if (food != "Saddle" && amount > RESERVE_FOOD) {

      if (!logged) {
        console.log("Selling extra food");
        logged = true;
      }

      // sell extra food
      fetch("https://habitica.com/api/v3/user/sell/food/" + food + "?amount=" + (amount - RESERVE_FOOD), POST_PARAMS);

      // if done selling extra items, purchase armoires
      if (AUTO_PURCHASE_ARMOIRES === true && scriptProperties.getProperty("sellExtraEggs") === null && scriptProperties.getProperty("sellExtraHatchingPotions") === null) {
        scriptProperties.setProperty("purchaseArmoires", "true");
      }
    }
  }
}