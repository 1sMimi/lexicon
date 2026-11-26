import { expect,it } from 'vitest';
import {learningMetrics,capabilityPerformance,type LearningEvent} from './insight-metrics';
const time=new Date(2026,0,2,12).getTime();
const event=(id:string,wordId:string,reviewedAt:number):LearningEvent=>({id,wordId,reviewedAt,questionType:'spelling',correct:true,responseTime:1000});
it('separates first learning from reviews using all history before range filtering',()=>{const events=[event('1','word',time-86400000),event('2','word',time),event('3','new',time+1)];const result=learningMetrics(events,time,time);expect(result.newInRange).toBe(1);expect(result.reviewsInRange).toHaveLength(1);expect(result.todayNew).toBe(1);expect(result.totalLearned).toBe(2);expect(result.growth.at(-1)?.value).toBe(2)});
it('deduplicates event identities and reports unassessed dimensions honestly',()=>{const row=event('same','word',time);expect(learningMetrics([row,row],0,time).totalLearned).toBe(1);expect(learningMetrics([row,row],0,time).reviewsInRange).toHaveLength(0);expect(capabilityPerformance([row]).find(item=>item.name==='Listening')?.accuracy).toBeNull();expect(capabilityPerformance([row]).find(item=>item.name==='Spelling')?.accuracy).toBe(100)});
