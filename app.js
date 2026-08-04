const reservations=[
  {start:1,end:2,name:'예약 A',guests:2},{start:2,end:3,name:'예약 B',guests:2},{start:3,end:4,name:'예약 C',guests:2},{start:4,end:5,name:'예약 D',guests:2},
  {start:6,end:10,name:'예약 E',guests:3},{start:10,end:13,name:'예약 F',guests:3},{start:13,end:18,name:'예약 G',guests:2},{start:20,end:24,name:'예약 H',guests:2},{start:24,end:26,name:'예약 I',guests:3},{start:27,end:30,name:'예약 J',guests:2}
];
const blocked={5:'보수·휴식',18:'보수·휴식'};
const cleaners={3:'미배정',4:'난희',5:'난희',10:'외주',13:'외주',18:'외주',24:'외주',26:'외주',30:'외주'};
const views=[...document.querySelectorAll('.view')];

function showView(id){
  views.forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-view-link]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewLink)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.open).showModal()));

function reservationOn(day){return reservations.find(r=>day>=r.start&&day<r.end)}
function renderMonth(){
  const root=document.getElementById('monthCalendar'); root.innerHTML='';
  for(let i=0;i<6;i++){const blank=document.createElement('div');blank.className='day outside';root.append(blank)}
  for(let day=1;day<=31;day++){
    const r=reservationOn(day),cell=document.createElement('button');cell.className='day';cell.type='button';
    if(r)cell.classList.add('booked');if(blocked[day])cell.classList.add('blocked-day');
    let content=`<time>${day}</time>`;
    if(r){const start=r.start===day;content+=`<div class="stay ${start?'start':''}">${start?`<b>${r.name}</b><span>${r.guests}인 · ${r.end-r.start}박</span>`:'<span>예약 중</span>'}</div>`}
    if(blocked[day])content+=`<div class="block-label">— ${blocked[day]}</div>`;
    if(cleaners[day])content+=`<div class="clean-label">⌁ 청소 · ${cleaners[day]}</div>`;
    if(!r&&!blocked[day])content+=`<div class="price">₩${[5,6].includes((day+6)%7)?'16.5':'11.9'}만</div>`;
    cell.innerHTML=content;cell.addEventListener('click',()=>document.getElementById('reservationDialog').showModal());root.append(cell)
  }
}
function renderWeek(){
  const root=document.getElementById('miniCalendar');root.innerHTML='';
  for(let day=1;day<=7;day++){const r=reservationOn(day);root.insertAdjacentHTML('beforeend',`<div class="week-day ${r?'booked':''} ${blocked[day]?'blocked-day':''}"><span>${['토','일','월','화','수','목','금'][day-1]}</span><b>${day}</b>${r?`<small>${r.name}<br>${r.guests}인</small>`:blocked[day]?'<small>운영 차단</small>':'<small>₩11.9만</small>'}</div>`)}
}
renderMonth();renderWeek();

const toast=message=>{const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400)};
document.querySelectorAll('.rec-actions button').forEach(b=>b.addEventListener('click',()=>{if(!b.dataset.open)toast(`“${b.textContent.trim()}”으로 기록했습니다.`)}));
document.getElementById('cleanerButton').addEventListener('click',()=>document.getElementById('reservationDialog').showModal());
document.querySelectorAll('.guest-buttons button').forEach(b=>b.addEventListener('click',()=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')}));

function parseIcal(text){
  const events=[];for(const block of text.split('BEGIN:VEVENT').slice(1)){const start=block.match(/DTSTART(?:;VALUE=DATE)?:([0-9]{8})/),end=block.match(/DTEND(?:;VALUE=DATE)?:([0-9]{8})/),summary=block.match(/SUMMARY:(.*)/);if(start&&end)events.push({start:start[1],end:end[1],summary:summary?.[1]?.trim()||''})}return events
}
document.getElementById('syncButton').addEventListener('click',async()=>{
  const text=document.getElementById('icalText').value.trim(),url=document.getElementById('icalUrl').value.trim(),result=document.getElementById('syncResult');
  let source=text;
  if(!source&&url){try{const response=await fetch(url);if(!response.ok)throw new Error();source=await response.text()}catch{result.innerHTML='<b>브라우저에서 링크를 직접 읽지 못했습니다.</b> iCal 원문을 아래 칸에 붙여 넣으면 동일하게 분석합니다.';return}}
  if(!source){result.textContent='iCal 주소 또는 원문을 입력해 주세요.';return}
  const events=parseIcal(source),reserved=events.filter(e=>e.summary==='Reserved').length,blocks=events.filter(e=>e.summary.includes('Not available')).length;
  localStorage.setItem('andwith-ical-url',url);localStorage.setItem('andwith-last-sync',new Date().toISOString());
  result.innerHTML=`<b>${events.length}개 일정 확인</b> · 예약 ${reserved}건 · 운영차단 ${blocks}건`;document.getElementById('lastSync').textContent='방금 전';toast('달력 업데이트를 확인했습니다.')
});
document.getElementById('icalUrl').value=localStorage.getItem('andwith-ical-url')||'';

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
document.getElementById('addChange').addEventListener('click',()=>toast('변경 기록 입력 화면은 다음 테스트에서 연결합니다.'));
document.getElementById('logCause').addEventListener('click',()=>toast('7월 26일 변경 기록을 추가할 수 있도록 표시했습니다.'));
