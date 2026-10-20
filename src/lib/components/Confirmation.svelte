<script lang="ts">
  import { onMount } from 'svelte';
  import { track } from '@vercel/analytics';
  import { createTimeline, stagger, utils } from 'animejs';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Chip from '$lib/components/ui/Chip.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { m } from '$lib/locale.svelte';
  import { getLocale } from '$lib/locale.svelte';
  import {
    JOB_OPTIONS,
    AI_TASK_OPTIONS,
    COUNTRY_OPTIONS,
    AI_COUNT_OPTIONS,
    OTHER_VALUE,
    optionLabel,
    countryFromLocale,
    type SurveyOption,
  } from '$lib/data/survey-options';
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
  // Pre-selected from the page language; the visitor can change or clear it.
  let country = $state(countryFromLocale(getLocale()) ?? '');
  let aiCount = $state('');
  let firstTask = $state('');
  // `skipped` hides the form and says nothing more — there is nothing to thank them for.
  let surveyState = $state<'idle' | 'submitting' | 'done' | 'skipped'>('idle');

  // Two distinct "기타" inputs — one per question, matching the DB's 직업 기타 / 작업 기타 columns.
  const showJobOther = $derived(job === OTHER_VALUE);
  const showTaskOther = $derived(aiTasks.includes(OTHER_VALUE));

  function toggleTask(value: string) {
    aiTasks = aiTasks.includes(value) ? aiTasks.filter((t) => t !== value) : [...aiTasks, value];
  }

  async function submitSurvey() {
    surveyState = 'submitting';
    // Which questions got an answer — never the answers themselves.
    track('survey_submit', {
      job: !!job,
      ai_tasks: aiTasks.length,
      country: !!country,
      ai_count: !!aiCount,
      first_task: !!firstTask.trim(),
    });
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
          country: country || undefined,
          aiCount: aiCount || undefined,
          firstTask: firstTask || undefined,
        }),
      });
    } catch {
      // The survey is optional — a failure must never spoil the warm ending.
    }
    surveyState = 'done';
  }

  function skipSurvey() {
    track('survey_skip');
    surveyState = 'skipped';
  }

  // ---- The arrival ----
  // Mos, happy, with a glow that comes up and a ring that pulses out once.
  // It's the one moment on the page that earns a flourish.
  let sceneEl = $state<HTMLDivElement | null>(null);

  onMount(() => {
    if (!sceneEl) return;

    const rings = sceneEl.querySelectorAll('.ring');
    const glow = sceneEl.querySelectorAll('.glow');

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      utils.set(glow, { opacity: 1 });
      return;
    }

    utils.set(rings, { opacity: 0, scale: 0.7 });
    utils.set(glow, { opacity: 0 });

    // A ring is 240px wide (see CSS). On a phone the scene is narrower than a 1.7x ring, which
    // would push the page into horizontal scroll, so the pulse stops at the scene's width.
    const ringScale = Math.min(1.7, sceneEl.clientWidth / 240);
    const tl = createTimeline({ defaults: { ease: 'out(3)' } })
      .add(glow, { opacity: 1, duration: 1200 }, 0)
      .add(
        rings,
        { opacity: [0, 0.7, 0], scale: ringScale, duration: 1900, delay: stagger(320) },
        120,
      );

    return () => tl.revert();
  });
</script>

