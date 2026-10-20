import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowUpLeft, Bell, BookOpen, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Compass, Flame, FolderKanban,
  Home, LogIn, Menu, MessageCircle, MoreHorizontal, Plus, Search, Send, Settings,
  ShieldCheck, Sparkles, Target, Users, X, Zap
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Task = { id: number; title: string; category: string; time: string; done: boolean; priority: 'عالية' | 'متوسطة' | 'منخفضة' }
type Section = 'الرئيسية' | 'مهامي' | 'المجتمع' | 'التعلّم' | 'إنجازاتي'

const initialTasks: Task[] = [
  { id: 1, title: 'مراجعة أهداف الأسبوع', category: 'شخصي', time: '09:30 ص', done: true, priority: 'متوسطة' },
  { id: 2, title: 'إنهاء واجب الرياضيات', category: 'دراسة', time: '11:00 ص', done: false, priority: 'عالية' },
  { id: 3, title: 'التدرّب على TypeScript', category: 'تطوير', time: '04:00 م', done: false, priority: 'متوسطة' },
]

const navItems: { label: Section; icon: typeof Home }[] = [
  { label: 'الرئيسية', icon: Home },
  { label: 'مهامي', icon: CheckCircle2 },
  { label: 'المجتمع', icon: Users },
  { label: 'التعلّم', icon: BookOpen },
  { label: 'إنجازاتي', icon: Target },
]

