/**
 * runCron()
 * 
 * Forces the user to cron if they haven't already cronned today.
 * 
 * Run this function just after the user's day start time.
 */
function runCron() {

  console.log("Running cron");

  fetch("https://habitica.com/api/v3/cron", POST_PARAMS);

  scriptProperties.setProperty("LAST_AFTER_CRON", new Date());

  if (AUTO_PAUSE_RESUME_DAMAGE === true) {
    scriptProperties.setProperty("pauseResumeDamage", "true");
  }
}