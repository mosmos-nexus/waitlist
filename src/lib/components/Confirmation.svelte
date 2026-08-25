<script lang="ts">
  import { onMount } from 'svelte';
  import { createTimeline, stagger, utils } from 'animejs';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Chip from '$lib/components/ui/Chip.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { m } from '$lib/locale.svelte';
  import { getLocale } from '$lib/locale.svelte';
  import { JOB_OPTIONS, AI_TASK_OPTIONS, OTHER_VALUE, optionLabel } from '$lib/data/survey-options';
  import type { AppLocale } from '$lib/i18n';
  import { prefersReduced } from '$lib/anime/motion';

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

  // ---- The arrival ----
  // The island the visitor met on the hero is the same island here, only lit:
  // the halo turns Summon Green, the ring pulses out once, and the three Mon
  // arrive to join Mos. It's the one moment on the page that earns a flourish.
  let sceneEl = $state<HTMLDivElement | null>(null);

  onMount(() => {
    if (!sceneEl) return;

    const rings = sceneEl.querySelectorAll('.ring');
    const mons = sceneEl.querySelectorAll('.mon-join');
    const glow = sceneEl.querySelectorAll('.glow');

    if (prefersReduced()) {
      utils.set(mons, { opacity: 1, scale: 1, translateY: 0 });
      utils.set(glow, { opacity: 1 });
      return;
    }

    utils.set(mons, { opacity: 0, scale: 0.5, translateY: -34 });
    utils.set(rings, { opacity: 0, scale: 0.7 });
    utils.set(glow, { opacity: 0 });

    const tl = createTimeline({ defaults: { ease: 'out(3)' } })
      .add(glow, { opacity: 1, duration: 1200 }, 0)
      .add(rings, { opacity: [0, 0.7, 0], scale: 1.7, duration: 1900, delay: stagger(320) }, 120)
      .add(
        mons,
        {
          opacity: 1,
          scale: 1,
          translateY: 0,
          duration: 900,
          delay: stagger(180),
          ease: 'out(4)',
        },
        620,
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
      <img src="/characters/mos-happy.webp" alt="" width="150" height="150" />
    </div>

    <div class="joiners" aria-hidden="true">
      <span class="mon-join j0">
        <img src="/characters/mon-research.webp" alt="" width="46" height="46" />
      </span>
      <span class="mon-join j1">
        <img src="/characters/mon-organize.webp" alt="" width="42" height="42" />
      </span>
      <span class="mon-join j2">
        <img src="/characters/mon-design.webp" alt="" width="44" height="44" />
      </span>
    </div>
  </div>

  <p class="world-tagline">{m.confirm_world_tagline()}</p>
  <h2 class="t-title-2 prewrap">{m.confirm_title()}</h2>

  <p class="mos-say"><i class="live"></i>{m.confirm_mos_line()}</p>

  {#if emailSent}
    <p class="reward">{m.confirm_email_sent()}</p>
  {/if}
  <p class="care">{m.confirm_care()}</p>
  <p class="next">{m.confirm_next()}</p>

  {#if surveyState === 'done'}
    <p class="done">{m.survey_done()}</p>
  {:else}
    <div class="survey glass">
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
      rgba(33, 237, 179, 0.22),
      rgba(31, 206, 206, 0.12) 52%,
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
    border: 1px solid rgba(33, 237, 179, 0.5);
    opacity: 0;
    pointer-events: none;
  }
  .mos-hold {
    position: relative;
    z-index: 2;
  }

  .joiners {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .mon-join {
    position: absolute;
    display: block;
  }
  /* Placed around Mos rather than in a row — they're arriving, not queueing */
  .j0 {
    left: -2%;
    top: 46%;
  }
  .j1 {
    right: 0%;
    top: 34%;
  }
  .j2 {
    right: 16%;
    bottom: 2%;
  }

  /* ---- Copy ---- */
  .world-tagline {
    align-self: center;
    font-size: var(--font-size-caption-1);
    letter-spacing: 0.04em;
    color: var(--primary-strong);
  }
  h2 {
    color: var(--label-strong);
  }

  .mos-say {
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    padding: 10px 15px;
    border-radius: var(--radius-m) var(--radius-m) var(--radius-m) 6px;
    background: rgba(35, 41, 47, 0.86);
    border: 1px solid var(--line-normal-normal);
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
  .care,
  .next {
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }
  .done {
    padding: var(--space-16);
    border-radius: var(--radius-m);
    border: 1px solid rgba(33, 237, 179, 0.34);
    background: rgba(33, 237, 179, 0.08);
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
  }
  .step {
    align-self: flex-start;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    background: rgba(31, 206, 206, 0.14);
    color: var(--primary-strong);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
  }
  .survey-intro {
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }

  .tasks {
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
  }
</style>
