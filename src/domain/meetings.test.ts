import {
  groupMeetings,
  isTime,
  meetingStart,
  meetingWhenLabel,
  pendingReminderTime,
  reminderTime,
  timeLabel,
  upcomingWithinDays,
} from './meetings';

const at = (y: number, mo: number, d: number, h = 0, min = 0) => new Date(y, mo - 1, d, h, min);

describe('meeting times', () => {
  test('timeLabel converts 24h to 12h', () => {
    expect(timeLabel('00:00')).toBe('12:00 am');
    expect(timeLabel('12:30')).toBe('12:30 pm');
    expect(timeLabel('23:05')).toBe('11:05 pm');
  });

  test('isTime accepts 24h HH:MM only', () => {
    expect(isTime('00:00')).toBe(true);
    expect(isTime('23:59')).toBe(true);
    expect(isTime('24:00')).toBe(false);
    expect(isTime('9:30')).toBe(false);
    expect(isTime('10:60')).toBe(false);
  });

  test('meetingStart builds a local date-time and rejects invalid input', () => {
    expect(meetingStart({ date: '2026-11-12', time: '16:30' })).toEqual(at(2026, 11, 12, 16, 30));
    expect(meetingStart({ date: '2026-02-30', time: '10:00' })).toBeNull();
    expect(meetingStart({ date: '2026-11-12', time: '25:00' })).toBeNull();
  });

  test('reminderTime subtracts each lead time', () => {
    const base = { date: '2026-11-12', time: '10:00' };
    expect(reminderTime({ ...base, reminderMinutes: 0 })).toEqual(at(2026, 11, 12, 10, 0));
    expect(reminderTime({ ...base, reminderMinutes: 15 })).toEqual(at(2026, 11, 12, 9, 45));
    expect(reminderTime({ ...base, reminderMinutes: 60 })).toEqual(at(2026, 11, 12, 9, 0));
    expect(reminderTime({ ...base, reminderMinutes: 1440 })).toEqual(at(2026, 11, 11, 10, 0));
  });

  test('a 1-day reminder crosses month and year boundaries', () => {
    expect(reminderTime({ date: '2027-01-01', time: '09:00', reminderMinutes: 1440 })).toEqual(
      at(2026, 12, 31, 9, 0),
    );
    expect(reminderTime({ date: '2026-03-01', time: '00:10', reminderMinutes: 15 })).toEqual(
      at(2026, 2, 28, 23, 55),
    );
  });

  test('pendingReminderTime skips done meetings and reminders already passed', () => {
    const now = at(2026, 11, 12, 9, 30);
    const m = { date: '2026-11-12', time: '10:00', reminderMinutes: 15, done: 0 };
    expect(pendingReminderTime(m, now)).toEqual(at(2026, 11, 12, 9, 45));
    expect(pendingReminderTime({ ...m, reminderMinutes: 60 }, now)).toBeNull(); // 9:00 already passed
    expect(pendingReminderTime({ ...m, done: 1 }, now)).toBeNull();
  });
});

describe('grouping', () => {
  const now = at(2026, 11, 8, 12, 0);
  const m = (id: number, date: string, time: string, done = 0) => ({ id, date, time, done });
  const meetings = [
    m(1, '2026-11-10', '09:00'),
    m(2, '2026-11-08', '15:00'),
    m(3, '2026-11-08', '11:00'), // earlier today, not done -> past
    m(4, '2026-11-01', '10:00', 1),
    m(5, '2026-11-20', '10:00'),
    m(6, '2026-11-05', '10:00'),
    m(7, '2026-11-09', '10:00', 1), // done even though it is in the future
  ];

  test('upcoming soonest first; past and done most recent first', () => {
    const g = groupMeetings(meetings, now);
    expect(g.upcoming.map((x) => x.id)).toEqual([2, 1, 5]);
    expect(g.past.map((x) => x.id)).toEqual([3, 6]);
    expect(g.done.map((x) => x.id)).toEqual([7, 4]);
  });

  test('upcomingWithinDays keeps today through the end of the Nth day', () => {
    expect(upcomingWithinDays(meetings, 0, now).map((x) => x.id)).toEqual([2]);
    expect(upcomingWithinDays(meetings, 2, now).map((x) => x.id)).toEqual([2, 1]);
    expect(upcomingWithinDays(meetings, 30, now).map((x) => x.id)).toEqual([2, 1, 5]);
  });

  test('meetingWhenLabel names nearby days and formats 12h time', () => {
    expect(meetingWhenLabel({ date: '2026-11-08', time: '16:30' }, now)).toBe('Today, 4:30 pm');
    expect(meetingWhenLabel({ date: '2026-11-09', time: '00:05' }, now)).toBe('Tomorrow, 12:05 am');
    expect(meetingWhenLabel({ date: '2026-11-20', time: '12:00' }, now)).toBe('20 Nov 2026, 12:00 pm');
  });
});
