/**
 * runCron()
 * 
 * Forces the user to cron if they haven't already cronned today.
 * 
 * Run this function just after the user's day start time.
 */
function runCron() {
  try {

    log("Running cron");
    fetch("https://habitica.com/api/v3/cron", POST_PARAMS);

  } catch (e) {
    log(e);
    throw e;
  }
}