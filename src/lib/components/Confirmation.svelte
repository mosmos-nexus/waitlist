<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Chip from '$lib/components/ui/Chip.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { getLocale } from '$lib/paraglide/runtime';
  import { JOB_OPTIONS, AI_TASK_OPTIONS, OTHER_VALUE, optionLabel } from '$lib/data/survey-options';
  import type { AppLocale } from '$lib/i18n';

  interface Props {
    pageId: string;
    emailSent: boolean;
  }
  let { pageId, emailSent }: Props = $props();

  const locale = $derived(getLocale() as AppLocale);
  const jobOptions = $derived(
    JOB_OPTIONS.map((o) => ({ value: o.value, label: optionLabel(o, locale) })),
  );

  let job = $state('');
  let aiTasks = $state<string[]>([]);
  let other = $state('');
  let surveyState = $state<'idle' | 'submitting' | 'done'>('idle');

  const showOther = $derived(job === OTHER_VALUE || aiTasks.includes(OTHER_VALUE));

  function toggleTask(value: string) {
    aiTasks = aiTasks.includes(value) ? aiTasks.filter((t) => t !== value) : [...aiTasks, value];
  }

  async function submitSurvey() {
    surveyState = 'submitting';
    try {
      await fetch('/api/waitlist/survey', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: pageId,
          job: job || undefined,
          aiTasks,
          other: showOther ? other : undefined,
        }),
      });
    } catch {
      // The survey is optional — a failure must never spoil the warm ending.
    }
    surveyState = 'done';
  }
</script>

<div class="confirm" aria-live="polite">
  <img class="mascot" src="/characters/mos-happy.webp" alt="" width={140} height={140} />

  <h2>{m.confirm_title()}</h2>
  {#if emailSent}
    <p class="reward">{m.confirm_email_sent()}</p>
  {/if}
  <p class="care">{m.confirm_care()}</p>
  <p class="next">{m.confirm_next()}</p>

  {#if surveyState === 'done'}
    <p class="done">{m.survey_done()}</p>
  {:else}
    <div class="survey">
      <p class="survey-intro">{m.survey_intro()}</p>
      <span class="step">{m.survey_step_label()}</span>

      <Select
        label={m.survey_job_label()}
        options={jobOptions}
        bind:value={job}
        placeholder={m.survey_job_placeholder()}
        name="job"
      />

      <fieldset class="tasks">
        <legend>{m.survey_ai_label()}</legend>
        <p class="hint">{m.survey_ai_hint()}</p>
        <div class="chips">
          {#each AI_TASK_OPTIONS as option (option.value)}
            <Chip
              selected={aiTasks.includes(option.value)}
              onclick={() => toggleTask(option.value)}
            >
              {optionLabel(option, locale)}
            </Chip>
          {/each}
        </div>
      </fieldset>

      {#if showOther}
        <Input
          label={m.survey_other_label()}
          name="other"
          placeholder={m.survey_other_placeholder()}
          bind:value={other}
          maxlength={1000}
        />
      {/if}

      <div class="actions">
        <Button
          type="button"
          size="md"
          loading={surveyState === 'submitting'}
          onclick={submitSurvey}
        >
          {m.survey_submit()}
        </Button>
        <Button type="button" variant="ghost" size="md" onclick={() => (surveyState = 'done')}>
          {m.survey_skip()}
        </Button>
      </div>
    </div>
  {/if}
</div>

<style>
  .confirm {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
    width: 100%;
    max-width: 560px;
  }
  .mascot {
    align-self: center;
  }
  h2 {
    font-size: var(--fs-h2);
    line-height: var(--lh-h2);
    color: var(--text-strong);
  }
  .reward {
    margin: 0;
    font-weight: var(--fw-semibold);
    color: var(--color-primary);
  }
  .care {
    margin: 0;
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  .next {
    margin: 0;
    font-size: var(--fs-caption);
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  .done {
    margin: var(--space-sm) 0 0;
    font-size: var(--fs-subtitle);
    color: var(--text-strong);
  }
  .survey {
    display: flex;
    flex-direction: column;
    gap: var(--space-base);
    width: 100%;
    margin-top: var(--space-base);
    padding: var(--space-lg);
    background: var(--surface-subtle);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
  }
  .survey-intro {
    margin: 0;
    line-height: var(--lh-body);
    color: var(--text-body);
  }
  .step {
    align-self: flex-start;
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    color: var(--color-primary);
    background: rgba(15, 111, 218, 0.1);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
  }
  .tasks {
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    padding: 0;
    font-size: 14px;
    font-weight: var(--fw-medium);
    color: var(--text-strong);
  }
  .hint {
    margin: 4px 0 10px;
    font-size: var(--fs-caption);
    color: var(--text-muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md) var(--space-sm);
  }
  .actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-xs);
  }
  @media (max-width: 480px) {
    .survey {
      padding: var(--space-base);
    }
  }
</style>
