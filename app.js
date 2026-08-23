const reservations=[
  {start:1,end:2,name:'예약 A',guests:2},{start:2,end:3,name:'예약 B',guests:2},{start:3,end:4,name:'예약 C',guests:2},{start:4,end:5,name:'예약 D',guests:2},
  {start:6,end:10,name:'예약 E',guests:3},{start:10,end:13,name:'예약 F',guests:3},{start:13,end:18,name:'예약 G',guests:2},{start:20,end:24,name:'예약 H',guests:2},{start:24,end:26,name:'예약 I',guests:3},{start:27,end:30,name:'예약 J',guests:2}
];
const blocked={5:'보수·휴식',18:'보수·휴식'};
let cleanerDirectory=JSON.parse(localStorage.getItem('andwith-cleaners')||'null')||[
  {name:'난희',type:'난희 직접 청소',fee:0,property:'all'},
  {name:'홍길동',type:'외주 담당자',fee:50000,property:'and'},
  {name:'김민지',type:'외주 담당자',fee:50000,property:'with'}
];
const cleanerPeople=()=>cleanerDirectory.map(person=>person.name);
let cleaningSchedules=JSON.parse(localStorage.getItem('andwith-cleaning-schedules')||'null')||[
  {day:3,checkout:'11:00',checkin:'16:00',assignee:'',nextGuests:2,nights:1,note:'없음'},
  {day:4,checkout:'11:00',checkin:'16:00',assignee:'난희',nextGuests:2,nights:1,note:'직접 청소'},
  {day:10,checkout:'11:00',checkin:'16:00',assignee:'홍길동',nextGuests:3,nights:3,note:'침구 3인 세팅'},
  {day:13,checkout:'11:00',checkin:'16:00',assignee:'김민지',nextGuests:2,nights:5,note:'없음'},
  {day:18,checkout:'11:00',checkin:'-',assignee:'홍길동',nextGuests:0,nights:0,note:'보수일'},
  {day:24,checkout:'11:00',checkin:'16:00',assignee:'김민지',nextGuests:3,nights:2,note:'없음'},
  {day:26,checkout:'11:00',checkin:'-',assignee:'',nextGuests:0,nights:0,note:'다음 날 공실'},
  {day:30,checkout:'11:00',checkin:'-',assignee:'홍길동',nextGuests:0,nights:0,note:'없음'}
];
const views=[...document.querySelectorAll('.view')];
document.getElementById('currentDate').textContent=new Intl.DateTimeFormat('ko-KR',{dateStyle:'full'}).format(new Date());
const defaultProperties=[{id:'and',name:'앤드',area:'내 숙소 · 망원 1호점',color:'#315f50'},{id:'with',name:'위드',area:'내 숙소 · 망원 2호점',color:'#d49a22'}];
let properties=JSON.parse(localStorage.getItem('andwith-properties')||'null')||defaultProperties;
let activePropertyId=localStorage.getItem('andwith-active-property')||'and';
const activeProperty=()=>properties.find(property=>property.id===activePropertyId)||properties[0];
const isPortfolio=()=>activePropertyId==='all';
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
const won=value=>`${Math.round(value).toLocaleString('ko-KR')}원`;

function renderPropertyMenu(){
  const portfolio=isPortfolio(),property=portfolio?{name:'전체 숙소',color:'#4f4f4f'}:activeProperty();
  document.querySelectorAll('[data-property-name]').forEach(element=>element.textContent=property.name);
  document.documentElement.style.setProperty('--property-color',property.color);
  const menu=document.getElementById('propertyMenu');
  menu.innerHTML=`<button type="button" data-property-id="all" class="portfolio-option"><i></i><span><b>전체 숙소</b><small>${properties.length}개 숙소 통합 달력</small></span>${portfolio?'<em>선택됨</em>':''}</button>`+properties.map(item=>`<button type="button" data-property-id="${escapeHtml(item.id)}"><i style="background:${item.color}"></i><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.area)}</small></span>${!portfolio&&item.id===property.id?'<em>선택됨</em>':''}</button>`).join('')+'<button type="button" class="add-property">＋ 새 숙소 등록</button>';
  menu.querySelectorAll('[data-property-id]').forEach(button=>button.addEventListener('click',()=>{activePropertyId=button.dataset.propertyId;localStorage.setItem('andwith-active-property',activePropertyId);menu.hidden=true;renderPropertyMenu();if(isPortfolio())showView('calendar');toast(isPortfolio()?'전체 숙소 통합 달력을 열었습니다.':`${activeProperty().name} 숙소로 전환했습니다.`)}));
  menu.querySelector('.add-property').addEventListener('click',()=>{menu.hidden=true;document.getElementById('propertyDialog').showModal()})
  document.getElementById('singleCalendarPanel').hidden=portfolio;
  document.getElementById('portfolioCalendarPanel').hidden=!portfolio;
  renderPortfolioCalendar();
  if(!portfolio&&typeof renderListingData==='function')renderListingData();
  if(!portfolio&&typeof renderMonthlyCosts==='function')renderMonthlyCosts();
}

