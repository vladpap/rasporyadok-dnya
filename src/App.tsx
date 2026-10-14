import {AppShell} from '@astryxdesign/core/AppShell';

import SchedulePage from './pages/schedule/page';

/**
 * Application root: the shell every page is rendered inside.
 *
 * The shell handles the viewport, the scroll regions and the mobile navigation,
 * so pages only describe their own content. Content padding is left at zero
 * because the page sections set their own padding.
 *
 * @returns The application.
 */
export function App() {
  return (
    <AppShell contentPadding={0}>
      <SchedulePage />
    </AppShell>
  );
}
