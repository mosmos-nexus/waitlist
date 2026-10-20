<script lang="ts">
  import { onMount } from 'svelte';
  import { track } from '@vercel/analytics';
  import Input from '$lib/components/ui/Input.svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { m } from '$lib/locale.svelte';
  import { getLocale, localizeHref } from '$lib/locale.svelte';
  import { features } from '$lib/config/features';
  import { captureUtm, getUtm } from '$lib/utm';

  type ErrorKey = 'invalid_email' | 'no_consent' | 'duplicate' | 'ratelimit' | 'generic';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
    /** Which of the page's three forms this is — hero, §4 join, or the final band. */
    position: 'hero' | 'join' | 'final';
  }
  let { onSuccess, position }: Props = $props();

  // The page carries this form three times, so the field's id has to be
  // generated. Two elements sharing `wl-email` made the label ambiguous and
  // left one of them effectively unlabelled.
  const uid = $props.id();
  const fieldId = `wl-email-${uid}`;

  // Mirror of the server pattern; kept local so the client bundle never imports $lib/server.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let email = $state('');
  let consent = $state(false);
  let submitting = $state(false);
  let errorKey = $state<ErrorKey | null>(null);
  let consentInvalid = $state(false);

  // Analytics vocabulary for the same failures. Never carries the email.
  const REASON: Record<ErrorKey, string> = {
    invalid_email: 'invalid',
    no_consent: 'no_consent',
    duplicate: 'duplicate',
    ratelimit: 'rate_limited',
    generic: 'server',
  };

  // The form mounts on page load, which is the visit's first moment to read the URL.
  onMount(captureUtm);

  function fail(key: ErrorKey) {
    errorKey = key;
    track('signup_error', { position, reason: REASON[key] ?? 'server' });
  }

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
    // Every attempt, validation failures included, so each one ends in a success or an error.
    track('signup_submit', { position });

    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      fail('invalid_email');
      return;
    }
    // Form-side consent block — the first of the form+API double block (DoD §1).
    if (!consent) {
      fail('no_consent');
      consentInvalid = true;
      return;
    }

    submitting = true;
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: value, consent, locale: getLocale(), utm: getUtm() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        emailSent?: boolean;
        error?: ErrorKey;
      };
      if (res.ok && data.id) {
        track('signup_success', { position });
        onSuccess({ id: data.id, emailSent: !!data.emailSent });
      } else {
        fail(data.error ?? 'generic');
        if (errorKey === 'no_consent') consentInvalid = true;
      }
    } catch {
      fail('generic');
    } finally {
      submitting = false;
    }
  }
</script>

<form class="form" data-form-position={position} onsubmit={handleSubmit} novalidate>
  <div class="row">
    <div class="email">
      <label class="visually-hidden" for={fieldId}>{m.hero_email_label()}</label>
      <Input
        id={fieldId}
        type="email"
        name="email"
        autocomplete="email"
        inputmode="email"
        spellcheck={false}
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
    {features.welcomeEmail ? m.consent_microcopy_welcome() : m.consent_microcopy()}
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
    max-width: 600px;
  }
  /* Wraps rather than crushing the field. The submit label is a different
     length in every locale — Japanese and English both squeezed the input below
     the width its own placeholder needs, so the prompt was cut off mid-word.
     On one line the field takes all the slack; wrapped, each fills its own. */
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-10);
    align-items: stretch;
  }
  .email {
    /* 280px is the widest placeholder plus its padding at 16px — Japanese
       needs 280. Below that the row wraps and the field takes the full width
       instead. */
    flex: 999 1 280px;
    min-width: 0;
  }
  .row :global(button) {
    flex: 1 0 auto;
  }
  /* Wrapped on a desktop-width column, a full-width button is a slab; it
     keeps its own width there and only spans the row on a phone or tablet. */
  @media (min-width: 900px) {
    .row :global(button) {
      flex-grow: 0;
    }
  }
  .microcopy {
    margin: 0;
    font-size: var(--font-size-caption-2);
    line-height: var(--line-height-label);
    color: var(--label-assistive);
  }
  /* 12px link on the hero's blue glow: Core Blue measured 4.37–4.5:1 there, so
     the link takes the deeper step. */
  .microcopy a {
    color: var(--primary-strong);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .error {
    margin: 0;
    font-size: var(--font-size-body-2);
    color: var(--status-error-fill);
  }
</style>
