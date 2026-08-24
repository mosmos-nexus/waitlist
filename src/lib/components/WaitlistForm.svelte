<script lang="ts">
  import Input from '$lib/components/ui/Input.svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { m } from '$lib/locale.svelte';
  import { getLocale, localizeHref } from '$lib/locale.svelte';

  type ErrorKey = 'invalid_email' | 'no_consent' | 'duplicate' | 'ratelimit' | 'generic';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();

  // Mirror of the server pattern; kept local so the client bundle never imports $lib/server.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let email = $state('');
  let consent = $state(false);
  let submitting = $state(false);
  let errorKey = $state<ErrorKey | null>(null);
  let consentInvalid = $state(false);

  const errorMessage = $derived.by(() => {
    switch (errorKey) {
      case 'invalid_email':
        return m.error_invalid_email();
      case 'no_consent':
        return m.error_no_consent();
      case 'duplicate':
        return m.error_duplicate();
      case 'ratelimit':
        return m.error_ratelimit();
      case 'generic':
        return m.error_generic();
      default:
        return '';
    }
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    errorKey = null;
    consentInvalid = false;

    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      errorKey = 'invalid_email';
      return;
    }
    // Form-side consent block — the first of the form+API double block (DoD §1).
    if (!consent) {
      errorKey = 'no_consent';
      consentInvalid = true;
      return;
    }

    submitting = true;
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: value, consent, locale: getLocale() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        emailSent?: boolean;
        error?: ErrorKey;
      };
      if (res.ok && data.id) {
        onSuccess({ id: data.id, emailSent: !!data.emailSent });
      } else {
        errorKey = data.error ?? 'generic';
        if (errorKey === 'no_consent') consentInvalid = true;
      }
    } catch {
      errorKey = 'generic';
    } finally {
      submitting = false;
    }
  }
</script>

<form class="form" onsubmit={handleSubmit} novalidate>
  <div class="row">
    <div class="email">
      <label class="visually-hidden" for="wl-email">{m.hero_email_label()}</label>
      <Input
        id="wl-email"
        type="email"
        name="email"
        autocomplete="email"
        inputmode="email"
        placeholder={m.hero_email_placeholder()}
        bind:value={email}
        status={errorKey === 'invalid_email' ? 'error' : 'default'}
        helper={errorKey === 'invalid_email' ? errorMessage : undefined}
        size="lg"
      />
    </div>
    <Button type="submit" size="lg" loading={submitting}>{m.hero_cta()}</Button>
  </div>

  <Checkbox bind:checked={consent} name="consent" invalid={consentInvalid}>
    {m.consent_label()}
  </Checkbox>

  <p class="microcopy">
    {m.consent_microcopy()}
    <a href={localizeHref('/privacy')}>{m.privacy_link()}</a>
  </p>

  {#if errorMessage && errorKey !== 'invalid_email'}
    <p class="error" role="alert">{errorMessage}</p>
  {/if}
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    width: 100%;
    max-width: 520px;
  }
  /* Wraps rather than crushing the field. The submit label is a different
     length in every locale — Japanese and English both squeezed the input below
     the width its own placeholder needs, so the prompt was cut off mid-word. */
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-10);
    align-items: stretch;
  }
  .email {
    /* 300px is the widest placeholder plus its padding — Japanese needs 296.
       Below that the row wraps and the field takes the full width instead. */
    flex: 1 1 300px;
    min-width: 0;
  }
  .row :global(button) {
    flex: 0 0 auto;
  }
  .microcopy {
    margin: 0;
    font-size: var(--font-size-caption-2);
    line-height: var(--line-height-label);
    color: var(--label-assistive);
  }
  .microcopy a {
    color: var(--primary-bright);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .error {
    margin: 0;
    font-size: var(--font-size-body-2);
    color: var(--status-error-fill);
  }
  @media (max-width: 560px) {
    .row {
      flex-direction: column;
    }
    /* `flex-basis` measures the main axis, so the 300px that keeps the field
       wide enough for its placeholder in a row becomes a 300px minimum *height*
       once the row turns into a column. */
    .email {
      flex: 0 0 auto;
    }
  }
</style>
