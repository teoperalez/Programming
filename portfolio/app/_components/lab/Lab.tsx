import s from './Lab.module.css';
import DamagePanel from './DamagePanel';
import PokerPanel from './PokerPanel';

export default function Lab() {
  return (
    <section className={s.section} id="lab">
      <div className={s.head}>
        <div>
          <p className={s.kicker}>
            <span className={s.num}>03</span>
            the lab
          </p>
          <h2 className={s.title}>
            real algorithms, <em>simplified and made playable.</em>
          </h2>
        </div>
        <p className={s.subnote}>two live demos · code in lib/</p>
      </div>

      <div className={s.grid}>
        <DamagePanel />
        <PokerPanel />
      </div>
    </section>
  );
}
