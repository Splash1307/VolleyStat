import { posteShort } from '../constants';
import type { PlayerStats } from '../logic';
import type { Player } from '../types';

const ORDER = [4, 3, 2, 5, 6, 1];

export const Court = ({
  lineup,
  players,
  serving,
  stats,
  onPlayer,
  selectedPosition,
  emptyLabel = '+',
}: {
  lineup: (string | undefined)[];
  players: Player[];
  serving?: boolean;
  stats?: Map<string, PlayerStats>;
  onPlayer?: (position: number) => void;
  selectedPosition?: number | null;
  emptyLabel?: string;
}) => (
  <div className="court">
    <div className="net">FILET</div>
    <div className="court-grid">
      {ORDER.map((pos) => {
        const id = lineup[pos - 1];
        const p = id ? players.find((x) => x.id === id) : undefined;
        const front = pos >= 2 && pos <= 4;
        const liberoFront = front && p?.poste === 'Libéro';
        const st = p && stats?.get(p.id);
        const isServer = serving && pos === 1;
        return (
          <button
            key={pos}
            type="button"
            className={[
              'court-cell',
              front ? 'front' : 'back',
              isServer ? 'server' : '',
              selectedPosition === pos ? 'selected' : '',
              liberoFront ? 'warn' : '',
              p ? '' : 'empty',
            ].join(' ')}
            onClick={() => onPlayer?.(pos)}
            disabled={!onPlayer}
          >
            <span className="pos-tag">P{pos}</span>
            {isServer && <span className="serve-tag">🏐 SERVICE</span>}
            {p ? (
              <>
                <span className={`jersey ${p.poste === 'Libéro' ? 'libero' : ''}`}>{p.number}</span>
                <span className="pname">{p.name}</span>
                {p.poste && <span className="poste">{posteShort(p.poste)}</span>}
                {st && (
                  <span className="mini-stats">
                    <b className="c-reussite">{st.reussite}</b>
                    <b className="c-erreur">{st.erreur}</b>
                    <b className="c-faute">{st.faute}</b>
                  </span>
                )}
                {liberoFront && <span className="warn-tag">Libéro à l'avant !</span>}
              </>
            ) : (
              <span className="jersey ghost">{emptyLabel}</span>
            )}
          </button>
        );
      })}
    </div>
    <div className="court-legend">
      <span>Avant : P4 · P3 · P2</span>
      <span>Arrière : P5 · P6 · P1</span>
    </div>
  </div>
);
