/**
 * updateQuestTracker()
 * 
 * Updates the Quest Tracker spreadsheet, which shows how many 
 * quest completions are needed by each party member for every 
 * quest in Habitica. Also shows total quest completion 
 * percentages for each party member and quest.
 * 
 * Run this function on the questFinished webhook.
 */
 function updateQuestTracker() {
  try {

    // open spreadsheet & sheet
    try {
      var spreadsheet = SpreadsheetApp.openById(QUEST_TRACKER_SPREADSHEET_URL.match(/[^\/]{44}/)[0]);
      var sheet = spreadsheet.getSheetByName(QUEST_TRACKER_SPREADSHEET_TAB_NAME);

      // if sheet doesn't exist, print error & exit
      if (sheet === null) {
        log("ERROR: QUEST_TRACKER_SPREADSHEET_TAB_NAME \"" + QUEST_TRACKER_SPREADSHEET_TAB_NAME + "\" doesn't exit.");
        return;
      }

    // if spreadsheet doesn't exist, print error & exit
    } catch (e) {
      if (e.stack.includes("Unexpected error while getting the method or property openById on object SpreadsheetApp")) {
        log("ERROR: QUEST_TRACKER_SPREADSHEET_URL not found: " + QUEST_TRACKER_SPREADSHEET_URL);
        return;
      } else {
        throw e;
      }
    }
    
    log("Getting quest data");

    // get party member data
    let members = getMembers(true).data;

    // get lists of premium eggs, premium hatching potions & wacky hatching potions
    let premiumEggs = [];
    for (egg of Object.values(getContent().data.questEggs)) {
      premiumEggs.push(egg.key);
    }
    let premiumHatchingPotions = [];
    for (potion of Object.values(content.data.premiumHatchingPotions)) {
      premiumHatchingPotions.push(potion.key);
    }
    let wackyHatchingPotions = [];
    for (potion of Object.values(content.data.wackyHatchingPotions)) {
      wackyHatchingPotions.push(potion.key);
    }

    // for each quest
    let eggQuests = [];
    let hatchingPotionQuests = [];
    let petQuests = [];
    let mountQuests = [];
    let unlockableQuests = [];
    let masterclasserQuests = [];
    let otherQuests = [];
    for (quest of Object.values(content.data.quests)) {

      // if not a world boss
      if (quest.category != "world") {

        // get rewards
        let rewards = [];
        let numEggs = 0;
        let numHatchingPotions = 0;
        let numWackyPotions = 0;
        if (typeof quest.drop.items !== "undefined") {

          for (drop of quest.drop.items) {

            let rewardName = drop.text;
            let rewardType = "";

            if (drop.type == "eggs" && premiumEggs.includes(drop.key)) {
              rewardName = drop.text.replaceAll("(", "").replaceAll(")", "");
              if (rewardName == "Plain Egg") {
                rewardName = "Egg Egg";
              }
              rewardType = "egg";
              numEggs++;
            } else if (drop.type == "hatchingPotions" && premiumHatchingPotions.includes(drop.key)) {
              rewardType = "hatchingPotion";
              numHatchingPotions++;
            } else if (drop.type == "hatchingPotions" && wackyHatchingPotions.includes(drop.key)) {
              rewardType = "wackyPotion";
              numWackyPotions++;
            } else if (drop.type == "mounts") {
              rewardType = "mount";
            } else if (drop.type == "pets") {
              rewardType = "pet";
            } else if (drop.type == "gear") {
              rewardType = "gear";
            }

            if (rewardType != "") {
              let index = rewards.findIndex(reward => reward.name == rewardName);
              if (index == -1) {
                rewards.push({
                  name: rewardName,
                  type: rewardType,
                  qty: 1
                });
              } else {
                rewards[index].qty++;
              }
            }
          }
        }

        // get completions needed
        let completionsNeeded = 1;
        if (numEggs > 0) {
          completionsNeeded = Math.max(completionsNeeded, Math.ceil(20 / numEggs));
        }
        if (numHatchingPotions > 0) {
          completionsNeeded = Math.max(completionsNeeded, Math.ceil(18 / numHatchingPotions));
        }
        if (numWackyPotions > 0) {
          completionsNeeded = Math.max(completionsNeeded, Math.ceil(9 / numWackyPotions));
        }

        // get completions
        let completions = {};
        for (member of members) {
          let timesCompleted = 0;
          for ([questKey, numCompletions] of Object.entries(member.achievements.quests)) {
            if (questKey == quest.key) {
              timesCompleted = Math.min(numCompletions, completionsNeeded);
              break;
            }
          }
          completions[member.auth.local.username] = timesCompleted;
        }

        // add to quest list
        let questInfo = {
          name: quest.text,
          rewards,
          completionsNeeded,
          completions
        };
        let rewardType = rewards.length > 0 ? rewards[0].type : null;
        if (quest.group == "questGroupDilatoryDistress" || quest.group == "questGroupTaskwoodsTerror" || quest.group == "questGroupStoikalmCalamity" || quest.group == "questGroupMayhemMistiflying" || quest.group == "questGroupLostMasterclasser") {
          masterclasserQuests.push(questInfo);
        } else if (quest.text == "The Basi-List" || quest.text == "The Feral Dust Bunnies") {
          otherQuests.push(questInfo);
        } else if (rewardType == "egg") {
          eggQuests.push(questInfo);
        } else if (["hatchingPotion", "wackyPotion"].includes(rewardType)) {
          hatchingPotionQuests.push(questInfo);
        } else if (rewardType == "pet") {
          petQuests.push(questInfo);
        } else if (rewardType == "mount") {
          mountQuests.push(questInfo);
        } else if (quest.category == "unlockable") {
          unlockableQuests.push(questInfo);
        }
      }
    }

    // compare each pair of egg quests
    for (let i=0; i<eggQuests.length; i++) {
      for (let j=i+1; j<eggQuests.length; j++) {

        // if rewards are the same
        if (eggQuests[i].rewards.map(x => JSON.stringify(x)).sort((a, b) => a.localeCompare(b)).join(",") === eggQuests[j].rewards.map(x => JSON.stringify(x)).sort((a, b) => a.localeCompare(b)).join(",")) {

          // combine completionsNeeded
          let completionsNeeded = Math.max(eggQuests[i].completionsNeeded, eggQuests[j].completionsNeeded);
          
          // combine completions
          let completions = {};
          for (key of Object.keys(eggQuests[i].completions)) {
            let timesCompleted = Math.min(eggQuests[i].completions[key] + eggQuests[j].completions[key], completionsNeeded);
            completions[key] = timesCompleted;
          }

          // combine everythine else & save to quest list
          eggQuests.push({
            name: eggQuests[i].name + " OR " + eggQuests[j].name,
            rewards: eggQuests[i].rewards,
            completionsNeeded,
            completions
          });

          // delete individual quests
          eggQuests.splice(j, 1);
          eggQuests.splice(i, 1);
          j = i;
        }
      }
    }

    // sort egg, hatching potion, pet, & mount quests alphabetically by reward name
    eggQuests.sort((a, b) => {
      return a.rewards[0].name.localeCompare(b.rewards[0].name);
    });
    hatchingPotionQuests.sort((a, b) => {
      return a.rewards[0].name.localeCompare(b.rewards[0].name);
    });
    petQuests.sort((a, b) => {
      return a.rewards[0].name.localeCompare(b.rewards[0].name);
    });
    mountQuests.sort((a, b) => {
      return a.rewards[0].name.localeCompare(b.rewards[0].name);
    });

    // combine quests into one list
    let quests = eggQuests.concat(hatchingPotionQuests).concat(petQuests).concat(mountQuests).concat(masterclasserQuests).concat(unlockableQuests).concat(otherQuests);

    log("Updating Quest Tracker");

    // clear sheet
    let generatedContent = sheet.getRange(2, 1, Math.max(sheet.getLastRow(), 2), Math.max(sheet.getLastColumn(), 1));
    generatedContent.clearContent().setBackground(null).breakApart();

    // get list of usernames
    let usernames = Object.keys(quests[0].completions);

    // sort usernames alphabetically
    usernames.sort((a, b) => {
      return a.localeCompare(b);
    });

    // print headings (usernames and TOTAL)
    sheet.getRange(2, 3, 1, usernames.length+1).setValues([["TOTAL"].concat(usernames)]).setHorizontalAlignment("center").setFontWeight("bold");

    // print categories in spreadsheet
    let firstEmptyRow = 3;
    let color1 = "#ffffff";
    let color2 = "#ebf4ff";
    sheet.getRange(firstEmptyRow, 1, quests.length).setTextRotation(90).setVerticalAlignment("middle").setFontWeight("bold");
    sheet.getRange(firstEmptyRow, 1, eggQuests.length, 2).setBackground(color1).offset(0, 0, eggQuests.length, 1).merge().setValue("Eggs");
    firstEmptyRow += eggQuests.length;
    sheet.getRange(firstEmptyRow, 1, hatchingPotionQuests.length, 2).setBackground(color2).offset(0, 0, hatchingPotionQuests.length, 1).merge().setValue("Hatching Potions");
    firstEmptyRow += hatchingPotionQuests.length;
    sheet.getRange(firstEmptyRow, 1, petQuests.length+mountQuests.length, 2).setBackground(color1).offset(0, 0, petQuests.length+mountQuests.length, 1).merge().setValue("Pets");
    firstEmptyRow += petQuests.length+mountQuests.length;
    sheet.getRange(firstEmptyRow, 1, masterclasserQuests.length, 2).setBackground(color2).offset(0, 0, masterclasserQuests.length, 1).merge().setValue("Masterclasser");
    firstEmptyRow += masterclasserQuests.length;
    sheet.getRange(firstEmptyRow, 1, unlockableQuests.length, 2).setBackground(color1).offset(0, 0, unlockableQuests.length, 1).merge().setValue("Unlockable");
    firstEmptyRow += unlockableQuests.length;
    sheet.getRange(firstEmptyRow, 1, otherQuests.length, 2).setBackground(color2).offset(0, 0, otherQuests.length, 1).merge().setValue("Other");

    // misc formatting
    sheet.setFrozenRows(2);
    sheet.setFrozenColumns(2);
    sheet.getRange(3, 2, sheet.getLastRow(), 1).setHorizontalAlignment("right").setFontWeight("bold");

    // create array for TOTAL row
    let totals = new Array(usernames.length).fill(0);

    // for each quest
    let sumUsersPercentComplete = 0;
    for (let i=0; i<quests.length; i++) {

      // print quest reward or name
      let reward = quests[i].rewards[0];
      if (i < eggQuests.length) {
        sheet.getRange(i+3, 2).setValue(reward.name.substring(0, reward.name.length - 4));
      } else if (i < eggQuests.length + hatchingPotionQuests.length) {
        sheet.getRange(i+3, 2).setValue(reward.name.substring(0, reward.name.length - 16));
      } else if (i < eggQuests.length + hatchingPotionQuests.length + petQuests.length + mountQuests.length) {
        sheet.getRange(i+3, 2).setValue(reward.name);
      } else {
        sheet.getRange(i+3, 2).setValue(quests[i].name.split(":")[0].replace(/^The /, "").replace(", Part", ""));
      }

      // get completions for each member
      let completions = Object.entries(quests[i].completions);

      // sort completions by username
      completions.sort((a, b) => {
        return a[0].localeCompare(b[0]);
      });

      // for each member
      let totalQuestCompletions = 0;
      let totalQuestCompletionsNeeded = 0;
      for (let j=0; j<completions.length; j++) {

        // print completions/completions needed
        let numCompletions = completions[j][1];
        let completionsNeeded = quests[i].completionsNeeded;
        let cell = sheet.getRange(i+3, j+4);
        cell.setValue(numCompletions + "/" + completionsNeeded).setHorizontalAlignment("center").setFontStyle("normal");
        if (numCompletions >= completionsNeeded) {
          cell.setBackground("#b6d7a8");
        } else if (numCompletions >= 1) {
          cell.setBackground("#ffe599");
        } else {
          cell.setBackground("#ea9999");
        }

        // add completions for TOTAL column
        totalQuestCompletions += numCompletions;
        totalQuestCompletionsNeeded += completionsNeeded;

        // add percentage to TOTAL row
        totals[j] += numCompletions / completionsNeeded;
        if (i == quests.length-1) {
          let userPercentComplete = totals[j] / quests.length * 100;
          totals[j] = Math.floor(userPercentComplete) + "%";
          sumUsersPercentComplete += userPercentComplete;
        }
      }

      // print TOTAL column
      sheet.getRange(i+3, 3).setValue(Math.floor(totalQuestCompletions / totalQuestCompletionsNeeded * 100) + "%").setHorizontalAlignment("center").setFontStyle("normal");
    }

    // print TOTAL row
    sheet.getRange(sheet.getLastRow()+1, 2).setValue("TOTAL");
    sheet.getRange(sheet.getLastRow(), 3).setValue(Math.floor(sumUsersPercentComplete / usernames.length) + "%").setHorizontalAlignment("center").setFontStyle("normal");
    sheet.getRange(sheet.getLastRow(), 4, 1, totals.length).setValues([totals]).setHorizontalAlignment("center").setFontStyle("normal");

    // print last updated
    sheet.getRange(sheet.getLastRow()+2, 3, 1, 1).setHorizontalAlignment("left").setFontStyle("italic").setValues([["Last updated: " + new Date().toUTCString()]]);

  } catch (e) {
    log(e);
    throw e;
  }
}