"use client";
import { useState } from "react";
import { format, isSameDay, startOfDay, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon, Car, Lock, MessageSquare, Info, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";

export interface Schedule {
  id: string; 
  groupId: string;
  type: "in" | "out" | "clean" | "stay";
  guestName: string; 
  platform: string; 
  isBlock?: boolean;
  date: Date; 
  time: string;
}

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case '리브애니웨어': return { bg: '#eff6ff', text: '#3b82f6' };
    case '삼삼엠투': return { bg: '#fff7ed', text: '#f97316' };
    case '에어비앤비': return { bg: '#fef2f2', text: '#ef4444' };
    case '개인예약': return { bg: '#f5f3ff', text: '#8b5cf6' };
    default: return { bg: '#f3f4f6', text: '#4b5563' };
  }
};

export default function ScheduleList({ selectedDate, dateRange, schedules, checklists = {}, onToggleChecklist, isAdmin, cleaningTemplate = [], onUpdateTemplate, onDelete }: any) {
  const [newTask, setNewTask] = useState("");

  const rawFiltered = schedules.filter((s: Schedule) => {
    if (dateRange) return s.date >= dateRange.start && s.date <= dateRange.end;
    if (selectedDate) return isSameDay(s.date, selectedDate);
    if (!dateRange && !selectedDate) return true;
    return false;
  });

  const synthesizedSchedules: Schedule[] = [];
  if (selectedDate && !dateRange) {
    schedules.forEach((s: Schedule) => {
      if (s.type === 'in') {
        const outSched = schedules.find((o: any) => o.groupId === s.groupId && o.type === 'out');
        if (outSched) {
          const sd = startOfDay(selectedDate);
          if (sd > startOfDay(s.date) && sd < startOfDay(outSched.date)) {
            synthesizedSchedules.push({
              id: `${s.groupId}-stay`, 
              groupId: s.groupId,
              type: 'stay', 
              guestName: s.guestName, 
              platform: s.platform, 
              isBlock: s.isBlock,
              date: selectedDate, 
              time: '종일'
            });
          }
        }
      }
    });
  }

  let filtered = [...rawFiltered, ...synthesizedSchedules].sort((a,b) => a.date.getTime() - b.date.getTime());

  // 예약 차단(isBlock)은 리스트에서 제외
  filtered = filtered.filter(s => !s.isBlock);

  if (filtered.length === 0) return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: '24px' }}>일정이 없습니다.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {filtered.map((schedule) => {
        const isBlock = schedule.isBlock;
        const checks = checklists[schedule.groupId] || { vehicle: false, password: false };
        
        // Find full date range for this booking
        const inSched = schedules.find((s: Schedule) => s.groupId === schedule.groupId && s.type === 'in');
        const outSched = schedules.find((s: Schedule) => s.groupId === schedule.groupId && s.type === 'out');
        
        const nights = inSched && outSched ? differenceInDays(outSched.date, inSched.date) : 0;
        
        let dateString = "";
        if (schedule.type === 'out') {
          dateString = format(schedule.date, 'M월 d일', { locale: ko });
        } else if (inSched && outSched) {
          dateString = `${format(inSched.date, 'M월 d일', { locale: ko })} - ${format(outSched.date, 'M월 d일', { locale: ko })} (${nights}박)`;
        } else {
          dateString = format(schedule.date, 'M월 d일', { locale: ko });
        }

        const pColor = getPlatformColor(schedule.platform);

        return (
          <div key={schedule.id} style={{ 
            background: 'var(--surface)', 
            borderRadius: '24px', 
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.02)'
          }}>
            {/* Header: Platform & ID */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(schedule.platform && !schedule.platform.toLowerCase().includes('reserved')) && (
                  <span style={{ 
                    background: isBlock ? '#f3f4f6' : pColor.bg, 
                    color: isBlock ? '#6b7280' : pColor.text, 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem', 
                    fontWeight: '800',
                    letterSpacing: '0.05em'
                  }}>
                    {isBlock ? 'BLOCK' : schedule.platform.toUpperCase()}
                  </span>
                )}
                <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600' }}>
                  ID: #{schedule.groupId.slice(-5)}
                </span>
              </div>
              
              {/* Status Badge (In/Out/Stay) & Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isAdmin && schedule.groupId.startsWith('manual-') && (
                  <button 
                    onClick={() => onDelete?.(schedule.groupId)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      cursor: 'pointer', 
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="일정 삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: isBlock ? '#9ca3af' : (schedule.type === "in" ? "#22c55e" : schedule.type === "out" ? "#ef4444" : schedule.type === "stay" ? "#3b82f6" : "#f59e0b")
                }}>
                  {isBlock ? (schedule.type === 'in' ? '차단 시작' : schedule.type === 'out' ? '차단 해제' : '차단 중') : (schedule.type === "in" ? "입실" : schedule.type === "out" ? "퇴실" : schedule.type === "stay" ? "입실 중" : "청소")}
                </div>
              </div>
            </div>

            {/* Guest Name & Dates */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: '800', color: isBlock ? '#6b7280' : '#111827' }}>
                {schedule.guestName && schedule.guestName.toLowerCase().includes('reserved') 
                  ? '' 
                  : (schedule.guestName || (isBlock ? '예약 차단' : '예약 정보 없음'))}
              </h3>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: schedule.type === 'out' ? '#ef4444' : '#6b7280', 
                fontSize: schedule.type === 'out' ? '1.2rem' : '0.9rem', 
                fontWeight: schedule.type === 'out' ? '800' : '500',
                marginTop: schedule.type === 'out' ? '4px' : '0'
              }}>
                <CalendarIcon size={schedule.type === 'out' ? 20 : 16} />
                <span>{dateString}</span>
              </div>
            </div>

            {/* Toggles for In/Stay */}
            {!isBlock && (schedule.type === 'in' || schedule.type === 'stay') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Vehicle Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                      <Car size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111827' }}>차량 등록</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{checks.vehicle ? '등록 완료' : '미등록'}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={checks.vehicle} 
                        onChange={() => onToggleChecklist?.(schedule.groupId, 'vehicle')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: checks.vehicle ? '#3b82f6' : '#e5e7eb',
                        transition: '.4s', borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px',
                          left: checks.vehicle ? '22px' : '3px', bottom: '3px',
                          backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  )}
                </div>

                {/* Password Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                      <Lock size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111827' }}>비밀번호 설정</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{checks.password ? '설정 완료' : '미설정'}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={checks.password} 
                        onChange={() => onToggleChecklist?.(schedule.groupId, 'password')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: checks.password ? '#3b82f6' : '#e5e7eb',
                        transition: '.4s', borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px',
                          left: checks.password ? '22px' : '3px', bottom: '3px',
                          backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Cleaning Checklist for Out */}
            {!isBlock && schedule.type === 'out' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111827' }}>청소 체크리스트</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>퇴실 후 청소 항목을 확인하세요</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', background: '#f9fafb', borderRadius: '16px' }}>
                  {cleaningTemplate.map((task: string, index: number) => {
                    const isCompleted = checks.cleaning?.[index] || false;
                    return (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div 
                          onClick={() => isAdmin && onToggleChecklist?.(schedule.groupId, 'cleaning', index)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isAdmin ? 'pointer' : 'default', flex: 1 }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={18} color="#22c55e" />
                          ) : (
                            <Circle size={18} color="#d1d5db" />
                          )}
                          <span style={{ 
                            fontSize: '0.9rem', 
                            color: isCompleted ? '#9ca3af' : '#374151',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            fontWeight: '500'
                          }}>
                            {task}
                          </span>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => {
                              const newTemplate = [...cleaningTemplate];
                              newTemplate.splice(index, 1);
                              onUpdateTemplate?.(newTemplate);
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input 
                        type="text" 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="새 항목 추가..."
                        style={{ 
                          flex: 1, 
                          padding: '8px 12px', 
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb', 
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTask.trim()) {
                            onUpdateTemplate?.([...cleaningTemplate, newTask.trim()]);
                            setNewTask("");
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (newTask.trim()) {
                            onUpdateTemplate?.([...cleaningTemplate, newTask.trim()]);
                            setNewTask("");
                          }
                        }}
                        style={{ 
                          background: 'var(--primary)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          padding: '0 12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}

                  {cleaningTemplate.length === 0 && !isAdmin && (
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', padding: '8px' }}>
                      설정된 청소 항목이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
