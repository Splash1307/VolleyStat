import { useEffect } from 'react';
import { currentSet } from './logic';
import { go, useRoute } from './router';
import { useData } from './store';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Live } from './screens/Live';
import { MatchDetail } from './screens/MatchDetail';
import { NewMatch } from './screens/NewMatch';
import { SetSetup } from './screens/SetSetup';
import { TeamEdit, Teams } from './screens/Teams';

const MatchScreen = ({ id }: { id: string }) => {
  const { matches } = useData();
  const m = matches.find((x) => x.id === id);
  const set = m && currentSet(m);
  const finished = !m || m.status === 'finished';
  useEffect(() => {
    if (finished) go(m ? `detail/${m.id}` : '', true);
  }, [finished, m]);
  if (!m || finished) return null;
  if (m.status === 'live' && set) return <Live match={m} set={set} />;
  return <SetSetup key={m.sets.length} match={m} />;
};

export const App = () => {
  const r = useRoute();
  switch (r.name) {
    case 'teams':
      return <Teams />;
    case 'team':
      return <TeamEdit key={r.id} id={r.id} />;
    case 'newMatch':
      return <NewMatch teamId={r.teamId} />;
    case 'match':
      return <MatchScreen id={r.id} />;
    case 'history':
      return <History />;
    case 'detail':
      return <MatchDetail id={r.id} />;
    default:
      return <Home />;
  }
};
