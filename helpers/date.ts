/**
 * Get the name of the specified month.
 * @param month 
 * @returns The name of the month (e.g. "January")
 */
function getMonthName(month: number) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; 

  return months[month - 1];
};

/**
 * Get the suffix of the day (e.g. -st, -nd, -rd, and so forth)
 * @param day 
 * @returns The suffix.
 */
function getDaySuffix(day: number) {
  const dayStr = day.toString();
  if (dayStr.endsWith("1") && !dayStr.endsWith("11")) {
    return "st";
  } else if (dayStr.endsWith("2") && !dayStr.endsWith("12")) {
    return "nd";
  } else if (dayStr.endsWith("3") && !dayStr.endsWith("13")) {
    return "rd";
  } else {
    return "th";
  }
}

export { getMonthName, getDaySuffix };