import {expect,it} from 'vitest';
import {defaultReminder,localDate,readReminder,reminderDue} from './reminder';

it('respects enablement, local weekday and time, and the daily dismissal',()=>{
  const now = new Date(2026,10,26,19,0);
  const reminder = {...defaultReminder,enabled:true,days:[now.getDay()]};
  expect(reminderDue(defaultReminder,now,undefined)).toBe(false);
  expect(reminderDue(reminder,new Date(2026,10,26,18,59),undefined)).toBe(false);
  expect(reminderDue(reminder,new Date(2026,10,27,19,0),undefined)).toBe(false);
  expect(reminderDue(readReminder(JSON.stringify(reminder)),now,undefined)).toBe(true);
  expect(reminderDue(reminder,now,localDate(now))).toBe(false);
  expect(readReminder('{"enabled":true,"time":"99:00","days":[0]}')).toEqual(defaultReminder);
});
