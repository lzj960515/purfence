// All holidays with their fixed dates (month-day)
const ALL_HOLIDAYS = [
  {
    name: "New Year's Day",
    startDate: '01-01',
    description:
      'Start of the Gregorian calendar year, widely celebrated across cultures.',
  },
  {
    name: 'Martin Luther King Jr. Day',
    startDate: '01-20',
    description:
      "Honors the civil rights leader's legacy and promotes racial equality and community service.",
  },
  {
    name: 'Groundhog Day',
    startDate: '02-02',
    description: 'A quirky tradition predicting the length of winter.',
  },
  {
    name: 'Lunar New Year',
    startDate: '01-29',
    endDate: '02-01',
    description:
      'Celebrated by many Asian cultures to mark the start of the new lunar calendar.',
  },
  {
    name: "Valentine's Day",
    startDate: '02-14',
    description:
      'Celebrates romantic love and drives spending on gifts, flowers, and experiences.',
  },
  {
    name: "Presidents' Day",
    startDate: '02-17',
    description:
      'Recognizes past U.S. presidents and is tied to major retail sales.',
  },
  {
    name: 'Mardi Gras',
    startDate: '03-04',
    description:
      'A festive day before Lent begins, celebrated with parades and parties, especially in New Orleans.',
  },
  {
    name: "International Women's Day",
    startDate: '03-08',
    description:
      'Celebrates the achievements of women and calls for gender equity worldwide.',
  },
  {
    name: "St. Patrick's Day",
    startDate: '03-17',
    description:
      'An Irish-American cultural holiday known for parades, green attire, and celebrations.',
  },
  {
    name: 'Holi',
    startDate: '03-14',
    description:
      'A Hindu festival of colors celebrating the arrival of spring and the triumph of good over evil.',
  },
  {
    name: 'Purim',
    startDate: '03-13',
    endDate: '03-14',
    description:
      'A Jewish holiday commemorating the salvation of the Jewish people in ancient Persia, celebrated with costumes and charity.',
  },
  {
    name: 'Easter Sunday',
    startDate: '04-20',
    description:
      'Christian holiday celebrating the resurrection of Jesus, also associated with spring shopping.',
  },
  {
    name: "April Fools' Day",
    startDate: '04-01',
    description: 'A lighthearted day known for pranks and humor.',
  },
  {
    name: 'Ramadan',
    startDate: '03-29',
    endDate: '04-27',
    description:
      'A month of fasting, prayer, and reflection observed by Muslims.',
  },
  {
    name: 'Earth Day',
    startDate: '04-22',
    description:
      'Focuses on environmental awareness, sustainability, and eco-conscious action.',
  },
  {
    name: 'Passover',
    startDate: '04-12',
    endDate: '04-20',
    description: 'Jewish festival commemorating the Exodus from Egypt.',
  },
  {
    name: 'Cinco de Mayo',
    startDate: '05-05',
    description:
      'Mexican-American celebration of heritage and the victory at the Battle of Puebla.',
  },
  {
    name: "Mother's Day",
    startDate: '05-11',
    description:
      'Honors mothers and maternal figures, tied to high gift and flower sales.',
  },
  {
    name: 'Memorial Day',
    startDate: '05-26',
    description:
      'Honors fallen military personnel and marks the start of summer with big retail promotions.',
  },
  {
    name: 'Pride Month',
    startDate: '06-01',
    endDate: '06-30',
    description:
      'Celebrates LGBTQ+ identities and history, with parades, events, and activism.',
  },
  {
    name: 'Juneteenth',
    startDate: '06-19',
    description: 'Commemorates the emancipation of enslaved African Americans.',
  },
  {
    name: "Father's Day",
    startDate: '06-15',
    description:
      'Celebrates fathers and father figures with gifts and appreciation.',
  },
  {
    name: 'Eid al-Fitr',
    startDate: '04-27',
    description:
      'Marks the end of Ramadan and is celebrated with feasts and community gatherings.',
  },
  {
    name: 'Independence Day (Fourth of July)',
    startDate: '07-04',
    description:
      'Celebrates the birth of American independence with fireworks and patriotic displays.',
  },
  {
    name: 'Labor Day',
    startDate: '09-01',
    description:
      'Honors American workers and is tied to back-to-school and end-of-summer sales.',
  },
  {
    name: 'Rosh Hashanah',
    startDate: '09-22',
    endDate: '09-24',
    description: 'Jewish New Year, a time of reflection and renewal.',
  },
  {
    name: 'Yom Kippur',
    startDate: '10-01',
    description:
      'The Jewish Day of Atonement, focused on fasting, prayer, and forgiveness.',
  },
  {
    name: 'Hispanic Heritage Month',
    startDate: '09-15',
    endDate: '10-15',
    description:
      'Celebrates the contributions of Hispanic and Latino Americans.',
  },
  {
    name: 'Diwali',
    startDate: '10-21',
    endDate: '10-25',
    description:
      'Hindu festival of lights symbolizing the triumph of light over darkness.',
  },
  {
    name: "Indigenous Peoples' Day",
    startDate: '10-13',
    description:
      'Honors Native American culture and history, recognized in place of or alongside Columbus Day in many states.',
  },
  {
    name: 'Halloween',
    startDate: '10-31',
    description:
      'Popular cultural holiday focused on costumes, candy, and spooky festivities.',
  },
  {
    name: 'Día de los Muertos',
    startDate: '11-01',
    endDate: '11-02',
    description:
      'Mexican holiday honoring deceased loved ones with altars, food, and remembrance.',
  },
  {
    name: 'Veterans Day',
    startDate: '11-11',
    description: 'Honors all U.S. military veterans.',
  },
  {
    name: 'Thanksgiving',
    startDate: '11-27',
    description:
      'A national holiday centered around gratitude, food, and family gatherings.',
  },
  {
    name: 'Black Friday',
    startDate: '11-28',
    description: 'Major retail holiday marking the start of holiday shopping.',
  },
  {
    name: 'Small Business Saturday',
    startDate: '11-29',
    description: 'Encourages support for local small businesses.',
  },
  {
    name: 'Cyber Monday',
    startDate: '12-01',
    description: 'Online shopping event following Black Friday.',
  },
  {
    name: 'Giving Tuesday',
    startDate: '12-02',
    description: 'A day of charitable giving and nonprofit support.',
  },
  {
    name: 'Hanukkah',
    startDate: '12-23',
    endDate: '12-30',
    description:
      'Jewish Festival of Lights commemorating the rededication of the Temple in Jerusalem.',
  },
  {
    name: 'Christmas Eve',
    startDate: '12-24',
    description:
      'The night before Christmas, often a key shopping and travel day.',
  },
  {
    name: 'Christmas Day',
    startDate: '12-25',
    description:
      'Christian holiday celebrating the birth of Jesus, widely observed with gift-giving.',
  },
  {
    name: 'Kwanzaa',
    startDate: '12-26',
    endDate: '01-01',
    description:
      'Celebrates African-American culture, heritage, and community through seven days of reflection.',
  },
  {
    name: "New Year's Eve",
    startDate: '12-31',
    description:
      'Marks the end of the year, celebrated with parties and countdowns.',
  },
];

