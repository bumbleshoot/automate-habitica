/**
 * hatchFeedPets()
 * 
 * Automatically hatches pets, but only if the player has enough 
 * eggs for all pets/mounts of that species, and enough hatching 
 * potions for all pets/mounts of that color.
 * 
 * Automatically feeds pets, but only if the player has enough 
 * food to feed all pets of that color with their favorite food.
 * 
 * Run this function whenever the player gets eggs, hatching 
 * potions, or food: whenever a task is scored, and whenever a 
 * quest is completed.
 */
function hatchFeedPets() {

  // get # each egg & hatching potion needed
  let numEachEggNeededTotal = {};
  let numEachPotionNeededTotal = {};
  let nonWackyNonSpecialPets = Object.keys(getContent().data.pets).concat(Object.keys(content.data.premiumPets)).concat(Object.keys(content.data.questPets));
  for (pet of nonWackyNonSpecialPets) {
    pet = pet.split("-");
    let species = pet[0];
    let color = pet[1];
    if (numEachEggNeededTotal.hasOwnProperty(species)) {
      numEachEggNeededTotal[species] = numEachEggNeededTotal[species] + 2;
    } else {
      numEachEggNeededTotal[species] = 2;
    }
    if (numEachPotionNeededTotal.hasOwnProperty(color)) {
      numEachPotionNeededTotal[color] = numEachPotionNeededTotal[color] + 2;
    } else {
      numEachPotionNeededTotal[color] = 2;
    }
  }
  let wackyPets = Object.keys(content.data.wackyPets);
  for (pet of wackyPets) {
    pet = pet.split("-");
    let species = pet[0];
    let color = pet[1];
    if (numEachEggNeededTotal.hasOwnProperty(species)) {
      numEachEggNeededTotal[species] = numEachEggNeededTotal[species] + 1;
    } else {
      numEachEggNeededTotal[species] = 1;
    }
    if (numEachPotionNeededTotal.hasOwnProperty(color)) {
      numEachPotionNeededTotal[color] = numEachPotionNeededTotal[color] + 1;
    } else {
      numEachPotionNeededTotal[color] = 1;
    }
  }

  // get # each egg & hatching potion owned/used, pets & mounts owned, # each food type needed, # extra food needed
  let numEachEggOwnedUsed = getUser(true).data.items.eggs;
  let numEachPotionOwnedUsed = user.data.items.hatchingPotions;
  let petsOwned = [];
  for ([pet, amount] of Object.entries(user.data.items.pets)) {
    if (amount > 0) { // 5 = newly hatched pet, >5 = fed pet, -1 = mount but no pet
      petsOwned.push(pet);
      pet = pet.split("-");
      let species = pet[0];
      let color = pet[1];
      if (numEachEggOwnedUsed.hasOwnProperty(species)) {
        numEachEggOwnedUsed[species] = numEachEggOwnedUsed[species] + 1;
      } else {
        numEachEggOwnedUsed[species] = 1;
      }
      if (numEachPotionOwnedUsed.hasOwnProperty(color)) {
        numEachPotionOwnedUsed[color] = numEachPotionOwnedUsed[color] + 1;
      } else {
        numEachPotionOwnedUsed[color] = 1;
      }
    }
  }
  let mountsOwned = Object.keys(user.data.items.mounts);
  let numEachFoodTypeNeededTotal = Object.keys(numEachEggNeededTotal).length * 9;
  let basicColors = Object.keys(content.data.dropHatchingPotions);
  let numEachFoodTypeNeeded = {};
  for (color of basicColors) {
    numEachFoodTypeNeeded[color] = numEachFoodTypeNeededTotal;
  }
  let numExtraFoodNeeded = Object.keys(content.data.premiumHatchingPotions).length * Object.keys(content.data.dropEggs).length * 9;
  for (mount of mountsOwned) {
    mount = mount.split("-");
    let species = mount[0];
    let color = mount[1];
    if (numEachEggOwnedUsed.hasOwnProperty(species)) {
      numEachEggOwnedUsed[species] = numEachEggOwnedUsed[species] + 1;
    } else {
      numEachEggOwnedUsed[species] = 1;
    }
    if (numEachPotionOwnedUsed.hasOwnProperty(color)) {
      numEachPotionOwnedUsed[color] = numEachPotionOwnedUsed[color] + 1;
    } else {
      numEachPotionOwnedUsed[color] = 1;
    }
    if (basicColors.includes(color)) {
      numEachFoodTypeNeeded[color] = numEachFoodTypeNeeded[color] - 9;
    } else {
      numExtraFoodNeeded -= 9;
    }
  }

  // get # each food type owned
  let numEachFoodTypeOwned = {};
  for ([food, amount] of Object.entries(user.data.items.food)) {
    if (!(ONLY_USE_DROP_FOOD === true && !content.data.food[food].canDrop)) {
      let target = content.data.food[food].target;
      if (typeof target !== "undefined") { // ignore saddle
        if (numEachFoodTypeOwned.hasOwnProperty(target)) {
          numEachFoodTypeOwned[target] = numEachFoodTypeOwned[target] + amount;
        } else {
          numEachFoodTypeOwned[target] = amount;
        }
      }
    }
  }
  
  // get # extra food owned, # extra extra food needed/owned
  let numExtraFoodOwned = 0;
  let numExtraExtraFoodNeeded = 0;
  for ([food, amount] of Object.entries(numEachFoodTypeOwned)) {
    let extra = amount - numEachFoodTypeNeeded[food];
    if (extra > 0) {
      numExtraFoodOwned += extra;
    } else if (extra < 0) {
      numExtraExtraFoodNeeded += Math.abs(extra);
    }
  }
  numExtraExtraFoodNeeded *= 23 / 9;
  let numExtraExtraFoodOwned = Math.max(0, numExtraFoodOwned - numExtraFoodNeeded);

  // for each non-special pet in content
  let nonSpecialPets = nonWackyNonSpecialPets.concat(wackyPets);
  for (pet of nonSpecialPets) {
    let petSplit = pet.split("-");
    let species = petSplit[0];
    let color = petSplit[1];
    let hunger = 50;

    // if player has all needed eggs & potions for that species & color
    if (numEachEggOwnedUsed[species] - numEachEggNeededTotal[species] >= 0 && numEachPotionOwnedUsed[color] - numEachPotionNeededTotal[color] >= 0) {

      // if player doesn't have pet
      if (!petsOwned.includes(pet)) {

        // hatch pet
        console.log("Hatching " + pet);
        fetch("https://habitica.com/api/v3/user/hatch/" + species + "/" + color, POST_PARAMS);
        hunger = 45;
      }

      // if non-wacky & player doesn't have mount
      if (!wackyPets.includes(pet) && !mountsOwned.includes(pet)) {

        // get pet hunger
        if (hunger == 50) {
          let fed = user.data.items.pets[pet];
          if (typeof fed !== "undefined" && fed > 0) {
            hunger -= fed;
          }
        }

        // if basic color mount
        let grewToMount = false;
        if (basicColors.includes(color)) {

          // if player has enough preferred food for all basic mounts of this color
          if (numEachFoodTypeOwned[color] >= numEachFoodTypeNeeded[color]) {

            // calculate feedings needed
            let feedingsNeeded = Math.ceil(hunger / 5);

            // for each food in inventory
            for ([foodType, amount] of Object.entries(user.data.items.food)) {

              // if player has more than 0 & not special food/not saving special food
              if (amount > 0 && !(ONLY_USE_DROP_FOOD === true && !content.data.food[foodType].canDrop)) {

                // if correct food type
                if (content.data.food[foodType].target == color) {

                  // calculate feedings
                  let feedings = Math.min(feedingsNeeded, amount);

                  // feed this food
                  console.log("Feeding " + pet + " " + feedings + " " + foodType);
                  fetch("https://habitica.com/api/v3/user/feed/" + pet + "/" + foodType + "?amount=" + feedings, POST_PARAMS);
                  feedingsNeeded -= feedings;
                  user.data.items.food[foodType] -= feedings;

                  // stop feeding if full
                  if (feedingsNeeded <= 0) {
                    grewToMount = true;
                    break;
                  }
                }
              }
            }

          // if player has enough extra extra food
          } else if (numExtraExtraFoodOwned >= numExtraExtraFoodNeeded) {

            // calculate feedings needed
            let feedingsNeeded = Math.ceil(hunger / 2);

            // feed until mount
            grewToMount = feedExtraFood(pet, feedingsNeeded);
          }
        
        // if premium color mount
        } else {

          // if player has enough extra food
          if (numExtraFoodOwned >= numExtraFoodNeeded) {

            // calculate feedings needed
            let feedingsNeeded = Math.ceil(hunger / 5);

            // feed until mount
            grewToMount = feedExtraFood(pet, feedingsNeeded);
          }
        }
          
        // if grew to mount, hatch another pet
        if (grewToMount) {
          console.log("Hatching " + pet);
          fetch("https://habitica.com/api/v3/user/hatch/" + species + "/" + color, POST_PARAMS);
        }
      }
    }
  }

  function feedExtraFood(pet, feedingsNeeded) {

    // for each food in inventory
    for ([foodType, amount] of Object.entries(user.data.items.food)) {

      // if player has more than 0 & not special food/not saving special food
      if (amount > 0 && !(ONLY_USE_DROP_FOOD === true && !content.data.food[foodType].canDrop)) {

        // if extra
        let extra = numEachFoodTypeOwned[content.data.food[foodType].target] - numEachFoodTypeNeeded[content.data.food[foodType].target];
        if (extra > 0) {

          // calculate feedings
          let feedings = Math.min(feedingsNeeded, amount, extra);

          // feed this food
          console.log("Feeding " + pet + " " + feedings + " " + foodType);
          fetch("https://habitica.com/api/v3/user/feed/" + pet + "/" + foodType + "?amount=" + feedings, POST_PARAMS);
          feedingsNeeded -= feedings;
          user.data.items.food[foodType] -= feedings;
          numEachFoodTypeOwned[content.data.food[foodType].target] -= feedings;

          // stop feeding if full
          if (feedingsNeeded <= 0) {
            return true;
          }
        }
      }
    }
    return false;
  }
}