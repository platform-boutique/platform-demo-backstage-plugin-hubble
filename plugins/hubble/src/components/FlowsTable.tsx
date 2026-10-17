import { useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { Progress, ResponseErrorPanel, Table, TableColumn } from '@backstage/core-components';
import { Chip, FormControl, Grid, MenuItem, Select, Typography, makeStyles } from '@material-ui/core';
import useAsyncRetry from 'react-use/esm/useAsyncRetry';
import useInterval from 'react-use/esm/useInterval';
import { hubbleApiRef } from '../api';
import { Endpoint, FlowSummary } from '../types';

const useStyles = makeStyles(theme => ({
  chip: { fontWeight: 600, height: 22 },
  forwarded: { background: theme.palette.success?.main ?? '#2e7d32', color: '#fff' },
  dropped: { background: theme.palette.error.main, color: '#fff' },
  other: { background: theme.palette.warning?.main ?? '#ed6c02', color: '#fff' },
  stat: { padding: theme.spacing(1.5, 2), border: `1px solid ${theme.palette.divider}`, borderRadius: 12 },
  statValue: { fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1 },
  statLabel: { fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 },
  mono: { fontFamily: 'monospace', fontSize: '0.8rem' },
}));

const VERDICT_FILTERS: Record<string, string[] | undefined> = {
  all: undefined,
  dropped: ['DROPPED', 'ERROR'],
  forwarded: ['FORWARDED'],
  audit: ['AUDIT'],
};

function who(e: Endpoint) {
  if (e.names?.length) return e.names[0];
  const name = e.workload ?? e.pod ?? e.ip ?? '?';
  return e.namespace ? `${e.namespace}/${name}` : name;
}

export function FlowsTable(props: { namespace?: string; workload?: string; title: string }) {
  const classes = useStyles();
  const hubble = useApi(hubbleApiRef);
  const [filter, setFilter] = useState('all');

  const state = useAsyncRetry(
    () => hubble.getFlows({ namespace: props.namespace, workload: props.workload, verdicts: VERDICT_FILTERS[filter], limit: 150 }),
    [props.namespace, props.workload, filter],
  );
  useInterval(() => state.retry(), 10_000);

  if (state.loading && !state.value) return <Progress />;
  if (state.error) return <ResponseErrorPanel error={state.error} />;

  const { flows = [], counts = {} } = state.value ?? {};
  const chipClass = (v: string) => (v === 'FORWARDED' ? classes.forwarded : v === 'DROPPED' || v === 'ERROR' ? classes.dropped : classes.other);

  const columns: TableColumn<FlowSummary>[] = [
    { title: 'Time', field: 'time', width: '9em', render: f => new Date(f.time).toLocaleTimeString() },
    { title: 'Verdict', field: 'verdict', width: '8em', render: f => <Chip size="small" className={`${classes.chip} ${chipClass(f.verdict)}`} label={f.verdict} /> },
    { title: 'From', render: f => <span className={classes.mono}>{who(f.source)}</span> },
    { title: 'To', render: f => <span className={classes.mono}>{who(f.destination)}</span> },
    { title: 'Port', field: 'l4', width: '8em' },
    { title: 'Detail', render: f => f.dropReason ?? f.l7 ?? '' },
    { title: 'Auth', field: 'authType', width: '7em' },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {['FORWARDED', 'DROPPED', 'ERROR', 'AUDIT'].map(v => (
            <Grid item key={v} xs={6} md={3}>
              <div className={classes.stat}>
                <div className={classes.statValue}>{counts[v] ?? 0}</div>
                <div className={classes.statLabel}>{v.toLowerCase()} (last {flows.length})</div>
              </div>
            </Grid>
          ))}
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Table<FlowSummary>
          title={props.title}
          subtitle="Live from Hubble, refreshed every 10 seconds"
          columns={columns}
          data={flows}
          options={{ paging: true, pageSize: 20, pageSizeOptions: [20, 50, 100], search: true, padding: 'dense' }}
          emptyContent={<Typography style={{ padding: 16 }}>No flows match. Nothing has talked to this workload recently.</Typography>}
          actions={[]}
          components={{
            Toolbar: undefined,
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl size="small">
          <Select value={filter} onChange={e => setFilter(e.target.value as string)}>
            <MenuItem value="all">All verdicts</MenuItem>
            <MenuItem value="dropped">Dropped and errors</MenuItem>
            <MenuItem value="forwarded">Forwarded</MenuItem>
            <MenuItem value="audit">Audit</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}
