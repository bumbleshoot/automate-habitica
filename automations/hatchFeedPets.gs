/**
 * hatchFeedPets()
 * 
 * Automatically hatches pets, but only if the player has enough 
 * eggs for all pets/mounts of that species, and enough hatching 
 * potions for all pets/mounts of that color.
 * 
 * Automatically feeds pets, but only if the player has enough 
 * of the pet's favorite food(s) to feed all pets with the same 
 * favorite food(s).
 * 
 * Run this function whenever the player gets eggs, hatching 
 * potions, or food: whenever a task is scored, and whenever a 
 * quest is completed.
 */
function hatchFeedPets() {

  // if time limit, return
  if (webhook || installing) {
    return;
  }

  // get # each egg & hatching potion needed
  let numEachEggNeededTotal = {};
  let numEachPotionNeededTotal = {};
  let nonWackyNonSpecialPets = Object.keys(getContent().pets).concat(Object.keys(content.premiumPets)).concat(Object.keys(content.questPets));
  for (let pet of nonWackyNonSpecialPets) {
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
  let wackyPets = Object.keys(content.wackyPets);
  for (let pet of wackyPets) {
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
  let numEachEggOwnedUsed = getUser(true).items.eggs;
  let numEachPotionOwnedUsed = user.items.hatchingPotions;
  let nonSpecialPetsOwned = [];
  let nonSpecialPets = nonWackyNonSpecialPets.concat(wackyPets);
  for (let [pet, amount] of Object.entries(user.items.pets)) {
    if (amount > 0 && nonSpecialPets.includes(pet)) { // 0 = released pet, 5 = newly hatched pet, >5 = fed pet, -1 = mount but no pet
      nonSpecialPetsOwned.push(pet);
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
  let nonSpecialMountsOwned = [];
  for (let [mount, owned] of Object.entries(user.items.mounts)) {
    if (owned && nonSpecialPets.includes(mount)) {
      nonSpecialMountsOwned.push(mount);
    }
  }
  let numEachFoodTypeNeededTotal = Object.keys(numEachEggNeededTotal).length * 9;
  let basicColors = Object.keys(content.dropHatchingPotions);
  let numEachFoodTypeNeeded = {};
  for (let color of basicColors) {
    numEachFoodTypeNeeded[color] = numEachFoodTypeNeededTotal;
  }
  let numExtraFoodNeeded = Object.keys(content.premiumHatchingPotions).length * Object.keys(content.dropEggs).length * 9;
  for (let mount of nonSpecialMountsOwned) {
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

  // get # each usable food owned & # each usable food type owned
  let numEachUsableFoodOwned = {};
  let numEachFoodTypeOwned = {};
  for (let [food, amount] of Object.entries(user.items.food)) {
    if (food != "Saddle" && (ONLY_USE_DROP_FOOD !== true || content.food[food].canDrop)) {
      if (amount > 0) {
        numEachUsableFoodOwned[food] = amount;
      }
      let target = content.food[food].target;
      if (numEachFoodTypeOwned.hasOwnProperty(target)) {
        numEachFoodTypeOwned[target] = numEachFoodTypeOwned[target] + amount;
      } else {
        numEachFoodTypeOwned[target] = amount;
      }
    }
  }

  // get # extra food owned, # extra extra food needed/owned
  let numExtraFoodOwned = 0;
  let numExtraExtraFoodNeeded = 0;
  for (let [food, amount] of Object.entries(numEachFoodTypeOwned)) {
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
  for (let pet of nonSpecialPets) {
    let petSplit = pet.split("-");
    let species = petSplit[0];
    let color = petSplit[1];
    let hunger = 50;

    // if player has all needed eggs & potions for that species & color
    if (numEachEggOwnedUsed[species] - numEachEggNeededTotal[species] >= 0 && numEachPotionOwnedUsed[color] - numEachPotionNeededTotal[color] >= 0) {

      // if player doesn't have pet
      if (!nonSpecialPetsOwned.includes(pet)) {

        // hatch pet
        console.log("Hatching " + pet);
        fetch("https://habitica.com/api/v3/user/hatch/" + species + "/" + color, POST_PARAMS);
        hunger = 45;
      }

      // if non-wacky & player doesn't have mount
      if (!wackyPets.includes(pet) && !nonSpecialMountsOwned.includes(pet)) {

        // get pet hunger
        if (hunger == 50) {
          let fed = user.items.pets[pet];
          if (typeof fed !== "undefined" && fed > 0) {
            hunger -= fed;
          }
        }

        // if basic color pet
        let grewToMount = false;
        if (basicColors.includes(color)) {

          // if player has enough preferred food for all basic pets of this color
          if (numEachFoodTypeOwned[color] >= numEachFoodTypeNeeded[color]) {

            // calculate feedings needed
            let feedingsNeeded = Math.ceil(hunger / 5);

            // for each usable food owned
            for (let [food, amount] of Object.entries(numEachUsableFoodOwned)) {

              // if correct food type
              if (content.food[food].target == color) {

                // calculate feedings
                let feedings = Math.min(feedingsNeeded, amount);

                // feed this food
                console.log("Feeding " + pet + " " + feedings + " " + food);
                fetch("https://habitica.com/api/v3/user/feed/" + pet + "/" + food + "?amount=" + feedings, POST_PARAMS);

                // update data
                feedingsNeeded -= feedings;
                numEachUsableFoodOwned[food] -= feedings;
                if (numEachUsableFoodOwned[food] <= 0) {
                  delete numEachUsableFoodOwned[food];
                }
                let target = content.food[food].target;
                numEachFoodTypeOwned[target] -= feedings;
                numEachFoodTypeNeeded[target] -= feedings;

                // stop feeding if full
                if (feedingsNeeded <= 0) {
                  grewToMount = true;
                  break;
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

    // for each usable food owned
    let foodsOwnedSorted = [];
    for (let [food, amount] of Object.entries(numEachUsableFoodOwned)) {

      // add to sorted food list
      let low = 0;
      let high = foodsOwnedSorted.length;
      while (low < high) {
        let mid = Math.floor((low + high) / 2);
        if (foodsOwnedSorted[mid][1] > amount) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      foodsOwnedSorted.splice(low, 0, [food, amount]);
    }

    // for each food in sorted list
    for (let [food, amount] of foodsOwnedSorted) {

      // if extra
      let extra = numEachFoodTypeOwned[content.food[food].target] - numEachFoodTypeNeeded[content.food[food].target];
      if (extra > 0) {

        // calculate feedings
        let feedings = Math.min(feedingsNeeded, amount, extra);

        // feed this food
        console.log("Feeding " + pet + " " + feedings + " " + food);
        fetch("https://habitica.com/api/v3/user/feed/" + pet + "/" + food + "?amount=" + feedings, POST_PARAMS);

        // update data
        feedingsNeeded -= feedings;
        numEachUsableFoodOwned[food] -= feedings;
        if (numEachUsableFoodOwned[food] <= 0) {
          delete numEachUsableFoodOwned[food];
        }
        numEachFoodTypeOwned[content.food[food].target] -= feedings;

        // stop feeding if full
        if (feedingsNeeded <= 0) {
          return true;
        }
      }
    }
    return false;
  }
}