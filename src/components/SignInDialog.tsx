import {useState} from 'react';

import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {Layout, LayoutContent, LayoutFooter, Stack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';

import {GoogleMark} from './GoogleMark';

type SignInDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Sign in with a password, resolving to an error message or null. */
  onSignIn: (email: string, password: string) => Promise<string | null>;
  /** Sign in through Google, resolving to an error message or null. */
  onSignInWithGoogle: () => Promise<string | null>;
};

/**
 * The form that turns a visitor into an editor.
 *
 * Two ways in, because they suit different people: Google for the usual case,
 * and a password for an account that was created by hand without one. Signing in
 * is only half of the right to edit, since the database also checks that the
 * address is on the editors list, so the text says what signing in does and does
 * not grant.
 *
 * The submit button reports progress while the request is in flight, and a
 * failed attempt shows the server message instead of a generic one, because the
 * difference between a wrong password and an unconfirmed user matters here.
 *
 * @param props Open state and the two sign in actions.
 * @returns The dialog.
 */
export function SignInDialog({
  isOpen,
  onOpenChange,
  onSignIn,
  onSignInWithGoogle,
}: SignInDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    const message = await onSignIn(email, password);

    setIsSubmitting(false);
    if (message) {
      setError(message);
      return;
    }

    // The session is what the dialog was for, so it closes on success.
    setPassword('');
    onOpenChange(false);
  };

  const handleGoogle = async () => {
    setError(null);
    setIsSubmitting(true);

    // On success the browser leaves for Google, so there is nothing to close.
    const message = await onSignInWithGoogle();

    setIsSubmitting(false);
    if (message) {
      setError(message);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="form"
      width={420}
      padding={5}
    >
      <Layout
        header={<DialogHeader title="Вход для правки" onOpenChange={onOpenChange} />}
        content={
          <LayoutContent>
            <Stack direction="vertical" gap={4}>
              <Text type="supporting" color="secondary">
                Расписание видно всем. Вход нужен, чтобы его менять, и менять его
                могут только те, кого добавили в список редакторов.
              </Text>

              <Button
                label="Войти через Google"
                variant="secondary"
                icon={<GoogleMark />}
                isDisabled={isSubmitting}
                onClick={() => void handleGoogle()}
              />

              <Divider label="или по паролю" />

              <TextInput
                label="Электронная почта"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                isRequired
              />
              <TextInput
                label="Пароль"
                type="password"
                value={password}
                onChange={setPassword}
                isRequired
                onEnter={() => void handleSubmit()}
              />

              {error ? (
                <Text type="supporting" color="secondary">
                  {`Не удалось войти: ${error}`}
                </Text>
              ) : null}
            </Stack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <Stack direction="horizontal" gap={2} hAlign="end" wrap="wrap">
              <Button
                label="Отмена"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              />
              <Button
                label={isSubmitting ? 'Входим…' : 'Войти'}
                variant="primary"
                isDisabled={isSubmitting || email === '' || password === ''}
                onClick={() => void handleSubmit()}
              />
            </Stack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
