import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { WeekNav } from '../components/timesheet/WeekNav';
import { StatusPill } from '../components/ui/StatusPill';
import { KpiStrip } from '../components/timesheet/KpiStrip';
import { Banner } from '../components/timesheet/Banner';
import { WeekGrid } from '../components/timesheet/WeekGrid';
import { ApprovalTrail } from '../components/timesheet/ApprovalTrail';
import { DayTypesCard } from '../components/timesheet/DayTypesCard';
import { EntryDrawer } from '../components/timesheet/EntryDrawer';
import { SubmitDrawer } from '../components/timesheet/SubmitDrawer';
import { useUI } from '../components/ui/UIProvider';
import { useSession } from '../session/SessionContext';
import { useWeek, useTimesheetMutations } from '../hooks/api/useTimesheet';
import { useManager, useSkipManager } from '../hooks/api/useEmployees';
import { useApprovalMutations } from '../hooks/api/useApprovals';
import { ApiError } from '../api/httpClient';
import type { TimeEntryDto } from '../api/types';
import { mondayOf, addDays, toISO } from '../lib/dates';
import controls from '../styles/controls.module.css';

export function MyTimesheetPage() {
  const { employeeCode } = useSession();
  const { openDrawer, closeDrawer, toast } = useUI();
  const [searchParams] = useSearchParams();
  const [weekStart, setWeekStart] = useState(() => {
    const requested = searchParams.get('week');
    return requested ? mondayOf(requested) : mondayOf(toISO(new Date()));
  });
  const thisWeek = mondayOf(toISO(new Date()));

  const { data: week, isLoading, isError } = useWeek(employeeCode, weekStart);
  const { data: manager } = useManager(employeeCode);
  const { data: skipManager } = useSkipManager(employeeCode);
  const mutations = useTimesheetMutations(employeeCode, weekStart);
  const approvalMutations = useApprovalMutations(employeeCode, weekStart);

  const leadName = manager?.fullName ?? '—';
  const l2Name = skipManager?.fullName ?? '—';

  function shiftWeek(direction: -1 | 1) {
    setWeekStart((w) => addDays(w, direction * 7));
  }

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  function handleHourChange(entryId: number, dayIndex: number, value: number) {
    const entry = week?.entries.find((e) => e.id === entryId);
    if (!entry) return;
    const hoursByDay = [...entry.hoursByDay] as typeof entry.hoursByDay;
    hoursByDay[dayIndex] = value;
    mutations.updateEntry.mutate(
      { id: entryId, body: { hoursByDay } },
      { onError: (err) => showError(err, 'Could not update hours') },
    );
  }

  function handleCycleClassification(entry: TimeEntryDto) {
    const order: Array<TimeEntryDto['classification']> = ['Billable', 'NonBillable', 'PartialBillable'];
    const next = order[(order.indexOf(entry.classification) + 1) % order.length];
    mutations.updateEntry.mutate(
      { id: entry.id, body: { classification: next } },
      { onError: (err) => showError(err, 'Could not update billing') },
    );
  }

  function handleCycleDayType(date: string) {
    const dt = week?.dayTypes.find((d) => d.date === date);
    if (!dt) return;
    const dow = new Date(date).getUTCDay();
    if (dow === 0 || dow === 6) {
      toast("Weekly off days are set automatically and can't be changed here", 'bad');
      return;
    }
    const next = dt.dayType === 'WFH' ? 'W' : 'WFH';
    mutations.setDayType.mutate(
      { date, dayType: next },
      {
        onSuccess: () => toast(`Day type set to ${next === 'WFH' ? 'WFH' : 'Working'}`),
        onError: (err) => showError(err, 'Could not change day type'),
      },
    );
  }

  function handleAddLine() {
    if (!week) return;
    openDrawer({
      title: 'Add task line',
      body: (
        <EntryDrawer
          dayTypes={week.dayTypes}
          onCancel={closeDrawer}
          onSave={(data) => {
            mutations.addEntry.mutate(data, {
              onSuccess: () => { closeDrawer(); toast('Task line added', 'ok'); },
              onError: (err) => showError(err, 'Could not add line'),
            });
          }}
        />
      ),
    });
  }

  function handleEditLine(entryId: number) {
    const entry = week?.entries.find((e) => e.id === entryId);
    if (!entry || !week) return;
    openDrawer({
      title: 'Edit task line',
      body: (
        <EntryDrawer
          dayTypes={week.dayTypes}
          existing={entry}
          onCancel={closeDrawer}
          onSave={(data) => {
            mutations.updateEntry.mutate(
              { id: entryId, body: data },
              {
                onSuccess: () => { closeDrawer(); toast('Line updated', 'ok'); },
                onError: (err) => showError(err, 'Could not update line'),
              },
            );
          }}
          onDelete={() => {
            mutations.removeEntry.mutate(entryId, {
              onSuccess: () => { closeDrawer(); toast('Line removed'); },
              onError: (err) => showError(err, 'Could not remove line'),
            });
          }}
        />
      ),
    });
  }

    function handleDuplicateLine(entryId: number) {
    const entry = week?.entries.find((e) => e.id === entryId);
    if (!entry || !week) return;
    openDrawer({
      title: 'Add task line',
      body: (
        <EntryDrawer
          dayTypes={week.dayTypes}
          duplicateFrom={entry}
          onCancel={closeDrawer}
          onSave={(data) => {
            mutations.addEntry.mutate(data, {
              onSuccess: () => { closeDrawer(); toast('Task line added', 'ok'); },
              onError: (err) => showError(err, 'Could not add line'),
            });
          }}
        />
      ),
    });
  }

  function handleSubmit() {
    if (!week) return;
    openDrawer({
      title: 'Submit week for approval',
      body: (
        <SubmitDrawer
          employeeCode={employeeCode}
          weekStart={weekStart}
          entryCount={week.entries.length}
          totalHours={week.totalHours}
          billableHours={week.billableHours}
          partialBillableHours={week.partialBillableHours}
          leadName={leadName}
          l2Name={l2Name}
          onCancel={closeDrawer}
          onConfirm={() => {
            approvalMutations.submit.mutate(undefined, {
              onSuccess: () => { closeDrawer(); toast('Week submitted — Level 1 approval requested', 'ok'); },
              onError: (err) => showError(err, 'Could not submit week'),
            });
          }}
        />
      ),
    });
  }

  function handleRecall() {
    approvalMutations.recall.mutate(undefined, {
      onSuccess: () => toast('Submission recalled — the week is editable again'),
      onError: (err) => showError(err, 'Could not recall submission'),
    });
  }

  const canSubmit = week
  ? week.dayTypes.every((dt) => {
      if (dt.capacityHours === 0) return true; // non-working days aren't required to total anything
      const dayIndex = week.dayTypes.findIndex((d) => d.date === dt.date);
      const dayTotal = week.entries.reduce((sum, e) => sum + e.hoursByDay[dayIndex], 0);
      return dayTotal === dt.capacityHours;
    })
  : false;

  return (
    <>
      <PageHeader crumb="My Work" title="My Timesheet">
        <WeekNav weekStart={weekStart} onShift={shiftWeek} />
        {weekStart !== thisWeek && (
          <button className={`${controls.btn} ${controls.sm}`} onClick={() => setWeekStart(thisWeek)}>This week</button>
        )}
        {week && <StatusPill status={week.week.status} />}
    </PageHeader>

      <div className="page-content">
        {isLoading && <Banner>Loading your timesheet…</Banner>}
        {isError && <Banner kind="reject">Couldn't load this week — check that the backend API is running and reachable.</Banner>}

        {week && (
          <>
            {week.week.status === 'Rejected' && (
              <Banner kind="reject"><b>Returned by {week.week.rejectedByName ?? ''}:</b> {week.week.rejectionReason} — correct the entries and submit again.</Banner>
            )}
            {week.week.status === 'PendingL1' && (
              <Banner>Awaiting Level 1 approval from <b>{leadName}</b>. Recall it if you need to make changes.</Banner>
            )}
            {week.week.status === 'PendingL2' && (
              <Banner>Level 1 approved. Awaiting Level 2 approval from <b>{l2Name}</b>. Entries are read-only from here.</Banner>
            )}
            {week.week.status === 'Approved' && (
              <Banner>Week locked. Approved at both levels. Corrections need an adjustment request.</Banner>
            )}
            {week.dayTypes.some((d) => d.dayType === 'H') && (
              <Banner><b>Holiday this week</b> — one or more days are marked as a holiday.</Banner>
            )}

            <KpiStrip
              totalHours={week.totalHours}
              capacityHours={week.capacityHours}
              billableHours={week.billableHours}
              partialBillableHours={week.partialBillableHours}
              leaveDays={week.dayTypes.filter((d) => d.dayType === 'L').length}
              holidayDays={week.dayTypes.filter((d) => d.dayType === 'H').length}
              wfhDays={week.dayTypes.filter((d) => d.dayType === 'WFH').length}
            />

            <WeekGrid
              employeeCode={employeeCode}
              weekStart={weekStart}
              rows={week.entries}
              dayTypes={week.dayTypes}
              editable={week.week.status === 'Draft' || week.week.status === 'Rejected'}
              status={week.week.status}
              onHourChange={handleHourChange}
              onCycleClassification={handleCycleClassification}
              onCycleDayType={handleCycleDayType}
              onEditLine={handleEditLine}
              onDuplicateLine={handleDuplicateLine}
              onAddLine={handleAddLine}
              onSubmit={handleSubmit}
              canSubmit={canSubmit}
              onRecall={handleRecall}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <ApprovalTrail trail={week.week.trail} leadName={leadName} l2Name={l2Name} />
              <DayTypesCard dayTypes={week.dayTypes} />
            </div>
          </>
        )}
      </div>
    </>
  );
}