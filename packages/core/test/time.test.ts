import assert from 'node:assert/strict';
import test from 'node:test';
import { addMinutesToClockTime, formatClockTime, formatDuration, isClockTime, isNonNegativeInteger, minutesBetweenClockTimes, parseClockTime } from '../src/index.js';

test('isClockTime accepts valid HH:mm formats', () => {
  assert.equal(isClockTime('00:00'), true);
  assert.equal(isClockTime('23:59'), true);
  assert.equal(isClockTime('12:30'), true);
  assert.equal(isClockTime('09:05'), true);
  assert.equal(isClockTime('20:00'), true);
});

test('isClockTime rejects invalid formats', () => {
  assert.equal(isClockTime('24:00'), false);
  assert.equal(isClockTime('12:60'), false);
  assert.equal(isClockTime('9:00'), false);
  assert.equal(isClockTime('12:3'), false);
  assert.equal(isClockTime(''), false);
  assert.equal(isClockTime('abc'), false);
  assert.equal(isClockTime('1200'), false);
});

test('parseClockTime converts HH:mm to total minutes', () => {
  assert.equal(parseClockTime('00:00'), 0);
  assert.equal(parseClockTime('01:00'), 60);
  assert.equal(parseClockTime('22:30'), 1350);
  assert.equal(parseClockTime('23:59'), 1439);
  assert.equal(parseClockTime('06:30'), 390);
});

test('parseClockTime throws on invalid input', () => {
  assert.throws(() => parseClockTime('25:00'));
  assert.throws(() => parseClockTime('abc'));
  assert.throws(() => parseClockTime(''));
  assert.throws(() => parseClockTime('9:00'));
});

test('minutesBetweenClockTimes same day', () => {
  assert.equal(minutesBetweenClockTimes('06:00', '08:00'), 120);
  assert.equal(minutesBetweenClockTimes('00:00', '23:59'), 1439);
  assert.equal(minutesBetweenClockTimes('10:00', '10:30'), 30);
});

test('minutesBetweenClockTimes overnight', () => {
  assert.equal(minutesBetweenClockTimes('22:30', '06:30'), 480);
  assert.equal(minutesBetweenClockTimes('23:59', '00:01'), 2);
  assert.equal(minutesBetweenClockTimes('23:00', '07:00'), 480);
  assert.equal(minutesBetweenClockTimes('22:30', '06:50'), 500);
});

test('formatClockTime converts total minutes to HH:mm', () => {
  assert.equal(formatClockTime(0), '00:00');
  assert.equal(formatClockTime(60), '01:00');
  assert.equal(formatClockTime(90), '01:30');
  assert.equal(formatClockTime(1439), '23:59');
  assert.equal(formatClockTime(410), '06:50');
});

test('formatClockTime wraps around midnight', () => {
  assert.equal(formatClockTime(1440), '00:00');
  assert.equal(formatClockTime(1500), '01:00');
  assert.equal(formatClockTime(-1), '23:59');
});

test('addMinutesToClockTime handles same-day and overnight', () => {
  assert.equal(addMinutesToClockTime('22:30', 120), '00:30');
  assert.equal(addMinutesToClockTime('06:00', 30), '06:30');
  assert.equal(addMinutesToClockTime('22:30', 20), '22:50');
  assert.equal(addMinutesToClockTime('06:30', 20), '06:50');
});

test('formatDuration formats total minutes as HhMM', () => {
  assert.equal(formatDuration(0), '0h00');
  assert.equal(formatDuration(60), '1h00');
  assert.equal(formatDuration(90), '1h30');
  assert.equal(formatDuration(410), '6h50');
  assert.equal(formatDuration(500), '8h20');
});

test('formatDuration handles negative values', () => {
  assert.equal(formatDuration(-30), '-0h30');
  assert.equal(formatDuration(-90), '-1h30');
});

test('isNonNegativeInteger', () => {
  assert.equal(isNonNegativeInteger(0), true);
  assert.equal(isNonNegativeInteger(5), true);
  assert.equal(isNonNegativeInteger(100), true);
  assert.equal(isNonNegativeInteger(-1), false);
  assert.equal(isNonNegativeInteger(1.5), false);
  assert.equal(isNonNegativeInteger(NaN), false);
});
