"use client";
import { useState } from "react";
import { Schedule } from "./ScheduleList";

interface ScheduleFormProps {
  onAdd: (schedules: Schedule[]) => void;
  onClose: () => void;
}

export default function ScheduleForm({ onAdd, onClose }: ScheduleFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("15:00");
  const [endTime, setEndTime] = useState("12:00");
  const [platform, setPlatform] = useState("삼삼엠투");
  const [guestName, setGuestName] = useState("");
  const [isBlock, setIsBlock] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !startTime || !endTime) return alert("날짜와 시간을 입력해주세요.");

    const sDate = new Date(`${startDate}T${startTime}`);
    const eDate = new Date(`${endDate}T${endTime}`);

    if (sDate >= eDate) return alert("퇴실일시는 입실일시보다 이후여야 합니다.");

    const groupId = `manual-${Date.now()}`;

    const newSchedules: Schedule[] = [
      {
        id: `${groupId}-in`,
        groupId,
        type: 'in',
        guestName,
        platform,
        isBlock,
        date: sDate,
        time: startTime
      },
      {
        id: `${groupId}-out`,
        groupId,
        type: 'out',
        guestName,
        platform,
        isBlock,
        date: eDate,
        time: endTime
      }
    ];

    onAdd(newSchedules);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end'
    }}>
      <div style={{
        background: 'white', width: '100%', maxWidth: '500px',
        borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
        padding: '24px', boxSizing: 'border-box',
        animation: 'slideUp 0.3s ease-out',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>새 일정 추가</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>일정 유형</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="radio" checked={!isBlock} onChange={() => setIsBlock(false)} /> 예약
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="radio" checked={isBlock} onChange={() => setIsBlock(true)} /> 예약 차단 (막음)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>입실일</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>입실 시간</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>퇴실일</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>퇴실 시간</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>플랫폼</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
              <option value="삼삼엠투">삼삼엠투</option>
              <option value="리브애니웨어">리브애니웨어</option>
              <option value="에어비앤비">에어비앤비</option>
              <option value="개인예약">개인예약</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>{isBlock ? '차단 사유' : '예약자명 / 내용'}</label>
            <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={isBlock ? "사유 입력 (선택)" : "예약자명 또는 내용 입력 (선택)"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', marginTop: '8px', cursor: 'pointer' }}>
            저장하기
          </button>
        </form>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
