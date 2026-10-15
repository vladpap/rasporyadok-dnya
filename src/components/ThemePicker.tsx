import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Popover} from '@astryxdesign/core/Popover';
import {RadioList, RadioListItem} from '@astryxdesign/core/RadioList';
import {Settings} from 'lucide-react';
import {useState} from 'react';

import {THEME_KEYS, getThemeLabel, type ThemeKey} from '../themes';

type ThemePickerProps = {
  /** The active theme. */
  themeKey: ThemeKey;
  /** Choose another theme. */
  onChange: (key: ThemeKey) => void;
};

/**
 * The colour theme picker, opened from a gear beside the light and dark switch.
 *
 * The choices are a radio group rather than a row of buttons, because this is one
 * choice out of five and the group already carries that meaning for a screen
 * reader and for the keyboard. The list is named by the colour of each theme, and
 * picking one closes the popover: the change is visible at once behind it, so
 * leaving it open would only make the person close it themselves.
 *
 * @param props The active theme and the way to change it.
 * @returns The picker.
 */
export function ThemePicker({themeKey, onChange}: ThemePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="below"
      alignment="end"
      label="Цвет темы"
      hasAutoFocus={false}
      content={
        <RadioList
          label="Цвет темы"
          value={themeKey}
          onChange={(value) => {
            onChange(value as ThemeKey);
            setIsOpen(false);
          }}
        >
          {THEME_KEYS.map((key) => (
            <RadioListItem key={key} label={getThemeLabel(key)} value={key} />
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
