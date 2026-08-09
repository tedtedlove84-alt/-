const reservations=[
  {start:1,end:2,name:'예약 A',guests:2},{start:2,end:3,name:'예약 B',guests:2},{start:3,end:4,name:'예약 C',guests:2},{start:4,end:5,name:'예약 D',guests:2},
  {start:6,end:10,name:'예약 E',guests:3},{start:10,end:13,name:'예약 F',guests:3},{start:13,end:18,name:'예약 G',guests:2},{start:20,end:24,name:'예약 H',guests:2},{start:24,end:26,name:'예약 I',guests:3},{start:27,end:30,name:'예약 J',guests:2}
];
const blocked={5:'보수·휴식',18:'보수·휴식'};
const cleaners={3:'미배정',4:'난희',5:'난희',10:'외주',13:'외주',18:'외주',24:'외주',26:'외주',30:'외주'};
const views=[...document.querySelectorAll('.view')];
let properties=JSON.parse(localStorage.getItem('andwith-properties')||'null')||[{id:'and',name:'앤드',area:'서울 마포구 망원동',color:'#315f50'}];
let activePropertyId=localStorage.getItem('andwith-active-property')||'and';
const activeProperty=()=>properties.find(property=>property.id===activePropertyId)||properties[0];
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));

function renderPropertyMenu(){
  const property=activeProperty();
  document.querySelectorAll('[data-property-name]').forEach(element=>element.textContent=property.name);
  document.documentElement.style.setProperty('--property-color',property.color);
  const menu=document.getElementById('propertyMenu');
  menu.innerHTML=properties.map(item=>`<button type="button" data-property-id="${escapeHtml(item.id)}"><i style="background:${item.color}"></i><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.area)}</small></span>${item.id===property.id?'<em>선택됨</em>':''}</button>`).join('')+'<button type="button" class="add-property">＋ 새 숙소 등록</button>';
  menu.querySelectorAll('[data-property-id]').forEach(button=>button.addEventListener('click',()=>{activePropertyId=button.dataset.propertyId;localStorage.setItem('andwith-active-property',activePropertyId);menu.hidden=true;renderPropertyMenu();toast(`${activeProperty().name} 숙소로 전환했습니다.`)}));
  menu.querySelector('.add-property').addEventListener('click',()=>{menu.hidden=true;document.getElementById('propertyDialog').showModal()})
}

function showView(id){
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
renderPropertyMenu();

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

const baseProfit=1757504;
let extraExpenses=JSON.parse(localStorage.getItem('andwith-extra-expenses')||'[]');
const won=value=>`${Math.round(value).toLocaleString('ko-KR')}원`;
function renderExpenses(){
  const total=extraExpenses.reduce((sum,item)=>sum+Number(item.amount||0),0);
  document.getElementById('extraExpenseRows').innerHTML=extraExpenses.map((item,index)=>`<div class="minus custom-expense"><span>${escapeHtml(item.name)}<small>${escapeHtml(item.note||'추가 입력')}</small></span><b>−${won(item.amount)}</b><button type="button" data-remove-expense="${index}" aria-label="${escapeHtml(item.name)} 삭제">×</button></div>`).join('');
  const profit=baseProfit-total;
  document.getElementById('profitTotal').textContent=won(profit);
  document.getElementById('profitMetric').innerHTML=`${Math.round(profit).toLocaleString('ko-KR')}<small>원</small>`;
  document.querySelectorAll('[data-remove-expense]').forEach(button=>button.addEventListener('click',()=>{extraExpenses.splice(Number(button.dataset.removeExpense),1);localStorage.setItem('andwith-extra-expenses',JSON.stringify(extraExpenses));renderExpenses()}));
}
document.getElementById('expenseForm').addEventListener('submit',event=>{
  event.preventDefault();const data=new FormData(event.currentTarget);
  extraExpenses.push({name:data.get('name'),amount:Number(data.get('amount')),note:data.get('note')});
  localStorage.setItem('andwith-extra-expenses',JSON.stringify(extraExpenses));renderExpenses();event.currentTarget.reset();document.getElementById('expenseDialog').close();toast('추가 비용을 운영이익에 반영했습니다.')
});
renderExpenses();

const dailyViews=[128,97,123,114,101,94,110,136,119,115,158,186,202,170,109,105,108,103,114,129,134,152,159,136,102,242,143,150,142,120,125];
const dailyBookings=[2,0,2,0,0,0,0,2,0,0,1,3,3,1,0,0,0,0,0,1,1,1,1,0,0,1,1,3,1,0,1];
function renderViewsChart(){
  const svg=document.getElementById('viewsChart'),max=280,width=1000,height=210,step=width/(dailyViews.length-1);
  const points=dailyViews.map((value,index)=>({x:index*step,y:height-(value/max*height),value,day:index+1}));
  const line=points.map(point=>`${point.x},${point.y}`).join(' '),area=`0,${height} ${line} ${width},${height}`;
  svg.innerHTML=`<defs><linearGradient id="viewArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff385c" stop-opacity=".28"/><stop offset="1" stop-color="#ff385c" stop-opacity=".02"/></linearGradient></defs><polygon points="${area}" fill="url(#viewArea)"/><polyline points="${line}" fill="none" stroke="#ff385c" stroke-width="3" vector-effect="non-scaling-stroke"/>${points.map(point=>`<circle tabindex="0" role="button" aria-label="7월 ${point.day}일 조회 ${point.value}회" data-chart-day="${point.day}" cx="${point.x}" cy="${point.y}" r="6"><title>7월 ${point.day}일 · 조회 ${point.value}회</title></circle>`).join('')}`;
  svg.querySelectorAll('[data-chart-day]').forEach(point=>{const select=()=>showChartDay(Number(point.dataset.chartDay));point.addEventListener('click',select);point.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')select()})});
  showChartDay(26)
}
function showChartDay(day){
  document.querySelectorAll('[data-chart-day]').forEach(point=>point.classList.toggle('selected',Number(point.dataset.chartDay)===day));
  const changes={12:'평일 가격 조정',13:'최소숙박 변경',26:'기록 없음'};
  document.getElementById('chartDetail').innerHTML=`<div><span>선택일</span><b>7월 ${day}일</b></div><div><span>조회수</span><b>${dailyViews[day-1]}회</b></div><div><span>새 예약</span><b>${dailyBookings[day-1]}건</b></div><div><span>운영 변경</span><b>${changes[day]||'없음'}</b></div><button id="logCause">변경 기록 추가</button>`;
  document.getElementById('logCause').addEventListener('click',()=>toast(`7월 ${day}일 변경 기록 입력을 준비했습니다.`))
}
renderViewsChart();