function showView(id){
  if(['listing','decisions'].includes(id)&&isPortfolio()){activePropertyId=properties[0].id;localStorage.setItem('andwith-active-property',activePropertyId);renderPropertyMenu()}
  views.forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-view-link]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewLink)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.open).showModal()));
document.getElementById('propertyButton').addEventListener('click',event=>{event.stopPropagation();const menu=document.getElementById('propertyMenu');menu.hidden=!menu.hidden});
document.addEventListener('click',event=>{if(!event.target.closest('.property-switch'))document.getElementById('propertyMenu').hidden=true});
document.getElementById('propertyForm').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget),property={id:`property-${Date.now()}`,name:data.get('name'),area:data.get('area'),color:data.get('color')};properties.push(property);activePropertyId=property.id;localStorage.setItem('andwith-properties',JSON.stringify(properties));localStorage.setItem('andwith-active-property',activePropertyId);renderPropertyMenu();event.currentTarget.reset();document.getElementById('propertyDialog').close();toast(`${property.name} 숙소를 등록했습니다.`)});

function reservationOn(day){return reservations.find(r=>day>=r.start&&day<r.end)}
function renderMonth(){
  const root=document.getElementById('monthCalendar'); root.innerHTML='';
  for(let i=0;i<6;i++){const blank=document.createElement('div');blank.className='day outside';root.append(blank)}
  for(let day=1;day<=31;day++){
    const r=reservationOn(day),cell=document.createElement('button');cell.className='day';cell.type='button';
    if(r)cell.classList.add('booked');if(blocked[day])cell.classList.add('blocked-day');
    let content=`<time>${day}</time>`;
    if(r){
      const segmentStart=r.start===day||day%7===2;
      const segmentEnd=r.end-1===day||day%7===1;
      const label=r.start===day||day%7===2;
      content+=`<div class="stay ${segmentStart?'segment-start':''} ${segmentEnd?'segment-end':''}">${label?`<b>${r.name}</b><span>${r.guests}인 · ${r.end-r.start}박</span>`:'<span aria-hidden="true">&nbsp;</span>'}</div>`
    }
    if(blocked[day])content+=`<div class="block-label">— ${blocked[day]}</div>`;
    const cleaning=cleaningSchedules.find(item=>item.day===day);
    if(cleaning)content+=`<div class="clean-label ${cleaning.assignee?'':'unassigned'}">⌁ 청소 · ${cleaning.assignee||'담당자 미정'}</div>`;
    if(!r&&!blocked[day])content+=`<div class="price">₩${[5,6].includes((day+6)%7)?'16.5':'11.9'}만</div>`;
    cell.innerHTML=content;cell.addEventListener('click',()=>document.getElementById('reservationDialog').showModal());root.append(cell)
  }
}
function renderWeek(){
  const root=document.getElementById('miniCalendar');root.innerHTML='';
  for(let day=1;day<=7;day++){const r=reservationOn(day);root.insertAdjacentHTML('beforeend',`<div class="week-day ${r?'booked':''} ${blocked[day]?'blocked-day':''}"><span>${['토','일','월','화','수','목','금'][day-1]}</span><b>${day}</b>${r?`<small>${r.name}<br>${r.guests}인</small>`:blocked[day]?'<small>운영 차단</small>':'<small>₩11.9만</small>'}</div>`)}
}
renderMonth();renderWeek();

