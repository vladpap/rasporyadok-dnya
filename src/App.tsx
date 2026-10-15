import {AppShell} from '@astryxdesign/core/AppShell';
import {Theme} from '@astryxdesign/core/theme';

import SchedulePage from './pages/schedule/page';
import {getTheme} from './themes';
import {useThemeChoice} from './useThemeChoice';
import {useThemeMode} from './themeMode';

/**
 * Application root: the theme, the shell and the page.
 *
 * Two independent choices meet here. The colour mode says light or dark, and the
 * theme says which accent the palette is built from; either can change without
 * the other. Both live above the shell, because the provider sits here and
 * everything below follows it. The shell handles the viewport, the scroll regions
 * and the mobile navigation; content padding stays at zero because the page sets
 * its own padding.
 *
 * @returns The application.
 */
export function App() {
  const [mode, setMode] = useThemeMode();
  const {themeKey, setThemeKey} = useThemeChoice();

  return (
    <Theme theme={getTheme(themeKey)} mode={mode}>
      <AppShell contentPadding={0}>
        <SchedulePage
          mode={mode}
          onModeChange={setMode}
          themeKey={themeKey}
          onThemeKeyChange={setThemeKey}
        />
      </AppShell>
    </Theme>
  );
}