export function getUpcomingHolidays(startDate: Date, endDate: Date) {
  const currentYear = startDate.getFullYear();
  const result = [];
  for (const holiday of ALL_HOLIDAYS) {
    // Parse start date
    const [startMonth, startDay] = holiday.startDate.split('-').map(Number);
    // Create start date for this year
    const holidayStartDate = new Date(currentYear, startMonth - 1, startDay);
    // Parse end date (if it exists)
    let holidayEndDate: Date;
    if (holiday.endDate) {
      const [endMonth, endDay] = holiday.endDate.split('-').map(Number);
      holidayEndDate = new Date(currentYear, endMonth - 1, endDay);
      // Handle year boundary crossing (like Kwanzaa Dec-Jan)
      if (endMonth < startMonth) {
        holidayEndDate.setFullYear(currentYear + 1);
      }
    } else {
      // If no end date specified, set end date equal to start date
      holidayEndDate = new Date(holidayStartDate);
    }
    // If the holiday has already passed this year, set it to next year
    if (holidayEndDate < startDate) {
      holidayStartDate.setFullYear(currentYear + 1);
      holidayEndDate.setFullYear(currentYear + 1);
    }
    // Check if this holiday is within our target range (next 30 days)
    // A holiday is within range if:
    // 1. Its start date is within the range, OR
    // 2. Its end date is within the range, OR
    // 3. The holiday spans over our range (starts before and ends after)
    const holidayStartsWithinRange =
      holidayStartDate >= startDate && holidayStartDate <= endDate;
    const holidayEndsWithinRange =
      holidayEndDate >= startDate && holidayEndDate <= endDate;
    const holidaySpansEntireRange =
      holidayStartDate <= startDate && holidayEndDate >= endDate;
    if (
      holidayStartsWithinRange ||
      holidayEndsWithinRange ||
      holidaySpansEntireRange
    ) {
      result.push({
        name: holiday.name,
        startDate: holidayStartDate,
        endDate: holidayEndDate,
        description: holiday.description,
      });
    }
  }
  // Sort by start date
  return result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}
