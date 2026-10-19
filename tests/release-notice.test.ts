import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localDay, releaseNoticeState, shouldShowRelease } from '../src/lib/release-notice';

const first=new Date(2026,9,19,12);
test('a newly detected release shows once per local calendar day, including after reload',()=>{
  const fresh=releaseNoticeState(null,'commit-1',first);assert.ok(shouldShowRelease(fresh,first));
  const shown={...fresh,lastShownDay:localDay(first)};
  const saved=releaseNoticeState(JSON.parse(JSON.stringify(shown)),'commit-1',new Date(2026,9,19,23,59));
  assert.equal(shouldShowRelease(saved,new Date(2026,9,19,23,59)),false);
  assert.equal(shouldShowRelease(saved,new Date(2026,9,20,0,0)),true);
  assert.equal(shouldShowRelease(shown,new Date(2026,9,19,11)),false); // Clock rollback does not repeat.
});
test('the reminder expires after seven local dates and does not restart on a late visit',()=>{
  let state=releaseNoticeState(null,'commit-1',first);
  for(let day=19;day<26;day++){
    const now=new Date(2026,9,day,12);assert.equal(shouldShowRelease(state,now),true);
    state=releaseNoticeState({...state,lastShownDay:localDay(now)},'commit-1',now);
    assert.equal(shouldShowRelease(state,now),false);
  }
  assert.equal(shouldShowRelease(state,new Date(2026,9,26,0)),false);
  const late=releaseNoticeState(state,'commit-1',new Date(2026,11,1));
  assert.equal(shouldShowRelease(late,new Date(2026,11,1)),false);
});
test('do not show again survives saved state but a different commit resets the choice and notes window',()=>{
  const muted={...releaseNoticeState(null,'commit-1',first),muted:true,lastShownDay:localDay(first)};
  const tomorrow=new Date(2026,9,20,12);
  assert.equal(shouldShowRelease(releaseNoticeState(muted,'commit-1',tomorrow),tomorrow),false);
  const newer=releaseNoticeState(muted,'commit-2',tomorrow);
  assert.equal(newer.muted,false);assert.equal(newer.lastShownDay,null);assert.ok(shouldShowRelease(newer,tomorrow));
});
test('invalid stored preferences recover and seven-day windows cross month boundaries',()=>{
  for(const raw of [{},[],{version:'commit-1',firstSeenAt:NaN},{version:'commit-1',firstSeenAt:0,expiresAt:Infinity,muted:false,lastShownDay:null}])assert.ok(shouldShowRelease(releaseNoticeState(raw,'commit-1',first),first));
  const jan=new Date(2027,0,30,23,55),state=releaseNoticeState(null,'commit-3',jan);
  assert.equal(state.expiresAt,new Date(2027,1,6).getTime());
  assert.equal(shouldShowRelease(state,new Date(2027,1,5,23,59)),true);
  assert.equal(shouldShowRelease(state,new Date(2027,1,6)),false);
});