const portfolioStays={
  and:[{start:1,end:2,guests:2},{start:2,end:3,guests:2},{start:3,end:4,guests:2},{start:4,end:5,guests:2},{start:6,end:10,guests:3},{start:10,end:13,guests:3},{start:13,end:18,guests:2},{start:20,end:24,guests:2},{start:24,end:26,guests:3},{start:27,end:30,guests:2}],
  with:[{start:2,end:5,guests:2},{start:7,end:11,guests:4},{start:12,end:15,guests:3},{start:17,end:20,guests:2},{start:21,end:26,guests:4},{start:28,end:31,guests:3}]
};
function renderPortfolioCalendar(){
  const root=document.getElementById('portfolioCalendar'),legend=document.getElementById('portfolioLegend');if(!root||!legend)return;
  legend.innerHTML=properties.map(property=>`<span><i style="background:${property.color}"></i>${escapeHtml(property.name)}</span>`).join('');
  const header=`<div class="portfolio-row portfolio-dates"><b>숙소</b>${Array.from({length:31},(_,index)=>`<span>${index+1}</span>`).join('')}</div>`;
  const rows=properties.map(property=>{const stays=portfolioStays[property.id]||[];return `<div class="portfolio-row"><button type="button" class="portfolio-name" data-portfolio-property="${escapeHtml(property.id)}"><i style="background:${property.color}"></i><span><b>${escapeHtml(property.name)}</b><small>${stays.reduce((sum,stay)=>sum+stay.end-stay.start,0)}박 예약</small></span></button>${Array.from({length:31},()=>'<i class="portfolio-cell"></i>').join('')}${stays.map(stay=>`<button type="button" class="portfolio-stay" style="--stay-color:${property.color};grid-column:${stay.start+1}/${stay.end+1}" title="${stay.start}일~${stay.end}일 · ${stay.guests}인"><b>${stay.guests}인</b><span>${stay.end-stay.start}박</span></button>`).join('')}</div>`}).join('');
  root.innerHTML=header+rows;
  root.querySelectorAll('[data-portfolio-property]').forEach(button=>button.addEventListener('click',()=>{activePropertyId=button.dataset.portfolioProperty;localStorage.setItem('andwith-active-property',activePropertyId);renderPropertyMenu();toast(`${activeProperty().name} 개별 달력을 열었습니다.`)}))
}

function cleaningCopyText(schedule){
  const property=isPortfolio()?'선택 숙소':activeProperty().name;
  return `[${property} 청소 일정]\n8월 ${schedule.day}일 ${schedule.checkout} 체크아웃 / ${schedule.checkin==='-'?'다음 체크인 없음':`${schedule.checkin} 체크인`}\n담당자: ${schedule.assignee||'담당자 미정'}\n다음 예약: ${schedule.nextGuests?`${schedule.nextGuests}인, ${schedule.nights}박`:'없음'}\n특이사항: ${schedule.note||'없음'}`
}
async function copyText(text,message){
  try{await navigator.clipboard.writeText(text)}catch{const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();document.execCommand('copy');area.remove()}toast(message)
}
function renderCleaningSchedules(){
  const filter=document.getElementById('cleanerFilter'),list=document.getElementById('cleaningScheduleList');
  const people=cleanerPeople(),previous=filter.value||'all';filter.innerHTML='<option value="all">전체 담당자</option><option value="unassigned">담당자 미정</option>'+people.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');filter.value=[...filter.options].some(option=>option.value===previous)?previous:'all';
  const visible=cleaningSchedules.filter(schedule=>filter.value==='all'||(filter.value==='unassigned'&&!schedule.assignee)||schedule.assignee===filter.value);
  list.innerHTML=visible.map(schedule=>`<article class="cleaning-item ${schedule.assignee?'':'needs-assignee'}"><div class="cleaning-date"><b>8월 ${schedule.day}일</b><span>${schedule.checkout} 퇴실 · ${schedule.checkin==='-'?'다음 체크인 없음':`${schedule.checkin} 입실`}</span></div><div><span>다음 예약</span><b>${schedule.nextGuests?`${schedule.nextGuests}인 · ${schedule.nights}박`:'없음'}</b></div><label>담당자<select data-cleaning-day="${schedule.day}"><option value="">담당자 미정</option>${people.map(name=>`<option ${schedule.assignee===name?'selected':''}>${escapeHtml(name)}</option>`).join('')}</select></label><button class="outline small" data-copy-cleaning="${schedule.day}">일정 복사</button></article>`).join('')||'<div class="empty-state">해당 담당자의 청소 일정이 없습니다.</div>';
  list.querySelectorAll('[data-cleaning-day]').forEach(select=>select.addEventListener('change',()=>{const schedule=cleaningSchedules.find(item=>item.day===Number(select.dataset.cleaningDay));schedule.assignee=select.value;localStorage.setItem('andwith-cleaning-schedules',JSON.stringify(cleaningSchedules));renderMonth();renderCleaningSchedules();toast(schedule.assignee?`${schedule.day}일 청소를 ${schedule.assignee}에게 배정했습니다.`:`${schedule.day}일 청소가 담당자 미정으로 변경됐습니다.`)}));
  list.querySelectorAll('[data-copy-cleaning]').forEach(button=>button.addEventListener('click',()=>{const schedule=cleaningSchedules.find(item=>item.day===Number(button.dataset.copyCleaning));copyText(cleaningCopyText(schedule),'카톡용 청소 일정을 복사했습니다.')}))
}
document.getElementById('cleanerFilter').addEventListener('change',renderCleaningSchedules);
document.getElementById('copyAllCleaning').addEventListener('click',()=>copyText(cleaningSchedules.map(cleaningCopyText).join('\n\n'),'전체 청소 일정을 복사했습니다.'));

