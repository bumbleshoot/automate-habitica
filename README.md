***Automate Habitica is currently in beta. I need beta testers to try it out and let me know if they run into any bugs. I especially need beta testers who are not mages, not in a party, and/or under level 10 (new users or rebirthed). Automate Habitica is mostly bug-free at this point, but there are still some edge cases that haven't been tested yet, so there's a small chance you will see an error while using it. If you're not okay with this, best to wait until Version 1 is released!***

## Summary
Automate Habitica is a suite of automation tools for Habitica, allowing you to focus on your tasks instead of managing gameplay. Each tool can be enabled, disabled, and configured to suit your needs.

## Features
### Auto cron
Automatically runs [cron](https://habitica.fandom.com/wiki/Cron) shortly after your [day start time](https://habitica.fandom.com/wiki/Custom_Day_Start).

### Auto Accept Quest Invites
Automatically and immediately accepts [quest](https://habitica.fandom.com/wiki/Quests) invites from your [party](https://habitica.fandom.com/wiki/Party).

### Force Start Quests
Forces pending [quests](https://habitica.fandom.com/wiki/Quests) to start after `FORCE_START_QUESTS_AFTER_HOURS_MIN` hours, regardless of how many [party](https://habitica.fandom.com/wiki/Party) members have joined. If the script force starts the quest, and if `NOTIFY_MEMBERS_EXCLUDED_FROM_QUEST` is set to `true`, it sends a [private message](https://habitica.fandom.com/wiki/Private_Messaging) to the player with a list of party members who failed to join. Only party leaders can run this automation.

### Auto Invite Quests
Whenever your party completes a quest, automatically selects a random quest scroll from your inventory and invites your party to that quest. There is a ~5-15 min delay between quest ending and using the quest scroll, to give other party members a chance to run their quests too, and to prevent multiple simultaneous quest invitations. If `EXCLUDE_GEM_QUESTS` is set to `true`, the script will not use your gem quest scrolls. If `EXCLUDE_HOURGLASS_QUESTS` is set to `true`, the script will not use your hourglass quest scrolls.

### Notify On Quest End
Sends a [private message](https://habitica.fandom.com/wiki/Private_Messaging) to you on Habitica to notify you whenever your [party](https://habitica.fandom.com/wiki/Party) completes a [quest](https://habitica.fandom.com/wiki/Quests).

### Auto Allocate Stat Points
Stat points are automatically allocated to your chosen [stat](https://habitica.fandom.com/wiki/Character_Stats).

### Auto Cast Skills
Strategically casts your [skills](https://habitica.fandom.com/wiki/Skills) for you. Ensures no [mana](https://habitica.fandom.com/wiki/Mana_Points) is wasted, and no mana is lost at [cron](https://habitica.fandom.com/wiki/Cron). In order from highest to lowest priority:
1. Heals you and your [party](https://habitica.fandom.com/wiki/Party) as needed ([healer](https://habitica.fandom.com/wiki/Healer))
2. Casts Stealth to hide you from any [missed dailies](https://habitica.fandom.com/wiki/Dailies#Uncompleted_Dailies) just before your [day start time](https://habitica.fandom.com/wiki/Custom_Day_Start) ([rogue](https://habitica.fandom.com/wiki/Rogue))
3. Freezes your [streaks](https://habitica.fandom.com/wiki/Streaks) with Chilling Frost just before your day start time ([mage](https://habitica.fandom.com/wiki/Mage))
4. Defeats [bosses](https://habitica.fandom.com/wiki/Boss) with Burst of Flames (mage) or Brutal Smash ([warrior](https://habitica.fandom.com/wiki/Warrior)) just before your day start time
5. Reserves enough mana to start each day with as much mana as possible, then uses all your mana to buff your [class](https://habitica.fandom.com/wiki/Class_System)'s primary [stat](https://habitica.fandom.com/wiki/Character_Stats) just after cron
6. Buffs your class's primary stat whenever extra mana is available (reserves mana for the items listed above)
7. Gives any extra mana to your party with Ethereal Surge (mage) or uses it to cast more buffs (other classes) just before your day start time

### Auto Pause/Resume Damage
Automatically checks you into the [inn](https://habitica.fandom.com/wiki/Rest_in_the_Inn) if the current [boss](https://habitica.fandom.com/wiki/Boss) will do more than `MAX_PLAYER_DAMAGE` to you, or `MAX_PARTY_DAMAGE` to your [party](https://habitica.fandom.com/wiki/Party), or enough damage to [kill](https://habitica.fandom.com/wiki/Death_Mechanics) you or one of your party members. Checks you out of the inn otherwise.

### Auto Purchase Gems
Automatically purchases [gems](https://habitica.fandom.com/wiki/Gems) with [gold](https://habitica.fandom.com/wiki/Gold_Points) each month. Note that you must [cron](https://habitica.fandom.com/wiki/Cron) at least once during a month in order to buy gems for that month. Only [subscribers](https://habitica.fandom.com/wiki/Subscription) can run this automation.

### Auto Purchase Armoires
Any [gold](https://habitica.fandom.com/wiki/Gold_Points) you earn over `RESERVE_GOLD` will automatically be spent on [enchanted armoires](https://habitica.fandom.com/wiki/Enchanted_Armoire).

### Auto Sell Eggs/Hatching Potions/Food
Automatically sells your extra [eggs](https://habitica.fandom.com/wiki/Eggs), [hatching potions](https://habitica.fandom.com/wiki/Hatching_Potions), and/or [food](https://habitica.fandom.com/wiki/Food). You can configure how many you want to keep with `RESERVE_EGGS`, `RESERVE_HATCHING_POTIONS`, and `RESERVE_FOOD`.

### Auto Hatch/Feed Pets
Automatically hatches [pets](https://habitica.fandom.com/wiki/Pets), but only if the player has enough [eggs](https://habitica.fandom.com/wiki/Eggs) for all pets/[mounts](https://habitica.fandom.com/wiki/Mounts) of that species, and enough [hatching potions](https://habitica.fandom.com/wiki/Hatching_Potions) for all pets/mounts of that color. Automatically feeds pets, but only if the player has enough [food](https://habitica.fandom.com/wiki/Food) to feed all pets of that color with their [favorite food](https://habitica.fandom.com/wiki/Food_Preferences). If `ONLY_USE_DROP_FOOD` is set to `true`, the script will only feed basic foods (meat, milk, fish, etc.) to your pets. Special foods like cake, candy, pie, etc. will not be fed.

### Hide Notifications
Hides [notifications](https://habitica.fandom.com/wiki/Notifications?so=search#Parties_and_Guilds) from groups ([party](https://habitica.fandom.com/wiki/Party) & [guilds](https://habitica.fandom.com/wiki/Guilds)) in the Habitica UI. The player can configure which groups they'd like to hide notifications from. To get the ID of a guild, visit the guild in a web browser and copy the end of the URL in your address bar (everything after the last `/`). Note that if you set `HIDE_ALL_GUILD_NOTIFICATIONS` to `true`, it may take up to 15 mins for Automate Habitica to start hiding notifications from any new guilds you join.


## Before Installing
You need to use a desktop computer for this. It will not work on a phone or tablet! First you must uninstall any scripts that do the same thing(s) as Automate Habitica. For example, if you are running the [Auto Accept Quests](https://habitica.fandom.com/wiki/Google_Apps_Script#Auto_Accept_Quests) script, you need to uninstall it, because Automate Habitica also auto accepts quest invites, and these two scripts will conflict with each other. To uninstall a script:
1. Click [here](https://script.google.com/home) to see a list of your scripts. If you're not already signed into your Google account, click the "Start Scripting" button and sign in. Then click on "My Projects" in the main menu on the left.
2. Click on the script you want to uninstall.
3. Click the blue "Deploy" button near the top of the page, then click "Manage deployments".
4. Click the "Archive" button (looks like a box with a down arrow inside), then click the "Done" button. If the script has no deployments, there will be no archive button, and you will see the message "This project has not been deployed yet". In this case, just click "Cancel".
5. In the main menu on the left, click on "Triggers" (looks like an alarm clock).
6. Hover your mouse over each trigger in the list, click the three dots on the right, and click "Delete trigger".
7. If your script had no deployments, you can skip to the last step. If you clicked the "Archive" button, continue to the next step.
8. Click [here](https://habitica.com/user/settings/api) to open your API Settings. Highlight and copy your User ID (it looks something like this: `35c3fb6f-fb98-4bc3-b57a-ac01137d0847`).
9. Click [here](https://robwhitaker.com/habitica-webhook-editor/) to open the Habitica Webhook Editor. Paste your User ID in the "User ID" box.
10. On the same page where you copied your User ID, click the "Show API Token" button, and copy your API Token.
11. In the Habitica Webhook Editor, paste your API Token in the "API Token" box, then click "Login".
12. Click the "Delete" button next to every webhook that belongs to the script you are uninstalling. The webhook should have a large title that matches the name of the script.
13. Repeat the above steps for every script you need to uninstall.

## Setup Instructions
You need to use a desktop computer for this. It will not work on a phone or tablet! Make sure you read the [Before Installing](#before-installing) section above, and follow the instructions there if applicable!
1. Click [here](https://script.google.com/d/1y5jBYAWqi0Lrd5Oo40q9GYu8KIltzas2hxUOS3ecUUjZP35L-EP3j28N/edit?usp=sharing) to go to the Automate Habitica script. If you're not already signed into your Google account, you will be asked to sign in.
2. In the main menu on the left, click on "Overview" (looks like a lowercase letter i inside a circle).
3. Click the "Make a copy" button (looks like two pages of paper).
4. At the top of your screen, click on "Copy of Automate Habitica". Rename it "Automate Habitica" and click the "Rename" button.
5. Click [here](https://habitica.com/user/settings/api) to open your API Settings. Highlight and copy your User ID (it looks something like this: `35c3fb6f-fb98-4bc3-b57a-ac01137d0847`). In the Automate Habitica script, paste your User ID between the quotations where it says `const USER_ID = "";`. It should now look something like this: `const USER_ID = "35c3fb6f-fb98-4bc3-b57a-ac01137d0847";`
6. On the same page where you copied your User ID, click the "Show API Token" button, and copy your API Token. In the Automate Habitica script, paste your API Token between the quotations where it says `const API_TOKEN = "";`. It should now look something like this: `const API_TOKEN = "35c3fb6f-fb98-4bc3-b57a-ac01137d0847";`
7. Skip the line that says `const WEB_APP_URL = "";`. We will come back to that later. Edit all the other settings (`const`s) in the script to your liking. Only edit in between the `=` and the `;`. If there are quotations `""` in between the `=` and the `;`, just type in between the quotations.
8. Click the "Save project" button near the top of the page (looks like a floppy disk).
9. Click the blue "Deploy" button near the top of the page, then click "New deployment". Under "Description", type "Automate Habitica" (without the quotes). Then click the "Deploy" button.
10. Click the "Authorize access" button and select your Google account. Click on "Advanced", then "Go to Automate Habitica (unsafe)". (Don't worry, it is safe!) Then click the "Allow" button.
11. Under "Web app", click the "Copy" button to copy the Web App URL. Then click the "Done" button.
12. Paste your Web App URL inside the quotations where it says `const WEB_APP_URL = "";`.
13. Click the drop-down menu to the right of the "Debug" button, near the top of the page. Select "install" from the drop-down.
14. Click the "Run" button to the left of the "Debug" button. Wait for it to say "Execution completed".

You're all done! If you need to change the settings or uninstall the script at some point, follow the steps below.

## Changing the Settings
You need to use a desktop computer for this. It will not work on a phone or tablet!
1. [Click here](https://script.google.com/home) to see a list of your scripts. If you're not already signed into your Google account, click the "Start Scripting" button and sign in. Then click on "My Projects" in the main menu on the left.
2. Click on "Automate Habitica".
3. Edit the settings (`const`s) to your liking.
4. Click the "Save project" button near the top of the page (looks like a floppy disk).
5. Click the blue "Deploy" button near the top of the page, then click "Manage deployments".
6. Click the "Edit" button (looks like a pencil). Under "Version", select "New version".
7. Click the "Deploy" button, then the "Done" button.
8. Click the drop-down menu to the right of the "Debug" button, near the top of the page. Select "install" from the drop-down.
9. Click the "Run" button to the left of the "Debug" button. Wait for it to say "Execution completed".

## Uninstalling the Script
1. [Click here](https://script.google.com/home) to see a list of your scripts. If you're not already signed into your Google account, click the "Start Scripting" button and sign in. Then click on "My Projects" in the main menu on the left.
2. Click on "Automate Habitica".
3. Click the drop-down menu to the right of the "Debug" button, near the top of the page. Select "uninstall" from the drop-down.
4. Click the "Run" button to the left of the "Debug" button. Wait for it to say "Execution completed".
5. Click the blue "Deploy" button near the top of the page, then click "Manage deployments".
6. Click the "Archive" button (looks like a box with a down arrow inside). Then click the "Done" button.

## Updating the Script
You need to use a desktop computer for this. It will not work on a phone or tablet!
1. Follow the steps in [Uninstalling the Script](#uninstalling-the-script) above.
2. Copy & paste your settings (`const`s) into a text editor so you can reference them while setting up the new version.
3. In the main menu on the left, click on "Overview" (looks like a lowercase letter i inside a circle).
4. Click the "Remove project" button (looks like a trash can).
5. Follow the [Setup Instructions](#setup-instructions) above.

## Contact
❔ Questions: [https://github.com/bumbleshoot/automate-habitica/discussions/categories/q-a](https://github.com/bumbleshoot/automate-habitica/discussions/categories/q-a)  
💡 Suggestions: [https://github.com/bumbleshoot/automate-habitica/discussions/categories/suggestions](https://github.com/bumbleshoot/automate-habitica/discussions/categories/suggestions)  
🐞 Report a bug: [https://github.com/bumbleshoot/automate-habitica/issues](https://github.com/bumbleshoot/automate-habitica/issues)  
💗 Donate: [https://github.com/sponsors/bumbleshoot](https://github.com/sponsors/bumbleshoot)