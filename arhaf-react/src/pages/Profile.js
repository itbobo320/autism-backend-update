// src/pages/Profile.js
import { useState } from 'react';
import { useLang }  from '../context/LangContext';
import { useApp }   from '../context/AppContext';
import { Modal, Field, GenderToggle, Badge } from '../components/UI';

function AddChildModal({ open, onClose }) {
  const { t }       = useLang();
  const { addKid, showToast } = useApp();
  const [name, setName]     = useState('');
  const [age, setAge]       = useState('');
  const [gender, setGender] = useState('M');

  const handleAdd = () => {
    if (!name || !age) { showToast(t.err_fill, 'terr'); return; }
    addKid({ name, age_months: parseInt(age), gender });
    showToast(t.ok_child, 'tok');
    setName(''); setAge(''); setGender('M');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t.addChildTitle}>
      <Field label={t.childName} value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} icon="👶" />
      <Field label={t.ageLbl}    value={age}  onChange={e => setAge(e.target.value)}  placeholder={t.agePh}  icon="📅" type="number" />
      <div className="fgrp">
        <label className="flbl">{t.genderLbl}</label>
        <GenderToggle value={gender} onChange={setGender} />
      </div>
      <button className="btn bp bblk" onClick={handleAdd}>{t.addChild}</button>
    </Modal>
  );
}

export default function Profile() {
  const { t }               = useLang();
  const { user, kids, analyses } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="wrap-md page-enter">
      <div className="prof-grid">
        {/* User card */}
        <div className="card prof-card">
          <div className="prof-av">👤</div>
          <div className="prof-name">{user.name}</div>
          <div className="prof-email">{user.email}</div>
          <div className="prof-stats">
            <div className="stat-box">
              <div className="sv">{analyses.length}</div>
              <div className="sl">{t.analyses}</div>
            </div>
            <div className="stat-box">
              <div className="sv" style={{ color: 'var(--p3)' }}>{kids.length}</div>
              <div className="sl">{t.children}</div>
            </div>
          </div>
        </div>

        <div>
          {/* Children */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-hdr">
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t.myChildren}</h3>
              <button className="btn bo bsm" onClick={() => setModalOpen(true)}>{t.addChild}</button>
            </div>
            {kids.length ? kids.map(c => (
              <div key={c.id} className="child-item">
                <div className="child-av">{c.gender === 'M' ? '👦' : '👧'}</div>
                <div>
                  <div className="child-name">{c.name}</div>
                  <div className="child-meta">{c.age_months} {t.months} • {c.gender === 'M' ? t.male : t.female}</div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.noChildren}</div>
            )}
          </div>

          {/* Recent analyses */}
          <div className="card">
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t.recentAn}</div>
            {analyses.slice(0, 5).map(a => (
              <div key={a.id} className="recent-item">
                <div style={{ flex: 1 }}>
                  <div className="ri-name">{a.childName}</div>
                  <div className="ri-date">{a.date}</div>
                </div>
                <div className="ri-conf">{a.confidence_score}%</div>
                <Badge type={a.prediction_result} />
              </div>
            ))}
            {!analyses.length && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.noAnalysis}</div>}
          </div>
        </div>
      </div>

      <AddChildModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
