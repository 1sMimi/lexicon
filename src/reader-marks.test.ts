import {expect,it} from 'vitest';
import {locateText,readMarks} from './reader-marks';

it('finds chapter matches with stable offsets and wraps to the first match',()=>{
  const text='First line. Second LINE.';
  expect(locateText(text,'line',0)).toBe(6);
  expect(locateText(text,'line',7)).toBe(19);
  expect(locateText(text,'line',20)).toBe(6);
  expect(locateText(text,'missing',0)).toBe(-1);
});

it('accepts stored marks and skips corrupt ranges',()=>{
  const mark={id:'mark',chapterId:'chapter',start:3,end:5,note:'note',quote:'hi'};
  expect(readMarks(JSON.stringify([null,mark,{...mark,start:8}]))).toEqual([mark]);
});