<div class="confirm" aria-live="polite">
  <div class="scene" bind:this={sceneEl}>
    <span class="glow" aria-hidden="true"></span>
    <span class="ring" aria-hidden="true"></span>
    <span class="ring" aria-hidden="true"></span>

    <div class="mos-hold">
      <img src="/characters/mos-happy.webp" alt="" width="150" height="141" />
    </div>
  </div>

  <p class="world-tagline">{m.confirm_world_tagline()}</p>
  <h2 class="t-title-2 prewrap">{m.confirm_title()}</h2>

  <p class="mos-say"><i class="live"></i>{m.confirm_mos_line()}</p>

  {#if emailSent}
    <p class="reward">{m.confirm_email_sent()}</p>
  {/if}
  <p class="care">{m.confirm_care()}</p>

  {#if surveyState === 'done'}
    <p class="done">{m.survey_done()}</p>
  {:else if surveyState !== 'skipped'}
    <div class="survey">
      <span class="step">{m.survey_step_label()}</span>
      <p class="survey-intro">{m.survey_intro()}</p>

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

      {@render group(
        m.survey_ai_label(),
        AI_TASK_OPTIONS,
        (v) => aiTasks.includes(v),
        toggleTask,
        m.survey_ai_hint(),
      )}

      {#if showTaskOther}
        <Input
          label={m.survey_task_other_label()}
          name="taskOther"
          placeholder={m.survey_task_other_placeholder()}
          bind:value={taskOther}
          maxlength={1000}
        />
      {/if}

      {@render group(
        m.survey_country_label(),
        COUNTRY_OPTIONS,
        (v) => country === v,
        (v) => (country = country === v ? '' : v),
      )}

      {@render group(
        m.survey_ai_count_label(),
        AI_COUNT_OPTIONS,
        (v) => aiCount === v,
        (v) => (aiCount = aiCount === v ? '' : v),
      )}

      <Input
        label={m.survey_first_task_label()}
        name="firstTask"
        placeholder={m.survey_first_task_placeholder()}
        bind:value={firstTask}
        maxlength={1000}
      />

      <div class="actions">
        <Button
          type="button"
          size="md"
          loading={surveyState === 'submitting'}
          onclick={submitSurvey}
        >
          {m.survey_submit()}
        </Button>
        <Button type="button" variant="ghost" size="md" onclick={skipSurvey}>
          {m.survey_skip()}
        </Button>
      </div>
    </div>
  {/if}
</div>

<!-- A labelled group of chips. The hint marks a multi-select; without one it picks a single value. -->
{#snippet group(
  legend: string,
  options: readonly SurveyOption[],
  isOn: (value: string) => boolean,
  pick: (value: string) => void,
  hint?: string,
)}
  <fieldset class="group">
    <legend>{legend}</legend>
    {#if hint}<p class="hint">{hint}</p>{/if}
    <div class="chips">
      {#each options as option (option.value)}
        <Chip selected={isOn(option.value)} onclick={() => pick(option.value)}>
          {optionLabel(option, locale)}
        </Chip>
      {/each}
    </div>
  </fieldset>
{/snippet}

<style>
  .confirm {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-12);
    width: 100%;
    max-width: 580px;
  }

  /* ---- The arrival scene ---- */
  .scene {
    position: relative;
    align-self: center;
    width: 300px;
    height: 220px;
    display: grid;
    place-items: center;
    margin-bottom: var(--space-8);
  }
  .glow {
    position: absolute;
    inset: -14% -8%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(15, 111, 218, 0.16),
      rgba(156, 189, 233, 0.14) 52%,
      transparent
    );
    pointer-events: none;
  }
  .ring {
    position: absolute;
    left: 50%;
    top: 56%;
    translate: -50% -50%;
    width: 240px;
    height: 78px;
    border-radius: 50%;
    border: 1px solid rgba(15, 111, 218, 0.4);
    opacity: 0;
    pointer-events: none;
  }
  .mos-hold {
    position: relative;
    z-index: 2;
  }

  /* ---- Copy ---- */
  .world-tagline {
    align-self: center;
    font-size: var(--font-size-caption-1);
    letter-spacing: 0.04em;
    color: var(--primary-strong);
  }
  /* Japanese phrase breaking keeps "ご利用いただけるようになったら、" whole, so
     shrink-to-fit sized the heading 48px past a 320px screen. Capped, the
     inherited break-word splits that phrase instead. */
  h2 {
    max-width: 100%;
    color: var(--label-strong);
  }

  .mos-say {
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    padding: 10px 15px;
    border-radius: var(--radius-m) var(--radius-m) var(--radius-m) 6px;
    background: var(--background-card);
    border: 1px solid var(--line-normal-normal);
    box-shadow: var(--shadow-e1);
    font-size: var(--font-size-body-2);
    color: var(--label-normal);
  }
  .live {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--primary-normal);
  }

  .reward {
    font-size: var(--font-size-body-2);
    color: var(--primary-normal);
  }
  .care {
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }
  .done {
    padding: var(--space-16);
    border-radius: var(--radius-m);
    border: 1px solid rgba(79, 161, 54, 0.34);
    background: rgba(79, 161, 54, 0.08);
    font-size: var(--font-size-body-2);
    color: var(--label-normal);
  }

  /* ---- Survey ---- */
  .survey {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    width: 100%;
    margin-top: var(--space-12);
    padding: var(--space-24) var(--space-20);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-l);
    background: var(--background-card);
    box-shadow: var(--shadow-e2);
  }
  .step {
    align-self: flex-start;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    background: var(--background-tint);
    color: var(--primary-strong);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
  }
  .survey-intro {
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }

  .group {
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    padding: 0;
    font-size: var(--font-size-label-2);
    font-weight: var(--weight-medium);
    color: var(--label-alternative);
  }
  .hint {
    margin-top: var(--space-4);
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
    margin-top: var(--space-12);
  }
  /* The chip's own height is the 36px control-s; a tap target here needs the 44px floor. */
  .chips :global(.chip) {
    min-height: var(--control-m);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }

  @media (max-width: 480px) {
    .scene {
      width: 100%;
      height: 190px;
    }
    /* Its desktop side overhang is wider than the phone gutter. */
    .glow {
      inset: -14% 0;
    }
  }
</style>