const defaultListing={url:'',title:'망원시장 도보 3분 · 망리단길 · 한강 10분 · 홍대 · 합정 | 아늑한 2BR·3bed',summary:'망원시장과 한강을 가까이 즐기는 아늑한 2룸',description:'',maxGuests:'4',layout:'2실 · 3침대 · 1욕실',times:'16:00 · 11:00',amenities:'와이파이, 세탁기, 에어컨, 난방',rules:'실내 금연 · 소음 주의',instantBook:'사용',stayLimits:'1~28박',advanceWindow:'12개월',cutoff:'1일 전',prepTime:'없음',cancellation:'일반',photos:''};
let listingProfiles=JSON.parse(localStorage.getItem('andwith-listing-profiles')||'{}');
let listingChanges=JSON.parse(localStorage.getItem('andwith-listing-changes')||'[]');
let competitors=JSON.parse(localStorage.getItem('andwith-competitors')||'[]');
function propertyListing(){return listingProfiles[activePropertyId]||defaultListing}
function renderListingData(){
  const data=propertyListing(),summary=document.getElementById('listingProfileSummary');
  summary.innerHTML=`<div><span>제목</span><b>${escapeHtml(data.title||'입력 대기')}</b></div><div><span>구조·인원</span><b>${escapeHtml(data.layout||'입력 대기')} · 최대 ${escapeHtml(data.maxGuests||'-')}인</b></div><div><span>체크인·체크아웃</span><b>${escapeHtml(data.times||'입력 대기')}</b></div><div><span>예약조건</span><b>${escapeHtml(data.stayLimits||'입력 대기')} · 즉시예약 ${escapeHtml(data.instantBook||'입력 대기')}</b></div><div><span>사진 설명</span><b>${data.photos?'입력됨':'입력 대기'}</b></div><div><span>데이터 출처</span><b>호스트 직접 입력 · ${new Date().toLocaleDateString('ko-KR')}</b></div>`;
  const changes=listingChanges.filter(item=>item.propertyId===activePropertyId);document.getElementById('changeHistoryList').innerHTML=changes.length?changes.slice(-4).reverse().map(item=>`<div><b>${escapeHtml(item.date)} · ${escapeHtml(item.field)}</b><span>${escapeHtml(item.before)} → ${escapeHtml(item.after)}</span><small>${escapeHtml(item.result||'관찰 중')}</small></div>`).join(''):'<p>저장된 변경 이력이 없습니다.</p>';
  const comparable=competitors.filter(item=>item.propertyId===activePropertyId);document.getElementById('competitorList').innerHTML=comparable.length?comparable.map(item=>`<div><b>${escapeHtml(item.name)}</b><span>평일 ${won(item.weekdayPrice||0)} · 주말 ${won(item.weekendPrice||0)}</span></div>`).join(''):'<p>등록된 비교숙소가 없습니다.</p>';
}
function fillListingForm(){const data=propertyListing(),form=document.getElementById('listingForm');Object.entries(data).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value})}
document.querySelectorAll('[data-open="listingDialog"]').forEach(button=>button.addEventListener('click',fillListingForm));
document.getElementById('listingForm').addEventListener('submit',event=>{event.preventDefault();listingProfiles[activePropertyId]=Object.fromEntries(new FormData(event.currentTarget));localStorage.setItem('andwith-listing-profiles',JSON.stringify(listingProfiles));renderListingData();document.getElementById('listingDialog').close();toast('선택한 숙소의 리스팅 기본정보를 저장했습니다.')});
document.getElementById('changeForm').addEventListener('submit',event=>{event.preventDefault();listingChanges.push({...Object.fromEntries(new FormData(event.currentTarget)),propertyId:activePropertyId});localStorage.setItem('andwith-listing-changes',JSON.stringify(listingChanges));renderListingData();event.currentTarget.reset();document.getElementById('changeDialog').close();toast('변경 전후와 관찰기간을 저장했습니다.')});
document.getElementById('competitorForm').addEventListener('submit',event=>{event.preventDefault();competitors.push({...Object.fromEntries(new FormData(event.currentTarget)),propertyId:activePropertyId});localStorage.setItem('andwith-competitors',JSON.stringify(competitors));renderListingData();event.currentTarget.reset();document.getElementById('competitorDialog').close();toast('비교숙소를 저장했습니다.')});
const toast=message=>{const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400)};
document.querySelectorAll('.rec-actions button').forEach(b=>b.addEventListener('click',()=>{if(!b.dataset.open)toast(`“${b.textContent.trim()}”으로 기록했습니다.`)}));
document.getElementById('cleanerButton').addEventListener('click',()=>document.getElementById('reservationDialog').showModal());
document.querySelectorAll('.guest-buttons button').forEach(b=>b.addEventListener('click',()=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')}));

function parseIcal(text){
  const events=[];for(const block of text.split('BEGIN:VEVENT').slice(1)){const start=block.match(/DTSTART(?:;VALUE=DATE)?:([0-9]{8})/),end=block.match(/DTEND(?:;VALUE=DATE)?:([0-9]{8})/),summary=block.match(/SUMMARY:(.*)/);if(start&&end)events.push({start:start[1],end:end[1],summary:summary?.[1]?.trim()||''})}return events
}
let icalSources=JSON.parse(localStorage.getItem('andwith-ical-sources')||'{}');
document.getElementById('syncButton').addEventListener('click',async()=>{
  const text=document.getElementById('icalText').value.trim(),url=document.getElementById('icalUrl').value.trim(),result=document.getElementById('syncResult');
  let source=text;
  if(!source&&url){try{const response=await fetch(url);if(!response.ok)throw new Error();source=await response.text()}catch{result.innerHTML='<b>브라우저에서 링크를 직접 읽지 못했습니다.</b> iCal 원문을 아래 칸에 붙여 넣으면 동일하게 분석합니다.';return}}
  if(!source){result.textContent='iCal 주소 또는 원문을 입력해 주세요.';return}
  const events=parseIcal(source),reserved=events.filter(e=>e.summary==='Reserved').length,blocks=events.filter(e=>e.summary.includes('Not available')).length;
  icalSources[activePropertyId]={url,lastSync:new Date().toISOString(),eventCount:events.length,reserved,blocks};localStorage.setItem('andwith-ical-sources',JSON.stringify(icalSources));localStorage.setItem('andwith-last-sync',new Date().toISOString());
  result.innerHTML=`<b>${events.length}개 일정 확인</b> · 예약 ${reserved}건 · 운영차단 ${blocks}건`;document.getElementById('lastSync').textContent='방금 전';toast('달력 업데이트를 확인했습니다.')
});
document.querySelectorAll('[data-open="syncDialog"]').forEach(button=>button.addEventListener('click',()=>{document.getElementById('icalUrl').value=icalSources[activePropertyId]?.url||''}));

function splitRows(text){
  const delimiter=text.includes('\t')?'\t':',';const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],next=text[i+1];if(c==='"'&&quoted&&next==='"'){field+='"';i++}else if(c==='"'){quoted=!quoted}else if(c===delimiter&&!quoted){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&next==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field=''}else field+=c}if(field||row.length){row.push(field);rows.push(row)}return rows
}
function analyzeCsv(text){
  const rows=splitRows(text);if(rows.length<2)return null;const header=rows[0].map(x=>x.trim()),typeIndex=header.indexOf('종류'),codeIndex=header.indexOf('예약 코드');const types={},codes=new Set();
  rows.slice(1).forEach(row=>{const type=(row[typeIndex]||'기타').trim();types[type]=(types[type]||0)+1;if(row[codeIndex])codes.add(row[codeIndex].trim())});return {rows:rows.length-1,codes:codes.size,types}
}
const file=document.getElementById('csvFile');file.addEventListener('change',async()=>{if(file.files[0])document.getElementById('csvText').value=await file.files[0].text()});
document.getElementById('csvButton').addEventListener('click',()=>{const result=analyzeCsv(document.getElementById('csvText').value);const box=document.getElementById('csvResult');if(!result){box.textContent='읽을 수 있는 CSV 또는 표 내용을 넣어 주세요.';return}box.innerHTML=`<b>${result.rows}개 거래행 분석</b> · 고유 예약 ${result.codes}건 · 예약 ${result.types['예약']||0}행 · Payout ${result.types.Payout||0}행`;toast('정산자료를 분석했습니다.')});
document.getElementById('addInsightData').addEventListener('click',()=>toast('호스트 통계 자료 입력은 2차 연결 범위입니다.'));

