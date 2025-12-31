import * as Assert from '../_assert.js';
import { buildMonthMatrix } from '../../lib/monthMatrix.js';

// Basic shape
{
  const cells = buildMonthMatrix({ daysInMonth: 31, firstDayOfWeek: 3, prevMonthDays: 30 });
  Assert.assertEquals(cells.length, 42, 'should always return 42 cells');
}

// Leading cells from previous month
{
  const cells = buildMonthMatrix({ daysInMonth: 31, firstDayOfWeek: 3, prevMonthDays: 30 });
  Assert.assertEquals(cells[0].day, 28, 'prev month day should start at 28');
  Assert.assertEquals(cells[2].day, 30, 'prev month day should end at 30');
  Assert.assertTruthy(!cells[0].inMonth, 'leading cells should be out of month');
  Assert.assertTruthy(cells[3].inMonth, 'day 1 should be in month');
  Assert.assertEquals(cells[3].day, 1, 'day 1 should land after leading cells');
}

// Trailing cells from next month
{
  const cells = buildMonthMatrix({ daysInMonth: 30, firstDayOfWeek: 0, prevMonthDays: 31 });
  Assert.assertEquals(cells[0].day, 1, 'first cell should be day 1 when firstDayOfWeek=0');
  Assert.assertEquals(cells[29].day, 30, 'last in-month day should be 30');
  Assert.assertTruthy(!cells[30].inMonth, 'trailing should be out of month');
  Assert.assertEquals(cells[30].day, 1, 'first trailing day should be 1');
}

console.log('All month matrix unit tests passed!');


