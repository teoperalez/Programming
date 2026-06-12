'use client';

import { useState } from 'react';
import s from '../styles.module.css';
import { CONTACT } from '@/lib/projects';

export default function Mail() {
  const [to, setTo] = useState(CONTACT.email);
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('Frontend role — your portfolio looks like a fit');
  const [body, setBody] = useState(
    "Hey Teo —\n\nwe're hiring a frontend engineer and saw your portfolio. would love to chat.\n\nbest,\n",
  );

  const send = () => {
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={s.mailGrid}>
      <div className={s.mailRow}>
        <span className={s.mailLabel}>To</span>
        <input className={s.mailInput} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
      </div>
      <div className={s.mailRow}>
        <span className={s.mailLabel}>From</span>
        <input
          className={s.mailInput}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="you@company.com"
          aria-label="From"
        />
      </div>
      <div className={s.mailRow}>
        <span className={s.mailLabel}>Subject</span>
        <input
          className={s.mailInput}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-label="Subject"
        />
      </div>
      <textarea
        className={s.mailTextarea}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-label="Message body"
      />
      <button type="button" className={s.sendBtn} onClick={send}>
        Send
      </button>
      <p className={s.mailNote}>Send opens your real mail client.</p>
    </div>
  );
}
