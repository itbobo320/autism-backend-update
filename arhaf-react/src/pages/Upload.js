import { useState, useRef } from 'react';
import { useLang }    from '../context/LangContext';
import { useApp }     from '../context/AppContext';
import { Orb, WaveBars, Field, GenderToggle } from '../components/UI';

/* ════════════ STEP 1: FORM ════════════ */
function FormStep({ onSubmit, setGlobalFile }) {
  const { t }             = useLang();
  const { kids, showToast } = useApp();
  const [mode, setMode]   = useState('new');
  const [name, setName]   = useState('');
  const [age, setAge]     = useState('');
  const [gender, setGender] = useState('M');
  const [childId, setChildId] = useState('');
  const [recording, setRecording] = useState(false);
  const [hasAudio, setHasAudio]   = useState(false);
  const [file, setFile]   = useState(null);
  const fileRef = useRef();

  const startRec = () => { setRecording(true); setHasAudio(false); setFile(null); setGlobalFile(null); };
  const stopRec  = () => { setRecording(false); setHasAudio(true); };
  
  const onFile   = (e) => { 
    const f = e.target.files[0]; 
    if (f) { 
      setFile(f); 
      setGlobalFile(f); // نرسله للأب (Upload)
      setHasAudio(true); 
      setRecording(false); 
    } 
  };

  const handleSubmit = () => {
    if (mode === 'new') {
      if (!name || !age) { showToast(t.err_name, 'terr'); return; }
      onSubmit({ name, age_months: parseInt(age), gender });
    } else {
      if (!childId) { showToast(t.err_child, 'terr'); return; }
      const found = kids.find(c => c.id === parseInt(childId));
      onSubmit(found);
    }
  };

  return (
    <div className="wrap-sm page-enter">
      <Orb size={300} color="#7c3aed" x="88%" y="14%" opacity={0.08} />
      <h2 className="pg-ttl">{t.uploadTitle}</h2>
      <div className="card" style={{ marginTop: 22 }}>
        <div className="mode-row">
          <button className={`mode-btn${mode === 'new' ? ' active' : ''}`} onClick={() => setMode('new')}>{t.newChild}</button>
          <button className={`mode-btn${mode === 'exist' ? ' active' : ''}`} onClick={() => setMode('exist')}>{t.existChild}</button>
        </div>

        {mode === 'new' ? (
          <>
            <Field label={t.childName} value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} icon="👶" />
            <Field label={t.childAge} type="number" value={age} onChange={e => setAge(Math.max(0, e.target.value))} min="0" />
            <div className="fgrp">
              <label className="flbl">{t.childGender}</label>
              <GenderToggle value={gender} onChange={setGender} />
            </div>
          </>
        ) : (
          <div className="fgrp">
            <label className="flbl">{t.existChild}</label>
            <select className="fsel" value={childId} onChange={e => setChildId(e.target.value)}>
              <option value="">{t.selectKid}</option>
              {kids.map(c => (
                <option key={c.id} value={c.id}>{c.name} • {c.age_months} {t.months}</option>
              ))}
            </select>
          </div>
        )}

        <div className="audio-sec">
          <div className={`up-box${file ? ' hasfile' : ''}`} onClick={() => fileRef.current?.click()}>
            <div className="up-ico">{file ? '✅' : '📁'}</div>
            <div className="up-lbl">{file ? file.name : t.uploadExist}</div>
            <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={onFile} />
          </div>
        </div>

        <button className="btn bp bblk" disabled={!hasAudio} onClick={handleSubmit}>
          {t.startAnalysis}
        </button>
      </div>
    </div>
  );
}

/* ════════════ STEP 2: ANALYZING ════════════ */
function AnalyzingStep() {
  const { t } = useLang();
  return (
    <div className="an-screen">
      <Orb size={380} color="#0ea5e9" x="50%" y="50%" opacity={0.12} />
      <h2 className="an-ttl">{t.analyzing}</h2>
      <div className="prog-wrap"><div className="prog-bar"><div className="prog-fill" style={{ width: '100%', transition: 'width 2s' }} /></div></div>
    </div>
  );
}

/* ════════════ STEP 3: RESULTS ════════════ */
function ResultsStep({ result, onReset }) {
  const { t } = useLang();
  const ok = result.prediction_result === 'normal' || result.prediction_result.toLowerCase().includes('normal');
  return (
    <div className="wrap-md page-enter">
      <h2 style={{ fontSize: 23, fontWeight: 800 }}>{t.resultsTitle}</h2>
      <div className={`card res-main ${ok ? 'normal' : 'attn'}`}>
        <div className="res-ttl">{ok ? t.noPatterns : t.patternsFound}</div>
        <div className="res-desc">{result.prediction_result} ({result.confidence_score}%)</div>
      </div>
      <button className="btn bg" style={{marginTop: 20}} onClick={onReset}>{t.analyzeAnother}</button>
    </div>
  );
}

/* ════════════ UPLOAD PAGE ROOT ════════════ */
export default function Upload() {
  const { addAnalysis, addKid } = useApp();
  const [step, setStep]   = useState('form'); 
  const [result, setResult] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  const handleFormSubmit = async (childData) => {
    setStep('analyzing');
    
    // 1. حفظ الطفل إذا كان جديداً
    let savedChild = childData;
    if (!childData.id) {
      savedChild = await addKid(childData);
    }

    // 2. إرسال الملف للسيرفر (FastAPI)
    const serverResponse = await addAnalysis(currentFile, savedChild.id);

    if (serverResponse) {
      setResult({ ...serverResponse, childName: savedChild.name });
      setStep('results');
    } else {
      setStep('form');
    }
  };

  return (
    <>
      {step === 'form'      && <FormStep onSubmit={handleFormSubmit} setGlobalFile={setCurrentFile} />}
      {step === 'analyzing' && <AnalyzingStep />}
      {step === 'results'   && <ResultsStep result={result} onReset={() => setStep('form')} />}
    </>
  );
}