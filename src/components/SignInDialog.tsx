import {useState} from 'react';

import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Layout, LayoutContent, LayoutFooter, Stack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';

type SignInDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Sign in, resolving to an error message or null on success. */
  onSignIn: (email: string, password: string) => Promise<string | null>;
};

/**
 * The form that turns a visitor into an editor.
 *
 * It is deliberately small: the account is created in Supabase by hand, so this
 * only collects the two values and reports what the server said. The submit
 * button reports progress while the request is in flight, and a failed attempt
 * shows the server message instead of a generic one, because the difference
 * between a wrong password and an unconfirmed user matters here.
 *
 * @param props Open state and the sign in action.
 * @returns The dialog.
 */
export function SignInDialog({isOpen, onOpenChange, onSignIn}: SignInDialogProps) {
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
                Расписание видно всем. Вход нужен только чтобы его менять.
              </Text>

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
