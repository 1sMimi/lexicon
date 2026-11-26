import {expect,it} from 'vitest';
import {changeMeaningSelection,dictionaryMeanings,excludedMeanings,studyClue} from './study-meaning';

it('excludes selected dictionary glosses from study without losing the last meaning',()=>{
  const items=dictionaryMeanings('n. 银行, 河岸\\nvt. 存入','a financial institution');
  expect(items.map(item=>item.text)).toEqual(['银行','河岸','存入']);
  const hidden=excludedMeanings(JSON.stringify([items[0].id,items[2].id]));
  expect(studyClue(items,hidden,'old custom clue')).toBe('n. 河岸');
  expect(changeMeaningSelection(items,hidden,items[1].id,true)).toBeNull();
  expect(studyClue(items,new Set(),'old custom clue')).toBe('old custom clue');
});