const incomeAfterPlatform=3087504;
const costLabels={rent:'월세',management:'관리비',utilities:'전기·가스·수도',internet:'인터넷',cleaning:'청소비',laundry:'세탁비',supplies:'비품·소모품',repairs:'수리·보수',other:'기타'};
let monthlyCosts=JSON.parse(localStorage.getItem('andwith-monthly-costs')||'{}');
const costKey=(propertyId=activePropertyId,month='2026-07')=>`${propertyId}:${month}`;
const costTotal=record=>Object.keys(costLabels).reduce((sum,key)=>sum+Number(record?.[key]||0),0);
function fillMonthlyCostForm(){
  const form=document.getElementById('monthlyCostForm'),month=form.elements.month.value||'2026-07',record=monthlyCosts[costKey(activePropertyId,month)]||{};
  Object.keys(costLabels).forEach(key=>form.elements[key].value=record[key]??(key==='rent'?700000:key==='management'?50000:''));
  form.elements.status.value=record.status||'작성 중';form.elements.note.value=record.note||'';updateMonthlyCostPreview()
}
function updateMonthlyCostPreview(){const form=document.getElementById('monthlyCostForm'),record=Object.fromEntries(new FormData(form));document.getElementById('monthlyCostPreview').textContent=won(costTotal(record))}
function renderMonthlyCosts(){
  const record=monthlyCosts[costKey()]||null,total=costTotal(record),root=document.getElementById('monthlyCostRows');
  root.innerHTML=record?Object.entries(costLabels).filter(([key])=>Number(record[key])).map(([key,label])=>`<div class="minus"><span>${label}</span><b>−${won(record[key])}</b></div>`).join(''):'<div class="minus pending-row"><span>월별 운영비</span><b>입력 대기</b></div>';
  const profit=incomeAfterPlatform-total;document.getElementById('profitTotal').textContent=won(profit);document.getElementById('profitMetric').innerHTML=`${Math.round(profit).toLocaleString('ko-KR')}<small>원</small>`;
  document.getElementById('costQuality').textContent=record?`7월 월 비용 ${record.status}`:'7월 월 비용 입력 대기'
}
document.querySelectorAll('[data-open="monthlyCostDialog"]').forEach(button=>button.addEventListener('click',fillMonthlyCostForm));
document.getElementById('monthlyCostForm').addEventListener('input',event=>{if(event.target.name==='month')fillMonthlyCostForm();else updateMonthlyCostPreview()});
document.getElementById('monthlyCostForm').addEventListener('submit',event=>{event.preventDefault();const record=Object.fromEntries(new FormData(event.currentTarget));monthlyCosts[costKey(activePropertyId,record.month)]=record;localStorage.setItem('andwith-monthly-costs',JSON.stringify(monthlyCosts));renderMonthlyCosts();document.getElementById('monthlyCostDialog').close();toast(`${record.month} 월 비용을 ${record.status} 상태로 저장했습니다.`)});

