'use client';

import { loginSchema, registerSchema, type UserDTO } from '@taskflow/shared';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { FormError, Input } from '@/components/ui/input';
import { api, errorMessage } from '@/lib/api';
import { safeRedirectPath } from '@/lib/format';

type Mode = 'login' | 'register';

const COPY: Record<
  Mode,
  { title: string; submit: string; switchText: string; switchHref: string }
> = {
  login: {
    title: 'Sign in',
    submit: 'Sign in',
    switchText: 'Create an account',
    switchHref: '/register',
  },
  register: {
    title: 'Create account',
    submit: 'Sign up',
    switchText: 'I already have an account',
    switchHref: '/login',
  },
};

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [validationError, setValidationError] = useState<string | null>(null);
  const copy = COPY[mode];

  const mutation = useMutation({
    mutationFn: (values: unknown) =>
      api<{ user: UserDTO }>(`/auth/${mode}`, { method: 'POST', json: values }),
    onSuccess: () => {
      router.replace(safeRedirectPath(next));
      router.refresh();
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = (mode === 'login' ? loginSchema : registerSchema).safeParse(values);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h1 className="text-xl font-semibold">{copy.title}</h1>
      {mode === 'register' && (
        <label className="block space-y-1 text-sm">
          <span>Name</span>
          <Input name="name" autoComplete="name" required />
        </label>
      )}
      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <Input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Password</span>
        <Input
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />
      </label>
      <FormError
        message={validationError ?? (mutation.error ? errorMessage(mutation.error) : null)}
      />
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Please wait…' : copy.submit}
      </Button>
      <p className="text-center text-sm">
        <Link href={copy.switchHref} className="text-indigo-600 hover:underline">
          {copy.switchText}
        </Link>
      </p>
    </form>
  );
}
