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
  let jobOther = $state('');
  let taskOther = $state('');
  let surveyState = $state<'idle' | 'submitting' | 'done'>('idle');

  // Two distinct "기타" inputs — one per question, matching the DB's 직업 기타 / 작업 기타 columns.
  const showJobOther = $derived(job === OTHER_VALUE);
  const showTaskOther = $derived(aiTasks.includes(OTHER_VALUE));

  // §7: a 12-piece confetti burst — decorative, finite, removed after ~1.2s.
  const confetti = Array.from({ length: 12 }, (_, i) => i);

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
          jobOther: showJobOther ? jobOther : undefined,
          taskOther: showTaskOther ? taskOther : undefined,
        }),
      });
    } catch {
      // The survey is optional — a failure must never spoil the warm ending.
    }
    surveyState = 'done';
  }
</script>

<div class="confirm" aria-live="polite">
  <div class="celebrate">
    <div class="confetti" aria-hidden="true">
      {#each confetti as i (i)}
        <span class="bit b{i}"></span>
      {/each}
    </div>
    <div class="mascot-hold">
      <div class="halo" aria-hidden="true"></div>
      <img class="mascot" src="/characters/mos-happy.webp" alt="" width={140} height={131} />
    </div>
  </div>

  <p class="world-tagline">{m.confirm_world_tagline()}</p>
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
      <div class="progress" aria-hidden="true">
        <span class="bar"><span class="fill"></span></span>
      </div>
      <p class="survey-intro">{m.survey_intro()}</p>
      <span class="step">{m.survey_step_label()}</span>

      <Select
        label={m.survey_job_label()}
        options={jobOptions}
        bind:value={job}
        placeholder={m.survey_job_placeholder()}
        name="job"
      />

      {#if showJobOther}
        <Input
          label={m.survey_job_other_label()}
          name="jobOther"
          placeholder={m.survey_job_other_placeholder()}
          bind:value={jobOther}
          maxlength={1000}
        />
      {/if}

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

      {#if showTaskOther}
        <Input
          label={m.survey_task_other_label()}
          name="taskOther"
          placeholder={m.survey_task_other_placeholder()}
          bind:value={taskOther}
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

  /* §7 celebration — Mos jumps once, confetti bursts once. */
  .celebrate {
    position: relative;
    align-self: center;
    width: 200px;
    height: 170px;
  }
  .mascot-hold {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
  }
  .mascot {
    position: relative;
    z-index: 2;
    height: auto;
    animation: mos-jump 1s var(--ease-out) 1;
  }
  .halo {
    position: absolute;
    inset: 10% 6%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(15, 111, 218, 0.18), transparent 66%);
    filter: blur(14px);
  }
  @keyframes mos-jump {
    0% {
      transform: translateY(0) scale(1);
    }
    30% {
      transform: translateY(-22px) scale(1.04);
    }
    55% {
      transform: translateY(0) scale(0.98);
    }
    72% {
      transform: translateY(-7px) scale(1.01);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }
  .confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .bit {
    position: absolute;
    top: 40%;
    left: 50%;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    opacity: 0;
    animation: confetti 1.2s var(--ease-out) 0.1s 1;
  }
  .bit:nth-child(odd) {
    border-radius: var(--radius-pill);
  }
  .b0 {
    --tx: -78px;
    --tr: -120px;
    background: var(--blue-core);
  }
  .b1 {
    --tx: -54px;
    --tr: -150px;
    background: var(--purple-pop);
  }
  .b2 {
    --tx: -30px;
    --tr: -132px;
    background: var(--cyan-bright);
  }
  .b3 {
    --tx: -10px;
    --tr: -160px;
    background: var(--blue-light);
  }
  .b4 {
    --tx: 16px;
    --tr: -150px;
    background: var(--purple-pop);
  }
  .b5 {
    --tx: 36px;
    --tr: -134px;
    background: var(--blue-core);
  }
  .b6 {
    --tx: 60px;
    --tr: -156px;
    background: var(--cyan-bright);
  }
  .b7 {
    --tx: 82px;
    --tr: -122px;
    background: var(--blue-light);
  }
  .b8 {
    --tx: -66px;
    --tr: -96px;
    background: var(--cyan-bright);
  }
  .b9 {
    --tx: 70px;
    --tr: -98px;
    background: var(--purple-pop);
  }
  .b10 {
    --tx: -22px;
    --tr: -176px;
    background: var(--blue-core);
  }
  .b11 {
    --tx: 26px;
    --tr: -178px;
    background: var(--blue-light);
  }
  @keyframes confetti {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.6);
    }
    15% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--tx, 0), var(--tr, -140px)) rotate(220deg) scale(1);
    }
  }

  .world-tagline {
    align-self: center;
    margin: 0;
    font-size: var(--fs-body-sm);
    font-weight: var(--fw-semibold);
    letter-spacing: var(--tracking-wide);
    color: var(--color-secondary);
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
  /* 1/2 progress — "30초만 더" effort anchor; fills to half on entry. */
  .progress .bar {
    display: block;
    height: 6px;
    border-radius: var(--radius-pill);
    background: var(--border-subtle);
    overflow: hidden;
  }
  .progress .fill {
    display: block;
    height: 100%;
    width: 50%;
    border-radius: var(--radius-pill);
    background: var(--gradient-brand);
    transform-origin: left center;
    animation: fill-half 0.9s var(--ease-out) 0.2s 1 backwards;
  }
  @keyframes fill-half {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
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

  /* Explicit static final frame for reduced motion (don't rely only on the global
     duration override): Mos at rest, no confetti, progress already filled. */
  @media (prefers-reduced-motion: reduce) {
    .mascot {
      animation: none;
      transform: none;
    }
    .bit {
      display: none;
    }
    .progress .fill {
      animation: none;
      transform: scaleX(1);
    }
  }
</style>
