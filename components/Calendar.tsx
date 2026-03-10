"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfDay, startOfWeek, endOfWeek } from "date-fns";
import styles from "./Calendar.module.css";
import { Schedule } from "./ScheduleList";

interface CalendarProps {
  onDateChange?: (date: Date) => void;
  schedules?: Schedule[];
}

const getPlatformColor = (platform: string, isBlock?: boolean) => {
  if (isBlock) return '#9e9e9e';
  switch (platform) {
    case '리브애니웨어': return '#3b82f6'; // Blue
    case '삼삼엠투': return '#f97316'; // Orange
    case '에어비앤비': return '#ef4444'; // Red
    case '개인예약': return '#8b5cf6'; // Purple
    default: return 'var(--primary)';
  }
};

const getPlatformLabel = (platform: string, isBlock?: boolean) => {
  if (isBlock) return '예약 차단';
  if (!platform || platform.toLowerCase().includes('reserved')) return '';
  return platform;
};

export default function Calendar({ onDateChange, schedules = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Group schedules by groupId to assign tracks
  const bookings = schedules.reduce((acc, s) => {
    if (!acc[s.groupId]) {
      acc[s.groupId] = { 
        groupId: s.groupId, 
        platform: s.platform, 
        isBlock: s.isBlock,
        guestName: s.guestName,
        start: s.date,
        end: s.date
      };
    }
    if (s.type === 'in') acc[s.groupId].start = s.date;
    if (s.type === 'out') acc[s.groupId].end = s.date;
    return acc;
  }, {} as Record<string, any>);

  const sortedBookings = Object.values(bookings).sort((a: any, b: any) => a.start.getTime() - b.start.getTime());
  
  // Assign tracks to bookings
  const bookingTracks: Record<string, number> = {};
  const trackEndDates: Date[] = [];

  sortedBookings.forEach((booking: any) => {
    let trackIndex = trackEndDates.findIndex(endDate => startOfDay(booking.start) >= startOfDay(endDate));
    if (trackIndex === -1) {
      trackIndex = trackEndDates.length;
      trackEndDates.push(booking.end);
    } else {
      trackEndDates[trackIndex] = booking.end;
    }
    bookingTracks[booking.groupId] = trackIndex;
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>&lt;</button>
        <h2>{format(currentDate, 'yyyy년 M월')}</h2>
        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>&gt;</button>
      </div>
      
      <div className={styles.grid}>
        {WEEKDAYS.map(day => <div key={day} className={styles.dayName}>{day}</div>)}

        {daysInMonth.map((day, idx) => {
          const daySchedules = schedules.filter(s => isSameDay(s.date, day));
          
          const midSchedules = schedules.filter(s => {
             if (s.type === 'in') {
                const outS = schedules.find(o => o.groupId === s.groupId && o.type === 'out');
                if (outS) {
                   return startOfDay(day) > startOfDay(s.date) && startOfDay(day) < startOfDay(outS.date);
                }
             }
             return false;
          });

          // 일반 예약이 있는지 확인
          const hasNormalSchedule = daySchedules.some(s => !s.isBlock) || midSchedules.some(s => !s.isBlock);

          // 일반 예약이 있다면 차단 일정 제거
          const finalDaySchedules = hasNormalSchedule ? daySchedules.filter(s => !s.isBlock) : daySchedules;
          const finalMidSchedules = hasNormalSchedule ? midSchedules.filter(s => !s.isBlock) : midSchedules;

          const inSchedules = finalDaySchedules.filter(s => s.type === 'in').sort((a, b) => a.groupId.localeCompare(b.groupId));
          const outSchedules = finalDaySchedules.filter(s => s.type === 'out').sort((a, b) => a.groupId.localeCompare(b.groupId));
          const sortedMidSchedules = [...finalMidSchedules].sort((a, b) => a.groupId.localeCompare(b.groupId));

          let cellClass = styles.cell;
          if (!isSameMonth(day, monthStart)) cellClass += ` ${styles.disabled}`;
          if (startOfDay(day) < startOfDay(new Date())) cellClass += ` ${styles.pastDay}`;

          const renderBars = () => {
             const bars: React.ReactNode[] = [];
             const BAR_HEIGHT = 6;
             const TRACK_HEIGHT = 22; 
             const BASE_BOTTOM = 4;

             const getShowLabel = (groupId: string, currentDay: Date) => {
                const booking = bookings[groupId];
                if (!booking) return false;
                
                // 해당 주(Week) 내에서의 시작과 끝 계산
                const weekStart = startOfWeek(currentDay);
                const weekEnd = endOfWeek(currentDay);
                
                const effectiveStart = startOfDay(booking.start) > weekStart ? startOfDay(booking.start) : weekStart;
                const effectiveEnd = startOfDay(booking.end) < weekEnd ? startOfDay(booking.end) : weekEnd;
                
                // 해당 주에 포함된 일수
                const diffDays = Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                // 중간 날짜 계산
                const midOffset = Math.floor(diffDays / 2);
                const midDay = new Date(effectiveStart.getTime());
                midDay.setDate(midDay.getDate() + midOffset);
                
                return isSameDay(currentDay, midDay);
             };

             outSchedules.forEach(s => {
                const color = getPlatformColor(s.platform, s.isBlock);
                const track = bookingTracks[s.groupId] ?? 0;
                const bottom = BASE_BOTTOM + (track * TRACK_HEIGHT);
                const showLabel = getShowLabel(s.groupId, day);
                const label = getPlatformLabel(s.platform, s.isBlock);

                bars.push(
                  <div key={`out-container-${s.id}`}>
                    {showLabel && (
                      <div className={styles.barLabelContainer} style={{ bottom: bottom + BAR_HEIGHT + 1, left: 0, width: '50%' }}>
                        <span className={styles.barLabel}>{label}</span>
                      </div>
                    )}
                    <div className={styles.rangeBgLeft} style={{ bottom, backgroundColor: color, height: BAR_HEIGHT }}></div>
                  </div>
                );
             });

             inSchedules.forEach(s => {
                const color = getPlatformColor(s.platform, s.isBlock);
                const label = getPlatformLabel(s.platform, s.isBlock);
                const track = bookingTracks[s.groupId] ?? 0;
                const bottom = BASE_BOTTOM + (track * TRACK_HEIGHT);
                const showLabel = getShowLabel(s.groupId, day);

                bars.push(
                  <div key={`in-container-${s.id}`}>
                    {showLabel && (
                      <div className={styles.barLabelContainer} style={{ bottom: bottom + BAR_HEIGHT + 1, left: '50%', width: '50%' }}>
                        <span className={styles.barLabel}>{label}</span>
                      </div>
                    )}
                    <div className={styles.rangeBgRight} style={{ bottom, backgroundColor: color, height: BAR_HEIGHT }}></div>
                  </div>
                );
             });

             sortedMidSchedules.forEach(s => {
                const color = getPlatformColor(s.platform, s.isBlock);
                const label = getPlatformLabel(s.platform, s.isBlock);
                const track = bookingTracks[s.groupId] ?? 0;
                const bottom = BASE_BOTTOM + (track * TRACK_HEIGHT);
                const showLabel = getShowLabel(s.groupId, day);
                
                bars.push(
                  <div key={`mid-container-${s.id}`}>
                    {showLabel && (
                      <div className={styles.barLabelContainer} style={{ bottom: bottom + BAR_HEIGHT + 1, left: 0, width: '100%' }}>
                        <span className={styles.barLabel}>{label}</span>
                      </div>
                    )}
                    <div className={styles.rangeBgFull} style={{ bottom, backgroundColor: color, height: BAR_HEIGHT }}></div>
                  </div>
                );
             });

             return bars;
          };

          return (
            <div key={idx} className={cellClass} onClick={() => onDateChange?.(day)}>
              <span className={styles.dateNumber}>{format(day, "d")}</span>
              
              <div className={styles.events}>
                {inSchedules.map(s => (
                  <span key={`badge-in-${s.id}`} className={`${styles.badge} ${s.isBlock ? styles.badgeBlock : styles.badgeIn}`}>
                    {s.isBlock ? '차단' : '입실'}
                  </span>
                ))}
                {outSchedules.map(s => (
                  <span key={`badge-out-${s.id}`} className={`${styles.badge} ${s.isBlock ? styles.badgeBlock : styles.badgeOut}`}>
                    {s.isBlock ? '해제' : '퇴실'}
                  </span>
                ))}
              </div>
              {renderBars()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
