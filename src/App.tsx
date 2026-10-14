import {AppShell} from '@astryxdesign/core/AppShell';
import {Theme} from '@astryxdesign/core/theme';

import SchedulePage from './pages/schedule/page';
import {violetTheme} from './theme';
import {useThemeMode} from './themeMode';

/**
 * Application root: the theme, the shell and the page.
 *
 * The colour mode lives here rather than inside the page, because the theme
 * provider sits above the shell and both the page and every component below it
 * follow the same mode. The shell handles the viewport, the scroll regions and
 * the mobile navigation; content padding stays at zero because the page sets its
 * own padding.
 *
 * @returns The application.
 */
export function App() {
  const [mode, setMode] = useThemeMode();

  return (
    <Theme theme={violetTheme} mode={mode}>
      <AppShell contentPadding={0}>
        <SchedulePage mode={mode} onModeChange={setMode} />
      </AppShell>
    </Theme>
  );
}
