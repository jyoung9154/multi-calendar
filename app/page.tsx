"use client";
import { useState, useEffect } from "react";
import Calendar from "@/components/Calendar";
import ScheduleList, { Schedule } from "@/components/ScheduleList";
import ScheduleForm from "@/components/ScheduleForm";
import { startOfWeek, endOfWeek, format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import './globals.css';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, query, getDocs, deleteDoc } from "firebase/firestore";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [apiSchedules, setApiSchedules] = useState<Schedule[]>([]);
  const [manualSchedules, setManualSchedules] = useState<Schedule[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [checklists, setChecklists] = useState<Record<string, any>>({});
  const [cleaningTemplate, setCleaningTemplate] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    // Check local storage for authorization and role
    const authStatus = localStorage.getItem('isAuthorized');
    const adminStatus = localStorage.getItem('isAdmin');
    if (authStatus === 'true') {
      setIsAuthorized(true);
      setIsAdmin(adminStatus === 'true');
    }

    // Real-time sync for manual schedules
    const schedulesRef = collection(db, "schedules");
    const unsubscribeSchedules = onSnapshot(schedulesRef, (snapshot) => {
      const fetchedSchedules = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          date: data.date.toDate() // Firestore Timestamp to Date
        } as Schedule;
      });
      setManualSchedules(fetchedSchedules);
    }, (error) => {
      console.error("Firestore schedules error:", error);
    });

    // Real-time sync for checklists
    const checklistsRef = collection(db, "checklists");
    const unsubscribeChecklists = onSnapshot(checklistsRef, (snapshot) => {
      const fetchedChecklists: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        fetchedChecklists[doc.id] = doc.data();
      });
      setChecklists(fetchedChecklists);
    }, (error) => {
      console.error("Firestore checklists error:", error);
    });

    // Real-time sync for cleaning template
    const templateRef = doc(db, "settings", "cleaning");
    const unsubscribeTemplate = onSnapshot(templateRef, (doc) => {
      if (doc.exists()) {
        setCleaningTemplate(doc.data().tasks || []);
      }
    });

    // Fetch API schedules (iCal)
    fetch('/api/ical')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const parsed = data.schedules.map((s: any) => ({ ...s, date: new Date(s.date) }));
          setApiSchedules(parsed);
        }
      });

    return () => {
      unsubscribeSchedules();
      unsubscribeChecklists();
      unsubscribeTemplate();
    };
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "22129154") { // New Admin password
      setIsAuthorized(true);
      setIsAdmin(true);
      localStorage.setItem('isAuthorized', 'true');
      localStorage.setItem('isAdmin', 'true');
    } else if (passwordInput === "9154") { // General password
      setIsAuthorized(true);
      setIsAdmin(false);
      localStorage.setItem('isAuthorized', 'true');
      localStorage.setItem('isAdmin', 'false');
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  const handleAddSchedule = async (newSchedules: Schedule[]) => {
    try {
      for (const s of newSchedules) {
        await setDoc(doc(db, "schedules", s.id), {
          ...s,
          date: s.date // Firestore handles Date objects
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error adding schedule:", error);
      alert("일정 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSchedule = async (groupId: string) => {
    if (!confirm("정말 이 일정을 삭제하시겠습니까?")) return;
    try {
      // Delete both 'in' and 'out' schedules for this groupId
      await deleteDoc(doc(db, "schedules", `${groupId}-in`));
      await deleteDoc(doc(db, "schedules", `${groupId}-out`));
      
      // Also clean up checklist if exists
      await deleteDoc(doc(db, "checklists", groupId));
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("일정 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleToggleChecklist = async (groupId: string, field: string, taskIndex?: number) => {
    try {
      const current = checklists[groupId] || { vehicle: false, password: false, cleaning: {} };
      let updated;
      
      if (field === 'cleaning' && typeof taskIndex === 'number') {
        const cleaning = { ...(current.cleaning || {}) };
        cleaning[taskIndex] = !cleaning[taskIndex];
        updated = { ...current, cleaning };
      } else {
        updated = { 
          ...current, 
          [field]: !current[field] 
        };
      }
      await setDoc(doc(db, "checklists", groupId), updated);
    } catch (error) {
      console.error("Error toggling checklist:", error);
    }
  };

  const handleUpdateTemplate = async (newTasks: string[]) => {
    try {
      await setDoc(doc(db, "settings", "cleaning"), { tasks: newTasks });
    } catch (error) {
      console.error("Error updating template:", error);
    }
  };

  if (!mounted) return null;

  if (!isAuthorized) {
    return (
      <div className="app-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.9)', 
          backdropFilter: 'blur(10px)',
          padding: '48px 40px', 
          borderRadius: '32px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)', 
          textAlign: 'center', 
          width: '90%', 
          maxWidth: '400px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'var(--primary)', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px',
              boxShadow: '0 8px 16px rgba(0,122,255,0.2)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>보안 접속</h1>
            <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '0.95rem', fontWeight: 500 }}>일정 관리를 위해 비밀번호를 입력하세요</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••"
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  paddingLeft: 'calc(18px + 0.5em)', // Offset letter-spacing for perfect centering
                  borderRadius: '16px', 
                  border: '2px solid #e5e7eb', 
                  fontSize: '1.5rem', 
                  textAlign: 'center', 
                  letterSpacing: '0.5em',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: 'white',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                autoFocus
              />
            </div>
            <button type="submit" style={{ 
              width: '100%', 
              padding: '18px', 
              background: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '16px', 
              fontWeight: '700', 
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,122,255,0.3)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              입장하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  const allSchedules = [...apiSchedules, ...manualSchedules];
  
  // 다음 이벤트 최대 2개 추출
  const nextEvents = allSchedules
    .filter(s => s.date >= new Date(new Date().setHours(0,0,0,0)) && !s.isBlock)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 2);

  return (
    <div className="app-container">
      <header style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800 }}>예약 일정 관리</h1>
        {isAdmin && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '20px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            + 일정 추가
          </button>
        )}
      </header>
      <main className="page-content">
        
        {/* 달력 섹션 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 700 }}>예약 달력</h2>
          <Calendar 
            onDateChange={(date) => {
              if (isDateFocused && isSameDay(selectedDate, date)) {
                setIsDateFocused(false);
              } else {
                setSelectedDate(date);
                setIsDateFocused(true);
              }
            }} 
            schedules={allSchedules} 
          />
        </section>

        {/* 선택한 날짜 일정 */}
        {isDateFocused && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 700 }}>
              선택한 날짜: {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}
            </h2>
            <ScheduleList 
              selectedDate={selectedDate} 
              schedules={allSchedules} 
              checklists={checklists}
              onToggleChecklist={handleToggleChecklist}
              isAdmin={isAdmin}
              cleaningTemplate={cleaningTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onDelete={handleDeleteSchedule}
            />
          </section>
        )}

        {/* 다음 이벤트 섹션 */}
        <section>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 700 }}>다음 주요 일정</h2>
          <ScheduleList 
            schedules={nextEvents} 
            checklists={checklists}
            onToggleChecklist={handleToggleChecklist}
            isAdmin={isAdmin}
            cleaningTemplate={cleaningTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDelete={handleDeleteSchedule}
          />
        </section>

      </main>

      {showForm && (
        <ScheduleForm onAdd={handleAddSchedule} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