function renderCleanerDirectory(){const root=document.getElementById('cleanerDirectory');root.innerHTML=cleanerDirectory.map(person=>`<div><b>${escapeHtml(person.name)}</b> · ${escapeHtml(person.type)} · 기본 ${won(person.fee||0)}</div>`).join('')}
document.getElementById('cleanerForm').addEventListener('submit',event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));cleanerDirectory.push({...data,fee:Number(data.fee||0)});localStorage.setItem('andwith-cleaners',JSON.stringify(cleanerDirectory));renderCleanerDirectory();renderCleaningSchedules();event.currentTarget.reset();toast(`${data.name} 담당자를 등록했습니다.`)});

document.getElementById('decisionForm').addEventListener('submit',event=>{event.preventDefault();const tickets=JSON.parse(localStorage.getItem('andwith-decision-tickets')||'[]');tickets.push({...Object.fromEntries(new FormData(event.currentTarget)),propertyId:activePropertyId,status:'난희 승인 대기',createdAt:new Date().toISOString()});localStorage.setItem('andwith-decision-tickets',JSON.stringify(tickets));event.currentTarget.reset();document.getElementById('decisionDialog').close();toast('결정 티켓을 난희 승인 대기로 저장했습니다.')});
document.querySelectorAll('[data-property-jump]').forEach(button=>button.addEventListener('click',()=>{activePropertyId=button.dataset.propertyJump;localStorage.setItem('andwith-active-property',activePropertyId);renderPropertyMenu();showView('today')}));
renderPropertyMenu();renderCleaningSchedules();renderListingData();renderMonthlyCosts();renderCleanerDirectory();

