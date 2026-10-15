import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Popover} from '@astryxdesign/core/Popover';
import {RadioList, RadioListItem} from '@astryxdesign/core/RadioList';
import {Settings} from 'lucide-react';

import {THEME_KEYS, getThemeAccent, getThemeLabel, type ThemeKey} from '../themes';

type ThemePickerProps = {
  /** The active theme. */
  themeKey: ThemeKey;
  /** Choose another theme. */
  onChange: (key: ThemeKey) => void;
};

/** Diameter of a colour swatch shown beside a theme name, in pixels. */
const SWATCH_SIZE = 18;

/**
 * The colour theme picker, opened from a gear beside the light and dark switch.
 *
 * The choices are a radio group rather than a row of buttons, because this is one
 * choice out of five and the group already carries that meaning for a screen
 * reader and for the keyboard. Each option shows a swatch of its own accent next
 * to its name, so the picker answers "what will change" before the name is read.
 *
 * @param props The active theme and the way to change it.
 * @returns The picker.
 */
export function ThemePicker({themeKey, onChange}: ThemePickerProps) {
  return (
    <Popover
      placement="below"
      alignment="end"
      label="Цвет темы"
      hasAutoFocus={false}
      content={
        <RadioList
          label="Цвет темы"
          value={themeKey}
          onChange={(value) => onChange(value as ThemeKey)}
        >
          {THEME_KEYS.map((key) => (
            <RadioListItem
              key={key}
              label={getThemeLabel(key)}
              value={key}
              startContent={
                <svg
                  width={SWATCH_SIZE}
                  height={SWATCH_SIZE}
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="9" cy="9" r="8" fill={getThemeAccent(key)} />
                </svg>
              }
            />
          ))}
        </RadioList>
      }
    >
      <IconButton
        label={`Цвет темы: ${getThemeLabel(themeKey)}`}
        tooltip="Цвет темы"
        variant="ghost"
        icon={<Icon icon={Settings} size="sm" />}
      />
    </Popover>
  );
}
