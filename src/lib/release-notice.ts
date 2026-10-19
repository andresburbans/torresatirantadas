export const RELEASE_NOTICE_STORAGE='rumbo3d-release-notice-v1';
export type ReleaseNoticeState={version:string;firstSeenAt:number;expiresAt:number;lastShownDay:string|null;muted:boolean};
export function localDay(now:Date){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function releaseNoticeState(raw:unknown,version:string,now:Date):ReleaseNoticeState {
  if(raw&&typeof raw==='object'){
    const v=raw as Partial<ReleaseNoticeState>;
    if(v.version===version&&typeof v.firstSeenAt==='number'&&Number.isFinite(v.firstSeenAt)&&typeof v.expiresAt==='number'&&Number.isFinite(v.expiresAt)&&v.expiresAt>v.firstSeenAt&&v.expiresAt-v.firstSeenAt<=8*86400000&&(v.lastShownDay===null||typeof v.lastShownDay==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.lastShownDay))&&typeof v.muted==='boolean')return {...v} as ReleaseNoticeState;
  }
  // Seven local calendar days, including the first; date arithmetic handles DST.
  const end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+7);
  return {version,firstSeenAt:now.getTime(),expiresAt:end.getTime(),lastShownDay:null,muted:false};
}
export function shouldShowRelease(state:ReleaseNoticeState,now:Date){
  return !state.muted&&now.getTime()>=state.firstSeenAt&&now.getTime()<state.expiresAt&&state.lastShownDay!==localDay(now);
}