const backupKeys=()=>Object.keys(localStorage).filter(key=>key.startsWith('andwith-'));
const backupResult=document.getElementById('backupResult');
const lastBackup=localStorage.getItem('andwith-last-backup');
if(lastBackup)backupResult.textContent=`마지막 백업: ${new Date(lastBackup).toLocaleString('ko-KR')}`;
document.getElementById('exportBackup').addEventListener('click',()=>{
  const createdAt=new Date().toISOString(),data=Object.fromEntries(backupKeys().filter(key=>key!=='andwith-last-backup').map(key=>[key,localStorage.getItem(key)]));
  const blob=new Blob([JSON.stringify({app:'ANDWITH Host OS',version:1,createdAt,data},null,2)],{type:'application/json'}),link=document.createElement('a');
  link.href=URL.createObjectURL(blob);link.download=`andwith-backup-${createdAt.slice(0,10)}.json`;link.click();URL.revokeObjectURL(link.href);localStorage.setItem('andwith-last-backup',createdAt);backupResult.textContent=`마지막 백업: ${new Date(createdAt).toLocaleString('ko-KR')}`;toast('난희 전용 백업 파일을 만들었습니다.')
});
document.getElementById('importBackup').addEventListener('change',async event=>{
  const input=event.target,file=input.files[0];if(!file)return;
  try{const backup=JSON.parse(await file.text());if(backup.app!=='ANDWITH Host OS'||backup.version!==1||!backup.data)throw new Error('invalid');Object.entries(backup.data).forEach(([key,value])=>{if(key.startsWith('andwith-')&&typeof value==='string')localStorage.setItem(key,value)});backupResult.textContent=`${new Date(backup.createdAt).toLocaleString('ko-KR')} 백업을 가져왔습니다. 화면을 새로고침합니다.`;toast('백업 복원이 완료됐습니다.');setTimeout(()=>location.reload(),900)}catch{backupResult.textContent='올바른 ANDWITH 백업 파일이 아닙니다.'}finally{input.value=''}
});

let installPrompt=null;
const installButton=document.getElementById('installButton');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton.hidden=false});
async function requestInstall(){if(!installPrompt){toast('브라우저 메뉴에서 “홈 화면에 추가”를 선택해 주세요.');return}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.hidden=true}
installButton.addEventListener('click',requestInstall);document.getElementById('installFromDialog').addEventListener('click',requestInstall);
window.addEventListener('appinstalled',()=>toast('ANDWITH Host OS가 홈 화면에 설치됐습니다.'));
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