export default function App() {
  const [section, setSection] = useState<Section>('الرئيسية')
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('riwaq-demo-tasks')
      return saved ? JSON.parse(saved) as Task[] : initialTasks
    } catch { return initialTasks }
  })
  const [newTask, setNewTask] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [phone, setPhone] = useState('+966')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem('riwaq-demo-tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUserPhone(data.session?.user.phone ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserPhone(session?.user.phone ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const completed = tasks.filter(task => task.done).length
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const today = useMemo(() => new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()), [])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function addTask() {
    const title = newTask.trim()
    if (!title) return
    setTasks(prev => [...prev, { id: Date.now(), title, category: 'شخصي', time: 'بدون موعد', done: false, priority: 'متوسطة' }])
    setNewTask('')
    setShowAddTask(false)
    notify('تمت إضافة المهمة')
  }

  async function sendOtp() {
    setAuthMessage('')
    if (!supabase) {
      setAuthMessage('أضف إعدادات Supabase في ملف .env أولًا لتفعيل SMS.')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setAuthMessage('اكتب رقم الجوال مع مفتاح الدولة، مثال: +9665XXXXXXXX')
      return
    }
    setAuthBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    setAuthBusy(false)
    if (error) setAuthMessage(error.message)
    else {
      setOtpSent(true)
      setAuthMessage('تم طلب إرسال الرمز. تحقق من رسائل جوالك.')
    }
  }

  async function verifyOtp() {
    setAuthMessage('')
    if (!supabase) return setAuthMessage('أضف إعدادات Supabase في ملف .env أولًا.')
    if (otp.trim().length < 4) return setAuthMessage('أدخل رمز التحقق الذي وصلك.')
    setAuthBusy(true)
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp.trim(), type: 'sms' })
    setAuthBusy(false)
    if (error) setAuthMessage(error.message)
    else {
      setShowAuth(false)
      setOtpSent(false)
      setOtp('')
      notify('تم تسجيل الدخول بنجاح')
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setUserPhone(null)
    notify('تم تسجيل الخروج')
  }

  function chooseSection(next: Section) {
    setSection(next)
    setMobileNav(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={22} /></div>
          <div><div className="brand-name">رِواق</div><div className="brand-subtitle">مساحتك ليوم أفضل</div></div>
          <button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={() => setMobileNav(false)}><X size={19} /></button>
        </div>
        <button className="workspace-switch">
          <div className="workspace-avatar">ر</div>
          <div className="workspace-copy"><strong>مساحتي الشخصية</strong><span>{userPhone ? 'حساب موثّق' : 'نسخة تجريبية'}</span></div>
          <ChevronDown size={16} />
        </button>
        <div className="nav-label">القائمة الرئيسية</div>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${section === label ? 'active' : ''}`} onClick={() => chooseSection(label)}>
              <Icon size={19} strokeWidth={1.9} /><span>{label}</span>
              {label === 'مهامي' && <span className="nav-count">{tasks.filter(t => !t.done).length}</span>}
            </button>
          ))}
        </nav>
        <div className="nav-label tools-label">مساحتك</div>
        <button className="nav-item" onClick={() => notify('قريبًا: مكتبة ملفاتك')}><FolderKanban size={19}/><span>ملفاتي</span><span className="soon-tag">قريبًا</span></button>
        <button className="nav-item" onClick={() => notify('قريبًا: المساعد الذكي')}><Sparkles size={19}/><span>مساعد رِواق</span><span className="new-dot"/></button>
        <div className="sidebar-spacer"/>
        <div className="sidebar-tip">
          <div className="tip-icon"><Zap size={17}/></div>
          <strong>خطوة صغيرة كل يوم</strong>
          <p>الاستمرار أهم من الكمال. أنجز مهمة واحدة الآن.</p>
          <button onClick={() => { setShowAddTask(true); setSection('مهامي') }}>أضف مهمة <ArrowLeft size={14}/></button>
        </div>
        <button className="profile-row" onClick={() => userPhone ? signOut() : setShowAuth(true)}>
          <div className="profile-avatar">{userPhone ? <ShieldCheck size={19}/> : '؟'}</div>
          <div className="profile-copy"><strong>{userPhone ? 'حسابي' : 'زائر رِواق'}</strong><span>{userPhone ?? 'سجّل الدخول للحفظ السحابي'}</span></div>
          <MoreHorizontal size={19}/>
        </button>
      </aside>

      {mobileNav && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-leading">
            <button className="icon-button mobile-menu" aria-label="فتح القائمة" onClick={() => setMobileNav(true)}><Menu size={21}/></button>
            <div className="breadcrumb"><span>مساحتي</span><span className="breadcrumb-slash">/</span><strong>{section}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="search-box"><Search size={17}/><input aria-label="بحث" placeholder="ابحث عن مهام أو أفكار..." onKeyDown={e => { if (e.key === 'Enter') notify('البحث الشامل قادم في المرحلة التالية') }}/><kbd>⌘ K</kbd></div>
            <button className="icon-button notification-button" aria-label="الإشعارات" onClick={() => notify('لا توجد إشعارات جديدة')}><Bell size={19}/><span/></button>
            <button className="topbar-avatar" onClick={() => setShowAuth(true)}>{userPhone ? <ShieldCheck size={18}/> : '؟'}</button>
          </div>
        </header>

        <div className="page-content">
          {section === 'الرئيسية' && <>
            <section className="welcome-row">
              <div><div className="eyebrow"><span className="eyebrow-dot"/>{today}</div><h1>يومك يبدأ <span>بخطوة.</span></h1><p className="welcome-subtitle">رتّب أفكارك، ركّز على المهم، واترك الباقي على رِواق.</p></div>
              <button className="primary-button" onClick={() => { setShowAddTask(true); setSection('مهامي') }}><Plus size={18}/> مهمة جديدة</button>
            </section>

            <section className="hero-card">
              <div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/>
              <div className="hero-content">
                <div className="hero-kicker"><Sparkles size={15}/> مساحتك نحو الأفضل</div>
                <h2>كل إنجاز كبير،<br/><span>يبدأ بخطوة صغيرة.</span></h2>
                <p>أنجز اليوم شيئًا واحدًا يقرّبك من هدفك.</p>
                <button className="hero-button" onClick={() => { setSection('مهامي'); setShowAddTask(true) }}>ابدأ إنجازك <ArrowLeft size={16}/></button>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-a"/><div className="orbit orbit-b"/>
                <div className="hero-orb"><Sparkles size={43}/></div>
                <div className="floating-card floating-card-top"><CheckCircle2 size={16}/><span>تقدّم مستمر</span></div>
                <div className="floating-card floating-card-bottom"><Flame size={16}/><span>يوم جديد، فرصة جديدة</span></div>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card"><div className="stat-icon stat-purple"><CheckCircle2 size={19}/></div><div className="stat-label">المهام المكتملة</div><div className="stat-value">{completed}<span> / {tasks.length}</span></div><div className="stat-foot"><span className="positive"><ArrowUpLeft size={13}/> {progress}%</span> من مهامك</div></div>
              <div className="stat-card"><div className="stat-icon stat-orange"><Flame size={19}/></div><div className="stat-label">سلسلة الاستمرار</div><div className="stat-value">3 <span>أيام</span></div><div className="stat-foot">حافظ على عادتك اليومية</div></div>
              <div className="stat-card"><div className="stat-icon stat-green"><Target size={19}/></div><div className="stat-label">هدف هذا الأسبوع</div><div className="stat-value">4 <span> / 7</span></div><div className="mini-progress"><span style={{width:'57%'}}/></div></div>
              <div className="stat-card"><div className="stat-icon stat-blue"><Activity size={19}/></div><div className="stat-label">نقاط الخبرة</div><div className="stat-value">240 <span>XP</span></div><div className="stat-foot">واصل التقدم لتفتح مستوى جديدًا</div></div>
            </section>

            <section className="content-grid">
              <div className="panel tasks-panel">
                <div className="panel-heading"><div><h3>مهام اليوم</h3><p>خطوات صغيرة تصنع فرقًا</p></div><button className="text-button" onClick={() => setSection('مهامي')}>عرض الكل <ArrowLeft size={15}/></button></div>
                <div className="task-list">
                  {tasks.slice(0, 4).map(task => <TaskRow key={task.id} task={task} onToggle={() => setTasks(prev => prev.map(t => t.id === task.id ? {...t, done: !t.done} : t))}/>)}
                  {tasks.length === 0 && <div className="empty-state">ما عندك مهام حتى الآن. ابدأ بإضافة أول مهمة.</div>}
                </div>
                <button className="add-task-inline" onClick={() => { setShowAddTask(true); setSection('مهامي') }}><Plus size={16}/> أضف مهمة جديدة</button>
              </div>
              <div className="panel focus-panel">
                <div className="panel-heading"><div><h3>تركيزك اليوم</h3><p>كل خطوة تُحسب لك</p></div><button className="subtle-icon" aria-label="معلومات" onClick={() => notify('يُحسب التقدم من المهام التي تنجزها هنا')}><CircleHelp size={17}/></button></div>
                <div className="progress-ring-wrap"><svg className="progress-ring" viewBox="0 0 150 150"><circle className="ring-track" cx="75" cy="75" r="61"/><circle className="ring-value" cx="75" cy="75" r="61" strokeDasharray={`${progress * 3.83} 383`}/></svg><div className="ring-center"><strong>{progress}%</strong><span>منجز اليوم</span></div></div>
                <div className="focus-caption"><span className="focus-caption-dot"/>{completed} من {tasks.length} مهام مكتملة</div>
                <div className="focus-divider"/>
                <div className="focus-quote"><Sparkles size={17}/><p>«لا تحتاج إلى أن تكون مثاليًا، فقط استمر.»</p></div>
              </div>
            </section>

            <section className="bottom-grid">
              <div className="panel quick-panel"><div className="panel-heading"><div><h3>مساحاتك السريعة</h3><p>انتقل لما تحتاجه</p></div></div><div className="quick-actions"><button onClick={() => {setSection('مهامي');setShowAddTask(true)}}><span className="quick-icon quick-task"><CheckCircle2 size={19}/></span><strong>مهمة جديدة</strong><small>رتّب أولوياتك</small></button><button onClick={() => setSection('التعلّم')}><span className="quick-icon quick-learn"><BookOpen size={19}/></span><strong>تعلّم شيئًا</strong><small>طوّر مهاراتك</small></button><button onClick={() => setSection('المجتمع')}><span className="quick-icon quick-community"><MessageCircle size={19}/></span><strong>شارك فكرة</strong><small>تواصل مع الآخرين</small></button></div></div>
              <div className="panel date-panel"><div className="date-panel-icon"><CalendarDays size={21}/></div><div><h3>خطّط لأسبوعك</h3><p>قسّم أهدافك إلى خطوات واضحة، وتابع تقدمك يومًا بعد يوم.</p><button className="text-button" onClick={() => notify('التقويم التفصيلي قادم ضمن المرحلة التالية')}>قريبًا في رِواق <ArrowLeft size={14}/></button></div></div>
            </section>
          </>}

          {section === 'مهامي' && <section className="subpage">
            <div className="subpage-heading"><div><div className="eyebrow">خطوة بخطوة</div><h1>مهامي</h1><p>رتّب أولوياتك وأنجز ما يهمك.</p></div><button className="primary-button" onClick={() => setShowAddTask(v => !v)}><Plus size={18}/> مهمة جديدة</button></div>
            {showAddTask && <form className="add-task-form" onSubmit={e => {e.preventDefault();addTask()}}><input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="اكتب المهمة التي تريد إنجازها..." /><button className="primary-button" type="submit"><Plus size={17}/> إضافة</button><button type="button" className="icon-button" onClick={() => setShowAddTask(false)}><X size={18}/></button></form>}
            <div className="task-summary"><div><span>كل المهام</span><strong>{tasks.length}</strong></div><div><span>قيد التنفيذ</span><strong>{tasks.filter(t=>!t.done).length}</strong></div><div><span>مكتملة</span><strong>{completed}</strong></div></div>
            <div className="panel full-task-panel"><div className="panel-heading"><div><h3>قائمة المهام</h3><p>اضغط على الدائرة لتحديث حالة المهمة</p></div></div>{tasks.map(task => <TaskRow key={task.id} task={task} onToggle={() => setTasks(prev => prev.map(t => t.id === task.id ? {...t, done: !t.done} : t))} onDelete={() => setTasks(prev => prev.filter(t=>t.id !== task.id))}/>)}</div>
          </section>}

          {section === 'المجتمع' && <ComingSoon icon={Users} title="مجتمع رِواق" description="مساحة لمشاركة أفكارك ومشاريعك والتفاعل مع أشخاص يشاركونك الاهتمامات." features={['منشورات وتعليقات','متابعة الحسابات','مشاركة المشاريع']} onAction={() => notify('سيتم بناء المجتمع في المرحلة الثانية')}/>}
          {section === 'التعلّم' && <ComingSoon icon={BookOpen} title="تعلّم كل يوم" description="مسارات قصيرة وتحديات عملية تساعدك على اكتساب مهارات جديدة." features={['مسارات تعليمية','تحديات يومية','شارات إنجاز']} onAction={() => notify('سيتم بناء قسم التعلّم في المرحلة التالية')}/>}
          {section === 'إنجازاتي' && <section className="subpage"><div className="subpage-heading"><div><div className="eyebrow">كل خطوة لها قيمة</div><h1>إنجازاتي</h1><p>تابع تقدّمك واحتفل بما أنجزته.</p></div></div><div className="achievement-grid"><div className="achievement-card"><div className="achievement-icon"><Flame size={25}/></div><strong>بداية موفقة</strong><span>أنجز أول مهمة لك</span><small>{completed > 0 ? 'تم فتحها' : 'لم تُفتح بعد'}</small></div><div className="achievement-card"><div className="achievement-icon purple"><Zap size={25}/></div><strong>خطوة مستمرة</strong><span>حافظ على التقدم</span><small>قريبًا</small></div><div className="achievement-card"><div className="achievement-icon blue"><Target size={25}/></div><strong>صاحب هدف</strong><span>أكمل 5 مهام</span><small>{completed >= 5 ? 'تم فتحها' : 'لم تُفتح بعد'}</small></div></div></section>}
          <footer className="footer"><span>© {new Date().getFullYear()} رِواق</span><span>مساحتك ليوم أفضل</span><button onClick={() => notify('رِواق في مرحلة البناء — ملاحظاتك تهمنا')}><MessageCircle size={14}/> أرسل ملاحظة</button></footer>
        </div>
      </main>

      {showAuth && <div className="modal-backdrop" onClick={() => setShowAuth(false)}><div className="auth-modal" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setShowAuth(false)} aria-label="إغلاق"><X size={19}/></button><div className="auth-mark"><ShieldCheck size={26}/></div><h2>{otpSent ? 'تحقق من الرمز' : 'أهلًا بك في رِواق'}</h2><p>{otpSent ? `أدخل رمز التحقق الذي أرسلناه إلى ${phone}` : 'سجّل برقم جوالك للوصول إلى حسابك.'}</p>{!otpSent ? <form onSubmit={e=>{e.preventDefault();void sendOtp()}}><label htmlFor="phone">رقم الجوال</label><input id="phone" dir="ltr" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+9665XXXXXXXX" autoComplete="tel" /><button className="primary-button auth-submit" disabled={authBusy} type="submit">{authBusy ? 'جارٍ الإرسال...' : 'أرسل رمز التحقق'} <ArrowLeft size={17}/></button></form> : <form onSubmit={e=>{e.preventDefault();void verifyOtp()}}><label htmlFor="otp">رمز التحقق</label><input id="otp" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={otp} onChange={e=>setOtp(e.target.value)} placeholder="123456" /><button className="primary-button auth-submit" disabled={authBusy} type="submit">{authBusy ? 'جارٍ التحقق...' : 'تحقق وسجّل الدخول'} <ShieldCheck size={17}/></button><button type="button" className="text-button resend-button" onClick={()=>{setOtpSent(false);setOtp('');setAuthMessage('')}}>تغيير الرقم أو إعادة المحاولة</button></form>}{authMessage && <div className={`auth-message ${authMessage.includes('تم طلب') ? 'success' : ''}`}>{authMessage}</div>}<div className="auth-note"><ShieldCheck size={14}/>{isSupabaseConfigured ? 'يتم التحقق عبر Supabase Auth.' : 'واجهة التسجيل جاهزة؛ اربط Supabase لتفعيل الرسائل فعليًا.'}</div></div></div>}

      {toast && <div className="toast"><Check size={17}/>{toast}</div>}
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete?: () => void }) {
  return <div className={`task-row ${task.done ? 'task-done' : ''}`}><button className={`task-check ${task.done ? 'checked' : ''}`} aria-label={task.done ? 'إلغاء إكمال المهمة' : 'إكمال المهمة'} onClick={onToggle}>{task.done && <Check size={13}/>}</button><div className="task-main"><strong>{task.title}</strong><div className="task-meta"><span className="task-category">{task.category}</span><span><Clock3 size={12}/>{task.time}</span></div></div><span className={`priority priority-${task.priority === 'عالية' ? 'high' : task.priority === 'متوسطة' ? 'medium' : 'low'}`}>{task.priority}</span>{onDelete && <button className="delete-task" aria-label="حذف المهمة" onClick={onDelete}><X size={15}/></button>}</div>
}

function ComingSoon({ icon: Icon, title, description, features, onAction }: { icon: typeof Home; title: string; description: string; features: string[]; onAction: () => void }) {
  return <section className="coming-page"><div className="coming-icon"><Icon size={30}/></div><div className="eyebrow">قريبًا في رِواق</div><h1>{title}</h1><p>{description}</p><div className="coming-features">{features.map(feature=><span key={feature}><CheckCircle2 size={16}/>{feature}</span>)}</div><button className="primary-button" onClick={onAction}>استكشف الخطة <ArrowLeft size={16}/></button></section>
}
