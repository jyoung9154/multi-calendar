import { NextResponse } from 'next/server';

// ical 형식의 텍스트에서 이벤트를 찾기 위한 정규식
const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;

function parseICal(icsData: string) {
  const events = [];
  let match;

  while ((match = eventRegex.exec(icsData)) !== null) {
    const eventBlock = match[1];
    
    // 주요 데이터 추출
    const startMatch = eventBlock.match(/DTSTART(?:;[^:]*)?:(.*)/);
    const endMatch = eventBlock.match(/DTEND(?:;[^:]*)?:(.*)/);
    const summaryMatch = eventBlock.match(/SUMMARY:(.*)/);
    const uidMatch = eventBlock.match(/UID:(.*)/);

    if (startMatch && endMatch && summaryMatch) {
      // 날짜 파싱 (단순 예시)
      const startStr = startMatch[1].trim();
      const endStr = endMatch[1].trim();
      const summary = summaryMatch[1].trim();
      const uid = uidMatch ? uidMatch[1].trim() : Math.random().toString();

      // 시작 년/월/일 추출
      const sYear = parseInt(startStr.substring(0, 4));
      const sMonth = parseInt(startStr.substring(4, 6)) - 1;
      const sDay = parseInt(startStr.substring(6, 8));
      
      // 종료 년/월/일 추출
      const eYear = parseInt(endStr.substring(0, 4));
      const eMonth = parseInt(endStr.substring(4, 6)) - 1;
      const eDay = parseInt(endStr.substring(6, 8));

      // 입실 일정 (In)
      const startDate = new Date(Date.UTC(sYear, sMonth, sDay - 1, 6, 0, 0)); // 한국 시간 오후 3시 (입실)
      // 퇴실 일정 (Out)
      const endDate = new Date(Date.UTC(eYear, eMonth, eDay - 1, 2, 0, 0)); // 한국 시간 오전 11시 (퇴실)

      let guestName = summary;
      let platform = '리브애니웨어';
      let isBlock = false;

      if (summary.includes('Not Available') || summary.includes('예약 불가')) {
        isBlock = true;
        guestName = '예약 차단';
      } else {
        if (summary.toLowerCase().includes('liveanywhere')) {
            platform = '리브애니웨어';
            guestName = summary.replace(/LiveAnywhere\s*\/?\s*/i, '').replace(/\(.*\)/, '').trim() || '예약자';
        }
      }

      events.push({
        id: `${uid}-in`,
        groupId: uid,
        type: 'in', // 입실
        guestName,
        platform,
        isBlock,
        date: startDate.toISOString(),
        time: '15:00'
      });

      events.push({
        id: `${uid}-out`,
        groupId: uid,
        type: 'out', // 퇴실
        guestName,
        platform,
        isBlock,
        date: endDate.toISOString(),
        time: '11:00'
      });
    }
  }

  return events;
}

export async function GET() {
  try {
    // 리브애니웨어 등 ics 달력 주소를 fetch로 긁어옵니다.
    const icalUrl = 'https://ical.liveanywhere.me/calendar/45534.ics';
    const res = await fetch(icalUrl);
    
    if (!res.ok) {
      throw new Error('Failed to fetch iCal data');
    }

    const icsContent = await res.text();
    const schedules = parseICal(icsContent);

    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'iCal parsing failed' }, { status: 500 });
  }
}
