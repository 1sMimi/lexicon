import {expect,it} from 'vitest';
import {deferRecall,emptyDraft,finishTask,nextRecall} from './study-session';

it('interleaves recall, preserves a failed first answer, and drains at session end',()=>{
  let draft=deferRecall(emptyDraft(),{id:'a'},3);
  expect(nextRecall(draft,true)).toBeUndefined();
  for(const id of ['b','c','d']) draft=finishTask(draft,id);
  expect(nextRecall(draft,true)?.id).toBe('a');
  draft=deferRecall(draft,{id:'a',firstCorrect:false},2);
  expect(nextRecall(draft,true)).toBeUndefined();
  expect(nextRecall(JSON.parse(JSON.stringify(draft)),false)).toMatchObject({id:'a',firstCorrect:false});
  expect(nextRecall(finishTask(draft,'a'),false)).toBeUndefined();
});
