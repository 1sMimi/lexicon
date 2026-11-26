export interface LearningEvent {id:string;wordId:string;reviewedAt:number;questionType:string;correct:boolean;responseTime:number}
export function localDay(time:number){const date=new Date(time);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
/** First recorded attempt starts learning; subsequent attempts are reviews. Count global identities once. */
export function learningMetrics(events:LearningEvent[],cutoff:number,now=Date.now()){
 const unique=[...new Map(events.map(event=>[event.id,event])).values()].sort((a,b)=>a.reviewedAt-b.reviewedAt||a.id.localeCompare(b.id));
 const seen=new Set<string>();const newEvents:LearningEvent[]=[],reviews:LearningEvent[]=[];const growthByDay=new Map<string,number>();
 for(const event of unique){if(seen.has(event.wordId)){reviews.push(event)}else{seen.add(event.wordId);newEvents.push(event);growthByDay.set(localDay(event.reviewedAt),seen.size)}}
 const today=localDay(now),inRange=unique.filter(event=>event.reviewedAt>=cutoff),rangeReviews=reviews.filter(event=>event.reviewedAt>=cutoff);
 const growth=[...growthByDay].filter(([day])=>day>=localDay(cutoff)).map(([label,value])=>({label,value}));
 if(cutoff>0&&newEvents.some(event=>event.reviewedAt<cutoff)){const baseline=newEvents.filter(event=>event.reviewedAt<cutoff).length;if(growth[0]?.label!==localDay(cutoff))growth.unshift({label:localDay(cutoff),value:baseline});}
 if(seen.size&&growth.at(-1)?.label!==localDay(now))growth.push({label:localDay(now),value:seen.size});
 return {newInRange:newEvents.filter(event=>event.reviewedAt>=cutoff).length,reviewsInRange:rangeReviews,todayNew:newEvents.filter(event=>localDay(event.reviewedAt)===today).length,todayReviews:reviews.filter(event=>localDay(event.reviewedAt)===today).length,totalLearned:seen.size,inRange,growth};
}
export const capabilityQuestions:Record<string,string[]>={Recognition:['recognition','meaning'],Meaning:['meaning','definition-choice'],Listening:['listening','dictation'],Spelling:['spelling','dictation'],'Active Recall':['spelling','recall','definition-recall'],Application:['cloze','collocation','synonym','inflection']};
export function capabilityPerformance(events:LearningEvent[]){return Object.entries(capabilityQuestions).map(([name,types])=>{const relevant=events.filter(event=>types.includes(event.questionType));return {name,attempts:relevant.length,accuracy:relevant.length?Math.round(relevant.filter(event=>event.correct).length/relevant.length*100):null}})}
